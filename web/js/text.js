// RPPA
// Text tools

// Editing view: annotation/relations module: get and return id from rangy.js
// selection 
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
// Editing view: filter IDs to exclude all but w/pc ids which end in - followed
// by digits and . only 
function w_and_pc_only( id ) {
    if ( id.includes( "index.xml-" )
        || id.endsWith( "_return" )
        || !id.match( /\-[\d\.]+$/gs )
        || ($( jq( id )+":visible" ).length == 0)
    ) return;
    return id;
}
// Editing view: text selection
// - determine range of selected text (IDs)
// - create a popover offering user save/cancel options
// - hide/show page numbers during text selection mode
var dismiss_select = undefined, alignment = {};
$( document ).on( "mouseup", ".tab-pane.active .text *:not(.pagebreak),.tab-pane.active .text", function(e) {
    e.stopPropagation();
    if ( mode == "edit" && $(e.target).closest("a").length == 0 ) {
        var sel = rangy.getSelection();
        var target, ids = [], id, work, expr;
        if ( dismiss_select ) dismiss_select.popover( 'dispose' );
        if ( sel.text() != "" ) {   // text segment selection
            target = sel.text();
            if ( sel.toHtml().includes(" id=") ) {
                ids = Array.from( sel.toHtml().matchAll( /span.*?id="(.*?)"/gsi ), m => m[1]);
            } else {
                ids = [ getHTML( sel.anchorNode.parentNode, true).match( /span.*?id="(.*?)"/si )[1] ];
            }
            ids = ids.filter( w_and_pc_only );
            id = $( jq(ids[ids.length-1]) ).closest( 'div[data-expr]' ).attr( 'id' );
            work = $( jq(ids[ids.length-1]) ).closest( 'div[data-expr]' ).data( 'id' );
            expr = $( jq(ids[ids.length-1]) ).closest( 'div[data-expr]' ).data( 'expr' );
            digo = $( jq(ids[ids.length-1]) ).closest( 'div[data-digo]' ).data( 'digo' );
            tid = $( jq(ids[ids.length-1]) ).closest( '.text' ).attr( 'id' );
        } else {                    // structure selection
            target = '';
            ids.push( $( jq( $( e.currentTarget ).attr( "id" ) ) ).closest( "[id]" ).attr( 'id' ) );
            id = $( jq(ids[ids.length-1]) ).closest( 'div[data-expr]' ).attr( 'id' );
            work = $( jq(ids[ids.length-1]) ).closest( 'div[data-expr]' ).data( 'id' );
            expr = $( jq(ids[ids.length-1]) ).closest( 'div[data-expr]' ).data( 'expr' );
            digo = $( jq(ids[ids.length-1]) ).closest( 'div[data-digo]' ).data( 'digo' );
            tid = $( jq(ids[ids.length-1]) ).closest( '.text' ).attr( 'id' );
        }
        // create popover close to selection end
        $( jq(ids[ids.length-1]) ).popover({
            sanitize: false,
            content: `<a role="button" class="save" data-ids="`+ids+`" data-id="`+id+`" data-tid="`+tid+`" data-digo="`+digo+`" data-work="`+work+`" data-expr="`+expr+`" data-sel="`+target+`" style="font-size:18px;margin-left:10px;"><i class="fas fa-save"></i></a>
                <a role="button" class="cancel" style="font-size:20px;margin:0 10px;"><i class="fas fa-close"></i></a>`,
            html: true,
            placement: 'auto',
            container: 'body',
            template: `<div class="popover popover-dismiss-select txt" role="popover" tabindex="0" data-trigger="focus" style="opacity:.85;">
                <div class="popover-arrow"></div>
                <div class="popover-body"></div>
            </div>`
        });
        dismiss_select = $( jq(ids[ids.length-1]) ).popover('show');
        $( ".pagebreak,.numbering" ).css( "visibility","revert" );
    }
}).on( "mousedown", ".tab-pane.active .text *:not(.pagebreak),.tab-pane.active .text", function(e) {
    e.stopPropagation();
    if ( mode == "edit" && $(e.target).closest("a").length == 0 ) {
        $( ".pagebreak,.numbering" ).css( "visibility","hidden" );
    }
});

