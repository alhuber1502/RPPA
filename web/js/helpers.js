// PRISMS.digital
// Helper functions

// format a date to the correct level of detail
function formatDate(input, locale = 'default', options = {}) {
    const yearOnly = /^\d{4}$/;
    const yearMonth = /^\d{4}-\d{2}$/;
    const fullDate = /^\d{4}-\d{2}-\d{2}$/;
    const isoDatetime = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?(Z|[\+\-]\d{2}:\d{2})?)?$/;
  
    if (yearOnly.test(input)) {
      return input;
    } else if (yearMonth.test(input)) {
      const date = new Date(`${input}-01`);
      return date.toLocaleDateString(locale, { year: 'numeric', month: 'long', ...options });
    } else if (fullDate.test(input)) {
      const date = new Date(input);
      return date.toLocaleDateString(locale, { year: 'numeric', month: 'long', day: 'numeric', ...options });
    } else if (isoDatetime.test(input)) {
      const date = new Date(input);
      return date.toLocaleDateString(locale, { year: 'numeric', month: 'long', day: 'numeric', ...options });
    } else {
      // Try fallback parsing
      const date = new Date(input);
      if (!isNaN(date)) {
        return date.toLocaleDateString(locale, { year: 'numeric', month: 'long', day: 'numeric', ...options });
      }
      return input; // Unknown format, return as-is
    }
}

// get a substring starting at a specific position
function GetSubstringIndex(str, substring, n) {
    var times = 0, index = null;
    while (times < n && index !== -1) {
        index = str.indexOf(substring, index+1);
        times++;
    }
    return index;
}

// retrieve a JSON object from jsonObject by its "id"
function filterById(jsonObject, id) {
    return jsonObject.filter( function(jsonObject) { return ( jsonObject['id'] == id ); } )[0];
}

// function to safely address IDs containing dots etc.
function jq( myid ) {
    if ( myid ) {
        return "#" + myid.replace( /(:|\.|\[|\]|,|=)/g, "\\$1" );
    } else return '';
}
function jqu( myid ) {
    if ( myid ) {
        return myid.replace( /(:|\.|\[|\]|,|=)/g, "\\$1" );
    } else return '';
}

// truncate a string
function truncateString(str, num) {
    if ( str ) {
        if (str.length <= num) {
	      return str;
	    }
	    return str.slice(0, num) + '...';
    } else return '';
}

// serialize form data to object
function getFormData($form){
    var unindexed_array = $form.serializeArray();
    var indexed_array = {};
    $.map(unindexed_array, function(n, i){
        indexed_array[n['name']] = n['value'];
    });
    return indexed_array;
}

function secondsToTime(e){
    const h = Math.floor(e / 3600).toString().padStart(2,'0'),
          m = Math.floor(e % 3600 / 60).toString().padStart(2,'0'),
          s = Math.floor(e % 60).toString().padStart(2,'0');
    
    return h + ':' + m + ':' + s;
    //return `${h}:${m}:${s}`;
}

// function to return the namespaced version of an IRI                                                                     
function nsv(myiri) {
	var matchedNS;
	if ( myiri == undefined ) { return false; }
	$.each(Object.keys(context["@context"]), function (index, value) {
		if (myiri.indexOf(context["@context"][value]) == 0) {
			matchedNS = value;
			return false;
		}
	});
	return ((typeof matchedNS !== 'undefined') ? myiri.replace(context["@context"][matchedNS], matchedNS + ":") : false);
}

// function to return the skos:prefLabel of an IRI
function skp(graph, subject, retrievedVal) {
	var returnVal = [];
	var splitVal = context["@context"][retrievedVal.split( ":" )[0]] + retrievedVal.split( ":" )[1];
	$.each(graph, function (i, v) {
		if ( v.s.value == subject && v.p.value == splitVal ) {
			if ( v.o.type == "literal" ) {
				returnVal.push( v.o.value );
				return false;
			} else {
				returnVal.push( v.o.value );
			}
		}
	});
	return ( (returnVal.length == 0) ? false : ((returnVal.length == 1)? (nsv( returnVal[0])?returnVal:returnVal[0]) : returnVal) );
}

