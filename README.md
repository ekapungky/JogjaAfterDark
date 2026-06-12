# Jogja After Dark: 3D Haunted City Experience — V8 Fixed

Prototype WebGIS interaktif untuk tema urban legend Jogja.

## Cara menjalankan
1. Extract ZIP.
2. Buka folder project.
3. Double click `RUN_LOCAL_SERVER.bat` atau jalankan terminal:

```bash
python -m http.server 8000
```

4. Buka browser:

```text
http://localhost:8000
```

Jangan buka langsung `index.html` dengan file:// karena audio, fetch rute OSM, dan beberapa asset bisa tidak stabil.

## Fitur utama V8
- 3D WebGIS berbasis MapLibre GL.
- Ikon urban legend Jogja.
- Rute memakai OSRM/OpenStreetMap jika internet/API tersedia.
- Fallback route lokal jika OSRM gagal.
- Zona rawan horor dan zona aman.
- Mini game Relik Kutukan.
- Danger Meter.
- Jumpscare otomatis, bukan hanya tombol manual.
- Soundtrack horor dari file audio yang diupload.
- Visual jumpscare SVG: Kuntilanak, Pocong, Genderuwo.
- Tombol panik untuk mematikan semua efek.

## Trigger jumpscare otomatis
Jumpscare akan muncul saat:
- asal klik peta 3 kali saat mini game aktif;
- klik jebakan mata merah;
- Danger Meter mencapai 100%;
- pointer terlalu lama di zona merah saat mini game aktif;
- menyelesaikan semua relik;
- kadang muncul setelah terlalu lama idle pada mini game.

## Catatan presentasi
Untuk demo yang aman:
1. Klik `Masuk ke Kota Gelap`.
2. Klik `Malam Jumat Kliwon`.
3. Klik `Mulai Mini Game Relik`.
4. Suruh teman/audience cari relik.
5. Biarkan mereka salah klik / klik mata merah supaya jumpscare otomatis muncul.
6. Kalau terlalu ramai, tekan `Matikan Semua Efek`.

## Ganti gambar jumpscare
File ada di:

```text
assets/img/kunti.svg
assets/img/pocong.svg
assets/img/genderuwo.svg
```

Bisa diganti dengan PNG/JPG sendiri, lalu ubah path di `js/app.js` bagian `CREATURES`.


## Perbaikan V9
- Mini game distabilkan: tidak bisa start ganda, jumlah trap dikurangi, marker relik/trap dipisah agar tidak tumpang tindih.
- Jumpscare diubah jadi **critical-only**, jadi tidak spam saat klik lokasi biasa.
- Gambar jumpscare kuntilanak diganti versi yang lebih sinematik agar cocok dengan nuansa WebGIS.
- Audio ketawa kuntilanak memakai file upload pengguna.


## Perbaikan V10
- Tombol Malam Jumat dibuat ulang: sekarang hanya toggle visual/audio ambience, tidak memicu jumpscare dan tidak mengacaukan mini game.
- Mini game distabilkan lagi: start tidak dobel, trap dikurangi menjadi 2, wrong-click threshold dinaikkan, dan jumpscare hanya fase kritis.
- Visual 3D diperkuat: ada landmark 3D heritage, beacon/kolom hantu 3D, bangunan kota deterministik lebih tinggi, dan tombol Mode 3D Dekat.
- Gambar jumpscare kuntilanak + suara ketawa upload pengguna tetap dipakai.
