// RPPA

// global settings
var user = undefined, username = undefined;
var workbench = {}, provider_img = '', contexts;
var domain = "https://www.romanticperiodpoetry.org";

var SOLR_RPPA, BG_RPPA;
if ( /romanticperiodpoetry\.org/.test(window.location.href) ) {
    BG_RPPA = "https://data.prisms.digital/query/rppa/";
    SOLR_RPPA = "https://data.prisms.digital/solr/rppa/select";
} else {
    BG_RPPA = "http://192.168.1.2:3030/rppa/";
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

var t, myModalGT, myModalGTEl, zInd = 1054, wavesurfer = undefined, viewer = {}, mode = 'read';
var done_tooltipTriggerList = [], done_popoverTriggerList = [];
var loadTexts = function() {
    return $.ajax({ url: "/data/texts.min.json", dataType: 'json',
      success: function(data) {
        texts = data;
      }, error: function (jqXHR, textStatus, errorThrown) { console.log(jqXHR, textStatus, errorThrown); }
    });
}

// display a global text
async function display_globaltext( tid, wid ) {

    // load work and author(s)
    var work = await load_work_overview( wid );
    var separator = "", author = "";
    if ( work.aut != '' ) {
        for (var i = 0; i < work.aut.split(';').length; ++i) {
            var tmp = await load_poet_overview( work.aut.split(';')[i] );
            author += separator + tmp[ work.aut.split(';')[i] ].name;
            separator = " and ";
        }
    }
    // retrieve RDF in JSON-LD
    var q = namespaces+`SELECT *
    WHERE {
        ?s ?p ?o
        FILTER (
            (CONTAINS (STR(?s), ?searchString)) ||
            (CONTAINS (STR(?o), ?searchString))
        )
        BIND("`+wid+`" AS ?searchString)
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
        <style>
        .nav-pills .nav-link.active, .nav-pills .show>.nav-link {
            color: #fff;
            background-color: var(--bs-orange);
        }
        .nav-link {
            color: #333;
        }
        .nav-link:focus, .nav-link:hover {
            color: #000;
        }
        </style>
        <div style="z-index:`+zInd+`" class="modal fade" id="`+wid+`" data-wid="`+wid+`" tabindex="-1" data-bs-backdrop="static" aria-labelledby="ModalLabel" aria-hidden="true">
            <div class="modal-dialog modal-xl modal-fullscreen modal-dialog-centered modal-dialog-scrollable">
                <div class="modal-content">
                    <div class="modal-header">
                        <div class="row" style="width:100%;">
                            <div class="col-sm-4" style="margin:auto auto;">
                                <h5 class="modal-title" id="ModalLabel" style="display:inline">`+truncateString(work.tit,50)+` / `+author+`</h5>
                            </div>
                            <div class="col-sm-4" style="margin:auto auto;">
                                <div class="tools">
                                    <a role="button" class="btn changeMode" data-wid="`+wid+`" data-tid="`+tid+`" data-mode="read" aria-disabled="false" style="height:36px;width:123px;background-color:var(--bs-orange);color:#fff;"><span class=""><i class="fas fa-book-open"></i> Read</span></a>
                                    <a`+((user != undefined && username != 'undefined')?' role="button" style="height:36px;background-color:#2a9d8f;color:#fff;"':' style="height:36px;background-color:#2a9d8f;color:#fff;opacity:.5;cursor:not-allowed;"')+` class="btn changeMode" data-wid="`+wid+`" data-tid="`+tid+`" style="" data-mode="edit" aria-disabled="`+((user != undefined && username != 'undefined')?'false':'true')+`"><span class=""><i class="fas fa-edit"></i> Contribute</span></a>
                                </div>
                            </div>
                            <div class="col-sm-4" style=margin:auto auto;">
                                Logged in as: <em><span id="username">`+((user != undefined && username != 'undefined')?username:'Not logged in')+`</span></em> <span id="provider">`+((user != undefined && username != 'undefined')?provider_img:'')+`</span>`+
                                    ((user != undefined && username != 'undefined')?'':' <button type="button" class="btn btn-sm sso-sign-in" style="background-color:var(--bs-orange);color:#fff;margin-left:5px;margin-top:-4px;">Sign in</button>')
                                +`
                            </div>
                        </div>
                        <button type="button" class="btn-close" data-mode="read" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <div class="container-fluid">
                            <div class="row">
                                <div class="col-sm-4 text">
                                </div>
                                <div class="col-sm-4 contexts">
                                </div>
                                <div class="col-sm-4 workbench">
                                </div>
                            </div>
                        </div>
                    </div>
                    <!--
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                        <button type="button" class="btn btn-primary">Save changes</button>
                    </div>
                    -->
                </div>
            </div>
        </div>`;
    $( "body" ).prepend( text );
    $( ".sso-sign-in" ).remove(); // TODO: remove when ready
    drawGlobalText( tid, wid );
    processGlobalText( tid, wid );

    myModalGTEl = document.getElementById(wid);
    myModalGT = new bootstrap.Modal(myModalGTEl, {
        backdrop: 'static',
        keyboard: false
    }).show();

    // on showing modal
    myModalGTEl.addEventListener('shown.bs.modal', function (event) {

    });
    // on closing modal
    myModalGTEl.addEventListener('hide.bs.modal', function (event) {
        mode = "read";
        $( "#mode" ).remove();
        $(".popover").remove();
        $(this).remove();
        zInd = 1054;
        location.href = "#id/"+work.aut.split(';')[0]; // reset location to work's author
        done_tooltipTriggerList = [];
        done_popoverTriggerList = [];
        clearInterval( t );
        annos = {};
        annotorious = {};
    });
}

function drawGlobalText( tid, wid ) {
    var imgset_id = undefined;
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
                nav_name = 'Original text (excerpt)';
            } else {
                nav_name = 'Original text';
            }
        } else if ( _.findIndex(workbench[ wid ][ workbench[ wid ][ domain+"/id/"+wid+"/work" ][ "lrmoo:R3_is_realised_in" ][i].id ][ "crm:P2_has_type" ], function(typ) { return typ.id == 'lct:txt' }) != -1 ) {
            nav_name = 'Translation (<code>'+cnt_lang+'</code>)';
        } else if ( _.findIndex(workbench[ wid ][ workbench[ wid ][ domain+"/id/"+wid+"/work" ][ "lrmoo:R3_is_realised_in" ][i].id ][ "crm:P2_has_type" ], function(typ) { return typ.id == 'sc:Manifest' || typ.id == 'lct:img' || typ.id == 'lct:dig'}) != -1) {
            nav_name = 'Facsimile';
        } else if ( _.findIndex(workbench[ wid ][ workbench[ wid ][ domain+"/id/"+wid+"/work" ][ "lrmoo:R3_is_realised_in" ][i].id ][ "crm:P2_has_type" ], function(typ) { return typ.id == 'lct:aud' || typ.id == 'lct:mov' }) != -1) {
            if ( workbench[ wid ][ workbench[ wid ][ domain+"/id/"+wid+"/work" ][ "lrmoo:R3_is_realised_in" ][i].id ].hasOwnProperty( 'lrmoo:R15_has_fragment' ) ) {
                nav_name = 'Reading (excerpt)';
            } else {
                nav_name = 'Reading';
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
                        return workbench[ wid ][ workbench[ wid ][ typ.id ][ "crm:P106_is_composed_of" ][0]["id"]][ "crm:P106_is_composed_of" ][0].includes( '/'+tid+'/' );
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
                        function () { var tmp = null; $.ajax({ 'async': false, 'type': "POST", 'dataType': 'html', 'url': workbench[ wid ][ cnt_loc[0].id ][ "crm:P106_is_composed_of" ][0], 
                            'success': function (data) { tmp = data; } }); return tmp; }()
                    +`</div></div>`;
            }
        } else if ( _.findIndex(workbench[ wid ][ workbench[ wid ][ domain+"/id/"+wid+"/work" ][ "lrmoo:R3_is_realised_in" ][i].id ][ "crm:P2_has_type" ], function(typ) { return typ.id == 'lct:img' }) != -1 ) {
            cnt_loc = workbench[ wid ][ workbench[ wid ][ workbench[ wid ][ domain+"/id/"+wid+"/work" ][ "lrmoo:R3_is_realised_in" ][i].id ][ "lrmoo:R4i_is_embodied_in" ].id ][ "crm:P106_is_composed_of" ]
            tab_content += `<div class="tab-pane fade show`+((i==0)?' active':'')+`" id="pills-`+i+`" role="tabpanel" aria-labelledby="pills-`+i+`-tab" lang="`+cnt_lang+`">
                <div id="`+cnt_loc[0].id+`" data-id="https://www.romanticperiodpoetry.org/id/`+wid+`/work"
                data-expr="`+workbench[ wid ][ workbench[ wid ][ domain+"/id/"+wid+"/work" ][ "lrmoo:R3_is_realised_in" ][i].id ].id+`">`+
                    `<div id='openseadragon_`+tid+`' style='overflow: auto; height: calc( 100vh - 150px);'></div>`
                +`</div></div>`;
            imgset_id = cnt_loc[0].id;
            sources = [];
            $.each(workbench[ wid ][ cnt_loc[0].id ][ "crm:P106_is_composed_of" ].sort(), function(i,v) {
                var tilesource = {
                    type: "image",
                    url: v // (( component["crm:P2_has_type"]["id"] == "prisms:unavailable")?"/images/notavailable.jpg":v)
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
            tab_content += `<div class="tab-pane fade show`+((i==0)?' active':'')+`" id="pills-`+i+`" role="tabpanel" aria-labelledby="pills-`+i+`-tab" lang="`+cnt_lang+`">
                <div id="`+cnt_loc[0].id+`" data-id="https://www.romanticperiodpoetry.org/id/`+wid+`/work"
                    data-expr="`+workbench[ wid ][ workbench[ wid ][ domain+"/id/"+wid+"/work" ][ "lrmoo:R3_is_realised_in" ][i].id ].id+`">`+
                `<div id="waveform_`+tid+`" class="waveform" data-load="`+workbench[ wid ][ cnt_loc[0].id ][ "crm:P106_is_composed_of" ][0]+`"></div>`+
                `<div id="wavetimeline"></div>`+
                `<div class="controls" style="text-align:center;margin-top:20px;">
                    <button class="btn" onclick="wavesurfer.stop()">
                        <i class="fa fa-step-backward"></i>
                    </button>
                    <button class="btn" onclick="wavesurfer.skipBackward()">
                        <i class="fa fa-backward"></i> 
                    </button>
                    <button class="btn" onclick="wavesurfer.playPause()">
                        <i class="fa fa-play"></i> <i class="fa fa-pause"></i> 
                    </button>
                    <button class="btn" onclick="wavesurfer.skipForward()">
                        <i class="fa fa-forward"></i>
                    </button>
                    <button class="btn" onclick="wavesurfer.toggleMute()">
                        <i class="fa fa-volume-off"></i>
                    </button>
                </div><br/>`+
                `<div class="attribution"><div><span>Performance:</span><span>`+workbench[ wid ][ workbench[ wid ][ domain+"/id/"+wid+"/work" ][ "lrmoo:R3_is_realised_in" ][i].id ][ "dcterm:contributor" ]+`</span></div>
                 <div><span>Source:</span><span>`+workbench[ wid ][ workbench[ wid ][ domain+"/id/"+wid+"/work" ][ "lrmoo:R3_is_realised_in" ][i].id ][ "dcterm:source" ]+`</span>
                    <span><a href="`+workbench[ wid ][ workbench[ wid ][ domain+"/id/"+wid+"/work" ][ "lrmoo:R3_is_realised_in" ][i].id ][ "dcterm:identifier" ].id+`">`+
                    workbench[ wid ][ workbench[ wid ][ domain+"/id/"+wid+"/work" ][ "lrmoo:R3_is_realised_in" ][i].id ][ "dcterm:identifier" ].id+`</a></span></div>
                 </div>`
                +`</div></div>`;
        }
        // ... other content types ...
    }
    // create DOM
    $( "#"+wid+" .text" ).html( `<ul class="nav nav-pills mb-2" id="pills-tab" role="tablist">`+tab_nav+`</ul><div class="tab-content" id="pills-tabContent">`+tab_content+`</div>` );
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
        if ( wavesurfer && !wavesurfer.isDestroyed ) { wavesurfer.unAll(); wavesurfer.destroy(); }
        wavesurfer = WaveSurfer.create({
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
            plugins: [
                WaveSurfer.regions.create(),
                WaveSurfer.minimap.create({
                    height: 30,
                    waveColor: '#ddd',
                    progressColor: '#999',
                    cursorColor: '#333'
                }),
                WaveSurfer.timeline.create({
                    container: "#wavetimeline"
                })
            ]
        });
        if ( $( "#waveform_"+tid ).data( "load" ).includes( domain ) ) {
            fetch( $( "#waveform_"+tid ).data( "load" ).replace(/\.[^/.]+$/, "")+".json" )
            .then(response => { if (!response.ok) { throw new Error("HTTP error " + response.status); }
                return response.json();
            }).then(peaks => { wavesurfer.load($( "#waveform_"+tid ).data( "load" ), peaks.data); 
            }).catch((e) => {});            
        } else {
            wavesurfer.load( $( "#waveform_"+tid ).data( "load" ) );
        }
        wavesurfer.on('ready', function() {
            // default region
            if ( $( "#waveform_"+tid ).data( "load" ).includes( '#t=') ) {
                var default_region = $( "#waveform_"+tid ).data( "load" ).split( '#t=' )[1].split(',');
                wavesurfer.addRegion( {"drag":false,"resize":false,"start":default_region[0],"end":default_region[1]} );
                wavesurfer.drawBuffer();
            }
        });
    }
}