// function to add an FA icon to a given IRI
function addicon(myiri) {
    // TODO
	if (myiri.endsWith( "/delivery" ) ) {
		if ( myiri.includes ("/imageset/") ) {
			return ( graph_icon["fa-camera"] );
		} else if ( myiri.includes ("/transcription/" ) ) {
			return ( graph_icon["fa-book-open"] );
		} else if ( myiri.includes ("/translation/" ) ) {
			return ( graph_icon["fa-globe"] );
		} else if ( myiri.includes ("/apparatus/" ) ) {
			return ( graph_icon["fa-comment"] );
		} else if ( myiri.includes ("/scholarship/" ) ) {
			return ( graph_icon["fa-graduation-cap"] );
		} else if ( myiri.includes ("/performance/" ) ) {
			return ( graph_icon["fa-microphone"] );
		} else {
			return ( graph_icon["fa-user"] );
		}
	} else if (myiri.endsWith( "/master" ) ) {
		if ( myiri.includes ("/imageset/") ) {
			return ( graph_icon["fa-file-archive"] );
		} else if ( myiri.includes ("/transcription/" ) ) {
			return ( graph_icon["fa-code"] );
		} else if ( myiri.includes ("/translation/" ) ) {
			return ( graph_icon["fa-code"] );
		} else if ( myiri.includes ("/apparatus/" ) ) {
			return ( graph_icon["fa-code"] );
		} else if ( myiri.includes ("/scholarship/" ) ) {
			return ( graph_icon["fa-file"] );
		} else if ( myiri.includes ("/performance/" ) ) {
			return ( graph_icon["fa-file"] );
		} else {
			return ( graph_icon["fa-user"] );
		}
	}
	return '';
}

