function poly(coords, props){return {type:'Feature',properties:props,geometry:{type:'Polygon',coordinates:[coords]}}}
function line(coords, props){return {type:'Feature',properties:props,geometry:{type:'LineString',coordinates:coords}}}
function rect(cx, cy, w, h, props){return poly([[cx-w/2,cy-h/2],[cx+w/2,cy-h/2],[cx+w/2,cy+h/2],[cx-w/2,cy+h/2],[cx-w/2,cy-h/2]], props)}
function oct(cx, cy, r, props){
  const pts=[]; for(let i=0;i<8;i++){const a=Math.PI*2*i/8+Math.PI/8; pts.push([cx+Math.cos(a)*r, cy+Math.sin(a)*r]);} pts.push(pts[0]); return poly(pts, props);
}

window.RISK_ZONES = {type:'FeatureCollection',features:[
  poly([[110.356,-7.812],[110.361,-7.812],[110.361,-7.806],[110.356,-7.806],[110.356,-7.812]],{name:'Zona Lorong Tamansari',risk:'high',creature:'kunti'}),
  poly([[110.362,-7.807],[110.368,-7.807],[110.368,-7.799],[110.362,-7.799],[110.362,-7.807]],{name:'Zona Heritage Keraton - Nol KM',risk:'medium',creature:'pocong'}),
  poly([[110.363,-7.796],[110.368,-7.796],[110.368,-7.790],[110.363,-7.790],[110.363,-7.796]],{name:'Koridor Malioboro Malam',risk:'medium',creature:'kunti'}),
  poly([[110.360,-7.814],[110.366,-7.814],[110.366,-7.809],[110.360,-7.809],[110.360,-7.814]],{name:'Area Beringin Alkid',risk:'high',creature:'pocong'}),
  poly([[110.395,-7.833],[110.402,-7.833],[110.402,-7.826],[110.395,-7.826],[110.395,-7.833]],{name:'Zona Lorong Kotagede',risk:'medium',creature:'genderuwo'})
]};

window.SAFE_ZONES = {type:'FeatureCollection',features:[
  poly([[110.3610,-7.8125],[110.3654,-7.8125],[110.3654,-7.8098],[110.3610,-7.8098],[110.3610,-7.8125]],{name:'Ruang Terbuka Alun-Alun Kidul',capacity:'Tinggi'}),
  poly([[110.3650,-7.8018],[110.3680,-7.8018],[110.3680,-7.7997],[110.3650,-7.7997],[110.3650,-7.8018]],{name:'Ruang Terbuka Vredeburg',capacity:'Sedang'}),
  poly([[110.3632,-7.7950],[110.3669,-7.7950],[110.3669,-7.7925],[110.3632,-7.7925],[110.3632,-7.7950]],{name:'Koridor Pedestrian Malioboro',capacity:'Sedang'})
]};

window.FALLBACK_ROUTES = {type:'FeatureCollection',features:[
  line([[110.3652,-7.7932],[110.3658,-7.8014],[110.3668,-7.8003]],{id:'easy',name:'Fallback Easy',type:'easy',color:'#33d17a'}),
  line([[110.3652,-7.7932],[110.3658,-7.8014],[110.3647,-7.8053],[110.3594,-7.8101]],{id:'medium',name:'Fallback Medium',type:'medium',color:'#ffd166'}),
  line([[110.3671,-7.7829],[110.3607,-7.7891],[110.3652,-7.7932],[110.3658,-7.8014],[110.3647,-7.8053],[110.3632,-7.8119],[110.3601,-7.8277]],{id:'extreme',name:'Fallback Extreme',type:'extreme',color:'#ff174f'}),
  line([[110.3647,-7.8053],[110.3632,-7.8119],[110.3988,-7.8297]],{id:'kotagede',name:'Fallback Ekstensi Kotagede',type:'kotagede',color:'#b14cff'})
]};

// Bangunan kota dibuat deterministik dan lebih tinggi supaya visual 3D benar-benar kelihatan.
const buildingFeatures=[];
let seed=1776;
function rand(){ seed=(seed*9301+49297)%233280; return seed/233280; }
for(let row=0; row<14; row++){
  for(let col=0; col<16; col++){
    const lng=110.352 + col*0.00215 + (rand()-.5)*0.00045;
    const lat=-7.816 + row*0.00205 + (rand()-.5)*0.00045;
    const w=0.00055+rand()*0.00065;
    const h=0.00045+rand()*0.00062;
    const height=12+Math.floor(rand()*70);
    const color=height>55?'#c01863':(height>35?'#6f22c7':'#2842a7');
    buildingFeatures.push(rect(lng,lat,w,h,{name:'Bangunan simulasi 3D',height,base:0,color}));
  }
}
window.BUILDINGS={type:'FeatureCollection',features:buildingFeatures};

// Landmark heritage dibuat besar/tinggi sebagai elemen 3D utama.
window.LANDMARKS_3D={type:'FeatureCollection',features:[
  rect(110.3647,-7.8053,0.0022,0.00135,{name:'Kompleks Keraton 3D',height:42,base:0,color:'#ff2d95'}),
  rect(110.3647,-7.8053,0.0011,0.00062,{name:'Pendopo Keraton 3D',height:68,base:42,color:'#ffde72'}),
  rect(110.3594,-7.8101,0.0018,0.0012,{name:'Reruntuhan Tamansari 3D',height:36,base:0,color:'#8d4cff'}),
  rect(110.3589,-7.8101,0.00028,0.00145,{name:'Lorong Air Tamansari',height:24,base:36,color:'#44d9ff'}),
  rect(110.3668,-7.8003,0.0020,0.00115,{name:'Benteng Vredeburg 3D',height:38,base:0,color:'#7c1d6f'}),
  rect(110.3668,-7.8003,0.0015,0.00078,{name:'Halaman Dalam Vredeburg',height:16,base:38,color:'#ff3b8e'}),
  oct(110.3671,-7.7829,0.00042,{name:'Tugu Pal Putih 3D',height:125,base:0,color:'#ffffff'}),
  rect(110.3607,-7.7891,0.0021,0.0007,{name:'Stasiun Tugu 3D',height:40,base:0,color:'#3f7cff'}),
  rect(110.3652,-7.7932,0.00055,0.0032,{name:'Koridor Malioboro 3D',height:32,base:0,color:'#c2185b'}),
  oct(110.3632,-7.8119,0.00055,{name:'Beringin Kembar Alkid 3D',height:56,base:0,color:'#33d17a'}),
  rect(110.3601,-7.8277,0.0009,0.0009,{name:'Panggung Krapyak 3D',height:74,base:0,color:'#b14cff'}),
  rect(110.3988,-7.8297,0.0016,0.0012,{name:'Kotagede Heritage 3D',height:46,base:0,color:'#6f22c7'})
]};

window.HAUNTED_BEACONS={type:'FeatureCollection',features:(window.HAUNTED_POINTS||[]).map(p=>oct(p.coord[0],p.coord[1],0.00020,{name:'Kolom hantu: '+p.name,height:155,base:0,color:p.creature==='kunti'?'#ff4fb8':(p.creature==='pocong'?'#33d17a':'#7a2cff'),creature:p.creature}))};
