// RPPA

// global settings
var user = undefined, username = undefined;
var workbench = {}, provider_img = '', contexts, skos, contributors;
var domain = "https://www.romanticperiodpoetry.org";
var theme = document.documentElement.getAttribute('data-bs-theme');
const uuidRegex = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;

// global variables
var t, myCanvasGT, myCanvasGTEl, zInd = 1054, player = {}, viewer = {}, mode = 'read';
var done_tooltipTriggerList = [], done_popoverTriggerList = [];
var SOLR_RPPA, SPARQL_RPPA;
if ( /romanticperiodpoetry\.org/.test(window.location.href) ) {
    SPARQL_RPPA = "https://data.prisms.digital/query/rppa/";
    SOLR_RPPA = "https://data.prisms.digital/solr/rppa/select";
} else {
    SPARQL_RPPA = "http://192.168.1.2:3030/rppa/";
    SOLR_RPPA = "http://192.168.1.2:8983/solr/rppa/select";
}

var namespaces = '';
// load PRISMS JSON-LD context and create namespaces
$.ajax({ url: "/rppa.jsonld", dataType: 'json', async: false,
	success: function(data) {
        context = data;
        $.each( Object.keys( context["@context"] ), function (index, value) {
            if ( String(context["@context"][value]).startsWith( 'http' ) ) {
                namespaces += `prefix `+ value + `: <`+context["@context"][value]+`>\n`;
            }
        });
	}
});

// load texts JSON files to power interface
var loadTexts = function() {
    return $.ajax({ url: "/data/texts.min.json", dataType: 'json',
        success: function(data) {
            texts = data;
        }, error: function (jqXHR, textStatus, errorThrown) { console.log(jqXHR, textStatus, errorThrown); }
    });
}
// load works JSON files to power interface
var loadWorks = function() {
    return $.ajax({ url: "/data/works.min.json", dataType: 'json',
        success: function(data) {
            works = data;
        }, error: function (jqXHR, textStatus, errorThrown) { console.log(jqXHR, textStatus, errorThrown); }
    });
}

// authors browse page (DT)
var initDataAuthors = function() {
    $.when( loadPlaces(), loadNations(), loadPersons() ).done( function() {
        var authors = $.map(persons , function(value, index) {
            if (!value.img) { value.img = ''; }
            if (!value.pob) { value.pob = ''; }
            if (!value.pod) { value.pod = ''; }
            value.cont = nations[ value.nat.substring(0,2) ].cont;
            return [value];
        });
        /*
        {
            "id": "pers00001",
            "name": "Smith, Charlotte Turner",
            "nat": "GB",
            "img": "http://commons.wikimedia.org/wiki/Special:FilePath/Romney-Charlotte-Smith.jpg",
            "pob": "Q84",
            "pod": "Q145",
            "sex": "f",
            "dob": "1749-05-04T00:00:00Z",
            "dod": "1806-10-28T00:00:00Z"
        }
        */
        var table = $('#authorsDT').DataTable({
            data: authors,
            columns: [
                { 	data: 'id',
                    visible: false,						
                    searchPanes: {
                        show: false
                    }
                },
                { 	data: 'img',
                    visible: true,
                    render: function( data, type, row ) {
                        if (type === 'display') {
                            if (row.img != '') {
                                return `<img style="height:35px;" src="/data/map/data/img/thumb/`+row.id+`.jpg" alt="">`;
                            } else {
                                return '—';
                            }
                        }
                        return '';
                    },
                    searchPanes: {
                        show: false
                    }
                },
                { 	data: 'name',
                    render: function( data, type, row ) {
                        if (type === 'display') {
                            return `<a href="#id/`+row.id+`">`+data+`</a>`;
                        }
                        return data;
                    },						
                    searchPanes: {
                        show: false
                    }
                },
                {   data: 'sex',
                    render: function( data, type ) {
                        if ( data == "m" ) return "male";
                        else if (data == "f" ) return "female";
                        else return "—";
                    }
                },
                { 	data: 'dob',
                    render: function( data, type ) {
                        if (type === 'display') {
                            var birthDate = new Date( data.replace("T00:00:00Z","").split('-') );
                            if ( data.length == 20 && !data.includes("-01-01") ) {
                                return birthDate.toLocaleDateString('en-GB', { year: 'numeric', month: 'short', day: 'numeric' });
                            } else {
                                return birthDate.getFullYear()
                            }
                        } else if ( type === 'sp' ) {
                            return data.substring(0,4);
                        }
                        return data.replace("T00:00:00Z","");
                    },
                    searchPanes: {
                        orthogonal: 'sp'
                    }
                },
                { 	data: 'pob',
                    render: function( data, type ) {
                        if ( data in places ) {
                            if (type === 'display' || type==='sp') {
                                return truncateString(places[ data ].name,20);
                            } else if ( type==='filter' ){
                                return places[ data ].name;
                            }
                            return data;
                        } else { return '—'; }
                    },
                    searchPanes: {
                        orthogonal: 'sp'
                    }
                },
                { 	data: 'dod',
                    render: function( data, type ) {
                        if (type === 'display') {
                            var deathDate = new Date( data.replace("T00:00:00Z","").split('-') );
                            if ( data.length == 20 && !data.includes("-01-01") ) {
                                return deathDate.toLocaleDateString('en-GB', { year: 'numeric', month: 'short', day: 'numeric' });
                            } else {
                                return deathDate.getFullYear()
                            }
                        } else if ( type === 'sp' ) {
                            return data.substring(0,4);
                        }
                        return data.replace("T00:00:00Z","");
                    },
                    searchPanes: {
                        orthogonal: 'sp'
                    }
                },
                { 	data: 'pod',
                    render: function( data, type ) {
                        if ( data in places ) {
                            if (type === 'display' || type==='sp') {
                                return truncateString(places[ data ].name,20);
                            } else if ( type==='filter' ){
                                return places[ data ].name;
                            }
                            return data;
                        } else { return '—'; }
                    },
                    searchPanes: {
                        orthogonal: 'sp'
                    }
                },
                {   data: 'nat',
                    render: function( data, type ) {
                        if ( type === 'display' || type === 'filter' ) {
                            let nats_dis = [];
                            $.each( data.split(';'), function( i, v ) {
                                if (v.trim() != '' && v.trim().substring(0, 2) in nations) {
                                    nats_dis.push( nations[ v.trim().substring(0, 2) ].name.split(',')[0] );
                                } else {
                                    nats_dis.push( "—" );
                                }
                            });
                            return nats_dis.join( "; " );
                        }
                        if ( type === 'sp' ) {
                            let nats_dis = [];
                            $.each( data.split(';'), function( i, v ) {
                                if (v.trim() != '' && v.trim().substring(0, 2) in nations) {
                                    nats_dis.push( nations[ v.trim().substring(0, 2) ].name.split(',')[0] );
                                } else {
                                    nats_dis.push( "—" );
                                }
                            });
                            return nats_dis;
                        }
                        return data;
                    },
                    searchPanes: {
                        orthogonal: 'sp'
                    }
                },
                {   data: 'cont',
                    visible: false,
                    render: function( data, type ) {
                        if (type === 'filter' || type === 'sp' || type === 'display') {
                            return continents[ data ].name;
                        }
                        return data;
                    },
                    searchPanes: {
                        orthogonal: 'sp'
                    }
                }
            ],
            // default ordering
            order: [[2, 'asc']],
            pageLength: 20,
            // custom display lengths
            lengthMenu: [
                [15, 20, 25, 50, 100, -1],
                [15, 20, 25, 50, 100, 'All']
            ],
            pagingType: 'full_numbers',
            language: {
                paginate: {
                    first: '&laquo;',
                    last: '&raquo;',
                    next: '›',
                    previous: '‹'
                }
            },
            searchPanes: {
                layout: 'columns-2',
                cascadePanes: true,
                viewTotal: true,
                collapse: true,
                dtOpts: {
                    order: [[ 1, "desc" ]],
                    initComplete: function () {
                    },
                    select:{
                        style: 'multi'
                    }
                },
                order: ['Birth Date', 'Death Date', 'Birth Place', 'Death Place', 'Country', 'Continent', 'Gender'],
            },
            initComplete: function () {
                var url = new URL( window.location.href );
                var searchParams = new URLSearchParams( url.search );
                // search
                if ( searchParams.has('fq') ) {
                    var s_table = '';
                    var s_row = '';
                    searchParams.forEach((value, key) => {
                        switch ( value.split( ":" )[0] ) {
                            case "nat": 
                                setTimeout( function() {
                                    s_table = $('#DataTables_Table_4').DataTable();
                                    s_row = s_table.row(function ( idx, data, node ) {
                                        return data.filter === nations[ value.split( ":" )[1].substring(0, 2) ].name.split(',')[0] ?
                                            true : false;
                                    });
                                    s_table.row(s_row).select();
                                }, 10);
                            break;
                            case "sex": 
                                setTimeout( function() {
                                    s_table = $('#DataTables_Table_6').DataTable();
                                    s_row = s_table.row(function ( idx, data, node ) {
                                        return data.filter === value.split( ":" )[1] ?
                                            true : false;
                                    });
                                    s_table.row(s_row).select();
                                }, 10);
                            break;
                        }
                    });
                    setTimeout( function() {
                        $('#authorsDT thead').css( 'visibility','initial' );
                        $('.spinner').attr('style', 'display: none !important');
                    }, 100);

                } else {
                    $('#authorsDT thead').css( 'visibility','initial' );
                    $('.spinner').attr('style', 'display: none !important');
                }
            },
            search: {
                return: true
            },
            fixedHeader: {
                headerOffset: 55
            },
            // layout
            dom: 'ip<"dtsp-dataTable"lf>tip',
            //dom: '<"top"iflp<"clear">>rt<"bottom"iflp<"clear">>',
            // export buttons
            buttons: [
                {
                    extend: 'collection',
                    className: 'custom-html-collection',
                    text: 'Export/View',
                    buttons: [
                        '<h3>Export</h3>',
                        {
                            extend: 'copy',
                            exportOptions: {
                                columns: ':visible'
                            }
                        },
                        {
                            extend: 'csv',
                            exportOptions: {
                                columns: ':visible'
                            }
                        },
                        {
                            extend: 'excel',
                            exportOptions: {
                                columns: ':visible'
                            }
                        },
                        {
                            extend: 'pdfHtml5',
                            orientation: 'landscape',
                            download: 'open',
                            exportOptions: {
                                columns: ':visible'
                            }
                        },
                        {
                            extend: 'print',
                            orientation: 'landscape',
                            exportOptions: {
                                columns: ':visible'
                            }
                        },
                        '<h3 class="not-top-heading">Column Visibility</h3>',
                        'columnsToggle',
                        '<h3 class="not-top-heading">Restore Column Visibility</h3>',
                        'colvisRestore'
                    ]
                }
            ], 
            responsive: true

        });

        table.searchPanes();
        $("div.dtsp-verticalPanes").append(table.searchPanes.container());
        table.searchPanes.resizePanes();

        table.buttons().container()
            .insertBefore( '.dtsp-clearAll' );	

        $('#authorsDT').on( 'search.dt', function ( e, settings, len ) {
            setTimeout(function(){
                table.page( 'first' ).draw( 'page' );
            }, 200);
        });
        $('.dt-search').on('search', function (e) {
            table.search('').draw()
        });

    });
}
// works browse page (DT)
var initDataWorks = function() {
    $.when( loadPlaces(), loadNations(), loadPersons(), loadTexts(), loadWorks() ).done( function() {
        var wwrks = _.keyBy( works, 'id' );
        var wtxts = $.map(texts , function(value, index) {
            // include all originals as well as works that ONLY exist in translation
            if ( value.type === 'orig' || ( value.type.startsWith('trans') && _.groupBy( texts, 'work' )[ value.work ].length < 2 ) ) {
                if (!value.piso) { value.piso = ''; }
                if (!value.ciso) { value.ciso = ''; }
                value.lang = language[ wwrks[ value.work ].lang ].name;
                value.aut = wwrks[ value.work ].aut;
                value.nat = wwrks[ value.work ].aut;
                value.cont = wwrks[ value.work ].aut;
                return [value];
            }
        });

        /*
        {
            "text": "text00004",
            "firstline": "In Xanadu did Kubla Khan",
            "lastline": " And drunk the milk of Paradise. ",
            "title": "Kubla Khan",
            "work": "work00004",
            "comp": "November 1797",
            "publ": "1816",
            "type": "orig",
            "extent": "complete",
            "ciso": "1797-11",
            "piso": "1816"
        }
        */
        var table = $('#worksDT').DataTable({
            data: wtxts,
            columns: [
                { 	data: 'work',
                    visible: false,						
                    searchPanes: {
                        show: false
                    }
                },
                { 	data: 'text',
                    visible: false,						
                    searchPanes: {
                        show: false
                    }
                },
                { 	data: 'title',
                    visible: true,
                    render: function( data, type, row ) {
                        if (type === 'display') {
                            if (data != '') {
                                return `<a href="#text/`+row.text+`">`+wwrks[ row.work ].tit+( row.extent == 'excerpt'?" "+row.sub:'' )+`</a>`;
                            } else {
                                return '—';
                            }
                        } else {
                            return wwrks[ row.work ].tit+( row.extent == 'excerpt'?" "+row.sub:'' );
                        }
                    },
                    searchPanes: {
                        show: false
                    }
                },
                { 	data: 'lang',
                    render: function( data, type ) {
                        if (type === 'filter' || type === 'sp' || type === 'display') {
                            return data;
                        }
                        return data;
                    },
                    searchPanes: {
                        orthogonal: 'sp'
                    }
                },
                {   data: 'ciso',
                    render: function( data, type, row ) {
                        if( row.ciso != '' ) {
                            return row.ciso.replace( "-", "" ).substring(0,4);
                        } else return "—";
                    }
                },
                {   data: 'piso',
                    render: function( data, type, row ) {
                        if( row.piso != '' ) {
                            return row.piso.replace( "-", "" ).substring(0,4);
                        } else return "—";
                    }
                },
                {   data: 'extent',
                    render: function( data, type ) {
                        if (type === 'filter' || type === 'sp' || type === 'display') {
                            if ( data === 'complete' ) {
                                return 'full-text';
                            } else {
                                return data;
                            }
                        }
                        return data;
                    },
                    searchPanes: {
                        orthogonal: 'sp'
                    }
                },
                { 	data: 'firstline',
                    render: function( data, type ) {
                        return data.trim();
                    },
                    searchPanes: {
                        show: false
                    }
                },
                {   data: 'aut',
                    render: function( data, type, row ) {
                        if ( type === 'display' ) {
                            let auts_dis = [];
                            $.each( data.split(';'), function( i, v ) {
                                if (v.trim() != '' && v.trim() in persons) {
                                    auts_dis.push( `<a href="/authors/#id/`+v.trim()+`">`+persons[ v.trim() ].name+`</a>` );
                                } else {
                                    auts_dis.push( "—" );
                                }
                            });
                            return auts_dis.join( "; " );
                        }
                        if ( type === 'filter' ) {
                            let auts_dis = [];
                            $.each( data.split(';'), function( i, v ) {
                                if (v.trim() != '' && v.trim() in persons) {
                                    auts_dis.push( persons[ v.trim() ].name );
                                } else {
                                    auts_dis.push( "—" );
                                }
                            });
                            return auts_dis.join( "; " );
                        }
                        if ( type === 'sp' ) {
                            let auts_dis = [];
                            $.each( data.split(';'), function( i, v ) {
                                if (v.trim() != '' && v.trim() in persons) {
                                    auts_dis.push( truncateString(persons[ v.trim() ].name,22) );
                                } else {
                                    auts_dis.push( "—" );
                                }
                            });
                            return auts_dis;
                        }
                        return data;
                    },
                    searchPanes: {
                        orthogonal: 'sp'
                    }
                },
                {   data: 'nat',
                    render: function( data, type, row ) {
                        var nats_prc = [];
                        $.each( data.split(';'), function( i, v ) {
                            if (v.trim() != '' && v.trim() in persons) {
                                nats_prc.push( persons[ v.trim() ].nat );
                            }
                        });
                        data = nats_prc.join( ";" );
                        if ( type === 'display' || type === 'filter' ) {
                            let nats_dis = [];
                            $.each( data.split(';'), function( i, v ) {
                                if (v.trim() != '' && v.trim().substring(0, 2) in nations) {
                                    nats_dis.push( nations[ v.trim().substring(0, 2) ].name.split(',')[0] );
                                } else {
                                    nats_dis.push( "—" );
                                }
                            });
                            return nats_dis.join( "; " );
                        }
                        if ( type === 'sp' ) {
                            let nats_dis = [];
                            $.each( data.split(';'), function( i, v ) {
                                if (v.trim() != '' && v.trim().substring(0, 2) in nations) {
                                    nats_dis.push( nations[ v.trim().substring(0, 2) ].name.split(',')[0] );
                                } else {
                                    nats_dis.push( "—" );
                                }
                            });
                            return nats_dis;
                        }
                        return data;
                    },
                    searchPanes: {
                        orthogonal: 'sp'
                    }
                },
                {   data: 'cont',
                    visible: false,
                    render: function( data, type, row ) {
                        var conts_prc = [];
                        $.each( data.split(';'), function( i, v ) {
                            if (v.trim() != '' && v.trim() in persons) {
                                conts_prc.push( nations[ persons[ v.trim() ].nat.substring(0,2) ].cont );
                            }
                        });
                        data = conts_prc.join( ";" );
                        if ( type === 'display' || type === 'filter' ) {
                            let conts_dis = [];
                            $.each( data.split(';'), function( i, v ) {
                                if (v.trim() != '' && v.trim() in continents) {
                                    conts_dis.push( continents[ v.trim() ].name );
                                } else {
                                    conts_dis.push( "—" );
                                }
                            });
                            return conts_dis.join( "; " );
                        }
                        if ( type === 'sp' ) {
                            let conts_dis = [];
                            $.each( data.split(';'), function( i, v ) {
                                if (v.trim() != '' && v.trim() in continents ) {
                                    conts_dis.push( continents[ v.trim() ].name );
                                } else {
                                    conts_dis.push( "—" );
                                }
                            });
                            return conts_dis;
                        }
                        return data;
                    },
                    searchPanes: {
                        orthogonal: 'sp'
                    }
                }
            ],
            // default ordering
            order: [[2, 'asc']],
            pageLength: 20,
            // custom display lengths
            lengthMenu: [
                [15, 20, 25, 50, 100, -1],
                [15, 20, 25, 50, 100, 'All']
            ],
            pagingType: 'full_numbers',
            language: {
                paginate: {
                    first: '&laquo;',
                    last: '&raquo;',
                    next: '›',
                    previous: '‹'
                }
            },
            searchPanes: {
                layout: 'columns-2',
                cascadePanes: true,
                viewTotal: true,
                collapse: true,
                dtOpts: {
                    order: [[ 1, "desc" ]],
                    initComplete: function () {
                    },
                    select:{
                        style: 'multi'
                    }
                },
                order: ['Comp.', 'Publ.', 'Language', 'Extent', 'Author Name', 'Author Country', 'Author Continent'],
            },
            initComplete: function () {
                var url = new URL( window.location.href );
                var searchParams = new URLSearchParams( url.search );
                // search
                if ( searchParams.has('fq') ) {
                    var s_table = '';
                    var s_row = '';
                    searchParams.forEach((value, key) => {
                        switch ( value.split( ":" )[0] ) {
                            case "nat": 
                                setTimeout( function() {
                                    s_table = $('#DataTables_Table_4').DataTable();
                                    s_row = s_table.row(function ( idx, data, node ) {
                                        return data.filter === mags[ value.split( ":" )[1] ].dis ?
                                            true : false;
                                    });
                                    s_table.row(s_row).select();
                                }, 10);
                            break;
                            case "sex": 
                                setTimeout( function() {
                                    s_table = $('#DataTables_Table_5').DataTable();
                                    s_row = s_table.row(function ( idx, data, node ) {
                                        return data.filter === value.split( ":" )[1] ?
                                            true : false;
                                    });
                                    s_table.row(s_row).select();
                                }, 10);
                            break;
                        }
                    });
                    setTimeout( function() {
                        $('#worksDT thead').css( 'visibility','initial' );
                        $('.spinner').attr('style', 'display: none !important');
                    }, 100);
                } else {
                    $('#worksDT thead').css( 'visibility','initial' );
                    $('.spinner').attr('style', 'display: none !important');
                }
            },
            search: {
                return: true
            },
            fixedHeader: {
                headerOffset: 55
            },
            // layout
            dom: 'ip<"dtsp-dataTable"lf>tip',
            //dom: '<"top"iflp<"clear">>rt<"bottom"iflp<"clear">>',
            // export buttons
            buttons: [
                {
                    extend: 'collection',
                    className: 'custom-html-collection',
                    text: 'Export/View',
                    buttons: [
                        '<h3>Export</h3>',
                        {
                            extend: 'copy',
                            exportOptions: {
                                columns: ':visible'
                            }
                        },
                        {
                            extend: 'csv',
                            exportOptions: {
                                columns: ':visible'
                            }
                        },
                        {
                            extend: 'excel',
                            exportOptions: {
                                columns: ':visible'
                            }
                        },
                        {
                            extend: 'pdfHtml5',
                            orientation: 'landscape',
                            download: 'open',
                            exportOptions: {
                                columns: ':visible'
                            }
                        },
                        {
                            extend: 'print',
                            orientation: 'landscape',
                            exportOptions: {
                                columns: ':visible'
                            }
                        },
                        '<h3 class="not-top-heading">Column Visibility</h3>',
                        'columnsToggle',
                        '<h3 class="not-top-heading">Restore Column Visibility</h3>',
                        'colvisRestore'
                    ]
                }
            ], 
            responsive: true

        });

        table.searchPanes();
        $("div.dtsp-verticalPanes").append(table.searchPanes.container());
        table.searchPanes.resizePanes();

        table.buttons().container()
            .insertBefore( '.dtsp-clearAll' );	

        $('#worksDT').on( 'search.dt', function ( e, settings, len ) {
            setTimeout(function(){
                table.page( 'first' ).draw( 'page' );
            }, 200);
        });
        $('.dt-search').on('search', function (e) {
            table.search('').draw()
        });

    });
}

