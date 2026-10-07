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
export type RollSourceType = 'CMT' | 'FOB';

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
  sourceType?: RollSourceType;
  sourcePONumber?: string;
  fobDepositId?: string;
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
  sourcePOId?: string | null;
  sourcePONumber?: string | null;
  // Multi-fabric / Setelan support
  fabricSourceType?: 'ROLL_GUDANG' | 'TITIPAN_VENDOR';
  rollIds?: string[];
  jenisKain?: string;
  depositId?: string | null;
  depositInfo?: {
    depositNumber?: string;
    sourceVendor?: string;
    targetVendor?: string;
    jenisKain: string;
    warna?: string | null;
    panjang: number;
    satuan: string;
    sourcePONumber?: string;
  } | null;
}

export interface SPKCutting {
  id: string;
  spkNumber: string;
  brand: string;
  produk: string;
  vendor: string;
  rollIds: string[]; // Rol yang di-pool (seluruh rol jika multi-bahan)
  targetCutQty: SizeBreakdown;
  deliveredQty: SizeBreakdown;
  tanggalSPK: string;
  targetSelesai: string;
  status: 'DRAFT' | 'IN_PRODUCTION' | 'PARTIAL_DELIVERED' | 'COMPLETED' | 'OVER_DELIVERY';
  catatan?: string;
  items?: SPKProductItem[]; // 1 s/d Maksimal 3 produk/artikel yang dihasilkan dari kain ini
  // Sisa bahan / Saldo Titipan Antar-Vendor
  fabricSourceType?: 'ROLL_GUDANG' | 'TITIPAN_VENDOR';
  depositId?: string | null;
  depositIds?: string[];
  depositInfo?: {
    depositNumber?: string;
    sourceVendor?: string;
    targetVendor?: string;
    jenisKain: string;
    warna?: string | null;
    panjang: number;
    satuan: string;
    sourcePONumber?: string;
  } | null;
  sourcePOId?: string | null;
  sourcePONumber?: string | null;
  sourcePONumbers?: string[]; // Daftar seluruh nomor PO jika multi-PO
  isMultiFabric?: boolean; // True jika SPK adalah setelan multi-bahan (tiap komponen beda bahan)
}

