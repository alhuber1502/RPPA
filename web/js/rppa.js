// RPPA
var workbench = {};
var domain = "https://www.romanticperiodpoetry.org";

var SOLR_RPPA;
var BG_RPPA;
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

// global text modal
var t, myModalGT, zInd = 1054;
var done_tooltipTriggerList = [];
var done_popoverTriggerList = [];

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
            (CONTAINS (STR(?p), ?searchString)) ||
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
        <div style="z-index:`+zInd+`" class="modal fade" id="`+wid+`" tabindex="-1" data-bs-backdrop="static" aria-labelledby="ModalLabel" aria-hidden="true">
            <div class="modal-dialog modal-xl modal-fullscreen modal-dialog-centered modal-dialog-scrollable">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title" id="ModalLabel">`+truncateString(work.tit,50)+` / `+author+`</h5>
                        <div class="tools">
                            <a role="button" class="changeMode" data-mode="read"><span class="read"><i class="fas fa-book-open"></i> Read</span></a>
                            <a role="button" class="changeMode" data-mode="edit"><span class="edit"><i class="fas fa-edit"></i> Edit</span></a>
                            <a role="button" class="changeMode" data-mode="publ"><span class="publish"><i class="fas fa-check-circle"></i> Publish</span></a>
                        </div>
                        <button type="button" class="btn-close changeMode" data-mode="read" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <div class="container-fluid">
                            <div class="row">
                                <div class="col-sm-4 text" id="`+tid+`">
                                </div>
                                <div class="col-sm-4 context">
                                </div>
                                <div class="col-sm-4 work">
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

    // populate global text
    // load work's realization(s)
    var tab_content = "", tab_nav = "", excerpt = null;
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
            nav_name = 'Reading';
        } else {
            console.log( 'Error: unknown content type' );
        }
        if ( nav_name != '' ) {
            tab_nav += `<li class="nav-item" role="presentation">
                <button class="nav-link`+((i==0)?' active':'')+`" id="pills-`+i+`-tab" data-bs-toggle="pill" data-bs-target="#pills-`+i+`" type="button" role="tab" aria-controls="pills-`+i+`" aria-selected="true">`+nav_name+`</button>
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
                try { cnt_loc = workbench[ wid ][ workbench[ wid ][ workbench[ wid ][ domain+"/id/"+wid+"/work" ][ "lrmoo:R3_is_realised_in" ][i].id ][ "lrmoo:R4i_is_embodied_in" ].id ][ "crm:P106_is_composed_of" ] }
                catch { }
            }
            if ( tid != '' && cnt_loc != null ) {
                tab_content += `<div class="tab-pane fade show`+((i==0)?' active':'')+`" id="pills-`+i+`" role="tabpanel" aria-labelledby="pills-`+i+`-tab" lang="`+cnt_lang+`">`+
                    function () { var tmp = null; $.ajax({ 'async': false, 'type': "POST", 'dataType': 'html', 'url': workbench[ wid ][ cnt_loc[0].id ][ "crm:P106_is_composed_of" ][0], 
                        'success': function (data) { tmp = data; } }); return tmp; }()
                +`</div>`;
            }
        }
        // ... other content types ...
    }       
    $( "#"+wid+" .text" ).append( `<ul class="nav nav-pills mb-3" id="pills-tab" role="tablist">`+tab_nav+`</ul><div class="tab-content" id="pills-tabContent">`+tab_content+`</div>` );
    t = setInterval(updateDOM,500);

    var myModalGTEl = document.getElementById(wid);
    myModalGT = new bootstrap.Modal(myModalGTEl, {
        backdrop: 'static',
        keyboard: false
    });
    myModalGT.show();
    // on closing a modal
    myModalGTEl.addEventListener('hide.bs.modal', function (event) {
        $(".popover").hide();
        $(this).remove();
        if ( $('.modal.show').length ) { // if open modal remains: close updating DOM
            clearInterval( t );
            t = setInterval(updateDOM,500);    
        } else {                         // if last open modal: reset
            done_tooltipTriggerList = [];
            done_popoverTriggerList = [];
            clearInterval( t );
            zInd = 1054;
            location.href = "#id/"+work.aut.split(';')[0]; // reset location to work's author
        }
    });
    return false;

}

function updateDOM() {
    var genericCloseBtnHtml = '<button onclick="$(this).closest(\'div.popover\').popover(\'hide\');" type="button" class="btn-close" aria-hidden="true" style="float:right;"></button>';
    // initialize tooltips and popovers
    var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList2 = _.difference( tooltipTriggerList, done_tooltipTriggerList );
    done_tooltipTriggerList = tooltipTriggerList;
    var tooltipList = tooltipTriggerList2.map(function (tooltipTriggerEl) {
        return new bootstrap.Popover(tooltipTriggerEl, {
            html: true,
            container: 'body',
            placement: 'auto',
            sanitize: false,
            trigger: 'hover click',
            title: function() {
                switch ( $(this).attr("data-href").split('/')[2] ) {
                    case "people":
                        return "Person information"+genericCloseBtnHtml;
                        break;
                    case "headwords":
                        return "Headword information"+genericCloseBtnHtml;
                        break;
                    case "addresses":
                        return "Address information"+genericCloseBtnHtml;
                        break;
                    case "bibliography":
                        return "Work information"+genericCloseBtnHtml;
                        break;
                    case "glossary":
                        return "Glossary information"+genericCloseBtnHtml;
                        break;
                    case "commentaries":
                        return "Commentary information"+genericCloseBtnHtml;
                        break;
                }
            },
            content: function() {
                var div = $("<div/>");
                jQuery.ajaxSetup({
                    async: false
                });
                var toGet = $(this).attr("data-href").trim().split( " " );
                $.each( toGet, function(i,v) {
                    $.get( v, '', function(data) {
                        div.append(data);
                        if ( i != toGet.length -1 ) {
                            div.append("<br>");
                        }
                    });
                });
                jQuery.ajaxSetup({
                    async: true
                }); //if order matters
                return div;
            }            
        });
    });
    var popoverTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="popover"]'))
    popoverTriggerList2 = _.difference( popoverTriggerList, done_popoverTriggerList );
    done_popoverTriggerList = popoverTriggerList;
    var popoverList = popoverTriggerList2.map(function (popoverTriggerEl) {
        return new bootstrap.Popover(popoverTriggerEl, {
            html: true,
            container: 'body',
            placement: 'auto',
            sanitize: false,
            trigger: 'click',
            title: function() {
                return "Editorial note"+genericCloseBtnHtml
                //$(this).attr("data-type")[0].toUpperCase() +
                //$(this).attr("data-type").slice(1)+
            },
            content: function() {
                return $(this).next().clone().removeClass("hidden");
            }
        });
    });
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
                    if ( v.g.value.startsWith( context["@context"]["rppa"] ) ) {
                        if ( v.g.value.substr(GetSubstringIndex(v.g.value,"/",4)+1) != user.split(":")[1] ) { return; }
                        else { user_ids.push( v.o.value ); }
                    }
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

$( document ).on('click', '.changeMode', function() {
    var modeC = {}
    modeC[ 'edit' ] = '#2a9d8f';
    modeC[ 'read' ] = 'var(--bs-orange)';
    modeC[ 'publ' ] = '#264653';
    $( "#mode" ).remove();
    $( "head" ).append( `<style type="text/css" id="mode">a,a:hover,a:visited,a:active{color: `+modeC[$(this).data("mode")]+`;}.nav-pills .nav-link.active{background-color:`+modeC[$(this).data("mode")]+` !important;}</style>` );
});

$( document ).on('click', 'a.show_globaltext', async function (e) {
    display_globaltext( e.currentTarget.dataset.tid,e.currentTarget.dataset.wid );
});

$( document ).ready(function() {



});
