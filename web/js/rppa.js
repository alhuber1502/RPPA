// RPPA

// global settings
var user = undefined, username = undefined;
var workbench = {}, provider_img = '', contexts, skos, contributors;
var domain = "https://www.romanticperiodpoetry.org";
var theme = document.documentElement.getAttribute('data-bs-theme');
const uuidRegex = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;

// global variables
var t, myCanvasGT, myCanvasGTEl, zInd = 1054, player = {}, viewer = {}, mode = 'read', 
    bbs_text = $( "<ul class='bbs_text connectedBB'></ul>" ), bbs_context = $( "<ul class='bbs_context connectedBB'></ul>" ),
    selected_bbs_text = [], selected_bbs_context = [];
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

        $( '.dt-search' ).append( `<button id="searchButton" type="button" class="btn btn-sm" style="width:40px;background-color:#e07012;color:#fff;">
            <i class="fa fa-search"></i>
            </button>` );
        $('#searchButton').click(function () {
            table.search($("#dt-search-0").val()).draw();
        });

    });
}
// works browse page (DT)
var initDataWorks = function() {
    $.when( loadPlaces(), loadNations(), loadPersons(), loadTexts(), loadWorks() ).done( function() {
        var wwrks = _l.keyBy( works, 'id' );
        var wtxts = $.map(texts , function(value, index) {
            // include all originals as well as works that ONLY exist in translation
            if ( value.type === 'orig' || ( value.type.startsWith('trans') && _l.groupBy( texts, 'work' )[ value.work ].length < 2 ) ) {
                if (!value.piso) { value.piso = ''; }
                if (!value.ciso) { value.ciso = ''; }
                value.lang = language[ wwrks[ value.work ].lang ].name;
                value.aut = wwrks[ value.work ].aut;
                value.nat = wwrks[ value.work ].aut;
                value.cont = wwrks[ value.work ].aut;
                return [value];
            }
        });
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

        $( '.dt-search' ).append( `<button id="searchButton" type="button" class="btn btn-sm" style="width:40px;background-color:#e07012;color:#fff;">
            <i class="fa fa-search"></i>
            </button>` );
        $('#searchButton').click(function () {
            table.search($("#dt-search-0").val()).draw();
        });

    });
}
// works browse page (DT)
var initDataWorksSearch = function( text, work ) {
    $.when( loadPlaces(), loadNations(), loadPersons(), loadTexts(), loadWorks() ).done( function() {
        var wwrks = _l.keyBy( works, 'id' );
        var wtxts = $.map(texts , function(value, index) {
            // include all originals as well as works that ONLY exist in translation
            if ( value.type === 'orig' || ( value.type.startsWith('trans') && _l.groupBy( texts, 'work' )[ value.work ].length < 2 ) ) {
                if (!value.piso) { value.piso = ''; }
                if (!value.ciso) { value.ciso = ''; }
                value.lang = language[ wwrks[ value.work ].lang ].name;
                value.aut = wwrks[ value.work ].aut;
                value.nat = wwrks[ value.work ].aut;
                value.cont = wwrks[ value.work ].aut;
                return [value];
            }
        });
        var table = $('#worksSearchDT').DataTable({
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
                                return `<a class="genetic_context" href="#contribute/2/genetic/2/`+text+`-`+row.text+`">`+wwrks[ row.work ].tit+( row.extent == 'excerpt'?" "+row.sub:'' )+`</a>`;
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
                    visible: false,
                    render: function( data, type, row ) {
                        if( row.ciso != '' ) {
                            return row.ciso.replace( "-", "" ).substring(0,4);
                        } else return "—";
                    }
                },
                {   data: 'piso',
                    visible: false,
                    render: function( data, type, row ) {
                        if( row.piso != '' ) {
                            return row.piso.replace( "-", "" ).substring(0,4);
                        } else return "—";
                    }
                },
                {   data: 'extent',
                    visible: false,
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
                                    auts_dis.push( persons[ v.trim() ].name );
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
                    visible: false,
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
                        $('#worksSearchDT thead').css( 'visibility','initial' );
                        $('.spinner').attr('style', 'display: none !important');
                    }, 100);
                } else {
                    $('#worksSearchDT thead').css( 'visibility','initial' );
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
            //dom: '<"dtsp-dataTable"lf>t',
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
        /*
        table.searchPanes();
        $("div.dtsp-verticalPanes").append(table.searchPanes.container());
        table.searchPanes.resizePanes();
        */
        table.buttons().container()
            .insertBefore( '.dtsp-clearAll' );	

        $('#worksSearchDT').on( 'search.dt', function ( e, settings, len ) {
            setTimeout(function(){
                table.page( 'first' ).draw( 'page' );
            }, 200);
        });
        $('.globalcontext .dt-search').on('search', function (e) {
            table.search('').draw()
        });

        $( '.globalcontext .dt-search' ).append( `<button id="searchButton" type="button" class="btn btn-sm" style="width:40px;background-color:#2a9d8f;color:#fff;">
            <i class="fa fa-search"></i>
            </button>` );
        $('#searchButton').click(function () {
            table.search($("#dt-search-0").val()).draw();
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
async function display_globaltext( tid, wid, show ) {

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
    workbench[ wid ] = _l.keyBy( r.graph, 'id');

    // create canvas for editing mode
    if ( mode == "edit" ) {
        zInd = zInd+1;
        if ( $('.offcanvas.show').length ) { 
//            $( myCanvasGTEl ).offcanvas( "hide" ); // myCanvasGT.hide(); // close any open texts if a new one is requested
            $(".popover").hide(); // hide if new text was called from a popover
        }
        // create global text canvas
        if ( !$('.offcanvas.show').length ) { 
            var genericCloseBtnHtml = '<button onclick="$(this).closest(\'div.offcanvas\').dispose();" type="button" class="btn-close" aria-hidden="true" style="float:right;"></button>';
            var text = `<!-- Canvas -->
                <div style="z-index:`+zInd+`;overflow:inherit;" class="offcanvas offcanvas-start globaltext-workbench" data-bs-backdrop="static" tabindex="-1" id="staticBackdrop" aria-labelledby="staticBackdropLabel">
                    <div class="offcanvas-body globaltext-container" data-wid="`+wid+`" data-tid="`+tid+`">`+
    //                    genericCloseBtnHtml+`
                        `<button type="button" class="btn-close" style="float:right;" data-mode="read" data-bs-dismiss="offcanvas" aria-label="Close"></button>
                        <div class="row">
                        <!--
                        <div class="tools" style="float:right;">
                            <input `+((user == undefined && username == undefined)?'disabled':'')+` style="height:36px;width:123px;" class="changeMode" type="checkbox" checked data-toggle="toggle" data-wid="`+wid+`" data-tid="`+tid+`" id="changeMode-flip" data-mode="edit" data-onlabel="Reading" data-offlabel="Editing" data-onstyle="warning" data-offstyle="success">
                            `+((user == undefined && username == undefined)?'<label> <button type="button" class="btn btn-sm sso-sign-in" style="background-color:var(--bs-orange);color:#fff;margin-left:5px;margin-top:-4px;">Sign in</button></label>':'')+`
                        </div>
                        -->
                                <div class="globaltext col-sm-4">
                                </div>
                                <!--
                                <div class="col-sm-4 workbench" style="max-width: calc(100vw / 3 - 20px);overflow:hidden;">
                                <h2>Current selections</h2><ul class="bb"></ul>
                                </div>
                                -->
                                <div class="col-sm-8 steps" style="max-width: calc( (100vw / 12) * 8 - 40px);">
                                </div>
                        </div>
                    </div>
                </div>
                `;
            $( "body" ).prepend( text );
        }
    }
    // create global text
    await drawGlobalText( tid, wid );
    // activate text pane
    try { $( '#'+$( $("#"+tid).closest( ".tab-pane" )[0] ).attr( 'id' )+'-tab' )[0].click(); } catch(e) {}
    // process contexts/building-blocks
    await processGlobalText( tid, wid, show );
    
    // attach handlers for editing
    if ( mode == "edit" ) {
        if ( !$('.offcanvas.show').length ) { 
            myCanvasGTEl = document.getElementsByClassName( "globaltext-workbench" )[0];
            myCanvasGT = new bootstrap.Offcanvas(myCanvasGTEl, {
                backdrop: 'static',
                keyboard: false
            }).show();
            
            // on showing canvas
            myCanvasGTEl.addEventListener('shown.bs.offcanvas', function (event) {
                /*
                $( ".globaltext-workbench .globaltext" ).position({
                    my: "center",
                    at: "center",
                    of: ".globaltext-container"
                });
                */
            });
            // on closing canvas
            myCanvasGTEl.addEventListener('hide.bs.offcanvas', function (event) {
                mode = 'read';
                $( "#mode" ).remove();
                $(".popover").remove();
                if ( !!Object.keys( annotorious ).length ) {
                    Object.keys( annotorious ).forEach(key => {
                        annotorious[ key ].readOnly = true; // image
                    });
                }
                if ( !!Object.keys( player ).length ) {
                    Object.keys( player ).forEach(key => {
                        player[ key ].disableDragSelection(); // sound
                        player[ key ].setProgressColor( '#666' );
                    });
                }
                history.replaceState(null,null,previousState!=null?previousState:domain);
                $(this).remove();
                zInd = 1054;
                done_tooltipTriggerList = [];
                done_popoverTriggerList = [];
                clearInterval( t );
                annos = {};
                annotorious = {};
                $( ".workbench .bb" ).html(``);
                bbs_text = $( "<ul class='bbs_text connectedBB'></ul>" );
                bbs_context = $( "<ul class='bbs_context connectedBB'></ul>" );
                updateDOM();
            });
        }
    }
}

/*  This function creates the globaltext DOM for all expressions available for
    the work. It
    - initializes all tools (TEI text, Openseadragon, Wavesurfer, ...)
    - generates the tabbable view for each of the available expressions
    - adds the globaltext to the DOM
*/
async function drawGlobalText( tid, wid ) {
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
        cnt_lang = workbench[ wid ][ workbench[ wid ][ domain+"/id/"+wid+"/work" ][ "lrmoo:R3_is_realised_in" ][i].id ][ "crm:P72_has_language" ].id;
        cnt_lang = cnt_lang.match(/\/id\/(.*?)\/language$/)[1];
        // navigation
        if ( madeActive == false ) {
            if ( _l.findIndex(workbench[ wid ][ workbench[ wid ][ domain+"/id/"+wid+"/work" ][ "lrmoo:R3_is_realised_in" ][i].id ][ "crm:P2_has_type" ], function(typ) { return typ.id == 'lct:txt' }) != -1 ) {
                if ( workbench[ wid ][ workbench[ wid ][ domain+"/id/"+wid+"/work" ][ "lrmoo:R3_is_realised_in" ][i].id ].hasOwnProperty( 'lrmoo:R15_has_fragment' ) ) {
                    nav_name = 'Text (excerpt)';
                } else if ( workbench[ wid ][ workbench[ wid ][ domain+"/id/"+wid+"/work" ][ "lrmoo:R3_is_realised_in" ][i].id ].hasOwnProperty( 'lrmoo:R4i_is_embodied_in' ) ) {
                    nav_name = 'Text';
                }
            }
        } else if ( _l.findIndex(workbench[ wid ][ workbench[ wid ][ domain+"/id/"+wid+"/work" ][ "lrmoo:R3_is_realised_in" ][i].id ][ "crm:P2_has_type" ], function(typ) { return typ.id == 'lct:txt' }) != -1 ) {
            if ( workbench[ wid ][ workbench[ wid ][ domain+"/id/"+wid+"/work" ][ "lrmoo:R3_is_realised_in" ][i].id ].hasOwnProperty( 'lrmoo:R15_has_fragment' ) ) {
                nav_name = 'Translation (<code>'+cnt_lang+'</code>) (excerpt)';
            } else if ( workbench[ wid ][ workbench[ wid ][ domain+"/id/"+wid+"/work" ][ "lrmoo:R3_is_realised_in" ][i].id ].hasOwnProperty( 'lrmoo:R4i_is_embodied_in' ) ) {
                nav_name = 'Translation (<code>'+cnt_lang+'</code>)';
            }
        } else if ( _l.findIndex(workbench[ wid ][ workbench[ wid ][ domain+"/id/"+wid+"/work" ][ "lrmoo:R3_is_realised_in" ][i].id ][ "crm:P2_has_type" ], function(typ) { return typ.id == 'sc:Manifest' || typ.id == 'lct:img' || typ.id == 'lct:dig'}) != -1) {
            if ( workbench[ wid ][ workbench[ wid ][ domain+"/id/"+wid+"/work" ][ "lrmoo:R3_is_realised_in" ][i].id ].hasOwnProperty( 'lrmoo:R15_has_fragment' ) ) {
                nav_name = 'Facsimile (excerpt)';
            } else if ( workbench[ wid ][ workbench[ wid ][ domain+"/id/"+wid+"/work" ][ "lrmoo:R3_is_realised_in" ][i].id ].hasOwnProperty( 'lrmoo:R4i_is_embodied_in' ) ) {
                nav_name = 'Facsimile';
            }
        } else if ( _l.findIndex(workbench[ wid ][ workbench[ wid ][ domain+"/id/"+wid+"/work" ][ "lrmoo:R3_is_realised_in" ][i].id ][ "crm:P2_has_type" ], function(typ) { return typ.id == 'lct:aud' || typ.id == 'lct:mov' }) != -1) {
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
                <button class="nav-link`+((madeActive==false)?' active':'')+`" id="pills-`+tid+`-`+i+`-tab" data-bs-toggle="pill" data-bs-target="#pills-`+tid+`-`+i+`"
                    type="button" role="tab" aria-controls="pills-`+tid+`-`+i+`" aria-selected="true"
                    data-expr="`+workbench[ wid ][ workbench[ wid ][ domain+"/id/"+wid+"/work" ][ "lrmoo:R3_is_realised_in" ][i].id ].id+`" data-tid="`+tid+`" `;
                    if ( workbench[ wid ][ workbench[ wid ][ domain+"/id/"+wid+"/work" ][ "lrmoo:R3_is_realised_in" ][i].id ].hasOwnProperty( 'lrmoo:R15_has_fragment' ) ||
                         workbench[ wid ][ workbench[ wid ][ domain+"/id/"+wid+"/work" ][ "lrmoo:R3_is_realised_in" ][i].id ].hasOwnProperty( 'lrmoo:R4i_is_embodied_in' ) ) {
                        if ( workbench[ wid ][ workbench[ wid ][ domain+"/id/"+wid+"/work" ][ "lrmoo:R3_is_realised_in" ][i].id ].hasOwnProperty( 'lrmoo:R15_has_fragment' ) ) {
                            excerpt = _l.findIndex( workbench[ wid ][ workbench[ wid ][ domain+"/id/"+wid+"/work" ][ "lrmoo:R3_is_realised_in" ][i].id ][ "lrmoo:R15_has_fragment" ], function(typ) { 
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
        if ( _l.findIndex(workbench[ wid ][ workbench[ wid ][ domain+"/id/"+wid+"/work" ][ "lrmoo:R3_is_realised_in" ][i].id ][ "crm:P2_has_type" ], function(typ) { return typ.id == 'lct:txt' }) != -1 ) {
            if ( workbench[ wid ][ workbench[ wid ][ domain+"/id/"+wid+"/work" ][ "lrmoo:R3_is_realised_in" ][i].id ].hasOwnProperty( 'lrmoo:R15_has_fragment' ) ) { // fragments
                if ( madeActive == false && tid != '' ) {                                                                                                                         // text (one fragment)
                    excerpt = _l.findIndex( workbench[ wid ][ workbench[ wid ][ domain+"/id/"+wid+"/work" ][ "lrmoo:R3_is_realised_in" ][i].id ][ "lrmoo:R15_has_fragment" ], function(typ) { 
                        return workbench[ wid ][ workbench[ wid ][ typ.id ][ "crm:P106_is_composed_of" ][0]["id"]][ "crm:P106_is_composed_of" ][0].id.includes( '/'+tid+'/' );
                    });
                } else if ( tid == '' ) {                                                                                                                            // work (all fragments)
                    tab_content += `<div class="tab-pane fade show`+((madeActive==false)?' active':'')+`" id="pills-`+tid+`-`+i+`" role="tabpanel" aria-labelledby="pills-`+tid+`-`+i+`-tab" lang="`+cnt_lang+`">`;
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
                tab_content += `<div class="tab-pane fade show`+((madeActive==false)?' active':'')+`" id="pills-`+tid+`-`+i+`" role="tabpanel" aria-labelledby="pills-`+tid+`-`+i+`-tab" lang="`+cnt_lang+`"> 
                    <div id="`+cnt_loc[0].id+`" data-iid="`+cnt_loc[0].id+`" data-id="https://www.romanticperiodpoetry.org/id/`+wid+`/work"
                    data-expr="`+workbench[ wid ][ workbench[ wid ][ domain+"/id/"+wid+"/work" ][ "lrmoo:R3_is_realised_in" ][i].id ].id+`" data-tid="`+tid+`" `;
                    if ( workbench[ wid ][ workbench[ wid ][ domain+"/id/"+wid+"/work" ][ "lrmoo:R3_is_realised_in" ][i].id ].hasOwnProperty( 'lrmoo:R15_has_fragment' ) ||
                        workbench[ wid ][ workbench[ wid ][ domain+"/id/"+wid+"/work" ][ "lrmoo:R3_is_realised_in" ][i].id ].hasOwnProperty( 'lrmoo:R4i_is_embodied_in' ) ) {
                        if ( workbench[ wid ][ workbench[ wid ][ domain+"/id/"+wid+"/work" ][ "lrmoo:R3_is_realised_in" ][i].id ].hasOwnProperty( 'lrmoo:R15_has_fragment' ) ) {
                            excerpt = _l.findIndex( workbench[ wid ][ workbench[ wid ][ domain+"/id/"+wid+"/work" ][ "lrmoo:R3_is_realised_in" ][i].id ][ "lrmoo:R15_has_fragment" ], function(typ) { 
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
        } else if ( _l.findIndex(workbench[ wid ][ workbench[ wid ][ domain+"/id/"+wid+"/work" ][ "lrmoo:R3_is_realised_in" ][i].id ][ "crm:P2_has_type" ], function(typ) { return typ.id == 'lct:img' || typ.id == 'sc:Manifest' }) != -1 ) {
            cnt_loc = workbench[ wid ][ workbench[ wid ][ workbench[ wid ][ domain+"/id/"+wid+"/work" ][ "lrmoo:R3_is_realised_in" ][i].id ][ "lrmoo:R4i_is_embodied_in" ].id ][ "crm:P106_is_composed_of" ]
            tab_content += `<div class="tab-pane fade show`+((madeActive==false)?' active':'')+`" id="pills-`+tid+`-`+i+`" role="tabpanel" aria-labelledby="pills-`+tid+`-`+i+`-tab" lang="`+cnt_lang+`">
                <div id="`+cnt_loc[0].id+`" data-iid="`+cnt_loc[0].id+`" data-id="https://www.romanticperiodpoetry.org/id/`+wid+`/work"
                data-expr="`+workbench[ wid ][ workbench[ wid ][ domain+"/id/"+wid+"/work" ][ "lrmoo:R3_is_realised_in" ][i].id ].id+`" style="height:inherit;" data-tid="`+tid+`" `;
                if ( workbench[ wid ][ workbench[ wid ][ domain+"/id/"+wid+"/work" ][ "lrmoo:R3_is_realised_in" ][i].id ].hasOwnProperty( 'lrmoo:R15_has_fragment' ) ||
                    workbench[ wid ][ workbench[ wid ][ domain+"/id/"+wid+"/work" ][ "lrmoo:R3_is_realised_in" ][i].id ].hasOwnProperty( 'lrmoo:R4i_is_embodied_in' ) ) {
                    if ( workbench[ wid ][ workbench[ wid ][ domain+"/id/"+wid+"/work" ][ "lrmoo:R3_is_realised_in" ][i].id ].hasOwnProperty( 'lrmoo:R15_has_fragment' ) ) {
                        excerpt = _l.findIndex( workbench[ wid ][ workbench[ wid ][ domain+"/id/"+wid+"/work" ][ "lrmoo:R3_is_realised_in" ][i].id ][ "lrmoo:R15_has_fragment" ], function(typ) { 
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
            // Images
            if ( workbench[ wid ][ workbench[ wid ][ domain+"/id/"+wid+"/work" ][ "lrmoo:R3_is_realised_in" ][i].id ][ "crm:P2_has_type" ][0].id == "lct:img" ) {
                $.each(workbench[ wid ][ cnt_loc[0].id ][ "crm:P106_is_composed_of" ].sort(), function(i,v) {
                    var tilesource = {
                        type: "image",
                        url: v.id // (( component["crm:P2_has_type"]["id"] == "prisms:unavailable")?"/images/notavailable.jpg":v)
                    };
                    sources.push( tilesource );
                });
            } else if ( workbench[ wid ][ workbench[ wid ][ domain+"/id/"+wid+"/work" ][ "lrmoo:R3_is_realised_in" ][i].id ][ "crm:P2_has_type" ][0].id == "sc:Manifest" ) {
            // IIIF
                data = await $.getJSON( workbench[ wid ][ cnt_loc[0].id ][ "crm:P106_is_composed_of" ][0].id );
                // v2
                if ( data["@context"].includes( '/presentation/2' ) ) {
                    $.each( data.sequences[0].canvases, function( i,v ) {
                        $.each( v.images, function( i2,v2 ) {
                            var tilesource = {};
                            tilesource = v2.resource.service;
                            tilesource.height = parseInt( v2.resource.height );
                            tilesource.width = parseInt( v2.resource.width );
                            if (!tilesource.protocol) {
                                tilesource.protocol = "http://iiif.io/api/image";
                            }
                            sources.push( tilesource );
                        });
                    });
                // v3
                } else {
                    $.each( data.items, function( i,v ) {
                        $.each( v.items[0].items, function( i2,v2 ) {
                            var tilesource = {};
                            tilesource = v2.body.service[0];
                            tilesource.height = parseInt( v.height );
                            tilesource.width = parseInt( v.width );
                            if (!tilesource.protocol) {
                                tilesource.protocol = "http://iiif.io/api/image";
                            }
                            tilesource["@context"] = "http://iiif.io/api/image/3/context.json"
                            sources.push( tilesource );
                        });
                    });
                }
            }
            if ( mode == 'edit') {
                openseadragonOptions.id = "openseadragon_editing_"+cnt_loc[0].id;
            } else if ( mode == 'read') {
                openseadragonOptions.id = "openseadragon_"+cnt_loc[0].id;
            } else {
                openseadragonOptions.id = "openseadragon_viewing_"+cnt_loc[0].id;
            }
            openseadragonOptions.tileSources = sources;
        } else if ( _l.findIndex(workbench[ wid ][ workbench[ wid ][ domain+"/id/"+wid+"/work" ][ "lrmoo:R3_is_realised_in" ][i].id ][ "crm:P2_has_type" ], function(typ) { return typ.id == 'lct:aud' }) != -1 ) {
            if ( workbench[ wid ][ workbench[ wid ][ domain+"/id/"+wid+"/work" ][ "lrmoo:R3_is_realised_in" ][i].id ].hasOwnProperty( 'lrmoo:R15_has_fragment' ) ) { // fragments
                cnt_loc = workbench[ wid ][ workbench[ wid ][ workbench[ wid ][ domain+"/id/"+wid+"/work" ][ "lrmoo:R3_is_realised_in" ][i].id ][ "lrmoo:R15_has_fragment" ][0].id ][ "crm:P106_is_composed_of" ];
            } else {
                cnt_loc = workbench[ wid ][ workbench[ wid ][ workbench[ wid ][ domain+"/id/"+wid+"/work" ][ "lrmoo:R3_is_realised_in" ][i].id ][ "lrmoo:R4i_is_embodied_in" ].id ][ "crm:P106_is_composed_of" ];
            }
            //prfset_id = cnt_loc[0].id;
            prfset_id = "player_"+(mode == 'edit'?'editing_'+cnt_loc[0].id:(mode == 'view')?'viewing_'+cnt_loc[0].id:cnt_loc[0].id);
            tab_content += `<div class="tab-pane fade show`+((madeActive==false)?' active':'')+`" id="pills-`+tid+`-`+i+`" role="tabpanel" aria-labelledby="pills-`+tid+`-`+i+`-tab" lang="`+cnt_lang+`">
                <div id="`+cnt_loc[0].id+`" data-iid="`+cnt_loc[0].id+`" data-id="https://www.romanticperiodpoetry.org/id/`+wid+`/work"
                    data-expr="`+workbench[ wid ][ workbench[ wid ][ domain+"/id/"+wid+"/work" ][ "lrmoo:R3_is_realised_in" ][i].id ].id+`" data-tid="`+tid+`" `;
                if ( workbench[ wid ][ workbench[ wid ][ domain+"/id/"+wid+"/work" ][ "lrmoo:R3_is_realised_in" ][i].id ].hasOwnProperty( 'lrmoo:R15_has_fragment' ) ||
                    workbench[ wid ][ workbench[ wid ][ domain+"/id/"+wid+"/work" ][ "lrmoo:R3_is_realised_in" ][i].id ].hasOwnProperty( 'lrmoo:R4i_is_embodied_in' ) ) {
                    if ( workbench[ wid ][ workbench[ wid ][ domain+"/id/"+wid+"/work" ][ "lrmoo:R3_is_realised_in" ][i].id ].hasOwnProperty( 'lrmoo:R15_has_fragment' ) ) {
                        excerpt = _l.findIndex( workbench[ wid ][ workbench[ wid ][ domain+"/id/"+wid+"/work" ][ "lrmoo:R3_is_realised_in" ][i].id ][ "lrmoo:R15_has_fragment" ], function(typ) { 
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
                    Zoom: <input type="range" data-id="`+prfset_id+`" min="1" max="100" value="20" style="vertical-align:middle;"/>
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
        tab_nav += `<li style="right: -10px;position: relative;"><a href="#contribute/1/`+tid+`" class="add_context`+((user == undefined && username == undefined)?' pe-none':' pe-auto')+`" `+((user == undefined && username == undefined)?'tabindex="-1" aria-disabled="true"':'')+` title="add a new context" data-tid="`+tid+`" data-wid="`+wid+`"><i class="fas fa-plus-circle"></i></a></li>`;
    }
    // reading view
    if ( mode == "read" ) {
        $( ".globaltext-container .globaltext" ).replaceWith( `<div class="globaltext"><ul class="nav nav-pills" id="pills-tab" role="tablist">`+tab_nav+`</ul><div class="tab-content" id="pills-tabContent">`+tab_content+`</div></div>` );
    } else if ( mode == "edit" ) {
    // editing view
        if ( location.hash.substring( location.hash.indexOf("#"), location.hash.lastIndexOf("/")+1 ) == '#contribute/1/' ||
             location.hash.substring( location.hash.indexOf("#"), location.hash.lastIndexOf("/")+1 ) == "#contribute/2/typological/" ||
             location.hash.substring( location.hash.indexOf("#"), location.hash.lastIndexOf("/")+1 ) == "#contribute/2/genetic/" ||
             location.hash.substring( location.hash.indexOf("#"), location.hash.lastIndexOf("/")+1 ) == "#contribute/2/intratextual/" ||
             (location.hash.substring( location.hash.indexOf("#"), location.hash.lastIndexOf("/")+1 ) == "#contribute/2/genetic/2/" && tid == location.hash.substring( location.hash.lastIndexOf("/")+1 ).split( "-" )[0] )
            ) {
            // load globaltext as text
            $( ".globaltext-workbench .globaltext-container .globaltext" ).replaceWith( `<div class="globaltext"><ul class="nav nav-pills" id="pills-tab" role="tablist">`+tab_nav+`</ul><div class="tab-content" id="pills-tabContent">`+tab_content+`</div></div>` );
        }
        if ( location.hash.substring( location.hash.indexOf("#"), location.hash.lastIndexOf("/")+1 ) == "#contribute/2/genetic/2/" && tid == location.hash.substring( location.hash.lastIndexOf("/")+1 ).split( "-" )[1] ) {
            // load globaltext as context
            $( ".globaltext-workbench .globaltext-container .globalcontext" ).html( `<div class="globaltext"><ul class="nav nav-pills" id="pills-tab" role="tablist">`+tab_nav+`</ul><div class="tab-content" id="pills-tabContent">`+tab_content+`</div></div>` );
        }
    } else {
    // context view
        if ( $( ".globalcontext" ).length ) {
            $( ".context-workbench .context-container .globalcontext" ).html( `<div class="globaltext"><ul class="nav nav-pills" id="pills-tab" role="tablist">`+tab_nav+`</ul><div class="tab-content" id="pills-tabContent">`+tab_content+`</div></div>` );
        } else {
            $( ".context-workbench .context-container .globaltext" ).replaceWith( `<div class="globaltext"><ul class="nav nav-pills" id="pills-tab" role="tablist">`+tab_nav+`</ul><div class="tab-content" id="pills-tabContent">`+tab_content+`</div></div>` );
        }
    }
    clearInterval( t );
    t = setInterval(updateDOM(),500);

    // initialize expressions
    // facsimile
    if ( imgset_id !== undefined ) {
        var startPage = undefined, pages = [];
        $.each( $( (mode == 'edit'?'.globaltext-workbench [id*='+wid+'] .text':(mode == 'read')?'.globaltext-container [id*='+wid+'] .text':'.context-container [id*='+wid+'] .text')+" .pagebreak"), function (i,v) {
            pages.push( $(v).data( "facs" ).split( '/' ).pop() );
            if ( !$(v).find( "span" ).hasClass( "image_link" ) ) {
                $(v).append( ` <span class="image_link">[<a href="" data-imageset="`+imgset_id.substring( imgset_id.lastIndexOf('_')+1 )+`" data-id="`+ i +`">`+ (i+1).toString().padStart(3, "0") +`</a>]</span>` );
            }
            if ( i == 0 ) { startPage = i }
        });
        if ( openseadragonOptions.hasOwnProperty( "tileSources" ) ) {
            if ( pages.length > 0 ) {
                var sources = [];
                $.each( pages, function(i,v) {
                    sources.push( _l.find( openseadragonOptions.tileSources, function(tile) { if (tile.hasOwnProperty( "url" )) {return tile.url.includes( v );} else {return tile.id.includes( v );} } ) )
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
            const player_id = e.target.dataset.id;
            const minPxPerSec = e.target.value;
            player[ player_id ].zoom(minPxPerSec)
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
    if ( user.startsWith( "rppa:" ) ) {
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
                publish( BGupdate );
            }).fail( function( error ) {
                console.log( "FATAL UPDATE error!",error );
            });
        })
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
		`<div role="alert" style="min-width:300px;z-index:2060;" aria-live="assertive" aria-atomic="true" class="toast position-fixed bottom-0 end-0 p-3 alert-`+type+`" data-autohide="`+hide+`" data-delay="`+ms+`">
            <div class="toast-header">
                <span class="badge badge-`+type+`"><i class="fas fa-exclamation-triangle"></i></span> 
                <strong class="me-auto">RPPA</strong>
                <small>just now</small>
                <button type="button" class="ml-2 mb-1 btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
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
/*
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
*/

// update UI on expression / expressions selection
$(document).on('click','button[data-bs-toggle="pill"]',function(){
    $(".popover").hide();
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
async function processGlobalText( tid, wid, show ) {
    var work = domain+"/id/"+wid+"/work";
    // only reading section should remain, contexts variable holds ALL
    // contexts (i.e. for ALL expressions!), edit section is obsolete
    if ( ( mode == "read" || mode == "view" ) && show != false ) {
        // load all contexts
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
                        ?w intro:R17_actualizesFeature|crm:P67_refers_to ?f .
                        ?f ?p ?o .
                    } UNION {
                        ?w intro:R19_hasType ?ty .
                        ?ty intro:R4i_isDefinedIn|crm:P67_refers_to ?f .
                        ?f ?p ?o .
                    } UNION {
                        ?w intro:R19_hasType ?ty .
                        ?ty intro:R4i_isDefinedIn ?f2 .
                        ?f2 skos:inScheme ?f .
                        ?f ?p ?o .
                    } UNION {
                        ?w intro:R17_actualizesFeature ?f2 .
                        ?f2 skos:inScheme ?f .
                        ?f ?p ?o .
                    }
                    BIND( ?f AS ?s )
    		    }   # ALL target locations in both the expressions and the OntoPoetry graph
                UNION {
                    ?s2 intro:R20_discusses ?work .
                    ?s2 intro:R21_identifies+ ?w .
                    ?w (intro:R18i_actualizationFoundOn|intro:R13_hasReferringEntity|intro:R12_hasReferredToEntity) ?t .
                    {
                        ?t intro:R10i_isPassageOf ?to .
                        ?to ?p ?too .
                        BIND ( ?to AS ?s)
                    } UNION {
                        ?t intro:R10i_isPassageOf ?do .
                        ?do ?p ?to .
                        ?to ?p ?too
                        BIND ( ?to AS ?s)
                    } UNION {
                        ?t intro:R41_hasLocation [ ?p ?to ] .
                        ?to rdf:rest*/rdf:first ?too .
                        BIND ( ?t AS ?s)
                    } UNION {
                        ?t intro:R41_hasLocation ?to .
                        ?to ?p ?too .		
                        BIND ( ?t AS ?s)
                    }
                    BIND ( ?too AS ?o)
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
            r.graph = [];
        }
        contexts = _l.groupBy( _l.filter( r.graph, function(o) { return o.id.startsWith( 'http' ); }), function(o) { return o.id.match(uuidRegex) });
        skos = _l.keyBy( _l.filter( r.graph, function(o) { return o.id.includes( 'rppa:kos/' ); }), 'id' );
        contributors = _l.keyBy( _l.filter( r.graph, function(o) { return o.id.startsWith( 'rppa:user-' ); }), 'id' );
        cxtref = _l.keyBy( _l.filter( r.graph, function(o) { return o.id.startsWith( 'http' ) && !o.id.match(uuidRegex) && !o.id.endsWith( '/tool' ); }) , 'id' );

        // tool settings
        if ( !!Object.keys( annotorious ).length ) {
            Object.keys( annotorious ).forEach(key => {
                annotorious[ key ].readOnly = true; // image
            });
        }
        if ( !!Object.keys( player ).length ) {
            Object.keys( player ).forEach(key => {
                player[ key ].disableDragSelection(); // sound
                player[ key ].setProgressColor( '#666' );
            });
        }
        // initialize
        r = await getJSONLD( q, "raw" );
        initializeContexts( contexts, cxtref, r, mode );

    } else if ( mode == "edit" ) {
        
        // tool settings
        if ( !!Object.keys( annotorious ).length ) {
            Object.keys( annotorious ).forEach(key => {
                annotorious[ key ].readOnly = false; // image
            });
        }
        if ( !!Object.keys( player ).length ) {
            Object.keys( player ).forEach(key => {
                player[ key ].disableDragSelection();
                player[ key ].setProgressColor( '#358078' );
                player[ key ].un('region-update-end');
                player[ key ].on('region-update-end', function( region ) {
                    player[ key ].disableDragSelection();
                    var target = secondsToTime(region.start) + "–" + secondsToTime(region.end);
                    var id = $( "[data-id='"+region.id+"']" ).closest( 'div[data-expr]' ).attr( 'id' );
                    var work = $( "[data-id='"+region.id+"']" ).closest( 'div[data-expr]' ).data( 'id' );
                    var expr = $( "[data-id='"+region.id+"']" ).closest( 'div[data-expr]' ).data( 'expr' );
                    var digo = $( "[data-id='"+region.id+"']" ).closest( 'div[data-expr]' ).data( 'digo' );
                    var tid = $( "[data-id='"+region.id+"']" ).closest( 'div[data-expr]' ).data( 'tid' );
                    $( ".tab-pane.active [data-id='"+region.id+"']" ).popover({
                        sanitize: false,
                        content: `<a role="button" class="save" data-start="`+region.start+`" data-end="`+region.end+`" data-ids="`+region.id+`" data-id="`+id+`" data-work="`+work+`" data-expr="`+expr+`" data-digo="`+digo+`" data-sel="`+target+`" style="font-size:18px;margin-left:10px;"><i class="fas fa-save"></i></a>
                            <a role="button" class="cancel" data-id="`+id+`" style="font-size:20px;margin:0 10px;"><i class="fas fa-close"></i></a>`,
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
                player[ key ].enableDragSelection({
                    color: 'rgb(74, 186, 159,.2)',
                    resize: false,
                    drag: false
                }); // sound
            });
        }
    }
}

function contribute_step1( tid, wid ) {

        $(".globaltext-workbench .steps").html(`
            <h1>Contextualization workbench</h1>
            <p>Contextualization in RPPA is a 3-step process:</p>

            <div class="steps-horizontal">
                <div class="step-horizontal">
                    <div class="step-icon">
                        <i class="fas fa-share-nodes" style="rotate: 90deg;font-size:22px;"></i>
                    </div>
                    <div class="step-title">Step 1</div>
                    <div class="step-description">Specify the context type</div>
                </div>
                <div class="step-horizontal">
                    <div class="step-icon">
                        <i class="fas fa-layer-group"></i>
                    </div>
                    <div class="step-title">Step 2</div>
                    <div class="step-description">Select the context and anchors</div>
                </div>
                <div class="step-horizontal">
                    <div class="step-icon">
                        <i class="fas fa-right-left"></i>
                    </div>
                    <div class="step-title">Step 3</div>
                    <div class="step-description">Describe the contextualization</div>
                </div>
            </div>
            <p style="margin-top:15px;"><small><em>Please note:</em> Closing the contextualization workbench at any time via the close button top right will cancel all progress.</small></p>
            <div class="step-horizontal" style="margin-top:50px;">
                <div class="step-horizontal">
                    <div class="step-icon">
                        <i class="fas fa-share-nodes" style="rotate: 90deg;font-size:22px;"></i>
                    </div>
                    <div class="step-title">Step 1</div>
                    <div class="step-description"><h2>Specify the context type</h2></div>
                </div>
                <div class="row">
                    <div class="col-sm-4" >
                        <a class="btn" href="#contribute/2/genetic/`+tid+`" style="background-color:#2a9d8f;color:white !important;border: 1px solid white;">Intertextual</a>
                        <div style="text-align:left;margin-top:15px;">
                        <p>Intertextual (or genetic) contexts are based on a concrete dialogue between two works, e.g. 
                        <ul>
                            <li>intertextual, e.g. any type of text re-use, adaptation, parody;</li>
                            <li>intermedial, e.g. a dialogue between  literature and music or art;</li>
                            <li>interdisciplinary, e.g. a dialogue between literature and philosophy, science, religion etc.;</li>
                            <li>translational, e.g. an interlinguisitc, intercultural, or intermedial adaptation or transposition;</li>
                        <ul>
                        </div>
                    </div>
                    <div class="col-sm-4">
                        <a class="btn" href="#contribute/2/intratextual/`+tid+`" class="btn" style="background-color:#2a9d8f;color:white !important;text-align:center;border: 1px solid white;">Intratextual</a>
                        <div style="text-align:left;margin-top:15px;">
                        <p>Intratextual contexts are based on text-internal relational properties, e.g. 
                        <ul>
                            <li>intratextual, e.g. between passages, scenes, images, lexicon, structure, or semantic field;</li>
                            <li>infratextual, e.g. between passages and the text as a whole;</li>
                            <li>paratextual (particularly, peritextual), e.g. a motto or epigraph;</li>
                        <ul> 
                        </div>   
                    </div>
                    <div class="col-sm-4">
                        <a class="btn" href="#contribute/2/typological/`+tid+`" class="btn" style="background-color:#2a9d8f;color:white !important;text-align:center;border: 1px solid white;">Typological</a>
                        <div style="text-align:left;margin-top:15px;">
                        <p>Typological contexts are based on historical, poetological, literary, periodic properties, e.g. 
                        <ul>
                            <li>poetic form;</li>
                            <li>syntactic, semantic, and pragmatic properties;</li>
                            <li>genre properties and signals;</li>
                            <li>characters, plots, topics, motifs;</li>
                            <li>cultural or historical references, e.g. to nationalities, literatures, events;</li>
                        <ul> 
                        </div>   
                    </div>
                </div>
            </div>
        `);
        // clear all buildingblocks and markers in texts, players, and viewers
        // wavesurfer
        if ( !!Object.keys( player ).length ) {
            Object.keys( player ).forEach(key => {
                player[ key ].clearRegions();
            })
        }
        // annotorious
        if ( !!Object.keys( annotorious ).length ) {
            Object.keys( annotorious ).forEach(key => {
                annotorious[ key ].clearAnnotations();
                annos[ key ] = {}; 
            });
        }
        // full-text highlighting
        const classesToRemove = ['highlight-bb-start', 'highlight-bb-end'];
        $(".globaltext *").removeClass(classesToRemove.join(' '));
        // clear building block lists
        bbs_text = $( "<ul class='bbs_text connectedBB'></ul>" );
        bbs_context = $( "<ul class='bbs_context connectedBB'></ul>" );
}

function genetic_step2( text, work ) {

    $(".globaltext-workbench .steps").html( `        
        <div class="row">
            <div class="col-sm-6 workbench" style="max-width: calc(100vw / 3 - 20px);overflow: scroll;height: calc(100vh - 95px);">
                <div class="step-horizontal">
                    <div class="step-icon">
                        <i class="fas fa-layer-group"></i>
                    </div>
                    <div class="step-title">Step 2</div>
                    <div class="step-description"><h2>Select the context and anchors</h2></div>
                </div>
                <p>Choose a context from the right and select the anchors, in both the text and context, for the contextualization.<p>
                <h2>Current selections</h2>
                <div class="row">
                    <div class="col-sm-6">
                        <h3>Text anchors&nbsp; <input type="checkbox" class="checkbox selectAllTexts" value=""></h3>
                        <div class="bb_text" style="overflow:auto;"></div>
                    </div>
                    <div class="col-sm-6">
                        <h3>Context anchors&nbsp; <input type="checkbox" class="checkbox selectAllContexts" value=""></h3>
                        <div class="bb_context" style="overflow:auto;"></div>
                    </div>
                </div>
                <div class="row">
                    <div class="col-sm-12">
                    <h3>Help</h3>
                    <p class="small">Choose anchors by selecting a segment, passage or area of any of the included expressions. 
                    In the popup dialog, choose <i class="fas fa-save"></i> to save the selection or <i class="fas fa-close"></i> to dismiss it.</p>

                    <p class="small">The chosen anchors will be displayed in the lists of anchors for either the text or context.  
                    They can be verified for accuracy by hovering over them.  They can also be discarded by putting them in the <i class="fas fa-trash-alt"></i>.</p> 

                    <p class="small">Please select the approprite anchors for the particular contextualization effort by <i class="fas fa-check"></i> them before moving on to the final step of the contextualization process.</i></p>
                    </div>
                </div>
                <div class="row">
                    <div class="col-sm-12">
                        <div class="step-horizontal">
                            <div class="step-icon">
                                <i class="fas fa-right-left"></i>
                            </div>
                            <div class="step-title">Step 3</div>
                            <div class="step-description"><h3>Describe the contextualization</h3></div>
                        </div>
                        <p>Once you have chosen and <i class="fas fa-check"></i> the appropriate anchors for your context, above, please proceed to the final step:
                        <p class="center"><a href="#contribute/3/genetic/2/`+text+`" class="btn" onclick="return check_contextualization_ready( '`+text+`' )" style="cursor:pointer; background-color:#2a9d8f;color:white !important;border: 1px solid white;">Contextualization</a></p>
                    </div>
                </div>
                <!--<ul class="bb"></ul>-->
            </div>
            <div class="col-sm-6 globalcontext" style="max-width: calc(100vw / 3 - 20px);overflow: scroll;height: calc(100vh - 95px);">
                <table id="worksSearchDT" class="table table-striped">
                    <thead style="visibility:collapse;">
                    <tr>
                        <th rowspan="2" style="vertical-align:top;">Work ID</th>
                        <th rowspan="2" style="vertical-align:top;">Text ID</th>
                        <th rowspan="2" style="vertical-align:top;">Work Title</th>
                        <th rowspan="2" style="vertical-align:top;">Language</th>
                        <th colspan="2" style="min-width:175px;">Dates</th>
                        <th rowspan="2" style="vertical-align:top;">Extent</th>
                        <th rowspan="2" style="vertical-align:top;min-width:225px;">First Line</th>
                        <th colspan="3">Author</th>
                    </tr>
                    <tr>
                        <th colspan="1">Comp.</th>
                        <th colspan="1">Publ.</th>
                        <th colspan="1" style="display:none !important;">Author Name</th>
                        <th colspan="1" style="min-width:110px;">Author Country</th>
                        <th colspan="1">Author Continent</th>
                    </tr>
                    </thead>
                </table>
            </div>
        </div>` );
    bbs_text = $( "<ul class='bbs_text connectedBB'></ul>" );
    bbs_context = $( "<ul class='bbs_context connectedBB'></ul>" );
    $( ".workbench .bb_text" ).append( bbs_text );
    $( ".workbench .bb_context" ).append( bbs_context );
    $(".globaltext-workbench .steps").append(`
    <script>
    $( function() {
        $( ".bbs_text, .bbs_context" ).sortable();
    } );
    </script>
    `);
    initDataWorksSearch( text, work );
}

function check_contexts_ready( components ) {
    for (var i = 0; i < components.length; i++) {
        if (components[i].tanchors && components[i].canchors) {
            if (components[i].tanchors.length == 0 || components[i].canchors.length == 0) {
                return false;
            }
        } else {
            if (components[i].tanchors.length == 0) {
                return false;
            }
        }
    }
    return true;
}

function check_contextualization_ready( text ) {
    selected_bbs_text = [], selected_bbs_context = [];
    $('.workbench .bbs_text input:checked').each(function() {
        selected_bbs_text.push($(this).parent());
    });
    $('.workbench .bbs_context input:checked').each(function() {
        selected_bbs_context.push($(this).parent());
    });
    // if genetic
    if ( /\/2\/genetic\/2\//.test(window.location.href) ) {
        var text2 = window.location.href.substring(window.location.href.lastIndexOf('/') + 1).split( "-" )[1];
        if ( $('.workbench .bbs_context input:checked').length ) {
            if ( selected_bbs_text.length > 0 && selected_bbs_context.length > 0 ) {
                return true;
            } else {
                message = `<b>Incomplete selection!</b> Please ensure the text/context anchors have been selected. Or call for <a class="alert-link" href="mailto:huber@romanticperiodpoetry.org">help!</a>`;
                show_alert_mod( message, "danger", true, 7500 );
            }
        } else {
            message = `<b>Incomplete selection!</b> Please ensure the text/context anchors have been selected. Or call for <a class="alert-link" href="mailto:huber@romanticperiodpoetry.org">help!</a>`;
            show_alert_mod( message, "danger", true, 7500 );
        }
    } else if ( /\/2\/intratextual\//.test(window.location.href) ) {
    // else if intratextual
        if ( $('.workbench .bbs_context input:checked').length ) {
            if ( selected_bbs_text.length > 0 && selected_bbs_context.length > 0 ) {
                return true;
            } else {
                message = `<b>Incomplete selection!</b> Please ensure the text/context anchors have been selected. Or call for <a class="alert-link" href="mailto:huber@romanticperiodpoetry.org">help!</a>`;
                show_alert_mod( message, "danger", true, 7500 );
            }
        } else {
            message = `<b>Incomplete selection!</b> Please ensure the text/context anchors have been selected. Or call for <a class="alert-link" href="mailto:huber@romanticperiodpoetry.org">help!</a>`;
            show_alert_mod( message, "danger", true, 7500 );
        }
    } else if ( /\/2\/typological\//.test(window.location.href) ){
    // else if typological
        if ( $('.workbench .bbs_text input:checked').length ) {
            if ( selected_bbs_text.length > 0 ) {
                return true
            } else {
                message = `<b>Incomplete selection!</b> Please ensure the text/context anchors have been selected. Or call for <a class="alert-link" href="mailto:huber@romanticperiodpoetry.org">help!</a>`;
                show_alert_mod( message, "danger", true, 7500 );
            }
        } else {
            message = `<b>Incomplete selection!</b> Please ensure the text/context anchors have been selected. Or call for <a class="alert-link" href="mailto:huber@romanticperiodpoetry.org">help!</a>`;
            show_alert_mod( message, "danger", true, 7500 );
        }
    } else {
        message = `<b>Incomplete selection!</b> Please ensure the text/context anchors have been selected. Or call for <a class="alert-link" href="mailto:huber@romanticperiodpoetry.org">help!</a>`;
        show_alert_mod( message, "danger", true, 7500 );
    }
    return false;
}

$( document ).on('click', '.selectAllTexts', function() {
    if ( $( ".selectAllTexts" ).is( ":checked" )  ) {
        $('.bbs_text input:checkbox').prop( "checked", true );
    } else {
        $('.bbs_text input:checkbox').prop( "checked", false );
    }
});
$( document ).on('click', '.selectAllContexts', function() {
    if ( $( ".selectAllContexts" ).is( ":checked" )  ) {
        $('.bbs_context input:checkbox').prop( "checked", true );
    } else {
        $('.bbs_context input:checkbox').prop( "checked", false );
    }
});

$( document ).on('click', '.genetic_context', function(e) {
    //e.preventDefault();
    $( this ).closest( ".col-sm-6" ).addClass( "globalcontext" );
    $( this ).closest( "#worksSearchDT_wrapper" ).remove();

});

function intratextual_step2( text, work ) {

    $(".globaltext-workbench .steps").html( `
        <div class="row">
            <div class="col-sm-6 workbench" style="max-width: calc(100vw / 3 - 20px);overflow:hidden;">
                <div class="step-horizontal">
                    <div class="step-icon">
                        <i class="fas fa-layer-group"></i>
                    </div>
                    <div class="step-title">Step 2</div>
                    <div class="step-description"><h2>Select the context and anchors</h2></div>
                </div>
                <p>Choose the text and context anchors for the context.<p>
                <h2>Current selections</h2>
                <div class="row">
                    <div class="col-sm-6">
                        <h3>Text anchors &nbsp; <input type="checkbox" class="checkbox selectAllTexts" value=""></h3>
                        <div class="bb_text" style="overflow:auto;"></div>
                    </div>
                    <div class="col-sm-6">
                        <h3>Context anchors &nbsp; <input type="checkbox" class="checkbox selectAllContexts" value=""></h3>
                        <div class="bb_context" style="overflow:auto;"></div>
                    </div>
                </div>
                <div class="row">
                    <div class="col-sm-12">
                    <h3>Help</h3>
                    <p class="small">Choose anchors by selecting a segment, passage or area of any of the included expressions. 
                    In the popup dialog, choose <i class="fas fa-save"></i> to save the selection or <i class="fas fa-close"></i> to dismiss it.</p>

                    <p class="small">The chosen anchors will be initially displayed in the text's list of anchors.  They can be dragged to the context side for intra- or infra-textual contexts.  
                    They can be verified for accuracy by hovering over them.  They can also be discarded by putting them in the <i class="fas fa-trash-alt"></i>.</p> 

                    <p class="small">Please select the approprite anchors for the particular contextualization effort by <i class="fas fa-check"></i> them before moving on to the final step of the contextualization process.</i></p>
                    </div>
                </div>
            </div>
            <div class="col-sm-6" style="max-width: calc(100vw / 3 - 20px);overflow:hidden;">
                <div class="row">
                    <div class="col-sm-12">
                    <div class="step-horizontal">
                        <div class="step-icon">
                            <i class="fas fa-right-left"></i>
                        </div>
                        <div class="step-title">Step 3</div>
                        <div class="step-description"><h3>Describe the contextualization</h3></div>
                    </div>
                    <p>Once you have chosen and <i class="fas fa-check"></i> the appropriate anchors for your context, on the left, please proceed to the final step:
                    <p class="center"><a href="#contribute/3/intratextual/`+text+`" class="btn" onclick="return check_contextualization_ready( '`+text+`' )" style="cursor:pointer; background-color:#2a9d8f;color:white !important;border: 1px solid white;">Contextualization</a></p>
                    </div>
                </div>
            </div>
        </div>
    ` );
    $( ".workbench .bb_text" ).append( bbs_text );
    $( ".workbench .bb_context" ).append( bbs_context );
    $(".globaltext-workbench .steps").append(`
    <script>
    $( function() {
        $( ".bbs_text, .bbs_context" ).sortable({
            connectWith: ".connectedBB"
        }).disableSelection();
    } );
    </script>
    `);
}

function typological_step2( text, work ) {

    $(".globaltext-workbench .steps").html( `
        <div class="row">
            <div class="col-sm-6 workbench" style="max-width: calc(100vw / 3 - 20px);overflow:hidden;">
                <div class="step-horizontal">
                    <div class="step-icon">
                        <i class="fas fa-layer-group"></i>
                    </div>
                    <div class="step-title">Step 2</div>
                    <div class="step-description"><h2>Select the context and anchors</h2></div>
                </div>
                <p>Choose the text anchors for the context.<p>
                <h2>Current selections</h2>
                <div class="row">
                    <div class="col-sm-6">
                        <h3>Text anchors &nbsp; <input type="checkbox" class="checkbox selectAllTexts" value=""></h3>
                        <div class="bb_text" style="overflow:auto;"></div>
                    </div>
                </div>
                <div class="row">
                    <div class="col-sm-12">
                    <h3>Help</h3>
                    <p class="small">Choose anchors by selecting a segment, passage or area of any of the included expressions. 
                    In the popup dialog, choose <i class="fas fa-save"></i> to save the selection or <i class="fas fa-close"></i> to dismiss it.</p>

                    <p class="small">The chosen anchors will be displayed in the text's list of anchors. 
                    They can be verified for accuracy by hovering over them.  They can also be discarded by putting them in the <i class="fas fa-trash-alt"></i>.</p> 

                    <p class="small">Please select the approprite anchors for the particular contextualization effort by <i class="fas fa-check"></i> them before moving on to the final step of the contextualization process.</i></p>
                    </div>
                </div>
            </div>
            <div class="col-sm-6" style="max-width: calc(100vw / 3 - 20px);overflow:hidden;">
                <div class="row">
                    <div class="col-sm-12">
                    <div class="step-horizontal">
                        <div class="step-icon">
                            <i class="fas fa-right-left"></i>
                        </div>
                        <div class="step-title">Step 3</div>
                        <div class="step-description"><h3>Describe the contextualization</h3></div>
                    </div>
                    <p>Once you have chosen and <i class="fas fa-check"></i> the appropriate anchors for your context, on the left, please proceed to the final step:
                    <p class="center"><a href="#contribute/3/typological/`+text+`" class="btn" onclick="return check_contextualization_ready( '`+text+`' )" style="cursor:pointer; background-color:#2a9d8f;color:white !important;border: 1px solid white;">Contextualization</a></p>
                    </div>
                </div>
            </div>
        </div>
    ` );
    $( ".workbench .bb_text" ).append( bbs_text );
    $( ".workbench .bb_context" ).append( bbs_context );
    $(".globaltext-workbench .steps").append(`
    <script>
    $( function() {
        $( ".bbs_text, .bbs_context" ).sortable({
            connectWith: ".connectedBB"
        }).disableSelection();
    } );
    </script>
    `);
}

async function contribute_step3( tid, wid ) {

    // JSON form
    var jf = new Object();
    var tanchors = {},tmap = {}, canchors = {},cmap = {}, t2, w2id = '', interprefix = '';
    jf.schema = {};
    jf.form = [];

    jf.schema.components = { type:"array",minItems:1,items:{ type:"object",properties:{ ctype:{ type:"string",enum:['','semantic','formal','poetic/rhetorical','referential'],description:"Specify the type of context component — required", required:true }, cname: { type:"string",title:"Name",description:"Select the appropriate entry from a controlled list (this may take a second to load)— required", required:true }, creftype:{ type:"string", enum:[ "crm:E21_Person",
                                    "crm:E53_Place",
                                    "crm:E52_Time-Span",
                                    "lrmoo:F1_Work,lrmoo:F2_Expression",
                                    "crm:E33_Linguistic_Object",
                                    "skos:Concept",
                                    "crm:E56_Language",
                                    "" ] }, cdesc:{ title:"Description",key:"description",type:"textarea",description:"Give this actualization a concise description — optional" } } } };
    // convert targets into a hash
    $.each(selected_bbs_text, function(i,e) {
        tanchors[ $( e[0] ).find( "input" ).attr( "id" ) ] = $( e[0] )[0].dataset;
        tanchors[ $( e[0] ).find( "input" ).attr( "id" ) ].label = $( e[0] )[0].innerText.trim();
        tmap[ $( e[0] ).find( "input" ).attr( "id" ) ] = $( e[0] )[0].innerText;
    });
    $.each(selected_bbs_context, function(i,e) {
        canchors[ $( e[0] ).find( "input" ).attr( "id" ) ] = $( e[0] )[0].dataset;
        canchors[ $( e[0] ).find( "input" ).attr( "id" ) ].label = $( e[0] )[0].innerText.trim();
        cmap[ $( e[0] ).find( "input" ).attr( "id" ) ] = $( e[0] )[0].innerText;
    });
    // target schema
    jf.schema.components.items.properties.tanchors = {
      type: "array",
      required: true,
      items: {
        type: "string",
        enum: Object.keys(tanchors)
      }
    };
    if ( /\/3\/genetic\/2\//.test(window.location.href) || /\/3\/intratextual\//.test(window.location.href)) {
        jf.schema.components.items.properties.canchors = {
            type: "array",
            required: true,
            items: {
                type: "string",
                enum: Object.keys(canchors)
            }
        };
    }
    // create JSON schema
    jf.schema.name = { title:"Title",key:"name",type:"string",required:true,description:"Give your contextualization a meaningful title — required" };
    jf.schema.description = { title:"Summary",key:"description",type:"textarea",description:"Provide a concise overall summary of your contextualization — optional" };
    jf.schema.citation = { title:"Source citation",key:"citation",type:"string",description:"Cite a source for this contextualization — optional" };
    jf.schema.label = { title:"Alternative label",key:"label",type:"string" };
    jf.schema.comment = { title:"Comment",key:"comment",type:"textarea" };
    jf.schema.seeAlso = { title:"See also",key:"seeAlso",type:"string" };
    jf.schema.isDefinedBy = { title:"Is defined by",key:"isDefinedBy",type:"string" };

    jf.form.push( { items:[ "name", { type:"fieldset", title:"Additional information — optional", expandable:true, items:["description","citation"] } ], legend:"Context", title:"Context – this information will create a contextualization", type:"fieldset" } );
    if ( /\/3\/genetic\/2\//.test(window.location.href) || /\/3\/intratextual\//.test(window.location.href) ) {
        jf.schema.itype = { type:"string",title:"Type of inter-/intra-textual relation",description:"Specify the type of context component from the list — required", required:true }
        jf.form.push( { items:[ "itype" ], legend:"Context", title:"Context type – this information will specify the type of interrelation", type:"fieldset" } );
    }
    // if genetic
    if ( /\/3\/genetic\/2\//.test(window.location.href) ) {
        [ tid,t2 ] = tid.split( "-" );
        wid = texts[ tid ][ "work" ];
        w2id = texts[ t2 ][ "work" ];
        interprefix = "inter";
    } else {
        wid = texts[ tid ][ "work" ];
        interprefix = "intra";
    }
    jf.form.push( { "items": [ { type: "array", title: "Components", items: {
        type: "fieldset", title: "Component {{idx}}", items: [
            { 
                key: "components[].ctype",
                title: "Type",
                titleMap: {
                    "": "Please choose a context type",
                    "semantic": "semantic",
                    "formal": "formal",
                    "poetic/rhetorical": "poetic/rhetorical",
                    "referential": "referential"
                },
                type: "selectfieldset",
                onChange: async function(e) { 
                    var ctype = '';
                    if ( e.target.value != '' && (
                        e.target.value == "semantic" ||
                        e.target.value == "formal" ||
                        e.target.value == "poetic/rhetorical"
                    ) ) {
                        if ( e.target.value == "semantic" ) {
                            ctype = "intro:INT9_SemanticFeature"
                        } else if ( e.target.value == "formal" ) {
                            ctype= "intro:INT10_FormalFeature"
                        } else if ( e.target.value == "poetic/rhetorical" ) {
                            ctype= "intro:INT8_RhetoricalFeature"
                        } 
                        var list_id = "datalist-"+uuidv4();
                        $( $( e.currentTarget ).closest( 'fieldset' ).find( 'input[type="text"]') ).attr( "list", list_id );
                        var entities_list = '';
                        var q = namespaces+`SELECT DISTINCT ?s ?p ?o WHERE { 
  				            {
                                ?s rdf:type <http://www.w3.org/2004/02/skos/core#Concept> . 
                                ?s <http://www.w3.org/2004/02/skos/core#inScheme> ?g . 
                                ?g <http://purl.org/dc/elements/1.1/type> `+ctype+` .
                                ?s ?p ?o.
				            } UNION {
                                ?s rdf:type <http://www.w3.org/2004/02/skos/core#ConceptScheme> . 
                                ?s <http://purl.org/dc/elements/1.1/type> `+ctype+` .
                                ?s ?p ?o.
                            }
                            FILTER ( (lang(?o) = "en" ) || langmatches(lang(?o),"") )
                        }`;
                        var r = await getJSONLD( q );
                        if (!r.hasOwnProperty( "graph" )) {
                            r.graph = [];
                        }
                        entities_list = `<select>`;
                        /*
                        var schemes = _l.groupBy( r.graph, 'type' );
                        var cbyscheme = _l.groupBy( r.graph, 'skos:inScheme.id' );
                        var nbyscheme = _l.keyBy( r.graph, 'id' );
                        $.each( schemes["skos:ConceptScheme"], function( i,v) {
                            entities_list += `<optgroup label="`+v["dc:source"]+`">`;
                            $.each( cbyscheme[ v.id ].sort(), function(i2,v2) {
                                entities_list += `<option data-value="`+v2.id+`" value="`+(Array.isArray(v2["skos:prefLabel"])?v2["skos:prefLabel"].join("; "):v2["skos:prefLabel"])+(v2["skos:altLabel"]?" ["+(Array.isArray(v2["skos:altLabel"])?v2["skos:altLabel"].join("; "):v2["skos:altLabel"])+"]":``)+
                                //(v2.hasOwnProperty( "skos:broader" ) && v2["skos:broader" ].id in nbyscheme?` (`+nbyscheme[ v2["skos:broader" ].id ]["skos:prefLabel"]+`)`:``)+
                                `">`+(v2.hasOwnProperty( "dcterms:bibliographicCitation" )?v2[ "dcterms:bibliographicCitation" ]:v[ "dcterms:bibliographicCitation" ])+`</option>`;
                            });
                            entities_list += `</optgroup>`;
                        });
                        */
                        var cbyname = _l.sortBy( r.graph, 'skos:prefLabel' )
                        $.each( cbyname, function(i,v) {
                            entities_list += `<option data-value="`+v.id+`" value="`+(Array.isArray(v["skos:prefLabel"])?v["skos:prefLabel"].join("; "):v["skos:prefLabel"])+(v["skos:altLabel"]?" ["+(Array.isArray(v["skos:altLabel"])?v["skos:altLabel"].join("; "):v["skos:altLabel"])+"]":``)+
                            `">`+(v.hasOwnProperty( "dcterms:bibliographicCitation" )?v[ "dcterms:bibliographicCitation" ]:v.id)+`</option>`;
                        });
                        entities_list += `</select>`;
                        $( "#jForm" ).append( `<datalist id="`+list_id+`"/>` );
                        $( '#jForm datalist#'+jqu( list_id ) ).html( entities_list );
                    }
                }, items: [
                    {},
                    {
                        title: "Name",
                        key: "components[].cname",
                        onClick: function(e) { 
                        }
                    },
                    {
                        title: "Name",
                        key: "components[].cname",
                        onClick: function(e) { 
                        }
                    },
                    {
                        title: "Name",
                        key: "components[].cname",
                        onClick: function(e) { 
                        }
                    },
                    {
                        type: "fieldset",
                        items: [
                            {
                                key: "components[].creftype",
                                title: "Entity type",
                                titleMap: {
                                    "crm:E21_Person":"persons",
                                    "crm:E53_Place":"places",
                                    "crm:E52_Time-Span":"time-spans",
                                    "lrmoo:F1_Work,lrmoo:F2_Expression":"work titles",
                                    "crm:E33_Linguistic_Object":"work full-text",
                                    "skos:Concept":"concepts",
                                    "crm:E56_Language":"languages",
                                    "":"everything"
                                }
                            }
                            ,
                            {
                            key: "components[].cname",
                            },
                            {
                            "type": "button",
                            "title": "Find",
                            "onClick": async function (evt) {
                                evt.preventDefault();
                                if ($(evt.target).prev().find( "input" ).val() != '' ) {
                                    var kclass = $(evt.target).prev().prev().find( ":selected" ).val();
                                    $(evt.target).after( `<div class="spinner-border text-info" role="status" style="margin-left:20px;"><span class="sr-only">Loading...</span></div>` );
                                    q = namespaces+`SELECT DISTINCT * 
                                        WHERE { 
                                            `+(( kclass != '' )?`?s a ?c .`:``)+`
                                            ?s ?p ?o .
                                            `+(( kclass != '' )?`FILTER ( ?c IN (`+kclass+`) ) .`:``)+`
                                            FILTER ( ?p IN (crm:P1_is_identified_by,skos:prefLabel,skos:altLabel,skos:hiddenLabel,rdfs:label,crm:P190_has_symbolic_content) ) .
                                            FILTER ( regex(?o, "`+$(evt.target).prev().find( "input" ).val()+`", "i" ) ) .
                                        }
                                    `;
                                    var r = await getJSONLD( q );
                                    if ( !r.graph ) { r.graph = []; r.graph.push( r ); }
                                    var list_id = "datalist-"+uuidv4();
                                    var entities_list = ``;//`<select>`;
                                    $( ".spinner-border").remove();
                                    $.each( r.graph, function(i,v) {
                                        label = ''
                                        if (v["crm:P1_is_identified_by"] !== undefined) {
                                            label = v["crm:P1_is_identified_by"]; 
                                        } else if ( v["skos:prefLabel"] !== undefined ) {
                                            label = v["skos:prefLabel"];
                                        } else if ( v["rdfs:label"] !== undefined ) {
                                            label = v["rdfs:label"];
                                        } else if ( v["skos:altLabel"] !== undefined ) {
                                            label = v["skos:altLabel"];
                                        } else if ( v["skos:hiddenLabel"] !== undefined ) {
                                            label = v["skos:hiddenLabel"];
                                        } else if ( v["crm:P190_has_symbolic_content"] !== undefined ) {
                                            label = v["crm:P190_has_symbolic_content"];
                                        }
                                        if ( label == '' ) return;
                                        entities_list += `<option value="`+label+`" data-value="`+v.id+`">`+
                                        v.id+`</option>`; 
                                    });
                                    //		entities_list += `</select>`;
                                    if ( entities_list != '' ) {
                                        $(evt.target).prev().find( "input" ).attr( "list", list_id );
                                        $(evt.target).prev().find( "input" ).append( `<datalist id="`+list_id+`"/>` );
                                        $(evt.target).prev().find( "datalist#"+jqu( list_id ) ).html( entities_list );
                                    } else {
                                        $(evt.target).prev().find( "input" ).attr( "list", "none" );
                                    }
                                }
                            }
                        }
                        ],
                        onChange: function(e) {
                        },
                        onClick: function(e) { 
                        }
                    }
                ]
            },
            {
                title: "Description",
                key: "components[].cdesc"
            },
            {
                key: "components[].tanchors",
                title: "Text anchors",
                description: "Select the appropriate text anchors — required",
                type: "checkboxes",
                titleMap: tmap
            }, ( /\/3\/genetic\/2\//.test(window.location.href) || /\/3\/intratextual\//.test(window.location.href) )?
            {
                key: "components[].canchors",
                title: "Context anchors",
                description: "Select the appropriate context anchors — required",
                type: "checkboxes",
                titleMap: cmap
            }:''
        ]
        }} ], 
        legend:"Components", title:"Context components – this information will create one or more context components", type:"fieldset"
    });
    jf.form.push( { "type": "fieldset", "title": "Additional information &#x2014 optional", "expandable": true, "items": [ "label","comment","seeAlso","isDefinedBy" ]} );
    jf.form.push( { type:"actions",items: [{type: "submit",title: "Add context"},{type: "button",title: "Cancel",onSubmit: function(e) { 
            e.preventDefault();
            e.stopPropagation();
            //$('#jForm')[0].reset(); 
        } 
    }]} );

    jf.onSubmit = async function (errors, values) {
        if (errors || !check_contexts_ready( values.components )) {
            if ( errors ) {
                console.log( errors );
                message = `<b>Oh snap!</b> Something went wrong, try again? Or call for <a class="alert-link" href="mailto:help@romanticperiodpoetry.org">help!</a>`;
                show_alert_mod( message, "danger", true, 7500 );
            } else {
                message = `<b>Incomplete submission!</b> Please ensure the text/context anchors have been selected. Or call for <a class="alert-link" href="mailto:help@romanticperiodpoetry.org">help!</a>`;
                show_alert_mod( message, "danger", true, 7500 );
            }
            return; // stop form submission
        } else {
            // construct RDF representation
            var tripleid = uuidv4(), tused = [], cused = [], itype;
            // Contextualization
            var triples = namespaces+"insert data {\n";
            triples += `<`+domain+`/id/`+tripleid+`/context> a rppa:Context, intro:INT_Interpretation ;\n`;
            triples += `skos:prefLabel """`+values.name+` """ ;\n`;
            triples += `skos:altLabel """a RPPA context""" ;\n`;
            triples += `crm:P1_is_identified_by """`+values.name+` """ ;\n`;
            if ( values.description ) {
                triples += `crm:P3_has_note """`+values.description+` """ ;\n`;
            }
            const date = new Date();
            triples += `dcterms:license <http://creativecommons.org/licenses/by-nc/4.0/> ;\n`;
            triples += `dcterms:version "1" ;\n`;
            triples += `dcterms:issued "`+date.toISOString()+`" ;\n`;
            triples += `dcterms:creator `+user+` ;\n`;
            triples += `as:generator <`+domain+`/> ;\n`;
            triples += `dcterms:created "`+date.toISOString()+`" ;\n`;
            if ( values.citation ) {
                triples += `dcterms:source """`+values.citation+` """ ;\n`;
            }

            triples += `intro:R20_discusses <`+Object.keys( _l.keyBy( tanchors, 'wid' ) )[0]+`> ;\n`;
            $.each( values.components, function( i, v) {
                $.each( v.tanchors, function( i2, v2) {
                    tused.push( tanchors[ v2 ] );
                });
            });
            $.each( values.components, function( i, v) {
                $.each( v.canchors, function( i2, v2) {
                    cused.push( canchors[ v2 ] );
                });
            });
            $.each( Object.keys( _l.keyBy( tused, 'expr' ) ), function(i,v) {
                triples += `intro:R20_discusses <`+v+`> ;\n`;
            });
            if (values.itype) {
                itype = $( "datalist#itype option" ).filter(function() { return this.value == values.itype; }).data('value');
                if ( !itype ) {
                    message = `<b>Incorrect submission!</b> Please ensure only values from controlled lists are used. Or call for <a class="alert-link" href="mailto:huber@romanticperiodpoetry.org">help!</a>`;
                    show_alert_mod( message, "danger", true, 7500 );
                    return; // stop form submission
                }
                triples += `intro:R21_identifies <`+domain+`/id/`+tripleid+`/`+interprefix+`textuality> ;\n`;
                triples += `rdfs:isDefinedBy <`+itype+`> ;\n`;
            }
            if ( w2id != '' ) {
                var wwrks = _l.keyBy( works, 'id' ), temporal = '', spatial = '';
                if ( wwrks[ w2id ].publ.split("|")[0] != '?' ) {
                    temporal = wwrks[ w2id ].publ.split("|")[0].slice(0,4);
                } else if (wwrks[ w2id ].comp.split("|")[0] != '?') {
                    temporal = wwrks[ w2id ].comp.split("|")[0].slice(0,4);
                }
                if ( temporal != '' ) {
                    triples += `dcterms:temporal "`+temporal+`"^^xsd:gYear ;\n`;
                }
                var regex = /.*?\/id\/(.*?)\/person$/;
                var persid = workbench[ w2id ]['https://www.romanticperiodpoetry.org/id/'+w2id+'/work']['dcterms:creator'].id.match( regex )[1];
                if ( persons[ persid ].nat != '' ) {
                    triples += `dcterms:spatial <https://www.romanticperiodpoetry.org/id/`+persons[ persid ].nat.slice(0,2)+`/country> ;\n`
                }    
            }
            triples += `.\n`;

            // 1. Initialize targets: from current component tanchors/canchors
            // Interrelation (inter- and intra-textual only)
            if (values.itype) {
                triples += `<`+domain+`/id/`+tripleid+`/`+interprefix+`textuality> a intro:INT3_Interrelation, pdp:Intertextuality, oa:Annotation ;\n`;
                triples += `skos:altLabel """a RPPA contextual relationship""" ;\n`;
                triples += `skos:prefLabel """`+values.name+` """ ;\n`;
                triples += `intro:R19_hasType <`+domain+`/id/`+tripleid+`/typeOfIntertextuality> ;\n`;
                triples += `pdp:typeOfIntertextuality <`+domain+`/id/`+tripleid+`/typeOfIntertextuality> ;\n`;
                triples += `intro:R21i_isIdentifiedBy <`+domain+`/id/`+tripleid+`/context> ;\n`;
                triples += `.\n`;

                triples += `<`+domain+`/id/`+tripleid+`/typeOfIntertextuality> a intro:INT11_TypeOfInterrelation ;\n`;
                triples += `skos:prefLabel """`+values.itype+` """ ;\n`;
                triples += `intro:R4i_isDefinedIn <`+itype+`> ;\n`;
                triples += `intro:R19i_isTypeOf <`+domain+`/id/`+tripleid+`/`+interprefix+`textuality> ;\n`
                triples += `rdfs:isDefinedBy <`+itype+`> ;\n`;
                triples += `.\n`;
            }
            var toffset = 0, coffset = 0, breakOut = false;
            $.each( values.components, function(i,v) {
                // 1. do internal loop to generate locations
                //    TODO: repeated use of same location produces new locations
                //    — is this wanted?  con: leads to duplication (scale not
                //    known), pro: keeps components self-contained, possibility
                //    to adjust individual targets independently of others
                $.each( v.tanchors, function(i2,v2) {
                    var regex = /.*?\/id\/(.*?)\/work$/;
                    var wid = tanchors[v2].wid.match( regex )[1];   
                    triples += `\n<`+domain+`/id/`+tripleid+`/targetLocation/`+(toffset+i2+1)+`> a intro:INT1_Passage ;\n`;
                    triples += `skos:prefLabel """`+tanchors[v2].label+` """ ;\n`
                    triples += `intro:R10i_isPassageOf <`+tanchors[v2].digo+`> ;\n`;
                    if (!values.itype) {
                        triples += `intro:R18_showsActualization <`+domain+`/id/`+tripleid+`/actualization/`+(i+1)+`> ;\n`;
                    } else {
                        triples += `intro:R24i_isRelatedEntity <`+domain+`/id/`+tripleid+`/`+interprefix+`textuality/`+(i+1)+`> ;\n`
                    }
                    triples += `intro:R41_hasLocation [
                        a `+((tanchors[v2].ids[0]=='#')?`oa:CssSelector`:`oa:FragmentSelector`)+`;
                        dcterms:conformsTo <http://www.w3.org/TR/media-frags/> ;
                        rdf:value "`+tanchors[v2].ids+`" ;\n`+
                        ((tanchors[v2].page)?`rdfs:note "`+tanchors[v2].page+`"^^xsd:integer ;\n`:``)+`
                    ] ;\n`;
                    if ( tanchors[v2].ids[0]=='#' ) {                      
                        triples += `intro:R41_hasLocation [
                            a oa:Composite ;
                            as:items (`
                            $.each( tanchors[v2].ids.split(','), function(i3,v3) {
                                triples += `<`+domain+`/id/`+wid+`/`+workbench[ wid ][ tanchors[v2].digo ]["crm:P48_has_preferred_identifier"]+v3+`>\n`
                            });
                        triples += `) ;
                            ] ;\n`
                    }
                    triples += `dcterms:format `;
                    if ( tanchors[v2].ids[0]=='#' ) {
                        triples += `lct:txt ;`
                    } else if (tanchors[v2].ids[0]=='t') {
                        triples += `lct:aud ;`
                    } else if (tanchors[v2].ids[0]=='x') {
                        triples += `lct:img ;`
                    }
                    triples += `\ndcterms:language <`+workbench[ wid ][ tanchors[v2].expr ]["crm:P72_has_language"].id+`> ;\n`;
                    triples += `.\n`;
                });

                $.each( v.canchors, function(i2,v2) {
                    var regex = /.*?\/id\/(.*?)\/work$/;
                    var wid = canchors[v2].wid.match( regex )[1];   
                    triples += `\n<`+domain+`/id/`+tripleid+`/contextLocation/`+(coffset+i2+1)+`> a intro:INT1_Passage ;\n`;
                    triples += `skos:prefLabel """`+canchors[v2].label+` """ ;\n`
                    triples += `intro:R10i_isPassageOf <`+canchors[v2].digo+`> ;\n`;
                    if (!values.itype) {
                        triples += `intro:R18_showsActualization <`+domain+`/id/`+tripleid+`/actualization/`+(i+1)+`> ;\n`;
                    } else {
                        triples += `intro:R24i_isRelatedEntity <`+domain+`/id/`+tripleid+`/`+interprefix+`textuality/`+(i+1)+`> ;\n`;
                    }
                    triples += `intro:R41_hasLocation [
                        a `+((canchors[v2].ids[0]=='#')?`oa:CssSelector`:`oa:FragmentSelector`)+`;
                        dcterms:conformsTo <http://www.w3.org/TR/media-frags/> ;
                        rdf:value "`+canchors[v2].ids+`" ;\n`+
                        ((canchors[v2].page)?`rdfs:note "`+canchors[v2].page+`"^^xsd:integer ;\n`:``)+`
                    ] ;\n`;
                    if ( canchors[v2].ids[0]=='#' ) {                      
                        triples += `intro:R41_hasLocation [
                            a oa:Composite ;
                            as:items (`
                            $.each( canchors[v2].ids.split(','), function(i3,v3) {
                                triples += `<`+domain+`/id/`+wid+`/`+workbench[ wid ][ canchors[v2].digo ]["crm:P48_has_preferred_identifier"]+v3+`>\n`
                            });
                        triples += `) ;
                            ] ;\n`
                    }
                    triples += `dcterms:format `;
                    if ( canchors[v2].ids[0]=='#' ) {
                        triples += `lct:txt ;`
                    } else if (canchors[v2].ids[0]=='t') {
                        triples += `lct:aud ;`
                    } else if (canchors[v2].ids[0]=='x') {
                        triples += `lct:img ;`
                    }
                    triples += `\ndcterms:language <`+workbench[ wid ][ canchors[v2].expr ]["crm:P72_has_language"].id+`> ;\n`;
                    triples += `.\n`;
                });

                // 2. do INT2/3 part
                // load type-specific (formal/semantic/poetic) datalist!
                if ( $( "#jForm input[id$='cname'][list]" ).length ) {
                    $( $( "#jForm input[id$='components["+i+"].cname'][list]" )[0].list ).attr("id")
                }
                var ctype = $( "datalist#"+$( $( "#jForm input[id$='components["+i+"].cname'][list]" )[0].list ).attr("id")+" option" ).filter(function() { return this.value == v.cname; }).data('value');
                if ( !ctype ) {
                    message = `<b>Incorrect submission!</b> Please ensure only values from controlled lists are used. Or call for <a class="alert-link" href="mailto:huber@romanticperiodpoetry.org">help!</a>`;
                    show_alert_mod( message, "danger", true, 7500 );
                    breakOut = true;
                    return false;
                }
                if (values.itype) {

                    triples += `\n<`+domain+`/id/`+tripleid+`/`+interprefix+`textuality/`+(i+1)+`> a intro:INT3_Interrelation, pdp:Intertextuality, oa:Annotation ;\n`;
                    triples += `skos:altLabel """a RPPA contextual relationship: `+v.cname+`""" ;\n`; 
                    triples += `skos:prefLabel """`+v.cname+` """ ;\n`;

                    triples += `intro:R21i_isIdentifiedBy <`+domain+`/id/`+tripleid+`/context> ;\n`;
                    triples += `intro:R19_hasType <`+domain+`/id/`+tripleid+`/typeOfIntertextuality/`+(i+1)+`> ;\n`;

                    $.each( v.canchors, function(i3,v3) {
                        triples += `intro:R12_hasReferredToEntity <`+domain+`/id/`+tripleid+`/contextLocation/`+(coffset+i3+1)+`> ;\n`;
                    });
                    $.each( v.tanchors, function(i3,v3) {
                        triples += `intro:R13_hasReferringEntity <`+domain+`/id/`+tripleid+`/targetLocation/`+(toffset+i3+1)+`> ;\n`;
                        triples += `pdp:isIntertextualityPresentAt <`+domain+`/id/`+tripleid+`/targetLocation/`+(toffset+i3+1)+`> ;\n`;
                    });

                    // "workbench" JS-object has rich graph-specific metadata!!
                    triples += `oa:motivatedBy oa:commenting ;\n`
                    if ( v.cdesc != '' ) {
                        triples += `oa:hasBody [
                            a oa:TextualBody;
                            rdf:value """`+v.cdesc+` """ ;
                            dcterms:format lct:txt ;
                            oa:hasPurpose oa:identifying ;`+
                        `] ;\n`
                    }
                    tused = cused = [];
                    $.each( v.tanchors, function( i, v) {
                        tused.concat( v );
                    });
                    $.each( v.canchors, function( i, v) {
                        cused.concat( v );
                    });
                    $.each( Object.keys( _l.keyBy( tused, 'expr' ) ), function(i,v) {
                        triples += `pdp:usedAsRedaction <`+v+`> ;\n`;
                    });
                    $.each( Object.keys( _l.keyBy( cused, 'expr' ) ), function(i,v) {
                        triples += `pdp:usedAsSource <`+v+`> ;\n`;
                    });
                    $.each( v.tanchors, function(i,v) {
                        triples += `oa:hasTarget <`+domain+`/id/`+tripleid+`/targetLocation/`+(toffset+i+1)+`> ;\n`;
                    });
                    triples += `.\n`;

                    triples += `<`+domain+`/id/`+tripleid+`/typeOfIntertextuality/`+(i+1)+`> a intro:INT11_TypeOfInterrelation ;\n`;
                    triples += `skos:prefLabel """`+v.cname+` """ ;\n`;
                    if ( v.ctype == 'referential' ) {
                        triples += `crm:P67_refers_to <`+ctype+`> ;\n`;                        
                    } else {
                        triples += `intro:R4i_isDefinedIn <`+context["@context"][ ctype.split(":")[0] ]+ctype.split(":")[1]+`> ;\n`;
                    }
                    triples += `intro:R19i_isTypeOf <`+domain+`/id/`+tripleid+`/`+interprefix+`textuality/`+(i+1)+`> ;\n`
                    triples += `rdfs:isDefinedBy <`+context["@context"][ ctype.split(":")[0] ]+ctype.split(":")[1]+`> ;\n`;
                    triples += `.\n`;

                    triples += `<`+domain+`/id/`+tripleid+`/context> intro:R21_identifies <`+domain+`/id/`+tripleid+`/`+interprefix+`textuality/`+(i+1)+`> .\n`;

                } else {
                
                    triples += `\n<`+domain+`/id/`+tripleid+`/actualization/`+(i+1)+`> a intro:INT2_ActualizationOfFeature, oa:Annotation ;\n`;
                    triples += `skos:altLabel """a RPPA contextual actualization: `+v.cname+`""" ;\n`;
                    triples += `skos:prefLabel """`+v.cname+` """ ;\n`;
                        
                    triples += `intro:R21i_isIdentifiedBy <`+domain+`/id/`+tripleid+`/context> ;\n`;
                    if ( v.ctype == 'referential' ) {
                        triples += `crm:P67_refers_to <`+ctype+`> ;\n`;
                    } else {
                        triples += `intro:R17_actualizesFeature <`+context["@context"][ ctype.split(":")[0] ]+ctype.split(":")[1]+`> ;\n`;
                    }
                    $.each( v.tanchors, function(i3,v3) {
                        triples += `intro:R18i_actualizationFoundOn <`+domain+`/id/`+tripleid+`/targetLocation/`+(toffset+i3+1)+`> ;\n`;
                    });
                    if ( i > 0 ) {
                        triples += `intro:R9i_hasPrecedingActualization <`+domain+`/id/`+tripleid+`/actualization/`+(i)+`> ;\n`;
                    }
                    // "workbench" JS-object has rich graph-specific metadata!!
                    triples += `oa:motivatedBy oa:commenting ;\n`
                    if ( v.cdesc != '' ) {
                        triples += `oa:hasBody [
                            a oa:TextualBody;
                            rdf:value """`+v.cdesc+` """ ;
                            dcterms:format lct:txt ;
                            oa:hasPurpose oa:identifying ;`+
                        `] ;\n`
                    }
                    $.each( v.tanchors, function(i,v) {
                        triples += `oa:hasTarget <`+domain+`/id/`+tripleid+`/targetLocation/`+(toffset+i+1)+`> ;\n`;
                    });
                    triples += `.\n`;

                    triples += `<`+domain+`/id/`+tripleid+`/context> intro:R21_identifies <`+domain+`/id/`+tripleid+`/actualization/`+(i+1)+`> .\n`;
                
                }
                toffset += v.tanchors.length;
                if ( v.hasOwnProperty( "canchors" ) ) {
                    coffset += v.canchors.length;
                }
            });
            if (breakOut) {
                // stop form submission
                breakOut = false;
                return;
            }
            // Additional
            if ( values.label ) {
                triples += `\n<`+domain+`/id/`+tripleid+`/context> rdfs:label """`+values.label+` """ ;\n.`;
            }
            if ( values.comment ) {
                triples += `\n<`+domain+`/id/`+tripleid+`/context> rdfs:comment """`+values.comment+` """ ;\n.`;
            }
            if ( values.seeAlso ) {
                triples += `\n<`+domain+`/id/`+tripleid+`/context> rdfs:seeAlso """`+values.seeAlso+` """ ;\n.`;
            }
            if ( values.isDefinedBy ) {
                triples += `\n<`+domain+`/id/`+tripleid+`/context> rdfs:isDefinedBy """`+values.isDefinedBy+` """ ;\n.`;
            }
            triples += `\n}`;

            $( myCanvasGTEl ).offcanvas( "hide" );
            await putTRIPLES( triples );
            await addEleNode( domain+`/id/`+tripleid+`/context` );
            // TODO: do highlighting of all expression targets used in this
            // contextualization; needs expression-aware switching/highlighting! 
            message = `<b>Success!</b> The contextualization has been added. <em>Thank you for your contribution!</em>`;
            show_alert_mod( message, "success", true, 5000 );
        }
    }
    // create page
    if ( /\/3\/genetic\/2\//.test(window.location.href) ) {
        $(".globaltext-workbench .steps .workbench").html(`
            <div class="step-horizontal">
                <div class="step-icon">
                    <i class="fas fa-right-left"></i>
                </div>
                <div class="step-title">Step 3</div>
                <div class="step-description"><h3>Describe the contextualization</h3></div>
            </div>
            <form name="step3" id="jForm"/>
        `);
    } else {
        $(".globaltext-workbench .steps").html(`
            <div class="step-horizontal">
                <div class="step-icon">
                    <i class="fas fa-right-left"></i>
                </div>
                <div class="step-title">Step 3</div>
                <div class="step-description"><h3>Describe the contextualization</h3></div>
            </div>
            <form name="step3" id="jForm"/>
        `);
    }
    $( "#jForm" ).jsonForm( jf );
    // populate the form
    function update_canvas() {
        $.each(selected_bbs_text, function(i,e) {
            if ( $( e[0] ).hasClass( "img" ) ) {
                $( "input[id='"+$( e[0] ).find( "input" ).attr( "id" )+"']" ).last().nextAll("canvas").replaceWith( cloneCanvas( $( e[0] ).find( "canvas" )[0] ) );
            }
        });
        $.each(selected_bbs_context, function(i,e) {
            if ( $( e[0] ).hasClass( "img" ) ) {
                $( "input[id='"+$( e[0] ).find( "input" ).attr( "id" )+"']" ).last().nextAll("canvas").replaceWith( cloneCanvas( $( e[0] ).find( "canvas" )[0] ) );
            }
        });
    }
    update_canvas();
    $('._jsonform-array-addmore,._jsonform-array-deletelast,._jsonform-array-deletecurrent').on('click', function(){ update_canvas(); });
    if ( /\/3\/genetic\/2\//.test(window.location.href) || /\/3\/intratextual\//.test(window.location.href) ) {
        $( "#jForm input[name='itype']" ).attr( "list", 'itype' );
        var q = namespaces+`SELECT * WHERE { 
            ?s ?p <http://www.w3.org/2004/02/skos/core#Concept> . 
            ?s <http://www.w3.org/2004/02/skos/core#prefLabel> ?q . 
            ?s <http://www.w3.org/2004/02/skos/core#topConceptOf> ?o . 
            ?o <http://purl.org/dc/elements/1.1/type> <https://w3id.org/lso/intro/beta202408#INT11_TypeOfInterrelation> . 
        }`;
        var graph = await getJSONLD( q, "raw" ); // DONE
        var entities_list = '';
        for (var j = 0; j < graph.length; j++ ) {
            var v = graph[ j ];
            entities_list += `<option data-value="`+v.s.value+`">`+v.q.value+`</option>`;
        }
        $( "#jForm" ).append( `<datalist id="itype"/>` );
		$( '#jForm datalist#'+jqu( "itype" ) ).html( entities_list );
    }
}
$(document.body).on('submit', '#jForm', function(e) {
	e.preventDefault();
});

function cloneCanvas(oldCanvas) {
    //create a new canvas
    var newCanvas = document.createElement('canvas');
    var context = newCanvas.getContext('2d');
    //set dimensions
    newCanvas.width = oldCanvas.width;
    newCanvas.height = oldCanvas.height;
    //apply the old canvas to the new one
    context.drawImage(oldCanvas, 0, 0);
    //return the new canvas
    return newCanvas;
}

/*  This function takes a list of a particular expression's contexts and hands
    them over to specialized functions for display:
    - processes building-blocks (in editing mode) for lct:txt/lct:img/lct:aud
    - processes contexts (in reading mode)
*/
async function initializeContexts( exprContexts, exprNodes, graph, mode ) {
    
    var tid = $( this ).closest( "[data-tid]" ).data( "tid" );
    // filter exprContexts by type and pass to handlers
    if ( mode == "edit" ) {

    } else {
        
        /* TODO: is this sensibe/necessary, or should I be using the default
                 createCYJSON function?
        */
        // highlight targets
        if ( !/\/#context\//.test( location.href) ) {        
            var target = [], target_tabs = [], target_locs = [], target_note = [], target_label = [], target_host = [];
            var cxtloc = [], cxtloc_tabs = [], cxtloc_locs = [], cxtloc_note = [], cxtloc_label = [], cxtloc_host = [];
            cxtref = _l.groupBy( exprContexts[null], 'id' );
            for (var i in exprContexts ) {
                var annotations = exprContexts[i];
                for ( var j in annotations ) {
                    annotation = annotations[j];
                    // show target globaltext
                    if ( annotation.id.match(uuidRegex) != null ) {
                        var anno_id = annotation.id.match(uuidRegex)[0];
                        var cxtcnt =_l.keyBy( exprContexts[ anno_id ], 'id' );
                        // interrelations
                        if ( annotation.hasOwnProperty( 'intro:R13_hasReferringEntity' ) && annotation.hasOwnProperty( 'intro:R12_hasReferredToEntity' ) ) {
                            if ( !Array.isArray( annotation["intro:R13_hasReferringEntity"] ) ) {
                                target.push( cxtref[ cxtcnt[ annotation["intro:R13_hasReferringEntity"].id ]["intro:R10i_isPassageOf"].id ]["crm:P48_has_preferred_identifier"] );
                                target_tabs = target_tabs.concat( _l.filter( cxtref[ cxtcnt[ annotation["intro:R13_hasReferringEntity"].id ]["intro:R10i_isPassageOf"].id ]["crm:P106_is_composed_of"], function(o) { return o.id.includes( "/delivery" ); }) );
                                target_locs = target_locs.concat( cxtcnt[ annotation["intro:R13_hasReferringEntity"].id ]["rdf:value"] );
                                target_note = target_note.concat( cxtcnt[ annotation["intro:R13_hasReferringEntity"].id ]["rdfs:note"] );
                                target_label = target_label.concat( cxtcnt[ annotation["intro:R13_hasReferringEntity"].id ]["skos:prefLabel"] );
                                target_host = target_host.concat( cxtcnt[ annotation["intro:R13_hasReferringEntity"].id ]["intro:R24i_isRelatedEntity"].id );
                            } else {
                                $.each( annotation["intro:R13_hasReferringEntity"], function( i,v ) {
                                    target.push( cxtref[ cxtcnt[ v.id ]["intro:R10i_isPassageOf"].id ]["crm:P48_has_preferred_identifier"] );
                                    target_tabs = target_tabs.concat( _l.filter( cxtref[ cxtcnt[ v.id ]["intro:R10i_isPassageOf"].id ]["crm:P106_is_composed_of"], function(o) { return o.id.includes( "/delivery" ); }) );
                                    target_locs = target_locs.concat( cxtcnt[ v.id ]["rdf:value"] );
                                    target_note = target_note.concat( cxtcnt[ v.id ]["rdfs:note"] );
                                    target_label = target_label.concat( cxtcnt[ v.id ]["skos:prefLabel"] );
                                    target_host = target_host.concat( cxtcnt[ v.id ]["intro:R24i_isRelatedEntity"].id );
                                });
                            }   
                            if ( !Array.isArray( annotation["intro:R12_hasReferredToEntity"] ) ) {
                                cxtloc.push( cxtref[ cxtcnt[ annotation["intro:R12_hasReferredToEntity"].id ]["intro:R10i_isPassageOf"].id ]["crm:P48_has_preferred_identifier"] );
                                cxtloc_tabs = cxtloc_tabs.concat( _l.filter( cxtref[ cxtcnt[ annotation["intro:R12_hasReferredToEntity"].id ]["intro:R10i_isPassageOf"].id ]["crm:P106_is_composed_of"], function(o) { return o.id.includes( "/delivery" ); }) );
                                cxtloc_locs = cxtloc_locs.concat( cxtcnt[ annotation["intro:R12_hasReferredToEntity"].id ]["rdf:value"] );
                                cxtloc_note = cxtloc_note.concat( cxtcnt[ annotation["intro:R12_hasReferredToEntity"].id ]["rdfs:note"] );
                                cxtloc_label = cxtloc_label.concat( cxtcnt[ annotation["intro:R12_hasReferredToEntity"].id ]["skos:prefLabel"] );
                                cxtloc_host = cxtloc_host.concat( cxtcnt[ annotation["intro:R12_hasReferredToEntity"].id ]["intro:R24i_isRelatedEntity"].id );
                            } else {
                                $.each( annotation["intro:R12_hasReferredToEntity"], function( i,v ) {
                                    cxtloc.push( cxtref[ cxtcnt[ v.id ]["intro:R10i_isPassageOf"].id ]["crm:P48_has_preferred_identifier"] );
                                    cxtloc_tabs = cxtloc_tabs.concat( _l.filter( cxtref[ cxtcnt[ v.id ]["intro:R10i_isPassageOf"].id ]["crm:P106_is_composed_of"], function(o) { return o.id.includes( "/delivery" ); }) );
                                    cxtloc_locs = cxtloc_locs.concat( cxtcnt[ v.id ]["rdf:value"] );
                                    cxtloc_note = cxtloc_note.concat( cxtcnt[ v.id ]["rdfs:note"] );
                                    cxtloc_label = cxtloc_label.concat( cxtcnt[ v.id ]["skos:prefLabel"] );
                                    cxtloc_host = cxtloc_host.concat( cxtcnt[ v.id ]["intro:R24i_isRelatedEntity"].id );
                                });
                            }
                        // actualizations
                        } else if ( annotation.hasOwnProperty( 'intro:R18i_actualizationFoundOn' )) {
                            var anno_id = annotation.id;
                            if ( !Array.isArray( annotation['intro:R18i_actualizationFoundOn'] ) ) {
                                target.push( cxtref[ cxtcnt[ annotation["intro:R18i_actualizationFoundOn"].id ]["intro:R10i_isPassageOf"].id ]["crm:P48_has_preferred_identifier"] );
                                target_tabs = target_tabs.concat( _l.filter( cxtref[ cxtcnt[ annotation["intro:R18i_actualizationFoundOn"].id ]["intro:R10i_isPassageOf"].id ]["crm:P106_is_composed_of"], function(o) { return o.id.includes( "/delivery" ); }) );
                                target_locs = target_locs.concat( cxtcnt[ annotation["intro:R18i_actualizationFoundOn"].id ]["rdf:value"] );
                                target_note = target_note.concat( cxtcnt[ annotation["intro:R18i_actualizationFoundOn"].id ]["rdfs:note"] );
                                target_label = target_label.concat( cxtcnt[ annotation["intro:R18i_actualizationFoundOn"].id ]["skos:prefLabel"] );
                                target_host = target_host.concat( annotation.id );
                            } else {
                                $.each( annotation["intro:R18i_actualizationFoundOn"], function( i,v ) {
                                    target.push( cxtref[ cxtcnt[ v.id ]["intro:R10i_isPassageOf"].id ]["crm:P48_has_preferred_identifier"] );
                                    target_tabs = target_tabs.concat( _l.filter( cxtref[ cxtcnt[ v.id ]["intro:R10i_isPassageOf"].id ]["crm:P106_is_composed_of"], function(o) { return o.id.includes( "/delivery" ); }) );
                                    target_locs = target_locs.concat( cxtcnt[ v.id ]["rdf:value"] );
                                    target_note = target_note.concat( cxtcnt[ v.id ]["rdfs:note"] );
                                    target_label = target_label.concat( cxtcnt[ v.id ]["skos:prefLabel"] );                                        
                                    target_host = target_host.concat( anno_id );   
                                });
                            }
                        } 
                    }
                }
            }
            $.each( target_locs, function( i,v) {
                // text
                if ( v.substring(0,1) == '#' ) {
                    if ( v.split( ',' ).length > 2) {
                        $( ".globaltext-container .globaltext "+v.split(',')[0] ).addClass( "highlight-gbl-start" );
                        $( ".globaltext-container .globaltext "+v.split(',').pop() ).addClass( "highlight-gbl-end" );
                    } else {
                        $( ".globaltext-container .globaltext "+v.split(',').join( ',.globaltext-container .globaltext ' ) ).addClass( "highlight-gbl-start highlight-gbl-end" );
                    }
                    $( v.split(',')[0] ).addClass( target_host[i] )
                    // TODO:
                    // highlighting of locations per actualization/interrelation
                    // will need switching to correct expression before popover
                    // is shown, hence need to include target_tabs values in
                    // graph nodes first somehow!
                    //var exampleEl = document.getElementById( v.split(',')[0].substring(1) );
                    //var popover = new bootstrap.Popover(exampleEl, {
                    //    trigger: 'focus',
                    //    customClass: target_host[i],
                    //    content: target_label[i]
                    //});
                } else if ( v.substring(0,1) == 't' ) {
                // media
                    var play_id = 'plid_'+uuidv4(); // TODO: these should really be the location IDs
                    var default_region = v.split( 't=' )[1].split(',');
                    player[ "player_viewing_"+target_tabs[i] ].addRegion( {"id":play_id,"drag":false,"resize":false,"start":default_region[0],"end":default_region[1],"color":'rgba(' +
                        [
                            ~~(255),
                            ~~(Math.random() * 255),
                            ~~(Math.random() * 255),
                            alpha || 1
                        ] +
                    ')'} );
                } else if ( v.substring(0,1) == 'x' ) {
                // image
                    var view_id = 'viid_'+uuidv4(); // TODO: these should really be the location IDs
                    if ( !annos[ "viewer_viewing_"+target_tabs[i] ][ target_note[i] ] ) { annos[ "viewer_viewing_"+target_tabs[i] ][ target_note[i] ] = []; }
                    var annotation = { 
                        "@context": "http://www.w3.org/ns/anno.jsonld",
                        "id": view_id,
                        "type": "Annotation",
                        "target": {
                            "selector": {
                            "type": "FragmentSelector",
                            "conformsTo": "http://www.w3.org/TR/media-frags/",
                            "value": v
                            }
                        }
                    };
                    annos[ "viewer_viewing_"+target_tabs[i] ][ target_note[i] ].push( JSON.parse( JSON.stringify( annotation ).replace(/\\"/g,"'") ) );
                    annotorious[ "viewer_viewing_"+target_tabs[i] ].addAnnotation( annotation, true ); // true = readonly, false = editable
                }
            } );
            /*
            // TODO: 
            // context cannot be assumed to be present in the global text view
            // (under which circumstances? only if context is one of the expressions?)
            $.each( cxtloc_locs, function( i,v) {
                if ( v.substring(0,1) == '#' ) {
                    if ( v.split( ',' ).length > 2) {
                        $( ".globaltext-container .globaltext "+v.split(',')[0] ).addClass( "highlight-gbl-start" );
                        $( ".globaltext-container .globaltext "+v.split(',').pop() ).addClass( "highlight-gbl-end" );
                    } else {
                        $( ".globaltext-container .globaltext "+v.split(',').join( ',.globaltext-container .globaltext ' ) ).addClass( "highlight-gbl-start highlight-gbl-end" );
                    }
                } else if ( v.substring(0,1) == 't' ) {
                    var play_id = 'plid_'+uuidv4(); // TODO: these should really be the location IDs
                    var default_region = v.split( 't=' )[1].split(',');
                    player[ "player_viewing_"+cxtloc_tabs[i] ].addRegion( {"id":play_id,"drag":false,"resize":false,"start":default_region[0],"end":default_region[1],"color":'rgba(' +
                        [
                            ~~(255),
                            ~~(Math.random() * 255),
                            ~~(Math.random() * 255),
                            alpha || 1
                        ] +
                    ')'} );
                } else if ( v.substring(0,1) == 'x' ) {
                    var view_id = 'viid_'+uuidv4(); // TODO: these should really be the location IDs
                    if ( !annos[ "viewer_viewing_"+cxtloc_tabs[i] ][ cxtloc_note[i] ] ) { annos[ "viewer_viewing_"+cxtloc_tabs[i] ][ cxtloc_note[i] ] = []; }
                    var annotation = { 
                        "@context": "http://www.w3.org/ns/anno.jsonld",
                        "id": view_id,
                        "type": "Annotation",
                        "target": {
                            "selector": {
                            "type": "FragmentSelector",
                            "conformsTo": "http://www.w3.org/TR/media-frags/",
                            "value": v
                            }
                        }
                    };
                    annos[ "viewer_viewing_"+cxtloc_tabs[i] ][ cxtloc_note[i] ].push( JSON.parse( JSON.stringify( annotation ).replace(/\\"/g,"'") ) );
                    annotorious[ "viewer_viewing_"+cxtloc_tabs[i] ].addAnnotation( annotation, true ); // true = readonly, false = editable
                }
            } );
            */
        }
        // add contexts nodes
        var graphElements = [], done = {}, nodes_added = [], local_col = {};
        for ( var key in exprContexts ) {
            if ( key != 'null' ) {
                var context = _l.keyBy( exprContexts[key], 'id' )
                graphElements = graphElements.concat( processGraphContext( context ) );
            }
        }
        // add expression nodes (if needed)
        for ( var part in exprNodes ) {
            if ( exprNodes[ part ].hasOwnProperty( "type" ) ) {
                if ( $( "#cy" ).length && !cy.$id( exprNodes[ part ].id ).length && !done[ exprNodes[ part ].id ] ) {
                    nodes_added = nodes_added.concat([
                        { group: 'nodes', 
                            classes: "node",
                            data: {
                                id: exprNodes[ part ].id,
                                name: (addicon( exprNodes[ part ].id )?addicon( exprNodes[ part ].id ):'')+" "+onto[exprNodes[ part ].type[0]].label+"\n"+exprNodes[ part ][ "skos:prefLabel" ],
                                pref: "skos:prefLabel" in exprNodes[ part ]?exprNodes[ part ]["skos:prefLabel"]:exprNodes[ part ]["crm:P1_is_identified_by"],
                                alt: exprNodes[ part ]["skos:altLabel"],
                                class: exprNodes[ part ].type,
                                bgcolor: (function() {
                                    if ( exprNodes[ part ].id.includes( "/expression/" ) || exprNodes[ part ].id.includes( "/manifestation/" ) ) {
                                        if (exprNodes[ part ].id.endsWith( "/1" )) { local_col[ exprNodes[ part ].id ] = graph_col["expression1"] ; return graph_col["expression1"]; }
                                        else if (exprNodes[ part ].id.endsWith( "/2" )) { local_col[ exprNodes[ part ].id ] = graph_col["expression2"] ; return graph_col["expression2"]; }
                                        else if (exprNodes[ part ].id.endsWith( "/3" )) { local_col[ exprNodes[ part ].id ] = graph_col["expression3"] ; return graph_col["expression3"]; }
                                        else if (exprNodes[ part ].id.endsWith( "/4" )) { local_col[ exprNodes[ part ].id ] = graph_col["expression4"] ; return graph_col["expression4"]; }
                                    } else if ( exprNodes[ part ].id.includes( "/excerpt/" ) ) {
                                        return local_col[ exprNodes[ part ]["lrmoo:R15i_is_fragment_of"] ]
                                    } else return graph_col[nsv( exprNodes[ part ].type[0] )];
                                })(),
                                shape: "round-rectangle",
                                context: exprNodes[ part ].hasOwnProperty("intro:R21i_isIdentifiedBy")?exprNodes[ part ]["intro:R21i_isIdentifiedBy"].id:undefined
                            },
                            //position: cy.getElementById( exprNodes[ part ].id ).position()
                        }
                    ]);
                    done[ exprNodes[ part ].id ] = true;
                }
            }
            graphElements = graphElements.concat( nodes_added );
        }
        if ( $( "#cy" ).length && graphElements.length > 0 && mode != 'view' ) {
            //var added = cy.add( graphElements );
            var added = ur.do( "add", graphElements );
            tippyNodes( added.nodes(), graph );
            clean_graph();
            run_layout( 'cose' );
        }
    }
}

// process contexts in the graph view
function processGraphContext( context ) {
    var added = [];
    for (var [id, part] of Object.entries( context )) {
        if ( part.type.includes( "intro:INT2_ActualizationOfFeature" ) ) {
            added = added.concat([
                { group: 'nodes', 
                    classes: "node",
                    data: {
                        id: part.id,
                        name: onto[ "intro:INT2_ActualizationOfFeature" ].label+"\n"+(
                            part.hasOwnProperty( "intro:R17_actualizesFeature" ) && part["intro:R17_actualizesFeature"].id in skos?
                                skos[ part["intro:R17_actualizesFeature"].id ]["skos:prefLabel"]:
                                part.hasOwnProperty( "intro:R17_actualizesFeature" )?part["intro:R17_actualizesFeature"].id:part["skos:prefLabel"]),
                        pref: part[ "skos:prefLabel" ]?part["skos:prefLabel"]:part["crm:P1_is_identified_by"],
                        alt: part["skos:altLabel"],
                        class: [ onto[ "intro:INT2_ActualizationOfFeature" ].about ],
                        bgcolor: "#2a9d8f",
                        shape: "concave-hexagon",
                        context: part["intro:R21i_isIdentifiedBy"].id
                    }
                }
            ]);
            if ( !Array.isArray( part['intro:R18i_actualizationFoundOn'] ) ) {
                added = added.concat([
                    { group: 'edges', 
                        classes: "edge",
                        data: { 
                            id: part.id+onto["intro:R18i_actualizationFoundOn"].about+context[ part["intro:R18i_actualizationFoundOn"].id ]["intro:R10i_isPassageOf"].id,//uuidv4(), 
                            source: part.id,
                            target: context[ part["intro:R18i_actualizationFoundOn"].id ]["intro:R10i_isPassageOf"].id, 
                            name: onto[ "intro:R18i_actualizationFoundOn" ].label, //skos[ context[ context["intro:R19_hasType"].id ]["intro:R4i_isDefinedIn"].id ]["skos:preflabel"],
                            pref: onto[ "intro:R18i_actualizationFoundOn" ].label, //skos[ context[ context["intro:R19_hasType"].id ]["intro:R4i_isDefinedIn"].id ]["skos:preflabel"],
                            class: onto[ "intro:R18i_actualizationFoundOn" ].about
                        }
                    }
                ]);
            } else {
                $.each( part['intro:R18i_actualizationFoundOn'], function( i,v ) {
                    added = added.concat([
                        { group: 'edges', 
                            classes: "edge",
                            data: { 
                                id: part.id+onto["intro:R18i_actualizationFoundOn"].about+context[ part["intro:R18i_actualizationFoundOn"][i].id ]["intro:R10i_isPassageOf"].id,//uuidv4(), 
                                source: part.id,
                                target: context[ part["intro:R18i_actualizationFoundOn"][i].id ]["intro:R10i_isPassageOf"].id, 
                                name: onto[ "intro:R18i_actualizationFoundOn" ].label, //skos[ context[ context["intro:R19_hasType"].id ]["intro:R4i_isDefinedIn"].id ]["skos:preflabel"],
                                pref: onto[ "intro:R18i_actualizationFoundOn" ].label, //skos[ context[ context["intro:R19_hasType"].id ]["intro:R4i_isDefinedIn"].id ]["skos:preflabel"],
                                class: onto[ "intro:R18i_actualizationFoundOn" ].about
                            }
                        }
                    ]);
                });
            }
        } else if ( part.type.includes( "intro:INT3_Interrelation" )) {
            if ( part.hasOwnProperty( "intro:R12_hasReferredToEntity" ) && part.hasOwnProperty( "intro:R13_hasReferringEntity" ) ) {
                added = added.concat([
                    { group: 'nodes', 
                        classes: "node",
                        data: {
                            id: part.id,
                            name: onto[ "intro:INT3_Interrelation"].label+"\n"+(
                                context[ part["intro:R19_hasType"].id ]["intro:R4i_isDefinedIn"].id in skos?
                                    skos[ context[ part["intro:R19_hasType"].id ]["intro:R4i_isDefinedIn"].id ]["skos:prefLabel"]:
                                    context[ part["intro:R19_hasType"].id ]["intro:R4i_isDefinedIn"].id),
                            pref: part.hasOwnProperty("skos:prefLabel")?part["skos:prefLabel"]:part["crm:P1_is_identified_by"],
                            alt: part["skos:altLabel"],
                            class: [ onto[ "intro:INT3_Interrelation" ].about ],
                            bgcolor: "#2a9d8f",
                            shape: "concave-hexagon",
                            context: part["intro:R21i_isIdentifiedBy"].id
                        },
                        //position: cy.getElementById( part.id ).position()
                    }
                ]);
                if ( !Array.isArray( part["intro:R12_hasReferredToEntity"] ) ) {
                    added = added.concat([
                        { group: 'edges', 
                            classes: "edge",
                            data: { 
                                id: part.id+onto["intro:R12_hasReferredToEntity"].about+context[ part["intro:R12_hasReferredToEntity"].id ]["intro:R10i_isPassageOf"].id,//uuidv4(), 
                                source: part.id, 
                                target: context[ part["intro:R12_hasReferredToEntity"].id ]["intro:R10i_isPassageOf"].id, 
                                name: onto[ "intro:R13_hasReferringEntity" ].label, //skos[ context[ context["intro:R19_hasType"].id ]["intro:R4i_isDefinedIn"].id ]["skos:preflabel"],
                                pref: onto[ "intro:R13_hasReferringEntity" ].label, //skos[ context[ context["intro:R19_hasType"].id ]["intro:R4i_isDefinedIn"].id ]["skos:preflabel"],
                                class: onto[ "intro:R13_hasReferringEntity" ].about
                            }
                        }
                    ]);
                } else {
                    $.each( part["intro:R12_hasReferredToEntity"], function( i,v ) {
                        added = added.concat([
                            { group: 'edges', 
                                classes: "edge",
                                data: { 
                                    id: part.id+onto["intro:R12_hasReferredToEntity"].about+context[ part["intro:R12_hasReferredToEntity"][i].id ]["intro:R10i_isPassageOf"].id,//uuidv4(), 
                                    source: part.id, 
                                    target: context[ part["intro:R12_hasReferredToEntity"][i].id ]["intro:R10i_isPassageOf"].id, 
                                    name: onto[ "intro:R13_hasReferringEntity" ].label, //skos[ context[ context["intro:R19_hasType"].id ]["intro:R4i_isDefinedIn"].id ]["skos:preflabel"],
                                    pref: onto[ "intro:R13_hasReferringEntity" ].label, //skos[ context[ context["intro:R19_hasType"].id ]["intro:R4i_isDefinedIn"].id ]["skos:preflabel"],
                                    class: onto[ "intro:R13_hasReferringEntity" ].about
                                }
                            }
                        ]);
                    });
                }
                if ( !Array.isArray( part["intro:R13_hasReferringEntity"] ) ) {
                    added = added.concat([
                        { group: 'edges', 
                            classes: "edge",
                            data: { 
                                id: part.id+onto["intro:R13_hasReferringEntity"].about+context[ part["intro:R13_hasReferringEntity"].id ]["intro:R10i_isPassageOf"].id,//uuidv4(), 
                                source: part.id,
                                target: context[ part["intro:R13_hasReferringEntity"].id ]["intro:R10i_isPassageOf"].id,
                                name: onto[ "intro:R12_hasReferredToEntity" ].label,
                                pref: onto[ "intro:R12_hasReferredToEntity" ].label,
                                class: onto[ "intro:R12_hasReferredToEntity" ].about
                            }
                        }
                    ]);
                } else {
                    $.each( part["intro:R13_hasReferringEntity"], function( i,v ) {
                        added = added.concat([
                            { group: 'edges', 
                                classes: "edge",
                                data: { 
                                    id: part.id+onto["intro:R13_hasReferringEntity"].about+context[ part["intro:R13_hasReferringEntity"][i].id ]["intro:R10i_isPassageOf"].id,//uuidv4(), 
                                    source: part.id,
                                    target: context[ part["intro:R13_hasReferringEntity"][i].id ]["intro:R10i_isPassageOf"].id,
                                    name: onto[ "intro:R12_hasReferredToEntity" ].label,
                                    pref: onto[ "intro:R12_hasReferredToEntity" ].label,
                                    class: onto[ "intro:R12_hasReferredToEntity" ].about
                                }
                            }
                        ]);
                    });
                }
            }
        }
    }
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
            (v.hasOwnProperty("dcterms:source")?
            `<dt>Source citation</dt>`+
            `<dd>`+v['dcterms:source']+`</dd>`:``)+
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
            `<dd>`+v['dcterms:bibliographicCitation']+`</dd>`:``)+
            `<dt>Context URI:</dt>`+
            `<dd>`+domain+`/works/#context/`+md.id.match(/\id\/(.*?)$/)[1]+`</dd>`
            ;
    });
    formatted_metadata += `</dl></div>`
    return( formatted_metadata );
}

// format context work
function print_cxtwrk( md, content, skos ) {
    const work = [].concat( md );
    var formatted_metadata = '<div style="font-size:15px;"><h4><i class="fa-solid fa-right-left"></i> Contextualization</h4><dl>';
    $.each( work, function( i,v ) {
        formatted_metadata += 
            `<dt style='word-break:break-word;'>Contextualization type/reference</dt>`+
            (v.hasOwnProperty("intro:R19_hasType")?
            `<dd>`+skos[ content[ v['intro:R19_hasType'].id ]['intro:R4i_isDefinedIn'].id ]["skos:prefLabel"]+`</dd>`:
            (v.hasOwnProperty("intro:R17_actualizesFeature") && v['intro:R17_actualizesFeature'].id in skos?
            `<dd>`+skos[ v['intro:R17_actualizesFeature'].id ]["skos:prefLabel"]+`</dd>`:
            v.hasOwnProperty( "intro:R17_actualizesFeature" )?
            `<dd>`+v['intro:R17_actualizesFeature'].id+`</dd>`:`<dd>`+v["skos:prefLabel"]+`</dd>`))+

            (v.hasOwnProperty("rdf:value")?
            `<dt style='word-break:break-word;'>Contextualization description</dt>`+
            `<dd>`+v['rdf:value']+`</dd>`:``)+
 
            `<dt style='word-break:break-word;'>Contextualization citation</dt>`+
            (v.hasOwnProperty("intro:R19_hasType") ?
            `<dd>`+("dcterms:bibliographicCitation" in skos[ content[ v['intro:R19_hasType'].id ]['intro:R4i_isDefinedIn'].id ]?skos[ content[ v['intro:R19_hasType'].id ]['intro:R4i_isDefinedIn'].id ]["dcterms:bibliographicCitation"]:skos[ skos[ content[ v['intro:R19_hasType'].id ]['intro:R4i_isDefinedIn'].id ]["skos:inScheme"].id ]["dcterms:bibliographicCitation"])+`</dd>`:
            (v.hasOwnProperty("intro:R17_actualizesFeature") && v['intro:R17_actualizesFeature'].id in skos?
            `<dd>`+
            (skos[ v['intro:R17_actualizesFeature'].id ]["dcterms:bibliographicCitation"]?skos[ v['intro:R17_actualizesFeature'].id ]["dcterms:bibliographicCitation"]:
            skos[ skos[ v['intro:R17_actualizesFeature'].id ]["skos:inScheme"].id ]["dcterms:bibliographicCitation"] )
            +`</dd>`:
            `<dd>—</dd>`))+

            `<dt style='word-break:break-word;'>Contextualization scheme</dt>`+
            (v.hasOwnProperty("intro:R19_hasType")?
            `<dd>`+skos[ content[ v['intro:R19_hasType'].id ]['intro:R4i_isDefinedIn'].id ]["skos:inScheme"].id+`</dd>`:
            (v.hasOwnProperty("intro:R17_actualizesFeature") && v['intro:R17_actualizesFeature'].id in skos?
            `<dd>`+skos[ v['intro:R17_actualizesFeature'].id ]["skos:inScheme"].id+`</dd>`:`<dd>—</dd>`))+

            `<dt style='word-break:break-word;'>Scheme title</dt>`+
            (v.hasOwnProperty("intro:R19_hasType")?
            `<dd>`+skos[ skos[ content[ v['intro:R19_hasType'].id ]['intro:R4i_isDefinedIn'].id ]["skos:inScheme"].id ][ "dc:title" ]+`</dd>`:
            (v.hasOwnProperty("intro:R17_actualizesFeature") && v['intro:R17_actualizesFeature'].id in skos?
            `<dd>`+skos[ skos[ v['intro:R17_actualizesFeature'].id ]["skos:inScheme"].id ][ "dc:title" ]+`</dd>`:`<dd>—</dd>`))+

            (v.hasOwnProperty("dcterms:format")?
            `<dt>Format</dt>`+
            `<dd><a class="external" target="_blank" href="`+context["@context"][v['dcterms:format'].id.split(":")[0]]+v['dcterms:format'].id.split(":")[1]+`">`+v['dcterms:format'].id+`</a></dd>`:``)+
            (v.hasOwnProperty("dcterms:language")?
            `<dt>Language</dt>`+
            `<dd>`+language[ v["dcterms:language"].id.match(/\/id\/(.*?)\/language$/)[1] ].name+` (<code>`+language[ v["dcterms:language"].id.match(/\/id\/(.*?)\/language$/)[1] ].id+`</code>)</dd>`:``)+
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
        			?w intro:R17_actualizesFeature|crm:P67_refers_to ?f .
        			?f ?p ?o .
                } UNION
                {
        			?w intro:R19_hasType ?ty .
        			?ty intro:R4i_isDefinedIn|crm:P67_refers_to ?f .
        			?f ?p ?o .
      			} UNION {
                	?w intro:R19_hasType ?ty .
        			?ty intro:R4i_isDefinedIn ?s2 .
        			?s2 skos:inScheme ?f .
          			?f ?p ?o .
                } UNION {
        			?w intro:R17_actualizesFeature ?s2 .
                	?s2 skos:inScheme ?f .
        			?f ?p ?o .
      			}
      			BIND( ?f AS ?s )
    		}
		    UNION {
                ?context intro:R21_identifies+ ?w .
      			?w (intro:R18i_actualizationFoundOn|intro:R13_hasReferringEntity|intro:R12_hasReferredToEntity) ?t .
        		{
        			?t intro:R10i_isPassageOf ?to .
        			?to ?p ?too .
			        BIND ( ?to AS ?s)
    			} UNION {
        			?t intro:R10i_isPassageOf ?do .
        			?do ?p ?to .
        			?to ?p ?too
			        BIND ( ?to AS ?s)
    			} UNION {
				    ?t intro:R41_hasLocation [ ?p ?to ] .
					?to rdf:rest*/rdf:first ?too .
			        BIND ( ?t AS ?s)
      			} UNION {
      				?t intro:R41_hasLocation ?to .
					?to ?p ?too .	
                    BIND ( ?t AS ?s)
      			}
                BIND ( ?too AS ?o)
        		#{
        		#	?t intro:R10i_isPassageOf ?do .
        		#	?do ?p ?too .
    			#} UNION {
				#    ?t intro:R41_hasLocation [ ?p ?to ] .
			    #	 ?to rdf:rest*/rdf:first ?too .
      			#} UNION {
      			#	?t intro:R41_hasLocation ?to .
				#	?to ?p ?too .		
      			#}
                #BIND ( ?too AS ?o)
                #BIND ( ?t AS ?s)
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
    var cxtmd = _l.keyBy( _l.filter( r.graph, function(o) { return o.hasOwnProperty( "type" ) && o["type"].includes("rppa:Context") && o.id.match(uuidRegex); }), 'id' );
    var cxtcnt = _l.keyBy( _l.filter( r.graph, function(o) { return o.id.startsWith( 'http' ) && o.id.match(uuidRegex); }), 'id' );
    var cxtref = _l.keyBy( _l.filter( r.graph, function(o) { return o.id.startsWith( 'http' ) && !o.id.match(uuidRegex) && !o.id.endsWith( '/tool' ); }) , 'id' );
    var skos = _l.keyBy( _l.filter( r.graph, function(o) { return o.id.includes( 'rppa:kos/' ); }), 'id' );
    var contributor = _l.keyBy( _l.filter( r.graph, function(o) { return o.id.startsWith( 'rppa:user-' ); }), 'id' );
    var tools = _l.keyBy( _l.filter( r.graph, function(o) { return o.hasOwnProperty( "type" ) && o["type"].includes( 'crmdig:D14_Software' ); }), 'id' );
    
    mode = "view";
    zInd = zInd+1;
    if ( $('.offcanvas.show').length ) { 
        $( myCanvasGTEl ).offcanvas( "hide" ); // myCanvasGT.hide(); // close any open texts if a new one is requested
        $(".popover").hide(); // hide if new text was called from a popover
    }
    // create global text canvas
    var intertext = _l.some(cxtcnt, function(o) { return o.id.includes( "/intertextuality" ) });
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
                    </div>`+((intertext)?
                    `<div class="col-sm-4 context" style="overflow:auto;">
                    </div>
                    <div class="col-sm-4 globalcontext-todo" style="">
                    </div>`:
                    `<div class="col-sm-8 context" style="columns:2;column-fill:auto;overflow:hidden;">
                    </div>`)+`
                </div>
            </div>
        </div>`;
    $( "body" ).prepend( context_win );

    const parts = [].concat( cxtcnt[context]["intro:R21_identifies"] );
    // collect the targets of annotations
    var target = [], target_tabs = [], target_locs = [], target_note = [];
    var cxtloc = [], cxtloc_tabs = [], cxtloc_locs = [], cxtloc_note = [];
    for (var i in parts ) {
        var annotation = cxtcnt[ parts[i].id ];
        // show target globaltext
        if ( annotation.hasOwnProperty( 'intro:R13_hasReferringEntity' ) && annotation.hasOwnProperty( 'intro:R12_hasReferredToEntity' ) ) {
            if ( !Array.isArray( annotation["intro:R13_hasReferringEntity"] ) ) {
                target.push( cxtref[ cxtcnt[ annotation["intro:R13_hasReferringEntity"].id ]["intro:R10i_isPassageOf"].id ]["crm:P48_has_preferred_identifier"] );
                target_tabs = target_tabs.concat( _l.filter( cxtref[ cxtcnt[ annotation["intro:R13_hasReferringEntity"].id ]["intro:R10i_isPassageOf"].id ]["crm:P106_is_composed_of"], function(o) { return o.id.includes( "/delivery" ); }) );
                target_locs = target_locs.concat( cxtcnt[ annotation["intro:R13_hasReferringEntity"].id ]["rdf:value"] );
                target_note = target_note.concat( cxtcnt[ annotation["intro:R13_hasReferringEntity"].id ]["rdfs:note"] );
            } else {
                $.each( annotation["intro:R13_hasReferringEntity"], function( i,v ) {
                    target.push( cxtref[ cxtcnt[ v.id ]["intro:R10i_isPassageOf"].id ]["crm:P48_has_preferred_identifier"] );
                    target_tabs = target_tabs.concat( _l.filter( cxtref[ cxtcnt[ v.id ]["intro:R10i_isPassageOf"].id ]["crm:P106_is_composed_of"], function(o) { return o.id.includes( "/delivery" ); }) );
                    target_locs = target_locs.concat( cxtcnt[ v.id ]["rdf:value"] );
                    target_note = target_note.concat( cxtcnt[ v.id ]["rdfs:note"] );
                });
            }   
            if ( !Array.isArray( annotation["intro:R12_hasReferredToEntity"] ) ) {
                cxtloc.push( cxtref[ cxtcnt[ annotation["intro:R12_hasReferredToEntity"].id ]["intro:R10i_isPassageOf"].id ]["crm:P48_has_preferred_identifier"] );
                cxtloc_tabs = cxtloc_tabs.concat( _l.filter( cxtref[ cxtcnt[ annotation["intro:R12_hasReferredToEntity"].id ]["intro:R10i_isPassageOf"].id ]["crm:P106_is_composed_of"], function(o) { return o.id.includes( "/delivery" ); }) );
                cxtloc_locs = cxtloc_locs.concat( cxtcnt[ annotation["intro:R12_hasReferredToEntity"].id ]["rdf:value"] );
                cxtloc_note = cxtloc_note.concat( cxtcnt[ annotation["intro:R12_hasReferredToEntity"].id ]["rdfs:note"] );
            } else {
                $.each( annotation["intro:R12_hasReferredToEntity"], function( i,v ) {
                    cxtloc.push( cxtref[ cxtcnt[ v.id ]["intro:R10i_isPassageOf"].id ]["crm:P48_has_preferred_identifier"] );
                    cxtloc_tabs = cxtloc_tabs.concat( _l.filter( cxtref[ cxtcnt[ v.id ]["intro:R10i_isPassageOf"].id ]["crm:P106_is_composed_of"], function(o) { return o.id.includes( "/delivery" ); }) );
                    cxtloc_locs = cxtloc_locs.concat( cxtcnt[ v.id ]["rdf:value"] );
                    cxtloc_note = cxtloc_note.concat( cxtcnt[ v.id ]["rdfs:note"] );
                });
            }
        } else if ( annotation.hasOwnProperty( 'intro:R18i_actualizationFoundOn' )) {
            if ( !Array.isArray( annotation['intro:R18i_actualizationFoundOn'] ) ) {
                target.push( cxtref[ cxtcnt[ annotation["intro:R18i_actualizationFoundOn"].id ]["intro:R10i_isPassageOf"].id ]["crm:P48_has_preferred_identifier"] );
                target_tabs = target_tabs.concat( _l.filter( cxtref[ cxtcnt[ annotation["intro:R18i_actualizationFoundOn"].id ]["intro:R10i_isPassageOf"].id ]["crm:P106_is_composed_of"], function(o) { return o.id.includes( "/delivery" ); }) );
                target_locs = target_locs.concat( cxtcnt[ annotation["intro:R18i_actualizationFoundOn"].id ]["rdf:value"] );
                target_note = target_note.concat( cxtcnt[ annotation["intro:R18i_actualizationFoundOn"].id ]["rdfs:note"] );
            } else {
                $.each( annotation["intro:R18i_actualizationFoundOn"], function( i,v ) {
                    target.push( cxtref[ cxtcnt[ v.id ]["intro:R10i_isPassageOf"].id ]["crm:P48_has_preferred_identifier"] );
                    target_tabs = target_tabs.concat( _l.filter( cxtref[ cxtcnt[ v.id ]["intro:R10i_isPassageOf"].id ]["crm:P106_is_composed_of"], function(o) { return o.id.includes( "/delivery" ); }) );
                    target_locs = target_locs.concat( cxtcnt[ v.id ]["rdf:value"] );
                    target_note = target_note.concat( cxtcnt[ v.id ]["rdfs:note"] );                                        
                });
            }
        } 
    }
    // show target globaltext
    await display_globaltext( target[0],texts[target[0]]["work"] );
    $( ".context-workbench .context-container .globaltext" ).addClass( "col-sm-4" );
    if (intertext) {
        $('.globalcontext-todo').addClass('globalcontext').removeClass('globalcontext-todo');
        await display_globaltext( cxtloc[0],texts[cxtloc[0]]["work"] );
    }
    // context label
    $( ".context-container .context" ).append( `<h3><i class="fa-solid fa-layer-group"></i> Context: `+truncateString(cxtmd[context]["skos:prefLabel"],50)+`</h3>` );
    if ( cxtmd[context]["crm:P3_has_note"] ) {
        $( ".context-container .context" ).append( `<p>`+cxtmd[context]["crm:P3_has_note"]+`</p>` );
    }
    // iterate through whatever was identified with intro:R21_identifies 
    for (var i in parts ) {
        // determine action, if applicable
        var annotation = cxtcnt[ parts[i].id ];
        /*
        if ( annotation["rdf:value"] ) {
            $( ".context-container .context" ).append( make_context( annotation.id, annotation["rdf:value"], cxtcnt[ annotation["oa:hasTarget"].id ]["rdf:value"] ) );
        }
        */
        if ( annotation.hasOwnProperty( "dcterms:requires" ) ) {
            switch ( annotation["dcterms:requires"].id ) {

                // translation alignment
                case "https://www.romanticperiodpoetry.org/id/tool00001/tool":
                    /*
                    const response1 = await fetch(annotation["as:items"][0].id);
                    if (!response1.ok) {
                        throw new Error("HTTP error " + response1.status);
                    }
                    const data1 = await response1.text();
                    // part body
                    $( ".context-container .context" ).append( make_context( cxtcnt[context].id, data1, cxtcnt[ annotation["oa:hasTarget"].id ]["rdf:value"] ) );
                    */
                    const response2 = await fetch(annotation["as:items"].id);
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
                    // alignment activation on context-side
                    $(document).on('mouseenter', '#win-'+context_win_id+' .globalcontext .w,#win-'+context_win_id+' .globalcontext .pc', function () {
                        if ( alignment[ annotation.id ][ $(this).attr('id') ] ) {
                            var hovered = $( '[id="'+context+'"] #'+$(this).attr('id') ).text();
                            var targeted = [];
                            $.each( alignment[ annotation.id ][ $(this).attr('id') ], function( i,v ) {
                                targeted.push( $( jq(v) ).text().toLowerCase() );
                            });
                            document.getElementById( alignment[ annotation.id ][ $(this).attr('id') ][0] ).scrollIntoView( {behavior: "smooth", block: "center"} );
                            $( '.context-container .globaltext #'+alignment[ annotation.id ][ $(this).attr('id') ].join( ',.context-container .globaltext #' ) ).addClass("idsSelected");       // text
                            $( '[data-cid="'+context+'"] .text #'+$(this).attr('id') ).addClass("idsSelected");    // context
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
                    }).on('mouseleave', '#win-'+context_win_id+' .globalcontext .w,#win-'+context_win_id+' .globalcontext .pc', function () {
                        if ( alignment[ annotation.id ][ $(this).attr('id') ] ) {
                            var hovered = $( '[id="'+context+'"] #'+$(this).attr('id') ).text();
                            var targeted = [];
                            $.each( alignment[ annotation.id ][ $(this).attr('id') ], function( i,v ) {
                                targeted.push( $( jq(v) ).text().toLowerCase() );
                            });
                            $( '.context-container .globaltext #'+alignment[ annotation.id ][ $(this).attr('id') ].join( ',.context-container .globaltext #' ) ).removeClass("idsSelected");    // text
                            $( '[data-cid="'+context+'"] .text #'+$(this).attr('id') ).removeClass("idsSelected"); // context
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
                            $( '[data-cid="'+context+'"] .text #'+alignment[ annotation.id+"/orig" ][ $(this).attr('id') ].join( ',.context-container .globaltext .text #' ) ).addClass("idsSelected");       // text
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
                            $( '[data-cid="'+context+'"] .text #'+alignment[ annotation.id+"/orig" ][ $(this).attr('id') ].join( ',.context-container .globaltext .text #' ) ).removeClass("idsSelected");    // text
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
                /*
                case "https://www.romanticperiodpoetry.org/id/tool00002/tool":
                
                    // part content
                    $( ".context-container .context" ).append( make_context( annotation.id, annotation["rdf:value"], cxtcnt[ annotation["oa:hasTarget"].id ]["rdf:value"] ) );
                    //$( ".context-container .globaltext .text "+cxtcnt[ annotation["oa:hasTarget"].id ]["rdf:value"].split(',').join( ',.context-container .globaltext .text ' ) ).addClass( "idsSelected" );

                    // contextualization
                    $( ".context-container .context" ).append( print_cxtwrk( annotation, cxtcnt, skos ) );
                    // tool info
                    $( ".context-container .context" ).append( print_tool( tools[annotation["dcterms:requires"].id] ) );

                    clearInterval( t );
                    t = setInterval(updateDOM(),500);
                
                    break;
                */
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
                /*
                default:
                    // contextualization
                    $( ".context-container .context" ).append( print_cxtwrk( annotation, cxtcnt, skos ) );
                    // tool info
                    $( ".context-container .context" ).append( print_tool( tools[annotation["dcterms:requires"].id] ) );

                    break;
                */
            }
        } else {
            // contextualization
            $( ".context-container .context" ).append( print_cxtwrk( annotation, cxtcnt, skos ) );
        }
    }
    // context metadata
    $( ".context-container .context" ).append( print_cxtmd( cxtmd[context], skos ) );
    // add context data/metadata
    $( ".context-container .context" ).append( print_user( contributor ) );

    // TODO: redundant, is repeated both here below AND in initializeContexts
    // highlight target/context locations
    $.each( target_locs, function( i,v) {
        // text
        if ( v.substring(0,1) == '#' ) {
            if ( v.split( ',' ).length > 2) {
                $( ".context-container .globaltext "+v.split(',')[0] ).addClass( "highlight-gbl-start" );
                $( ".context-container .globaltext "+v.split(',').pop() ).addClass( "highlight-gbl-end" );
            } else {
                $( ".context-container .globaltext "+v.split(',').join( ',.context-container .globaltext ' ) ).addClass( "highlight-gbl-start highlight-gbl-end" );
            }
        } else if ( v.substring(0,1) == 't' ) {
        // media
            var play_id = 'plid_'+uuidv4(); // TODO: these should really be the location IDs
            var default_region = v.split( 't=' )[1].split(',');
            player[ "player_viewing_"+target_tabs[i] ].addRegion( {"id":play_id,"drag":false,"resize":false,"start":default_region[0],"end":default_region[1],"color":'rgba(' +
                [
                    ~~(255),
                    ~~(Math.random() * 255),
                    ~~(Math.random() * 255),
                    alpha || 1
                ] +
            ')'} );
        } else if ( v.substring(0,1) == 'x' ) {
        // image
            var view_id = 'viid_'+uuidv4(); // TODO: these should really be the location IDs
            if ( !annos[ "viewer_viewing_"+target_tabs[i] ][ target_note[i] ] ) { annos[ "viewer_viewing_"+target_tabs[i] ][ target_note[i] ] = []; }
            var annotation = { 
                "@context": "http://www.w3.org/ns/anno.jsonld",
                "id": view_id,
                "type": "Annotation",
                "target": {
                    "selector": {
                    "type": "FragmentSelector",
                    "conformsTo": "http://www.w3.org/TR/media-frags/",
                    "value": v
                    }
                }
            };
            annos[ "viewer_viewing_"+target_tabs[i] ][ target_note[i] ].push( JSON.parse( JSON.stringify( annotation ).replace(/\\"/g,"'") ) );
            annotorious[ "viewer_viewing_"+target_tabs[i] ].addAnnotation( annotation, true ); // true = readonly, false = editable
        }
    } );
    $.each( cxtloc_locs, function( i,v) {
        if ( v.substring(0,1) == '#' ) {
            if ( v.split( ',' ).length > 2) {
                $( ".context-container .globaltext "+v.split(',')[0] ).addClass( "highlight-gbl-start" );
                $( ".context-container .globaltext "+v.split(',').pop() ).addClass( "highlight-gbl-end" );
            } else {
                $( ".context-container .globaltext "+v.split(',').join( ',.context-container .globaltext ' ) ).addClass( "highlight-gbl-start highlight-gbl-end" );
            }
        } else if ( v.substring(0,1) == 't' ) {
            var play_id = 'plid_'+uuidv4(); // TODO: these should really be the location IDs
            var default_region = v.split( 't=' )[1].split(',');
            player[ "player_viewing_"+cxtloc_tabs[i] ].addRegion( {"id":play_id,"drag":false,"resize":false,"start":default_region[0],"end":default_region[1],"color":'rgba(' +
                [
                    ~~(255),
                    ~~(Math.random() * 255),
                    ~~(Math.random() * 255),
                    alpha || 1
                ] +
            ')'} );
        } else if ( v.substring(0,1) == 'x' ) {
            var view_id = 'viid_'+uuidv4(); // TODO: these should really be the location IDs
            if ( !annos[ "viewer_viewing_"+cxtloc_tabs[i] ][ cxtloc_note[i] ] ) { annos[ "viewer_viewing_"+cxtloc_tabs[i] ][ cxtloc_note[i] ] = []; }
            var annotation = { 
                "@context": "http://www.w3.org/ns/anno.jsonld",
                "id": view_id,
                "type": "Annotation",
                "target": {
                    "selector": {
                    "type": "FragmentSelector",
                    "conformsTo": "http://www.w3.org/TR/media-frags/",
                    "value": v
                    }
                }
            };
            annos[ "viewer_viewing_"+cxtloc_tabs[i] ][ cxtloc_note[i] ].push( JSON.parse( JSON.stringify( annotation ).replace(/\\"/g,"'") ) );
            annotorious[ "viewer_viewing_"+cxtloc_tabs[i] ].addAnnotation( annotation, true ); // true = readonly, false = editable
        }
    } );

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
    $( ".context-container .globalcontext .globaltext .nav-pills button" ).addClass( "disabled" );
    if ( cxtloc[0] && texts[ target[0] ]['work'] != texts[ cxtloc[0] ]['work']) {
        cxtloc_tabs.forEach(function(obj) {
            $( '#'+$( $( "#"+ $( "div[data-iid='"+obj.id+"']" ).parent().attr("id")+'-tab' ).closest( ".globalcontext" ).find( "#"+ $( "div[data-iid='"+obj.id+"']" ).parent().attr("id")+'-tab' )[0] ).attr( "id" ) ).removeClass( 'disabled' );
            $( '#'+$( $( "#"+ $( "div[data-iid='"+obj.id+"']" ).parent().attr("id")+'-tab' ).closest( ".globalcontext" ).find( "#"+ $( "div[data-iid='"+obj.id+"']" ).parent().attr("id")+'-tab' )[0] ).attr( "id" ) ).click()
        });
    } else {
        // if different expressions of same work: assume it's translation that
        // is context
        cxtloc.forEach(function(obj) {
            $( '#'+$( $( "#pills-"+obj+'-1-tab' ).closest( ".globalcontext" ).find( "#pills-"+obj+'-1-tab' )[0] ).attr( "id" ) ).removeClass( 'disabled' );
            $( '#'+$( $( "#pills-"+obj+'-1-tab' ).closest( ".globalcontext" ).find( "#pills-"+obj+'-1-tab' )[0] ).attr( "id" ) ).click()
        });
    }
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
        history.replaceState(null,null,previousState!=null?previousState:domain);
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

// theme switch
function reTheme( theme ) {
    if ( $( "#map" ).length ) {
        layerscontrol.remove();
        if (theme == 'light' ) {
            map.removeLayer( baseMapDark );
            map.addLayer( baseMapLight );
            baseMap = baseMapLight;
            layerscontrol = L.control.layers( {"OpenStreetMap": baseMap }, { "The World (1844)": overlayMap }, {position: 'topright'} ).addTo( map );
        } else {
            map.removeLayer( baseMapLight );
            map.addLayer( baseMapDark );
            baseMap = baseMapDark;
            layerscontrol = L.control.layers( {"OpenStreetMap": baseMap }, { "The World (1844)": overlayMap }, {position: 'topright'} ).addTo( map );
        }
        if ( map.hasLayer( overlayMap ) && map.getZoom() <= 5 ) {
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
    } else if ( $( "#cy" ).length || $( "#cy_help" ).length ) {
        if ( $( "#cy" ).length ) {
            if ( theme == 'light' ) {
                cy.style().selector( 'edge' ).style( {'color':'#333'} ).update()
                cy.style().selector( 'node' ).style( {'background-color':'#fff','color':'#333'} ).update()
                //cy.style().fromJson( lightStyle ).update();
            } else {
                cy.style().selector( 'edge' ).style( {'color':'#fff'} ).update()
                cy.style().selector( 'node' ).style( {'background-color':'#333','color':'#fff'} ).update()
                //cy.style().fromJson( darkStyle ).update();
            }
        } else {
            if ( theme == 'light' ) {
                cy_help.style().selector( 'edge' ).style( {'color':'#333'} ).update()
                cy_help.style().selector( 'node' ).style( {'background-color':'#666','color':'#333'} ).update()
                //cy.style().fromJson( lightStyle ).update();
            } else {
                cy_help.style().selector( 'edge' ).style( {'color':'#fff'} ).update()
                cy_help.style().selector( 'node' ).style( {'background-color':'#666','color':'#fff'} ).update()
                //cy.style().fromJson( darkStyle ).update();
            }
        }
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
    $( ".sso,.sso-sign-in" ).remove(); // TODO: remove after testing
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

    JSONForm.fieldTypes['htmlsnippet'] = {
	    template: '<%=node.value%>'
    };
    window.addEventListener("hashchange", loadLayout, false);
    cytoscape.use(cytoscapePopper(tippyFactory));

});