//  display a global text
/*  This function 
    - retrieves all expression - manifestation/excerpt information for a work
    - creates the .globaltext-workbench canvas (only in editing mode)
    - draws the globaltext onto the .globaltext-container (drawGlobalText)
    - retrieves and processes contexts/building blocks for the globaltext (processGlobalText) (reading/editing mode)
    - attaches event handlers to the globaltext-workbench canvas (only in editing mode)
*/
async function display_globaltext( tid, wid ) {

    // retrieve RDF in JSON-LD
    // get work, expression, manifestation/excerpt, and master/deliverables
    var q = namespaces+`SELECT DISTINCT ?s ?p ?o ?g
	WHERE {
        {
  			<https://www.romanticperiodpoetry.org/id/`+wid+`/work> ?p ?o .
            BIND(<https://www.romanticperiodpoetry.org/id/`+wid+`/work> AS ?s)
        } UNION {
      		<https://www.romanticperiodpoetry.org/id/`+wid+`/work> lrmoo:R3_is_realised_in ?o2 .
        	?o2 ?p ?o.
            BIND(?o2 AS ?s)
        } UNION {
      		<https://www.romanticperiodpoetry.org/id/`+wid+`/work> lrmoo:R3_is_realised_in ?o2 .
  			?o2 (lrmoo:R4i_is_embodied_in|lrmoo:R15_has_fragment) ?o3 .
    		?o3 ?p ?o.
            BIND(?o3 AS ?s)
        } UNION {
      		<https://www.romanticperiodpoetry.org/id/`+wid+`/work> lrmoo:R3_is_realised_in ?o2 .
  			?o2 (lrmoo:R4i_is_embodied_in|lrmoo:R15_has_fragment) ?o3 .
    		?o3 <http://www.cidoc-crm.org/cidoc-crm/P106_is_composed_of> ?o4.
    		?o4 ?p ?o .
            BIND(?o4 AS ?s)
        }
    	BIND(<default> AS ?g)
    }
        ORDER BY ?s`;
    var r = await getJSONLD( q );

    // add work to workbench
    workbench[ wid ] = _.keyBy( r.graph, 'id');

    // create canvas for editing mode
    if ( mode == "edit" ) {
        zInd = zInd+1;
        if ( $('.offcanvas.show').length ) { 
            myCanvasGT.hide(); // close any open texts if a new one is requested
            $(".popover").hide(); // hide if new text was called from a popover
        }
        // create global text canvas
        var genericCloseBtnHtml = '<button onclick="$(this).closest(\'div.offcanvas\').dispose();" type="button" class="btn-close" aria-hidden="true" style="float:right;"></button>';
        var text = `<!-- Canvas -->
            <div style="z-index:`+zInd+`;overflow:inherit;" class="offcanvas offcanvas-start globaltext-workbench" data-bs-backdrop="static" tabindex="-1" id="staticBackdrop" aria-labelledby="staticBackdropLabel">
                <div class="offcanvas-body globaltext-container" data-wid="`+wid+`" data-tid="`+tid+`">`+
//                    genericCloseBtnHtml+`
                    `<button type="button" class="btn-close" style="float:right;" data-mode="read" data-bs-dismiss="offcanvas" aria-label="Close"></button>
                    <!--
                    <div class="tools" style="float:right;">
                        <input `+((user == undefined && username == undefined)?'disabled':'')+` style="height:36px;width:123px;" class="changeMode" type="checkbox" checked data-toggle="toggle" data-wid="`+wid+`" data-tid="`+tid+`" id="changeMode-flip" data-mode="edit" data-onlabel="Reading" data-offlabel="Editing" data-onstyle="warning" data-offstyle="success">
                        `+((user == undefined && username == undefined)?'<label> <button type="button" class="btn btn-sm sso-sign-in" style="background-color:var(--bs-orange);color:#fff;margin-left:5px;margin-top:-4px;">Sign in</button></label>':'')+`
                    </div>
                    -->
                            <div class="globaltext">
                            </div>
                    
                            <div class="col-sm-4 contexts">
                            </div>
                            <div class="col-sm-4 workbench">
                            <h2>Current selections</h2><ul class="bb"></ul>
                            </div>
                    
                </div>
            </div>`;
        $( "body" ).prepend( text );
    }
    // create global text
    drawGlobalText( tid, wid );
    // activate text pane
    $( '#'+$( $("#"+tid).closest( ".tab-pane" )[0] ).attr( 'id' )+'-tab' )[0].click();
    // process contexts/building-blocks
    processGlobalText( tid, wid );
    
    // attach handlers for editing
    if ( mode == "edit" ) {
        myCanvasGTEl = document.getElementsByClassName( "globaltext-workbench" )[0];
        myCanvasGT = new bootstrap.Offcanvas(myCanvasGTEl, {
            backdrop: 'static',
            keyboard: false
        }).show();

        // on showing canvas
        myCanvasGTEl.addEventListener('shown.bs.offcanvas', function (event) {
            $( ".globaltext-workbench .globaltext" ).position({
                my: "center",
                at: "center",
                of: ".globaltext-container"
            });
        });
        // on closing canvas
        myCanvasGTEl.addEventListener('hide.bs.offcanvas', function (event) {
            mode = 'read';
            $( "#mode" ).remove();
            $(".popover").remove();
            $(this).remove();
            zInd = 1054;
            done_tooltipTriggerList = [];
            done_popoverTriggerList = [];
            clearInterval( t );
            annos = {};
            annotorious = {};
            updateDOM();
            // TODO: do this only on SUCCESSFUL contribution!
            //processGlobalText( tid, wid )
        });
    }
}

