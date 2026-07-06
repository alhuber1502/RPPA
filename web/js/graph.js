
// load consolidated ontologies
$.ajax({url: "/data/graphs/onto.json", dataType: 'json', async: false,
    success: function (data) { onto = data; },
    error: function (jqXHR, textStatus, errorThrown) { console.log(jqXHR, textStatus, errorThrown); }
});


// PRISMS graph view

var cy, eh, ur, ontofcr = [], graph_icon = {}, graph_uuid = {}, graph_col = {}, previousState = null, previousGState = null;
var tippy1 = {}, tippy2 = {}
// node colours

graph_col["crm:E53_Place"] = '#90A583';//Cambridge blue
graph_col["lrmoo:F1_Work"] = '#cd6711';//Cordovan
graph_col["crm:E67_Birth"] = '#1E3888';//Marian blue
graph_col["crm:E69_Death"] = '#754043';//Caput mortuum
graph_col["crm:E52_Time-Span"] = '#0081A7';//Cerulean blue
graph_col["crm:E65_Creation"] = '#974B0C';//Russet
graph_col["lrmoo:F2_Expression"] = '#cd6711';//Cordovan
graph_col["lrmoo:F12_Nomen"] = '#800E13';//Cordovan

graph_col["expression1"] = '#cd6711';
graph_col["expression2"] = '#124E78';
graph_col["expression3"] = '#2C6E49';
graph_col["expression4"] = '#82204A';

graph_col["intro"] = '#2a9d8f';
/*
BLUES
#031D44 Oxford Blue
#320A28 Dark purple
#124E78 Indigo
#28536B Charcoal
#151E3F Space cadet
 
GREENS
#4A5859 Outer space
#09814A Sea GREENS
#9DAD6F Olivine
#2C6E49 Dark Spring

PURPLES
#511730 Tyrian purple
#7D2E68 Byzantinum
#251351 Russian violet
#5A3A31 Rose
#574D68 English violet
#7B1E7A Purple
#82204A Murray
#AA1155 Amaranth
#AA4465 Raspberry

REDS
#800E13 Falu red
#640D14 Rosewood
#38040E Black bean
#6E0E0A Blood red
#754043 Garnet

BROWNS
#4C230A Seal brown
#562C2C 
#49393B Van Dyke
*/

// dataType properties
graph_uuid["skos"] = {};
graph_uuid["coll"] = {};
graph_uuid["begin"] = {};
graph_uuid["end"] = {};

// graph component icons
graph_icon["fa-lock"] = "\uf023";
graph_icon["fa-graph"] = "\uf542";
graph_icon["fa-compound"] = "\uf247";
graph_icon["fa-camera"] = "\uf030";
graph_icon["fa-book-open"] = "\uf518";
graph_icon["fa-globe"] = "\uf0ac";
graph_icon["fa-comment"] = "\uf075";
graph_icon["fa-graduation-cap"] = "\uf19d";
graph_icon["fa-microphone"] = "\uf130";
graph_icon["fa-file-archive"] = "\uf1c6";
graph_icon["fa-code"] = "\uf121";
graph_icon["fa-file"] = "\uf15b";
graph_icon["fa-user"] = "\uf007";
graph_icon["fa-location"] = "\uf14e";

// add graph view
async function initializeGraph( id, view ) {
	var graph, data;
	//graph = await getPRISMSobject( (id.startsWith( 'http' )?id:domain+"/id/"+id) );
	if (view == "authors") {
	    graph = await getPerson( id );
	} else if (view == "works") {
		graph = await getWork( id );
	} else {
		graph = [];
	}
    data = await createCYJSON( graph, view );
    if ( $( "#cy" ).length ) {
		cy.add( data );
		run_layout( 'cose' );
    } else {
        $( ".col-graph" ).append( `<div class="graph-about" style="display:none;"></div><div id='cy'><div class="cytoscape-navigator" style="display:none;"></div></div>` );
		createCYgraph( data, graph, cyLayouts[ "cose" ] );
    }
	if ( typeof nwEnsureGraphControls === 'function' ) nwEnsureGraphControls();   // WP-G controls
	// undo/redo extension
	ur = cy.undoRedo();
	if ( typeof nwHookUndo === 'function' ) nwHookUndo();   // WP-G: keep grouping out of undo/redo
	// cxtmenu extension
	cy.cxtmenu({
		menuRadius: function(ele){ return 30; },
		selector: 'node',
		commands: [{
			content: '<span class="fas fa-right-left fa-2x"></span>',
			select: async function( ele ) {
				await addEleNode( ele.id() )
			},
			enabled: true
		}, {
			content: '<span class="fas fa-rotate-left"></span>',
			select: function(ele){
				ur.undo()
			},
			enabled: true
		},{
			content: '<span class="fas fa-rotate-right"></span>',
			select: function(ele){
				ur.redo()
			},
			enabled: true
		},{
			content: '<i class="fa-solid fa-terminal"></i>',
			select: function(ele){
				console.log( ele.id(), ele.data(), ele.position() );
			},
			enabled: true
		}],
		fillColor: (theme == 'dark')?'rgba(100, 100, 100, 0.75)':'rgba(200, 200, 200, 0.75)', // the background colour of the menu
		activeFillColor: 'rgba(198, 120, 54, .75)', //'rgba(1, 105, 217, 0.75)', // the colour used to indicate the selected command
		activePadding: 20, // additional size in pixels for the active command
		indicatorSize: 24, // the size in pixels of the pointer to the active command, will default to the node size if the node size is smaller than the indicator size, 
		separatorWidth: 3, // the empty spacing in pixels between successive commands
		spotlightPadding: 4, // extra spacing in pixels between the element and the spotlight
		adaptativeNodeSpotlightRadius: false, // specify whether the spotlight radius should adapt to the node size
		minSpotlightRadius: 12, // the minimum radius in pixels of the spotlight (ignored for the node if adaptativeNodeSpotlightRadius is enabled but still used for the edge & background)
		maxSpotlightRadius: 24, // the maximum radius in pixels of the spotlight (ignored for the node if adaptativeNodeSpotlightRadius is enabled but still used for the edge & background)
		openMenuEvents: 'cxttapstart taphold', // space-separated cytoscape events that will open the menu; only `cxttapstart` and/or `taphold` work here
		itemColor: (theme == 'dark')?'white':'black', // the colour of text in the command's content
		itemTextShadowColor: 'transparent', // the text shadow colour of the command's content
		zIndex: 9999, // the z-index of the ui div
		atMouse: false, // draw menu at mouse position
		outsideMenuCancel: false // if set to a number, this will cancel the command if the pointer is released outside of the spotlight, padded by the number given 
	});
	cy.cxtmenu({
		menuRadius: function(ele){ return 50; },
		selector: 'core',
		commands: [{
			content: '<span class="fas fa-rotate-left"></span>',
			select: function(ele){
				ur.undo()
			},
			enabled: true
		},{
			content: '<span class="fas fa-rotate-right"></span>',
			select: function(ele){
				ur.redo()
			},
			enabled: true
		},{
			content: '<i class="fa-solid fa-terminal"></i>',
			select: function(ele){
			},
			enabled: false
		}],
		fillColor: (theme == 'dark')?'rgba(100, 100, 100, 0.75)':'rgba(200, 200, 200, 0.75)', // the background colour of the menu
		activeFillColor: 'rgba(198, 120, 54, .75)', //'rgba(1, 105, 217, 0.75)', // the colour used to indicate the selected command
		activePadding: 20, // additional size in pixels for the active command
		indicatorSize: 24, // the size in pixels of the pointer to the active command, will default to the node size if the node size is smaller than the indicator size, 
		separatorWidth: 3, // the empty spacing in pixels between successive commands
		spotlightPadding: 4, // extra spacing in pixels between the element and the spotlight
		adaptativeNodeSpotlightRadius: false, // specify whether the spotlight radius should adapt to the node size
		minSpotlightRadius: 12, // the minimum radius in pixels of the spotlight (ignored for the node if adaptativeNodeSpotlightRadius is enabled but still used for the edge & background)
		maxSpotlightRadius: 24, // the maximum radius in pixels of the spotlight (ignored for the node if adaptativeNodeSpotlightRadius is enabled but still used for the edge & background)
		openMenuEvents: 'cxttapstart taphold', // space-separated cytoscape events that will open the menu; only `cxttapstart` and/or `taphold` work here
		itemColor: (theme == 'dark')?'white':'black', // the colour of text in the command's content
		itemTextShadowColor: 'transparent', // the text shadow colour of the command's content
		zIndex: 9999, // the z-index of the ui div
		atMouse: false, // draw menu at mouse position
		outsideMenuCancel: false // if set to a number, this will cancel the command if the pointer is released outside of the spotlight, padded by the number given 
	});
	document.addEventListener("keydown", function (e) {
		if(e.key === 'Delete') {
			var selecteds = cy.$(":selected");
			if (selecteds.length > 0)
				ur.do("remove", selecteds);
		}
		else if (e.ctrlKey && (e.target.nodeName === 'BODY' || e.target.nodeName === 'DIV')) {
			if (e.key === 'z')
				ur.undo();
			else if (e.key === 'y')
				ur.redo();
		}
	});
	// WP-G: apply the active grouping / ungrouped aggregation to the freshly-built graph, so a large
	// author/work graph self-tidies on load — not only after an expand. (nwAutoAggregateByType stops
	// the initial cose above before its own layout, so no race.)
	if ( typeof nwAfterExpand === 'function' ) await nwAfterExpand();
}

async function addEleNode( ele ) {
	if ( String( ele ).indexOf( 'nwagg-' ) === 0 ) { nwExpandAggregate( cy.getElementById( ele ) ); return; }   // count-node -> expand, not a store lookup
	var nwWasEmpty = ( typeof cy !== 'undefined' && cy ) ? cy.nodes().length === 0 : true;   // fresh seed vs expansion
	if ( !ele.startsWith( 'http' ) ) {
		ele = context['@context'][ ele.split( ':' )[0] ]+ele.split( ':' )[1];
	}
	ele = decodeURIComponent(JSON.parse('"'+ele+'"')); // escape
	var q = namespaces+`SELECT DISTINCT ?s ?p ?o ?g WHERE {
		{
			<`+ele+`> ?p2 ?o2 .
			?o2 ?p ?o .
			BIND( ?o2 AS ?s )
			BIND( <default> AS ?g)
		} UNION {
			?s2 ?p2 <`+ele+`> .
			?s2 ?p ?o .
			BIND( ?s2 AS ?s )
			BIND( <default> AS ?g)
		} UNION {
			<`+ele+`> ?p ?o .
			BIND( <`+ele+`> AS ?s )
			BIND( <default> AS ?g)
		}
	}`;
	var graph = await getJSONLD( q, "raw" );
	var nodes = _l.uniq( _l.map(graph, 's.value') );
	var added = [];
	for ( var i=0 ; i < graph.length ; i++ ) {
		if ( graph[i].o.type == 'uri' 
			&& graph[i].o.value.startsWith( domain ) 
			&& (!nodes.includes( graph[i].o.value ))
			&& !nsv(graph[i].p["value"]).startsWith( "crm:P138i" )
			&& !nsv(graph[i].p["value"]).startsWith( "pdc:" ) 
			&& !nsv(graph[i].p["value"]).startsWith( "pdt:" ) 
			&& !nsv(graph[i].p["value"]).startsWith( "pdp:" )

		) { continue; }
		added.push( graph[i] );
	}
	var data = await createCYJSON( added );
	added = ur.do( "add", data );
	$( "#tabHome" ).html( updateGraphInfo() );
	tippyNodes( added.nodes(), graph );

	clean_graph();

	// toggle classes
	if ( /\/networks\//.test(window.location.href) ) {
		const bsCollapse = new bootstrap.Collapse('#collapseOne', {
			toggle: false
		})
		bsCollapse.show();
	}

	// layout — when a facet grouping OR ungrouped aggregation is active, nwAfterExpand OWNS the
	// layout, so DON'T also run cose here (it would fight the async grouping and blend cose+cise).
	// Exception: cise (facet path) needs an initial spread on the FIRST seed (a spring embedder can't
	// separate a fully degenerate 0,0 start), so run cose once THEN — but only for the facet path,
	// not the ungrouped-aggregate path (cose handles a degenerate start fine on its own).
	var nwPanel = ( typeof nwHasPanel !== 'function' || nwHasPanel() );
	var nwOwnsLayout = ( typeof nwGroupFacet !== 'undefined' && ( nwGroupFacet || nwAggregate || nwMapMode ) && nwPanel );
	if ( !nwOwnsLayout ) run_layout( 'cose', ele );
	else if ( nwWasEmpty && nwGroupFacet && !nwMapMode ) run_layout( 'cose' );   // never spring-embed under the Leaflet basemap
	// WP-G: re-apply INT1 contraction / facet grouping to the newly-expanded nodes. On an
	// EXPANSION keep the viewport focused on the node just expanded (nwRecentre reads + clears
	// this); on a FRESH SEED leave it null so nwRecentre fits the whole graph instead.
	nwFocusEle = nwWasEmpty ? null : ele;
	if ( typeof nwAfterExpand === 'function' ) await nwAfterExpand();
}

function clean_graph() {
	// hide visible nodes without edges
	const visibleNodes = cy.nodes().filter(":visible").nodes();
	const disconnectedNodes = visibleNodes.filter(n => {
		return n.neighborhood(":visible").length === 0;
	}).nodes();
	disconnectedNodes.addClass("hidden");
	// show hidden nodes with edges
	const invisibleNodes = cy.nodes().filter(":hidden").nodes();
	const connectedNodes = invisibleNodes.filter(n => {
		return n.neighborhood(":visible").length > 0;
	}).nodes();
	connectedNodes.removeClass("hidden").addClass("shown");
}

// ───────────────────────────────────────────────────────────────────────────
// WP-G (G1): /networks graph — additive, reversible INT1 contraction + facet
// grouping (language). Grouping uses BUBBLESETS (soft, multi-membership, a
// NON-interactive overlay so it never blocks node right-click/expand) + a manual
// radial re-position so the clusters visibly separate. No compound nodes, no extra
// layout lib. Operates on the rendered `cy`; does NOT touch the legacy filters.
// Defaults: ON, so clustering shows from the first seed and as the graph grows.
// ───────────────────────────────────────────────────────────────────────────
var nwCollapseInt1 = true, nwGroupFacet = 'language', NW_COL = {}, nwBB = null, nwBBPaths = [], nwMapHullRAF = 0;
var nwAggregate = true, nwAggExpanded = {};   // collapse large facet groups into count-nodes; set of groups the user re-expanded
var nwColourFacet = null;   // which facet NW_COL currently holds colours for (reset palette on facet switch)
var NW_MAX_FIT_ZOOM = 1.2;   // cap auto-fit zoom so a small graph doesn't fill the screen with huge magnified nodes
var cyRunningLayout = null;   // handle to the last base layout (cose/klay) so grouping can stop it before re-laying-out
var nwCiseLayout = null;      // handle to the last cise layout so a re-run can stop it first (else it never completes)
var nwFocusEle = null;        // id of the node just expanded; grouping centres on it (then clears) instead of fitting all
// map mode (geo-graph on a Leaflet basemap, /maps graph view): Leaflet owns the viewport, nodes are
// placed by lat/lng, facet grouping shows as node FILL colour + bubbleset hulls (cise/cose bypassed).
var nwMapMode = false, nwLeaf = null, nwGeoLoaded = false, nwGeoColoured = null, nwMapGroups = null;
// _adaptive: coarsen the hull grid per group by member count (fine grid for small localized groups so
// they still look good; coarse only for big scattered ones like Gender/Europe, where a fine grid over a
// globe-spanning hull is what crashed). virtualEdges stays TRUE (the reliable, connected hull shape);
// redraw is gated to pan/zoom SETTLE (see maps-graph.js).
var NW_MAP_BB_OPTS = { _adaptive: true, throttle: 250, maxRoutingIterations: 40, maxMarchingIterations: 20 };