// Editing view: highlight selectable text sections on hover
$(document ).on('mouseenter', '.tab-pane.active .text *:not(.pagebreak),.tab-pane.active .text', function ( e ) {
    if ( mode == "edit" ) {
        var id = $( e.currentTarget ).attr( "id" );
        $( "[id='"+id+"']" ).addClass("highlight-bb-m");
    }
}).on('mouseleave', '.tab-pane.active .text *:not(.pagebreak),.tab-pane.active .text', function ( e ) {
    if ( mode == "edit" ) {
        var id = $( e.currentTarget ).attr( "id" );
        $( "[id='"+id+"']" ).removeClass("highlight-bb-m");
    }
});

// Editing popover: dismiss target (remove popover)
$( document ).on( "click", ".popover-dismiss-select.txt .cancel", async function(e) {
    $( "[aria-describedby='"+$(this).closest('div.popover').attr( 'id')+"']" ).popover('dispose');
});
// Editing popover: save target (passed to createW3Canno)
$( document ).on( "click", ".popover-dismiss-select.txt .save", async function(e) {
    $( "[aria-describedby='"+$(this).closest('div.popover').attr( 'id')+"']" ).popover('dispose');
    createW3Canno( $( this ).data("sel"), $( this ).data("ids").split( "," ), $( this ).data("id"), $( this ).data("digo"), $( this ).data("work"), $( this ).data("expr"), $(this) );
});

// UI: on pagebreak click, open facsimile display and jump to selected page
$(document ).on('click', ".text .pagebreak a,.image_link a", async function(e) {
    e.preventDefault();
    var iid = $( this ).data( "imageset" );
    var page = parseInt( $(e.currentTarget).data("id") );
//    $(e.currentTarget).closest( ".globaltext" ).find( "button:contains(Facsimile)" ).trigger('click');
    $( "#"+$( $(e.currentTarget).closest( ".tab-content" ).find( "div[data-iid='"+iid+"']" )[0] ).parent( "[id]" ).attr("id")+'-tab' )[0].click();
    viewer[ "viewer_"+(mode == 'edit'?'editing_'+iid:(mode == 'view')?'viewing_'+iid:iid) ].goToPage( page );
});

// Editing view: create, store, and process annotation
/*  This function 
    - creates a building-block (RDF) and stores it in the graph
    - creates a minimal live version of the building-block to list/highlight (processW3Canno)
*/
async function createW3Canno( target, ids, obj_id, digo, work, expr, _this ) {
    var date = new Date();
    var id = domain+`/id/`+uuidv4()+`/buildingblock`;
    ids.forEach(function(part, index) {
        ids[index] = "#"+part.replace( /\\./g,"\\\\." );
    });
    // add annotation
    var liveanno = {};
    liveanno.id = id;
    liveanno["oa:hasTarget"] = [];
    liveanno["oa:hasTarget"][0] = {};
    liveanno["oa:hasTarget"][0]["oa:hasSelector"] = {};
    liveanno["oa:hasTarget"][0]["oa:hasSelector"]["rdf:value"] = ids.join( "," );
    /*
    if ( target != '' ) {
        liveanno["oa:hasTarget"][0]["oa:hasSelector"][1] = {}
        liveanno["oa:hasTarget"][0]["oa:hasSelector"][1]["oa:exact"] = target.replace(/"/g,'&quot;').replace(/(\r\n|\n|\r|\t|\f)/gm,"\\\\n");
    }
    */
    liveanno['dcterms:isPartOf'] = {};
    liveanno['dcterms:isPartOf'].id = expr;
    liveanno['dcterms:isPartOf'].wid = work;
    liveanno['dcterms:isPartOf'].iid = obj_id;
    liveanno['dcterms:isPartOf'].oid = digo;
    liveanno['dcterms:isPartOf'].tid = _this.data( "tid" ); 
    liveanno['skos:prefLabel'] = target;
    if ( $( "[id='"+_this.data("id")+"']" ).closest( ".globalcontext" ).length ) {
        bbs_context.append( processW3Canno( liveanno ) );
    } else {
        bbs_text.append( processW3Canno( liveanno ) );
    }
}

