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
  rateSML: number;       // S, M, L
  rateXL: number;        // XL, 2XL
  rateAnak4_10: number;  // Size 4-10
  rateAnak12_16: number; // Size 12-16
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
  anak4_10: number;
  anak12_16: number;
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
}

export interface SuratJalanItem {
  spkId: string;
  spkNumber: string;
  brand: string;
  produk: string;
  vendor: string;
  qtyDelivered: SizeBreakdown;
  totalPcs: number;
}

export interface SuratJalan {
  id: string;
  noSuratJalan: string;
  spkId: string;
  brand: string;
  produk: string;
  vendor: string;
  tanggal: string;
  qtyDelivered: SizeBreakdown;
  totalPcs: number;
  driverName: string;
  nomorKendaraan: string;
  status: 'DELIVERED' | 'RECEIVED' | 'INVOICED';
  catatan?: string;
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
  items: {
    suratJalanNo: string;
    tanggal: string;
    produk: string;
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
  items: {
    suratJalanNo: string;
    tanggal: string;
    produk: string;
    qtySML: number;
    rateSML: number;
    qtyXL: number;
    rateXL: number;
    qtyAnak4_10: number;
    rateAnak4_10: number;
    qtyAnak12_16: number;
    rateAnak12_16: number;
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

