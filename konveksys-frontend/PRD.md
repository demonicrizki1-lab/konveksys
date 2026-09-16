# PRODUCT REQUIREMENTS DOCUMENT (PRD)
## Sistem Informasi HPP FOB & Penawaran Harga Garment
**PT. Trikarsa Mandiri Raharja & PT. MRM Kreasi Indonesia**

---

### 1. INFORMASI DOKUMEN & IKHTISAR PRODUK

| Parameter | Keterangan |
| :--- | :--- |
| **Nama Produk** | HPP FOB Dashboard & Commercial Quotation System |
| **Versi Produk** | 1.0.0 (Production Ready) |
| **Target Pengguna** | Merchandiser (MD), Costing Staff, Production Manager, Direksi Manajemen |
| **Industri** | Manufaktur Garment, Maklon CMT, & FOB (Free On Board) |
| **Perusahaan Pengelola** | PT. Trikarsa Mandiri Raharja / PT. MRM Kreasi Indonesia |
| **Status Dokumen** | Disetujui (Approved) |

#### 1.1 Latar Belakang (Problem Statement)
Dalam industri garmen maklon dan manufaktur FOB, perhitungan Harga Pokok Penjualan (HPP) per potong pakaian sangat kompleks karena melibatkan:
1. **Diferensiasi Ukuran (Size-based Costing)**: Ukuran pakaian yang berbeda (misal: S, M, L vs XL, XXL) memerlukan konsumsi bahan (*marker/yardage/pemakaian*) yang berbeda sehingga nilai HPP dan harga jual rekomendasinya tidak boleh disamaratakan.
2. **Komponen Biaya Multi-Kategori**: Gabungan bahan utama, bahan pendukung, aksesoris, jasa jahit (CMT), sablon/bordir, *waste* susut bahan, cadangan reject cacat kain, hingga biaya operasional batch.
3. **Kerahasiaan Data Vendor vs Transparansi Buyer**: Keharusan menyembunyikan identitas vendor/supplier kain saat buyer meminta rincian HPP, tanpa mengurangi rincian perhitungan teknis.
4. **Kebutuhan Surat Penawaran FOB Resmi**: Buyer membutuhkan penawaran harga gabungan berbagai warna dan ukuran (*size breakdown*) dengan skema termin pembayaran (DP % & Pelunasan) yang rapi, profesional, dan akurat.

#### 1.2 Tujuan Produk (Product Objectives)
- Menyediakan kalkulator HPP otomatis berbasis invoice (`HPP/YYYY/xxxx`) per size dengan formula standar garmen nasional.
- Menyimpan database riwayat kalkulasi HPP yang dapat dicari, difilter, diedit, dan diekspor ke format PDF resmi.
- Menyediakan modul pembuatan Surat Penawaran Harga FOB (SPH) dengan tabel breakdown warna & size bertingkat yang terintegrasi langsung dengan database HPP.
- Menghasilkan 3 jenis dokumen PDF siap cetak dengan tata letak profesional berstandar korporat.

---

### 2. ARSITEKTUR TEKNIS & TEKNOLOGI

```
┌──────────────────────────────────────────────────────────────┐
│                    REACT 18 (VITE + SPA)                    │
├──────────────────────────────┬───────────────────────────────┤
│           UI LAYER           │         BUSINESS LOGIC        │
│ • TailwindCSS                │ • Kalkulasi HPP & Formula FOB │
│ • Lucide Icons               │ • Validator Input             │
│ • Responsive Dashboard Cards │ • Currency & Date Formatter   │
├──────────────────────────────┼───────────────────────────────┤
│          DATA STATE          │         REPORT ENGINE         │
│ • Context API (AppContext)   │ • jsPDF (Vector Graphics)     │
│ • LocalStorage Schema (v4)   │ • html2canvas Engine          │
└──────────────────────────────┴───────────────────────────────┘
```

