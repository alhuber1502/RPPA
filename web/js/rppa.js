// RPPA
var workbench = {};

var domain = "https://www.romanticperiodpoetry.org";
var SOLR_RPPA;
var BG_RPPA;
if ( /romanticperiodpoetry\.org/.test(window.location.href) ) {
    BG_RPPA = "https://guineapig.hubers.org.uk/blzg/blazegraph/namespace/rppa/";
    SOLR_RPPA = "https://guineapig.hubers.org.uk/solr/solr/rppa/select";
} else {
    BG_RPPA = "http://192.168.1.2:9999/blazegraph/namespace/rppa/";
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
var t, myModal, zInd = 1054;
var done_tooltipTriggerList = [];
var done_popoverTriggerList = [];

// display a global text
async function display_globaltext( id ) {

    var q = `SELECT *
    WHERE {
        GRAPH ?g { ?s ?p ?o }
        FILTER (
            (CONTAINS (STR(?s), ?searchString)) ||
            (CONTAINS (STR(?p), ?searchString)) ||
            (CONTAINS (STR(?o), ?searchString))
        )
        BIND("`+id+`" AS ?searchString)
    }
    ORDER BY ?s`;
    var r = await getJSONLD( q );
    workbench[ id ] = _.keyBy( r.graph, 'id');
    // TODO: I can use /data/persons/*.json and /data/works/*.json for basic interface
    // metadata

    zInd = zInd+1;
    if ( $('.modal.show').length ) { 
//        myModal.hide(); // close any open texts if a new one is requested
        $(".popover").hide(); // hide if new text was called from a popover
    }
    var text = `<!-- Modal -->
        <div style="z-index:`+zInd+`" class="modal fade" id="`+id+`" tabindex="-1" data-bs-backdrop="static" aria-labelledby="exampleModalLabel" aria-hidden="true">
            <div class="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title text-head" id="exampleModalLabel"></h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <div class="container-fluid">
                            <div class="row">
                                <div class="col-sm-9 text-text">
                                </div>
                                <div class="col-sm-3 text-meta">
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

    var $div = $('<div>');
    $div.load( workbench[ id ][ "https://www.romanticperiodpoetry.org/id/"+id+"/transcription/1/delivery" ][ "crm:P106_is_composed_of" ][0], function(){
        $( "#"+id+" .text-text" ).append( $div );
        $( "#"+id+" .text-meta" ).append( $(this).find("#"+id+"-about" ).html() );
        $( "#"+id+" .text-head" ).append( $(this).find("#"+id+"-heading" ).html() );
        t = setInterval(updateDOM,500);
    });

    var myModalEl = document.getElementById(id);
    myModal = new bootstrap.Modal(myModalEl, {
        backdrop: 'static',
        keyboard: false
    });
    myModal.show();
    // on closing a modal
    myModalEl.addEventListener('hide.bs.modal', function (event) {
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
		var q = "SELECT * WHERE { GRAPH ?g { <"+ids[ 0 ]+"> ?p ?o . BIND (<"+ids[ 0 ]+"> AS ?s) } }";
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

$( document ).on('click', 'a.show_globaltext', async function (e) {
    e.preventDefault();
    display_globaltext( e.currentTarget.dataset.wid );
});

$( document ).ready(function() {

//    display_globaltext( 'work00385' );

});
