// RPPA
// Map tools

let url = new URL( window.location.href );
if ( url['pathname'].includes( '/poets/' ) && $("#map").length ) {
  // initialize
  var oms, sidebar, markerLayer, map, continents = {}, markers = {};
  var theme = document.documentElement.getAttribute('data-bs-theme');

  // establish continents
  continents[ "AF" ] = { id: "AF", name: "Africa", coord: "Point(16 1)" };
  continents[ "NA" ] = { id: "NA", name: "North America", coord: "Point(-95 40)" };
  continents[ "SA" ] = { id: "SA", name: "South America", coord: "Point(-60 -26)" };
  continents[ "AS" ] = { id: "AS", name: "Asia", coord: "Point(78 35)" };
  continents[ "EU" ] = { id: "EU", name: "Europe", coord: "Point(25 55)" };
  continents[ "OC" ] = { id: "OC", name: "Oceania", coord: "Point(145 -30)" };

  zoomlvl = {}
  zoomlvl[ "AS" ] = 3.5;
  zoomlvl[ "RU" ] = 3.5;
  zoomlvl[ "CA" ] = 4;
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

  // start with whole network
  var startyr = 1770;
  var endyr = 1900;

  // initialize map view
  var lat = Math.floor(Math.random() *  (80  - -50  + 1)) + -50;  // max 80,  min -50
  var lon = Math.floor(Math.random() *  (180 - -180 + 1)) + -180; // max 180, min -180
  var zoom = Math.floor(Math.random() * (4   - 4    + 1)) + 4;    // max 4,   min 4

  // map layers
  /*
  var baseMap = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    noWrap: true,
    minzoom: 3,
    maxZoom: 10
  });
  */
  /* map layers */
  var baseMapDark = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    subdomains: 'abcd'
  });
  var baseMapLight = L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    subdomains: 'abcd'
  });
  var overlayMap = L.tileLayer('/data/map/worldmap/{z}/{x}/{y}.png', {
    attribution: '&copy; David Rumsey map collection',
    minZoom: 2,
    maxZoom: 5
  });

  var baseMap = (theme == 'dark') ? baseMapDark : baseMapLight ;
  // map
  map = new L.Map('map', {
    worldCopyJump: true,
    zoomSnap: 0.5,
    zoomDelta: 0.5,
    minZoom: 2,
    maxZoom: 12,
    //
    //maxBounds: [
    //  [-78,-180],
    //  [90,180]
    //],
    layers: [
      baseMap,
      overlayMap
    ]
  });//.setView([lat, lon], zoom);

  // start with overlayMap
  baseMap.setOpacity(0);
  $( ".map").css( "background-color", "#ede0cb" );

  // visualization layers
  markerLayer = L.layerGroup().addTo( map );
  // Spiderfy overlapping markers
  oms = new OverlappingMarkerSpiderfier( map, {keepSpiderfied: true} );
  //var hash = new L.Hash(map);

  // initialize
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
  
  // switch base/overlay (to hide hist map "flaw")
  map.on('overlayadd', function() {
    //baseMap.setOpacity(0);
    //$( ".map").css( "background-color", "#ede0cb" );
  });
  map.on('overlayremove', function() {
    if (theme == 'dark') {
      $( ".map").css( "background-color", "#000" );
    } else {
      $( ".map").css( "background-color", "#fff" );
    }
    baseMap.setOpacity(1);
  });
  // zoom base/overlay
  map.on('zoomend', function() {
    var zoomlevel = map.getZoom();
    if (zoomlevel > 5 ) {
      if (theme == 'dark') {
        $( ".map").css( "background-color", "#000" );
      } else {
        $( ".map").css( "background-color", "#fff" );
      }
      baseMap.setOpacity(1);
    } else {
      if ( map.hasLayer( overlayMap) ) {
        baseMap.setOpacity(0);
        $( ".map").css( "background-color", "#ede0cb" );
      } else {
        if (theme == 'dark') {
          $( ".map").css( "background-color", "#000" );
        } else {
          $( ".map").css( "background-color", "#fff" );
        }  
        baseMap.setOpacity(1);
      }
    }
  });

  // controls
  L.control.layers( {"OpenStreetMap": baseMap }, { "The World (1844)": overlayMap } ).addTo(map);
  // Create additional Control placeholders
  function addControlPlaceholders(map) {
    var corners = map._controlCorners,
      l = 'leaflet-',
      container = map._controlContainer;
    function createCorner(vSide, hSide) {
      var className = l + vSide + ' ' + l + hSide;
      corners[vSide + hSide] = L.DomUtil.create('div', className, container);
    }
    createCorner('verticalcenter', 'left');
    createCorner('verticalcenter', 'right');
  }
  addControlPlaceholders(map);
  // Change the position of the Zoom Control to a newly created placeholder.
  map.zoomControl.setPosition('topright');

  // "Center" map in a good starting position and add reset button next to zoom
  L.easyButton( '<i class="fas fa-undo-alt reset_map"></i><span class="sr-only">Reset map</span>', function(){
    map.setView([17,20], 3);
  }).setPosition('topright').addTo( map );
  /*
    sidebar = L.control.sidebar({
      autopan: false,       // whether to maintain the centered map point when opening the sidebar
      closeButton: true,    // whether to add a close button to the panes
      container: 'sidebar', // the DOM container or #ID of a predefined sidebar container that should be used
      position: 'left',     // left or right
    }).addTo(map);
  */
  /* sidebar.open('welcome');*/

  $('.gender .checkbox').change(function () {
    showYrRange( startyr,endyr );
  });
  $('.continents .checkbox').change(function () {
    showYrRange( startyr,endyr );
  });
  $( document ).on( 'click', '.poet-focus', function(e) {
    var id = $(e.currentTarget).data( "id" );
    markers[ id ].fire('click');
    poet_profile( id );
  });
  $( document ).on( 'click', '.country-focus,.cont-focus', function(e) {
    var focus_type = $(e.currentTarget)[0].className, overview = '';
    // generate and switch to continent or country overview
    if (focus_type == 'cont-focus') {
      overview += update_continent( $(e.currentTarget).data( "cont" ) );
    } else {
      overview += update_country( $(e.currentTarget).data( "count" ) );
    }
    $( "#location .results" ).html( overview );
    //sidebar.open('location');
    // refresh markers
    $( "#"+$(e.currentTarget).data( "cont" ) ).prop('checked', true);
    showYrRange( startyr,endyr );
    // pan to target
    var coords = [];
    $(e.currentTarget).data('coord').replace(/[-+]?[0-9]*\.?[0-9]+/g, function( x ) { var n = Number(x); if (x == n) { coords.push(x); }  });
    map.flyTo( [coords[1], coords[0]], (focus_type == 'cont-focus'?4:5) );
  });

  $( "#slider-range" ).slider({
  range: true,
  min: parseInt(startyr),
  max: parseInt(endyr),
  values: [ parseInt(startyr),parseInt(endyr) ],
  slide: function( event, ui ) {
      $( "#year-range" ).val( ui.values[ 0 ] + "–" + ui.values[ 1 ] );
      setTimeout(function() {
        showYrRange( ui.values[ 0 ],ui.values[ 1 ] );
      }, 10);
    }
  });
  $( "#year-range" ).val( $( "#slider-range" ).slider( "values", 0 ) +
      "–" + $( "#slider-range" ).slider( "values", 1 ) );

  oms.addListener('click', function(marker) {
    poet_profile( marker._icon.id );
    window.location.hash = "#id/"+marker._icon.id;
  });
  oms.addListener('spiderfy', function(markers) {
    $.each( markers, function(i,v) {
      var popup = v.getPopup();
      if ( popup.isOpen() ) {
        poet_profile( v._icon.id );
        window.location.hash = "#id/"+v._icon.id;
        return false;
      }
    });
  });

  document.addEventListener("DOMContentLoaded", function() {
    $.when( loadPlaces(), loadPersons(), loadNations() ).done( function() {
      checkBrowsePath();
      var newPersons = _.filter( persons, function ( v ) {
        if ( url['pathname'].includes( '/continent/' ) && 
          nations[ v["nat"].substring(0,2) ].cont == location.pathname.substring( location.pathname.lastIndexOf("/")+1 )) {
            return v;
          } else if ( url['pathname'].includes( '/country/' ) && v["nat"].substring(0,2) == location.pathname.substring( location.pathname.lastIndexOf("/")+1 )) {
            return v;
          } else if ( url['pathname'].includes( '/world/' ) ) {
            return v;
          }
      });
      draw_viz( newPersons );
    });
  });
}

