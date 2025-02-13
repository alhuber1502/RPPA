// RPPA
// Image tools

var annos = {}, annotorious = {};

// Editing popover: dismiss target and re-enable UI
$( document ).on( "click", ".popover-dismiss-select.img .cancel", async function(e) {
    var tid = $( this ).closest( "[data-tid]" ).data( "tid" );
    $( "[aria-describedby='"+$(this).closest('div.popover').attr( 'id')+"']" ).popover('dispose');
    annotorious[ "viewer_"+(mode == 'edit'?'editing_'+tid:tid) ].cancelSelected();
    viewer[ "viewer_"+(mode == 'edit'?'editing_'+tid:tid) ].gestureSettingsMouse.dragToPan = true;
    viewer[ "viewer_"+(mode == 'edit'?'editing_'+tid:tid) ].gestureSettingsMouse.scrollToZoom = true;
    viewer[ "viewer_"+(mode == 'edit'?'editing_'+tid:tid) ].gestureSettingsMouse.clickToZoom = true;
    viewer[ "viewer_"+(mode == 'edit'?'editing_'+tid:tid) ].gestureSettingsMouse.dblClickToZoom = true;
    viewer[ "viewer_"+(mode == 'edit'?'editing_'+tid:tid) ].gestureSettingsMouse.pinchToZoom = true;
    viewer[ "viewer_"+(mode == 'edit'?'editing_'+tid:tid) ].gestureSettingsMouse.pinchRotate = true;
});
// Editing popover: save target (pass to createW3Cannotorious) and re-enable UI
$( document ).on( "click", ".popover-dismiss-select.img .save", async function(e) {
    var tid = $( this ).closest( "[data-tid]" ).data( "tid" );
    $( "[aria-describedby='"+$(this).closest('div.popover').attr( 'id')+"']" ).popover('dispose');
    createW3Cannotorious( "viewer_"+(mode == 'edit'?'editing_'+tid:tid), viewer[ "viewer_"+(mode == 'edit'?'editing_'+tid:tid) ].currentPage(), dismiss_annotation );
    annotorious[ "viewer_"+(mode == 'edit'?'editing_'+tid:tid) ].saveSelected();
    viewer[ "viewer_"+(mode == 'edit'?'editing_'+tid:tid) ].gestureSettingsMouse.dragToPan = true;
    viewer[ "viewer_"+(mode == 'edit'?'editing_'+tid:tid) ].gestureSettingsMouse.scrollToZoom = true;
    viewer[ "viewer_"+(mode == 'edit'?'editing_'+tid:tid) ].gestureSettingsMouse.clickToZoom = true;
    viewer[ "viewer_"+(mode == 'edit'?'editing_'+tid:tid) ].gestureSettingsMouse.dblClickToZoom = true;
    viewer[ "viewer_"+(mode == 'edit'?'editing_'+tid:tid) ].gestureSettingsMouse.pinchToZoom = true;
    viewer[ "viewer_"+(mode == 'edit'?'editing_'+tid:tid) ].gestureSettingsMouse.pinchRotate = true;
});

