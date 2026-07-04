// maps-graph.js — WP-F F3: the "/maps" network-graph view.
// ONE map, ONE sidebar, TWO overlays. The existing marker Leaflet map (#map) and its sidebar are left
// completely untouched; toggling just swaps overlays: hide the marker layers, lay a transparent
// Cytoscape canvas over #map, and project node positions from lat/lng via map.latLngToContainerPoint
// on every pan/zoom. The overlay is pointer-events:none so the map still pans/zooms normally; a map
// click hit-tests the nearest node. Reuses the WP-G facet grouping / bubblesets in graph.js.
( function () {
    'use strict';
    var mapsGraphOn = false, mapsPrevOverlay = false, mapsPortraits = true;
    window.mapsPortraits = mapsPortraits;   // graph.js routes the facet colour to the border ring when portraits are on

    // thumbnail (Wikidata Commons, cached locally) or a sex silhouette fallback — same source the markers use
    function mapsPortraitURL( v ) {
        if ( v && v.img ) return '/data/map/data/img/thumb/' + v.id + '.jpg';
        return ( v && v.sex === 'm' ) ? '/images/male.png' : '/images/female.png';
    }
    // resting node style for a collection, per the portraits toggle. The facet colour is applied
    // afterwards by nwMapRegroup (to the border ring when portraits are on, to the fill when off).
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
    // toggle portraits on/off and re-apply facet colour + expanded markers
    async function mapsSetPortraits( on ) {
        mapsPortraits = !!on; window.mapsPortraits = mapsPortraits;
        if ( typeof cy === 'undefined' || !cy ) return;
        mapsStyleNodes( cy.nodes() );
        if ( typeof nwGroupFacet !== 'undefined' && nwGroupFacet && typeof nwMapRegroup === 'function' ) await nwMapRegroup( nwGroupFacet );   // recolour on the now-correct channel (await: it colours the border in portrait mode)
        cy.nodes( '[?mapsExpanded]' ).style( { 'border-color': '#cd6711', 'border-width': '3px' } );   // re-mark expanded seeds after the regroup
        mapsProjectNodes();
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
        cy.batch( function () {
            cy.nodes().forEach( function ( n ) {
                var lat = n.data( 'lat' ), lng = n.data( 'lng' );
                if ( lat == null || lng == null ) return;
                var pt = map.latLngToContainerPoint( [ lat, lng ] );
                n.position( { x: pt.x, y: pt.y } );
            } );
        } );
        try { cy.zoom( 1 ); cy.pan( { x: 0, y: 0 } ); } catch ( e ) {}   // keep the canvas 1:1 with the map (zoom is locked, reset pan)
    }
    function mapsOnMoveStart() { if ( typeof nwClearBubblesets === 'function' ) nwClearBubblesets(); }
    function mapsOnMoveEnd() { mapsProjectNodes(); if ( typeof nwRedrawMapBubblesets === 'function' ) nwRedrawMapBubblesets(); }

    // build the cy graph in a transparent overlay INSIDE #map. Nodes are CREATED already at their
    // projected geo positions (a preset layout with explicit positions) so there is no placement race
    // with any spring/grid layout. The map must already be at its final view (fit) before this runs.
    function mapsBuildGraph( ppl ) {
        ppl = ppl || mapsFilteredPersons();
        var seen = {};
        var nodes = ppl.map( function ( v ) {
            var c = ( typeof nwPersonCoord === 'function' ) ? nwPersonCoord( v.id ) : null;
            if ( c ) {   // golden-angle jitter for co-located poets (many share a country centroid)
                var k = c.lat.toFixed( 4 ) + ',' + c.lng.toFixed( 4 ), i = seen[ k ] = ( seen[ k ] || 0 ) + 1;
                if ( i > 1 ) { var a = i * 2.399963229; c = { lat: c.lat + 0.02 * i * Math.cos( a ), lng: c.lng + 0.02 * i * Math.sin( a ) }; }
            }
            return { group: 'nodes', data: {
                id: domain + '/id/' + v.id + '/person', type: 'Person', shape: 'ellipse',
                lat: c ? c.lat : null, lng: c ? c.lng : null, pid: v.id, img: mapsPortraitURL( v ),
                class: [ 'http://www.cidoc-crm.org/cidoc-crm/E21_Person' ]
            } };
        } );
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
        mapsStyleNodes( cy.nodes() );   // dots or portraits per the toggle
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
    function mapsMapMove( e ) {
        if ( !mapsGraphOn ) return;
        var n = mapsNearestNode( e ), c = map.getContainer();
        if ( n ) {
            var pm = String( n.id() ).match( /\/id\/(pers\d+)/ ), pid = pm && pm[ 1 ];
            var name = ( typeof persons !== 'undefined' && persons && pid && persons[ pid ] ) ? persons[ pid ].name : ( n.data( 'name' ) || pid || '' );
            var t = mapsTip(); t.textContent = name; t.style.display = 'block';
            var oe = e.originalEvent || {}; t.style.left = ( ( oe.clientX || 0 ) + 12 ) + 'px'; t.style.top = ( ( oe.clientY || 0 ) + 12 ) + 'px';
            c.style.cursor = 'pointer';
        } else { mapsHideTip(); c.style.cursor = ''; }
    }
    // single click -> reuse the marker view's poet profile. poet_profile() RETURNS the HTML (and opens
    // the #profile pane); the caller must inject it, exactly as map.js / index.shtml do.
    async function mapsMapClick( e ) {
        if ( !mapsGraphOn ) return;
        var n = mapsNearestNode( e ); if ( !n ) return;
        var mp = String( n.id() ).match( /\/id\/(pers\d+)\b/ );
        if ( mp && typeof poet_profile === 'function' ) { try { $( '#profile .results' ).html( await poet_profile( mp[ 1 ] ) ); } catch ( err ) {} }
    }
    // double click -> expand: draw INTRO-context links to the poets this one is connected to
    function mapsMapDblClick( e ) {
        if ( !mapsGraphOn ) return;
        var n = mapsNearestNode( e ); if ( !n ) return;
        var mp = String( n.id() ).match( /\/id\/(pers\d+)\b/ ); if ( mp ) mapsExpandPoet( n, mp[ 1 ] );
    }
    // poets sharing >=2 non-formal (INTRO) concepts -> a thematic link, weighted by shared-concept count
    function mapsConceptQuery( seed ) {
        return 'PREFIX intro: <https://w3id.org/lso/intro/beta202408#>\n' +
            'PREFIX lrmoo: <http://iflastandards.info/ns/lrm/lrmoo/>\nPREFIX dcterms: <http://purl.org/dc/terms/>\nPREFIX skos: <http://www.w3.org/2004/02/skos/core#>\n' +
            'SELECT ?other (COUNT(DISTINCT ?concept) AS ?weight) (GROUP_CONCAT(DISTINCT ?conceptLabel; separator=" | ") AS ?concepts) WHERE {\n' +
            '  ?c1 a intro:INT2_ActualizationOfFeature ; intro:R17_actualizesFeature ?concept ; intro:R18i_actualizationFoundOn/intro:R10i_isPassageOf/(lrmoo:R4_embodies|lrmoo:R15i_is_fragment_of)?/dcterms:creator <' + seed + '> .\n' +
            '  ?c2 a intro:INT2_ActualizationOfFeature ; intro:R17_actualizesFeature ?concept ; intro:R18i_actualizationFoundOn/intro:R10i_isPassageOf/(lrmoo:R4_embodies|lrmoo:R15i_is_fragment_of)?/dcterms:creator ?other .\n' +
            '  FILTER( ?other != <' + seed + '> && CONTAINS(STR(?other), "/person") )\n' +
            '  FILTER( !CONTAINS(STR(?concept), "/kos/ECEP/") )\n' +
            '  OPTIONAL { ?concept skos:prefLabel ?conceptLabel }\n' +
            '} GROUP BY ?other HAVING( COUNT(DISTINCT ?concept) >= 2 ) ORDER BY DESC(?weight)';
    }
    // poets sharing >=2 FORMAL/prosodic (ECEP) concepts -> a shared-verse-form link (same query, but
    // keeping ONLY the ECEP vocabulary this time: stanza type, disposition, rhyme, metre)
    function mapsFormalQuery( seed ) {
        return 'PREFIX intro: <https://w3id.org/lso/intro/beta202408#>\n' +
            'PREFIX lrmoo: <http://iflastandards.info/ns/lrm/lrmoo/>\nPREFIX dcterms: <http://purl.org/dc/terms/>\nPREFIX skos: <http://www.w3.org/2004/02/skos/core#>\n' +
            'SELECT ?other (COUNT(DISTINCT ?concept) AS ?weight) (GROUP_CONCAT(DISTINCT ?conceptLabel; separator=" | ") AS ?concepts) WHERE {\n' +
            '  ?c1 a intro:INT2_ActualizationOfFeature ; intro:R17_actualizesFeature ?concept ; intro:R18i_actualizationFoundOn/intro:R10i_isPassageOf/(lrmoo:R4_embodies|lrmoo:R15i_is_fragment_of)?/dcterms:creator <' + seed + '> .\n' +
            '  ?c2 a intro:INT2_ActualizationOfFeature ; intro:R17_actualizesFeature ?concept ; intro:R18i_actualizationFoundOn/intro:R10i_isPassageOf/(lrmoo:R4_embodies|lrmoo:R15i_is_fragment_of)?/dcterms:creator ?other .\n' +
            '  FILTER( ?other != <' + seed + '> && CONTAINS(STR(?other), "/person") )\n' +
            '  FILTER( CONTAINS(STR(?concept), "/kos/ECEP/") )\n' +
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
        [ 'concept', 'formal', 'intertext' ].forEach( function ( t ) {
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
            toAdd.push( { group: 'edges', classes: 'maps-link maps-' + type, data: { id: eid, source: seed, target: other,
                weight: ( r.weight && r.weight.value ) ? +r.weight.value : 1, name: '', maplabel: ( r.concepts && r.concepts.value ) || ( r.typeLabel && r.typeLabel.value ) || '' } } );
            edges++;
        } );
        if ( !toAdd.length ) return 0;
        var added = cy.add( toAdd );
        mapsStyleNodes( added.nodes() );   // dots or portraits per the toggle
        // fan the layers to separate sides so a pair sharing >1 kind of link doesn't overlap:
        // themes bow one way (+), verse form the opposite (-), allusion runs straight down the middle
        if ( type === 'concept' ) {
            added.edges().forEach( function ( ed ) { ed.style( { 'line-color': '#6a89b8', 'width': Math.min( 6, 1.2 + ( ed.data( 'weight' ) || 1 ) ), 'opacity': 0.35, 'curve-style': 'unbundled-bezier', 'control-point-distances': '16', 'control-point-weights': '0.5', 'target-arrow-shape': 'none', 'text-opacity': 0, 'events': 'no' } ); } );
        } else if ( type === 'formal' ) {
            // shared verse-form (ECEP): dense, so kept thin + faint + dotted so it reads as a background layer
            added.edges().forEach( function ( ed ) { ed.style( { 'line-color': '#4a9d5b', 'width': Math.min( 3, 0.8 + ( ed.data( 'weight' ) || 1 ) * 0.4 ), 'opacity': 0.22, 'line-style': 'dotted', 'curve-style': 'unbundled-bezier', 'control-point-distances': '-16', 'control-point-weights': '0.5', 'target-arrow-shape': 'none', 'text-opacity': 0, 'events': 'no' } ); } );
        } else {
            added.edges().style( { 'line-color': '#cd6711', 'width': 2.5, 'opacity': 0.85, 'line-style': 'dashed', 'curve-style': 'straight', 'target-arrow-shape': 'none', 'text-opacity': 0, 'events': 'no' } );
        }
        return edges;
    }

    // double-click a poet -> draw its INTRO connections (thematic shared-concept links + intertextual INT3)
    async function mapsExpandPoet( node, persid ) {
        if ( typeof cy === 'undefined' || !cy || typeof opFetch !== 'function' || node.data( 'mapsExpanded' ) ) return;
        node.data( 'mapsExpanded', 1 );
        var seed = node.id(), dark = ( typeof theme !== 'undefined' && theme === 'dark' ), added = 0;
        try {
            // fire all three layer queries in parallel, then draw each
            var qConcept = opFetch( mapsConceptQuery( seed ) ),
                qFormal = opFetch( mapsFormalQuery( seed ) ),
                qInter = opFetch( mapsIntertextQuery( seed ) );
            added += mapsAddLinks( seed, await qConcept, 'concept', dark );
            added += mapsAddLinks( seed, await qFormal, 'formal', dark );
            added += mapsAddLinks( seed, await qInter, 'intertext', dark );
            mapsApplyLayerToggles();   // respect any layers the user has switched off
            if ( nwGroupFacet ) await nwMapRegroup( nwGroupFacet );   // colour any newly-added poets (await: it colours the border in portrait mode)
            node.style( { 'border-color': '#cd6711', 'border-width': '3px' } );   // mark expanded, after the regroup so it isn't overwritten
            mapsProjectNodes();
            if ( !added ) { var pm = ( typeof persons !== 'undefined' && persons ) ? persons[ persid ] : null; mapsToast( 'No recorded connections yet for ' + ( pm ? pm.name : persid ) ); }
        } catch ( e ) { console.log( 'maps expand failed', e ); }
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
        // fit the map to the poets FIRST, so nodes are then BUILT at their final projected positions
        var bounds = [];
        ppl.forEach( function ( v ) { var c = ( typeof nwPersonCoord === 'function' ) ? nwPersonCoord( v.id ) : null; if ( c ) bounds.push( [ c.lat, c.lng ] ); } );
        if ( bounds.length ) { try { map.fitBounds( bounds, { maxZoom: 5, padding: [ 30, 30 ], animate: false } ); } catch ( e ) {} }
        mapsBuildGraph( ppl );                                  // nodes created at their geo positions (preset), cy zoom locked at 1
        mapsProjectNodes();                                     // safety re-project at the final view
        if ( nwGroupFacet ) nwMapRegroup( nwGroupFacet );
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
            try { if ( mapsPrevOverlay && typeof overlayMap !== 'undefined' && overlayMap ) { map.addLayer( overlayMap ); if ( typeof baseMap !== 'undefined' && baseMap ) baseMap.setOpacity( 0 ); $( '.map' ).css( 'background-color', '#ede0cb' ); } } catch ( e ) {}   // restore the 1844 overlay if it was on
            if ( typeof sidebar !== 'undefined' && sidebar ) { try { sidebar.open( 'home' ); } catch ( e ) {} }   // back to the filters
        }
        mapsSetActive( 'markers' );
    }

    // re-seed from the CURRENT filters, KEEPING the current map view (used by the Redraw button and by
    // live filter changes). draw_viz (from the marker filter handlers) may have re-added the marker/line
    // layers -> keep them hidden.
    function mapsRedrawGraph() {
        if ( !mapsGraphOn ) return;
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
        // portraits on/off (reversible): dots <-> cached poet thumbnails
        $( document ).on( 'change', '#maps-portraits-tog', function () { mapsSetPortraits( this.checked ); } );
    } );
} )();