async function checkBrowsePath() {
  var hash = location.pathname.substring( location.pathname.lastIndexOf("/")+1 ), source;
  switch ( location.pathname.substring( location.pathname.indexOf("browse/"), location.pathname.lastIndexOf("/")+1 ) ) {
    case "browse/id/":
      poet_profile( hash );
      source = nations[ persons[ hash ].nat.substring(0, 2) ].coord;
      markers[ hash ].fire('click');
      break;
    case "browse/world/":
//      $( "#location .results" ).html( update_continent( hash ) );
//      sidebar.open('location');
      source = 'Point(15 25)';
      break;
    case "browse/continent/":
      $( "#location .results" ).html( update_continent( hash ) );
//      sidebar.open('location');
      source = continents[ hash ].coord;
    break;
    case "browse/country/":
      $( "#location .results" ).html( update_country( hash ) );
//      sidebar.open('location');
      source = nations[ hash ].coord;
      map.removeLayer( overlayMap );
    break;
    case "broswe/text/":
      var work = await load_work_overview( texts[ hash ][ "work" ] );
      if ( work.aut != '' ) {
        var aut = work.aut.split(';');
        poet_profile( aut[0] );
        source = nations[ persons[ aut[0] ].nat.substring(0, 2) ].coord;
      }
      display_globaltext( hash, texts[ hash ][ "work" ] );
    break;
    case "browse/work/":
      var work = await load_work_overview( hash );
      if ( work.aut != '' ) {
        var aut = work.aut.split(';');
        poet_profile( aut[0] );
        source = nations[ persons[ aut[0] ].nat.substring(0, 2) ].coord;
      }
      display_globaltext( "", hash );
    break;
  }
  console.log( source );
  if ( source ) {
    // pan to target
    var coords = [];
    source.replace(/[-+]?[0-9]*\.?[0-9]+/g, function( x ) { var n = Number(x); if (x == n) { coords.push(x); }  });
    map.setView( [coords[1], coords[0]], (location.pathname.substring( location.pathname.indexOf("browse/"), location.pathname.lastIndexOf("/")+1 ).includes( "continent/" )?(zoomlvl[ hash ]?zoomlvl[ hash ]:4):(location.pathname.substring( location.pathname.indexOf("browse/"), location.pathname.lastIndexOf("/")+1 ).includes( "world/" )?1:(zoomlvl[ hash ]?zoomlvl[ hash ]:6.5))) );
  }
}


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
    var newPersons = _.filter( persons, function ( v ) {
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

  function draw_viz( new_persons ) {
    markers = {};
    oms.clearMarkers();
    markerLayer.clearLayers();
    $.each( new_persons, function ( i,v ) {
      var coords = [], POB = '';
      var source = (v.pob && !v.gen && places[ v.pob ] && places[ v.pob ].coord && places[ v.pob ].nat == v.nat.substring(0, 2))?places[ v.pob ].coord:nations[ v.nat.substring(0, 2) ].coord;
      source.replace(/[-+]?[0-9]*\.?[0-9]+/g, function( x ) { var n = Number(x); if (x == n) { coords.push(x); }  });
      POB += nations[ v.nat.substring(0, 2) ].name.split(',')[0];
      if ( v.pob && places[ v.pob ] && places[ v.pob ].name && places[ v.pob ].name != nations[ v.nat.substring(0, 2) ].name.split(',')[0]) {
        POB += ' (born in '+(( places[ v.pob ].name )?places[ v.pob ].name:``)+
          ((places[ v.pob ].nat && nations[ places[ v.pob ].nat.substring(0, 2) ].name && nations[ places[ v.pob ].nat.substring(0, 2) ].name.split(',')[0] != nations[ v.nat.substring(0, 2) ].name.split(',')[0] )?
          `, `+nations[ places[ v.pob ].nat.substring(0, 2) ].name.split(',')[0]
          :``);
        POB += `)`
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
    });
    // wait for helper functions to load
    document.addEventListener('DOMContentLoaded', function(event) {
      checkPath();
    });
  }

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
      var work_ids = _.groupBy( _.sortBy( poet[id].texts.poems, 'title' ), 'work' );
      $.each( work_ids, function(i,v) {
        poems += `<li>`;
        var orig_ids = _.filter( v, function(o) { return o.type == 'orig'; } );
        var trans_ids =  _.filter( v, function(o) { return o.type.startsWith( 'trans_' ); } );
        if ( !_.isEmpty( orig_ids) ) {
          var j = 1;
          $.each( orig_ids, function(i,v) {
            poems += print_work( v );
            if (i+1 < v.length) { poems += " / "; }
            if ( Object.keys( orig_ids ).length > j++ ) { poems += " / "; }
          });
        }
        trans_ids = _.groupBy( _.sortBy( trans_ids, 'type'), 'type' );
        if ( !_.isEmpty( trans_ids) ) {
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
      $.each( _.sortBy( poet[id].otw, 'date' ), function(i,v) {
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
      $.each( _.sortBy( poet[id].bibl, 'date' ), function(i,v) {
        works += `<li>`+
          ((v.url)?'<a class="external" target="_blank" href="'+v.url+'">':'')+
          `<em>`+v.title+`</em>`+
          ((v.url)?'</a>':'')+
          (v.date?` (`+v.date.substring(0,4)+`)`:``)+
          `</li>`;
      });
      works += `</ul>`;
    }
    $( "#profile .results" ).html( 
      `<h2>`+persons[ id ].name+`</h2>`+(poet[id].desc?`<p style="font-size:14px;">`+poet[id].desc+`</p>`:``)+
        ((persons[ id ].img)?`<img width="175" style="float:right;margin-left:10px;" src="/data/map/data/img/thumb/`+id+`.jpg"/>`:``)+
        //+persons[ id ].img.replace('http://','https://')+`?width=250px" />`:``)+
        `<h3>Biographical details</h3><ul><li><span>Country:</span> 
        <a href='#country/`+persons[ id ].nat.substring(0,2)+`' class='country-focus' data-cont='`+nations[ persons[ id ].nat.substring(0,2) ].cont+`' 
        data-count='`+persons[ id ].nat.substring(0,2)+`' data-coord='`+nations[ persons[ id ].nat.substring(0,2) ].coord+`'>`+
        nations[ persons[ id ].nat.substring(0,2) ].name.split(',')[0]+`</a></li>`+
        (persons[ id ].sex?`<li><span>Gender:</span> `+(persons[ id ].sex == 'm'?`male`:`female`):``)+`</li>`+
        (poet[ id ].pseud?`<li><span>Pseudonym:</span> `+_.uniq( poet[id].pseud ).join("; "):``)+`</li>`+
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
        (poet[id].occ?`<li><span>Occupation:</span> `+_.uniq( poet[id].occ.sort() ).join("; ")+`</li>`:``)
        +`</ul>`+
        `<h3>Poems</h3>`+((poet[id].texts && poet[id].texts.poems.length > 0)?poems:`<ul><li>[forthcoming]</li></ul>`)+
        ((poet[id].otw  || poet[id].bibl)?`<h3>Select bibliography</h3>`+works:``)+
        ((links != '<ul style="columns:2;"></ul>')?`<h3>Links</h3>`+links:``)
    );
    sidebar.open('profile');
    // update country in background
    $( "#location .results" ).html( update_country( persons[ id ].nat.substring(0,2) ) );
  }

  function print_work( work ) {
    var formatted_work = '';
    formatted_work += 
      `<a class="show_globaltext" href="#text/`+work.text+`" data-tid="`+work.text+`" data-wid="`+work.work+`">`+
      `<em>`+work.title+`</em>`+
      '</a>'+
      ((work["type"].startsWith('trans_'))?' (<code>'+work.type.split('_')[1]+'</code>)':'')+
      ((work.publ != '')?` (`+work.publ+`)`: ((work.comp != '')?` (comp. `+work.comp+`)`: ``));
    return( formatted_work );
  }

  function update_country( country ) {
    var overview = `<h2>`+nations[ country ].name.split(',')[0]+`, `+
      `<a href="#continent/`+continents[ nations[ country ].cont ].id+`" class='cont-focus' data-cont="`+continents[ nations[ country ].cont ].id+`" 
      data-name="`+continents[ nations[ country ].cont ].name+`" data-coord="`+continents[ nations[ country ].cont ].coord+`">`+
      continents[ nations[ country ].cont ].name+`</a> (`+
      _.filter( persons, function(record){ return record.nat.substring(0,2) == country } ).length+` `+
      (_.filter( persons, function(record){ return record.nat.substring(0,2) == country } ).length > 1?`poets`:`poet`)
      +`)</h2>`;
    overview += poets_by_country( country );
    return( overview );
  }

  function update_continent( cont ) {
    var name = continents[ cont ].name;
    var countries = _.filter( nations, function(record){ return record.cont == cont } );
    var overview = `<h2>`+name+
      ` (`+
      _.filter( persons, function(record){ return nations[ record.nat.substring(0,2) ].cont == cont } ).length+` `+
      (_.filter( persons, function(record){ return nations[ record.nat.substring(0,2) ].cont == cont } ).length > 1?`poets`:`poet`)         
      +`)`+
      `</h2>`;
    $.each( _.sortBy( countries, 'name' ), function( i,v ) {
      overview += `<h3>`+v.name.split(',')[0]+` (`+
        _.filter( persons, function(record){ return record.nat.substring(0,2) == v.id } ).length+` `+
        (_.filter( persons, function(record){ return record.nat.substring(0,2) == v.id } ).length > 1?`poets`:`poet`)          
        +`)</h3>`;
      overview += poets_by_country( v.id );
    });
    return( overview );
  }

  function poets_by_country( country ) {
    var return_poets = '';
    var poets = _.filter( persons, function(record){ return record.nat.substring(0,2) == country } );
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

  async function checkPath() {
    var hash = location.hash.substring( location.hash.indexOf("/")+1 ), source;
    switch ( location.hash.substring( location.hash.indexOf("#"), location.hash.indexOf("/")+1 ) ) {
      case "#id/":
        poet_profile( hash );
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
      case "#text/":
        var work = await load_work_overview( texts[ hash ][ "work" ] );
        if ( work.aut != '' ) {
          var aut = work.aut.split(';');
          poet_profile( aut[0] );
          source = nations[ persons[ aut[0] ].nat.substring(0, 2) ].coord;
        }
        display_globaltext( hash, texts[ hash ][ "work" ] );
      break;
      case "#work/":
        var work = await load_work_overview( hash );
        if ( work.aut != '' ) {
          var aut = work.aut.split(';');
          poet_profile( aut[0] );
          source = nations[ persons[ aut[0] ].nat.substring(0, 2) ].coord;
        }
        display_globaltext( "", hash );
      break;
    }
    if ( source ) {
      // pan to target
      var coords = [];
      source.replace(/[-+]?[0-9]*\.?[0-9]+/g, function( x ) { var n = Number(x); if (x == n) { coords.push(x); }  });
      map.setView( [coords[1], coords[0]], (location.hash.substring( location.hash.indexOf("#"), location.hash.indexOf("/")+1 ).includes( "#continent/" )?4:5) );
    }
  }

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