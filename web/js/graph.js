
// load consolidated ontologies
$.ajax({url: "/data/graphs/onto.json", dataType: 'json', async: false,
    success: function (data) { onto = data; },
    error: function (jqXHR, textStatus, errorThrown) { console.log(jqXHR, textStatus, errorThrown); }
});


// PRISMS graph view

var cy, eh, ontofcr = [], graph_icon = {}, graph_uuid = {}, graph_col = {};
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
graph_uuid["lang"] = {};
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
		throw 'NO GRAPH DATA!';
	}
    data = await createCYJSON( graph, view );
    if ( $( "#cy" ).length ) {
		cy.add( data );
		run_layout( view == 'authors'?'klay':'cose');
    } else {
        $( ".col-graph" ).append( `<div id='cy' class="spinner"><div class="cytoscape-navigator" style="display:none;"></div></div>` );
		createCYgraph( data, graph, cyLayouts[ "cose" ] );
    }
}

// run layout on graph
function run_layout( layout_name ) {
	var layout = cy.elements().layout( cyLayouts[ layout_name ] );
	layout.run();
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
			// nodes will be counted only once and must be part of PRISMS, and single- or multi-volume object
			if ( v.o.type == 'uri' && !node_seen[ v.o.value ]
				&& ( v.o.value.startsWith( id ) || v.o.value.startsWith( domain + "/id/" ) )
//				|| ( v.o.value.includes( "/expression/" ) )
//				|| ( v.o.value.includes( "/work" ) )
//				|| ( v.o.value.includes( "/publication" ) )
//				|| ( v.o["value"].includes( "/manifestation") )// including their publication events
// 				|| ( v.p["value"].includes( "embodies") ) // including digital manifestations
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
	var jsonObj = [], nodes_seen = [];

    // process triples in the graph object
	for ( var i=0; i<graph.length; i++ ) {
		var v = graph[ i ];
		var s = v.s;
		var p = v.p;
		var o = v.o;
		var g = v.g;
		if ( view == "authors" ) {
			if (   p.value.includes( 'R3_' ) 
				|| p.value.includes( 'creator' )
				|| p.value.includes( 'R19i_' )
				|| p.value.includes( 'R16_' )
			) { continue; }
		} else if (view == "works" ) {
			if (   p.value.includes( 'R17i_' ) 
				|| p.value.includes( 'creator' )
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
			) { continue; }
		}
		// process PRISMS elements
		if ( typeof nodes_seen[s.value] == 'undefined' // count each instance once
			&& s["value"].startsWith( domain )
		) {
			nodes_seen[s.value] = 1;
			// process nodes (s)
			var node = {};
			node["data"] = { "id": s.value };
			node["classes"] = "node";
			node["data"]["name"] = (addicon( s.value )?addicon( s.value ):'')+" "+onto[nsv(skp(graph, s.value, "rdf:type")[0])].label+"\n" + skp(graph, s.value, "crm:P1_is_identified_by"); // default is P1_is_identified_by
			node["data"]["pref"] = skp(graph, s.value, "skos:prefLabel");
			node["data"]["alt"] = skp(graph, s.value, "skos:altLabel");
			node["data"]["img"] = skp(graph, s.value, "crm:P138i_has_representation") || skp(graph, s.value, "wdt:P18");
			node["data"]["class"] = skp(graph, s.value, "rdf:type") ;//|| s.value.includes( "/expression/" )?"http://iflastandards.info/ns/fr/frbr/frbroo/F2_Expression":s.value.includes( "/publication/" )?"http://iflastandards.info/ns/fr/frbr/frbroo/F32_Carrier_Production_Event":'';
			node["data"]["shape"] = ((skp(graph, s.value, "rdf:type").filter(s => s.includes("http://www.ics.forth.gr/isl/CRMdig/")).length > 0 || skp(graph, s.value, "rdf:type").filter(s => s.includes("https://www.prisms.digital")).length > 0)?"round-rectangle": (nsv(skp(graph, s.value, "rdf:type")[0]) == "lrmoo:F1_Work" || nsv(skp(graph, s.value, "rdf:type")[0]) == "lrmoo:F2_Expression" || s.value.includes( "/expression/" ))?"round-hexagon":"ellipse" );
			node["data"]["bgcolor"] = (function() {
				if ( s.value.includes( "/expression/" ) || s.value.includes( "/manifestation/" ) ) {
					if (s.value.endsWith( "/1" )) { return graph_col["expression1"]; }
					else if (s.value.endsWith( "/2" )) { return graph_col["expression2"]; }
					else if (s.value.endsWith( "/3" )) { return graph_col["expression3"]; }
					else if (s.value.endsWith( "/4" )) { return graph_col["expression4"]; }
				} else return graph_col[nsv(skp(graph, s.value, "rdf:type")[0])];
			})();
			jsonObj.push(node);
		}
		if ( s["value"].startsWith(domain) 
		 ) {
			// process edges (p)
			if ( o.type == "uri" // if object is a node
				&& o["value"].startsWith(domain) // and it is in the PRISMS NS
				&& (!nsv(p["value"]).startsWith( "dcterms:" ) || nsv(p["value"]).endsWith( "creator" ))
				&& !o["value"].endsWith( "/restricted" )
				&& !(nsv(p["value"]).startsWith( "crm:P138i" ) || nsv(p["value"]).startsWith( "pdc:portrait" ) )
                && !(nsv(p["value"]).startsWith( "pdc:" ) || nsv(p["value"]).startsWith( "pdt:" ) || nsv(p["value"]).startsWith( "pdp:" ) )
            ) {
				// object properties (relationships)
				var edge = {};
				edge["data"] = { "name": ((onto[nsv(p.value)]) ? onto[nsv(p.value)].label : ((nsv(p.value)) ? nsv(p.value) : p.value)), "id": uuidv4() };
				edge["data"]["source"] = s.value;
				edge["data"]["target"] = o.value;
				edge["classes"] = "edge";
				edge["data"]["class"] = p.value;
				edge["data"]["bgcolor"] =  (function() {
					if ( o.value.includes( "/expression/" ) || o.value.includes( "/manifestation/" ) ) {
						if (o.value.endsWith( "/1" )) { return graph_col["expression1"]; }
						else if (o.value.endsWith( "/2" )) { return graph_col["expression2"]; }
						else if (o.value.endsWith( "/3" )) { return graph_col["expression3"]; }
						else if (o.value.endsWith( "/4" )) { return graph_col["expression4"]; }
					} else return graph_col[nsv(skp(graph, o.value, "rdf:type")[0])];
				})();	
				jsonObj.push(edge);
				nodes_seen[ o.value ] = 1;
				var node = {};
				node["data"] = { "id": o.value };
				node["classes"] = "node";
				node["data"]["name"] = (addicon( o.value )?addicon( o.value ):'')+" "+(nsv(skp(graph, o.value, "rdf:type")[0]) in onto?onto[nsv(skp(graph, o.value, "rdf:type")[0])].label:nsv(skp(graph, o.value, "rdf:type")[0]))+"\n" + skp(graph, o.value, "crm:P1_is_identified_by");
				node["data"]["pref"] = skp(graph, o.value, "skos:prefLabel");
				node["data"]["alt"] = skp(graph, o.value, "skos:altLabel");
				node["data"]["img"] = skp(graph, o.value, "crm:P138i_has_representation") || skp(graph, o.value, "wdt:P18");
				node["data"]["class"] = skp(graph, o.value, "rdf:type") ;//|| o.value.includes( "/expression/" )?"http://iflastandards.info/ns/fr/frbr/frbroo/F2_Expression":o.value.includes( "/publication/" )?"http://iflastandards.info/ns/fr/frbr/frbroo/F32_Carrier_Production_Event":'';
				node["data"]["shape"] = (((skp(graph, o.value, "rdf:type") && skp(graph, o.value, "rdf:type").filter(s => s.includes("http://www.ics.forth.gr/isl/CRMdig/")).length > 0) || (skp(graph, o.value, "rdf:type") && skp(graph, o.value, "rdf:type").filter(s => s.includes("https://www.prisms.digital")).length > 0))?"round-rectangle": (nsv(skp(graph, o.value, "rdf:type")[0]) == "lrmoo:F1_Work" || nsv(skp(graph, o.value, "rdf:type")[0]) == "lrmoo:F12_Nomen" || nsv(skp(graph, o.value, "rdf:type")[0]) == "lrmoo:F2_Expression" || o.value.includes( "/expression/" ))?"round-hexagon":"ellipse" );
				node["data"]["private"] = ((g.value.startsWith( context["@context"]["prisms"] ))?true:false);
				node["data"]["bgcolor"] = (function() {
					if ( o.value.includes( "/expression/" ) || o.value.includes( "/manifestation/" ) ) {
						if (o.value.endsWith( "/1" )) { return graph_col["expression1"]; }
						else if (o.value.endsWith( "/2" )) { return graph_col["expression2"]; }
						else if (o.value.endsWith( "/3" )) { return graph_col["expression3"]; }
						else if (o.value.endsWith( "/4" )) { return graph_col["expression4"]; }
					} else return graph_col[nsv(skp(graph, o.value, "rdf:type")[0])];
				})();
				jsonObj.push(node);
			} else if ((
				// dataType properties
				o.type == "literal"
				// do not display as dataType properties in the graph, but in tippies instead
				&& !(
					p.value.startsWith   (context["@context"]["rdf"]    + "type")
					|| p.value.startsWith(context["@context"]["skos"]   + "prefLabel")
					|| p.value.startsWith(context["@context"]["skos"]   + "altLabel")
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
				if ( nsv( p.value ) == "crm:P72_has_language" ) {
					if ( graph_uuid["lang"][ o.value ] ) {
						dtp = graph_uuid["lang"][ o.value ];
					} else {
						dtp = graph_uuid["lang"][ o.value ] = uuidv4();
					}
				} else if ( nsv( p.value ) == "crm:P46i_forms_part_of" ) {
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
					dtp = uuidv4();
				}
				node["data"] = { "id": "_:dtp-" + dtp };
				node["data"]["name"] = ((onto[nsv(o.value)]) ? onto[nsv(o.value)].label : ((nsv(o.value)) ? nsv(o.value) : o.value));
				node["data"]["pref"] = skp(graph, o.value, "skos:prefLabel");
				node["data"]["alt"] = skp(graph, o.value, "skos:altLabel");
				node["data"]["class"] = o.type;
				node["classes"] = "node";
				node["data"]["shape"] = "round-octagon";
				node["data"]["private"] = ((g.value.startsWith( context["@context"]["prisms"] ))?true:false);
				node["data"]["bgcolor"] = graph_col[nsv(skp(graph, o.value, "rdf:type")[0])] || '#AA4465';
				jsonObj.push(node);
				var edge = {};
				edge["data"] = { "name": ((onto[nsv(p.value)]) ? onto[nsv(p.value)].label : ((nsv(p.value)) ? nsv(p.value) : p.value)), "id": uuidv4() };
				edge["data"]["class"] = p.value;
				edge["data"]["source"] = s.value;
				edge["data"]["target"] = "_:dtp-" + dtp;
				edge["classes"] = "edge";
				edge["data"]["private"] = ((g.value.startsWith( context["@context"]["prisms"] ))?true:false);
				edge["data"]["bgcolor"] = (theme == 'dark')?"white":"#333";
				jsonObj.push(edge);
			}
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
					if ( nsv( p.value) == "crm:P106_is_composed_of" || nsv( p.value) == "crm:P70i_is_documented_in" || nsv( p.value) == "dcterm:created" 
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
					((o.value.startsWith( 'http') && nsv(p.value) != "rdf:type" )?`<a href="`+o.value+`" style="color:`+cy.$id( node.id() )["_private"].data.color
					+`"`+addition:``)+
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
						if ( nsv( v.p.value) == "dcterm:creator" ) { return; }
						contentR += `<li data-s="` + v.s.value + `" data-p="` + v.p.value + `" data-o="` + v.o.value + `"><span style="font-style:italic;">`
						+ (onto[nsv(v.p.value)] ? onto[nsv(v.p.value)].label : (nsv(v.p.value) ? nsv(v.p.value) : v.p.value))
						+ `</span> &nbsp; <span><a `+((v.o.type == "uri")?`data-component="`+v.o.value+`"`:``)+` href="`+v.o.value+`" class="nodejump add_ent_wb" style="color:`+cy.$id( node.id() )["_private"].data.color
						+`">` +
							//(onto[nsv(o.value)] ? onto[nsv(o.value)].label :
							((v.qp)?truncateString(v.qp.value,35) + ((v.qa)?` (`+v.qa.value+`)`:``):truncateString(v.o.value,35))
						+ `</a></span></li>`;
					} else if ( ((v.o.type=='uri' && v.o.value == node.id())) && (v.s.value.startsWith( domain ) || v.s.value.startsWith( "_:" )) ) {
						 // incoming
						contentL += `<li data-s="` + v.s.value + `" data-p="` + v.p.value + `" data-o="` + v.o.value + `"><span style="font-style:italic;">`
						+ (onto[nsv(v.p.value)] ? onto[nsv(v.p.value)].label : (nsv(v.p.value) ? nsv(v.p.value) : v.p.value))
						+ `</span> &nbsp; <span><a `+((v.s.type == "uri")?`data-component="`+v.s.value+`"`:``)+` href="`+v.s.value+`" class="nodejump add_ent_wb" style="color:`+cy.$id( node.id() )["_private"].data.color
						+`">` +
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
							+ `</span> &nbsp; <span><a `+((v.s.type == "uri")?`data-component="`+v.s.value+`"`:``)+` href="`+v.s.value+`" class="nodejump add_ent_wb" style="color:`+cy.$id( node.id() )["_private"].data.bgcolor
							+`">` +
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
						+ `</span> &nbsp; <span style="color:`+v["_private"].data.color
						+`"><a href="`+v["_private"].data.target+`" class="nodejump" style="color:`+v["_private"].data.color
						+`">` +
							//(onto[nsv(o.value)] ? onto[nsv(o.value)].label :
							((cy.$id( v["_private"].data.target )["_private"].data.name.split("\n")[1])?cy.$id( v["_private"].data.target )["_private"].data.name.split("\n")[1]:cy.$id( v["_private"].data.target )["_private"].data.name.split("\n")[0])
						+ `</a></span></li>`;
					} else if ( v["_private"].data.target == node.id() && v["_private"].data.source.startsWith( domain ) ) {
						// incoming
						contentL += `<li data-s="` + v["_private"].data.source + `" data-p="` + v["_private"].data.class + `" data-o="` + v["_private"].data.target + `"` + `><span style="font-style:italic;">`
						+ (onto[nsv(v["_private"].data.class)] ? onto[nsv(v["_private"].data.class)].label : (nsv(v["_private"].data.class) ? nsv(v["_private"].data.class) : v["_private"].data.class))
						+ `</span> &nbsp; <span><a href="`+v["_private"].data.source+`" class="nodejump" style="color:`+v["_private"].data.color
						+`">` +
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
                var tippy = node.popper({
                    content: () => {
                       let content = document.createElement('div');
                       content.innerHTML = "<p><b>Relationships</b></p>"+contentL+contentR;
                       return content;
                    },
                });
                var tippy2 = node.popper({
                    content: () => {
                       let content = document.createElement('div');
                       content.innerHTML = "<p><b>Properties</b></p>"+contentP;
                       return content;
                    },
                });
                tippyShowHandler = function() { tippy.show(); tippy2.show(); };
				tippyHideHandler = function() { tippy.hide(); tippy2.hide(); };
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
					'background-color': (theme == 'dark')?"#333":"white",//function (e) { return e.data().bgcolor },
					'color': (theme == 'dark')?"white":"black", 
					'label': function (e) { return ((e.data().name)?e.data().name.replace(/\\n/g, '\n'):
						e.data().id.includes( "/expression/" )?'Expression':e.data().id.includes( "/publication/")?'Publication':'')
						//(((e.data().class) ? ((onto[nsv(e.data().class)]) ? onto[nsv(e.data().class)].label : (nsv(e.data().class) ? nsv(e.data().class) : e.data().class)) + `\n` : ``) + e.data().type)) 
					},
					'background-image': function (e) { 
						if ( e.data().img ) {
							if ( e.data().img[0].startsWith( domain ) || e.data().img[0].includes( "/wikipedia/commons/thumb/" ) ) {
								return e.data().img[0];
							} else {
								var filename = decodeURIComponent( e.data().img[0].split("/").pop().replace(/%20/g, "_") );
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
                    'color': (theme == 'dark')?"white":"#333",
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
				selector: 'edge[target^="_"]',
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
					'color': (theme == 'dark')?"white":"#333"
					//'color': function (color) { return color.data().color }, 
				}
			},
			{
				selector: 'node.highlight',
				style: {
					'color': function (e) { if ( e.data().img ) { return e.data().color || '#cd6711' } else { return ((theme == 'dark')?"#white":"white") } },
					'background-color': function (e) { return e.data().bgcolor || '#cd6711' }
				}
			},
			{
				selector: 'node[shape="round-diamond"].highlight',
				style: {
					'color': function (e) { return e.data().color || 'rgba(245,251,253,1)' },
					'background-color': function (e) { return e.data().bgcolor || '#cd6711' }
				}
			},
			{
				selector: 'node.semitransp',
				style: { 'opacity': '0.4' }
			},
			{
				selector: 'edge.highlight',
				style: { 'target-arrow-color': function (e) { return e.data().bgcolor || '#cd6711' }
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
	// graph preview in search results
	if ( cy.container().parentNode.className == "modal-body" ) {
		graph_about += `<ul class="nav nav-tabs" id="graphTab" role="tablist">
		<li class="nav-item" role="presentation">
		  <a class="nav-link active" id="home-tab" data-toggle="tab" href="#tabHome" role="tab" aria-controls="home" aria-selected="true"><i class="fas fa-info-circle"></i> Info</a>
		</li>
		</ul>
		<div class="tab-content" id="myTabContent" style="overflow-y: auto;height: calc( 100vh - 541px);">
			<div class="tab-pane fade show active" id="tabHome" role="tabpanel" aria-labelledby="home-tab"></div>
		</div>
		`;
		$( "#newGraph .modal-body .graph-about" ).html( graph_about );
	} else {
	// workbench graph display
		graph_about += `<ul class="nav nav-tabs" id="graphTab" role="tablist">
		<li class="nav-item" role="presentation">
		  <a class="nav-link active" id="home-tab" data-toggle="tab" href="#tabHome" role="tab" aria-controls="home" aria-selected="true"><i class="fas fa-info-circle"></i> Info</a>
		</li>
		<li class="nav-item" role="presentation">
		  <a class="nav-link" id="details-tab" data-toggle="tab" href="#tabDetails" role="tab" aria-controls="details" aria-selected="false"><i class="fas fa-exchange-alt"></i> Details</a>
		</li>
		<li class="nav-item" role="presentation">
		  <a class="nav-link" id="settings-tab" data-toggle="tab" href="#tabSettings" role="tab" aria-controls="settings" aria-selected="false"><i class="fas fa-cog"></i> Display</a>
		</li>
  		</ul>
  		<div class="tab-content" id="myTabContent" style="overflow-y: auto;height: calc( 100vh - 430px);">
			<div class="tab-pane fade show active" id="tabHome" role="tabpanel" aria-labelledby="home-tab"></div>
			<div class="tab-pane fade" id="tabDetails" role="tabpanel" aria-labelledby="details-tab"></div>
			<div class="tab-pane fade" id="tabSettings" role="tabpanel" aria-labelledby="settings-tab"></div>
		  </div>`;
        // TODO
        /*
		$( ".graph-about" ).html( graph_about );
		$( ".graph-about #tabSettings" ).append( `<p/>
		<ul class="listBibl" style="text-indent:unset;"><li>Node display

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
		<li>Graph display<div style="padding-left: 15px;">
  		<button type="button" class="btn" style="background-color:rgb(18, 122, 140); color:#fff;" id="graph_redraw">Redraw graph</button></div></ul>` );
        */
	}
	// Initialize navigator and panzoom
	var nav = cy.navigator({ container: ".cytoscape-navigator" });
	cy.panzoom();
	// Event handlers
	// initialize edgehandles for workbench, and tippies for graph preview
	if ( cy.container().parentNode.className != "modal-body" ) {
		var tippy, tippy2;
		eh = cy.edgehandles({
            preview: true, // whether to show added edges preview before releasing selection
            hoverDelay: 150, // time spent hovering over a target node before it is considered selected
            handleNodes: 'node[shape != "round-diamond"]', // selector/filter function for whether edges can be made from a given node
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
                $.each( _.uniq(_.flatten( trelsdd.concat( trelsdi ) )), function( i,v ) {
                    $.each( targetNode["_private"].data.class, function( i2,v2 ) {
                        if ( onto[ v ] && onto[ v ].range == nsv(v2) ) {
                            hitd.push( v );
                        }
                    });
                });
                $.each( _.uniq(_.flatten( trelsdd.concat( trelsdi ).concat( trelsid ).concat( trelsii ) )), function( i,v ) {
                    $.each( targetNode["_private"].data.class, function( i2,v2 ) {
                        crels = retrieve_class_relationships( nsv(v2) );
                        if ( onto[ v ] && onto[ v ].range == nsv(v2) || _.uniq(_.flatten( crels[0].concat(crels[1]) )).includes( onto[ v ].range ) ) {
                            hiti.push( v );
                        }
                    });
                });
                hiti = _.difference(hiti, hitd);
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
				$.each( _.uniq(_.flatten( trelsdd.concat( trelsdi ) )), function( i,v ) {
					$.each( targetNode["_private"].data.class, function( i2,v2 ) {
						if ( onto[ v ] && onto[ v ].range == nsv(v2) ) {
							hitd.push( v );
						}
					});
				});
				$.each( _.uniq(_.flatten( trelsdd.concat( trelsdi ).concat( trelsid ).concat( trelsii ) )), function( i,v ) {
					$.each( targetNode["_private"].data.class, function( i2,v2 ) {
						crels = retrieve_class_relationships( nsv(v2) );
						if ( onto[ v ] && onto[ v ].range == nsv(v2) || _.uniq(_.flatten( crels[0].concat(crels[1]) )).includes( onto[ v ].range ) ) {
							hiti.push( v );
						}
					});
				});
				hiti = _.difference(hiti, hitd);
				var sonto = '<ul class="listBibl">', sonto2 = '<ul class="listBibl">';
				$.each( _.uniq( _.flatten( hitd ) ), function(i,v) {
					sonto += `<li><span style="font-style:italic;">`+ onto[ v ].label +`</span> &nbsp; <span>`+((onto[ onto[ v ].range ])?onto[ onto[ v ].range ].label:onto[ v ].range)+` (class)</span></li>`;
				});
				$.each( _.uniq( _.flatten( hiti ) ), function(i,v) {
					sonto2 += `<li><span style="font-style:italic;">`+ onto[ v ].label +`</span> &nbsp; <span>`+((onto[ onto[ v ].range ])?onto[ onto[ v ].range ].label:onto[ v ].range)+` (class)</span></li>`;
				});
				sonto += '</ul>'; sonto2 += '</ul>';
				tippy = makeTippy( targetNode, "<p><b>"+_.uniq( _.flatten(hitd)).length+" direct relationships</b>"+sonto+"<p><b>"+_.uniq( _.flatten(hiti)).length+" inferred relationships</b>"+sonto2, 'right');
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
                $.each( _.uniq( _.flatten( trelsdd.concat( trelsdi ) ) ), function(i,v) {
                    sonto += `<li><span style="font-style:italic;">`+ onto[ v ].label +`</span> &nbsp; <span>`+((onto[ onto[ v ].range ])?onto[ onto[ v ].range ].label:onto[ v ].range)+` (class)</span></li>`;
                });
                sonto += '</ul>';
                tippy2 = makeTippy( sourceNode, "<p><b>"+_.uniq( _.flatten(trelsdd.concat(trelsdi))).length+" direct relationships</b></p>"+sonto+"<p>+ "+_.uniq( _.flatten(trelsid.concat(trelsii))).length+" inferred relationships</p>", 'left');
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
		cy.on('dblclick', function(evt) {
//			console.log( evt );
			if ( evt["target"]["_private"].data.class.includes( "http://iflastandards.info/ns/lrm/lrmoo/F1_Work") ) {
				window.location.href = '/works/';
				// this patterns return the "first" expression of a work, e.g. "text01234":
				// _.groupBy( texts, 'work')["work00932"][0].text
			}
			// TODO: double click on empty bakground =
			//addModelling();
			// TODO: double click on node = reveal neighborhood -> graph traversal
		});
		cy.on('dblclick:timeout', function(evt) {
		});
	} else {
		tippyNodes( cy.nodes(), graph );
	}
    // TODO
    tippyNodes( cy.nodes(), graph );
	$( ".cytoscape-navigator" ).css( "display","unset" );
    // Event handlers
	// retrieve traversal paths
	cy.on('click', 'node,edge', async function (e) {
		var ele = e.target, q;
		var j = cy.$id( ele.id() );
		cy.animate({
			center: { eles: cy.filter( j ) },
			zoom: 0.9
		}, {
			duration: 500
		});
		if ( $( "[id='cy']" )[0].parentNode.className != "modal-body" ) {
			if (!$( "#details-tab" ).hasClass( "active" ) ) { $( "#details-tab" ).click() }
			var q;
			if ( ele["_private"].data.shape == "round-diamond" ) {
				// non-node
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
					UNION 
					{
						GRAPH `+user+` { 
							?s <`+edge+`> ?o . 
							OPTIONAL { ?s skos:prefLabel ?qp . 
								?s skos:altLabel ?qa . } 
							BIND (<`+edge+`> AS ?p)
							BIND (<`+user+`> AS ?g) 
							FILTER ( ?o = '`+ele["_private"].data.name+`' ) 
						}
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
					UNION
					{
						{
							GRAPH `+user+` { 
								<`+ele.id()+`> ?p ?o . 
								OPTIONAL { ?o skos:prefLabel ?qp . 
									?o skos:altLabel ?qa . } 
								BIND ( <`+ele.id()+`> as ?s ) BIND ( `+user+` as ?g )
							}
						} 
						UNION
						{ 
							GRAPH `+user+` { 
								?s ?p <`+ele.id()+`> . 
								OPTIONAL { ?s skos:prefLabel ?qp . 
									?s skos:altLabel ?qa . } 
								BIND ( <`+ele.id()+`> as ?o ) BIND ( `+user+` as ?g )
							}
						} 
					}
				}`;
			}
			var graph = await getJSONLD( q, "raw" ); // DONE
			var statementsInfo = tippyNodes( ele, graph, true );
			$( ".graph-about #tabDetails" ). html( statementsInfo );
		}
	});
	// highlight connections
	cy.on('mouseover', 'node', function (e) {
		var sel = e.target;
		cy.elements()
			.difference(sel.outgoers()
			.union(sel.incomers()))
			.not(sel)
			.addClass('semitransp');
		sel.addClass('highlight')
			.outgoers()
			.union(sel.incomers())
			.addClass('highlight');
		var bgcol = ((sel["_private"].data.shape == "round-diamond")?sel["_private"].data.color:sel["_private"].data.bgcolor);
		$( "#objects .k-card-header" ).css("background-color","");
		$( "#objects [id='"+domain+"/item/"+sel["_private"].data.origin+"'] .k-card-header" ).css("background-color",String( bgcol ));
		if ( $( "#objects [id='"+domain+"/item/"+sel["_private"].data.origin+"']" )[0] ) {
			$( "#objects [id='"+domain+"/item/"+sel["_private"].data.origin+"']" )[0].scrollIntoView({behavior: "smooth", block: "center"});
		}
	}).on('mouseout', 'node', function (e) {
		var sel = e.target;
		cy.elements()
			.removeClass('semitransp');
		sel.removeClass('highlight')
			.outgoers()
			.union(sel.incomers())
			.removeClass('highlight');
		$( "#objects .k-card-header" ).css("background-color","");
	});
}

// generate workbench graph info (classes/instances/statements)
function updateGraphInfo( level ) {
	var classes = [], classInfo = `<ul class="listBibl">`;
	$.each( cy.nodes(), function( i,v ) {
		classes.push( v["_private"]["data"].class );
	});
	$.each( _.uniq( _.flatten( classes )) , function( i,v ) {
		if ( v && onto[ nsv( v )] ) {
			if ( !level || ( level == "digital" && (nsv(onto[ nsv(v) ].about).startsWith( 'crmdig' ) || nsv(onto[ nsv(v) ].about).startsWith( 'prisms' )) ) ||
				( level == "material" && !(nsv(onto[ nsv(v) ].about).startsWith( 'crmdig' ) || nsv(onto[ nsv(v) ].about).startsWith( 'prisms' )) ) ||
				( level == "both" ) ) {
				classInfo += `<li><a href="#`+onto[ nsv(v) ].about+`" class="relsLink">`+onto[ nsv(v) ].label+`</a></li>`;
			}
		}
	});
	classInfo += `</ul>`;
	return `<div class="accordion" id="workbenchGraph">
	<div class="card" style="border:0;border-radius:unset;border-bottom:1px solid #ccc;">
		<div class="card-header" id="headingOne" style="padding:0;background-color:unset;">
			<h2 class="mb-0">
				<button class="btn text-left collapsed" style="text-decoration:none;border:0;color:#138496;border-bottom:1px" type="button" data-toggle="collapse" data-target="#collapseOne" aria-expanded="false" aria-controls="collapseOne">Classes</button>
			</h2>
		</div>
		<div id="collapseOne" class="collapse show" aria-labelledby="headingOne" data-parent="#workbenchGraph">
			<div class="card-body" style="padding:.75rem;">`+classInfo+`</div>
		</div>
	</div>
	<div class="card" style="border:0;border-radius:unset;border-bottom:1px solid #ccc;">
		<div class="card-header" id="headingTwo" style="padding:0;background-color:unset;">
			<h2 class="mb-0">
				<button class="btn text-left collapsed" style="text-decoration:none;border:0;color:#138496;border-bottom:1px" type="button" data-toggle="collapse" data-target="#collapseTwo" aria-expanded="false" aria-controls="collapseTwo">Instances</button>
			</h2>
		</div>
		<div id="collapseTwo" class="collapse" aria-labelledby="headingTwo" data-parent="#workbenchGraph">
			<div class="card-body" style="padding:.75rem;"></div>
		</div>
	</div>
	<div class="card" style="border:0;border-radius:unset;border-bottom:1px solid #ccc;">
		<div class="card-header" id="headingThree" style="padding:0;background-color:unset;">
			<h2 class="mb-0">
				<button class="btn text-left collapsed" style="text-decoration:none;border:0;color:#138496;border-bottom:1px" type="button" data-toggle="collapse" data-target="#collapseThree" aria-expanded="false" aria-controls="collapseThree">Statements</button>
			</h2>
		</div>
		<div id="collapseThree" class="collapse" aria-labelledby="headingThree" data-parent="#workbenchGraph">
			<div class="card-body" style="padding:.75rem;"></div>
		</div>
	</div>
	</div>`;
}

// /PRISMS


// load layouts based on hash value
async function loadLayout() {
    var hash = location.hash.substring( location.hash.indexOf("/")+1 ), source;
    regex = /(?<=^\/)[^\/]+/;
    switch ( location.pathname.match( regex )[0] ) {
        case "authors":
            switch ( location.hash.substring( location.hash.indexOf("#"), location.hash.indexOf("/")+1 ) ) {
                case "#id/":
                    $( ".layout_navigation" ).hide();
                    $( ".layout_wrapper" ).append(`<div class="col col-graph" style="flex:unset;"></div><div class="col col-content" style="flex:unset;padding-right:0;"><div id="content"></div></div>`);
                    // load poet profile
                    $( "#content" ).html( await poet_profile( hash ) );
                    // load poet graph
                    initializeGraph( "https://www.romanticperiodpoetry.org/id/"+hash+"/person", "authors" );
                    $( ".layout_wrapper" ).css( "flex-wrap", "unset" );
                    Split([ ".col-graph", ".col-content" ], { sizes: [70, 30], minSize: 450, gutterSize: 8 });
                    break;
                default:
                    if ( $( ".layout_navigation" ).is(":hidden") ) {
                        $( ".col-graph,.col-content,.gutter" ).remove();
                        $( ".layout_wrapper" ).css( "flex-wrap", "wrap" );
                        $( ".layout_navigation" ).show();
                    }
                    break;
            }
            break;
        case "works":
            switch ( location.hash.substring( location.hash.indexOf("#"), location.hash.indexOf("/")+1 ) ) {
                case "#text/":
                    $( ".layout_navigation" ).hide();
                    $( ".layout_wrapper" ).append(`<div class="col col-graph" style="flex:unset;"></div><div class="col col-content" style="flex:unset;padding-right:0;"><div id="content" class="globaltext"></div></div>`);
                    $( ".layout_wrapper" ).addClass( "globaltext-container" );
                    $( ".layout_wrapper" ).attr( 'data-tid', hash );
                    $( ".layout_wrapper" ).attr( 'data-wid', texts[ hash ][ "work" ] );
                    // load global text
                    $( "#content" ).html( display_globaltext( hash, texts[ hash ][ "work" ] ) );
                    // load global text graph
                    initializeGraph( "https://www.romanticperiodpoetry.org/id/"+texts[ hash ][ "work" ]+"/work", "works" );
                    $( ".layout_wrapper" ).css( "flex-wrap", "unset" );
                    Split([ ".col-graph", ".col-content" ], { sizes: [70, 30], minSize: 450, gutterSize: 8 });
                    break;
                case "/#context/":
                    // TODO
                    break;
                default:
                    if ( $( ".layout_navigation" ).is(":hidden") ) {
                        $( ".col-graph,.col-content,.gutter" ).remove();
                        $( ".layout_wrapper" ).css( "flex-wrap", "wrap" );
                        $( ".layout_navigation" ).show();
                    }
                    break;
            }
            break;
        case "networks":
            switch ( location.hash.substring( location.hash.indexOf("#"), location.hash.indexOf("/")+1 ) ) {
                case "#id/":
                    // TODO
                    break;

            }
            break;

    }
}