/*  This function creates the globaltext DOM for all expressions available for
    the work. It
    - initializes all tools (TEI text, Openseadragon, Wavesurfer, ...)
    - generates the tabbable view for each of the available expressions
    - adds the globaltext to the DOM
*/
function drawGlobalText( tid, wid ) {
    var imgset_id = undefined, prfset_id = undefined;
    var openseadragonOptions = {
        showNavigator: true,
        showRotationControl: true,
        gestureSettingsTouch: {
            pinchRotate: true
        },
        prefixUrl: "/js/openseadragon-bin-3.1.0/openseadragon-flat-toolbar-icons-master/images/",
        sequenceMode: true,
        preserveViewport: true
    };
    // populate global text
    // load work's realization(s)
    var tab_content = "", tab_nav = "", excerpt = null, excerpt_saved = null, sources = [], texts = [], madeActive = false;
    for (i=0; i<workbench[ wid ][ domain+"/id/"+wid+"/work" ][ "lrmoo:R3_is_realised_in" ].length; i++ ) { // expressions
        var nav_name = '', cnt_lang = '';
        cnt_lang = workbench[ wid ][ workbench[ wid ][ domain+"/id/"+wid+"/work" ][ "lrmoo:R3_is_realised_in" ][i].id ][ "crm:P72_has_language" ];
        // navigation

        if ( madeActive == false ) {
            if ( _.findIndex(workbench[ wid ][ workbench[ wid ][ domain+"/id/"+wid+"/work" ][ "lrmoo:R3_is_realised_in" ][i].id ][ "crm:P2_has_type" ], function(typ) { return typ.id == 'lct:txt' }) != -1 ) {
                if ( workbench[ wid ][ workbench[ wid ][ domain+"/id/"+wid+"/work" ][ "lrmoo:R3_is_realised_in" ][i].id ].hasOwnProperty( 'lrmoo:R15_has_fragment' ) ) {
                    nav_name = 'Text (excerpt)';
                } else if ( workbench[ wid ][ workbench[ wid ][ domain+"/id/"+wid+"/work" ][ "lrmoo:R3_is_realised_in" ][i].id ].hasOwnProperty( 'lrmoo:R4i_is_embodied_in' ) ) {
                    nav_name = 'Text';
                }
            }
        } else if ( _.findIndex(workbench[ wid ][ workbench[ wid ][ domain+"/id/"+wid+"/work" ][ "lrmoo:R3_is_realised_in" ][i].id ][ "crm:P2_has_type" ], function(typ) { return typ.id == 'lct:txt' }) != -1 ) {
            if ( workbench[ wid ][ workbench[ wid ][ domain+"/id/"+wid+"/work" ][ "lrmoo:R3_is_realised_in" ][i].id ].hasOwnProperty( 'lrmoo:R15_has_fragment' ) ) {
                nav_name = 'Translation (<code>'+cnt_lang+'</code>) (excerpt)';
            } else if ( workbench[ wid ][ workbench[ wid ][ domain+"/id/"+wid+"/work" ][ "lrmoo:R3_is_realised_in" ][i].id ].hasOwnProperty( 'lrmoo:R4i_is_embodied_in' ) ) {
                nav_name = 'Translation (<code>'+cnt_lang+'</code>)';
            }
        } else if ( _.findIndex(workbench[ wid ][ workbench[ wid ][ domain+"/id/"+wid+"/work" ][ "lrmoo:R3_is_realised_in" ][i].id ][ "crm:P2_has_type" ], function(typ) { return typ.id == 'sc:Manifest' || typ.id == 'lct:img' || typ.id == 'lct:dig'}) != -1) {
            if ( workbench[ wid ][ workbench[ wid ][ domain+"/id/"+wid+"/work" ][ "lrmoo:R3_is_realised_in" ][i].id ].hasOwnProperty( 'lrmoo:R15_has_fragment' ) ) {
                nav_name = 'Facsimile (excerpt)';
            } else if ( workbench[ wid ][ workbench[ wid ][ domain+"/id/"+wid+"/work" ][ "lrmoo:R3_is_realised_in" ][i].id ].hasOwnProperty( 'lrmoo:R4i_is_embodied_in' ) ) {
                nav_name = 'Facsimile';
            }
        } else if ( _.findIndex(workbench[ wid ][ workbench[ wid ][ domain+"/id/"+wid+"/work" ][ "lrmoo:R3_is_realised_in" ][i].id ][ "crm:P2_has_type" ], function(typ) { return typ.id == 'lct:aud' || typ.id == 'lct:mov' }) != -1) {
            if ( workbench[ wid ][ workbench[ wid ][ domain+"/id/"+wid+"/work" ][ "lrmoo:R3_is_realised_in" ][i].id ].hasOwnProperty( 'lrmoo:R15_has_fragment' ) ) {
                nav_name = 'Performance (excerpt)';
            } else {
                nav_name = 'Performance';
            }
        } else {
            console.log( 'Error: unknown content type' );
        }
        if ( nav_name != '' ) {
            tab_nav += `<li class="nav-item" role="presentation">
                <button class="nav-link`+((madeActive==false)?' active':'')+`" id="pills-`+i+`-tab" data-bs-toggle="pill" data-bs-target="#pills-`+i+`"
                    type="button" role="tab" aria-controls="pills-`+i+`" aria-selected="true"
                    data-expr="`+workbench[ wid ][ workbench[ wid ][ domain+"/id/"+wid+"/work" ][ "lrmoo:R3_is_realised_in" ][i].id ].id+`" `;
                    if ( workbench[ wid ][ workbench[ wid ][ domain+"/id/"+wid+"/work" ][ "lrmoo:R3_is_realised_in" ][i].id ].hasOwnProperty( 'lrmoo:R15_has_fragment' ) ||
                         workbench[ wid ][ workbench[ wid ][ domain+"/id/"+wid+"/work" ][ "lrmoo:R3_is_realised_in" ][i].id ].hasOwnProperty( 'lrmoo:R4i_is_embodied_in' ) ) {
                        if ( workbench[ wid ][ workbench[ wid ][ domain+"/id/"+wid+"/work" ][ "lrmoo:R3_is_realised_in" ][i].id ].hasOwnProperty( 'lrmoo:R15_has_fragment' ) ) {
                            excerpt = _.findIndex( workbench[ wid ][ workbench[ wid ][ domain+"/id/"+wid+"/work" ][ "lrmoo:R3_is_realised_in" ][i].id ][ "lrmoo:R15_has_fragment" ], function(typ) { 
                                return workbench[ wid ][ workbench[ wid ][ typ.id ][ "crm:P106_is_composed_of" ][0]["id"]][ "crm:P106_is_composed_of" ][0].id.includes( '/'+tid+'/' );
                            });
                            if ( excerpt != -1 ) {
                                tab_nav += `data-digo = "`+workbench[ wid ][ workbench[ wid ][ domain+"/id/"+wid+"/work" ][ 'lrmoo:R3_is_realised_in'][i].id]['lrmoo:R15_has_fragment'][excerpt].id+`" `
                                excerpt_saved = excerpt;
                            } else {
                                excerpt = excerpt_saved;
                                try { tab_nav += `data-digo = "`+workbench[ wid ][ workbench[ wid ][ domain+"/id/"+wid+"/work" ][ 'lrmoo:R3_is_realised_in'][i].id]['lrmoo:R15_has_fragment'][excerpt].id+`" ` } catch(e) {}
                            }
                        } else {
                            tab_nav += `data-digo = "`+workbench[ wid ][ workbench[ wid ][ domain+"/id/"+wid+"/work" ][ 'lrmoo:R3_is_realised_in'][i].id]['lrmoo:R4i_is_embodied_in'].id+`" `
                        }
                    }
                    tab_nav += `data-work="`+domain+"/id/"+wid+"/work"+`">`+nav_name+`</button>
                </li>`;
        } else { continue; }
        // content
        var cnt_loc = null;
        if ( _.findIndex(workbench[ wid ][ workbench[ wid ][ domain+"/id/"+wid+"/work" ][ "lrmoo:R3_is_realised_in" ][i].id ][ "crm:P2_has_type" ], function(typ) { return typ.id == 'lct:txt' }) != -1 ) {
            if ( workbench[ wid ][ workbench[ wid ][ domain+"/id/"+wid+"/work" ][ "lrmoo:R3_is_realised_in" ][i].id ].hasOwnProperty( 'lrmoo:R15_has_fragment' ) ) { // fragments
                if ( madeActive == false && tid != '' ) {                                                                                                                         // text (one fragment)
                    excerpt = _.findIndex( workbench[ wid ][ workbench[ wid ][ domain+"/id/"+wid+"/work" ][ "lrmoo:R3_is_realised_in" ][i].id ][ "lrmoo:R15_has_fragment" ], function(typ) { 
                        return workbench[ wid ][ workbench[ wid ][ typ.id ][ "crm:P106_is_composed_of" ][0]["id"]][ "crm:P106_is_composed_of" ][0].id.includes( '/'+tid+'/' );
                    });
                } else if ( tid == '' ) {                                                                                                                            // work (all fragments)
                    tab_content += `<div class="tab-pane fade show`+((madeActive==false)?' active':'')+`" id="pills-`+i+`" role="tabpanel" aria-labelledby="pills-`+i+`-tab" lang="`+cnt_lang+`">`;
                    $.each(  workbench[ wid ][ workbench[ wid ][ domain+"/id/"+wid+"/work" ][ "lrmoo:R3_is_realised_in" ][i].id ][ "lrmoo:R15_has_fragment" ], function( j, frag ) {
                        tab_content += function () { var tmp = null; $.ajax({ 'async': false, 'type': "POST", 'dataType': 'html', 'url': workbench[ wid ][ workbench[ wid ][ frag.id ][ "crm:P106_is_composed_of" ][0].id ][ "crm:P106_is_composed_of" ][0], 
                                'success': function (data) { tmp = data; } }); return tmp; }()+'<br style="clear:both;"></br>'
                    });
                    tab_content += `</div>`;
                }
                if ( tid != '' && excerpt != -1 ) {
                    cnt_loc = workbench[ wid ][ workbench[ wid ][ workbench[ wid ][ domain+"/id/"+wid+"/work" ][ "lrmoo:R3_is_realised_in" ][i].id ][ "lrmoo:R15_has_fragment" ][excerpt].id ][ "crm:P106_is_composed_of" ]
                } else {
                    excerpt = excerpt_saved;
                    try { cnt_loc = workbench[ wid ][ workbench[ wid ][ workbench[ wid ][ domain+"/id/"+wid+"/work" ][ "lrmoo:R3_is_realised_in" ][i].id ][ "lrmoo:R15_has_fragment" ][excerpt].id ][ "crm:P106_is_composed_of" ] } catch(e) {}
                }
            } else {                                                                                                                                                 // manifestations
                try { 
                    cnt_loc = workbench[ wid ][ workbench[ wid ][ workbench[ wid ][ domain+"/id/"+wid+"/work" ][ "lrmoo:R3_is_realised_in" ][i].id ][ "lrmoo:R4i_is_embodied_in" ].id ][ "crm:P106_is_composed_of" ];
                    texts.push( workbench[ wid ][ workbench[ wid ][ workbench[ wid ][ domain+"/id/"+wid+"/work" ][ "lrmoo:R3_is_realised_in" ][i].id ][ "lrmoo:R4i_is_embodied_in" ].id ][ "crm:P48_has_preferred_identifier" ] );
                }
                catch { }
            }
            if ( tid != '' && cnt_loc != null ) {
                tab_content += `<div class="tab-pane fade show`+((madeActive==false)?' active':'')+`" id="pills-`+i+`" role="tabpanel" aria-labelledby="pills-`+i+`-tab" lang="`+cnt_lang+`"> 
                    <div id="`+cnt_loc[0].id+`" data-iid="`+cnt_loc[0].id+`" data-id="https://www.romanticperiodpoetry.org/id/`+wid+`/work"
                    data-expr="`+workbench[ wid ][ workbench[ wid ][ domain+"/id/"+wid+"/work" ][ "lrmoo:R3_is_realised_in" ][i].id ].id+`" `;
                    if ( workbench[ wid ][ workbench[ wid ][ domain+"/id/"+wid+"/work" ][ "lrmoo:R3_is_realised_in" ][i].id ].hasOwnProperty( 'lrmoo:R15_has_fragment' ) ||
                        workbench[ wid ][ workbench[ wid ][ domain+"/id/"+wid+"/work" ][ "lrmoo:R3_is_realised_in" ][i].id ].hasOwnProperty( 'lrmoo:R4i_is_embodied_in' ) ) {
                        if ( workbench[ wid ][ workbench[ wid ][ domain+"/id/"+wid+"/work" ][ "lrmoo:R3_is_realised_in" ][i].id ].hasOwnProperty( 'lrmoo:R15_has_fragment' ) ) {
                            excerpt = _.findIndex( workbench[ wid ][ workbench[ wid ][ domain+"/id/"+wid+"/work" ][ "lrmoo:R3_is_realised_in" ][i].id ][ "lrmoo:R15_has_fragment" ], function(typ) { 
                                return workbench[ wid ][ workbench[ wid ][ typ.id ][ "crm:P106_is_composed_of" ][0]["id"]][ "crm:P106_is_composed_of" ][0].id.includes( '/'+tid+'/' );
                            });
                            if ( excerpt != -1 ) {
                                tab_content += `data-digo = "`+workbench[ wid ][ workbench[ wid ][ domain+"/id/"+wid+"/work" ][ 'lrmoo:R3_is_realised_in'][i].id]['lrmoo:R15_has_fragment'][excerpt].id+`" `
                                excerpt_saved = excerpt;
                            } else {
                                excerpt = excerpt_saved;
                                try { tab_content += `data-digo = "`+workbench[ wid ][ workbench[ wid ][ domain+"/id/"+wid+"/work" ][ 'lrmoo:R3_is_realised_in'][i].id]['lrmoo:R15_has_fragment'][excerpt].id+`" `} catch(e) {}
                            }
                        } else {
                            tab_content += `data-digo = "`+workbench[ wid ][ workbench[ wid ][ domain+"/id/"+wid+"/work" ][ 'lrmoo:R3_is_realised_in'][i].id]['lrmoo:R4i_is_embodied_in'].id+`" `
                        }
                    }
                    tab_content += `>`+ function () { var tmp = null; $.ajax({ 'async': false, 'type': "POST", 'dataType': 'html', 'url': workbench[ wid ][ cnt_loc[0].id ][ "crm:P106_is_composed_of" ][0].id, 
                            'success': function (data) { tmp = data; } }); return tmp; }()
                    +`</div></div>`;
            }
        } else if ( _.findIndex(workbench[ wid ][ workbench[ wid ][ domain+"/id/"+wid+"/work" ][ "lrmoo:R3_is_realised_in" ][i].id ][ "crm:P2_has_type" ], function(typ) { return typ.id == 'lct:img' }) != -1 ) {
            cnt_loc = workbench[ wid ][ workbench[ wid ][ workbench[ wid ][ domain+"/id/"+wid+"/work" ][ "lrmoo:R3_is_realised_in" ][i].id ][ "lrmoo:R4i_is_embodied_in" ].id ][ "crm:P106_is_composed_of" ]
            tab_content += `<div class="tab-pane fade show`+((madeActive==false)?' active':'')+`" id="pills-`+i+`" role="tabpanel" aria-labelledby="pills-`+i+`-tab" lang="`+cnt_lang+`">
                <div id="`+cnt_loc[0].id+`" data-iid="`+cnt_loc[0].id+`" data-id="https://www.romanticperiodpoetry.org/id/`+wid+`/work"
                data-expr="`+workbench[ wid ][ workbench[ wid ][ domain+"/id/"+wid+"/work" ][ "lrmoo:R3_is_realised_in" ][i].id ].id+`" style="height:inherit;" `;
                if ( workbench[ wid ][ workbench[ wid ][ domain+"/id/"+wid+"/work" ][ "lrmoo:R3_is_realised_in" ][i].id ].hasOwnProperty( 'lrmoo:R15_has_fragment' ) ||
                    workbench[ wid ][ workbench[ wid ][ domain+"/id/"+wid+"/work" ][ "lrmoo:R3_is_realised_in" ][i].id ].hasOwnProperty( 'lrmoo:R4i_is_embodied_in' ) ) {
                    if ( workbench[ wid ][ workbench[ wid ][ domain+"/id/"+wid+"/work" ][ "lrmoo:R3_is_realised_in" ][i].id ].hasOwnProperty( 'lrmoo:R15_has_fragment' ) ) {
                        excerpt = _.findIndex( workbench[ wid ][ workbench[ wid ][ domain+"/id/"+wid+"/work" ][ "lrmoo:R3_is_realised_in" ][i].id ][ "lrmoo:R15_has_fragment" ], function(typ) { 
                            return workbench[ wid ][ workbench[ wid ][ typ.id ][ "crm:P106_is_composed_of" ][0]["id"]][ "crm:P106_is_composed_of" ][0].id.includes( '/'+tid+'/' );
                        });
                        if ( excerpt != -1 ) {
                            tab_content += `data-digo = "`+workbench[ wid ][ workbench[ wid ][ domain+"/id/"+wid+"/work" ][ 'lrmoo:R3_is_realised_in'][i].id]['lrmoo:R15_has_fragment'][excerpt].id+`" `
                            excerpt_saved = excerpt;
                        } else {
                            excerpt = excerpt_saved;
                            try { tab_content += `data-digo = "`+workbench[ wid ][ workbench[ wid ][ domain+"/id/"+wid+"/work" ][ 'lrmoo:R3_is_realised_in'][i].id]['lrmoo:R15_has_fragment'][excerpt].id+`" `} catch(e) {}
                        }
                    } else {
                        tab_content += `data-digo = "`+workbench[ wid ][ workbench[ wid ][ domain+"/id/"+wid+"/work" ][ 'lrmoo:R3_is_realised_in'][i].id]['lrmoo:R4i_is_embodied_in'].id+`" `
                    }
                }
                tab_content += `><div id='openseadragon_`+(mode == 'edit'?'editing_'+cnt_loc[0].id:(mode == 'view')?'viewing_'+cnt_loc[0].id:cnt_loc[0].id)+`' style='overflow: auto; height: inherit;'></div>`
                +`</div></div>`;
            //imgset_id = cnt_loc[0].id;
            imgset_id = "viewer_"+(mode == 'edit'?'editing_'+cnt_loc[0].id:(mode == 'view')?'viewing_'+cnt_loc[0].id:cnt_loc[0].id);
            sources = [];
            $.each(workbench[ wid ][ cnt_loc[0].id ][ "crm:P106_is_composed_of" ].sort(), function(i,v) {
                var tilesource = {
                    type: "image",
                    url: v.id // (( component["crm:P2_has_type"]["id"] == "prisms:unavailable")?"/images/notavailable.jpg":v)
                };
                sources.push( tilesource );
            });
            if ( mode == 'edit') {
                openseadragonOptions.id = "openseadragon_editing_"+cnt_loc[0].id;
            } else if ( mode == 'read') {
                openseadragonOptions.id = "openseadragon_"+cnt_loc[0].id;
            } else {
                openseadragonOptions.id = "openseadragon_viewing_"+cnt_loc[0].id;
            }
            openseadragonOptions.tileSources = sources;
        } else if ( _.findIndex(workbench[ wid ][ workbench[ wid ][ domain+"/id/"+wid+"/work" ][ "lrmoo:R3_is_realised_in" ][i].id ][ "crm:P2_has_type" ], function(typ) { return typ.id == 'lct:aud' }) != -1 ) {
            if ( workbench[ wid ][ workbench[ wid ][ domain+"/id/"+wid+"/work" ][ "lrmoo:R3_is_realised_in" ][i].id ].hasOwnProperty( 'lrmoo:R15_has_fragment' ) ) { // fragments
                cnt_loc = workbench[ wid ][ workbench[ wid ][ workbench[ wid ][ domain+"/id/"+wid+"/work" ][ "lrmoo:R3_is_realised_in" ][i].id ][ "lrmoo:R15_has_fragment" ][0].id ][ "crm:P106_is_composed_of" ];
            } else {
                cnt_loc = workbench[ wid ][ workbench[ wid ][ workbench[ wid ][ domain+"/id/"+wid+"/work" ][ "lrmoo:R3_is_realised_in" ][i].id ][ "lrmoo:R4i_is_embodied_in" ].id ][ "crm:P106_is_composed_of" ];
            }
            //prfset_id = cnt_loc[0].id;
            prfset_id = "player_"+(mode == 'edit'?'editing_'+cnt_loc[0].id:(mode == 'view')?'viewing_'+cnt_loc[0].id:cnt_loc[0].id);
            tab_content += `<div class="tab-pane fade show`+((madeActive==false)?' active':'')+`" id="pills-`+i+`" role="tabpanel" aria-labelledby="pills-`+i+`-tab" lang="`+cnt_lang+`">
                <div id="`+cnt_loc[0].id+`" data-iid="`+cnt_loc[0].id+`" data-id="https://www.romanticperiodpoetry.org/id/`+wid+`/work"
                    data-expr="`+workbench[ wid ][ workbench[ wid ][ domain+"/id/"+wid+"/work" ][ "lrmoo:R3_is_realised_in" ][i].id ].id+`" `;
                if ( workbench[ wid ][ workbench[ wid ][ domain+"/id/"+wid+"/work" ][ "lrmoo:R3_is_realised_in" ][i].id ].hasOwnProperty( 'lrmoo:R15_has_fragment' ) ||
                    workbench[ wid ][ workbench[ wid ][ domain+"/id/"+wid+"/work" ][ "lrmoo:R3_is_realised_in" ][i].id ].hasOwnProperty( 'lrmoo:R4i_is_embodied_in' ) ) {
                    if ( workbench[ wid ][ workbench[ wid ][ domain+"/id/"+wid+"/work" ][ "lrmoo:R3_is_realised_in" ][i].id ].hasOwnProperty( 'lrmoo:R15_has_fragment' ) ) {
                        excerpt = _.findIndex( workbench[ wid ][ workbench[ wid ][ domain+"/id/"+wid+"/work" ][ "lrmoo:R3_is_realised_in" ][i].id ][ "lrmoo:R15_has_fragment" ], function(typ) { 
                            return workbench[ wid ][ workbench[ wid ][ typ.id ][ "crm:P106_is_composed_of" ][0]["id"]][ "crm:P106_is_composed_of" ][0].id.includes( '/'+tid+'/' );
                        });
                        if ( excerpt != -1 ) {
                            tab_content += `data-digo = "`+workbench[ wid ][ workbench[ wid ][ domain+"/id/"+wid+"/work" ][ 'lrmoo:R3_is_realised_in'][i].id]['lrmoo:R15_has_fragment'][excerpt].id+`" `
                            excerpt_saved = excerpt;
                        } else {
                            excerpt = excerpt_saved;
                            try { tab_content += `data-digo = "`+workbench[ wid ][ workbench[ wid ][ domain+"/id/"+wid+"/work" ][ 'lrmoo:R3_is_realised_in'][i].id]['lrmoo:R15_has_fragment'][excerpt].id+`" `} catch(e) {}
                        }
                    } else {
                        tab_content += `data-digo = "`+workbench[ wid ][ workbench[ wid ][ domain+"/id/"+wid+"/work" ][ 'lrmoo:R3_is_realised_in'][i].id]['lrmoo:R4i_is_embodied_in'].id+`" `
                    }
                }
                tab_content += `><div id="waveform_`+(mode == 'edit'?'editing_'+cnt_loc[0].id:(mode == 'view')?'viewing_'+cnt_loc[0].id:cnt_loc[0].id)+`" class="waveform" data-load="`+workbench[ wid ][ cnt_loc[0].id ][ "crm:P106_is_composed_of" ][0].id+`"></div>`+
                `<div id="wavetimeline_`+(mode == 'edit'?'editing_'+cnt_loc[0].id:(mode == 'view')?'viewing_'+cnt_loc[0].id:cnt_loc[0].id)+`"></div>`+
                `<div class="controls" style="text-align:center;margin-top:20px;">
                    <button class="btn" onclick="player[ '`+prfset_id+`' ].stop()">
                        <i class="fa fa-step-backward"></i>
                    </button>
                    <button class="btn" onclick="player[ '`+prfset_id+`' ].skipBackward()">
                        <i class="fa fa-backward"></i> 
                    </button>
                    <button class="btn" onclick="player[ '`+prfset_id+`' ].playPause()">
                        <i class="fa fa-play"></i> <i class="fa fa-pause"></i> 
                    </button>
                    <button class="btn" onclick="player[ '`+prfset_id+`' ].skipForward()">
                        <i class="fa fa-forward"></i>
                    </button>
                    <button class="btn" onclick="player[ '`+prfset_id+`' ].toggleMute()">
                        <i class="fa fa-volume-off"></i>
                    </button>
                    Zoom: <input type="range" min="1" max="100" value="20" style="vertical-align:middle;"/>
                </div><br/>`+
                `<div class="attribution"><div><span>Performance:</span><span>`+workbench[ wid ][ workbench[ wid ][ domain+"/id/"+wid+"/work" ][ "lrmoo:R3_is_realised_in" ][i].id ][ "dcterms:contributor" ]+`</span></div>
                 <div><span>Source:</span><span>`+workbench[ wid ][ workbench[ wid ][ domain+"/id/"+wid+"/work" ][ "lrmoo:R3_is_realised_in" ][i].id ][ "dcterms:source" ]+`</span>
                    <span><a href="`+workbench[ wid ][ workbench[ wid ][ domain+"/id/"+wid+"/work" ][ "lrmoo:R3_is_realised_in" ][i].id ][ "dcterms:identifier" ].id+`">`+
                    workbench[ wid ][ workbench[ wid ][ domain+"/id/"+wid+"/work" ][ "lrmoo:R3_is_realised_in" ][i].id ][ "dcterms:identifier" ].id+`</a></span></div>
                 </div>`
                +`</div></div>`;
        }
        // ... other content types ...
        madeActive = true;
    }
    // create DOM
    if ( mode == "read" ) {
        tab_nav += `<li><a class="add_context`+((user == undefined && username == undefined)?' pe-none':' pe-auto')+`" `+((user == undefined && username == undefined)?'tabindex="-1" aria-disabled="true"':'')+` title="add a new context" data-tid="`+tid+`" data-wid="`+wid+`"><i class="fas fa-plus-circle"></i></a></li>`;
    }
    if ( mode == "read" ) {
        $( ".globaltext-container .globaltext" ).replaceWith( `<div class="globaltext"><ul class="nav nav-pills" id="pills-tab" role="tablist">`+tab_nav+`</ul><div class="tab-content" id="pills-tabContent">`+tab_content+`</div></div>` );
    } else if ( mode == "edit" ) {
        $( ".globaltext-workbench .globaltext-container .globaltext" ).replaceWith( `<div class="globaltext"><ul class="nav nav-pills" id="pills-tab" role="tablist">`+tab_nav+`</ul><div class="tab-content" id="pills-tabContent">`+tab_content+`</div></div>` );
    } else {
        $( ".context-container .globaltext" ).replaceWith( `<div class="globaltext"><ul class="nav nav-pills" id="pills-tab" role="tablist">`+tab_nav+`</ul><div class="tab-content" id="pills-tabContent">`+tab_content+`</div></div>` );        
    }
    clearInterval( t );
    t = setInterval(updateDOM(),500);

    // initialize expressions
    // facsimile
    if ( imgset_id !== undefined ) {
        var startPage = undefined, pages = [];
        $.each( $( (mode == 'edit'?'.globaltext-workbench .text':(mode == 'read')?'.globaltext-container .text':'.context-container .text')+" .pagebreak"), function (i,v) {
            pages.push( $(v).data( "facs" ).split( '/' ).pop() );
            $(v).append( ` <span class="image_link">[<a href="" data-imageset="`+imgset_id.substring( imgset_id.lastIndexOf('_')+1 )+`" data-id="`+ i +`">`+ (i+1).toString().padStart(3, "0") +`</a>]</span>` );
            if ( i == 0 ) { startPage = i }
        });
        if ( openseadragonOptions.hasOwnProperty( "tileSources" ) ) {
            if ( pages.length > 0 ) {
                var sources = [];
                $.each( pages, function(i,v) {
                    sources.push( _.find( openseadragonOptions.tileSources, function(tile) { return tile.url.includes( v ); } ) )
                });
                openseadragonOptions.tileSources = sources;
            }
            if( viewer[ imgset_id ] ) {
                viewer[ imgset_id ].destroy(); viewer[ imgset_id ] = null;
            }
            viewer[ imgset_id ] = OpenSeadragon( openseadragonOptions );
            add_image_tools( imgset_id, startPage );
        }
    }
    // text
    $.each( texts, function( i,v) {
        
    })
    // audio/video
    var iid = prfset_id && prfset_id.substring( prfset_id.lastIndexOf('_')+1 );
    if ( $( "[id='waveform_"+(mode == 'edit'?'editing_'+iid:(mode == 'view')?'viewing_'+iid:iid)+"']" ).length ) {
        if ( player[ prfset_id ] && !player[ prfset_id ].isDestroyed ) { player[ prfset_id ].unAll(); player[ prfset_id ].destroy(); }
        player[ prfset_id ] = WaveSurfer.create({
            container: '[id="waveform_'+(mode == 'edit'?'editing_'+iid:(mode == 'view')?'viewing_'+iid:iid)+'"]',
            partialRender: true,
            scrollParent: true,
            waveColor: '#ccc',
            progressColor: '#999', //'hsla(200, 80%, 30%, 0.5)',
            skipLength: 5,
            minimap: true,
            backend: 'MediaElement',
            regionsMinLength: .25,
            normalize: true,
            minPxPerSec: 10,
            plugins: [
                WaveSurfer.regions.create(),
                WaveSurfer.minimap.create({
                    height: 30,
                    waveColor: '#ddd',
                    progressColor: '#999',
                    cursorColor: '#333'
                }),
              WaveSurfer.timeline.create({
                    container: "[id='wavetimeline_"+(mode == 'edit'?'editing_'+iid:(mode == 'view')?'viewing_'+iid:iid)+"']"
                })
            ]
        });
        if ( $( "[id='waveform_"+(mode == 'edit'?'editing_'+iid:(mode == 'view')?'viewing_'+iid:iid)+"']" ).data( "load" ).includes( domain ) ) {
            fetch( $( "[id='waveform_"+(mode == 'edit'?'editing_'+iid:(mode == 'view')?'viewing_'+iid:iid)+"']" ).data( "load" ).replace(/\.[^/.]+$/, "")+".json" )
            .then(response => { if (!response.ok) { throw new Error("HTTP error " + response.status); }
                return response.json();
            }).then(peaks => { player[ prfset_id ].load($( "[id='waveform_"+(mode == 'edit'?'editing_'+iid:(mode == 'view')?'viewing_'+iid:iid)+"']" ).data( "load" ), peaks.data); 
            }).catch((e) => {});            
        } else {
            player[ prfset_id ].load( $( "[id='waveform_"+(mode == 'edit'?'editing_'+iid:(mode == 'view')?'viewing_'+iid:iid)+"']" ).data( "load" ) );
        }
        // Update the zoom level on slider change
        player[ prfset_id ].on('waveform-ready', function() {
            // default region
            if ( $( "[id='waveform_"+(mode == 'edit'?'editing_'+iid:(mode == 'view')?'viewing_'+iid:iid)+"']" ).data( "load" ).includes( '#t=') ) {
                var default_region = $( "[id='waveform_"+(mode == 'edit'?'editing_'+iid:(mode == 'view')?'viewing_'+iid:iid)+"']" ).data( "load" ).split( '#t=' )[1].split(',');
                player[ prfset_id ].addRegion( {"drag":false,"resize":false,"start":default_region[0],"end":default_region[1]} );
            }
            player[ prfset_id ].zoom(20);
        });
        $( document ).on('change input', 'input[type="range"]', function(e) {
            const minPxPerSec = e.target.value;
            player[ prfset_id ].zoom(minPxPerSec)
        })
    }
}

