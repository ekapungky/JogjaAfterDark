'use strict';

const center = [110.3647, -7.8053];
const state = {
  audioUnlocked: false,
  muted: false,
  activeTrack: null,
  activeTrackKey: null,
  miniGame: false,
  ghostHunt: false,
  collected: 0,
  sanity: 100,
  danger: 0,
  wrongClicks: 0,
  scareQueued: false,
  scareVisible: false,
  lastLayerClick: 0,
  lastRiskHover: 0,
  idleScareTimer: null,
  mapClickCount: 0,
  routeMode: 'fallback',
  lastHauntedId: null,
  repeatTargetClicks: 0,
  highRiskSince: 0,
  trapHits: 0,
  lastScareAt: 0,
  scareCooldownMs: 9000,
  criticalMode: false,
  kliwon: false
};

const AUDIO = {
  ambience: {src:'assets/audio/user/horror_ambience.wav', volume:.36, loop:true, label:'Ambience horor'},
  wind: {src:'assets/audio/user/graveyard_wind.wav', volume:.45, loop:true, label:'Angin kuburan'},
  radio: {src:'assets/audio/user/terror_radio.wav', volume:.28, loop:true, label:'Radio teror'},
  heartbeat: {src:'assets/audio/user/heartbeat_transition.wav', volume:.34, loop:true, label:'Detak jantung'},
  wolves: {src:'assets/audio/user/forest_wolves.wav', volume:.58, loop:false, label:'Serigala'},
  brokenRadio: {src:'assets/audio/user/broken_radio_signal.wav', volume:.55, loop:false, label:'Radio rusak'},
  terror: {src:'assets/audio/user/terror_transition.wav', volume:.82, loop:false, label:'Terror transition'},
  scream: {src:'assets/audio/scream.wav', volume:.95, loop:false, label:'Teriakan'},
  kuntiLaugh: {src:'assets/audio/user/kuntilanak_laugh_user.mp3', volume:.92, loop:false, label:'Ketawa kunti'},
  pocongThud: {src:'assets/audio/pocong_thud.wav', volume:.82, loop:false, label:'Pocong thud'},
  genderuwoGrowl: {src:'assets/audio/genderuwo_growl.wav', volume:.88, loop:false, label:'Growl genderuwo'},
  whisper: {src:'assets/audio/whisper.wav', volume:.45, loop:false, label:'Bisikan'},
  thunder: {src:'assets/audio/thunder.wav', volume:.75, loop:false, label:'Petir'}
};

const CREATURES = {
  kunti: {
    name:'KUNTILANAK', img:'assets/img/kunti-webgis.png',
    sequence:['terror','kuntiLaugh','scream'],
    messages:['Terdengar ketawa dari belakang.', 'Rambut panjang muncul di ujung layar.', 'Dia muncul dari arah yang kamu klik.']
  },
  pocong: {
    name:'POCONG', img:'assets/img/pocong.svg',
    sequence:['terror','pocongThud','scream'],
    messages:['Sesuatu melompat di jalur evakuasi.', 'Mata merah muncul di pinggir rute.', 'Kamu salah memilih jalan.']
  },
  genderuwo: {
    name:'GENDERUWO', img:'assets/img/genderuwo.svg',
    sequence:['terror','genderuwoGrowl','wolves'],
    messages:['Growl berat muncul dari zona gelap.', 'Ada bayangan besar di antara bangunan 3D.', 'Jangan terlalu lama di zona merah.']
  }
};

let map;
let hauntedMarkers = [];
let facilityMarkers = [];
let relicMarkers = [];
let trapMarkers = [];

window.addEventListener('error', ev => {
  console.error(ev.error || ev.message);
  toast('Error terdeteksi: ' + (ev.message || 'cek console browser'));
});

boot();

