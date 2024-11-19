// RPPA
// Image tools

var annos = {}, annotorious = {};

// dismiss target
$( document ).on( "click", ".popover-dismiss-select.img .cancel", async function(e) {
    $( "[aria-describedby='"+$(this).closest('div.popover').attr( 'id')+"']" ).popover('dispose');
    annotorious[ Object.keys(annotorious) ].cancelSelected();
    viewer[ Object.keys( viewer ) ].gestureSettingsMouse.dragToPan = true;
    viewer[ Object.keys( viewer ) ].gestureSettingsMouse.scrollToZoom = true;
    viewer[ Object.keys( viewer ) ].gestureSettingsMouse.clickToZoom = true;
    viewer[ Object.keys( viewer ) ].gestureSettingsMouse.dblClickToZoom = true;
    viewer[ Object.keys( viewer ) ].gestureSettingsMouse.pinchToZoom = true;
    viewer[ Object.keys( viewer ) ].gestureSettingsMouse.pinchRotate = true;
});
// save target
$( document ).on( "click", ".popover-dismiss-select.img .save", async function(e) {
    $( "[aria-describedby='"+$(this).closest('div.popover').attr( 'id')+"']" ).popover('dispose');
    createW3Cannotorious( Object.keys( viewer ), viewer[ Object.keys( viewer ) ].currentPage(), dismiss_annotation );
    annotorious[ Object.keys( viewer ) ].saveSelected();
    viewer[ Object.keys( viewer ) ].gestureSettingsMouse.dragToPan = true;
    viewer[ Object.keys( viewer ) ].gestureSettingsMouse.scrollToZoom = true;
    viewer[ Object.keys( viewer ) ].gestureSettingsMouse.clickToZoom = true;
    viewer[ Object.keys( viewer ) ].gestureSettingsMouse.dblClickToZoom = true;
    viewer[ Object.keys( viewer ) ].gestureSettingsMouse.pinchToZoom = true;
    viewer[ Object.keys( viewer ) ].gestureSettingsMouse.pinchRotate = true;
});