// the WP-G graph panel + faceting run on the three cy-graph views: /networks (full), plus the
// poet-centric /authors and poem-centric /works split-pane graphs (same cy engine).
function nwGraphView() {
    var h = ( typeof window !== 'undefined' && window.location ) ? window.location.href : '';
    if ( /\/networks\//.test( h ) ) return 'networks';
    if ( /\/authors\//.test( h ) ) return 'authors';
    if ( /\/works\//.test( h ) ) return 'works';
    if ( /\/maps\//.test( h ) ) return 'maps';
    return '';
}
function nwHasPanel() { return nwGraphView() !== ''; }

function nwIsClass( node, frag ) {
    var c = node.data( 'class' ); if ( !c ) return false;
    if ( !Array.isArray( c ) ) c = [ c ];
    return c.some( function( t ) { return String( t ).indexOf( frag ) >= 0; } );
}
function nwRelations() {
    return cy.nodes().filter( function( n ) { return nwNodeType( n ) === 'context'; } );
}
// the rdf:type local-name -> coarse type + human label, in priority order (a node carries several
// types; the first match wins). EXACT local-name match (read the class, no substring guessing).
var NW_TYPES = [
    [ { INT2_ActualizationOfFeature: 1, INT3_Interrelation: 1, Intertextuality: 1, INT_Interpretation: 1 }, 'context', 'Context' ],
    [ { INT11_TypeOfInterrelation: 1 }, 'reltype', 'Relation type' ],
    [ { INT1_Passage: 1 }, 'passage', 'Passage' ],
    [ { E21_Person: 1, Person: 1, F10_Person: 1, E74_Group: 1, Agent: 1 }, 'person', 'Person' ],
    [ { F1_Work: 1, PoeticWork: 1, F2_Expression: 1, Redaction: 1, SelfContainedExpression: 1, F3_Manifestation: 1, E33_Linguistic_Object: 1, ExpressionFragment: 1, Excerpt: 1 }, 'work', 'Work' ],
    [ { Concept: 1, F12_Nomen: 1 }, 'concept', 'Concept' ],
    [ { ConceptScheme: 1 }, 'scheme', 'Concept scheme' ],
    [ { E56_Language: 1 }, 'language', 'Language' ],
    [ { E65_Creation: 1, F27_Work_Creation: 1, F28_Expression_Creation: 1, WorkConception: 1, ExpressionCreation: 1 }, 'creation', 'Creation' ],
    [ { E12_Production: 1, CarrierProduction: 1 }, 'production', 'Production' ],
    [ { E67_Birth: 1, Birth: 1 }, 'birth', 'Birth' ],
    [ { E69_Death: 1, Death: 1 }, 'death', 'Death' ],
    [ { 'E52_Time-Span': 1, TimeSpan: 1 }, 'timespan', 'Time-span' ],
    [ { E53_Place: 1, Place: 1 }, 'place', 'Place' ],
    [ { AgentRole: 1 }, 'agentrole', 'Agent role' ],
    [ { D1_Digital_Object: 1, D9_Data_Object: 1, D2_Digitization_Process: 1, D7_Digital_Machine_Event: 1, D14_Software: 1, Application: 1 }, 'digital', 'Digital object' ],
    [ { BibliographicSource: 1 }, 'source', 'Source' ],
    [ { E90_Symbolic_Object: 1 }, 'content', 'Content' ]
];
var NW_TYPE_LABEL = {}; NW_TYPES.forEach( function( t ) { NW_TYPE_LABEL[ t[ 1 ] ] = t[ 2 ]; } );
// When a facet grouping can't cluster a node (no language/decade/etc.), these node types stay as
// INDIVIDUAL nodes in the cise "other" cluster because the user browses them; every OTHER type
// (relation/event/reification plumbing — INT11 relation-types, contexts, passages, CIDOC events…)
// collapses into a count-node when its fan-out exceeds NW_AGG_THRESHOLD, so a concept like
// "translation" with 358 INT11_TypeOfInterrelation reifications shows one "358 · Relation type"
// node instead of an un-aggregated blob.
var NW_KEEP_INDIVIDUAL = { person: 1, work: 1, concept: 1, place: 1, language: 1, scheme: 1 };
// the rdf:type local names (after the last # or /) of a node's class array
function nwLocalNames( n ) {
    var c = n.data( 'class' ); if ( !c ) return [];
    if ( !Array.isArray( c ) ) c = [ c ];
    return c.map( function( t ) { var s = String( t ), h = s.lastIndexOf( '#' ); if ( h < 0 ) h = s.lastIndexOf( '/' ); return h >= 0 ? s.substring( h + 1 ) : s; } );
}
// classify a node by its ACTUAL rdf:type (used by facets + the aggregation buckets). 'other' is a
// genuine last resort — only for nodes with no recognised class.
function nwNodeType( n ) {
    var names = nwLocalNames( n ), set = {};
    names.forEach( function( x ) { set[ x ] = 1; } );
    for ( var i = 0; i < NW_TYPES.length; i++ ) {
        for ( var k in NW_TYPES[ i ][ 0 ] ) { if ( set[ k ] ) return NW_TYPES[ i ][ 1 ]; }
    }
    var id = String( n.id() );   // id fallbacks when the class is missing/unhelpful
    if ( id.indexOf( '/kos/' ) >= 0 ) return 'concept';
    if ( id.indexOf( '/country' ) >= 0 ) return 'place';
    if ( id.indexOf( '/language' ) >= 0 ) return 'language';
    return 'other';
}
// set of node types currently visible in the graph (drives the dynamic facet menu)
function nwPresentTypes() {
    var s = {};
    if ( typeof cy !== 'undefined' && cy ) cy.nodes().forEach( function( n ) {
        if ( n.visible() && !n.hasClass( 'nw-collapsed' ) ) s[ nwNodeType( n ) ] = 1;
    } );
    return s;
}
function nwFacetColour( v ) {
    if ( !( v in NW_COL ) ) NW_COL[ v ] = OP_PALETTE[ Object.keys( NW_COL ).length % OP_PALETTE.length ];
    return NW_COL[ v ];
}
// ── WP-G facet registry (NODE-CENTRIC) ───────────────────────────────────────
// Each facet declares which node `types` it can resolve and a `query(nodeIds)` returning
// ?node ?val ?vlabel (one row per resolvable node). A facet with `client:true` resolves in JS
// (no SPARQL). `group` buckets facets in the "Group by" menu; the menu only offers a facet when
// the graph currently holds a node of one of its types. Values are cached per node; resolved
// values then propagate to unresolved neighbours so clusters carry mass.
var NW_PREFIX = `PREFIX intro: <https://w3id.org/lso/intro/beta202408#>
PREFIX crm: <http://www.cidoc-crm.org/cidoc-crm/>
PREFIX lrmoo: <http://iflastandards.info/ns/lrm/lrmoo/>
PREFIX dcterms: <http://purl.org/dc/terms/>
PREFIX skos: <http://www.w3.org/2004/02/skos/core#>`;
var NW_FACETS = {
    type:       { label: 'Node type', group: 'general', types: [ '*' ], client: true },
    language:   { label: 'Language', group: 'origin', types: [ 'work' ], query: function( v ) { return `${ NW_PREFIX }
SELECT ?node (REPLACE(STR(?x),"^.*/id/([^/]+).*$","$1") AS ?val) (REPLACE(STR(?x),"^.*/id/([^/]+).*$","$1") AS ?vlabel) WHERE {
  VALUES ?node { ${ v } }
  ?node ( lrmoo:R4_embodies | lrmoo:R3_is_realised_in )? / crm:P72_has_language ?x . }`; } },
    compDecade: { label: 'Composition decade', group: 'origin', types: [ 'work' ], query: function( v ) { return `${ NW_PREFIX }
SELECT ?node (CONCAT(SUBSTR(STR(?y),1,3),"0s") AS ?val) (CONCAT(SUBSTR(STR(?y),1,3),"0s") AS ?vlabel) WHERE {
  VALUES ?node { ${ v } }
  ?node lrmoo:R4_embodies? / lrmoo:R3i_realises? / lrmoo:R16i_was_created_by / crm:P4_has_time-span / crm:P82_at_some_time_within ?y . }`; } },
    publDecade: { label: 'Publication decade', group: 'origin', types: [ 'work' ], query: function( v ) { return `${ NW_PREFIX }
SELECT ?node (CONCAT(SUBSTR(STR(?y),1,3),"0s") AS ?val) (CONCAT(SUBSTR(STR(?y),1,3),"0s") AS ?vlabel) WHERE {
  VALUES ?node { ${ v } }
  ?node lrmoo:R3_is_realised_in? / lrmoo:R4i_is_embodied_in? / ^crm:P108_has_produced / crm:P4_has_time-span / crm:P82_at_some_time_within ?y . }`; } },
    authorCountry: { label: 'Residence', group: 'origin', types: [ 'person', 'work' ], query: function( v ) { return `${ NW_PREFIX }
SELECT ?node (REPLACE(STR(?place),"^.*/id/([^/]+).*$","$1") AS ?val) (REPLACE(STR(?place),"^.*/id/([^/]+).*$","$1") AS ?vlabel) WHERE {
  VALUES ?node { ${ v } }
  { ?node crm:P74_has_current_or_former_residence ?place }
  UNION { ?node lrmoo:R4_embodies? / dcterms:creator / crm:P74_has_current_or_former_residence ?place } }`; } },
    concept:    { label: 'Concept', group: 'semantic', types: [ 'context' ], query: function( v ) { return `${ NW_PREFIX }
SELECT ?node ?val ?vlabel WHERE {
  VALUES ?node { ${ v } }
  { ?node intro:R17_actualizesFeature ?val } UNION { ?node intro:R19_hasType / intro:R4i_isDefinedIn ?val }
  OPTIONAL { ?val skos:prefLabel ?vlabel } }`; } },
    vocabulary: { label: 'Vocabulary', group: 'semantic', types: [ 'context' ], query: function( v ) { return `${ NW_PREFIX }
SELECT ?node ?val (COALESCE(?ttl, REPLACE(STR(?val),"^.*/([^/]+)$","$1")) AS ?vlabel) WHERE {
  VALUES ?node { ${ v } }
  { ?node intro:R17_actualizesFeature ?c } UNION { ?node intro:R19_hasType / intro:R4i_isDefinedIn ?c }
  ?c skos:inScheme ?val . OPTIONAL { ?val dcterms:title ?ttl } }`; } },
    reachCountry: { label: 'Country (reach)', group: 'reach', types: [ 'context' ], query: function( v ) { return `${ NW_PREFIX }
SELECT ?node (REPLACE(STR(?place),"^.*/id/([^/]+).*$","$1") AS ?val) (REPLACE(STR(?place),"^.*/id/([^/]+).*$","$1") AS ?vlabel) WHERE {
  VALUES ?node { ${ v } }
  ?interp intro:R21_identifies ?node ; dcterms:spatial ?place . }`; } },
    reachPeriod:  { label: 'Period (reach)', group: 'reach', types: [ 'context' ], query: function( v ) { return `${ NW_PREFIX }
SELECT ?node (CONCAT(SUBSTR(REPLACE(STR(?t),"^.*/id/([^/]+).*$","$1"),1,3),"0s") AS ?val) (CONCAT(SUBSTR(REPLACE(STR(?t),"^.*/id/([^/]+).*$","$1"),1,3),"0s") AS ?vlabel) WHERE {
  VALUES ?node { ${ v } }
  ?interp intro:R21_identifies ?node ; dcterms:temporal ?t . }`; } },
    // poet-level facets resolved client-side from the map JSON (persons/nations) — zero SPARQL; used on the /maps geo-graph
    poetCountry:   { label: 'Nationality', group: 'origin', types: [ 'person' ], client: true, resolve: function( n ) { var p = nwPoet( n ); if ( !p || !p.nat ) return null; var iso = String( p.nat ).substring( 0, 2 ); return { val: iso, label: ( typeof nations !== 'undefined' && nations && nations[ iso ] ) ? String( nations[ iso ].name ).split( ',' )[ 0 ] : iso }; } },
    poetContinent: { label: 'Continent', group: 'origin', types: [ 'person' ], client: true, resolve: function( n ) { var p = nwPoet( n ); if ( !p || !p.nat ) return null; var iso = String( p.nat ).substring( 0, 2 ); var nat = ( typeof nations !== 'undefined' && nations ) ? nations[ iso ] : null; if ( !nat || !nat.cont ) return null; return { val: nat.cont, label: NW_CONTINENT[ nat.cont ] || nat.cont }; } },
    poetDecade:    { label: 'Birth decade', group: 'origin', types: [ 'person' ], client: true, resolve: function( n ) { var p = nwPoet( n ); if ( !p || !p.dob ) return null; var d = String( p.dob ).substring( 0, 3 ) + '0s'; return { val: d, label: d }; } },
    poetGender:    { label: 'Gender', group: 'general', types: [ 'person' ], client: true, resolve: function( n ) { var p = nwPoet( n ); if ( !p || !p.sex ) return null; return { val: p.sex, label: p.sex === 'f' ? 'Female' : p.sex === 'm' ? 'Male' : p.sex }; } }
};
var NW_CONTINENT = { AF: 'Africa', NA: 'North America', SA: 'South America', AS: 'Asia', EU: 'Europe', OC: 'Oceania', AN: 'Antarctica' };
function nwPoet( n ) { var m = String( n.id() ).match( /\/id\/(pers\d+)\b/ ); return ( m && typeof persons !== 'undefined' && persons ) ? persons[ m[ 1 ] ] : null; }
var NW_FACET_GROUPS = [ [ 'general', 'General' ], [ 'origin', 'Origin' ], [ 'semantic', 'Semantic' ], [ 'reach', 'Reach' ] ];
// REVERSIBLE INT1 contraction: hide each passage (not remove) + add a relation→work
// shortcut edge. Toggling off restores. Display-only; the store is untouched.
function nwContractPassages() {
    if ( typeof cy === 'undefined' || !cy ) return;
    // collect first, then hide ALL passages in one collection .style() + add ALL edges in one
    // cy.add() — per-passage .style()/.add() each forced a full re-render.
    var hide = cy.collection(), toAdd = [], seen = {};
    cy.nodes().filter( function( n ) { return nwNodeType( n ) === 'passage' && !n.hasClass( 'nw-collapsed' ); } ).forEach( function( p ) {
        var neigh = p.neighborhood( 'node' );
        var rels = neigh.filter( function( n ) { return nwNodeType( n ) === 'context'; } );
        // rewire the relation to the passage's VISIBLE TEXT only — not to the passage's language
        // node (the passage carries dcterms:language) nor a concept (redundant, and a rel->language
        // shortcut renders "undefined" via the language-edge label rule), and not to a hidden/
        // unloaded node (a shortcut to a hidden target = an invisible edge that strands the relation).
        var locs = neigh.not( rels ).filter( function( o ) {
            var id = String( o.id() );
            return o.visible() && id.indexOf( '/language' ) < 0 && id.indexOf( '/kos/' ) < 0 && id.indexOf( '/rppa/kos' ) < 0;
        } );
        // don't collapse a passage that is a relation's ONLY link (no visible work/manifestation
        // to rewire to) — hiding it would orphan the relation (and e.g. its concept). Keep it as
        // the visible connector instead.
        if ( rels.empty() || locs.empty() ) return;
        rels.forEach( function( r ) { locs.forEach( function( o ) {
            var id = 'nwc-' + opSafe( r.id() ) + '-' + opSafe( o.id() );
            if ( !seen[ id ] && cy.getElementById( id ).empty() ) { seen[ id ] = 1;
                toAdd.push({ group: 'edges', classes: 'edge nw-contracted', data: { id: id, source: r.id(), target: o.id(), name: '' } }); }
        } ); } );
        hide = hide.union( p );
    } );
    if ( toAdd.length ) cy.add( toAdd ).style({ 'line-style': 'dashed', 'opacity': 0.55 });
    if ( hide.nonempty() ) hide.addClass( 'nw-collapsed' ).style( 'display', 'none' );
}
function nwRestorePassages() {
    if ( typeof cy === 'undefined' || !cy ) return;
    cy.remove( '.nw-contracted' );
    cy.nodes( '.nw-collapsed' ).removeClass( 'nw-collapsed' ).style( 'display', 'element' );
}
// hide visible nodes left with no visible neighbour once passages are collapsed (e.g. a language
// node whose only link was the now-hidden passage). Uses the graph's existing '.hidden' mechanism;
// never touches collapsed passages. Multi-node disconnected clusters are left alone (each member
// still has a visible neighbour) — they are legitimate expansion results, not orphans.
function nwHideOrphans() {
    if ( typeof cy === 'undefined' || !cy ) return;
    cy.nodes( ':visible' ).forEach( function( n ) {
        if ( n.hasClass( 'nw-collapsed' ) ) return;
        if ( n.neighborhood( 'node:visible' ).length === 0 ) n.addClass( 'hidden' );
    } );
}
// shape a SPARQL-style triple binding for createCYJSON
function nwT( s, p, o, otype ) {
    return { s: { type: 'uri', value: s }, p: { type: 'uri', value: p }, o: { type: ( otype || 'uri' ), value: o }, g: { type: 'uri', value: 'default' } };
}
// A context relation (INT2/INT3) points at its text only via passage -> R10i_isPassageOf, and the
// legacy addEleNode filter drops that whole chain (passage reached via intro:R18i/R12/R13, text via
// R10i — none in the P138i/pdc/pdt/pdp allow-set). So a freshly-seeded TYPOLOGICAL concept shows the
// concept + its INT2s and NOTHING ELSE. This fetches, for every visible relation with no visible
// text, the target text DIRECTLY (property path through the passage) and adds just the text node +
// a dashed rel->text shortcut — no passage node, so nothing to hide and nothing to overlap.
async function nwFetchRelationTexts() {
    if ( typeof cy === 'undefined' || !cy ) return false;
    var need = nwRelations().filter( function( r ) {
        if ( !r.visible() ) return false;
        return !r.neighborhood( 'node:visible' ).some( function( n ) {   // already has a visible text?
            var id = String( n.id() ); return id.indexOf( '/manifestation/' ) >= 0 || id.indexOf( '/expression/' ) >= 0;
        } );
    } );
    if ( need.empty() ) return false;
    var values = need.map( function( r ) { return '<' + r.id() + '>'; } ).join( ' ' );
    // resolve rel -> text DIRECTLY (property path through the passage) so we only ever add TEXT nodes
    // plus a synthetic rel->text shortcut. If the passage targets a pdc:ExpressionFragment (a gated
    // OntoPoetry node — those belong only in the Structure view), map it UP to its lrmoo expression
    // so only proper entities surface here.
    var q = `PREFIX intro: <https://w3id.org/lso/intro/beta202408#>
PREFIX crm: <http://www.cidoc-crm.org/cidoc-crm/>
PREFIX lrmoo: <http://iflastandards.info/ns/lrm/lrmoo/>
SELECT DISTINCT ?rel ?text ?ttype ?tlabel WHERE {
  VALUES ?rel { ${ values } }
  ?rel ( intro:R18i_actualizationFoundOn | intro:R12_hasReferredToEntity | intro:R13_hasReferringEntity ) / intro:R10i_isPassageOf ?t0 .
  OPTIONAL { ?t0 lrmoo:R15i_is_fragment_of ?expr }
  BIND( COALESCE( ?expr, ?t0 ) AS ?text )
  OPTIONAL { ?text a ?ttype } OPTIONAL { ?text crm:P1_is_identified_by ?tlabel }
}`;
    var rows;
    try { rows = await opFetch( q ); } catch ( e ) { console.log( 'WP-G fetch-relation-texts query failed', e ); return false; }
    if ( !rows || !rows.length ) return false;
    var RDF = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type',
        P1  = 'http://www.cidoc-crm.org/cidoc-crm/P1_is_identified_by';
    var triples = [], pairs = [];
    rows.forEach( function( v ) {
        if ( !v.rel || !v.text ) return;
        pairs.push( [ v.rel.value, v.text.value ] );
        if ( v.ttype )  triples.push( nwT( v.text.value, RDF, v.ttype.value ) );
        if ( v.tlabel ) triples.push( nwT( v.text.value, P1, v.tlabel.value, 'literal' ) );
    } );
    try {   // build + add the text nodes (styled exactly like normal text nodes)
        var data = await createCYJSON( triples );
        data = ( data || [] ).filter( function( el ) { return el.data && el.data.id && cy.getElementById( el.data.id ).empty(); } );
        if ( data.length ) cy.add( data );
    } catch ( e ) { console.log( 'WP-G build-relation-texts failed', e ); }
    // add a dashed rel -> text shortcut (same look as the INT1 contraction edges)
    var edges = [];
    pairs.forEach( function( p ) {
        var eid = 'nwc-' + opSafe( p[ 0 ] ) + '-' + opSafe( p[ 1 ] );
        if ( cy.getElementById( p[ 1 ] ).nonempty() && cy.getElementById( eid ).empty() )
            edges.push({ group: 'edges', classes: 'edge nw-contracted', data: { id: eid, source: p[ 0 ], target: p[ 1 ], name: '' } });
    } );
    if ( edges.length ) cy.add( edges ).style({ 'line-style': 'dashed', 'opacity': 0.55 } );
    return ( pairs.length > 0 );
}

function nwFacetAttr( facet ) { return 'nwF_' + facet; }
// does this facet apply to a node's type?
function nwFacetApplies( def, n ) {
    return def.types.indexOf( '*' ) >= 0 || def.types.indexOf( nwNodeType( n ) ) >= 0;
}
// resolve the chosen facet's value per applicable VISIBLE node, cached on node.data('nwF_<facet>');
// incremental (only unresolved nodes). Client facets (e.g. node type) resolve in JS; others query
// the store with the node ids. Labels cached on the facet def.
async function nwResolveFacet( facet ) {
    var def = NW_FACETS[ facet ]; if ( !def ) return;
    var attr = nwFacetAttr( facet );
    def._labels = def._labels || {};
    var todo = cy.nodes().filter( function( n ) { return n.data( attr ) === undefined && nwFacetApplies( def, n ); } );
    if ( todo.empty() ) return;
    if ( def.client ) {   // resolve in JS (node type, or a facet-specific def.resolve for map JSON facets)
        todo.forEach( function( n ) {
            if ( def.resolve ) { var r = def.resolve( n ); if ( r && r.val != null ) { n.data( attr, r.val ); def._labels[ r.val ] = ( r.label != null ? r.label : r.val ); } return; }
            var t = nwNodeType( n ); n.data( attr, t ); def._labels[ t ] = NW_TYPE_LABEL[ t ] || t;   // default client facet = node type
        } );
        return;
    }
    var values = todo.map( function( n ) { return '<' + n.id() + '>'; } ).join( ' ' );
    var rows;
    try { rows = await opFetch( def.query( values ) ); } catch ( e ) { console.log( 'WP-G facet resolve failed', facet, e ); rows = []; }
    var byNode = {};
    ( rows || [] ).forEach( function( v ) {
        if ( !v.node || !v.val || !v.val.value ) return;
        if ( !( v.node.value in byNode ) ) byNode[ v.node.value ] = v.val.value;   // first value wins (single-membership for cise)
        if ( v.vlabel && v.vlabel.value ) def._labels[ v.val.value ] = v.vlabel.value;
    } );
    todo.forEach( function( n ) { n.data( attr, byNode[ n.id() ] || '' ); } );
}

function nwClearBubblesets() {
    ( nwBBPaths || [] ).forEach( function( p ) { try { if ( nwBB ) nwBB.removePath( p ); } catch ( e ) {} } );
    nwBBPaths = [];
}
function nwUpdateLegend( groups, labels ) {
    var $l = $( '.nw-panel .nw-legend' ); if ( !$l.length ) return;
    if ( !groups ) { $l.empty(); return; }
    labels = labels || {};
    $l.html( Object.keys( groups ).map( function( k ) {
        var name = labels[ k ] || k;
        return `<span style="white-space:nowrap;margin-right:8px;" title="${ String( name ).replace( /"/g, '&quot;' ) }"><span style="display:inline-block;width:10px;height:10px;background:${ nwFacetColour( k ) };border-radius:2px;"></span> ${ String( name ).substring( 0, 24 ) } (${ groups[ k ].length })</span>`;
    } ).join( '' ) );
}
// bubbleset outline (soft, multi-membership, NON-interactive so it never blocks node
// right-clicks) around each facet-value group
function nwDrawBubblesets( groups, perfOpts ) {
    nwClearBubblesets();
    var BS = ( typeof CytoscapeBubbleSets !== 'undefined' && CytoscapeBubbleSets.BubbleSetsPlugin );
    if ( !BS ) return;
    if ( !nwBB ) { try { nwBB = new BS( cy ); } catch ( e ) { nwBB = null; return; } }
    Object.keys( groups ).forEach( function( k ) {
        if ( groups[ k ].length < 2 ) return;   // a single node (incl. an aggregated count-node) needs no hull
        var col = nwFacetColour( k );
        var opts = { virtualEdges: true, interactive: false,
            style: { fill: col, fillOpacity: '0.12', stroke: col, 'strokeWidth': '2', strokeOpacity: '0.85', 'pointer-events': 'none' } };
        if ( perfOpts ) for ( var p in perfOpts ) opts[ p ] = perfOpts[ p ];
        var coll = cy.collection( groups[ k ] );
        if ( opts._adaptive ) {
            // The plugin allocates a marching-squares grid of (bbWidth/pixelGroup)x(bbHeight/pixelGroup)
            // Float32 cells. When a facet group spreads across the viewport at HIGH ZOOM its bounding box
            // explodes (off-screen members project thousands of px away), so a fixed pixelGroup blows up
            // memory -> crash. Coarsen by member count as before, then RAISE pixelGroup so the grid never
            // exceeds ~NW_BB_GRID_CAP cells per side regardless of zoom (bounds the allocation + the
            // marching/routing cost). Purely the plugin's own pixelGroup lever.
            var m = groups[ k ].length, bb = coll.boundingBox();
            var base = m > 60 ? 20 : ( m > 20 ? 10 : 4 );
            var NW_BB_GRID_CAP = 260;
            opts.pixelGroup = Math.max( base, Math.ceil( Math.max( bb.w, bb.h ) / NW_BB_GRID_CAP ) );
            // scattered-across-viewport groups: the virtual-edge routing (maxRoutingIterations) is the
            // other cost sink, so drop it once the hull is already coarse — the blobs read fine.
            if ( opts.pixelGroup > 24 ) opts.virtualEdges = false;
            delete opts._adaptive;
        }
        try { nwBBPaths.push( nwBB.addPath( coll, null, null, opts ) ); } catch ( e ) {}
    } );
}
// dependency-free fallback: pull each language's relations into a ring cluster
function nwRadial( langs, keys ) {
    var bb = cy.elements().boundingBox(), cx = ( bb.x1 + bb.x2 ) / 2, cyc = ( bb.y1 + bb.y2 ) / 2;
    var ringR = Math.max( 260, ( bb.w + bb.h ) / 4 + keys.length * 30 );
    keys.forEach( function( l, i ) {
        var ang = 2 * Math.PI * i / keys.length, ax = cx + ringR * Math.cos( ang ), ay = cyc + ringR * Math.sin( ang );
        var nodes = langs[ l ], m = nodes.length, clR = Math.max( 30, m * 11 );
        nodes.forEach( function( n, j ) {
            var a2 = 2 * Math.PI * j / Math.max( 1, m );
            n.position({ x: ax + ( m > 1 ? clR * Math.cos( a2 ) : 0 ), y: ay + ( m > 1 ? clR * Math.sin( a2 ) : 0 ) });
        } );
    } );
}
// Spread each RESOLVED node's facet value onto its unresolved neighbours (one pass, using a
// snapshot so values don't cascade), so clusters carry mass — e.g. a work's language reaches its
// contexts, a context's concept reaches its works. Never tags the shared concept hub (it connects
// everything, so tagging it would merge unrelated clusters). Node type ('*') never propagates.
function nwPropagateFacet( facet ) {
    if ( NW_FACETS[ facet ] && NW_FACETS[ facet ].client ) return;   // node-type: every node already has its own value
    var attr = nwFacetAttr( facet );
    var seeded = cy.nodes().filter( function( n ) { return !!n.data( attr ); } );   // resolved-with-a-value
    seeded.forEach( function( r ) {
        var val = r.data( attr );
        r.neighborhood( 'node' ).forEach( function( w ) {
            if ( w.data( attr ) ) return;                                          // already has a value
            if ( nwNodeType( w ) === 'concept' ) return;   // shared concept hub
            w.data( attr, val );
        } );
    } );
}
// ── Hub aggregation ──────────────────────────────────────────────────────────
// Collapse a large facet-value group into ONE synthetic count-node ("60 · eng"), wired to the
// neighbours its members connected to (usually the concept hub). Reversible + display-only (the
// store is untouched); the count-node is a NORMAL cy node so cise / bubblesets / right-click all
// keep working (no compound nodes). Click a count-node to expand its group.
var NW_AGG_THRESHOLD = 12;
function nwAggKey( facet, v ) { return facet + '::' + v; }
function nwRestoreAggregates( clearExpanded ) {
    if ( typeof cy === 'undefined' || !cy ) return;
    cy.remove( '.nw-agg, .nw-agg-edge' );
    cy.nodes( '.nw-agg-hidden' ).removeClass( 'nw-agg-hidden' ).style( 'display', 'element' );   // one collection call
    if ( clearExpanded ) nwAggExpanded = {};
}
// hide big groups and add a count-node per group; MUTATES groups+clustered so the count-node becomes
// the cluster. Skips groups the user manually expanded (nwAggExpanded). Connectivity: every edge a
// member had is preserved on the count-node — an edge to a node in ANOTHER aggregated group is
// REWIRED to that group's count-node (so "Creation" ↔ "Work" ↔ "Time-span" ↔ the poet all connect),
// never dropped. Edges are deduped (incl. the reverse of a count↔count pair).
// Perf: hide ALL members in ONE collection .style() call + add ALL count-nodes/edges in ONE cy.add()
// (per-element .style() forced a full re-render each). NOT cy.batch() — adding elements in a batch is unreliable.
function nwAggregateGroups( facet, groups, clustered ) {
    var attr = nwFacetAttr( facet ), def = NW_FACETS[ facet ];
    var aggVs = Object.keys( groups ).filter( function( v ) {
        return groups[ v ].length > NW_AGG_THRESHOLD && !nwAggExpanded[ nwAggKey( facet, v ) ];
    } );
    if ( !aggVs.length ) return;
    var aggIdOf = function( v ) { return 'nwagg-' + opSafe( facet ) + '-' + opSafe( v ); };
    var memberAgg = {};   // memberId -> its group's count-node id (so cross-group edges can be rewired)
    aggVs.forEach( function( v ) { var a = aggIdOf( v ); groups[ v ].forEach( function( m ) { memberAgg[ m.id() ] = a; } ); } );
    var hide = cy.collection(), toAdd = [], edgeSeen = {};
    aggVs.forEach( function( v ) {
        var aggId = aggIdOf( v ), memColl = cy.collection( groups[ v ] );
        var nd = { id: aggId, name: groups[ v ].length + ' · ' + ( ( def._labels && def._labels[ v ] ) || v ),
                   shape: 'round-rectangle', bgcolor: nwFacetColour( v ), nwAgg: 1, nwAggFacet: facet, nwAggVal: v };
        nd[ attr ] = v;
        toAdd.push( { group: 'nodes', classes: 'node nw-agg', data: nd } );
        memColl.neighborhood( 'node' ).forEach( function( w ) {
            if ( w.hasClass( 'hidden' ) || w.hasClass( 'nw-collapsed' ) ) return;
            var target = memberAgg[ w.id() ] || w.id();   // aggregated neighbour -> its count-node; else the node itself
            if ( target === aggId ) return;                // edge internal to this group
            var eid = 'nwagge-' + opSafe( aggId ) + '-' + opSafe( target ), rev = 'nwagge-' + opSafe( target ) + '-' + opSafe( aggId );
            if ( edgeSeen[ eid ] || edgeSeen[ rev ] ) return;
            edgeSeen[ eid ] = 1;
            toAdd.push( { group: 'edges', classes: 'edge nw-agg-edge', data: { id: eid, source: aggId, target: target, name: '', class: '' } } );   // class:'' -> blank-node/language label rule renders blank, not "undefined"
        } );
        hide = hide.union( memColl );
        clustered[ aggId ] = 1;
    } );
    hide.addClass( 'nw-agg-hidden' ).style( 'display', 'none' );   // ONE call
    cy.add( toAdd ).edges().style( { 'line-style': 'dashed', 'opacity': 0.6 } );   // ONE call
    aggVs.forEach( function( v ) { groups[ v ] = [ cy.getElementById( aggIdOf( v ) ) ]; } );
}
function nwExpandAggregate( agg ) {
    if ( !agg || agg.empty() || !agg.data( 'nwAgg' ) ) return;
    var facet = agg.data( 'nwAggFacet' ), v = agg.data( 'nwAggVal' ), attr = nwFacetAttr( facet );
    nwAggExpanded[ nwAggKey( facet, v ) ] = 1;   // stay expanded across re-groups
    cy.nodes( '.nw-agg-hidden' ).filter( function( n ) { return n.data( attr ) === v; } ).removeClass( 'nw-agg-hidden' ).style( 'display', 'element' );
    agg.connectedEdges().remove(); agg.remove();
    if ( nwGroupFacet ) nwGroupByFacet( nwGroupFacet );
    else if ( nwAggregate ) nwAutoAggregateByType();
    else run_layout( 'cose' );
}
// UNGROUPED aggregation: no facet is active, but "aggregate large groups" is on — so collapse each
// large SAME-TYPE fan-out (a poet's many works, etc.) into a count-node using node type as the
// implicit bucket, then lay out with cose (this path is always cose, never cise, so the two never mix).
async function nwAutoAggregateByType() {
    if ( typeof cy === 'undefined' || !cy ) return;
    if ( nwMapMode ) { nwApplyGeoPositions(); return; }   // geo: no ungrouped cose aggregation under the map
    var nwFocusId = nwFocusEle; nwFocusEle = null;
    try { if ( cyRunningLayout ) cyRunningLayout.stop(); } catch ( e ) {}
    nwRestoreAggregates( false );
    await nwResolveFacet( 'type' );   // client (fast): caches nwF_type on every node
    var buckets = {};
    cy.nodes().forEach( function( n ) {
        if ( n.hasClass( 'nw-collapsed' ) || n.hasClass( 'nw-agg-hidden' ) || !n.visible() ) return;
        var t = n.data( 'nwF_type' ); if ( t ) ( buckets[ t ] = buckets[ t ] || [] ).push( n );
    } );
    nwAggregateGroups( 'type', buckets, {} );
    run_layout( 'cose', nwFocusId || undefined );
}
var nwCiseReg = false;
// GENERIC grouping: separate the chosen facet's value-clusters with the CISE layout (whole-graph,
// no compound nodes, so no click-blocking), outline each value with a bubbleset. Falls back to a
// manual radial layout if cise isn't available.
async function nwGroupByFacet( facet ) {
    if ( typeof cy === 'undefined' || !cy ) return;
    if ( nwMapMode ) { await nwMapRegroup( facet ); return; }   // geo: colour + bubblesets on fixed positions, no cise
    var def = NW_FACETS[ facet ]; if ( !def ) { nwUngroup(); return; }
    var attr = nwFacetAttr( facet );
    var nwFocusId = nwFocusEle; nwFocusEle = null;   // this grouping is for that expansion; centre on it (else fit)
    if ( nwColourFacet !== facet ) { NW_COL = {}; nwColourFacet = facet; nwAggExpanded = {}; }   // fresh palette + expansions per facet
    // halt the base cose layout (from addEleNode) IMMEDIATELY — before the async facet lookup
    // below — so it can't keep animating/fighting during the round-trip and the cise run.
    try { if ( cyRunningLayout ) cyRunningLayout.stop(); } catch ( e ) {}
    cy.elements().stop();
    nwRestoreAggregates( false );   // drop old count-nodes + un-hide members; rebuild fresh below (keeps nwAggExpanded)
    await nwResolveFacet( facet );
    nwPropagateFacet( facet );
    nwClearBubblesets();
    var groups = {}, clustered = {};
    cy.nodes().forEach( function( n ) {
        if ( n.hasClass( 'nw-collapsed' ) || n.hasClass( 'nw-agg-hidden' ) || !n.visible() ) return;   // hidden passages / cleaned orphans / aggregated members
        var v = n.data( attr ); if ( v ) { ( groups[ v ] = groups[ v ] || [] ).push( n ); clustered[ n.id() ] = 1; }
    } );
    // Collapse large SAME-TYPE fan-outs the facet CAN'T resolve BEFORE choosing the layout — the 358
    // INT11 relation-type reifications off the "translation" concept (and any big context/passage/
    // event fan) carry no language/decade, so without this they pile up as an un-aggregated blob
    // (the empty-`keys` cose fallback below, or the cise "other" cluster). Bucket the still-visible
    // un-clustered PLUMBING nodes by type; keep person/work/concept/place individual (the user
    // browses those). Throwaway `{}` so each count-node stays un-clustered -> swept into "other".
    if ( nwAggregate ) {
        await nwResolveFacet( 'type' );
        var typeBuckets = {};
        cy.nodes().forEach( function( n ) {
            if ( n.hasClass( 'nw-collapsed' ) || n.hasClass( 'nw-agg-hidden' ) || !n.visible() ) return;
            if ( clustered[ n.id() ] ) return;                       // already in a facet group
            var t = n.data( 'nwF_type' );
            if ( t && !NW_KEEP_INDIVIDUAL[ t ] ) ( typeBuckets[ t ] = typeBuckets[ t ] || [] ).push( n );
        } );
        nwAggregateGroups( 'type', typeBuckets, {} );
    }
    var keys = Object.keys( groups );
    if ( !keys.length ) {
        // no facet values resolved (e.g. a concept's relation-type reifications) — cose was halted at
        // the top; lay out naturally. Any big plumbing fan was just collapsed above, so this stays tidy.
        nwUpdateLegend( null );
        run_layout( 'cose', nwFocusId || undefined );
        return;
    }
    nwUpdateLegend( groups, def._labels );          // legend counts are the REAL member counts (before aggregation)
    if ( nwAggregate ) nwAggregateGroups( facet, groups, clustered );   // big groups -> count-nodes (members now hidden)
    try { if ( window.cytoscapeCise && !nwCiseReg && typeof cytoscape !== 'undefined' ) { cytoscape.use( window.cytoscapeCise ); nwCiseReg = true; } } catch ( e ) {}
    // cise wants a 2D array of node-ID arrays (index = cluster id). Group the facet-value clusters,
    // then sweep EVERY other visible node (concept hub, persons, unresolved works) into ONE 'other'
    // cluster so cise lays them out as a single tidy circle instead of scattering them as
    // force-placed unclustered nodes.
    var clusterArrays = keys.map( function( k ) { return groups[ k ].map( function( n ) { return n.id(); } ); } );
    var others = cy.nodes().filter( function( n ) { return n.visible() && !n.hasClass( 'nw-collapsed' ) && !clustered[ n.id() ]; } ).map( function( n ) { return n.id(); } );
    if ( others.length ) clusterArrays.push( others );
    // cose was already halted at the top; belt-and-braces stop any residual node animation.
    cy.elements().stop();
    // after the layout settles: centre on the just-expanded node (nwFocusId) so an expansion keeps
    // you where you were; only fit-to-all when there's no focus (fresh seed / checkbox toggle).
    // Tiny defer so it lands after the cose focus-zoom (from run_layout).
    var nwRecentre = function() { setTimeout( function() { try {
        var f = nwFocusId ? cy.getElementById( nwFocusId ) : null;
        if ( f && f.nonempty() && f.visible() ) { cy.animate({ center: { eles: f }, zoom: 0.85 }, { duration: 300 } ); return; }
        // fit-to-all, but CAP the zoom: a small graph otherwise fills the screen with a few huge
        // magnified nodes. Compute the fit zoom manually and clamp it to NW_MAX_FIT_ZOOM.
        var vis = cy.elements( ':visible' ); if ( vis.empty() ) return;
        var bb = vis.boundingBox(), pad = 40;
        var z = Math.min( ( cy.width() - 2 * pad ) / Math.max( 1, bb.w ), ( cy.height() - 2 * pad ) / Math.max( 1, bb.h ) );
        z = Math.min( z, NW_MAX_FIT_ZOOM );
        cy.animate({ zoom: z, center: { eles: vis } }, { duration: 300 } );
    } catch ( e ) {} }, 60 ); };
    var ran = false;
    if ( window.cytoscapeCise && clusterArrays.length > 1 ) {
        try {
            try { if ( nwCiseLayout ) nwCiseLayout.stop(); } catch ( e ) {}   // a lingering prior cise run stops the next from completing
            var layout = cy.layout({ name: 'cise',
                clusters: clusterArrays,                     // 2D array form (function form is unreliable in 2.0.1)
                randomize: false, animate: false,            // false: refine from CURRENT positions (an expand adjusts, doesn't re-scatter the whole graph); animate:false snaps (animate:'end' never fires layoutstop on re-runs)
                fit: false, padding: 30,                     // nwRecentre owns the viewport (single zoom)
                nodeSeparation: 4,                           // tighter packing on each circle
                allowNodesInsideCircle: true, maxRatioOfNodesInsideCircle: 0.9,   // nest most of a cluster INSIDE the circle -> a filled disc, not a big thin ring (this is the main shrink lever)
                idealInterClusterEdgeLengthCoefficient: 1.4,
                gravity: 0.4, gravityRange: 3.0,             // pull the clusters closer together
                packComponents: true });                     // multiple seeded concepts = disconnected components -> pack them tidily
            nwCiseLayout = layout;
            var _done = false;
            layout.one( 'layoutstop', function() { _done = true; nwDrawBubblesets( groups ); nwRecentre(); } );   // draw + centre once nodes settle
            layout.run();
            ran = true;
            setTimeout( function() { if ( !_done ) { try { layout.stop(); } catch ( e ) {} nwRadial( groups, keys ); nwDrawBubblesets( groups ); nwRecentre(); } }, 1500 );   // safety net if cise still stalls
        } catch ( e ) { console.log( 'WP-G cise layout failed, using radial fallback', e ); }
    }
    if ( !ran ) { nwRadial( groups, keys ); nwDrawBubblesets( groups ); nwRecentre(); }
}
function nwUngroup() {
    if ( typeof cy === 'undefined' || !cy ) return;
    if ( nwMapMode ) { nwClearBubblesets(); nwMapGroups = null; nwUpdateLegend( null ); nwMapClearColours(); return; }   // geo: keep positions, Leaflet owns the viewport
    nwClearBubblesets();
    nwRestoreAggregates( true );   // un-collapse any count-nodes
    nwUpdateLegend( null );
    cy.layout( cyLayouts[ 'cose' ] ).run();   // restore a natural layout
}

// ── Map mode: geo-coordinate resolution ──────────────────────────────────────
// Nodes are placed by lat/lng read from the frontend map JSON (persons/places/nations), NOT the
// triplestore. Coord data lives only on places/nations as WKT "Point(lng lat)"; persons resolve via
// their birthplace (or country centroid), works via their author. Reuses the exact map.js rule.
function nwParseWKT( wkt ) {                 // "Point(lng lat)" -> {lat,lng} | null
    if ( !wkt ) return null;
    var c = [];
    String( wkt ).replace( /[-+]?[0-9]*\.?[0-9]+/g, function( x ) { var n = Number( x ); if ( isFinite( n ) ) c.push( n ); } );
    return c.length >= 2 ? { lat: c[ 1 ], lng: c[ 0 ] } : null;   // WKT is lng,lat; Leaflet wants lat,lng
}
function nwKeyCoord( key ) {                 // wikidata Qid or ISO-2 nation code -> {lat,lng} | null
    if ( !key ) return null;
    if ( typeof places !== 'undefined' && places && places[ key ] ) return nwParseWKT( places[ key ].coord );
    if ( typeof nations !== 'undefined' && nations && nations[ key ] ) return nwParseWKT( nations[ key ].coord );
    return null;
}
function nwPersonCoord( persid ) {           // birthplace if its nation matches, else country centroid (map.js:150 rule)
    var v = ( typeof persons !== 'undefined' && persons ) ? persons[ persid ] : null;
    if ( !v || !v.nat ) return null;
    var iso = String( v.nat ).substring( 0, 2 );
    var wkt = ( v.pob && places && places[ v.pob ] && places[ v.pob ].coord && places[ v.pob ].nat === iso )
              ? places[ v.pob ].coord
              : ( nations && nations[ iso ] ? nations[ iso ].coord : null );
    return nwParseWKT( wkt );
}
function nwGeoCoord( node ) {                // cy node -> {lat,lng} | null (null = not geo-locatable)
    var id = String( node.id() ), t = nwNodeType( node );
    if ( t === 'person' ) { var mp = id.match( /\/id\/(pers\d+)\b/ ); return mp ? nwPersonCoord( mp[ 1 ] ) : null; }
    if ( t === 'place' ) {
        var mc = id.match( /\/id\/([A-Za-z]{2}(?:-[A-Za-z]+)?)\/country/ );   // .../id/<ISO2>/country
        if ( mc ) return nwKeyCoord( mc[ 1 ].substring( 0, 2 ) );
        var mq = id.match( /\/id\/(Q\d+)\b/ );                                // wikidata place
        if ( mq ) return nwKeyCoord( mq[ 1 ] );
        return nwKeyCoord( node.data( nwFacetAttr( 'authorCountry' ) ) || node.data( nwFacetAttr( 'reachCountry' ) ) );
    }
    if ( t === 'work' ) {
        var mw = id.match( /\/id\/(work\d+)\b/ );
        if ( mw && typeof nwWorkAuthor === 'function' ) { var p = nwWorkAuthor( mw[ 1 ] ); if ( p ) { var pc = nwPersonCoord( p ); if ( pc ) return pc; } }
        return nwKeyCoord( node.data( nwFacetAttr( 'authorCountry' ) ) );    // fallback: cached author-country facet value (country-level)
    }
    return null;                            // concept / language / timespan / context / creation / etc.
}
// Give every node a finite lat/lng BEFORE cy.leaflet() (its constructor fit()s over ALL nodes, so one
// NaN corrupts the fit). Locatable nodes go to their coord (with golden-angle jitter for co-located
// ones — cytoscape-leaf has no spiderfy); the rest get the centroid and are hidden. Returns geo count.
function nwApplyGeoPositions() {
    if ( typeof cy === 'undefined' || !cy ) return 0;
    var geo = [], nongeo = [];
    cy.nodes().forEach( function( n ) {
        if ( n.hasClass( 'nw-collapsed' ) || n.hasClass( 'nw-agg-hidden' ) ) return;
        var c = nwGeoCoord( n );
        if ( c && isFinite( c.lat ) && isFinite( c.lng ) ) {
            // NO jitter: co-located poets stack exactly and are separated on demand by the spiderfy
            // (mapsSpiderfyStack). The old golden-angle jitter here (a cytoscape-leaf leftover) rewrote
            // n.data lat/lng, permanently scattering stacks whenever this ran (e.g. after an expand).
            n.data( { lat: c.lat, lng: c.lng } );
            n.removeClass( 'nw-nongeo' ).style( 'display', 'element' );
            geo.push( n );
        } else nongeo.push( n );
    } );
    if ( geo.length ) {
        var la = 0, ln = 0;
        geo.forEach( function( n ) { la += n.data( 'lat' ); ln += n.data( 'lng' ); } );
        var cLat = la / geo.length, cLng = ln / geo.length;
        nongeo.forEach( function( n ) { n.data( { lat: cLat, lng: cLng } ).addClass( 'nw-nongeo' ).style( 'display', 'none' ); } );
    }
    return geo.length;
}
// Map-mode grouping: reuse WP-G facet resolution/propagation/legend, but show the facet as the node
// FILL colour on the FIXED geo positions. NO bubbleset hulls here — a hull over hundreds of globally-
// scattered poets (e.g. the 2 Gender groups) is both slow (crashes on zoom-redraw) and meaningless;
// the fill colour + legend carry the grouping. No cise, no viewport fit (Leaflet owns the viewport).
var NW_GEO_GREY = null;   // resolved lazily from theme
function nwGeoGrey() { return ( typeof theme !== 'undefined' && theme === 'dark' ) ? '#bbb' : '#666'; }
// which node property carries the facet colour: the border ring when portraits are on (the fill is a
// photo), the fill when they're off (plain dots). Defaults to the ring (portraits are on by default).
function nwMapFacetProp() { return ( typeof window !== 'undefined' && window.mapsPortraits === false ) ? 'background-color' : 'border-color'; }
function nwMapNeutralBorder() { return ( typeof theme !== 'undefined' && theme === 'dark' ) ? '#222' : '#fff'; }
function nwMapClearColours() {
    if ( nwGeoColoured ) { nwGeoColoured.style( 'background-color', nwGeoGrey() ); nwGeoColoured.style( 'border-color', nwMapNeutralBorder() ); nwGeoColoured = null; }
}
// redraw the hulls for the CURRENT map groups (called on pan/zoom settle, so the plugin never
// recomputes a giant hull per frame during interaction)
function nwRedrawMapBubblesets() {
    if ( nwMapMode && nwMapGroups && Object.keys( nwMapGroups ).length ) nwDrawBubblesets( nwMapGroups, NW_MAP_BB_OPTS );
}
async function nwMapRegroup( facet ) {
    if ( typeof cy === 'undefined' || !cy ) return;
    nwClearBubblesets();
    var def = NW_FACETS[ facet ];
    if ( !def ) { nwUpdateLegend( null ); nwMapClearColours(); nwMapGroups = null; return; }   // ungrouped
    var attr = nwFacetAttr( facet );
    if ( nwColourFacet !== facet ) { NW_COL = {}; nwColourFacet = facet; }
    await nwResolveFacet( facet );
    nwPropagateFacet( facet );
    var groups = {};
    cy.nodes( ':visible' ).forEach( function( n ) {
        if ( n.hasClass( 'nw-nongeo' ) || n.hasClass( 'nw-collapsed' ) ) return;
        var v = n.data( attr ); if ( v ) ( groups[ v ] = groups[ v ] || [] ).push( n );
    } );
    var keys = Object.keys( groups );
    nwUpdateLegend( keys.length ? groups : null, def._labels );
    nwMapClearColours();
    nwGeoColoured = cy.collection();
    var facetProp = nwMapFacetProp();   // border ring (portraits) or fill (dots)
    keys.forEach( function( k ) {
        var coll = cy.collection( groups[ k ] );
        coll.style( facetProp, nwFacetColour( k ) );   // group colour on the visible channel (ONE call per group)
        nwGeoColoured = nwGeoColoured.union( coll );
    } );
    nwMapGroups = keys.length ? groups : null;
    // Defer the hull draw one frame. We have just set each group's background-colour; drawing hulls
    // synchronously reads cytoscape's geometry cache mid-style-flush and the marching-squares outline
    // comes out empty (the "hulls not drawn on colour-by, but fine after nudging the map" bug — a map
    // move recomputes them cleanly). Reproject + draw on the next frame, once the styles have settled.
    if ( keys.length ) {
        if ( nwMapHullRAF ) cancelAnimationFrame( nwMapHullRAF );
        nwMapHullRAF = requestAnimationFrame( function () {
            nwMapHullRAF = 0;
            if ( typeof window.mapsProjectNodes === 'function' ) window.mapsProjectNodes();   // flush node positions/dims first
            nwDrawBubblesets( groups, NW_MAP_BB_OPTS );   // soft hull per group (coarse grid = cheap)
        } );
    }
}

// re-apply active WP-G options after an expansion (called from addEleNode)
async function nwAfterExpand() {
    if ( nwCollapseInt1 ) {
        nwContractPassages();                  // fold any passages already in the graph
        await nwFetchRelationTexts();          // for rels with no visible text, add the text + a direct rel->text edge
        nwHideOrphans();
    }
    nwRefreshFacetMenu();                       // the graph's node types may have changed -> update the Group by menu
    if ( nwMapMode ) {                           // geo: place new nodes by lat/lng (or hide), then recolour + rehull
        nwApplyGeoPositions();
        if ( nwGroupFacet ) await nwMapRegroup( nwGroupFacet );
        return;
    }
    if ( nwGroupFacet ) await nwGroupByFacet( nwGroupFacet );
    else if ( nwAggregate ) await nwAutoAggregateByType();   // no facet: still collapse large same-type fan-outs (cose)
}

// strip all WP-G decorations (bubblesets, shortcut edges, hidden passages) so the graph
// is in its RAW state — used around undo/redo so those ops act on the real graph.
function nwTeardown() {
    if ( typeof cy === 'undefined' || !cy ) return;
    nwClearBubblesets();
    nwRestoreAggregates( true );   // remove count-nodes + un-hide members so undo/redo act on the raw graph
    cy.remove( '.nw-contracted' );
    cy.nodes( '.nw-collapsed' ).removeClass( 'nw-collapsed' ).style( 'display', 'element' );
}
// The WP-G mutations are NOT recorded by the undo-redo extension, so they'd linger and
// corrupt an undo/redo. Tear them down before, reapply after — keeping undo/redo on the
// raw graph (fixes the back/forward buttons).
var nwUndoHooked = false;
function nwHookUndo() {
    if ( nwUndoHooked || typeof cy === 'undefined' || !cy ) return;
    cy.on( 'beforeUndo beforeRedo', function() { nwTeardown(); } );
    cy.on( 'afterUndo afterRedo', function() { nwAfterExpand(); } );
    cy.on( 'tap', 'node.nw-agg', function( evt ) { nwExpandAggregate( evt.target ); } );   // click a count-node to expand it
    nwUndoHooked = true;
}

// build the <option>s for the "Group by" menu, bucketed by facet group (origin/semantic/reach)
// build the Group-by <option>s, offering only facets whose node types are present in the graph
// (the currently-selected facet is always kept so the selection never silently drops).
function nwFacetOptionsHTML() {
    var present = nwPresentTypes();
    var html = `<option value="" ${ nwGroupFacet ? '' : 'selected' }>(none)</option>`;
    NW_FACET_GROUPS.forEach( function( g ) {
        var opts = Object.keys( NW_FACETS ).filter( function( k ) {
            var def = NW_FACETS[ k ];
            if ( def.group !== g[ 0 ] ) return false;
            if ( k === nwGroupFacet ) return true;                                  // keep current selection
            return def.types.indexOf( '*' ) >= 0 || def.types.some( function( t ) { return present[ t ]; } );
        } ).map( function( k ) {
            return `<option value="${ k }" ${ nwGroupFacet === k ? 'selected' : '' }>${ NW_FACETS[ k ].label }</option>`;
        } ).join( '' );
        if ( opts ) html += `<optgroup label="${ g[ 1 ] }">${ opts }</optgroup>`;
    } );
    return html;
}
// re-render the Group-by menu options in place (present node types may have changed)
function nwRefreshFacetMenu() {
    var $sel = $( '.nw-panel .nw-groupby' );
    if ( $sel.length ) $sel.html( nwFacetOptionsHTML() );
}
// single floating control panel, split into Grouping (functional) + Layout (view) sections
function nwEnsureGraphControls() {
    if ( !nwHasPanel() ) return;
    var view = nwGraphView(), maps = ( view === 'maps' );
    // on /maps the controls live in the sidebar '#graph' tab pane; elsewhere they float over the graph
    var $mount = maps ? $( '#graph-controls' ) : $( '.col-graph' );
    if ( !$mount.length || $mount.find( '.nw-panel' ).length ) return;
    // the poet/poem browsing stubs + /maps start UNGROUPED (opt-in); only /networks groups by default
    if ( view !== 'networks' ) nwGroupFacet = null;
    var panelStyle = maps
        ? 'font-size:12px;'   // sidebar pane: inline, no floating box
        : `position:absolute;top:8px;right:${ view === 'networks' ? 385 : 370 }px;max-width:220px;z-index:1001;background:var(--bs-body-bg,#fff);border:1px solid rgba(128,128,128,.4);border-radius:6px;padding:6px 10px;font-size:12px;`;
    $mount.append(
        `<div class="nw-panel" style="${ panelStyle }">
            <div style="font-weight:bold;margin-bottom:2px;">Grouping</div>
            ${ maps ? '' : `<label style="cursor:pointer;margin:0;display:block;"><input type="checkbox" class="nw-collapse" ${ nwCollapseInt1 ? 'checked' : '' }> collapse passages</label>` }
            <label style="margin:2px 0 0;display:block;">${ maps ? 'Colour by' : 'Group by' }: <select class="nw-groupby" style="max-width:130px;">${ nwFacetOptionsHTML() }</select></label>
            ${ maps ? '' : `<label style="cursor:pointer;margin:2px 0 0;display:block;" title="Collapse a group with more than ${ NW_AGG_THRESHOLD } members into a single count-node; click it to expand."><input type="checkbox" class="nw-aggregate" ${ nwAggregate ? 'checked' : '' }> aggregate large groups</label>` }
            <div class="nw-legend" style="margin-top:4px;line-height:1.7;"></div>
            <div style="font-weight:bold;margin:6px 0 2px;border-top:1px solid rgba(128,128,128,.25);padding-top:5px;">Layout</div>
            <button type="button" id="graph_redraw" style="display:block;width:100%;margin-top:4px;padding:2px 6px;font-size:11px;background:#cd6711;color:#fff;border:none;border-radius:4px;cursor:pointer;">Redraw graph</button>
            <div style="font-weight:bold;margin:6px 0 2px;border-top:1px solid rgba(128,128,128,.25);padding-top:5px;">Export</div>
            <button type="button" id="graph_graphml" style="display:block;width:100%;margin-top:3px;padding:2px 6px;font-size:11px;background:#cd6711;color:#fff;border:none;border-radius:4px;cursor:pointer;">GraphML</button>
            <button type="button" id="graph_cyjson" style="display:block;width:100%;margin-top:3px;padding:2px 6px;font-size:11px;background:#cd6711;color:#fff;border:none;border-radius:4px;cursor:pointer;">Cytoscape JSON</button>
            <button type="button" id="graph_png" style="display:block;width:100%;margin-top:3px;padding:2px 6px;font-size:11px;background:#cd6711;color:#fff;border:none;border-radius:4px;cursor:pointer;">PNG (viewport)</button>
        </div>`
    );
    $mount.on( 'change', '.nw-collapse', async function() {
        nwCollapseInt1 = this.checked;
        if ( nwCollapseInt1 ) nwContractPassages(); else nwRestorePassages();
        if ( nwGroupFacet ) await nwGroupByFacet( nwGroupFacet ); else if ( nwMapMode ) nwApplyGeoPositions(); else if ( !nwCollapseInt1 ) run_layout( 'cose' );
    } );
    $mount.on( 'change', '.nw-groupby', async function() {
        nwGroupFacet = this.value || null;
        if ( nwGroupFacet ) await nwGroupByFacet( nwGroupFacet ); else nwUngroup();
    } );
    $mount.on( 'change', '.nw-aggregate', async function() {
        nwAggregate = this.checked;
        if ( nwMapMode ) { if ( nwGroupFacet ) await nwGroupByFacet( nwGroupFacet ); return; }   // no count-nodes under the map (MVP)
        nwRestoreAggregates( true );   // clean slate, then re-apply (which re-aggregates iff enabled)
        if ( nwGroupFacet ) await nwGroupByFacet( nwGroupFacet );
        else if ( nwAggregate ) await nwAutoAggregateByType();
        else run_layout( 'cose' );
    } );
}
$( function() { nwEnsureGraphControls(); } );

// run layout on graph
function run_layout( layout_name, focus ) {
	if ( typeof nwMapMode !== 'undefined' && nwMapMode ) return;   // geo (map) mode OWNS node positions — never run a spring/grid layout
	var layout = cy.elements().layout( cyLayouts[ layout_name ] );
	cyRunningLayout = layout;   // WP-G: expose so facet grouping can stop it before running cise
	layout.run();
	if ( cy.$id( focus ).length ) {
		layout.on( "layoutstop", function() {
			cy.animate({
				zoom: .75,
				center: { eles: cy.filter( '[id="'+focus+'"]' ) }
			}, {
				duration: 500
			});
		});
	}
}

async function getPerson( id ) {
    var q = namespaces+`SELECT DISTINCT ?s ?p ?o ?g WHERE {
        { ?person ?p ?o .
            BIND(?person as ?s)
        }
        UNION
        {   ?person <http://www.cidoc-crm.org/cidoc-crm/P98i_was_born> ?birth .
            ?birth ?p ?o .
            BIND(?birth as ?s)
        }
        UNION
        {   ?person <http://www.cidoc-crm.org/cidoc-crm/P100i_died_in> ?death .
            ?death ?p ?o .
            BIND(?death as ?s)
        } 
        UNION 
        {   ?person <http://www.cidoc-crm.org/cidoc-crm/P98i_was_born> ?birth .
            ?birth <http://www.cidoc-crm.org/cidoc-crm/P4_has_time-span> ?birthDate .
            ?birthDate ?p ?o.
            BIND(?birthDate as ?s)
        }
        UNION
        {   ?person <http://www.cidoc-crm.org/cidoc-crm/P98i_was_born> ?birth .
            ?birth <http://www.cidoc-crm.org/cidoc-crm/P4_has_time-span> ?birthDate .
            ?birthDate <http://www.cidoc-crm.org/cidoc-crm/P86_falls_within> ?birthYear .
            ?birthYear ?p ?o.
            BIND(?birthYear as ?s)
        }
        UNION 
        {   ?person <http://www.cidoc-crm.org/cidoc-crm/P100i_died_in> ?death .
            ?death <http://www.cidoc-crm.org/cidoc-crm/P4_has_time-span> ?deathDate .
            ?deathDate ?p ?o.
            BIND(?deathDate as ?s)
        } 
        UNION
        {   ?person <http://www.cidoc-crm.org/cidoc-crm/P100i_died_in> ?death .
            ?death <http://www.cidoc-crm.org/cidoc-crm/P4_has_time-span> ?deathDate .
            ?deathDate <http://www.cidoc-crm.org/cidoc-crm/P86_falls_within> ?deathYear .
            ?deathYear ?p ?o.
            BIND(?deathYear as ?s)
        }
        UNION 
        {   ?person <http://www.cidoc-crm.org/cidoc-crm/P98i_was_born> ?birth .
            ?birth <http://www.cidoc-crm.org/cidoc-crm/P7_took_place_at> ?birthPlace .
            ?birthPlace ?p ?o.
            BIND(?birthPlace as ?s)
        }
        UNION 
        {   ?person <http://www.cidoc-crm.org/cidoc-crm/P98i_was_born> ?birth .
            ?birth <http://www.cidoc-crm.org/cidoc-crm/P7_took_place_at> ?birthPlace .
            ?birthPlace <http://www.cidoc-crm.org/cidoc-crm/P89_falls_within> ?birthCountry .
            ?birthCountry <http://www.cidoc-crm.org/cidoc-crm/P89_falls_within> ?birthContinent .
            ?birthContinent ?p ?o .
            BIND(?birthContinent as ?s)
        }
        UNION 
        {   ?person <http://www.cidoc-crm.org/cidoc-crm/P98i_was_born> ?birth .
            ?birth <http://www.cidoc-crm.org/cidoc-crm/P7_took_place_at> ?birthPlace .
            ?birthPlace <http://www.cidoc-crm.org/cidoc-crm/P89_falls_within> ?birthCountry .
            ?birthCountry ?p ?o.
            BIND(?birthCountry as ?s)
        }
        UNION 
        {   ?person <http://www.cidoc-crm.org/cidoc-crm/P100i_died_in> ?death .
            ?death <http://www.cidoc-crm.org/cidoc-crm/P7_took_place_at> ?deathPlace .
            ?deathPlace ?p ?o.
            BIND(?deathPlace as ?s)
        }
        UNION 
        {   ?person <http://www.cidoc-crm.org/cidoc-crm/P100i_died_in> ?death .
            ?death <http://www.cidoc-crm.org/cidoc-crm/P7_took_place_at> ?deathPlace .
            ?deathPlace <http://www.cidoc-crm.org/cidoc-crm/P89_falls_within> ?deathCountry .
            ?deathCountry <http://www.cidoc-crm.org/cidoc-crm/P89_falls_within> ?deathContinent .
            ?deathContinent ?p ?o.
            BIND(?deathContinent as ?s)
        }
        UNION 
        {   ?person <http://www.cidoc-crm.org/cidoc-crm/P100i_died_in> ?death .
            ?death <http://www.cidoc-crm.org/cidoc-crm/P7_took_place_at> ?deathPlace .
            ?deathPlace <http://www.cidoc-crm.org/cidoc-crm/P89_falls_within> ?deathCountry .
            ?deathCountry ?p ?o.
            BIND(?deathCountry as ?s)
        }
        UNION
        {   ?person <http://www.cidoc-crm.org/cidoc-crm/P74_has_current_or_former_residence> ?nationality .
            ?nationality ?p ?o .
            BIND(?nationality as ?s) 
        }
		UNION
        {   ?person <http://www.cidoc-crm.org/cidoc-crm/P74_has_current_or_former_residence> ?nationality .
            ?nationality crm:P89_falls_within ?Continent .
			?Continent ?p ?o .
			BIND(?Continent as ?s) 
        }
        UNION
        {   ?workscreation crm:P14_carried_out_by ?person .
 		    ?workscreation a <http://iflastandards.info/ns/lrm/lrmoo/F27_Work_Creation> .
		    ?workscreation ?p ?o .
			BIND (?workscreation AS ?s)
		}
		UNION
        {   ?workscreation crm:P14_carried_out_by ?person .
 		    ?workscreation a <http://iflastandards.info/ns/lrm/lrmoo/F27_Work_Creation> .
		    ?workscreation crm:P4_has_time-span ?workscreationdate .
			?workscreationdate ?p ?o .
			BIND (?workscreationdate AS ?s)
		}
		UNION
		{   ?workscreation crm:P14_carried_out_by ?person .
		    ?workscreation lrmoo:R16_created ?works .
            ?works a <http://iflastandards.info/ns/lrm/lrmoo/F1_Work> .
            ?works ?p ?o .
            BIND(?works as ?s) 
        }
		UNION
		{   ?workscreation <http://www.cidoc-crm.org/cidoc-crm/P14_carried_out_by> ?person .
    		OPTIONAL {
			    ?workscreation <http://www.cidoc-crm.org/cidoc-crm/P14_carried_out_by> ?p2 .
    		}
            ?p2 ?p ?o .
            BIND(?p2 as ?s) 
        }
        UNION
        {   
    		?workscreation <http://www.cidoc-crm.org/cidoc-crm/P14_carried_out_by> ?person .
    		OPTIONAL {
			    ?workscreation <http://www.cidoc-crm.org/cidoc-crm/P14_carried_out_by> ?p2 .
    		}
    		?p2 <http://www.cidoc-crm.org/cidoc-crm/P98i_was_born> ?birth .
            ?birth ?p ?o .
            BIND(?birth as ?s)
        }
        UNION
        {   
    		?workscreation <http://www.cidoc-crm.org/cidoc-crm/P14_carried_out_by> ?person .
    		OPTIONAL {
			    ?workscreation <http://www.cidoc-crm.org/cidoc-crm/P14_carried_out_by> ?p2 .
    		}
    		?p2 <http://www.cidoc-crm.org/cidoc-crm/P100i_died_in> ?death .
            ?death ?p ?o .
            BIND(?death as ?s)
        } 
        UNION 
        {   
        	?workscreation <http://www.cidoc-crm.org/cidoc-crm/P14_carried_out_by> ?person .
    		OPTIONAL {
			    ?workscreation <http://www.cidoc-crm.org/cidoc-crm/P14_carried_out_by> ?p2 .
    		}
    		?p2 <http://www.cidoc-crm.org/cidoc-crm/P98i_was_born> ?birth .
            ?birth <http://www.cidoc-crm.org/cidoc-crm/P4_has_time-span> ?birthDate .
            ?birthDate ?p ?o.
            BIND(?birthDate as ?s)
        }
        UNION
        {   
        	?workscreation <http://www.cidoc-crm.org/cidoc-crm/P14_carried_out_by> ?person .
    		OPTIONAL {
			    ?workscreation <http://www.cidoc-crm.org/cidoc-crm/P14_carried_out_by> ?p2 .
    		}
    		?p2 <http://www.cidoc-crm.org/cidoc-crm/P98i_was_born> ?birth .
            ?birth <http://www.cidoc-crm.org/cidoc-crm/P4_has_time-span> ?birthDate .
            ?birthDate <http://www.cidoc-crm.org/cidoc-crm/P86_falls_within> ?birthYear .
            ?birthYear ?p ?o.
            BIND(?birthYear as ?s)
        }
        UNION 
        {   
        	?workscreation <http://www.cidoc-crm.org/cidoc-crm/P14_carried_out_by> ?person .
    		OPTIONAL {
			    ?workscreation <http://www.cidoc-crm.org/cidoc-crm/P14_carried_out_by> ?p2 .
    		}
    		?p2 <http://www.cidoc-crm.org/cidoc-crm/P100i_died_in> ?death .
            ?death <http://www.cidoc-crm.org/cidoc-crm/P4_has_time-span> ?deathDate .
            ?deathDate ?p ?o.
            BIND(?deathDate as ?s)
        } 
        UNION
        {   
        	?workscreation <http://www.cidoc-crm.org/cidoc-crm/P14_carried_out_by> ?person .
    		OPTIONAL {
			    ?workscreation <http://www.cidoc-crm.org/cidoc-crm/P14_carried_out_by> ?p2 .
    		}
    		?p2 <http://www.cidoc-crm.org/cidoc-crm/P100i_died_in> ?death .
            ?death <http://www.cidoc-crm.org/cidoc-crm/P4_has_time-span> ?deathDate .
            ?deathDate <http://www.cidoc-crm.org/cidoc-crm/P86_falls_within> ?deathYear .
            ?deathYear ?p ?o.
            BIND(?deathYear as ?s)
        }
		UNION 
        {   ?workscreation <http://www.cidoc-crm.org/cidoc-crm/P14_carried_out_by> ?person .
    		OPTIONAL {
			    ?workscreation <http://www.cidoc-crm.org/cidoc-crm/P14_carried_out_by> ?p2 .
    		}
    		?p2 <http://www.cidoc-crm.org/cidoc-crm/P98i_was_born> ?birth .
            ?birth <http://www.cidoc-crm.org/cidoc-crm/P7_took_place_at> ?birthPlace .
            ?birthPlace ?p ?o.
            BIND(?birthPlace as ?s)
        }
        UNION 
        {   ?workscreation <http://www.cidoc-crm.org/cidoc-crm/P14_carried_out_by> ?person .
    		OPTIONAL {
			    ?workscreation <http://www.cidoc-crm.org/cidoc-crm/P14_carried_out_by> ?p2 .
    		}
    		?p2 <http://www.cidoc-crm.org/cidoc-crm/P98i_was_born> ?birth .
            ?birth <http://www.cidoc-crm.org/cidoc-crm/P7_took_place_at> ?birthPlace .
            ?birthPlace <http://www.cidoc-crm.org/cidoc-crm/P89_falls_within> ?birthCountry .
            ?birthCountry <http://www.cidoc-crm.org/cidoc-crm/P89_falls_within> ?birthContinent .
            ?birthContinent ?p ?o .
            BIND(?birthContinent as ?s)
        }
        UNION 
        {   ?workscreation <http://www.cidoc-crm.org/cidoc-crm/P14_carried_out_by> ?person .
    		OPTIONAL {
			    ?workscreation <http://www.cidoc-crm.org/cidoc-crm/P14_carried_out_by> ?p2 .
    		}
    		?p2 <http://www.cidoc-crm.org/cidoc-crm/P98i_was_born> ?birth .
            ?birth <http://www.cidoc-crm.org/cidoc-crm/P7_took_place_at> ?birthPlace .
            ?birthPlace <http://www.cidoc-crm.org/cidoc-crm/P89_falls_within> ?birthCountry .
            ?birthCountry ?p ?o.
            BIND(?birthCountry as ?s)
        }
        UNION 
        {   ?workscreation <http://www.cidoc-crm.org/cidoc-crm/P14_carried_out_by> ?person .
    		OPTIONAL {
			    ?workscreation <http://www.cidoc-crm.org/cidoc-crm/P14_carried_out_by> ?p2 .
    		}
    		?p2 <http://www.cidoc-crm.org/cidoc-crm/P100i_died_in> ?death .
            ?death <http://www.cidoc-crm.org/cidoc-crm/P7_took_place_at> ?deathPlace .
            ?deathPlace ?p ?o.
            BIND(?deathPlace as ?s)
        }
        UNION 
        {   ?workscreation <http://www.cidoc-crm.org/cidoc-crm/P14_carried_out_by> ?person .
    		OPTIONAL {
			    ?workscreation <http://www.cidoc-crm.org/cidoc-crm/P14_carried_out_by> ?p2 .
    		}
    		?p2 <http://www.cidoc-crm.org/cidoc-crm/P100i_died_in> ?death .
            ?death <http://www.cidoc-crm.org/cidoc-crm/P7_took_place_at> ?deathPlace .
            ?deathPlace <http://www.cidoc-crm.org/cidoc-crm/P89_falls_within> ?deathCountry .
            ?deathCountry <http://www.cidoc-crm.org/cidoc-crm/P89_falls_within> ?deathContinent .
            ?deathContinent ?p ?o.
            BIND(?deathContinent as ?s)
        }
        UNION 
        {   ?workscreation <http://www.cidoc-crm.org/cidoc-crm/P14_carried_out_by> ?person .
    		OPTIONAL {
			    ?workscreation <http://www.cidoc-crm.org/cidoc-crm/P14_carried_out_by> ?p2 .
    		}
    		?p2 <http://www.cidoc-crm.org/cidoc-crm/P100i_died_in> ?death .
            ?death <http://www.cidoc-crm.org/cidoc-crm/P7_took_place_at> ?deathPlace .
            ?deathPlace <http://www.cidoc-crm.org/cidoc-crm/P89_falls_within> ?deathCountry .
            ?deathCountry ?p ?o.
            BIND(?deathCountry as ?s)
        }
        UNION
        {   ?workscreation <http://www.cidoc-crm.org/cidoc-crm/P14_carried_out_by> ?person .
    		OPTIONAL {
			    ?workscreation <http://www.cidoc-crm.org/cidoc-crm/P14_carried_out_by> ?p2 .
    		}
    		?p2 <http://www.cidoc-crm.org/cidoc-crm/P74_has_current_or_former_residence> ?nationality .
            ?nationality ?p ?o .
            BIND(?nationality as ?s) 
        }
		UNION
        {   ?workscreation <http://www.cidoc-crm.org/cidoc-crm/P14_carried_out_by> ?person .
    		OPTIONAL {
			    ?workscreation <http://www.cidoc-crm.org/cidoc-crm/P14_carried_out_by> ?p2 .
    		}
    		?p2 <http://www.cidoc-crm.org/cidoc-crm/P74_has_current_or_former_residence> ?nationality .
            ?nationality crm:P89_falls_within ?Continent .
			?Continent ?p ?o .
			BIND(?Continent as ?s) 
        }
        FILTER (?person = <`+id+`>)
        BIND ( <default> AS ?g)
    }`;
    var graph = await getJSONLD( q, "raw" );
    return graph;
}

async function getWork( id ) {
    var q = namespaces+`SELECT DISTINCT ?s ?p ?o ?g WHERE {
		{ ?work ?p ?o .
			BIND(?work as ?s)
		}
		UNION
		{ ?work <http://iflastandards.info/ns/lrm/lrmoo/R16i_was_created_by> ?workscreation .
			?workscreation ?p ?o .
			BIND(?workscreation AS ?s)
		}
		UNION 
		{ ?work <http://iflastandards.info/ns/lrm/lrmoo/R16i_was_created_by> ?workscreation .
			?workscreation crm:P14_carried_out_by ?author .
			?author ?p ?o .
			BIND(?author as ?s)
		}
		UNION
        {   ?work <http://iflastandards.info/ns/lrm/lrmoo/R16i_was_created_by> ?workscreation .
 		    ?workscreation a <http://iflastandards.info/ns/lrm/lrmoo/F27_Work_Creation> .
		    ?workscreation crm:P4_has_time-span ?workscreationdate .
			?workscreationdate ?p ?o .
			BIND (?workscreationdate AS ?s)
		}
		UNION
		{ ?work <http://iflastandards.info/ns/lrm/lrmoo/R16i_was_created_by> ?workscreation .
			?workscreation crm:P14_carried_out_by ?author .
			?author <http://www.cidoc-crm.org/cidoc-crm/P74_has_current_or_former_residence> ?nationality .
			?nationality ?p ?o .
			BIND(?nationality as ?s) 
		}
        UNION 
        {   ?work <http://iflastandards.info/ns/lrm/lrmoo/R16i_was_created_by> ?workscreation .
    		?workscreation crm:P14_carried_out_by ?author .
 			?author <http://www.cidoc-crm.org/cidoc-crm/P74_has_current_or_former_residence> ?nationality .
            ?nationality <http://www.cidoc-crm.org/cidoc-crm/P89_falls_within> ?Continent .
            ?Continent ?p ?o.
            BIND(?Continent as ?s)
        }
		UNION
		{ 	?work <http://iflastandards.info/ns/lrm/lrmoo/R3_is_realised_in> ?expr .
			?expr ?p ?o .
			BIND(?expr as ?s)
		}
		UNION
		{ 	?work <http://iflastandards.info/ns/lrm/lrmoo/R3_is_realised_in> ?expr .
			?expr crm:P2_has_type ?type .
			?type ?p ?o .
			BIND(?type as ?s)
		}
		UNION
		{ 	?work <http://iflastandards.info/ns/lrm/lrmoo/R3_is_realised_in> ?expr .
			?expr crm:P72_has_language ?lang .
			?lang ?p ?o .
			BIND(?lang as ?s)
		}
		UNION
		{ 	?work <http://iflastandards.info/ns/lrm/lrmoo/R3_is_realised_in> ?expr .
			?expr lrmoo:R15_has_fragment ?excerpt.
			?excerpt ?p ?o .
			BIND(?excerpt as ?s)
		}
		UNION
		{ 	?work <http://iflastandards.info/ns/lrm/lrmoo/R3_is_realised_in> ?expr .
			?expr lrmoo:R4i_is_embodied_in ?manifestation.
			?manifestation ?p ?o .
			BIND(?manifestation as ?s)
		}
		FILTER (?work = <`+id+`>)
		BIND ( <default> AS ?g)
	}`;
    var graph = await getJSONLD( q, "raw" );
    return graph;
}

// ============================================================================
// OntoPoetry structure view (Text-As-Graph) — WP-A
// Renders a poem's POSTDATA/OntoPoetry encoding (stanza > line; words on demand
// in later WPs) as a reading-order graph, in its own Cytoscape instance, lazily
// when its "Structure" tab is first shown. Reuses SPARQL_RPPA + the loaded
// cytoscape stack; intentionally decoupled from the entity graph (`cy`).
// ============================================================================
var opCY = {};  // per-text cytoscape instances, keyed by textURI

// Poem structure query: explicit back-links + numbers (pdp:stanzaList / isLineOf /
// stanzaNumber / relativeLineNumber) so we never traverse the rdf:List blank nodes.
function opStructureQuery( textURI ) {
    // Traverse the text's rdf:List collections (stanzaList -> stanzas -> each stanza's
    // lineList -> lines). This works for full texts AND excerpts/fragments (excerpts
    // omit pdp:stanzaNumber and the pdp:stanzaList back-link, so we can't key on those).
    // Order is resolved client-side (rdf:List order isn't recoverable in plain SPARQL).
    return `PREFIX pdp: <http://postdata.linhd.uned.es/ontology/postdata-poeticAnalysis#>
PREFIX pdc: <http://postdata.linhd.uned.es/ontology/postdata-core#>
PREFIX skos: <http://www.w3.org/2004/02/skos/core#>
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
SELECT ?stanza ?snum ?srhyme ?disp ?displabel ?mtype ?mtypelabel ?line ?lnum ?ltext ?rhyme ?syll ?stress WHERE {
  <`+textURI+`> pdp:hasStanzaList ?slist .
  ?slist pdp:stanza/rdf:rest*/rdf:first ?stanza .
  ?stanza pdp:hasLineList ?sll .
  ?sll pdp:line/rdf:rest*/rdf:first ?line .
  ?line pdp:relativeLineNumber ?lnum ; pdc:text ?ltext .
  OPTIONAL { ?stanza pdp:stanzaNumber ?snum }
  OPTIONAL { ?stanza pdp:hasStanzaPattern ?sp .
    OPTIONAL { ?sp pdp:rhymeScheme ?srhyme }
    OPTIONAL { ?sp pdp:rhymeDispositionType ?disp . OPTIONAL { ?disp skos:prefLabel ?displabel } }
    OPTIONAL { ?sp pdp:metricalType ?mtype . OPTIONAL { ?mtype skos:prefLabel ?mtypelabel } }
  }
  OPTIONAL { ?line pdp:hasRhyme ?rh . ?rh pdp:rhymeLabel ?rhyme . }
  OPTIONAL { ?line pdp:hasLinePattern ?lp .
    OPTIONAL { ?lp pdp:syllabicMetricalScheme ?syll }
    OPTIONAL { ?lp pdp:altPatterningMetricalScheme ?stress }
  }
}`;
}

// Lightweight SPARQL SELECT -> raw bindings. (getJSONLD can't be reused: it builds
// N-Quads from ?s/?p/?o unconditionally and would throw on these column names.)
function opFetch( query ) {
    return new Promise( function( resolve ) {
        $.ajax({ type: "POST", url: SPARQL_RPPA+"sparql", data: { query: query },
            headers: { Accept: "application/json" } })
        .done( function( result ) { resolve( ( result.results && result.results.bindings ) || [] ); } )
        .fail( function( err ) { console.log( "OntoPoetry query failed", err ); resolve( [] ); } );
    });
}

var OP_PALETTE = ['#cd6711','#0081A7','#2C6E49','#82204A','#974B0C','#7B1E7A','#1E3888','#754043','#09814A','#AA1155','#511730','#4A5859'];

function opLastSeg( uri ) { return uri.split( /[\/#]/ ).pop(); }

// assign a stable colour to each distinct rhyme label (poem-local)
function opRhymeColours( labels ) {
    var map = {}, i = 0;
    labels.forEach( function( l ) { if ( l && !( l in map ) ) { map[ l ] = OP_PALETTE[ i % OP_PALETTE.length ]; i++; } } );
    return map;
}

function opSafe( id ) { return id.replace( /[^a-zA-Z0-9]/g, '_' ); }

// numeric suffix of an instance URI fragment (e.g. ...#pbrp-l02640 -> 2640),
// used to recover document order when stanzaNumber is absent (excerpts)
function opIdNum( uri ) { var m = String( uri ).split( '#' ).pop().match( /(\d+)$/ ); return m ? parseInt( m[ 1 ], 10 ) : 0; }

// Convert a stored metrical scheme (@met, e.g. "-+|-+|-+|-+|-+/") to the ECEP
// scansion convention from encodingDesc.xml: ˘ unstressed, ′ stressed, | foot
// boundary, || caesura, / line boundary. Also derives a metre name (e.g. "iambic
// pentameter") when the feet are regular. Returns { marks, name }.
var OP_BREVE = '˘', OP_ICTUS = '′';
var OP_FEET = {};
OP_FEET[ OP_BREVE + OP_ICTUS ] = 'iambic';
OP_FEET[ OP_ICTUS + OP_BREVE ] = 'trochaic';
OP_FEET[ OP_ICTUS + OP_ICTUS ] = 'spondaic';
OP_FEET[ OP_BREVE + OP_BREVE ] = 'pyrrhic';
OP_FEET[ OP_BREVE + OP_BREVE + OP_ICTUS ] = 'anapaestic';
OP_FEET[ OP_ICTUS + OP_BREVE + OP_BREVE ] = 'dactylic';
OP_FEET[ OP_BREVE + OP_ICTUS + OP_BREVE ] = 'amphibrachic';
var OP_FOOTCOUNT = [ '', 'monometer', 'dimeter', 'trimeter', 'tetrameter', 'pentameter', 'hexameter', 'heptameter', 'octameter' ];
function opScansion( met ) {
    if ( !met ) return { marks: '', name: '' };
    var marks = String( met ).replace( /\+/g, OP_ICTUS ).replace( /-/g, OP_BREVE );
    var feet = marks.split( '/' )[ 0 ].split( '|' )
        .map( function( f ) { return f.replace( new RegExp( '[^' + OP_BREVE + OP_ICTUS + ']', 'g' ), '' ); } )
        .filter( Boolean );
    var name = '';
    if ( feet.length ) {
        var t0 = OP_FEET[ feet[ 0 ] ];
        if ( t0 && feet.every( function( f ) { return OP_FEET[ f ] === t0; } ) ) {
            name = t0 + ' ' + ( OP_FOOTCOUNT[ feet.length ] || ( feet.length + '-foot' ) );
        }
    }
    return { marks: marks, name: name };
}

// Render the poem column at natural size (readable line width), centred
// horizontally and aligned to the top; long poems scroll vertically. Fitting to
// height instead shrank tall poems to a thin strip.
function opFitColumn( cyInst ) {
    var nodes = cyInst.nodes( '.op-line, .op-stanza, .op-text' );
    if ( !nodes.length ) return;
    var w = cyInst.width() || 800;
    cyInst.zoom( 1 );
    var bb = nodes.boundingBox();                 // model == screen units at zoom 1
    cyInst.pan({ x: ( w - bb.w ) / 2 - bb.x1, y: 50 - bb.y1 } );
}

// WP-C: a line's content (words AND punctuation) in reading order, via the
// rppa:hasContentList rdf:Seq (rdf:_N members). Note: rppa: is the https namespace
// in the store. tei:c spacing nodes carry no pdc:text and are filtered out.
function opContentQuery( lineURI ) {
    return `PREFIX rppa: <https://www.romanticperiodpoetry.org/rppa/>
PREFIX pdp: <http://postdata.linhd.uned.es/ontology/postdata-poeticAnalysis#>
PREFIX pdc: <http://postdata.linhd.uned.es/ontology/postdata-core#>
PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
SELECT ?item ?t ?pos ?type WHERE {
  <`+lineURI+`> rppa:hasContentList ?cl .
  ?cl ?member ?item .
  FILTER( STRSTARTS( STR(?member), "http://www.w3.org/1999/02/22-rdf-syntax-ns#_" ) )
  BIND( xsd:integer( STRAFTER( STR(?member), "#_" ) ) AS ?pos )
  ?item pdc:text ?t .
  OPTIONAL { ?item a ?type . FILTER( ?type IN ( pdp:Word, pdp:Punctuation ) ) }
} ORDER BY ?pos`;
}

// build token nodes/edges (words + punctuation, reading order) fanned to the right
// of a line node. Shared by per-line expand and expand-all.
function opBuildTokens( lid, rows, pos ) {
    var cls = 'w-of-' + opSafe( lid ), add = [], prev = lid, x = pos.x + 260, first = true;
    rows.forEach( function( v ) {
        var iid = v.item.value, isPunct = !!( v.type && /Punctuation$/.test( v.type.value ) );
        // step BEFORE placing: small step into a punctuation mark so it hugs the
        // preceding word; normal step into a word.
        if ( !first ) { x += isPunct ? 30 : 74; }
        first = false;
        add.push({ group: 'nodes', classes: ( isPunct ? 'op-punct' : 'op-word' ) + ' op-tok ' + cls,
            data: { id: iid, type: isPunct ? 'op-punct' : 'op-word', label: ( v.t.value || '' ).trim(), ofLine: lid },
            position: { x: x, y: pos.y } });
        add.push({ group: 'edges', classes: 'op-flow ' + cls,
            data: { id: 'wf-' + opSafe( prev ) + '-' + opSafe( iid ), source: prev, target: iid } });
        prev = iid;
    } );
    return add;
}

async function opExpandLine( cyInst, lineNode ) {
    if ( lineNode.data( 'expanded' ) ) return;
    var lid = lineNode.id();
    var rows = await opFetch( opContentQuery( lid ) );
    if ( !rows.length ) return;
    cyInst.add( opBuildTokens( lid, rows, lineNode.position() ) );
    lineNode.data( 'expanded', true );
}

// whole-poem content (all lines' words + punctuation) in ONE query, for expand-all
function opPoemContentQuery( textURI ) {
    return `PREFIX rppa: <https://www.romanticperiodpoetry.org/rppa/>
PREFIX pdp: <http://postdata.linhd.uned.es/ontology/postdata-poeticAnalysis#>
PREFIX pdc: <http://postdata.linhd.uned.es/ontology/postdata-core#>
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
SELECT ?line ?item ?t ?pos ?type WHERE {
  <`+textURI+`> pdp:hasStanzaList ?sl .
  ?sl pdp:stanza/rdf:rest*/rdf:first ?stanza .
  ?stanza pdp:hasLineList ?ll .
  ?ll pdp:line/rdf:rest*/rdf:first ?line .
  ?line rppa:hasContentList ?cl .
  ?cl ?member ?item .
  FILTER( STRSTARTS( STR(?member), "http://www.w3.org/1999/02/22-rdf-syntax-ns#_" ) )
  BIND( xsd:integer( STRAFTER( STR(?member), "#_" ) ) AS ?pos )
  ?item pdc:text ?t .
  OPTIONAL { ?item a ?type . FILTER( ?type IN ( pdp:Word, pdp:Punctuation ) ) }
}`;
}

async function opExpandAll( cyInst, textURI ) {
    var rows = await opFetch( opPoemContentQuery( textURI ) );
    if ( !rows.length ) return;
    var byLine = {};
    rows.forEach( function( v ) { ( byLine[ v.line.value ] = byLine[ v.line.value ] || [] ).push( v ); } );
    var add = [];
    Object.keys( byLine ).forEach( function( lid ) {
        var ln = cyInst.getElementById( lid );
        if ( !ln || !ln.length || ln.data( 'expanded' ) ) return;
        var items = byLine[ lid ].sort( function( a, b ) { return parseInt( a.pos.value ) - parseInt( b.pos.value ); } );
        add = add.concat( opBuildTokens( lid, items, ln.position() ) );
        ln.data( 'expanded', true );
    } );
    if ( add.length ) cyInst.add( add );
}

function opCollapseAll( cyInst ) {
    cyInst.remove( '.op-tok' );
    cyInst.nodes( '.op-line' ).data( 'expanded', false );
}

function opCollapseLine( cyInst, lineNode ) {
    cyInst.remove( '.w-of-' + opSafe( lineNode.id() ) );
    lineNode.data( 'expanded', false );
}

function opFocusRhyme( cyInst, rh ) {
    cyInst.elements().removeClass( 'op-dim op-focus' );
    var lines = cyInst.nodes( '.op-line' );
    var keep = lines.filter( function( n ) { return n.data( 'rhyme' ) === rh; } );
    // dim the OTHER lines + all rhyme arcs; leave stanza frames + kept lines readable
    lines.not( keep ).addClass( 'op-dim' );
    cyInst.edges( '.op-rhyme' ).addClass( 'op-dim' );
    keep.addClass( 'op-focus' );
    keep.connectedEdges( '.op-rhyme' ).removeClass( 'op-dim' );
}
function opClearFocus( cyInst ) { cyInst.elements().removeClass( 'op-dim op-focus' ); }

// ───────────────────────────────────────────────────────────────────────────
// WP-D (read): overlay EXISTING contexts onto the line/word/stanza nodes they
// target. Two INTRO patterns share the INT1_Passage anchor (verified live):
//   • INT3_Interrelation (inter-/intratextual): ?passage R24i_isRelatedEntity ?rel
//   • INT2_ActualizationOfFeature (typological): ?act R18i_actualizationFoundOn ?passage
// Passage as:items members ARE the structure node ids (work-qualified, identity).
// dcterms:format lct:txt drops image/audio targets.
// ───────────────────────────────────────────────────────────────────────────
function opContextsQuery( textURI ) {
    var tid = opLastSeg( textURI );
    return `PREFIX intro: <https://w3id.org/lso/intro/beta202408#>
PREFIX oa: <http://www.w3.org/ns/oa#>
PREFIX as: <http://www.w3.org/ns/activitystreams#>
PREFIX dcterms: <http://purl.org/dc/terms/>
PREFIX skos: <http://www.w3.org/2004/02/skos/core#>
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
SELECT ?node ?kind ?role ?ctx ?ctxLabel ?contextuality ?typeLabel ?featureLabel ?body WHERE {
  ?passage a intro:INT1_Passage ;
           dcterms:format <http://id.loc.gov/vocabulary/resourceTypes/txt> ;
           intro:R41_hasLocation [ a oa:Composite ; as:items ?list ] .
  ?list rdf:rest*/rdf:first ?node .
  # token/line/stanza targets ("/tid#frag") AND whole-poem targets (bare ".../tid")
  FILTER( CONTAINS( STR(?node), "/`+tid+`#" ) || STRENDS( STR(?node), "/`+tid+`" ) )
  {
    ?passage intro:R24i_isRelatedEntity ?rel . ?rel a intro:INT3_Interrelation .
    BIND( "interrelation" AS ?kind )
    OPTIONAL { ?rel intro:R19_hasType/skos:prefLabel ?typeLabel }
    OPTIONAL { ?rel oa:hasBody [ rdf:value ?body ] }
    OPTIONAL { ?rel intro:R13_hasReferringEntity ?passage . BIND( "target"  AS ?role ) }
    OPTIONAL { ?rel intro:R12_hasReferredToEntity ?passage . BIND( "context" AS ?role ) }
  } UNION {
    ?rel intro:R18i_actualizationFoundOn ?passage . ?rel a intro:INT2_ActualizationOfFeature .
    BIND( "actualization" AS ?kind ) BIND( "target" AS ?role )
    OPTIONAL { ?rel intro:R17_actualizesFeature/skos:prefLabel ?featureLabel }
  }
  OPTIONAL { ?ctx intro:R21_identifies ?rel ; skos:prefLabel ?ctxLabel .
             OPTIONAL { ?ctx rdfs:isDefinedBy ?contextuality } }
}`;
}

// contextuality category -> colour (generic; categories beyond the canonical few
// fall back to grey). Typological actualizations are coloured by their kind.
var OP_CTX_COL = {
    intertextual: '#82204A', intratextual: '#0081A7', infratextual: '#2C6E49',
    paratextual: '#974B0C', typological: '#7B1E7A'
};
function opCtxCategory( e ) {
    if ( e.kind === 'actualization' ) return e.contextuality || 'typological';
    return e.contextuality || 'interrelation';
}
function opCtxColour( e ) { return OP_CTX_COL[ opCtxCategory( e ) ] || '#6c757d'; }

// the site brand orange (--bs-orange), resolved for canvas use; matches the toolbar
// buttons. Category is still conveyed by text/badges in the chooser.
function opOrange() {
    try { var v = getComputedStyle( document.documentElement ).getPropertyValue( '--bs-orange' ).trim(); return v || '#fd7e14'; }
    catch ( e ) { return '#fd7e14'; }
}

// one display row for a context, deduped per context URI
function opCtxParse( v ) {
    return {
        node: v.node.value,
        ctx:  v.ctx ? v.ctx.value : ( v.node.value ),   // fall back to node if context wrapper absent
        ctxLabel: ( v.ctxLabel && v.ctxLabel.value.trim() ) || '(untitled context)',
        kind: v.kind ? v.kind.value : '',
        role: v.role ? v.role.value : '',
        contextuality: v.contextuality ? opLastSeg( v.contextuality.value ) : '',
        typeLabel: v.typeLabel ? v.typeLabel.value.trim() : '',
        featureLabel: v.featureLabel ? v.featureLabel.value.trim() : '',
        body: v.body ? v.body.value : ''
    };
}

// Fetch contexts + the word->line map (for roll-up), group by node URI deduped on
// context, and stash on the instance. Returns the grouped map.
async function opLoadContexts( cyInst, textURI ) {
    if ( cyInst.scratch( '_opCtx' ) ) return cyInst.scratch( '_opCtx' );
    var rows = await opFetch( opContextsQuery( textURI ) );
    var lineRows = await opFetch( opPoemContentQuery( textURI ) );
    var lineOfWord = {};
    lineRows.forEach( function( v ) { lineOfWord[ v.item.value ] = v.line.value; } );
    // group: byNode[ nodeURI ] = { ctxURI: entry }. Canonicalise both whole-poem
    // target forms (bare ".../tid" and root ".../tid#tid") onto the Text-root id
    // (== textURI), so they anchor to the synthetic "whole poem" node.
    var byNode = {}, byCtx = {}, rootFrag = textURI + '#' + opLastSeg( textURI );
    rows.forEach( function( v ) {
        var e = opCtxParse( v );
        if ( e.node === textURI || e.node === rootFrag ) e.node = textURI;
        ( byNode[ e.node ] = byNode[ e.node ] || {} )[ e.ctx ] = e;
        ( byCtx[ e.ctx ] = byCtx[ e.ctx ] || {} )[ e.node ] = true;   // context -> its node ids (for the weave)
    } );
    var data = { byNode: byNode, byCtx: byCtx, lineOfWord: lineOfWord };
    cyInst.scratch( '_opCtx', data );
    return data;
}

// contexts attached to a node id, rolled up: a line also shows its (collapsed)
// words' contexts; stanzas/words/text-root show only their own. Returns entry[].
function opCtxFor( cyInst, nodeId ) {
    var data = cyInst.scratch( '_opCtx' ); if ( !data ) return [];
    var merged = {};
    if ( data.byNode[ nodeId ] ) Object.keys( data.byNode[ nodeId ] ).forEach( function( k ) { merged[ k ] = data.byNode[ nodeId ][ k ]; } );
    var n = cyInst.getElementById( nodeId );
    if ( n && n.length && n.hasClass( 'op-line' ) ) {
        // roll up any word/punct contexts of this line that aren't currently shown
        Object.keys( data.lineOfWord ).forEach( function( w ) {
            if ( data.lineOfWord[ w ] === nodeId && data.byNode[ w ] ) {
                var wn = cyInst.getElementById( w );
                if ( !wn || !wn.length ) {   // word not expanded -> roll its contexts onto the line
                    Object.keys( data.byNode[ w ] ).forEach( function( k ) { merged[ k ] = data.byNode[ w ][ k ]; } );
                }
            }
        } );
    }
    return Object.keys( merged ).map( function( k ) { return merged[ k ]; } );
}

// place a count marker at the top-right corner of every node carrying contexts
function opRenderContextMarkers( cyInst ) {
    opClearContextMarkers( cyInst );
    var add = [], orange = opOrange();
    cyInst.nodes( '.op-line, .op-stanza, .op-word, .op-punct, .op-text' ).forEach( function( n ) {
        var ctxs = opCtxFor( cyInst, n.id() );
        if ( !ctxs.length ) return;
        var bb = n.boundingBox();
        add.push({ group: 'nodes', classes: 'op-ctx',
            data: { id: 'ctxm-' + opSafe( n.id() ), label: String( ctxs.length ),
                    forNode: n.id(), ctxcol: orange },
            position: { x: bb.x2 - 4, y: bb.y1 + 4 } });
    } );
    if ( add.length ) cyInst.add( add ).ungrabify();   // markers ride their target; don't drag the circle itself
}
function opClearContextMarkers( cyInst ) { cyInst.remove( '.op-ctx' ); }

// keep each marker pinned to its target node's corner (markers are free nodes, not
// children, so they must be repositioned when the target moves — e.g. on drag)
function opRepositionMarkers( cyInst ) {
    cyInst.nodes( '.op-ctx' ).forEach( function( m ) {
        var n = cyInst.getElementById( m.data( 'forNode' ) );
        if ( n && n.length ) { var bb = n.boundingBox(); m.position( { x: bb.x2 - 4, y: bb.y1 + 4 } ); }
    } );
}

// the VISIBLE structure nodes a context touches: the node itself, or (for a
// collapsed word) its line, or the Text-root for whole-poem. Returns a collection.
function opWeaveNodes( cyInst, ctxURI ) {
    var data = cyInst.scratch( '_opCtx' ); if ( !data || !data.byCtx[ ctxURI ] ) return cyInst.collection();
    var col = cyInst.collection();
    Object.keys( data.byCtx[ ctxURI ] ).forEach( function( nodeURI ) {
        var n = cyInst.getElementById( nodeURI );
        if ( n && n.length ) { col = col.union( n ); return; }
        var lid = data.lineOfWord[ nodeURI ];                 // collapsed word -> its line
        if ( lid ) { var ln = cyInst.getElementById( lid ); if ( ln && ln.length ) col = col.union( ln ); }
    } );
    return col;
}

// Draw a bubbleset around each given context's passages (+ highlight the member
// nodes), so a multi-passage context reads as one span. Single-node contexts get
// the highlight only. No-op if the bubblesets plugin isn't loaded.
function opShowWeave( cyInst, ctxURIs ) {
    opClearWeave( cyInst );
    var BS = ( typeof CytoscapeBubbleSets !== 'undefined' && CytoscapeBubbleSets.BubbleSetsPlugin );
    var bb = null;
    if ( BS ) {
        bb = cyInst.scratch( '_opBB' );
        if ( !bb ) { try { bb = new BS( cyInst ); cyInst.scratch( '_opBB', bb ); } catch ( e ) { bb = null; } }
    }
    var orange = opOrange(), paths = [];
    ctxURIs.forEach( function( ctx ) {
        var nodes = opWeaveNodes( cyInst, ctx );
        if ( !nodes.length ) return;
        nodes.addClass( 'op-weave' );
        if ( nodes.length < 2 || !bb ) return;                // single node, or no plugin: highlight only
        try {
            paths.push( bb.addPath( nodes, null, null, {
                virtualEdges: true,
                style: { fill: orange, fillOpacity: '0.10', stroke: orange, 'strokeWidth': '2', strokeOpacity: '0.85' }
            } ) );
        } catch ( e ) {}
    } );
    cyInst.scratch( '_opWeavePaths', paths );
}
function opClearWeave( cyInst ) {
    var bb = cyInst.scratch( '_opBB' ), paths = cyInst.scratch( '_opWeavePaths' ) || [];
    paths.forEach( function( p ) { try { if ( bb ) bb.removePath( p ); } catch ( e ) {} } );
    cyInst.scratch( '_opWeavePaths', [] );
    cyInst.nodes( '.op-weave' ).removeClass( 'op-weave' );
}

// open a single context in the existing context-card overlay (same path the
// entity graph uses on a context-node tap)
function opOpenContext( ctxURI ) {
    try {
        display_context( ctxURI );
        var m = ctxURI.match( /.*?\/id\/(.*?)$/ );
        if ( m ) history.replaceState( null, null, '#context/' + m[ 1 ] );
    } catch ( e ) { console.log( 'OntoPoetry: cannot open context', ctxURI, e ); }
}

// contexts whose target node is NOT rendered (whole-poem #textNNNNN, higher-level
// divs, etc.) — surfaced as a poem-level bucket rather than dropped silently.
function opUnmatchedContexts( cyInst ) {
    var data = cyInst.scratch( '_opCtx' ); if ( !data ) return [];
    var merged = {};
    Object.keys( data.byNode ).forEach( function( nodeURI ) {
        var n = cyInst.getElementById( nodeURI );
        if ( ( n && n.length ) || data.lineOfWord[ nodeURI ] ) return;   // shown as a node, or rolls up to a line
        Object.keys( data.byNode[ nodeURI ] ).forEach( function( k ) { merged[ k ] = data.byNode[ nodeURI ][ k ]; } );
    } );
    return Object.keys( merged ).map( function( k ) { return merged[ k ]; } );
}

function opCtxRowsHTML( entries ) {
    return entries.map( function( e ) {
        var badge = e.featureLabel || e.typeLabel || '';
        var cat = opCtxCategory( e );
        return `<div class="op-ctx-row" data-ctx="${ e.ctx }" style="cursor:pointer;padding:4px 8px;border-bottom:1px solid rgba(128,128,128,.2);">
            <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${ opCtxColour( e ) };margin-right:6px;"></span>
            <strong>${ e.ctxLabel }</strong>${ badge ? ` <span class="badge" style="background:${ opCtxColour( e ) };">${ badge }</span>` : '' }
            <span class="text-muted" style="font-size:11px;"> ${ cat }${ e.role ? ' · ' + e.role : '' }</span>
        </div>`;
    } ).join( '' );
}

// render a context list popup at (left,top) within $host; clicking a row opens it
function opShowCtxPopup( $host, entries, left, top ) {
    $host.find( '.op-ctx-pop' ).remove();
    if ( $host.css( 'position' ) === 'static' ) $host.css( 'position', 'relative' );
    var $pop = $( `<div class="op-ctx-pop" style="position:absolute;z-index:10000;left:${ left }px;top:${ top }px;max-width:340px;max-height:280px;overflow:auto;background:var(--bs-body-bg,#fff);border:1px solid rgba(128,128,128,.5);border-radius:6px;box-shadow:0 4px 16px rgba(0,0,0,.2);font-size:13px;">${ opCtxRowsHTML( entries ) }</div>` );
    $host.append( $pop );
    $pop.on( 'click', '.op-ctx-row', function() { opOpenContext( $( this ).data( 'ctx' ) ); $pop.remove(); } );
    setTimeout( function() { $( document ).one( 'click', function() { $pop.remove(); } ); }, 0 );
}

// marker tap: 1 context -> open it; >1 -> a chooser anchored at the marker
function opContextChooser( $container, cyInst, markerNode ) {
    var ctxs = opCtxFor( cyInst, markerNode.data( 'forNode' ) );
    if ( !ctxs.length ) return;
    if ( ctxs.length === 1 ) { opOpenContext( ctxs[ 0 ].ctx ); return; }
    var $host = $container.parent(), rp = markerNode.renderedPosition();
    var cr = cyInst.container().getBoundingClientRect(), hr = $host[ 0 ].getBoundingClientRect();
    opShowCtxPopup( $host, ctxs, ( cr.left - hr.left ) + rp.x + 8, ( cr.top - hr.top ) + rp.y );
}

// WP-D (write): a node the user right-clicked "+" on, to be pre-filled as a Contribute
// target anchor at step 2. Survives the step1->step2 hash change (step 1 resets bbs_text).
var opPendingAnchor = null;

// WP-D: contribution on-ramp — right-click any structure node (line, word, punctuation,
// stanza, whole-poem) to start a context anchored there.
function opAddContextMenu( cyInst, tid ) {
    try {
        cyInst.cxtmenu({
            selector: 'node.op-line, node.op-word, node.op-punct, node.op-stanza, node.op-text',
            // cxtmenu computes r = nodeWidth/2 + menuRadius; for normal nodes we cancel the
            // width term to get a constant ~60px radius. Compound parents (stanza / whole-poem)
            // report width=1 to cxtmenu's radius calc, so the cancellation would yield a large
            // NEGATIVE r (circle vanishes, only the "+" shows) — use a flat radius for them.
            menuRadius: function( ele ) { return ele.isParent() ? 60 : ( 60 - ele.renderedOuterWidth() / 2 ); },
            commands: [ {
                content: '<i class="fas fa-plus-circle"></i>',
                select: function( ele ) {
                    var loggedIn = ( typeof user !== 'undefined' && user ) || ( typeof username !== 'undefined' && username );
                    if ( !loggedIn ) { alert( 'Please log in to contribute a context.' ); return; }
                    // stash the clicked node's fragment; step 2 will pre-fill it as the target
                    opPendingAnchor = { tid: tid, frag: opLastSeg( ele.id() ) };
                    location.hash = '#contribute/1/' + tid;
                },
                enabled: true
            } ],
            fillColor: 'rgba(42,157,143,0.85)',
            activeFillColor: 'rgba(198,120,54,0.85)',
            activePadding: 20,
            indicatorSize: 24,
            separatorWidth: 3,
            spotlightPadding: 4,
            adaptativeNodeSpotlightRadius: false,   // don't scale the menu to the big line node
            minSpotlightRadius: 12,
            maxSpotlightRadius: 24,
            openMenuEvents: 'cxttapstart taphold',
            itemColor: '#fff',
            zIndex: 9999
        });
    } catch ( e ) { console.log( 'OntoPoetry: cxtmenu unavailable', e ); }
}

// WP-D (write): consume a pending "+" anchor at Contribute step 2 — synthesise the
// clicked structure node as a pre-selected TEXT anchor by reusing the SAME machinery
// as a manual text selection (createW3Canno -> processW3Canno -> bbs_text). Called at
// the end of each *_step2 builder, after the linear text has been rendered.
function opApplyPendingAnchor() {
    if ( !opPendingAnchor ) return;
    var frag = opPendingAnchor.frag;
    opPendingAnchor = null;                                       // consume once
    var scope = $( '.globaltext-workbench' ).length ? $( '.globaltext-workbench' ) : $( document );
    var $el = scope.find( jq( frag ) ).first();
    if ( !$el.length ) { console.log( 'OntoPoetry: pre-fill anchor not found in text', frag ); return; }
    // derive the same isPartOf metadata the manual selection reads off the DOM
    var $expr = $el.closest( 'div[data-expr]' );
    var obj_id = $expr.attr( 'id' ), work = $expr.data( 'id' ), expr = $expr.data( 'expr' );
    var digo = $el.closest( 'div[data-digo]' ).data( 'digo' );
    var tid  = $el.closest( '.text' ).attr( 'id' );
    if ( typeof createW3Canno !== 'function' ) return;
    createW3Canno( '', [ frag ], obj_id, digo, work, expr, $( '<a>' ).attr( 'data-id', obj_id ).attr( 'data-tid', tid ) );
}

function opIsDark( themeVal ) {
    if ( themeVal ) return themeVal === 'dark';
    return ( typeof document !== 'undefined' && document.documentElement.getAttribute( 'data-bs-theme' ) === 'dark' );
}

// re-apply the structure stylesheet to every open instance when the site theme
// toggles (node bg/text colours are theme-dependent and otherwise stay stale)
function opRetheme( themeVal ) {
    Object.keys( opCY ).forEach( function( k ) {
        var c = opCY[ k ];
        if ( c && c.style ) { try { c.style().fromJson( opStyle( themeVal ) ).update(); } catch ( e ) {} }
    } );
}

function opStyle( themeVal ) {
    var dark = opIsDark( themeVal );
    return [
        { selector: 'node.op-line', style: {
            'shape': 'round-rectangle',
            'label': 'data(label)',
            'text-wrap': 'wrap', 'text-max-width': 360,
            'text-valign': 'center', 'text-halign': 'center',
            'width': 'label', 'height': 'label', 'padding': '6px',
            'font-size': '13px', 'font-family': 'Georgia, serif',
            'background-color': dark ? '#222' : '#fff',
            'border-width': 2, 'border-color': 'data(rhymecol)',
            'color': dark ? '#eee' : '#222'
        } },
        // metre toggle: swap label to include the stress/syllable ribbon
        { selector: 'node.op-line.op-metre', style: { 'label': 'data(labelMetre)' } },
        // metrical deviation (line whose syllable count differs from the poem's mode)
        { selector: 'node.op-line.op-dev', style: { 'border-style': 'double', 'border-width': 5 } },
        { selector: 'node.op-stanza', style: {
            'shape': 'round-rectangle',
            'label': 'data(label)',
            'text-valign': 'top', 'text-halign': 'center',
            'font-size': '12px', 'font-family': 'system-ui', 'font-style': 'italic',
            'color': dark ? '#bbb' : '#666',
            'background-opacity': 0.06, 'background-color': '#0081A7',
            'border-width': 1, 'border-style': 'dashed', 'border-color': '#90A583',
            'padding': '12px'
        } },
        // synthetic Text-root ("whole poem") node: a compound box wrapping all stanzas,
        // labelled at the top; the anchor for whole-poem context markers
        { selector: 'node.op-text', style: {
            'shape': 'round-rectangle', 'label': 'data(label)',
            'text-valign': 'top', 'text-halign': 'center', 'text-margin-y': -4,
            'font-size': '12px', 'font-family': 'system-ui', 'font-style': 'italic', 'font-weight': 'bold',
            'color': dark ? '#e0a06a' : '#974B0C',
            'background-opacity': 0.04, 'background-color': '#cd6711',
            'border-width': 2, 'border-style': 'dashed', 'border-color': '#cd6711', 'padding': '16px'
        } },
        // rhyme-weave: arcs linking lines that share a rhyme within a stanza
        { selector: 'edge.op-rhyme', style: {
            'curve-style': 'unbundled-bezier',
            'control-point-distances': [ 50 ], 'control-point-weights': [ 0.5 ],
            'line-color': 'data(rhymecol)', 'width': 2, 'opacity': 0.5,
            'target-arrow-shape': 'none', 'source-arrow-shape': 'none'
        } },
        // tap-to-focus dim/highlight
        { selector: '.op-dim', style: { 'opacity': 0.3 } },
        { selector: 'node.op-focus', style: { 'border-width': 5 } },
        // expanded words (WP-C) + reading-order flow
        { selector: 'node.op-word', style: {
            'shape': 'round-rectangle', 'label': 'data(label)',
            'width': 'label', 'height': 'label', 'padding': '4px',
            'font-size': '12px', 'font-family': 'Georgia, serif',
            'background-color': dark ? '#2a2a2a' : '#f7f3ec',
            'border-width': 1, 'border-color': '#9aa0a6', 'color': dark ? '#eee' : '#333'
        } },
        { selector: 'node.op-punct', style: {
            'shape': 'round-rectangle', 'label': 'data(label)',
            'width': 'label', 'height': 'label', 'padding': '3px',
            'font-size': '12px', 'font-family': 'Georgia, serif',
            'background-color': dark ? '#1f1f1f' : '#efece4',
            'border-width': 1, 'border-style': 'dashed', 'border-color': '#c9ccd1', 'color': dark ? '#999' : '#999'
        } },
        // WP-D: context-count marker pinned to a node's top-right corner
        { selector: 'node.op-ctx', style: {
            'shape': 'ellipse', 'label': 'data(label)',
            'width': 18, 'height': 18, 'font-size': '10px', 'font-weight': 'bold',
            'text-valign': 'center', 'text-halign': 'center', 'color': '#fff',
            'background-color': 'data(ctxcol)', 'border-width': 1.5,
            'border-color': dark ? '#111' : '#fff', 'z-index': 20
        } },
        // WP-D: nodes belonging to a hovered context (the weave) get an orange ring
        { selector: 'node.op-weave', style: { 'border-color': '#fd7e14', 'border-width': 4, 'border-style': 'solid' } },
        // hover highlight: last node rule so it overrides line/word/punctuation borders
        { selector: 'node.op-hl', style: { 'border-color': '#fd7e14', 'border-width': 4, 'border-style': 'solid' } },
        { selector: 'edge.op-flow', style: {
            'curve-style': 'bezier', 'width': 1, 'line-color': '#9aa0a6', 'opacity': 0.5,
            'target-arrow-shape': 'vee', 'target-arrow-color': '#9aa0a6', 'arrow-scale': 0.7
        } }
    ];
}

async function renderOntoPoetry( textURI, containerSel ) {
    var rows = await opFetch( opStructureQuery( textURI ) );
    if ( !rows.length ) {
        $( containerSel ).html( `<p class="text-muted" style="padding:1em;">No OntoPoetry structure available for this text (it may be prose or an unanalysed fragment).</p>` );
        return;
    }
    // pass 1: rhyme palette + modal syllable count (for deviation marking)
    var rhymeLabels = [], syllCounts = {};
    rows.forEach( function( v ) {
        if ( v.rhyme ) rhymeLabels.push( v.rhyme.value );
        if ( v.syll ) { syllCounts[ v.syll.value ] = ( syllCounts[ v.syll.value ] || 0 ) + 1; }
    });
    var rcol = opRhymeColours( rhymeLabels );
    var modeSyll = null, best = -1;
    Object.keys( syllCounts ).forEach( function( s ) { if ( syllCounts[ s ] > best ) { best = syllCounts[ s ]; modeSyll = s; } } );

    // pass 2: group rows by stanza and sort in document order (via instance-id
    // numbers, so it works for excerpts that lack stanzaNumber), then lay out as a
    // single reading-order column. Words expand to the RIGHT on tap.
    var byStanza = {}, stanzaArr = [];
    rows.forEach( function( v ) {
        var sId = v.stanza.value;
        if ( !byStanza[ sId ] ) { byStanza[ sId ] = { id: sId, snum: '', srhyme: '', disp: '', mtype: '', lines: [], seen: {} }; stanzaArr.push( byStanza[ sId ] ); }
        var st = byStanza[ sId ];
        if ( v.snum && !st.snum ) st.snum = v.snum.value;
        if ( v.srhyme && !st.srhyme ) st.srhyme = v.srhyme.value;
        if ( !st.disp )  st.disp  = v.displabel ? v.displabel.value : ( v.disp ? opLastSeg( v.disp.value ) : '' );
        if ( !st.mtype ) st.mtype = v.mtypelabel ? v.mtypelabel.value : ( v.mtype ? opLastSeg( v.mtype.value ) : '' );
        if ( !st.seen[ v.line.value ] ) { st.seen[ v.line.value ] = true; st.lines.push( v ); }
    } );
    stanzaArr.forEach( function( st ) {
        st.lines.sort( function( a, b ) { return ( parseInt( a.lnum.value ) || opIdNum( a.line.value ) ) - ( parseInt( b.lnum.value ) || opIdNum( b.line.value ) ); } );
        st.key = Math.min.apply( null, st.lines.map( function( v ) { return opIdNum( v.line.value ); } ) );
    } );
    stanzaArr.sort( function( a, b ) { return a.key - b.key; } );

    var els = [], y = 0;
    stanzaArr.forEach( function( st, si ) {
        var sbits = [];
        if ( st.srhyme ) sbits.push( st.srhyme );
        if ( st.disp )   sbits.push( st.disp );
        if ( st.mtype )  sbits.push( st.mtype );
        els.push({ data: { id: st.id, parent: textURI, type: 'op-stanza',
            label: 'Stanza ' + ( st.snum || ( si + 1 ) ) + ( sbits.length ? '  (' + sbits.join( '; ' ) + ')' : '' ) }, classes: 'op-stanza' });
        if ( si > 0 ) y += 28;  // gap between stanzas
        var rhymeLast = {};
        st.lines.forEach( function( v ) {
            var lId = v.line.value;
            var rhyme = v.rhyme ? v.rhyme.value : '';
            var syll  = v.syll  ? v.syll.value  : '';
            var stress = v.stress ? v.stress.value : '';
            var text  = ( v.ltext.value || '' ).trim();
            var meta = [];
            if ( rhyme ) meta.push( rhyme );
            if ( syll )  meta.push( syll + ' syll' );
            var label = text + ( meta.length ? '\n[' + meta.join( ' · ' ) + ']' : '' );
            var scan = opScansion( stress );
            var metreBits = meta.slice();
            if ( scan.marks ) metreBits.push( scan.marks + ( scan.name ? '  (' + scan.name + ')' : '' ) );
            var labelMetre = text + ( metreBits.length ? '\n[' + metreBits.join( ' · ' ) + ']' : '' );
            var dev = ( syll && modeSyll && syll !== modeSyll );
            els.push({ data: { id: lId, parent: st.id, type: 'op-line',
                label: label, labelMetre: labelMetre,
                rhyme: rhyme, rhymecol: rhyme ? rcol[ rhyme ] : '#9aa0a6', textOnly: text },
                position: { x: 0, y: y },
                classes: 'op-line' + ( rhyme ? ' rhyme-' + rhyme : '' ) + ( dev ? ' op-dev' : '' ) });
            if ( rhyme ) {  // rhyme-weave arc to the previous same-rhyme line in this stanza
                if ( rhymeLast[ rhyme ] ) {
                    els.push({ data: { id: 'arc-' + rhymeLast[ rhyme ] + '-' + lId,
                        source: rhymeLast[ rhyme ], target: lId, rhymecol: rcol[ rhyme ] }, classes: 'op-rhyme' });
                }
                rhymeLast[ rhyme ] = lId;
            }
            y += 56;
        } );
    } );

    // synthetic Text-root node (the "whole poem" in Text->Stanza->Line) — a COMPOUND
    // parent that wraps every stanza (each stanza gets parent:textURI above), so it
    // draws a box around the whole poem. The anchor for whole-poem contexts
    // (translations, SKOS form/genre classifications). Its id IS the textURI so bare
    // whole-poem targets match. No position: a compound's box is derived from children.
    els.push({ data: { id: textURI, type: 'op-text', label: '◆ whole poem' }, classes: 'op-text' });

    if ( opCY[ textURI ] ) { try { opCY[ textURI ].destroy(); } catch(e){} }
    var cyInst = cytoscape({
        container: $( containerSel )[0],
        elements: els,
        layout: { name: 'preset', fit: false },
        style: opStyle(),
        wheelSensitivity: 0.2
    });
    opCY[ textURI ] = cyInst;
    opFitColumn( cyInst );

    // tap a line -> expand/collapse its words (lazy, reading order)
    cyInst.on( 'tap', 'node.op-line', async function( evt ) {
        var n = evt.target;
        if ( n.data( 'expanded' ) ) { opCollapseLine( cyInst, n ); } else { await opExpandLine( cyInst, n ); }
        if ( cyInst.scratch( '_opCtxOn' ) ) opRenderContextMarkers( cyInst );   // word markers + line roll-up follow expand state
    });
    // tap a STANZA box (its label/padding, not a line) -> expand/collapse all its lines
    cyInst.on( 'tap', 'node.op-stanza', async function( evt ) {
        var lines = evt.target.children( '.op-line' );
        if ( !lines.length ) return;
        var allExp = true; lines.forEach( function( n ) { if ( !n.data( 'expanded' ) ) allExp = false; } );
        if ( allExp ) { lines.forEach( function( n ) { opCollapseLine( cyInst, n ); } ); }
        else { var jobs = []; lines.forEach( function( n ) { if ( !n.data( 'expanded' ) ) jobs.push( opExpandLine( cyInst, n ) ); } ); await Promise.all( jobs ); }
        if ( cyInst.scratch( '_opCtxOn' ) ) opRenderContextMarkers( cyInst );
    });
    // tap the WHOLE-POEM box (its label/padding) -> expand all / collapse all
    cyInst.on( 'tap', 'node.op-text', async function( evt ) {
        var lines = cyInst.nodes( '.op-line' );
        if ( !lines.length ) return;
        var allExp = true; lines.forEach( function( n ) { if ( !n.data( 'expanded' ) ) allExp = false; } );
        if ( allExp ) { opCollapseAll( cyInst ); } else { await opExpandAll( cyInst, evt.target.id() ); }
        if ( cyInst.scratch( '_opCtxOn' ) ) opRenderContextMarkers( cyInst );
    });
    // tap a context marker -> open the context (1) or a chooser (>1)
    cyInst.on( 'tap', 'node.op-ctx', function( evt ) {
        evt.stopPropagation && evt.stopPropagation();
        opContextChooser( $( containerSel ), cyInst, evt.target );
    });
    // hover a marker -> weave: outline all passages of its context(s) at once
    cyInst.on( 'mouseover', 'node.op-ctx', function( evt ) {
        opShowWeave( cyInst, opCtxFor( cyInst, evt.target.data( 'forNode' ) ).map( function( e ) { return e.ctx; } ) );
    });
    cyInst.on( 'mouseout', 'node.op-ctx', function() { opClearWeave( cyInst ); });
    // dragging a node (or its compound parent) moves its target box -> keep markers glued
    cyInst.on( 'drag', 'node.op-line, node.op-word, node.op-punct, node.op-stanza, node.op-text', function() {
        if ( cyInst.scratch( '_opCtxOn' ) ) opRepositionMarkers( cyInst );
    });
    // tap background -> collapse words + clear any focus
    cyInst.on( 'tap', function( evt ) {
        if ( evt.target === cyInst ) {
            cyInst.remove( '.op-tok' );
            cyInst.nodes( '.op-line' ).data( 'expanded', false );
            cyInst.elements().removeClass( 'op-dim op-focus' );
            opClearWeave( cyInst );
            if ( cyInst.scratch( '_opCtxOn' ) ) opRenderContextMarkers( cyInst );   // word nodes gone -> roll back to lines
        }
    } );
    // WP-D: right-click a line -> contribution on-ramp
    opAddContextMenu( cyInst, opLastSeg( textURI ) );

    // graph -> text hover highlight (node id minus the "...#" prefix == DOM id)
    cyInst.on( 'mouseover', 'node.op-line, node.op-word, node.op-punct', function( evt ) {
        opTextHL( String( evt.target.id() ).split( '#' ).pop(), true );
    } );
    cyInst.on( 'mouseout', 'node.op-line, node.op-word, node.op-punct', function( evt ) {
        opTextHL( String( evt.target.id() ).split( '#' ).pop(), false );
    } );

    opToolbar( $( containerSel ), cyInst, rcol, modeSyll, textURI );
}

// toolbar: clickable rhyme legend (focus) + metre toggle + guided tour + fit, once above the graph
function opToolbar( $container, cyInst, rcol, modeSyll, textURI ) {
    var $pane = $container.parent();
    if ( $pane.find( '.op-toolbar' ).length ) return;
    opInjectCtrlCSS();
    // text switcher: mirror the right-side Text / Translation tabs
    var texts = opTextList(), wid = $( '.layout_wrapper' ).attr( 'data-wid' ), curTid = ( textURI || '' ).split( '/' ).pop(), switcher = '';
    if ( texts.length > 1 ) {
        var opts = texts.map( function( t ) { return `<option value="${t.tid}"${ t.tid === curTid ? ' selected' : '' }>${t.label}</option>`; } ).join( '' );
        switcher = `<span><strong>View:</strong> <select class="op-textswitch form-select form-select-sm" style="width:auto;display:inline-block;">${opts}</select></span>`;
    }
    var legend = Object.keys( rcol ).map( function( l ) {
        return `<span class="op-leg" data-rhyme="${l}" title="click to highlight this rhyme" style="cursor:pointer;border:2px solid ${rcol[l]};border-radius:4px;padding:0 6px;margin-right:4px;font-family:Georgia,serif;">${l}</span>`;
    } ).join( '' );
    var $bar = $( `<div class="op-toolbar" style="padding:6px 10px 6px 168px;font-size:13px;display:flex;gap:16px;align-items:center;flex-wrap:wrap;border-bottom:1px solid rgba(128,128,128,.3);">
        ${ switcher }
        <span><strong>Rhyme:</strong> ${ legend || '<em>none encoded</em>' }</span>
        <label style="cursor:pointer;margin:0;"><input type="checkbox" class="op-metre-toggle"> show metre</label>
        ${ modeSyll ? `<span class="text-muted" title="lines whose syllable count differs from the poem's most common (${modeSyll})">double border = syllabic deviation</span>` : '' }
        <button type="button" class="btn btn-sm btn-outline-secondary op-expandall" style="padding:0 8px;">expand all</button>
        <button type="button" class="btn btn-sm btn-outline-secondary op-tour" style="padding:0 8px;">tour ▸</button>
        <button type="button" class="btn btn-sm btn-outline-secondary op-ctx-toggle" style="padding:0 8px;" title="show existing contexts attached to this poem">contexts ▸</button>
        <button type="button" class="btn btn-sm btn-outline-secondary op-fit" style="padding:0 8px;">fit</button>
        <span class="op-caption text-muted" style="font-style:italic;"></span>
        <span class="text-muted" style="margin-left:auto;">tap to expand · right-click to add a context</span>
    </div>` );
    $bar.insertBefore( $container );
    // switch the structure to another text of the work, and align the right tab to it
    $bar.on( 'change', '.op-textswitch', function() {
        var tid = this.value;
        opShowStructure( 'https://www.romanticperiodpoetry.org/id/' + wid + '/' + tid );
        opSyncTextToStructure( tid );
    } );
    // click a rhyme chip -> toggle: spotlight that rhyme (solid chip) / click again to clear
    var activeRhyme = null;
    $bar.on( 'click', '.op-leg', function() {
        var rh = this.dataset.rhyme, chips = $bar.find( '.op-leg' );
        chips.css({ 'background-color': '', 'color': '' } );
        if ( activeRhyme === rh ) {
            activeRhyme = null;
            opClearFocus( cyInst );
        } else {
            activeRhyme = rh;
            opFocusRhyme( cyInst, rh );
            $( this ).css({ 'background-color': rcol[ rh ], 'color': '#fff' } );
        }
    } );
    // metre toggle -> append the stress/syllable ribbon to line labels
    $bar.find( '.op-metre-toggle' ).on( 'change', function() {
        if ( this.checked ) { cyInst.nodes( '.op-line' ).addClass( 'op-metre' ); }
        else { cyInst.nodes( '.op-line' ).removeClass( 'op-metre' ); }
    } );
    $bar.find( '.op-fit' ).on( 'click', function() { opFitColumn( cyInst ); } );
    // WP-D: toggle the existing-context overlay (lazy-load on first enable)
    $bar.find( '.op-ctx-toggle' ).on( 'click', async function() {
        var $b = $( this );
        if ( cyInst.scratch( '_opCtxOn' ) ) {
            cyInst.scratch( '_opCtxOn', false ); opClearContextMarkers( cyInst ); opClearWeave( cyInst );
            $container.parent().find( '.op-ctx-pop' ).remove();
            $bar.find( '.op-ctx-poem' ).remove();
            $b.text( 'contexts ▸' ).removeClass( 'active' );
        } else {
            $b.text( '…' );
            await opLoadContexts( cyInst, textURI );
            cyInst.scratch( '_opCtxOn', true ); opRenderContextMarkers( cyInst );
            var marked = cyInst.nodes( '.op-ctx' ).length;
            $b.text( marked ? 'contexts ◂ (' + marked + ')' : 'no contexts' ).addClass( 'active' );
            // poem-level / unmatched (whole-poem, higher-level divs) get their own pill
            var poem = opUnmatchedContexts( cyInst );
            $bar.find( '.op-ctx-poem' ).remove();
            if ( poem.length ) {
                var $p = $( `<button type="button" class="btn btn-sm btn-outline-secondary op-ctx-poem" style="padding:0 8px;" title="contexts on the whole poem or sections not shown as nodes">poem-level (${ poem.length })</button>` );
                $p.on( 'click', function() {
                    var pr = $p[ 0 ].getBoundingClientRect(), hr = $container.parent()[ 0 ].getBoundingClientRect();
                    opShowCtxPopup( $container.parent(), poem, pr.left - hr.left, pr.bottom - hr.top + 2 );
                } );
                $b.after( $p );
            }
        }
    } );
    // expand all / collapse all line tokens (line-level stays the default)
    var allExpanded = false;
    $bar.find( '.op-expandall' ).on( 'click', async function() {
        var $b = $( this );
        if ( allExpanded ) { opCollapseAll( cyInst ); allExpanded = false; $b.text( 'expand all' ); }
        else { $b.text( '…' ); await opExpandAll( cyInst, textURI ); allExpanded = true; $b.text( 'collapse all' ); }
        if ( cyInst.scratch( '_opCtxOn' ) ) opRenderContextMarkers( cyInst );
    } );
    // guided tour: step through stanzas, spotlighting + captioning each in turn
    var $caption = $bar.find( '.op-caption' ), stanzas = cyInst.nodes( '.op-stanza' ), tourIdx = -1;
    $bar.find( '.op-tour' ).on( 'click', function() {
        tourIdx++;
        if ( tourIdx >= stanzas.length ) {
            tourIdx = -1; cyInst.elements().removeClass( 'op-dim op-focus' ); opFitColumn( cyInst );
            $caption.text( '' ); $( this ).text( 'tour ▸' ); return;
        }
        var st = stanzas[ tourIdx ], lines = st.children();
        // NB: don't dim the op-text root — it's the compound PARENT of every stanza, and
        // a dimmed compound parent cascades its opacity onto all children (muting the
        // focused stanza too). Dim everything except the root.
        cyInst.elements().not( '.op-text' ).addClass( 'op-dim' );
        st.removeClass( 'op-dim' ); lines.removeClass( 'op-dim' ).addClass( 'op-focus' );
        cyInst.fit( lines.union( st ), 60 );
        $caption.text( st.data( 'label' ) );
        $( this ).text( 'next ▸ (' + ( tourIdx + 1 ) + '/' + stanzas.length + ')' );
    } );
}

// Left graph-panel switcher: toggle .col-graph between the Contexts graph (#cy)
// and the OntoPoetry Structure graph (#cy-onto). Added in the poem reading view.
// brand-orange styling for the OntoPoetry control buttons (toolbar action buttons +
// the Contexts/Structure toggle group), injected once. Overrides Bootstrap's grey.
function opInjectCtrlCSS() {
    if ( document.getElementById( 'op-toolbar-css' ) ) return;
    $( 'head' ).append( `<style id="op-toolbar-css">
.op-toolbar .btn { background-color: var(--bs-orange); color:#fff; border-color: var(--bs-orange); }
.op-toolbar .btn:hover, .op-toolbar .btn:focus, .op-toolbar .btn.active { background-color:#cd6711; border-color:#cd6711; color:#fff; box-shadow:none; }
/* Contexts|Structure toggle: match the /maps "Markers | Graph" segmented control */
.op-graph-toggle { border-radius:5px; overflow:hidden; box-shadow:0 1px 4px rgba(0,0,0,.35); }
.op-graph-toggle .btn { background-color:#e9e9e9; color:#555; border:none; border-radius:0; padding:6px 10px; font-size:13px; line-height:1.2; box-shadow:none; }
.op-graph-toggle .btn:hover, .op-graph-toggle .btn:focus { background-color:#e9e9e9; color:#555; box-shadow:none; }
.op-graph-toggle .btn.active, .op-graph-toggle .btn.active:hover, .op-graph-toggle .btn.active:focus { background-color:#cd6711; color:#fff; box-shadow:none; }
</style>` );
}

function opEnsureGraphPanel() {
    var $cg = $( '.col-graph' );
    if ( !$cg.length || $cg.find( '.op-graph-toggle' ).length ) return;
    opInjectCtrlCSS();
    $cg.append(
        `<div class="op-graph-toggle btn-group btn-group-sm" role="group" style="position:absolute;top:8px;left:8px;z-index:1001;">
            <button type="button" class="btn btn-secondary active" data-opview="contexts">Contexts</button>
            <button type="button" class="btn btn-outline-secondary" data-opview="structure">Structure</button>
        </div>
        <div id="cy-onto-panel" style="display:none;position:absolute;top:0;left:0;right:0;bottom:0;flex-direction:column;background:var(--bs-body-bg,#fff);"><div id="cy-onto" style="flex:1;position:relative;min-height:0;"></div></div>`
    );
    $cg.find( '.op-graph-toggle' ).on( 'click', 'button[data-opview]', function() {
        $cg.find( '.op-graph-toggle button' ).removeClass( 'active btn-secondary' ).addClass( 'btn-outline-secondary' );
        $( this ).addClass( 'active btn-secondary' ).removeClass( 'btn-outline-secondary' );
        opGraphPanelToggle( this.dataset.opview );
    } );
}

function opGraphPanelToggle( view ) {
    var $cg = $( '.col-graph' ); if ( !$cg.length ) return;
    if ( view === 'structure' ) {
        $( '#cy' ).hide(); $cg.find( '.graph-about, .nw-panel' ).hide();   // the WP-G panel belongs to the Contexts graph only
        $( '#cy-onto-panel' ).css( 'display', 'flex' );
        var wid = $( '.layout_wrapper' ).attr( 'data-wid' ), tid = opActiveTextId();
        var textURI = 'https://www.romanticperiodpoetry.org/id/' + wid + '/' + tid;
        if ( $( '#cy-onto-panel' ).attr( 'data-uri' ) !== textURI ) { opShowStructure( textURI ); }
        else if ( opCY[ textURI ] ) { opCY[ textURI ].resize(); }
    } else {
        $( '#cy-onto-panel' ).hide();
        $( '#cy' ).show(); $cg.find( '.graph-about, .nw-panel' ).show();
    }
}

// (re)render the Structure panel for one text — used by the toggle and by the
// text-switcher dropdown that mirrors the right-side Text/Translation tabs
function opShowStructure( textURI ) {
    var $panel = $( '#cy-onto-panel' );
    $panel.attr( 'data-uri', textURI );
    if ( opCY[ textURI ] ) { try { opCY[ textURI ].destroy(); } catch ( e ) {} }
    $panel.find( '.op-toolbar' ).remove();
    $( '#cy-onto' ).empty();
    renderOntoPoetry( textURI, '#cy-onto' );
}

// enumerate the work's textual expressions from the right-side tabs:
// [{tid, label}] for "Text" / "Translation (xxx)" (skips Facsimile/Performance)
function opTextList() {
    var out = [];
    $( '#pills-tab button[data-bs-target^="#pills-"]' ).each( function() {
        var label = $( this ).text().replace( /\s+/g, ' ' ).trim();
        if ( !/^(Text|Translation)/i.test( label ) ) return;
        var tid = $( $( this ).attr( 'data-bs-target' ) ).find( '.text' ).attr( 'id' );
        if ( tid ) out.push({ tid: tid, label: label } );
    } );
    return out;
}

// the text id of the currently-active right-hand tab (falls back to the route's text)
function opActiveTextId() {
    var b = document.querySelector( '#pills-tab button.active[data-bs-target^="#pills-"]' );
    var tid = b ? $( b.getAttribute( 'data-bs-target' ) ).find( '.text' ).attr( 'id' ) : null;
    return tid || $( '.layout_wrapper' ).attr( 'data-tid' );
}

// the right-hand tab button whose pane holds a given text
function opTabButtonForText( tid ) {
    var found = null;
    $( '#pills-tab button[data-bs-target^="#pills-"]' ).each( function() {
        if ( $( $( this ).attr( 'data-bs-target' ) ).find( '.text' ).attr( 'id' ) === tid ) { found = this; return false; }
    } );
    return found;
}

// align the right tab to a text (used when the Structure switcher changes)
function opSyncTextToStructure( tid ) {
    var btn = opTabButtonForText( tid );
    if ( btn && !btn.classList.contains( 'active' ) ) {
        try { bootstrap.Tab.getOrCreateInstance( btn ).show(); } catch ( e ) { btn.click(); }
    }
}

// align the Structure (left) when a right Text/Translation tab is shown
$( document ).on( 'shown.bs.tab', '#pills-tab button[data-bs-target^="#pills-"]', function( e ) {
    var $panel = $( '#cy-onto-panel' );
    if ( !$panel.length || $panel.css( 'display' ) === 'none' ) return;   // Structure not active
    var tid = $( $( e.target ).attr( 'data-bs-target' ) ).find( '.text' ).attr( 'id' );
    if ( !tid ) return;                                                    // facsimile/performance: no structure
    var uri = 'https://www.romanticperiodpoetry.org/id/' + $( '.layout_wrapper' ).attr( 'data-wid' ) + '/' + tid;
    if ( $panel.attr( 'data-uri' ) !== uri ) opShowStructure( uri );
} );

// --- two-way hover highlight between the linear text (right) and the Structure graph (left) ---
function opCurrentCy() { var uri = $( '#cy-onto-panel' ).attr( 'data-uri' ); return uri ? opCY[ uri ] : null; }
function opTextHL( frag, on ) {
    var el = document.querySelector( '.col-content .text [id="' + frag + '"]' );
    if ( el ) el.style.background = on ? 'rgba(253,126,20,.35)' : '';   // --bs-orange tint
}
// text -> graph: hovering a line/word/punctuation lights up its node AND its line node
// (the line sits in the visible left column, so there is always feedback even when an
// expanded word is fanned off-screen to the right), and pans an off-screen node into
// view. Uses mouseover (bubbles) + closest() for reliable hit-testing over nested spans;
// clears only on leaving the whole text block, so moving between tokens doesn't flicker.
$( document ).on( 'mouseover', '.col-content .text', function( e ) {
    var cy = opCurrentCy();
    if ( !cy || $( '#cy-onto-panel' ).css( 'display' ) === 'none' ) return;
    cy.elements( '.op-hl' ).removeClass( 'op-hl' );
    var el = e.target.closest ? e.target.closest( '.l, .w, .pc' ) : null;
    if ( !el ) return;
    var uri = $( '#cy-onto-panel' ).attr( 'data-uri' );
    var lineEl = el.classList.contains( 'l' ) ? el : ( el.closest ? el.closest( '.l' ) : null );
    var hl = cy.collection();
    var tok = cy.getElementById( uri + '#' + el.id ); if ( tok && tok.length ) hl = hl.union( tok );
    if ( lineEl ) { var ln = cy.getElementById( uri + '#' + lineEl.id ); if ( ln && ln.length ) hl = hl.union( ln ); }
    if ( !hl.length ) return;
    hl.addClass( 'op-hl' );
    var focus = ( tok && tok.length ) ? tok : hl;
    var bb = focus.renderedBoundingBox();
    if ( bb.x1 < 0 || bb.y1 < 0 || bb.x2 > cy.width() || bb.y2 > cy.height() ) {
        cy.stop().animate( { center: { eles: focus } }, { duration: 200 } );
    }
} );
$( document ).on( 'mouseleave', '.col-content .text', function() {
    var cy = opCurrentCy();
    if ( cy ) cy.elements( '.op-hl' ).removeClass( 'op-hl' );
} );

// click nodes
$(document.body).on('click', 'a.nodejump', function(e) {
	e.preventDefault();
	var j = cy.$( "[id='"+$( e.currentTarget ).attr("href")+"']" );	
	cy.animate({
		zoom: 0.9,
		center: { eles: cy.filter( j ) }
	}, {
		duration: 500
	});
});

// TODO: needs extending to cover authors and works views ("type"-parameter?)
// retrieve a PRISMS object
async function getPRISMSobject( id ) {
	var node_seen = [], ids = [], total = [];
	ids.push( id );
	node_seen[ id ] = 1;
	while( ids.length > 0 ) {
		var q = namespaces+`SELECT * WHERE { 
			<`+ids[ 0 ]+`> ?p ?o . 
			BIND (<`+ids[ 0 ]+`> AS ?s) BIND ( <default> AS ?g)
		}`;
		var graph = await getJSONLD( q, "raw" ); // DONE
		for (var j = 0; j < graph.length; j++ ) {
			var v = graph[ j ];
			total.push( v );
			if ( v.o.type == 'uri' && !node_seen[ v.o.value ]
				&& ( v.o.value.startsWith( id ) || v.o.value.startsWith( domain + "/id/" ) )
//				|| ( v.o.value.includes( "/expression/" ) )
//				|| ( v.o.value.includes( "/work" ) )
//				|| ( v.o.value.includes( "/publication" ) )
//				|| ( v.o["value"].includes( "/manifestation") )// including their publication events
// 				|| ( v.p["value"].includes( "embodies") ) // including digital manifestations
				&& ( !v.p.value.startsWith( "http://postdata.linhd.uned.es/ontology/" ))
			) {
				ids.push( v.o.value );
				node_seen[ v.o.value ] = 1;
			}
		}
		ids.shift();
	}
	return( total );
}

// create CY-JSON from graph
// pick the first "modelled" rdf:type and return its onto.json label, GUARDED: a type absent
// from onto.json (e.g. pdp:StanzaPattern, which isn't in the file) previously threw on
// onto[...].label and aborted the whole graph build. Falls back to the prefixed name.
function ontoTypeLabel( types ) {
    var t = _l.filter( types || [], function( x ) {
        return x.includes( 'cidoc-crm' ) || x.includes( 'frbr/' ) || x.includes( 'intro/' )
            || x.includes( 'foaf/' ) || x.includes( 'lrmoo/' ) || x.includes( '/postdata' ) || x.includes( 'skos/' );
    } )[ 0 ];
    var k = nsv( t );
    return ( onto[ k ] ? onto[ k ].label : ( t ? k : '' ) );
}
async function createCYJSON( graph, view ) {
	var jsonObj = [], nodes_seen = [], local_col = {};
    // process triples in the graph object
	for ( var i=0; i<graph.length; i++ ) {
		var v = graph[ i ];
		var s = v.s;
		var p = v.p;
		var o = v.o;
		var g = v.g;
		if ( view == "authors" ) {
			if (   p.value.includes( 'R3_' ) 
				|| p.value.includes( 'isRealisedThrough' )
				|| p.value.includes( 'creator' )
				|| p.value.includes( 'R19i_' )
				|| p.value.includes( 'R16_' )
				|| p.value.includes( 'P2_' )
			) { continue; }
		} else if (view == "works" ) {
			if (   p.value.includes( 'R17i_' ) 
				|| p.value.includes( 'contributor' )
				|| p.value.includes( 'isVersionOf' )
				|| p.value.includes( 'R19i_' )
				|| p.value.includes( 'R16_' )
				|| p.value.includes( 'P100i_' )
				|| p.value.includes( 'P98i_' )
//				|| p.value.includes( 'R4i_' )
				|| p.value.includes( 'P106_' )
				|| p.value.includes( '/skos/core#note' )
				|| p.value.includes( '/prisms/' )
				|| p.value.includes( '/skos/core#topConceptOf' )
				|| p.value.includes( '/skos/core#inScheme' )
				|| p.value.includes( 'P2_' )
			) { continue; }
		}
		// process PRISMS elements
		if ( typeof nodes_seen[s.value] == 'undefined' // count each instance once
			&& s["value"].startsWith( domain )
			&& !s["value"].endsWith( "/creator" )
			&& !s["value"].endsWith( "/restricted" )
			&& !nsv(p["value"]).startsWith( "oa:" )
			&& !nsv(p["value"]).startsWith( "dcterms:isVersionOf" )
			&& !nsv(p["value"]).startsWith( "dcterms:hasVersion" )
			&& !nsv(p["value"]).startsWith( "crm:P138i" )
			&& !nsv(p["value"]).startsWith( "pdc:" ) 
			&& !nsv(p["value"]).startsWith( "pdt:" ) 
			&& !nsv(p["value"]).startsWith( "pdp:" )
			//&& !(s["value"].endsWith("/person/creator") || s["value"].endsWith("/person/agent") )
		) {
			if (!cy || cy && !cy.$id( s.value ).length ) {
				nodes_seen[s.value] = 1;
				// process nodes (s)
				//console.log( s.value, skp(graph, s.value, "rdf:type"), _l.filter( skp(graph, s.value, "rdf:type"), function(t) { return t.includes( 'cidoc-crm' ) || t.includes( 'frbr/' ) || t.includes( 'intro/' ) || t.includes( 'lrmoo/' ) || t.includes( '/postdata' ) || t.includes( 'skos/' )|| t.includes( '/postdata' ) || t.includes( 'foaf/' ) } )[0] );
				var node = {};
				node["data"] = { "id": s.value };
				node["classes"] = "node";
				node["data"]["name"] = (addicon( s.value )?addicon( s.value ):'')+" "+
					ontoTypeLabel( skp(graph, s.value, "rdf:type") )+"\n" + (skp(graph, s.value, "crm:P1_is_identified_by")?
						skp(graph, s.value, "crm:P1_is_identified_by"):
						skp(graph, s.value, "skos:prefLabel")); // default is P1_is_identified_by
				node["data"]["pref"] = (skp(graph, s.value, "skos:prefLabel") != false)?skp(graph, s.value, "skos:prefLabel"):skp(graph, s.value, "crm:P1_is_identified_by");
				node["data"]["alt"] = skp(graph, s.value, "skos:altLabel");
				if (skp(graph, s.value, "crm:P138i_has_representation") || skp(graph, s.value, "wdt:P18")) {
					node["data"]["img"] = skp(graph, s.value, "crm:P138i_has_representation") || skp(graph, s.value, "wdt:P18");
				}
				node["data"]["type"] = skp(graph, s.value, "crm:P2_has_type");
				node["data"]["class"] = skp(graph, s.value, "rdf:type") ;//|| s.value.includes( "/expression/" )?"http://iflastandards.info/ns/fr/frbr/frbroo/F2_Expression":s.value.includes( "/publication/" )?"http://iflastandards.info/ns/fr/frbr/frbroo/F32_Carrier_Production_Event":'';
				node["data"]["shape"] = (function() {
					if ( skp(graph, s.value, "rdf:type").filter(s => s.includes("http://www.cidoc-crm.org/extensions/crmdig/")).length > 0 
					     || skp(graph, s.value, "rdf:type").filter(s => s.includes("https://www.prisms.digital")).length > 0) {
							return "round-rectangle"
					} else if ( nsv( _l.filter( skp(graph, s.value, "rdf:type"), function(t) { return t.includes( 'cidoc-crm' ) 
						|| t.includes( 'frbr/' ) || t.includes( 'intro/' ) || t.includes( 'lrmoo/' ) || t.includes( '/postdata' ) || t.includes( 'skos/' ) } )[0] ) == "lrmoo:F1_Work" 
						|| nsv( _l.filter( skp(graph, s.value, "rdf:type"), function(t) { return t.includes( 'cidoc-crm' ) || t.includes( 'frbr/' ) || t.includes( 'intro/' ) 
						|| t.includes( 'lrmoo/' ) || t.includes( '/postdata' ) || t.includes( 'skos/' ) } )[0] ) == "lrmoo:F2_Expression" 
						|| s.value.includes( "/expression/" ) ) {
							return "round-hexagon";
					} else if (s.value.includes( "/language" ) || s.value.includes( "/rppa/kos" ) ) {
						return "round-octagon";
					} else { return "ellipse" }
				})();
				node["data"]["bgcolor"] = (function() {
					if ( s.value.includes( "/expression/" ) || s.value.includes( "/manifestation/" ) ) {
						if (s.value.endsWith( "/1" )) { local_col[ s.value ] = graph_col["expression1"] ; return graph_col["expression1"]; }
						else if (s.value.endsWith( "/2" )) { local_col[ s.value ] = graph_col["expression2"] ; return graph_col["expression2"]; }
						else if (s.value.endsWith( "/3" )) { local_col[ s.value ] = graph_col["expression3"] ; return graph_col["expression3"]; }
						else if (s.value.endsWith( "/4" )) { local_col[ s.value ] = graph_col["expression4"] ; return graph_col["expression4"]; }
					} else if ( s.value.includes( "/excerpt/" ) ) {
						return local_col[ skp( graph, s.value, "lrmoo:R15i_is_fragment_of") ]
					} else if ( nsv( _l.filter( skp(graph, s.value, "rdf:type"), function(t) { return t.includes( '/intro/' ) })[0] ) ){
						return graph_col["intro"];
					} 	
					else return graph_col[nsv( _l.filter( skp(graph, s.value, "rdf:type"), function(t) { return t.includes( 'cidoc-crm' ) 
						|| t.includes( 'frbr/' ) 
						|| t.includes( 'intro/' ) 
						|| t.includes( 'foaf/' )
						|| t.includes( 'lrmoo/' ) 
						|| t.includes( '/postdata' ) 
						|| t.includes( 'skos/' ) } )[0] 
						)];
				})();
				jsonObj.push(node);
			}
		}
		if ( s["value"].startsWith(domain) 
		 ) {
			// process edges (p)
			if ( o.type == "uri" // if object is a node
				&& o["value"].startsWith(domain) // and it is in the PRISMS NS
				&& !p["value"].endsWith( "/creator" )
				&& !o["value"].endsWith( "/restricted" )
				&& !nsv(p["value"]).startsWith( "dcterms:isVersionOf" )
				&& !nsv(p["value"]).startsWith( "dcterms:hasVersion" )
				&& !nsv(p["value"]).startsWith( "oa:" )
				&& !nsv(p["value"]).startsWith( "crm:P138i" )
                && !nsv(p["value"]).startsWith( "pdc:" ) 
				&& !nsv(p["value"]).startsWith( "pdt:" ) 
				&& !nsv(p["value"]).startsWith( "pdp:" )
            ) {
				// object properties (relationships)
//				if (!cy || (cy && (!cy.$id( s.value ).length || !cy.$id( o.value ).length)) ) {
					var edge = {};
					edge["data"] = { "name": ((onto[nsv(p.value)]) ? onto[nsv(p.value)].label : ((nsv(p.value)) ? nsv(p.value) : p.value)), "id": s.value+p.value+o.value };
					edge["data"]["source"] = s.value;
					edge["data"]["target"] = o.value;
					edge["classes"] = "edge";
					edge["data"]["class"] = p.value;
					edge["data"]["bgcolor"] =  (function() {
						if ( o.value.includes( "/expression/" ) || o.value.includes( "/manifestation/" ) ) {
							if (o.value.endsWith( "/1" )) { local_col[ o.value ] = graph_col["expression1"] ; return graph_col["expression1"]; }
							else if (o.value.endsWith( "/2" )) { local_col[ o.value ] = graph_col["expression2"] ; return graph_col["expression2"]; }
							else if (o.value.endsWith( "/3" )) { local_col[ o.value ] = graph_col["expression3"] ; return graph_col["expression3"]; }
							else if (o.value.endsWith( "/4" )) { local_col[ o.value ] = graph_col["expression4"] ; return graph_col["expression4"]; }
						} else if ( o.value.includes( "/excerpt/" ) ) {
							return local_col[ skp( graph, o.value, "lrmoo:R15i_is_fragment_of") ]
						} else if ( s.value.includes( "/intro/")  ) {
							return graph_col["intro"];
						}  
						else return graph_col[nsv( _l.filter( skp(graph, o.value, "rdf:type"), function(t) { return t.includes( 'cidoc-crm' ) 
							|| t.includes( 'frbr/' ) 
							|| t.includes( 'intro/' ) 
							|| t.includes( 'foaf/' )
							|| t.includes( 'lrmoo/' ) 
							|| t.includes( '/postdata' ) 
							|| t.includes( 'skos/' ) } )[0] 
							)];
					})();	
					jsonObj.push(edge);
//				}
//				if (!cy || cy && !cy.$id( s.value ).length ) {
					nodes_seen[ o.value ] = 1;
					var node = {};
					//console.log( o.value, skp(graph, o.value, "rdf:type"), _l.filter( skp(graph, o.value, "rdf:type"), function(t) { return t.includes( 'cidoc-crm' ) || t.includes( 'frbr/' ) || t.includes( 'intro/' ) || t.includes( 'lrmoo/' ) || t.includes( '/postdata' ) || t.includes( 'skos/' ) || t.includes( 'foaf/' ) } )[0] );
					node["data"] = { "id": o.value };
					node["classes"] = "node";
					node["data"]["name"] = (addicon( o.value )?addicon( o.value ):'')+" "+ontoTypeLabel( skp(graph, o.value, "rdf:type") )+"\n" + (skp(graph, o.value, "crm:P1_is_identified_by")?skp(graph, o.value, "crm:P1_is_identified_by"):skp(graph, o.value, "skos:prefLabel"));
					node["data"]["pref"] = (skp(graph, o.value, "skos:prefLabel") != false)?skp(graph, o.value, "skos:prefLabel"):skp(graph, o.value, "crm:P1_is_identified_by");;
					node["data"]["alt"] = skp(graph, o.value, "skos:altLabel");
					if (skp(graph, o.value, "crm:P138i_has_representation") || skp(graph, o.value, "wdt:P18")) {
						node["data"]["img"] = skp(graph, o.value, "crm:P138i_has_representation") || skp(graph, o.value, "wdt:P18");
					}
					node["data"]["class"] = skp(graph, o.value, "rdf:type") ;//|| o.value.includes( "/expression/" )?"http://iflastandards.info/ns/fr/frbr/frbroo/F2_Expression":o.value.includes( "/publication/" )?"http://iflastandards.info/ns/fr/frbr/frbroo/F32_Carrier_Production_Event":'';
					node["data"]["shape"] = (function() {
						if (skp(graph, o.value, "rdf:type") && skp(graph, o.value, "rdf:type").filter(s => s.includes("http://www.cidoc-crm.org/extensions/crmdig/")).length > 0
						|| skp(graph, o.value, "rdf:type") && skp(graph, o.value, "rdf:type").filter(s => s.includes("https://www.prisms.digital")).length > 0) {
							return "round-rectangle"
						} else if (nsv( _l.filter( skp(graph, o.value, "rdf:type"), function(t) { return t.includes( 'cidoc-crm' ) || t.includes( 'frbr/' ) || t.includes( 'intro/' ) || t.includes( 'lrmoo/' ) || t.includes( '/postdata' ) || t.includes( 'skos/' ) || t.includes( 'foaf/' )} )[0] ) == "lrmoo:F1_Work" 
							|| nsv( _l.filter( skp(graph, o.value, "rdf:type"), function(t) { return t.includes( 'cidoc-crm' ) || t.includes( 'frbr/' ) || t.includes( 'intro/' ) || t.includes( 'lrmoo/' ) || t.includes( '/postdata' ) || t.includes( 'skos/' ) || t.includes( 'foaf/' ) } )[0] ) == "lrmoo:F12_Nomen" 
							|| nsv( _l.filter( skp(graph, o.value, "rdf:type"), function(t) { return t.includes( 'cidoc-crm' ) || t.includes( 'frbr/' ) || t.includes( 'intro/' ) || t.includes( 'lrmoo/' ) || t.includes( '/postdata' ) || t.includes( 'skos/' ) || t.includes( 'foaf/' ) } )[0] ) == "lrmoo:F2_Expression" 
							|| o.value.includes( "/expression/" )) {
								return "round-hexagon";
						} else if (o.value.includes( "/language" ) || o.value.includes( "/rppa/kos" ) ) {
							return "round-octagon";
						} else { return "ellipse" }
					})();
					node["data"]["type"] = skp(graph, o.value, "crm:P2_has_type");
					node["data"]["private"] = ((g.value.startsWith( context["@context"]["prisms"] ))?true:false);
					node["data"]["bgcolor"] = (function() {
						if ( o.value.includes( "/expression/" ) || o.value.includes( "/manifestation/" ) ) {
							if (o.value.endsWith( "/1" )) { local_col[ o.value ] = graph_col["expression1"] ; return graph_col["expression1"]; }
							else if (o.value.endsWith( "/2" )) { local_col[ o.value ] = graph_col["expression2"] ; return graph_col["expression2"]; }
							else if (o.value.endsWith( "/3" )) { local_col[ o.value ] = graph_col["expression3"] ; return graph_col["expression3"]; }
							else if (o.value.endsWith( "/4" )) { local_col[ o.value ] = graph_col["expression4"] ; return graph_col["expression4"]; }
						} else if ( o.value.includes( "/excerpt/" ) ) {
							return local_col[ skp( graph, o.value, "lrmoo:R15i_is_fragment_of") ]
						} else if ( nsv( _l.filter( skp(graph, s.value, "rdf:type"), function(t) { return t.includes( '/intro/' ) })[0] ) ){
							return graph_col["intro"];
						} 	 
						else return graph_col[nsv( _l.filter( skp(graph, o.value, "rdf:type"), function(t) { return t.includes( 'cidoc-crm' ) || t.includes( 'frbr/' ) || t.includes( 'intro/' ) || t.includes( 'lrmoo/' ) || t.includes( '/postdata' ) || t.includes( 'skos/' ) || t.includes( 'foaf/' ) } )[0] )];
					})();
					jsonObj.push(node);
//				}
			} else if ((
				// dataType properties
				o.type == "literal"
				// do not display as dataType properties in the graph, but in tippies instead
				&& !(
					p.value.startsWith   (context["@context"]["rdf"]    + "type")
					|| p.value.startsWith(context["@context"]["skos"]   + "prefLabel")
					|| p.value.startsWith(context["@context"]["skos"]   + "altLabel")
					|| p.value.startsWith(context["@context"]["skos"]   + "hiddenLabel")
					|| p.value.startsWith(context["@context"]["skos"]   + "note")
					|| p.value.startsWith(context["@context"]["crm"]    + "P1_is_identified_by")
					|| p.value.startsWith(context["@context"]["crm"]    + "P3_has_note")
					|| p.value.startsWith(context["@context"]["crm"]    + "P106_is_composed_of")
					|| p.value.startsWith(context["@context"]["lrmoo"] + "R54_has_nomen_language")
					|| p.value.startsWith(context["@context"]["lrmoo"] + "R35_is_specified_by")
					|| p.value.startsWith(context["@context"]["lrmoo"] + "R33_has_content")
					|| p.value.startsWith(context["@context"]["crm"]    + "P70i_is_documented_in")
					|| p.value.startsWith(context["@context"]["crm"]    + "P48_has_preferred_identifier")
					|| p.value.startsWith(context["@context"]["prisms"])
					|| p.value.startsWith(context["@context"]["dcterms"])
                    || p.value.startsWith(context["@context"]["pdc"])
                    || p.value.startsWith(context["@context"]["pdt"])
                    || p.value.startsWith(context["@context"]["pdp"])
					|| p.value.startsWith(context["@context"]["crm"]    + "P138i_has_representation")
					|| p.value.startsWith(context["@context"]["crm"]    + "P2_has_type")
					|| p.value.startsWith(context["@context"]["crm"]    + "P102_has_title")
					|| p.value.startsWith(context["@context"]["crm"]    + "P168_place_is_defined_by")
					|| p.value.startsWith(context["@context"]["crm"]    + "P82a_begin_of_the_begin")
					|| p.value.startsWith(context["@context"]["crm"]    + "P82b_end_of_the_end")
					|| p.value.startsWith(context["@context"]["crm"]    + "P82_at_some_time_within")
					|| p.value.startsWith(context["@context"]["crm"]    + "P190_has_symbolic_content")
					|| p.value.startsWith(context["@context"]["foaf"])
					|| p.value.startsWith(context["@context"]["rdfs"]   + "comment")
					|| p.value.startsWith(context["@context"]["rdfs"]   + "label")
					|| p.value.startsWith(context["@context"]["rdfs"]   + "seeAlso")
					|| p.value.startsWith(context["@context"]["rdfs"]   + "isDefinedBy")
					|| p.value.startsWith(context["@context"]["cnt"])
					|| p.value.startsWith(context["@context"]["wdt"])
				)) //|| (p.value.startsWith(context["@context"]["rdf"]   + "predicate")) // reified statements
			) {
				var node = {};
				var dtp;
				// nodes we want related, but can't have graph-wide instances: language, collection, time
				/*
				if ( nsv( p.value ) == "crm:P72_has_language" ) {
					if ( graph_uuid["lang"][ o.value ] ) {
						dtp = graph_uuid["lang"][ o.value ];
					} else {
						dtp = graph_uuid["lang"][ o.value ] = uuidv4();
					}
				} else */
				if ( nsv( p.value ) == "crm:P46i_forms_part_of" ) {
					if ( graph_uuid["coll"][ o.value ] ) {
						dtp = graph_uuid["coll"][ o.value ];
					} else {
						dtp = graph_uuid["coll"][ o.value ] = uuidv4();
					}
				} else if ( nsv( p.value ) == "crm:P82a_begin_of_the_begin" ) {
					if ( graph_uuid["begin"][ o.value ] ) {
						dtp = graph_uuid["begin"][ o.value ];
					} else {
						dtp = graph_uuid["begin"][ o.value ] = uuidv4();
					}
				} else if ( nsv( p.value ) == "crm:P82b_end_of_the_end" ) {
					if ( graph_uuid["end"][ o.value ] ) {
						dtp = graph_uuid["end"][ o.value ];
					} else {
						dtp = graph_uuid["end"][ o.value ] = uuidv4();
					}
				} else {
//					dtp = uuidv4();
					if ( graph_uuid["skos"][ o.value ] ) {
						dtp = graph_uuid["skos"][ o.value ];
					} else {
						dtp = graph_uuid["skos"][ o.value ] = uuidv4();
					}
				}
//				if (!cy || cy && !cy.$id( "_:dtp-" + dtp ).length) {
					node["data"] = { "id": "_:dtp-" + dtp };
					node["data"]["name"] = ((onto[nsv(o.value)]) ? onto[nsv(o.value)].label : ((nsv(o.value)) ? nsv(o.value) : o.value));
					node["data"]["pref"] = (skp(graph, o.value, "skos:prefLabel") != false)?skp(graph, o.value, "skos:prefLabel"):skp(graph, o.value, "crm:P1_is_identified_by");;
					node["data"]["alt"] = skp(graph, o.value, "skos:altLabel");
					node["data"]["class"] = o.type;
					node["classes"] = "node";
					node["data"]["shape"] = "round-octagon";
					node["data"]["private"] = ((g.value.startsWith( context["@context"]["prisms"] ))?true:false);
					node["data"]["bgcolor"] = graph_col[nsv(skp(graph, o.value, "rdf:type")[0])] || '#AA4465';
					jsonObj.push(node);
					var edge = {};
					edge["data"] = { "name": ((onto[nsv(p.value)]) ? onto[nsv(p.value)].label : ((nsv(p.value)) ? nsv(p.value) : p.value)), "id": s.value+p.value+"_:dtp-" + dtp };
					edge["data"]["class"] = p.value;
					edge["data"]["source"] = s.value;
					edge["data"]["target"] = "_:dtp-" + dtp;
					edge["classes"] = "edge";
					edge["data"]["private"] = ((g.value.startsWith( context["@context"]["prisms"] ))?true:false);
					edge["data"]["bgcolor"] = (theme == 'dark')?"#fff":"#333";
					jsonObj.push(edge);
				}
//			}
		}
	}
	// de-dup any duplicates
	var uniqueJsonObj = Array.from( new Set( jsonObj.map( a => a.data.id ))).map(id => {
   		return jsonObj.find( a => a.data.id === id )
 	});
	return ( uniqueJsonObj );
}

function tippyFactory(ref, content){
    // Since tippy constructor requires DOM element/elements, create a placeholder
    var dummyDomEle = document.createElement('div');
    var place = content.innerHTML.includes("<b>Relationships</b>")?'left':'right'

    var tip = tippy( dummyDomEle, {
        getReferenceClientRect: ref.getBoundingClientRect,
        trigger: 'manual', // mandatory
        // dom element inside the tippy:
        content: content,
        // your own preferences:
        arrow: true,
        placement: place,
        hideOnClick: true,
        sticky: "reference",

        // if interactive:
        interactive: true,
        appendTo: document.body, // or append dummyDomEle to document.body
        
        popperOptions: {
            strategy: 'fixed',
            modifiers: [
              {
                name: 'flip',
                options: {
                  fallbackPlacements: ['top', 'bottom'],
                },
              },
              {
                name: 'preventOverflow',
                options: {
                  altAxis: true,
                  tether: false,
                },
              },
            ],
          },
        } 
    );
 
    return tip;
 }

// format element properties/relationships for details display or tippies
function tippyNodes( nodes, graph, all ) {
	// style nodes individually
	var info = '', contentPadd = '';
	nodes.forEach(function (node) {
		// all statements go in tippies
//		if ( node.id().startsWith( domain ) || node.id().startsWith( "_:" ) ) { // render only edges from PRISMS nodes                        
			var contentR = `<b>&nbsp;&nbsp;Outgoing <i class="fa-solid fa-right-long"></i>:</b><ul class="listBibl">`;
			var contentL = `<b>&nbsp;&nbsp;Incoming <i class="fa-solid fa-left-long"></i>:</b><ul class="listBibl">`;
			var contentP = `<ul class="listBibl">`;
			var nodes_seen = [];
			$.each( graph, function( i,v ) {
				var s = v.s;
				var p = v.p;
				var o = v.o;
				var g = v.g;
				if ( s.value == node.id() && !( o.type == 'uri' && o.value.startsWith( domain )) && typeof nodes_seen[ jqu( s.value+p.value+o.value ) ] == 'undefined') {
					// properties
					if ( nsv( p.value) == "crm:P106_is_composed_of" || nsv( p.value) == "crm:P70i_is_documented_in" || nsv( p.value) == "dcterms:created" 
						|| nsv( p.value) == "rdf:type" || nsv( p.value ).startsWith( "cnt:" ) || nsv( p.value ).startsWith( "wdt:" )
					) { return; }
					var addition = '';
					nodes_seen[ jqu( s.value+p.value+o.value ) ] = 1;
					if (o.value.startsWith( domain ) ) {
						addition = ` class="nodejump">`;
					} else if ( o.value.startsWith( 'http' ) ) {
						addition = ` class="external" target="_blank">`;
					}
					contentP += `<li data-s="` + s.value + `" data-p="` + p.value + `" data-o="` + o.value + `"` + `><span style="font-style:italic;">`
					+ (onto[nsv(p.value)] ? onto[nsv(p.value)].label : (nsv(p.value) ? nsv(p.value) : p.value))
					+ `</span> &nbsp; <span>` +
					((o.value.startsWith( 'http') && nsv(p.value) != "rdf:type" )?`<a href="`+o.value+`" ` //style="color:`+cy.$id( node.id() )["_private"].data.color
					+``+addition:``)+
							(onto[nsv(o.value)] ? truncateString(onto[nsv(o.value)].label, 50) :
							(skp(graph, o.value, "crm:P1_is_identified_by") ? truncateString(skp(graph, o.value, "crm:P1_is_identified_by"),50) :
							( nsv( o.value )?truncateString(nsv( o.value ),50):
								truncateString(o.value,50)
					)))+	((o.value.startsWith( 'http' ) && nsv(p.value) != "rdf:type")?`</a>`:``)
					+ `</span></li>`;
				}
			});
			$.each( (all)?graph:cy.edges(), function( i,v ) {
				if ( all ) {
					if ( v.s.value == node.id() && (v.o.value.startsWith( domain ) || v.o.value.startsWith( "_:" )) ) {
						// outgoing
						if ( nsv( v.p.value) == "dcterms:creator" ) { return; }
						contentR += `<li data-s="` + v.s.value + `" data-p="` + v.p.value + `" data-o="` + v.o.value + `"><span style="font-style:italic;">`
						+ (onto[nsv(v.p.value)] ? onto[nsv(v.p.value)].label : (nsv(v.p.value) ? nsv(v.p.value) : v.p.value))
						+ `</span> &nbsp; <span><a `+((v.o.type == "uri")?`data-component="`+v.o.value+`"`:``)+` href="`+v.o.value+`" class="nodejump add_ent_wb" ` //style="color:`+cy.$id( node.id() )["_private"].data.color
						+`>` +
							//(onto[nsv(o.value)] ? onto[nsv(o.value)].label :
							((v.qp)?truncateString(v.qp.value,35) + ((v.qa)?` (`+v.qa.value+`)`:``):truncateString(v.o.value,35))
						+ `</a></span></li>`;
					} else if ( ((v.o.type=='uri' && v.o.value == node.id())) && (v.s.value.startsWith( domain ) || v.s.value.startsWith( "_:" )) ) {
						 // incoming
						contentL += `<li data-s="` + v.s.value + `" data-p="` + v.p.value + `" data-o="` + v.o.value + `"><span style="font-style:italic;">`
						+ (onto[nsv(v.p.value)] ? onto[nsv(v.p.value)].label : (nsv(v.p.value) ? nsv(v.p.value) : v.p.value))
						+ `</span> &nbsp; <span><a `+((v.s.type == "uri")?`data-component="`+v.s.value+`"`:``)+` href="`+v.s.value+`" class="nodejump add_ent_wb" ` //style="color:`+cy.$id( node.id() )["_private"].data.color
						+`>` +
							 //(onto[nsv(o.value)] ? onto[nsv(o.value)].label :
							 ((v.qp)?truncateString(v.qp.value,35) + ((v.qa)?` (`+v.qa.value+`)`:``):truncateString(v.s.value,35))
						+ `</a></span></li>`;
					} else {
						if ( !contentP.includes( "<li" ) && contentPadd == '' ) {
							contentPadd += `<li><span style="font-style:italic;">`
							+ onto[ "crm:P1_is_identified_by" ].label + `</span> &nbsp; <span>` +
							truncateString(v.o.value,35)
							+ `</span></li>`;
						}
						if ( v.o.type == 'literal' && !contentP.includes( "<li" ) ) {
							contentL += `<li data-s="` + v.s.value + `" data-p="` + v.p.value + `" data-o="` + v.o.value + `"><span style="font-style:italic;">`
							+ (onto[nsv(v.p.value)] ? onto[nsv(v.p.value)].label : (nsv(v.p.value) ? nsv(v.p.value) : v.p.value))
							+ `</span> &nbsp; <span><a `+((v.s.type == "uri")?`data-component="`+v.s.value+`"`:``)+` href="`+v.s.value+`" class="nodejump add_ent_wb" ` //style="color:`+cy.$id( node.id() )["_private"].data.bgcolor
							+`>` +
								 //(onto[nsv(o.value)] ? onto[nsv(o.value)].label :
								 ((v.qp)?truncateString(v.qp.value,35) + ((v.qa)?` (`+v.qa.value+`)`:``):v.s.value)
							+ `</a></span></li>`;	
						}
					}
				} else {
					if ( v["_private"].data.source == node.id() && v["_private"].data.target.startsWith( domain ) ) {
						// outgoing
						contentR += `<li data-s="` + v["_private"].data.source + `" data-p="` + v["_private"].data.class + `" data-o="` + v["_private"].data.target + `"` + `"><span style="font-style:italic;">`
						+ (onto[nsv(v["_private"].data.class)] ? onto[nsv(v["_private"].data.class)].label : (nsv(v["_private"].data.class) ? nsv(v["_private"].data.class) : v["_private"].data.class))
						+ `</span> &nbsp; <span `//style="color:`+v["_private"].data.color
						+`><a href="`+v["_private"].data.target+`" class="nodejump" `//style="color:`+v["_private"].data.color
						+`>` +
							//(onto[nsv(o.value)] ? onto[nsv(o.value)].label :
							((cy.$id( v["_private"].data.target )["_private"].data.name.split("\n")[1])?cy.$id( v["_private"].data.target )["_private"].data.name.split("\n")[1]:cy.$id( v["_private"].data.target )["_private"].data.name.split("\n")[0])
						+ `</a></span></li>`;
					} else if ( v["_private"].data.target == node.id() && v["_private"].data.source.startsWith( domain ) ) {
						// incoming
						contentL += `<li data-s="` + v["_private"].data.source + `" data-p="` + v["_private"].data.class + `" data-o="` + v["_private"].data.target + `"` + `><span style="font-style:italic;">`
						+ (onto[nsv(v["_private"].data.class)] ? onto[nsv(v["_private"].data.class)].label : (nsv(v["_private"].data.class) ? nsv(v["_private"].data.class) : v["_private"].data.class))
						+ `</span> &nbsp; <span><a href="`+v["_private"].data.source+`" class="nodejump"` //style="color:`+v["_private"].data.color
						+`>` +
							//(onto[nsv(o.value)] ? onto[nsv(o.value)].label :
							((cy.$id( v["_private"].data.source )["_private"].data.name.split("\n")[1])?cy.$id( v["_private"].data.source )["_private"].data.name.split("\n")[1]:cy.$id( v["_private"].data.source )["_private"].data.name.split("\n")[0])
						+ `</a></span></li>`;
					}
				}
			});
			if ( !contentR.includes( "<li" ) ) { contentR += "<li>none</li>" }
			if ( !contentL.includes( "<li" ) ) { contentL += "<li>none</li>" }
			contentR += "</ul>";
			contentL += "</ul>";
			contentP += contentPadd+"</ul>";
			if ( nodes.length == 1 ) {
			// get statements for a single node for graphInfo/detailsTab
				if ( node.classes().toString() == "edge" ) {
					contentP = `<ul class="listBibl">`;
					contentP += `<li><span style="font-style:italic;">preferred label</span> &nbsp; <span>`+node.data().name+`</span></li>`;
					contentP += `<li><span style="font-style:italic;">URI</span> &nbsp; <span>`+node.data().class+`</span></li>`;
					contentP += `<li><span style="font-style:italic;">source</span> &nbsp; <span><a href="`+node.data().source+`" class="nodejump">`+node.data().source+`</a></span></li>`;
					contentP += `<li><span style="font-style:italic;">target</span> &nbsp; <span><a href="`+node.data().target+`" class="nodejump">`+node.data().target+`</a></span></li>`;
					contentP += contentPadd+"</ul>";
				}
				info = "<div><p><b>Id:</b> "+node.id()+((node.data("private") == true)?" <a href='#' data-id='"+node.id()+"' data-closest='div' class='delete_element_id'><i class='far fa-trash-alt'></i></a>":"")+"</p>"+
					"<p><b>Properties</b></p>"+contentP+(( node.classes().toString() != "edge" )?"<p><b>Relationships</b></p>"+contentL+contentR:``)+"</div>";
			} else {
			// apply statements to tippies for the graph
				if ( tippy1[ node.id() ]) { tippy1[ node.id() ].destroy(); }
				if ( tippy2[ node.id() ]) { tippy2[ node.id() ].destroy(); }
				tippy1[ node.id() ] = node.popper({
                    content: () => {
                       let content = document.createElement('div');
                       content.innerHTML = "<p><b>Relationships</b></p>"+contentL+contentR;
                       return content;
                    },
                });
                tippy2[ node.id()] = node.popper({
                    content: () => {
                       let content = document.createElement('div');
                       content.innerHTML = "<p><b>Properties</b></p>"+contentP;
                       return content;
                    },
                });
                tippyShowHandler = function() { tippy1[ node.id() ].show(); tippy2[ node.id() ].show(); };
				tippyHideHandler = function() { tippy1[ node.id() ].hide(); tippy2[ node.id() ].hide(); };
				node.on('mouseover', tippyShowHandler );
				node.on('mouseout', tippyHideHandler );
			}
		//}
	});
	if ( nodes.length == 1 ) { return info; }
}

// produce CY-graph from CY-JSON
function createCYgraph(data, graph, layout) {
	cy = cytoscape({
		container: $('#cy'),
		elements: data,
		layout: layout,
		style: [ // the stylesheet for the CY graph
			{
				selector: 'node',
				style: {
					'shape': function (e) { return e.data().shape },
					'background-color': (theme == 'dark')?"#333":"#fff",//function (e) { return e.data().bgcolor },
					'color': (theme == 'dark')?"#fff":"#000", 
					'label': function (e) { return ((e.data().name)?e.data().name.replace(/\\n/g, '\n'):
						e.data().id.includes( "/expression/" )?'Expression':e.data().id.includes( "/publication/")?'Publication':'')
						//(((e.data().class) ? ((onto[nsv(e.data().class)]) ? onto[nsv(e.data().class)].label : (nsv(e.data().class) ? nsv(e.data().class) : e.data().class)) + `\n` : ``) + e.data().type)) 
					},
					'background-image': function (e) { 
						if ( e.data().img ) {
							if ( e.data().img.startsWith( domain ) || e.data().img.charAt( 0 ) === '/' || e.data().img.includes( "/wikipedia/commons/thumb/" ) ) {
								return e.data().img;
							} else {
								var filename = decodeURIComponent( e.data().img.split("/").pop().replace(/%20/g, "_") );
								var pm = String( e.data().id || '' ).match( /(pers\d+)/ ); if ( pm ) { return '/data/map/data/img/thumb/' + pm[1] + '.jpg'; }   // person we cache locally (same thumbs the map uses)
								return 'https://commons.wikimedia.org/wiki/Special:FilePath/' + encodeURIComponent( filename ) + '?width=120';   // fallback: sized thumbnail straight from Commons over https (no MD5, no mixed content)
							}
						} else {
							return 'none';
						}
					},
					'background-fit': 'cover cover',
                    'background-image-containment': 'over',
					'text-wrap': 'wrap',
					'text-max-width': 140,
					"border-width": 6,
					'border-color': function (e) { return e.data().bgcolor || '#cd6711' },
				  	'width': function (e) { if ( e.data().img ) { return '100px' } else if (e.data().name) { return 'label' } else { return '65px' } },
				  	'height': function (e) { if ( e.data().img ) { return '100px' } else if (e.data().name) { return 'label' } else { return '30px' } },
                    //'max-width': '200px',
				  	'padding-left': '5px',
				  	'padding-right': '5px',
				  	'padding-top': '15px',
					'padding-bottom': '15px',
					'font-size': '14px',
					'font-family': 'system-ui, "Font Awesome 6 Free"',
				  	'text-valign': function (e) { if ( e.data().img ) { return 'bottom' } else { return 'center' } },
				  	'text-halign': 'center',
                    //"border-left": "4px solid yellow"
				}
			},
			{
				selector: 'edge',
				style: {
					'label': function (e) { return ((e.data().name?e.data().name:'') + "\n \u2060") },
					'width': 1,
                    'color': (theme == 'dark')?"#fff":"#333",
					'curve-style': 'unbundled-bezier',
					'target-arrow-shape': 'triangle',
					'target-arrow-fill': 'filled',
					'edge-text-rotation': 'autorotate',
					'text-wrap': 'wrap',
					'text-background-opacity': 0,

					'font-family': 'system-ui,"Font Awesome 6 Free"',
					'font-size': '14px',
					'font-style': 'italic'
					//'color': function (color) { return color.data().color }, 
				}
			},
			{
				selector: 'node[id*="/typeOfIntertextuality"],node[id*="/intertextuality"],node[id*="/actualization"],node[id*="/contextLocation"]',
				style: {
					'shape': 'concave-hexagon',
					'border-color': '#2a9d8f'
				}
			},
			{
				selector: 'node[id*="/targetLocation"],node[id*="/contextLocation"]',
				style: {
					'shape': 'round-tag',
					'border-color': '#2a9d8f'
				}
			},
			{
				selector: 'node[id*="rppa/kos"]',
				style: {
					'shape': 'round-octagon',
					'background-color': '#AA4465',
					'border-color': '#AA4465',
					'color': "#fff", 
					'label': function (e) { return ((e.data().name)?e.data().name.replace(/\\n/g, '\n'):
						e.data().id.includes( "/expression/" )?'Expression':e.data().id.includes( "/publication/")?'Publication':'')
						//(((e.data().class) ? ((onto[nsv(e.data().class)]) ? onto[nsv(e.data().class)].label : (nsv(e.data().class) ? nsv(e.data().class) : e.data().class)) + `\n` : ``) + e.data().type)) 
					}
				}
			},
			{
				selector: 'node[id$="/language"]',
				style: {
					'shape': 'round-octagon',
					'background-color': '#928b11',
					'border-color': '#928b11',
					'color': "#fff", 
					'label': function (e) { return ((e.data().name)?e.data().name.replace(/\\n/g, '\n'):
						e.data().id.includes( "/expression/" )?'Expression':e.data().id.includes( "/publication/")?'Publication':'')
						//(((e.data().class) ? ((onto[nsv(e.data().class)]) ? onto[nsv(e.data().class)].label : (nsv(e.data().class) ? nsv(e.data().class) : e.data().class)) + `\n` : ``) + e.data().type)) 
					}
				}
			},
			{
				selector: 'edge[target^="_"],edge[target$="/language"]',
				style: {
					'label': function (e) { return ((e.data().name?e.data().name:e.data().class) + "\n \u2060") },
					'width': 1,
					'curve-style': 'unbundled-bezier',
					'line-style': 'dashed',
					'line-dash-pattern': [6,4],
					'target-arrow-shape': 'triangle',
					'target-arrow-fill': 'filled',
					'edge-text-rotation': 'autorotate',
					'text-wrap': 'wrap',
					'text-background-opacity': 0,

					'font-family': 'system-ui, "Font Awesome 6 Free"',
					'font-size': '14px',
					'font-style': 'italic',
					'color': '#fff',//(theme == 'dark')?"#fff":"#333"
					//'color': function (color) { return color.data().color }, 
				}
			},
			{
				selector: 'node.highlight',
				style: {
					'color': function (e) { //if ( e.data().img ) { return e.data().color || '#cd6711' } else { 
						return ((theme == 'dark')?"#fff":"#333") 
					//} 
				},
					'background-color': function (e) { return e.data().bgcolor || '#cd6711' }
				}
			},
			{
				selector: 'node[!img].highlight',
				style: {
					'color': function (e) { //if ( e.data().img ) { return e.data().color || '#cd6711' } else { 
						return "#fff" 
					//} 
				},
					'background-color': function (e) { return e.data().bgcolor || '#cd6711' }
				}
			},
			{
				selector: 'node[shape="round-octagon"][id*="rppa/kos"].highlight',
				style: {
					'background-color': '#AA4465'
				}
			},
			{
				selector: 'node[shape="round-octagon"][id$="/language"].highlight',
				style: {
					'background-color': '#928b11'
				}
			},
			{
				selector: 'node[id*="/typeOfIntertextuality"].highlight,node[id*="/intertextuality"].highlight,node[id*="/actualization"].highlight,node[id*="/targetLocation"].highlight,node[id*="/contextLocation"].highlight',
				style: {
					'background-color': '#2a9d8f'
				}
			},
			{
				selector: 'node.semitransp',
				style: { 'opacity': '0.4' }
			},
			{
				selector: 'edge.highlight',
				style: { 'target-arrow-color': function (e) { if (e.data().hasOwnProperty( "bgcolor" ) && e.data().bgcolor != null ) { return e.data().bgcolor } else { return (theme == 'dark')?"#fff":"#000" } }
				}
			},
			{
				selector: 'edge.semitransp',
				style: { 'opacity': '0.3' }
			},
			{
				selector: '.hidden',
				style: { 'display': 'none' }
			},
			{
				selector: '.shown',
				style: { 'display': 'unset' }
			},
			// some style for the extension
            {
				selector: '.eh-handle',
				style: {
				  'background-color': 'red',
				  'width': 6,
				  'height': 6,
				  'shape': 'ellipse',
				  'overlay-opacity': 0,
				  'border-width': 2, // makes the handle easier to hit
				  'border-opacity': 0
				}
			  },
           
			  {
				selector: '.eh-hover',
				style: {
				  'background-color': 'red',
				  'label': ''
				}
			  },
			  {
				selector: '.eh-source',
				style: {
				  'border-width': 2,
				  'border-color': 'red'
				}
			  },
			  {
				selector: '.eh-target',
				style: {
				  'border-width': 2,
				  'border-color': 'red'
				}
			  },
			  {
				selector: '.eh-preview',
				style: {
				  'background-color': 'red',
				  'line-color': 'red',
				  'target-arrow-color': 'red',
				  'source-arrow-color': 'red',
				}
			  },
			  {
				selector: '.eh-ghost-edge',
				style: {
				  'background-color': 'red',
				  'line-color': 'red',
				  'target-arrow-color': 'red',
				  'source-arrow-color': 'red',
				  'label': ''
				}
			  },
			  {
				selector: '.eh-ghost-edge.eh-preview-active',
				style: {
				  'opacity': 0
				}
			  }
		]
    
	});
	// "about graph"-section
	var graph_about = '';
	// The Settings-tab controls (redraw / export) now live in the always-visible .nw-panel, which
	// is on ALL the cy-graph views (networks + authors + works), so omit the Settings tab wherever
	// the panel exists (i.e. everywhere the graph-about renders).
	var nwHasNwPanel = ( typeof nwHasPanel === 'function' ) ? nwHasPanel() : /\/networks\//.test( window.location.href );
	if ( nwHasNwPanel ) {
	// workbench graph display
		graph_about += `<ul class="nav nav-tabs" id="graphTab">
		<li class="nav-item" role="presentation">
		  <a class="nav-link active" id="home-tab" data-bs-toggle="tab" href="#tabHome" role="tab" aria-controls="home" aria-selected="true"><i class="fas fa-info-circle"></i> Info</a>
		</li>
		<li class="nav-item" role="presentation">
		  <a class="nav-link" id="details-tab" data-bs-toggle="tab" href="#tabDetails" role="tab" aria-controls="details" aria-selected="false"><i class="fas fa-exchange-alt"></i> Details</a>
		</li>
		${ nwHasNwPanel ? '' : `<li class="nav-item" role="presentation">
		  <a class="nav-link" id="settings-tab" data-bs-toggle="tab" href="#tabSettings" role="tab" aria-controls="settings" aria-selected="false"><i class="fas fa-cog"></i> Settings</a>
		</li>` }
  		</ul>
  		<div class="tab-content" id="myTabContent" style="overflow-y: auto;">
			<div class="tab-pane fade show active" id="tabHome" role="tabpanel" aria-labelledby="home-tab"></div>
			<div class="tab-pane fade" id="tabDetails" role="tabpanel" aria-labelledby="details-tab"></div>
			${ nwHasNwPanel ? '' : `<div class="tab-pane fade" id="tabSettings" role="tabpanel" aria-labelledby="settings-tab"></div>` }
		  </div>`;
        $( ".graph-about" ).css( "display","unset" );
		$( ".graph-about" ).html( graph_about );
		if ( !nwHasNwPanel ) $( ".graph-about #tabSettings" ).append( `
		<ul class="listBibl" style="text-indent:unset;font-size:14px;">
		<!--<li>Node display
		<div class="form-check" style="padding-left: 35px;">
  			<input class="form-check-input" type="radio" name="nodesRadioOptions" id="nodesMaterial" value="material">
  			<label class="form-check-label" for="nodesMaterial">Material</label>
		</div>
		<div class="form-check" style="padding-left: 35px;">
		<input class="form-check-input" type="radio" name="nodesRadioOptions" id="nodesDigital" value="digital">
		<label class="form-check-label" for="nodesDigital">Digital</label>
		</div>
		<div class="form-check" style="padding-left: 35px;">
		<input class="form-check-input" checked type="radio" name="nodesRadioOptions" id="nodesBoth" value="both">
		<label class="form-check-label" for="nodesBoth">Material/Digital</label>
		</div><br></li>
  		-->
		<li>Help</li>
		<p>Please refer to the <a href="/help/#networks">Networks help page</a> for details on the visualization and traversal of the graph.</p>
		<li>Graph display<br>
		<button type="button" class="btn" style="background-color:rgba(210, 120, 30, 1); color:#fff;margin-bottom:15px;font-size:inherit;" id="graph_redraw">Redraw graph</button>
		</li>
		<li>Graph export<br>
		<button type="button" class="btn" style="background-color:rgba(210, 120, 30, 1); color:#fff;margin-bottom:5px;font-size:inherit;" id="graph_graphml">Export graph (GraphML)</button>
		<button type="button" class="btn" style="background-color:rgba(210, 120, 30, 1); color:#fff;margin-bottom:5px;font-size:inherit;" id="graph_cyjson">Export graph (Cytoscape JSON)</button>
		<button type="button" class="btn" style="background-color:rgba(210, 120, 30, 1); color:#fff;font-size:inherit;" id="graph_png">Export graph (PNG [viewport])</button>
		</li>
		<!--
		</div>
		-->
		</ul>` );
		$( "#tabHome" ).html( updateGraphInfo() );        
	}
	// Initialize navigator and panzoom — SKIP in map mode: both controls are hidden and unused there
	// (Leaflet drives pan/zoom, cy is locked at zoom 1), and /maps rebuilds cy on every redraw/filter, so
	// the navigator's throttled cy.png() render would otherwise fire against the destroyed cy and throw
	// "Cannot read properties of null (reading 'png')".
	var nav = null;
	if ( typeof nwMapMode === 'undefined' || !nwMapMode ) {
		nav = cy.navigator({ container: ".cytoscape-navigator" });
		cy.panzoom();
	}
	try { cy.scratch( '_nwNav', nav ); } catch ( e ) {}
	// Event handlers
	// initialize edgehandles for workbench, and tippies for graph preview
	var tippy, tippy2;
	eh = cy.edgehandles({
		preview: true, // whether to show added edges preview before releasing selection
		hoverDelay: 150, // time spent hovering over a target node before it is considered selected
		handleNodes: 'node[shape != "round-octagon"]', // selector/filter function for whether edges can be made from a given node
		snap: false, // when enabled, the edge can be drawn by just moving close to a target node
		snapThreshold: 50, // the target node must be less than or equal to this many pixels away from the cursor/finger
		snapFrequency: 15, // the number of times per second (Hz) that snap checks done (lower is less expensive)
		noEdgeEventsInDraw: false, // set events:no to edges during draws, prevents mouseouts on compounds
		disableBrowserGestures: true, // during an edge drawing gesture, disable browser gestures such as two-finger trackpad swipe and pinch-to-zoom
		handlePosition: function( node ){
		return 'middle top'; // sets the position of the handle in the format of "X-AXIS Y-AXIS" such as "left top", "middle top"
		},
		handleInDrawMode: false, // whether to show the handle in draw mode
		edgeType: function( sourceNode, targetNode ){
		// can return 'flat' for flat edges between nodes or 'node' for intermediate node between them
		// returning null/undefined means an edge can't be added between the two nodes
		return 'flat';
		},
		loopAllowed: function( node ){
		// for the specified node, return whether edges from itself to itself are allowed
		return true;
		},
		nodeLoopOffset: -50, // offset for edgeType: 'node' loops
		nodeParams: function( sourceNode, targetNode ){
		// for edges between the specified source and target
		// return element object to be passed to cy.add() for intermediary node
		return {};
		},
		edgeParams: function( sourceNode, targetNode, i ){
		// for edges between the specified source and target
		// return element object to be passed to cy.add() for edge
		// NB: i indicates edge index in case of edgeType: 'node'
		return {};
		},
		ghostEdgeParams: function(){
		// return element object to be passed to cy.add() for the ghost edge
		// (default classes are always added for you)
		return {};
		},
		complete: function( sourceNode, targetNode, addedEles ){
		// fired when edgehandles is done and elements are added
		if (tippy) { tippy.hide(); }
		if ( sourceNode === targetNode ) { cy.remove( addedEles ); return false; }
		else { 
			if ( targetNode["_private"].data.class == "literal" ) {
				targetNode["_private"].data.class = [];
				targetNode["_private"].data.class.push( "rdfs:Literal" );
			}
			var crels = [], prels = [], trelsdd = [], trelsdi = [], trelsid = [], trelsii = [];
			$.each( sourceNode["_private"].data.class, function( i,v ) {
				crels = retrieve_class_relationships( nsv(v) );
				prels = retrieve_property_relationships( nsv(v),crels[0].concat(crels[1]) );
				trelsdd.push( prels[0] );
				trelsdi.push( prels[2] );
				trelsid.push( prels[1] );
				trelsii.push( prels[3] );
			});
			var hitd = [], hiti = [];
			$.each( _l.uniq(_l.flatten( trelsdd.concat( trelsdi ) )), function( i,v ) {
				$.each( targetNode["_private"].data.class, function( i2,v2 ) {
					if ( onto[ v ] && onto[ v ].range == nsv(v2) ) {
						hitd.push( v );
					}
				});
			});
			$.each( _l.uniq(_l.flatten( trelsdd.concat( trelsdi ).concat( trelsid ).concat( trelsii ) )), function( i,v ) {
				$.each( targetNode["_private"].data.class, function( i2,v2 ) {
					crels = retrieve_class_relationships( nsv(v2) );
					if ( onto[ v ] && onto[ v ].range == nsv(v2) || _l.uniq(_l.flatten( crels[0].concat(crels[1]) )).includes( onto[ v ].range ) ) {
						hiti.push( v );
					}
				});
			});
			hiti = _l.difference(hiti, hitd);
			addModelling( sourceNode, targetNode, addedEles, hitd, hiti ); 
		}
		},
		cancel: function( sourceNode, cancelledTargets ){
		// fired when edgehandles are cancelled (incomplete gesture)
		if (tippy2) { tippy2.hide(); }
		addModelling( sourceNode );
		},
		hoverover: function( sourceNode, targetNode ){
			// fired when a target is hovered
			if ( targetNode["_private"].data.class == "literal" ) {
				targetNode["_private"].data.class = [];
				targetNode["_private"].data.class.push( "rdfs:Literal" );
			}
			var crels = [], prels = [], trelsdd = [], trelsdi = [], trelsid = [], trelsii = [];
			$.each( sourceNode["_private"].data.class, function( i,v ) {
				crels = retrieve_class_relationships( nsv(v) );
				prels = retrieve_property_relationships( nsv(v),crels[0].concat(crels[1]) );
				trelsdd.push( prels[0] );
				trelsdi.push( prels[2] );
				trelsid.push( prels[1] );
				trelsii.push( prels[3] );
			});
			var hitd = [], hiti = [];
			$.each( _l.uniq(_l.flatten( trelsdd.concat( trelsdi ) )), function( i,v ) {
				$.each( targetNode["_private"].data.class, function( i2,v2 ) {
					if ( onto[ v ] && onto[ v ].range == nsv(v2) ) {
						hitd.push( v );
					}
				});
			});
			$.each( _l.uniq(_l.flatten( trelsdd.concat( trelsdi ).concat( trelsid ).concat( trelsii ) )), function( i,v ) {
				$.each( targetNode["_private"].data.class, function( i2,v2 ) {
					crels = retrieve_class_relationships( nsv(v2) );
					if ( onto[ v ] && onto[ v ].range == nsv(v2) || _l.uniq(_l.flatten( crels[0].concat(crels[1]) )).includes( onto[ v ].range ) ) {
						hiti.push( v );
					}
				});
			});
			hiti = _l.difference(hiti, hitd);
			var sonto = '<ul class="listBibl">', sonto2 = '<ul class="listBibl">';
			$.each( _l.uniq( _l.flatten( hitd ) ), function(i,v) {
				sonto += `<li><span style="font-style:italic;">`+ onto[ v ].label +`</span> &nbsp; <span>`+((onto[ onto[ v ].range ])?onto[ onto[ v ].range ].label:onto[ v ].range)+` (class)</span></li>`;
			});
			$.each( _l.uniq( _l.flatten( hiti ) ), function(i,v) {
				sonto2 += `<li><span style="font-style:italic;">`+ onto[ v ].label +`</span> &nbsp; <span>`+((onto[ onto[ v ].range ])?onto[ onto[ v ].range ].label:onto[ v ].range)+` (class)</span></li>`;
			});
			sonto += '</ul>'; sonto2 += '</ul>';
			tippy = makeTippy( targetNode, "<p><b>"+_l.uniq( _l.flatten(hitd)).length+" direct relationships</b>"+sonto+"<p><b>"+_l.uniq( _l.flatten(hiti)).length+" inferred relationships</b>"+sonto2, 'right');
			tippy.show();
			if (tippy2) { tippy2.hide(); }
		},
		show: function( sourceNode ){
			// fired when handle is shown
		},
		hide: function( sourceNode ){
			// fired when the handle is hidden
		},
		start: function( sourceNode ){
			// fired when edgehandles interaction starts (drag on handle)
			var crels = [], prels = [], trelsdd = [], trelsdi = [], trelsid = [], trelsii = [];
			$.each( sourceNode["_private"].data.class, function( i,v ) {
				crels = retrieve_class_relationships( nsv(v) );
				prels = retrieve_property_relationships( nsv(v),crels[0].concat(crels[1]) );
				trelsdd.push( prels[0] );
				trelsdi.push( prels[2] );
				trelsid.push( prels[1] );
				trelsii.push( prels[3] );
			});
			var sonto = '<ul class="listBibl">';
			$.each( _l.uniq( _l.flatten( trelsdd.concat( trelsdi ) ) ), function(i,v) {
				sonto += `<li><span style="font-style:italic;">`+ onto[ v ].label +`</span> &nbsp; <span>`+((onto[ onto[ v ].range ])?onto[ onto[ v ].range ].label:onto[ v ].range)+` (class)</span></li>`;
			});
			sonto += '</ul>';
			tippy2 = makeTippy( sourceNode, "<p><b>"+_l.uniq( _l.flatten(trelsdd.concat(trelsdi))).length+" direct relationships</b></p>"+sonto+"<p>+ "+_l.uniq( _l.flatten(trelsid.concat(trelsii))).length+" inferred relationships</p>", 'left');
			tippy2.show();
		},
		stop: function( sourceNode ){
			// fired when edgehandles interaction is stopped (either complete with added edges or incomplete)
		},
		hoverout: function( sourceNode, targetNode ){
		// fired when a target isn't hovered anymore
		if (tippy) { tippy.hide(); }
		if (tippy2) { tippy2.show(); }
		},
		previewon: function( sourceNode, targetNode, previewEles ){
		// fired when preview is shown
		},
		previewoff: function( sourceNode, targetNode, previewEles ){
		// fired when preview is hidden
		},
		drawon: function(){
		// fired when draw mode enabled
		},
		drawoff: function(){
		// fired when draw mode disabled
		}
	});
	// TODO: edgehandles has changed substantially, needs re-implementing!
	// eh.enableDrawMode();
	// new node
	//cy.dblclick();
	cy.on('dblclick', async function(evt) {
		var link;
		// open context
		if ( (/\/networks\//.test(window.location.href)
			|| /\/authors\//.test(window.location.href)
			|| /\/works\//.test(window.location.href)) &&
			( evt["target"]["_private"].data.context !== undefined 
				|| evt["target"]["_private"].data.class.includes( "https://w3id.org/lso/intro/beta202408#INT_Interpretation" )
			)) {
				link = (evt["target"]["_private"].data.context?evt["target"]["_private"].data.context:evt["target"]["_private"].data.id )
				display_context( link );
				var regex = /.*?\/id\/(.*?)$/;
				previousState = location.href;
				history.replaceState(null,null,'#context/'+link.match( regex )[1]);
		// open author page
			} else if ( evt["target"]["_private"]["data"].type 
				&& evt["target"]["_private"]["data"]["type"].includes( "http://id.loc.gov/vocabulary/relators/aut" )
				&& /\/networks\//.test(window.location.href)
				) {
				zInd = zInd+1;
				var text = `<div id="content" style="z-index:`+zInd+`;overflow:inherit;top:55px;height: calc(100vh - 96px);min-width:500px;" class="offcanvas offcanvas-end" data-bs-backdrop="false" tabindex="-1">
					<div class="offcanvas-body">`+
						`<button type="button" class="btn-close" style="float:right;" data-mode="read" data-bs-dismiss="offcanvas" aria-label="Close"></button>
						<div id="poet_content"></div>
					</div>
				</div>
				`;
				$( "body" ).prepend( text );
				$( "#poet_content" ).html( await poet_profile( evt["target"]["_private"].data.id.match(/\/id\/(.*?)\/person$/)[1] ) );
				var myCanvasGTEl = document.getElementById( "content" );
				var myCanvasGT = new bootstrap.Offcanvas(myCanvasGTEl, {
					keyboard: false
				}).show();
		// open work page
			} else if ( (evt["target"]["_private"].data.hasOwnProperty( "class" ) && (
				evt["target"]["_private"].data.class.includes( "http://iflastandards.info/ns/lrm/lrmoo/F2_Expression" )
				|| evt["target"]["_private"].data.class.includes( "http://iflastandards.info/ns/lrm/lrmoo/F1_Work" )
				|| evt["target"]["_private"].data.class.includes( "lrmoo:F3_Manifestation" ) )
				&& /\/networks\//.test(window.location.href)
				)) {
				zInd = zInd+1;
				var text = `<div id="content" style="z-index:`+zInd+`;overflow:inherit;top:55px;height: calc(100vh - 96px);min-width:500px;" class="offcanvas offcanvas-end" data-bs-backdrop="false" tabindex="-1">
					<div class="offcanvas-body globaltext-container">`+
						`
						<div class="globaltext" style="min-width:550px !important;">							
						</div>
						<button type="button" class="btn-close" style="float: right;top: 8px;position: absolute;right: 0;" data-mode="read" data-bs-dismiss="offcanvas" aria-label="Close"></button>
					</div>
				</div>
				`;
				$( "body" ).prepend( text );
				var tid = _l.filter( texts, function(e) { return e.work == evt["target"]["_private"].data.id.match(/\/id\/(.*?)\/.*?$/)[1] })[0].text
				var wid = evt["target"]["_private"].data.id.match(/\/id\/(.*?)\/.*?$/)[1];
				await display_globaltext( tid, wid, false );
				var myCanvasGTEl = document.getElementById( "content" );
				var myCanvasGT = new bootstrap.Offcanvas(myCanvasGTEl, {
					keyboard: false
				}).show();
			}
		// double click on empty bakground =
		//addModelling();
	});
	cy.on('dblclick:timeout', function(evt) {
	});
    tippyNodes( cy.nodes(), graph );
	$( ".cytoscape-navigator" ).css( "display","unset" );
    // Event handlers
	// retrieve traversal paths
	cy.on('click', 'node,edge', async function (e) {
		var ele = e.target, q;
		var j = cy.$id( ele.id() );
		// double-clicking is impossible if node/edge moves on first click
		if ( $( "[id='cy']" )[0].parentNode.className != "modal-body" ) {
			if (!$( "#details-tab" ).hasClass( "active" ) ) { $( "#details-tab" ).click() }
			var q;
			if ( ele["_private"].data.shape == "round-diamond" ) {
				// literal
				var edge = ele.incomers( 'edge' )[0]["_private"].data.class;
				q = namespaces+`SELECT * WHERE { 
					{
						?s <`+edge+`> ?o . 
						OPTIONAL { ?s skos:prefLabel ?qp . 
							?s skos:altLabel ?qa . } 
						BIND (<`+edge+`> AS ?p) 
						BIND ( <default> AS ?g)
						FILTER ( ?o = '`+ele["_private"].data.name+`' ) 
					} 
				}`;
			} else {
				// node 
				q = namespaces+`SELECT * WHERE { 		
					{
						{ 
							<`+ele.id()+`> ?p ?o . 
							OPTIONAL { ?o skos:prefLabel ?qp . 
								?o skos:altLabel ?qa . } 
							BIND ( <`+ele.id()+`> as ?s ) BIND ( <default> as ?g )
						} 
						UNION 
						{ 
							?s ?p <`+ele.id()+`> . 
							OPTIONAL { ?s skos:prefLabel ?qp . 
								?s skos:altLabel ?qa . } 
							BIND ( <`+ele.id()+`> as ?o ) BIND ( <default> as ?g )
						} 
					} 
				}`;
			}
			var graph = await getJSONLD( q, "raw" ); // DONE
			var statementsInfo = tippyNodes( ele, graph, true );
			var sel = document.querySelector('#details-tab')
			bootstrap.Tab.getOrCreateInstance(sel).show()
			$( ".graph-about #tabDetails" ). html( statementsInfo );
		}
		
	});
	// highlight connections
	cy.on('mouseover', 'node', function (e) {
		var sel = e.target;
		// TODO: 
		// target highlighting by using a popover needs switching to associated expressions tab! Use:
		// $( "#"+ $( "div[data-iid='"+sel["_private"].data.obj+"']" ).parent().attr("id")+'-tab' ).click();
		// where the value of target_tabs[i] gets written into the node as a "obj"-value
		// 
		//$( "[class*='"+sel["_private"].data.id+"']" ).popover( 'show' );
		cy.elements()
			.difference(sel.outgoers()
			.union(sel.incomers()))
			.not(sel)
			.addClass('semitransp');
		sel.addClass('highlight')
			.outgoers()
			.union(sel.incomers())
			.addClass('highlight');
	}).on('mouseout', 'node', function (e) {
		var sel = e.target;
		//$( "[class*='"+sel["_private"].data.id+"']" ).popover( 'hide' );
		cy.elements()
			.removeClass('semitransp');
		sel.removeClass('highlight')
			.outgoers()
			.union(sel.incomers())
			.removeClass('highlight');
	});
}

// generate workbench graph info (classes/instances/statements)
function updateGraphInfo( level ) {
	var classes = [], classInfo = `<ul class="listBibl">`;
	$.each( cy.nodes(), function( i,v ) {
		classes.push( v["_private"]["data"].class );
	});
	$.each( _l.uniq( _l.flatten( classes )) , function( i,v ) {
		if ( v && onto[ nsv( v )] ) {
			if ( ( !level 
				//|| ( level == "digital" && (nsv(onto[ nsv(v) ].about).startsWith( 'crmdig' ) || nsv(onto[ nsv(v) ].about).startsWith( 'prisms' )) ) 
				//|| ( level == "material" && !(nsv(onto[ nsv(v) ].about).startsWith( 'crmdig' ) || nsv(onto[ nsv(v) ].about).startsWith( 'prisms' )) ) 
				|| ( level == "both" ) )
				&& (nsv(onto[ nsv(v) ].about).startsWith( 'crm' ) || nsv(onto[ nsv(v) ].about).startsWith( 'lrm' ) || nsv(onto[ nsv(v) ].about).startsWith( 'intro' ))
				) {
				classInfo += `<li><a href="#`+onto[ nsv(v) ].about+`" class="relsLink">`+onto[ nsv(v) ].label+`</a></li>`;
			}
		}
	});
	classInfo += `</ul>`;
	return `<div class="accordion" id="workbenchGraph">
	<div class="accordion-item" style="border:0;border-radius:unset;border-bottom:1px solid #ccc;">
		<div class="accordion-header" id="headingOne" style="padding:0;background-color:unset;">
			<h2 class="mb-0">
				<button class="accordion-button text-left" style="text-decoration:none;border:0;border-bottom:1px;padding:0 5px" type="button" data-bs-toggle="collapse" data-bs-target="#collapseOne" aria-expanded="false" aria-controls="collapseOne">Classes</button>
			</h2>
		</div>
		<div id="collapseOne" class="accordion-collapse collapse show" aria-labelledby="headingOne" data-bs-parent="#workbenchGraph">
			<div class="accordion-body" style="padding:.75rem;">`+classInfo+`</div>
		</div>
	</div>
	<div class="accordion-item" style="border:0;border-radius:unset;border-bottom:1px solid #ccc;">
		<div class="accordion-header" id="headingTwo" style="padding:0;background-color:unset;">
			<h2 class="mb-0">
				<button class="accordion-button text-left collapsed" style="text-decoration:none;border:0;border-bottom:1px;padding:0 5px" type="button" data-bs-toggle="collapse" data-bs-target="#collapseTwo" aria-expanded="false" aria-controls="collapseTwo">Instances</button>
			</h2>
		</div>
		<div id="collapseTwo" class="accordion-collapse collapse" aria-labelledby="headingTwo" data-bs-parent="#workbenchGraph">
			<div class="accordion-body" style="padding:.75rem;"></div>
		</div>
	</div>
	<div class="accordion-item" style="border:0;border-radius:unset;border-bottom:1px solid #ccc;">
		<div class="accordion-header" id="headingThree" style="padding:0;background-color:unset;">
			<h2 class="mb-0">
				<button class="accordion-button text-left collapsed" style="text-decoration:none;border:0;border-bottom:1px;padding:0 5px" type="button" data-bs-toggle="collapse" data-bs-target="#collapseThree" aria-expanded="false" aria-controls="collapseThree">Statements</button>
			</h2>
		</div>
		<div id="collapseThree" class="accordion-collapse collapse" aria-labelledby="headingThree" data-bs-parent="#workbenchGraph">
			<div class="accordion-body" style="padding:.75rem;"></div>
		</div>
	</div>
	</div>`;
}

async function cs_lists() {
	q = namespaces+`SELECT DISTINCT ?s ?p ?o 
		WHERE { 
		{
			?s a skos:ConceptScheme .
			?s ?p ?o .
			FILTER ( ?p IN (skos:prefLabel,rdf:type,dc:subject,dcterms:bibliographicCitation) ) . 
		} UNION {
			?s a skos:Concept .
			?s ?p ?o .
			FILTER ( ?p IN (skos:prefLabel,skos:inScheme,rdf:type) ) . 
		}
		#FILTER ( ISIRI(?o) || (lang(?o) = "en" ) || langmatches(lang(?o),"") )
	}
	`;
	var r = await getJSONLD( q );
	cs_schemes = _l.keyBy( _l.groupBy( r.graph, 'type' )['skos:ConceptScheme'], "id" );
	cs_concepts = _l.groupBy( _l.groupBy( r.graph, 'type' )['skos:Concept,lrmoo:F12_Nomen'], "skos:inScheme.id");
	if (Object.keys( cs_concepts ).length == 0 ) { 
		cs_concepts = _l.groupBy( _l.groupBy( r.graph, 'type' )['lrmoo:F12_Nomen,skos:Concept'], "skos:inScheme.id");
	}
	var concepts_list = `<ul>`;
	$.each( _l.orderBy(cs_schemes, ['dcterms:bibliographicCitation'],['asc']), function( i,v ) {
		concepts_list += `<li><a href="#`+v.id+`" role="button" aria-expanded="false" aria-controls="`+v.id+`" data-bs-toggle="collapse">`+
			v["dcterms:bibliographicCitation"]+`</a> (`+(Array.isArray(v["dc:subject"])?v["dc:subject"].join("; "):v["dc:subject"])+`)
			<div class="collapse" id="`+v.id+`">
				<ul style="columns:4;">`
			$.each( _l.orderBy(cs_concepts[ v.id ], [w => w["skos:prefLabel"].toString().toLowerCase()],['asc']), function( i2,v2 ) { 
				concepts_list += `<li><a class="consLink" href="/networks/#node/`+v2.id+`">`+(Array.isArray(v2["skos:prefLabel"])?v2["skos:prefLabel"].join("; "):v2["skos:prefLabel"])+`</a></li>`
			});
		concepts_list += `</ul>
			</div>
		</li>`
	});
	concepts_list += `</ul>`
	$( "#networks_vocabs" ).html( concepts_list );
}
// export model (visible part only) as PNG 
//$(document.body).on('click', 'a.consLink', function(e) { 
//	e.preventDefault();
//	addEleNode( e["target"]["hash"].substring( 1 ) );
//});

$(document.body).on('submit', '#keywordsearchForm', async function(e) {
	e.preventDefault();
	var match = $( "#keywordsearch" ).val(), kclass = $( "#keywordsearchClass" ).val(), q;
	if ( match == '' ) return;
	var inList = $( "#keywordsearch" ).attr( "list" );
	// check if term is from a controlled list
	var termInList = $( "datalist#"+inList+" option" ).filter(function() { return this.value == match; }).data('value');
	if ( !termInList && e.originalEvent.submitter.id == 'find' ) {
		$( '#keywordsearchForm button#add' ).after( `<div class="spinner-border text-info" role="status" style="margin-left:10px;float:right;margin-top:35px;"><span class="sr-only">Loading...</span></div>` );
		switch ( $( "#keywordsearch" ).attr("name") ) {
			case "wd-keyword":
				q = namespaces+`SELECT DISTINCT * 
					WHERE { 
						`+(( kclass != '' )?`?s a ?c .`:``)+`
						?s ?p ?o .
						`+(( kclass != '' )?`FILTER ( ?c IN (`+kclass+`) ) .`:``)+`
						FILTER ( ?p IN (crm:P1_is_identified_by,skos:prefLabel,skos:altLabel,skos:hiddenLabel,rdfs:label,crm:P190_has_symbolic_content) ) .
						FILTER ( regex(?o, "`+match+`", "i" ) ) .
					}
				`;
				break;
		}
		var r = await getJSONLD( q );
	    if ( !r.graph ) { r.graph = []; r.graph.push( r ); }
 		$( ".spinner-border").remove();
		var list_id = "datalist-"+uuidv4();
		var entities_list = ``;//`<select>`;
		$.each( r.graph, function(i,v) {
			label = ''
			if (v["crm:P1_is_identified_by"] !== undefined) {
				label = v["crm:P1_is_identified_by"]; 
			} else if ( v["skos:prefLabel"] !== undefined ) {
				label = v["skos:prefLabel"];
			} else if ( v["rdfs:label"] !== undefined ) {
				label = v["rdfs:label"];
			} else if ( v["skos:altLabel"] !== undefined ) {
				label = v["skos:altLabel"];
			} else if ( v["skos:hiddenLabel"] !== undefined ) {
				label = v["skos:hiddenLabel"];
			} else if ( v["crm:P190_has_symbolic_content"] !== undefined ) {
				label = v["crm:P190_has_symbolic_content"];
			}
			if ( label == '' ) return;
			entities_list += `<option value="`+v.id+`" data-value="`+v.id+`">`+
			label+`</option>`;
		});
//		entities_list += `</select>`;
		if ( entities_list != '' ) {
			$( '#keywordsearch' ).attr( "list", list_id );
			$( "#keywordsearch" ).append( `<datalist id="`+list_id+`"/>` );
			$( '#keywordsearch datalist#'+jqu( list_id ) ).html( entities_list );
		} else {
			$( '#keywordsearch' ).attr( "list", "none" );
		}
	} else if ( termInList && e.originalEvent.submitter.id == 'add') {
		$( "#keywordsearch" ).val("")
		await addEleNode( termInList );
	}
});

// export model (visible part only) as PNG 
$(document.body).on('click', '#graph_png', function(e) { 
	e.preventDefault();
	var b64key = 'base64,';
    var b64 = cy.png().substring( cy.png().indexOf(b64key) + b64key.length );
    var imgBlob = base64ToBlob( b64, 'image/png' );
    // see https://stackoverflow.com/questions/39168928/cytoscape-save-graph-as-image-by-button
	saveAs( imgBlob, 'RPPA-viewport-graph-'+Math.floor(Date.now() / 1000)+'.png'); 
});
// export model as JSON                                                                                                    
$(document.body).on('click', '#graph_cyjson', function(e) { 
	e.preventDefault();
	var jsonBlob = new Blob([ JSON.stringify( cy.json() ) ], { type: 'application/javascript;charset=utf-8' });
	saveAs( jsonBlob, 'RPPA-CYjson-graph-'+Math.floor(Date.now() / 1000)+'.json' ); 
});
$(document.body).on('click', '#graph_graphml', function(e) { 
	e.preventDefault();
	var jsonBlob = new Blob([ cy.graphml() ], { type: 'application/javascript;charset=utf-8' });
	saveAs( jsonBlob, 'RPPA-GraphML-graph-'+Math.floor(Date.now() / 1000)+'.xml' ); 	
});

$(document.body).on('click', '#graph_redraw', async function() {
	// re-run the ACTIVE view: rebuild the /maps geo-graph from the current filters; else the facet
	// grouping (cise) if one is on, else a plain cose layout
	if ( typeof nwMapMode !== 'undefined' && nwMapMode ) { if ( typeof window.mapsRedrawGraph === 'function' ) window.mapsRedrawGraph(); return; }
	if ( typeof nwGroupFacet !== 'undefined' && nwGroupFacet && typeof nwHasPanel === 'function' && nwHasPanel() ) await nwGroupByFacet( nwGroupFacet );
	else run_layout( 'cose' );
});
$( document.body ).on( 'click', '#collapseOne a.relsLink', function(e) {
	e.preventDefault();
	//$('.popover').remove();
	var vNodes = cy.nodes().not(':hidden, :transparent');
	var instances = [], instancesInfo = `<ul class="listBibl">`;
	$.each( vNodes, function( i,v ) {
		if ( v["_private"]["data"].class && v["_private"]["data"].class.includes( e.target.hash.substring(1) ) ) {
			instances.push( v["_private"]["data"] );
		}
	});
	$.each( instances , function( i,v ) {
		instancesInfo += `<li><a href="#`+v.id+`" style="color:`+v.color
		+`">`+truncateString(v.pref, 35)+((v.alt != false)?` (`+v.alt+`)`:``)+`</a></li>`;
	});
	instancesInfo += `</ul>`;
	$( "#collapseTwo .accordion-body" ).html( instancesInfo );
	$( "#headingTwo button" ).trigger( 'click' );
});
$( document.body ).on( 'click', '#collapseTwo a', async function(e) {
	e.preventDefault();
	$( "#headingThree button" ).trigger( 'click' );
	var j = cy.$( "[id='"+$(e.target).attr( 'href' ).substring(1)+"']" );
	cy.animate({
		zoom: 0.9,
		center: { eles: cy.filter( j ) }
	}, {
		duration: 500
	});
	graph = await getPRISMSobject( $(e.target).attr( 'href' ).substring(1) );
	var statementsInfo = tippyNodes( cy.$id( $(e.target).attr( 'href' ).substring(1) ), graph );
	$( "#collapseThree .accordion-body" ).html( statementsInfo );
	$( ".graph-about #tabDetails" ).html( statementsInfo );

});
// /PRISMS


// load layouts based on hash value
async function loadLayout() {
    var hash = location.hash.substring( location.hash.lastIndexOf("/")+1 ), source;
    regex = /(?<=^\/)[^\/]+/;
	//console.log( location.pathname.match( regex ) && location.pathname.match( regex )[0] ); 
	switch ( location.pathname.match( regex ) && location.pathname.match( regex )[0] ) {
        case "authors":
            switch ( true ) {
                case /#id\//.test( location.hash.substring( location.hash.indexOf("#"), location.hash.lastIndexOf("/")+1 ) ):
                    $( ".layout_navigation" ).hide();
					if (!$(".col-graph").length) {
	                    $( ".layout_wrapper" ).append(`<div class="col col-graph" style="flex:unset;"></div><div class="col col-content" style="flex:unset;padding-right:0;"><div id="content"></div></div>`);
    	                // load poet profile
        	            $( "#content" ).html( await poet_profile( hash ) );
            	        // load poet graph
                	    initializeGraph( "https://www.romanticperiodpoetry.org/id/"+hash+"/person", "authors" );
                    	$( ".layout_wrapper" ).css( "flex-wrap", "unset" );
	                    Split([ ".col-graph", ".col-content" ], { sizes: [73, 27], minSize: 450, gutterSize: 8 });
					}
                    break;
                case /\s?/.test( location.hash.substring( location.hash.indexOf("#"), location.hash.lastIndexOf("/")+1 ) ):
                    if ( location.hash === '' && $( ".layout_navigation" ).is(":hidden") ) {
                        $( ".col-graph,.col-content,.gutter" ).remove();
                        $( ".layout_wrapper" ).css( "flex-wrap", "wrap" );
                        $( ".layout_navigation" ).show();
                    }
                    break;
            }
            break;
        case "works":
		case "networks":
		case "maps":
			switch ( true ) {
                case /#text\//.test( location.hash.substring( location.hash.indexOf("#"), location.hash.lastIndexOf("/")+1 ) ):
					if ( $('.offcanvas.show').length ) { 
						$( myCanvasGTEl ).offcanvas( "hide" ); // myCanvasGT.hide(); // close any open texts if a new one is requested
						$(".popover").hide(); // hide if new text was called from a popover
					}
                    $( ".layout_navigation" ).hide();
					if (!$(".col-graph").length) {
						$( ".layout_wrapper" ).append(`<div class="col col-graph" style="flex:unset;"></div><div class="col col-content" style="flex:unset;padding-right:0;"><div id="content" class="globaltext"></div></div>`);
						$( ".layout_wrapper" ).addClass( "globaltext-container" );
						$( ".layout_wrapper" ).attr( 'data-tid', hash );
						$( ".layout_wrapper" ).attr( 'data-wid', texts[ hash ][ "work" ] );
						$( "#content" ).html(''); 
						// load global text graph
						initializeGraph( "https://www.romanticperiodpoetry.org/id/"+texts[ hash ][ "work" ]+"/work", "works" );
						// load global text
						await display_globaltext( hash, texts[ hash ][ "work" ] );
						// add the OntoPoetry "Structure" toggle to the graph panel
						opEnsureGraphPanel();
						$( ".layout_wrapper" ).css( "flex-wrap", "unset" );
						Split([ ".col-graph", ".col-content" ], { sizes: [73, 27], minSize: 450, gutterSize: 8 });
						previousState = location.href;
					}
                    break;
                case /#context\//.test( location.hash.substring( location.hash.indexOf("#"), location.hash.lastIndexOf("/")+1 ) ):
	                    await display_context( domain+"/id/"+location.hash.substring( location.hash.indexOf("/")+1 ) );
						$($( ".context-workbench .globaltext" )[0]).addClass( "col-sm-4" );
					break;
				case /#contribute\/1\//.test( location.hash.substring( location.hash.indexOf("#"), location.hash.lastIndexOf("/")+1 ) ):
					if ( !$( ".offcanvas" ).length || location.pathname.match( regex )[0] == "networks" || location.pathname.match( regex )[0] == "maps" ) {
						if (location.pathname.match( regex )[0] == "networks" || location.pathname.match( regex )[0] == "maps" ) {
							$( ".offcanvas" ).remove()
							$( ".offcanvas-backdrop" ).remove()
						}
						var modeC = {}
						modeC[ 'edit' ] = '#2a9d8f';
						modeC[ 'read' ] = 'var(--bs-orange)';
						modeC[ 'view' ] = 'var(--bs-orange)';
						$( "#mode" ).remove();
						mode = "edit";
						$( "head" ).append( `<style type="text/css" id="mode">.globaltext-workbench a,.globaltext-workbench a:hover,.globaltext-workbench a:visited,.globaltext-workbench a:active,.popover a.save,.popover a.cancel{color: `+modeC[ mode ]+` !important;}.globaltext-workbench .nav-pills .nav-link.active,.globaltext-workbench .bg-rppa,.globaltext-workbench .controls .btn{background-color:`+modeC[ mode ]+` !important;}.globaltext-workbench a.bg-rppa{color:white !important;}.globaltext-workbench input{accent-color: `+modeC[ mode ]+` !important;}.page-item .page-link {color:`+modeC[ mode ]+`;}.page-item.active .page-link {background-color:`+modeC[ mode ]+`;</style>` );
						await display_globaltext( hash, texts[ hash ][ "work" ] );
						$( ".globaltext-workbench .globaltext" ).addClass( "col-sm-4" );
						contribute_step1( hash, texts[ hash ][ "work" ] );
					} else {
						contribute_step1( hash, texts[ hash ][ "work" ] );
					}
					break;
				case /#contribute\/3\/genetic\/2\//.test( location.hash.substring( location.hash.indexOf("#"), location.hash.lastIndexOf("/")+1 ) ):
				case /#contribute\/3\/intratextual\//.test( location.hash.substring( location.hash.indexOf("#"), location.hash.lastIndexOf("/")+1 ) ):
				case /#contribute\/3\/typological\//.test( location.hash.substring( location.hash.indexOf("#"), location.hash.lastIndexOf("/")+1 ) ):
					if (/#contribute\/3\/genetic\/2\//.test( location.hash.substring( location.hash.indexOf("#"), location.hash.lastIndexOf("/")+1 ) )) {
						hash = previousGState.substring( previousGState.lastIndexOf("/")+1 );
					}
					if ( !$( ".offcanvas" ).length  || location.pathname.match( regex )[0] == "networks" || location.pathname.match( regex )[0] == "maps"  ) {
					    var modeC = {}
						modeC[ 'edit' ] = '#2a9d8f';
						modeC[ 'read' ] = 'var(--bs-orange)';
						modeC[ 'view' ] = 'var(--bs-orange)';
						$( "#mode" ).remove();
						mode = "edit";
						$( "head" ).append( `<style type="text/css" id="mode">.globaltext-workbench a,.globaltext-workbench a:hover,.globaltext-workbench a:visited,.globaltext-workbench a:active,.popover a.save,.popover a.cancel{color: `+modeC[ mode ]+` !important;}.globaltext-workbench .nav-pills .nav-link.active,.globaltext-workbench .bg-rppa,.globaltext-workbench .controls .btn{background-color:`+modeC[ mode ]+` !important;}.globaltext-workbench a.bg-rppa{color:white !important;}.globaltext-workbench input{accent-color: `+modeC[ mode ]+` !important;}.page-item .page-link {color:`+modeC[ mode ]+`;}.page-item.active .page-link {background-color:`+modeC[ mode ]+`;</style>` );
						await display_globaltext( hash.split( "-" )[0], texts[ hash.split( "-" )[0] ][ "work" ] );
						$( ".globaltext-workbench .globaltext" ).addClass( "col-sm-4" );
						contribute_step3( hash );
					} else {
						contribute_step3( hash );
					}
					break;
				case /#contribute\/2\/intratextual\//.test( location.hash.substring( location.hash.indexOf("#"), location.hash.lastIndexOf("/")+1 ) ):
					if ( !$( ".offcanvas" ).length  || location.pathname.match( regex )[0] == "networks" || location.pathname.match( regex )[0] == "maps"  ) {
					    var modeC = {}
						modeC[ 'edit' ] = '#2a9d8f';
						modeC[ 'read' ] = 'var(--bs-orange)';
						modeC[ 'view' ] = 'var(--bs-orange)';
						$( "#mode" ).remove();
						mode = "edit";
						$( "head" ).append( `<style type="text/css" id="mode">.globaltext-workbench a,.globaltext-workbench a:hover,.globaltext-workbench a:visited,.globaltext-workbench a:active,.popover a.save,.popover a.cancel{color: `+modeC[ mode ]+` !important;}.globaltext-workbench .nav-pills .nav-link.active,.globaltext-workbench .bg-rppa,.globaltext-workbench .controls .btn{background-color:`+modeC[ mode ]+` !important;}.globaltext-workbench a.bg-rppa{color:white !important;}.globaltext-workbench input{accent-color: `+modeC[ mode ]+` !important;}.page-item .page-link {color:`+modeC[ mode ]+`;}.page-item.active .page-link {background-color:`+modeC[ mode ]+`;</style>` );
						await display_globaltext( hash, texts[ hash ][ "work" ] );
						$( ".globaltext-workbench .globaltext" ).addClass( "col-sm-4" );
						intratextual_step2(hash, texts[ hash ][ "work" ]);
					} else {
						intratextual_step2(hash, texts[ hash ][ "work" ]);
					}
					break;
				case /#contribute\/2\/typological\//.test( location.hash.substring( location.hash.indexOf("#"), location.hash.lastIndexOf("/")+1 ) ):
					if ( !$( ".offcanvas" ).length  || location.pathname.match( regex )[0] == "networks" || location.pathname.match( regex )[0] == "maps"  ) {
					    var modeC = {}
						modeC[ 'edit' ] = '#2a9d8f';
						modeC[ 'read' ] = 'var(--bs-orange)';
						modeC[ 'view' ] = 'var(--bs-orange)';
						$( "#mode" ).remove();
						mode = "edit";
						$( "head" ).append( `<style type="text/css" id="mode">.globaltext-workbench a,.globaltext-workbench a:hover,.globaltext-workbench a:visited,.globaltext-workbench a:active,.popover a.save,.popover a.cancel{color: `+modeC[ mode ]+` !important;}.globaltext-workbench .nav-pills .nav-link.active,.globaltext-workbench .bg-rppa,.globaltext-workbench .controls .btn{background-color:`+modeC[ mode ]+` !important;}.globaltext-workbench a.bg-rppa{color:white !important;}.globaltext-workbench input{accent-color: `+modeC[ mode ]+` !important;}.page-item .page-link {color:`+modeC[ mode ]+`;}.page-item.active .page-link {background-color:`+modeC[ mode ]+`;</style>` );
						await display_globaltext( hash, texts[ hash ][ "work" ] );
						$( ".globaltext-workbench .globaltext" ).addClass( "col-sm-4" );
						typological_step2(hash, texts[ hash ][ "work" ]);
					} else {
						typological_step2(hash, texts[ hash ][ "work" ]);
					}
					break;
				case /#contribute\/2\/genetic\/2\//.test( location.hash.substring( location.hash.indexOf("#"), location.hash.lastIndexOf("/")+1 ) ):
					if ( !$( ".offcanvas" ).length  || location.pathname.match( regex )[0] == "networks" || location.pathname.match( regex )[0] == "maps"  ) {
					    var modeC = {}
						modeC[ 'edit' ] = '#2a9d8f';
						modeC[ 'read' ] = 'var(--bs-orange)';
						modeC[ 'view' ] = 'var(--bs-orange)';
						$( "#mode" ).remove();
						mode = "edit";
						$( "head" ).append( `<style type="text/css" id="mode">.globaltext-workbench a,.globaltext-workbench a:hover,.globaltext-workbench a:visited,.globaltext-workbench a:active,.popover a.save,.popover a.cancel{color: `+modeC[ mode ]+` !important;}.globaltext-workbench .nav-pills .nav-link.active,.globaltext-workbench .bg-rppa,.globaltext-workbench .controls .btn{background-color:`+modeC[ mode ]+` !important;}.globaltext-workbench a.bg-rppa{color:white !important;}.globaltext-workbench input{accent-color: `+modeC[ mode ]+` !important;}.page-item .page-link {color:`+modeC[ mode ]+`;}.page-item.active .page-link {background-color:`+modeC[ mode ]+`;</style>` );
						await display_globaltext( hash.split( "-" )[0], texts[ hash.split( "-" )[0] ][ "work" ] );
						$( ".globaltext-workbench .globaltext" ).addClass( "col-sm-4" );
						await genetic_step2(hash.split( "-" )[0], texts[ hash.split( "-" )[0] ][ "work" ]);
					}
					await display_globaltext( hash.split( "-" )[1], texts[ hash.split( "-" )[1] ][ "work" ] );
					//genetic_step2a();
					previousGState = location.href;
					break;
				case /#contribute\/2\/genetic\//.test( location.hash.substring( location.hash.indexOf("#"), location.hash.lastIndexOf("/")+1 ) ):
					if ( !$( ".offcanvas" ).length  || location.pathname.match( regex )[0] == "networks" || location.pathname.match( regex )[0] == "maps"  ) {
					    var modeC = {}
						modeC[ 'edit' ] = '#2a9d8f';
						modeC[ 'read' ] = 'var(--bs-orange)';
						modeC[ 'view' ] = 'var(--bs-orange)';
						$( "#mode" ).remove();
						mode = "edit";
						$( "head" ).append( `<style type="text/css" id="mode">.globaltext-workbench a,.globaltext-workbench a:hover,.globaltext-workbench a:visited,.globaltext-workbench a:active,.popover a.save,.popover a.cancel{color: `+modeC[ mode ]+` !important;}.globaltext-workbench .nav-pills .nav-link.active,.globaltext-workbench .bg-rppa,.globaltext-workbench .controls .btn{background-color:`+modeC[ mode ]+` !important;}.globaltext-workbench a.bg-rppa{color:white !important;}.globaltext-workbench input{accent-color: `+modeC[ mode ]+` !important;}.page-item .page-link {color:`+modeC[ mode ]+`;}.page-item.active .page-link {background-color:`+modeC[ mode ]+`;</style>` );
						await display_globaltext( hash, texts[ hash ][ "work" ] );
						$( ".globaltext-workbench .globaltext" ).addClass( "col-sm-4" );
						genetic_step2(hash, texts[ hash ][ "work" ]);
					} else {
						genetic_step2(hash, texts[ hash ][ "work" ]);
					}
					break;
				case /#node\//.test( location.hash.substring( location.hash.indexOf("#"), location.hash.lastIndexOf("/")+1 ) ):
					try { await initializeGraph( "" ); 
						  await addEleNode( location.hash.substring( location.hash.indexOf("#node/")+6 ) );
					} catch(e) {}
					break;
				case /\s?/.test( location.hash.substring( location.hash.indexOf("#"), location.hash.lastIndexOf("/")+1 ) ):
                    if ( location.hash === '' && $( ".layout_navigation" ).is(":hidden") ) {
                        $( ".col-graph,.col-content,.gutter" ).remove();
                        $( ".layout_wrapper" ).css( "flex-wrap", "wrap" );
                        $( ".layout_navigation" ).show();
                    }
					try { await initializeGraph( "" ); } catch(e) {}
					break;
			}
            break;
		case "id":
		case "rppa":
			var entity;
			if ( window.location.pathname.split('/')[1] == "id" ) {
				entity = "https://www.romanticperiodpoetry.org"+window.location.pathname.split('https://www.romanticperiodpoetry.org/id/')[0]
			} else {
				entity = "https://www.romanticperiodpoetry.org"+window.location.pathname.split('https://www.romanticperiodpoetry.org/rppa/')[0]
			}
			var q = namespaces+`SELECT * WHERE { 
				{ 
					<`+entity+`> ?p ?o . 
					OPTIONAL { 
						?o rdf:type ?qt .
						?o skos:prefLabel ?qp . 
						?o skos:altLabel ?qa .
					} 
					BIND ( <`+entity+`> as ?s ) BIND ( <default> as ?g )
				} 
				UNION 
				{ 
					?s ?p <`+entity+`> . 
					?s rdf:type ?qt .
					OPTIONAL { ?s skos:prefLabel ?qp . 
						?s skos:altLabel ?qa .
						} 
					BIND ( <`+entity+`> as ?o ) BIND ( <default> as ?g )
				} 
			}`;
			var graph = await getJSONLD( q, "raw" ); // DONE
			$( "#entity-view #tabDetails" ).html( formatEntity(entity, graph) );
			$( ".spinner-border").remove();
			break;
    }
}
