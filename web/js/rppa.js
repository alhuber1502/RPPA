// RPPA

// global settings
var user = undefined, username = undefined, t;
var workbench = {}, provider_img = '', contexts, contributors;
var domain = "https://www.romanticperiodpoetry.org";

var SOLR_RPPA, SPARQL_RPPA;
if ( /romanticperiodpoetry\.org/.test(window.location.href) ) {
    SPARQL_RPPA = "https://data.prisms.digital/query/rppa/";
    SOLR_RPPA = "https://data.prisms.digital/solr/rppa/select";
} else {
    SPARQL_RPPA = "http://192.168.1.2:3030/rppa/";
    SOLR_RPPA = "http://192.168.1.2:8983/solr/rppa/select";
}

// rppa.jsonld
var namespaces = '';
// load PRISMS JSON-LD context and create namespaces
$.ajax({ url: "/rppa.jsonld", dataType: 'json', async: false,
	success: function(data) {
        context = data;
        $.each( Object.keys( context["@context"] ), function (index, value) {
            if ( String(context["@context"][value]).startsWith( 'http' ) ) {
                namespaces += `prefix `+ value + `: <`+context["@context"][value]+`>\n`;
            }
        });
	}
});

// global variables
var t, myModalGT, myModalGTEl, zInd = 1054, player = {}, viewer = {}, mode = 'read';
var done_tooltipTriggerList = [], done_popoverTriggerList = [];
var loadTexts = function() {
    return $.ajax({ url: "/data/texts.min.json", dataType: 'json',
        success: function(data) {
            texts = data;
        }, error: function (jqXHR, textStatus, errorThrown) { console.log(jqXHR, textStatus, errorThrown); }
    });
}

//  display a global text
/*  This function 
    - retrieves all expression - manifestation/excerpt information for a work
    - creates the globaltext-workbench
    - draws the globaltext onto the globaltext-workbench (drawGlobalText)
    - retrieves and processes contexts/building blocks for the globaltext (reading/editing mode)
    - attaches event handlers to the globaltext-workbench
*/
async function display_globaltext( tid, wid ) {

    // retrieve RDF in JSON-LD
    // get work, expression, manifestation/excerpt, and master/deliverables
    var q = namespaces+`SELECT DISTINCT ?s ?p ?o ?g
	WHERE {
        {
  			<https://www.romanticperiodpoetry.org/id/`+wid+`/work> ?p ?o .
            BIND(<https://www.romanticperiodpoetry.org/id/`+wid+`/work> AS ?s)
        } UNION {
      		<https://www.romanticperiodpoetry.org/id/`+wid+`/work> lrmoo:R3_is_realised_in ?o2 .
        	?o2 ?p ?o.
            BIND(?o2 AS ?s)
        } UNION {
      		<https://www.romanticperiodpoetry.org/id/`+wid+`/work> lrmoo:R3_is_realised_in ?o2 .
  			?o2 (lrmoo:R4i_is_embodied_in|lrmoo:R15_has_fragment) ?o3 .
    		?o3 ?p ?o.
            BIND(?o3 AS ?s)
        } UNION {
      		<https://www.romanticperiodpoetry.org/id/`+wid+`/work> lrmoo:R3_is_realised_in ?o2 .
  			?o2 (lrmoo:R4i_is_embodied_in|lrmoo:R15_has_fragment) ?o3 .
    		?o3 <http://www.cidoc-crm.org/cidoc-crm/P106_is_composed_of> ?o4.
    		?o4 ?p ?o .
            BIND(?o4 AS ?s)
        }
    	BIND(<default> AS ?g)
    }
    ORDER BY ?s`;
    var r = await getJSONLD( q );

    // add work to workbench
    workbench[ wid ] = _.keyBy( r.graph, 'id');
    zInd = zInd+1;

    if ( $('.modal.show').length ) { 
//        myModalGT.hide(); // close any open texts if a new one is requested
        $(".popover").hide(); // hide if new text was called from a popover
    }
    // create global text modal
    var text = `<!-- Modal -->
        <div style="z-index:`+zInd+`;overflow:inherit;" class="modal fade globaltext-workbench" tabindex="-1" data-bs-backdrop="static" aria-labelledby="ModalLabel" aria-hidden="true">
            <div class="modal-dialog modal-xl modal-dialog-centered" style="min-width:95vw;min-height:95vh;height:95vh;width:95vw;">
                <div class="modal-content rounded-0" style="min-width:inherit;min-height:inherit;">
                    <div class="modal-body globaltext-container">
                        <button type="button" class="btn-close" style="float:right;" data-mode="read" data-bs-dismiss="modal" aria-label="Close"></button>
                        <div class="tools" style="float:right;">
                            <input `+((user == undefined && username == undefined)?'disabled':'')+` style="height:36px;width:123px;" class="tgl-btn changeMode" type="checkbox" checked data-toggle="toggle" data-wid="`+wid+`" data-tid="`+tid+`" id="changeMode-flip" data-mode="edit" data-onlabel="Reading" data-offlabel="Editing" data-onstyle="warning" data-offstyle="success">
                            `+((user == undefined && username == undefined)?'<label> <button type="button" class="btn btn-sm sso-sign-in" style="background-color:var(--bs-orange);color:#fff;margin-left:5px;margin-top:-4px;">Sign in</button></label>':'')+`
                        </div>

                                <div class="globaltext">
                                </div>
                                
                                <div class="col-sm-4 contexts">
                                </div>
                                <div class="col-sm-4 workbench">
                                </div>
                                
                    
                    </div>
                </div>
            </div>
        </div>`;
    $( "body" ).prepend( text );
    drawGlobalText( tid, wid );
    processGlobalText( tid, wid );

    myModalGTEl = document.getElementsByClassName( "globaltext-workbench" )[0];
    myModalGT = new bootstrap.Modal(myModalGTEl, {
        backdrop: 'static',
        keyboard: false
    }).show();

    // on showing modal
    myModalGTEl.addEventListener('shown.bs.modal', function (event) {
        $('input[data-toggle="toggle"]').bootstrapToggle();
        $( ".globaltext" ).position({
            my: "center",
            at: "center",
            of: ".globaltext-container"
        });
    });
    // on closing modal
    myModalGTEl.addEventListener('hide.bs.modal', function (event) {
        mode = "read";
        $( "#mode" ).remove();
        $(".popover").remove();
        $(this).remove();
        zInd = 1054;
        history.back(); // location.href = "#id/"+work.aut.split(';')[0]; // reset location to work's author
        done_tooltipTriggerList = [];
        done_popoverTriggerList = [];
        clearInterval( t );
        annos = {};
        annotorious = {};
    });
}