- **Frontend Core**: React 18 (Vite Bundler, ES Modules)
- **Styling**: Tailwind CSS (Navy `#1e3a5f`, Amber `#b45309`, Gold `#f59e0b`, Slate)
- **Icons**: Lucide React
- **State & Penyimpanan**: React Context API + LocalStorage `hpp_fob_v4`
- **PDF Engine**: `jspdf` (100% Vector Layout Rendering tanpa blur resolusi)

---

### 3. FITUR & SPESIFIKASI MODUL UTAMA

#### 3.1 Modul Dashboard Eksekutif
- **Kartu Ringkasan Metrik**:
  - Total Kalkulasi HPP tersimpan.
  - Rata-rata HPP per PCS.
  - Rata-rata Rekomendasi Harga Jual FOB.
  - Estimasi Margin Keuntungan Bersih (%).
- **Visualisasi Komposisi Biaya**: Grafik proporsi biaya Bahan Baku, Jasa CMT, Cadangan Reject, dan Target Profit.
- **Tabel Log Aktivitas Terakhir**: Menampilkan 5 kalkulasi produk terakhir yang diinput ke sistem.

#### 3.2 Modul Master Data (Katalog Acuan)
Terdiri dari 2 sub-tabel independen:
1. **Master Material & Supplier**:
   - Menyimpan katalog kain (Cotton Combed, Puffer Micron, Baby Terry, Fleece, dll.), aksesoris (Resleting, Kancing, Tali, Polybag), dan jasa CMT.
   - Kolom: Kode Material, Nama Bahan, Kategori Biaya, Satuan (Meter, Yard, Pcs, Lembar), Harga Standar, Supplier / Vendor.
2. **Master Produk Acuan**:
   - Menyimpan daftar model pakaian yang diproduksi.
   - Kolom: Kode Produk, Nama Produk, **Size / Ukuran (S, M, L, XL, XXL, ALL SIZE)**, Kategori (Jaket, Rompi, Kemeja, Kaos, Celana), Brand / Buyer, Vendor CMT Acuan.

#### 3.3 Modul Input HPP (Kalkulator Garment Multi-Varian)
- **Penomoran Otomatis**: Auto-generate format invoice resmi garmen: `HPP/YYYY/0001` (berurutan dan unik).
- **Pemilihan Produk Master**: Otomatis mengisi nama produk, size, kategori, brand, dan vendor CMT saat dipilih dari dropdown.
- **Dedicated Size Selector**: Pilihan size dengan indikator label *"Beda Size = Beda HPP & Marker Bahan"*.
- **Tabel Komponen Bahan Dinamis**:
  - Pengguna dapat menambah, mengedit, dan menghapus baris bahan baku.
  - Kolom: Jenis Biaya, Nama Bahan, Satuan, Pemakaian / Marker, Harga Satuan (Rp), Waste Bahan (%), Subtotal HPP/PCS, Supplier.
  - *Formula HPP Bahan per Pcs*:
    $$\text{HPP Komponen} = \text{Pemakaian} \times \text{Harga Satuan} \times \left(1 + \frac{\text{Waste } \%}{100}\right)$$
- **Parameter Biaya Tambahan & Margin**:
  - Target Laba Bersih (%)
  - Cadangan Reject (%)
  - Pajak / PPN (%)
  - Zakat (%)
  - Fee Affiliate / Sales (%)
- **Hasil Kalkulasi Real-time**:
  - HPP Bahan & Aksesoris = $\sum \text{HPP Komponen Bahan}$
  - HPP CMT & Operasional = $\sum \text{HPP Komponen CMT}$
  - Total Sebelum Reject = $\text{HPP Bahan} + \text{HPP CMT}$
  - Nilai Cadangan Reject = $\text{Total Sebelum Reject} \times \text{Reject } \%$
  - **HPP FINAL PER PCS** = $\text{Total Sebelum Reject} + \text{Nilai Reject}$
  - Total Biaya Batch = $\text{HPP Final} \times \text{Jumlah Produksi}$
  - **Harga Jual Rekomendasi** = $\text{HPP Final} \times \left(1 + \frac{\text{Target Laba } \%}{100}\right)$
  - Laba Bersih per PCS = $\text{Harga Jual Rekomendasi} - \text{HPP Final}$

