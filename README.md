# Jogja After Dark V14 - Real OSM Footprint

Versi ini tidak memakai gedung dummy. Bentuk bangunan diambil dari footprint asli OpenStreetMap lewat Overpass API.

## Penting
- Harus internet.
- Buka pakai Live Server.
- Kalau bangunan tidak muncul, zoom lebih dekat ke area Malioboro/Keraton lalu klik "Ambil Ulang Footprint OSM".
- Tinggi:
  1. pakai OSM `height`;
  2. kalau kosong, pakai `building:levels × 3.5 m`;
  3. kalau kosong, fallback bervariasi sesuai tipe bangunan karena OSM tidak menyediakan tinggi.