// retrieve a RPPA object
async function getRPPAobject( id ) {
	var node_seen = [], ids = [], total = [];
	ids.push( id );
	node_seen[ id ] = 1;
	while( ids.length > 0 ) {
		var q = namespaces+"SELECT * WHERE { <"+ids[ 0 ]+"> ?p ?o . BIND (<"+ids[ 0 ]+"> AS ?s) BIND (<default> AS ?g)}";
		var graph = await getJSONLD( q, "raw" );
		for (var j = 0; j < graph.length; j++ ) {
			var v = graph[ j ];
			total.push( v );
			// nodes will be counted only once and must be part of RPPA, and single- or multi-volume object
			if ( !node_seen[ v.o.value ] && v.o.type == 'uri' && 
				( v.o.value.startsWith( id ) || v.o.value.startsWith( domain + "/id/" ) )
			) {
				ids.push( v.o.value );
				node_seen[ v.o.value ] = 1;
			}
		}
		ids.shift();
	}
	return( total );
}

// retrieve JSON-LD version of BLZG query
function getJSONLD( BGquery, mode ) {
    return new Promise(function(resolve, reject) {
        $.ajax({
            type: "POST",
            url: BG_RPPA+"sparql",
            data: { query: BGquery },
            headers: {
                Accept : "application/json"
            }
        }).done( async function( result ) {
            var quads = '', results = [];
            if ( result.results ) {
            // SELECT
                $.each( result.results.bindings, function( i,v ) {
//                    if ( v.g.value.startsWith( context["@context"]["rppa"] ) ) {
//                        if ( v.g.value.substr(GetSubstringIndex(v.g.value,"/",4)+1) != user.split(":")[1] ) { return; }
//                        else { user_ids.push( v.o.value ); }
//                    }
                    results.push( v );
                    quads += "<"+v.s.value+"> <"+v.p.value+"> "+((v.o.type == 'uri')?"<"+v.o.value+">":((v.o.type == 'bnode')?"_:"+v.o.value:'"'+v.o.value.replace(/"/g,'\\"')+'"') )+" .\n";
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

// update BLZG store
function putTRIPLES( BGupdate ) {
    if ( user.startsWith( "rppa:" ) ) {
        return new Promise(function(resolve, reject) {
            $.ajax({
                type: "POST",
                url: BG_RPPA+"update",
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
$( document ).on('click', '.changeMode:not([aria-disabled="true"])', function() {
    var modeC = {}
    modeC[ 'edit' ] = '#2a9d8f';
    modeC[ 'read' ] = 'var(--bs-orange)';
    $( "#mode" ).remove();
    $( "head" ).append( `<style type="text/css" id="mode">a,a:hover,a:visited,a:active{color: `+modeC[$(this).data("mode")]+`;}.nav-pills .nav-link.active,.bg-rppa,.controls .btn{background-color:`+modeC[$(this).data("mode")]+` !important;}</style>` );
    switch ( $(this).data("mode") ) {
        case "read":
            if ( mode == "edit" ) {
                mode = "read";
                drawGlobalText( $( this ).data( "tid" ), $( this ).data( "wid" ) );
                processGlobalText( $( this ).data( "tid" ), $( this ).data( "wid" ) );
            }
        break;
        case "edit":
            if ( mode == "read" ) {
                mode = "edit";
                drawGlobalText( $( this ).data( "tid" ), $( this ).data( "wid" ) );
                processGlobalText( $( this ).data( "tid" ), $( this ).data( "wid" ) );
            }
        break;
    }
});

// update UI on expression selection
$(document).on('click','button[data-bs-toggle="pill"]',function(){
    if ( $( "[id^=waveform_]" ).length ) {
        wavesurfer.drawBuffer();
    }
    $(".popover").hide();
    if ( mode == "edit" ) {
        processGlobalText( "", $( this ).closest( "[data-wid]" ).data( "wid" ) );
    } else {
        initializeContexts( contexts[ $( this ).data( "expr" ) ], mode );
    }
    clearInterval( t );
    t = setInterval(updateDOM(),500);
});

var dismiss_region = undefined;
async function processGlobalText( tid, wid ) {
    var work = domain+"/id/"+wid+"/work";
    if ( mode == "read" ) {
        // load all (i.e. <default>) contexts
        var q = namespaces+`SELECT *
        WHERE {
            ?s dcterm:relation """`+work+`""" .\n
            ?s ?p ?o .
            BIND(<default> AS ?g)
        }`;
        var r = await getJSONLD( q );
        if ( r.hasOwnProperty( "graph" ) ) {
            contexts = _.groupBy( r.graph, 'dcterm:source' );
        } else {
            var mine = {}
            mine[ "@context" ] = r[ "@context" ];
            mine[ "graph" ] = [];
            mine[ "graph" ].push( r );
            contexts = _.groupBy( mine.graph, 'dcterm:source' );
        }
        // tool settings
        if ( Object.keys(annotorious).length > 0 ) {
            annotorious[ Object.keys(annotorious) ].readOnly = true; // image
        }
        if ( $( ".waveform" ).length ) {
            wavesurfer.disableDragSelection(); // sound
            wavesurfer.setProgressColor( '#BD7E46' );
        }
    } else if ( mode == "edit" ) {
        // load user contributions
        var q = namespaces+`SELECT *
        WHERE {
            GRAPH `+user+` {
                ?s dcterm:relation """`+work+`""" .\n
                ?s ?p ?o .
                BIND(`+user+` AS ?g)
            }
        }`;
        var r = await getJSONLD( q );
        if ( r.hasOwnProperty( "graph" ) ) {
            contexts = _.groupBy( r.graph, 'dcterm:source' );
        } else {
            var mine = {}
            mine[ "@context" ] = r[ "@context" ];
            mine[ "graph" ] = [];
            mine[ "graph" ].push( r );
            contexts = _.groupBy( mine.graph, 'dcterm:source' );
        }
        // tool settings
        if ( Object.keys(annotorious).length > 0 ) {
            annotorious[ Object.keys(annotorious) ].readOnly = false; // image
        }
        if ( $( ".waveform" ).length ) {
            wavesurfer.disableDragSelection();
            wavesurfer.enableDragSelection({
                color: 'rgb(74, 186, 159,.2)',
                resize: false,
                drag: false
            }); // sound
            wavesurfer.setProgressColor( '#358078' );
            wavesurfer.un('region-update-end');
            wavesurfer.on('region-update-end', function( region ) {
                wavesurfer.disableDragSelection();
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
                    container: '.text',
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
    initializeContexts( contexts[ $( ".text button.active" ).data( "expr" ) ], mode );
}

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
            return o["type"].includes( "rppa:Context" ) && o["crm:P2_has_type"][0].id == "lct:txt";
        });
        processTxtContexts( tc );
    }
}

$( document ).on('click', 'a.show_globaltext', async function (e) {
    display_globaltext( e.currentTarget.dataset.tid,e.currentTarget.dataset.wid );
});

$( document ).ready(function() {

    $( ".sso-sign-in" ).remove(); // TODO: remove when ready
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

});