var dismiss_annotation = undefined;
// main
async function add_image_tools( id, hasStartPage ) {
    /*
    $( "[id='"+jqu( id )+"'] .slide-in-tool" ).append( `<div class="tools"><h1 class="info">Pages/Images</h1></div>` );
    viewer[ id ].addHandler( "page", function (data) {
    	$( "[id='"+jqu( id )+"'] .slide-in-tool .myImageCount" ).html( "Image #" + ( data.page + 1 ) + " of " + viewer[ id ].tileSources.length );
    });
    $( "[id='"+jqu( id )+"'] .slide-in-tool .tools" ).append( `<div class="bibl image"><span class="label">Navigation</span><p><span class="k-icon k-i-arrow-end-left"></span><span class="k-icon k-i-arrow-double-60-left"></span><span class="k-icon k-i-arrow-60-left"></span><span class="myImageCount"></span><span class="k-icon k-i-arrow-60-right"></span><span class="k-icon k-i-arrow-double-60-right"></span><span class="k-icon k-i-arrow-end-right"></span></p></div>` );
    $( "[id='"+jqu( id )+"'] .slide-in-tool .myImageCount" ).html( "Image #1 of " + viewer[ id ].tileSources.length );

    $( "[id='"+jqu( id )+"'] .slide-in-tool .tools" ).append( `<h1 class="info">Annotations</h1><div class="bibl"><p>Draw a <i class="fas fa-draw-polygon"></i> polygon (hold <code>SHIFT</code> while clicking and dragging; double-click to complete) on any image to add an <span style="border-bottom:2px solid #333;">annotation</span>.</p></div>` );
    */
    // Initialize the Annotorious plugin
    annos[ id ] = {};
    annotorious[ id ] = OpenSeadragon.Annotorious( viewer[ id ], { disableSelect: true, disableEditor:true, allowEmpty: true} );
    annotorious[ id ].setDrawingTool( "rect" );
    if ( mode == "edit" ) {
        annotorious[ id ].readOnly = false;
    } else {
        annotorious[ id ].readOnly = true;
    }
    // handlers
    // create annotation
    
//    annotorious[ id ].on('createAnnotation', function(annotation) {
//        createW3Cannotorious( id, viewer[ id ].currentPage(), annotation );
//        annotorious[ id ].saveSelected();
//    });
    annotorious[ id ].on('createSelection', function(annotation) {
        var id = $( "[data-id='"+annotation.id+"']" ).closest( 'div[data-expr]' ).attr( 'id' );
        var work = $( "[data-id='"+annotation.id+"']" ).closest( 'div[data-expr]' ).data( 'id' );
        var expr = $( "[data-id='"+annotation.id+"']" ).closest( 'div[data-expr]' ).data( 'expr' );
        $( ".tab-pane.active g[data-id='"+annotation.id+"']" ).popover({
            sanitize: false,
            content: `<a role="button" class="save" data-ids='`+annotation.id+`' data-id="`+id+`" data-work="`+work+`" data-expr="`+expr+`" style="font-size:18px;margin-left:10px;"><i class="fas fa-save"></i></a>
                <a role="button" class="cancel" style="font-size:20px;margin:0 10px;"><i class="fas fa-close"></i></a>`,
            html: true,
            placement: 'auto',
            container: '.globaltext',
            template: `<div class="popover popover-dismiss-select img" role="popover" tabindex="0" data-trigger="focus" style="opacity:.85;">
                <div class="popover-arrow"></div>
                <div class="popover-body"></div>
            </div>`
        })
        dismiss_select = $( ".tab-pane.active g[data-id='"+annotation.id+"']" ).popover('show');
        dismiss_select.popover('toggleEnabled'); // disable toggling
        dismiss_annotation = annotation;
        viewer[ Object.keys( viewer ) ].gestureSettingsMouse.dragToPan = false;
        viewer[ Object.keys( viewer ) ].gestureSettingsMouse.scrollToZoom = false;
        viewer[ Object.keys( viewer ) ].gestureSettingsMouse.clickToZoom = false;
        viewer[ Object.keys( viewer ) ].gestureSettingsMouse.dblClickToZoom = false;
        viewer[ Object.keys( viewer ) ].gestureSettingsMouse.pinchToZoom = false;
        viewer[ Object.keys( viewer ) ].gestureSettingsMouse.pinchRotate = false;
    });
    // handle updated annotation
//    annotorious[ id ].on('updateAnnotation', function(annotation) {
//        createW3Cannotorious( id, viewer[ id ].currentPage(), annotation );
//        annotorious[ id ].saveSelected();
//    });
    // delete annotation
//    annotorious[ id ].on('deleteAnnotation', function(annotation) {
//        deleteW3Cannotorious( id, viewer[ id ].currentPage(), annotation );
//        annotorious[ id ].removeAnnotation( annotation );
//    });
    // add notes in readonly or editable mode
    viewer[ id ].addHandler('page', function (viewer) {
        // close open notes
        annotorious[ id ].setAnnotations( [] );
        if ( $( "button.active:contains(Facsimile)" ).length ) { $( ".workbench .bb" ).html( "" ); }
        if ( annos[ id ][ viewer.page ] ) {
            // we have notes for this page
            setTimeout(function done() {
                annos[ id ][ viewer.page ].forEach(function( a ) {
                    var annotation = {};
                    if ( !a.hasOwnProperty("target") ) {
                        annotation.id = a.id;
                        annotation["@context"] = "http://www.w3.org/ns/anno.jsonld";
                        annotation.type = "Selection";
                        annotation["dcterms:isPartOf"] = a["dcterms:isPartOf"].id;
                        annotation.body = [];
                        annotation.target = {};
                        annotation.target.selector = {};
                        annotation.target.selector.type = a["oa:hasTarget"][0]["oa:hasSelector"]["type"].split( ":" )[1];
                        annotation.target.selector.value = a["oa:hasTarget"][0]["oa:hasSelector"]["rdf:value"];
                        annotation.target.selector.conformsTo = a["oa:hasTarget"][0]["oa:hasSelector"]["dcterms:conformsTo"].id;
                        //annotation.target.source = ( (viewer[ id ].tileSources[page].url)?viewer[ id ].tileSources[page].url:viewer[ id ].tileSources[page]["@id"] ); // IMG||IIIF
    //                var isCreatedByCurrentUser = (("prisms:"+a.body[0]["creator"].split( '/' )[4] == user)?true:false);
    //                console.log( "prisms:"+a.body[0]["creator"].split( '/' )[4], $.jStorage.get( "prisms-user" ), isCreatedByCurrentUser );
                    } else {
                        annotation = a;
                    }
                    annotorious[ id ].addAnnotation( annotation, true ); // true = readonly, false = editable
                    const { snippet, transform } = annotorious[ id ].getImageSnippetById( annotation.id );
                    $( ".workbench .bb" ).append( `<li class="bb-item img" data-ids="`+annotation.target.selector.value.replace(/\"/g,'\\"')+`" data-expr="`+annotation['dcterms:isPartOf']+`">
                            <input type="checkbox" id="`+annotation.id+`" name="`+annotation.id+`">
                            <i class="far fa-trash-alt trash" style="cursor:pointer;"></i>` );
                    $( ".workbench .bb [id='"+annotation.id+"']" ).parent().append( snippet );
                });
            }, 250);
        }
    });
    // trigger notes display for first image
    if ( hasStartPage ) {
        viewer[ id ].goToPage( hasStartPage );
    } else {
        viewer[ id ].goToPage( 0 );
    }
}

// delete annotation
$( document ).on( "click", ".bb-item.img .trash", async function(e) {
    var wid = $( this ).closest( "[data-wid]" ).data( "wid" );
    var id = $( this ).prev().attr( "id" );
//    var ids = $( this ).parent().data( "ids" ).split( "," );
    var update = namespaces+`\nWITH `+user+` DELETE { <`+id+`> ?p ?o . } WHERE { <`+id+`> ?p ?o . } ;\nWITH `+user+` DELETE { ?s ?p <`+id+`> . } WHERE { ?s ?p <`+id+`> . } `;
    await putTRIPLES( update );
//    annotorious[ Object.keys(annotorious) ].removeAnnotation( id );
//    $( this ).parent().remove();
    processGlobalText( "", wid );
});
// delete an annotation
/*
async function deleteW3Cannotorious( id, page, annotation ) {
    var update = namespaces+`\nWITH `+user+` DELETE { <`+annotation.id+`> ?p ?o . } WHERE { <`+annotation.id+`> ?p ?o . } ;\nWITH `+user+` DELETE { ?s ?p <`+annotation.id+`> . } WHERE { ?s ?p <`+annotation.id+`> . } `;
    await putTRIPLES( update );
    processImageAnnotations( id );
}
*/
// process a new or update an existing annotation
async function createW3Cannotorious( id, page, annotation ) {
    // enhance Annotorious W3C annotation
    if ( annotation.hasOwnProperty( "id" ) ) {
        if ( annotation.id.startsWith( '#' ) ) {
            annotation.id = domain+`/id/`+annotation.id.substring(1)+`/buildingblock`;
        }
    } else {
        annotation.id = domain+`/id/`+uuidv4()+`/buildingblock`;        
    }
    // add annotation
    var update = namespaces+`\nWITH `+user+` DELETE { <`+annotation.id+`> ?p ?o . } WHERE { <`+annotation.id+`> ?p ?o . } ;\nWITH `+user+` DELETE { ?s ?p <`+annotation.id+`> . } WHERE { ?s ?p <`+annotation.id+`> . } `;
    await putTRIPLES( update );
    // add annotation
    var update = namespaces+"insert data {\n";
    update += `GRAPH `+user+` \n{` 
    var quads = `<`+annotation.id+`> a rppa:BuildingBlock, oa:Annotation ;\n`;
    quads += `dcterms:relation <`+$( ".globaltext button.active" ).data( "work" )+`> ;\n`;
    quads += `dcterms:isPartOf <`+$( ".globaltext button.active" ).data( "expr" )+`> ;\n`;
    quads += `crm:P2_has_type lct:img ;\n`;
    quads += `rdfs:note "`+page+`"^^xsd:integer ;\n`;
    quads += `dcterms:contributor `+user+` ;\n`;
    quads += `dcterms:created "`+( (annotation.date)?new Date( annotation.date ).toISOString():new Date().toISOString() )+`" ;\n`;
    quads += `as:generator <`+domain+`> ;\n`;
    quads += `skos:prefLabel """Image #`+page+`""" ;\n`;
    quads += `skos:altLabel """Image annotation""" ;\n`;
    quads += `oa:motivatedBy oa:highlighting ;\n` ;
    quads += `oa:hasTarget [
        dcterms:type dctypes:Image ;
        dc:format lct:img ;
        dc:language "`+$( ".globaltext .tab-content .active" ).attr( "lang" )+`" ;
        oa:hasSelector [
            rdf:type oa:FragmentSelector ;
            dcterms:conformsTo <http://www.w3.org/TR/media-frags/> ;
            rdf:value """`+annotation.target.selector.value+`""" ;
        ] ;
        oa:hasSource <`+$( ".globaltext .tab-content .active div" ).attr( "id" )+`> ;
    ] ;\n.` ;
    update += quads;
    update += `}\n}`;
    await putTRIPLES( update );
    if ( !annos[ id ][ page ] ) { annos[ id ][ page ] = []; }
    annos[ id ][ page ].push( JSON.parse( JSON.stringify( annotation ).replace(/\\"/g,"'") ) );
//    $( "button.active:contains(Facsimile)" ).trigger( "click" );
//    $( ".workbench .bb" ).append( processW3Cannotorious( id, JSON.parse( annotation ) ) );
    viewer[ id ].goToPage( viewer[ id ].currentPage() ); // trigger page click to load page annotations
}

// highlight 
$(document ).on('mouseenter', '.bb-item.img', function ( e ) {
    var id = $( e.currentTarget ).find( "input" ).attr( "id" );
    annotorious[ Object.keys(annotorious) ].selectAnnotation( id );
}).on('mouseleave', '.bb-item.img', function ( e ) {
    annotorious[ Object.keys(annotorious) ].cancelSelected();
});

// retrieve and populate annotations in pages
function processImageAnnotations( id, bb ) {
    annos[ id ] = {};
    for (var j = 0; j < bb.length; j++ ) {
        var v = bb[ j ];
        if ( !annos[ id ][ v["rdfs:note"] ] ) { annos[ id ][ v["rdfs:note"] ] = []; }
        annos[ id ][ v["rdfs:note"] ].push( v );
    }
    viewer[ id ].goToPage( viewer[ id ].currentPage() ); // trigger page click to load page annotations
}
