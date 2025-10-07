// RPPA
// Media tools

// Editing popover: dismiss target and re-enable selectability
$( document ).on( "click", ".popover-dismiss-select.med .cancel", async function(e) {
    var iid = $( this ).data( "id" );
    $( "[aria-describedby='"+$(this).closest('div.popover').attr( 'id')+"']" ).popover('dispose');
    if ( dismiss_region ) { dismiss_region.remove(); }
    player[ "player_"+(mode == 'edit'?'editing_'+iid:(mode == 'view')?'viewing_'+iid:iid) ].enableDragSelection({
        color: 'rgb(74, 186, 159,.2)',
        resize: false,
        drag: false
    }); // sound
});
// Editing popover: save target and re-enable selectability
$( document ).on( "click", ".popover-dismiss-select.med .save", async function(e) {
    var tid = $( this ).data( "tid" );
    var iid = $( this ).data( "id" );
    $( "[aria-describedby='"+$(this).closest('div.popover').attr( 'id')+"']" ).popover('dispose');
    createW3CannoMedia( iid, tid, $( this ).data("sel"), $( this ).data("ids"), $( this ).data("id"), $( this ).data("digo"), $( this ).data("work"), $( this ).data("expr"), $( this ).data("start"), $( this ).data("end"), $(this) );
    player[ "player_"+(mode == 'edit'?'editing_'+iid:(mode == 'view')?'viewing_'+iid:iid) ].enableDragSelection({
        color: 'rgb(74, 186, 159,.2)',
        resize: false,
        drag: false
    }); // sound
});

// Editing view: highlight building-block (i.e. play it)
$(document ).on('mouseenter', '.bb-item.med label', function ( e ) {
    var iid = $( this ).closest( "[data-iid]" ).data( "iid" );
    var id = $( e.currentTarget ).prevAll( "input" ).attr( "id" );
    if ( $( "button.active" ).data( "expr" ) != $( e.currentTarget ).closest( "[data-expr]" ).data( "expr" ) ) {
        $( "button[data-expr='"+$( e.currentTarget ).closest( "[data-expr]" ).data( "expr" )+"']" ).trigger('click');
    }
    
    if (!player[ "player_"+(mode == 'edit'?'editing_'+iid:(mode == 'view')?'viewing_'+iid:iid) ].isPlaying()) {
        player[ "player_"+(mode == 'edit'?'editing_'+iid:(mode == 'view')?'viewing_'+iid:iid) ].regions.list[ id ].element.scrollIntoViewIfNeeded();
    }
    
    }).on('mouseleave', '.bb-item.med label', function ( e ) {
//    player[ "player_"+(mode == 'edit'?'editing_'+iid:iid) ].stop()
});

// Editing view: create, store, and process annotation
/*  This function
    - removes the building-block from the regions
    - creates a building-block (RDF) and stores it in the graph
    - creates a minimal live version of the building-block to list/highlight
*/
async function createW3CannoMedia( iid, tid, target, ids, obj_id, digo, work, expr, start, end, _this ) {
    // this is obsolete, except for liveanno part below
    //console.log(  iid, tid, target, ids, obj_id, work, expr, start, end  );
    var date = new Date();
    player[ "player_"+(mode == 'edit'?'editing_'+iid:(mode == 'view')?'viewing_'+iid:iid) ].regions.list[ ids ].remove();
    var id = domain+`/id/`+uuidv4()+`/buildingblock`;
    // add annotation
    /*
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
    */
    // only relevant part 
    var liveanno = {};
    liveanno.id = id;
    liveanno.iid = iid;
    liveanno.tid = tid;
    liveanno["oa:hasTarget"] = [];
    liveanno["oa:hasTarget"][0] = {};
    liveanno["oa:hasTarget"][0]["oa:hasSelector"] = {};
    liveanno["oa:hasTarget"][0]["oa:hasSelector"]["rdf:value"] = `t=`+Number(start).toFixed(2)+`,`+Number(end).toFixed(2);
    liveanno['dcterms:isPartOf'] = {};
    liveanno['dcterms:isPartOf'].id = expr;
    liveanno['dcterms:isPartOf'].wid = work;
    liveanno['dcterms:isPartOf'].oid = digo;
    liveanno['skos:prefLabel'] = target;
    if ( $( "[id='"+_this.data("id")+"']" ).closest( ".globalcontext" ).length ) {
        bbs_context.append( processW3CannoMedia( liveanno ) );
    } else {
        bbs_text.append( processW3CannoMedia( liveanno ) );
    }
}

