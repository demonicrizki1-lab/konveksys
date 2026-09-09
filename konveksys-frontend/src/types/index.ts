export type UserRole = 'ADMIN' | 'BRAND';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  brandName?: string;
  accessibleBrands?: string[];
  phone?: string;
  status?: 'ACTIVE' | 'PENDING_APPROVAL' | 'REJECTED';
  avatar?: string;
  password?: string;
}

export interface PendingBrandUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  status: 'ACTIVE' | 'PENDING_APPROVAL' | 'REJECTED';
  accessibleBrands: string[];
  brandName?: string;
  createdAt: string;
}

export interface ManagedUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  status: 'ACTIVE' | 'PENDING_APPROVAL' | 'SUSPENDED' | 'REJECTED';
  brandName?: string;
  accessibleBrands: string[];
  createdAt: string;
  updatedAt?: string;
}

export interface Brand {
  id: string;
  name: string;
  code: string;
  contactPerson: string;
  phone: string;
}

export interface Vendor {
  id: string;
  name: string;
  specialty?: string;
  contact: string;
  currentKasbon: number;
}

export interface HargaKonveksi {
  id: string;
  vendor: string;
  produk: string;
  brand: string;
  harga: number; // Ongkos jahit per pcs
}

export interface HargaBuyer {
  id: string;
  brand: string;
  produk: string;
  rateS: number;         // Anak Seri Huruf: S
  rateM: number;         // Anak Seri Huruf: M
  rateL: number;         // Anak Seri Huruf: L
  rateXL: number;        // Anak Seri Huruf: XL
  rateXXL: number;       // Anak Seri Huruf: 2XL
  rateSML?: number;      // Legacy fallback
  rateAnak4: number;     // Anak Seri Angka: 4
  rateAnak6: number;     // Anak Seri Angka: 6
  rateAnak8: number;     // Anak Seri Angka: 8
  rateAnak10: number;    // Anak Seri Angka: 10
  rateAnak12: number;    // Anak Seri Angka: 12
  rateAnak14: number;    // Anak Seri Angka: 14
  rateAnak16: number;    // Anak Seri Angka: 16
}

export type RollStatus = 'MENUNGGU_FISIK' | 'DI_GUDANG' | 'DIPROSES' | 'SELESAI';

export interface InboundRoll {
  id: string;
  rollCode: string;
  brand: string;
  jenisKain: string;
  meterLength: number;
  meterUsed: number;
  hargaModalMeter: number;
  status: RollStatus;
  tanggalMasuk: string;
  keterangan?: string;
}

export interface SizeBreakdown {
  s: number;
  m: number;
  l: number;
  xl: number;
  xxl: number;
  anak4: number;
  anak6: number;
  anak8: number;
  anak10: number;
  anak12: number;
  anak14: number;
  anak16: number;
}

export interface SPKProductItem {
  id: string;
  produk: string;
  vendor: string;
  targetCutQty: SizeBreakdown;
  deliveredQty: SizeBreakdown;
}

export interface SPKCutting {
  id: string;
  spkNumber: string;
  brand: string;
  produk: string;
  vendor: string;
  rollIds: string[]; // Rol yang di-pool
  targetCutQty: SizeBreakdown;
  deliveredQty: SizeBreakdown;
  tanggalSPK: string;
  targetSelesai: string;
  status: 'DRAFT' | 'IN_PRODUCTION' | 'PARTIAL_DELIVERED' | 'COMPLETED' | 'OVER_DELIVERY';
  catatan?: string;
  items?: SPKProductItem[]; // 1 s/d Maksimal 3 produk/artikel yang dihasilkan dari kain ini
}

export interface SuratJalanItem {
  id?: string;
  spkId: string;
  spkNumber: string;
  spkItemId?: string;
  brand: string;
  produk: string;
  vendor: string;
  jenisKain?: string;
  qtyDelivered: SizeBreakdown;
  totalPcs: number;
  catatan?: string;
}

export interface SuratJalan {
  id: string;
  noSuratJalan: string;
  brand: string;
  tanggal: string;
  items?: SuratJalanItem[]; // Multi-item delivery support (1 SJ = multiple products/SPKs)
  totalPcs: number;
  driverName: string;
  nomorKendaraan: string;
  status: 'DELIVERED' | 'RECEIVED' | 'INVOICED';
  catatan?: string;
  // Legacy single-item & summary fields
  spkId?: string;
  spkItemId?: string;
  produk: string;
  vendor: string;
  qtyDelivered?: SizeBreakdown;
  jenisKain?: string;
}

export interface KasbonTransaction {
  id: string;
  vendor: string;
  tanggal: string;
  jumlah: number;
  tipe: 'PINJAMAN' | 'POTONGAN_GAJI';
  keterangan: string;
}

export interface VendorPayrollSummary {
  vendor: string;
  totalPcs: number;
  totalGrossPay: number;
  kasbonDeduction: number;
  netPay: number;
  periodeAwal?: string;
  periodeAkhir?: string;
  periodeLabel?: string;
  items: {
    suratJalanNo: string;
    tanggal: string;
    produk: string;
    jenisKain?: string;
    brand: string;
    pcs: number;
    rate: number;
    subtotal: number;
  }[];
}