#### 3.4 Modul Database Produk & Manajemen Arsip
- **Tabel Data Terpadu**: Menampilkan seluruh riwayat kalkulasi HPP per size lengkap dengan No. HPP, Brand, Management, HPP Final, Rekomendasi Harga Jual, Margin, dan Tanggal.
- **Fitur Pencarian & Filter**: Pencarian instan berdasarkan No. HPP, Nama Produk, atau Brand, serta dropdown filter kategori pakaian.
- **Aksi Cepat**:
  - *Lihat Detail*: Modal interaktif ringkasan HPP dan rincian pemakaian bahan.
  - *Edit Data*: Mengambil data kalkulasi kembali ke lembar form Input HPP.
  - *Hapus Data*: Konfirmasi penghapusan data aman dengan modal validasi.
- **Dua Opsi Cetak PDF**:
  1. **Download PDF Semua Produk (Rekapitulasi)**: Menghasilkan tabel 4 kolom ringkas (*NO, NAMA PRODUK, SIZE (terurut alfabetik), HARGA JUAL*) untuk laporan inventaris dan rangkuman atasan.
  2. **Download PDF Per 1 Size (Rincian Kalkulasi Lengkap)**: Lembar kerja HPP lengkap yang mencakup informasi batch, rincian bahan, hasil HPP & margin, dan kolom tanda tangan resmi. **Kolom supplier otomatis dihilangkan** demi menjaga kerahasiaan vendor saat dibagikan ke buyer.

#### 3.5 Modul Penawaran Harga (Buyer Commercial Quotation)
- **Sinkronisasi Database HPP**: Menarik produk dan size yang telah dihitung HPP-nya langsung dari database.
- **Default Rincian Kosong**: Tabel rincian order bersih saat awal masuk halaman, tanpa baris otomatis yang membingungkan.
- **Koleksi Multi-Size (Append Mode)**:
  - User dapat memilih Size M $\rightarrow$ klik `+ Masukkan ke Rincian Order` $\rightarrow$ masuk ke tabel.
  - User dapat mengganti dropdown ke Size L $\rightarrow$ baris Size M tidak hilang $\rightarrow$ klik `+ Masukkan ke Rincian Order` $\rightarrow$ Size L bertambah di baris berikutnya.
- **Tabel Ringkasan FOB**:
  - Kolom ringkas: `BUYER | KODE PRODUK | NAMA PRODUK | TOTAL QTY | HARGA FOB / PCS | TOTAL ORDER | DP % | NOMINAL DP | SISA`.
- **Tabel Rincian Order Warna & Size**:
  - Kolom: `NO | SKU WARNA | SKU SIZE | JUMLAH (PCS) | HARGA / PCS | TOTAL | CATATAN | AKSI HAPUS`.
  - Masing-masing baris memiliki input harga per size dan dapat dihapus hingga kosong jika diperlukan.
- **Live Preview Dokumen**: Preview langsung surat resmi yang 100% identik dengan hasil cetak PDF.
- **Download PDF Surat Penawaran Resmi**:
  - Kop surat putih bersih dengan badge `SURAT PENAWARAN HARGA FOB`.
  - Kotak identitas buyer di sisi kanan atas.
  - Tabel Ringkasan 5 Kolom (*PRODUK, TOTAL QTY, HARGA/PCS, DP %, TOTAL ORDER*).
  - Tabel Rincian 6 Kolom (*No, SKU Warna, Size, Jumlah, Harga, Total*).
  - Kartu Ketentuan Pembayaran (DP & Sisa Pelunasan) dengan poin rapi.
  - Kolom tanda tangan resmi Buyer dan Manajemen.

