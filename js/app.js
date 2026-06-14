
(() => {
  const $ = id => document.getElementById(id);
  const zones = window.JAD_ZONES || [];
  const outputs = window.JAD_OUTPUTS || [];
  const layers = window.JAD_LAYERS || {};
  const markers = new Map();
  const relicMarkers = new Map();
  const trapMarkers = new Map();

  let selectedId = null;
  let filterMin = 0;
  let danger = 0;
  let sanity = 100;
  let entered = false;
  let muted = false;
  let gameActive = false;
  let collected = new Set();
  let currentTrack = null;

  const audioPaths = {
    ambience: "assets/audio/user/ambience_loop.wav",
    whisper: "assets/audio/user/whisper.wav",
    thunder: "assets/audio/user/thunder.wav",
    heartbeat: "assets/audio/user/heartbeat.wav",
    wind: "assets/audio/user/whisper.wav",
    pocong: "assets/audio/user/pocong_thud.wav",
    scream: "assets/audio/user/scream.wav",
    kunti: "assets/audio/user/kunti_laugh.wav",
    genderuwo: "assets/audio/user/genderuwo_growl.wav"
  };
  const audios = {};
  Object.entries(audioPaths).forEach(([k, src]) => {
    const a = new Audio(src);
    a.preload = "auto";
    a.loop = k === "ambience" || k === "heartbeat";
    a.volume = k === "ambience" ? 0.28 : 0.55;
    audios[k] = a;
  });

  const style = {
    version: 8,
    sources: {
      osm: {
        type: "raster",
        tiles: [
          "https://a.tile.openstreetmap.org/{z}/{x}/{y}.png",
          "https://b.tile.openstreetmap.org/{z}/{x}/{y}.png",
          "https://c.tile.openstreetmap.org/{z}/{x}/{y}.png"
        ],
        tileSize: 256,
        attribution: "© OpenStreetMap contributors"
      }
    },
    layers: [
      { id: "osm", type: "raster", source: "osm", paint: {
        "raster-saturation": -0.9,
        "raster-contrast": 0.18,
        "raster-brightness-min": 0.05,
        "raster-brightness-max": 0.58
      }}
    ]
  };

  const map = new maplibregl.Map({
    container: "map",
    style,
    center: [110.365, -7.805],
    zoom: 12,
    pitch: 58,
    bearing: -18,
    antialias: true
  });
  map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), "bottom-right");

  function fc(features){ return { type: "FeatureCollection", features }; }
  function lineFeature(r){ return { type: "Feature", properties: { id:r.id, name:r.name, color:r.color }, geometry: { type:"LineString", coordinates:r.coordinates } }; }
  function polygonFeature(z){ return { type:"Feature", properties:{ id:z.id, name:z.name, level:z.level }, geometry:{ type:"Polygon", coordinates:z.coordinates } }; }
  function square(c, d){
    const [x,y] = c;
    return [[x-d,y-d],[x+d,y-d],[x+d,y+d],[x-d,y+d],[x-d,y-d]];
  }
  function zonePoly(z){
    const d = z.id.includes("selarong") ? 0.006 : z.id.includes("kotagede") ? 0.0045 : 0.0032;
    return { type:"Feature", properties:{ id:z.id, zona:z.zona, lokasi:z.lokasi, tema:z.tema }, geometry:{ type:"Polygon", coordinates:[square(z.coordinates, d)] } };
  }
  function columnFeature(z){
    return { type:"Feature", properties:{ id:z.id, height: Math.max(70, z.hauntedIndex * 2.8), color: z.risk === "tinggi" ? "#7d0030" : "#40156f" }, geometry:{ type:"Polygon", coordinates:[square(z.coordinates, 0.00065)] } };
  }

  function markerClass(score){
    if(score >= 82) return "high";
    if(score >= 70) return "medium";
    return "low";
  }

  map.on("load", () => {
    map.addSource("jad-zones", { type:"geojson", data: fc(zones.map(zonePoly)) });
    map.addLayer({ id:"jad-zones-fill", type:"fill", source:"jad-zones", paint:{ "fill-color":"#7d2cff", "fill-opacity":0.10 }});
    map.addLayer({ id:"jad-zones-line", type:"line", source:"jad-zones", paint:{ "line-color":"#cda7ff", "line-width":2, "line-opacity":0.65 }});

    map.addSource("jad-routes", { type:"geojson", data: fc((layers.routes || []).map(lineFeature)) });
    map.addLayer({ id:"jad-routes-glow", type:"line", source:"jad-routes", paint:{ "line-color":["get","color"], "line-width":10, "line-opacity":0.22, "line-blur":4 }});
    map.addLayer({ id:"jad-routes", type:"line", source:"jad-routes", paint:{ "line-color":["get","color"], "line-width":3.5, "line-opacity":0.92, "line-dasharray":[1.2,1] }});

    map.addSource("jad-risk", { type:"geojson", data: fc((layers.riskZones || []).map(polygonFeature)) });
    map.addLayer({ id:"jad-risk-fill", type:"fill", source:"jad-risk", paint:{ "fill-color":"#ff164f", "fill-opacity":0.16 }});
    map.addLayer({ id:"jad-risk-line", type:"line", source:"jad-risk", paint:{ "line-color":"#ff164f", "line-width":2.2, "line-opacity":0.72 }});

    map.addSource("jad-safe", { type:"geojson", data: fc((layers.safeZones || []).map(polygonFeature)) });
    map.addLayer({ id:"jad-safe-fill", type:"fill", source:"jad-safe", paint:{ "fill-color":"#31ff9a", "fill-opacity":0.12 }});
    map.addLayer({ id:"jad-safe-line", type:"line", source:"jad-safe", paint:{ "line-color":"#31ff9a", "line-width":2, "line-opacity":0.6 }});

    map.addSource("jad-3d", { type:"geojson", data: fc(zones.map(columnFeature)) });
    map.addLayer({ id:"jad-3d", type:"fill-extrusion", source:"jad-3d", minzoom:10, paint:{
      "fill-extrusion-color":["get","color"],
      "fill-extrusion-height":["get","height"],
      "fill-extrusion-base":0,
      "fill-extrusion-opacity":0.74
    }});

    renderZoneTable();
    renderOutputTable();
    addZoneMarkers();
    addGameMarkers();
    renderList(filterZones());
    fitAll();
    setLayerVisibility();
    $("mZone").textContent = zones.length;
    $("mOutput").textContent = outputs.length;
    toast("Prototype dimuat: 5 zona studi dan 6 output target.");
  });

  function renderZoneTable(){
    const tbody = $("zoneTable").querySelector("tbody");
    tbody.innerHTML = zones.map(z => `<tr data-id="${z.id}"><td>${z.zona}</td><td>${z.lokasi}</td><td>${z.tema}</td></tr>`).join("");
    tbody.querySelectorAll("tr").forEach(row => row.addEventListener("click", () => selectZone(row.dataset.id, true)));
  }

  function renderOutputTable(){
    const tbody = $("outputTable").querySelector("tbody");
    tbody.innerHTML = outputs.map(o => `<tr><td>${o.output}</td><td>${o.description}</td><td>${o.format}</td></tr>`).join("");
  }

  function addZoneMarkers(){
    zones.forEach(z => {
      const el = document.createElement("button");
      el.className = `jad-marker ${markerClass(z.hauntedIndex)}`;
      el.type = "button";
      el.textContent = z.icon;
      el.title = `${z.zona} - ${z.lokasi}`;
      el.addEventListener("click", ev => { ev.stopPropagation(); selectZone(z.id, true); });
      const marker = new maplibregl.Marker({ element:el, anchor:"center" }).setLngLat(z.coordinates).addTo(map);
      markers.set(z.id, { marker, el, data:z });
    });
  }

  function addGameMarkers(){
    (layers.relics || []).forEach(r => {
      const el = document.createElement("button");
      el.className = "relic-marker hidden";
      el.type = "button";
      el.textContent = "📿";
      el.title = r.name;
      el.addEventListener("click", ev => { ev.stopPropagation(); pickRelic(r.id, el); });
      relicMarkers.set(r.id, new maplibregl.Marker({ element:el }).setLngLat(r.coordinates).addTo(map));
    });

    (layers.traps || []).forEach(t => {
      const el = document.createElement("button");
      el.className = "trap-marker hidden";
      el.type = "button";
      el.textContent = "👁️";
      el.title = t.name;
      el.addEventListener("click", ev => { ev.stopPropagation(); triggerTrap(t.name); });
      trapMarkers.set(t.id, new maplibregl.Marker({ element:el }).setLngLat(t.coordinates).addTo(map));
    });
  }

  function renderList(list){
    const wrap = $("legendItems");
    wrap.innerHTML = "";
    list.forEach(z => {
      const item = document.createElement("div");
      item.className = "legend-item" + (z.id === selectedId ? " active" : "");
      item.dataset.id = z.id;
      item.innerHTML = `
        <span class="score">${z.hauntedIndex}</span>
        <b>${z.icon} ${z.zona} · ${z.lokasi}</b>
        <span>${z.tema}</span>
        <span>${z.subtitle}</span>
      `;
      item.addEventListener("click", () => selectZone(z.id, true));
      wrap.appendChild(item);
    });
  }

  function selectZone(id, fly){
    const found = markers.get(id);
    if(!found) return;
    const z = found.data;
    selectedId = id;

    markers.forEach(({el}) => el.classList.remove("selected"));
    found.el.classList.add("selected");

    document.querySelectorAll(".legend-item").forEach(el => el.classList.toggle("active", el.dataset.id === id));
    document.querySelectorAll("#zoneTable tbody tr").forEach(el => el.classList.toggle("active", el.dataset.id === id));

    const storiesHtml = z.stories.map(s => `
      <dt>${s.title}</dt>
      <dd>${s.detail}<br><em>Audio/ambience: ${s.sound}</em></dd>
    `).join("");

    $("infoContent").innerHTML = `
      <h2>${z.icon} ${z.zona} · ${z.lokasi}</h2>
      <p><b>${z.tema}</b><br>${z.subtitle}</p>
      <p>Haunted Index <b>${z.hauntedIndex}</b> · Risiko <b>${z.risk}</b></p>
      <dl>${storiesHtml}
        <dt>Fungsi pada WebGIS</dt><dd>${z.webUse}</dd>
      </dl>
      <div class="source-note">Narasi disusun dari dokumen urban legend internal. Koordinat masih prototype dan perlu divalidasi dengan QGIS/OSM.</div>
      <div class="info-actions">
        <button id="btnAudio" class="purple-btn">🔊 Audio Lokasi</button>
        <button id="btnFocus" class="blue-btn">🎯 Fokus Kamera</button>
      </div>
    `;

    $("btnAudio").addEventListener("click", () => playOneShot(z.audio || "whisper"));
    $("btnFocus").addEventListener("click", () => focusZone(z, 16.5));

    if(fly) focusZone(z, z.id.includes("selarong") || z.id.includes("kotagede") ? 13.2 : 16.1);

    increaseDanger(z.risk === "tinggi" ? 16 : 9);
    playOneShot(z.audio || "whisper");
    renderList(filterZones());

    if(z.risk === "tinggi" && danger >= 74 && entered) triggerJumpscare(z.creature, z.lokasi);
  }

  function focusZone(z, zoom){
    map.flyTo({ center:z.coordinates, zoom, pitch:68, bearing:-24, speed:0.75, curve:1.35, essential:true });
  }

  function filterZones(){
    const q = ($("searchInput").value || "").toLowerCase().trim();
    return zones.filter(z => z.hauntedIndex >= filterMin && (!q || [
      z.zona, z.lokasi, z.tema, z.subtitle, z.risk, ...z.stories.map(s => s.title + " " + s.detail)
    ].join(" ").toLowerCase().includes(q)));
  }

  function applyFilter(){
    const visible = new Set(filterZones().map(z => z.id));
    markers.forEach(({el,data}) => {
      const show = visible.has(data.id) && $("layerMarkers").checked;
      el.classList.toggle("hidden-marker", !show);
    });
    renderList(filterZones());
  }

  function setLayerVisibility(){
    const set = (ids, visible) => ids.forEach(id => {
      if(map.getLayer(id)) map.setLayoutProperty(id, "visibility", visible ? "visible" : "none");
    });
    set(["jad-3d"], $("layer3d").checked);
    set(["jad-zones-fill","jad-zones-line"], $("layerZones").checked);
    set(["jad-risk-fill","jad-risk-line"], $("layerRisk").checked);
    set(["jad-safe-fill","jad-safe-line"], $("layerSafe").checked);
    set(["jad-routes-glow","jad-routes"], $("layerRoutes").checked);
    applyFilter();
    const gameVisible = $("layerGame").checked && gameActive;
    relicMarkers.forEach(m => m.getElement().classList.toggle("hidden", !gameVisible));
    trapMarkers.forEach(m => m.getElement().classList.toggle("hidden", !gameVisible));
  }

  function fitAll(){
    const bounds = new maplibregl.LngLatBounds();
    zones.forEach(z => bounds.extend(z.coordinates));
    map.fitBounds(bounds, { padding: { top: 90, right: 380, bottom: 90, left: 520 }, maxZoom: 11, pitch: 55, duration: 1200 });
  }

  function increaseDanger(amount){
    danger = Math.max(0, Math.min(100, danger + amount));
    sanity = Math.max(0, 100 - Math.round(danger * 0.72));
    updateDangerUI();
    if(danger >= 100){
      triggerBlood("DANGER PENUH");
      triggerJumpscare("kunti", "Danger Meter Penuh");
      danger = 48;
      sanity = 66;
      setTimeout(updateDangerUI, 800);
    }
  }

  function updateDangerUI(){
    $("dangerText").textContent = danger + "%";
    $("dangerFill").style.width = danger + "%";
    $("mSanity").textContent = sanity;
  }

  function playTrack(track){
    if(muted || !entered) return;
    stopAllAudio(false);
    const a = audios[track];
    if(!a) return;
    a.currentTime = 0;
    a.play().catch(() => {});
    currentTrack = track;
    toast("Soundtrack aktif: " + track);
  }

  function playOneShot(track){
    if(muted || !entered) return;
    const src = audioPaths[track] || audioPaths.whisper;
    const a = new Audio(src);
    a.volume = 0.52;
    a.play().catch(() => {});
  }

  function stopAllAudio(showToast=true){
    Object.values(audios).forEach(a => {
      try{ a.pause(); a.currentTime = 0; }catch(e){}
    });
    currentTrack = null;
    if(showToast) toast("Audio dihentikan.");
  }

  function pickRelic(id, el){
    if(collected.has(id)) return;
    collected.add(id);
    el.classList.add("hidden");
    playOneShot("thunder");
    const total = (layers.relics || []).length || 5;
    $("mRelic").textContent = `${collected.size}/${total}`;
    $("gameStatus").textContent = `Relik: ${collected.size}/${total}`;
    $("gameProgress").style.width = `${(collected.size / total) * 100}%`;
    increaseDanger(8);
    toast("Relik ditemukan: " + collected.size + "/" + total);
    if(collected.size >= total){
      triggerBlood("RUTE SELESAI");
      toast("Mini game selesai. Semua relik berhasil dikumpulkan.");
      playOneShot("kunti");
    }
  }

  function triggerTrap(name){
    increaseDanger(28);
    playOneShot("scream");
    triggerBlood("JEBAKAN: " + name.toUpperCase());
    if(danger >= 70) triggerJumpscare("pocong", name);
  }

  function triggerJumpscare(creature, label){
    if(muted) return;
    const overlay = $("jumpscareOverlay");
    const img = $("jumpscareImage");
    const caption = $("jumpscareCaption");
    if(creature === "pocong") img.src = "assets/img/pocong.svg";
    else if(creature === "genderuwo") img.src = "assets/img/genderuwo.svg";
    else img.src = "assets/img/kunti-webgis.png";
    caption.textContent = label || "JOGJA AFTER DARK";
    overlay.classList.remove("hidden");
    playOneShot(creature === "pocong" ? "pocong" : creature === "genderuwo" ? "genderuwo" : "kunti");
    setTimeout(() => overlay.classList.add("hidden"), 900);
  }

  function triggerBlood(text){
    const el = $("bloodText");
    el.textContent = text;
    el.classList.remove("show");
    void el.offsetWidth;
    el.classList.add("show");
  }

  function toast(msg){
    const t = $("toast");
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(t._timer);
    t._timer = setTimeout(() => t.classList.remove("show"), 2600);
  }

  function makeDraggable(panel){
    const handle = panel.querySelector(".drag-handle");
    if(!handle) return;
    let sx=0, sy=0, ox=0, oy=0, moving=false;
    handle.addEventListener("pointerdown", e => {
      if(window.matchMedia("(max-width:1100px)").matches) return;
      moving = true;
      sx = e.clientX; sy = e.clientY;
      const rect = panel.getBoundingClientRect();
      ox = rect.left; oy = rect.top;
      panel.style.left = ox + "px";
      panel.style.top = oy + "px";
      panel.style.right = "auto";
      panel.style.bottom = "auto";
      panel.setPointerCapture(e.pointerId);
    });
    handle.addEventListener("pointermove", e => {
      if(!moving) return;
      panel.style.left = Math.max(6, ox + e.clientX - sx) + "px";
      panel.style.top = Math.max(6, oy + e.clientY - sy) + "px";
    });
    handle.addEventListener("pointerup", () => moving = false);
  }

  document.querySelectorAll(".draggable").forEach(makeDraggable);

  $("enterBtn").addEventListener("click", () => {
    entered = true;
    $("introGate").style.display = "none";
    playTrack("ambience");
    toast("Masuk ke Kota Gelap. Pilih salah satu zona.");
  });

  $("searchInput").addEventListener("input", applyFilter);
  $("hauntedSlider").addEventListener("input", e => {
    filterMin = Number(e.target.value);
    $("sliderText").textContent = "Tampilkan skor ≥ " + filterMin;
    applyFilter();
  });

  ["layer3d","layerZones","layerRisk","layerSafe","layerRoutes","layerMarkers","layerGame"].forEach(id => {
    $(id).addEventListener("change", setLayerVisibility);
  });

  $("kliwonBtn").addEventListener("click", () => {
    document.body.classList.toggle("kliwon");
    increaseDanger(12);
    playOneShot("thunder");
    triggerBlood("MALAM JUMAT KLIWON");
    $("scenarioTitle").textContent = document.body.classList.contains("kliwon") ? "Malam Jumat Kliwon" : "Mode Jelajah Horor";
  });

  $("ghostHuntBtn").addEventListener("click", () => {
    toast("Ghost Hunt Mode aktif. Zona berisiko tinggi lebih mudah memicu jumpscare.");
    increaseDanger(15);
    playTrack("heartbeat");
  });

  $("miniGameBtn").addEventListener("click", () => {
    gameActive = !gameActive;
    $("gamePanel").classList.toggle("hidden", !gameActive);
    $("scenarioTitle").textContent = gameActive ? "Survival Mode: Relik Kutukan" : "Mode Jelajah Horor";
    $("scenarioText").textContent = gameActive ? "Kumpulkan 5 relik pada 5 zona studi. Hindari jebakan." : "Klik zona, baca narasi, ikuti rute, lalu kumpulkan relik saat survival mode aktif.";
    setLayerVisibility();
    if(gameActive){
      playTrack("heartbeat");
      toast("Mini game aktif. Cari 5 relik.");
    } else {
      toast("Mini game dimatikan.");
    }
  });

  $("view3dBtn").addEventListener("click", () => {
    if(selectedId && markers.get(selectedId)) focusZone(markers.get(selectedId).data, 16.8);
    else map.flyTo({ center:[110.36477,-7.80528], zoom:15.5, pitch:72, bearing:-30, speed:.8 });
  });

  $("resetBtn").addEventListener("click", () => {
    fitAll();
    danger = Math.max(0, danger - 14);
    updateDangerUI();
  });

  $("muteBtn").addEventListener("click", () => {
    muted = !muted;
    if(muted) stopAllAudio(false);
    toast(muted ? "Audio dimute." : "Audio aktif.");
  });

  $("panicBtn").addEventListener("click", () => {
    stopAllAudio(false);
    danger = 0; sanity = 100; updateDangerUI();
    $("jumpscareOverlay").classList.add("hidden");
    toast("Semua efek dimatikan.");
  });

  document.querySelectorAll("[data-track]").forEach(btn => btn.addEventListener("click", () => playTrack(btn.dataset.track)));

  map.on("click", () => {
    if(!entered) return;
    increaseDanger(3);
  });
})();