var dismiss_annotation = undefined;
// Reading/Editing view: initialize image tools
/*  This function:
    - intitializes the Annotorious OpenSeadragon plugin
    - adds a handler that displays a popover on creation of a selection and disables UI
    - adds a handler that populates the selected page with any available
      annotations (from annos Array, see below)
*/
async function add_image_tools( id, hasStartPage ) {
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
        var anid = $( "[data-id='"+annotation.id+"']" ).closest( 'div[data-expr]' ).attr( 'id' );
        var work = $( "[data-id='"+annotation.id+"']" ).closest( 'div[data-expr]' ).data( 'id' );
        var expr = $( "[data-id='"+annotation.id+"']" ).closest( 'div[data-expr]' ).data( 'expr' );
        $( ".tab-pane.active g[data-id='"+annotation.id+"']" ).popover({
            sanitize: false,
            content: `<a role="button" class="save" data-ids='`+annotation.id+`' data-id="`+anid+`" data-work="`+work+`" data-expr="`+expr+`" style="font-size:18px;margin-left:10px;"><i class="fas fa-save"></i></a>
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
        viewer[ id ].gestureSettingsMouse.dragToPan = false;
        viewer[ id ].gestureSettingsMouse.scrollToZoom = false;
        viewer[ id ].gestureSettingsMouse.clickToZoom = false;
        viewer[ id ].gestureSettingsMouse.dblClickToZoom = false;
        viewer[ id ].gestureSettingsMouse.pinchToZoom = false;
        viewer[ id ].gestureSettingsMouse.pinchRotate = false;
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
        //if ( $( "button.active:contains(Facsimile)" ).length ) { $( ".workbench .bb" ).html( "" ); }
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
                    // (snippet will be useful to keep!)
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

// Editing view: delete a building block from interface and graph, and reload
// building blocks (processGlobalText)
$( document ).on( "click", ".bb-item.img .trash", async function(e) {
    var wid = $( this ).closest( "[data-wid]" ).data( "wid" );
    var tid = $( this ).closest( "[data-tid]" ).data( "tid" );
    var id = $( this ).prev().attr( "id" );
    //    var ids = $( this ).parent().data( "ids" ).split( "," );
    // TODO: replace with delete just from the annos buildingblock array and in
    //       DOM, below is not needed!
    //var update = namespaces+`\nWITH `+user+` DELETE { <`+id+`> ?p ?o . } WHERE { <`+id+`> ?p ?o . } ;\nWITH `+user+` DELETE { ?s ?p <`+id+`> . } WHERE { ?s ?p <`+id+`> . } `;
    //await putTRIPLES( update );
    //    annotorious[ "viewer_"+(mode == 'edit'?'editing_'+tid:tid) ].removeAnnotation( id );
    //    $( this ).parent().remove();
    //processGlobalText( tid, wid );
});
// delete an annotation
/*
async function deleteW3Cannotorious( id, page, annotation ) {
    var update = namespaces+`\nWITH `+user+` DELETE { <`+annotation.id+`> ?p ?o . } WHERE { <`+annotation.id+`> ?p ?o . } ;\nWITH `+user+` DELETE { ?s ?p <`+annotation.id+`> . } WHERE { ?s ?p <`+annotation.id+`> . } `;
    await putTRIPLES( update );
    processImageBuildingBlocks( id );
}
*/

// Editing view: process a new or update an existing annotation
/*  This function
    - creates a building-block (RDF) and stores it in the graph
    - pushes it into the annos Array for the page o be picked up on page change
      by handler
*/
async function createW3Cannotorious( id, page, annotation ) {
    console.log( id, page, annotation );
    // enhance Annotorious W3C annotation
    if ( annotation.hasOwnProperty( "id" ) ) {
        if ( annotation.id.startsWith( '#' ) ) {
            annotation.id = domain+`/id/`+annotation.id.substring(1)+`/buildingblock`;
        }
    } else {
        annotation.id = domain+`/id/`+uuidv4()+`/buildingblock`;        
    }
    // add annotation
    //var update = namespaces+`\nWITH `+user+` DELETE { <`+annotation.id+`> ?p ?o . } WHERE { <`+annotation.id+`> ?p ?o . } ;\nWITH `+user+` DELETE { ?s ?p <`+annotation.id+`> . } WHERE { ?s ?p <`+annotation.id+`> . } `;
    //await putTRIPLES( update );
    // add annotation
    /*
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
    */
    // maybe ALL I need from this part this the below few lines:
    if ( !annos[ id ][ page ] ) { annos[ id ][ page ] = []; }
    annos[ id ][ page ].push( JSON.parse( JSON.stringify( annotation ).replace(/\\"/g,"'") ) );
//    $( "button.active:contains(Facsimile)" ).trigger( "click" );
//    $( ".workbench .bb" ).append( processW3Cannotorious( id, JSON.parse( annotation ) ) );
    viewer[ id ].goToPage( viewer[ id ].currentPage() ); // trigger page click to load page annotations
}

// Editing view: highlight image annotation on hover on list 
$(document ).on('mouseenter', '.bb-item.img', function ( e ) {
    var tid = $( this ).closest( "[data-tid]" ).data( "tid" );
    var id = $( e.currentTarget ).find( "input" ).attr( "id" );
    annotorious[ "viewer_"+(mode == 'edit'?'editing_'+tid:tid) ].selectAnnotation( id );
}).on('mouseleave', '.bb-item.img', function ( e ) {
    var tid = $( this ).closest( "[data-tid]" ).data( "tid" );
    annotorious[ "viewer_"+(mode == 'edit'?'editing_'+tid:tid) ].cancelSelected();
});

// Editing view: process an array of image annotations in pages by populating an
// annos Array which is processed on page change
/*
function processImageBuildingBlocks( id, bb ) {
    annos[ id ] = {};
    for (var j = 0; j < bb.length; j++ ) {
        var v = bb[ j ];
        if ( !annos[ id ][ v["rdfs:note"] ] ) { annos[ id ][ v["rdfs:note"] ] = []; }
        annos[ id ][ v["rdfs:note"] ].push( v );
    }
    viewer[ id ].goToPage( viewer[ id ].currentPage() ); // trigger page click to load page annotations
}
*/