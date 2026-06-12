# Evaluasi dan Perbaikan WebGIS Jogja After Dark V11

## Evaluasi Kekurangan Versi Sebelumnya
1. **Konten urban legend belum cukup jelas sumbernya.** Beberapa lokasi hanya berisi narasi horor, tetapi belum dibedakan mana yang berbasis sejarah/budaya, mana yang berupa storytelling kreatif.
2. **Visual 3D sudah ada, tetapi perlu diperkuat narasinya.** Landmark dan beacon 3D perlu dijelaskan sebagai representasi intensitas urban legend, bukan hanya objek dekoratif.
3. **Mini game sebelumnya terlalu mudah terasa error.** Penyebabnya karena titik relik/trap dibuat random sehingga terkadang membingungkan saat demo. Pada versi ini relik dan trap dibuat lebih deterministik.
4. **Jumpscare harus dibatasi.** Jumpscare tidak boleh muncul setiap klik lokasi. Pada versi ini jumpscare tetap critical-only.
5. **Rute perlu tetap aman saat internet/API gagal.** Sistem tetap memakai OSRM kalau tersedia, tetapi punya fallback route lokal agar demo tidak bergantung sepenuhnya pada server eksternal.

## Perbaikan V11
1. Menambahkan dan merapikan 10 titik urban legend/heritage:
   - Tugu Pal Putih
   - Stasiun Tugu
   - Malioboro
   - Benteng Vredeburg
   - Titik Nol Kilometer
   - Keraton Yogyakarta
   - Tamansari
   - Alun-Alun Kidul
   - Panggung Krapyak
   - Kotagede
2. Menambahkan kolom **Jenis sumber** pada panel info lokasi:
   - Sejarah-budaya
   - Tradisi/mitos populer
   - Storytelling fiktif berbasis tempat
3. Menambahkan Kotagede sebagai titik perluasan rute urban legend.
4. Memperbaiki mini game:
   - Relik dibuat tetap pada lokasi tertentu agar mudah didemo.
   - Trap dikurangi menjadi 2 titik.
   - Jumpscare hanya muncul saat danger tinggi/fase kritis.
5. Memperkuat analisis spasial:
   - Rute easy, medium, extreme, dan ekstensi Kotagede.
   - Zona risiko Tamansari, Keraton-Nol KM, Malioboro, Alkid, dan Kotagede.
   - Safe zone pada Alun-Alun Kidul, Vredeburg, dan Malioboro.
6. Menambahkan catatan sumber agar narasi tidak overclaim.

## Catatan Penting untuk Presentasi
Narasi hantu dalam WebGIS digunakan sebagai **urban storytelling**. Untuk bagian akademik, project tetap berdasar pada konsep 3D GIS, titik lokasi, rute, zona risiko, safe zone, dan analisis spasial. Cerita horor bukan diklaim sebagai fakta ilmiah, tetapi sebagai konten budaya/populer yang dikemas dalam geovisualisasi interaktif.