/*  This function creates the globaltext DOM for all expressions available for
    the work. It
    - initializes all tools (Openseadragon, Wavesurfer, ...)
    - genetrates the tabbable view for each of the available expressions
    - adds the globaltext in a darggable/resizable "window" to the DOM
*/
function drawGlobalText( tid, wid ) {
    var imgset_id = undefined, prfset_id = undefined;
    var openseadragonOptions = {
        showNavigator: true,
        showRotationControl: true,
        gestureSettingsTouch: {
            pinchRotate: true
        },
        prefixUrl: "/js/openseadragon-bin-3.1.0/openseadragon-flat-toolbar-icons-master/images/",
        sequenceMode: true,
        preserveViewport: true
    };
    // populate global text
    // load work's realization(s)
    var tab_content = "", tab_nav = "", excerpt = null, sources = [], texts = [];
    for (i=0; i<workbench[ wid ][ domain+"/id/"+wid+"/work" ][ "lrmoo:R3_is_realised_in" ].length; i++ ) { // expressions
        var nav_name = '', cnt_lang = '';
        cnt_lang = workbench[ wid ][ workbench[ wid ][ domain+"/id/"+wid+"/work" ][ "lrmoo:R3_is_realised_in" ][i].id ][ "crm:P72_has_language" ];
        // navigation
        if ( i == 0 ) {
            if ( workbench[ wid ][ workbench[ wid ][ domain+"/id/"+wid+"/work" ][ "lrmoo:R3_is_realised_in" ][i].id ].hasOwnProperty( 'lrmoo:R15_has_fragment' ) ) {
                nav_name = 'Text (excerpt)';
            } else {
                nav_name = 'Text';
            }
        } else if ( _.findIndex(workbench[ wid ][ workbench[ wid ][ domain+"/id/"+wid+"/work" ][ "lrmoo:R3_is_realised_in" ][i].id ][ "crm:P2_has_type" ], function(typ) { return typ.id == 'lct:txt' }) != -1 ) {
            nav_name = 'Translation (<code>'+cnt_lang+'</code>)';
        } else if ( _.findIndex(workbench[ wid ][ workbench[ wid ][ domain+"/id/"+wid+"/work" ][ "lrmoo:R3_is_realised_in" ][i].id ][ "crm:P2_has_type" ], function(typ) { return typ.id == 'sc:Manifest' || typ.id == 'lct:img' || typ.id == 'lct:dig'}) != -1) {
            nav_name = 'Facsimile';
        } else if ( _.findIndex(workbench[ wid ][ workbench[ wid ][ domain+"/id/"+wid+"/work" ][ "lrmoo:R3_is_realised_in" ][i].id ][ "crm:P2_has_type" ], function(typ) { return typ.id == 'lct:aud' || typ.id == 'lct:mov' }) != -1) {
            if ( workbench[ wid ][ workbench[ wid ][ domain+"/id/"+wid+"/work" ][ "lrmoo:R3_is_realised_in" ][i].id ].hasOwnProperty( 'lrmoo:R15_has_fragment' ) ) {
                nav_name = 'Performance (excerpt)';
            } else {
                nav_name = 'Performance';
            }
        } else {
            console.log( 'Error: unknown content type' );
        }
        if ( nav_name != '' ) {
            tab_nav += `<li class="nav-item" role="presentation">
                <button class="nav-link`+((i==0)?' active':'')+`" id="pills-`+i+`-tab" data-bs-toggle="pill" data-bs-target="#pills-`+i+`"
                    type="button" role="tab" aria-controls="pills-`+i+`" aria-selected="true"
                    data-expr="`+workbench[ wid ][ workbench[ wid ][ domain+"/id/"+wid+"/work" ][ "lrmoo:R3_is_realised_in" ][i].id ].id+`"
                    data-work="`+domain+"/id/"+wid+"/work"+`">`+nav_name+`</button>
                </li>`;
        }
        // content
        var cnt_loc = null;
        if ( _.findIndex(workbench[ wid ][ workbench[ wid ][ domain+"/id/"+wid+"/work" ][ "lrmoo:R3_is_realised_in" ][i].id ][ "crm:P2_has_type" ], function(typ) { return typ.id == 'lct:txt' }) != -1 ) {
            if ( workbench[ wid ][ workbench[ wid ][ domain+"/id/"+wid+"/work" ][ "lrmoo:R3_is_realised_in" ][i].id ].hasOwnProperty( 'lrmoo:R15_has_fragment' ) ) { // fragments
                if ( i == 0 && tid != '' ) {                                                                                                                         // text (one fragment)
                    excerpt = _.findIndex( workbench[ wid ][ workbench[ wid ][ domain+"/id/"+wid+"/work" ][ "lrmoo:R3_is_realised_in" ][i].id ][ "lrmoo:R15_has_fragment" ], function(typ) { 
                        return workbench[ wid ][ workbench[ wid ][ typ.id ][ "crm:P106_is_composed_of" ][0]["id"]][ "crm:P106_is_composed_of" ][0].id.includes( '/'+tid+'/' );
                    });
                } else if ( tid == '' ) {                                                                                                                            // work (all fragments)
                    tab_content += `<div class="tab-pane fade show`+((i==0)?' active':'')+`" id="pills-`+i+`" role="tabpanel" aria-labelledby="pills-`+i+`-tab" lang="`+cnt_lang+`">`;
                    $.each(  workbench[ wid ][ workbench[ wid ][ domain+"/id/"+wid+"/work" ][ "lrmoo:R3_is_realised_in" ][i].id ][ "lrmoo:R15_has_fragment" ], function( j, frag ) {
                        tab_content += function () { var tmp = null; $.ajax({ 'async': false, 'type': "POST", 'dataType': 'html', 'url': workbench[ wid ][ workbench[ wid ][ frag.id ][ "crm:P106_is_composed_of" ][0].id ][ "crm:P106_is_composed_of" ][0], 
                                'success': function (data) { tmp = data; } }); return tmp; }()+'<br style="clear:both;"></br>'
                    });
                    tab_content += `</div>`;
                }
                if ( tid != '' ) {
                    cnt_loc = workbench[ wid ][ workbench[ wid ][ workbench[ wid ][ domain+"/id/"+wid+"/work" ][ "lrmoo:R3_is_realised_in" ][i].id ][ "lrmoo:R15_has_fragment" ][excerpt].id ][ "crm:P106_is_composed_of" ]
                }
            } else {                                                                                                                                                 // manifestations
                try { 
                    cnt_loc = workbench[ wid ][ workbench[ wid ][ workbench[ wid ][ domain+"/id/"+wid+"/work" ][ "lrmoo:R3_is_realised_in" ][i].id ][ "lrmoo:R4i_is_embodied_in" ].id ][ "crm:P106_is_composed_of" ];
                    texts.push( workbench[ wid ][ workbench[ wid ][ workbench[ wid ][ domain+"/id/"+wid+"/work" ][ "lrmoo:R3_is_realised_in" ][i].id ][ "lrmoo:R4i_is_embodied_in" ].id ][ "crm:P48_has_preferred_identifier" ] );
                }
                catch { }
            }
            if ( tid != '' && cnt_loc != null ) {
                tab_content += `<div class="tab-pane fade show`+((i==0)?' active':'')+`" id="pills-`+i+`" role="tabpanel" aria-labelledby="pills-`+i+`-tab" lang="`+cnt_lang+`"> 
                    <div id="`+cnt_loc[0].id+`" data-id="https://www.romanticperiodpoetry.org/id/`+wid+`/work"
                    data-expr="`+workbench[ wid ][ workbench[ wid ][ domain+"/id/"+wid+"/work" ][ "lrmoo:R3_is_realised_in" ][i].id ].id+`">`+
                        function () { var tmp = null; $.ajax({ 'async': false, 'type': "POST", 'dataType': 'html', 'url': workbench[ wid ][ cnt_loc[0].id ][ "crm:P106_is_composed_of" ][0].id, 
                            'success': function (data) { tmp = data; } }); return tmp; }()
                    +`</div></div>`;
            }
        } else if ( _.findIndex(workbench[ wid ][ workbench[ wid ][ domain+"/id/"+wid+"/work" ][ "lrmoo:R3_is_realised_in" ][i].id ][ "crm:P2_has_type" ], function(typ) { return typ.id == 'lct:img' }) != -1 ) {
            cnt_loc = workbench[ wid ][ workbench[ wid ][ workbench[ wid ][ domain+"/id/"+wid+"/work" ][ "lrmoo:R3_is_realised_in" ][i].id ][ "lrmoo:R4i_is_embodied_in" ].id ][ "crm:P106_is_composed_of" ]
            tab_content += `<div class="tab-pane fade show`+((i==0)?' active':'')+`" id="pills-`+i+`" role="tabpanel" aria-labelledby="pills-`+i+`-tab" lang="`+cnt_lang+`">
                <div id="`+cnt_loc[0].id+`" data-id="https://www.romanticperiodpoetry.org/id/`+wid+`/work"
                data-expr="`+workbench[ wid ][ workbench[ wid ][ domain+"/id/"+wid+"/work" ][ "lrmoo:R3_is_realised_in" ][i].id ].id+`" style="height:inherit;">`+
                    `<div id='openseadragon_`+tid+`' style='overflow: auto; height: inherit;'></div>`
                +`</div></div>`;
            imgset_id = cnt_loc[0].id;
            sources = [];
            $.each(workbench[ wid ][ cnt_loc[0].id ][ "crm:P106_is_composed_of" ].sort(), function(i,v) {
                var tilesource = {
                    type: "image",
                    url: v.id // (( component["crm:P2_has_type"]["id"] == "prisms:unavailable")?"/images/notavailable.jpg":v)
                };
                sources.push( tilesource );
            });
            openseadragonOptions.id = "openseadragon_"+tid;
            openseadragonOptions.tileSources = sources;
        } else if ( _.findIndex(workbench[ wid ][ workbench[ wid ][ domain+"/id/"+wid+"/work" ][ "lrmoo:R3_is_realised_in" ][i].id ][ "crm:P2_has_type" ], function(typ) { return typ.id == 'lct:aud' }) != -1 ) {
            if ( workbench[ wid ][ workbench[ wid ][ domain+"/id/"+wid+"/work" ][ "lrmoo:R3_is_realised_in" ][i].id ].hasOwnProperty( 'lrmoo:R15_has_fragment' ) ) { // fragments
                cnt_loc = workbench[ wid ][ workbench[ wid ][ workbench[ wid ][ domain+"/id/"+wid+"/work" ][ "lrmoo:R3_is_realised_in" ][i].id ][ "lrmoo:R15_has_fragment" ][0].id ][ "crm:P106_is_composed_of" ];
            } else {
                cnt_loc = workbench[ wid ][ workbench[ wid ][ workbench[ wid ][ domain+"/id/"+wid+"/work" ][ "lrmoo:R3_is_realised_in" ][i].id ][ "lrmoo:R4i_is_embodied_in" ].id ][ "crm:P106_is_composed_of" ];
            }
            prfset_id = cnt_loc[0].id;
            tab_content += `<div class="tab-pane fade show`+((i==0)?' active':'')+`" id="pills-`+i+`" role="tabpanel" aria-labelledby="pills-`+i+`-tab" lang="`+cnt_lang+`">
                <div id="`+cnt_loc[0].id+`" data-id="https://www.romanticperiodpoetry.org/id/`+wid+`/work"
                    data-expr="`+workbench[ wid ][ workbench[ wid ][ domain+"/id/"+wid+"/work" ][ "lrmoo:R3_is_realised_in" ][i].id ].id+`">`+
                `<div id="waveform_`+tid+`" class="waveform" data-load="`+workbench[ wid ][ cnt_loc[0].id ][ "crm:P106_is_composed_of" ][0].id+`"></div>`+
                `<div id="wavetimeline_`+tid+`"></div>`+
                `<div class="controls" style="text-align:center;margin-top:20px;">
                    <button class="btn" onclick="player[ '`+prfset_id+`' ].stop()">
                        <i class="fa fa-step-backward"></i>
                    </button>
                    <button class="btn" onclick="player[ '`+prfset_id+`' ].skipBackward()">
                        <i class="fa fa-backward"></i> 
                    </button>
                    <button class="btn" onclick="player[ '`+prfset_id+`' ].playPause()">
                        <i class="fa fa-play"></i> <i class="fa fa-pause"></i> 
                    </button>
                    <button class="btn" onclick="player[ '`+prfset_id+`' ].skipForward()">
                        <i class="fa fa-forward"></i>
                    </button>
                    <button class="btn" onclick="player[ '`+prfset_id+`' ].toggleMute()">
                        <i class="fa fa-volume-off"></i>
                    </button>
                    Zoom: <input type="range" min="1" max="100" value="20" style="vertical-align:middle;"/>
                </div><br/>`+
                `<div class="attribution"><div><span>Performance:</span><span>`+workbench[ wid ][ workbench[ wid ][ domain+"/id/"+wid+"/work" ][ "lrmoo:R3_is_realised_in" ][i].id ][ "dcterms:contributor" ]+`</span></div>
                 <div><span>Source:</span><span>`+workbench[ wid ][ workbench[ wid ][ domain+"/id/"+wid+"/work" ][ "lrmoo:R3_is_realised_in" ][i].id ][ "dcterms:source" ]+`</span>
                    <span><a href="`+workbench[ wid ][ workbench[ wid ][ domain+"/id/"+wid+"/work" ][ "lrmoo:R3_is_realised_in" ][i].id ][ "dcterms:identifier" ].id+`">`+
                    workbench[ wid ][ workbench[ wid ][ domain+"/id/"+wid+"/work" ][ "lrmoo:R3_is_realised_in" ][i].id ][ "dcterms:identifier" ].id+`</a></span></div>
                 </div>`
                +`</div></div>`;
        }
        // ... other content types ...
    }
    // create DOM
    $( ".globaltext-container .globaltext" ).replaceWith( `<div class="globaltext resizable draggable"><ul class="nav nav-pills" id="pills-tab" role="tablist">`+tab_nav+`</ul><div class="tab-content" id="pills-tabContent">`+tab_content+`</div></div>` );
    clearInterval( t );
    t = setInterval(updateDOM(),500);

    // initialize expressions
    // facsimile
    if ( imgset_id !== undefined ) {
        var startPage = undefined, pages = [];
        $.each( $( "#"+tid+" .pagebreak"), function (i,v) {
            pages.push( $(v).data( "facs" ).split( '/' ).pop() );
            $(v).append( ` <span class="image_link">[<a href="" data-imageset="`+imgset_id+`" data-id="`+ i +`">`+ (i+1).toString().padStart(3, "0") +`</a>]</span>` );
            if ( i == 0 ) { startPage = i }
        });
        if ( openseadragonOptions.hasOwnProperty( "tileSources" ) ) {
            var sources = [];
            $.each( pages, function(i,v) {
                sources.push( _.find( openseadragonOptions.tileSources, function(tile) { return tile.url.includes( v ); } ) )
            });
            openseadragonOptions.tileSources = sources;
            if( viewer[ imgset_id ] ) {
                viewer[ imgset_id ].destroy(); viewer[ imgset_id ] = null;
            }
            viewer[ imgset_id ] = OpenSeadragon( openseadragonOptions );
            add_image_tools( imgset_id, startPage );
        }
    }
    // text
    $.each( texts, function( i,v) {
        
    })
    // audio/video
    if ( $( "#waveform_"+tid ).length ) {
        if ( player[ prfset_id ] && !player[ prfset_id ].isDestroyed ) { player[ prfset_id ].unAll(); player[ prfset_id ].destroy(); }
        player[ prfset_id ] = WaveSurfer.create({
            container: '#waveform_'+tid,
            partialRender: true,
            scrollParent: true,
            waveColor: '#ccc',
            progressColor: '#999', //'hsla(200, 80%, 30%, 0.5)',
            skipLength: 5,
            minimap: true,
            backend: 'MediaElement',
            regionsMinLength: .25,
            normalize: true,
            minPxPerSec: 10,
            plugins: [
                WaveSurfer.regions.create(),
                WaveSurfer.minimap.create({
                    height: 30,
                    waveColor: '#ddd',
                    progressColor: '#999',
                    cursorColor: '#333'
                }),
              WaveSurfer.timeline.create({
                    container: "#wavetimeline_"+tid
                })
            ]
        });
        if ( $( "#waveform_"+tid ).data( "load" ).includes( domain ) ) {
            fetch( $( "#waveform_"+tid ).data( "load" ).replace(/\.[^/.]+$/, "")+".json" )
            .then(response => { if (!response.ok) { throw new Error("HTTP error " + response.status); }
                return response.json();
            }).then(peaks => { player[ prfset_id ].load($( "#waveform_"+tid ).data( "load" ), peaks.data); 
            }).catch((e) => {});            
        } else {
            player[ prfset_id ].load( $( "#waveform_"+tid ).data( "load" ) );
        }
        // Update the zoom level on slider change
        player[ prfset_id ].on('waveform-ready', function() {
            // default region
            if ( $( "#waveform_"+tid ).data( "load" ).includes( '#t=') ) {
                var default_region = $( "#waveform_"+tid ).data( "load" ).split( '#t=' )[1].split(',');
                player[ prfset_id ].addRegion( {"drag":false,"resize":false,"start":default_region[0],"end":default_region[1]} );
            }
            player[ prfset_id ].zoom(20);
        });
        $( document ).on('change input', 'input[type="range"]', function(e) {
            const minPxPerSec = e.target.value;
            player[ prfset_id ].zoom(minPxPerSec)
        })
    }
}

