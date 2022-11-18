// RPPA
// Text tools

// global
var endpoints = {}, connections = {};

// MAIN
function add_text_tools( text ) {
    obj_id = "https://www.romanticperiodpoetry.org/id/"+text+"/work";
    // text = [id='https://www.prisms.digital/item/deamico/transcription/1/delivery']
    // id = deamico
    // obj_id = https://www.prisms.digital/item/deamico
    processAnnotations( obj_id );
    //processRelations( obj_id );
    processNamedEntities( obj_id );
}

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
// offer user annotation or relation options
$( document ).on( "mouseup", ".tab-pane.active", function(e) {
    if ( mode == "edit" ) {
        var sel = rangy.getSelection();
        var target, ids = [];
        $( ".popover-dismiss-select" ).popover( 'dispose' );
        $( ".popover-dismiss-anno" ).popover( 'dispose' );
        if ( sel.text() ) {
            target = sel.text();
            var col = $( this ).closest( ".k-window-content" ).data( "bgcolor" );                
            if ( sel.toHtml().includes(" id=") ) {
                ids = Array.from( sel.toHtml().matchAll( /span.*?id="(.*?)"/gsi ), m => m[1]);
            } else {
                ids = [ getHTML( sel.anchorNode.parentNode, true).match( /span.*?id="(.*?)"/si )[1] ];
            }
            ids = ids.filter( w_and_pc_only );
            var id = $( this ).closest( '.k-window-content' ).data( 'id' );
            $( jq(ids[ids.length-1]) ).popover({
                sanitize: false,
                content: `<a href="#" class="searchterm" data-ids="`+ids+`" data-id="`+id+`" data-col="`+col+`" data-sel="`+target+`" style="color:`+col+`;margin-right:5px;"><i class="fas fa-search"></i></a>
                    <a href="#" class="annotation" data-ids="`+ids+`" data-id="`+id+`" data-col="`+col+`" data-sel="`+target+`" style="color:`+col+`;margin-right:5px;"><i class="fas fa-comment"></i></a>
                    <a href="#" class="relation" data-ids="`+ids+`" data-id="`+id+`" data-col="`+col+`" data-sel="`+target+`" style="color:`+col+`;margin-right:5px;"><i class="fas fa-exchange-alt"></i></a>`,
                html: true,
                placement: 'auto',
                template: `<div class="popover popover-dismiss-select" role="button" tabindex="0" data-trigger="focus">
                    <div class="arrow"></div>
                    <h3 class="popover-header"></h3>
                    <div class="popover-body"></div>
                </div>`
            });
            $( jq(ids[ids.length-1]) ).popover('show');
        }
    }
});
// annotation editing popover
$( document ).on( "click", ".popover-dismiss-select a.annotation", function(e) {
    $(this).closest('div.popover').popover('hide');
    var ids = $( this ).data( "ids" ).split( "," );
    var obj_id = $( this ).data( "id" );
    var col = $( this ).data( "col" );
    var sel = $( this ).data( "sel" );
    $( ".popover-dismiss-select" ).popover( 'dispose' );
    $( jq(ids[0]) ).popover({
        sanitize: false,
        content: `<textarea placeholder="Add a comment..." data-ids="`+ids+`" data-id="`+obj_id+`" data-sel="`+sel+`" style="width:100%;" rows="4"></textarea>
            Category: <select><option value="">Please choose one</option><option value="Language">Language</option><option value="Form">Form</option><option value="Intratextuality">Intratextuality</option><option value="Intertextuality">Intertextuality</option>
                <option value="Context">Context</option><option value="Interpretation">Interpretation</option><option value="Textual Variants">Textual Variants</option><option value="Question">Question</option>
            </select>`,
        html: true,
        placement: 'auto',
        template: `<div class="popover popover-dismiss-anno" role="button" tabindex="0" data-trigger="focus" style="min-width:350px;">
            <div class="arrow"></div><h3 class="popover-header"></h3><div class="popover-body"></div>
            <div class="popover-footer" style="float:right;">
                <button data-dismiss="popover" class="btn cancel" style="border: 1px solid `+col+`;color:`+col+`">Cancel</button>
                <button type="submit" class="btn check" style="background-color:`+col+` !important;border: 1px solid `+col+`; color:#fff;">Ok</button>
            </div>
        </div>`
    });
    $( jq(ids[0]) ).popover('show');
});
// submit annotation
$( document ).on( "click", ".popover-dismiss-anno .check,.popover-dismiss .check", function(e) {
    var anno_id = $( this ).parent().prev().find( "textarea" ).data( "anno_id" ) || undefined;
    var anno_dt = $( this ).parent().prev().find( "textarea" ).data( "anno_dt" ) || undefined;
    var ids = $( this ).parent().prev().find( "textarea" ).data( "ids" ).split( "," );
    var obj_id = $( this ).parent().prev().find( "textarea" ).data( "id" );
    var target = $( this ).parent().prev().find( "textarea" ).data( "sel" );
    var comment = $( this ).parent().prev().find( "textarea" )[0].value;
    var cat = $( this ).parent().prev().find( "select" )[0].options[$( this ).parent().prev().find( "select" )[0].selectedIndex].value;
    if ( comment == '' ) {
        $( this ).parent().prev().find( "textarea" ).focus();
        return;
    } else {
        $( this ).parent().parent().popover( 'dispose' );
        createW3Canno( target, comment, cat, ids, obj_id, anno_id, anno_dt );
    }
});
// dismiss annotation
$( document ).on( "click", ".popover-dismiss-anno .cancel,.popover-dismiss .cancel", async function(e) {
    $( ".popover-dismiss" ).popover( 'hide' );
    $( ".popover-dismiss-anno" ).popover( 'dispose' );
});
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
// create, store, and process annotation
async function createW3Canno( target, comment, cat, ids, obj_id, orig_id, orig_dt ) {
    var date, id;
    if ( orig_dt ) {
        date = new Date( orig_dt );
    } else {
        date = new Date();
    }
    if ( orig_id ) {
        id = orig_id;
    } else {
        id = domain+`/id/`+uuidv4()+`/annotation`;
    }
    var orig_ids = ids.slice();
    ids.forEach(function(part, index) {
        ids[index] = "#"+part.replace( /\\./g,"\\\\." );
    });
    var W3Canno = `{
        "@context": "http://www.w3.org/ns/anno.jsonld",
        "id": "`+id+`",
        "type": "Annotation",
        "creator": "`+domain+`",
        "created": "`+date.toISOString()+`",
        "modified": "`+new Date().toISOString()+`",
        "dcterm:identifier": "`+obj_id+`",
        "motivation": "commenting",
        "body": [
          { "type" : "TextualBody",
            "value" : "`+comment.replace(/"/g,'&quot;').replace(/(\r\n|\n|\r|\t|\f)/gm,"\\\\n")+`",
            "purpose": "commenting",
            "skos:prefLabel": "`+(cat?cat:`Annotation`)+`",
            "skos:altLabel": "Level 1",
            "rdfs:note": "`+target+`",
            "rights": "http://creativecommons.org/licenses/by-nc-sa/4.0/",
            "creator": "`+$.jStorage.get( "prisms-user-name" )+`",
            "created": "`+date.toISOString()+`",
            "modified": "`+new Date().toISOString()+`"
          }
        ],
        "target": [
          { "source": "`+obj_id+`",
            "selector":
              { "type": "CssSelector",
                "value": "`+ids.join( "," )+`"
              }
          }
        ]
    }`;
    // update: delete old annotation, remove anchor, and highlighting
    if ( orig_id ) {
        var update = namespaces+`\nWITH `+user+` DELETE { <`+id+`> ?p ?o . } WHERE { <`+id+`> ?p ?o . } ;\nWITH `+user+` DELETE { ?s ?p <`+id+`> . } WHERE { ?s ?p <`+id+`> . } `;
        await putTRIPLES( update );
        // unhighlight annotation and detach popovers
        $.each( orig_ids, function( i,v ) {
            $( jq(v) ).popover( 'dispose' );
            $( jq(v) ).removeClass( "highlight-"+$( jq(v) ).closest( ".window" ).data( "id" ).substr(GetSubstringIndex($( jq(v) ).closest( ".window" ).data( "id" ),"/",4)+1) );
            $( jq(v) ).next().removeClass( "highlight-"+$( jq(v) ).closest( ".window" ).data( "id" ).substr(GetSubstringIndex($( jq(v) ).closest( ".window" ).data( "id" ),"/",4)+1) );
        });
    }
    // add annotation
    var update = namespaces+"insert data {\n";
    update += `GRAPH `+user+` { <`+id+`> a prisms:Annotation, cnt:ContentAsText ;\n`;
    update += `dcterm:identifier """`+obj_id+`""" ;\n`;
    update += `dcterm:title """`+$( "#objects [data-id='"+obj_id+"'] .k-card-title" ).text()+`""" ;\n`;
    update += `skos:prefLabel """`+target+`""" ;\n`;
    update += `crm:P1_is_identified_by """Annotation""" ;\n`;
    update += `skos:altLabel """`+(cat?cat:`Annotation`)+`""" ;\n`;
    update += `cnt:characterEncoding "UTF-8" ;\n`;
    update += `cnt:bytes """`+JSON.stringify(JSON.parse( W3Canno )).replace(/\\"/g,"&quot;")+`""" ;\n`;
    update += `dcterm:created """`+date.toISOString()+`""" ;\n`;
    update += `crm:P2_has_type prisms:Annotation ;\n`;
    update += `crm:P3_has_note """`+comment.replace(/"/g,'&quot;').replace(/(\r\n|\n|\r|\t|\f)/gm,"\\\\n")+`""" ;\n`;
    update += `. }\n}`;
    await putTRIPLES( update );
    if ( $.jStorage.get( "prisms-user-public" ) ) {
        publish( id );
    }
    processW3Canno( JSON.parse( W3Canno ), true );
}
// create annotaion display and anchor
function processW3Canno( annotation, editable ) {
    // format annotation
    var ids = annotation.target[0].selector.value.split( "," ); // => [ "#K060422_000-02650","#K060422_000-02660.1","#K060422_000-02670","#K060422_000-02680" ]
    var orig_ids = ids.slice();
    orig_ids.forEach(function(part, index) {
        orig_ids[index] = part.substring(1);
    });
    var obj_id = annotation.target[0].source;
    var col = $( "#windows [data-id='"+obj_id+"']" ).data( "bgcolor" );
    var note_display = `<ul>`;
    $.each( annotation.body, function(i,v) {
        note_display += `<li>
            <textarea rows="4" data-anno_dt="`+v.modified+`" data-anno_id="`+annotation.id+`" data-ids="`+orig_ids+`" data-id="`+obj_id+`" data-sel="`+v["rdfs:note"]+`" style="width:100%;"`+((editable)?``:` readonly`)+`>`+v.value+`</textarea>
            <span class="category">Category: <select`+((editable)?``:` disabled`)+`>`+`<option value="">Please choose one</option><option value="Language">Language</option><option value="Form">Form</option><option value="Intratextuality">Intratextuality</option><option value="Intertextuality">Intertextuality</option>
            <option value="Context">Context</option><option value="Interpretation">Interpretation</option><option value="Textual Variants">Textual Variants</option><option value="Question">Question</option>`.replace( ">"+v["skos:prefLabel"], " selected>"+v["skos:prefLabel"] )+
            `</select></span>
            <span class="date">Contributor: `+((editable)?`<em>You</em>`:truncateString(v.creator,25))+`</span>
            <span class="user">Date: `+new Date( v.modified ).toUTCString()+`</span>
        </li>`;
    });
    note_display += `</ul>`;
    // highlight annotation
    var sel = rangy.getSelection();
    var range = rangy.createRange();
    high = rangy.createHighlighter();
    high.addClassApplier(rangy.createClassApplier("highlight-"+obj_id.substr(GetSubstringIndex( obj_id,"/",4)+1), {
        ignoreWhiteSpace: true
    }));
    range.setStart( $( jqu(ids[0]) )[0], 0 );
    range.setEndAfter( $( jqu(ids[ids.length-1]) )[0], 0 );
    sel.setSingleRange(range);
    high.highlightSelection("highlight-"+obj_id.substr(GetSubstringIndex( obj_id,"/",4)+1));
    sel.collapseToEnd();
    sel.detach();
    // anchor annotation
    ids.forEach(function(part, index) {
        ids[index] = "[id='"+part.substring(1)+"']";
    });
    $( ids.join( "," ) ).popover({
        animation: false,
        content: note_display,
        html: true,
        placement: 'bottom',
        sanitize: false,
        template: `<div class="popover popover-dismiss" data-trigger="focus" role="button" tabindex="0" style="min-width:350px;">
            <div class="arrow"></div><h3 class="popover-header"></h3><div class="popover-body"></div>`+((editable)?`
            <div class="popover-footer">
                <button type="submit" class="btn check" style="background-color:`+col+` !important;color:#fff;float:right;border: 1px solid `+col+`;">Ok</button>
                <button data-dismiss="popover" class="btn cancel" style="float:right;border: 1px solid `+col+`;color:`+col+`">Close</button>
                <button data-dismiss="popover" class="btn trash" style="margin-left:8px;float:left;background-color:`+col+` !important;color:#fff;border: 1px solid `+col+`;">Delete</button>
            </div>`:``)+`
        </div>`
    });
}
// enforce single annotation toggle
$('#windows').on('click', function (e) {
    if ( $( ".popover-dismiss" ).length > 1) {
        $( $( ".popover-dismiss" )[0] ).popover('hide');
    }
});
// retrieve and display annotations
async function processAnnotations( text ) {
    var q = namespaces+`SELECT * WHERE { 
        {
            ?s rdf:type prisms:Annotation . 
            ?s dcterm:identifier '''`+text+`''' . 
            ?s crm:P2_has_type prisms:Annotation . 
            ?s cnt:bytes ?o . 
            BIND ( rdf:type AS ?p ) BIND ( <default> as ?g ) 
        }
        UNION
        {
            GRAPH `+user+` {
                ?s rdf:type prisms:Annotation . 
                ?s dcterm:identifier '''`+text+`''' . 
                ?s crm:P2_has_type prisms:Annotation . 
                ?s cnt:bytes ?o . 
                BIND ( rdf:type AS ?p ) BIND ( `+user+` as ?g )
            }
        }
    }`;
    var annotations = await getJSONLD( q, "raw" ); // DONE
    for (var j = 0; j < annotations.length; j++ ) {
        var v = annotations[ j ];
        processW3Canno( JSON.parse( v.o.value ), (("prisms:"+v.g.value.split( '/' )[4] == $.jStorage.get( "prisms-user" ))?true:false) );
    }
}

// relation editing popover
/*
$( document ).on( "click", ".popover-dismiss-select a.relation", function(e) {
    $(this).closest('div.popover').popover('hide');
    var ids = $( this ).data( "ids" ).split( "," );
    var obj_id = $( this ).data( "id" );
    var col = $( this ).data( "col" );
    var sel = $( this ).data( "sel" );
    // allow for only one active relation at a time
    if ( _.size( endpoints ) > 0 ) {
        jsPlumb_instance.deleteEndpoint( endpoints[Object.keys( endpoints )[0]] );
        endpoints = {};
    }
    // setup relations if not done already
    for ( var i=0; i<$( "#windows [data-role=window].text" ).length; i++ ) {
        if ( !( $( "[id='"+$( "#windows [data-role=window].text" )[i].id + "'] .w" ).first().hasClass( "jtk-droppable" ) ) ) {
            show_alert_mod( `<b>Setting up relations mode.</b>This can take a short while, but only needs to happen once per workbench text.
                Please wait for the red dot to appear. Thanks!`, "warning", true, 10000 );
            setupRelations( $( "#windows [data-role=window].text" )[i].id );
        }
    }
    var endpoint = uuidv4();
    $( ".popover-dismiss-select" ).popover( 'dispose' );
    endpoints[ endpoint ] = jsPlumb_instance.addEndpoint( $( jq(ids[0]) )[0], { 
        isSource:true,
        deleteEndpointsOnDetach:false,
        detachable:false,
        connectorOverlays:[ 
            [ "PlainArrow", { width:8, length:8, location:1, id:"arrow" } ],
            [ "Custom", {
                create: function(component) {
                    return $(`<div>
                    <input id="popover-rels-comment" placeholder="Choose a relation..." contenteditable="true" style="border:1px dashed #999;width:150px; height:20px;" class='jtk-overlay'
                        data-id="`+obj_id+`" data-ids="`+ids+`" data-sel="`+sel+`" data-col="`+col+`" list="relations"/><a 
                        href="#" class="check popover-rel-check"><i class="fas fa-check jtk-overlay"/></a><a 
                        href="#" class="cancel popover-rel-dismiss" data-ep="`+endpoint+`"><i class="fas fa-times jtk-overlay"/></a><!--<a 
                        href="#" class="trash popover-rel-trash"><i class="fas fa-trash-alt jtk-overlay"/></a>-->
                        <datalist id="relations">
                            <option value="is related contemporaneously to">
                            <option value="has contemporaneous relation">
                            <option value="is contained in">
                            <option value="contains">
                            <option value="is referenced in">
                            <option value="references">    
                            <option value="is part or component of">
                            <option value="has part or component">
                            <option value="is version of">
                            <option value="has version">
                            <option value="is referred to by">
                            <option value="refers to">
                            <option value="is source for">
                            <option value="has source">
                            <option value="is derived from">
                            <option value="has derivation">
                            <option value="is smaller unit of">
                            <option value="has smaller unit">
                            <option value="is broader unit of">
                            <option value="has broader unit">
                            <option value="is present in">
                            <option value="is source of">
                            <option value="uses as source">
                            <option value="is related to">
                            <option value="represents">
                            <option value="is a representation of">
                            <option value="has translation">
                            <option value="is translation of">
                            <option value="exemplifies">
                            <option value="is exemplified in">
                            <option value="is about">
                            <option value="is same as">
                            <option value="incorporates">
                            <option value="has subject">
                            <option value="is subject of">
                        </datalist></div>`);
                    //<select id='myDropDown' class='jtk-overlay'><option value='foo'>foo</option><option value='bar'>bar</option></select>");                
                },
                location:0.5,
                id:"customOverlay"
            }]
        ]
    });
});
// submit annotation
$( document ).on( "click", "a.popover-rel-check", async function(e) {
    var anno_id = $( this ).prev().data( "anno_id" ) || undefined;
    var anno_dt = $( this ).prev().data( "anno_dt" ) || undefined;
    var ids = $( this ).prev().data( "ids" ).split( "," );
    var obj_id = $( this ).prev().data( "id" );
    var target = $( this ).prev().data( "sel" );
    var cat;
    var comment = $( "#popover-rels-comment" ).val();
    if ( comment == undefined || comment == '' ) {
        $( "#popover-rels-comment" ).focus();
        return;
    } else {
        $( "#popover-rels-comment" ).parent().remove();
        connections.connection.setLabel( `<span style="background-color: #f6f6f6;border: 1px dashed #333;padding: 1px 5px;font-size: 14px;">`+comment+`</span>` );
        createW3Crel( target, comment, cat, ids, obj_id, anno_id, anno_dt, connections );
        endpoints = {};
        await sleep(5000);
        jsPlumb_instance.deleteConnection( connections.connection );
        jsPlumb_instance.deleteEveryEndpoint();
    }
});
// dismiss annotation
$( document ).on( "click", "a.popover-rel-dismiss", async function(e) {
    jsPlumb_instance.deleteEndpoint( endpoints[$( this ).data( "ep" )] );
    connections = {};
});
// setup jsPlumb connectors
function setupRelations( text ) {
    // initialize text
    var obj = jsPlumb_instance.getSelector( "[id='"+text+"'] div.text" );
    // suspend drawing and initialise.
    jsPlumb_instance.setSuspendDrawing(true);
    jsPlumb_instance.batch(function () {
        for (var l = 0; l < obj.length; l++) {
            // make all .w/.pc targets
            var items = obj[l].querySelectorAll( ".w,.pc,.expan,.abbr,.corr,.sic,.orig" );
            for (var i = 0; i < items.length; i++) {
                jsPlumb_instance.makeTarget(items[i], {
                    anchor: ["Left", "Right", "Top", "Bottom" ],
                    isTarget:true,
                    deleteEndpointsOnDetach:false,
                    endpoint:"Blank"
                });
            }
        }
    });
    jsPlumb_instance.setSuspendDrawing(false, true);
}
// update connections
document.addEventListener('scroll', function (e) {
    if ( window.location.pathname.split('/')[1] == "workbench" ) {
        setTimeout(function() {
            jsPlumb_instance.repaintEverything();
        }, 25);
    }
}, true );
// create, store, and process annotation
async function createW3Crel( target, comment, cat, ids, obj_id, orig_id, orig_dt, connection ) {
    var date, id;
    if ( orig_dt ) {
        date = new Date( orig_dt );
    } else {
        date = new Date();
    }
    if ( orig_id ) {
        id = orig_id;
    } else {
        id = domain+`/id/`+uuidv4()+`/relation`;
    }
    var t_ids = [ connection.targetId ];
    var s_ids = ids;
    var t_orig_ids = t_ids.slice();
    var s_orig_ids = s_ids.slice();
    s_ids.forEach(function(part, index) {
        s_ids[index] = "#"+part.replace( /\\./g,"\\\\." );
    });
    t_ids.forEach(function(part, index) {
        t_ids[index] = "#"+part.replace( /\\./g,"\\\\." );
    });
    var W3Crel = `{
        "@context": "http://www.w3.org/ns/anno.jsonld",
        "id": "`+id+`",
        "type": "Annotation",
        "creator": "`+domain+`",
        "created": "`+date.toISOString()+`",
        "modified": "`+new Date().toISOString()+`",
        "dcterm:identifier": "`+obj_id+`",
        "motivation": "linking",
        "body": [
          { "type" : "TextualBody",
            "value" : "`+comment.replace(/"/g,'&quot;').replace(/(\r\n|\n|\r|\t|\f)/gm,"\\\\n")+`",
            "purpose": "linking",
            "skos:prefLabel": "`+(($( "#"+connection.sourceId ).closest( ".window" ).data( "id" ) == $( "#"+connection.targetId ).closest( ".window" ).data( "id" ))?"Intratextuality":"Intertextuality")+`",
            "skos:altLabel": "Level 1",
            "rdfs:note": "`+target+`",
            "rights": "http://creativecommons.org/licenses/by-nc-sa/4.0/",
            "creator": "`+$.jStorage.get( "prisms-user-name" )+`",
            "created": "`+date.toISOString()+`",
            "modified": "`+new Date().toISOString()+`"
          }
        ],
        "target": [
          { "source": "`+$( "#"+connection.sourceId ).closest( ".window" ).data( "id" )+`",
            "dcterm:title": "`+$( "#objects [data-id='"+$( "#"+connection.sourceId ).closest( ".window" ).data( "id" )+"'] .k-card-title" ).text()+`",
            "selector":
              { "type": "CssSelector",
                "value": "`+s_ids.join( "," )+`"
              },
            "rdfs:note": "`+target+`"
          },
          { "source": "`+$( "#"+connection.targetId ).closest( ".window" ).data( "id" )+`",
            "dcterm:title": "`+$( "#objects [data-id='"+$( "#"+connection.targetId ).closest( ".window" ).data( "id" )+"'] .k-card-title" ).text()+`",
            "selector":
              { "type": "CssSelector",
                "value": "`+t_ids.join( "," )+`"
              },
            "rdfs:note":"`+$( "[id='"+t_orig_ids[0]+"']" )[0].innerText+`"
          }
        ]
    }`;
    // update: delete old relation, remove anchor, and highlighting
    if ( orig_id ) {
        var update = namespaces+`\nWITH `+user+` DELETE { <`+id+`> ?p ?o . } WHERE { <`+id+`> ?p ?o . } ;\nWITH `+user+` DELETE { ?s ?p <`+id+`> . } WHERE { ?s ?p <`+id+`> . } `;
        await putTRIPLES( update );
        // unhighlight annotation and detach popovers
        $.each( t_orig_ids, function( i,v ) {
            $( jq(v) ).popover( 'dispose' );
            $( jq(v) ).removeClass( "highlight-rel-"+$( jq(v) ).closest( ".window" ).data( "id" ).substr(GetSubstringIndex($( jq(v) ).closest( ".window" ).data( "id" ),"/",4)+1) );
            $( jq(v) ).next().removeClass( "highlight-rel-"+$( jq(v) ).closest( ".window" ).data( "id" ).substr(GetSubstringIndex($( jq(v) ).closest( ".window" ).data( "id" ),"/",4)+1) );
        });
        $.each( s_orig_ids, function( i,v ) {
            $( jq(v) ).popover( 'dispose' );
            $( jq(v) ).removeClass( "highlight-rel-"+$( jq(v) ).closest( ".window" ).data( "id" ).substr(GetSubstringIndex($( jq(v) ).closest( ".window" ).data( "id" ),"/",4)+1) );
            $( jq(v) ).next().removeClass( "highlight-rel-"+$( jq(v) ).closest( ".window" ).data( "id" ).substr(GetSubstringIndex($( jq(v) ).closest( ".window" ).data( "id" ),"/",4)+1) );
        });
    }
    // add annotation
    var update = namespaces+"insert data {\n";
    update += `GRAPH `+user+` { <`+id+`> a prisms:Relation, cnt:ContentAsText ;\n`;
    update += `dcterm:relation """`+obj_id+`""" ;\n`;
    update += `dcterm:relation """`+$( "#"+connection.targetId ).closest( ".window" ).data( "id" )+`""" ;\n`;
    update += `dcterm:title """`+$( "#objects [data-id='"+obj_id+"'] .k-card-title" ).text()+` (source)""" ;\n`;
    update += `dcterm:title """`+$( "#objects [data-id='"+$( "#"+connection.targetId ).closest( ".window" ).data( "id" )+"'] .k-card-title" ).text()+` (target)""" ;\n`;
    update += `skos:prefLabel """`+target+`""" ;\n`;
    update += `crm:P1_is_identified_by """Relation""" ;\n`;
    update += `skos:altLabel """`+(($( "#"+connection.sourceId ).closest( ".window" ).data( "id" ) == $( "#"+connection.targetId ).closest( ".window" ).data( "id" ))?"Intratextuality":"Intertextuality")+`""" ;\n`;
    update += `cnt:characterEncoding "UTF-8" ;\n`;
    update += `cnt:bytes """`+JSON.stringify(JSON.parse( W3Crel )).replace(/\\"/g,"&quot;")+`""" ;\n`;
    update += `dcterm:created """`+date.toISOString()+`""" ;\n`;
    update += `crm:P2_has_type prisms:Relation ;\n`;
    update += `crm:P3_has_note """`+comment.replace(/"/g,'&quot;').replace(/(\r\n|\n|\r|\t|\f)/gm,"\\\\n")+`""" ;\n`;
    update += `. }\n}`;
    await putTRIPLES( update );
    if ( $.jStorage.get( "prisms-user-public" ) ) {
        publish( id );
    }
    processW3Crel( JSON.parse( W3Crel ), true, obj_id, true );
}
// retrieve and display relations
async function processRelations( text ) {
    var q = namespaces+`SELECT * WHERE { 
        {
            ?s rdf:type prisms:Relation . 
            ?s dcterm:relation '''`+text+`''' . 
            ?s crm:P2_has_type prisms:Relation . 
            ?s cnt:bytes ?o . 
            BIND ( rdf:type AS ?p ) BIND ( <default> as ?g ) 
        }
        UNION
        {
            GRAPH `+user+` {
                ?s rdf:type prisms:Relation . 
                ?s dcterm:relation '''`+text+`''' . 
                ?s crm:P2_has_type prisms:Relation . 
                ?s cnt:bytes ?o . 
                BIND ( rdf:type AS ?p ) BIND ( `+user+` as ?g )
            }
        }
    }`;
    var relations = await getJSONLD( q, "raw" ); // DONE
    for (var j = 0; j < relations.length; j++ ) {
        var v = relations[ j ];
        processW3Crel( JSON.parse( v.o.value ), (("prisms:"+v.g.value.split( '/' )[4] == $.jStorage.get( "prisms-user" ))?true:false), text, false );
    }
}
// delete relation
$( document ).on( "click", ".popover-dismiss .trash", async function(e) {
    $( ".popover-dismiss" ).popover( 'dispose' );
    if ( $( this ).parent().prev().find( "li" ).data( "anno_id" ) ) {
        var id = $( this ).parent().prev().find( "li" ).data( "anno_id" );
        var ids = $( this ).parent().prev().find( "li" ).data( "trash" ).split( "," );
        var update = namespaces+`\nWITH `+user+` DELETE { <`+id+`> ?p ?o . } WHERE { <`+id+`> ?p ?o . } ;\nWITH `+user+` DELETE { ?s ?p <`+id+`> . } WHERE { ?s ?p <`+id+`> . } `;
        await putTRIPLES( update );
        ids.forEach(function(part, index) {
            ids[index] = part.substring(1);
        });
        // unhighlight annotation and detach popovers
        $.each( ids, function( i,v ) {
            $( jq(v) ).popover( 'dispose' );
            $( jq(v) ).removeClass( "highlight-rel-"+$( jq(v) ).closest( ".window" ).data( "id" ).substr(GetSubstringIndex($( jq(v) ).closest( ".window" ).data( "id" ),"/",4)+1) );
            $( jq(v) ).next().removeClass( "highlight-rel-"+$( jq(v) ).closest( ".window" ).data( "id" ).substr(GetSubstringIndex($( jq(v) ).closest( ".window" ).data( "id" ),"/",4)+1) );
        });
    }
});
// create relation display and anchor
function processW3Crel( annotation, editable, global_text, mode ) {
    var ids_trash = annotation.target[0].selector.value.split( "," ).concat( annotation.target[1].selector.value.split( "," ) );
    $.each( annotation.target, function(i,v) {
        if ( annotation.target[i].source == global_text || mode) {
            obj_id = global_text;
            var ids = annotation.target[i].selector.value.split( "," ); // => [ "#K060422_000-02650","#K060422_000-02660.1","#K060422_000-02670","#K060422_000-02680" ]
            var orig_ids = ids.slice();
            orig_ids.forEach(function(part, index) {
                orig_ids[index] = part.substring(1);
            });
            var col = $( "#windows [data-id='"+obj_id+"']" ).data( "bgcolor" );
            var note_display = `<ul>`;
            note_display += `<li data-anno_dt="`+annotation.modified+`" data-anno_id="`+annotation.id+`" data-trash="`+ids_trash+`" data-ids="`+ids+`" data-id="`+obj_id+`" data-sel="`+annotation.body[0]["rdfs:note"]+`" style="width:100%;"
                data-source="`+annotation.target[0].selector.value+`" data-target="`+annotation.target[1].selector.value+`"><span class="entryFree">`+((i == 0)?`"`+v["rdfs:note"]+`"`:`<a href="#" data-ids="" 
                class="draw_relation">"`+annotation.target[0]["rdfs:note"]+`"</a>`)+` in  
                <a href="#`+annotation.target[0].source.substr( GetSubstringIndex(annotation.target[0].source,"/",4)+1 )+`" class="add_object_wb"><em>`+
                truncateString( annotation.target[0]["dcterm:title"], 35)+`</em></a> 
                <em>`+annotation.body[0]["value"]+`</em> `
                +((i == 0)?`<a href="#" data-ids="" class="draw_relation">"`+annotation.target[1]["rdfs:note"]+`"</a>`:`"`+v["rdfs:note"]+`"`)+` in 
                <a href="#`+annotation.target[1].source.substr( GetSubstringIndex(annotation.target[1].source,"/",4)+1 )+`" class="add_object_wb"><em>`+
                truncateString( annotation.target[1]["dcterm:title"], 35)+`</em></a>
                </span>
                <span class="category">Category: `+annotation.body[0]["skos:prefLabel"]+`</span>
                <span class="date">Contributor: `+((editable)?`<em>You</em>`:truncateString(annotation.body[0]["creator"],25))+`</span>
                <span class="user">Date: `+new Date( annotation.body[0]["modified"] ).toUTCString()+`</span>
            </li>`;
            note_display += `</ul>`;
            // highlight annotation
            var sel = rangy.getSelection();
            var range = rangy.createRange();
            high = rangy.createHighlighter();
            high.addClassApplier(rangy.createClassApplier("highlight-rel-"+obj_id.substr(GetSubstringIndex( obj_id,"/",4)+1), {
                ignoreWhiteSpace: true
            }));
            range.setStart( $( jqu(ids[0]) )[0], 0 );
            range.setEndAfter( $( jqu(ids[ids.length-1]) )[0], 0 );
            sel.setSingleRange(range);
            high.highlightSelection("highlight-rel-"+obj_id.substr(GetSubstringIndex( obj_id,"/",4)+1));
            sel.collapseToEnd();
            sel.detach();
            // anchor annotation
            ids.forEach(function(part, index) {
                ids[index] = "[id='"+part.substring(1)+"']";
            });
            $( ids.join( "," ) ).popover({
                animation: false,
                content: note_display,
                html: true,
                placement: 'bottom',
                sanitize: false,
                template: `<div class="popover popover-dismiss" data-trigger="focus" role="button" tabindex="0" style="min-width:350px;">
                    <div class="arrow"></div><h3 class="popover-header"></h3><div class="popover-body"></div>`+((editable)?`
                    <div class="popover-footer">
                        <!--
                        <button type="submit" class="btn check" style="background-color:`+col+` !important;border: 1px solid `+col+`;color:#fff;">Ok</button> -->
                        <button data-dismiss="popover" class="btn cancel" style="float:right;border: 1px solid `+col+`;color:`+col+`">Close</button>
                        <button data-dismiss="popover" class="btn trash" style="margin-left:8px;background-color:`+col+` !important;border: 1px solid `+col+`;color:#fff;float:left;">Delete</button>
                    </div>`:``)+`
                </div>`
            });
        }
    });
}
// highlight/draw relation
$( document ).on( "click", "a.draw_relation", async function(e) {
    // focus related texts
    var source = $(e.currentTarget).closest( "li" ).data( "source" ).split( "," )[0];
    var target = $(e.currentTarget).closest( "li" ).data( "target" ).split( "," )[0];
    if ( $( "[id='"+$( source ).closest( ".window" ).attr( "id" )+"']" ).data("kendoWindow") ) {
        $( "[id='"+$( source ).closest( ".window" ).attr( "id" )+"']" ).data("kendoWindow").open();
    }
    if ( $( "[id='"+$( target ).closest( ".window" ).attr( "id" )+"']" ).data("kendoWindow") ) {
        $( "[id='"+$( target ).closest( ".window" ).attr( "id" )+"']" ).data("kendoWindow").open();
    }
    // draw relation
    var conn = jsPlumb_instance.connect({ 
            source:document.getElementById( $(e.currentTarget).closest( "li" ).data( "source" ).split( "," )[0].substring(1) ), 
            target:document.getElementById( $(e.currentTarget).closest( "li" ).data( "target" ).split( "," )[0].substring(1) )
        },
        {
            deleteEndpointsOnDetach:false,
            detachable:false,
            overlays:[ 
                [ "PlainArrow", { width:8, length:8, location:1, id:"arrow" } ]
            ]
        }
    );
    await sleep(5000);
    jsPlumb_instance.deleteConnection(conn);
});
*/
// add external tool window/iframe
$( document ).on( "click", "a.addTool", function(e) {
    var component = $( this ).attr( "data-id" );
    var title = $( this ).attr( "data-title" );
    var type = $( this ).attr( "data-type" );
    var tool_url = $( this ).attr( "data-url" );
    var bgcol = $( this ).attr( "data-bgcol" );
    // global settings
    var myWindow;
    var windowOptions = {
        content: tool_url,
        iframe: true,
    	width: "1064",
        height: "968",
        visible: false,
        draggable: {
          containment: "#windows"
        },
        resizable: true,
        actions: [
          "Minimize",
          "Maximize",
          "Close"
        ],
        animation: {
          open: { effects: "fadeIn" },
          close: { effects: "fadeIn", reverse: true }
        },
        close: onWindowClose,
        open: onWindowOpen,
        activate: onWindowActivate,
        deactivate: onWindowDeactivate,
        refresh: onWindowRefresh,
        resize: onWindowResize,
        dragstart: onWindowDragStart,
        dragend: onWindowDragEnd,
        minimize: onWindowMinimize,
        maximize: onWindowMaximize
    };
    // create new or open existing notebook
    $( "#workbench" ).prepend( "<div class='window' id='"+component+"' data-bgcolor='#333'></div>" );
    myWindow = $( "[id = '"+component+"']" );
    myWindow.kendoWindow( windowOptions );
    myWindow.data("kendoWindow").wrapper.find(".k-window-title").html( "<span class='k-card-title'>"+title+"</span><span class='k-card-subtitle'>"+type+"</span>" );
    myWindow.data("kendoWindow").wrapper.find( ".k-window-titlebar" ).addClass( "k-header" );
    myWindow.data("kendoWindow").wrapper.find( ".k-window-titlebar" ).css( "border-top", "5px solid "+bgcol );
    myWindow.data("kendoWindow").open();
    myWindow.data("kendoWindow").setOptions({ position: { top: 0, left:532 } });
});

// open facsimile display and/or jump to new page
$(document ).on('click', ".text .pagebreak a,.image_link a", async function(e) {
    e.preventDefault();
    var id = $(e.currentTarget).closest( ".tab-content" ).find( "[id*='/imageset/']").attr( "id" );
    var page = parseInt( $(e.currentTarget).data("id") );
    $(e.currentTarget).closest( ".modal-body" ).find( "button:contains(Facsimile)" ).trigger('click');
    viewer[ id ].goToPage( page );
});

// create, store, and process named entities
async function createW3Centity( target, entity, ids, obj_id ) {
    var date, id;
    date = new Date();
    id = domain+`/id/`+uuidv4()+`/annotation`;
    ids = ids.split( "," );
    ids.forEach(function(part, index) {
        ids[index] = "#"+part.replace( /\\./g,"\\\\." );
    });
    var W3Centity = `{
        "@context": "http://www.w3.org/ns/anno.jsonld",
        "id": "`+id+`",
        "type": "Annotation",
        "creator": "`+domain+`",
        "created": "`+date.toISOString()+`",
        "dcterm:identifier": "`+obj_id+`",
        "motivation": "identifying",
        "body": [
          { "type" : "TextualBody",
            "purpose": "identifying",
            "skos:prefLabel": "Named entity",
            "skos:altLabel": "Level 1",
            "rdfs:note": "`+target+`",
            "rights": "http://creativecommons.org/licenses/by-nc-sa/4.0/",
            "creator": "`+$.jStorage.get( "prisms-user-name" )+`",
            "created": "`+date.toISOString()+`"
          }
        ],
        "target": [
          { "source": "`+obj_id+`",
            "selector":
              { "type": "CssSelector",
                "value": "`+ids.join( "," )+`"
              }
          }
        ]
    }`;
    // add named entity instance/annotation
    var update = namespaces+"insert data {\n";
    update += `GRAPH `+user+` { <`+id+`> a prisms:NamedEntityReference, crm:E41_Appellation, crm:E33_Linguistic_Object, cnt:ContentAsText ;\n`;
    update += `dcterm:identifier """`+obj_id+`""" ;\n`;
    update += `dcterm:title """`+$( "#objects [data-id='"+obj_id+"'] .k-card-title" ).text()+`""" ;\n`;
    update += `skos:prefLabel """`+target+`""" ;\n`;
    update += `crm:P1i_identifies <`+entity+`> ;\n`;
    update += `skos:altLabel """annotation""" ;\n`;
    update += `cnt:characterEncoding "UTF-8" ;\n`;
    update += `cnt:bytes """`+JSON.stringify(JSON.parse( W3Centity )).replace(/\\"/g,"&quot;")+`""" ;\n`;
    update += `dcterm:created """`+date.toISOString()+`""" ;\n`;
    update += `crm:P2_has_type prisms:NamedEntityReference ;\n`;
    update += `crm:P3_has_note """`+target.replace(/"/g,'&quot;').replace(/(\r\n|\n|\r|\t|\f)/gm,"\\\\n")+`""" ;\n`;
    update += `. }\n}`;
    await putTRIPLES( update );
    if ( $.jStorage.get( "prisms-user-public" ) ) {
        publish( id );
    }
    var text_id = processW3Centity( JSON.parse( W3Centity ), true );
    update_entities( text_id, [ entity ], false );
}
// create named entity reference (annotaion display and anchor)
function processW3Centity( annotation, editable ) {
    // format annotation
    var ids = annotation.target[0].selector.value.split( "," ); // => [ "#K060422_000-02650","#K060422_000-02660.1","#K060422_000-02670","#K060422_000-02680" ]
    var orig_ids = ids.slice();
    orig_ids.forEach(function(part, index) {
        orig_ids[index] = part.substring(1);
    });
    var obj_id = annotation.target[0].source;
    // highlight instance
    var sel = rangy.getSelection();
    var range = rangy.createRange();
    high = rangy.createHighlighter();
    high.addClassApplier(rangy.createClassApplier("highlight-ne-"+obj_id.substr(GetSubstringIndex( obj_id,"/",4)+1), {
        ignoreWhiteSpace: true
    }));
    range.setStart( $( jqu(ids[0]) )[0], 0 );
    range.setEndAfter( $( jqu(ids[ids.length-1]) )[0], 0 );
    sel.setSingleRange(range);
    high.highlightSelection("highlight-ne-"+obj_id.substr(GetSubstringIndex( obj_id,"/",4)+1));
    sel.collapseToEnd();
    sel.detach();
    return $( jqu( ids[0] ) ).closest( ".window" ).attr( "id" );
}
// retrieve and display annotations
async function processNamedEntities( text ) {
    var q = namespaces+`SELECT * WHERE { 
        {
            ?s rdf:type prisms:NamedEntityReference . 
            ?s crm:P1i_identifies ?entity . 
            ?s dcterm:identifier '''`+text+`''' . 
            ?s cnt:bytes ?o . 
            BIND ( rdf:type AS ?p ) BIND ( <default> as ?g ) 
        }
        UNION
        {
            GRAPH `+user+` {
                ?s rdf:type prisms:NamedEntityReference . 
                ?s crm:P1i_identifies ?entity . 
                ?s dcterm:identifier '''`+text+`''' . 
                ?s cnt:bytes ?o . 
                BIND ( rdf:type AS ?p ) BIND ( `+user+` as ?g )
            }
        }
    }`;
    var entities = await getJSONLD( q, "raw" ); // DONE
    var entities_list = [], text_id;
    for (var j = 0; j < entities.length; j++ ) {
        var v = entities[ j ];
        text_id = processW3Centity( JSON.parse( v.o.value ), (("prisms:"+v.g.value.split( '/' )[4] == $.jStorage.get( "prisms-user" ))?true:false) );
        entities_list.push( v.entity.value );
    }
    if ( entities_list.length > 0 ) {
        update_entities( text_id, entities_list, true );
    }
}
async function update_entities( text, list, fresh ) {
    var output = '';
    for (var j = 0; j < list.length; j++ ) {
        var q = namespaces+`SELECT * WHERE { 
            {
                <`+list[j]+`> ?p ?o . 
                BIND ( <`+list[j]+`> AS ?s ) BIND ( <default> as ?g ) 
            }
            UNION
            {
                GRAPH {
                    <`+list[j]+`> ?p ?o . 
                    BIND ( <`+list[j]+`> AS ?s ) BIND ( `+user+` as ?g )
                }
            }
        }`;
        var graph = await getJSONLD( q, "raw" ); // DONE
        var name = skp(graph, list[j], "skos:prefLabel" );
        output += `<li><a href="#`+list[j]+`" class="relsLink">`+name+`</a></li>`;
    }
    if ( fresh ) {
        $( "[id='"+text+"'] .entities_encoded" ).html( output );
    } else {
        $( "[id='"+text+"'] .entities_encoded" ).append( output );
    }
}


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