var cyLayouts = {};
cyLayouts[ "klay" ] = {
	name: 'klay',
	nodeDimensionsIncludeLabels: true, // Boolean which changes whether label dimensions are included when calculating node dimensions
	fit: true, // Whether to fit
	padding: 100, // Padding on fit
	animate: false, // Whether to transition the node positions
	animateFilter: function( node, i ){ return true; }, // Whether to animate specific nodes when animation is on; non-animated nodes immediately go to their final positions
	animationDuration: 2000, // Duration of animation in ms if enabled
	animationEasing: undefined, // Easing of animation if enabled
	transform: function( node, pos ){ return pos; }, // A function that applies a transform to the final node position
	ready: function() { }, // Callback on layoutready
	stop: function() { }, // Callback on layoutstop
	klay: {
	  // Following descriptions taken from http://layout.rtsys.informatik.uni-kiel.de:9444/Providedlayout.html?algorithm=de.cau.cs.kieler.klay.layered
	  addUnnecessaryBendpoints: false, // Adds bend points even if an edge does not change direction.
	  aspectRatio: 1.6, // The aimed aspect ratio of the drawing, that is the quotient of width by height
	  borderSpacing: 20, // Minimal amount of space to be left to the border
	  compactComponents: true, // Tries to further compact components (disconnected sub-graphs).
	  crossingMinimization: 'LAYER_SWEEP', // Strategy for crossing minimization.
	  /* LAYER_SWEEP The layer sweep algorithm iterates multiple times over the layers, trying to find node orderings that minimize the number of crossings. The algorithm uses randomization to increase the odds of finding a good result. To improve its results, consider increasing the Thoroughness option, which influences the number of iterations done. The Randomization seed also influences results.
	  INTERACTIVE Orders the nodes of each layer by comparing their positions before the layout algorithm was started. The idea is that the relative order of nodes as it was before layout was applied is not changed. This of course requires valid positions for all nodes to have been set on the input graph before calling the layout algorithm. The interactive layer sweep algorithm uses the Interactive Reference Point option to determine which reference point of nodes are used to compare positions. */
	  cycleBreaking: 'GREEDY', // Strategy for cycle breaking. Cycle breaking looks for cycles in the graph and determines which edges to reverse to break the cycles. Reversed edges will end up pointing to the opposite direction of regular edges (that is, reversed edges will point left if edges usually point right).
	  /* GREEDY This algorithm reverses edges greedily. The algorithm tries to avoid edges that have the Priority property set.
	  INTERACTIVE The interactive algorithm tries to reverse edges that already pointed leftwards in the input graph. This requires node and port coordinates to have been set to sensible values.*/
	  direction: 'DOWN', // Overall direction of edges: horizontal (right / left) or vertical (down / up)
	  /* UNDEFINED, RIGHT, LEFT, DOWN, UP */
	  edgeRouting: 'ORTHOGONAL', // Defines how edges are routed (POLYLINE, ORTHOGONAL, SPLINES)
	  edgeSpacingFactor: 1.25, // Factor by which the object spacing is multiplied to arrive at the minimal spacing between edges.
	  feedbackEdges: false, // Whether feedback edges should be highlighted by routing around the nodes.
	  fixedAlignment: 'NONE', // Tells the BK node placer to use a certain alignment instead of taking the optimal result.  This option should usually be left alone.
	  /* NONE Chooses the smallest layout from the four possible candidates.
	  LEFTUP Chooses the left-up candidate from the four possible candidates.
	  RIGHTUP Chooses the right-up candidate from the four possible candidates.
	  LEFTDOWN Chooses the left-down candidate from the four possible candidates.
	  RIGHTDOWN Chooses the right-down candidate from the four possible candidates.
	  BALANCED Creates a balanced layout from the four possible candidates. */
	  inLayerSpacingFactor: 1.0, // Factor by which the usual spacing is multiplied to determine the in-layer spacing between objects.
	  layoutHierarchy: false, // Whether the selected layouter should consider the full hierarchy
	  linearSegmentsDeflectionDampening: 0.3, // Dampens the movement of nodes to keep the diagram from getting too large.
	  mergeEdges: false, // Edges that have no ports are merged so they touch the connected nodes at the same points.
	  mergeHierarchyCrossingEdges: true, // If hierarchical layout is active, hierarchy-crossing edges use as few hierarchical ports as possible.
	  nodeLayering:'NETWORK_SIMPLEX', // Strategy for node layering.
	  /* NETWORK_SIMPLEX This algorithm tries to minimize the length of edges. This is the most computationally intensive algorithm. The number of iterations after which it aborts if it hasn't found a result yet can be set with the Maximal Iterations option.
	  LONGEST_PATH A very simple algorithm that distributes nodes along their longest path to a sink node.
	  INTERACTIVE Distributes the nodes into layers by comparing their positions before the layout algorithm was started. The idea is that the relative horizontal order of nodes as it was before layout was applied is not changed. This of course requires valid positions for all nodes to have been set on the input graph before calling the layout algorithm. The interactive node layering algorithm uses the Interactive Reference Point option to determine which reference point of nodes are used to compare positions. */
	  nodePlacement:'LINEAR_SEGMENTS', // Strategy for Node Placement
	  /* BRANDES_KOEPF Minimizes the number of edge bends at the expense of diagram size: diagrams drawn with this algorithm are usually higher than diagrams drawn with other algorithms.
	  LINEAR_SEGMENTS Computes a balanced placement.
	  INTERACTIVE Tries to keep the preset y coordinates of nodes from the original layout. For dummy nodes, a guess is made to infer their coordinates. Requires the other interactive phase implementations to have run as well.
	  SIMPLE Minimizes the area at the expense of... well, pretty much everything else. */
	  randomizationSeed: 1, // Seed used for pseudo-random number generators to control the layout algorithm; 0 means a new seed is generated
	  routeSelfLoopInside: false, // Whether a self-loop is routed around or inside its node.
	  separateConnectedComponents: true, // Whether each connected component should be processed separately
	  spacing: 40, // Overall setting for the minimal amount of space to be left between objects
	  thoroughness: 7 // How much effort should be spent to produce a nice layout..
	},
	priority: function( edge ){ return null; }, // Edges with a non-nil value are skipped when greedy edge cycle breaking is enabled
}
cyLayouts['breadthfirst'] = {
	name: 'breadthfirst',
	fit: true, // whether to fit the viewport to the graph
	directed: false, // whether the tree is directed downwards (or edges can point in any direction if false)
	padding: 30, // padding on fit
	circle: true, // put depths in concentric circles if true, put depths top down if false
	grid: false, // whether to create an even grid into which the DAG is placed (circle:false only)
	spacingFactor: 1.75, // positive spacing factor, larger => more space between nodes (N.B. n/a if causes overlap)
	boundingBox: undefined, // constrain layout bounds; { x1, y1, x2, y2 } or { x1, y1, w, h }
	avoidOverlap: true, // prevents node overlap, may overflow boundingBox if not enough space
	nodeDimensionsIncludeLabels: false, // Excludes the label when calculating node bounding boxes for the layout algorithm
	roots: undefined, // the roots of the trees
	depthSort: undefined, // a sorting function to order nodes at equal depth. e.g. function(a, b){ return a.data('weight') - b.data('weight') }
	animate: false, // whether to transition the node positions
	animationDuration: 500, // duration of animation in ms if enabled
	animationEasing: undefined, // easing of animation if enabled,
	animateFilter: function ( node, i ){ return true; }, // a function that determines whether the node should be animated.  All nodes animated by default on animate enabled.  Non-animated nodes are positioned immediately when the layout starts
	ready: undefined, // callback on layoutready
	stop: undefined, // callback on layoutstop
	transform: function (node, position ){ return position; } // transform a given node position. Useful for changing flow direction in discrete layouts
};
cyLayouts['grid'] = {
	name: 'grid',
	fit: true, // whether to fit the viewport to the graph
	padding: 30, // padding used on fit
	boundingBox: undefined, // constrain layout bounds; { x1, y1, x2, y2 } or { x1, y1, w, h }
	avoidOverlap: true, // prevents node overlap, may overflow boundingBox if not enough space
	avoidOverlapPadding: 10, // extra spacing around nodes when avoidOverlap: true
	nodeDimensionsIncludeLabels: false, // Excludes the label when calculating node bounding boxes for the layout algorithm
	spacingFactor: undefined, // Applies a multiplicative factor (>0) to expand or compress the overall area that the nodes take up
	condense: false, // uses all available space on false, uses minimal space on true
	rows: undefined, // force num of rows in the grid
	cols: undefined, // force num of columns in the grid
	position: function( node ){}, // returns { row, col } for element
	sort: undefined, // a sorting function to order the nodes; e.g. function(a, b){ return a.data('weight') - b.data('weight') }
	animate: false, // whether to transition the node positions
	animationDuration: 500, // duration of animation in ms if enabled
	animationEasing: undefined, // easing of animation if enabled
	animateFilter: function ( node, i ){ return true; }, // a function that determines whether the node should be animated.  All nodes animated by default on animate enabled.  Non-animated nodes are positioned immediately when the layout starts
	ready: undefined, // callback on layoutready
	stop: undefined, // callback on layoutstop
	transform: function (node, position ){ return position; } // transform a given node position. Useful for changing flow direction in discrete layouts 
};
cyLayouts['cose'] = {
	name: 'cose',
	// Called on `layoutready`
	ready: function(){},
	// Called on `layoutstop`
	stop: function(){},
	// Whether to animate while running the layout
	// true : Animate continuously as the layout is running
	// false : Just show the end result
	// 'end' : Animate with the end result, from the initial positions to the end positions
	animate: true,
	// Easing of the animation for animate:'end'
	animationEasing: undefined,
	// The duration of the animation for animate:'end'
	animationDuration: undefined,
	// A function that determines whether the node should be animated
	// All nodes animated by default on animate enabled
	// Non-animated nodes are positioned immediately when the layout starts
	animateFilter: function ( node, i ){ return true; },
	// The layout animates only after this many milliseconds for animate:true
	// (prevents flashing on fast runs)
	animationThreshold: 250,
	// Number of iterations between consecutive screen positions update
	refresh: 20,
	// Whether to fit the network view after when done
	fit: true,
	// Padding on fit
	padding: 45,
	// Constrain layout bounds; { x1, y1, x2, y2 } or { x1, y1, w, h }
	boundingBox: undefined,
	// Excludes the label when calculating node bounding boxes for the layout algorithm
	nodeDimensionsIncludeLabels: true,
	// Randomize the initial positions of the nodes (true) or use existing positions (false)
	randomize: false,
	// Extra spacing between components in non-compound graphs
	componentSpacing: 40,
	// Node repulsion (non overlapping) multiplier
	nodeRepulsion: function( node ){ return 2048; },
	// Node repulsion (overlapping) multiplier
	nodeOverlap: 4,
	// Ideal edge (non nested) length
	idealEdgeLength: function( edge ){ return 162; },
	// Divisor to compute edge forces
	edgeElasticity: function( edge ){ return 132; },
	// Nesting factor (multiplier) to compute ideal edge length for nested edges
	nestingFactor: 1.2,
	// Gravity force (constant)
	gravity: 1,
	// Maximum number of iterations to perform
	numIter: 1000,
	// Initial temperature (maximum node displacement)
	initialTemp: 1000,
	// Cooling factor (how the temperature is reduced between consecutive iterations
	coolingFactor: 0.99,
	// Lower temperature threshold (below this point the layout will end)
	minTemp: 1.0
};
cyLayouts["dagre"] = {
    // dagre algo options, uses default value on undefined
    nodeSep: undefined, // the separation between adjacent nodes in the same rank
    edgeSep: undefined, // the separation between adjacent edges in the same rank
    rankSep: undefined, // the separation between each rank in the layout
    rankDir: 'LR', // 'TB' for top to bottom flow, 'LR' for left to right,
    align: 'UR',  // alignment for rank nodes. Can be 'UL', 'UR', 'DL', or 'DR', where U = up, D = down, L = left, and R = right
    acyclicer: undefined, // If set to 'greedy', uses a greedy heuristic for finding a feedback arc set for a graph.
                          // A feedback arc set is a set of edges that can be removed to make a graph acyclic.
    ranker: 'network-simplex', // Type of algorithm to assign a rank to each node in the input graph. Possible values: 'network-simplex', 'tight-tree' or 'longest-path'
    minLen: function( edge ){ return 1; }, // number of ranks to keep between the source and target of the edge
    edgeWeight: function( edge ){ return 1; }, // higher weight edges are generally made shorter and straighter than lower weight edges
  
    // general layout options
    fit: true, // whether to fit to viewport
    padding: 30, // fit padding
    spacingFactor: undefined, // Applies a multiplicative factor (>0) to expand or compress the overall area that the nodes take up
    nodeDimensionsIncludeLabels: false, // whether labels should be included in determining the space used by a node
    animate: true, // whether to transition the node positions
    animateFilter: function( node, i ){ return true; }, // whether to animate specific nodes when animation is on; non-animated nodes immediately go to their final positions
    animationDuration: 2500, // duration of animation in ms if enabled
    animationEasing: undefined, // easing of animation if enabled
    boundingBox: undefined, // constrain layout bounds; { x1, y1, x2, y2 } or { x1, y1, w, h }
    transform: function( node, pos ){ return pos; }, // a function that applies a transform to the final node position
    ready: function(){}, // on layoutready
    sort: undefined, // a sorting function to order the nodes and edges; e.g. function(a, b){ return a.data('weight') - b.data('weight') }
                     // because cytoscape dagre creates a directed graph, and directed graphs use the node order as a tie breaker when
                     // defining the topology of a graph, this sort function can help ensure the correct order of the nodes/edges.
                     // this feature is most useful when adding and removing the same nodes and edges multiple times in a graph.
    stop: function(){} // on layoutstop
};
cyLayouts[ "fcose" ] = {

    // 'draft', 'default' or 'proof' 
    // - "draft" only applies spectral layout 
    // - "default" improves the quality with incremental layout (fast cooling rate)
    // - "proof" improves the quality with incremental layout (slow cooling rate) 
    quality: "proof",
    // Use random node positions at beginning of layout
    // if this is set to false, then quality option must be "proof"
    randomize: true, 
    // Whether or not to animate the layout
    animate: true, 
    // Duration of animation in ms, if enabled
    animationDuration: 5000, 
    // Easing of animation, if enabled
    animationEasing: undefined, 
    // Fit the viewport to the repositioned nodes
    fit: true, 
    // Padding around layout
    padding: 30,
    // Whether to include labels in node dimensions. Valid in "proof" quality
    nodeDimensionsIncludeLabels: false,
    // Whether or not simple nodes (non-compound nodes) are of uniform dimensions
    uniformNodeDimensions: false,
    // Whether to pack disconnected components - cytoscape-layout-utilities extension should be registered and initialized
    packComponents: true,
    // Layout step - all, transformed, enforced, cose - for debug purpose only
    step: "all",
    
    /* spectral layout options */
    
    // False for random, true for greedy sampling
    samplingType: true,
    // Sample size to construct distance matrix
    sampleSize: 25,
    // Separation amount between nodes
    nodeSeparation: 75,
    // Power iteration tolerance
    piTol: 0.0000001,
    
    /* incremental layout options */
    
    // Node repulsion (non overlapping) multiplier
    nodeRepulsion: node => 4500,
    // Ideal edge (non nested) length
    idealEdgeLength: edge => 50,
    // Divisor to compute edge forces
    edgeElasticity: edge => 0.45,
    // Nesting factor (multiplier) to compute ideal edge length for nested edges
    nestingFactor: 0.1,
    // Maximum number of iterations to perform - this is a suggested value and might be adjusted by the algorithm as required
    numIter: 2500,
    // For enabling tiling
    tile: true,
    // The comparison function to be used while sorting nodes during tiling operation.
    // Takes the ids of 2 nodes that will be compared as a parameter and the default tiling operation is performed when this option is not set.
    // It works similar to ``compareFunction`` parameter of ``Array.prototype.sort()``
    // If node1 is less then node2 by some ordering criterion ``tilingCompareBy(nodeId1, nodeId2)`` must return a negative value
    // If node1 is greater then node2 by some ordering criterion ``tilingCompareBy(nodeId1, nodeId2)`` must return a positive value
    // If node1 is equal to node2 by some ordering criterion ``tilingCompareBy(nodeId1, nodeId2)`` must return 0
    tilingCompareBy: undefined, 
    // Represents the amount of the vertical space to put between the zero degree members during the tiling operation(can also be a function)
    tilingPaddingVertical: 10,
    // Represents the amount of the horizontal space to put between the zero degree members during the tiling operation(can also be a function)
    tilingPaddingHorizontal: 10,
    // Gravity force (constant)
    gravity: 0.25,
    // Gravity range (constant) for compounds
    gravityRangeCompound: 1.5,
    // Gravity force (constant) for compounds
    gravityCompound: 1.0,
    // Gravity range (constant)
    gravityRange: 3.8, 
    // Initial cooling factor for incremental layout  
    initialEnergyOnIncremental: 0.3,
  
    /* constraint options */
  
    // Fix desired nodes to predefined positions
    // [{nodeId: 'n1', position: {x: 100, y: 200}}, {...}]
    fixedNodeConstraint: undefined,
    // Align desired nodes in vertical/horizontal direction
    // {vertical: [['n1', 'n2'], [...]], horizontal: [['n2', 'n4'], [...]]}
    alignmentConstraint: undefined,
    // Place two nodes relatively in vertical/horizontal direction
    // [{top: 'n1', bottom: 'n2', gap: 100}, {left: 'n3', right: 'n4', gap: 75}, {...}]
    relativePlacementConstraint: undefined,
  
    /* layout event callbacks */
    ready: () => {}, // on layoutready
    stop: () => {} // on layoutstop
};