// retrieve JSON-LD version of SPARQL query
function getJSONLD( BGquery, mode ) {
    return new Promise(function(resolve, reject) {
        $.ajax({
            type: "POST",
            url: SPARQL_RPPA+"sparql",
            data: { query: BGquery },
            headers: {
                Accept : "application/json"
            }
        }).done( async function( result ) {
            var quads = '', results = [];
            if ( result.results ) {
            // SELECT
                $.each( result.results.bindings, function( i,v ) {
                    results.push( v );
                    quads += ((v.s.type == 'uri')?"<"+v.s.value+">":"_:"+v.s.value ) + " <"+v.p.value+"> "+((v.o.type == 'uri')?"<"+v.o.value+">":((v.o.type == 'bnode')?"_:"+v.o.value:'"'+v.o.value.replace(/"/g,'\\"').replace(/\n/g,'\\n')+'"') )+" .\n";
                });
                if ( mode == "raw" ) {
                    resolve( results ); 
                } else {
                    var doc = await jsonld.fromRDF( quads, {format:'application/nquads'} );
                    var compacted = await jsonld.compact( doc, context );
                    resolve( compacted ); 
                }
            } else {
            // ASK
                resolve( result.boolean );
            }
        }).fail( function( err ) {
            console.log( err );
        });
    })
}

// update RDF store
function putTRIPLES( BGupdate ) {
    console.log( BGupdate );
    if ( user.startsWith( "rppa:" ) ) {
        return new Promise(function(resolve, reject) {
            $.ajax({
                type: "POST",
                url: SPARQL_RPPA+"update",
                data: { update: BGupdate },
                headers: {
                    Accept : "application/json"
                }
            }).done( function( result ) {
                resolve();
            }).fail( function( error ) {
                console.log( "FATAL UPDATE error!",error );
            });
        })
    } else {
        show_alert_mod( "We could not process your request and have logged this incident. If this error persists, please restart your browser. Thank you!", "danger", false, 0 );
        throw 'FATAL UPDATE error!';
    }
}

function show_alert_mod( message, type, hide, ms ) {
    if ( message ) {
		$( '.toast' ).remove();
		$( "body" ).prepend(
		`<div role="alert" style="min-width:300px;position:fixed;" aria-live="assertive" aria-atomic="true" class="toast alert-`+type+`" data-autohide="`+hide+`" data-delay="`+ms+`">
            <div class="toast-header">
                <span class="badge badge-`+type+`"><i class="fas fa-exclamation-triangle"></i></span> 
                <strong class="mr-auto">RPPA</strong>
                <small>just now</small>
                <button type="button" class="ml-2 mb-1 close" data-dismiss="toast" aria-label="Close">
                <span aria-hidden="true">&times;</span>
                </button>
            </div>
            <div class="toast-body">`+
                message+
            `</div>
		</div>`
		);
		$( ".toast" ).toast( 'show' );
	}
}

// close popovers
$( document ).on('click', '.popover-header button.btn-close', function() {
   $( "[aria-describedby='"+$(this).closest('div.popover').attr( 'id')+"']" ).popover('hide');
});

// switch between reading/editing
$( document ).on('change', '.changeMode', function() {
    var modeC = {}
    modeC[ 'edit' ] = '#2a9d8f';
    modeC[ 'read' ] = 'var(--bs-orange)';
    $( "#mode" ).remove();
    if ( mode == "edit" ) {
        mode = "read";
    } else {
        mode = "edit";
    }
    $( "head" ).append( `<style type="text/css" id="mode">.globaltext-container a,.globaltext-container a:hover,.globaltext-container a:visited,.globaltext-container a:active,.popover a.save,.popover a.cancel{color: `+modeC[ mode ]+` !important;}.globaltext-container .nav-pills .nav-link.active,.globaltext-container .bg-rppa,.globaltext-container .controls .btn{background-color:`+modeC[ mode ]+` !important;}.globaltext-container a.bg-rppa{color:white !important;}.globaltext-container input{accent-color: `+modeC[ mode ]+` !important;}</style>` );
    drawGlobalText( $( this ).data( "tid" ), $( this ).data( "wid" ) );
    processGlobalText( $( this ).data( "tid" ), $( this ).data( "wid" ) );
});

// update UI on expression selection
$(document).on('click','button[data-bs-toggle="pill"],.tgl-btn',function(){
    $(".popover").hide();
    if ( mode == "edit" ) {
        processGlobalText( "", $( this ).closest( "[data-wid]" ).data( "wid" ) );
    } else {
        initializeContexts( contexts[ $( this ).data( "expr" ) ], mode );
    }
    if ( $( "[id^=waveform_]" ).length ) {
        player[ Object.keys( player ) ].drawBuffer();
    }
    clearInterval( t );
    t = setInterval(updateDOM(),500);
});

var dismiss_region = undefined;
/*  This function retrieves and processes the available contexts or
    buildingblocks.  It
    - queries and retrieves avaialble contexts (reading view) or
    - queries and retrieves avaialble buildingblocks (editing view)
    - retrieves and processes any blank nodes for the body and target of the
      context or building block
    - initializes tools (Openseadragon, Wavesufer) for reading or editing mode
*/
async function processGlobalText( tid, wid ) {
    var work = domain+"/id/"+wid+"/work";
    if ( mode == "read" ) {
        // load all (i.e. <default>) contexts
        var q = namespaces+`SELECT ?s ?p ?o ?g
        WHERE {
        {
            {
                ?s a rppa:Context .
                ?s intro:R20_discusses <https://www.romanticperiodpoetry.org/id/`+wid+`/work> .
                ?s ?p ?o .
            } UNION {
                ?s2 intro:R20_discusses <https://www.romanticperiodpoetry.org/id/`+wid+`/work> .
    			?s2 rppa:consistsOf ?w .
    			?w ?p ?o . 
          		BIND (?w AS ?s)
            } UNION {
                ?s2 intro:R20_discusses <https://www.romanticperiodpoetry.org/id/`+wid+`/work> .
                ?s2 rppa:consistsOf ?w .
                ?w <http://www.w3.org/ns/oa#hasBody> ?body .
                ?body ?p ?o .
                BIND(?body AS ?s)
            } UNION {
                ?s2 intro:R20_discusses <https://www.romanticperiodpoetry.org/id/`+wid+`/work> .
                ?s2 rppa:consistsOf ?w .
                ?w <http://www.w3.org/ns/oa#hasTarget> ?body .
                ?body ?p ?o .
                BIND(?body AS ?s)
            } UNION {
                ?s2 intro:R20_discusses <https://www.romanticperiodpoetry.org/id/`+wid+`/work> .
                ?s2 rppa:consistsOf ?w .
                ?w <http://www.w3.org/ns/oa#hasBody> ?body .
                ?body <http://www.w3.org/ns/activitystreams#items> ?list .
                ?list rdf:rest*/rdf:first ?items .
                BIND(<http://www.w3.org/ns/activitystreams#items> as ?p)
                BIND(?items as ?o)
                BIND(?list as ?s)
            } UNION {
                ?s2 intro:R20_discusses <https://www.romanticperiodpoetry.org/id/`+wid+`/work> .
                ?s2 rppa:consistsOf ?w .
                ?w <http://www.w3.org/ns/oa#hasTarget> ?body .
                ?body oa:hasSelector ?items .
                ?items ?p ?o .
                BIND(?items as ?s)
            }
            BIND(<default> AS ?g)
            } UNION {
                ?s2 intro:R20_discusses <https://www.romanticperiodpoetry.org/id/`+wid+`/work> .
                ?s2 (<http://purl.org/dc/terms/contributor>|<http://purl.org/dc/terms/creator>) ?o2 .
                ?o2 a foaf:Agent .
                ?o2 ?p ?o .
                BIND(?o2 AS ?s)
                BIND(<default> AS ?g)                
            }
        }`;
        var r = await getJSONLD( q );
        if (r.hasOwnProperty( "graph" )) {
            // insert blank nodes into JSON-LD structure
            ckeys = _.keyBy( r.graph, 'id' ); // create blank node IDs
            for (let i = 0; i < r.graph.length; i++) {
                let obj = r.graph[i];
                if (obj.id.startsWith( 'http' )) {
                    if ( obj.hasOwnProperty( "oa:hasBody" ) ) {
                        var hasBody = obj['oa:hasBody'].id ;
                        obj['oa:hasBody'] = [];
                        obj['oa:hasBody'].push( ckeys[ hasBody ] );
                        if ( obj['oa:hasBody'][0].hasOwnProperty( 'as:items' ) ) {
                            var asItems = obj['oa:hasBody'][0]['as:items'].id;
                            obj['oa:hasBody'][0]['as:items'] = ckeys[ asItems ][ 'as:items' ];
                        }    
                    }
                    if ( obj.hasOwnProperty( "oa:hasTarget" ) ) {
                        var hasTarget = obj['oa:hasTarget'].id ;
                        obj['oa:hasTarget'] = [];
                        obj['oa:hasTarget'].push( ckeys[ hasTarget ] ); 
                        var hasSelector = obj['oa:hasTarget'][0]['oa:hasSelector'].id;
                        obj['oa:hasTarget'][0]['oa:hasSelector'] = ckeys[ hasSelector ];
                    }
                    if (obj.id.startsWith( 'http' )) {
                        if ( obj.hasOwnProperty( "rppa:consistsOf" ) ) {
                            var consistsOf = obj['rppa:consistsOf'].id ;
                            obj['rppa:consistsOf'] = [];
                            obj['rppa:consistsOf'].push( ckeys[ consistsOf ] ); 
                        }
                    }
                }
            }
        } else {
            r.graph = [];
        }
        contexts = _.groupBy( _.filter( r.graph, function(o) { return o.id.startsWith( 'http' ); }), '["intro:R20_discusses"][1].id' );
        contributors = _.keyBy( _.filter( r.graph, function(o) { return o.id.startsWith( 'rppa:user-' ); }), 'id' );
        // tool settings
        if ( Object.keys(annotorious).length > 0 ) {
            annotorious[ Object.keys(annotorious) ].readOnly = true; // image
        }
        if ( $( ".waveform" ).length ) {
            player[ Object.keys( player ) ].disableDragSelection(); // sound
            player[ Object.keys( player ) ].setProgressColor( '#BD7E46' );
        }
    } else if ( mode == "edit" ) {
        // load user contributions
        var q = namespaces+`SELECT *
        WHERE {
            {
            GRAPH `+user+` {
                {
                    ?s a rppa:BuildingBlock .
                    ?s dcterms:relation <https://www.romanticperiodpoetry.org/id/`+wid+`/work> .
                    ?s ?p ?o .
                } UNION {
                    ?s2 dcterms:relation <https://www.romanticperiodpoetry.org/id/`+wid+`/work> .
                    ?s2 <http://www.w3.org/ns/oa#hasBody> ?body .
                    ?body ?p ?o .
                    BIND(?body AS ?s)
                } UNION {
                    ?s2 dcterms:relation <https://www.romanticperiodpoetry.org/id/`+wid+`/work> .
                    ?s2 <http://www.w3.org/ns/oa#hasTarget> ?body .
                    ?body ?p ?o .
                    BIND(?body AS ?s)
                } UNION {
                    ?s2 dcterms:relation <https://www.romanticperiodpoetry.org/id/`+wid+`/work> .
                    ?s2 <http://www.w3.org/ns/oa#hasBody> ?body .
                    ?body <http://www.w3.org/ns/activitystreams#items> ?list .
                    ?list rdf:rest*/rdf:first ?items .
                    BIND(<http://www.w3.org/ns/activitystreams#items> as ?p)
                    BIND(?items as ?o)
                    BIND(?list as ?s)
                } UNION {
                    ?s2 dcterms:relation <https://www.romanticperiodpoetry.org/id/`+wid+`/work> .
                    ?s2 <http://www.w3.org/ns/oa#hasTarget> ?body .
                    ?body oa:hasSelector ?items .
                    ?items ?p ?o .
                    BIND(?items as ?s)
                }
                BIND(`+user+` AS ?g)
            }
            }
        }`;
        var r = await getJSONLD( q );
        if (r.hasOwnProperty( "graph" )) {
            // insert blank nodes into JSON-LD structure
            ckeys = _.keyBy( r.graph, 'id' ); // create blank node IDs
            for (let i = 0; i < r.graph.length; i++) {
                let obj = r.graph[i];
                if (obj.id.startsWith( 'http' )) {
                    if ( obj.hasOwnProperty( "oa:hasBody" ) ) {
                        var hasBody = obj['oa:hasBody'].id ;
                        obj['oa:hasBody'] = [];
                        obj['oa:hasBody'].push( ckeys[ hasBody ] );
                        if ( obj['oa:hasBody'][0].hasOwnProperty( 'as:items' ) ) {
                            var asItems = obj['oa:hasBody'][0]['as:items'].id;
                            obj['oa:hasBody'][0]['as:items'] = ckeys[ asItems ][ 'as:items' ];
                        }    
                    }
                    if ( obj.hasOwnProperty( "oa:hasTarget" ) ) {
                        var hasTarget = obj['oa:hasTarget'].id ;
                        obj['oa:hasTarget'] = [];
                        obj['oa:hasTarget'].push( ckeys[ hasTarget ] ); 
                        var hasSelector = obj['oa:hasTarget'][0]['oa:hasSelector'].id;
                        obj['oa:hasTarget'][0]['oa:hasSelector'] = ckeys[ hasSelector ];
                    }
                }
            }
        } else {
            r.graph = [];
        }
        console.log( r.graph );
        contexts = _.groupBy( _.filter( r.graph, function(o) { return o.id.startsWith( 'http' ); }), '["intro:R20_discusses"][1].id' );
        // tool settings
        if ( Object.keys(annotorious).length > 0 ) {
            annotorious[ Object.keys(annotorious) ].readOnly = false; // image
        }
        if ( $( ".waveform" ).length ) {
            player[ Object.keys( player ) ].disableDragSelection();
            player[ Object.keys( player ) ].enableDragSelection({
                color: 'rgb(74, 186, 159,.2)',
                resize: false,
                drag: false
            }); // sound
            player[ Object.keys( player ) ].setProgressColor( '#358078' );
            player[ Object.keys( player ) ].un('region-update-end');
            player[ Object.keys( player ) ].on('region-update-end', function( region ) {
                player[ Object.keys( player ) ].disableDragSelection();
                var target = secondsToTime(region.start) + "–" + secondsToTime(region.end);
                var id = $( "[data-id='"+region.id+"']" ).closest( 'div[data-expr]' ).attr( 'id' );
                var work = $( "[data-id='"+region.id+"']" ).closest( 'div[data-expr]' ).data( 'id' );
                var expr = $( "[data-id='"+region.id+"']" ).closest( 'div[data-expr]' ).data( 'expr' );
                $( ".tab-pane.active [data-id='"+region.id+"']" ).popover({
                    sanitize: false,
                    content: `<a role="button" class="save" data-start="`+region.start+`" data-end="`+region.end+`" data-ids="`+region.id+`" data-id="`+id+`" data-work="`+work+`" data-expr="`+expr+`" data-sel="`+target+`" style="font-size:18px;margin-left:10px;"><i class="fas fa-save"></i></a>
                        <a role="button" class="cancel" style="font-size:20px;margin:0 10px;"><i class="fas fa-close"></i></a>`,
                    html: true,
                    placement: 'auto',
                    container: '.globaltext',
                    template: `<div class="popover popover-dismiss-select med" role="popover" tabindex="0" data-trigger="focus" style="opacity:.85;">
                        <div class="popover-arrow"></div>
                        <div class="popover-body"></div>
                    </div>`
                })
                dismiss_select = $( ".tab-pane.active [data-id='"+region.id+"']" ).popover('show');
                dismiss_select.popover('toggleEnabled'); // disable toggling
                dismiss_region = region;
            });
        }
    }
    // initialize
    initializeContexts( contexts[ $( ".globaltext button.active" ).data( "expr" ) ], mode );
}

/*  This function takes a list of contexts and hands them over to specialized
    functions for display
*/
function initializeContexts( exprContexts, mode ) {
    $( ".contexts" ).html( "" );
    $( ".workbench" ).html( "" );
    // filter exprContexts by type and pass to handlers
    if ( mode == "edit" ) {
        var bb = _.filter( exprContexts, function(o) { 
            return o["type"].includes( "rppa:BuildingBlock" ) && o["crm:P2_has_type"][0].id == "lct:txt";
        });
        processBuildingBlocks( bb );
        if ( Object.keys(annotorious).length > 0 ) {
            var bb = _.filter( exprContexts, function(o) { 
                return o["type"].includes( "rppa:BuildingBlock" ) && o["crm:P2_has_type"][0].id == "lct:img";
            });
            processImageAnnotations( Object.keys(annotorious), bb )
        }
        if ( $( ".waveform" ).length ) {
            var bb = _.filter( exprContexts, function(o) { 
                return o["type"].includes( "rppa:BuildingBlock" ) && o["crm:P2_has_type"][0].id == "lct:aud";
            });
            processMediaBuildingBlocks( bb )
        }
    } else {
        var tc = _.filter( exprContexts, function(o) {
            return o["type"].includes( "rppa:Context" ) //&& o["crm:P2_has_type"][0].id == "lct:txt";
        });
        processTxtContexts( tc );
    }
}

$( document ).on('click', 'a.show_globaltext', async function (e) {
    display_globaltext( e.currentTarget.dataset.tid,e.currentTarget.dataset.wid );
});

function reTheme() {
    location.reload();
}

$( document ).ready(function() {

    //$( ".sso,.sso-sign-in" ).remove(); // TODO: remove when ready
    if ( /romanticperiodpoetry\.org/.test(window.location.href) ) {
        user = Cookies.get( 'RPPA-login-user' ) || undefined;
        username = Cookies.get( 'RPPA-login-username' ) || undefined;
    } else {
        user = "rppa:user-9bf0ccc9-dcaa-4e57-9b83-b8a08d2614cb";
        username = "Alexander Huber";
    }
    if ( user != undefined && username != 'undefined' ) {
        $( ".sso-sign-in" ).remove();
        provider_img = Cookies.get( 'RPPA-login-provider' );
        if ( provider_img == 'orcid' ) {
            provider_img = ` <i class="fa-brands fa-orcid"></i>`
        } else if ( provider_img == 'fb' ) {
            provider_img = ` <i class="fa-brands fa-facebook"></i>`
        } else if ( provider_img == 'google' ) {
            provider_img = ` <i class="fa-brands fa-google"></i>`
        } else {
            provider_img = ` <i class="fas fa-user-circle"></i>`
        }
    }
    $( ".sso" ).append(
        `Signed in as: <em><span id="username">`+((user != undefined && username != 'undefined')?username:'Not signed in')+`</span></em> <span id="provider">`+((user != undefined && username != 'undefined')?provider_img:'')+`</span>`+
        ((user != undefined && username != 'undefined')?'':' <button type="button" class="btn btn-sm sso-sign-in" style="background-color:var(--bs-orange);color:#fff;margin-left:5px;margin-top:-4px;">Sign in</button>' )
    );

});
