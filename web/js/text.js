// RPPA
// Text tools

// annotation/relations module
// get id from rangy.js selection
function getHTML(who, deep) {
    if (!who || !who.tagName) return '';
    var txt, ax, el = document.createElement("div");
    el.appendChild(who.cloneNode(false));
    txt = el.innerHTML;
    if(deep){
        ax = txt.indexOf('>')+1;
        txt = txt.substring(0, ax)+who.innerHTML+ txt.substring(ax);
    }
    el = null;
    return txt;
}
// filter ids to exclude all but w/pc ids which end in - followed by digits and . only
function w_and_pc_only( id ) {
    if ( id.includes( "index.xml-" )
        || id.endsWith( "_return" )
        || !id.match( /\-[\d\.]+$/gs )
        || ($( jq( id )+":visible" ).length == 0)
    ) return;
    return id;
}
// offer user save/cancel options
var dismiss_select = undefined;
$( document ).on( "mouseup", ".tab-pane.active .text", function(e) {
    if ( mode == "edit" && $(e.target).closest("a").length == 0 ) {
        var sel = rangy.getSelection();
        var target, ids = [];
        if ( dismiss_select ) dismiss_select.popover( 'dispose' );
        if ( sel.text() ) {
            target = sel.text();              
            if ( sel.toHtml().includes(" id=") ) {
                ids = Array.from( sel.toHtml().matchAll( /span.*?id="(.*?)"/gsi ), m => m[1]);
            } else {
                ids = [ getHTML( sel.anchorNode.parentNode, true).match( /span.*?id="(.*?)"/si )[1] ];
            }
            ids = ids.filter( w_and_pc_only );
            var id = $( jq(ids[ids.length-1]) ).closest( 'div[data-expr]' ).attr( 'id' );
            var work = $( jq(ids[ids.length-1]) ).closest( 'div[data-expr]' ).data( 'id' );
            var expr = $( jq(ids[ids.length-1]) ).closest( 'div[data-expr]' ).data( 'expr' );
            $( jq(ids[ids.length-1]) ).popover({
                sanitize: false,
                content: `<a role="button" class="save" data-ids="`+ids+`" data-id="`+id+`" data-work="`+work+`" data-expr="`+expr+`" data-sel="`+target+`" style="font-size:18px;margin-left:10px;"><i class="fas fa-save"></i></a>
                    <a role="button" class="cancel" style="font-size:20px;margin:0 10px;"><i class="fas fa-close"></i></a>`,
                html: true,
                placement: 'auto',
                container: 'body',
                template: `<div class="popover popover-dismiss-select" role="popover" tabindex="0" data-trigger="focus">
                    <div class="popover-arrow"></div>
                    <div class="popover-body"></div>
                </div>`
            });
            dismiss_select = $( jq(ids[ids.length-1]) ).popover('show');
        }
        $( ".pagebreak,.numbering" ).css( "visibility","revert" );
    }
}).on( "mousedown", ".tab-pane.active .text", function(e) {
    if ( mode == "edit" && $(e.target).closest("a").length == 0 ) {
        $( ".pagebreak,.numbering" ).css( "visibility","hidden" );
    }
});
// dismiss target
$( document ).on( "click", ".popover-dismiss-select .cancel", async function(e) {
    $( "[aria-describedby='"+$(this).closest('div.popover').attr( 'id')+"']" ).popover('dispose');
});
// save target
$( document ).on( "click", ".popover-dismiss-select .save", async function(e) {
    $( "[aria-describedby='"+$(this).closest('div.popover').attr( 'id')+"']" ).popover('dispose');
    createW3Canno( $( this ).data("sel"), $( this ).data("ids").split( "," ), $( this ).data("id"), $( this ).data("work"), $( this ).data("expr") );
});
// open facsimile display and/or jump to new page
$(document ).on('click', ".text .pagebreak a,.image_link a", async function(e) {
    e.preventDefault();
    var id = $(e.currentTarget).closest( ".tab-content" ).find( "[id*='/imageset/']").attr( "id" );
    var page = parseInt( $(e.currentTarget).data("id") );
    $(e.currentTarget).closest( ".modal-body" ).find( "button:contains(Facsimile)" ).trigger('click');
    viewer[ id ].goToPage( page );
});