// make strings JSON-safe
String.prototype.escapeSpecialChars = function() {
    return this.replace(/\\n/g, "\\n")
               .replace(/\\'/g, "\\'")
               .replace(/\\"/g, '\\"')
               .replace(/\\&/g, "\\&")
               .replace(/\\r/g, "\\r")
               .replace(/\\t/g, "\\t")
               .replace(/\\b/g, "\\b")
               .replace(/\\f/g, "\\f");
};

// refresh the DOM on dynamically added content
function updateDOM() {
    var genericCloseBtnHtml = '<button type="button" class="btn-close" aria-hidden="true" style="float:right;"></button>';
    // initialize tooltips and popovers
    const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]')
    tooltipTriggerList2 = _l.difference( tooltipTriggerList, done_tooltipTriggerList );
    done_tooltipTriggerList = tooltipTriggerList;
    var tooltipList = [...tooltipTriggerList2].map(function (tooltipTriggerEl) {
        return new bootstrap.Popover(tooltipTriggerEl, {
            html: true,
            placement: 'auto',
            container: 'body',
            sanitize: false,
            trigger: 'hover click',
            customClass: 'authorial note',
            title: function() {
                //https://github.com/twbs/bootstrap/issues/38720
                return "Authorial note"+genericCloseBtnHtml
            },
            content: function(e) {
                //https://github.com/twbs/bootstrap/issues/38720
                if ( $(e).next(".footy").length ) {
                    return $(e).next().clone().removeClass("hidden");
                } else {
                    return $(e).parent().next().clone().removeClass("hidden");
                }
            }
        });
    });
    const popoverTriggerList = document.querySelectorAll('[data-bs-toggle="popover"]')
    popoverTriggerList2 = _l.difference( popoverTriggerList, done_popoverTriggerList );
    done_popoverTriggerList = popoverTriggerList;
    var popoverList = [...popoverTriggerList2].map(function (popoverTriggerEl) {
        return new bootstrap.Popover(popoverTriggerEl, {
            html: true,
            placement: 'auto',
            container: 'body',
            sanitize: false,
            trigger: 'click',
            customClass: 'editorial note',
            title: function() {
                //https://github.com/twbs/bootstrap/issues/38720
                return "Editorial note"+genericCloseBtnHtml
                //$(this).attr("data-type")[0].toUpperCase() +
                //$(this).attr("data-type").slice(1)+
            },
            content: function(e) {
                //https://github.com/twbs/bootstrap/issues/38720
                if ( $(e).next(".footy").length ) {
                    return $(e).next().clone().removeClass("hidden");
                } else {
                    return $(e).parent().next().clone().removeClass("hidden");
                }
            }
        });
    });
    /*
    const offcanvasElementList = document.querySelectorAll('.offcanvas')
    const offcanvasList = [...offcanvasElementList].map(offcanvasEl => new bootstrap.Offcanvas(offcanvasEl))
    */
    $( ".resizable" ).resizable({
        containment: ".globaltext-container",
        handles: "n, e, s, w, se"
        /*
        minWidth:500,
        minHeight:800
        */
    });
    $( ".draggable" ).draggable({
        handle: $('.nav-pills,.card-header'),
        containment: ".globaltext-container", 
        scroll: false 
    });
}

// produce a shade of green for building-block highlighting
function randomColor(alpha) {
    return (
        'rgba(' +
        [
            ~~(Math.random() * 255),
            ~~(255),
            ~~(Math.random() * 255),
            alpha || 1
        ] +
        ')'
    );
}

// load poet/work JSON files for the selected individual
function load_poet_overview( id ) {
    return new Promise(function(resolve, reject) {
      $.ajax({
          url: "/data/persons/"+id+".json",
          type: "GET",
          dataType: "json",
          success: function(data) {
              resolve(data)
          },
          error: function(err) {
              reject(err)
          }
      });
    });
}
function load_work_overview( id ) {
    return new Promise(function(resolve, reject) {
        $.ajax({
            url: "/data/works/"+id+".json",
            type: "GET",
            dataType: "json",
            success: function(data) {
                resolve(data)
            },
            error: function(err) {
                reject(err)
            }
        });
    });
}

// SSO
$( document ).on( "click", ".sso-sign-in", function(e) {
    var sso_modal=`
    <!-- welcome modal -->
    <div id="myModal" class="modal fade" data-bs-backdrop="static" data-bs-keyboard="false" tabindex="-1">
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">Please sign into RPPA</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body text-center">
                    <p><i class="fas fa-door-open" style="font-size:28px;margin-bottom:15px;"></i><br>

                    <!-- ORCiD SSO -->
                    <script src="/js/orcid-auth-widget-master/orcid-widget.js"></script>
                    <div id="orcidWidget" style="margin:0 auto;"
                    data-size='lg' data-env='production'
                    data-clientid='APP-LOLR4JW8AREHAJ1I' data-redirecturi='https://www.romanticperiodpoetry.org/login/'></div>

                    <!-- FB SSO -->
                    <script>
                    window.fbAsyncInit = function() {
                        FB.init({
                            appId      : '1289578978503896',
                            cookie     : true,
                            xfbml      : true,
                            version    : 'v18.0'
                        });
                        FB.AppEvents.logPageView();
                    //    FB.getLoginStatus(function(response) {   // Called after the JS SDK has been initialized.
                    //        statusChangeCallback(response);      // Returns the login status.
                    //    });
                    };
                    (function(d, s, id){
                    var js, fjs = d.getElementsByTagName(s)[0];
                    if (d.getElementById(id)) {return;}
                    js = d.createElement(s); js.id = id;
                    js.src = "https://connect.facebook.net/en_US/sdk.js";
                    fjs.parentNode.insertBefore(js, fjs);
                    }(document, 'script', 'facebook-jssdk'));
                    </script>
                    <div class="fb-login-button" config_id="1480790596480316" data-size="large" data-button-type="continue_with" data-layout="default" 
                        data-auto-logout-link="false" data-onlogin="checkLoginState();" data-scope="public_profile" data-use-continue-as="false"></div>
                    
                    <!-- Google SSO -->
                    <script src="https://accounts.google.com/gsi/client"></script> 
                    <div id="g_id_onload"
                        data-client_id="1056047910768-826v0a41c0trtntqnkh6slfprjp3t4fr.apps.googleusercontent.com"
                        data-context="signin"
                        data-ux_mode="popup"
                        data-callback="handleCredentialResponse"
                        data-login_uri="https://www.romanticperiodpoetry.org/login/"
                        data-auto_prompt="false">
                    </div>
                    <div class="g_id_signin" style="margin-top: 20px;
                    margin-left: 120px;"
                        data-type="standard"
                        data-shape="rectangular"
                        data-theme="outline"
                        data-text="continue_with"
                        data-size="large"
                        data-logo_alignment="left"
                        data-width="226">
                    </div>

                    <br/>
                </div>
            </div>
        </div>
    </div>`;

    // create DOM
    if ( $( "#myModal" ).length == 0 ) {
        $( "body" ).append( sso_modal );
    }
    var myModalGTEl = document.getElementById( "myModal" );
    var myModalGT = new bootstrap.Modal(myModalGTEl, {
        backdrop: 'static',
        keyboard: false
    }).show();
    Cookies.set('RPPA-login-redirect', document.location.pathname+document.location.hash );
    var provider = Cookies.get( 'RPPA-login-provider' );
    if ( provider != undefined ) {
        if ( provider == 'google' ) {
            $( "#orcidWidget" ).hide()
            $( ".fb-login-button" ).hide()
        } else if ( provider == 'fb' ) {
            $( "#orcidWidget" ).hide()
            $( ".g_id_signin" ).hide()
        } else if ( provider == 'orcid' ) {
            $( ".fb-login-button" ).hide()
            $( ".g_id_signin" ).hide()
        }
    }
});

// FB SSO
function statusChangeCallback(response) {    // Called with the results from FB.getLoginStatus().
    if (response.status === 'connected') {   // Logged into your webpage and Facebook.
        testAPI();
    } else {                           // Not logged into your webpage or we are unable to tell.
//        FB.login();
    }
}
function checkLoginState() {               // Called when a person is finished with the Login Button.
    FB.getLoginStatus(function(response) {   // See the onlogin handler
        statusChangeCallback(response);
    });
}
function testAPI() {                      // Testing Graph API after login.  See statusChangeCallback() for when this call is made.
    FB.api('/me', async function(response) {
        var q=namespaces+` 
        SELECT * WHERE {
            ?s a foaf:Agent ;
                foaf:name ?o ;
                foaf:accountName <https://www.facebook.com/`+response.id+`> .
            BIND( foaf:name AS ?p )
        }`;
        var usergraph = await getJSONLD( q, "quads" );
        if ( usergraph.hasOwnProperty( 'id' ) ) {
            user = usergraph.id;
            username = usergraph["foaf:name"];
        } else {
            // new user
            user = "rppa:user-"+uuidv4();
            username = response.name;
            if ( user == undefined || username == 'undefined') { return; }
            var update = namespaces+"insert data {\n";
            update += user+` a foaf:Agent ;\n`;
            update += `foaf:name """`+response.name+`""" ;\n`;
            update += `foaf:accountName <https://www.facebook.com/`+response.id+`> ;\n`;
            update += `.\n}`;
        //            var updel = namespaces+`\nWITH `+user+` DELETE { `+user+` ?p ?o } WHERE { `+user+` ?p ?o } `;
        //            await putTRIPLES( updel );
            await putTRIPLES( update );
        }
        if ( user == undefined || username == 'undefined') { return; }
        Cookies.set( 'RPPA-login-provider','fb', { expires: 365 } );
        Cookies.set('RPPA-login-user', user );
        Cookies.set('RPPA-login-username', username );
        if ( $( "#myModal" ).length ) {
            $( "#myModal" ).hide();
            $( ".modal-backdrop" ).remove();
            var goto = Cookies.get( 'RPPA-login-redirect' ) || '/'
            window.location = goto, true;
            $( ".sso-sign-in" ).remove();
            $( "#username" ).html( username );
            provider_img = Cookies.get( 'RPPA-login-provider' );
            if ( provider_img == 'orcid' ) {
                provider_img = ` <i class="fa-brands fa-orcid"></i>`
            } else if ( provider_img == 'fb' ) {
                provider_img = ` <i class="fa-brands fa-facebook"></i>`
            } else if ( provider_img == 'google' ) {
                provider_img = ` <i class="fa-brands fa-google"></i>`
            }
            $( "#provider" ).html( provider_img );
            $( "a[data-mode='edit']" ).attr( "aria-disabled", "false" );
            $( "a[data-mode='edit']" ).attr( "role", "button" );
            $( "a[data-mode='edit']" ).css( "opacity", "1" );
        }
    });
    return false;
}

// Google SSO
async function handleCredentialResponse(response) {
    // decodeJwtResponse() is a custom function defined by you
    // to decode the credential response.
    var response = await KJUR.jws.JWS.readSafeJSONString(b64utoutf8(response.credential.split(".")[1]));

    var q=namespaces+` 
        SELECT * WHERE {
            ?s a foaf:Agent ;
                foaf:name ?o ;
                foaf:accountName <https://www.google.com/`+response.sub+`> .
            BIND( foaf:name AS ?p )
        }`;
    var usergraph = await getJSONLD( q, "quads" );
    if ( usergraph.hasOwnProperty( 'id' ) ) {
        user = usergraph.id;
        username = usergraph["foaf:name"];
    } else {
        // new user
        user = "rppa:user-"+uuidv4();
        username = response.name;
        if ( user == undefined || username == 'undefined') { return; }
        var update = namespaces+"insert data {\n";
        update += user+` a foaf:Agent ;\n`;
        update += `foaf:name """`+response.name+`""" ;\n`;
        update += `foaf:accountName <https://www.google.com/`+response.sub+`> ;\n`;
        update += `.\n}`;
    //            var updel = namespaces+`\nWITH `+user+` DELETE { `+user+` ?p ?o } WHERE { `+user+` ?p ?o } `;
    //            await putTRIPLES( updel );
        await putTRIPLES( update );
    }
    if ( user == undefined || username == 'undefined') { return; }
    Cookies.set( 'RPPA-login-provider','google', { expires: 365 } );
    Cookies.set('RPPA-login-user', user );
    Cookies.set('RPPA-login-username', username );
    if ( $( "#myModal" ).length ) {
        $( "#myModal" ).hide();
        $( ".modal-backdrop" ).remove();
        var goto = Cookies.get( 'RPPA-login-redirect' ) || '/'
        window.location = goto, true;
        $( ".sso-sign-in" ).remove();
        $( "#username" ).html( username );
        provider_img = Cookies.get( 'RPPA-login-provider' );
        if ( provider_img == 'orcid' ) {
            provider_img = ` <i class="fa-brands fa-orcid"></i>`
        } else if ( provider_img == 'fb' ) {
            provider_img = ` <i class="fa-brands fa-facebook"></i>`
        } else if ( provider_img == 'google' ) {
            provider_img = ` <i class="fa-brands fa-google"></i>`
        }
        $( "#provider" ).html( provider_img );
        $( "a[data-mode='edit']" ).attr( "aria-disabled", "false" );
        $( "a[data-mode='edit']" ).attr( "role", "button" );
        $( "a[data-mode='edit']" ).css( "opacity", "1" );
    }
    return false;
}