// Editing view: create annotation display/list text 
function processW3Canno( annotation ) {
    // format annotation
    var ids = annotation["oa:hasTarget"][0]["oa:hasSelector"]["rdf:value"].split( "," ); // => [ "#K060422_000-02650","#K060422_000-02660.1","#K060422_000-02670","#K060422_000-02680" ]
    // highlight annotation
    var sel = rangy.getSelection();
    var range = rangy.createRange();
    high = rangy.createHighlighter();
    high.addClassApplier(rangy.createClassApplier("highlight-bb"));
    range.setStart( $( jqu(ids[0]) )[0], 0 );
    range.setEndAfter( $( jqu(ids[ids.length-1]) )[0], 0 );
    sel.setSingleRange(range);
//    high.highlightSelection("highlight-bb");
    sel.collapseToEnd();
    sel.detach();
    bb_id = annotation.id;
    $( jqu(ids[0]) ).addClass( "highlight-bb-start" )
    $( jqu(ids[ids.length-1]) ).addClass( "highlight-bb-end" )
    /*
    if ( annotation["oa:hasTarget"][0]["oa:hasSelector"][1] ) {
        return `<li class="bb-item txt" data-ids="`+annotation["oa:hasTarget"][0]["oa:hasSelector"][0]["rdf:value"].split( "," )+`" data-expr="`+annotation['dcterms:isPartOf'].id+`">
            <input type="checkbox" id="`+bb_id+`" name="`+bb_id+`">
            <i class="far fa-trash-alt trash" style="cursor:pointer;"></i>
            <label for="`+bb_id+`">`+annotation["oa:hasTarget"][0]["oa:hasSelector"][1]["oa:exact"].replace(/&quot;/g,'"').replace(/(\\r\\n|\\n|\\r|\\t|\\f)/gm," / ")+`</label></li>` ;
    } else {
    */
        var sel_text = '';
        if ( $( jqu(annotation["oa:hasTarget"][0]["oa:hasSelector"]["rdf:value"]) ).find( ".w,.pc" ).length > 0 ) {
            if ( $( jqu(annotation["oa:hasTarget"][0]["oa:hasSelector"]["rdf:value"]) ).find( ".w,.pc" ).length > 2 ) {
              sel_text = $( $( jqu(annotation["oa:hasTarget"][0]["oa:hasSelector"]["rdf:value"]) ).find( ".w,.pc" ) )[0].innerText+" ... "+
                    $( $( jqu(annotation["oa:hasTarget"][0]["oa:hasSelector"]["rdf:value"]) ).find( ".w,.pc" ) )[$( jqu(annotation["oa:hasTarget"][0]["oa:hasSelector"]["rdf:value"]) ).find( ".w,.pc" ).length-1].innerText;
            } else if ( $( jqu(annotation["oa:hasTarget"][0]["oa:hasSelector"]["rdf:value"]) ).find( ".w,.pc" ).length > 1 ) {
                sel_text = $( $( jqu(annotation["oa:hasTarget"][0]["oa:hasSelector"]["rdf:value"]) ).find( ".w,.pc" ) )[0].innerText+" "+
                    $( $( jqu(annotation["oa:hasTarget"][0]["oa:hasSelector"]["rdf:value"]) ).find( ".w,.pc" ) )[$( jqu(annotation["oa:hasTarget"][0]["oa:hasSelector"]["rdf:value"]) ).find( ".w,.pc" ).length-1].innerText;
            } else {
                sel_text = $( $( jqu(annotation["oa:hasTarget"][0]["oa:hasSelector"]["rdf:value"]) ).find( ".w,.pc" ) )[0].innerText;
            }
        } else {
            if ( ids.length > 2 ) {
                sel_text = $( ids[0] )[0].innerText + " ... " + $( ids[ids.length-1] )[0].innerText;
            } else if (ids.length > 1) {
                sel_text = $( ids[0] )[0].innerText + " " + $( ids[ids.length-1] )[0].innerText;
            } else {
                sel_text = $( ids[0] )[0].innerText;
            }
        }
        if ( $( $( jqu(annotation["oa:hasTarget"][0]["oa:hasSelector"]["rdf:value"]) ) ).hasClass( 'lg' ) ) {
            sel_text = sel_text + " [stanza]";
        } else if ( $( $( jqu(annotation["oa:hasTarget"][0]["oa:hasSelector"]["rdf:value"]) ) ).hasClass( 'l' ) ) {
            sel_text = sel_text + " [line]";
        } else if ( $( $( jqu(annotation["oa:hasTarget"][0]["oa:hasSelector"]["rdf:value"]) ) ).hasClass( 'head' ) ) {
            sel_text = sel_text + " [heading]";
        } //else if ( $( $( jqu(annotation["oa:hasTarget"][0]["oa:hasSelector"]["rdf:value"]) ) ).hasClass( 'w' ) ) {
        //} 
        else if ( $( $( jqu(annotation["oa:hasTarget"][0]["oa:hasSelector"]["rdf:value"]) ) ).hasClass( 'text' ) ) {
            sel_text = sel_text + " [whole poem]";
        } else {
            sel_text = sel_text + " [segment]";
        }
        return `<li class="bb-item txt" data-ids="`+annotation["oa:hasTarget"][0]["oa:hasSelector"]["rdf:value"].split( "," )+`" data-wid="`+annotation['dcterms:isPartOf'].wid+`" data-tid="`+annotation['dcterms:isPartOf'].tid+`" data-expr="`+annotation['dcterms:isPartOf'].id+`" data-digo="`+annotation['dcterms:isPartOf'].oid+`" data-iid="`+annotation['dcterms:isPartOf'].iid+`">
            <input type="checkbox" id="`+bb_id+`" name="`+bb_id+`">
            <i class="far fa-trash-alt trash" style="cursor:pointer;"></i>
            <label for="`+bb_id+`">`+sel_text+`</label></li>` ;        
    /*}*/
}