// create, store, and process annotation
async function createW3Canno( target, ids, obj_id, work, expr ) {
    var date = new Date();
    var id = domain+`/id/`+uuidv4()+`/buildingblock`;
    ids.forEach(function(part, index) {
        ids[index] = "#"+part.replace( /\\./g,"\\\\." );
    });
    var W3Canno = `{
        "@context": "http://www.w3.org/ns/anno.jsonld",
        "id": "`+id+`",
        "type": "Annotation",
        "creator": "`+domain+`",
        "created": "`+date.toISOString()+`",
        "dcterm:identifier": "`+obj_id+`",
        "dcterm:source": "`+expr+`",
        "motivation": "highlighting",
        "target": [
          { "source": "`+obj_id+`",
            "selector": [
            {
                "type": "CssSelector",
                "value": "`+ids.join( "," )+`"
            },
            {
                "type": "TextQuoteSelector",
                "exact": "`+target.replace(/"/g,'&quot;').replace(/(\r\n|\n|\r|\t|\f)/gm,"\\\\n")+`"
            }
            ]
          }
        ]
    }`;
    // add annotation
    var update = namespaces+"insert data {\n";
    update += `GRAPH `+user+` { <`+id+`> a rppa:BuildingBlock, cnt:ContentAsText ;\n`;
    update += `dcterm:identifier """`+obj_id+`""" ;\n`;
    update += `dcterm:source """`+work+`""" ;\n`;
    update += `cnt:characterEncoding "UTF-8" ;\n`;
    update += `cnt:bytes """`+JSON.stringify(JSON.parse( W3Canno )).replace(/\\"/g,"&quot;")+`""" ;\n`;
    update += `dcterm:created """`+date.toISOString()+`""" ;\n`;
    update += `. }\n}`;
    await putTRIPLES( update );
    processW3Canno( JSON.parse( W3Canno ) );
}
// create annotaion display and anchor
function processW3Canno( annotation ) {
    // format annotation
    var ids = annotation.target[0].selector[0].value.split( "," ); // => [ "#K060422_000-02650","#K060422_000-02660.1","#K060422_000-02670","#K060422_000-02680" ]
    // highlight annotation
    var sel = rangy.getSelection();
    var range = rangy.createRange();
    high = rangy.createHighlighter();
    high.addClassApplier(rangy.createClassApplier("highlight-bb", {
        ignoreWhiteSpace: true
    }));
    range.setStart( $( jqu(ids[0]) )[0], 0 );
    range.setEndAfter( $( jqu(ids[ids.length-1]) )[0], 0 );
    sel.setSingleRange(range);
    high.highlightSelection("highlight-bb");
    sel.collapseToEnd();
    sel.detach();
    note = `"`+annotation.target[0].selector[1].exact.replace(/&quot;/g,'&').replace(/(\\r\\n|\\n|\\r|\\t|\\f)/gm," / ").replace(/(\r\n|\n|\r|\t|\f)/gm," / ")+`"` ;
    $( ".workbench" ).append( note );
}

// delete annotation
$( document ).on( "click", ".popover-dismiss-anno .trash,.popover-dismiss .trash", async function(e) {
    $( ".popover-dismiss-anno,.popover-dismiss" ).popover( 'dispose' );
    if ( $( this ).parent().prev().find( "textarea" ).data( "anno_id" ) ) {
        var id = $( this ).parent().prev().find( "textarea" ).data( "anno_id" );
        var ids = $( this ).parent().prev().find( "textarea" ).data( "ids" ).split( "," );
        var update = namespaces+`\nWITH `+user+` DELETE { <`+id+`> ?p ?o . } WHERE { <`+id+`> ?p ?o . } ;\nWITH `+user+` DELETE { ?s ?p <`+id+`> . } WHERE { ?s ?p <`+id+`> . } `;
        await putTRIPLES( update );
        // unhighlight annotation and detach popovers
        $.each( ids, function( i,v ) {
            $( jq(v) ).popover( 'dispose' );
            $( jq(v) ).removeClass( "highlight-"+$( jq(v) ).closest( ".window" ).data( "id" ).substr(GetSubstringIndex($( jq(v) ).closest( ".window" ).data( "id" ),"/",4)+1) );
            $( jq(v) ).next().removeClass( "highlight-"+$( jq(v) ).closest( ".window" ).data( "id" ).substr(GetSubstringIndex($( jq(v) ).closest( ".window" ).data( "id" ),"/",4)+1) );
        });
    }
});

// enforce single annotation toggle
$('#windows').on('click', function (e) {
    if ( $( ".popover-dismiss" ).length > 1) {
        $( $( ".popover-dismiss" )[0] ).popover('hide');
    }
});
// retrieve and display annotations
async function processBuildingBlocks( text ) {
    var q = namespaces+`SELECT * WHERE { 
        {
            ?s rdf:type rppa:BuildingBlock . 
            ?s dcterm:source '''`+text+`''' . 
            ?s cnt:bytes ?o . 
            BIND ( rdf:type AS ?p ) BIND ( <default> as ?g ) 
        }
        UNION
        {
            GRAPH `+user+` {
                ?s rdf:type rppa:BuildingBlock . 
                ?s dcterm:source '''`+text+`''' . 
                ?s cnt:bytes ?o . 
                BIND ( rdf:type AS ?p ) BIND ( `+user+` as ?g )
            }
        }
    }`;
    var bb = await getJSONLD( q, "raw" ); // DONE
    for (var j = 0; j < bb.length; j++ ) {
        var v = bb[ j ];
        processW3Canno( JSON.parse( v.o.value ) );
    }
}



// Function for a specific context-type, here highlighting @corresp-onding
// entities  

// highlight equivalence (where marked up)
$(document ).on('mouseenter', '[data-corresp]', function ( e ) {
    var d = this;
    $( d ).parent().addClass("idsSelected");
    var corresp = [];
    corresp = $( e.currentTarget ).data( "corresp" ).split( " " ) || [];
    $.each( corresp, function( i,v ) {
    	$( v ).addClass("idsSelected");
    });
}).on('mouseleave', '[data-corresp]', function ( e ) {
    var d = this;
    $( d ).parent().removeClass("idsSelected");
    var corresp = [];
    corresp = $( e.currentTarget ).data( "corresp" ).split( " " ) || [];
    $.each( corresp, function( i,v ) {
	    $( v ).removeClass("idsSelected");
    });
});
$(document ).on('click', '[data-corresp]', function ( e ) {
    document.getElementById( $( e.currentTarget ).parent().attr( "id" ) ).scrollIntoView( {behavior: "smooth", block: "start"} );
    var corresp = $( e.currentTarget ).data( "corresp" ).split( " " )[0] || '';
    document.getElementById( $( corresp.substring(1) ) ).scrollIntoView( {behavior: "smooth", block: "start"} );
});
