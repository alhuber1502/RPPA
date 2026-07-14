/* casestudy-map.js: the Lusophone-global reception map for the Dias case study.
   Places each response by author country, distributed across the period's real literary centres
   (within-country placement is schematic, since we hold country-level provenance for most poems), and
   layers over it: a TIMELINE slider that plays the reception across the century, relation-coloured
   PROPAGATION arcs from the origin (Rio), a textual-reuse AFFINITY web, and soft country TERRITORY
   hulls (the map analogue of the network's bubblesets). Theme-aware CartoDB basemap. Standalone. */
(function () {
  "use strict";
  if (typeof L === "undefined") return;

  var BASE = "/data/casestudies/dias/";
  var RELATIONS = ["imitation", "parody", "homage", "reply", "quotation", "thematic-echo", "elegy"];
  var ORIGIN = [-22.91, -43.20];                        // Rio de Janeiro (Dias published in Niterói)
  var MIN_YEAR = 1846, MAX_YEAR = 1898;                 // 1846 = the origin; responses 1847–1898
  var WORLD = [[-85, -180], [85, 180]];
  var PLACE = { "Nova Goa": [15.50, 73.83] };           // the one finer-grained locality we hold
  // Poets whose real birthplaces we know: pinned to actual coords, overriding the schematic placement.
  var KNOWN = {
    "cdex-a001": [-22.906, -43.196],  // Machado de Assis — Rio de Janeiro
    "cdex-a002": [-8.838, 13.234],    // José da Silva Maia Ferreira — Luanda
    "cdex-a003": [-22.591, -41.990],  // Casimiro de Abreu — Barra de São João, RJ
    "cdex-a004": [37.741, -25.668]    // Antero de Quental — Ponta Delgada, Azores
  };

  // Real literary centres per country (lat, lng, weight). Poems are distributed across these so
  // the clouds sit ON land near real cities rather than floating in the ocean off a centroid.
  var CITIES = {
    BR: [["Rio de Janeiro", -22.91, -43.20, 4], ["São Paulo", -23.55, -46.63, 2],
         ["Salvador", -12.97, -38.51, 2], ["Recife", -8.05, -34.88, 2],
         ["São Luís", -2.53, -44.30, 2], ["Fortaleza", -3.73, -38.52, 1],
         ["Belém", -1.46, -48.49, 1], ["Ouro Preto", -20.39, -43.51, 1],
         ["Porto Alegre", -30.03, -51.23, 1], ["Desterro", -27.59, -48.55, 1]],
    PT: [["Lisboa", 38.72, -9.14, 3], ["Porto", 41.15, -8.61, 2],
         ["Coimbra", 40.21, -8.43, 2], ["Braga", 41.55, -8.43, 1]],
    AO: [["Luanda", -8.84, 13.23, 2], ["Benguela", -12.58, 13.41, 1]],
    IN: [["Nova Goa", 15.50, 73.83, 1]]
  };
  var JITR = { BR: 0.30, PT: 0.16, AO: 0.18, IN: 0.10 }; // small phyllotaxis spread within each city

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }
  function cssVar(n) { return getComputedStyle(document.documentElement).getPropertyValue(n).trim(); }
  function relColor(r) { return cssVar("--rel-" + (r || "imitation")) || cssVar("--cs-accent"); }
  function darken(color, f) {
    var m = (color || "").trim().match(/^#?([0-9a-f]{6})$/i);
    if (!m) return color;
    var n = parseInt(m[1], 16);
    return "rgb(" + Math.round(((n >> 16) & 255) * f) + "," + Math.round(((n >> 8) & 255) * f) + "," + Math.round((n & 255) * f) + ")";
  }
  function phyllo(c, k, base) {                          // deterministic rosette around a point
    var r = base * Math.sqrt(k + 0.35), th = k * 2.399963;
    return [c[0] + r * Math.cos(th), c[1] + r * Math.sin(th) / Math.max(0.35, Math.cos(c[0] * Math.PI / 180))];
  }

  Promise.all([
    fetch(BASE + "poems.json").then(function (r) { return r.json(); }),
    fetch(BASE + "contexts.json").then(function (r) { return r.json(); }),
    fetch(BASE + "authors.json").then(function (r) { return r.json(); }),
    fetch(BASE + "territories.geojson").then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; })
  ]).then(function (res) { build(res[0], res[1], res[2], res[3]); })
    .catch(function (e) { document.getElementById("cs-map").innerHTML = '<div class="alert alert-warning m-3">Could not load the map. ' + esc(e.message) + "</div>"; });

  function build(poems, contexts, authors, terr) {
    var ctxById = {}, authById = {};
    contexts.forEach(function (c) { ctxById[c.poem] = c; });
    authors.forEach(function (a) { authById[a.id] = a; });
    var rows = poems.map(function (p) {
      var c = ctxById[p.id] || {}, a = authById[p.author] || {}, v = (c.provenance || {}).verdict || {};
      return {
        id: p.id, title: p.title || p.altTitle || "[untitled]", author: a.name || p.authorName,
        authorId: p.author,
        year: p.year || c.temporal, country: (c.spatial || {}).country || a.country,
        place: (c.spatial || {}).place || a.place,
        relation: (c.relation || {}).primary || "thematic-echo",
        isResponse: v.isResponse !== false,
        reuseNeighbours: c.reuseNeighbours || []
      };
    });
    var rowById = {}; rows.forEach(function (r) { rowById[r.id] = r; });

    // undirected reuse adjacency, for the hover neighbourhood spotlight (analogous to the network view)
    var adj = {};
    rows.forEach(function (r) {
      adj[r.id] = adj[r.id] || {};
      (r.reuseNeighbours || []).forEach(function (n) {
        if (!rowById[n.poem]) return;
        adj[r.id][n.poem] = 1; adj[n.poem] = adj[n.poem] || {}; adj[n.poem][r.id] = 1;
      });
    });

    /* ---- placement: pin known birthplaces, then distribute the rest across literary centres ---- */
    rows.forEach(function (r) { if (KNOWN[r.authorId]) { r.coord = KNOWN[r.authorId].slice(); r.pinned = true; } });
    var byCountry = {};
    rows.forEach(function (r) { if (r.coord) return; (byCountry[r.country] = byCountry[r.country] || []).push(r); });
    Object.keys(byCountry).forEach(function (country) {
      var list = byCountry[country].slice().sort(function (a, b) { return a.id < b.id ? -1 : 1; });
      var cities = CITIES[country] || [[country, 0, 0, 1]];
      var pool = [];
      cities.forEach(function (c) { for (var i = 0; i < (c[3] || 1); i++) pool.push(c); });
      var buckets = {};
      list.forEach(function (r, idx) {
        var key, ll;
        if (r.place && PLACE[r.place]) { key = "P:" + r.place; ll = PLACE[r.place]; }
        else { var c = pool[idx % pool.length]; key = c[0]; ll = [c[1], c[2]]; }
        (buckets[key] = buckets[key] || { ll: ll, items: [] }).items.push(r);
      });
      Object.keys(buckets).forEach(function (k) {
        var b = buckets[k];
        b.items.forEach(function (r, j) {
          r.coord = (b.items.length === 1) ? b.ll.slice() : phyllo(b.ll, j, JITR[country] || 0.25);
        });
      });
    });

    /* ---- map ---- */
    var map = L.map("cs-map", {
      minZoom: 3, maxZoom: 8, maxBounds: WORLD, maxBoundsViscosity: 1.0,
      worldCopyJump: false, scrollWheelZoom: true, zoomControl: true
    });
    var tiles = null;
    function setTiles() {
      if (tiles) map.removeLayer(tiles);
      var dark = (document.documentElement.getAttribute("data-bs-theme") === "dark");
      tiles = L.tileLayer("https://{s}.basemaps.cartocdn.com/" + (dark ? "dark_all" : "light_all") + "/{z}/{x}/{y}{r}.png",
        { subdomains: "abcd", minZoom: 3, maxZoom: 8, noWrap: true, bounds: WORLD, attribution: '&copy; OpenStreetMap &copy; CARTO' }).addTo(map);
    }
    setTiles();

    var hullLayer = L.layerGroup().addTo(map);
    var webLayer = L.layerGroup().addTo(map);
    var arcLayer = L.layerGroup().addTo(map);
    var markerLayer = L.layerGroup().addTo(map);

    /* ---- persistent markers (created once; membership toggled by the timeline) ---- */
    rows.forEach(function (r) {
      r.marker = L.circleMarker(r.coord, { radius: 5.5, weight: 1, opacity: 1 });
      r.marker.bindPopup('<div style="min-width:170px"><strong>' + esc(r.title) + "</strong><br>" +
        '<span class="text-muted">' + esc(r.author) + " &middot; " + (r.year || "") + " &middot; " + esc(r.country || "") + "</span><br>" +
        '<span style="text-transform:capitalize">' + esc(r.relation.replace("-", " ")) + (r.isResponse ? "" : " (refuted)") + "</span><br>" +
        '<a href="/casestudies/dias/text/?id=' + esc(r.id) + '">Open context &rsaquo;</a></div>');
      r.marker.bindTooltip(esc(r.title), { direction: "top", offset: [0, -4], className: "cs-map-tip", opacity: 1 });
      r.marker.on("mouseover", function () { setHover(r.id); });
      r.marker.on("mouseout", function () { clearHover(); });
      r._added = false;
    });
    var origin = L.circleMarker(ORIGIN, { radius: 9, weight: 2, fillOpacity: 1 }).addTo(map);
    origin.bindPopup('<strong>Gon&ccedil;alves Dias, <em>Can&ccedil;&atilde;o do Ex&iacute;lio</em></strong><br><span class="text-muted">Rio de Janeiro / Niter&oacute;i, 1846 (the origin)</span>');
    origin.bindTooltip('Can&ccedil;&atilde;o do Ex&iacute;lio (origin)', { direction: "top", offset: [0, -6], className: "cs-map-tip", opacity: 1 });
    function styleOrigin() { origin.setStyle({ fillColor: cssVar("--cs-accent"), color: darken(cssVar("--cs-accent"), 0.6) }); }

    /* ---- state ---- */
    var curYear = MAX_YEAR, focusRel = null, lockedRel = null, playing = false, timer = null;
    var layersOn = { territories: true, propagation: true, affinity: false };
    var hoverId = null, openedTips = [];

    /* ---- hover neighbourhood (mute the rest, label the connected, like the network) ---- */
    function openHoverTips(id) {
      closeHoverTips();
      var set = {}; set[id] = 1;
      Object.keys(adj[id] || {}).forEach(function (nid) { set[nid] = 1; });
      Object.keys(set).forEach(function (pid) { var r = rowById[pid]; if (r && r._added) { r.marker.openTooltip(); openedTips.push(r.marker); } });
      origin.openTooltip(); openedTips.push(origin);
    }
    function closeHoverTips() { openedTips.forEach(function (m) { m.closeTooltip(); }); openedTips = []; }
    function setHover(id) { hoverId = id; redraw(); openHoverTips(id); }
    function clearHover() { closeHoverTips(); hoverId = null; redraw(); }

    /* ---- geometry helpers ---- */
    function arcPts(a, b, k) {                            // quadratic-bezier arc, bowed perpendicular
      var dlat = b[0] - a[0], dlng = b[1] - a[1], len = Math.sqrt(dlat * dlat + dlng * dlng) || 1;
      var cx = (a[0] + b[0]) / 2 + (-dlng / len) * len * k, cy = (a[1] + b[1]) / 2 + (dlat / len) * len * k;
      cx = Math.max(-80, Math.min(80, cx));
      var out = [];
      for (var t = 0; t <= 1.0001; t += 0.05) { var u = 1 - t; out.push([u * u * a[0] + 2 * u * t * cx + t * t * b[0], u * u * a[1] + 2 * u * t * cy + t * t * b[1]]); }
      return out;
    }

    function relDim(rel) { return focusRel && rel !== focusRel; }
    function styleMarker(r) {
      var col = relColor(r.relation), mute, emph = false;
      if (hoverId) { var inNb = (r.id === hoverId) || (adj[hoverId] && adj[hoverId][r.id]); mute = !inNb; emph = (r.id === hoverId); }
      else { mute = relDim(r.relation); }
      r.marker.setStyle({
        fillColor: r.isResponse ? col : "transparent", color: col,
        weight: r.isResponse ? (emph ? 2 : 1) : 1.6,
        fillOpacity: r.isResponse ? (mute ? 0.1 : 0.85) : (mute ? 0.04 : 0.15),
        opacity: mute ? 0.25 : 1, dashArray: r.isResponse ? null : "3,2"
      });
      r.marker.setRadius(emph ? 8 : ((playing && r.year === curYear) ? 8 : 5.5));
    }

    function redraw() {
      var arrived = rows.filter(function (r) { return r.year <= curYear; });
      rows.forEach(function (r) {
        var on = r.year <= curYear;
        if (on && !r._added) { markerLayer.addLayer(r.marker); r._added = true; }
        else if (!on && r._added) { markerLayer.removeLayer(r.marker); r._added = false; }
        if (on) styleMarker(r);
      });
      // propagation arcs (origin → poem, coloured by relation)
      arcLayer.clearLayers();
      if (layersOn.propagation) {
        arrived.forEach(function (r) {
          var dim = hoverId ? (r.id !== hoverId) : relDim(r.relation);
          L.polyline(arcPts(ORIGIN, r.coord, 0.12), {
            color: relColor(r.relation), weight: dim ? 0.5 : (hoverId ? 1.8 : 1.3), opacity: dim ? 0.06 : (hoverId ? 0.85 : 0.5), interactive: false
          }).addTo(arcLayer);
        });
      }
      // reuse-affinity web (textual similarity between responses)
      webLayer.clearLayers();
      if (layersOn.affinity) {
        var inSet = {}; arrived.forEach(function (r) { inSet[r.id] = 1; });
        var seen = {};
        arrived.forEach(function (r) {
          (r.reuseNeighbours || []).forEach(function (n) {
            var o = rowById[n.poem]; if (!o || !inSet[n.poem]) return;
            var key = r.id < n.poem ? r.id + "|" + n.poem : n.poem + "|" + r.id; if (seen[key]) return; seen[key] = 1;
            if (focusRel && r.relation !== focusRel && o.relation !== focusRel) return;
            if (hoverId && r.id !== hoverId && n.poem !== hoverId) return;
            L.polyline([r.coord, o.coord], {
              color: cssVar("--cs-muted"), weight: 0.8, opacity: Math.min(0.5, 0.14 + (n.sim || 0) * 0.4),
              dashArray: "2,3", interactive: false
            }).addTo(webLayer);
          });
        });
      }
      // hover: draw the hovered poem's reuse links explicitly, even when the web layer is off
      if (hoverId && rowById[hoverId] && rowById[hoverId]._added) {
        var hr = rowById[hoverId];
        Object.keys(adj[hoverId] || {}).forEach(function (nid) {
          var o = rowById[nid]; if (!o || o.year > curYear) return;
          L.polyline([hr.coord, o.coord], { color: relColor(hr.relation), weight: 1.6, opacity: 0.85, interactive: false }).addTo(webLayer);
        });
      }
      // country territories (real outlines of the countries the reception has reached)
      hullLayer.clearLayers();
      if (layersOn.territories && terr) {
        var reached = {}; arrived.forEach(function (r) { if (focusRel && r.relation !== focusRel) return; reached[r.country] = 1; });
        var feats = terr.features.filter(function (f) { return reached[f.properties.code]; });
        if (feats.length) {
          var tint = cssVar("--cs-muted");
          L.geoJSON({ type: "FeatureCollection", features: feats }, {
            interactive: false,
            style: { color: tint, weight: 1, opacity: 0.5, dashArray: "4,4", fill: true, fillColor: tint, fillOpacity: 0.05 }
          }).addTo(hullLayer);
        }
      }
      updateReadout(arrived.length);
    }

    function updateReadout(n) {
      var yv = document.getElementById("cs-year-val"); if (yv) yv.textContent = curYear;
      var yn = document.getElementById("cs-year-n"); if (yn) yn.textContent = n;
      var era = document.getElementById("cs-era");
      if (era) { var rep = curYear > 1889; era.textContent = rep ? "Republic" : "Empire"; era.className = "cs-era " + (rep ? "republic" : "empire"); }
      var sl = document.getElementById("cs-year"); if (sl && +sl.value !== curYear) sl.value = curYear;
      updateTicker();
    }
    // "new this year": the responses whose year is the scrubbed/played year
    function updateTicker() {
      var el = document.getElementById("cs-ticker"); if (!el) return;
      var fresh = rows.filter(function (r) { return r.year === curYear; });
      if (!fresh.length) { el.innerHTML = '<span class="yr">' + curYear + '</span> <span class="muted">no new responses</span>'; return; }
      fresh.sort(function (a, b) { return a.id < b.id ? -1 : 1; });
      var shown = fresh.slice(0, 3).map(function (r) {
        return '<span class="it"><span class="cs-rel-dot" style="background:' + relColor(r.relation) + '"></span>' + esc(r.author || r.title) + "</span>";
      }).join("");
      var more = fresh.length > 3 ? '<span class="muted">+' + (fresh.length - 3) + " more</span>" : "";
      el.innerHTML = '<span class="yr">' + curYear + '</span> <span class="n">' + fresh.length + " new</span>" + shown + more;
    }

    /* ---- controls ---- */
    var playBtn = document.getElementById("cs-play");
    function stop() { playing = false; if (timer) { clearInterval(timer); timer = null; } if (playBtn) playBtn.textContent = "▶"; }
    function play() {
      if (timer) { stop(); redraw(); return; }
      playing = true; if (playBtn) playBtn.textContent = "❚❚";
      if (curYear >= MAX_YEAR) curYear = MIN_YEAR;
      timer = setInterval(function () {
        curYear++;
        if (curYear >= MAX_YEAR) { curYear = MAX_YEAR; redraw(); stop(); return; }
        redraw();
      }, 430);
      redraw();
    }
    if (playBtn) playBtn.addEventListener("click", play);
    var slider = document.getElementById("cs-year");
    if (slider) {
      slider.min = MIN_YEAR; slider.max = MAX_YEAR; slider.value = MAX_YEAR;
      slider.addEventListener("input", function () { stop(); curYear = +this.value; redraw(); });
    }
    document.querySelectorAll(".cs-toggle[data-layer]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var k = btn.getAttribute("data-layer");
        layersOn[k] = !layersOn[k];
        btn.setAttribute("aria-pressed", layersOn[k] ? "true" : "false");
        redraw();
      });
    });

    /* ---- legend (doubles as relation highlighter) ---- */
    function setFocus(rel) { focusRel = rel; syncLegend(); redraw(); }
    function syncLegend() {
      document.querySelectorAll("#cs-legend .item[data-rel]").forEach(function (el) {
        var r = el.getAttribute("data-rel");
        el.classList.toggle("on", lockedRel === r);
        el.classList.toggle("dim", !!focusRel && focusRel !== r);
      });
    }
    var legend = document.getElementById("cs-legend");
    if (legend) {
      legend.innerHTML = RELATIONS.map(function (r) {
        return '<span class="item" data-rel="' + r + '" title="Highlight ' + r.replace("-", " ") + ' (click to lock)"><span class="sw" style="background:' + relColor(r) + '"></span>' + r.replace("-", " ") + "</span>";
      }).join("") +
        '<span class="item muted" style="cursor:default"><span class="sw" style="background:' + cssVar("--cs-accent") + '"></span>the poem (Rio)</span>' +
        '<span class="item muted" style="cursor:default"><span class="sw hollow"></span>refuted</span>';
      legend.querySelectorAll(".item[data-rel]").forEach(function (el) {
        var r = el.getAttribute("data-rel");
        el.addEventListener("mouseenter", function () { if (!lockedRel) setFocus(r); });
        el.addEventListener("mouseleave", function () { if (!lockedRel) setFocus(null); });
        el.addEventListener("click", function () { lockedRel = (lockedRel === r) ? null : r; setFocus(lockedRel); });
      });
    }

    /* ---- go ---- */
    styleOrigin();
    var all = rows.map(function (r) { return r.coord; }).concat([ORIGIN]);
    map.fitBounds(L.latLngBounds(all).pad(0.12));
    redraw();
    new MutationObserver(function () { setTiles(); styleOrigin(); if (legend) { legend.querySelectorAll(".sw").forEach(function (sw, i) { if (i < RELATIONS.length) sw.style.background = relColor(RELATIONS[i]); }); } redraw(); })
      .observe(document.documentElement, { attributes: true, attributeFilter: ["data-bs-theme"] });
  }
})();
