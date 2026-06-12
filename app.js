'use strict';

const center=[110.3647,-7.8053];
let activeAudio=null;
let relicMode=false;
let relicFound=0;
const relicMarkers=[];

const RELICS=[
  {id:'r1',name:'Fragmen Tugu Pal Putih',coord:[110.3671,-7.7829],hint:'Relik awal di node utara rute.'},
  {id:'r2',name:'Arsip Benteng Vredeburg',coord:[110.3668,-7.8003],hint:'Relik heritage kolonial dekat Titik Nol.'},
  {id:'r3',name:'Keris Keraton',coord:[110.3647,-7.8053],hint:'Relik pusat narasi budaya.'},
  {id:'r4',name:'Kunci Lorong Tamansari',coord:[110.3594,-7.8101],hint:'Relik zona lorong air misterius.'},
  {id:'r5',name:'Daun Beringin Alkid',coord:[110.3632,-7.8119],hint:'Relik terakhir di ruang terbuka/safe zone.'}
];

const map=new maplibregl.Map({
  container:'map',
  style:{version:8,sources:{osm:{type:'raster',tiles:['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],tileSize:256,attribution:'© OpenStreetMap contributors'}},layers:[{id:'osm',type:'raster',source:'osm',paint:{'raster-saturation':-0.9,'raster-brightness-min':0,'raster-brightness-max':0.42,'raster-contrast':0.36}}]},
  center,zoom:14.4,pitch:68,bearing:-22,antialias:true
});
map.addControl(new maplibregl.NavigationControl({visualizePitch:true}),'top-left');

map.on('load',()=>{
  addLayers();
  addUrbanMarkers();
  addRelicMarkers();
  loadOsmBuildings();
  bindUI();
});

function addLayers(){
  map.addSource('risk',{type:'geojson',data:RISK});
  map.addLayer({id:'risk-fill',type:'fill',source:'risk',paint:{'fill-color':'#ff174f','fill-opacity':.34}});
  map.addLayer({id:'risk-line',type:'line',source:'risk',paint:{'line-color':'#ff174f','line-width':2,'line-dasharray':[2,1]}});

  map.addSource('safe',{type:'geojson',data:SAFE});
  map.addLayer({id:'safe-fill',type:'fill',source:'safe',paint:{'fill-color':'#33d17a','fill-opacity':.25}});
  map.addLayer({id:'safe-line',type:'line',source:'safe',paint:{'line-color':'#33d17a','line-width':2,'line-dasharray':[2,1]}});

  map.addSource('route',{type:'geojson',data:ROUTE});
  map.addLayer({id:'route-line',type:'line',source:'route',layout:{'line-cap':'round','line-join':'round'},paint:{'line-color':'#70d6ff','line-width':5,'line-opacity':.9}});
}

function parseHeight(tags){
  if(tags.height){
    const h=parseFloat(String(tags.height).replace(',','.').replace(/[^0-9.]/g,''));
    if(!Number.isNaN(h)&&h>0&&h<300) return {height:h,source:'OSM height'};
  }
  const lvRaw=tags['building:levels']||tags.levels;
  if(lvRaw){
    const lv=parseFloat(String(lvRaw).replace(',','.'));
    if(!Number.isNaN(lv)&&lv>0&&lv<80) return {height:lv*3.5,source:'OSM building:levels × 3.5 m'};
  }
  const t=tags.building||'yes';
  const fallback={house:6,residential:8,apartments:14,commercial:12,retail:10,hotel:18,school:12,university:14,mosque:16,church:18,public:14,yes:8};
  return {height:fallback[t]||8,source:'fallback bervariasi karena OSM tidak punya height/levels'};
}

async function loadOsmBuildings(){
  const b=map.getBounds();
  const south=Math.max(b.getSouth(),-7.835), west=Math.max(b.getWest(),110.345), north=Math.min(b.getNorth(),-7.775), east=Math.min(b.getEast(),110.405);
  const q=`[out:json][timeout:30];way["building"](${south},${west},${north},${east});out body geom;`;
  toast('Mengambil footprint bangunan asli dari OSM/Overpass...');
  try{
    const res=await fetch('https://overpass-api.de/api/interpreter',{method:'POST',body:q,headers:{'Content-Type':'text/plain'}});
    if(!res.ok) throw new Error(res.status);
    const data=await res.json();
    const fc=overpassToGeojson(data);
    if(!fc.features.length) throw new Error('0 building');
    setBuildings(fc);
    updateStats(fc);
    toast(`Berhasil: ${fc.features.length} footprint OSM ditampilkan sebagai gedung 3D.`);
  }catch(e){
    console.error(e);
    toast('Gagal ambil OSM live. Coba zoom lebih dekat lalu klik Ambil Ulang Footprint OSM.');
    setInfo('OSM Buildings gagal dimuat','Server Overpass bisa lambat atau area terlalu luas. Zoom ke Malioboro/Keraton lalu tekan tombol ambil ulang. Bentuk bangunan baru mengikuti OSM kalau data berhasil masuk.');
  }
}

function overpassToGeojson(data){
  const fs=[];
  for(const el of data.elements||[]){
    const tags=el.tags||{};
    if(!tags.building||!el.geometry||el.geometry.length<4) continue;
    const ring=el.geometry.map(p=>[p.lon,p.lat]);
    if(ring[0][0]!==ring[ring.length-1][0]||ring[0][1]!==ring[ring.length-1][1]) ring.push(ring[0]);
    const h=parseHeight(tags);
    fs.push({type:'Feature',properties:{osm_id:`${el.type}/${el.id}`,name:tags.name||'',building:tags.building,height_m:Math.round(h.height*10)/10,height_source:h.source,levels:tags['building:levels']||''},geometry:{type:'Polygon',coordinates:[ring]}});
  }
  return {type:'FeatureCollection',features:fs};
}

function setBuildings(fc){
  if(map.getSource('osm-buildings')) map.getSource('osm-buildings').setData(fc);
  else{
    map.addSource('osm-buildings',{type:'geojson',data:fc});
    map.addLayer({id:'osm-buildings-3d',type:'fill-extrusion',source:'osm-buildings',minzoom:13,paint:{
      'fill-extrusion-color':['interpolate',['linear'],['get','height_m'],0,'#2b184d',8,'#5b2590',16,'#8e24aa',30,'#ff4fb8'],
      'fill-extrusion-height':['get','height_m'],
      'fill-extrusion-base':0,
      'fill-extrusion-opacity':.9
    }});
    map.on('click','osm-buildings-3d',e=>{
      const p=e.features[0].properties;
      setInfo('🏙️ '+(p.name||p.building||'Bangunan OSM'),`<b>OSM ID:</b> ${p.osm_id}<br><b>Bentuk:</b> footprint polygon asli OSM<br><b>Tinggi:</b> ${Number(p.height_m).toFixed(1)} m<br><b>Sumber tinggi:</b> ${p.height_source}<br><br>Kalau sumbernya fallback, berarti bangunan OSM tersebut tidak punya atribut height maupun building:levels.`);
    });
  }
}

function updateStats(fc){
  const total=fc.features.length;
  const dataHeight=fc.features.filter(f=>String(f.properties.height_source).includes('OSM')).length;
  const avg=fc.features.reduce((a,f)=>a+Number(f.properties.height_m||0),0)/(total||1);
  document.getElementById('buildingCount').textContent=total;
  document.getElementById('heightCount').textContent=dataHeight;
  document.getElementById('avgHeight').textContent=avg.toFixed(1)+' m';
}

function addUrbanMarkers(){
  for(const p of URBAN){
    const el=document.createElement('button');
    el.className='urban-marker'; el.textContent=p.icon; el.title=p.name;
    new maplibregl.Marker({element:el}).setLngLat(p.coord).setPopup(new maplibregl.Popup({offset:26}).setHTML(`<img class="popup-img" src="${p.image}"><b>${p.icon} ${p.name}</b><br>${p.type}<br>Haunted Index: ${p.score}`)).addTo(map);
    el.onclick=()=>selectUrban(p);
  }
}

function selectUrban(p){
  map.flyTo({center:p.coord,zoom:16.5,pitch:74,bearing:-30,speed:.8});
  playOneShot('assets/audio/broken_radio_signal.wav',.25);
  setInfo(`${p.icon} ${p.name}`,`
    <img class="location-photo" src="${p.image}" onerror="this.style.display='none'">
    <div class="meta"><span>${p.type}</span><span>Haunted Index ${p.score}</span><span>Level ${p.level}</span></div>
    <p><b>Gambaran lokasi:</b> ${p.story}</p>
    <p><b>Urban legend & pengalaman ruang:</b> ${p.detail}</p>
    <div class="quote">“${p.quote}”</div>
    <p><b>Catatan:</b> Urban legend dipakai sebagai storytelling berbasis lokasi, bukan klaim fakta mutlak.</p>
  `);
}


function addRelicMarkers(){
  for(const r of RELICS){
    const el=document.createElement('button');
    el.className='relic-marker';
    el.textContent='📿';
    el.title=r.name;
    const popup=new maplibregl.Popup({offset:26}).setHTML(`<b>📿 ${r.name}</b><br>${r.hint}<br><small>Aktifkan Relic Hunt lalu klik relik ini.</small>`);
    const marker=new maplibregl.Marker({element:el}).setLngLat(r.coord).setPopup(popup).addTo(map);
    el.onclick=(ev)=>{
      ev.stopPropagation();
      collectRelic(r,el);
    };
    relicMarkers.push({data:r,el,marker,found:false});
  }
  updateRelicUI();
}

function collectRelic(r,el){
  if(!relicMode){
    toast('Klik “Mulai Relic Hunt” dulu baru relik bisa dikumpulkan.');
    return;
  }
  const item=relicMarkers.find(x=>x.data.id===r.id);
  if(!item || item.found){
    toast('Relik ini sudah ditemukan.');
    return;
  }
  item.found=true;
  el.classList.add('found');
  relicFound++;
  updateRelicUI();
  playOneShot('assets/audio/broken_radio_signal.wav',.35);
  setInfo('📿 '+r.name,`
    <p><b>Relik ditemukan.</b> Progress ${relicFound}/5.</p>
    <p>${r.hint}</p>
    <p>Relik ini menjadi elemen gamifikasi agar pengguna tidak hanya membaca peta, tetapi aktif mengeksplorasi rute urban legend.</p>
  `);
  if(relicFound<5){
    toast(`Relik ditemukan: ${relicFound}/5. Lanjutkan ke titik berikutnya.`);
  }else{
    toast('Semua relik ditemukan. Kembali ke safe zone / Alun-Alun Kidul.');
    setInfo('✅ Relic Hunt Selesai',`
      <p>Semua 5 relik berhasil ditemukan.</p>
      <p>Ending demo: pengguna diarahkan kembali ke safe zone. Ini membuktikan layer urban legend, rute, dan safe zone saling terhubung.</p>
    `);
  }
}

function startRelicHunt(){
  relicMode=true;
  document.getElementById('gameStatus').textContent='ON';
  toast('Relic Hunt aktif. Klik 5 relik kuning di peta.');
  setInfo('📿 Relic Hunt Mode',`
    <p>Mini game aktif. Tujuannya mengumpulkan 5 relik pada titik urban legend utama.</p>
    <p>Relik: Tugu, Vredeburg, Keraton, Tamansari, dan Alkid.</p>
  `);
}

function resetRelicHunt(){
  relicMode=false;
  relicFound=0;
  relicMarkers.forEach(x=>{
    x.found=false;
    x.el.classList.remove('found');
    x.el.style.display='grid';
  });
  updateRelicUI();
  document.getElementById('gameStatus').textContent='OFF';
  toast('Relic Hunt direset.');
}

function updateRelicUI(){
  const c=document.getElementById('relicCount');
  if(c) c.textContent=`${relicFound}/5`;
}

function bindUI(){
  document.getElementById('startRelic').onclick=startRelicHunt;
  document.getElementById('resetRelic').onclick=resetRelicHunt;
  document.getElementById('reload').onclick=loadOsmBuildings;
  document.getElementById('focus3d').onclick=()=>map.flyTo({center:[110.3649,-7.802],zoom:16.8,pitch:76,bearing:-34,speed:.8});
  document.getElementById('night').onclick=()=>{document.body.classList.toggle('night');toast('Mode Malam Jumat diubah.');playOneShot('assets/audio/terror_transition.wav',.4)};
  document.getElementById('ambience').onclick=()=>playLoop('assets/audio/horror_ambience.wav',.26);
  document.getElementById('stopAudio').onclick=stopAudio;
  document.getElementById('toggleBuildings').onchange=e=>toggle('osm-buildings-3d',e.target.checked);
  document.getElementById('toggleRisk').onchange=e=>['risk-fill','risk-line'].forEach(id=>toggle(id,e.target.checked));
  document.getElementById('toggleSafe').onchange=e=>['safe-fill','safe-line'].forEach(id=>toggle(id,e.target.checked));
  document.getElementById('toggleRoute').onchange=e=>toggle('route-line',e.target.checked);
  document.getElementById('toggleLegend').onchange=e=>document.querySelectorAll('.urban-marker').forEach(m=>m.style.display=e.target.checked?'grid':'none');
  document.getElementById('toggleRelic').onchange=e=>document.querySelectorAll('.relic-marker').forEach(m=>m.style.display=e.target.checked?'grid':'none');
}

function toggle(id,on){if(map.getLayer(id))map.setLayoutProperty(id,'visibility',on?'visible':'none')}
function setInfo(t,b){document.getElementById('infoTitle').textContent=t;document.getElementById('infoBody').innerHTML=b}
function toast(m){const t=document.getElementById('toast');t.textContent=m;clearTimeout(t._timer);t._timer=setTimeout(()=>t.style.opacity=.9,3000)}
function playLoop(src,v){stopAudio();activeAudio=new Audio(src);activeAudio.loop=true;activeAudio.volume=v;activeAudio.play().catch(()=>{})}
function playOneShot(src,v){const a=new Audio(src);a.volume=v;a.play().catch(()=>{})}
function stopAudio(){if(activeAudio){activeAudio.pause();activeAudio.currentTime=0;activeAudio=null}}
