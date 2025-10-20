// RPPA
// Map tools

  // establish continents
  var continents = {}
  continents[ "AF" ] = { id: "AF", name: "Africa", coord: "Point(16 1)" };
  continents[ "NA" ] = { id: "NA", name: "North America", coord: "Point(-95 40)" };
  continents[ "SA" ] = { id: "SA", name: "South America", coord: "Point(-60 -26)" };
  continents[ "AS" ] = { id: "AS", name: "Asia", coord: "Point(78 35)" };
  continents[ "EU" ] = { id: "EU", name: "Europe", coord: "Point(25 55)" };
  continents[ "OC" ] = { id: "OC", name: "Oceania", coord: "Point(145 -30)" };

  // languages
  var language = {}
  language["ben"] = { 'id': 'ben', 'name': 'Bengali' }
  language["bul"] = { 'id': 'bul', 'name': 'Bulgarian' }
  language["ces"] = { 'id': 'ces', 'name': 'Czech' }
  language["dan"] = { 'id': 'dan', 'name': 'Danish' }
  language["deu"] = { 'id': 'deu', 'name': 'German' }
  language["ell"] = { 'id': 'ell', 'name': 'Greek' }
  language["eng"] = { 'id': 'eng', 'name': 'English' }
  language["fas"] = { 'id': 'fas', 'name': 'Persian' }
  language["fin"] = { 'id': 'fin', 'name': 'Finnish' }
  language["fra"] = { 'id': 'fra', 'name': 'French' }
  language["gle"] = { 'id': 'gle', 'name': 'Irish' }
  language["heb"] = { 'id': 'heb', 'name': 'Hebrew' }
  language["hun"] = { 'id': 'hun', 'name': 'Hungarian' }
  language["ita"] = { 'id': 'ita', 'name': 'Italian' }
  language["jpn"] = { 'id': 'jpn', 'name': 'Japanese' }
  language["nor"] = { 'id': 'nor', 'name': 'Norwegian' }
  language["pol"] = { 'id': 'pol', 'name': 'Polish' }
  language["por"] = { 'id': 'por', 'name': 'Portuguese' }
  language["ron"] = { 'id': 'ron', 'name': 'Romanian' }
  language["rus"] = { 'id': 'rus', 'name': 'Russian' }
  language["spa"] = { 'id': 'spa', 'name': 'Spanish' }
  language["srp"] = { 'id': 'srp', 'name': 'Serbian' }
  language["swe"] = { 'id': 'swe', 'name': 'Swedish' }
  language["urd"] = { 'id': 'urd', 'name': 'Urdu' }
  language["vie"] = { 'id': 'vie', 'name': 'Vietnamese' }
  language["zho"] = { 'id': 'zho', 'name': 'Chinese' }

  // good default zoomlevels for 50% width displays (other 50% might be list of poets/works)
  zoomlvl = {}
  zoomlvl[ "AS" ] = 3.5;
  zoomlvl[ "RU" ] = 3.5;
  zoomlvl[ "CA" ] = 3.5;
  zoomlvl[ "US" ] = 4.5;
  zoomlvl[ "BR" ] = 5;
  zoomlvl[ "CN" ] = 5;
  zoomlvl[ "AU" ] = 5;
  zoomlvl[ "AR" ] = 5;
  zoomlvl[ "CL" ] = 5;
  zoomlvl[ "NO" ] = 5;
  zoomlvl[ "IN" ] = 5.5;
  zoomlvl[ "PE" ] = 5.5;
  zoomlvl[ "FI" ] = 5.5;
  zoomlvl[ "UA" ] = 6;
  zoomlvl[ "SE" ] = 6;
  zoomlvl[ "TR" ] = 6;
  zoomlvl[ "GB" ] = 6;
  zoomlvl[ "NZ" ] = 6;


  // load places/persons/nations JSON files to power interface
  var loadPlaces = function() {
    return $.ajax({ url: "/data/map/data/places.min.json", dataType: 'json',
      success: function(data) {
        places = data;
      }, error: function (jqXHR, textStatus, errorThrown) { console.log(jqXHR, textStatus, errorThrown); }
    });
  }
  var loadPersons = function() {
    return $.ajax({ url: "/data/map/data/persons.min.json", dataType: 'json',
      success: function(data) { 
        persons = data;
      }, error: function (jqXHR, textStatus, errorThrown) { console.log(jqXHR, textStatus, errorThrown); }
    });
  }
  var loadNations = function() {
    return $.ajax({ url: "/data/map/data/nations.min.json", dataType: 'json',
      success: function(data) { 
        nations = data;          
      }, error: function (jqXHR, textStatus, errorThrown) { console.log(jqXHR, textStatus, errorThrown); }
    });
  }

  // filter persons visualiztion based on timespan selected
  function showYrRange( start, end ) {
    startyr = start;
    endyr = end;
    var male = $( "#male" ).is( ":checked" );
    var female = $( "#female" ).is( ":checked" );
    var AF = $( "#AF" ).is( ":checked" );
    var NA = $( "#NA" ).is( ":checked" );
    var SA = $( "#SA" ).is( ":checked" );
    var AS = $( "#AS" ).is( ":checked" );
    var EU = $( "#EU" ).is( ":checked" );
    var OC = $( "#OC" ).is( ":checked" );
    var newPersons = _l.filter( persons, function ( v ) {
      var hide = false;
      if ( v["dob"].substring(0,4) > endyr || v["dod"].substring(0,4) < startyr ) {
        hide = true;
      } else {
        hide = false;
      }
      if (!hide) {
        if ( !male && v["sex"] == 'm' ) {
          hide = true;
        }
        if ( !female && v["sex"] == 'f' ) {
          hide = true;
        }
      }
      if (!hide) {
        if ( !AF && nations[ v["nat"].substring(0,2) ].cont == 'AF' ) {
          hide = true;
        }
        if ( !AS && nations[ v["nat"].substring(0,2) ].cont == 'AS' ) {
          hide = true;
        }
        if ( !NA && nations[ v["nat"].substring(0,2) ].cont == 'NA' ) {
          hide = true;
        }
        if ( !SA && nations[ v["nat"].substring(0,2) ].cont == 'SA' ) {
          hide = true;
        }
        if ( !EU && nations[ v["nat"].substring(0,2) ].cont == 'EU' ) {
          hide = true;
        }
        if ( !OC && nations[ v["nat"].substring(0,2) ].cont == 'OC' ) {
          hide = true;
        }
      }
      if ( !hide ) {
        return v;
      }
    });
    draw_viz( newPersons );
  }

  // create a new person marker layer based on person selection
  function draw_viz( new_persons ) {
    markers = {};
    oms.clearMarkers();
    markerLayer.clearLayers();
    lineLayer.clearLayers();
    $.each( new_persons, function ( i,v ) {
      var coords = [], POB = '';
      var source = (v.pob && !v.gen && places[ v.pob ] && places[ v.pob ].coord && places[ v.pob ].nat == v.nat.substring(0, 2))?places[ v.pob ].coord:nations[ v.nat.substring(0, 2) ].coord;
      source.replace(/[-+]?[0-9]*\.?[0-9]+/g, function( x ) { var n = Number(x); if (x == n) { coords.push(x); }  });
      POB += nations[ v.nat.substring(0, 2) ].name.split(',')[0];
      /*
      if ( v.pob && places[ v.pob ] && places[ v.pob ].name && places[ v.pob ].name != nations[ v.nat.substring(0, 2) ].name.split(',')[0]) {
        POB += ' (born in '+(( places[ v.pob ].name )?places[ v.pob ].name:``)+
          ((places[ v.pob ].nat && nations[ places[ v.pob ].nat.substring(0, 2) ].name && nations[ places[ v.pob ].nat.substring(0, 2) ].name.split(',')[0] != nations[ v.nat.substring(0, 2) ].name.split(',')[0] )?
          `, `+nations[ places[ v.pob ].nat.substring(0, 2) ].name.split(',')[0]
          :``);
        POB += `)`
      }
      */
      if ( v.pob && places[ v.pob ] && places[ v.pob ].name && places[ v.pob ].name != nations[ v.nat.substring(0, 2) ].name.split(',')[0]) {
        POB += ' (born in '+(( places[ v.pob ].name )?places[ v.pob ].name:``)
//          +
//            ((places[ v.pob ].nat && nations[ places[ v.pob ].nat.substring(0, 2) ].name && nations[ places[ v.pob ].nat.substring(0, 2) ].name.split(',')[0] != nations[ v.nat.substring(0, 2) ].name.split(',')[0] )?
//            `, `+nations[ places[ v.pob ].nat.substring(0, 2) ].name.split(',')[0]
//            :``);
        POB += `, `
      } else {
        POB += ` (birthplace n/a, `
      }
      if ( v.pod && places[ v.pod ] && places[ v.pod ].name ) {
        POB += ' died in '+(( places[ v.pod ].name )?places[ v.pod ].name:``)
//          +
//            ((places[ v.pob ].nat && nations[ places[ v.pob ].nat.substring(0, 2) ].name && nations[ places[ v.pob ].nat.substring(0, 2) ].name.split(',')[0] != nations[ v.nat.substring(0, 2) ].name.split(',')[0] )?
//            `, `+nations[ places[ v.pob ].nat.substring(0, 2) ].name.split(',')[0]
//            :``);
        POB += `)`
      } else {
        POB += ` deathplace n/a)`
      }

      var icon = L.icon({
        className: "poet-marker",
        iconUrl: (v.img)?'/data/map/data/img/thumb/'+v.id+'.jpg':(v.sex == 'm')?'/images/male.png':'/images/female.png',
        iconSize: [35]
      });
      markers[ v.id ] = L.marker([ coords[1],coords[0] ], {
        icon: icon,
        title: v["name"],
        riseOnHover: true
      })
      .bindPopup( `<div class='popup'><span class='name'>` + v["name"] + `</span><span class='loc'>`+POB+`</span></div>` )
      .addTo( markerLayer );
      // add person ID to marker
      markers[ v.id ]._icon.id = v.id;
      // spiderfy overlapping markers
      oms.addMarker( markers[ v.id ] );
      // create edges
      if (v.pob && !v.gen && places[ v.pob ] && places[ v.pob ].coord && v.pod && places[ v.pod ] && places[ v.pod ].coord) {
        var bcoords = [], dcoords = [];
        var bsource = places[ v.pob ].coord;
        bsource.replace(/[-+]?[0-9]*\.?[0-9]+/g, function( x ) { var n = Number(x); if (x == n) { bcoords.push(x); } });
        var dsource = places[ v.pod ].coord;
        dsource.replace(/[-+]?[0-9]*\.?[0-9]+/g, function( x ) { var n = Number(x); if (x == n) { dcoords.push(x); } });
        const options = {
            weight: 1,
            opacity: 0.5,
            color: ((theme == 'dark')?"#666":"#333"),
            className: 'map-line links '+v.id,
            steps: 8
        };
        lines[ v.id ] = new L.Geodesic([ 
          { lat: Number( bcoords[1] ), lng: Number( bcoords[0] ) }, 
          { lat: Number( dcoords[1] ), lng: Number( dcoords[0] ) } 
        ], options)
        .bindPopup()// `<div class='popup'><span class='name'>` + v["name"] + ` <a href="/authors/`+v["id"]+`.shtml" title="[go to author page]"><span style="display:initial;" class="glyphicon glyphicon-user"></span></a></span><span class='loc'>`+POB+`</span></div>` )
        .addTo( lineLayer );
        // click on line raises person popup
        lines[ v.id ]._popup._source.id = v.id;
      }
    });
    if ( $( "#birthdeath" ).is( ":checked" ) ) {
      map.addLayer( lineLayer );
    } else {
      map.removeLayer( lineLayer );
    }
    // wait for helper functions to load
    document.addEventListener('DOMContentLoaded', function(event) {
      checkPath();
    });
  }

  // return a poet profile page
  async function poet_profile( id ) {
    var poet = await load_poet_overview( id );
    var birthDate = new Date( persons[ id ].dob.replace("T00:00:00Z","").split('-') );
    var deathDate = new Date( persons[ id ].dod.replace("T00:00:00Z","").split('-') );
    var works='', poems='', links='<ul style="columns:2;">';
    links += 
      (poet[id].ecpa?`<li><a href="`+poet[id].ecpa+`" class="external" target="_blank"><span>ECPA</span></a>`:``)+
      (poet[id].ernie?`<li><a href="`+poet[id].ernie+`" class="external" target="_blank"><span>ERNiE</span></a>`:``)+
      (poet[id].europeana?`<li><a href="`+poet[id].europeana+`" class="external" target="_blank"><span>Europeana</span></a>`:``)+
      (poet[id].viaf?`<li><a href="`+poet[id].viaf+`" class="external" target="_blank"><span>VIAF</span></a>`:``)+
      (poet[id].cerl?`<li><a href="`+poet[id].cerl+`" class="external" target="_blank"><span>CERL thesaurus</span></a>`:``)+
      (poet[id].wcat?`<li><a href="`+poet[id].wcat+`" class="external" target="_blank"><span>Worldcat</span></a>`:``)+        
      (poet[id].wd?`<li><a href="`+poet[id].wd+`" class="external" target="_blank"><span>Wikidata</span></a>`:``);
    var wiki = '', wikisource = '';
    for (var key of Object.keys( poet[id])) {
      if ( key.includes( "wikisource" ) ) {
        wikisource += `<li><a href="`+poet[id][key]+`" class="external" target="_blank"><span>Wikisource</span> (<code>`+key.substring(0,2)+`</code>)</a>`
      } else if ( key.includes( "wiki" ) ) {
        wiki += `<li><a href="`+poet[id][key]+`" class="external" target="_blank"><span>Wikipedia</span> (<code>`+key.substring(0,2)+`</code>)</a>`
      }
    }
    links += wiki + wikisource + `</ul>`;
    // available global texts
    if ( poet[id].texts && poet[id].texts.poems.length > 0 ) {
      poems += `<ul>`;
      // groups everything by work, giving each one item, i.e. e.g. grouping all
      // extracts under one heading
      var work_ids = _l.groupBy( _l.filter( poet[id].texts.poems, function(item) { return item.type=='orig' ||  ( item.type.startsWith('trans') && _l.groupBy( poet[id].texts.poems, 'work' )[ item.work ].length < 2 )  }).sort((a,b) => a.title.localeCompare(b.title)), 'work' );
      var work_ids_all = _l.groupBy( poet[id].texts.poems.sort((a,b) => a.title.localeCompare(b.title)), 'work' );
      $.each( work_ids, function(i,v) {
        v = work_ids_all[ i ];
        poems += `<li>`;
        var orig_ids = _l.filter( v, function(o) { return o.type == 'orig'; } );
        var trans_ids =  _l.filter( v, function(o) { return o.type.startsWith( 'trans_' ); } );
        if ( !_l.isEmpty( orig_ids) ) {
          var j = 1;
          $.each( orig_ids, function(i,v) {
            poems += print_work( v );
            if (i+1 < v.length) { poems += " / "; }
            if ( Object.keys( orig_ids ).length > j++ ) { poems += " / "; }
          });
        }
        trans_ids = _l.groupBy( _l.sortBy( trans_ids, 'type'), 'type' );
        if ( !_l.isEmpty( trans_ids) ) {
          poems += " [";
          var j = 1;
          $.each( trans_ids, function(i,v) {
            $.each( v, function(i2,v2) {
              poems += print_work( v2 );
              if (i2+1 < v.length) { poems += " / "; }
            });
            if ( Object.keys( trans_ids ).length > j++ ) { poems += " / "; }
          });
          poems += "]";
        }
        poems += `</li>`;
      });
      poems += `</ul>`;
    }
    // select bibliography
    if ( poet[id].otw ) {
      works += `<ul>`;
      $.each( _l.sortBy( poet[id].otw, 'date' ), function(i,v) {
        works += `<li>`+
          ((v.url)?'<a class="external" target="_blank" href="'+v.url+'">':'')+
          `<em>`+v.title+`</em>`+
          ((v.url)?'</a>':'')+
          (v.date?` (`+v.date.substring(0,4)+`)`:``)+
          `</li>`;
      });
      works += `</ul>`;
    } else if ( poet[id].bibl ) {
      works += `<ul>`;
      $.each( _l.sortBy( poet[id].bibl, 'date' ), function(i,v) {
        works += `<li>`+
          ((v.url)?'<a class="external" target="_blank" href="'+v.url+'">':'')+
          `<em>`+v.title+`</em>`+
          ((v.url)?'</a>':'')+
          (v.date?` (`+v.date.substring(0,4)+`)`:``)+
          `</li>`;
      });
      works += `</ul>`;
    }
    try { sidebar.open('profile'); } catch(err) {}
    // update country in background
    $( "#location .results" ).html( update_country( persons[ id ].nat.substring(0,2), true ) );
    return `<h2>`+persons[ id ].name+`</h2>`+(poet[id].desc?`<p style="font-size:14px;">`+poet[id].desc+`</p>`:``)+
        ((persons[ id ].img)?`<img width="175" style="float:right;margin-left:10px;" src="/data/map/data/img/thumb/`+id+`.jpg"/>`:``)+
        //+persons[ id ].img.replace('http://','https://')+`?width=250px" />`:``)+
        `<h3>Biographical details</h3><ul><li><span>Country:</span> `+
        ((location.href.includes( '/maps/' ))?`<a href='#country/`+persons[ id ].nat.substring(0,2)+`' class='country-focus' data-cont='`+nations[ persons[ id ].nat.substring(0,2) ].cont+`' 
        data-count='`+persons[ id ].nat.substring(0,2)+`' data-coord='`+nations[ persons[ id ].nat.substring(0,2) ].coord+`'>`:'')+
        nations[ persons[ id ].nat.substring(0,2) ].name.split(',')[0]+
        ((location.href.includes( '/maps/' ))?`</a>`:'')+
        `</li>`+
        (persons[ id ].sex?`<li><span>Gender:</span> `+(persons[ id ].sex == 'm'?`male`:`female`):``)+`</li>`+
        (poet[ id ].pseud?`<li><span>Pseudonym:</span> `+_l.uniq( poet[id].pseud ).join("; "):``)+`</li>`+
          `<li><span>Birth:</span> `+ 
        ((persons[ id ].dob.length == 20 && !persons[ id ].dob.includes("-01-01"))?birthDate.toLocaleDateString('en-GB', { year: 'numeric', month: 'short', day: 'numeric' }):birthDate.getFullYear())+
        (persons[ id ].pob && places[ persons[ id ].pob ] && places[ persons[ id ].pob ].name ?` (`+
          (( places[ persons[ id ].pob ] && places[ persons[ id ].pob ].name )?`<a href="https://www.wikidata.org/wiki/`+persons[ id ].pob+`" class="external" target="_blank">`+places[ persons[ id ].pob ].name+`</a>`:``)+
          ((places[ persons[ id ].pob ] && places[ persons[ id ].pob ].nat && nations[ places[ persons[ id ].pob ].nat.substring(0, 2) ].name &&
            nations[ places[ persons[ id ].pob ].nat.substring(0, 2) ].name.split(',')[0] != places[ persons[ id ].pob ].name)?
          `, `+nations[ places[ persons[ id ].pob ].nat.substring(0, 2) ].name.split(',')[0]
          :``):``)+(persons[ id ].pob && places[ persons[ id ].pob ] && places[ persons[ id ].pob ].name?`)`:``)+`</li>`+
          `<li><span>Death:</span> `+ 
        ((persons[ id ].dod.length == 20 && !persons[ id ].dod.includes("-01-01"))?deathDate.toLocaleDateString('en-GB', { year: 'numeric', month: 'short', day: 'numeric' }):deathDate.getFullYear())+
        (persons[ id ].pod?` (`+
          (( places[ persons[ id ].pod ].name )?`<a href="https://www.wikidata.org/wiki/`+persons[ id ].pod+`" class="external" target="_blank">`+places[ persons[ id ].pod ].name+`</a>`:``)+
          ((places[ persons[ id ].pod ].nat && nations[ places[ persons[ id ].pod ].nat.substring(0, 2) ].name &&
            nations[ places[ persons[ id ].pod ].nat.substring(0, 2) ].name.split(',')[0] != places[ persons[ id ].pod ].name)?
          `, `+nations[ places[ persons[ id ].pod ].nat.substring(0, 2) ].name.split(',')[0]
          :``):``)+(persons[ id ].pod?`)`:``)+`</li>`+
        (poet[id].occ?`<li><span>Occupation:</span> `+_l.uniq( poet[id].occ.sort() ).join("; ")+`</li>`:``)
        +`</ul>`+
        `<h3>Poems</h3>`+((poet[id].texts && poet[id].texts.poems.length > 0)?poems:`<ul><li>[forthcoming]</li></ul>`)+
        ((poet[id].otw  || poet[id].bibl)?`<h3>Select bibliography</h3>`+works:``)+
        ((links != '<ul style="columns:2;"></ul>')?`<h3>Links</h3>`+links:``);
  }

  // format a RPPA poem as a clickable citation
  function print_work( work ) {
    var formatted_work = '';
    formatted_work += 
      `<a href="/works/#text/`+work.text+`" data-tid="`+work.text+`" data-wid="`+work.work+`">`+
      `<em>`+work.title+`</em>`+
      '</a>'+
      ((work["type"].startsWith('trans_'))?' (<code>'+work.type.split('_')[1]+'</code>)':'')+
      ((work.publ != '')?` (`+work.publ+`)`: ((work.comp != '')?` (comp. `+work.comp+`)`: ``));
    return( formatted_work );
  }

  // return a list of poems for the selected country
  function update_country( country, isEmbedded ) {
    if (!isEmbedded) {
      var poets = _l.filter( persons, function(record){ return nations[ record.nat.substring(0,2) ].id == country } );
      draw_viz( poets );
    }
    var overview = `<h2>`+nations[ country ].name.split(',')[0]+`, `+
      `<a href="#continent/`+continents[ nations[ country ].cont ].id+`" class='cont-focus' data-cont="`+continents[ nations[ country ].cont ].id+`" 
      data-name="`+continents[ nations[ country ].cont ].name+`" data-coord="`+continents[ nations[ country ].cont ].coord+`">`+
      continents[ nations[ country ].cont ].name+`</a> (`+
      _l.filter( persons, function(record){ return record.nat.substring(0,2) == country } ).length+` `+
      (_l.filter( persons, function(record){ return record.nat.substring(0,2) == country } ).length > 1?`poets`:`poet`)
      +`)</h2>`;
    overview += poets_by_country( country );
    return( overview );
  }

  // return a list of countries with a list of poets for each for the selected continent
  function update_continent( cont ) {
    var poets = _l.filter( persons, function(record){ return continents[ nations[ record.nat.substring(0,2) ].cont ].id == cont } );
    draw_viz( poets );
    var name = continents[ cont ].name;
    var countries = _l.filter( nations, function(record){ return record.cont == cont } );
    var overview = `<h2>`+name+
      ` (`+
      _l.filter( persons, function(record){ return nations[ record.nat.substring(0,2) ].cont == cont } ).length+` `+
      (_l.filter( persons, function(record){ return nations[ record.nat.substring(0,2) ].cont == cont } ).length > 1?`poets`:`poet`)         
      +`), <a href="#home">World</a>`+
      `</h2>`;
    $.each( _l.sortBy( countries, 'name' ), function( i,v ) {
      overview += `<h3>`+v.name.split(',')[0]+` (`+
        _l.filter( persons, function(record){ return record.nat.substring(0,2) == v.id } ).length+` `+
        (_l.filter( persons, function(record){ return record.nat.substring(0,2) == v.id } ).length > 1?`poets`:`poet`)          
        +`) <a href="#country/`+v.id+`" class="country-focus" data-cont="`+cont+`" data-count="`+v.id+`" data-coord="`+nations[ v.id ].coord+`"><i class="fas fa-map-marked-alt"></i></a></h3>`;
      overview += poets_by_country( v.id );
    });
    return( overview );
  }

  // return a list of poets for the selected country
  function poets_by_country( country ) {
    var return_poets = '';
    var poets = _l.filter( persons, function(record){ return record.nat.substring(0,2) == country } );
    return_poets += "<ul>";
    const collator = new Intl.Collator();
    $.each( poets.sort((a, b) => collator.compare(a.name, b.name)), function( i,v ) {
      var birthDate = new Date( v.dob.replace("T00:00:00Z","").split('-') ); // var birthDate = new Date( v.dob ); 
      var deathDate = new Date( v.dod.replace("T00:00:00Z","").split('-') ); // var deathDate = new Date( v.dod );
      return_poets += `<li><a href='#id/`+v.id+`' class='poet-focus' data-id='`+v.id+`'>`+v.name+` 
        (`+birthDate.getFullYear()+`–`+deathDate.getFullYear()+`)</a></li>`;
    });
    return_poets += "</ul>";
    return( return_poets );
  }

  // select map visualization type based on hash value
  async function checkPath() {
    var hash = location.hash.substring( location.hash.indexOf("/")+1 ), source;
    switch ( location.hash.substring( location.hash.indexOf("#"), location.hash.indexOf("/")+1 ) ) {
      case "#id/":
        $( "#profile .results" ).html( await poet_profile( hash ) );
        source = nations[ persons[ hash ].nat.substring(0, 2) ].coord;
        markers[ hash ].fire('click');
        break;
      case "#continent/":
        $( "#location .results" ).html( update_continent( hash ) );
        sidebar.open('location');
        source = continents[ hash ].coord;
      break;
      case "#country/":
        $( "#location .results" ).html( update_country( hash ) );
        sidebar.open('location');
        source = nations[ hash ].coord;
      break;
      // TODO: these should be links to /works/#text/...
      /*
      case "#text/":
        var work = await load_work_overview( texts[ hash ][ "work" ] );
        if ( work.aut != '' ) {
          var aut = work.aut.split(';');
          $( "#profile .results" ).html( await poet_profile( aut[0] ) );
          source = nations[ persons[ aut[0] ].nat.substring(0, 2) ].coord;
        }
        display_globaltext( hash, texts[ hash ][ "work" ] );
      break;
      case "#work/":
        var work = await load_work_overview( hash );
        if ( work.aut != '' ) {
          var aut = work.aut.split(';');
          $( "#profile .results" ).html( await poet_profile( aut[0] ) );
          source = nations[ persons[ aut[0] ].nat.substring(0, 2) ].coord;
        }
        var textsByWork = _l.groupBy( texts, "work" );
        display_globaltext( textsByWork[ hash ][0]['text'], hash );
      break;
      */
    }
    if ( source ) {
      // pan to target
      var coords = [];
      source.replace(/[-+]?[0-9]*\.?[0-9]+/g, function( x ) { var n = Number(x); if (x == n) { coords.push(x); }  });
      map.setView( [coords[1], coords[0]], (location.hash.substring( location.hash.indexOf("#"), location.hash.indexOf("/")+1 ).includes( "#continent/" )?4:5) );
    }
  }

  // update map visualization's sidebar based on hash value
  function checkHash() {
    switch( window.location.hash ) {
      case "#home":
        sidebar.open( 'home' );
      break;
      case "#about":
        sidebar.open( 'about' );
      break;
      case "#help":
        sidebar.open( 'help' );
      break;
      case "#contact":
        sidebar.open( 'contact' );
      break;
    }
  }
