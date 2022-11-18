// RPPA
// Image tools

var annos = {}, annotorious = {};

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
    annotorious[ id ] = OpenSeadragon.Annotorious( viewer[ id ], { widgets:[ 'COMMENT' ] } ); // NB: I'm hiding reply-section of widget in CSS
    annotorious[ id ].setDrawingTool( "polygon" );
    if ( mode == "edit" ) {
        annotorious[ id ].readOnly = false;
    } else {
        annotorious[ id ].readOnly = true;
    }
    // load all annotations for the imageset
    await processImageAnnotations( id );
    // create annotation
    annotorious[ id ].on('createAnnotation', function(annotation) {
        processW3Cannotorious( id, viewer[ id ].currentPage(), annotation );
    });
    // handle updated annotation
    annotorious[ id ].on('updateAnnotation', function(annotation) {
        processW3Cannotorious( id, viewer[ id ].currentPage(), annotation );
    });
    // delete annotation
    annotorious[ id ].on('deleteAnnotation', function(annotation) {
        deleteW3Cannotorious( id, viewer[ id ].currentPage(), annotation );        
    });
    // add notes in readonly or editable mode
    viewer[ id ].addHandler('page', function (viewer) {
        // close open notes
        annotorious[ id ].setAnnotations( [] );
        $( "button.outline" ).trigger( "click" );
        if ( annos[ id ][ viewer.page ] ) {
            // we have notes for this page
            annos[ id ][ viewer.page ].forEach(function( a ) {
                var isCreatedByCurrentUser = (("prisms:"+a.body[0]["creator"].split( '/' )[4] == $.jStorage.get( "prisms-user" ))?true:false);
//                console.log( "prisms:"+a.body[0]["creator"].split( '/' )[4], $.jStorage.get( "prisms-user" ), isCreatedByCurrentUser );
                annotorious[ id ].addAnnotation( a, !isCreatedByCurrentUser ); // true = readonly, false = editable
            });
        }
    });
    // trigger notes display for first image
    if ( hasStartPage ) {
        viewer[ id ].goToPage( hasStartPage );
    } else {
        viewer[ id ].goToPage( 0 );
    }
}

// delete an annotation
async function deleteW3Cannotorious( id, page, annotation ) {
    var update = namespaces+`\nWITH `+user+` DELETE { <`+annotation.id+`> ?p ?o . } WHERE { <`+annotation.id+`> ?p ?o . } ;\nWITH `+user+` DELETE { ?s ?p <`+annotation.id+`> . } WHERE { ?s ?p <`+annotation.id+`> . } `;
    await putTRIPLES( update );
    await processImageAnnotations( id );
}
// process a new or update an existing annotation
async function processW3Cannotorious( id, page, annotation ) {
    // enhance Annotorious W3C annotation
    if ( annotation.id.startsWith( '#' ) ) {
        annotation.id = domain+`/id/`+annotation.id.substring(1)+`/annotation`;
    }
    annotation["creator"] = domain;
    annotation["created"] = ( (annotation.date)?new Date( annotation.date ).toISOString():new Date().toISOString() );
    annotation["modified"] = new Date().toISOString();
    annotation["dcterm:identifier"] = id;
    annotation.body[0]["skos:prefLabel"] = "Image annotation";
    annotation.body[0]["skos:altLabel"] = "Level 1";
    annotation.body[0]["value"] = annotation.body[0].value.replace(/"/g,'&quot;').replace(/(\r\n|\n|\r|\t|\f)/gm,"\\\\n");
    annotation.body[0]["rights"] = "http://creativecommons.org/licenses/by-nc-sa/4.0/";
    annotation.body[0]["creator"] = domain+"/prisms/"+$.jStorage.get( "prisms-user" ).split( ":" )[1];
    annotation.body[0]["created"] = ( (annotation.body[0]["created"])?new Date( annotation.body[0]["created"] ).toISOString():new Date().toISOString() );
    annotation.body[0]["modified"] = new Date().toISOString();
    annotation.target.source = ( (viewer[ id ].tileSources[page].url)?viewer[ id ].tileSources[page].url:viewer[ id ].tileSources[page]["@id"] ); // IMG||IIIF
    // add annotation
    var update = namespaces+`\nWITH `+user+` DELETE { <`+annotation.id+`> ?p ?o . } WHERE { <`+annotation.id+`> ?p ?o . } ;\nWITH `+user+` DELETE { ?s ?p <`+annotation.id+`> . } WHERE { ?s ?p <`+annotation.id+`> . } `;
    await putTRIPLES( update );
    update = namespaces+"insert data {\n";
    update += `GRAPH `+user+` { <`+annotation.id+`> a prisms:Annotation, cnt:ContentAsText ;\n`;
    update += `dcterm:identifier """`+id+`""" ;\n`;
    update += `rdfs:note "`+page+`"^^xs:integer ;\n`;
    update += `skos:prefLabel """Image #`+page+`""" ;\n`;
    update += `crm:P1_is_identified_by """Image annotation""" ;\n`;
    update += `dcterm:title """`+$( "#objects [data-id='"+id.substr(0, GetSubstringIndex(id,"/",5))+"'] .k-card-title" ).text()+`""" ;\n`;
    update += `skos:altLabel """Image annotation""" ;\n`;
    update += `cnt:characterEncoding "UTF-8" ;\n`;
    update += `cnt:bytes """`+JSON.stringify( annotation ).replace(/\\"/g,'\\\\"')+`""" ;\n`;
    update += `dcterm:created """`+( (annotation.date)?new Date( annotation.date ).toISOString():new Date().toISOString() )+`""" ;\n`;
    update += `crm:P2_has_type prisms:Annotation ;\n`;
    update += `crm:P3_has_note """`+annotation.body[0].value.replace(/"/g,'&quot;').replace(/(\r\n|\n|\r|\t|\f)/gm,"\\\\n")+`""" ;\n`;
    update += `. }\n}`;
    await putTRIPLES( update );
    if ( $.jStorage.get( "prisms-user-public" ) ) {
        publish( annotation.id );
    }
    await processImageAnnotations( id );
}
// retrieve and store annotations
async function processImageAnnotations( id ) {
    annos[ id ] = {};
    var q = namespaces+`SELECT * WHERE { 
        {
            ?s rdf:type prisms:Annotation . 
            ?s dcterm:identifier '''`+id+`''' . 
            ?s rdfs:note ?page . 
            ?s cnt:bytes ?o . 
            BIND ( rdf:type AS ?p ) BIND ( <default> AS ?g ) 
        } UNION {
            GRAPH `+user+` {
                ?s rdf:type prisms:Annotation . 
                ?s dcterm:identifier '''`+id+`''' . 
                ?s rdfs:note ?page . 
                ?s cnt:bytes ?o . 
                BIND ( rdf:type AS ?p ) BIND ( `+user+` AS ?g )
            }
        }
    }`;
    var annotations = await getJSONLD( q, "raw" ); // DONE
    for (var j = 0; j < annotations.length; j++ ) {
        var v = annotations[ j ];
        if ( !annos[ id ][ v.page.value ] ) { annos[ id ][ v.page.value ] = []; }
        annos[ id ][ v.page.value ].push( JSON.parse( v.o.value ) );
    }
}
