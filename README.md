# Jogja After Dark: 3D Haunted City Experience

Prototype WebGIS untuk final project SIG Terapan.

## Isi revisi
- Lokasi studi dibatasi menjadi 5 zona sesuai tabel:
  1. Zona 1 — Keraton Ngayogyakarta Hadiningrat
  2. Zona 2 — Taman Sari (Water Castle)
  3. Zona 3 — Kota Gede (Makam Raja)
  4. Zona 4 — Jalan Malioboro – Alun-Alun
  5. Zona 5 — Gua Selarong & Bukit Sekitar
- Target hasil akhir dimasukkan ke panel web:
  - WebGIS 3D Interaktif
  - Model 3D Kota
  - Story Map / Narasi Urban Legend
  - Mini Game / Survival Mode
  - Infografis & Video
  - Laporan & Tutorial

## Struktur folder
```text
assets/
  audio/user/
  img/
css/
  style.css
data/
  layers.js
  points.js
js/
  app.js
index.html
README.md
RUN_LOCAL_SERVER.bat
SUMBER_URBAN_LEGEND_DAN_CATATAN.md
TUTORIAL_DEMO_PRESENTASI.md
```

## Cara buka lokal
Klik `RUN_LOCAL_SERVER.bat`, lalu buka alamat yang muncul. Alternatif:
```bash
python -m http.server 5500
```

## Cara upload ke GitHub Pages
1. Extract ZIP.
2. Upload semua isi folder ke repository GitHub.
3. Pastikan `index.html` ada di root repository, bukan di dalam folder tambahan.
4. Masuk ke Settings → Pages.
5. Source: Deploy from branch.
6. Branch: `main`, folder `/root`.
7. Tunggu link GitHub Pages aktif.

## Catatan akademik
Koordinat masih prototype. Untuk versi final, validasi titik zona di QGIS/OSM, lalu update `data/points.js`.