// Editing view: create annotation list display and basic UI buttons
function processW3CannoMedia( annotation ) {
    var iid = annotation.iid;
    var tid = annotation.tid;

    bb_id = annotation.id;
    if ( !player[ "player_"+(mode == 'edit'?'editing_'+iid:(mode == 'view')?'viewing_'+iid:iid) ].regions.list.hasOwnProperty( bb_id ) ) {
        var default_region = annotation["oa:hasTarget"][0]["oa:hasSelector"]["rdf:value"].split( 't=' )[1].split(',');
        player[ "player_"+(mode == 'edit'?'editing_'+iid:(mode == 'view')?'viewing_'+iid:iid) ].addRegion( {"id":bb_id,"drag":false,"resize":false,"start":default_region[0],"end":default_region[1],"color":randomColor(0.1)} );
    }
    return `<li class="bb-item med" data-iid="`+iid+`" data-ids="`+annotation["oa:hasTarget"][0]["oa:hasSelector"]["rdf:value"].split( "," )+`" data-expr="`+annotation['dcterms:isPartOf'].id+`" data-wid="`+annotation['dcterms:isPartOf'].wid+`" data-digo="`+annotation['dcterms:isPartOf'].oid+`">
        <input type="checkbox" id="`+bb_id+`" name="`+bb_id+`">
        <i class="far fa-trash-alt trash" style="cursor:pointer;"></i>
        <label for="`+bb_id+`">`+
        `<button class="btn btn-sm" style="--bs-btn-padding-y:.15rem;--bs-btn-padding-x:.45rem;--bs-btn-font-size:.75rem;vertical-align:top;" onclick="player[ '`+"player_"+(mode == 'edit'?'editing_'+iid:(mode == 'view')?'viewing_'+iid:iid)+`' ].regions.list['`+annotation.id+`'].play()">
            <i class="fa fa-play"></i>
        </button>
        <button class="btn btn-sm" style="--bs-btn-padding-y:.15rem;--bs-btn-padding-x:.45rem;--bs-btn-font-size:.75rem;vertical-align:top;" onclick="player[ '`+"player_"+(mode == 'edit'?'editing_'+iid:(mode == 'view')?'viewing_'+iid:iid)+`' ].stop()">
            <i class="fas fa-stop"></i>
        </button>&nbsp;`
        +annotation['skos:prefLabel'].replace(/&quot;/g,'"').replace(/(\\r\\n|\\n|\\r|\\t|\\f)/gm," / ")+`</label></li>` ;
}

// Editing view: delete annotation 
$( document ).on( "click", ".bb-item.med .trash", async function(e) {
    var iid = $( this ).closest( "[data-iid]" ).data( "iid" );
    var id = $( this ).prev().attr( "id" );
    //var update = namespaces+`\nWITH `+user+` DELETE { <`+id+`> ?p ?o . } WHERE { <`+id+`> ?p ?o . } ;\nWITH `+user+` DELETE { ?s ?p <`+id+`> . } WHERE { ?s ?p <`+id+`> . } `;
    //await putTRIPLES( update );
    player[ "player_"+(mode == 'edit'?'editing_'+iid:(mode == 'view')?'viewing_'+iid:iid) ].regions.list[ id ].remove();
    player[ "player_"+(mode == 'edit'?'editing_'+iid:(mode == 'view')?'viewing_'+iid:iid) ].stop();
    $( this ).parent().remove();
    //    processGlobalText( "", wid );
});

// Editing view: retrieve and display annotations
// this is obsolete
/*
function processMediaBuildingBlocks( bb ) {
    console.log( bb );
    for (var j = 0; j < bb.length; j++ ) {
        $( ".workbench .bb" ).append( processW3CannoMedia( bb[ j ] ) );
    }
    player[ "player_"+(mode == 'edit'?'editing_'+tid:tid) ].drawBuffer();
}
*/