function boot(){
  map = new maplibregl.Map({
    container:'map',
    style:{
      version:8,
      sources:{osm:{type:'raster',tiles:['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],tileSize:256,attribution:'© OpenStreetMap contributors'}},
      layers:[{id:'osm',type:'raster',source:'osm',paint:{'raster-saturation':-1,'raster-brightness-min':0,'raster-brightness-max':.38,'raster-contrast':.36}}]
    },
    center,
    zoom:14.2,
    pitch:63,
    bearing:-18,
    antialias:true
  });

  map.addControl(new maplibregl.NavigationControl({visualizePitch:true}),'top-left');
  map.on('load', () => {
    addGeoLayers();
    addMarkers();
    renderLegendList();
    bindUI();
    makeDraggable();
    loadOsmRoutes();
    updateUI();
    toast('Klik “Masuk ke Kota Gelap”. Mini game sudah dibenerin, jumpscare hanya di momen kritis.');
  });
  map.on('error', () => toast('Basemap/layer gagal dimuat. Pastikan internet aktif dan buka via localhost.'));
}

function addGeoLayers(){
  map.addSource('buildings',{type:'geojson',data:BUILDINGS});
  map.addLayer({id:'buildings-3d',type:'fill-extrusion',source:'buildings',paint:{'fill-extrusion-color':['get','color'],'fill-extrusion-height':['get','height'],'fill-extrusion-base':['coalesce',['get','base'],0],'fill-extrusion-opacity':.86}});

  map.addSource('landmarks3d',{type:'geojson',data:LANDMARKS_3D});
  map.addLayer({id:'landmarks-3d',type:'fill-extrusion',source:'landmarks3d',paint:{'fill-extrusion-color':['get','color'],'fill-extrusion-height':['get','height'],'fill-extrusion-base':['coalesce',['get','base'],0],'fill-extrusion-opacity':.94}});

  map.addSource('beacons3d',{type:'geojson',data:HAUNTED_BEACONS});
  map.addLayer({id:'beacons-3d',type:'fill-extrusion',source:'beacons3d',paint:{'fill-extrusion-color':['get','color'],'fill-extrusion-height':['get','height'],'fill-extrusion-base':['coalesce',['get','base'],0],'fill-extrusion-opacity':.42}});

  map.on('click','landmarks-3d', e => {
    state.lastLayerClick = Date.now();
    const p = e.features[0].properties;
    showInfo(`<h2>🏙️ ${p.name}</h2><p>Ini elemen 3D utama: bangunan/landmark diekstrusi vertikal dari footprint GIS. Warna dan tinggi dipakai untuk memperkuat pengalaman kota horor 3D.</p><div class="quote">Tinggi model: ${p.height} meter</div>`);
  });
  map.on('click','beacons-3d', e => {
    state.lastLayerClick = Date.now();
    const p = e.features[0].properties;
    showInfo(`<h2>👻 ${p.name}</h2><p>Kolom hantu 3D menunjukkan intensitas urban legend secara vertikal, sehingga titik tidak hanya datar di peta.</p><div class="quote">Ini visualisasi 3D, bukan trigger jumpscare.</div>`);
  });

  map.addSource('risk',{type:'geojson',data:RISK_ZONES});
  map.addLayer({id:'risk-zones',type:'fill',source:'risk',paint:{'fill-color':['match',['get','risk'],'high','#ff174f','medium','#ffd166','#ff174f'],'fill-opacity':['match',['get','risk'],'high',.42,'medium',.28,.24]}});
  map.addLayer({id:'risk-outline',type:'line',source:'risk',paint:{'line-color':'#ff174f','line-width':2,'line-dasharray':[2,1]}});

  map.addSource('safe',{type:'geojson',data:SAFE_ZONES});
  map.addLayer({id:'safe-zones',type:'fill',source:'safe',paint:{'fill-color':'#33d17a','fill-opacity':.23}});
  map.addLayer({id:'safe-outline',type:'line',source:'safe',paint:{'line-color':'#33d17a','line-width':2,'line-dasharray':[2,1]}});

  map.addSource('routes',{type:'geojson',data:FALLBACK_ROUTES});
  map.addLayer({id:'routes-line',type:'line',source:'routes',layout:{'line-cap':'round','line-join':'round'},paint:{'line-color':['coalesce',['get','color'],'#70d6ff'],'line-width':5,'line-opacity':.9}});

  map.on('click','risk-zones', e => {
    state.lastLayerClick = Date.now();
    const p = e.features[0].properties;
    showInfo(`<h2>⚠ ${p.name}</h2><p>Zona ini dianggap rawan karena kombinasi narasi horor, akses jalan, dan kepadatan visual 3D.</p><div class="quote">Jumpscare tidak langsung muncul. Namun kalau danger sudah tinggi dan kamu terlalu lama di sini, sistem bisa memicu momen kritis.</div>`);
    raiseDanger(6, 'Masuk zona rawan: ' + p.name, p.creature || 'kunti');
    state.highRiskSince = Date.now();
  });

  map.on('mouseenter','risk-zones', () => { state.highRiskSince = Date.now(); map.getCanvas().style.cursor = 'crosshair'; });
  map.on('mouseleave','risk-zones', () => { state.highRiskSince = 0; map.getCanvas().style.cursor = ''; });
  map.on('mousemove','risk-zones', e => {
    if(!state.miniGame || !state.highRiskSince) return;
    if(Date.now() - state.lastRiskHover < 1500) return;
    state.lastRiskHover = Date.now();
    const elapsed = Date.now() - state.highRiskSince;
    if(elapsed > 2500){
      const p = e.features[0].properties;
      raiseDanger(3, 'Terlalu lama berada di zona merah.', p.creature || 'genderuwo', true);
      if(state.miniGame && state.collected >= 3 && state.danger >= 92 && elapsed > 6500) maybeCriticalScare(p.creature || 'genderuwo', 'terlalu lama di zona merah saat fase akhir');
    }
  });

  map.on('click','safe-zones', e => {
    state.lastLayerClick = Date.now();
    const p = e.features[0].properties;
    showInfo(`<h2>🟢 ${p.name}</h2><p>Zona aman untuk titik kumpul sementara.</p><div class="quote">Kapasitas simulasi: ${p.capacity}</div>`);
    reduceDanger(12, 'Masuk zona aman. Danger turun.');
  });

  map.on('click','routes-line', e => {
    state.lastLayerClick = Date.now();
    const p = e.features[0].properties;
    showInfo(`<h2>🛣️ ${p.name || 'Rute horor'}</h2><p>Rute ini mengikuti jaringan jalan OSM bila internet/API tersedia. Jika gagal, sistem memakai fallback route lokal.</p><div class="quote">Mode rute: ${state.routeMode}</div>`);
  });

  map.on('click', e => handleEmptyMapClick(e));
}

function addMarkers(){
  HAUNTED_POINTS.forEach(p => {
    const el = document.createElement('button');
    el.className = 'marker haunted-marker';
    el.textContent = p.icon;
    el.title = p.name;
    el.dataset.score = p.score;
    el.dataset.id = p.id;
    el.type = 'button';
    const popup = new maplibregl.Popup({offset:28}).setHTML(`<div class="popup-title">${p.icon} ${p.name}</div><div class="popup-meta">${p.category}<br>Haunted Index: <b>${p.score}</b></div>`);
    const marker = new maplibregl.Marker({element:el,anchor:'center'}).setLngLat(p.coord).setPopup(popup).addTo(map);
    el.addEventListener('click', ev => { ev.stopPropagation(); state.lastLayerClick = Date.now(); selectHaunted(p,true); });
    hauntedMarkers.push({marker,el,data:p});
  });

  FACILITIES.forEach(f => {
    const el = document.createElement('button');
    el.className = 'facility-marker';
    el.textContent = f.icon;
    el.title = f.name;
    el.type = 'button';
    const marker = new maplibregl.Marker({element:el}).setLngLat(f.coord).setPopup(new maplibregl.Popup({offset:20}).setHTML(`<div class="popup-title">${f.icon} ${f.name}</div><div class="popup-meta">${f.type} terdekat untuk safety route.</div>`)).addTo(map);
    el.addEventListener('click', ev => { ev.stopPropagation(); state.lastLayerClick = Date.now(); reduceDanger(7, 'Fasilitas darurat dipilih.'); });
    facilityMarkers.push({marker,el,data:f});
  });
}

function renderLegendList(list = HAUNTED_POINTS){
  const box = document.getElementById('legendItems');
  box.innerHTML = '';
  [...list].sort((a,b)=>b.score-a.score).forEach(p=>{
    const card = document.createElement('div');
    card.className = 'legend-card';
    card.innerHTML = `<div class="icon">${p.icon}</div><div><b>${p.name}</b><small>${p.category} · ${p.level}</small></div><span class="score-pill">${p.score}</span>`;
    card.addEventListener('click',()=>selectHaunted(p,true));
    box.appendChild(card);
  });
}

function selectHaunted(p, fly=false){
  if(fly) map.flyTo({center:p.coord,zoom:16.45,pitch:73,bearing:-24,speed:.8});
  playLocationAudio(p.audio);
  reduceDanger(3, 'Lokasi valid dipilih.');

  if(state.lastHauntedId === p.id) state.repeatTargetClicks += 1;
  else { state.lastHauntedId = p.id; state.repeatTargetClicks = 1; }

  showInfo(`
    <h2>${p.icon} ${p.name}</h2>
    <p><b>${p.category}</b> · Haunted Index ${p.score} · Level ${p.level}</p><p><b>Jenis sumber:</b> ${p.sourceType || 'Storytelling berbasis lokasi'}</p>
    <p>${p.story}</p>
    <div class="quote">“${p.quote}”</div>
    <p><b>Analisis spasial:</b> ${p.spatial}</p>
    <p><b>Safety:</b> ${p.safety}</p>
    <div class="info-actions">
      <button class="mini-btn audio" onclick="playLocationAudio('${p.audio}')">🔊 Audio lokasi</button>
      <button class="mini-btn visual" onclick="hauntedVisual('${p.id}')">👁️ Visual horor</button>
      <button class="mini-btn route" onclick="focusRoute('${p.id}')">🛣️ Fokus rute</button>
    </div>`);

  // Jumpscare hanya saat konteks kritis
  if(state.miniGame && state.collected >= 4 && state.danger >= 92 && p.level === 'Tinggi' && state.repeatTargetClicks >= 4){
    maybeCriticalScare(p.creature || 'kunti', 'terlalu lama menatap lokasi berisiko tinggi');
  }
}

function showInfo(html){ document.getElementById('infoContent').innerHTML = html; }

async function loadOsmRoutes(){
  if(!map.getSource('routes')) return;
  toast('Mencoba memuat rute jalan OSM...');
  const features = [];
  for(const def of OSM_ROUTE_DEFS){
    const coords = def.ids.map(id => HAUNTED_POINTS.find(p=>p.id===id)?.coord).filter(Boolean);
    let geometry = null;
    for(const profile of ['foot','driving']){
      try{
        const joined = coords.map(c=>`${c[0]},${c[1]}`).join(';');
        const url = `https://router.project-osrm.org/route/v1/${profile}/${joined}?overview=full&geometries=geojson&steps=false`;
        const res = await fetch(url);
        if(!res.ok) continue;
        const json = await res.json();
        geometry = json.routes && json.routes[0] && json.routes[0].geometry;
        if(geometry) break;
      }catch(err){ console.warn('OSRM failed', err); }
    }
    if(geometry){
      features.push({type:'Feature',properties:{id:def.id,name:def.name,type:def.id,color:def.color,source:'OSM'},geometry});
    }
  }
  if(features.length){
    map.getSource('routes').setData({type:'FeatureCollection',features});
    state.routeMode = 'OSM';
    document.getElementById('mRoute').textContent = 'OSM';
    toast('Rute berhasil mengikuti jaringan jalan OSM.');
  }else{
    map.getSource('routes').setData(FALLBACK_ROUTES);
    state.routeMode = 'Fallback';
    document.getElementById('mRoute').textContent = 'Local';
    toast('OSRM gagal/timeout. Rute lokal fallback dipakai.');
  }
}

function handleEmptyMapClick(e){
  if(Date.now() - state.lastLayerClick < 180) return;
  const target = e.originalEvent && e.originalEvent.target;
  if(target && target.closest && target.closest('.maplibregl-marker, .maplibregl-control-container, .panel, button, input, details, .intro-gate')) return;

  state.mapClickCount++;
  if(!state.miniGame){
    if(state.audioUnlocked) playOneShot('whisper', .18);
    if(state.mapClickCount % 10 === 0) toast('Jangan asal klik. Coba pilih lokasi urban legend atau mulai mini game.');
    return;
  }

  state.wrongClicks++;
  raiseDanger(8, `Asal klik ${state.wrongClicks}/6. Danger naik.`, randomCreature());
  if(state.wrongClicks >= 6 && state.danger >= 88){
    state.wrongClicks = 0;
    maybeCriticalScare(randomCreature(), 'terlalu banyak klik kosong saat tension tinggi');
  }
}

function startMiniGame(){
  if(state.miniGame){
    toast('Mini game sudah aktif. Selesaikan dulu atau tekan Matikan Semua Efek.');
    return;
  }
  unlockAudio();
  playLoop('ambience');
  state.miniGame = true;
  state.collected = 0;
  state.sanity = 100;
  state.danger = 12;
  state.wrongClicks = 0;
  state.trapHits = 0;
  state.repeatTargetClicks = 0;
  state.lastHauntedId = null;
  state.criticalMode = false;
  clearRelics();
  document.getElementById('gamePanel').classList.remove('hidden');

  const relicIds = ['malioboro','vredeburg','keraton','tamansari','alkid'];
  const trapIds = ['krapyak','kotagede'];
  const relicBases = relicIds.map(id => HAUNTED_POINTS.find(p=>p.id===id)).filter(Boolean);
  const trapBases = trapIds.map(id => HAUNTED_POINTS.find(p=>p.id===id)).filter(Boolean);
  relicBases.forEach((p,i)=>addRelic(p,i));
  trapBases.forEach((p,i)=>addTrap(p,i));
  updateUI();
  map.flyTo({center:[110.3647,-7.8053],zoom:15.85,pitch:76,bearing:-24,speed:.75});
  toast('Mini game aktif: cari 5 relik emas. Trap cuma 2 dan jumpscare tidak spam.');
  scheduleIdleScare();
}

function addRelic(p,i){
  const el = document.createElement('button');
  el.className = 'relic-marker';
  el.type = 'button';
  el.textContent = '📿';
  el.title = 'Relik ' + p.name;
  const coord = spacedCoord(p.coord, i, false);
  const marker = new maplibregl.Marker({element:el}).setLngLat(coord).addTo(map);
  el.addEventListener('click', ev => {
    ev.stopPropagation(); state.lastLayerClick = Date.now();
    state.collected++;
    state.wrongClicks = Math.max(0, state.wrongClicks - 1);
    reduceDanger(15, `Relik ${p.name} ditemukan.`);
    playOneShot('whisper', .18);
    marker.remove();
    relicMarkers = relicMarkers.filter(m=>m!==marker);
    updateUI();
    if(state.collected >= 5) winGame();
    else if(state.collected >= 4){
      state.criticalMode = true;
      bloodTextOnce('SATU RELIK LAGI');
      toast('Portal hampir terbuka. Jangan salah langkah.');
    }
  });
  relicMarkers.push(marker);
}

function addTrap(p,i){
  const el = document.createElement('button');
  el.className = 'trap-marker';
  el.type = 'button';
  el.textContent = '👁️';
  el.title = 'Jebakan ' + p.name;
  const coord = spacedCoord(p.coord, i, true);
  const marker = new maplibregl.Marker({element:el}).setLngLat(coord).addTo(map);
  el.addEventListener('click', ev => {
    ev.stopPropagation(); state.lastLayerClick = Date.now();
    marker.remove();
    trapMarkers = trapMarkers.filter(m=>m!==marker);
    state.trapHits += 1;
    raiseDanger(state.criticalMode ? 38 : 24, 'Jebakan aktif. Tension naik.', p.creature || randomCreature());

    // Jumpscare hanya kalau jebakan terjadi di fase kritis atau trap kedua
    if(state.criticalMode || state.trapHits >= 2 || state.danger >= 96){
      maybeCriticalScare(p.creature || randomCreature(), state.criticalMode ? 'jebakan saat portal hampir terbuka' : 'jebakan beruntun');
    } else {
      bloodTextOnce('ADA SESUATU BERGERAK');
      playOneShot('brokenRadio', .22);
      toast('Jebakan terpicu, tapi belum cukup kritis untuk jumpscare.');
    }
  });
  trapMarkers.push(marker);
}

function clearRelics(){
  relicMarkers.forEach(m=>m.remove());
  trapMarkers.forEach(m=>m.remove());
  relicMarkers = []; trapMarkers = [];
}

function winGame(){
  state.miniGame = false;
  clearTimeout(state.idleScareTimer);
  document.getElementById('gameStatus').textContent = 'Semua relik ditemukan. Portal tertutup aman.';
  document.getElementById('scenarioTitle').textContent = 'Mini Game Selesai';
  document.getElementById('scenarioText').textContent = 'Relik berhasil diamankan. Kamu lolos tanpa memicu entitas utama.';
  clearRelics();
  reduceDanger(30, 'Semua relik ditemukan.');
  toast('Mini game selesai. Tidak ada jumpscare tambahan biar nggak terasa maksa.');
}

function raiseDanger(amount, reason='', creature='kunti', quiet=false){
  state.danger = Math.min(100, state.danger + amount);
  state.sanity = Math.max(0, state.sanity - Math.round(amount/3));
  updateUI();
  if(state.danger > 55 && state.audioUnlocked) playOneShot('heartbeat', .18);
  if(!quiet && reason) toast(reason + ` Danger ${Math.round(state.danger)}%.`);
  if(state.danger >= 100){
    maybeCriticalScare(creature || randomCreature(), 'danger meter penuh');
    state.danger = 38;
    state.wrongClicks = 0;
    updateUI();
  }
}

function reduceDanger(amount, reason=''){
  state.danger = Math.max(0, state.danger - amount);
  updateUI();
  if(reason) toast(reason + ` Danger ${Math.round(state.danger)}%.`);
}

function maybeCriticalScare(creature='kunti', reason='momen kritis'){
  if(state.scareQueued || state.scareVisible) return;
  const now = Date.now();
  if(now - state.lastScareAt < state.scareCooldownMs) {
    bloodTextOnce('JANGAN MENENGOK');
    toast('Tension tinggi, tapi jumpscare ditahan dulu biar tidak spam.');
    return;
  }
  state.lastScareAt = now;
  scheduleJumpscare(creature, reason, 900 + Math.random()*700);
}

function scheduleJumpscare(creature='kunti', reason='trigger otomatis', delay=900){
  if(state.scareQueued || state.scareVisible) return;
  state.scareQueued = true;
  bloodTextOnce('ADA YANG MENGIKUTI');
  playOneShot('brokenRadio', .26);
  toast('Sinyal terganggu...');
  setTimeout(()=>{
    state.scareQueued = false;
    triggerJumpscare(creature, reason);
  }, delay);
}

function triggerJumpscare(creature='kunti', reason=''){
  unlockAudio();
  const c = CREATURES[creature] || CREATURES.kunti;
  state.scareVisible = true;
  const overlay = document.getElementById('jumpscareOverlay');
  const img = document.getElementById('jumpscareImage');
  const caption = document.getElementById('jumpscareCaption');
  img.src = c.img;
  caption.textContent = c.name;
  overlay.classList.remove('hidden');
  overlay.setAttribute('aria-hidden','false');
  document.body.classList.add('screen-shake');
  flash(.95);
  c.sequence.forEach((key,i)=>setTimeout(()=>playOneShot(key), i*150));
  state.sanity = Math.max(0, state.sanity - 10);
  updateUI();
  toast('JUMPSCARE KRITIS: ' + pick(c.messages) + (reason ? ` (${reason})` : ''));
  setTimeout(hideJumpscare, 1450);
}

function hideJumpscare(){
  const overlay = document.getElementById('jumpscareOverlay');
  overlay.classList.add('hidden');
  overlay.setAttribute('aria-hidden','true');
  document.body.classList.remove('screen-shake');
  state.scareVisible = false;
}

function hauntedVisual(id){
  const p = HAUNTED_POINTS.find(x=>x.id===id) || pick(HAUNTED_POINTS);
  map.flyTo({center:p.coord,zoom:17,pitch:78,bearing:Math.random()*90-45,speed:.7});
  bloodTextOnce('KAMU MELIHATNYA');
  playLocationAudio(p.audio);
  toast('Visual horor ditampilkan. Jumpscare tidak langsung dipicu dari tombol ini.');
}

function focusRoute(id){
  const p = HAUNTED_POINTS.find(x=>x.id===id);
  if(p) map.flyTo({center:p.coord,zoom:15.8,pitch:70,bearing:-35,speed:.8});
  toast('Rute ditampilkan. Kalau OSRM aktif, garis mengikuti jalan OSM.');
}

function bindUI(){
  document.getElementById('enterBtn').onclick = () => {
    document.getElementById('introGate').style.display = 'none';
    unlockAudio();
    playLoop('ambience');
    document.body.classList.add('kliwon');
    playOneShot('thunder', .7);
    toast('Audio aktif. Mode horor siap.');
  };
  document.getElementById('kliwonBtn').onclick = toggleKliwonMode;
  document.getElementById('ghostHuntBtn').onclick = toggleGhostHunt;
  document.getElementById('miniGameBtn').onclick = startMiniGame;
  document.getElementById('view3dBtn').onclick = activate3DView;
  document.getElementById('osmRouteBtn').onclick = loadOsmRoutes;
  document.querySelectorAll('.audio-btn').forEach(btn => btn.onclick = () => playLoop(btn.dataset.track));
  document.getElementById('stopTrackBtn').onclick = stopTrack;
  document.querySelectorAll('.test-scare').forEach(btn => btn.onclick = () => triggerJumpscare(btn.dataset.creature, 'test efek'));
  document.getElementById('muteBtn').onclick = toggleMute;
  document.getElementById('panicBtn').onclick = panic;
  document.getElementById('resetBtn').onclick = () => { map.flyTo({center,zoom:14.2,pitch:63,bearing:-18,speed:.8}); toast('Kamera direset.'); };

  document.getElementById('layerBuildings').onchange = e => ['buildings-3d','landmarks-3d','beacons-3d'].forEach(id=>toggleLayer(id,e.target.checked));
  document.getElementById('layerRisk').onchange = e => ['risk-zones','risk-outline'].forEach(id=>toggleLayer(id,e.target.checked));
  document.getElementById('layerSafe').onchange = e => ['safe-zones','safe-outline'].forEach(id=>toggleLayer(id,e.target.checked));
  document.getElementById('layerRoutes').onchange = e => toggleLayer('routes-line', e.target.checked);
  document.getElementById('layerHaunted').onchange = e => hauntedMarkers.forEach(m=>m.el.style.display=e.target.checked?'flex':'none');
  document.getElementById('layerFacilities').onchange = e => facilityMarkers.forEach(m=>m.el.style.display=e.target.checked?'flex':'none');
  document.getElementById('hauntedSlider').oninput = e => {
    const v = Number(e.target.value);
    document.getElementById('sliderText').textContent = 'Tampilkan skor ≥ ' + v;
    hauntedMarkers.forEach(m=>m.el.style.display=m.data.score>=v?'flex':'none');
    renderLegendList(HAUNTED_POINTS.filter(p=>p.score>=v));
  };
  document.getElementById('searchInput').oninput = e => {
    const q = e.target.value.toLowerCase();
    renderLegendList(HAUNTED_POINTS.filter(p => (p.name+p.category+p.story).toLowerCase().includes(q)));
  };
  document.addEventListener('mousemove', e => {
    document.documentElement.style.setProperty('--x', e.clientX + 'px');
    document.documentElement.style.setProperty('--y', e.clientY + 'px');
  });
  document.getElementById('jumpscareOverlay').addEventListener('click', hideJumpscare);
}

function toggleLayer(id,on){ if(map.getLayer(id)) map.setLayoutProperty(id,'visibility',on?'visible':'none'); }


function toggleKliwonMode(){
  unlockAudio(false);
  state.kliwon = !state.kliwon;
  document.body.classList.toggle('kliwon', state.kliwon);
  const btn = document.getElementById('kliwonBtn');
  if(btn) btn.textContent = state.kliwon ? '☀️ Matikan Malam Jumat' : '🌑 Aktifkan Malam Jumat';
  const title = document.getElementById('scenarioTitle');
  const scenarioText = document.getElementById('scenarioText');
  if(state.kliwon){
    if(!state.activeTrack) playLoop('ambience');
    playOneShot('thunder', .55);
    flash(.35);
    bloodTextOnce('MALAM JUMAT KLIWON');
    if(map.getLayer('osm')){
      map.setPaintProperty('osm','raster-brightness-max',.24);
      map.setPaintProperty('osm','raster-contrast',.55);
    }
    if(title) title.textContent = 'Malam Jumat Kliwon Aktif';
    if(scenarioText) scenarioText.textContent = 'Kabut, lightning, dan ambience aktif. Mode ini tidak memicu jumpscare sendiri.';
    toast('Malam Jumat aktif: efek visual + ambience, tanpa auto jumpscare.');
  }else{
    if(map.getLayer('osm')){
      map.setPaintProperty('osm','raster-brightness-max',.38);
      map.setPaintProperty('osm','raster-contrast',.36);
    }
    if(title) title.textContent = state.miniGame ? 'Mini Game Relik Aktif' : 'Mode Jelajah Horor';
    if(scenarioText) scenarioText.textContent = state.miniGame ? 'Cari relik, hindari trap, dan jangan biarkan danger penuh.' : 'Klik lokasi urban legend, ikuti rute, dan jangan terlalu sering asal klik.';
    toast('Malam Jumat dimatikan.');
  }
}

function activate3DView(){
  map.flyTo({center:[110.3647,-7.8053],zoom:16.25,pitch:78,bearing:-34,speed:.7});
  ['buildings-3d','landmarks-3d','beacons-3d'].forEach(id=>toggleLayer(id,true));
  const cb = document.getElementById('layerBuildings'); if(cb) cb.checked = true;
  showInfo(`<h2>🏙️ Mode 3D Dekat</h2><p>Kamera diposisikan rendah dan miring supaya extrusion bangunan, landmark heritage, dan kolom hantu terlihat jelas sebagai model 3D.</p><div class="quote">Layer 3D aktif: bangunan kota + landmark 3D + beacon urban legend.</div>`);
  toast('Mode 3D dekat aktif. Bangunan sekarang lebih kelihatan tinggi/bervolume.');
}

function toggleGhostHunt(){
  unlockAudio();
  state.ghostHunt = !state.ghostHunt;
  document.getElementById('torch').classList.toggle('hidden', !state.ghostHunt);
  if(state.ghostHunt) playOneShot('whisper', .3);
  toast(state.ghostHunt ? 'Ghost Hunt Mode aktif. Gerakkan kursor seperti senter.' : 'Ghost Hunt Mode mati.');
}

function playLocationAudio(type){
  unlockAudio(false);
  const mapAudio = {water:'wind',gong:'terror',whisper:'kuntiLaugh',wind:'wind',hum:'radio',train:'brokenRadio',crowd:'heartbeat',bell:'terror',forest:'wolves'};
  const key = mapAudio[type] || 'whisper';
  playOneShot(key, key==='heartbeat'? .28 : undefined);
  flash(.18);
}

function unlockAudio(show=true){
  state.audioUnlocked = true;
  if(show) toast('Audio siap.');
}

function playLoop(key){
  unlockAudio(false);
  const conf = AUDIO[key] || AUDIO.ambience;
  stopTrack();
  const audio = new Audio(conf.src);
  audio.loop = true;
  audio.volume = state.muted ? 0 : conf.volume;
  audio.play().catch(err => { console.warn('audio play failed', err); toast('Audio belum bisa diputar. Klik halaman sekali lagi.'); });
  state.activeTrack = audio;
  state.activeTrackKey = key;
  toast('Soundtrack aktif: ' + conf.label);
}

function stopTrack(){
  if(state.activeTrack){ state.activeTrack.pause(); state.activeTrack.currentTime = 0; }
  state.activeTrack = null;
  state.activeTrackKey = null;
}

function playOneShot(key, volume){
  if(!state.audioUnlocked || state.muted) return;
  const conf = AUDIO[key];
  if(!conf) return;
  const audio = new Audio(conf.src);
  audio.volume = Math.max(0, Math.min(1, volume ?? conf.volume));
  audio.play().catch(err => console.warn('sfx failed', err));
}

function toggleMute(){
  state.muted = !state.muted;
  if(state.activeTrack) state.activeTrack.volume = state.muted ? 0 : (AUDIO[state.activeTrackKey]?.volume || .3);
  toast(state.muted ? 'Audio dimute.' : 'Audio aktif lagi.');
}

function panic(){
  hideJumpscare();
  document.body.classList.remove('kliwon','screen-shake');
  document.getElementById('torch').classList.add('hidden');
  document.getElementById('bloodText').style.opacity = 0;
  document.getElementById('flashLayer').style.opacity = 0;
  clearRelics();
  stopTrack();
  clearTimeout(state.idleScareTimer);
  state.miniGame = false; state.danger = 0; state.wrongClicks = 0; state.collected = 0; state.sanity = 100; state.criticalMode = false; state.trapHits = 0; state.kliwon = false;
  const kb = document.getElementById('kliwonBtn'); if(kb) kb.textContent = '🌑 Aktifkan Malam Jumat';
  document.getElementById('gamePanel').classList.add('hidden');
  updateUI();
  toast('Semua efek dimatikan. Aman buat lanjut presentasi.');
}

function updateUI(){
  document.getElementById('mLegend').textContent = HAUNTED_POINTS.length;
  document.getElementById('mRelic').textContent = `${state.collected}/5`;
  document.getElementById('mSanity').textContent = state.sanity;
  document.getElementById('dangerText').textContent = Math.round(state.danger) + '%';
  document.getElementById('dangerFill').style.width = Math.round(state.danger) + '%';
  const gp = document.getElementById('gameProgress');
  const gs = document.getElementById('gameStatus');
  if(gp) gp.style.width = (state.collected/5*100) + '%';
  if(gs) gs.textContent = `Relik: ${state.collected}/5 · salah klik: ${state.wrongClicks}/6 · trap: ${state.trapHits}/2`;
  const title = document.getElementById('scenarioTitle');
  const text = document.getElementById('scenarioText');
  if(state.miniGame){
    title.textContent = state.criticalMode ? 'Fase Kritis Mini Game' : 'Mini Game Relik Aktif';
    text.textContent = state.criticalMode ? 'Tinggal satu relik. Hindari jebakan dan zona merah.' : 'Cari relik, kurangi wrong click, dan jangan biarkan danger meter penuh.';
  }
}

function scheduleIdleScare(){
  clearTimeout(state.idleScareTimer);
  state.idleScareTimer = setTimeout(()=>{
    if(state.miniGame && state.danger > 92 && state.collected >= 4) maybeCriticalScare(randomCreature(), 'terlalu lama di fase kritis mini game');
    if(state.miniGame) scheduleIdleScare();
  }, 30000 + Math.random()*15000);
}

function bloodTextOnce(text){
  const b = document.getElementById('bloodText');
  b.textContent = text || 'JANGAN MENENGOK';
  b.style.opacity = .95;
  setTimeout(()=>{ b.style.opacity = 0; }, 1350);
}

function flash(strength=.65){
  const f = document.getElementById('flashLayer');
  f.style.opacity = strength;
  f.classList.remove('flash'); void f.offsetWidth; f.classList.add('flash');
  setTimeout(()=>{ f.style.opacity = 0; f.classList.remove('flash'); }, 560);
}

function makeDraggable(){
  document.querySelectorAll('.draggable').forEach(panel => {
    const handle = panel.querySelector('.drag-handle');
    if(!handle) return;
    let dragging = false, dx = 0, dy = 0;
    handle.addEventListener('mousedown', e => {
      dragging = true; dx = e.clientX - panel.offsetLeft; dy = e.clientY - panel.offsetTop; panel.style.right='auto'; panel.style.bottom='auto'; panel.style.zIndex=80;
    });
    document.addEventListener('mousemove', e => {
      if(!dragging) return;
      panel.style.left = Math.max(8, Math.min(window.innerWidth - panel.offsetWidth - 8, e.clientX - dx)) + 'px';
      panel.style.top = Math.max(8, Math.min(window.innerHeight - panel.offsetHeight - 8, e.clientY - dy)) + 'px';
    });
    document.addEventListener('mouseup', () => { dragging = false; panel.style.zIndex=50; });
  });
}

function toast(msg){
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.style.opacity = 1;
  clearTimeout(t._timer);
  t._timer = setTimeout(()=>{ t.style.opacity = .88; }, 3000);
}

function spacedCoord(coord, idx, trap=false){
  const base = trap ? [
    [0.0016,0.0012], [-0.0016,0.0014], [0.0014,-0.0015], [-0.0015,-0.0012]
  ] : [
    [0.0010,0.0008], [-0.0011,0.0009], [0.0012,-0.0010], [-0.0010,-0.0011], [0.0002,0.0015], [-0.0002,-0.0015]
  ];
  const off = base[idx % base.length];
  return [coord[0] + off[0], coord[1] + off[1]];
}
function shuffle(arr){ for(let i=arr.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [arr[i],arr[j]]=[arr[j],arr[i]]; } return arr; }
function pick(arr){ return arr[Math.floor(Math.random()*arr.length)]; }
function randomCreature(){ return pick(['kunti','pocong','genderuwo']); }

window.playLocationAudio = playLocationAudio;
window.hauntedVisual = hauntedVisual;
window.focusRoute = focusRoute;
window.triggerJumpscare = triggerJumpscare;
window.activate3DView = activate3DView;
window.toggleKliwonMode = toggleKliwonMode;