export interface SuratJalanItem {
  id?: string;
  spkId?: string;
  spkNumber?: string;
  sourcePOId?: string;
  sourcePONumber?: string;
  isManual?: boolean;
  legacyPoNumber?: string;
  spkItemId?: string;
  brand: string;
  produk: string;
  vendor: string;
  jenisKain?: string;
  qtyDelivered: SizeBreakdown;
  totalPcs: number;
  catatan?: string;
  // Audit verifikasi fisik penerimaan
  verifiedPcs?: number;
  discrepancyPcs?: number;
  itemDiscrepancyPcs?: number;
  originalQtyDelivered?: SizeBreakdown;
  originalTotalPcs?: number;
  verificationNote?: string;
  isVerified?: boolean;
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
  status: 'DELIVERED' | 'RECEIVED' | 'INVOICED' | 'VERIFIED' | 'DISCREPANCY' | string;
  catatan?: string;
  // Audit verifikasi penerimaan barang masuk
  verifiedBy?: string;
  verifiedAt?: string;
  verificationNote?: string;
  originalTotalPcs?: number;
  realTotalPcs?: number;
  discrepancyPcs?: number;
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

export interface VendorPayrollSettlement {
  id: string;
  vendor: string;
  poNumber: string;
  tanggalBayar: string;
  totalPcs: number;
  totalAmount: number;
  metodePembayaran: 'TRANSFER' | 'TUNAI' | 'LAINNYA';
  nomorReferensi?: string;
  catatan?: string;
  suratJalanNos: string[];
  createdAt: string;
}

export type VendorManualInvoiceCategory =
  | 'DP_ONGKOS_JAHIT'
  | 'PELUNASAN_DIMUKA'
  | 'TALANGAN_OPERASIONAL'
  | 'BORONGAN_KHUSUS'
  | 'LAINNYA';

export interface VendorManualInvoiceItem {
  id: string;
  deskripsi: string;
  qty?: number;
  satuan?: string;
  hargaSatuan?: number;
  subtotal: number;
}

export interface VendorManualInvoice {
  id: string;
  invoiceNo: string;
  vendor: string;
  tanggal: string;
  jatuhTempo?: string;
  spkId?: string;
  spkNumber?: string;
  poNumber?: string;
  brand?: string;
  produk?: string;
  kategori: VendorManualInvoiceCategory;
  keterangan: string;
  items: VendorManualInvoiceItem[];
  totalNominal: number;
  metodePembayaran: 'TRANSFER' | 'TUNAI' | 'CEK' | 'GIRO';
  bankTujuan?: string;
  nomorRekening?: string;
  namaRekening?: string;
  referensiTransfer?: string;
  status: 'DIBAYAR' | 'PENDING' | 'DIBATALKAN';
  tanggalBayar?: string;
  potongDiSlipGaji: boolean;
  isDeducted?: boolean;
  deductedAtPayrollId?: string;
  catatan?: string;
  createdAt: string;
}

export interface VendorPOPayrollPackage {
  poId?: string;
  poNumber: string;
  brand: string;
  produk: string;
  targetPcs: number;
  deliveredPcs: number;
  remainingPcs: number;
  percent: number;
  rate: number;
  subtotal: number;
  totalPay: number;
  isComplete: boolean;
  isSettled?: boolean;
  settlementInfo?: VendorPayrollSettlement;
  status: 'COMPLETED' | 'PENDING_DELIVERY';
  suratJalanList: {
    noSuratJalan: string;
    tanggal: string;
    pcs: number;
  }[];
}

export interface VendorPayrollSummary {
  vendor: string;
  totalPcs: number;
  totalGrossPay: number;
  kasbonDeduction: number;
  manualInvoiceDeduction?: number;
  manualInvoices?: VendorManualInvoice[];
  netPay: number;
  totalPendingPcs?: number;
  totalPendingPay?: number;
  periodeAwal?: string;
  periodeAkhir?: string;
  periodeLabel?: string;
  packages?: VendorPOPayrollPackage[];
  items: {
    suratJalanNo: string;
    tanggal: string;
    produk: string;
    jenisKain?: string;
    brand: string;
    pcs: number;
    rate: number;
    subtotal: number;
    poNumber?: string;
    isCompletedPO?: boolean;
    isSettled?: boolean;
  }[];
}

export interface BuyerInvoiceFabricItem {
  id: string;
  rollCode: string;
  jenisKain: string;
  tanggalMasuk: string;
  meterUsed: number;
  meterLength: number;
  hargaModalMeter: number;
  totalNilaiKain: number;
}

export interface BuyerInvoicePoItemProgress {
  id?: string;
  poNumber: string;
  namaProduk: string;
  warna?: string | null;
  ukuran?: string | null;
  targetQty: number;
  deliveredQty: number;
  remainingQty: number;
  bahanKain?: string | null;
  catatan?: string | null;
}

export interface BuyerInvoicePoEntry {
  id?: string;
  noPO: string;
  vendorTujuan?: string;
  tanggalPO?: string;
  targetDeadline?: string;
  targetPcs?: number;
  status?: string;
}

export interface BuyerInvoicePoInfo {
  id?: string;
  noPO: string;
  selectedPoNumbers?: string[];
  brand: string;
  vendorTujuan?: string;
  tanggalPO?: string;
  targetDeadline?: string;
  targetPcs?: number;
  catatan?: string | null;
  pos?: BuyerInvoicePoEntry[];
  totalTargetPcs?: number;
  totalDeliveredPcs?: number;
  totalRemainingPcs?: number;
  items?: {
    poNumber?: string;
    namaProduk: string;
    warna?: string | null;
    ukuran?: string | null;
    qty: number;
    bahanKain?: string | null;
    catatan?: string | null;
  }[];
  itemsProgress?: BuyerInvoicePoItemProgress[];
}

export interface BuyerInvoiceSummary {
  brand: string;
  invoiceNo: string;
  tanggal: string;
  jatuhTempo: string;
  periodeAwal?: string;
  periodeAkhir?: string;
  periodeLabel?: string;
  poInfo?: BuyerInvoicePoInfo;
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
    itemPo?: string;
  }[];
  totalPcs: number;
  subtotalGross?: number;
  fabricItems?: BuyerInvoiceFabricItem[];
  totalFabricMeters?: number;
  totalFabricDeduction?: number;
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
  outstanding: number;     // Sisa belum dibayar (jika tagihan > terbayar)
  lebihBayar?: number;     // Kelebihan bayar / deposit (jika terbayar > tagihan)
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

export type ProductionPOStatus = 'DRAFT' | 'DIKIRIM' | 'DALAM_PROSES' | 'SELESAI';

export interface ProductionPOItem {
  id: string;
  poId?: string;
  namaProduk: string;
  warna?: string | null;
  ukuran?: string | null;
  qty: number;
  bahanKain?: string | null;
  catatan?: string | null;
  depositId?: string | null;
  depositInfo?: string | null;
  sortOrder?: number;
  createdAt?: string;
}

export interface ProductionPO {
  id: string;
  noPO: string;
  brand: string;
  vendorTujuan: string;
  tanggalPO: string;
  targetDeadline: string;
  catatan?: string | null;
  usedDepositId?: string | null;
  usedDepositInfo?: string | null;
  status: ProductionPOStatus | string;
  totalPcs: number;
  items: ProductionPOItem[];
  createdAt: string;
  updatedAt?: string;
}

export type FabricDepositStatus = 'TERSEDIA' | 'TERPAKAI' | 'DITARIK';

export interface VendorFabricDeposit {
  id: string;
  sourcePOId: string;
  sourcePONumber: string;
  sourceVendor: string;
  targetVendor: string;
  brand: string;
  jenisKain: string;
  warna?: string | null;
  panjangAwal: number;
  panjangSisa: number;
  satuan: 'METER' | 'YARD';
  status: FabricDepositStatus;
  allocatedPOId?: string | null;
  allocatedPONumber?: string | null;
  allocatedSPKId?: string | null;
  allocatedSPKNumber?: string | null;
  measuredBy?: string | null;
  tanggalTitip: string;
  catatan?: string | null;
  createdAt: string;
  updatedAt?: string;
}

export interface FabricTransferNote {
  id: string;
  transferNumber: string;
  depositId: string;
  sourcePOId: string;
  sourcePONumber: string;
  sourceVendor: string;
  targetVendor: string;
  brand: string;
  jenisKain: string;
  warna?: string | null;
  panjang: number;
  satuan: 'METER' | 'YARD';
  driverName: string;
  kondisiKain?: string | null;
  tanggal: string;
  catatan?: string | null;
  createdAt: string;
}

// ============================================================
// FOB COSTING & COMMERCIAL QUOTATION (SPH)
// ============================================================

export type HPPComponentType =
  | 'BAHAN_BAKU'
  | 'BAHAN_PENDUKUNG'
  | 'AKSESORIS'
  | 'JASA_CMT'
  | 'SABLON_BORDIR'
  | 'PACKAGING'
  | 'OPERASIONAL';

export interface HPPComponentItem {
  id: string;
  jenisBiaya: HPPComponentType;
  namaBahan: string;
  satuan: string;         // Meter, Yard, Pcs, Lembar, Rol, dll.
  pemakaian: number;      // Marker/konsumsi per potong
  hargaSatuan: number;    // Rp per satuan
  wastePercent: number;   // % susut pemotongan (cutting waste)
  subtotal: number;       // pemakaian * hargaSatuan * (1 + waste/100)
  supplier?: string | null;
  isYardConverted?: boolean;
  originalYardPrice?: number;
  meterPemakaian?: number;
  meterHargaSatuan?: number;
}

export interface HPPCalculationRecord {
  id: string;
  noHpp: string;          // Format: HPP/YYYY/0001
  tanggal: string;
  namaProduk: string;
  kodeProduk?: string | null;
  size: string;           // S, M, L, XL, XXL, 3XL, ALL SIZE
  kategori: string;       // Jaket, Rompi, Kemeja, Kaos, Celana, dll.
  brand?: string | null;
  vendorCmt?: string | null;
  batchQty: number;       // Jumlah produksi batch

