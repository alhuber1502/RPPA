// RPPA
// Media tools

// dismiss target
$( document ).on( "click", ".popover-dismiss-select.med .cancel", async function(e) {
    $( "[aria-describedby='"+$(this).closest('div.popover').attr( 'id')+"']" ).popover('dispose');
    if ( dismiss_region ) { dismiss_region.remove(); }
    player[ Object.keys( player ) ].enableDragSelection({
        color: 'rgb(74, 186, 159,.2)',
        resize: false,
        drag: false
    }); // sound
});
// save target
$( document ).on( "click", ".popover-dismiss-select.med .save", async function(e) {
    $( "[aria-describedby='"+$(this).closest('div.popover').attr( 'id')+"']" ).popover('dispose');
    createW3CannoMedia( $( this ).data("sel"), $( this ).data("ids"), $( this ).data("id"), $( this ).data("work"), $( this ).data("expr"), $( this ).data("start"), $( this ).data("end") );
    player[ Object.keys( player ) ].enableDragSelection({
        color: 'rgb(74, 186, 159,.2)',
        resize: false,
        drag: false
    }); // sound
});

// highlight 
$(document ).on('mouseenter', '.bb-item.med label', function ( e ) {
    var id = $( e.currentTarget ).prevAll( "input" ).attr( "id" );
    if (!player[ Object.keys( player ) ].isPlaying()) {
        player[ Object.keys( player ) ].regions.list[ id ].play()
    }
    }).on('mouseleave', '.bb-item.med label', function ( e ) {
//    player[ Object.keys( player ) ].stop()
});

// create, store, and process annotation
async function createW3CannoMedia( target, ids, obj_id, work, expr, start, end ) {
    var date = new Date();
    player[ Object.keys( player ) ].regions.list[ ids ].remove();
    var id = domain+`/id/`+uuidv4()+`/buildingblock`;
    // add annotation
    var update = namespaces+"insert data {\n";
    update += `GRAPH `+user+` \n{` 
    var quads = `<`+id+`> a rppa:BuildingBlock, oa:Annotation ;\n`;
    quads += `dcterms:relation <`+work+`> ;\n`;
    quads += `dcterms:isPartOf <`+expr+`> ;\n`;
    quads += `crm:P2_has_type lct:aud ;\n`;
    quads += `dcterms:contributor `+user+` ;\n`;
    quads += `dcterms:created "`+date.toISOString()+`" ;\n`;
    quads += `as:generator <`+domain+`> ;\n`;
    quads += `skos:prefLabel "`+target+`" ;\n`;
    quads += `oa:motivatedBy oa:highlighting ;\n` ;
    quads += `oa:hasTarget [
        dcterms:type dctypes:Sound ;
        dc:format lct:aud ;
        dc:language "`+$( ".globaltext .tab-content .active" ).attr( "lang" )+`" ;
        oa:hasSelector [
            rdf:type oa:FragmentSelector ;
            dcterms:conformsTo <http://www.w3.org/TR/media-frags/> ;
            rdf:value "t=`+Number(start).toFixed(2)+`,`+Number(end).toFixed(2)+`" ;
        ] ;
        oa:hasSource <`+obj_id+`> ;
    ] ;\n.` ;
    update += quads;
    update += `}\n}`;
    await putTRIPLES( update );
    var liveanno = {};
    liveanno.id = id;
    liveanno["oa:hasTarget"] = [];
    liveanno["oa:hasTarget"][0] = {};
    liveanno["oa:hasTarget"][0]["oa:hasSelector"] = {};
    liveanno["oa:hasTarget"][0]["oa:hasSelector"]["rdf:value"] = `t=`+Number(start).toFixed(2)+`,`+Number(end).toFixed(2);
    liveanno['dcterms:isPartOf'] = {};
    liveanno['dcterms:isPartOf'].id = expr;
    liveanno['skos:prefLabel'] = target;
    $( ".workbench .bb" ).append( processW3CannoMedia( liveanno ) );
}

// create annotation display and anchor
function processW3CannoMedia( annotation ) {
    bb_id = annotation.id;
    if ( !player[ Object.keys( player ) ].regions.list.hasOwnProperty( bb_id ) ) {
        var default_region = annotation["oa:hasTarget"][0]["oa:hasSelector"]["rdf:value"].split( 't=' )[1].split(',');
        player[ Object.keys( player ) ].addRegion( {"id":bb_id,"drag":false,"resize":false,"start":default_region[0],"end":default_region[1],"color":randomColor(0.1)} );
    }
    return `<li class="bb-item med" data-ids="`+annotation["oa:hasTarget"][0]["oa:hasSelector"]["rdf:value"].split( "," )+`" data-expr="`+annotation['dcterms:isPartOf'].id+`">
        <input type="checkbox" id="`+bb_id+`" name="`+bb_id+`">
        <i class="far fa-trash-alt trash" style="cursor:pointer;"></i>
        <button class="btn btn-sm" style="--bs-btn-padding-y:.15rem;--bs-btn-padding-x:.45rem;--bs-btn-font-size:.75rem;vertical-align:top;" onclick="player[ '`+Object.keys( player )+`' ].regions.list['`+annotation.id+`'].play()">
            <i class="fa fa-play"></i>
        </button>
        <button class="btn btn-sm" style="--bs-btn-padding-y:.15rem;--bs-btn-padding-x:.45rem;--bs-btn-font-size:.75rem;vertical-align:top;" onclick="player[ '`+Object.keys( player )+`' ].stop()">
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
    player[ Object.keys( player ) ].regions.list[ id ].remove();
    player[ Object.keys( player ) ].stop();
    processGlobalText( "", wid );
});

// retrieve and display annotations
function processMediaBuildingBlocks( bb ) {
    for (var j = 0; j < bb.length; j++ ) {
        $( ".workbench .bb" ).append( processW3CannoMedia( bb[ j ] ) );
    }
    player[ Object.keys( player ) ].drawBuffer();
}