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
