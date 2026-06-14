<!doctype html>
<html lang="id">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Jogja After Dark: 3D Haunted City Experience</title>
  <link href="https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.css" rel="stylesheet" />
  <link rel="stylesheet" href="css/style.css" />
</head>
<body>
  <div id="map"></div>

  <section id="introGate" class="intro-gate">
    <div class="intro-card">
      <div class="status-pill">FINAL PROTOTYPE · 5 ZONA STUDI · 6 OUTPUT TARGET</div>
      <h1>Jogja After Dark</h1>
      <h2>3D Haunted City Experience</h2>
      <p>Smart Tourism berbasis 3D GIS dan Urban Storytelling. Web ini memakai 5 lokasi inti: Keraton, Taman Sari, Kota Gede, Jalan Malioboro–Alun-Alun, serta Gua Selarong & Bukit Sekitar.</p>
      <button id="enterBtn" class="primary-btn">Masuk ke Kota Gelap</button>
      <small>Audio browser aktif setelah tombol diklik. Cocok untuk demo GitHub Pages.</small>
    </div>
  </section>

  <div class="noise"></div>
  <div class="vignette"></div>
  <div id="fogLayer" class="fog-layer"></div>
  <div id="flashLayer" class="flash-layer"></div>
  <div id="bloodText" class="blood-text">JANGAN KELUAR DARI RUTE</div>

  <div id="jumpscareOverlay" class="jumpscare-overlay hidden" aria-hidden="true">
    <img id="jumpscareImage" src="assets/img/kunti-webgis.png" alt="jumpscare" />
    <div id="jumpscareCaption" class="jumpscare-caption">JOGJA AFTER DARK</div>
  </div>

  <aside id="heroPanel" class="panel hero-panel draggable">
    <div class="drag-handle">☰ Jogja After Dark</div>
    <h1>3D Haunted City Experience</h1>
    <p>WebGIS interaktif dengan 5 zona studi, rute horor, zona aman-rawan, haunted index, story map, dan mini game relik.</p>
    <div class="chips">
      <span>3D GIS</span><span>Urban Storytelling</span><span>Smart Tourism</span><span>Survival Mode</span>
    </div>
  </aside>

  <aside id="zonePanel" class="panel zone-panel draggable">
    <div class="drag-handle">☰ Lokasi Studi dan Data</div>
    <table class="data-table" id="zoneTable">
      <thead>
        <tr><th>Zona</th><th>Lokasi</th><th>Legenda / Tema</th></tr>
      </thead>
      <tbody></tbody>
    </table>
    <p class="note">Titik koordinat bersifat prototype dan bisa diganti dengan titik hasil digitasi/QGIS.</p>
  </aside>

  <aside id="legendPanel" class="panel legend-panel draggable">
    <div class="drag-handle">☰ Arsip Urban Legend</div>
    <input id="searchInput" placeholder="Cari: Keraton, Tamansari, Kotagede, Malioboro, Selarong..." />
    <div id="legendItems"></div>
  </aside>

  <aside id="controlPanel" class="panel control-panel draggable">
    <div class="drag-handle">☰ Control Center</div>

    <div class="scenario-box">
      <span>SKENARIO AKTIF</span>
      <h2 id="scenarioTitle">Mode Jelajah Horor</h2>
      <p id="scenarioText">Klik zona, baca narasi, ikuti rute, lalu kumpulkan relik saat survival mode aktif.</p>
    </div>

    <div class="metric-grid">
      <div class="metric"><b id="mZone">5</b><span>zona</span></div>
      <div class="metric"><b id="mOutput">6</b><span>output</span></div>
      <div class="metric"><b id="mRelic">0/5</b><span>relik</span></div>
      <div class="metric"><b id="mSanity">100</b><span>sanity</span></div>
    </div>

    <div class="danger-wrap">
      <div class="danger-head"><b>Danger Meter</b><span id="dangerText">0%</span></div>
      <div class="danger-bar"><div id="dangerFill"></div></div>
      <small>Naik saat masuk zona rawan, klik kosong berulang, atau terkena jebakan.</small>
    </div>

    <h3>Layer WebGIS</h3>
    <label><input type="checkbox" id="layer3d" checked /> Model 3D / kolom zona</label>
    <label><input type="checkbox" id="layerZones" checked /> Zona studi</label>
    <label><input type="checkbox" id="layerRisk" checked /> Zona rawan</label>
    <label><input type="checkbox" id="layerSafe" checked /> Zona aman</label>
    <label><input type="checkbox" id="layerRoutes" checked /> Rute horor</label>
    <label><input type="checkbox" id="layerMarkers" checked /> Marker urban legend</label>
    <label><input type="checkbox" id="layerGame" checked /> Relik & jebakan</label>

    <h3>Filter Haunted Index</h3>
    <input id="hauntedSlider" type="range" min="0" max="100" value="0" />
    <small id="sliderText">Tampilkan skor ≥ 0</small>

    <h3>Mode Interaktif</h3>
    <button id="kliwonBtn" class="danger-btn">🌑 Aktifkan Malam Jumat</button>
    <button id="ghostHuntBtn" class="purple-btn">🔦 Ghost Hunt Mode</button>
    <button id="miniGameBtn" class="green-btn">🎮 Mulai Mini Game Relik</button>
    <button id="view3dBtn" class="blue-btn">🏙️ Mode 3D Dekat</button>
    <button id="resetBtn" class="dark-btn">↻ Reset Kamera</button>

    <h3>Soundtrack</h3>
    <div class="audio-grid">
      <button data-track="ambience" class="audio-btn">🌫️ Ambience</button>
      <button data-track="whisper" class="audio-btn">🗣️ Whisper</button>
      <button data-track="thunder" class="audio-btn">⛈️ Thunder</button>
      <button data-track="heartbeat" class="audio-btn">🫀 Heartbeat</button>
      <button id="muteBtn" class="dark-btn full">🔊 Mute / Unmute</button>
      <button id="panicBtn" class="dark-btn full">🧯 Matikan Efek</button>
    </div>
  </aside>

  <aside id="outputPanel" class="panel output-panel draggable">
    <div class="drag-handle">☰ Target Hasil Akhir</div>
    <table class="data-table output-table" id="outputTable">
      <thead>
        <tr><th>Output</th><th>Deskripsi / Fungsi</th><th>Format / Media</th></tr>
      </thead>
      <tbody></tbody>
    </table>
  </aside>

  <aside id="infoPanel" class="panel info-panel draggable">
    <div class="drag-handle">☰ Info Lokasi</div>
    <div id="infoContent">
      <h2>Pilih salah satu zona</h2>
      <p>Klik marker di peta atau kartu pada Arsip Urban Legend. Panel ini akan menampilkan tema, cerita, suara, dan fungsi zona pada WebGIS.</p>
    </div>
  </aside>

  <div id="gamePanel" class="game-panel hidden">
    <b>🎮 MINI GAME: RELIK KUTUKAN</b>
    <p>Kumpulkan 5 relik, satu relik untuk setiap zona studi.</p>
    <div class="progress"><div id="gameProgress"></div></div>
    <span id="gameStatus">Relik: 0/5</span>
  </div>

  <div class="map-legend">
    <div><span class="dot high"></span>Zona risiko tinggi</div>
    <div><span class="dot medium"></span>Zona risiko sedang</div>
    <div><span class="line route"></span>Rute horor</div>
    <div>🏙️ Kolom 3D = haunted index</div>
    <div>📿 Relik / 👁️ Jebakan</div>
  </div>

  <div id="toast" class="toast">Klik “Masuk ke Kota Gelap” dulu.</div>

  <script src="https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.js"></script>
  <script src="data/points.js"></script>
  <script src="data/layers.js"></script>
  <script src="js/app.js"></script>
</body>
</html>