// retrieve JSON-LD version of SPARQL query
function getJSONLD( BGquery, mode ) {
    return new Promise(function(resolve, reject) {
        $.ajax({
            type: "POST",
            url: SPARQL_RPPA+"sparql",
            data: { query: BGquery },
            headers: {
                Accept : "application/json"
            }
        }).done( async function( result ) {
            var quads = '', results = [];
            if ( result.results ) {
            // SELECT
                $.each( result.results.bindings, function( i,v ) {
                    results.push( v );
                    quads += ((v.s.type == 'uri')?"<"+v.s.value+">":"_:"+v.s.value ) + " <"+v.p.value+"> "+((v.o.type == 'uri')?"<"+v.o.value+">":((v.o.type == 'bnode')?"_:"+v.o.value:'"'+v.o.value.replace(/"/g,'\\"').replace(/\n/g,'\\n')+'"') )+" .\n";
                });
                if ( mode == "raw" ) {
                    resolve( results ); 
                } else {
                    var doc = await jsonld.fromRDF( quads, {format:'application/nquads'} );
                    var compacted = await jsonld.compact( doc, context );
                    resolve( compacted ); 
                }
            } else {
            // ASK
                resolve( result.boolean );
            }
        }).fail( function( err ) {
            console.log( err );
        });
    })
}

// update RDF store (on completed publishable user-contribution)
function putTRIPLES( BGupdate ) {
    console.log( BGupdate );
    // TODO: ONLY completed contexts will be written into the default graph, not
    //       sure yet if I will need individual user graphs 
    if ( user.startsWith( "rppa:" ) ) {
        /*
        return new Promise(function(resolve, reject) {
            $.ajax({
                type: "POST",
                url: SPARQL_RPPA+"update",
                data: { update: BGupdate },
                headers: {
                    Accept : "application/json"
                }
            }).done( function( result ) {
                resolve();
            }).fail( function( error ) {
                console.log( "FATAL UPDATE error!",error );
            });
        })
        */
    } else {
        show_alert_mod( "We could not process your request and have logged this incident. If this error persists, please restart your browser. Thank you!", "danger", false, 0 );
        throw 'FATAL UPDATE error!';
    }
}

// display an alert to UI
function show_alert_mod( message, type, hide, ms ) {
    if ( message ) {
		$( '.toast' ).remove();
		$( "body" ).prepend(
		`<div role="alert" style="min-width:300px;position:fixed;" aria-live="assertive" aria-atomic="true" class="toast alert-`+type+`" data-autohide="`+hide+`" data-delay="`+ms+`">
            <div class="toast-header">
                <span class="badge badge-`+type+`"><i class="fas fa-exclamation-triangle"></i></span> 
                <strong class="mr-auto">RPPA</strong>
                <small>just now</small>
                <button type="button" class="ml-2 mb-1 close" data-dismiss="toast" aria-label="Close">
                <span aria-hidden="true">&times;</span>
                </button>
            </div>
            <div class="toast-body">`+
                message+
            `</div>
		</div>`
		);
		$( ".toast" ).toast( 'show' );
	}
}

// close popovers
$( document ).on('click', '.popover-header button.btn-close', function() {
   $( "[aria-describedby='"+$(this).closest('div.popover').attr( 'id')+"']" ).popover('hide');
});

// launch text in editing mode (create self-sustained duplicate)
$( document ).on('click', '.add_context', function() {
    var modeC = {}
    modeC[ 'edit' ] = '#2a9d8f';
    modeC[ 'read' ] = 'var(--bs-orange)';
    modeC[ 'view' ] = 'var(--bs-orange)';
    $( "#mode" ).remove();
    mode = "edit";
    $( "head" ).append( `<style type="text/css" id="mode">.globaltext-workbench a,.globaltext-workbench a:hover,.globaltext-workbench a:visited,.globaltext-workbench a:active,.popover a.save,.popover a.cancel{color: `+modeC[ mode ]+` !important;}.globaltext-workbench .nav-pills .nav-link.active,.globaltext-workbench .bg-rppa,.globaltext-workbench .controls .btn{background-color:`+modeC[ mode ]+` !important;}.globaltext-workbench a.bg-rppa{color:white !important;}.globaltext-workbench input{accent-color: `+modeC[ mode ]+` !important;}</style>` );
    display_globaltext( $( this ).data( "tid" ), $( this ).data( "wid" ) );
});

// update UI on expression selection
$(document).on('click','button[data-bs-toggle="pill"]',function(){
    $(".popover").hide();
    // TODO: need to work out exactly what needs doing here!
    if ( mode == "edit" ) {
//        processGlobalText( "", $( this ).closest( "[data-wid]" ).data( "wid" ) );
    } else {
        if ( cy ) {
            var ele = $(this).data( 'digo' );
            var j = cy.$id( ele );
            cy.animate({
                center: { eles: cy.filter( j ) },
                zoom: 0.9
            }, {
                duration: 500
            });
        }
        //initializeContexts( contexts[ $( this ).data( "expr" ) ], mode );
    }
    if ( !!Object.keys( player ).length ) {
        Object.keys( player ).forEach(key => {
            player[ key ].drawBuffer(); // buffer
        });
    }
    clearInterval( t );
    t = setInterval(updateDOM(),500);
});

var dismiss_region = undefined;
/*  This function retrieves and processes the available contexts or
    building blocks.  It
    - queries and retrieves avaialble contexts (reading view) or
    - queries and retrieves avaialble buildingblocks (editing view) 
    - retrieves and processes any blank nodes for the body and target of the
      context or building block
    - initializes tools (Openseadragon, Wavesufer) as read-only (reading mode)
      or editable (editing mode)
    - calls initializeContexts for the default expression
*/
async function processGlobalText( tid, wid ) {
    var work = domain+"/id/"+wid+"/work";
    // only reading section should remain, contexts variable holds ALL
    // contexts (i.e. for ALL expressions!), edit section is obsolete
    if ( mode == "read" || mode == "view" ) {
        // load all contexts
        /*
        var q = namespaces+`SELECT ?s ?p ?o ?g
        WHERE {
        {
            {
                ?s a rppa:Context .
                ?s intro:R20_discusses <https://www.romanticperiodpoetry.org/id/`+wid+`/work> .
                ?s ?p ?o .
            } UNION {
                ?s2 intro:R20_discusses <https://www.romanticperiodpoetry.org/id/`+wid+`/work> .
    			?s2 intro:R21_identifies+ ?w .
    			?w ?p ?o . 
          		BIND (?w AS ?s)
            } UNION {
                ?s2 intro:R20_discusses <https://www.romanticperiodpoetry.org/id/`+wid+`/work> .
                ?s2 intro:R21_identifies+ ?w .
                ?w <http://www.w3.org/ns/oa#hasBody> ?body .
                ?body ?p ?o .
                BIND(?body AS ?s)
            } UNION {
                ?s2 intro:R20_discusses <https://www.romanticperiodpoetry.org/id/`+wid+`/work> .
                ?s2 intro:R21_identifies+ ?w .
                ?w <http://www.w3.org/ns/oa#hasTarget> ?target .
                ?target ?p ?o .
                BIND(?target AS ?s)
            } UNION {
                ?s2 intro:R20_discusses <https://www.romanticperiodpoetry.org/id/`+wid+`/work> .
                ?s2 intro:R21_identifies+ ?w .
                ?w <http://www.w3.org/ns/oa#hasBody> ?body .
                ?body <http://www.w3.org/ns/activitystreams#items> ?list .
                ?list rdf:rest/rdf:first ?items .
                BIND(<http://www.w3.org/ns/activitystreams#items> as ?p)
                BIND(?items as ?o)
                BIND(?list as ?s)
            } UNION {
                ?s2 intro:R20_discusses <https://www.romanticperiodpoetry.org/id/`+wid+`/work> .
                ?s2 intro:R21_identifies+ ?w .
                ?w <http://www.w3.org/ns/oa#hasTarget> ?target .
                ?target oa:hasSelector+ ?items .
                ?items ?p ?o .
                BIND(?items as ?s)
            } UNION {
                ?s2 intro:R20_discusses <https://www.romanticperiodpoetry.org/id/`+wid+`/work> .
                ?s2 intro:R21_identifies+ ?w .
                ?w <http://www.w3.org/ns/oa#hasTarget> ?target .
                ?target oa:hasSelector+ ?items .
                ?items <http://www.w3.org/ns/activitystreams#items> ?list .
                ?list rdf:rest/rdf:first ?composites .
                BIND(<http://www.w3.org/ns/activitystreams#items> as ?p)
                BIND(?composites as ?o)
                BIND(?list as ?s)
            }
            BIND(<default> AS ?g)
        } UNION {
            ?s2 intro:R20_discusses <https://www.romanticperiodpoetry.org/id/`+wid+`/work> .
            ?s2 (<http://purl.org/dc/terms/contributor>|<http://purl.org/dc/terms/creator>) ?o2 .
            ?o2 a foaf:Agent .
            ?o2 ?p ?o .
            BIND(?o2 AS ?s)
            BIND(<default> AS ?g)                
        }
        }`;
        */
        var q = namespaces+`SELECT DISTINCT ?s ?p ?o ?g WHERE {
            {
                {	# ALL actualizations and intertextual relations
                    ?s2 a rppa:Context .
                    ?s2 intro:R20_discusses ?work .
                    ?s2 intro:R21_identifies+ ?w .
                    ?w ?p ?o .
                    BIND(?w AS ?s)
                }	# ALL target locations of ALL actualizations and intertextual relations
                UNION {
                    ?s2 intro:R20_discusses ?work .
                    ?s2 intro:R21_identifies+ ?w .
                      ?w (intro:R18i_actualizationFoundOn|intro:R13_hasReferringEntity|intro:R12_hasReferredToEntity|intro:R19_hasType) ?t .
                      ?t ?p ?o .
                      BIND (?t AS ?s)
                }   # ALL actualization and intertextual relations SKOS entries
                UNION {
                    ?s2 intro:R20_discusses ?work .
                    ?s2 intro:R21_identifies+ ?w .
                    {
                        ?w intro:R17_actualizesFeature ?f .
                        ?f ?p ?o .
                    } UNION
                    {
                        ?w intro:R19_hasType ?ty .
                        ?ty intro:R4i_isDefinedIn ?f .
                        ?f ?p ?o .
                    }
                    BIND( ?f AS ?s )
    		    }   # ALL target locations in both the expressions and the OntoPoetry graph
                UNION {
                    ?s2 intro:R20_discusses ?work .
                    ?s2 intro:R21_identifies+ ?w .
                      ?w (intro:R18i_actualizationFoundOn|intro:R13_hasReferringEntity|intro:R12_hasReferredToEntity) ?t .
                    {
                        ?t intro:R41_hasLocation [ ?p ?to ] .
                        ?to rdf:rest*/rdf:first ?too .
                      } UNION {
                          ?t intro:R41_hasLocation ?to .
                        ?to ?p ?too .		
                      }
                    BIND ( ?too AS ?o)
                    BIND ( ?t AS ?s)
                }
                FILTER (?work = <https://www.romanticperiodpoetry.org/id/`+wid+`/work>)
                BIND(<default> AS ?g)
            } UNION {
                ?s2 intro:R20_discusses ?work .
                ?s2 (<http://purl.org/dc/terms/contributor>|<http://purl.org/dc/terms/creator>) ?o2 .
                ?o2 a foaf:Agent .
                ?o2 ?p ?o .
                BIND(?o2 AS ?s)
                BIND(<default> AS ?g)
                FILTER (?work = <https://www.romanticperiodpoetry.org/id/`+wid+`/work>)
            }
            FILTER (!isBlank(?o))
        }`
        var r = await getJSONLD( q );
        if (!r.hasOwnProperty( "graph" )) {
            // insert blank nodes into JSON-LD structure
            //console.log( r.graph );
            //ckeys = _.keyBy( r.graph, 'id' ); // create blank node IDs
            //contexts = _.groupBy( _.filter( r.graph, function(o) { return o.id.startsWith( 'http' ); }), '["intro:R20_discusses"][1].id' );
            //console.log( ckeys, contexts );
            // TODO: this is almost working but not quite, all generic solutions
            // attempted have failed so far.
            /*
            for (let i = 0; i < r.graph.length; i++) {
                let obj = r.graph[i];
                if (obj.id.startsWith( 'http' )) {
                    if ( obj.hasOwnProperty( "oa:hasBody" ) ) {
                        var hasBody = obj['oa:hasBody'].id ;
                        obj['oa:hasBody'] = [];
                        obj['oa:hasBody'].push( ckeys[ hasBody ] );
                        if ( obj['oa:hasBody'][0].hasOwnProperty( 'as:items' ) ) {
                            var asItems = obj['oa:hasBody'][0]['as:items'].id;
                            obj['oa:hasBody'][0]['as:items'] = ckeys[ asItems ][ 'as:items' ];
                        }    
                    }
                    if ( obj.hasOwnProperty( "oa:hasTarget" ) ) {
                        var hasTarget = obj['oa:hasTarget'].id ;
                        obj['oa:hasTarget'] = [];
                        obj['oa:hasTarget'].push( ckeys[ hasTarget ] ); 
                        var hasSelector = obj['oa:hasTarget'][0]['oa:hasSelector'][1].id;
                        obj['oa:hasTarget'][0]['oa:hasSelector'][1] = ckeys[ hasSelector ];
                    }
                    if (obj.id.startsWith( 'http' )) {
                        if ( obj.hasOwnProperty( "intro:R21_identifies" ) ) {
                            var consistsOf = obj['intro:R21_identifies'].id ;
                            obj['intro:R21_identifies'] = [];
                            obj['intro:R21_identifies'].push( ckeys[ consistsOf ] ); 
                        }
                    }
                }
            }
            */
            r.graph = [];
        }
        contexts = _.groupBy( _.filter( r.graph, function(o) { return o.id.startsWith( 'http' ); }), function(o) { return o.id.match(uuidRegex) });
        skos = _.keyBy( _.filter( r.graph, function(o) { return o.id.includes( 'rppa:kos/' ); }), 'id' );
        contributors = _.keyBy( _.filter( r.graph, function(o) { return o.id.startsWith( 'rppa:user-' ); }), 'id' );

        // tool settings
        if ( !!Object.keys( annotorious ).length ) {
            Object.keys( annotorious ).forEach(key => {
                annotorious[ key ].readOnly = true; // image
            });
        }
        /*
        if ( typeof annotorious[ "viewer_"+(mode == 'edit'?'editing_'+tid:tid) ] != 'undefined' ) {
            annotorious[ "viewer_"+(mode == 'edit'?'editing_'+tid:tid) ].readOnly = true; // image
        }
        */
        if ( !!Object.keys( player ).length ) {
            Object.keys( player ).forEach(key => {
                player[ key ].disableDragSelection(); // sound
                player[ key ].setProgressColor( '#666' );
            });
        }
        /*
        if ( $( "#waveform_"+(mode == 'edit'?'editing_'+tid:tid) ).length ) {
            player[ "player_"+(mode == 'edit'?'editing_'+tid:tid) ].disableDragSelection(); // sound
            player[ "player_"+(mode == 'edit'?'editing_'+tid:tid) ].setProgressColor( '#666' );
        }
        */

        // initialize
        r = await getJSONLD( q, "raw" );
        initializeContexts( contexts, r, mode );
    // this section is obsolete!
    } else if ( mode == "edit" ) {
        /*    
        // load user contributions
        var q = namespaces+`SELECT *
        WHERE {
            {
            GRAPH `+user+` {
                {
                    ?s a rppa:BuildingBlock .
                    ?s dcterms:relation <https://www.romanticperiodpoetry.org/id/`+wid+`/work> .
                    ?s ?p ?o .
                } UNION {
                    ?s2 dcterms:relation <https://www.romanticperiodpoetry.org/id/`+wid+`/work> .
                    ?s2 <http://www.w3.org/ns/oa#hasBody> ?body .
                    ?body ?p ?o .
                    BIND(?body AS ?s)
                } UNION {
                    ?s2 dcterms:relation <https://www.romanticperiodpoetry.org/id/`+wid+`/work> .
                    ?s2 <http://www.w3.org/ns/oa#hasTarget> ?body .
                    ?body ?p ?o .
                    BIND(?body AS ?s)
                } UNION {
                    ?s2 dcterms:relation <https://www.romanticperiodpoetry.org/id/`+wid+`/work> .
                    ?s2 <http://www.w3.org/ns/oa#hasBody> ?body .
                    ?body <http://www.w3.org/ns/activitystreams#items> ?list .
                    ?list rdf:rest/rdf:first ?items .
                    BIND(<http://www.w3.org/ns/activitystreams#items> as ?p)
                    BIND(?items as ?o)
                    BIND(?list as ?s)
                } UNION {
                    ?s2 dcterms:relation <https://www.romanticperiodpoetry.org/id/`+wid+`/work> .
                    ?s2 <http://www.w3.org/ns/oa#hasTarget> ?body .
                    ?body oa:hasSelector ?items .
                    ?items ?p ?o .
                    BIND(?items as ?s)
                }
                BIND(`+user+` AS ?g)
            }
            }
        }`;
        var r = await getJSONLD( q );
        if (r.hasOwnProperty( "graph" )) {
            // insert blank nodes into JSON-LD structure
            ckeys = _.keyBy( r.graph, 'id' ); // create blank node IDs
            for (let i = 0; i < r.graph.length; i++) {
                let obj = r.graph[i];
                if (obj.id.startsWith( 'http' )) {
                    if ( obj.hasOwnProperty( "oa:hasBody" ) ) {
                        var hasBody = obj['oa:hasBody'].id ;
                        obj['oa:hasBody'] = [];
                        obj['oa:hasBody'].push( ckeys[ hasBody ] );
                        if ( obj['oa:hasBody'][0].hasOwnProperty( 'as:items' ) ) {
                            var asItems = obj['oa:hasBody'][0]['as:items'].id;
                            obj['oa:hasBody'][0]['as:items'] = ckeys[ asItems ][ 'as:items' ];
                        }    
                    }
                    if ( obj.hasOwnProperty( "oa:hasTarget" ) ) {
                        var hasTarget = obj['oa:hasTarget'].id ;
                        obj['oa:hasTarget'] = [];
                        obj['oa:hasTarget'].push( ckeys[ hasTarget ] ); 
                        var hasSelector = obj['oa:hasTarget'][0]['oa:hasSelector'].id;
                        obj['oa:hasTarget'][0]['oa:hasSelector'] = ckeys[ hasSelector ];
                    }
                }
            }
        } else {
            r.graph = [];
        }
        contexts = _.groupBy( _.filter( r.graph, function(o) { return
        o.id.startsWith( 'http' ); }), '["intro:R20_discusses"][1].id' );
        */

        // tool settings
        if ( !!Object.keys( annotorious ).length ) {
            Object.keys( annotorious ).forEach(key => {
                annotorious[ key ].readOnly = false; // image
            });
        }
        /*
        if ( typeof annotorious[ "viewer_"+(mode == 'edit'?'editing_'+tid:tid) ] != 'undefined' ) {
            annotorious[ "viewer_"+(mode == 'edit'?'editing_'+tid:tid) ].readOnly = false; // image
        }
        */
        if ( !!Object.keys( player ).length ) {
            Object.keys( player ).forEach(key => {
                player[ key ].disableDragSelection();
                player[ key ].enableDragSelection({
                    color: 'rgb(74, 186, 159,.2)',
                    resize: false,
                    drag: false
                }); // sound
                player[ key ].setProgressColor( '#358078' );
                player[ key ].un('region-update-end');
                player[ key ].on('region-update-end', function( region ) {
                    player[ key ].disableDragSelection();
                    var target = secondsToTime(region.start) + "–" + secondsToTime(region.end);
                    var id = $( "[data-id='"+region.id+"']" ).closest( 'div[data-expr]' ).attr( 'id' );
                    var work = $( "[data-id='"+region.id+"']" ).closest( 'div[data-expr]' ).data( 'id' );
                    var expr = $( "[data-id='"+region.id+"']" ).closest( 'div[data-expr]' ).data( 'expr' );
                    var digo = $( "[data-id='"+region.id+"']" ).closest( 'div[data-expr]' ).data( 'digo' );
                    $( ".tab-pane.active [data-id='"+region.id+"']" ).popover({
                        sanitize: false,
                        content: `<a role="button" class="save" data-start="`+region.start+`" data-end="`+region.end+`" data-ids="`+region.id+`" data-id="`+id+`" data-work="`+work+`" data-expr="`+expr+`" data-digo="`+digo+`" data-sel="`+target+`" style="font-size:18px;margin-left:10px;"><i class="fas fa-save"></i></a>
                            <a role="button" class="cancel" style="font-size:20px;margin:0 10px;"><i class="fas fa-close"></i></a>`,
                        html: true,
                        placement: 'auto',
                        container: '.globaltext',
                        template: `<div class="popover popover-dismiss-select med" role="popover" tabindex="0" data-trigger="focus" style="opacity:.85;">
                            <div class="popover-arrow"></div>
                            <div class="popover-body"></div>
                        </div>`
                    })
                    dismiss_select = $( ".tab-pane.active [data-id='"+region.id+"']" ).popover('show');
                    dismiss_select.popover('toggleEnabled'); // disable toggling
                    dismiss_region = region;
                });
            });
        }
        /*
        if ( $( "#waveform_"+(mode == 'edit'?'editing_'+tid:tid) ).length ) {
            player[ "player_"+(mode == 'edit'?'editing_'+tid:tid) ].disableDragSelection();
            player[ "player_"+(mode == 'edit'?'editing_'+tid:tid) ].enableDragSelection({
                color: 'rgb(74, 186, 159,.2)',
                resize: false,
                drag: false
            }); // sound
            player[ "player_"+(mode == 'edit'?'editing_'+tid:tid) ].setProgressColor( '#358078' );
            player[ "player_"+(mode == 'edit'?'editing_'+tid:tid) ].un('region-update-end');
            player[ "player_"+(mode == 'edit'?'editing_'+tid:tid) ].on('region-update-end', function( region ) {
                player[ "player_"+(mode == 'edit'?'editing_'+tid:tid) ].disableDragSelection();
                var target = secondsToTime(region.start) + "–" + secondsToTime(region.end);
                var id = $( "[data-id='"+region.id+"']" ).closest( 'div[data-expr]' ).attr( 'id' );
                var work = $( "[data-id='"+region.id+"']" ).closest( 'div[data-expr]' ).data( 'id' );
                var expr = $( "[data-id='"+region.id+"']" ).closest( 'div[data-expr]' ).data( 'expr' );
                var digo = $( "[data-id='"+region.id+"']" ).closest( 'div[data-expr]' ).data( 'digo' );
                $( ".tab-pane.active [data-id='"+region.id+"']" ).popover({
                    sanitize: false,
                    content: `<a role="button" class="save" data-start="`+region.start+`" data-end="`+region.end+`" data-ids="`+region.id+`" data-id="`+id+`" data-work="`+work+`" data-expr="`+expr+`" data-digo="`+digo+`" data-sel="`+target+`" style="font-size:18px;margin-left:10px;"><i class="fas fa-save"></i></a>
                        <a role="button" class="cancel" style="font-size:20px;margin:0 10px;"><i class="fas fa-close"></i></a>`,
                    html: true,
                    placement: 'auto',
                    container: '.globaltext',
                    template: `<div class="popover popover-dismiss-select med" role="popover" tabindex="0" data-trigger="focus" style="opacity:.85;">
                        <div class="popover-arrow"></div>
                        <div class="popover-body"></div>
                    </div>`
                })
                dismiss_select = $( ".tab-pane.active [data-id='"+region.id+"']" ).popover('show');
                dismiss_select.popover('toggleEnabled'); // disable toggling
                dismiss_region = region;
            });
        }
        */
    }
}

/*  This function takes a list of a particular expression's contexts and hands
    them over to specialized functions for display:
    - processes building-blocks (in editing mode) for lct:txt/lct:img/lct:aud
    - processes contexts (in reading mode)
*/
async function initializeContexts( exprContexts, graph, mode ) {
    // edit mode is obsolete, here will be NO buildingblocks in the graph!
    //$( ".contexts" ).html( "" );
    //$( ".workbench" ).html( "" );
    
    var tid = $( this ).closest( "[data-tid]" ).data( "tid" );
    // filter exprContexts by type and pass to handlers
    if ( mode == "edit" ) {
        /*
        var bb = _.filter( exprContexts, function(o) { 
            return o["type"].includes( "rppa:BuildingBlock" ) && o["crm:P2_has_type"][0].id == "lct:txt";
        });
        processBuildingBlocks( bb );
        if ( typeof annotorious[ "viewer_"+(mode == 'edit'?'editing_'+tid:tid) ] != 'undefined' ) {
            var bb = _.filter( exprContexts, function(o) { 
                return o["type"].includes( "rppa:BuildingBlock" ) && o["crm:P2_has_type"][0].id == "lct:img";
            });
            processImageBuildingBlocks( annotorious[ "viewer_"+(mode == 'edit'?'editing_'+tid:tid) ], bb )
        }
        if ( $( "#waveform_"+(mode == 'edit'?'editing_'+tid:tid) ).length ) {
            var bb = _.filter( exprContexts, function(o) { 
                return o["type"].includes( "rppa:BuildingBlock" ) && o["crm:P2_has_type"][0].id == "lct:aud";
            });
            processMediaBuildingBlocks( bb )
        }
        */
    // only this below part should remain!
    } else {
//        $( ".workbench" ).html( `<h2>Contexts</h2><ul class="tc"></ul>` );
//        $( ".contexts" ).html( `<ul class="tc-main"></ul>` );
//        $( ".highlight-tc" ).removeClass( "highlight-tc" );
        var graphElements = [];
        for ( var key in exprContexts ) {
            var context = _.keyBy( exprContexts[key], 'id' )
            graphElements = graphElements.concat( processGraphContext( context ) );
//            processExprContext( context );
        }
        var added = cy.add( graphElements );
        tippyNodes( added.nodes(), graph );
        run_layout( 'cose' );
        /*
        var tc = _.filter( exprContexts, function(o) {
            return o["type"].includes( "rppa:Context" ) //&& o["crm:P2_has_type"][0].id == "lct:txt";
        });
        processW3Ccontexts( tc );
        */
    }
}

// process contexts in the graph view
function processGraphContext( context ) {
    //console.log( context );
    var added = [];
    for (var [id, part] of Object.entries( context )) {
        if ( part.type.includes( "intro:INT2_ActualizationOfFeature" ) ) {
            added = added.concat([
                { group: 'nodes', 
                    classes: "node",
                    data: {
                        id: part.id,
                        name: part["intro:R17_actualizesFeature"].id in skos?skos[ part["intro:R17_actualizesFeature"].id ]["skos:prefLabel"]:part["intro:R17_actualizesFeature"].id,
                        pref: part["skos:prefLabel"],
                        alt: part["skos:altLabel"],
                        class: [ onto[ "intro:INT2_ActualizationOfFeature" ].about ],
                        bgcolor: "#2a9d8f",
                        shape: "concave-hexagon",
                        context: part["intro:R21i_isIdentifiedBy"].id
                    }
                },
                { group: 'edges', 
                    classes: "edge",
                    data: { 
                        id: part.id+context[ part["intro:R18i_actualizationFoundOn"].id ]["intro:R10i_isPassageOf"].id,//uuidv4(), 
                        source: part.id,
                        target: context[ part["intro:R18i_actualizationFoundOn"].id ]["intro:R10i_isPassageOf"].id, 
                        name: onto[ "intro:R18i_actualizationFoundOn" ].label, //skos[ context[ context["intro:R19_hasType"].id ]["intro:R4i_isDefinedIn"].id ]["skos:preflabel"],
                        pref: onto[ "intro:R18i_actualizationFoundOn" ].label, //skos[ context[ context["intro:R19_hasType"].id ]["intro:R4i_isDefinedIn"].id ]["skos:preflabel"],
                        class: onto[ "intro:R18i_actualizationFoundOn" ].about
                    }
                }
            ]);
        } else if ( part.type.includes( "intro:INT3_Interrelation" )) {
            added = added.concat([
                { group: 'nodes', 
                    classes: "node",
                    data: {
                        id: part.id,
                        name: context[ part["intro:R19_hasType"].id ]["intro:R4i_isDefinedIn"].id in skos?skos[ context[ part["intro:R19_hasType"].id ]["intro:R4i_isDefinedIn"].id ]["skos:prefLabel"]:context[ part["intro:R19_hasType"].id ]["intro:R4i_isDefinedIn"].id,
                        pref: part["skos:prefLabel"],
                        alt: part["skos:altLabel"],
                        class: [ onto[ "intro:INT3_Interrelation" ].about ],
                        bgcolor: "#2a9d8f",
                        shape: "concave-hexagon",
                        context: part["intro:R21i_isIdentifiedBy"].id
                    },
                    //position: cy.getElementById( part.id ).position()
                },
                { group: 'edges', 
                    classes: "edge",
                    data: { 
                        id: part.id+context[ part["intro:R13_hasReferringEntity"].id ]["intro:R10i_isPassageOf"].id,//uuidv4(), 
                        source: part.id, 
                        target: context[ part["intro:R13_hasReferringEntity"].id ]["intro:R10i_isPassageOf"].id, 
                        name: onto[ "intro:R12_hasReferredToEntity" ].label, //skos[ context[ context["intro:R19_hasType"].id ]["intro:R4i_isDefinedIn"].id ]["skos:preflabel"],
                        pref: onto[ "intro:R12_hasReferredToEntity" ].label, //skos[ context[ context["intro:R19_hasType"].id ]["intro:R4i_isDefinedIn"].id ]["skos:preflabel"],
                        class: onto[ "intro:R12_hasReferredToEntity" ].about
                    }
                },
                { group: 'edges', 
                    classes: "edge",
                    data: { 
                        id: part.id+context[ part["intro:R12_hasReferredToEntity"].id ]["intro:R10i_isPassageOf"].id,//uuidv4(), 
                        source: part.id,
                        target: context[ part["intro:R12_hasReferredToEntity"].id ]["intro:R10i_isPassageOf"].id,
                        name: onto[ "intro:R13_hasReferringEntity" ].label,
                        pref: onto[ "intro:R13_hasReferringEntity" ].label,
                        class: onto[ "intro:R13_hasReferringEntity" ].about
                    }
                }
            ]);
        }
    }
    //console.log( added );
    return added;
}

// process contexts in the expressions/manifestations view
function processExprContext( context ) {

}

// Context display components
function make_context( id, data, ids ) {
    return `<div id="`+id+`" data-ids="`+ids+`" style="max-height:calc(100vh - 140px);overflow: auto;"><div>`+data+`</div></div>`;
}

// format user
function print_user( contributors ) {
    var formatted_users = '<div style="font-size:15px;"><h4><i class="fa-solid fa-user"></i> Contributor</h4><dl>';
    $.each( contributors, function( i,v ) {
        formatted_users += 
            `<dt>Name</dt>`+
            `<dd>`+v['foaf:name']+`</dd>`+
            `<dt>Account</dt>`+
            `<dd><a class="external" target="_blank" href="`+v['foaf:accountName'].id+`">`+v['foaf:accountName'].id+`</a></dd>`+
            `<dt>E-mail</dt>`+
            `<dd><a class="external" target="_blank" href="`+v['foaf:mbox'].id+`">`+v['foaf:mbox'].id.split('mailto:')[1]+`</a></dd>`+
            `<dt>Web</dt>`+
            `<dd><a class="external" target="_blank" href="`+v['foaf:homepage'].id+`">`+v['foaf:homepage'].id+`</a></dd>`
            ;
    });
    formatted_users += `</dl></div>`
    return( formatted_users );
}

// format tool
function print_tool( tool ) {
    if ( tool === undefined ) return '';
    const tools = [].concat(tool);
    var formatted_tools = '<div style="margin-left:35px;font-size:14px;"><h5><i class="fa-solid fa-toolbox"></i> Tool</h5><dl>';
    $.each( tools, function( i,v ) {
        formatted_tools += 
            `<dt>Name</dt>`+
            `<dd>`+v['skos:prefLabel']+`</dd>`+
            `<dt>Function</dt>`+
            `<dd>`+v['crm:P3_has_note']+`</dd>`+
            `<dt>Web</dt>`+
            `<dd><a class="external" target="_blank" href="`+v['foaf:homepage'].id+`">`+v['foaf:homepage'].id+`</a></dd>`+
            (v.hasOwnProperty("dcterms:bibliographicCitation")?            
            `<dt>Citation</dt>`+
            `<dd>`+v['dcterms:bibliographicCitation']+`</dd>`:``)
            ;
    });
    formatted_tools += `</dl></div>`
    return( formatted_tools );
}

// format metadata
function print_cxtmd( md, skos ) {
    const metadata = [].concat( md );
    var formatted_metadata = '<div style="font-size:15px;"><h4><i class="fa-solid fa-circle-info"></i> Metadata</h4><dl>';
    $.each( metadata, function( i,v ) {
        formatted_metadata += 
            (v.hasOwnProperty("rdfs:isDefinedBy")?
            `<dt>Context type</dt>`+
            `<dd>`+skos[v['rdfs:isDefinedBy'].id]["skos:prefLabel"]+`</dd>`:``)+
            (v.hasOwnProperty("rdfs:isDefinedBy") && skos[v['rdfs:isDefinedBy'].id].hasOwnProperty("skos:inScheme")?
            `<dt>Context scheme</dt>`+
            `<dd>`+skos[v['rdfs:isDefinedBy'].id]["skos:inScheme"].id+`</dd>`:``)+
            (v.hasOwnProperty("dcterms:spatial")?
            `<dt>Spatial dimension</dt>`+
            `<dd><a class="external" target="_blank" href="`+v['dcterms:spatial'].id+`">`+v['dcterms:spatial'].id+`</a></dd>`:``)+
            (v.hasOwnProperty("dcterms:temporal")?
            `<dt>Temporal dimension</dt>`+
            `<dd>`+formatDate(v['dcterms:temporal'])+`</dd>`:``)+
            `<dt>Creation date</dt>`+
            `<dd>`+formatDate(v['dcterms:created'])+`</dd>`+
            `<dt>License</dt>`+
            `<dd><a class="external" target="_blank" href="`+v['dcterms:license'].id+`">`+v['dcterms:license'].id+`</a></dd>`+
            (v.hasOwnProperty("dcterms:bibliographicCitation")?            
            `<dt>Citation</dt>`+
            `<dd>`+v['dcterms:bibliographicCitation']+`</dd>`:``)
            ;
    });
    formatted_metadata += `</dl></div>`
    return( formatted_metadata );
}

// format context work
function print_cxtwrk( md, content, skos ) {
    console.log( md, content, skos );
    const work = [].concat( md );
    var formatted_metadata = '<div style="font-size:15px;"><h4><i class="fa-solid fa-right-left"></i> Contextualization</h4><dl>';
    $.each( work, function( i,v ) {
        formatted_metadata += 
            `<dt style='word-break:break-word;'>Contextualization type</dt>`+
            (v.hasOwnProperty("intro:R19_hasType")?
            `<dd>`+skos[ content[ v['intro:R19_hasType'].id ]['intro:R4i_isDefinedIn'].id ]["skos:prefLabel"]+`</dd>`:
            (v.hasOwnProperty("intro:R17_actualizesFeature") && v['intro:R17_actualizesFeature'].id in skos?
            `<dd>`+skos[ v['intro:R17_actualizesFeature'].id ]["skos:prefLabel"]+`</dd>`:
            `<dd>`+v['intro:R17_actualizesFeature'].id+`</dd>`))+
            `<dt style='word-break:break-word;'>Contextualization scheme</dt>`+
            (v.hasOwnProperty("intro:R19_hasType")?
            `<dd>`+skos[ content[ v['intro:R19_hasType'].id ]['intro:R4i_isDefinedIn'].id ]["skos:inScheme"].id+`</dd>`:
            (v.hasOwnProperty("intro:R17_actualizesFeature") && v['intro:R17_actualizesFeature'].id in skos?
            `<dd>`+skos[ v['intro:R17_actualizesFeature'].id ]["skos:inScheme"].id+`</dd>`:`<dd>—</dd>`))+
            (v.hasOwnProperty("dcterms:format")?
            `<dt>Format</dt>`+
            `<dd><a class="external" target="_blank" href="`+context["@context"][v['dcterms:format'].id.split(":")[0]]+v['dcterms:format'].id.split(":")[1]+`">`+v['dcterms:format'].id+`</a></dd>`:``)+
            (v.hasOwnProperty("dcterms:language")?
            `<dt>Language</dt>`+
            `<dd><code>`+v["dcterms:language"]+`</code></dd>`:``)+
            (v.hasOwnProperty("oa:hasPurpose")?            
            `<dt>Purpose</dt>`+
            `<dd><a class="external" target="_blank" href="`+context["@context"][v['oa:hasPurpose'].id.split(":")[0]]+v['oa:hasPurpose'].id.split(":")[1]+`">`+v['oa:hasPurpose'].id+`</a></dd></dd>`:``)+
            (v.hasOwnProperty("oa:motivatedBy")?            
            `<dt>Motivation</dt>`+
            `<dd><a class="external" target="_blank" href="`+context["@context"][v['oa:motivatedBy'].id.split(":")[0]]+v['oa:motivatedBy'].id.split(":")[1]+`">`+v['oa:motivatedBy'].id+`</a></dd></dd>`:``)
            ;
    });
    formatted_metadata += `</dl></div>`
    return( formatted_metadata );
}


// Reading view: create annotation display and anchors (this is
// the /#context/... view, i.e. focus is on one context actualization)
/*  This function processes a context, it:
    - selects the type of context display to choose based on the indicated
      action (tool)
    - runs through a tool-specific workflow (e.g. load associated files, add
      event handlers for UI actions)
    - wraps context in a uniform context-card (header/body/footer) for
      display: make_context
*/
// TODO: this will be the key function that will process arrays of
//       actualizations in the contexts retrieved!  Is still based on hasAction
//       and types from the old monolithic contextWork object!
async function display_context( context ) {
    var q = namespaces+`SELECT DISTINCT ?s ?p ?o WHERE {
        {
            {	# context metadata
                ?context ?p ?o .
                BIND(?context AS ?s)
    		} 
            UNION {	# identified contextual relation
                ?context rdfs:isDefinedBy ?os .
      			?os ?p ?o . 
                BIND(?os AS ?s)
    		} 
            UNION {	# ALL actualizations and intertextual relations.
                ?context intro:R21_identifies+ ?w .
                ?w ?p ?o .
                BIND(?w AS ?s)
    		}	# ALL target locations of ALL actualizations and intertextual relations
		    UNION {
                ?context intro:R21_identifies+ ?w .
      			?w (intro:R18i_actualizationFoundOn|intro:R13_hasReferringEntity|intro:R12_hasReferredToEntity|intro:R19_hasType|dcterms:requires) ?t .
      			?t ?p ?o .
      			BIND (?t AS ?s)
    		}
    		UNION {
                ?context intro:R21_identifies+ ?w .
                {
        			?w intro:R17_actualizesFeature ?f .
        			?f ?p ?o .
                } UNION
                {
        			?w intro:R19_hasType ?ty .
        			?ty intro:R4i_isDefinedIn ?f .
        			?f ?p ?o .
      			}
      			BIND( ?f AS ?s )
    		}
		    UNION {
                ?context intro:R21_identifies+ ?w .
      			?w (intro:R18i_actualizationFoundOn|intro:R13_hasReferringEntity|intro:R12_hasReferredToEntity) ?t .
        		{
        			?t intro:R10i_isPassageOf ?do .
        			?do ?p ?too .
    			} UNION {
				    ?t intro:R41_hasLocation [ ?p ?to ] .
					?to rdf:rest*/rdf:first ?too .
      			} UNION {
      				?t intro:R41_hasLocation ?to .
					?to ?p ?too .		
      			}
                BIND ( ?too AS ?o)
                BIND ( ?t AS ?s)
    		}
    		UNION {
                ?context intro:R21_identifies+ ?w .
        		{
				    ?w oa:hasBody [ ?p ?to ] .
					?to rdf:rest*/rdf:first ?too .
      			} UNION {
      				?w oa:hasBody ?to .
					?to ?p ?too .		
      			}
                BIND ( ?too AS ?o)
                BIND ( ?w AS ?s)
    		}
            FILTER (?context = <`+context+`>)
            BIND(<default> AS ?g)
        } UNION {
            ?context (<http://purl.org/dc/terms/contributor>|<http://purl.org/dc/terms/creator>) ?o2 .
            ?o2 a foaf:Agent .
            ?o2 ?p ?o .
            BIND(?o2 AS ?s)
		    BIND(<default> AS ?g)
            FILTER (?context = <`+context+`>)
        }
	    FILTER (!isBlank(?o))
    }`;
    var r = await getJSONLD( q );
    if (!r.hasOwnProperty( "graph" )) {
        r.graph = [];
    }
    var cxtmd = _.keyBy( _.filter( r.graph, function(o) { return o["type"].includes("rppa:Context") && o.id.match(uuidRegex); }), 'id' );
    var cxtcnt = _.keyBy( _.filter( r.graph, function(o) { return o.id.startsWith( 'http' ) && o.id.match(uuidRegex); }), 'id' );
    var skos = _.keyBy( _.filter( r.graph, function(o) { return o.id.includes( 'rppa:kos/' ); }), 'id' );
    var contributor = _.keyBy( _.filter( r.graph, function(o) { return o.id.startsWith( 'rppa:user-' ); }), 'id' );
    var tools = _.keyBy( _.filter( r.graph, function(o) { return o["type"].includes( 'crmdig:D14_Software' ); }), 'id' );
    console.log( cxtmd, cxtcnt, skos, contributor, tools );
    mode = "view";
    zInd = zInd+1;
    if ( $('.offcanvas.show').length ) { 
        myCanvasGT.hide(); // close any open texts if a new one is requested
        $(".popover").hide(); // hide if new text was called from a popover
    }
    // create global text canvas
    var context_win_id = uuidv4();
    var context_win = `<div style="z-index:`+zInd+`;overflow:inherit;" class="offcanvas offcanvas-start context-workbench" data-bs-backdrop="static" tabindex="-1" id="win-`+context_win_id+`" aria-labelledby="staticBackdropLabel">
            <div class="offcanvas-body context-container globaltext-container" data-cid="`+context+`">`+
                `<button type="button" class="btn-close" style="float:right;" data-mode="read" data-bs-dismiss="offcanvas" aria-label="Close"></button>
                <!--
                <div class="tools" style="float:right;">
                    <input `+((user == undefined && username == undefined)?'disabled':'')+` style="height:36px;width:123px;" class="changeMode" type="checkbox" checked data-toggle="toggle" data-cid="`+context+`" id="changeMode-flip" data-mode="edit" data-onlabel="Reading" data-offlabel="Editing" data-onstyle="warning" data-offstyle="success">
                    `+((user == undefined && username == undefined)?'<label> <button type="button" class="btn btn-sm sso-sign-in" style="background-color:var(--bs-orange);color:#fff;margin-left:5px;margin-top:-4px;">Sign in</button></label>':'')+`
                </div>
                -->
                <div class="row">
                    <div class="col-sm-4 globaltext">
                    </div>
                    <div class="col-sm-8 context" style="columns:2;column-fill:auto;overflow:hidden;">
                    </div>
                    <!--
                    <div class="col-sm-2 workbench">
                    </div>
                    -->
                </div>
            </div>
        </div>`;
    $( "body" ).prepend( context_win );

    const parts = [].concat( cxtcnt[context]["intro:R21_identifies"] );
    // collect the targets of annotations
    var target = [], target_tabs = [], target_locs = [];
    for (var i in parts ) {
        var annotation = cxtcnt[ parts[i].id ];
        // show target globaltext
        target.push( cxtcnt[ annotation["oa:hasTarget"].id ]["crm:P48_has_preferred_identifier"] );
        target_tabs = target_tabs.concat( _.filter( cxtcnt[ annotation["oa:hasTarget"].id ]["crm:P106_is_composed_of"], function(o) { return o.id.includes( "/delivery" ); }) );
        target_locs = target_locs.concat( cxtcnt[ annotation["oa:hasTarget"].id ]["rdf:value"] );
    }
    // show target globaltext
    await display_globaltext( target[0],texts[target[0]]["work"] );
    $( ".globaltext" ).addClass( "col-sm-4" );
    // context label
    $( ".context-container .context" ).append( `<h3><i class="fa-solid fa-layer-group"></i> Context: `+truncateString(cxtmd[context]["skos:prefLabel"],50)+`</h3>` );
    // iterate through whatever was identified with intro:R21_identifies 
    for (var i in parts ) {
        // determine action
        var annotation = cxtcnt[ parts[i].id ];
        switch ( annotation["dcterms:requires"].id ) {

            // translation alignment
            case "https://www.romanticperiodpoetry.org/id/tool00001/tool":
                const response1 = await fetch(annotation["as:items"][0].id);
                if (!response1.ok) {
                    throw new Error("HTTP error " + response1.status);
                }
                const data1 = await response1.text();
                // part body
                $( ".context-container .context" ).append( make_context( cxtcnt[context].id, data1, cxtcnt[ annotation["oa:hasTarget"].id ]["rdf:value"] ) );

                const response2 = await fetch(annotation["as:items"][1].id);
                if (!response2.ok) {
                    throw new Error("HTTP error " + response2.status);
                }
                const data2 = await response2.json();
                // process alignment JSON
                alignment[ annotation.id ] = {};
                alignment[ annotation.id+"/orig" ] = data2;
                // reverse alignment JSON to allow triggering from context
                for ( var prop in data2 ) {
                    $.each( data2[ prop ], function( index, item ) {
                        // if alignment[ annotation.id ][ item ].length == 0
                        if ( !alignment[ annotation.id ].hasOwnProperty( item ) ) {
                            alignment[ annotation.id ][ item ] = [];
                        }
                        alignment[ annotation.id ][ item ].push( prop );
                    });
                }
                //console.log( alignment[ annotation.id+"/orig" ], alignment[ annotation.id ] )
                // alignment activation on context-side
                $(document).on('mouseenter', '#win-'+context_win_id+' [id="'+context+'"] .w,#win-'+context_win_id+' [id="'+context+'"] .pc', function () {
                    if ( alignment[ annotation.id ][ $(this).attr('id') ] ) {
                        var hovered = $( '[id="'+context+'"] #'+$(this).attr('id') ).text();
                        var targeted = [];
                        $.each( alignment[ annotation.id ][ $(this).attr('id') ], function( i,v ) {
                            targeted.push( $( jq(v) ).text().toLowerCase() );
                        });
                        document.getElementById( alignment[ annotation.id ][ $(this).attr('id') ][0] ).scrollIntoView( {behavior: "smooth", block: "center"} );
                        $( '.context-container .globaltext .text #'+alignment[ annotation.id ][ $(this).attr('id') ].join( ',.context-container .globaltext .text #' ) ).addClass("idsSelected");       // text
                        $( '[id="'+context+'"] div.text #'+$(this).attr('id') ).addClass("idsSelected");    // context
                        /*
                        $( '.context[id="'+context+'"] .text .w').each(function( index ) {
                            if ( $(this).text().toLowerCase() == hovered.toLowerCase() ) {
                            $( $(this) ).addClass( "idsSelected" );
                            }
                        });
                        $( '.tab-pane.active .text .w').each(function( index ) {
                            if ( targeted.includes( $(this).text().toLowerCase() )) {
                            $( $(this) ).addClass( "idsSelected" );
                            }
                        });
                        */
                    }
                }).on('mouseleave', '#win-'+context_win_id+' [id="'+context+'"] .w,#win-'+context_win_id+' [id="'+context+'"] .pc', function () {
                    if ( alignment[ annotation.id ][ $(this).attr('id') ] ) {
                        var hovered = $( '[id="'+context+'"] #'+$(this).attr('id') ).text();
                        var targeted = [];
                        $.each( alignment[ annotation.id ][ $(this).attr('id') ], function( i,v ) {
                            targeted.push( $( jq(v) ).text().toLowerCase() );
                        });
                        $( '.context-container .globaltext .text #'+alignment[ annotation.id ][ $(this).attr('id') ].join( ',.context-container .globaltext .text #' ) ).removeClass("idsSelected");    // text
                        $( '[id="'+context+'"] div.text #'+$(this).attr('id') ).removeClass("idsSelected"); // context
                        /*
                        $( '.context[id="'+context+'"] .text .w').each(function( index ) {
                            if ( $(this).text().toLowerCase() == hovered.toLowerCase() ) {
                            $( $(this) ).removeClass( "idsSelected" );
                            }
                        });
                        $( '.tab-pane.active .text .w').each(function( index ) {
                            if ( targeted.includes( $(this).text().toLowerCase() )) {
                            $( $(this) ).removeClass( "idsSelected" );
                            }
                        });
                        */                            
                    }
                });
                // alignment activation on text-side
                $(document).on('mouseenter', '#win-'+context_win_id+' .context-container .globaltext .text .w,#win-'+context_win_id+' .context-container .globaltext .text .pc', function () {
                    if ( alignment[ annotation.id+"/orig" ][ $(this).attr('id') ] ) {
                        var hovered = $( '.context-container #'+$(this).attr('id') ).text();
                        var targeted = [];
                        $.each( alignment[ annotation.id+"/orig" ][ $(this).attr('id') ], function( i,v ) {
                            targeted.push( $( jq(v) ).text().toLowerCase() );
                        });
                        document.getElementById( alignment[ annotation.id+"/orig" ][ $(this).attr('id') ][0] ).scrollIntoView( {behavior: "smooth", block: "center"} );
                        $( '[id="'+context+'"] .text #'+alignment[ annotation.id+"/orig" ][ $(this).attr('id') ].join( ',.context-container .globaltext .text #' ) ).addClass("idsSelected");       // text
                        $( '.context-container .globaltext .text #'+$(this).attr('id') ).addClass("idsSelected");    // context
                        /*
                        $( '.context-container .globaltext .text .w').each(function( index ) {
                            if ( $(this).text().toLowerCase() == hovered.toLowerCase() ) {
                            $( $(this) ).addClass( "idsSelected" );
                            }
                        });
                        $( '.tab-pane.active .text .w').each(function( index ) {
                            if ( targeted.includes( $(this).text().toLowerCase() )) {
                            $( $(this) ).addClass( "idsSelected" );
                            }
                        });
                        */
                    }
                }).on('mouseleave', '#win-'+context_win_id+' .context-container .globaltext .text .w,#win-'+context_win_id+' .context-container .globaltext .text .pc', function () {
                    if ( alignment[ annotation.id+"/orig" ][ $(this).attr('id') ] ) {
                        var hovered = $( '.context-container #'+$(this).attr('id') ).text();
                        var targeted = [];
                        $.each( alignment[ annotation.id+"/orig" ][ $(this).attr('id') ], function( i,v ) {
                            targeted.push( $( jq(v) ).text().toLowerCase() );
                        });
                        $( '[id="'+context+'"] .text #'+alignment[ annotation.id+"/orig" ][ $(this).attr('id') ].join( ',.context-container .globaltext .text #' ) ).removeClass("idsSelected");    // text
                        $( '.context-container .globaltext .text #'+$(this).attr('id') ).removeClass("idsSelected"); // context
                        /*
                        $( '.context-container .globaltext .text .w').each(function( index ) {
                            if ( $(this).text().toLowerCase() == hovered.toLowerCase() ) {
                            $( $(this) ).removeClass( "idsSelected" );
                            }
                        });
                        $( '.tab-pane.active .text .w').each(function( index ) {
                            if ( targeted.includes( $(this).text().toLowerCase() )) {
                            $( $(this) ).removeClass( "idsSelected" );
                            }
                        });
                        */                            
                    }
                });

                // contextualization
                $( ".context-container .context" ).append( print_cxtwrk( annotation, cxtcnt, skos ) );
                // tool info 
                $( ".context-container .context" ).append( print_tool( tools[annotation["dcterms:requires"].id] ) );

                clearInterval( t );
                t = setInterval(updateDOM(),500);
                break;

            // ID highlighting
            case "https://www.romanticperiodpoetry.org/id/tool00002/tool":

                // part content
                $( ".context-container .context" ).append( make_context( annotation.id, annotation["rdf:value"], cxtcnt[ annotation["oa:hasTarget"].id ]["rdf:value"] ) );
                $( ".context-container .globaltext .text "+cxtcnt[ annotation["oa:hasTarget"].id ]["rdf:value"].split(',').join( ',.context-container .globaltext .text ' ) ).addClass( "idsSelected" );

                // contextualization
                $( ".context-container .context" ).append( print_cxtwrk( annotation, cxtcnt, skos ) );
                // tool info
                $( ".context-container .context" ).append( print_tool( tools[annotation["dcterms:requires"].id] ) );

                clearInterval( t );
                t = setInterval(updateDOM(),500);
                break;

            // jsPlumb (connection drawing)
            case "https://www.romanticperiodpoetry.org/id/tool00003/tool":
                const response = await fetch(annotation["as:items"].id);
                if (!response.ok) {
                    throw new Error("HTTP error " + response.status);
                }
                const data = await response.json();
                const conn_def = {
                    "type": "Bezier",
                    "options": {
                        "curviness": 150
                    }
                };
                const over_def =  
                    { "type": "PlainArrow", "options": { "width": 10, "length":10, "location": 1} };
                
                const instance = jsPlumb.newInstance({
                    container: $('.context-container .text')[0],
                    endpoints: [ null, null ],
                    paintStyle: { strokeWidth: 1, stroke: '#cd6711' },
                    connectionsDetachable: false
                });
                
                var groups = {}, nodes = {};
                // iterate through nodes and group them if required
                if (data.hasOwnProperty( "nodes" )) {                    
                    data[ "nodes" ].forEach(function(obj) { 
                        if (obj.group) {
                            groups[ obj.group ] = obj.group;
                            if ( nodes.hasOwnProperty( obj.group )) {
                                nodes[ obj.group ].push( obj.id );
                            } else {
                                nodes[ obj.group ] = [];
                                nodes[ obj.group ].push( obj.id );
                            }
                        }
                    });
                    Object.keys( nodes ).forEach(function (key) { 
                        var value = nodes[key]
                        var newArr = value.map(el => '.context-container .text #' + el);
                        nodes[key] = key;
                        $( newArr.join(',') ).wrapAll("<div style='display:inline-block;' id='"+key+"'/>");
                        instance.addGroup({
                            el: $( '#'+key )[0],
                            id: 'grouped'
                        });
                    })
                }
                // iterate through edges taking account of possible groups
                if (data.hasOwnProperty( "edges" )) {                    
                    data[ "edges" ].forEach(function(obj) {
                        var source;
                        if (obj.source in nodes) { 
                            source = nodes[ obj.source ];
                        } else { 
                            source = obj.source 
                        }
                        console.log( source );
                        instance.connect({
                            source: $( '#'+source )[0],
                            target: $('.context-container .text #'+obj.target)[0],
                            connector: conn_def,
                            anchor: "AutoDefault",
                            endpoints: ["Blank", "Blank"],
                            overlays: [ over_def ]
                        });
                    });
                }


                // contextualization
                $( ".context-container .context" ).append( print_cxtwrk( annotation, cxtcnt, skos ) );
                // tool info
                $( ".context-container .context" ).append( print_tool( tools[annotation["dcterms:requires"].id] ) );

                break;

            // no annotation beyond reference to SKOS
            default:


                // contextualization
                $( ".context-container .context" ).append( print_cxtwrk( annotation, cxtcnt, skos ) );
                // tool info
                $( ".context-container .context" ).append( print_tool( tools[annotation["dcterms:requires"].id] ) );

                break;
        
        }
    }
    // context metadata
    $( ".context-container .context" ).append( print_cxtmd( cxtmd[context], skos ) );
    // Add context data/metadata
    $( ".context-container .context" ).append( print_user( contributor ) );
    
    // open canvas
    myCanvasGTEl = document.getElementsByClassName( "context-workbench" )[0];
    myCanvasGT = new bootstrap.Offcanvas(myCanvasGTEl, {
        backdrop: 'static',
        keyboard: false
    }).show();

    // disable non-referenced targets and focus on referenced ones
    $( ".context-container .globaltext .nav-pills button" ).addClass( "disabled" );
    target_tabs.forEach(function(obj) {
        $( "#"+ $( "div[data-iid='"+obj.id+"']" ).parent().attr("id")+'-tab' ).removeClass( "disabled" );
        $( "#"+ $( "div[data-iid='"+obj.id+"']" ).parent().attr("id")+'-tab' ).click();
    });
    // jump to target location in globaltext
    document.getElementById( target_locs[0].split(',')[0].substring(1) ).scrollIntoView( {behavior: "smooth", block: "center"} );
    // on showing canvas
    /*
    myCanvasGTEl.addEventListener('shown.bs.offcanvas', function (event) {
        $( ".context-workbench .context" ).position({
            my: "center",
            at: "center",
            of: ".context-container"
        });
    });
    */
    // on closing canvas
    myCanvasGTEl.addEventListener('hide.bs.offcanvas', function (event) {
        $(".popover").remove();
        $(this).remove();
        mode = "read"; 
        history.replaceState(null,null,previousState!=null?previousState:domain);// TODO
//        location.href = "/works/#text/"+cxtcnt[ annotation["oa:hasTarget"].id ]["crm:P48_has_preferred_identifier"];
        zInd = 1054;
        done_tooltipTriggerList = [];
        done_popoverTriggerList = [];
        clearInterval( t );
        annos = {};
        annotorious = {};
        updateDOM();
    });
}

/*
$( document ).on('click', 'a.show_globaltext', async function (e) {
    display_globaltext( e.currentTarget.dataset.tid,e.currentTarget.dataset.wid );
});
*/

// page re-load on theme switch
function reTheme() {
    if ( $( "#map" ).length || $( "#network" ).length || $( "#cy" ).length || $( "body#about" ).length ) {
        location.reload();
    }
}

// document.ready
document.addEventListener("DOMContentLoaded", () => {

    // Authors/Works pages
    // Filtering logic for each input field
    const filterInputs = document.querySelectorAll('.filter-input');
    filterInputs.forEach(input => {
        input.addEventListener('input', function() {
            const filterText = this.value.toLowerCase();
            const listItems = $(this).closest("[id]").find('li');

            $(this).closest("[id]").find("div[id*='-list-']").show()
            $(this).closest("[id]").find("button").each(function() {
                $(this).removeClass('active');
            });
            $(this).closest("[id]").find("button[id*='-All']").addClass('active');
            // Filter the corresponding list
            for (let i = 0; i < listItems.length; i++) {
                const itemText = listItems[i].textContent.toLowerCase();
                if (itemText.includes(filterText)) {
                    listItems[i].classList.remove('hidden');
                } else {
                    listItems[i].classList.add('hidden');
                }
            }
            $(this).closest("[id]").find("div[id*='-list-']").find(".letter").each(function() {
                if ($(this).children(":visible").length == 0) {
                    $(this).closest("div[id*='-list-']").hide();
                }
            });
        });
    });

    const offcanvasElementList = document.querySelectorAll('.offcanvas')
    const offcanvasList = [...offcanvasElementList].map(offcanvasEl => new bootstrap.Offcanvas(offcanvasEl))

    // SSO
    //$( ".sso,.sso-sign-in" ).remove(); // TODO: remove when ready
    if ( /romanticperiodpoetry\.org/.test(window.location.href) ) {
        user = Cookies.get( 'RPPA-login-user' ) || undefined;
        username = Cookies.get( 'RPPA-login-username' ) || undefined;
    } else {
        user = "rppa:user-9bf0ccc9-dcaa-4e57-9b83-b8a08d2614cb";
        username = "Alexander Huber";
    }
    if ( user != undefined && username != 'undefined' ) {
        $( ".sso-sign-in" ).remove();
        provider_img = Cookies.get( 'RPPA-login-provider' );
        if ( provider_img == 'orcid' ) {
            provider_img = ` <i class="fa-brands fa-orcid"></i>`
        } else if ( provider_img == 'fb' ) {
            provider_img = ` <i class="fa-brands fa-facebook"></i>`
        } else if ( provider_img == 'google' ) {
            provider_img = ` <i class="fa-brands fa-google"></i>`
        } else {
            provider_img = ` <i class="fas fa-user-circle"></i>`
        }
    }
    $( ".sso" ).append(
        `Signed in as: <em><span id="username">`+((user != undefined && username != 'undefined')?username:'Not signed in')+`</span></em> <span id="provider">`+((user != undefined && username != 'undefined')?provider_img:'')+`</span>`+
        ((user != undefined && username != 'undefined')?'':' <button type="button" class="btn btn-sm sso-sign-in" style="background-color:var(--bs-orange);color:#fff;margin-left:5px;margin-top:-4px;">Sign in</button>' )
    );

    // Layout management
    $.when( loadPlaces(), loadPersons(), loadNations(), loadTexts(), loadWorks() ).done( function() {
        loadLayout();
    });

    // Authors/Works browse pages
    if ( $("#authorsDT").length ) {
		initDataAuthors();
	} else if ( $("#worksDT").length ) {
		initDataWorks();
	}

    window.addEventListener("hashchange", loadLayout, false);
    cytoscape.use(cytoscapePopper(tippyFactory));

});