// Editing view: delete annotation from list and graph 
$( document ).on( "click", ".bb-item.txt .trash", async function(e) {
    var _this = $( this );
    var wid = $( this ).closest( "[data-wid]" ).data( "wid" );
    var tid = $( this ).closest( "[data-tid]" ).data( "tid" );
    var id = $( this ).prev().attr( "id" );
    var ids = $( this ).parent().data( "ids" ).split( "," );
    _this.parent().remove();
    // unhighlight annotation and detach popovers
    $( jqu(ids[0]) ).removeClass( "highlight-bb-start" )
    $( jqu(ids[ids.length-1]) ).removeClass( "highlight-bb-end" )
});

// Editing view: highlight the building block in the text on hover in the list
$(document ).on('mouseenter', '.bb-item.txt', function ( e ) {
    var id = $( e.currentTarget ).data( "ids" ).split( "," )[0] || '';
    if ( $( "button.active" ).data( "expr" ) != $( e.currentTarget ).data( "expr" ) ) {
        $( "button[data-expr='"+$( e.currentTarget ).data( "expr" )+"']" ).trigger('click');
    }
    document.getElementById( id.substring(1) ).scrollIntoView( {behavior: "smooth", block: "start"} );
    //$( $( e.currentTarget ).data( "ids" ) ).addClass("pulse-bb");
}).on('mouseleave', '.bb-item.txt', function ( e ) {
    //$( $( e.currentTarget ).data( "ids" ) ).removeClass("pulse-bb");
});

