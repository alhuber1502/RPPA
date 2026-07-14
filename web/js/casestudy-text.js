/* casestudy-text.js: the per-poem CONTEXT page for the Dias case study.
   Renders one reception poem as a full RPPA context record: the verse, the INT3 relation + INT2 motifs
   + INT1 anchors (all bound to SKOS concepts), the evidence + confidence, and the outbound links into
   the LIVE RPPA graph (the origin work, in-archive poets, the SKOS concepts) + the promotion pathway. */
(function () {
  "use strict";
  var BASE = "/data/casestudies/dias/";
  var SITE = "https://www.romanticperiodpoetry.org";
  var ORIGIN = { work: "work00385", text: "text00420", poet: "pers00405", title: "Canção do Exílio", year: 1846 };

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }
  function deaccent(s) { return String(s || "").normalize("NFKD").replace(/[̀-ͯ]/g, ""); }
  function norm(s) { return deaccent(s).toLowerCase().replace(/[^a-z0-9]+/g, " ").trim(); }
  function cssVar(n) { return getComputedStyle(document.documentElement).getPropertyValue(n).trim(); }
  function relColor(r) { return cssVar("--rel-" + (r || "imitation")) || cssVar("--cs-accent"); }
  function pct(c) { return c == null ? "—" : Math.round(c * 100) + "%"; }
  function param(k) { return new URLSearchParams(location.search).get(k); }
  function graphLink(uri, label) {
    return '<a href="' + esc(uri) + '" target="_blank" rel="noopener">' + esc(label) + "</a>";
  }

  Promise.all(["poems", "contexts", "authors", "review"].map(function (n) {
    return fetch(BASE + n + ".json").then(function (r) { return r.json(); });
  })).then(function (res) {
    render({ poems: res[0], contexts: res[1], authors: res[2], review: res[3] });
  }).catch(function (e) {
    document.getElementById("cs-text").innerHTML = '<div class="alert alert-warning">Could not load the context. ' + esc(e.message) + "</div>";
  });

  function render(data) {
    data.poems.sort(function (a, b) { return a.id < b.id ? -1 : 1; });
    var id = param("id") || data.poems[0].id;
    var i = data.poems.findIndex(function (p) { return p.id === id; });
    if (i < 0) { i = 0; id = data.poems[0].id; }
    var p = data.poems[i];
    var ctx = data.contexts.find(function (c) { return c.poem === id; }) || {};
    var author = data.authors.find(function (a) { return a.id === p.author; }) || {};
    var prov = ctx.provenance || {}, v = prov.verdict || {}, rel = ctx.relation || {};
    var status = (data.review.verdicts && data.review.verdicts[id] && data.review.verdicts[id].status) || "candidate";
    document.getElementById("cs-crumb").textContent = p.title || p.altTitle || id;
    document.title = (p.title || id) + " / a context / RPPA Case Studies";

    // anchors (INT1): normalised reused spans; used to flag echoing verse lines
    var anchors = (ctx.anchors || []).map(norm);
    function lineEchoes(line) {
      var n = norm(line);
      return anchors.some(function (a) { return a && (n.indexOf(a) !== -1 || a.indexOf(n) !== -1) && n.length > 6; });
    }

    var h = "";
    // ---- header ----
    h += '<div class="cs-hero" style="padding-top:0">';
    h += '<div class="cs-eyebrow" style="color:' + relColor(rel.primary) + '">' +
      esc((rel.primary || "").replace("-", " ")) + (v.isResponse === false ? " · refuted" : "") + "</div>";
    h += '<h1>' + esc(p.title || p.altTitle || "[untitled]") + "</h1>";
    h += '<div class="cs-lede" style="font-size:1rem">' + esc(author.name || p.authorName) +
      (p.year ? " &middot; " + p.year : "") + (author.country ? " &middot; " + esc(author.country) : "") +
      (author.place ? " (" + esc(author.place) + ")" : "") + "</div></div>";

    h += '<div class="row g-4">';
    // ---- left: the verse ----
    h += '<div class="col-lg-6"><div class="cs-section-label">The poem</div>';
    if (p.altTitle && p.altTitle !== p.title) h += '<div class="meta small mb-2 text-muted">also titled &ldquo;' + esc(p.altTitle) + "&rdquo;</div>";
    h += '<div class="cs-verse-block">';
    (p.stanzas || []).forEach(function (st) {
      h += '<p class="mb-2">' + st.map(function (l) {
        return lineEchoes(l) ? '<span class="cs-frag">' + esc(l) + "</span>" : esc(l);
      }).join("<br>") + "</p>";
    });
    h += "</div>";
    if ((ctx.anchors || []).length) {
      h += '<div class="small text-muted">Highlighted lines reuse wording from Dias&rsquo;s <em>Canção do Exílio</em> ' +
        "(the INT1 passages listed opposite).</div>";
    }
    if (p.citation) {
      h += '<div class="small mt-2"><strong>Source:</strong> ' +
        (p.citation.url ? graphLink(p.citation.url, p.citation.text) : esc(p.citation.text)) +
        (p.citation.via ? ' <span class="text-muted">(' + esc(p.citation.via) + ")</span>" : "") + "</div>";
    }
    h += "</div>";

    // ---- right: the context record ----
    h += '<div class="col-lg-6"><div class="cs-section-label">The context</div>';
    h += '<p class="small">This reading is a <strong>context</strong>: an <code>intro:INT_Interpretation</code> ' +
      "that <em>discusses</em> Dias&rsquo;s <em>Canção do Exílio</em>.</p>";
    h += '<dl class="cs-record">';
    // INT3 relation
    var rc = rel.concept;
    h += "<dt>Relation <span class='text-muted'>(INT3)</span></dt><dd><span class='rel'>" +
      esc((rel.primary || "").replace("-", " ")) + "</span>" +
      (rel.secondary ? " <span class='text-muted'>+ " + esc(rel.secondary) + "</span>" : "");
    if (rc) {
      h += ', SKOS concept ' + graphLink(rc.id, rc.prefLabel);
      var ms = [];
      Object.keys(rc.matches || {}).forEach(function (k) {
        (rc.matches[k]).forEach(function (u) { ms.push(graphLink(u, u.split("/kos/")[1])); });
      });
      if (ms.length) h += '<div class="small text-muted mt-1">' + esc("skos: ") + ms.join(", ") + "</div>";
    }
    h += "</dd>";
    // INT2 motifs (symbols + structural)
    var mc = ctx.motifConcepts || [];
    if (mc.length) {
      h += "<dt>Motifs <span class='text-muted'>(INT2)</span></dt><dd>" +
        mc.map(function (m) { return graphLink(m.concept, m.prefLabel) + " <span class='text-muted small'>(" + esc(m.kos) + ")</span>"; }).join(", ") + "</dd>";
    }
    // modes & devices (genres / rhetorical figures, grounded in the Princeton Encyclopedia)
    var dv = ctx.deviceConcepts || [];
    if (dv.length) {
      h += "<dt>Modes &amp; devices</dt><dd>" +
        dv.map(function (m) { return graphLink(m.concept, m.prefLabel) + " <span class='text-muted small'>(" + esc(m.kos) + ")</span>"; }).join(", ") + "</dd>";
    }
    // INT1 anchors
    if ((ctx.anchors || []).length) {
      h += "<dt>Passages <span class='text-muted'>(INT1)</span></dt><dd>" +
        ctx.anchors.slice(0, 6).map(function (a) { return '<span class="cs-frag cs-mono">' + esc(a) + "</span>"; }).join(" ") + "</dd>";
    }
    // Syntactic template (Enslen & Bell 2024)
    var tpl = ctx.template;
    if (tpl && tpl.label && tpl.label !== "—") {
      h += "<dt>Syntactic template <span class='text-muted'>(Enslen &amp; Bell 2024)</span></dt><dd>" +
        "<strong>" + esc(tpl.label) + "</strong>" +
        (tpl.instance ? ": <span class='cs-verse'>&laquo;" + esc(tpl.instance) + "&raquo;</span>" : "") +
        "<div class='text-muted small mt-1'>Degree of reuse of &ldquo;Minha terra tem palmeiras&rdquo;: " +
        "T0 = the verbatim first line, higher = more grammatically modified; T&infin; = related but outside the template.</div></dd>";
    }
    // evidence
    var ev = ctx.evidence || {};
    if (ev.diasLine || ev.poemLine) {
      h += "<dt>Evidence</dt><dd><div class='cs-verse dias'>" + esc(ev.diasLine) + "</div><div class='cs-verse'>" + esc(ev.poemLine) + "</div></dd>";
    }
    // rationale
    if (ctx.rationale) h += "<dt>Reading</dt><dd>" + esc(ctx.rationale) + "</dd>";
    // confidence + verdict
    h += "<dt>Confidence</dt><dd>" + pct(prov.confidence) +
      (v.reason ? " <span class='text-muted small'>&middot; " + esc(v.reason) + "</span>" : "") + "</dd>";
    // enslen score
    var val = ctx.validation || {};
    if (val.mode) h += "<dt>Enslen score</dt><dd><span class='cs-mono'>" + (val.coefficient != null ? val.coefficient : "—") +
      "</span> similarity &middot; mode <strong>" + esc(val.mode) + "</strong>" +
      (val.catalog ? " <span class='text-muted small'>(cat. " + val.catalog + ")</span>" : "") +
      (prov.enslenCheck && prov.enslenCheck.agreement ? " &middot; " + esc(prov.enslenCheck.agreement.toLowerCase().replace("-", " ")) : "") + "</dd>";
    h += "</dl></div></div>";

    // ---- in the RPPA graph ----
    h += '<div class="cs-kg mt-4"><h2>In the RPPA knowledge graph</h2>';
    h += '<p class="mb-2">This context connects to the live archive. It '
      + "<em>discusses</em> the origin " + graphLink(SITE + "/id/" + ORIGIN.work + "/work",
        "Gonçalves Dias, Canção do Exílio (work00385)") + ".";
    if (author.sameAs) {
      h += " Its author is also in the archive as " + graphLink(SITE + "/id/" + author.sameAs, author.sameAs) +
        " (<span class='cs-mono'>owl:sameAs</span>).";
    }
    h += " Its relation type and motifs resolve to SKOS concepts in RPPA&rsquo;s shared vocabularies (above).</p>";
    h += '<p class="mb-0 small text-muted">Status: <span class="cs-chip status-' + esc(status) +
      '">' + esc(status) + "</span>. Because this candidate context already uses the archive&rsquo;s ontology " +
      "(INTRO / CIDOC-CRM / POSTDATA) and vocabularies, a ratified one <strong>promotes into the live graph " +
      "unchanged</strong> (a SPARQL update), joining the archive&rsquo;s web of contextuality.</p></div>";

    // ---- nav ----
    var prev = data.poems[(i - 1 + data.poems.length) % data.poems.length];
    var next = data.poems[(i + 1) % data.poems.length];
    h += '<div class="d-flex justify-content-between mt-4 mb-5 small">' +
      '<a href="?id=' + prev.id + '">&lsaquo; ' + esc(prev.title || prev.id) + "</a>" +
      '<a href="/casestudies/dias/">All eighty-eight &middot; back to the study</a>' +
      '<a href="?id=' + next.id + '">' + esc(next.title || next.id) + " &rsaquo;</a></div>";

    document.getElementById("cs-text").innerHTML = h;
  }
})();
