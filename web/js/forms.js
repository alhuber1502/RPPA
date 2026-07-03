// ───────────────────────────────────────────────────────────────────────────
// WP-F: Corpus annotation browser. A usage-filtered, counted version of the help
// page's vocabulary list (cs_lists), rendered into a #form-index container in the
// /networks (and later /maps) sidebar.
//
// All formal, semantic and poetic annotations live in the CONTEXT objects, each
// pointing at a SKOS concept. This sweeps the concepts actually USED in contexts,
// groups them by their ConceptScheme (vocabulary) — labelled by the scheme's
// dc:subject type(s), exactly as on the help page — and shows usage counts.
// Clicking a concept seeds /networks via #node/{concept}, which surfaces the
// concept, its cross-vocabulary equivalents (skos mapping relations) and its
// contexts -> passages -> works. No pdp:/StanzaPattern layer involved.
// ───────────────────────────────────────────────────────────────────────────

function formsIndexQuery() {
    // one row per (subject-heading, concept): the SKOS concepts used in contexts,
    // faceted by the dc:subject heading(s) of their vocabulary (a concept may appear
    // under several headings — e.g. a Ferber term is both a motif and a symbol).
    return `PREFIX intro: <https://w3id.org/lso/intro/beta202408#>
PREFIX skos: <http://www.w3.org/2004/02/skos/core#>
PREFIX dc: <http://purl.org/dc/elements/1.1/>
SELECT ?subject ?concept ?label (COUNT(DISTINCT ?w) AS ?n) WHERE {
  { ?w a intro:INT2_ActualizationOfFeature . ?w intro:R17_actualizesFeature ?concept }
  UNION
  { ?w a intro:INT3_Interrelation . ?w intro:R19_hasType ?ty . ?ty intro:R4i_isDefinedIn ?concept }
  ?concept skos:prefLabel ?label .
  OPTIONAL { ?concept skos:inScheme ?scheme . ?scheme dc:subject ?subject }
} GROUP BY ?subject ?concept ?label ORDER BY ?subject ?label`;
}

function formsFetch( query ) {
    return new Promise( function( resolve ) {
        $.ajax({ type: "POST", url: SPARQL_RPPA + "sparql", data: { query: query },
            headers: { Accept: "application/json" } })
        .done( function( r ) { resolve( ( r.results && r.results.bindings ) || [] ); } )
        .fail( function( e ) { console.log( "WP-F concept index query failed", e ); resolve( null ); } );
    });
}

function formsVal( row, k ) { return ( row[ k ] && row[ k ].value ) || ''; }
function formsEsc( s ) { return String( s ).replace( /&/g, '&amp;' ).replace( /</g, '&lt;' ).replace( />/g, '&gt;' ); }

async function formsRenderIndex( $container ) {
    $container.html( '<p class="text-muted">Loading concept index…</p>' );
    var rows = await formsFetch( formsIndexQuery() );
    if ( rows === null ) { $container.html( '<p class="text-danger">Concept index unavailable (SPARQL endpoint not reachable).</p>' ); return; }
    if ( !rows.length ) { $container.html( '<p class="text-muted">No annotated concepts found.</p>' ); return; }

    // pass 1: gather each used concept's subject headings (= its vocabulary's dc:subjects)
    var byConcept = {};
    rows.forEach( function( row ) {
        var c = formsVal( row, 'concept' );
        var e = byConcept[ c ] || ( byConcept[ c ] = { concept: c, label: formsVal( row, 'label' ),
            n: parseInt( formsVal( row, 'n' ) || '0', 10 ), subjects: [] } );
        var subj = formsVal( row, 'subject' );
        if ( subj && e.subjects.indexOf( subj ) < 0 ) e.subjects.push( subj );
    } );

    // pass 2: assign each concept to heading(s). A concept from a CROSS-CUTTING
    // vocabulary (many dc:subjects — e.g. the Princeton Encyclopedia, 9) or with no
    // subject goes to a single "Other" bucket, rather than being repeated under every
    // heading. Focused vocabularies (<=3 subjects) stay faceted by subject.
    var OTHER = 'other / miscellaneous', CROSS_CUTTING_MAX = 4;
    var subjects = {};
    Object.keys( byConcept ).forEach( function( c ) {
        var e = byConcept[ c ];
        var homes = ( e.subjects.length === 0 || e.subjects.length > CROSS_CUTTING_MAX ) ? [ OTHER ] : e.subjects;
        homes.forEach( function( h ) { ( subjects[ h ] = subjects[ h ] || {} )[ c ] = e; } );
    } );

    // headings ordered by size (most concepts first), "Other" last
    var order = Object.keys( subjects ).sort( function( a, b ) {
        if ( a === OTHER ) return 1; if ( b === OTHER ) return -1;
        return Object.keys( subjects[ b ] ).length - Object.keys( subjects[ a ] ).length;
    } );

    var html = `<h2>Browse by concept</h2>
        <p class="form-text" style="margin-bottom:8px;">Concepts used to annotate the corpus, grouped by subject.
        Click one to explore it (with its cross-vocabulary equivalents and the works it annotates) in the graph.
        <em>Ongoing — coverage grows as contexts are added.</em></p>`;
    order.forEach( function( subj, i ) {
        var concepts = Object.keys( subjects[ subj ] ).map( function( k ) { return subjects[ subj ][ k ]; } )
            .sort( function( a, b ) { return a.label.toLowerCase().localeCompare( b.label.toLowerCase() ); } );
        var cid = 'formsubj-' + i, total = concepts.reduce( function( a, c ) { return a + c.n; }, 0 );
        var chips = concepts.map( function( c ) {
            return `<a class="form-chip" href="/networks/#node/${ c.concept }" title="${ c.n } annotation(s)"
                style="display:inline-block;margin:2px;background:#cd6711;color:#fff;text-decoration:none;border-radius:4px;padding:1px 9px;font-size:13px;">
                ${ formsEsc( c.label ) } <span style="background:rgba(255,255,255,.28);border-radius:8px;padding:0 6px;font-size:11px;">${ c.n }</span></a>`;
        } ).join( '' );
        html += `<div style="margin-top:8px;">
            <a href="#${ cid }" role="button" data-bs-toggle="collapse" aria-expanded="false" style="font-weight:bold;text-transform:capitalize;">
              ${ formsEsc( subj ) }</a>
            <span class="text-muted" style="font-size:12px;"> · ${ concepts.length } concepts · ${ total } annotations</span>
            <div class="collapse" id="${ cid }" style="margin-top:4px;">${ chips }</div>
        </div>`;
    } );
    $container.html( html );
}

function formsLastSeg( uri ) { return String( uri ).split( /[\/#]/ ).filter( Boolean ).pop() || uri; }

// (re)render wherever a #form-index container exists (networks + maps #home panes).
// Exposed so a completed contribution can refresh the panel live (see rppa.js).
function formsRefresh() {
    var $c = $( '#form-index' );
    if ( $c.length && typeof SPARQL_RPPA !== 'undefined' ) { formsRenderIndex( $c ); }
}
$( function() { formsRefresh(); } );