  // Parameter Biaya Tambahan & Margin
  targetLabaPercent: number;  // % target keuntungan bersih
  overheadPercent?: number;   // % overhead pabrik (default 3%)
  rejectPercent: number;      // % cadangan reject cacat kain
  ppnPercent?: number;        // % Pajak/PPN
  zakatPercent?: number;      // % Zakat
  affiliatePercent?: number;  // % Fee affiliate / sales marketing
  isPpnIncluded?: boolean;    // Toggle PPN (default false/Exclude)

  // Hasil Kalkulasi
  hppBahanTotal: number;      // Total HPP bahan baku & aksesoris
  hppCmtTotal: number;        // Total HPP jasa jahit & sablon/bordir
  totalSebelumReject: number;  // HPP Bahan + HPP CMT
  nilaiOverhead?: number;     // Nilai overhead per pcs
  nilaiReject: number;        // Cadangan reject
  hppFinalPerPcs: number;     // Subtotal + Overhead + Reject
  hargaJualSebelumBulat?: number; // Harga jual sebelum pembulatan
  hargaJualRekomendasi: number; // HPP Final * (1 + Target Laba %) dibulatkan ke Rp 1.000 terdekat
  labaBersihPerPcs: number;   // Rekomendasi Jual - HPP Final
  nilaiPpn?: number;          // Nilai PPN jika include
  hargaJualPlusPpn?: number;  // Harga jual setelah PPN