// Reading view: highlight target of the selected context on hover
/*
$(document).on('mouseenter', '.context', function () {
    $( $(this) ).addClass("active");
    // format annotation
    var ids = $( this ).data( "ids" ).split( "," ); // => [ "#K060422_000-02650","#K060422_000-02660.1","#K060422_000-02670","#K060422_000-02680" ]
    // global highlight
    $( jqu(ids[0]) ).addClass( "highlight-gbl-start" )
    $( jqu(ids[[ids.length-1]]) ).addClass( "highlight-gbl-end" )
    // highlight annotation
    // needs some sort of classification whether it's a continuous range
    // or a set of discontinuous IDs
    if ( !ids[0].startsWith( "#text" ) ) {
        var sel = rangy.getSelection();
        var range = rangy.createRange();
        high = rangy.createHighlighter();
        high.addClassApplier(rangy.createClassApplier("highlight-tc"));
        range.setStart( $( jqu(ids[0]) )[0], 0 );
        range.setEndAfter( $( jqu(ids[ids.length-1]) )[0], 0 );
        sel.setSingleRange(range);
        high.highlightSelection("highlight-tc");
        sel.collapseToEnd();
        sel.detach();
    }
}).on('mouseleave', '.context', function () {
    $( $(this) ).removeClass("active");
    var ids = $( this ).data( "ids" ).split( "," );
    $.each( ids, function( i,v ) {
        $( jqu(v) ).removeClass( "highlight-tc" ).removeClass( "highlight-gbl-start" ).removeClass( "highlight-gbl-end" );
        $( jqu(v) ).next( ".highlight-tc" ).removeClass( "highlight-tc" );
    });    
});
*/

/*
$(document ).on('mouseenter', '.tc-item.txt', function ( e ) {
    var id = $( e.currentTarget ).data( "ids" ) || '';
    if ( $( "button.active" ).data( "expr" ) != $( e.currentTarget ).data( "expr" ) ) {
        $( "button[data-expr='"+$( e.currentTarget ).data( "expr" )+"']" ).trigger('click');
    }
    document.getElementById( id ).scrollIntoView( {behavior: "smooth", block: "start"} );
    $( "[id='"+$( e.currentTarget ).data( "ids" )+"']" ).addClass("pulse-tc");
}).on('mouseleave', '.tc-item.txt', function ( e ) {
    $( "[id='"+$( e.currentTarget ).data( "ids" )+"']" ).removeClass("pulse-tc");
});
*/

// Reading view: highlight equivalence (where marked up as data-corresp)
// Function for a specific context-type, here highlighting @corresp-onding
// entities 
// (TODO: not sure where I have used this? what is it for?)
$(document ).on('mouseenter', '[data-corresp]', function ( e ) {
    var d = this;
    $( d ).parent().addClass("idsSelected");
    var corresp = [];
    corresp = $( e.currentTarget ).data( "corresp" ).split( " " ) || [];
    $.each( corresp, function( i,v ) {
    	$( v ).addClass("idsSelected").fadeIn(300);
    });
}).on('mouseleave', '[data-corresp]', function ( e ) {
    var d = this;
    $( d ).parent().removeClass("idsSelected");
    var corresp = [];
    corresp = $( e.currentTarget ).data( "corresp" ).split( " " ) || [];
    $.each( corresp, function( i,v ) {
	    $( v ).removeClass("idsSelected").fadeOut(300);
    });
});
$(document ).on('click', '[data-corresp]', function ( e ) {
    document.getElementById( $( e.currentTarget ).parent().attr( "id" ) ).scrollIntoView( {behavior: "smooth", block: "start"} );
    var corresp = $( e.currentTarget ).data( "corresp" ).split( " " )[0] || '';
    document.getElementById( $( corresp.substring(1) ) ).scrollIntoView( {behavior: "smooth", block: "start"} );
});
