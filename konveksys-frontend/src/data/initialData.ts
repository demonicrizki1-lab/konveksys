import {
  AuthUser,
  Brand,
  Vendor,
  HargaKonveksi,
  HargaBuyer,
  InboundRoll,
  SPKCutting,
  SuratJalan,
  KasbonTransaction,
  ReturnItem,
  AccessoryItem,
  AccessoryMutation,
  FobPurchaseOrder,
} from '../types';

export const demoUsers: AuthUser[] = [
  {
    id: 'u-admin',
    name: 'Maison Rayyan (Admin/Owner)',
    email: 'admin@konveksys.com',
    password: 'admin',
    role: 'ADMIN',
    avatar: 'MR',
  },
];

export const initialBrands: Brand[] = [];

export const initialVendors: Vendor[] = [
  { id: 'v-1', name: 'SAHIRA', specialty: 'Kemeja & Kemeja Hawai', contact: '0819-0011-2233', currentKasbon: 0 },
  { id: 'v-2', name: 'RAKSUKAN', specialty: 'Kaos & Pakaian Anak', contact: '0818-4455-6677', currentKasbon: 0 },
  { id: 'v-3', name: 'BU NIKEN', specialty: 'Seragam & Kemeja Formal', contact: '0812-7788-9900', currentKasbon: 0 },
  { id: 'v-4', name: 'KANG SONY', specialty: 'Bedah Standar & Kaos', contact: '0852-3344-5566', currentKasbon: 0 },
  { id: 'v-5', name: 'PA YUSMAN', specialty: 'TNI & Pakaian Taktikal', contact: '0878-9900-1122', currentKasbon: 0 },
];

export const initialHargaKonveksi: HargaKonveksi[] = [];
export const initialHargaBuyer: HargaBuyer[] = [];
export const initialInboundRolls: InboundRoll[] = [];
export const initialSPKList: SPKCutting[] = [];
export const initialSuratJalanList: SuratJalan[] = [];
export const initialKasbonList: KasbonTransaction[] = [];
export const initialPembayaranList: any[] = [];
export const initialReturnList: ReturnItem[] = [];
export const initialAccessories: AccessoryItem[] = [];
export const initialAccessoryMutations: AccessoryMutation[] = [];

// ============================================================
// INITIAL FOB SEED DATA
// ============================================================

export const initialFobMaterials = [
  { id: 'mat-1', kodeMaterial: 'MAT-KTN-30S', namaBahan: 'Cotton Combed 30s Reaktif', kategori: 'BAHAN_BAKU', satuan: 'Kilogram', hargaStandar: 115000, supplier: 'PT Indo Jaya Tekstil' },
  { id: 'mat-2', kodeMaterial: 'MAT-KTN-24S', namaBahan: 'Cotton Combed 24s Reaktif', kategori: 'BAHAN_BAKU', satuan: 'Kilogram', hargaStandar: 120000, supplier: 'PT Indo Jaya Tekstil' },
  { id: 'mat-3', kodeMaterial: 'MAT-PFR-MCR', namaBahan: 'Puffer Micron Parasut WP', kategori: 'BAHAN_BAKU', satuan: 'Yard', hargaStandar: 38000, supplier: 'Surabaya Garment Material' },
  { id: 'mat-4', kodeMaterial: 'MAT-DKR-6OZ', namaBahan: 'Dakron Silikon Padding 6 Oz', kategori: 'BAHAN_PENDUKUNG', satuan: 'Yard', hargaStandar: 18500, supplier: 'Mitra Busa Utama' },
  { id: 'mat-5', kodeMaterial: 'MAT-FNG-DSR', namaBahan: 'Furing Despo / Asahi Lembut', kategori: 'BAHAN_PENDUKUNG', satuan: 'Yard', hargaStandar: 14000, supplier: 'Surabaya Garment Material' },
  { id: 'mat-6', kodeMaterial: 'MAT-ZIP-YKK', namaBahan: 'Zipper Resleting Besi YKK 65cm', kategori: 'AKSESORIS', satuan: 'Pcs', hargaStandar: 12500, supplier: 'YKK Distributor Bandung' },
  { id: 'mat-7', kodeMaterial: 'MAT-LBL-WVN', namaBahan: 'Woven Label Leher & Care Label', kategori: 'AKSESORIS', satuan: 'Set', hargaStandar: 1800, supplier: 'Sentra Labelindo' },
  { id: 'mat-8', kodeMaterial: 'MAT-PLB-ZIP', namaBahan: 'Polybag Klip Tebal 0.5 + Hangtag', kategori: 'PACKAGING', satuan: 'Pcs', hargaStandar: 2200, supplier: 'Plastik Prima' },
  { id: 'mat-9', kodeMaterial: 'CMT-JKT-PFR', namaBahan: 'Ongkos Jahit CMT Jaket Puffer', kategori: 'JASA_CMT', satuan: 'Pcs', hargaStandar: 32000, supplier: 'Konveksi Mitra Utama' },
  { id: 'mat-10', kodeMaterial: 'CMT-BDR-DDA', namaBahan: 'Bordir Komputer Logo Dada', kategori: 'SABLON_BORDIR', satuan: 'Pcs', hargaStandar: 6000, supplier: 'Bordir Express 24' },
];

