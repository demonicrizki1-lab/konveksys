# KonvekSys - Sistem Manajemen Konveksi & Makloon Garment Terpadu

KonvekSys adalah sistem ERP makloon terintegrasi untuk konveksi dan garment multi-brand:
- **Multi-Brand Management**: Isolasi data per brand resmi (Greywolf, Cita-Cita, Creadive, Jenaka Kids).
- **Mitra Vendor Konveksi**: Database penjahit/CMT partner, perhitungan payroll, dan pencatatan kasbon.
- **Smart Pooling Stok Kain**: Pelacakan rol kain per barcode dengan alokasi otomatis status fisik ke SPK.
- **SPK Potong & Surat Jalan**: Tracking kuantiti terpotong dan terkirim (*delivered qty*).
- **Finance & Arus Kas**: Slip gaji penjahit, invoice tagihan buyer multi-size (dewasa & anak), dan kartu piutang/arus kas.

---

## 🛠️ Tech Stack
- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS
- **Backend**: Node.js, Hono.js, TypeScript, Prisma ORM
- **Database**: PostgreSQL (Supabase Cloud)

---

## 🚀 Panduan Menjalankan Lokal

### 1. Backend
```bash
cd konveksys-backend
npm install
# Buat file .env berdasarkan .env.example
npm run dev
```

### 2. Frontend
```bash
cd konveksys-frontend
npm install
npm run dev
```
