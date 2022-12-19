// RPPA
// Media tools

// dismiss target
$( document ).on( "click", ".popover-dismiss-select.med .cancel", async function(e) {
    $( "[aria-describedby='"+$(this).closest('div.popover').attr( 'id')+"']" ).popover('dispose');
    if ( dismiss_region ) { dismiss_region.remove(); }
    wavesurfer.enableDragSelection({
        color: 'rgb(74, 186, 159,.2)',
        resize: false,
        drag: false
    }); // sound
});
// save target
$( document ).on( "click", ".popover-dismiss-select.med .save", async function(e) {
    $( "[aria-describedby='"+$(this).closest('div.popover').attr( 'id')+"']" ).popover('dispose');
    createW3CannoMedia( $( this ).data("sel"), $( this ).data("ids"), $( this ).data("id"), $( this ).data("work"), $( this ).data("expr"), $( this ).data("start"), $( this ).data("end") );
    wavesurfer.enableDragSelection({
        color: 'rgb(74, 186, 159,.2)',
        resize: false,
        drag: false
    }); // sound
});

// highlight 
$(document ).on('mouseenter', '.bb-item.med label', function ( e ) {
    var id = $( e.currentTarget ).prevAll( "input" ).attr( "id" );
    wavesurfer.regions.list[ id ].play()
}).on('mouseleave', '.bb-item.med label', function ( e ) {
    wavesurfer.stop()
});

// create, store, and process annotation
async function createW3CannoMedia( target, ids, obj_id, work, expr, start, end ) {
    var date = new Date();
    wavesurfer.regions.list[ ids ].remove();
    var id = domain+`/id/`+uuidv4()+`/buildingblock`;
    var W3Canno = `{
        "@context": "http://www.w3.org/ns/anno.jsonld",
        "id": "`+id+`",
        "type": "Annotation",
        "creator": "`+user+`",
        "created": "`+date.toISOString()+`",
        "skos:prefLabel": "`+target+`",
        "dcterms:identifier": "`+obj_id+`",
        "dcterms:relation": "`+work+`",
        "dcterms:source": "`+expr+`",
        "motivation": "highlighting",
        "target": [
          { "source": "`+obj_id+`",
            "type": "Sound",
            "format": "lct:aud",
            "language": "`+$( ".text .tab-content .active" ).attr( "lang" )+`",
            "selector": [
            {
                "type": "FragmentSelector",
                "conformsTo": "http://www.w3.org/TR/media-frags/",
                "value": "t=`+Math.round( start )+`,`+Math.round( end )+`"
            }
            ]
          }
        ]
    }`;
    // add annotation
    var update = namespaces+"insert data {\n";
    update += `GRAPH `+user+` { <`+id+`> a rppa:BuildingBlock, cnt:ContentAsText ;\n`;
    update += `dcterm:identifier """`+obj_id+`""" ;\n`;
    update += `dcterm:relation """`+work+`""" ;\n`;
    update += `dcterm:source """`+expr+`""" ;\n`;
    update += `cnt:characterEncoding "UTF-8" ;\n`;
    update += `crm:P2_has_type lct:aud ;\n`;
    update += `cnt:bytes """`+JSON.stringify(JSON.parse( W3Canno ))+`""" ;\n`;
    update += `dcterm:created """`+date.toISOString()+`""" ;\n`;
    update += `. }\n}`;
    await putTRIPLES( update );
    $( ".workbench .bb" ).append( processW3CannoMedia( JSON.parse( W3Canno ) ) );
}

// create annotaion display and anchor
function processW3CannoMedia( annotation ) {
    bb_id = annotation.id;
    if ( !wavesurfer.regions.list.hasOwnProperty( bb_id ) ) {
        var default_region = annotation.target[0].selector[0].value.split( 't=' )[1].split(',');
        wavesurfer.addRegion( {"id":bb_id,"drag":false,"resize":false,"start":default_region[0],"end":default_region[1],"color":randomColor(0.1)} );
    }
    return `<li class="bb-item med" data-ids="`+annotation.target[0].selector[0].value.split( "," )+`" data-expr="`+annotation['dcterms:source']+`">
        <input type="checkbox" id="`+bb_id+`" name="`+bb_id+`">
        <i class="far fa-trash-alt trash" style="cursor:pointer;"></i>
        <button class="btn btn-sm" style="--bs-btn-padding-y:.15rem;--bs-btn-padding-x:.45rem;--bs-btn-font-size:.75rem;vertical-align:top;" onclick="wavesurfer.regions.list['`+annotation.id+`'].play()">
            <i class="fa fa-play"></i>
        </button>
        <button class="btn btn-sm" style="--bs-btn-padding-y:.15rem;--bs-btn-padding-x:.45rem;--bs-btn-font-size:.75rem;vertical-align:top;" onclick="wavesurfer.stop()">
            <i class="fas fa-stop"></i>
        </button>
        <label for="`+bb_id+`">`+annotation['skos:prefLabel'].replace(/&quot;/g,'"').replace(/(\\r\\n|\\n|\\r|\\t|\\f)/gm," / ")+`</label></li>` ;
}

// delete annotation
$( document ).on( "click", ".bb-item.med .trash", async function(e) {
    var wid = $( this ).closest( "[data-wid]" ).data( "wid" );
    var id = $( this ).prev().attr( "id" );
    var update = namespaces+`\nWITH `+user+` DELETE { <`+id+`> ?p ?o . } WHERE { <`+id+`> ?p ?o . } ;\nWITH `+user+` DELETE { ?s ?p <`+id+`> . } WHERE { ?s ?p <`+id+`> . } `;
    await putTRIPLES( update );
    wavesurfer.regions.list[ id ].remove();
    wavesurfer.stop();
    processGlobalText( "", wid );
});

// retrieve and display annotations
function processMediaBuildingBlocks( bb ) {
    for (var j = 0; j < bb.length; j++ ) {
        $( ".workbench .bb" ).append( processW3CannoMedia( JSON.parse( bb[ j ][ "cnt:bytes" ].replace(/&quot;/g,'"').replace(/(\r\n|\n|\r|\t|\f)/gm," / ") ) ) );
    }
    wavesurfer.drawBuffer();
}