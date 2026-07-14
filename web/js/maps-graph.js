// maps-graph.js — WP-F F3: the "/maps" network-graph view.
// ONE map, ONE sidebar, TWO overlays. The existing marker Leaflet map (#map) and its sidebar are left
// completely untouched; toggling just swaps overlays: hide the marker layers, lay a transparent
// Cytoscape canvas over #map, and project node positions from lat/lng via map.latLngToContainerPoint
// on every pan/zoom. The overlay is pointer-events:none so the map still pans/zooms normally; a map
// click hit-tests the nearest node. Reuses the WP-G facet grouping / bubblesets in graph.js.
( function () {
    'use strict';
    var mapsGraphOn = false, mapsPrevOverlay = false, mapsSpiderKey = null;
    var mapsExpandedSeeds = {};             // seed URI -> persid of every poet the user has expanded; kept across a
                                            // Markers<->Graph toggle (which destroys cy) so the expansions can be redrawn
    var mapsPortraits = true;               // poets always render as portrait avatars (matching the Markers view); the dots toggle was removed
    window.mapsPortraits = mapsPortraits;   // graph.js routes the facet colour to the border ring (portraits are always on)

    // thumbnail (Wikidata Commons, cached locally) or a sex silhouette fallback — same source the markers use
    function mapsPortraitURL( v ) {
        if ( v && v.img ) return '/data/map/data/img/thumb/' + v.id + '.jpg';
        return ( v && v.sex === 'm' ) ? '/images/male.png' : '/images/female.png';
    }
    // resting node style for a collection (portrait avatars). The facet colour is applied
    // afterwards by nwMapRegroup, to the border ring.
    function mapsStyleNodes( coll ) {
        if ( !coll || !coll.length ) return;
        var dark = ( typeof theme !== 'undefined' && theme === 'dark' );
        if ( mapsPortraits ) {
            coll.style( { 'width': '34px', 'height': '34px', 'padding': '0px', 'background-fit': 'cover',
                'background-color': dark ? '#333' : '#ccc', 'border-width': '3px', 'border-color': dark ? '#222' : '#fff' } );
            coll.forEach( function ( n ) { n.style( 'background-image', n.data( 'img' ) || '' ); } );   // inline .style() can't parse data() mappers
        } else {
            coll.style( { 'width': '14px', 'height': '14px', 'padding': '0px', 'background-image': 'none',
                'background-color': dark ? '#bbb' : '#666', 'border-width': '1.5px', 'border-color': dark ? '#222' : '#fff' } );
        }
    }
    var MAPS_PANES = '.leaflet-marker-pane, .leaflet-shadow-pane, .leaflet-overlay-pane';   // marker + geodesic-line panes to hide in graph mode

    // the currently-filtered poet set (mirrors map.js showYrRange: year slider + gender + continents)
    function mapsFilteredPersons() {
        if ( typeof persons === 'undefined' || !persons ) return [];
        var male = $( '#male' ).is( ':checked' ), female = $( '#female' ).is( ':checked' );
        var s = 1770, e = 1900;
        try { var vals = $( '#slider-range' ).slider( 'values' ); if ( vals && vals.length === 2 ) { s = +vals[ 0 ]; e = +vals[ 1 ]; } } catch ( err ) {}
        var out = [];
        Object.keys( persons ).forEach( function ( k ) {
            var v = persons[ k ];
            if ( !v || !v.dob || !v.dod || !v.nat ) return;
            if ( +String( v.dob ).substring( 0, 4 ) > e || +String( v.dod ).substring( 0, 4 ) < s ) return;
            if ( !male && v.sex === 'm' ) return;
            if ( !female && v.sex === 'f' ) return;
            var nat = ( typeof nations !== 'undefined' && nations ) ? nations[ String( v.nat ).substring( 0, 2 ) ] : null;
            if ( nat && nat.cont ) { var box = $( '#' + nat.cont ); if ( box.length && !box.is( ':checked' ) ) return; }
            out.push( v );
        } );
        return out;
    }

    // project every node from its lat/lng onto the map's current viewport (cy stays at zoom 1 / 0,0)
    function mapsProjectNodes() {
        if ( typeof cy === 'undefined' || !cy || typeof map === 'undefined' || !map ) return;
        var spider = !!mapsSpiderKey;   // apply spiderfy offsets ONLY while a fan is open (closed -> never a ghost fan)
        cy.batch( function () {
            cy.nodes().forEach( function ( n ) {
                var lat = n.data( 'lat' ), lng = n.data( 'lng' );
                if ( lat == null || lng == null ) return;
                var pt = map.latLngToContainerPoint( [ lat, lng ] );
                n.position( { x: pt.x + ( spider ? ( n.scratch( '_spiderDx' ) || 0 ) : 0 ), y: pt.y + ( spider ? ( n.scratch( '_spiderDy' ) || 0 ) : 0 ) } );
            } );
        } );
        try { cy.zoom( 1 ); cy.pan( { x: 0, y: 0 } ); } catch ( e ) {}   // keep the canvas 1:1 with the map (zoom is locked, reset pan)
    }
    // pixel offsets that pack `count` nodes into neat CONCENTRIC RINGS around a centre (like the marker
    // spiderfier), sized so co-located poets never overlap and small stacks stay tight.
    function mapsSpiderPositions( count ) {
        var sep = mapsPortraits ? 40 : 22;                                  // min centre-to-centre spacing (px)
        if ( count <= 1 ) return [ { x: 0, y: 0 } ];
        var pos = [], placed = 0, ring = 0;
        while ( placed < count ) {
            ring++;
            var radius = ring * sep;
            var cap = Math.max( 1, Math.floor( ( 2 * Math.PI * radius ) / sep ) );   // nodes that fit on this ring
            var n = Math.min( cap, count - placed );
            if ( ring === 1 && n === count ) { radius = count === 2 ? sep * 0.62 : sep / ( 2 * Math.sin( Math.PI / count ) ); }   // pack a small total into one tight ring
            var off = ( ring % 2 === 0 ) ? Math.PI / n : 0;                 // stagger alternate rings
            for ( var i = 0; i < n; i++ ) {
                var a = -Math.PI / 2 + off + ( 2 * Math.PI * i ) / n;
                pos.push( { x: radius * Math.cos( a ), y: radius * Math.sin( a ) } );
            }
            placed += n;
        }
        return pos;
    }
    // fan a stack of co-located poets out into concentric rings around their shared point; ONLY the stack
    // members get an offset (everything else stays exactly put). Collapse via mapsUnspiderfy.
    function mapsSpiderfyStack( node ) {
        if ( typeof cy === 'undefined' || !cy || !node ) return;
        var key = node.data( 'stackKey' ); if ( !key ) return;
        mapsUnspiderfy();                                                    // only one fan open at a time
        var members = cy.nodes().filter( function ( m ) { return m.data( 'stackKey' ) === key; } );
        var N = members.length; if ( N < 2 ) return;
        var pos = mapsSpiderPositions( N );
        members.forEach( function ( m, i ) {
            m.scratch( '_spiderDx', pos[ i ].x ); m.scratch( '_spiderDy', pos[ i ].y );
            m.style( 'z-index', 30 );                                        // fanned poets draw above the rest
        } );
        mapsSpiderKey = key;
        mapsProjectNodes();
    }
    function mapsUnspiderfy() {
        if ( !mapsSpiderKey ) return;
        mapsSpiderKey = null;   // FIRST: mapsProjectNodes' spider-guard now drops EVERY offset, so the fan is
                                // visually collapsed even if the scratch cleanup below throws for any reason
        try {
            if ( typeof cy !== 'undefined' && cy ) {
                cy.nodes().forEach( function ( m ) { m.scratch( '_spiderDx', 0 ); m.scratch( '_spiderDy', 0 ); m.removeStyle( 'z-index' ); } );
            }
        } catch ( e ) {}
        mapsProjectNodes();
    }
    function mapsOnMoveStart( e ) {
        // Collapse the fan on a ZOOM (its offsets are fixed pixels, so they mis-scale at another zoom);
        // a PAN keeps it open (mapsProjectNodes carries the offsets with the point). Bound to both events.
        if ( e && e.type === 'zoomstart' ) mapsUnspiderfy();
        if ( typeof nwClearBubblesets === 'function' ) nwClearBubblesets();
    }
    function mapsOnMoveEnd() { mapsProjectNodes(); if ( typeof nwRedrawMapBubblesets === 'function' ) nwRedrawMapBubblesets(); }

    // build the cy graph in a transparent overlay INSIDE #map. Nodes are CREATED already at their
    // projected geo positions (a preset layout with explicit positions) so there is no placement race
    // with any spring/grid layout. The map must already be at its final view (fit) before this runs.
    function mapsBuildGraph( ppl ) {
        ppl = ppl || mapsFilteredPersons();
        mapsSpiderKey = null;                                    // new graph -> no fan open
        // Keep poets at their TRUE coordinate (no jitter). Co-located poets stack exactly and are
        // separated on demand by an on-click spiderfy; stackKey groups poets sharing a coordinate and
        // stackSize (filled below) flags a stack worth fanning out.
        var counts = {};
        var nodes = ppl.map( function ( v ) {
            var c = ( typeof nwPersonCoord === 'function' ) ? nwPersonCoord( v.id ) : null;
            var key = c ? ( c.lat.toFixed( 4 ) + ',' + c.lng.toFixed( 4 ) ) : null;
            if ( key ) counts[ key ] = ( counts[ key ] || 0 ) + 1;
            return { group: 'nodes', data: {
                id: domain + '/id/' + v.id + '/person', type: 'Person', shape: 'ellipse',
                lat: c ? c.lat : null, lng: c ? c.lng : null, pid: v.id, img: mapsPortraitURL( v ),
                stackKey: key, class: [ 'http://www.cidoc-crm.org/cidoc-crm/E21_Person' ]
            } };
        } );
        nodes.forEach( function ( nd ) { nd.data.stackSize = nd.data.stackKey ? counts[ nd.data.stackKey ] : 1; } );
        $( '#map > #cy-overlay' ).remove();
        $( '#map' ).append(
            '<div id="cy-overlay" style="position:absolute;top:0;left:0;width:100%;height:100%;z-index:450;pointer-events:none;">' +
            '<div id="cy" style="width:100%;height:100%;"><div class="cytoscape-navigator" style="display:none;"></div></div></div>'
        );
        try { if ( typeof cy !== 'undefined' && cy && cy.destroy ) cy.destroy(); } catch ( e ) {}
        if ( typeof nwBB !== 'undefined' ) nwBB = null;   // reset the bubbleset plugin for the new cy
        createCYgraph( nodes, null, { name: 'preset', animate: false, fit: false, positions: function ( n ) {
            var lat = n.data( 'lat' ), lng = n.data( 'lng' );
            if ( lat == null || lng == null || typeof map === 'undefined' || !map ) return { x: 0, y: 0 };
            var pt = map.latLngToContainerPoint( [ lat, lng ] ); return { x: pt.x, y: pt.y };
        } } );
        try { cy.stop(); if ( typeof cyRunningLayout !== 'undefined' && cyRunningLayout ) cyRunningLayout.stop(); } catch ( e ) {}
        // LOCK cy at zoom 1 / pan 0,0 so it stays 1:1 with the map container and NOTHING can auto-fit it
        // (an auto-fit is what shrank the graph to "too small scale" and re-ran on every move).
        try { cy.minZoom( 1 ); cy.maxZoom( 1 ); cy.userZoomingEnabled( false ); cy.userPanningEnabled( false ); cy.boxSelectionEnabled( false ); cy.autoungrabify( true ); cy.zoom( 1 ); cy.pan( { x: 0, y: 0 } ); } catch ( e ) {}
        mapsStyleNodes( cy.nodes() );   // style the poet portrait nodes
        $( '#cy-overlay .cy-panzoom, #cy-overlay .cytoscape-navigator' ).hide();
        if ( typeof nwRefreshFacetMenu === 'function' ) nwRefreshFacetMenu();
    }

    // the overlay is pointer-events:none, so the MAP gets clicks; hit-test the nearest cy node (<=14px)
    function mapsNearestNode( e ) {
        if ( typeof cy === 'undefined' || !cy ) return null;
        var pt = e.containerPoint || map.latLngToContainerPoint( e.latlng ), best = null, bd = 1e9;
        cy.nodes( ':visible' ).forEach( function ( n ) {
            if ( n.hasClass( 'nw-nongeo' ) ) return;
            var p = n.position(), d = Math.sqrt( ( p.x - pt.x ) * ( p.x - pt.x ) + ( p.y - pt.y ) * ( p.y - pt.y ) );
            if ( d < bd ) { bd = d; best = n; }
        } );
        return ( best && bd <= ( mapsPortraits ? 22 : 12 ) ) ? best : null;
    }
    // hover tooltip: show the poet name (there are no on-node labels) + a pointer cursor over a dot
    function mapsTip() {
        var t = document.getElementById( 'maps-graph-tip' );
        if ( !t ) { t = $( '<div id="maps-graph-tip" style="position:fixed;z-index:2050;pointer-events:none;background:rgba(0,0,0,.82);color:#fff;padding:2px 8px;border-radius:3px;font-size:12px;white-space:nowrap;display:none;"></div>' ).appendTo( 'body' )[ 0 ]; }
        return t;
    }
    function mapsHideTip() { var t = document.getElementById( 'maps-graph-tip' ); if ( t ) t.style.display = 'none'; }
    // a node still stacked with others (co-located, not yet fanned out)?
    function mapsIsStacked( n ) { return n && n.data( 'stackSize' ) > 1 && n.data( 'stackKey' ) !== mapsSpiderKey; }
    function mapsMapMove( e ) {
        if ( !mapsGraphOn ) return;
        var n = mapsNearestNode( e ), c = map.getContainer();
        if ( n ) {
            var label;
            if ( mapsIsStacked( n ) ) {
                label = n.data( 'stackSize' ) + ' poets here · click to fan out';   // discoverability hint for a stack
            } else {
                var pm = String( n.id() ).match( /\/id\/(pers\d+)/ ), pid = pm && pm[ 1 ];
                label = ( typeof persons !== 'undefined' && persons && pid && persons[ pid ] ) ? persons[ pid ].name : ( n.data( 'name' ) || pid || '' );
            }
            var t = mapsTip(); t.textContent = label; t.style.display = 'block';
            var oe = e.originalEvent || {}; t.style.left = ( ( oe.clientX || 0 ) + 12 ) + 'px'; t.style.top = ( ( oe.clientY || 0 ) + 12 ) + 'px';
            c.style.cursor = 'pointer';
        } else { mapsHideTip(); c.style.cursor = ''; }
    }
    // single click -> a stacked point fans out (spiderfy) so its poets can be picked; a single poet
    // opens its profile. poet_profile() RETURNS the HTML (and opens the #profile pane); the caller injects it.
    async function mapsMapClick( e ) {
        if ( !mapsGraphOn ) return;
        var n = mapsNearestNode( e );
        if ( !n ) { mapsUnspiderfy(); return; }                     // click empty space -> collapse any open fan
        if ( mapsIsStacked( n ) ) { mapsSpiderfyStack( n ); return; }
        var mp = String( n.id() ).match( /\/id\/(pers\d+)\b/ );
        if ( mp && typeof poet_profile === 'function' ) { try { $( '#profile .results' ).html( await poet_profile( mp[ 1 ] ) ); } catch ( err ) {} }
    }
    // double click -> expand: draw INTRO-context links to the poets this one is connected to
    function mapsMapDblClick( e ) {
        if ( !mapsGraphOn ) return;
        var n = mapsNearestNode( e ); if ( !n ) return;
        if ( mapsIsStacked( n ) ) { mapsSpiderfyStack( n ); return; }   // fan out first; then double-click a single poet to expand it
        var mp = String( n.id() ).match( /\/id\/(pers\d+)\b/ ); if ( mp ) mapsExpandPoet( n, mp[ 1 ] );
    }
    // Layer A — poets sharing >=2 THEME/CONTENT concepts (motifs, topics, symbols, genres, subjects,
    // rhetorical figures... everything that is NOT the ECEP metrical scheme). Weighted by shared count.
    // NB genres/forms in the other vocabularies stay here for now — they can't be pulled into the Form
    // layer cleanly until the cross-vocabulary skos:broader type-hierarchy is completed (data task).
    function mapsConceptQuery( seed ) {
        return 'PREFIX intro: <https://w3id.org/lso/intro/beta202408#>\n' +
            'PREFIX lrmoo: <http://iflastandards.info/ns/lrm/lrmoo/>\nPREFIX dcterms: <http://purl.org/dc/terms/>\nPREFIX skos: <http://www.w3.org/2004/02/skos/core#>\nPREFIX dc: <http://purl.org/dc/elements/1.1/>\n' +
            'SELECT ?other (COUNT(DISTINCT ?concept) AS ?weight) (GROUP_CONCAT(DISTINCT ?conceptLabel; separator=" | ") AS ?concepts) WHERE {\n' +
            '  ?c1 a intro:INT2_ActualizationOfFeature ; intro:R17_actualizesFeature ?concept ; intro:R18i_actualizationFoundOn/intro:R10i_isPassageOf/(lrmoo:R4_embodies|lrmoo:R15i_is_fragment_of)?/dcterms:creator <' + seed + '> .\n' +
            '  ?c2 a intro:INT2_ActualizationOfFeature ; intro:R17_actualizesFeature ?concept ; intro:R18i_actualizationFoundOn/intro:R10i_isPassageOf/(lrmoo:R4_embodies|lrmoo:R15i_is_fragment_of)?/dcterms:creator ?other .\n' +
            '  FILTER( ?other != <' + seed + '> && CONTAINS(STR(?other), "/person") )\n' +
            '  FILTER NOT EXISTS { ?concept skos:inScheme/dc:subject ?fs . FILTER( STR(?fs) = "formal and metrical categories" ) }\n' +
            '  OPTIONAL { ?concept skos:prefLabel ?conceptLabel }\n' +
            '} GROUP BY ?other HAVING( COUNT(DISTINCT ?concept) >= 2 ) ORDER BY DESC(?weight)';
    }
    // Layer B — poets sharing >=2 FORM/metre concepts -> a shared-form link. Classified by TYPE not
    // vocabulary source: the concepts whose scheme is subject "formal and metrical categories" (the ECEP
    // metrical vocabulary: metre, stanza, rhyme, poetic form). This replaces the old "/kos/ECEP/" URL test,
    // which wrongly also swept in ECEP's subject + rhetorical-figure schemes (now correctly in Themes).
    function mapsFormalQuery( seed ) {
        return 'PREFIX intro: <https://w3id.org/lso/intro/beta202408#>\n' +
            'PREFIX lrmoo: <http://iflastandards.info/ns/lrm/lrmoo/>\nPREFIX dcterms: <http://purl.org/dc/terms/>\nPREFIX skos: <http://www.w3.org/2004/02/skos/core#>\nPREFIX dc: <http://purl.org/dc/elements/1.1/>\n' +
            'SELECT ?other (COUNT(DISTINCT ?concept) AS ?weight) (GROUP_CONCAT(DISTINCT ?conceptLabel; separator=" | ") AS ?concepts) WHERE {\n' +
            '  ?c1 a intro:INT2_ActualizationOfFeature ; intro:R17_actualizesFeature ?concept ; intro:R18i_actualizationFoundOn/intro:R10i_isPassageOf/(lrmoo:R4_embodies|lrmoo:R15i_is_fragment_of)?/dcterms:creator <' + seed + '> .\n' +
            '  ?c2 a intro:INT2_ActualizationOfFeature ; intro:R17_actualizesFeature ?concept ; intro:R18i_actualizationFoundOn/intro:R10i_isPassageOf/(lrmoo:R4_embodies|lrmoo:R15i_is_fragment_of)?/dcterms:creator ?other .\n' +
            '  ?concept skos:inScheme/dc:subject ?fs . FILTER( STR(?fs) = "formal and metrical categories" )\n' +
            '  FILTER( ?other != <' + seed + '> && CONTAINS(STR(?other), "/person") )\n' +
            '  OPTIONAL { ?concept skos:prefLabel ?conceptLabel }\n' +
            '} GROUP BY ?other HAVING( COUNT(DISTINCT ?concept) >= 2 ) ORDER BY DESC(?weight)';
    }
    // INT3 interrelations = genuine intertextual allusion (work<->work); sparse + high-value
    function mapsIntertextQuery( seed ) {
        return 'PREFIX intro: <https://w3id.org/lso/intro/beta202408#>\n' +
            'PREFIX lrmoo: <http://iflastandards.info/ns/lrm/lrmoo/>\nPREFIX dcterms: <http://purl.org/dc/terms/>\nPREFIX skos: <http://www.w3.org/2004/02/skos/core#>\n' +
            'SELECT DISTINCT ?other ?typeLabel WHERE {\n' +
            '  ?rel a intro:INT3_Interrelation .\n' +
            '  { ?rel intro:R13_hasReferringEntity/intro:R10i_isPassageOf/(lrmoo:R4_embodies|lrmoo:R15i_is_fragment_of)?/dcterms:creator <' + seed + '> ; intro:R12_hasReferredToEntity/intro:R10i_isPassageOf/(lrmoo:R4_embodies|lrmoo:R15i_is_fragment_of)?/dcterms:creator ?other . }\n' +
            '  UNION\n' +
            '  { ?rel intro:R12_hasReferredToEntity/intro:R10i_isPassageOf/(lrmoo:R4_embodies|lrmoo:R15i_is_fragment_of)?/dcterms:creator <' + seed + '> ; intro:R13_hasReferringEntity/intro:R10i_isPassageOf/(lrmoo:R4_embodies|lrmoo:R15i_is_fragment_of)?/dcterms:creator ?other . }\n' +
            '  FILTER( ?other != <' + seed + '> && CONTAINS(STR(?other), "/person") )\n' +
            '  OPTIONAL { ?rel intro:R19_hasType/skos:prefLabel ?typeLabel }\n}';
    }
    // Layer D — REFERENCES (crm:P67_refers_to): a poet's poem directly refers to another poet — the
    // "reference" contextual annotation (contribute step 3, ctype=='referential') and curated poet-motifs.
    // Directional ("wrote about" / reception); resolves the referent through a death-event hop too. Small
    // but growing + transnational; both ends must be geo-located poets. dir=1: seed refers to ?other;
    // dir=0: ?other refers to the seed.
    function mapsReferenceQuery( seed ) {
        return 'PREFIX intro: <https://w3id.org/lso/intro/beta202408#>\nPREFIX crm: <http://www.cidoc-crm.org/cidoc-crm/>\n' +
            'PREFIX lrmoo: <http://iflastandards.info/ns/lrm/lrmoo/>\nPREFIX dcterms: <http://purl.org/dc/terms/>\nPREFIX skos: <http://www.w3.org/2004/02/skos/core#>\n' +
            'SELECT DISTINCT ?other ?dir ?refName WHERE {\n' +
            '  { ?anno crm:P67_refers_to ?ref . ?ref (crm:P100i_died_in|^crm:P93i_was_taken_out_of_existence_by)? ?other .\n' +
            '    ?other a crm:E21_Person ; skos:prefLabel ?refName .\n' +
            '    ?anno intro:R18i_actualizationFoundOn/intro:R10i_isPassageOf/(lrmoo:R4_embodies|lrmoo:R15i_is_fragment_of)?/dcterms:creator <' + seed + '> . BIND("1" AS ?dir) }\n' +
            '  UNION\n' +
            '  { ?anno crm:P67_refers_to ?ref . ?ref (crm:P100i_died_in|^crm:P93i_was_taken_out_of_existence_by)? <' + seed + '> .\n' +
            '    ?anno intro:R18i_actualizationFoundOn/intro:R10i_isPassageOf/(lrmoo:R4_embodies|lrmoo:R15i_is_fragment_of)?/dcterms:creator ?other . ?other skos:prefLabel ?refName . BIND("0" AS ?dir) }\n' +
            '  FILTER( ?other != <' + seed + '> && CONTAINS(STR(?other), "/person") )\n}';
    }

    // brief centred toast (used to say "no connections found" so a blank double-click isn't confusing)
    function mapsToast( msg ) {
        var t = document.getElementById( 'maps-graph-toast' );
        if ( !t ) { t = $( '<div id="maps-graph-toast" style="position:fixed;top:112px;left:50%;transform:translateX(-50%);z-index:2050;background:rgba(0,0,0,.82);color:#fff;padding:5px 12px;border-radius:4px;font-size:13px;display:none;pointer-events:none;"></div>' ).appendTo( 'body' )[ 0 ]; }
        t.textContent = msg; t.style.display = 'block';
        clearTimeout( t._to ); t._to = setTimeout( function () { t.style.display = 'none'; }, 2400 );
    }
    // show/hide one connection layer (concept | formal | intertext) — the legibility control
    function mapsToggleLayer( type, on ) {
        if ( typeof cy === 'undefined' || !cy ) return;
        cy.edges( '.maps-' + type ).style( 'display', on ? 'element' : 'none' );
    }
    // reapply all three checkbox states to the graph (called after adding edges)
    function mapsApplyLayerToggles() {
        [ 'concept', 'formal', 'intertext', 'reference' ].forEach( function ( t ) {
            var cb = document.querySelector( '.maps-tog[data-layer="' + t + '"]' );
            mapsToggleLayer( t, !cb || cb.checked );
        } );
    }

    // add a connected-poet dot (if not already on the map) + a link edge; style per link type. Returns
    // the number of link edges added.
    function mapsAddLinks( seed, rows, type, dark ) {
        if ( !rows || !rows.length || typeof cy === 'undefined' || !cy ) return 0;
        var toAdd = [], edges = 0;
        rows.forEach( function ( r ) {
            var other = r.other && r.other.value; if ( !other ) return;
            var om = String( other ).match( /\/id\/(pers\d+)\b/ ); if ( !om ) return;
            if ( cy.getElementById( other ).empty() ) {
                var c = ( typeof nwPersonCoord === 'function' ) ? nwPersonCoord( om[ 1 ] ) : null; if ( !c ) return;
                var pm = ( typeof persons !== 'undefined' && persons ) ? persons[ om[ 1 ] ] : null;
                toAdd.push( { group: 'nodes', classes: 'maps-added', data: { id: other, type: 'Person', shape: 'ellipse', lat: c.lat, lng: c.lng,
                    pid: om[ 1 ], img: mapsPortraitURL( pm || { id: om[ 1 ] } ), class: [ 'http://www.cidoc-crm.org/cidoc-crm/E21_Person' ] } } );
            }
            var eid = 'mapsedge-' + type + '-' + opSafe( seed ) + '-' + opSafe( other );
            if ( cy.getElementById( eid ).nonempty() ) return;
            // references are DIRECTIONAL: orient the arrow referring-poet -> referenced-poet (dir=0 means
            // ?other wrote about the seed, so flip). All other layers are symmetric (seed -> other).
            var eSrc = seed, eTgt = other;
            if ( type === 'reference' && r.dir && r.dir.value === '0' ) { eSrc = other; eTgt = seed; }
            toAdd.push( { group: 'edges', classes: 'maps-link maps-' + type, data: { id: eid, source: eSrc, target: eTgt,
                weight: ( r.weight && r.weight.value ) ? +r.weight.value : 1, name: '', maplabel: ( r.concepts && r.concepts.value ) || ( r.typeLabel && r.typeLabel.value ) || ( r.refName && r.refName.value ) || '' } } );
            edges++;
        } );
        if ( !toAdd.length ) return 0;
        var added = cy.add( toAdd );
        mapsStyleNodes( added.nodes() );   // style the poet portrait nodes
        // fan the layers to separate sides so a pair sharing >1 kind of link doesn't overlap:
        // themes bow one way (+), verse form the opposite (-), allusion runs straight down the middle
        if ( type === 'concept' ) {
            added.edges().forEach( function ( ed ) { ed.style( { 'line-color': '#6a89b8', 'width': Math.min( 6, 1.2 + ( ed.data( 'weight' ) || 1 ) ), 'opacity': 0.35, 'curve-style': 'unbundled-bezier', 'control-point-distances': '16', 'control-point-weights': '0.5', 'target-arrow-shape': 'none', 'text-opacity': 0, 'events': 'no' } ); } );
        } else if ( type === 'formal' ) {
            // shared verse-form (ECEP): dense, so kept thin + faint + dotted so it reads as a background layer
            added.edges().forEach( function ( ed ) { ed.style( { 'line-color': '#4a9d5b', 'width': Math.min( 3, 0.8 + ( ed.data( 'weight' ) || 1 ) * 0.4 ), 'opacity': 0.22, 'line-style': 'dotted', 'curve-style': 'unbundled-bezier', 'control-point-distances': '-16', 'control-point-weights': '0.5', 'target-arrow-shape': 'none', 'text-opacity': 0, 'events': 'no' } ); } );
        } else if ( type === 'reference' ) {
            // directional "wrote about" (P67_refers_to): solid purple, bowed wide of the others, with an
            // arrowhead pointing at the referenced poet so the direction of reception reads at a glance
            added.edges().style( { 'line-color': '#8e44ad', 'width': 1.8, 'opacity': 0.72, 'curve-style': 'unbundled-bezier', 'control-point-distances': '30', 'control-point-weights': '0.5', 'target-arrow-shape': 'triangle', 'target-arrow-color': '#8e44ad', 'arrow-scale': 0.9, 'text-opacity': 0, 'events': 'no' } );
        } else {
            added.edges().style( { 'line-color': '#cd6711', 'width': 2.5, 'opacity': 0.85, 'line-style': 'dashed', 'curve-style': 'straight', 'target-arrow-shape': 'none', 'text-opacity': 0, 'events': 'no' } );
        }
        return edges;
    }

    // double-click a poet -> draw its INTRO connections (thematic shared-concept links + intertextual INT3)
    async function mapsExpandPoet( node, persid, restore ) {
        if ( typeof cy === 'undefined' || !cy || typeof opFetch !== 'function' || node.data( 'mapsExpanded' ) ) return;
        node.data( 'mapsExpanded', 1 );
        mapsExpandedSeeds[ node.id() ] = persid;   // remember, so a Markers<->Graph switch can redraw this expansion
        var seed = node.id(), dark = ( typeof theme !== 'undefined' && theme === 'dark' ), added = 0;
        try {
            // fire all three layer queries in parallel, then draw each
            var qConcept = opFetch( mapsConceptQuery( seed ) ),
                qFormal = opFetch( mapsFormalQuery( seed ) ),
                qInter = opFetch( mapsIntertextQuery( seed ) ),
                qRef = opFetch( mapsReferenceQuery( seed ) );
            added += mapsAddLinks( seed, await qConcept, 'concept', dark );
            added += mapsAddLinks( seed, await qFormal, 'formal', dark );
            added += mapsAddLinks( seed, await qInter, 'intertext', dark );
            added += mapsAddLinks( seed, await qRef, 'reference', dark );
            mapsApplyLayerToggles();   // respect any layers the user has switched off
            if ( nwGroupFacet ) await nwMapRegroup( nwGroupFacet );   // colour any newly-added poets (await: it colours the border in portrait mode)
            node.style( { 'border-color': '#cd6711', 'border-width': '3px' } );   // mark expanded, after the regroup so it isn't overwritten
            mapsProjectNodes();
            if ( !added && !restore ) { var pm = ( typeof persons !== 'undefined' && persons ) ? persons[ persid ] : null; mapsToast( 'No recorded connections yet for ' + ( pm ? pm.name : persid ) ); }
        } catch ( e ) { console.log( 'maps expand failed', e ); }
    }

    // re-expand every poet the user had opened before the last Markers<->Graph switch. cy was destroyed and
    // rebuilt, so mapsExpandedSeeds is the memory; skip any seed no longer on the map (e.g. filters changed).
    function mapsRestoreExpansions() {
        if ( typeof cy === 'undefined' || !cy ) return;
        Object.keys( mapsExpandedSeeds ).forEach( function ( seed ) {
            var n = cy.getElementById( seed );
            if ( n && n.nonempty() && !n.data( 'mapsExpanded' ) ) mapsExpandPoet( n, mapsExpandedSeeds[ seed ], true );
        } );
    }

    function mapsSetActive( mode ) {
        var g = ( mode === 'graph' );
        $( '#mvt-markers' ).css( { background: g ? '#e9e9e9' : '#cd6711', color: g ? '#555' : '#fff' } );
        $( '#mvt-graph' ).css( { background: g ? '#cd6711' : '#e9e9e9', color: g ? '#fff' : '#555' } );
    }

    function mapsShowGraph() {
        if ( mapsGraphOn ) return;
        nwMapMode = true; mapsGraphOn = true;                  // set FIRST so run_layout is guarded during build
        // HIDE the marker + line panes (do NOT removeLayer the layers — draw_viz re-runs from continent
        // clicks and filter changes, and its marker._icon monkey-patch throws if the layer isn't on the map)
        $( '#map' ).find( MAPS_PANES ).css( 'display', 'none' );
        // hide the distracting 1844 historical overlay in graph mode -> show the modern theme base
        try { mapsPrevOverlay = ( typeof overlayMap !== 'undefined' && overlayMap && map.hasLayer( overlayMap ) ); } catch ( e ) { mapsPrevOverlay = false; }
        try { if ( mapsPrevOverlay ) { map.removeLayer( overlayMap ); if ( typeof baseMap !== 'undefined' && baseMap ) baseMap.setOpacity( 1 ); $( '.map' ).css( 'background-color', ( typeof theme !== 'undefined' && theme === 'dark' ) ? '#000' : '#fff' ); } } catch ( e ) {}
        var ppl = mapsFilteredPersons();
        // KEEP the current map view (zoom/centre, and thus the leaflet-hash URL) so switching
        // Markers <-> Graph preserves it. Nodes are built at their projected positions in the current
        // viewport — no fitBounds, which used to clobber the view on every switch to Graph.
        mapsBuildGraph( ppl );                                  // nodes created at their geo positions (preset), cy zoom locked at 1
        mapsProjectNodes();                                     // safety re-project at the current view
        if ( nwGroupFacet ) nwMapRegroup( nwGroupFacet );
        mapsRestoreExpansions();                                // redraw any expansions the user had open before switching to Markers
        // NOW bind pan/zoom projection (so subsequent user interaction moves the dots with the map)
        map.on( 'move zoom', mapsProjectNodes );
        map.on( 'movestart zoomstart', mapsOnMoveStart );
        map.on( 'moveend zoomend', mapsOnMoveEnd );
        map.on( 'click', mapsMapClick );
        map.on( 'mousemove', mapsMapMove );                    // hover tooltip (poet name) + pointer cursor
        try { map.doubleClickZoom.disable(); } catch ( e ) {}   // free double-click for node expansion
        map.on( 'dblclick', mapsMapDblClick );
        if ( typeof sidebar !== 'undefined' && sidebar ) { try { sidebar.open( 'graph' ); } catch ( e ) {} }
        mapsSetActive( 'graph' );
    }

    function mapsShowMarkers() {
        if ( mapsGraphOn ) {
            map.off( 'move zoom', mapsProjectNodes );
            map.off( 'movestart zoomstart', mapsOnMoveStart );
            map.off( 'moveend zoomend', mapsOnMoveEnd );
            map.off( 'click', mapsMapClick );
            map.off( 'mousemove', mapsMapMove );
            map.off( 'dblclick', mapsMapDblClick );
            mapsHideTip(); try { map.getContainer().style.cursor = ''; } catch ( e ) {}
            try { map.doubleClickZoom.enable(); } catch ( e ) {}   // restore normal double-click zoom for the marker view
            if ( typeof nwClearBubblesets === 'function' ) nwClearBubblesets();
            try { if ( typeof cy !== 'undefined' && cy && cy.destroy ) cy.destroy(); } catch ( e ) {}
            $( '#map > #cy-overlay' ).remove();
            nwMapMode = false; mapsGraphOn = false;
            $( '#map' ).find( MAPS_PANES ).css( 'display', '' );   // restore the marker/line panes (their layers were never removed, so the #birthdeath state is intact)
            // restore the 1844 overlay if it was on; the beige backdrop + hidden base only applies at low
            // zoom (where the overlay covers) — above zoom 5 keep the modern base, else you get a beige void
            try { if ( mapsPrevOverlay && typeof overlayMap !== 'undefined' && overlayMap ) { map.addLayer( overlayMap ); var lowZoom = map.getZoom() <= 5; if ( typeof baseMap !== 'undefined' && baseMap ) baseMap.setOpacity( lowZoom ? 0 : 1 ); $( '.map' ).css( 'background-color', lowZoom ? '#ede0cb' : ( ( typeof theme !== 'undefined' && theme === 'dark' ) ? '#000' : '#fff' ) ); } } catch ( e ) {}
            if ( typeof sidebar !== 'undefined' && sidebar ) { try { sidebar.open( 'home' ); } catch ( e ) {} }   // back to the filters
        }
        mapsSetActive( 'markers' );
    }

    // re-seed from the CURRENT filters, KEEPING the current map view (used by the Redraw button and by
    // live filter changes). draw_viz (from the marker filter handlers) may have re-added the marker/line
    // layers -> keep them hidden.
    function mapsRedrawGraph() {
        if ( !mapsGraphOn ) return;
        mapsExpandedSeeds = {};                              // an explicit re-seed from the current filters starts a fresh graph
        if ( typeof nwClearBubblesets === 'function' ) nwClearBubblesets();
        $( '#map' ).find( MAPS_PANES ).css( 'display', 'none' );   // draw_viz may have rebuilt markers into the panes -> keep them hidden
        mapsBuildGraph();                                   // uses the current filter set; view unchanged
        mapsProjectNodes();
        if ( nwGroupFacet ) nwMapRegroup( nwGroupFacet );
    }
    window.mapsShowGraph = mapsShowGraph; window.mapsShowMarkers = mapsShowMarkers; window.mapsRedrawGraph = mapsRedrawGraph;
    window.mapsProjectNodes = mapsProjectNodes;   // graph.js reprojects before drawing map-mode hulls

    // segmented "Markers | Graph" toggle (top-right); marker layers control moved to bottom-right
    $( function () {
        if ( !/\/maps\//.test( window.location.href ) ) return;
        var moveLayers = function () { try { if ( typeof layerscontrol !== 'undefined' && layerscontrol ) { layerscontrol.setPosition( 'bottomright' ); return true; } } catch ( e ) {} return false; };
        if ( !moveLayers() ) setTimeout( moveLayers, 1200 );
        if ( $( '#maps-view-toggle' ).length ) return;
        var btn = 'padding:6px 13px;border:none;cursor:pointer;font-size:13px;line-height:1.2;';
        $( '<div id="maps-view-toggle" style="position:fixed;top:66px;right:12px;z-index:1025;display:inline-flex;' +
            'border-radius:5px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,.35);">' +
            '<button id="mvt-markers" type="button" style="' + btn + 'background:#cd6711;color:#fff;"><i class="fas fa-map-marker-alt"></i> Markers</button>' +
            '<button id="mvt-graph" type="button" style="' + btn + 'background:#e9e9e9;color:#555;"><i class="fas fa-circle-nodes"></i> Graph</button>' +
            '</div>' ).appendTo( 'body' );
        $( '#mvt-markers' ).on( 'click', mapsShowMarkers );
        $( '#mvt-graph' ).on( 'click', mapsShowGraph );
        // live filter updates: re-seed the graph when a year/gender/continent filter changes in graph mode
        // (the marker handlers run first + rebuild the hidden markers; then we rebuild the graph)
        $( document ).on( 'change', '#male, #female, .cont', function () { if ( mapsGraphOn ) mapsRedrawGraph(); } );
        try { $( '#slider-range' ).on( 'slidestop', function () { if ( mapsGraphOn ) mapsRedrawGraph(); } ); } catch ( e ) {}
        // connection-layer legend toggles (Themes / Verse form / Intertextual) — show/hide each edge layer
        $( document ).on( 'change', '.maps-tog', function () { mapsToggleLayer( this.getAttribute( 'data-layer' ), this.checked ); } );
    } );
} )();
