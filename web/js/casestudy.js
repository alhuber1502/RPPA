/* casestudy.js: renders the Dias reception Case Study from the standalone bundle JSON.
   Live + data-driven: re-running the pipeline (build_bundle.py -> fold_stage1.py) regenerates the
   JSON and this page reflects the new reality on reload. review.json overlays reviewer verdicts. */
(function () {
  "use strict";
  var BASE = "/data/casestudies/dias/";
  var RELATIONS = ["imitation", "parody", "homage", "reply", "quotation", "thematic-echo", "elegy"];

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }
  function cssVar(name) {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  }
  function relColor(rel) {
    return cssVar("--rel-" + (rel || "imitation")) || cssVar("--cs-accent");
  }
  function darken(color, f) {
    var m = (color || "").trim().match(/^#?([0-9a-f]{6})$/i);
    if (!m) return color;
    var n = parseInt(m[1], 16);
    return "rgb(" + Math.round(((n >> 16) & 255) * f) + "," + Math.round(((n >> 8) & 255) * f) + "," + Math.round((n & 255) * f) + ")";
  }
  function confBand(c) { return c == null ? "med" : (c >= 0.7 ? "high" : (c >= 0.5 ? "med" : "low")); }
  function confColor(c) {
    var band = confBand(c);
    return band === "high" ? cssVar("--cs-anil") : band === "med" ? cssVar("--cs-anil-soft") : cssVar("--cs-review");
  }
  function pct(c) { return c == null ? "—" : Math.round(c * 100) + "%"; }

  function statusOf(id, review) {
    var v = review.verdicts && review.verdicts[id];
    return (v && v.status) || "candidate";
  }

  Promise.all(["dias", "poems", "authors", "contexts", "review"].map(function (n) {
    return fetch(BASE + n + ".json").then(function (r) {
      if (!r.ok) throw new Error("Failed to load " + n + ".json (" + r.status + ")");
      return r.json();
    });
  })).then(function (res) {
    build({ dias: res[0], poems: res[1], authors: res[2], contexts: res[3], review: res[4] });
  }).catch(function (err) {
    document.getElementById("cs-overview").innerHTML =
      '<div class="alert alert-warning">Could not load the case-study data. ' + esc(err.message) + "</div>";
  });

  function build(data) {
    var ctxById = {};
    data.contexts.forEach(function (c) { ctxById[c.poem] = c; });
    var authById = {};
    data.authors.forEach(function (a) { authById[a.id] = a; });

    // merged model, one row per poem
    var rows = data.poems.map(function (p) {
      var c = ctxById[p.id] || {};
      var prov = c.provenance || {};
      var v = prov.verdict || {};
      return {
        id: p.id,
        title: p.title || p.altTitle || "[untitled]",
        altTitle: p.altTitle,
        author: (authById[p.author] || {}).name || p.authorName,
        country: (c.spatial || {}).country || (authById[p.author] || {}).country,
        year: p.year,
        relation: (c.relation || {}).primary || "thematic-echo",
        relationSecondary: (c.relation || {}).secondary,
        relationConcept: (c.relation || {}).concept,
        template: c.template,
        motifs: c.motifs || [],
        motifConcepts: c.motifConcepts || [],
        deviceConcepts: c.deviceConcepts || [],
        motifsFree: c.motifsFree || [],
        rationale: c.rationale || "",
        evidence: c.evidence || {},
        anchors: c.anchors || [],
        confidence: prov.confidence,
        isResponse: v.isResponse !== false,
        verdictReason: v.reason || "",
        enslen: c.validation || {},
        agreement: (prov.enslenCheck || {}).agreement,
        status: statusOf(p.id, data.review)
      };
    });
    var byId = {};
    rows.forEach(function (r) { byId[r.id] = r; });

    // one shared file serves the home / network / texts pages; render only what's present
    if (document.getElementById("cs-overview")) renderOverview(rows);
    if (document.getElementById("cs-sigwords")) renderSigWords(data.poems);
    if (document.getElementById("cs-motifs")) renderMotifs(rows);
    if (document.getElementById("cs-timeline")) renderTimeline(rows);
    if (document.getElementById("cs-network")) renderNetwork(rows, data.contexts, byId);
    if (document.getElementById("cs-evidence")) renderEvidence(rows);
  }

  /* ---------- overview ---------- */
  function renderOverview(rows) {
    var relCount = {}, agr = {}, refuted = 0, quarantined = 0, confs = [];
    RELATIONS.forEach(function (r) { relCount[r] = 0; });
    rows.forEach(function (r) {
      relCount[r.relation] = (relCount[r.relation] || 0) + 1;
      if (r.agreement) agr[r.agreement] = (agr[r.agreement] || 0) + 1;
      if (!r.isResponse) refuted++;
      if (r.confidence != null) confs.push(r.confidence);
      if (!r.isResponse || (r.confidence != null && r.confidence < 0.5)) quarantined++;
    });
    var meanConf = confs.reduce(function (a, b) { return a + b; }, 0) / (confs.length || 1);
    var maxRel = Math.max.apply(null, RELATIONS.map(function (r) { return relCount[r]; }));

    var stats = [
      { n: rows.length, l: "reception poems" },
      { n: refuted, l: "machine-refuted<br>(not genuine responses)" },
      { n: quarantined, l: "flagged for review" },
      { n: meanConf ? Math.round(meanConf * 100) + "%" : "—", l: "mean confidence" }
    ];
    var html = '<div class="cs-stats mb-3">' + stats.map(function (s) {
      return '<div class="cs-stat"><div class="n">' + s.n + '</div><div class="l">' + s.l + "</div></div>";
    }).join("") + "</div>";

    html += '<div class="row g-4">';
    // relation typology bars
    html += '<div class="col-md-7"><div class="cs-section-label">Relation typology</div>';
    RELATIONS.forEach(function (r) {
      var w = maxRel ? (relCount[r] / maxRel * 100) : 0;
      html += '<div class="cs-bar-row"><span class="name"><span class="cs-rel-dot" style="background:' +
        relColor(r) + '"></span> ' + r.replace("-", " ") + '</span>' +
        '<span class="cs-bar" style="width:' + w + '%;background:' + relColor(r) + '"></span>' +
        '<span class="val">' + relCount[r] + "</span></div>";
    });
    html += "</div>";
    // enslen agreement
    html += '<div class="col-md-5"><div class="cs-section-label">Cross-check with Enslen&rsquo;s modes</div>';
    ["AGREE", "PARTIALLY-AGREE", "DISAGREE"].forEach(function (k) {
      html += '<div class="d-flex justify-content-between border-bottom py-1" style="border-color:var(--cs-line)!important">' +
        '<span>' + (k === "AGREE" ? "Agree" : k === "PARTIALLY-AGREE" ? "Partially agree" : "Disagree") + "</span>" +
        '<span class="cs-mono">' + (agr[k] || 0) + "</span></div>";
    });
    html += '<div class="small text-muted mt-2">Partial agreement is expected by design: his mode tracks ' +
      'attitude to the homeland, our relation tracks register.</div></div>';
    html += "</div>";
    document.getElementById("cs-overview").innerHTML = html;
  }

  /* ---------- Significant Words (Enslen's frequency nouns) ---------- */
  function renderSigWords(poems) {
    var SIG = [
      { l: "terra", re: /\bterra/ }, { l: "palmeiras", re: /\bpalmeir/ }, { l: "sabiá", re: /\bsabia/ },
      { l: "céu", re: /\bceu/ }, { l: "flores", re: /\bflor/ }, { l: "amores", re: /\bamor/ },
      { l: "vida", re: /\bvida/ }, { l: "noite", re: /\bnoite/ }, { l: "Deus", re: /\bdeus/ }
    ];
    function dea(s) { return String(s || "").normalize("NFKD").replace(/[̀-ͯ]/g, "").toLowerCase(); }
    var texts = poems.map(function (p) { return dea((p.stanzas || []).map(function (st) { return st.join(" "); }).join(" ")); });
    SIG.forEach(function (w) { w.n = texts.filter(function (t) { return w.re.test(t); }).length; });
    SIG.sort(function (a, b) { return b.n - a.n; });
    var max = SIG[0].n || 1;
    document.getElementById("cs-sigwords").innerHTML = SIG.map(function (w) {
      return '<div class="cs-bar-row"><span class="name">' + esc(w.l) + "</span>" +
        '<span class="cs-bar" style="width:' + Math.max(2, w.n / max * 100) + '%;background:var(--cs-accent-2)"></span>' +
        '<span class="val">' + w.n + "</span></div>";
    }).join("");
  }

  /* ---------- Motifs (INT2 symbols) + modes & devices, all SKOS-grounded ---------- */
  var KOS = {
    Enslen2022: { label: "Enslen, Song of Exile", note: "the poem’s own structural motifs: the template, terra and saudade" },
    FerberDLS2017: { label: "Ferber, Dictionary of Literary Symbols", note: "shared Romantic nature-symbols" },
    PEPP2012: { label: "Modes & devices", note: "genres and rhetorical figures, grounded in the Princeton Encyclopedia of Poetry &amp; Poetics" }
  };
  function renderMotifs(rows) {
    var host = document.getElementById("cs-motifs");
    var total = rows.length;
    // aggregate every concept (symbols + structural motifs + modes/devices) by its SKOS URI
    var typed = {}, order = [];
    function add(r, mc) {
      if (!mc || !mc.concept) return;
      var t = typed[mc.concept];
      if (!t) { t = typed[mc.concept] = { id: mc.concept, label: mc.prefLabel || mc.key, kos: mc.kos, concept: mc.concept, note: mc.note, poems: [] }; order.push(mc.concept); }
      if (t.poems.indexOf(r) === -1) t.poems.push(r);
    }
    rows.forEach(function (r) {
      (r.motifConcepts || []).forEach(function (mc) { add(r, mc); });
      (r.deviceConcepts || []).forEach(function (mc) { add(r, mc); });
    });

    var sel = {};                                            // id -> aggregate, for the poem strip
    order.forEach(function (c) { sel[typed[c].id] = typed[c]; });

    // group by KOS, each group sorted by frequency
    var groups = {};
    order.forEach(function (c) { var t = typed[c]; (groups[t.kos] = groups[t.kos] || []).push(t); });
    Object.keys(groups).forEach(function (k) { groups[k].sort(function (a, b) { return b.poems.length - a.poems.length; }); });
    var maxN = 0; order.forEach(function (c) { maxN = Math.max(maxN, typed[c].poems.length); });

    function conceptRow(t) {
      var w = Math.max(4, t.poems.length / (maxN || 1) * 100);
      return '<button type="button" class="cs-motif-row" data-sel="' + esc(t.id) + '">' +
        '<span class="ml">' + esc(t.label) + "</span>" +
        '<span class="cs-bar" style="width:' + w + '%;background:var(--cs-accent-2)"></span>' +
        '<span class="mn">' + t.poems.length + "</span>" +
        (t.concept ? '<a class="cs-concept" href="' + esc(t.concept) + '" target="_blank" rel="noopener" title="Open the SKOS concept" onclick="event.stopPropagation()">skos</a>' : "") +
        "</button>";
    }

    var html = '<p class="cs-motifs-lede">Each response actualises <strong>motifs</strong> ' +
      '(<code>intro:INT2</code> symbols and themes) and enacts <strong>modes and devices</strong> (genres, ' +
      'rhetorical figures). Every one is bound to a real concept in a shared vocabulary (Ferber, the Enslen ' +
      'set, the Princeton Encyclopedia), so a ratified context carries it into the live graph unchanged; ' +
      'nothing here is free text. Select any concept to see the responses that bear it.</p>' +
      '<div class="row g-4"><div class="col-lg-5"><div class="cs-motif-list">';
    ["Enslen2022", "FerberDLS2017", "PEPP2012"].forEach(function (k) {
      if (!groups[k]) return;
      var meta = KOS[k] || { label: k, note: "" };
      html += '<div class="cs-motif-group"><div class="cs-motif-kos">' + esc(meta.label) +
        ' <span class="src">' + meta.note + "</span></div>" +
        groups[k].map(conceptRow).join("") + "</div>";
    });
    html += '</div></div><div class="col-lg-7"><div class="cs-motif-poems" id="cs-motif-poems"></div></div></div>';
    host.innerHTML = html;

    function select(id) {
      var agg = sel[id];
      host.querySelectorAll("[data-sel]").forEach(function (el) { el.classList.toggle("active", el.getAttribute("data-sel") === id); });
      var strip = document.getElementById("cs-motif-poems");
      if (!agg) { strip.innerHTML = ""; return; }
      var poems = agg.poems.slice().sort(function (a, b) { return (a.year || 0) - (b.year || 0); });
      strip.innerHTML = '<div class="cs-motif-poems-h"><strong>' + poems.length + "</strong> of " + total +
        " responses carry &lsquo;" + esc(agg.label) + "&rsquo;" + (agg.concept ? ' <a class="cs-concept" href="' + esc(agg.concept) + '" target="_blank" rel="noopener">' + esc((agg.concept.split("/").slice(-2).join("/"))) + "</a>" : "") + "</div>" +
        '<div class="cs-motif-poemgrid">' + poems.map(function (r) {
          var col = relColor(r.relation);
          return '<a class="cs-motif-poem" style="--rc:' + col + '" href="/casestudies/dias/text/?id=' + esc(r.id) + '">' +
            '<span class="cs-rel-dot" style="background:' + col + '"></span>' +
            '<span class="t">' + esc(r.title) + "</span>" +
            '<span class="m">' + esc(r.author || "") + " &middot; " + (r.year || "") + " &middot; " + esc(r.country || "") + " &middot; " + esc(r.relation.replace("-", " ")) + "</span></a>";
        }).join("") + "</div>";
    }
    host.querySelectorAll("[data-sel]").forEach(function (el) {
      el.addEventListener("click", function () { select(el.getAttribute("data-sel")); });
    });
    // preselect the most frequent typed concept
    if (order.length) { var top = order.slice().sort(function (a, b) { return typed[b].poems.length - typed[a].poems.length; })[0]; select(typed[top].id); }
  }

  /* ---------- timeline (inline SVG) ---------- */
  function renderTimeline(rows) {
    var host = document.getElementById("cs-timeline");
    var line = cssVar("--bs-border-color") || "#ccc";
    var muted = cssVar("--bs-secondary-color") || "#777";
    var wash = cssVar("--cs-wash") || "#f2e9db";
    var minY = 1846, maxY = 1899, W = 1000, padL = 34, padR = 16, padT = 16, rowH = 12, r = 4.2;
    var byYear = {}, peakY = minY, peakN = 0;
    rows.forEach(function (o) { if (o.year) (byYear[o.year] = byYear[o.year] || []).push(o); });
    Object.keys(byYear).forEach(function (y) { if (byYear[y].length > peakN) { peakN = byYear[y].length; peakY = +y; } });
    var plotH = peakN * rowH, H = padT + plotH + 32;
    function x(y) { return padL + (y - minY) / (maxY - minY) * (W - padL - padR); }

    var s = '<svg viewBox="0 0 ' + W + " " + H + '" width="100%" role="img" ' +
      'aria-label="Timeline of the 88 responses by year" style="max-width:100%;height:auto">';
    // Império / República band split at 1889
    s += '<rect x="' + padL + '" y="' + padT + '" width="' + (x(1889) - padL) + '" height="' + plotH +
      '" fill="' + wash + '" opacity="0.6"></rect>';
    s += '<text x="' + (padL + 4) + '" y="' + (padT + 10) + '" font-size="9" fill="' + muted + '">Império</text>';
    s += '<text x="' + (x(1889) + 4) + '" y="' + (padT + 10) + '" font-size="9" fill="' + muted + '">República</text>';
    // baseline + decade ticks
    s += '<line x1="' + padL + '" y1="' + (padT + plotH) + '" x2="' + (W - padR) + '" y2="' + (padT + plotH) + '" stroke="' + line + '"></line>';
    for (var t = 1850; t <= 1890; t += 10) {
      s += '<line x1="' + x(t) + '" y1="' + (padT + plotH) + '" x2="' + x(t) + '" y2="' + (padT + plotH + 4) + '" stroke="' + line + '"></line>';
      s += '<text x="' + x(t) + '" y="' + (padT + plotH + 16) + '" font-size="10" fill="' + muted + '" text-anchor="middle">' + t + "</text>";
    }
    // dots (stacked per year, strongest confidence at the bottom)
    Object.keys(byYear).forEach(function (y) {
      byYear[y].sort(function (a, b) { return (b.confidence || 0) - (a.confidence || 0); });
      byYear[y].forEach(function (o, i) {
        var cx = x(+y), cy = padT + plotH - (i + 0.5) * rowH, col = relColor(o.relation);
        s += '<a href="/casestudies/dias/text/?id=' + esc(o.id) + '" aria-label="' + esc(o.title) +
          '"><circle class="cs-tl-dot" cx="' + cx.toFixed(1) + '" cy="' + cy.toFixed(1) +
          '" r="' + r + '" fill="' + (o.isResponse ? col : "none") + '" stroke="' + col + '" stroke-width="' + (o.isResponse ? 0 : 1.4) +
          '"' + (o.isResponse ? "" : ' stroke-dasharray="2,1"') +
          ' data-t="' + esc(o.title) + '" data-y="' + y + '" data-r="' + esc(o.relation.replace("-", " ")) + '"></circle></a>';
      });
    });
    s += "</svg>";
    host.innerHTML = '<div class="cs-tl-wrap">' + s + '<div class="cs-tl-tip" hidden></div></div>' +
      '<div class="small text-muted mt-1">Each dot is a response, placed by year and coloured by relation ' +
      "(hollow/dashed = refuted); the reception builds across the century, peaking in " + peakY +
      ". Hover a dot for its title; click to open its context.</div>";

    var wrap = host.querySelector(".cs-tl-wrap"), tip = host.querySelector(".cs-tl-tip"), svgEl = host.querySelector("svg");
    svgEl.addEventListener("mouseover", function (e) {
      var c = e.target.closest && e.target.closest("circle");
      if (!c) return;
      tip.innerHTML = "<strong>" + esc(c.getAttribute("data-t")) + "</strong> &middot; " +
        c.getAttribute("data-y") + " &middot; " + esc(c.getAttribute("data-r"));
      tip.hidden = false;
    });
    svgEl.addEventListener("mousemove", function (e) {
      if (tip.hidden) return;
      var rct = wrap.getBoundingClientRect(), lx = e.clientX - rct.left, ty = e.clientY - rct.top;
      tip.style.left = Math.max(0, Math.min(lx + 12, wrap.clientWidth - tip.offsetWidth - 4)) + "px";
      tip.style.top = (ty - tip.offsetHeight - 8) + "px";
    });
    svgEl.addEventListener("mouseout", function (e) {
      if (e.target.closest && e.target.closest("circle")) tip.hidden = true;
    });
    if (!host.dataset.observed) {
      host.dataset.observed = "1";
      new MutationObserver(function () { renderTimeline(rows); })
        .observe(document.documentElement, { attributes: true, attributeFilter: ["data-bs-theme"] });
    }
  }

  /* ---------- reception network (Cytoscape) ---------- */
  var cy = null;
  function renderNetwork(rows, contexts, byId) {
    if (typeof cytoscape === "undefined") { return; }
    var elements = [];
    elements.push({ data: { id: "origin", label: "Canção do Exílio (1846)", kind: "origin" } });
    var ctxById = {};
    contexts.forEach(function (c) { ctxById[c.poem] = c; });

    rows.forEach(function (r) {
      elements.push({ data: {
        id: r.id, label: r.title, kind: "poem", relation: r.relation,
        conf: r.confidence == null ? 0.5 : r.confidence, refuted: r.isResponse ? 0 : 1
      } });
    });
    // edges: poem-poem reuse clusters (dedup) + an origin anchor for strong verbatim reusers
    var seen = {};
    rows.forEach(function (r) {
      var nb = (ctxById[r.id] && ctxById[r.id].reuseNeighbours) || [];
      nb.forEach(function (n) {
        if (!byId[n.poem]) return;
        var key = [r.id, n.poem].sort().join("|");
        if (seen[key]) return;
        seen[key] = 1;
        elements.push({ data: { source: r.id, target: n.poem, w: 0.6 + (n.sim || 0) } });
      });
      if ((r.anchors && r.anchors.length) || (r.confidence != null && r.confidence >= 0.75)) {
        elements.push({ data: { source: "origin", target: r.id, w: (r.anchors && r.anchors.length) ? 2 : 1, origin: 1 } });
      }
    });

    cy = cytoscape({
      container: document.getElementById("cs-network"),
      elements: elements,
      wheelSensitivity: 0.2,
      style: [
        { selector: "node[kind='poem']", style: {
          "background-color": function (e) { return relColor(e.data("relation")); },
          "width": function (e) { return 16 + e.data("conf") * 30; },
          "height": function (e) { return 16 + e.data("conf") * 30; },
          "label": "data(label)", "font-size": 8, "color": cssVar("--bs-body-color"),
          "text-opacity": 0, "min-zoomed-font-size": 8,
          "text-outline-color": cssVar("--bs-body-bg"), "text-outline-width": 2,
          "text-wrap": "ellipsis", "text-max-width": 90, "text-valign": "bottom", "text-margin-y": 2,
          "border-width": 1, "border-color": "rgba(128,128,128,.35)"
        } },
        { selector: "node[refuted=1]", style: {
          "background-opacity": 0.12, "border-width": 1.5, "border-style": "dashed",
          "border-color": cssVar("--cs-rejected")
        } },
        { selector: "node[kind='origin']", style: {
          "background-color": cssVar("--cs-accent"), "width": 52, "height": 52, "shape": "round-diamond",
          "label": "data(label)", "font-size": 11, "font-weight": "bold", "color": cssVar("--bs-body-color"),
          "text-opacity": 1, "text-valign": "bottom", "text-margin-y": 4,
          "text-outline-color": cssVar("--bs-body-bg"), "text-outline-width": 2
        } },
        { selector: "edge", style: {
          "width": "data(w)", "line-color": cssVar("--cs-line"), "curve-style": "haystack", "opacity": 0.5
        } },
        { selector: "node:selected", style: { "border-width": 3, "text-opacity": 1,
          "border-color": function (e) {
            if (e.data("refuted")) return darken(cssVar("--cs-rejected"), 0.72);
            return darken(e.data("kind") === "origin" ? cssVar("--cs-accent") : relColor(e.data("relation")), 0.62);
          } } },
        { selector: ".hl", style: { "text-opacity": 1 } },
        { selector: ".faded", style: { "opacity": 0.12, "text-opacity": 0 } }
      ],
      layout: { name: "cose", animate: false, padding: 30, nodeRepulsion: 6000, idealEdgeLength: 70, nodeDimensionsIncludeLabels: true }
    });

    // bubbleset hulls grouping the poems by relation (soft, non-interactive; the cytoscape-bubblesets plugin
    // keeps them positioned on pan/zoom). Recoloured on theme change.
    var bb = null, bbPaths = [], hullFocus = null, hullTimer = null;
    function drawRelationHulls(onlyRel) {
      var BS = (typeof CytoscapeBubbleSets !== "undefined" && CytoscapeBubbleSets.BubbleSetsPlugin);
      if (!BS) return;
      try { if (!bb) bb = new BS(cy); } catch (e) { bb = null; return; }
      bbPaths.forEach(function (p) { try { bb.removePath(p); } catch (e) {} });
      bbPaths = [];
      RELATIONS.forEach(function (rel) {
        if (onlyRel && rel !== onlyRel) return;   // on node hover, keep only the hovered node's relation hull
        var coll = cy.nodes("[kind='poem']").filter(function (n) { return n.data("relation") === rel; });
        if (coll.length < 2) return;
        var col = relColor(rel);
        try {
          bbPaths.push(bb.addPath(coll, null, null, {
            virtualEdges: true, interactive: false,
            style: { fill: col, fillOpacity: "0.08", stroke: col, strokeWidth: "1.5", strokeOpacity: "0.55", "pointer-events": "none" }
          }));
        } catch (e) {}
      });
    }
    function applyHull() { drawRelationHulls(hullFocus || undefined); }
    cy.ready(function () { drawRelationHulls(); });
    cy.on("layoutstop", function () { applyHull(); });

    cy.on("tap", "node[kind='poem']", function (evt) {
      renderInspector(byId[evt.target.id()]);
    });
    // hover: fade everything except the node and its neighbours (label them), and keep only the hovered
    // node's relation bubbleset (debounced so moving between nodes doesn't flash the full set back)
    cy.on("mouseover", "node", function (e) {
      var hood = e.target.closedNeighborhood();
      cy.elements().addClass("faded");
      hood.removeClass("faded");
      hood.nodes().addClass("hl");
      if (hullTimer) { clearTimeout(hullTimer); hullTimer = null; }
      var rel = e.target.data("relation") || null;   // origin has no relation -> keep all hulls
      if (rel !== hullFocus) { hullFocus = rel; applyHull(); }
    });
    cy.on("mouseout", "node", function () {
      cy.elements().removeClass("faded");
      cy.nodes().removeClass("hl");
      if (hullTimer) clearTimeout(hullTimer);
      hullTimer = setTimeout(function () { hullFocus = null; applyHull(); hullTimer = null; }, 80);
    });
    // leaving the graph entirely restores every hull at once (cytoscape's node mouseout can miss an off-canvas jump)
    var netEl = document.getElementById("cs-network");
    if (netEl) netEl.addEventListener("mouseleave", function () {
      cy.elements().removeClass("faded"); cy.nodes().removeClass("hl");
      if (hullTimer) { clearTimeout(hullTimer); hullTimer = null; }
      if (hullFocus !== null) { hullFocus = null; applyHull(); }
    });

    function fillLegend() {
      var legend = document.getElementById("cs-legend");
      if (!legend) return;
      legend.innerHTML = RELATIONS.map(function (r) {
        return '<span class="item"><span class="sw" style="background:' + relColor(r) + '"></span>' + r.replace("-", " ") + "</span>";
      }).join("") +
        '<span class="item muted"><span class="sw diamond" style="background:' + cssVar("--cs-accent") + '"></span>the poem</span>' +
        '<span class="item muted"><span class="sw hollow"></span>refuted</span>' +
        '<span class="item muted">node size = confidence</span>' +
        '<span class="item muted">shaded areas = relation groups</span>';
    }
    fillLegend();

    // recolour on theme toggle (labels, halos, node fills, legend)
    new MutationObserver(function () {
      var lc = cssVar("--bs-body-color"), oc = cssVar("--bs-body-bg");
      cy.nodes().style({ "color": lc, "text-outline-color": oc });
      cy.edges().style("line-color", cssVar("--cs-line"));
      cy.nodes("[kind='poem']").forEach(function (n) { n.style("background-color", relColor(n.data("relation"))); });
      cy.nodes("[kind='origin']").style("background-color", cssVar("--cs-accent"));
      fillLegend();
      applyHull();
    }).observe(document.documentElement, { attributes: true, attributeFilter: ["data-bs-theme"] });
  }

  function relDot(rel) { return '<span class="cs-rel-dot" style="background:' + relColor(rel) + '"></span>'; }
  function conceptChip(concept) {
    if (!concept) return "";
    return ' <a class="cs-concept" href="' + esc(concept.id) + '" target="_blank" rel="noopener" ' +
      'title="INT3 type · SKOS concept in the RPPA vocabulary">' + esc(concept.prefLabel) + "</a>";
  }
  function tplChip(t) {
    if (!t || !t.label || t.label === "—") return "";
    return ' <span class="cs-concept" title="Syntactic template (Enslen &amp; Bell 2024): degree of reuse of ' +
      '&ldquo;Minha terra tem palmeiras&rdquo;">' + esc(t.label) + "</span>";
  }
  function motifChips(r) {
    // all SKOS-grounded: symbols/structural motifs (INT2) + modes & devices (PEPP). No raw free text.
    return (r.motifConcepts || []).concat(r.deviceConcepts || []).map(function (m) {
      return '<a class="cs-motif" href="' + esc(m.concept) + '" target="_blank" rel="noopener" title="SKOS · ' +
        esc(m.kos) + '">' + esc(m.prefLabel) + "</a>";
    }).join("");
  }
  function confMeter(c) {
    return '<span class="cs-conf"><span class="track"><span class="fill" style="width:' +
      Math.round((c == null ? 0 : c) * 100) + "%;background:" + confColor(c) + '"></span></span>' +
      '<span class="pct">' + pct(c) + "</span></span>";
  }
  function statusChip(r) {
    var cls = "status-" + r.status + (r.isResponse ? "" : " refuted");
    var label = !r.isResponse ? "refuted" : r.status;
    return '<span class="cs-chip ' + cls + '">' + esc(label) + "</span>";
  }

  function renderInspector(r) {
    if (!r) return;
    var host = document.getElementById("cs-inspector");
    var ev = r.evidence || {};
    var html = '<div class="d-flex justify-content-between align-items-start mb-1">' +
      '<div class="title cs-serif" style="font-size:1.15rem">' + esc(r.title) + "</div>" + statusChip(r) + "</div>";
    html += '<div class="meta mb-2">' + esc(r.author) + " &middot; " + (r.year || "") +
      (r.country ? " &middot; " + esc(r.country) : "") + "</div>";
    html += '<div class="d-flex align-items-center gap-2 mb-1 flex-wrap"><span class="rel">' + relDot(r.relation) + " " +
      esc(r.relation.replace("-", " ")) + (r.relationSecondary ? " <span class='text-muted'>+ " + esc(r.relationSecondary) + "</span>" : "") +
      "</span>" + confMeter(r.confidence) + "</div>";
    if (r.relationConcept) html += '<div class="mb-2" style="font-size:.76rem">INT3 type:' + conceptChip(r.relationConcept) + "</div>";
    if (r.motifConcepts.length || r.deviceConcepts.length) html += '<div class="cs-motifs mb-2">' + motifChips(r) + "</div>";
    html += '<p class="rationale">' + esc(r.rationale) + "</p>";
    if (ev.diasLine || ev.poemLine) {
      html += '<div class="cs-evidence"><div class="pair"><span class="cs-verse dias">' + esc(ev.diasLine) +
        '</span><span class="cs-verse">' + esc(ev.poemLine) + "</span></div></div>";
    }
    if (r.anchors && r.anchors.length) {
      html += '<div class="mt-2 small text-muted">Verbatim reuse:</div><div>' +
        r.anchors.slice(0, 4).map(function (a) { return '<span class="cs-frag cs-mono">' + esc(a) + "</span> "; }).join("") + "</div>";
    }
    html += '<div class="cs-evidence mt-2 cs-enslen">Enslen: <span class="agree">' + esc(r.enslen.mode || "—") + "</span> " +
      "(coef " + (r.enslen.coefficient != null ? r.enslen.coefficient : "—") + ")" +
      (r.agreement ? " &middot; " + esc(r.agreement.toLowerCase().replace("-", " ")) : "") + "</div>";
    if (!r.isResponse) html += '<div class="cs-evidence mt-2 small" style="color:var(--cs-rejected)">Refuted: ' + esc(r.verdictReason) + "</div>";
    html += '<div class="mt-2"><a href="/casestudies/dias/text/?id=' + esc(r.id) + '">Open full context &rsaquo;</a></div>';
    host.innerHTML = html;
  }

  /* ---------- evidence browser ---------- */
  function renderEvidence(rows) {
    // toolbar
    var tb = document.getElementById("cs-toolbar");
    tb.innerHTML =
      '<input id="cs-search" type="search" class="form-control form-control-sm cs-filter" style="max-width:16rem" placeholder="Search poems, authors, motifs…">' +
      '<select id="cs-relf" class="form-select form-select-sm cs-filter" style="max-width:11rem"><option value="">All relations</option>' +
      RELATIONS.map(function (r) { return '<option value="' + r + '">' + r.replace("-", " ") + "</option>"; }).join("") + "</select>" +
      '<select id="cs-sort" class="form-select form-select-sm cs-filter" style="max-width:12rem">' +
      '<option value="year">Sort: chronological</option><option value="conf">Sort: confidence</option>' +
      '<option value="coef">Sort: Enslen coefficient</option></select>' +
      '<div class="form-check form-check-inline ms-1"><input class="form-check-input" type="checkbox" id="cs-contested"><label class="form-check-label small" for="cs-contested">Contested / low-confidence only</label></div>' +
      '<span id="cs-count" class="ms-auto small text-muted"></span>';

    var grid = document.getElementById("cs-evidence");
    grid.innerHTML = rows.map(cardHTML).join("");

    function apply() {
      var q = (document.getElementById("cs-search").value || "").toLowerCase();
      var rel = document.getElementById("cs-relf").value;
      var sort = document.getElementById("cs-sort").value;
      var contested = document.getElementById("cs-contested").checked;
      var shown = 0;
      var cards = Array.prototype.slice.call(grid.children);
      cards.forEach(function (el) {
        var d = el.dataset;
        var ok = (!rel || d.relation === rel) &&
          (!contested || d.refuted === "1" || parseFloat(d.conf) < 0.5) &&
          (!q || d.search.indexOf(q) !== -1);
        el.style.display = ok ? "" : "none";
        if (ok) shown++;
      });
      cards.sort(function (a, b) {
        if (sort === "conf") return parseFloat(b.dataset.conf) - parseFloat(a.dataset.conf);
        if (sort === "coef") return parseFloat(b.dataset.coef || 0) - parseFloat(a.dataset.coef || 0);
        return parseFloat(a.dataset.year || 0) - parseFloat(b.dataset.year || 0);
      }).forEach(function (el) { grid.appendChild(el); });
      document.getElementById("cs-count").textContent = shown + " of " + rows.length + " shown";
    }
    ["cs-search", "cs-relf", "cs-sort", "cs-contested"].forEach(function (id) {
      var el = document.getElementById(id);
      el.addEventListener(el.tagName === "INPUT" && el.type === "search" ? "input" : "change", apply);
    });
    apply();
  }

  function cardHTML(r) {
    var ev = r.evidence || {};
    var search = (r.title + " " + r.author + " " + r.relation + " " + r.motifs.join(" ") + " " + r.rationale).toLowerCase();
    var html = '<div class="cs-card' + (r.isResponse ? "" : " is-refuted") + '" id="card-' + r.id +
      '" data-relation="' + r.relation + '" data-status="' + r.status + '" data-conf="' + (r.confidence == null ? 0 : r.confidence) +
      '" data-coef="' + (r.enslen.coefficient || 0) + '" data-year="' + (r.year || 0) + '" data-refuted="' + (r.isResponse ? 0 : 1) +
      '" data-search="' + esc(search) + '" style="border-left-color:' + relColor(r.relation) + '">';
    html += '<div class="head"><div><a class="title" href="/casestudies/dias/text/?id=' + esc(r.id) + '">' + esc(r.title) + "</a>" +
      (r.altTitle && r.altTitle !== r.title ? '<div class="meta">also: ' + esc(r.altTitle) + "</div>" : "") + "</div>" + statusChip(r) + "</div>";
    html += '<div class="meta">' + esc(r.author) + " &middot; " + (r.year || "") + (r.country ? " &middot; " + esc(r.country) : "") +
      (r.enslen.catalog ? ' &middot; <span class="cs-mono">Enslen #' + r.enslen.catalog + "</span>" : "") + "</div>";
    html += '<div class="d-flex align-items-center gap-2 flex-wrap"><span class="rel">' + relDot(r.relation) + " " +
      esc(r.relation.replace("-", " ")) + (r.relationSecondary ? " <span class='text-muted'>+ " + esc(r.relationSecondary) + "</span>" : "") +
      "</span>" + conceptChip(r.relationConcept) + tplChip(r.template) + confMeter(r.confidence) + "</div>";
    if (r.motifConcepts.length || r.deviceConcepts.length) html += '<div class="cs-motifs">' + motifChips(r) + "</div>";
    html += '<div class="rationale">' + esc(r.rationale) + "</div>";
    if (ev.diasLine || ev.poemLine) {
      html += '<div class="cs-evidence"><div class="pair"><span class="cs-verse dias">' + esc(ev.diasLine) +
        '</span><span class="cs-verse">' + esc(ev.poemLine) + "</span></div>";
      html += '<div class="cs-enslen mt-1">Enslen <span class="agree">' + esc(r.enslen.mode || "—") + "</span> " +
        (r.enslen.coefficient != null ? "(coef " + r.enslen.coefficient + ")" : "") +
        (r.agreement ? " &middot; " + esc(r.agreement.toLowerCase().replace("-", " ")) : "") + "</div></div>";
    }
    html += "</div>";
    return html;
  }
})();