export const initialFobProducts = [
  { id: 'prod-1', kodeProduk: 'JKT-MICRON', namaProduk: 'Jaket Puffer Micron Water Resistant', size: 'M', kategori: 'Jaket', brand: 'Maison Supply', vendorCmt: 'SAHIRA' },
  { id: 'prod-2', kodeProduk: 'JKT-MICRON', namaProduk: 'Jaket Puffer Micron Water Resistant', size: 'L', kategori: 'Jaket', brand: 'Maison Supply', vendorCmt: 'SAHIRA' },
  { id: 'prod-3', kodeProduk: 'JKT-MICRON', namaProduk: 'Jaket Puffer Micron Water Resistant', size: 'XL', kategori: 'Jaket', brand: 'Maison Supply', vendorCmt: 'SAHIRA' },
  { id: 'prod-4', kodeProduk: 'RMP-TAC-01', namaProduk: 'Rompi Tactical Multi-Pocket', size: 'L', kategori: 'Rompi', brand: 'Tactical Gear', vendorCmt: 'PA YUSMAN' },
  { id: 'prod-5', kodeProduk: 'KAOS-BASIC', namaProduk: 'Heavyweight Oversized T-Shirt 24s', size: 'M', kategori: 'Kaos', brand: 'Urban Basics', vendorCmt: 'RAKSUKAN' },
  { id: 'prod-6', kodeProduk: 'KAOS-BASIC', namaProduk: 'Heavyweight Oversized T-Shirt 24s', size: 'XL', kategori: 'Kaos', brand: 'Urban Basics', vendorCmt: 'RAKSUKAN' },
];

