# History Cleaner Keyword

Ekstensi Edge (Manifest V3) untuk mencari dan menghapus history, download, dan cookies berdasarkan kata kunci.

## Fitur

- Cari history berdasarkan kata kunci, domain, dan rentang tanggal
- Filter lanjutan: title/URL, regex, duplicate cleaner, dry run, reset
- Hapus terpilih; hapus semua download & cookies per-website
- Auto-delete: terjadwal (detik/menit/jam) atau saat tab ditutup
- Log Aktivitas: statistik + undo (cookies dikembalikan, history dibuka ulang); log otomatis kosong saat browser ditutup
- Tema terang/gelap

## Cara pasang

1. Buka `edge://extensions`
2. Aktifkan "Developer mode"
3. Klik "Load unpacked" dan pilih folder proyek ini

## Struktur

- `manifest.json` - deklarasi ekstensi (MV3)
- `background.js` - service worker
- `popup.html` / `popup.js` / `popup.css` - antarmuka popup
- `icons/` - ikon ekstensi

## Privasi

Semua data disimpan lokal; tanpa server atau analitik. Log dapat berisi URL dan nilai cookie, tersimpan di `chrome.storage.local`, dan otomatis dihapus saat browser dimulai.

## Keterbatasan

- Undo history hanya membuka ulang URL; waktu kunjungan asli tidak bisa dipulihkan
- Daftar download tidak bisa di-restore (cukup dihapus dari daftar)
- Cache/permissions tidak bisa dilist per-website karena batasan API browser