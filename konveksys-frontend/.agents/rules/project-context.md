# Konveksys - Project Context & Discussion Memory

## Ringkasan Proyek
- **Aplikasi**: Konveksys Frontend (Sistem Manajemen & ERP Operasional Konveksi / Garment)
- **Tech Stack**: React (TypeScript), Vite, Tailwind CSS, Lucide React
- **Repositori**: `konveksys-frontend`

---

## Status Fitur & Modul Terakhir

### 1. PO Produksi & Cetak SPK (`ProductionPOPrintModal.tsx`, `printHelper.ts`)
- **Fitur**: Modal cetak SPK resmi dengan tata letak rapi, page-break handling, dan tanda tangan digital terintegrasi.
- **Tanda Tangan Terpasang**:
  - **Admin Produksi**: `Rizki Maulana` (aset: `ttd-rizki-maulana.png`, kaligrafi hitam solid transparan).
  - **Pimpinan / Kepala Workshop**: `Cecep Dayat` (aset: `ttd-cecep-dayat.png`).
  - **Vendor / Penjahit Konveksi**: Kolom paraf/tanda tangan manual vendor.
- **Standar Print**: Menggunakan helper iframe khusus (`printHelper.ts`) agar gambar tanda tangan dan layout tabel ter-render sempurna tanpa terpotong.

### 2. Arus Kas & Finansial Brand (`ArusKasView.tsx`, `MonthlyStatementModal.tsx`, `SlipGajiModal.tsx`)
- **Ringkasan Deposit & Utang**: Pembedaan tegas antara surplus deposit (saldo lebih) vs outstanding debt (piutang berjalan).
- **Riwayat Pembayaran**: Fasilitas edit dan delete log transaksi pembayaran.
- **Sinkronisasi Kas**: Pembayaran transfer dari brand terhubung dan sinkron langsung dengan pencatatan admin.
- **Performa Data**: Mekanisme stale-while-revalidate caching & parallel fetch untuk kecepatan loading data finansial.

### 3. Sisa Bahan & Saldo Titipan Antar-Konveksi (`FabricTransferModal.tsx`, `FabricTransferPrintModal.tsx`, `SuratPOProduksiView.tsx`)
- **Alur Bisnis**: Pengukuran fisik sisa kain di Konveksi A (meter/yard) -> dioper langsung ke Konveksi B tanpa PO awal -> mengendap sebagai "Saldo Titipan di Konveksi B" -> otomatis dialokasikan saat PO baru Konveksi B dibuat.
- **Surat Jalan Transfer**: Dokumen resmi 3 kolom tanda tangan (Konveksi Asal, Tim Logistik/Rizki Maulana, Konveksi Penerima).
- **Integrasi SPK PO**: Keterangan alokasi kain titipan otomatis tercantum di lembar cetak SPK Konveksi B.

### 4. SPK Cutting dari Sisa Kain Titipan (`SPKView.tsx`, `AppContext.tsx`, `OutboundView.tsx`)
- **Dual-Source Bahan**: Pembuatan SPK Cutting mendukung 2 pilihan sumber bahan: `[ 📦 Rol Kain Gudang Pusat ]` (smart pooling rol) atau `[ 🔄 Saldo Titipan di Konveksi ]` (sisa kain hasil transfer antar-vendor).
- **Input Manual Sesuai Arahan**: Nama produk dan rincian ukuran potong (S, M, L, XL, 2XL, Anak) diisi secara manual oleh tim cutting tanpa auto-pull rincian dari PO.
- **Siklus Saldo & Integritas**: Saat SPK Cutting dibuat dari saldo titipan, status titipan berubah menjadi `TERPAKAI`. Jika SPK dihapus, saldo otomatis dikembalikan menjadi `TERSEDIA`.
- **Surat Jalan (Outbound)**: Nama kain titipan otomatis terdeteksi dan tercantum pada Surat Jalan pengiriman hasil jahit.

---

## Aturan & Preferensi Kerja
1. **Memori Berkelanjutan**: Setiap keputusan teknis, arsitektur, dan perubahan signifikan dicatat agar kesinambungan diskusi terjaga di setiap sesi.
2. **Kualitas UI/UX**: Tampilan rapi, konsisten (font, border, spacing), siap cetak (print-friendly) dan responsif.
3. **Integritas Git**: Komit dengan pesan konvensional deskriptif (`feat(...)`, `fix(...)`, `style(...)`).