export const initialFobOrders: FobPurchaseOrder[] = [
  {
    id: 'po-fob-0002',
    poNumber: 'PO-PH-0002',
    internalId: 'PH-0002',
    tanggalPo: '2026-09-16',
    targetTiba: '2026-09-30',
    deadlineDays: 14,
    brand: 'MONTURE',
    vendor: 'TRIKARSA',
    pic: 'CECEP',
    prioritas: 'TINGGI',
    status: 'DISETUJUI',
    skuInduk: 'ROMPI HOODIE PUFFER',
    totalQty: 120,
    hargaRataRata: 78667,
    totalPembelian: 9440000,
    biayaLain: 0,
    grandTotal: 9440000,
    keterangan: `1. PRODUK YANG DISEPAKATI SAMA TIM FINANCE DAN MARKETING MEMAKAI BAHAN GRADE B\n2. PACKAGING MENGGUNAKAN PLASTIK YANG SUDAH DI SABLON\n3. FINANCE MENENTUKAN BATAS BAWAH ROAS 4\n4. TARGET PENJUALAN DI ATAS 65% DARI TOTAL MASING-MASING PO UNTUK MENDAPATKAN MINIMAL PROFIT\n5. TARGET DEADLINE PRODUKSI DI AWAL 14 HARI, JIKA REPEAT ORDER BISA MENJADI 7 HARI`,
    persetujuanDibuat: 'CECEP',
    persetujuanDisetujui: 'MANAJEMEN MONTURE',
    persetujuanVendor: 'TRIKARSA',
    items: [
      { id: 'it-1', no: 1, sku: 'ROMPI HOODIE PUFFER', warna: 'HITAM', size: 'M', qty: 5, hargaBeli: 72000, subtotal: 360000, catatan: '' },
      { id: 'it-2', no: 2, sku: 'ROMPI HOODIE PUFFER', warna: 'HITAM', size: 'L', qty: 5, hargaBeli: 72000, subtotal: 360000, catatan: '' },
      { id: 'it-3', no: 3, sku: 'ROMPI HOODIE PUFFER', warna: 'HITAM', size: 'XL', qty: 5, hargaBeli: 77000, subtotal: 385000, catatan: '' },
      { id: 'it-4', no: 4, sku: 'ROMPI HOODIE PUFFER', warna: 'HITAM', size: '2XL', qty: 5, hargaBeli: 77000, subtotal: 385000, catatan: '' },
      { id: 'it-5', no: 5, sku: 'ROMPI HOODIE PUFFER', warna: 'HITAM', size: '3XL', qty: 5, hargaBeli: 87000, subtotal: 435000, catatan: '' },
      { id: 'it-6', no: 6, sku: 'ROMPI HOODIE PUFFER', warna: 'HITAM', size: '4XL', qty: 5, hargaBeli: 87000, subtotal: 435000, catatan: '' },
      { id: 'it-7', no: 7, sku: 'ROMPI HOODIE PUFFER', warna: 'NAVY', size: 'M', qty: 5, hargaBeli: 72000, subtotal: 360000, catatan: '' },
      { id: 'it-8', no: 8, sku: 'ROMPI HOODIE PUFFER', warna: 'NAVY', size: 'L', qty: 5, hargaBeli: 72000, subtotal: 360000, catatan: '' },
      { id: 'it-9', no: 9, sku: 'ROMPI HOODIE PUFFER', warna: 'NAVY', size: 'XL', qty: 5, hargaBeli: 77000, subtotal: 385000, catatan: '' },
      { id: 'it-10', no: 10, sku: 'ROMPI HOODIE PUFFER', warna: 'NAVY', size: '2XL', qty: 5, hargaBeli: 77000, subtotal: 385000, catatan: '' },
      { id: 'it-11', no: 11, sku: 'ROMPI HOODIE PUFFER', warna: 'NAVY', size: '3XL', qty: 5, hargaBeli: 87000, subtotal: 435000, catatan: '' },
      { id: 'it-12', no: 12, sku: 'ROMPI HOODIE PUFFER', warna: 'NAVY', size: '4XL', qty: 5, hargaBeli: 87000, subtotal: 435000, catatan: '' },
      { id: 'it-13', no: 13, sku: 'ROMPI HOODIE PUFFER', warna: 'ARMY', size: 'M', qty: 5, hargaBeli: 72000, subtotal: 360000, catatan: '' },
      { id: 'it-14', no: 14, sku: 'ROMPI HOODIE PUFFER', warna: 'ARMY', size: 'L', qty: 5, hargaBeli: 72000, subtotal: 360000, catatan: '' },
      { id: 'it-15', no: 15, sku: 'ROMPI HOODIE PUFFER', warna: 'ARMY', size: 'XL', qty: 5, hargaBeli: 77000, subtotal: 385000, catatan: '' },
      { id: 'it-16', no: 16, sku: 'ROMPI HOODIE PUFFER', warna: 'ARMY', size: '2XL', qty: 5, hargaBeli: 77000, subtotal: 385000, catatan: '' },
      { id: 'it-17', no: 17, sku: 'ROMPI HOODIE PUFFER', warna: 'ARMY', size: '3XL', qty: 5, hargaBeli: 87000, subtotal: 435000, catatan: '' },
      { id: 'it-18', no: 18, sku: 'ROMPI HOODIE PUFFER', warna: 'ARMY', size: '4XL', qty: 5, hargaBeli: 87000, subtotal: 435000, catatan: '' },
      { id: 'it-19', no: 19, sku: 'ROMPI HOODIE PUFFER', warna: 'ABU', size: 'M', qty: 5, hargaBeli: 72000, subtotal: 360000, catatan: '' },
      { id: 'it-20', no: 20, sku: 'ROMPI HOODIE PUFFER', warna: 'ABU', size: 'L', qty: 5, hargaBeli: 72000, subtotal: 360000, catatan: '' },
      { id: 'it-21', no: 21, sku: 'ROMPI HOODIE PUFFER', warna: 'ABU', size: 'XL', qty: 5, hargaBeli: 77000, subtotal: 385000, catatan: '' },
      { id: 'it-22', no: 22, sku: 'ROMPI HOODIE PUFFER', warna: 'ABU', size: '2XL', qty: 5, hargaBeli: 77000, subtotal: 385000, catatan: '' },
      { id: 'it-23', no: 23, sku: 'ROMPI HOODIE PUFFER', warna: 'ABU', size: '3XL', qty: 5, hargaBeli: 87000, subtotal: 435000, catatan: '' },
      { id: 'it-24', no: 24, sku: 'ROMPI HOODIE PUFFER', warna: 'ABU', size: '4XL', qty: 5, hargaBeli: 87000, subtotal: 435000, catatan: '' },
    ],
    createdAt: '2026-09-16T10:00:00.000Z',
  },
];