export interface BuyerInvoiceSummary {
  brand: string;
  invoiceNo: string;
  tanggal: string;
  jatuhTempo: string;
  periodeAwal?: string;
  periodeAkhir?: string;
  periodeLabel?: string;
  items: {
    suratJalanNo: string;
    tanggal: string;
    produk: string;
    jenisKain?: string;
    qtyS: number;
    rateS: number;
    qtyM: number;
    rateM: number;
    qtyL: number;
    rateL: number;
    qtyXL: number;
    rateXL: number;
    qtyXXL: number;
    rateXXL: number;
    qtySML?: number;
    rateSML?: number;
    qtyAnak4: number;
    rateAnak4: number;
    qtyAnak6: number;
    rateAnak6: number;
    qtyAnak8: number;
    rateAnak8: number;
    qtyAnak10: number;
    rateAnak10: number;
    qtyAnak12: number;
    rateAnak12: number;
    qtyAnak14: number;
    rateAnak14: number;
    qtyAnak16: number;
    rateAnak16: number;
    totalPcs: number;
    totalAmount: number;
  }[];
  totalPcs: number;
  grandTotal: number;
}

export type MetodePembayaran = 'TRANSFER' | 'TUNAI' | 'CEK' | 'GIRO';

export interface PembayaranBrand {
  id: string;
  brand: string;
  tanggal: string;
  jumlah: number;
  metode: MetodePembayaran;
  keterangan: string;
  referensiNomor?: string; // Nomor bukti transfer / nomor kwitansi
}

export interface ArusKasSummary {
  brand: string;
  totalTagihan: number;    // Dari BuyerInvoice (surat jalan)
  totalTerbayar: number;   // Total yang sudah dibayar
  outstanding: number;     // Sisa belum dibayar
  persentase: number;      // % pelunasan
}

export type ReturnStatus = 'DIAJUKAN' | 'DIKIRIM_KE_VENDOR' | 'SELESAI_REWORK' | 'REJECT_TOTAL';

export type ReturnSource = 'INTERNAL_QC' | 'BRAND_COMPLAINT';

export interface ReturnItem {
  id: string;
  noRetur: string;
  sumber: ReturnSource;
  spkId?: string;
  suratJalanId?: string;
  brand: string;
  produk: string;
  vendor: string;
  tanggalRetur: string;
  tanggalSelesai?: string;
  alasanCacat: string;
  kategoriCacat: string;
  catatan?: string;
  status: ReturnStatus;
  qtyBreakdown: SizeBreakdown;
  totalPcs: number;
  qtyReworked: number;
  qtyRejectTotal: number;
  spk?: { spkNumber: string };
  suratJalan?: { noSuratJalan: string };
}

// ============================================================
// Accessory & Trims (Non-Kain) Types
// ============================================================

export type AccessoryCategory =
  | 'LABEL'
  | 'BORDIR'
  | 'HANGTAG'
  | 'PLASTIK_PACKING'
  | 'WOVEN'
  | 'KANCING'
  | 'RESLETING'
  | 'BENANG'
  | 'KARET_ELASTIS'
  | 'LAINNYA';

export type AccessoryUnit =
  | 'PCS'
  | 'GROSS'
  | 'LUSIN'
  | 'METER'
  | 'ROLL'
  | 'CONE'
  | 'PACK'
  | 'LEMBAR'
  | 'BAL';

export interface AccessoryItem {
  id: string;
  sku: string;
  name: string;
  category: AccessoryCategory;
  brand?: string; // Khusus Brand Buyer tertentu atau 'UMUM'
  unit: AccessoryUnit;
  stock: number;
  safetyStock: number;
  location?: string;
  costPerUnit?: number;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type MutationType = 'MASUK' | 'KELUAR' | 'PENYESUAIAN';

export interface AccessoryMutation {
  id: string;
  accessoryId: string;
  accessoryName: string;
  sku: string;
  type: MutationType;
  quantity: number;
  unit: AccessoryUnit;
  date: string;
  sourceOrDestination?: string;
  spkId?: string;
  spkNumber?: string;
  recipientOrVendor?: string;
  notes?: string;
  costTotal?: number;
  createdAt: string;
}

// ============================================================
// BRAND INVENTORY & MARKETPLACE SALES (Portal Brand)
// ============================================================

export interface BrandProductSKU {
  id: string;
  brand: string;
  produk: string;
  sku: string;
  warna?: string;
  ukuran?: string;
  hpp: number;
  stokAwal: number;
  catatan?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type MarketplaceChannel = 'SHOPEE' | 'TIKTOK' | 'TOKOPEDIA' | 'LAZADA' | 'OFFLINE' | 'LAINNYA';

export interface BrandSale {
  id: string;
  brand: string;
  tanggal: string;
  marketplace: MarketplaceChannel | string;
  toko?: string;
  noPesanan?: string;
  username?: string;
  skuId?: string;
  sku: string;
  qty: number;
  hpp: number;
  omset: number;
  biayaIklan: number;
  biayaOperasional: number;
  estimasiProfit: number;
  catatan?: string;
  createdAt?: string;
}

export type StockExitCategory = 'SAMPLE_FOTO' | 'ENDORSEMENT' | 'REJECT_RUSAK' | 'GIFT_BONUS' | 'LAINNYA';

export interface BrandStockExit {
  id: string;
  brand: string;
  tanggal: string;
  skuId?: string;
  sku: string;
  qty: number;
  kategori: StockExitCategory | string;
  keterangan?: string;
  createdAt?: string;
}
