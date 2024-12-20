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
var dismiss_select = undefined, alignment = {};
$( document ).on( "mouseup", ".tab-pane.active .text *:not(.pagebreak),.tab-pane.active .text", function(e) {
    e.stopPropagation();
    if ( mode == "edit" && $(e.target).closest("a").length == 0 ) {
        var sel = rangy.getSelection();
        var target, ids = [], id, work, expr;
        if ( dismiss_select ) dismiss_select.popover( 'dispose' );
        if ( sel.text() != "" ) { // text segment selection
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
        } else {            // structure selection
            target = '';
            ids.push( $( jq( $( e.currentTarget ).attr( "id" ) ) ).closest( "[id]" ).attr( 'id' ) );
            id = $( jq(ids[ids.length-1]) ).closest( 'div[data-expr]' ).attr( 'id' );
            work = $( jq(ids[ids.length-1]) ).closest( 'div[data-expr]' ).data( 'id' );
            expr = $( jq(ids[ids.length-1]) ).closest( 'div[data-expr]' ).data( 'expr' );
        }
        $( jq(ids[ids.length-1]) ).popover({
            sanitize: false,
            content: `<a role="button" class="save" data-ids="`+ids+`" data-id="`+id+`" data-work="`+work+`" data-expr="`+expr+`" data-sel="`+target+`" style="font-size:18px;margin-left:10px;"><i class="fas fa-save"></i></a>
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

// dismiss target
$( document ).on( "click", ".popover-dismiss-select.txt .cancel", async function(e) {
    $( "[aria-describedby='"+$(this).closest('div.popover').attr( 'id')+"']" ).popover('dispose');
});
// save target
$( document ).on( "click", ".popover-dismiss-select.txt .save", async function(e) {
    $( "[aria-describedby='"+$(this).closest('div.popover').attr( 'id')+"']" ).popover('dispose');
    createW3Canno( $( this ).data("sel"), $( this ).data("ids").split( "," ), $( this ).data("id"), $( this ).data("work"), $( this ).data("expr") );
});
// open facsimile display and/or jump to new page
$(document ).on('click', ".text .pagebreak a,.image_link a", async function(e) {
    e.preventDefault();
    var id = $(e.currentTarget).closest( ".tab-content" ).find( "[id*='/imageset/']").attr( "id" );
    var page = parseInt( $(e.currentTarget).data("id") );
    $(e.currentTarget).closest( ".globaltext" ).find( "button:contains(Facsimile)" ).trigger('click');
    viewer[ id ].goToPage( page );
});

// create, store, and process annotation
async function createW3Canno( target, ids, obj_id, work, expr ) {
    var date = new Date();
    var id = domain+`/id/`+uuidv4()+`/buildingblock`;
    ids.forEach(function(part, index) {
        ids[index] = "#"+part.replace( /\\./g,"\\\\." );
    });
    // add annotation
    var update = namespaces+"insert data {\n";
    update += `GRAPH `+user+` \n{` 
    var quads = `<`+id+`> a rppa:BuildingBlock, oa:Annotation ;\n`;
    quads += `dcterms:relation <`+work+`> ;\n`;
    quads += `dcterms:isPartOf <`+expr+`> ;\n`;
    quads += `crm:P2_has_type lct:txt ;\n`;
    quads += `dcterms:contributor `+user+` ;\n`;
    quads += `dcterms:created "`+date.toISOString()+`" ;\n`;
    quads += `as:generator <`+domain+`> ;\n`;
    quads += `skos:prefLabel "`+target.replace(/"/g,'&quot;').replace(/(\r\n|\n|\r|\t|\f)/gm,"\\\\n")+`" ;\n`;
    quads += `oa:motivatedBy oa:highlighting ;\n` ;
    quads += `oa:hasTarget [
        dcterms:type dctypes:Text ;
        dc:format lct:txt ;
        dc:language "`+$( ".globaltext .tab-content .active" ).attr( "lang" )+`" ;
        oa:hasSelector [
            rdf:type oa:CssSelector ;
            rdf:value "`+ids.join( "," )+`" ;
        ] ;
        `;
    /*
    if ( target != '' ) {
        quads += `oa:hasSelector [
                rdf:type oa:TextQuoteSelector ;
                oa:exact "`+target.replace(/"/g,'&quot;').replace(/(\r\n|\n|\r|\t|\f)/gm,"\\\\n")+`" ;
            ] ;
            `;        
    }
    */
    quads += `oa:hasSource <`+obj_id+`> ;
    ] ;\n.` ;
    update += quads;
    update += `}\n}`;
    await putTRIPLES( update );
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
    liveanno['skos:prefLabel'] = target;
    $( ".workbench .bb" ).append( processW3Canno( liveanno ) );
}

// create annotaion display and anchor
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
    high.highlightSelection("highlight-bb");
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
            sel_text = $( $( jqu(annotation["oa:hasTarget"][0]["oa:hasSelector"]["rdf:value"]) ).find( ".w,.pc" ) )[0].innerText+" ... "+
                $( $( jqu(annotation["oa:hasTarget"][0]["oa:hasSelector"]["rdf:value"]) ).find( ".w,.pc" ) )[$( jqu(annotation["oa:hasTarget"][0]["oa:hasSelector"]["rdf:value"]) ).find( ".w,.pc" ).length-1].innerText;
        } else {
            if ( ids.length > 1 ) {
                sel_text = $( ids[0] )[0].innerText + " ... " + $( ids[ids.length-1] )[0].innerText;
            } else {
                sel_text = $( ids[0] )[0].innerText //+ " ... " + $( ids[ids.length-1] )[0].innerText;
            }
        }
        if ( $( $( jqu(annotation["oa:hasTarget"][0]["oa:hasSelector"]["rdf:value"]) ) ).hasClass( 'lg' ) ) {
            sel_text = "<em>Stanza:</em> "+sel_text;
        } else if ( $( $( jqu(annotation["oa:hasTarget"][0]["oa:hasSelector"]["rdf:value"]) ) ).hasClass( 'l' ) ) {
            sel_text = "<em>Line:</em> "+sel_text;
        } else if ( $( $( jqu(annotation["oa:hasTarget"][0]["oa:hasSelector"]["rdf:value"]) ) ).hasClass( 'head' ) ) {
            sel_text = "<em>Heading:</em> "+sel_text;
        } else if ( $( $( jqu(annotation["oa:hasTarget"][0]["oa:hasSelector"]["rdf:value"]) ) ).hasClass( 'w' ) ) {
        } else if ( $( $( jqu(annotation["oa:hasTarget"][0]["oa:hasSelector"]["rdf:value"]) ) ).hasClass( 'text' ) ) {
            sel_text = "<em>Whole poem:</em> "+sel_text;
        } else {
            sel_text = "<em>Segment:</em> "+sel_text;
        }
        return `<li class="bb-item txt" data-ids="`+annotation["oa:hasTarget"][0]["oa:hasSelector"]["rdf:value"].split( "," )+`" data-expr="`+annotation['dcterms:isPartOf'].id+`">
            <input type="checkbox" id="`+bb_id+`" name="`+bb_id+`">
            <i class="far fa-trash-alt trash" style="cursor:pointer;"></i>
            <label for="`+bb_id+`">`+sel_text+`</label></li>` ;        
    /*}*/
}

// delete annotation
$( document ).on( "click", ".bb-item.txt .trash", async function(e) {
    var _this = $( this );
    var wid = $( this ).closest( "[data-wid]" ).data( "wid" );
    var id = $( this ).prev().attr( "id" );
    var ids = $( this ).parent().data( "ids" ).split( "," );
    var update = namespaces+`\nWITH `+user+` DELETE { <`+id+`> ?p ?o . } WHERE { <`+id+`> ?p ?o . } ;\nWITH `+user+` DELETE { ?s ?p <`+id+`> . } WHERE { ?s ?p <`+id+`> . } `;
    await putTRIPLES( update );
    // unhighlight annotation and detach popovers
    $.each( ids, function( i,v ) {
        _this.parent().remove();
        $( jqu(v) ).removeClass( "highlight-bb" ).removeClass( "highlight-bb-start" ).removeClass( "highlight-bb-end" ).removeClass( "pulse-bb" );
        $( jqu(v) ).next( ".highlight-bb" ).removeClass( "highlight-bb" ).removeClass( "pulse-bb" );
    });
    processGlobalText( "", wid );
});
// retrieve and display annotations
function processBuildingBlocks( bb ) {
    $( ".workbench" ).html( `<h2>Current selections</h2><ul class="bb"></ul>` );
    $( ".highlight-bb" ).removeClass( "highlight-bb" );
    $( ".highlight-bb-start" ).removeClass( "highlight-bb-start" );
    $( ".highlight-bb-end" ).removeClass( "highlight-bb-end" );
    for (var j = 0; j < bb.length; j++ ) {
        try {
            $( ".workbench .bb" ).append( processW3Canno( bb[ j ] ) );
        } catch(err) {
            console.log( err )
        }
    }
}
$(document ).on('mouseenter', '.bb-item.txt', function ( e ) {
    var id = $( e.currentTarget ).data( "ids" ).split( "," )[0] || '';
    if ( $( "button.active" ).data( "expr" ) != $( e.currentTarget ).data( "expr" ) ) {
        $( "button[data-expr='"+$( e.currentTarget ).data( "expr" )+"']" ).trigger('click');
    }
    document.getElementById( id.substring(1) ).scrollIntoView( {behavior: "smooth", block: "start"} );
    $( $( e.currentTarget ).data( "ids" ) ).addClass("pulse-bb");
}).on('mouseleave', '.bb-item.txt', function ( e ) {
    $( $( e.currentTarget ).data( "ids" ) ).removeClass("pulse-bb");
});

function processTxtContexts( tc ) {
    $( ".workbench" ).html( `<h2>Contexts</h2><ul class="tc"></ul>` );
    $( ".contexts" ).html( `<ul class="tc-main"></ul>` );
    $( ".highlight-tc" ).removeClass( "highlight-tc" );
    for (var j = 0; j < tc.length; j++ ) {
        processW3Ccontext( tc[ j ] );
    }
}
// create annotaion display and anchor
function processW3Ccontext( annotation ) {
    // all contexts for a work expression are retrieved by default, so that they
    // could be shown when a work with only fragments is displayed, therefore
    // we simply check if the context target exists before we show it (may need
    // a more sophisticated implementation)
    console.log( annotation );
    if ( annotation["rppa:consistsOf"][0]["oa:hasTarget"][0].hasOwnProperty( "oa:hasSelector" ) ) {
        var header, sub, footer;
        // determine action
        switch ( annotation["rppa:hasAction"].id ) {
            case "rppa:Alignment":
                fetch( annotation["rppa:consistsOf"][0]["oa:hasBody"][0]["as:items"][0].id )
                .then(response => { if (!response.ok) { throw new Error("HTTP error " + response.status); }
                    return response.text();
                }).then(data => {
                    header = `Translation Alignment Context: `+annotation[ "skos:prefLabel" ];
                    sub = `<br><div class="creator"><em>Creator:</em> <span>`+annotation["as:generator"].id+`</span></div>`;
                    footer = ``;
                    footer += `<div>Contributed by `+contributors[ annotation["dcterms:contributor"].id ]["foaf:name"]+` on `+new Date( annotation["dcterms:created"] ).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })+`.</div>`;
                    $( ".globaltext-container" ).append( make_context( annotation.id, header+sub, data, footer, annotation["rppa:consistsOf"][0]["oa:hasTarget"][0]["oa:hasSelector"]["rdf:value"] ) );
                    return fetch( annotation["rppa:consistsOf"][0]["oa:hasBody"][0]["as:items"][1].id )
                }).then(response => { if (!response.ok) { throw new Error("HTTP error " + response.status); }
                    return response.json();
                }).then( data => {
                    alignment[ annotation.id ] = {};
                    // reverse alignment JSON to allow triggering from context
                    for ( var prop in data ) {
                        $.each( data[ prop ], function( index, item ) {
                            // if alignment[ annotation.id ][ item ].length == 0
                            if ( !alignment[ annotation.id ].hasOwnProperty( item ) ) {
                                alignment[ annotation.id ][ item ] = [];
                            }
                            alignment[ annotation.id ][ item ].push( prop );
                        });
                    }
                    // TODO
                    $(document).on('mouseenter', '.context[id="'+annotation.id+'"] .w,.context[id="'+annotation.id+'"] .pc', function () {
                        if ( alignment[ annotation.id ][ $(this).attr('id') ] ) {
                            var hovered = $( '.context[id="'+annotation.id+'"] #'+$(this).attr('id') ).text();
                            var targeted = [];
                            $.each( alignment[ annotation.id ][ $(this).attr('id') ], function( i,v ) {
                                targeted.push( $( jq(v) ).text().toLowerCase() );
                            });
                            document.getElementById( alignment[ annotation.id ][ $(this).attr('id') ][0] ).scrollIntoView( {behavior: "smooth", block: "center"} );
                            $( '#'+alignment[ annotation.id ][ $(this).attr('id') ].join( ',#' ) ).addClass("idsSelected");       // text
                            $( '.context[id="'+annotation.id+'"] #'+$(this).attr('id') ).addClass("idsSelected");    // context
                            $( '.context[id="'+annotation.id+'"] .text .w').each(function( index ) {
                                if ( $(this).text().toLowerCase() == hovered.toLowerCase() ) {
                                   $( $(this) ).addClass( "idsSelected" );
                                }
                            });
                            $( '.tab-pane.active .text .w').each(function( index ) {
                                if ( targeted.includes( $(this).text().toLowerCase() )) {
                                   $( $(this) ).addClass( "idsSelected" );
                                }
                            });
                        }
                    }).on('mouseleave', '.context[id="'+annotation.id+'"] .w,.context[id="'+annotation.id+'"] .pc', function () {
                        if ( alignment[ annotation.id ][ $(this).attr('id') ] ) {
                            var hovered = $( '.context[id="'+annotation.id+'"] #'+$(this).attr('id') ).text();
                            var targeted = [];
                            $.each( alignment[ annotation.id ][ $(this).attr('id') ], function( i,v ) {
                                targeted.push( $( jq(v) ).text().toLowerCase() );
                            });
                            $( '#'+alignment[ annotation.id ][ $(this).attr('id') ].join( ',#' ) ).removeClass("idsSelected");    // text
                            $( '.context[id="'+annotation.id+'"] #'+$(this).attr('id') ).removeClass("idsSelected"); // context
                            $( '.context[id="'+annotation.id+'"] .text .w').each(function( index ) {
                                if ( $(this).text().toLowerCase() == hovered.toLowerCase() ) {
                                   $( $(this) ).removeClass( "idsSelected" );
                                }
                            });
                            $( '.tab-pane.active .text .w').each(function( index ) {
                                if ( targeted.includes( $(this).text().toLowerCase() )) {
                                   $( $(this) ).removeClass( "idsSelected" );
                                }
                            });                            
                        }
                    });
                    tc_id = annotation.id;
                    $( ".workbench .tc" ).append( `<li class="tc-item txt" data-ids="`+annotation.id+`" data-expr="`+annotation['dcterms:source']+`">`+
                        //<input type="checkbox" id="`+tc_id+`" name="`+tc_id+`"> `+
                        ((user == annotation["dcterms:contributor"].id)?`<i class="far fa-trash-alt trash" style="cursor:pointer;"></i>`:``)
                        +` <label for="`+tc_id+`" style="display:inline">`+header+`</label></li>` );
                    clearInterval( t );
                    t = setInterval(updateDOM(),500);
                }).catch((e) => {});
            break;
            case "rppa:Annotation":
                header = `Interpretative Context: `+annotation[ "skos:prefLabel" ];
                sub = `<br><div class="creator"><em>Creator:</em> <span>`+annotation["as:generator"].id+`</span></div>`;
                footer = ``;
                footer += `<div>Contributed by `+contributors[ annotation["dcterms:creator"].id ]["foaf:name"]+` on `+new Date( annotation["dcterms:created"] ).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })+`.</div>`;
                $( ".globaltext-container" ).append( make_context( annotation.id, header+sub, annotation["rppa:consistsOf"][0]["oa:hasBody"][0]["rdf:value"], footer, annotation["rppa:consistsOf"][0]["oa:hasTarget"][0]["oa:hasSelector"]["rdf:value"] ) );
                tc_id = annotation.id;
                header = `Interpretative Context: `+annotation[ "skos:prefLabel" ];
                $( ".workbench .tc" ).append( `<li class="tc-item txt" data-ids="`+annotation.id+`" data-expr="`+annotation['dcterms:source']+`">`+
                    //<input type="checkbox" id="`+tc_id+`" name="`+tc_id+`"> `+
                    ((user == annotation["dcterms:creator"].id)?`<i class="far fa-trash-alt trash" style="cursor:pointer;"></i>`:``)
                    +` <label for="`+tc_id+`" style="display:inline">`+header+`</label></li>` );
                $( annotation["rppa:consistsOf"][0]["oa:hasTarget"][0]["oa:hasSelector"]["rdf:value"] ).addClass( "idsSelected" );
                clearInterval( t );
                t = setInterval(updateDOM(),500);
            break;
        }
    }
}
function make_context( id, header, data, footer, ids ) {
    return `<div class="card context resizable draggable" id="`+id+`" data-ids="`+ids+`"><div class="card-header">`+header+`</div><div class="card-body">`+data+`</div><div class="card-footer">`+footer+`</div></div>`;
}

$(document).on('mouseenter', '.context', function () {
    $( $(this) ).addClass("active");
    // format annotation
    var ids = $( this ).data( "ids" ).split( "," ); // => [ "#K060422_000-02650","#K060422_000-02660.1","#K060422_000-02670","#K060422_000-02680" ]
    // global highlight
    $( jqu(ids[0]) ).addClass( "highlight-gbl-start" )
    $( jqu(ids[[ids.length-1]]) ).addClass( "highlight-gbl-end" )
    // highlight annotation
    // TODO: needs some sort of classification whether it's a continuous range
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
// Function for a specific context-type, here highlighting @corresp-onding
// entities  

// highlight equivalence (where marked up)
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
