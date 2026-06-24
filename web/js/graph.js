
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
	// undo/redo extension
	ur = cy.undoRedo();
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
}

async function addEleNode( ele ) {
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

	// layout
	run_layout( 'cose', ele );
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

// run layout on graph
function run_layout( layout_name, focus ) {
	var layout = cy.elements().layout( cyLayouts[ layout_name ] );
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
    var nodes = cyInst.nodes( '.op-line, .op-stanza' );
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

// WP-D: contribution on-ramp — right-click a line to start a context here
function opAddContextMenu( cyInst, tid ) {
    try {
        cyInst.cxtmenu({
            selector: 'node.op-line',
            // cxtmenu sets outer radius = renderedWidth/2 + menuRadius; our line
            // nodes are very wide, so cancel the width term to get a constant ~60px.
            menuRadius: function( ele ) { return 60 - ele.renderedOuterWidth() / 2; },
            commands: [ {
                content: '<i class="fas fa-plus-circle"></i>',
                select: function() {
                    var loggedIn = ( typeof user !== 'undefined' && user ) || ( typeof username !== 'undefined' && username );
                    if ( !loggedIn ) { alert( 'Please log in to contribute a context.' ); return; }
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
        els.push({ data: { id: st.id, type: 'op-stanza',
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
    cyInst.on( 'tap', 'node.op-line', function( evt ) {
        var n = evt.target;
        if ( n.data( 'expanded' ) ) { opCollapseLine( cyInst, n ); } else { opExpandLine( cyInst, n ); }
    });
    // tap background -> collapse words + clear any focus
    cyInst.on( 'tap', function( evt ) {
        if ( evt.target === cyInst ) {
            cyInst.remove( '.op-tok' );
            cyInst.nodes( '.op-line' ).data( 'expanded', false );
            cyInst.elements().removeClass( 'op-dim op-focus' );
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
        <button type="button" class="btn btn-sm btn-outline-secondary op-fit" style="padding:0 8px;">fit</button>
        <span class="op-caption text-muted" style="font-style:italic;"></span>
        <span class="text-muted" style="margin-left:auto;">tap a line for its words · right-click to add a context</span>
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
    // expand all / collapse all line tokens (line-level stays the default)
    var allExpanded = false;
    $bar.find( '.op-expandall' ).on( 'click', async function() {
        var $b = $( this );
        if ( allExpanded ) { opCollapseAll( cyInst ); allExpanded = false; $b.text( 'expand all' ); }
        else { $b.text( '…' ); await opExpandAll( cyInst, textURI ); allExpanded = true; $b.text( 'collapse all' ); }
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
        cyInst.elements().addClass( 'op-dim' );
        st.removeClass( 'op-dim' ); lines.removeClass( 'op-dim' ).addClass( 'op-focus' );
        cyInst.fit( lines.union( st ), 60 );
        $caption.text( st.data( 'label' ) );
        $( this ).text( 'next ▸ (' + ( tourIdx + 1 ) + '/' + stanzas.length + ')' );
    } );
}

// Left graph-panel switcher: toggle .col-graph between the Contexts graph (#cy)
// and the OntoPoetry Structure graph (#cy-onto). Added in the poem reading view.
function opEnsureGraphPanel() {
    var $cg = $( '.col-graph' );
    if ( !$cg.length || $cg.find( '.op-graph-toggle' ).length ) return;
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
        $( '#cy' ).hide(); $cg.find( '.graph-about' ).hide();
        $( '#cy-onto-panel' ).css( 'display', 'flex' );
        var wid = $( '.layout_wrapper' ).attr( 'data-wid' ), tid = opActiveTextId();
        var textURI = 'https://www.romanticperiodpoetry.org/id/' + wid + '/' + tid;
        if ( $( '#cy-onto-panel' ).attr( 'data-uri' ) !== textURI ) { opShowStructure( textURI ); }
        else if ( opCY[ textURI ] ) { opCY[ textURI ].resize(); }
    } else {
        $( '#cy-onto-panel' ).hide();
        $( '#cy' ).show(); $cg.find( '.graph-about' ).show();
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
					onto[nsv( _l.filter( skp(graph, s.value, "rdf:type"), function(t) { return t.includes( 'cidoc-crm' ) 
						|| t.includes( 'frbr/' ) 
						|| t.includes( 'intro/' ) 
						|| t.includes( 'foaf/' )
						|| t.includes( 'lrmoo/' ) 
						|| t.includes( '/postdata' ) 
						|| t.includes( 'skos/' ) } )[0] 
					)].label+"\n" + (skp(graph, s.value, "crm:P1_is_identified_by")?
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
					node["data"]["name"] = (addicon( o.value )?addicon( o.value ):'')+" "+(onto[nsv( _l.filter( skp(graph, o.value, "rdf:type"), function(t) { return t.includes( 'cidoc-crm' ) || t.includes( 'frbr/' ) || t.includes( 'intro/' ) || t.includes( 'lrmoo/' ) || t.includes( '/postdata' ) || t.includes( 'skos/' ) || t.includes( 'foaf/' )} )[0] )].label)+"\n" + (skp(graph, o.value, "crm:P1_is_identified_by")?skp(graph, o.value, "crm:P1_is_identified_by"):skp(graph, o.value, "skos:prefLabel"));
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
							if ( e.data().img.startsWith( domain ) || e.data().img.includes( "/wikipedia/commons/thumb/" ) ) {
								return e.data().img;
							} else {
								var filename = decodeURIComponent( e.data().img.split("/").pop().replace(/%20/g, "_") );
								var md5Hash = CryptoJS.MD5( filename ).toString();
								return "https://upload.wikimedia.org/wikipedia/commons/"+md5Hash[0]+"/"+md5Hash[0]+md5Hash[1]+"/"+filename;
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
	if ( /\/networks\//.test(window.location.href)
	|| /\/authors\//.test(window.location.href) 
	|| /\/works\//.test(window.location.href)
	) {
	// workbench graph display
		graph_about += `<ul class="nav nav-tabs" id="graphTab">
		<li class="nav-item" role="presentation">
		  <a class="nav-link active" id="home-tab" data-bs-toggle="tab" href="#tabHome" role="tab" aria-controls="home" aria-selected="true"><i class="fas fa-info-circle"></i> Info</a>
		</li>
		<li class="nav-item" role="presentation">
		  <a class="nav-link" id="details-tab" data-bs-toggle="tab" href="#tabDetails" role="tab" aria-controls="details" aria-selected="false"><i class="fas fa-exchange-alt"></i> Details</a>
		</li>
		<li class="nav-item" role="presentation">
		  <a class="nav-link" id="settings-tab" data-bs-toggle="tab" href="#tabSettings" role="tab" aria-controls="settings" aria-selected="false"><i class="fas fa-cog"></i> Settings</a>
		</li>
  		</ul>
  		<div class="tab-content" id="myTabContent" style="overflow-y: auto;">
			<div class="tab-pane fade show active" id="tabHome" role="tabpanel" aria-labelledby="home-tab"></div>
			<div class="tab-pane fade" id="tabDetails" role="tabpanel" aria-labelledby="details-tab"></div>
			<div class="tab-pane fade" id="tabSettings" role="tabpanel" aria-labelledby="settings-tab"></div>
		  </div>`;
        $( ".graph-about" ).css( "display","unset" );
		$( ".graph-about" ).html( graph_about );
		$( ".graph-about #tabSettings" ).append( `
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
	// Initialize navigator and panzoom
	var nav = cy.navigator({ container: ".cytoscape-navigator" });
	cy.panzoom();
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

$(document.body).on('click', '#graph_redraw', function() { 
	run_layout( 'cose' );
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