#### 3.6 Modul Timeline Produksi
- Perencanaan durasi tahapan produksi garmen (Cutting, Jahit CMT, Sablon/Bordir, Finishing, QC, Packing).
- Penghitungan otomatis tanggal mulai dan estimasi tanggal selesai.
- Export PDF Dokumen Jadwal Timeline Produksi.

---

### 4. ATURAN BISNIS & FORMULA PERHITUNGAN

```
                   [ DAFTAR KOMPONEN BIAYA ]
                               │
               ┌───────────────┴───────────────┐
               ▼                               ▼
        HPP BAHAN BAKU                   HPP JASA CMT
    (Kain, Aksesori, Waste)         (Jahit, Sablon, Bordir)
               │                               │
               └───────────────┬───────────────┘
                               ▼
                   TOTAL HPP SEBELUM REJECT
                               │
                               ▼ + (Reject Reserve %)
                       HPP FINAL PER PCS
                               │
                               ▼ + (Target Laba Bersih %)
                    HARGA JUAL REKOMENDASI FOB
                               │
               ┌───────────────┴───────────────┐
               ▼                               ▼
       SPH RINCIAN ORDER              TERMIN PEMBAYARAN
     (Breakdown Warna/Size)         (DP % & Sisa Pelunasan)
```

1. **Aturan Susut Bahan (*Waste*)**:
   Tiap bahan memiliki tingkat susut pemotongan kain (*cutting waste*). Waste ditambahkan ke harga bahan sebelum dikalikan pemakaian:
   $$\text{Subtotal Bahan} = \text{Pemakaian} \times \text{Harga Satuan} \times (1 + \text{Waste})$$

2. **Aturan Cadangan Reject Pabrik**:
   Dihitung dari persentase terhadap total biaya produksi dasar:
   $$\text{Nilai Reject} = (\text{HPP Bahan} + \text{HPP CMT}) \times \frac{\text{Reject } \%}{100}$$

3. **Aturan Penawaran Multi-Harga Per Size**:
   Jika dalam satu model pakaian terdapat perbedaan harga antara size standar (S, M, L) dan size jumbo (XL, XXL), total penawaran harga dihitung secara kumulatif:
   $$\text{Total Order Nominal} = \sum_{i=1}^{n} (\text{QTY}_i \times \text{HargaPcs}_i)$$
   $$\text{Nominal DP} = \text{Total Order Nominal} \times \text{Rasio DP}$$
   $$\text{Sisa Pelunasan} = \text{Total Order Nominal} - \text{Nominal DP}$$

---

### 5. STANDAR KEAMANAN & PRIVASI DATA

- **Pemisahan Akses Buyer**:
  - Laporan yang diserahkan ke buyer (PDF Penawaran Harga & PDF Rincian HPP) **tidak memuat nama supplier atau vendor asal kain**, mencegah buyer melakukan pemotongan jalur maklon (*bypass*).
- **Ketahanan Data Klien**:
  - Seluruh data disimpan secara otomatis ke browser storage lokal dengan versi skema storage (`hpp_fob_v4`), mencegah benturan skema lama saat terjadi penambahan field baru.

---

### 6. RENCANA PENGEMBANGAN MASA DEPAN (ROADMAP)

| Fase | Target Fitur | Estimasi |
| :--- | :--- | :--- |
| **Fase 2** | Integrasi Database Backend (Node.js/PostgreSQL) & Multi-User Role (Merchandiser, Supervisor, Direksi) | Q4 2026 |
| **Fase 3** | Fitur PO Produksi Terintegrasi langsung dari Surat Penawaran yang disetujui | Q1 2027 |
| **Fase 4** | Integrasi Pelacakan Arus Kas & Penerimaan DP/Pelunasan Buyer | Q2 2027 |

---

*Dokumen ini merupakan spesifikasi resmi dan acuan kerja pengembangan berkelanjutan Sistem HPP FOB Garment Trikarsa / MRM.*