  // Proyeksi Batch
  totalBiayaBatch: number;    // HPP Final * batchQty
  totalOmzetBatch: number;    // Harga Jual Rekomendasi * batchQty
  totalLabaBatch: number;     // Laba Bersih * batchQty
  catatan?: string | null;

  components: HPPComponentItem[];
  createdAt: string;
  updatedAt?: string;
  isPendingSync?: boolean;    // Menandakan data disimpan secara offline/lokal dan belum tersimpan di database server
  syncError?: string;         // Pesan error terakhir saat sinkronisasi ke server
}

export interface FOBQuotationItem {
  id: string;
  skuWarna: string;           // Warna artikel
  skuSize: string;            // Size
  jumlahPcs: number;          // Target QTY
  hargaPerPcs: number;        // Harga penawaran FOB per pcs
  total: number;              // jumlahPcs * hargaPerPcs
  catatan?: string | null;
  hppReferenceId?: string | null;
}

export interface FOBQuotation {
  id: string;
  noSurat: string;            // Format: SPH/YYYY/0001
  tanggal: string;
  buyerName: string;
  buyerCompany?: string | null;
  buyerContact?: string | null;
  validUntil?: string | null;
  termsDPPercent: number;     // default 50%
  totalQty: number;
  totalOrderNominal: number;
  nominalDP: number;
  sisaPelunasan: number;
  isPpnIncluded?: boolean;    // Toggle PPN (default false/Exclude)
  ppnPercent?: number;        // default 11% jika include
  ppnNominal?: number;        // nominal rupiah PPN
  grandTotalWithPpn?: number; // total akhir setelah PPN
  paymentNotes?: string | null;
  productionLeadTime?: string | null;
  companyProfile?: {
    namaPerusahaan?: string;
    alamat?: string;
    telepon?: string;
    bankInfo?: string;
  } | null;
  items: FOBQuotationItem[];
  createdAt: string;
  updatedAt?: string;
}

export interface FOBMaterialMaster {
  id: string;
  kodeMaterial: string;
  namaBahan: string;
  kategori: HPPComponentType | string;
  satuan: string;
  qty?: number;
  hargaStandar: number;
  supplier?: string | null;
  catatan?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface FOBProductMaster {
  id: string;
  kodeProduk: string;
  namaProduk: string;
  size: string;
  kategori: string;
  brand?: string | null;
  vendorCmt?: string | null;
  deskripsi?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface FobAiCostOptimization {
  area: string;
  saran: string;
  potensiHematPerPcs: number;
}

export interface FobAiProductionRisk {
  aspek: string;
  tingkatRisiko: 'RENDAH' | 'SEDANG' | 'TINGGI' | string;
  mitigasi: string;
}

export interface FobAiVolumePricing {
  minQty: number;
  hargaRekomendasi: number;
  diskonPersen: number;
  marginPersen: number;
  catatan: string;
}

export interface FobAiAnalysisResult {
  healthScore: number;
  status: 'SEHAT' | 'WASPADA' | 'RISIKO' | string;
  statusLabel: string;
  ringkasanAudit: string;
  costOptimization: FobAiCostOptimization[];
  productionRisks: FobAiProductionRisk[];
  volumePricing: FobAiVolumePricing[];
  executiveSummary: string;
}

export interface FobAiAnalysisApiResponse {
  success: boolean;
  isAiLive: boolean;
  modelUsed: string;
  data: FobAiAnalysisResult;
  error?: string;
}

// ============================================================
// FOB PURCHASE ORDER (PO BRAND)
// ============================================================

export interface FobOrderItem {
  id: string;
  no: number;
  sku: string;
  warna: string;
  size: string;
  qty: number;
  hargaBeli: number;
  subtotal: number;
  catatan?: string | null;
}

export type FobOrderStatus = 'DRAF' | 'DISETUJUI' | 'PROSES' | 'SELESAI' | 'BATAL';
export type FobOrderPriority = 'TINGGI' | 'NORMAL' | 'RENDAH';

export interface FobPurchaseOrder {
  id: string;
  poNumber: string;               // e.g. PO-PH-0002
  internalId?: string | null;     // e.g. PH-0002
  tanggalPo: string;              // YYYY-MM-DD
  targetTiba?: string | null;     // YYYY-MM-DD
  deadlineDays: number;           // e.g. 14 hari
  brand: string;                  // e.g. MONTURE
  vendor: string;                 // e.g. TRIKARSA
  pic?: string | null;            // e.g. CECEP
  management?: string | null;     // e.g. DAYAT / MANAJEMEN
  prioritas: FobOrderPriority;    // TINGGI / NORMAL / RENDAH
  status: FobOrderStatus;         // DRAF / DISETUJUI / PROSES / SELESAI / BATAL
  skuInduk: string;               // e.g. ROMPI HOODIE PUFFER
  totalQty: number;               // e.g. 120
  hargaRataRata: number;          // e.g. 78667
  totalPembelian: number;         // e.g. 9440000
  biayaLain: number;              // e.g. 0
  grandTotal: number;             // e.g. 9440000
  keterangan?: string | null;     // Klausul kesepakatan
  persetujuanDibuat?: string | null;
  persetujuanDisetujui?: string | null;
  persetujuanVendor?: string | null;
  hppReferenceId?: string | null;
  quotationReferenceId?: string | null;
  items: FobOrderItem[];
  createdAt: string;
  updatedAt?: string;
}

// ----------------------------------------------------
// PRODUCTION TIMELINE & ACTIONS (T&A SCHEDULE)
// ----------------------------------------------------
export type ProductionStageCategory =
  | 'PRE_PRODUCTION'  // PO, DP, Techpack, Sampel Approval
  | 'FABRIC_TRIMS'    // Pengadaan Bahan Kain & Aksesoris
  | 'CUTTING'         // Spreading & Pemotongan Kain
  | 'DECORATION'      // Sablon, Bordir Komputer, Printing
  | 'SEWING_CMT'      // Perakitan & Jahit (CMT)
  | 'FINISHING_QC'    // Pembersihan Benang, Steam, QC, Packing
  | 'DELIVERY';       // Final Inspection, Pelunasan, Pengiriman Ekspedisi

export type ProductionStageStatus = 'MENUNGGU' | 'SEDANG_PROSES' | 'SELESAI' | 'TERLAMBAT';

export interface ProductionStage {
  id: string;
  name: string;
  category: ProductionStageCategory;
  description?: string;
  picVendor?: string;
  startDate: string;              // YYYY-MM-DD
  endDate: string;                // YYYY-MM-DD
  durationDays: number;
  progressPercent: number;        // 0 - 100
  status: ProductionStageStatus;
  notes?: string;
}

export type TimelineOverallStatus = 'DRAF' | 'ON_TRACK' | 'AT_RISK' | 'DELAYED' | 'SELESAI';

export interface ProductionTimeline {
  id: string;
  orderId?: string | null;
  poNumber: string;
  brand: string;
  vendor: string;
  productName: string;
  totalQty: number;
  startDate: string;              // YYYY-MM-DD
  targetDeliveryDate: string;     // YYYY-MM-DD
  totalDays: number;
  stages: ProductionStage[];
  overallProgress: number;        // 0 - 100%
  status: TimelineOverallStatus;
  notes?: string;
  presetType?: string;
  createdAt: string;
  updatedAt?: string;
}

// ----------------------------------------------------
// FOB MATERIAL PROCUREMENT & DOWN PAYMENT
// Pendataan Belanja Bahan (Kain & Aksesoris) untuk PO FOB
// Mendukung skema Direct Transfer dari Buyer langsung ke Toko Supplier
// ----------------------------------------------------
export type FobDepositStatus = 'BELUM_DIBELANJAKAN' | 'SEBAGIAN_DIBELANJAKAN' | 'SUDAH_JADI_KAIN';
export type FobMaterialCategory = 'KAIN' | 'AKSESORIS';

export interface FobMaterialItem {
  id: string;
  kategori: FobMaterialCategory;
  namaItem: string;             // e.g. "Cotton Combed 30s Reaktif Jet Black", "Resleting YKK Metal 5 inch", "Kancing Grafir 18L"
  tokoSupplier: string;         // e.g. "Toko Bahan Dunia Mas", "Sentosa Trims & Button"
  noRekeningToko?: string;      // No rek tujuan transfer buyer, e.g. "BCA 82910291 a/n PT Dunia Mas"
  jumlah: number;
  satuan: string;               // kg, yard, meter, pcs, roll, gross, lusin, pack, set
  hargaSatuan: number;
  subtotal: number;
  statusBayarBuyer: 'BELUM_DITRANSFER' | 'SUDAH_DITRANSFER';
  buktiTransferTokoUrl?: string; // Struk transfer dari buyer langsung ke rekening toko
  notaTokoUrl?: string;          // Foto nota/bon pembelian dari toko
  statusFisik?: 'BELUM_DITERIMA' | 'DITERIMA_GUDANG';
  tanggalTerima?: string;
  catatan?: string;
  createdAt?: string;
}

export interface FobFabricAllocation {
  totalMeter: number;
  totalBiaya: number;
  rolCodes: string[];
}

export interface FobDownPayment {
  id: string;
  depositNumber: string;         // e.g. DP-FOB-202609-001
  poId?: string | null;          // Relasi ke FobPurchaseOrder.id (atau null jika multi-PO)
  poNumber: string;              // e.g. PO-PH-0002 atau PO-PH-0001, PO-PH-0002, PO-PH-0003
  poNumbers?: string[];          // Array nomor PO jika bundel multi-PO
  poIds?: string[];              // Array ID PO jika bundel multi-PO
  totalQty?: number;             // Total volume kuantitas pcs seluruh PO
  bundleInfo?: Array<{
    poId?: string;
    poNumber: string;
    skuInduk: string;
    totalQty: number;
    grandTotal: number;
  }>;
  brand: string;                 // e.g. MONTURE / GREYWOLF
  tanggalBayar: string;          // YYYY-MM-DD
  nominalTotalOrder: number;     // Nilai total pesanan PO FOB (akumulasi jika multi-PO)
  totalNilaiPo?: number;         // Alias dari backend DB totalNilaiPo
  persentaseDp: number;          // e.g. 50 (%) atau estimasi % bahan
  nominalDp: number;             // Nilai rupiah belanja bahan yang disetor/ditransfer buyer ke toko
  metodePembayaran: MetodePembayaran | 'TRANSFER_TOKO' | 'DIRECT_BUYER_TO_STORE';
  bankTujuan?: string;           // BCA, MANDIRI, BRI, atau nama toko tujuan
  nomorReferensi?: string;       // No bukti transfer bank
  buktiBayarUrl?: string;        // Foto/struk transfer opsional
  keterangan?: string;
  statusBahan: FobDepositStatus;
  alokasiKain?: FobFabricAllocation;
  rincianBahan?: FobMaterialItem[]; // Pendataan item belanja kain & aksesoris PO FOB
  totalBelanjaKain?: number;
  totalBelanjaAksesoris?: number;
  totalBelanjaBahan?: number;
  sisaNilaiJasaPo?: number;
  createdAt: string;
  updatedAt?: string;
}

// ================= AUDIT TRAIL & REKAM JEJAK =================
export type AuditModule =
  | 'ARUS_KAS'
  | 'INBOUND_DP'
  | 'STOK_KAIN'
  | 'STOK_AKSESORIS'
  | 'SPK_CUTTING'
  | 'SURAT_JALAN'
  | 'HPP_FOB'
  | 'FINANCE_INVOICE'
  | 'USER_AUTH'
  | 'PENGEMBALIAN_RETUR'
  | 'SISTEM';

export type AuditActionType =
  | 'CREATE'
  | 'UPDATE'
  | 'DELETE'
  | 'APPROVE'
  | 'REJECT'
  | 'STATUS_CHANGE';

export type AuditSeverity = 'INFO' | 'WARNING' | 'CRITICAL';

export interface AuditLogEntry {
  id: string;
  timestamp: string; // ISO 8601 string
  userId: string;
  userName: string;
  userRole: UserRole;
  module: AuditModule;
  action: AuditActionType;
  severity: AuditSeverity;
  entityId: string;
  entityName: string;
  details: string;
  previousData?: Record<string, any> | null;
  newData?: Record<string, any> | null;
  ipAddress?: string;
  notes?: string;
}

export interface SavedNetProfitReport {
  id: string;
  reportNo: string;
  title: string;
  monthKey: string;
  monthLabel: string;
  brand: string;
  orderScheme: 'ALL' | 'CMT' | 'FOB';
  createdAt: string;
  savedBy: string;
  notes?: string;
  kpi: {
    totalPcs: number;
    totalRevenue: number;
    totalCmtCost: number;
    totalFabricCost: number;
    netProfit: number;
    avgMargin: number;
    fabricMeters: number;
    cmtProfit?: number;
    fobProfit?: number;
    productionProfit?: number;
    totalOpex?: number;
    totalOtherIncome?: number;
    grossMargin?: number;
  };
  selectedPoNumbers: string[];
  selectedSjRowKeys: string[];
  selectedRollIds: string[];
  items: Array<{
    id: string;
    noSuratJalan: string;
    spkNumber: string;
    tanggal: string;
    produk: string;
    jenisKain: string;
    brand: string;
    vendor: string;
    totalPcs: number;
    omzetBuyer: number;
    biayaCmt: number;
    labaBersih: number;
    marginPersen: number;
    statusMargin: 'SEHAT' | 'MODERAT' | 'TIPIS';
    orderType?: 'CMT' | 'FOB';
    fobPoNumber?: string;
    itemPo?: string;
    itemCount?: number;
    subItems?: any[];
  }>;
  fabricItems?: Array<{
    id: string;
    rollCode: string;
    jenisKain: string;
    tanggalMasuk?: string;
    meterUsed: number;
    hargaModalMeter: number;
    totalNilaiKain: number;
  }>;
}

export type JenisKasOperasional = 'KAS_KELUAR' | 'KAS_MASUK';

export type OpexCategory =
  | 'GAJI'
  | 'SERVER_IT'
  | 'SEWA_UTILITAS'
  | 'MAINTENANCE'
  | 'PERLENGKAPAN'
  | 'TRANSPORT'
  | 'KONSUMSI'
  | 'LAINNYA'
  | 'MODAL_MASUK';

export interface OperationalExpense {
  id: string;
  tanggal: string; // YYYY-MM-DD
  jenis: JenisKasOperasional;
  kategori: string;
  nominal: number;
  akunKas: string;
  deskripsi: string;
  penerimaPenyetor?: string;
  referensiNomor?: string;
  lampiranUrl?: string;
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface OpexFilterParams {
  month?: string;
  startDate?: string;
  endDate?: string;
  kategori?: string;
  jenis?: string;
  akunKas?: string;
  search?: string;
}

export interface OpexSummary {
  totalKasMasuk: number;
  totalKasKeluar: number;
  netCashFlow: number;
  categoryTotals: Record<string, number>;
  accountTotals: Record<string, { masuk: number; keluar: number; balance: number }>;
  count: number;
}
