import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getCache, setCache, clearAllCache } from '../utils/cacheManager';
import { buildSplitSpkItems } from '../utils/spkHelper';
import {
  apiLogin,
  saveToken,
  clearToken,
  getToken,
  apiGetBrands,
  apiAddBrand,
  apiUpdateBrand,
  apiDeleteBrand,
  apiGetVendors,
  apiGetHargaKonveksi,
  apiAddHargaKonveksi,
  apiUpdateHargaKonveksi,
  apiDeleteHargaKonveksi,
  apiGetHargaBuyer,
  apiAddHargaBuyer,
  apiUpdateHargaBuyer,
  apiDeleteHargaBuyer,
  apiGetInboundRolls,
  apiAddInboundRoll,
  apiUpdateInboundStatus,
  apiDeleteInboundRoll,
  apiGetKasbon,
  apiAddKasbon,
  apiGetPembayaran,
  apiAddPembayaran,
  apiUpdatePembayaran,
  apiDeletePembayaran,
  apiGetSpk,
  apiCreateSpk,
  apiUpdateSpk,
  apiDeleteSpk,
  apiGetSuratJalan,
  apiCreateSuratJalan,
  apiUpdateSuratJalan,
  apiDeleteSuratJalan,
  apiAddVendor,
  apiUpdateVendor,
  apiDeleteVendor,
  apiRegisterBrand,
  apiGetPendingBrands,
  apiApproveBrand,
  apiRejectBrand,
  apiGetReturns,
  apiCreateReturn,
  apiUpdateReturnStatus,
  apiDeleteReturn,
  apiGetAccessories,
  apiGetAccessoryMutations,
  apiCreateAccessory,
  apiUpdateAccessory,
  apiDeleteAccessory,
  apiRecordAccessoryMutation,
  apiGetUsers,
  apiCreateUser,
  apiUpdateUser,
  apiDeleteUser,
  apiGetBrandSKUs,
  apiCreateBrandSKU,
  apiUpdateBrandSKU,
  apiDeleteBrandSKU,
  apiGetBrandSales,
  apiCreateBrandSale,
  apiDeleteBrandSale,
  apiGetBrandStockExits,
  apiCreateBrandStockExit,
  apiDeleteBrandStockExit,
  apiGetProductionPOs,
  apiCreateProductionPO,
  apiUpdateProductionPO,
  apiUpdateProductionPOStatus,
  apiDeleteProductionPO,
  apiGetFobHppList,
  apiCreateFobHpp,
  apiUpdateFobHpp,
  apiDeleteFobHpp,
  apiGetFobQuotations,
  apiCreateFobQuotation,
  apiDeleteFobQuotation,
  apiGetFobMaterials,
  apiSaveFobMaterial,
  apiDeleteFobMaterial,
  apiGetFobProducts,
  apiSaveFobProduct,
  apiDeleteFobProduct,
  apiGetFobOrders,
  apiCreateFobOrder,
  apiUpdateFobOrder,
  apiUpdateFobOrderStatus,
  apiDeleteFobOrder,
  apiGetFobDeposits,
  apiCreateFobDeposit,
  apiUpdateFobDeposit,
  apiDeleteFobDeposit,
} from '../services/api';
import {
  AuthUser,
  PendingBrandUser,
  ManagedUser,
  UserRole,
  Brand,
  Vendor,
  HargaKonveksi,
  HargaBuyer,
  InboundRoll,
  RollStatus,
  SPKCutting,
  SPKProductItem,
  SuratJalan,
  SuratJalanItem,
  KasbonTransaction,
  SizeBreakdown,
  VendorPayrollSummary,
  VendorPOPayrollPackage,
  VendorPayrollSettlement,
  BuyerInvoiceSummary,
  PembayaranBrand,
  ArusKasSummary,
  ReturnItem,
  ReturnStatus,
  ReturnSource,
  AccessoryItem,
  AccessoryMutation,
  BrandProductSKU,
  BrandSale,
  BrandStockExit,
  ProductionPO,
  ProductionPOItem,
  VendorFabricDeposit,
  FabricTransferNote,
  FabricDepositStatus,
  HPPCalculationRecord,
  FOBQuotation,
  FOBMaterialMaster,
  FOBProductMaster,
  FobPurchaseOrder,
  ProductionTimeline,
  FobDownPayment,
  FobDepositStatus,
  FobFabricAllocation,
} from '../types';
import {
  demoUsers,
  initialBrands,
  initialVendors,
  initialHargaKonveksi,
  initialHargaBuyer,
  initialInboundRolls,
  initialSPKList,
  initialSuratJalanList,
  initialKasbonList,
  initialReturnList,
  initialAccessories,
  initialAccessoryMutations,
  initialFobMaterials,
  initialFobProducts,
  initialFobOrders,
  initialProductionTimelines,
  initialFobDeposits,
} from '../data/initialData';
import { formatDateIndo } from '../utils/formatters';

export type ActiveTab = 'dashboard' | 'master-harga' | 'inbound' | 'spk' | 'outbound' | 'return' | 'finance' | 'arus-kas' | 'margin-analytics' | 'accessories' | 'barang-masuk' | 'manajemen-user' | 'stok-penjualan' | 'po-produksi' | 'kalkulator-fob';

interface AppContextType {
  // Auth & Session
  currentUser: AuthUser | null;
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  loginAsPreset: (presetUser: AuthUser) => void;
  logout: () => void;

  // Navigation & Role
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  userRole: UserRole;
  setUserRole: (role: UserRole) => void;
  activeBrand: string;
  setActiveBrand: (brand: string) => void;
  switchBrand: (brandName: string) => void;

  // Pending Registrations & Approval
  pendingBrands: PendingBrandUser[];
  fetchPendingBrands: () => Promise<void>;
  registerBrand: (data: { name: string; email: string; password: string; phone?: string; brands: string[] }) => Promise<{ success: boolean; message: string }>;
  approveBrandUser: (userId: string, data?: { accessibleBrands?: string[]; brandName?: string }) => Promise<{ success: boolean; message: string }>;
  rejectBrandUser: (userId: string) => Promise<{ success: boolean; message: string }>;
  isApprovalModalOpen: boolean;
  setIsApprovalModalOpen: (open: boolean) => void;
  syncFromBackend: () => Promise<void>;

  // User Management (Admin Only)
  managedUsers: ManagedUser[];
  fetchManagedUsers: () => Promise<void>;
  createManagedUser: (data: {
    name: string;
    email: string;
    password: string;
    phone?: string;
    role?: UserRole;
    status?: string;
    brandName?: string;
    accessibleBrands?: string[];
  }) => Promise<{ success: boolean; message: string }>;
  updateManagedUser: (
    id: string,
    data: Partial<{
      name: string;
      email: string;
      password?: string;
      phone?: string;
      role: UserRole;
      status: string;
      brandName?: string;
      accessibleBrands?: string[];
    }>
  ) => Promise<{ success: boolean; message: string }>;
  deleteManagedUser: (id: string) => Promise<{ success: boolean; message: string }>;

  // Brand Inventory & Marketplace Sales
  brandSKUs: BrandProductSKU[];
  brandSales: BrandSale[];
  brandStockExits: BrandStockExit[];
  fetchBrandInventoryData: (brand?: string) => Promise<void>;
  createBrandSKU: (data: {
    brand?: string;
    produk: string;
    sku: string;
    warna?: string;
    ukuran?: string;
    hpp: number;
    stokAwal?: number;
    catatan?: string;
  }) => Promise<{ success: boolean; message: string }>;
  updateBrandSKU: (
    id: string,
    data: Partial<{
      produk: string;
      sku: string;
      warna?: string;
      ukuran?: string;
      hpp: number;
      stokAwal: number;
      catatan?: string;
    }>
  ) => Promise<{ success: boolean; message: string }>;
  deleteBrandSKU: (id: string) => Promise<{ success: boolean; message: string }>;
  createBrandSale: (data: {
    brand?: string;
    tanggal: string;
    marketplace: string;
    toko?: string;
    noPesanan?: string;
    username?: string;
    skuId?: string;
    sku: string;
    qty: number;
    hpp?: number;
    omset: number;
    biayaIklan?: number;
    biayaOperasional?: number;
    catatan?: string;
  }) => Promise<{ success: boolean; message: string }>;
  deleteBrandSale: (id: string) => Promise<{ success: boolean; message: string }>;
  createBrandStockExit: (data: {
    brand?: string;
    tanggal: string;
    skuId?: string;
    sku: string;
    qty: number;
    kategori: string;
    keterangan?: string;
  }) => Promise<{ success: boolean; message: string }>;
  deleteBrandStockExit: (id: string) => Promise<{ success: boolean; message: string }>;

  // Production PO (Database-backed)
  productionPOs: ProductionPO[];
  fetchProductionPOs: (params?: { brand?: string; status?: string; search?: string }) => Promise<void>;
  createProductionPO: (data: {
    noPO: string;
    brand: string;
    vendorTujuan: string;
    tanggalPO: string;
    targetDeadline: string;
    catatan?: string;
    status?: string;
    usedDepositId?: string | null;
    usedDepositInfo?: string | null;
    items: {
      namaProduk: string;
      warna?: string;
      ukuran?: string;
      qty: number;
      bahanKain?: string;
      catatan?: string;
      depositId?: string | null;
      depositInfo?: string | null;
    }[];
  }) => Promise<{ success: boolean; message: string; data?: ProductionPO }>;
  updateProductionPO: (
    id: string,
    data: Partial<{
      noPO: string;
      brand: string;
      vendorTujuan: string;
      tanggalPO: string;
      targetDeadline: string;
      catatan?: string;
      status: string;
      usedDepositId?: string | null;
      usedDepositInfo?: string | null;
      items: {
        namaProduk: string;
        warna?: string;
        ukuran?: string;
        qty: number;
        bahanKain?: string;
        catatan?: string;
        depositId?: string | null;
        depositInfo?: string | null;
      }[];
    }>
  ) => Promise<{ success: boolean; message: string; data?: ProductionPO }>;
  updateProductionPOStatus: (id: string, status: string) => Promise<{ success: boolean; message: string }>;
  deleteProductionPO: (id: string) => Promise<{ success: boolean; message: string }>;
  pendingSpkPrefillFromPO: ProductionPO | null;
  setPendingSpkPrefillFromPO: (po: ProductionPO | null) => void;

  // Vendor Fabric Deposits (Saldo Titipan & Transfer Bahan Antar-Vendor)
  vendorFabricDeposits: VendorFabricDeposit[];
  fabricTransferNotes: FabricTransferNote[];
  createFabricTransfer: (data: {
    sourcePOId: string;
    sourcePONumber: string;
    sourceVendor: string;
    targetVendor: string;
    brand: string;
    jenisKain: string;
    warna?: string;
    panjang: number;
    satuan: 'METER' | 'YARD';
    driverName: string;
    kondisiKain?: string;
    catatan?: string;
  }) => Promise<{ success: boolean; message: string; deposit?: VendorFabricDeposit; transferNote?: FabricTransferNote }>;
  useVendorDeposit: (
    depositId: string,
    poId: string,
    poNumber: string,
    usedLength: number
  ) => Promise<{ success: boolean; message: string }>;
  returnDepositToWarehouse: (
    depositId: string,
    catatan?: string
  ) => Promise<{ success: boolean; message: string }>;
  deleteFabricDeposit: (depositId: string) => Promise<{ success: boolean; message: string }>;

  // FOB Costing & Commercial Quotation (SPH)
  hppRecords: HPPCalculationRecord[];
  fobQuotations: FOBQuotation[];
  fobMaterials: FOBMaterialMaster[];
  fobProducts: FOBProductMaster[];
  fobOrders: FobPurchaseOrder[];
  isLoadingFob: boolean;
  saveHppRecord: (record: Partial<HPPCalculationRecord>) => Promise<{ success: boolean; data?: HPPCalculationRecord; error?: string }>;
  updateHppRecord: (id: string, record: Partial<HPPCalculationRecord>) => Promise<{ success: boolean; error?: string }>;
  deleteHppRecord: (id: string) => Promise<{ success: boolean; error?: string }>;
  saveFobQuotation: (quotation: Partial<FOBQuotation>) => Promise<{ success: boolean; data?: FOBQuotation; error?: string }>;
  deleteFobQuotation: (id: string) => Promise<{ success: boolean; error?: string }>;
  saveFobMaterial: (mat: Partial<FOBMaterialMaster>) => Promise<{ success: boolean; error?: string }>;
  deleteFobMaterial: (id: string) => Promise<{ success: boolean; error?: string }>;
  saveFobProduct: (prod: Partial<FOBProductMaster>) => Promise<{ success: boolean; error?: string }>;
  deleteFobProduct: (id: string) => Promise<{ success: boolean; error?: string }>;
  saveFobOrder: (order: Partial<FobPurchaseOrder>) => Promise<{ success: boolean; data?: FobPurchaseOrder; error?: string }>;
  updateFobOrder: (id: string, order: Partial<FobPurchaseOrder>) => Promise<{ success: boolean; error?: string }>;
  updateFobOrderStatus: (id: string, status: string) => Promise<{ success: boolean; error?: string }>;
  deleteFobOrder: (id: string) => Promise<{ success: boolean; error?: string }>;
  productionTimelines: ProductionTimeline[];
  saveProductionTimeline: (timeline: Partial<ProductionTimeline>) => Promise<{ success: boolean; data?: ProductionTimeline; error?: string }>;
  updateProductionTimeline: (id: string, timeline: Partial<ProductionTimeline>) => Promise<{ success: boolean; error?: string }>;
  deleteProductionTimeline: (id: string) => Promise<{ success: boolean; error?: string }>;
  refreshFobData: () => Promise<void>;

  // Sidebar & Layout State
  isSidebarCollapsed: boolean;
  setIsSidebarCollapsed: (collapsed: boolean) => void;
  toggleSidebar: () => void;
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (open: boolean) => void;
  toggleMobileMenu: () => void;

  // Sync & Caching State
  isSyncing: boolean;
  lastSyncedAt: Date | null;

  // Master Data
  brands: Brand[];
  addBrand: (brand: Omit<Brand, 'id'>) => Promise<void>;
  updateBrand: (brand: Brand) => Promise<void>;
  deleteBrand: (id: string) => Promise<void>;
  vendors: Vendor[];
  hargaKonveksi: HargaKonveksi[];
  hargaBuyer: HargaBuyer[];
  addVendor: (vendor: Omit<Vendor, 'id' | 'currentKasbon'>) => Promise<void>;
  updateVendor: (vendor: Vendor) => Promise<void>;
  deleteVendor: (id: string) => Promise<void>;
  addHargaKonveksi: (item: Omit<HargaKonveksi, 'id'>) => void;
  updateHargaKonveksi: (item: HargaKonveksi) => void;
  deleteHargaKonveksi: (id: string) => void;
  addHargaBuyer: (item: Omit<HargaBuyer, 'id'>) => void;
  updateHargaBuyer: (item: HargaBuyer) => void;
  deleteHargaBuyer: (id: string) => void;

  // Transaction Data
  inboundRolls: InboundRoll[];
  addInboundRoll: (roll: Omit<InboundRoll, 'id'>) => void;
  updateInboundRollStatus: (id: string, status: InboundRoll['status']) => void;
  deleteInboundRoll: (id: string) => Promise<{ success: boolean; message?: string }>;

  // Inbound DP Uang (FOB)
  fobDeposits: FobDownPayment[];
  addFobDeposit: (deposit: Omit<FobDownPayment, 'id' | 'depositNumber' | 'createdAt'>, syncToFinance?: boolean) => Promise<FobDownPayment>;
  updateFobDeposit: (id: string, updates: Partial<FobDownPayment>) => Promise<void> | void;
  deleteFobDeposit: (id: string) => Promise<void> | void;
  receiveFabricFromFobDeposit: (depositId: string, fabricData: { jenisKain: string; meterLength: number; hargaModalMeter: number; keterangan?: string }) => Promise<{ success: boolean; rollCode?: string; message?: string }>;

  spkList: SPKCutting[];
  createSPK: (spk: Omit<SPKCutting, 'id' | 'spkNumber' | 'deliveredQty' | 'status'>) => Promise<void> | void;
  updateSPK: (id: string, spkData: Partial<SPKCutting> & { rollIds?: string[]; depositId?: string | null }) => Promise<{ success: boolean; message?: string }>;
  deleteSPK: (id: string) => Promise<{ success: boolean; message?: string }>;

  suratJalanList: SuratJalan[];
  createSuratJalan: (sj: Omit<SuratJalan, 'id' | 'noSuratJalan' | 'status'>) => Promise<{ success: boolean; message?: string }> | { success: boolean; message?: string };
  updateSuratJalan: (id: string, updatedSJ: Partial<SuratJalan>) => Promise<{ success: boolean; message?: string }>;
  updateSuratJalanReceipt: (id: string, verifiedItems: SuratJalanItem[], verificationNote?: string) => Promise<{ success: boolean; message?: string }>;
  deleteSuratJalan: (id: string) => Promise<{ success: boolean; message?: string }>;
  getSuratJalanItems: (sj: SuratJalan) => SuratJalanItem[];

  kasbonList: KasbonTransaction[];
  addKasbon: (kasbon: Omit<KasbonTransaction, 'id'>) => void;

  // Arus Kas Brand
  pembayaranList: PembayaranBrand[];
  addPembayaran: (p: Omit<PembayaranBrand, 'id'>) => void;
  updatePembayaran: (id: string, p: Partial<Omit<PembayaranBrand, 'id'>>) => void;
  deletePembayaran: (id: string) => void;
  getArusKasSummary: () => ArusKasSummary[];

  // Return Management
  returnList: ReturnItem[];
  createReturn: (data: {
    sumber: ReturnSource;
    spkId?: string;
    suratJalanId?: string;
    brand: string;
    produk: string;
    vendor: string;
    tanggalRetur?: string;
    alasanCacat: string;
    kategoriCacat: string;
    catatan?: string;
    qtyBreakdown: SizeBreakdown;
  }) => Promise<{ success: boolean; message?: string }>;
  updateReturnStatus: (
    id: string,
    data: {
      status: ReturnStatus;
      qtyReworked?: number;
      qtyRejectTotal?: number;
      catatan?: string;
    }
  ) => Promise<{ success: boolean; message?: string }>;
  deleteReturn: (id: string) => Promise<{ success: boolean; message?: string }>;

  // Accessories & Trims Management
  accessories: AccessoryItem[];
  accessoryMutations: AccessoryMutation[];
  addAccessory: (item: Omit<AccessoryItem, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateAccessory: (item: AccessoryItem) => void;
  deleteAccessory: (id: string) => void;
  recordStockIn: (data: {
    accessoryId: string;
    quantity: number;
    date: string;
    sourceOrDestination?: string;
    recipientOrVendor?: string;
    notes?: string;
    costTotal?: number;
  }) => void;
  recordStockOut: (data: {
    accessoryId: string;
    quantity: number;
    date: string;
    sourceOrDestination?: string;
    spkId?: string;
    recipientOrVendor?: string;
    notes?: string;
  }) => Promise<{ success: boolean; message?: string }>;
  adjustStock: (accessoryId: string, physicalCount: number, notes: string) => void;

  // Helper Lookups & Calculation Engines
  getVendorRate: (vendor: string, produk: string, brand: string) => number;
  getBuyerRates: (brand: string, produk: string) => {
    rateS: number;
    rateM: number;
    rateL: number;
    rateXL: number;
    rateXXL: number;
    rateSML: number;
    rateAnak4: number;
    rateAnak6: number;
    rateAnak8: number;
    rateAnak10: number;
    rateAnak12: number;
    rateAnak14: number;
    rateAnak16: number;
  };
  getSPKRemainingQty: (spk: SPKCutting, spkItemId?: string) => SizeBreakdown & { totalRemaining: number };
  vendorSettlements: VendorPayrollSettlement[];
  settleVendorPO: (settlement: Omit<VendorPayrollSettlement, 'id' | 'createdAt'>) => Promise<void>;
  unsettleVendorPO: (settlementId: string) => Promise<void>;
  calculateVendorPayroll: (
    vendorName: string,
    startDate?: string,
    endDate?: string,
    allowPartialPayment?: boolean,
    settlementFilter?: 'UNPAID' | 'SETTLED' | 'ALL'
  ) => VendorPayrollSummary;
  calculateBuyerInvoice: (brandName: string, startDate?: string, endDate?: string) => BuyerInvoiceSummary;
  resetToDefaultData: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Auth State
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => {
    const saved = localStorage.getItem('konvek_auth_user');
    return saved ? JSON.parse(saved) : null;
  });

  // Navigation & Role State
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [userRole, setUserRole] = useState<UserRole>(() => {
    const saved = localStorage.getItem('konvek_auth_user');
    if (saved) {
      const parsed: AuthUser = JSON.parse(saved);
      return parsed.role;
    }
    return 'ADMIN';
  });

  const [activeBrand, setActiveBrand] = useState<string>(() => {
    const saved = localStorage.getItem('konvek_auth_user');
    if (saved) {
      const parsed: AuthUser = JSON.parse(saved);
      return parsed.brandName || 'GREYWOLF';
    }
    return 'GREYWOLF';
  });

  const [pendingBrands, setPendingBrands] = useState<PendingBrandUser[]>([]);
  const [managedUsers, setManagedUsers] = useState<ManagedUser[]>([]);

  const switchBrand = (brandName: string) => {
    setActiveBrand(brandName);
    if (currentUser) {
      const updated = { ...currentUser, brandName };
      setCurrentUser(updated);
      localStorage.setItem('konvek_auth_user', JSON.stringify(updated));
    }
  };

  // Sidebar Layout State
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    const saved = localStorage.getItem('konvek_sidebar_collapsed');
    return saved ? JSON.parse(saved) : false;
  });

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState<boolean>(false);

  const toggleSidebar = () => {
    setIsSidebarCollapsed(prev => {
      const next = !prev;
      localStorage.setItem('konvek_sidebar_collapsed', JSON.stringify(next));
      return next;
    });
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(prev => !prev);
  };

  // High-Performance State (Stale-While-Revalidate: initialized immediately from cache for 0ms initial render)
  const [brands, setBrands] = useState<Brand[]>(() => getCache('brands', []));
  const [vendors, setVendors] = useState<Vendor[]>(() => getCache('vendors', []));
  const [hargaKonveksi, setHargaKonveksi] = useState<HargaKonveksi[]>(() => getCache('harga_konveksi', []));
  const [hargaBuyer, setHargaBuyer] = useState<HargaBuyer[]>(() => getCache('harga_buyer', []));
  const [inboundRolls, setInboundRolls] = useState<InboundRoll[]>(() => getCache('inbound_rolls', []));
  const [spkList, setSpkList] = useState<SPKCutting[]>(() => getCache('spk_list', []));
  const [suratJalanList, setSuratJalanList] = useState<SuratJalan[]>(() => getCache('surat_jalan', []));
  const [kasbonList, setKasbonList] = useState<KasbonTransaction[]>(() => getCache('kasbon', []));
  const [pembayaranList, setPembayaranList] = useState<PembayaranBrand[]>(() => getCache('pembayaran', []));
  const [returnList, setReturnList] = useState<ReturnItem[]>(() => getCache('returns', []));
  const [accessories, setAccessories] = useState<AccessoryItem[]>(() => getCache('accessories', []));
  const [accessoryMutations, setAccessoryMutations] = useState<AccessoryMutation[]>(() => getCache('accessory_mutations', []));
  const [brandSKUs, setBrandSKUs] = useState<BrandProductSKU[]>(() => getCache('brand_skus', []));
  const [brandSales, setBrandSales] = useState<BrandSale[]>(() => getCache('brand_sales', []));
  const [brandStockExits, setBrandStockExits] = useState<BrandStockExit[]>(() => getCache('brand_stock_exits', []));
  const [productionPOs, setProductionPOs] = useState<ProductionPO[]>(() => getCache('production_pos', []));
  const [pendingSpkPrefillFromPO, setPendingSpkPrefillFromPO] = useState<ProductionPO | null>(null);
  const [vendorFabricDeposits, setVendorFabricDeposits] = useState<VendorFabricDeposit[]>(() => getCache('vendor_fabric_deposits', []));
  const [fabricTransferNotes, setFabricTransferNotes] = useState<FabricTransferNote[]>(() => getCache('fabric_transfer_notes', []));
  const [vendorSettlements, setVendorSettlements] = useState<VendorPayrollSettlement[]>(() => {
    try {
      const saved = localStorage.getItem('konvek_vendor_settlements');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const settleVendorPO = async (
    data: Omit<VendorPayrollSettlement, 'id' | 'createdAt'>
  ) => {
    const newSettlement: VendorPayrollSettlement = {
      ...data,
      id: `settle-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      createdAt: new Date().toISOString(),
    };
    setVendorSettlements((prev) => {
      const updated = [
        newSettlement,
        ...prev.filter(
          (s) => !(s.vendor === data.vendor && s.poNumber.trim().toUpperCase() === data.poNumber.trim().toUpperCase())
        ),
      ];
      localStorage.setItem('konvek_vendor_settlements', JSON.stringify(updated));
      return updated;
    });
  };

  const unsettleVendorPO = async (settlementId: string) => {
    setVendorSettlements((prev) => {
      const updated = prev.filter((s) => s.id !== settlementId);
      localStorage.setItem('konvek_vendor_settlements', JSON.stringify(updated));
      return updated;
    });
  };

  // FOB Costing & SPH State
  const [hppRecords, setHppRecords] = useState<HPPCalculationRecord[]>(() => {
    const cached = getCache<HPPCalculationRecord[]>('fob_hpp_records', []);
    if (cached && cached.length > 0) return cached;
    try {
      const v4Raw = localStorage.getItem('hpp_fob_v4');
      if (v4Raw) return JSON.parse(v4Raw);
    } catch {}
    return [];
  });
  const [fobQuotations, setFobQuotations] = useState<FOBQuotation[]>(() => getCache('fob_quotations', []));
  const [fobMaterials, setFobMaterials] = useState<FOBMaterialMaster[]>(() => getCache('fob_materials', initialFobMaterials));
  const [fobProducts, setFobProducts] = useState<FOBProductMaster[]>(() => getCache('fob_products', initialFobProducts));
  const [fobOrders, setFobOrders] = useState<FobPurchaseOrder[]>(() => {
    const cached = getCache<FobPurchaseOrder[]>('fob_orders', null as any);
    if (cached !== null && Array.isArray(cached)) return cached;
    return [];
  });
  const [productionTimelines, setProductionTimelines] = useState<ProductionTimeline[]>(() => {
    const cached = getCache<ProductionTimeline[]>('production_timelines', []);
    if (cached && cached.length > 0) return cached;
    return initialProductionTimelines;
  });
  const [fobDeposits, setFobDeposits] = useState<FobDownPayment[]>(() => {
    const cached = getCache<FobDownPayment[]>('fob_deposits', null as any);
    if (cached !== null && Array.isArray(cached)) return cached;
    return [];
  });
  const [isLoadingFob, setIsLoadingFob] = useState<boolean>(false);

  // Sync state tracking
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);

  // Helper for brand name normalization (CREADIVE -> NAMI)
  const normalizeBrandName = (name?: string): string => {
    if (!name) return '';
    if (name.trim().toUpperCase() === 'CREADIVE') return 'NAMI';
    return name;
  };

  const normalizeBrandCode = (name?: string, code?: string): string => {
    if (name?.trim().toUpperCase() === 'CREADIVE' || name?.trim().toUpperCase() === 'NAMI' || code?.toUpperCase() === 'CRD') return 'NMI';
    return code || '';
  };

  // Sync to Backend Database with Full Request Parallelization & Caching
  const syncFromBackend = useCallback(async () => {
    const token = getToken();
    if (!token) return;

    setIsSyncing(true);
    try {
      const isBrandUser = currentUser?.role === 'BRAND';

      // Execute all endpoints in parallel with Promise.allSettled
      const results = await Promise.allSettled([
        apiGetBrands(), // 0
        isBrandUser ? Promise.resolve({ data: [] as any[], error: null }) : apiGetVendors(), // 1
        isBrandUser ? Promise.resolve({ data: [] as any[], error: null }) : apiGetHargaKonveksi(), // 2
        apiGetHargaBuyer(), // 3
        apiGetInboundRolls(), // 4
        isBrandUser ? Promise.resolve({ data: [] as any[], error: null }) : apiGetKasbon(), // 5
        apiGetSpk(), // 6
        apiGetSuratJalan(), // 7
        apiGetPembayaran(), // 8
        apiGetReturns(), // 9
        apiGetAccessories(), // 10
        isBrandUser ? Promise.resolve({ data: [] as any[], error: null }) : apiGetAccessoryMutations(), // 11
        isBrandUser ? Promise.resolve({ data: [] as any[], error: null }) : apiGetUsers(), // 12
        apiGetBrandSKUs(), // 13
        apiGetBrandSales(), // 14
        apiGetBrandStockExits(), // 15
        apiGetProductionPOs(), // 16
        isBrandUser ? Promise.resolve({ data: [] as any[], error: null }) : apiGetFobHppList(), // 17
        isBrandUser ? Promise.resolve({ data: [] as any[], error: null }) : apiGetFobQuotations(), // 18
        isBrandUser ? Promise.resolve({ data: [] as any[], error: null }) : apiGetFobMaterials(), // 19
        isBrandUser ? Promise.resolve({ data: [] as any[], error: null }) : apiGetFobProducts(), // 20
        isBrandUser ? Promise.resolve({ data: [] as any[], error: null }) : apiGetFobOrders(), // 21
        isBrandUser ? Promise.resolve({ data: [] as any[], error: null }) : apiGetFobDeposits(), // 22
      ]);

      // 0. Brands
      if (results[0].status === 'fulfilled' && Array.isArray(results[0].value.data)) {
        const mapped = results[0].value.data.map((b: any) => ({
          id: b.id,
          name: normalizeBrandName(b.name),
          code: normalizeBrandCode(b.name, b.code),
          contactPerson: b.contactPerson || '',
          phone: b.phone || '',
        }));
        setBrands(mapped);
        setCache('brands', mapped);
      }

      // 1. Vendors
      if (results[1].status === 'fulfilled' && Array.isArray(results[1].value.data) && !isBrandUser) {
        const vData = results[1].value.data;
        setVendors(prev => {
          const mapped = vData.map((v: any) => {
            const existing = prev.find(p => p.name === v.name);
            return {
              id: v.id,
              name: v.name,
              specialty: v.specialty || '',
              contact: v.contact || '',
              currentKasbon: existing ? existing.currentKasbon : 0,
            };
          });
          setCache('vendors', mapped);
          return mapped;
        });
      }

      // 2. Harga Konveksi
      if (results[2].status === 'fulfilled' && Array.isArray(results[2].value.data) && !isBrandUser) {
        const mapped = results[2].value.data.map((hk: any) => ({
          id: hk.id,
          vendor: hk.vendor,
          brand: normalizeBrandName(hk.brand),
          produk: hk.produk,
          harga: Number(hk.harga),
        }));
        setHargaKonveksi(mapped);
        setCache('harga_konveksi', mapped);
      }

      // 3. Harga Buyer
      if (results[3].status === 'fulfilled' && Array.isArray(results[3].value.data)) {
        const mapped = results[3].value.data.map((hb: any) => ({
          id: hb.id,
          brand: normalizeBrandName(hb.brand),
          produk: hb.produk,
          rateS: Number(hb.rateS ?? hb.rateSML ?? 0),
          rateM: Number(hb.rateM ?? hb.rateSML ?? 0),
          rateL: Number(hb.rateL ?? hb.rateSML ?? 0),
          rateXL: Number(hb.rateXL ?? 0),
          rateXXL: Number(hb.rateXXL ?? hb.rateXL ?? 0),
          rateSML: Number(hb.rateSML ?? hb.rateS ?? 0),
          rateAnak4: Number(hb.rateAnak4 || 0),
          rateAnak6: Number(hb.rateAnak6 || 0),
          rateAnak8: Number(hb.rateAnak8 || 0),
          rateAnak10: Number(hb.rateAnak10 || 0),
          rateAnak12: Number(hb.rateAnak12 || 0),
          rateAnak14: Number(hb.rateAnak14 || 0),
          rateAnak16: Number(hb.rateAnak16 || 0),
        }));
        setHargaBuyer(mapped);
        setCache('harga_buyer', mapped);
      }

      // 4. Inbound Rolls
      if (results[4].status === 'fulfilled' && Array.isArray(results[4].value.data)) {
        const mapped = results[4].value.data.map((r: any) => ({
          id: r.id,
          rollCode: r.rollCode,
          brand: normalizeBrandName(r.brand),
          jenisKain: r.jenisKain,
          meterLength: Number(r.meterLength),
          meterUsed: Number(r.meterUsed || 0),
          hargaModalMeter: Number(r.hargaModalMeter),
          status: r.status,
          tanggalMasuk: r.tanggalMasuk,
          keterangan: r.keterangan || '',
        }));
        setInboundRolls(mapped);
        setCache('inbound_rolls', mapped);
      }

      // 5. Kasbon
      if (results[5].status === 'fulfilled' && Array.isArray(results[5].value.data) && !isBrandUser) {
        const mapped = results[5].value.data.map((k: any) => ({
          id: k.id,
          vendor: k.vendor,
          tanggal: k.tanggal,
          jumlah: Number(k.jumlah),
          tipe: (k.tipe === 'PELUNASAN' ? 'POTONGAN_GAJI' : 'PINJAMAN') as 'PINJAMAN' | 'POTONGAN_GAJI',
          keterangan: k.keterangan,
        }));
        setKasbonList(mapped);
        setCache('kasbon', mapped);
      }

      // 6. SPK
      if (results[6].status === 'fulfilled' && Array.isArray(results[6].value.data)) {
        const cachedSpks = getCache<SPKCutting[]>('spk_list', []);
        const mapped = results[6].value.data.map((s: any) => {
          const cached = cachedSpks.find((e) => e.id === s.id || e.spkNumber === s.spkNumber);
          const targetCutQty = {
            s: s.targetS || 0,
            m: s.targetM || 0,
            l: s.targetL || 0,
            xl: s.targetXL || 0,
            xxl: s.targetXXL || 0,
            anak4: s.targetAnak4 || 0,
            anak6: s.targetAnak6 || 0,
            anak8: s.targetAnak8 || 0,
            anak10: s.targetAnak10 || 0,
            anak12: s.targetAnak12 || 0,
            anak14: s.targetAnak14 || 0,
            anak16: s.targetAnak16 || 0,
          };
          const deliveredQty = {
            s: s.deliveredS || 0,
            m: s.deliveredM || 0,
            l: s.deliveredL || 0,
            xl: s.deliveredXL || 0,
            xxl: s.deliveredXXL || 0,
            anak4: s.deliveredAnak4 || 0,
            anak6: s.deliveredAnak6 || 0,
            anak8: s.deliveredAnak8 || 0,
            anak10: s.deliveredAnak10 || 0,
            anak12: s.deliveredAnak12 || 0,
            anak14: s.deliveredAnak14 || 0,
            anak16: s.deliveredAnak16 || 0,
          };

          const rawSJs = results[7].status === 'fulfilled' && Array.isArray(results[7].value.data) ? results[7].value.data : [];
          const resolvedItems = buildSplitSpkItems(
            s.id,
            s.spkNumber,
            s.produk,
            s.vendor,
            targetCutQty,
            deliveredQty,
            s.items || cached?.items,
            rawSJs
          );

          return {
            id: s.id,
            spkNumber: s.spkNumber,
            brand: normalizeBrandName(s.brand),
            produk: s.produk,
            vendor: s.vendor,
            rollIds: s.rolsDigunakan ? s.rolsDigunakan.map((r: any) => r.rolId) : (cached?.rollIds || []),
            targetCutQty,
            deliveredQty,
            tanggalSPK: s.tanggalSPK,
            targetSelesai: s.targetSelesai || '',
            status: s.status,
            catatan: s.catatan || '',
            items: resolvedItems,
            fabricSourceType: s.fabricSourceType || cached?.fabricSourceType || (s.rolsDigunakan?.length ? 'ROLL_GUDANG' : undefined),
            depositId: s.depositId || cached?.depositId,
            depositInfo: s.depositInfo || cached?.depositInfo,
            sourcePONumber: s.sourcePONumber || cached?.sourcePONumber || null,
          };
        });
        setSpkList(mapped);
        setCache('spk_list', mapped);
      }

      // 7. Surat Jalan
      if (results[7].status === 'fulfilled' && Array.isArray(results[7].value.data)) {
        const mapped = results[7].value.data.map((sj: any) => ({
          id: sj.id,
          noSuratJalan: sj.noSuratJalan,
          brand: normalizeBrandName(sj.brand),
          tanggal: sj.tanggal,
          items: Array.isArray(sj.items)
            ? sj.items
            : typeof sj.items === 'string'
            ? JSON.parse(sj.items)
            : undefined,
          totalPcs: sj.totalPcs || 0,
          driverName: sj.driverName || '',
          nomorKendaraan: sj.nomorKendaraan || '',
          status: sj.status || 'DELIVERED',
          catatan: sj.catatan || '',
          spkId: sj.spkId,
          spkItemId: sj.spkItemId,
          produk: sj.produk,
          vendor: sj.vendor,
          jenisKain: sj.jenisKain,
          qtyDelivered: {
            s: sj.qtySML || 0,
            m: sj.qtyM || 0,
            l: sj.qtyL || 0,
            xl: sj.qtyXL || 0,
            xxl: sj.qtyXXL || 0,
            anak4: sj.qtyAnak4 || 0,
            anak6: sj.qtyAnak6 || 0,
            anak8: sj.qtyAnak8 || 0,
            anak10: sj.qtyAnak10 || 0,
            anak12: sj.qtyAnak12 || 0,
            anak14: sj.qtyAnak14 || 0,
            anak16: sj.qtyAnak16 || 0,
          },
        }));
        setSuratJalanList(mapped);
        setCache('surat_jalan', mapped);
      }

      // 8. Pembayaran
      if (results[8].status === 'fulfilled' && Array.isArray(results[8].value.data)) {
        const mapped = results[8].value.data.map((p: any) => ({
          id: p.id,
          brand: normalizeBrandName(p.brand),
          tanggal: p.tanggal,
          jumlah: Number(p.jumlah),
          metode: p.metode,
          keterangan: p.keterangan || '',
          referensiNomor: p.referensiNomor || '',
        }));
        setPembayaranList(mapped);
        setCache('pembayaran', mapped);
      }

      // 9. Returns
      if (results[9].status === 'fulfilled' && Array.isArray(results[9].value.data)) {
        const mapped = results[9].value.data.map((r: any) => ({
          id: r.id,
          noRetur: r.noRetur,
          sumber: r.sumber,
          spkId: r.spkId || undefined,
          suratJalanId: r.suratJalanId || undefined,
          brand: normalizeBrandName(r.brand),
          produk: r.produk,
          vendor: r.vendor,
          tanggalRetur: r.tanggalRetur,
          tanggalSelesai: r.tanggalSelesai || undefined,
          alasanCacat: r.alasanCacat,
          kategoriCacat: r.kategoriCacat || 'JAHITAN',
          catatan: r.catatan || undefined,
          status: r.status,
          qtyBreakdown: {
            s: r.qtyS || 0,
            m: r.qtyM || 0,
            l: r.qtyL || 0,
            xl: r.qtyXL || 0,
            xxl: r.qtyXXL || 0,
            anak4: r.qtyAnak4 || 0,
            anak6: r.qtyAnak6 || 0,
            anak8: r.qtyAnak8 || 0,
            anak10: r.qtyAnak10 || 0,
            anak12: r.qtyAnak12 || 0,
            anak14: r.qtyAnak14 || 0,
            anak16: r.qtyAnak16 || 0,
          },
          totalPcs: r.totalPcs || 0,
          qtyReworked: r.qtyReworked || 0,
          qtyRejectTotal: r.qtyRejectTotal || 0,
          spk: r.spk,
          suratJalan: r.suratJalan,
        }));
        setReturnList(mapped);
        setCache('returns', mapped);
      }

      // 10. Accessories
      if (results[10].status === 'fulfilled' && Array.isArray(results[10].value.data)) {
        const mapped = results[10].value.data.map((a: any) => ({
          id: a.id,
          sku: a.sku,
          name: a.name,
          category: a.category,
          brand: a.brand || 'UMUM',
          unit: a.unit,
          stock: Number(a.stock),
          safetyStock: Number(a.safetyStock),
          location: a.location || '',
          costPerUnit: a.costPerUnit ? Number(a.costPerUnit) : undefined,
          notes: a.notes || '',
          createdAt: a.createdAt,
          updatedAt: a.updatedAt,
        }));
        setAccessories(mapped);
        setCache('accessories', mapped);
      }

      // 11. Accessory Mutations
      if (results[11].status === 'fulfilled' && Array.isArray(results[11].value.data) && !isBrandUser) {
        const mapped = results[11].value.data.map((m: any) => ({
          id: m.id,
          accessoryId: m.accessoryId,
          accessoryName: m.accessoryName,
          sku: m.sku,
          type: m.type,
          quantity: Number(m.quantity),
          unit: m.unit,
          date: String(m.date).split('T')[0],
          sourceOrDestination: m.sourceOrDestination || undefined,
          spkId: m.spkId || undefined,
          spkNumber: m.spkNumber || undefined,
          recipientOrVendor: m.recipientOrVendor || undefined,
          notes: m.notes || undefined,
          costTotal: m.costTotal ? Number(m.costTotal) : undefined,
          createdAt: String(m.createdAt),
        }));
        setAccessoryMutations(mapped);
        setCache('accessory_mutations', mapped);
      }

      // 12. Users
      if (results[12].status === 'fulfilled' && Array.isArray(results[12].value.data) && !isBrandUser) {
        setManagedUsers(results[12].value.data);
      }

      // 13. Brand SKUs
      if (results[13].status === 'fulfilled' && Array.isArray(results[13].value.data)) {
        const mapped = results[13].value.data.map((s: any) => ({
          ...s,
          hpp: Number(s.hpp || 0),
          stokAwal: Number(s.stokAwal || 0),
        }));
        setBrandSKUs(mapped);
        setCache('brand_skus', mapped);
      }

      // 14. Brand Sales
      if (results[14].status === 'fulfilled' && Array.isArray(results[14].value.data)) {
        const mapped = results[14].value.data.map((s: any) => ({
          ...s,
          qty: Number(s.qty || 1),
          hpp: Number(s.hpp || 0),
          omset: Number(s.omset || 0),
          biayaIklan: Number(s.biayaIklan || 0),
          biayaOperasional: Number(s.biayaOperasional || 0),
          estimasiProfit: Number(s.estimasiProfit || 0),
        }));
        setBrandSales(mapped);
        setCache('brand_sales', mapped);
      }

      // 15. Brand Stock Exits
      if (results[15].status === 'fulfilled' && Array.isArray(results[15].value.data)) {
        const mapped = results[15].value.data.map((e: any) => ({
          ...e,
          qty: Number(e.qty || 1),
        }));
        setBrandStockExits(mapped);
        setCache('brand_stock_exits', mapped);
      }

      // 16. Production POs
      if (results[16].status === 'fulfilled' && Array.isArray(results[16].value.data)) {
        setProductionPOs(results[16].value.data);
        setCache('production_pos', results[16].value.data);
      }

      // 17. FOB HPP Records
      if (results[17]?.status === 'fulfilled' && Array.isArray(results[17].value.data)) {
        const rawHpp = results[17].value.data;
        setHppRecords(rawHpp);
        setCache('fob_hpp_records', rawHpp);
        try { localStorage.setItem('hpp_fob_v4', JSON.stringify(rawHpp)); } catch {}
      }

      // 18. FOB Quotations
      if (results[18]?.status === 'fulfilled' && Array.isArray(results[18].value.data)) {
        const rawQuo = results[18].value.data;
        setFobQuotations(rawQuo);
        setCache('fob_quotations', rawQuo);
      }

      // 19. FOB Materials
      if (results[19]?.status === 'fulfilled' && Array.isArray(results[19].value.data) && results[19].value.data.length > 0) {
        setFobMaterials(results[19].value.data);
        setCache('fob_materials', results[19].value.data);
      }

      // 20. FOB Products
      if (results[20]?.status === 'fulfilled' && Array.isArray(results[20].value.data) && results[20].value.data.length > 0) {
        setFobProducts(results[20].value.data);
        setCache('fob_products', results[20].value.data);
      }

      // 21. FOB Orders (PO Brand)
      if (results[21]?.status === 'fulfilled' && Array.isArray(results[21].value.data)) {
        const cleanedOrders = results[21].value.data.map((o: any) => ({
          ...o,
          grandTotal: Number(o.grandTotal || 0),
          totalQty: Number(o.totalQty || 0),
          totalPembelian: Number(o.totalPembelian || 0),
          biayaLain: Number(o.biayaLain || 0),
        }));
        setFobOrders(cleanedOrders);
        setCache('fob_orders', cleanedOrders);
      }

      // 22. FOB Down Payments (Inbound DP Uang)
      if (results[22]?.status === 'fulfilled' && Array.isArray(results[22].value.data)) {
        const rawDep = results[22].value.data.map((d: any) => ({
          ...d,
          nominalDp: Number(d.nominalDp || 0),
          totalNilaiPo: Number(d.totalNilaiPo || 0),
          nominalTotalOrder: Number(d.nominalTotalOrder || d.totalNilaiPo || 0),
          persentaseDp: Number(d.persentaseDp || 0),
          tanggalBayar: typeof d.tanggalBayar === 'string' ? d.tanggalBayar.split('T')[0] : d.tanggalBayar,
          alokasiKain: d.alokasiKain ? (typeof d.alokasiKain === 'string' ? JSON.parse(d.alokasiKain) : d.alokasiKain) : undefined,
          buktiBayarUrl: d.buktiBayarUrl || undefined,
        }));
        setFobDeposits(rawDep);
        setCache('fob_deposits', rawDep);
      }

      setLastSyncedAt(new Date());
    } catch (err) {
      console.warn('[Sync Error] Continuing with cached data:', err);
    } finally {
      setIsSyncing(false);
    }
  }, [currentUser]);

  // Run backend sync on startup or when currentUser changes
  useEffect(() => {
    if (currentUser) {
      syncFromBackend();
    }
  }, [currentUser, syncFromBackend]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('konvek_auth_user', JSON.stringify(currentUser));
      setUserRole(currentUser.role);
      if (currentUser.role === 'BRAND' && currentUser.brandName) {
        setActiveBrand(currentUser.brandName);
      }
    } else {
      localStorage.removeItem('konvek_auth_user');
    }
  }, [currentUser]);

  // Auth Handlers
  const fetchPendingBrands = useCallback(async () => {
    try {
      const { data } = await apiGetPendingBrands();
      if (data && Array.isArray(data.pending)) {
        setPendingBrands(data.pending);
      }
    } catch (err) {
      console.warn('Failed to fetch pending brands:', err);
    }
  }, []);

  const registerBrand = async (data: {
    name: string;
    email: string;
    password: string;
    phone?: string;
    brands: string[];
  }): Promise<{ success: boolean; message: string }> => {
    const { data: res, error } = await apiRegisterBrand(data);
    if (error || !res) {
      return { success: false, message: error || 'Pendaftaran gagal diproses.' };
    }
    return { success: true, message: res.message };
  };

  const approveBrandUser = async (userId: string, data?: { accessibleBrands?: string[]; brandName?: string }) => {
    const { data: res, error } = await apiApproveBrand(userId, data);
    if (!error) {
      setPendingBrands(prev => prev.filter(p => p.id !== userId));
      await syncFromBackend();
      await fetchManagedUsers();
      return { success: true, message: res?.message || 'Akun berhasil disetujui!' };
    }
    return { success: false, message: error || 'Gagal menyetujui akun.' };
  };

  const rejectBrandUser = async (userId: string) => {
    const { data: res, error } = await apiRejectBrand(userId);
    if (!error) {
      setPendingBrands(prev => prev.filter(p => p.id !== userId));
      return { success: true, message: res?.message || 'Pendaftaran ditolak.' };
    }
    return { success: false, message: error || 'Gagal menolak akun.' };
  };

  // User Management Handlers (Admin Only)
  const fetchManagedUsers = useCallback(async () => {
    try {
      const { data, error } = await apiGetUsers();
      if (!error && Array.isArray(data)) {
        setManagedUsers(data);
      }
    } catch (err) {
      console.warn('Failed to fetch managed users:', err);
    }
  }, []);

  const createManagedUser = async (userData: {
    name: string;
    email: string;
    password: string;
    phone?: string;
    role?: UserRole;
    status?: string;
    brandName?: string;
    accessibleBrands?: string[];
  }): Promise<{ success: boolean; message: string }> => {
    try {
      const { data, error } = await apiCreateUser(userData);
      if (error || !data) {
        return { success: false, message: error || 'Gagal menambahkan pengguna.' };
      }
      if (data.user) {
        setManagedUsers(prev => [data.user, ...prev]);
        await syncFromBackend();
      }
      return { success: true, message: data.message || 'Pengguna berhasil ditambahkan.' };
    } catch (err: any) {
      return { success: false, message: err?.message || 'Terjadi kesalahan sistem.' };
    }
  };

  const updateManagedUser = async (
    id: string,
    userData: Partial<{
      name: string;
      email: string;
      password?: string;
      phone?: string;
      role: UserRole;
      status: string;
      brandName?: string;
      accessibleBrands?: string[];
    }>
  ): Promise<{ success: boolean; message: string }> => {
    try {
      const { data, error } = await apiUpdateUser(id, userData);
      if (error || !data) {
        return { success: false, message: error || 'Gagal memperbarui pengguna.' };
      }
      if (data.user) {
        setManagedUsers(prev => prev.map(u => (u.id === id ? { ...u, ...data.user } : u)));
        if (currentUser?.id === id) {
          const updatedAuthUser: AuthUser = {
            ...currentUser,
            name: data.user.name ?? currentUser.name,
            email: data.user.email ?? currentUser.email,
            phone: data.user.phone ?? currentUser.phone,
            role: data.user.role ?? currentUser.role,
            brandName: data.user.brandName ?? currentUser.brandName,
            accessibleBrands: data.user.accessibleBrands ?? currentUser.accessibleBrands,
          };
          setCurrentUser(updatedAuthUser);
          localStorage.setItem('konvek_auth_user', JSON.stringify(updatedAuthUser));
        }
        await syncFromBackend();
      }
      return { success: true, message: data.message || 'Data pengguna berhasil diperbarui.' };
    } catch (err: any) {
      return { success: false, message: err?.message || 'Terjadi kesalahan sistem.' };
    }
  };

  const deleteManagedUser = async (id: string): Promise<{ success: boolean; message: string }> => {
    try {
      const { data, error } = await apiDeleteUser(id);
      if (error || !data) {
        return { success: false, message: error || 'Gagal menghapus pengguna.' };
      }
      setManagedUsers(prev => prev.filter(u => u.id !== id));
      return { success: true, message: data.message || 'Pengguna berhasil dihapus.' };
    } catch (err: any) {
      return { success: false, message: err?.message || 'Terjadi kesalahan sistem.' };
    }
  };

  // Brand Inventory Handlers
  const fetchBrandInventoryData = useCallback(async (brand?: string) => {
    try {
      const [skusRes, salesRes, exitsRes] = await Promise.all([
        apiGetBrandSKUs(brand),
        apiGetBrandSales(brand),
        apiGetBrandStockExits(brand),
      ]);
      if (Array.isArray(skusRes.data)) {
        setBrandSKUs(skusRes.data.map(s => ({
          ...s,
          hpp: Number(s.hpp || 0),
          stokAwal: Number(s.stokAwal || 0),
        })));
      }
      if (Array.isArray(salesRes.data)) {
        setBrandSales(salesRes.data.map(s => ({
          ...s,
          qty: Number(s.qty || 1),
          hpp: Number(s.hpp || 0),
          omset: Number(s.omset || 0),
          biayaIklan: Number(s.biayaIklan || 0),
          biayaOperasional: Number(s.biayaOperasional || 0),
          estimasiProfit: Number(s.estimasiProfit || 0),
        })));
      }
      if (Array.isArray(exitsRes.data)) {
        setBrandStockExits(exitsRes.data.map(e => ({
          ...e,
          qty: Number(e.qty || 1),
        })));
      }
    } catch (err) {
      console.warn('Failed to fetch brand inventory data:', err);
    }
  }, []);

  const createBrandSKU = async (skuData: {
    brand?: string;
    produk: string;
    sku: string;
    warna?: string;
    ukuran?: string;
    hpp: number;
    stokAwal?: number;
    catatan?: string;
  }): Promise<{ success: boolean; message: string }> => {
    try {
      const { data, error } = await apiCreateBrandSKU(skuData);
      if (error || !data) {
        return { success: false, message: error || 'Gagal menambahkan SKU.' };
      }
      if (data.data) {
        setBrandSKUs(prev => [...prev, {
          ...data.data,
          hpp: Number(data.data.hpp || 0),
          stokAwal: Number(data.data.stokAwal || 0),
        }]);
      }
      return { success: true, message: data.message || 'SKU berhasil ditambahkan.' };
    } catch (err: any) {
      return { success: false, message: err?.message || 'Terjadi kesalahan sistem.' };
    }
  };

  const updateBrandSKU = async (
    id: string,
    skuData: Partial<{
      produk: string;
      sku: string;
      warna?: string;
      ukuran?: string;
      hpp: number;
      stokAwal: number;
      catatan?: string;
    }>
  ): Promise<{ success: boolean; message: string }> => {
    try {
      const { data, error } = await apiUpdateBrandSKU(id, skuData);
      if (error || !data) {
        return { success: false, message: error || 'Gagal memperbarui SKU.' };
      }
      if (data.data) {
        setBrandSKUs(prev => prev.map(s => s.id === id ? {
          ...s,
          ...data.data,
          hpp: Number(data.data.hpp !== undefined ? data.data.hpp : s.hpp),
          stokAwal: Number(data.data.stokAwal !== undefined ? data.data.stokAwal : s.stokAwal),
        } : s));
      }
      return { success: true, message: data.message || 'SKU berhasil diperbarui.' };
    } catch (err: any) {
      return { success: false, message: err?.message || 'Terjadi kesalahan sistem.' };
    }
  };

  const deleteBrandSKU = async (id: string): Promise<{ success: boolean; message: string }> => {
    try {
      const { data, error } = await apiDeleteBrandSKU(id);
      if (error || !data) {
        return { success: false, message: error || 'Gagal menghapus SKU.' };
      }
      setBrandSKUs(prev => prev.filter(s => s.id !== id));
      return { success: true, message: data.message || 'SKU berhasil dihapus.' };
    } catch (err: any) {
      return { success: false, message: err?.message || 'Terjadi kesalahan sistem.' };
    }
  };

  const createBrandSale = async (saleData: {
    brand?: string;
    tanggal: string;
    marketplace: string;
    toko?: string;
    noPesanan?: string;
    username?: string;
    skuId?: string;
    sku: string;
    qty: number;
    hpp?: number;
    omset: number;
    biayaIklan?: number;
    biayaOperasional?: number;
    catatan?: string;
  }): Promise<{ success: boolean; message: string }> => {
    try {
      const { data, error } = await apiCreateBrandSale(saleData);
      if (error || !data) {
        return { success: false, message: error || 'Gagal mencatat penjualan.' };
      }
      if (data.data) {
        setBrandSales(prev => [data.data, ...prev]);
      }
      return { success: true, message: data.message || 'Penjualan berhasil dicatat.' };
    } catch (err: any) {
      return { success: false, message: err?.message || 'Terjadi kesalahan sistem.' };
    }
  };

  const deleteBrandSale = async (id: string): Promise<{ success: boolean; message: string }> => {
    try {
      const { data, error } = await apiDeleteBrandSale(id);
      if (error || !data) {
        return { success: false, message: error || 'Gagal menghapus penjualan.' };
      }
      setBrandSales(prev => prev.filter(s => s.id !== id));
      return { success: true, message: data.message || 'Penjualan berhasil dihapus.' };
    } catch (err: any) {
      return { success: false, message: err?.message || 'Terjadi kesalahan sistem.' };
    }
  };

  const createBrandStockExit = async (exitData: {
    brand?: string;
    tanggal: string;
    skuId?: string;
    sku: string;
    qty: number;
    kategori: string;
    keterangan?: string;
  }): Promise<{ success: boolean; message: string }> => {
    try {
      const { data, error } = await apiCreateBrandStockExit(exitData);
      if (error || !data) {
        return { success: false, message: error || 'Gagal mencatat barang keluar.' };
      }
      if (data.data) {
        setBrandStockExits(prev => [data.data, ...prev]);
      }
      return { success: true, message: data.message || 'Barang keluar berhasil dicatat.' };
    } catch (err: any) {
      return { success: false, message: err?.message || 'Terjadi kesalahan sistem.' };
    }
  };

  const deleteBrandStockExit = async (id: string): Promise<{ success: boolean; message: string }> => {
    try {
      const { data, error } = await apiDeleteBrandStockExit(id);
      if (error || !data) {
        return { success: false, message: error || 'Gagal menghapus data barang keluar.' };
      }
      setBrandStockExits(prev => prev.filter(e => e.id !== id));
      return { success: true, message: data.message || 'Data barang keluar berhasil dihapus.' };
    } catch (err: any) {
      return { success: false, message: err?.message || 'Terjadi kesalahan sistem.' };
    }
  };

  // ============================================================
  // PRODUCTION PO (SURAT PO PRODUKSI KONVEKSI - DATABASE BACKED)
  // ============================================================

  const fetchProductionPOs = useCallback(async (params?: { brand?: string; status?: string; search?: string }) => {
    try {
      const { data, error } = await apiGetProductionPOs(params);
      if (error) {
        console.error('Error fetching production POs:', error);
        return;
      }
      if (Array.isArray(data)) {
        setProductionPOs(data);
      }
    } catch (err) {
      console.error('Error fetching production POs:', err);
    }
  }, []);

  const createProductionPO = async (poData: {
    noPO: string;
    brand: string;
    vendorTujuan: string;
    tanggalPO: string;
    targetDeadline: string;
    catatan?: string;
    status?: string;
    usedDepositId?: string | null;
    usedDepositInfo?: string | null;
    items: {
      namaProduk: string;
      warna?: string;
      ukuran?: string;
      qty: number;
      bahanKain?: string;
      catatan?: string;
      depositId?: string | null;
      depositInfo?: string | null;
    }[];
  }): Promise<{ success: boolean; message: string; data?: ProductionPO }> => {
    try {
      const { data, error } = await apiCreateProductionPO(poData);
      if (error || !data) {
        // Fallback local creation jika backend offline/tidak merespon
        const fallbackPO: ProductionPO = {
          id: `po-${Date.now()}`,
          noPO: poData.noPO,
          brand: poData.brand,
          vendorTujuan: poData.vendorTujuan,
          tanggalPO: poData.tanggalPO,
          targetDeadline: poData.targetDeadline,
          catatan: poData.catatan || null,
          usedDepositId: poData.usedDepositId || null,
          usedDepositInfo: poData.usedDepositInfo || null,
          status: poData.status || 'DRAFT',
          totalPcs: poData.items.reduce((acc, it) => acc + (Number(it.qty) || 0), 0),
          items: poData.items.map((it, idx) => ({
            id: `poi-${Date.now()}-${idx}`,
            namaProduk: it.namaProduk,
            warna: it.warna || null,
            ukuran: it.ukuran || null,
            qty: Number(it.qty) || 0,
            bahanKain: it.bahanKain || null,
            catatan: it.catatan || null,
            depositId: it.depositId || null,
            depositInfo: it.depositInfo || null,
            createdAt: new Date().toISOString(),
          })),
          createdAt: new Date().toISOString(),
        };

        setProductionPOs(prev => {
          const updated = [fallbackPO, ...prev];
          setCache('production_pos', updated);
          return updated;
        });

        if (poData.usedDepositId) {
          await useVendorDeposit(poData.usedDepositId, fallbackPO.id, fallbackPO.noPO, 999999);
        }

        return { success: true, message: 'Surat PO berhasil disimpan.', data: fallbackPO };
      }

      if (data.data) {
        setProductionPOs(prev => {
          const updated = [data.data, ...prev];
          setCache('production_pos', updated);
          return updated;
        });
        if (poData.usedDepositId) {
          await useVendorDeposit(poData.usedDepositId, data.data.id, data.data.noPO, 999999);
        }
      }
      return { success: true, message: data.message || 'Surat PO berhasil disimpan ke database.', data: data.data };
    } catch (err: any) {
      return { success: false, message: err?.message || 'Terjadi kesalahan sistem.' };
    }
  };

  const updateProductionPO = async (
    id: string,
    poData: Partial<{
      noPO: string;
      brand: string;
      vendorTujuan: string;
      tanggalPO: string;
      targetDeadline: string;
      catatan?: string;
      status: string;
      usedDepositId?: string | null;
      usedDepositInfo?: string | null;
      items: {
        namaProduk: string;
        warna?: string;
        ukuran?: string;
        qty: number;
        bahanKain?: string;
        catatan?: string;
        depositId?: string | null;
        depositInfo?: string | null;
      }[];
    }>
  ): Promise<{ success: boolean; message: string; data?: ProductionPO }> => {
    try {
      const { data, error } = await apiUpdateProductionPO(id, poData);
      if (error || !data) {
        // Fallback local update
        setProductionPOs(prev => {
          const updated = prev.map(p => (p.id === id ? ({ ...p, ...poData } as ProductionPO) : p));
          setCache('production_pos', updated);
          return updated;
        });
        return { success: true, message: 'Surat PO berhasil diperbarui.' };
      }
      if (data.data) {
        setProductionPOs(prev => {
          const updated = prev.map(p => (p.id === id ? data.data : p));
          setCache('production_pos', updated);
          return updated;
        });
      }
      return { success: true, message: data.message || 'Surat PO berhasil diperbarui.', data: data.data };
    } catch (err: any) {
      return { success: false, message: err?.message || 'Terjadi kesalahan sistem.' };
    }
  };

  const updateProductionPOStatus = async (id: string, status: string): Promise<{ success: boolean; message: string }> => {
    try {
      const { data, error } = await apiUpdateProductionPOStatus(id, status);
      if (error || !data) {
        setProductionPOs(prev => {
          const updated = prev.map(p => (p.id === id ? { ...p, status } : p));
          setCache('production_pos', updated);
          return updated;
        });
        return { success: true, message: 'Status PO berhasil diubah.' };
      }
      if (data.data) {
        setProductionPOs(prev => {
          const updated = prev.map(p => (p.id === id ? { ...p, status } : p));
          setCache('production_pos', updated);
          return updated;
        });
      }
      return { success: true, message: data.message || 'Status PO berhasil diubah.' };
    } catch (err: any) {
      return { success: false, message: err?.message || 'Terjadi kesalahan sistem.' };
    }
  };

  const deleteProductionPO = async (id: string): Promise<{ success: boolean; message: string }> => {
    try {
      const { data, error } = await apiDeleteProductionPO(id);
      if (error) {
        setProductionPOs(prev => {
          const updated = prev.filter(p => p.id !== id);
          setCache('production_pos', updated);
          return updated;
        });
        return { success: true, message: 'Surat PO berhasil dihapus.' };
      }
      setProductionPOs(prev => {
        const updated = prev.filter(p => p.id !== id);
        setCache('production_pos', updated);
        return updated;
      });
      return { success: true, message: data?.message || 'Surat PO berhasil dihapus dari database.' };
    } catch (err: any) {
      return { success: false, message: err?.message || 'Terjadi kesalahan sistem.' };
    }
  };

  // Vendor Fabric Deposits (Saldo Titipan & Transfer Bahan Antar-Vendor)
  const createFabricTransfer = async (data: {
    sourcePOId: string;
    sourcePONumber: string;
    sourceVendor: string;
    targetVendor: string;
    brand: string;
    jenisKain: string;
    warna?: string;
    panjang: number;
    satuan: 'METER' | 'YARD';
    driverName: string;
    kondisiKain?: string;
    catatan?: string;
  }): Promise<{ success: boolean; message: string; deposit?: VendorFabricDeposit; transferNote?: FabricTransferNote }> => {
    try {
      const depositId = `dep-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const transferId = `trf-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const dateStr = new Date().toISOString().slice(2, 10).replace(/-/g, '');
      const rand = Math.floor(100 + Math.random() * 900);
      const transferNumber = `SJ-TRF-${dateStr}-${rand}`;
      const now = new Date().toISOString();

      const newDeposit: VendorFabricDeposit = {
        id: depositId,
        sourcePOId: data.sourcePOId,
        sourcePONumber: data.sourcePONumber,
        sourceVendor: data.sourceVendor,
        targetVendor: data.targetVendor,
        brand: data.brand,
        jenisKain: data.jenisKain,
        warna: data.warna || null,
        panjangAwal: Number(data.panjang),
        panjangSisa: Number(data.panjang),
        satuan: data.satuan,
        status: 'TERSEDIA',
        measuredBy: data.driverName,
        tanggalTitip: now.split('T')[0],
        catatan: data.catatan || null,
        createdAt: now,
        updatedAt: now,
      };

      const newTransferNote: FabricTransferNote = {
        id: transferId,
        transferNumber,
        depositId,
        sourcePOId: data.sourcePOId,
        sourcePONumber: data.sourcePONumber,
        sourceVendor: data.sourceVendor,
        targetVendor: data.targetVendor,
        brand: data.brand,
        jenisKain: data.jenisKain,
        warna: data.warna || null,
        panjang: Number(data.panjang),
        satuan: data.satuan,
        driverName: data.driverName,
        kondisiKain: data.kondisiKain || null,
        tanggal: now.split('T')[0],
        catatan: data.catatan || null,
        createdAt: now,
      };

      setVendorFabricDeposits(prev => {
        const updated = [newDeposit, ...prev];
        setCache('vendor_fabric_deposits', updated);
        return updated;
      });

      setFabricTransferNotes(prev => {
        const updated = [newTransferNote, ...prev];
        setCache('fabric_transfer_notes', updated);
        return updated;
      });

      return {
        success: true,
        message: `Sisa kain berhasil dititipkan ke ${data.targetVendor} dengan Surat Jalan ${transferNumber}.`,
        deposit: newDeposit,
        transferNote: newTransferNote,
      };
    } catch (err: any) {
      return { success: false, message: err?.message || 'Gagal memproses transfer kain.' };
    }
  };

  const useVendorDeposit = async (
    depositId: string,
    poId: string,
    poNumber: string,
    usedLength: number
  ): Promise<{ success: boolean; message: string }> => {
    try {
      setVendorFabricDeposits(prev => {
        const updated = prev.map(dep => {
          if (dep.id === depositId) {
            const remaining = Math.max(0, dep.panjangSisa - usedLength);
            return {
              ...dep,
              panjangSisa: remaining,
              status: (remaining === 0 ? 'TERPAKAI' : 'TERSEDIA') as FabricDepositStatus,
              allocatedPOId: poId,
              allocatedPONumber: poNumber,
              updatedAt: new Date().toISOString(),
            };
          }
          return dep;
        });
        setCache('vendor_fabric_deposits', updated);
        return updated;
      });
      return { success: true, message: 'Saldo titipan kain berhasil dialokasikan ke PO.' };
    } catch (err: any) {
      return { success: false, message: err?.message || 'Gagal mengalokasikan kain titipan.' };
    }
  };

  const returnDepositToWarehouse = async (
    depositId: string,
    catatan?: string
  ): Promise<{ success: boolean; message: string }> => {
    try {
      setVendorFabricDeposits(prev => {
        const updated = prev.map(dep => {
          if (dep.id === depositId) {
            return {
              ...dep,
              status: 'DITARIK' as FabricDepositStatus,
              catatan: catatan ? `${dep.catatan || ''} | Ditarik ke Gudang: ${catatan}` : dep.catatan,
              updatedAt: new Date().toISOString(),
            };
          }
          return dep;
        });
        setCache('vendor_fabric_deposits', updated);
        return updated;
      });
      return { success: true, message: 'Kain titipan berhasil ditarik kembali ke gudang pusat.' };
    } catch (err: any) {
      return { success: false, message: err?.message || 'Gagal menarik kain titipan.' };
    }
  };

  const deleteFabricDeposit = async (depositId: string): Promise<{ success: boolean; message: string }> => {
    try {
      setVendorFabricDeposits(prev => {
        const updated = prev.filter(d => d.id !== depositId);
        setCache('vendor_fabric_deposits', updated);
        return updated;
      });
      setFabricTransferNotes(prev => {
        const updated = prev.filter(n => n.depositId !== depositId);
        setCache('fabric_transfer_notes', updated);
        return updated;
      });
      return { success: true, message: 'Catatan titipan bahan berhasil dihapus.' };
    } catch (err: any) {
      return { success: false, message: err?.message || 'Gagal menghapus catatan titipan bahan.' };
    }
  };

  // ============================================================
  // FOB COSTING & SPH (Database-backed Handlers)
  // ============================================================

  const refreshFobData = async () => {
    setIsLoadingFob(true);
    try {
      const [resHpp, resQuo, resMat, resProd, resOrders] = await Promise.all([
        apiGetFobHppList(),
        apiGetFobQuotations(),
        apiGetFobMaterials(),
        apiGetFobProducts(),
        apiGetFobOrders(),
      ]);

      if (resHpp.data && Array.isArray(resHpp.data)) {
        setHppRecords(resHpp.data);
        setCache('fob_hpp_records', resHpp.data);
        try { localStorage.setItem('hpp_fob_v4', JSON.stringify(resHpp.data)); } catch {}
      }
      if (resQuo.data && Array.isArray(resQuo.data)) {
        setFobQuotations(resQuo.data);
        setCache('fob_quotations', resQuo.data);
      }
      if (resMat.data && Array.isArray(resMat.data) && resMat.data.length > 0) {
        setFobMaterials(resMat.data);
        setCache('fob_materials', resMat.data);
      }
      if (resProd.data && Array.isArray(resProd.data) && resProd.data.length > 0) {
        setFobProducts(resProd.data);
        setCache('fob_products', resProd.data);
      }
      if (resOrders.data && Array.isArray(resOrders.data)) {
        setFobOrders(resOrders.data);
        setCache('fob_orders', resOrders.data);
      }
    } catch (err) {
      console.warn('[FOB-REFRESH-ERROR]', err);
    } finally {
      setIsLoadingFob(false);
    }
  };

  const saveHppRecord = async (record: Partial<HPPCalculationRecord>): Promise<{ success: boolean; data?: HPPCalculationRecord; error?: string }> => {
    try {
      const { data, error } = await apiCreateFobHpp(record);
      if (error || !data) {
        // Fallback local save jika backend offline
        const fallback: HPPCalculationRecord = {
          id: `hpp-${Date.now()}`,
          noHpp: record.noHpp || `HPP/${new Date().getFullYear()}/${String(hppRecords.length + 1).padStart(4, '0')}`,
          tanggal: record.tanggal || new Date().toISOString(),
          namaProduk: record.namaProduk || 'Untitled Product',
          kodeProduk: record.kodeProduk || null,
          size: record.size || 'ALL SIZE',
          kategori: record.kategori || 'Kaos',
          brand: record.brand || 'UMUM',
          vendorCmt: record.vendorCmt || null,
          batchQty: Number(record.batchQty) || 100,

          targetLabaPercent: Number(record.targetLabaPercent) || 30,
          rejectPercent: Number(record.rejectPercent) || 3,
          ppnPercent: Number(record.ppnPercent) || 0,
          zakatPercent: Number(record.zakatPercent) || 0,
          affiliatePercent: Number(record.affiliatePercent) || 0,

          hppBahanTotal: Number(record.hppBahanTotal) || 0,
          hppCmtTotal: Number(record.hppCmtTotal) || 0,
          totalSebelumReject: Number(record.totalSebelumReject) || 0,
          nilaiReject: Number(record.nilaiReject) || 0,
          hppFinalPerPcs: Number(record.hppFinalPerPcs) || 0,
          hargaJualRekomendasi: Number(record.hargaJualRekomendasi) || 0,
          labaBersihPerPcs: Number(record.labaBersihPerPcs) || 0,

          totalBiayaBatch: Number(record.totalBiayaBatch) || 0,
          totalOmzetBatch: Number(record.totalOmzetBatch) || 0,
          totalLabaBatch: Number(record.totalLabaBatch) || 0,
          catatan: record.catatan || null,
          components: record.components || [],
          createdAt: new Date().toISOString(),
        };

        setHppRecords(prev => {
          const updated = [fallback, ...prev];
          setCache('fob_hpp_records', updated);
          try { localStorage.setItem('hpp_fob_v4', JSON.stringify(updated)); } catch {}
          return updated;
        });
        return { success: true, data: fallback };
      }

      const savedRecord = data.data;
      setHppRecords(prev => {
        const updated = [savedRecord, ...prev.filter(r => r.id !== savedRecord.id)];
        setCache('fob_hpp_records', updated);
        try { localStorage.setItem('hpp_fob_v4', JSON.stringify(updated)); } catch {}
        return updated;
      });
      return { success: true, data: savedRecord };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Gagal menyimpan kalkulasi HPP.' };
    }
  };

  const updateHppRecord = async (id: string, record: Partial<HPPCalculationRecord>): Promise<{ success: boolean; error?: string }> => {
    try {
      await apiUpdateFobHpp(id, record);
      setHppRecords(prev => {
        const updated = prev.map(r => r.id === id ? { ...r, ...record, updatedAt: new Date().toISOString() } : r);
        setCache('fob_hpp_records', updated);
        try { localStorage.setItem('hpp_fob_v4', JSON.stringify(updated)); } catch {}
        return updated;
      });
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Gagal memperbarui HPP.' };
    }
  };

  const deleteHppRecord = async (id: string): Promise<{ success: boolean; error?: string }> => {
    try {
      await apiDeleteFobHpp(id);
      setHppRecords(prev => {
        const updated = prev.filter(r => r.id !== id);
        setCache('fob_hpp_records', updated);
        try { localStorage.setItem('hpp_fob_v4', JSON.stringify(updated)); } catch {}
        return updated;
      });
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Gagal menghapus kalkulasi HPP.' };
    }
  };

  const saveFobQuotation = async (quotation: Partial<FOBQuotation>): Promise<{ success: boolean; data?: FOBQuotation; error?: string }> => {
    try {
      const { data, error } = await apiCreateFobQuotation(quotation);
      if (error || !data) {
        const fallback: FOBQuotation = {
          id: `sph-${Date.now()}`,
          noSurat: quotation.noSurat || `SPH/${new Date().getFullYear()}/${String(fobQuotations.length + 1).padStart(4, '0')}`,
          tanggal: quotation.tanggal || new Date().toISOString(),
          buyerName: quotation.buyerName || 'Buyer',
          buyerCompany: quotation.buyerCompany || null,
          buyerContact: quotation.buyerContact || null,
          validUntil: quotation.validUntil || null,
          termsDPPercent: Number(quotation.termsDPPercent) || 50,
          totalQty: Number(quotation.totalQty) || 0,
          totalOrderNominal: Number(quotation.totalOrderNominal) || 0,
          nominalDP: Number(quotation.nominalDP) || 0,
          sisaPelunasan: Number(quotation.sisaPelunasan) || 0,
          paymentNotes: quotation.paymentNotes || null,
          productionLeadTime: quotation.productionLeadTime || null,
          companyProfile: quotation.companyProfile || null,
          items: quotation.items || [],
          createdAt: new Date().toISOString(),
        };

        setFobQuotations(prev => {
          const updated = [fallback, ...prev];
          setCache('fob_quotations', updated);
          return updated;
        });
        return { success: true, data: fallback };
      }

      const savedQuo = data.data;
      setFobQuotations(prev => {
        const updated = [savedQuo, ...prev.filter(q => q.id !== savedQuo.id)];
        setCache('fob_quotations', updated);
        return updated;
      });
      return { success: true, data: savedQuo };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Gagal menyimpan SPH.' };
    }
  };

  const deleteFobQuotation = async (id: string): Promise<{ success: boolean; error?: string }> => {
    try {
      await apiDeleteFobQuotation(id);
      setFobQuotations(prev => {
        const updated = prev.filter(q => q.id !== id);
        setCache('fob_quotations', updated);
        return updated;
      });
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Gagal menghapus SPH.' };
    }
  };

  const saveFobMaterial = async (mat: Partial<FOBMaterialMaster>): Promise<{ success: boolean; error?: string }> => {
    try {
      const { data, error } = await apiSaveFobMaterial(mat);
      if (!error && data?.data) {
        setFobMaterials(prev => {
          const updated = [data.data, ...prev.filter(m => m.kodeMaterial !== data.data.kodeMaterial)];
          setCache('fob_materials', updated);
          return updated;
        });
      } else {
        setFobMaterials(prev => {
          const updated = [mat as FOBMaterialMaster, ...prev.filter(m => m.kodeMaterial !== mat.kodeMaterial)];
          setCache('fob_materials', updated);
          return updated;
        });
      }
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Gagal menyimpan material.' };
    }
  };

  const deleteFobMaterial = async (id: string): Promise<{ success: boolean; error?: string }> => {
    try {
      await apiDeleteFobMaterial(id);
      setFobMaterials(prev => {
        const updated = prev.filter(m => m.id !== id);
        setCache('fob_materials', updated);
        return updated;
      });
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Gagal menghapus material.' };
    }
  };

  const saveFobProduct = async (prod: Partial<FOBProductMaster>): Promise<{ success: boolean; error?: string }> => {
    try {
      const { data, error } = await apiSaveFobProduct(prod);
      if (!error && data?.data) {
        setFobProducts(prev => {
          const updated = [data.data, ...prev.filter(p => !(p.kodeProduk === data.data.kodeProduk && p.size === data.data.size))];
          setCache('fob_products', updated);
          return updated;
        });
      } else {
        setFobProducts(prev => {
          const updated = [prod as FOBProductMaster, ...prev.filter(p => !(p.kodeProduk === prod.kodeProduk && p.size === prod.size))];
          setCache('fob_products', updated);
          return updated;
        });
      }
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Gagal menyimpan produk.' };
    }
  };

  const deleteFobProduct = async (id: string): Promise<{ success: boolean; error?: string }> => {
    try {
      await apiDeleteFobProduct(id);
      setFobProducts(prev => {
        const updated = prev.filter(p => p.id !== id);
        setCache('fob_products', updated);
        return updated;
      });
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Gagal menghapus produk.' };
    }
  };

  const saveFobOrder = async (orderData: Partial<FobPurchaseOrder>): Promise<{ success: boolean; data?: FobPurchaseOrder; error?: string }> => {
    try {
      const res = await apiCreateFobOrder(orderData);
      if (res.data) {
        setFobOrders(prev => {
          const updated = [res.data, ...prev.filter(o => o.id !== res.data.id)];
          setCache('fob_orders', updated);
          return updated;
        });
        return { success: true, data: res.data };
      }
      // Fallback optimistic
      const fallback: FobPurchaseOrder = {
        id: `fob-po-${Date.now()}`,
        poNumber: orderData.poNumber || `PO-FOB-${Date.now()}`,
        internalId: orderData.internalId || null,
        tanggalPo: orderData.tanggalPo || new Date().toISOString().split('T')[0],
        targetTiba: orderData.targetTiba || null,
        deadlineDays: orderData.deadlineDays || 14,
        brand: orderData.brand || 'MONTURE',
        vendor: orderData.vendor || 'TRIKARSA',
        pic: orderData.pic || null,
        management: orderData.management || null,
        prioritas: orderData.prioritas || 'NORMAL',
        status: orderData.status || 'DRAF',
        skuInduk: orderData.skuInduk || '',
        totalQty: orderData.totalQty || 0,
        hargaRataRata: orderData.hargaRataRata || 0,
        totalPembelian: orderData.totalPembelian || 0,
        biayaLain: orderData.biayaLain || 0,
        grandTotal: orderData.grandTotal || 0,
        keterangan: orderData.keterangan || null,
        persetujuanDibuat: orderData.persetujuanDibuat || null,
        persetujuanDisetujui: orderData.persetujuanDisetujui || null,
        persetujuanVendor: orderData.persetujuanVendor || null,
        hppReferenceId: orderData.hppReferenceId || null,
        quotationReferenceId: orderData.quotationReferenceId || null,
        items: orderData.items || [],
        createdAt: new Date().toISOString(),
      };
      setFobOrders(prev => {
        const updated = [fallback, ...prev];
        setCache('fob_orders', updated);
        return updated;
      });
      return { success: true, data: fallback };
    } catch (err: any) {
      console.warn('[FOB-ORDER-SAVE-ERROR]', err);
      return { success: false, error: err?.message || 'Gagal menyimpan PO Brand FOB' };
    }
  };

  const updateFobOrder = async (id: string, orderData: Partial<FobPurchaseOrder>): Promise<{ success: boolean; error?: string }> => {
    try {
      await apiUpdateFobOrder(id, orderData);
      setFobOrders(prev => {
        const updated = prev.map(o => o.id === id ? { ...o, ...orderData, updatedAt: new Date().toISOString() } : o);
        setCache('fob_orders', updated);
        return updated;
      });
      return { success: true };
    } catch (err: any) {
      setFobOrders(prev => {
        const updated = prev.map(o => o.id === id ? { ...o, ...orderData, updatedAt: new Date().toISOString() } : o);
        setCache('fob_orders', updated);
        return updated;
      });
      return { success: true };
    }
  };

  const updateFobOrderStatus = async (id: string, status: string): Promise<{ success: boolean; error?: string }> => {
    try {
      await apiUpdateFobOrderStatus(id, status);
      setFobOrders(prev => {
        const updated = prev.map(o => o.id === id ? { ...o, status: status as any, updatedAt: new Date().toISOString() } : o);
        setCache('fob_orders', updated);
        return updated;
      });
      return { success: true };
    } catch (err: any) {
      setFobOrders(prev => {
        const updated = prev.map(o => o.id === id ? { ...o, status: status as any, updatedAt: new Date().toISOString() } : o);
        setCache('fob_orders', updated);
        return updated;
      });
      return { success: true };
    }
  };

  const deleteFobOrder = async (id: string): Promise<{ success: boolean; error?: string }> => {
    try {
      await apiDeleteFobOrder(id);
      setFobOrders(prev => {
        const updated = prev.filter(o => o.id !== id);
        setCache('fob_orders', updated);
        return updated;
      });
      return { success: true };
    } catch (err: any) {
      setFobOrders(prev => {
        const updated = prev.filter(o => o.id !== id);
        setCache('fob_orders', updated);
        return updated;
      });
      return { success: true };
    }
  };

  const saveProductionTimeline = async (timelineData: Partial<ProductionTimeline>): Promise<{ success: boolean; data?: ProductionTimeline; error?: string }> => {
    const newTimeline: ProductionTimeline = {
      id: timelineData.id || `tl-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      orderId: timelineData.orderId || null,
      poNumber: timelineData.poNumber || 'PO-DRAF',
      brand: timelineData.brand || '',
      vendor: timelineData.vendor || '',
      productName: timelineData.productName || '',
      totalQty: timelineData.totalQty || 0,
      startDate: timelineData.startDate || new Date().toISOString().substring(0, 10),
      targetDeliveryDate: timelineData.targetDeliveryDate || new Date(Date.now() + 14 * 86400000).toISOString().substring(0, 10),
      totalDays: timelineData.totalDays || 14,
      stages: timelineData.stages || [],
      overallProgress: timelineData.overallProgress || 0,
      status: timelineData.status || 'ON_TRACK',
      notes: timelineData.notes || '',
      presetType: timelineData.presetType || 'STANDAR_14',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setProductionTimelines(prev => {
      const updated = [newTimeline, ...prev.filter(t => t.id !== newTimeline.id)];
      setCache('production_timelines', updated);
      return updated;
    });
    return { success: true, data: newTimeline };
  };

  const updateProductionTimeline = async (id: string, timelineData: Partial<ProductionTimeline>): Promise<{ success: boolean; error?: string }> => {
    setProductionTimelines(prev => {
      const updated = prev.map(t => t.id === id ? { ...t, ...timelineData, updatedAt: new Date().toISOString() } : t);
      setCache('production_timelines', updated);
      return updated;
    });
    return { success: true };
  };

  const deleteProductionTimeline = async (id: string): Promise<{ success: boolean; error?: string }> => {
    setProductionTimelines(prev => {
      const updated = prev.filter(t => t.id !== id);
      setCache('production_timelines', updated);
      return updated;
    });
    return { success: true };
  };


  const login = async (email: string, password: string): Promise<{ success: boolean; message?: string }> => {
    try {
      const { data, error } = await apiLogin(email.trim(), password);

      if (error || !data) {
        return { success: false, message: error || 'Login gagal.' };
      }

      // Simpan JWT token
      saveToken(data.token);

      // Set user dari response API
      const apiUser = data.user;
      const authUser: AuthUser = {
        id: apiUser.id,
        name: apiUser.name,
        email: apiUser.email,
        phone: apiUser.phone,
        role: apiUser.role,
        brandName: apiUser.brandName,
        accessibleBrands: apiUser.accessibleBrands && apiUser.accessibleBrands.length > 0
          ? apiUser.accessibleBrands
          : (apiUser.brandName ? [apiUser.brandName] : []),
      };

      setCurrentUser(authUser);
      setUserRole(apiUser.role);
      const activeB = apiUser.brandName || (apiUser.accessibleBrands && apiUser.accessibleBrands[0]) || 'GREYWOLF';
      setActiveBrand(activeB);
      setActiveTab('dashboard');
      if (apiUser.role === 'ADMIN') {
        fetchPendingBrands();
        fetchManagedUsers();
      }
      return { success: true };
    } catch {
      return { success: false, message: 'Tidak dapat terhubung ke server.' };
    }
  };

  const loginAsPreset = async (presetUser: AuthUser) => {
    setCurrentUser(presetUser);
    setUserRole(presetUser.role);
    if (presetUser.role === 'BRAND' && presetUser.brandName) {
      setActiveBrand(presetUser.brandName);
    }
    setActiveTab('dashboard');

    // Also obtain JWT token from backend to ensure data saves directly to server DB
    try {
      const { data } = await apiLogin(presetUser.email, presetUser.password || 'admin');
      if (data && data.token) {
        saveToken(data.token);
        await syncFromBackend();
        if (presetUser.role === 'ADMIN') {
          fetchManagedUsers();
        }
      }
    } catch (err) {
      console.warn('Preset login token sync failed:', err);
    }
  };

  const logout = () => {
    setCurrentUser(null);
    clearToken();
    localStorage.removeItem('konvek_auth_user');
    clearAllCache();
    setActiveTab('dashboard');
  };

  // Master Brand Handlers
  const addBrand = async (brandData: Omit<Brand, 'id'>) => {
    try {
      const { data } = await apiAddBrand(brandData);
      if (data) {
        await syncFromBackend();
      }
    } catch (err) {
      console.error('Backend addBrand failed:', err);
    }
  };

  const updateBrand = async (brand: Brand) => {
    try {
      await apiUpdateBrand(brand.id, {
        name: brand.name,
        code: brand.code,
        contactPerson: brand.contactPerson,
        phone: brand.phone,
      });
      await syncFromBackend();
    } catch (err) {
      console.error('Backend updateBrand failed:', err);
    }
  };

  const deleteBrand = async (id: string) => {
    try {
      await apiDeleteBrand(id);
      await syncFromBackend();
    } catch (err) {
      console.error('Backend deleteBrand failed:', err);
    }
  };

  // Master Vendor Handlers
  const addVendor = async (vendorData: Omit<Vendor, 'id' | 'currentKasbon'>) => {
    const tempId = `vnd-${Date.now()}`;
    const newVendor: Vendor = { ...vendorData, id: tempId, currentKasbon: 0 };
    setVendors(prev => [...prev, newVendor]);

    try {
      const { data } = await apiAddVendor(vendorData);
      if (data) {
        setVendors(prev => prev.map(v => (v.id === tempId ? { ...v, id: data.id } : v)));
      }
    } catch (err) {
      console.warn('Backend sync failed, saved locally:', err);
    }
  };

  const updateVendor = async (vendor: Vendor) => {
    setVendors(prev => prev.map(v => (v.id === vendor.id ? vendor : v)));
    try {
      await apiUpdateVendor(vendor.id, {
        name: vendor.name,
        specialty: vendor.specialty,
        contact: vendor.contact,
      });
    } catch (err) {
      console.warn('Backend sync failed, saved locally:', err);
    }
  };

  const deleteVendor = async (id: string) => {
    setVendors(prev => prev.filter(v => v.id !== id));
    try {
      await apiDeleteVendor(id);
    } catch (err) {
      console.warn('Backend sync failed, deleted locally:', err);
    }
  };

  // Master Harga Handlers
  const addHargaKonveksi = async (item: Omit<HargaKonveksi, 'id'>) => {
    const tempId = `hk-${Date.now()}`;
    const newItem: HargaKonveksi = { ...item, id: tempId };
    setHargaKonveksi(prev => [newItem, ...prev]);

    try {
      const { data } = await apiAddHargaKonveksi(item);
      if (data) {
        setHargaKonveksi(prev => prev.map(hk => (hk.id === tempId ? { ...item, id: data.id, harga: Number(data.harga) } : hk)));
      }
    } catch (err) {
      console.warn('Backend sync failed, saved locally:', err);
    }
  };

  const updateHargaKonveksi = async (item: HargaKonveksi) => {
    setHargaKonveksi(prev => prev.map(hk => (hk.id === item.id ? item : hk)));
    try {
      await apiUpdateHargaKonveksi(item.id, {
        vendor: item.vendor,
        brand: item.brand,
        produk: item.produk,
        harga: item.harga,
      });
    } catch (err) {
      console.warn('Backend sync failed, saved locally:', err);
    }
  };

  const deleteHargaKonveksi = async (id: string) => {
    setHargaKonveksi(prev => prev.filter(hk => hk.id !== id));
    try {
      await apiDeleteHargaKonveksi(id);
    } catch (err) {
      console.warn('Backend sync failed, deleted locally:', err);
    }
  };

  const addHargaBuyer = async (item: Omit<HargaBuyer, 'id'>) => {
    const tempId = `hb-${Date.now()}`;
    const newItem: HargaBuyer = { ...item, id: tempId };
    setHargaBuyer(prev => [newItem, ...prev]);

    try {
      const { data } = await apiAddHargaBuyer(item);
      if (data) {
        setHargaBuyer(prev => prev.map(hb => (hb.id === tempId ? {
          ...item,
          id: data.id,
          rateS: Number(data.rateS ?? item.rateS),
          rateM: Number(data.rateM ?? item.rateM),
          rateL: Number(data.rateL ?? item.rateL),
          rateXL: Number(data.rateXL ?? item.rateXL),
          rateXXL: Number(data.rateXXL ?? item.rateXXL),
          rateSML: Number(data.rateSML ?? item.rateSML ?? item.rateS),
          rateAnak4: Number(data.rateAnak4 ?? item.rateAnak4),
          rateAnak6: Number(data.rateAnak6 ?? item.rateAnak6),
          rateAnak8: Number(data.rateAnak8 ?? item.rateAnak8),
          rateAnak10: Number(data.rateAnak10 ?? item.rateAnak10),
          rateAnak12: Number(data.rateAnak12 ?? item.rateAnak12),
          rateAnak14: Number(data.rateAnak14 ?? item.rateAnak14),
          rateAnak16: Number(data.rateAnak16 ?? item.rateAnak16),
        } : hb)));
      }
    } catch (err) {
      console.warn('Backend sync failed, saved locally:', err);
    }
  };

  const updateHargaBuyer = async (item: HargaBuyer) => {
    setHargaBuyer(prev => prev.map(hb => (hb.id === item.id ? item : hb)));
    try {
      await apiUpdateHargaBuyer(item.id, item);
    } catch (err) {
      console.warn('Backend sync failed, saved locally:', err);
    }
  };

  const deleteHargaBuyer = async (id: string) => {
    setHargaBuyer(prev => prev.filter(hb => hb.id !== id));
    try {
      await apiDeleteHargaBuyer(id);
    } catch (err) {
      console.warn('Backend sync failed, deleted locally:', err);
    }
  };

  // Inbound Handlers
  const addInboundRoll = async (roll: Omit<InboundRoll, 'id'>) => {
    try {
      const { data, error } = await apiAddInboundRoll({
        rollCode: roll.rollCode,
        brand: roll.brand,
        jenisKain: roll.jenisKain,
        meterLength: roll.meterLength,
        hargaModalMeter: roll.hargaModalMeter,
        status: roll.status,
        tanggalMasuk: roll.tanggalMasuk,
        keterangan: roll.keterangan,
      });
      if (data) {
        setInboundRolls(prev => [
          {
            ...roll,
            id: data.id,
            meterLength: Number(data.meterLength),
            meterUsed: Number(data.meterUsed || 0),
            hargaModalMeter: Number(data.hargaModalMeter),
          },
          ...prev,
        ]);
        await syncFromBackend();
      } else if (error) {
        console.error('Gagal menambahkan rol kain ke database:', error);
      }
    } catch (err) {
      console.error('Gagal menambahkan rol kain:', err);
    }
  };

  const updateInboundRollStatus = async (id: string, status: InboundRoll['status']) => {
    setInboundRolls(prev => prev.map(r => (r.id === id ? { ...r, status } : r)));
    try {
      await apiUpdateInboundStatus(id, status);
      await syncFromBackend();
    } catch (err) {
      console.error('Update status rol gagal:', err);
      await syncFromBackend();
    }
  };

  const deleteInboundRoll = async (id: string): Promise<{ success: boolean; message?: string }> => {
    const linkedSpk = spkList.find(s => s.rollIds?.includes(id));
    if (linkedSpk) {
      return { success: false, message: `Kain tidak dapat dihapus karena sedang digunakan pada ${linkedSpk.spkNumber}. Hapus SPK terkait terlebih dahulu.` };
    }

    try {
      const { data, error } = await apiDeleteInboundRoll(id);
      if (error) {
        return { success: false, message: error };
      }
    } catch (err) {
      console.warn('Backend sync failed, deleted locally:', err);
    }

    setInboundRolls(prev => prev.filter(r => r.id !== id));
    return { success: true, message: 'Rol kain berhasil dihapus' };
  };

  // FOB Down Payment (Inbound DP Uang) Handlers
  const addFobDeposit = async (
    depositData: Omit<FobDownPayment, 'id' | 'depositNumber' | 'createdAt'>,
    syncToFinance: boolean = true
  ): Promise<FobDownPayment> => {
    const now = new Date();
    const yearMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
    const prefix = `DP-FOB-${yearMonth}-`;
    let maxSeq = 0;
    fobDeposits.forEach((d) => {
      if (d.depositNumber && d.depositNumber.startsWith(prefix)) {
        const seq = parseInt(d.depositNumber.substring(prefix.length), 10);
        if (!isNaN(seq) && seq > maxSeq) maxSeq = seq;
      }
    });
    const depositNumber = `${prefix}${String(maxSeq + 1).padStart(3, '0')}`;

    const fallbackId = `dp-fob-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    let newDeposit: FobDownPayment = {
      ...depositData,
      id: fallbackId,
      depositNumber,
      statusBahan: depositData.statusBahan || 'BELUM_DIBELANJAKAN',
      createdAt: new Date().toISOString(),
    };

    // Simpan langsung ke database PostgreSQL via API
    try {
      const res = await apiCreateFobDeposit({
        ...depositData,
        depositNumber,
      });
      if (res.data) {
        newDeposit = {
          ...res.data,
          nominalDp: Number(res.data.nominalDp || 0),
          totalNilaiPo: Number(res.data.totalNilaiPo || 0),
          persentaseDp: Number(res.data.persentaseDp || 0),
          tanggalBayar: typeof res.data.tanggalBayar === 'string' ? res.data.tanggalBayar.split('T')[0] : res.data.tanggalBayar,
          alokasiKain: res.data.alokasiKain ? (typeof res.data.alokasiKain === 'string' ? JSON.parse(res.data.alokasiKain) : res.data.alokasiKain) : undefined,
        };
      }
    } catch (apiErr) {
      console.warn('[DB Error] Gagal menyimpan DP ke backend, fallback ke penyimpanan lokal:', apiErr);
    }

    setFobDeposits((prev) => {
      const updated = [newDeposit, ...prev.filter((p) => p.id !== newDeposit.id)];
      setCache('fob_deposits', updated);
      return updated;
    });

    if (syncToFinance && newDeposit.nominalDp > 0) {
      await addPembayaran({
        brand: newDeposit.brand,
        tanggal: newDeposit.tanggalBayar,
        jumlah: newDeposit.nominalDp,
        metode: newDeposit.metodePembayaran,
        keterangan: newDeposit.keterangan || `DP FOB (${newDeposit.poNumber}) - ${newDeposit.depositNumber}`,
        referensiNomor: newDeposit.nomorReferensi,
      });
    }

    return newDeposit;
  };

  const updateFobDeposit = async (id: string, updates: Partial<FobDownPayment>) => {
    setFobDeposits((prev) => {
      const updated = prev.map((d) =>
        d.id === id ? { ...d, ...updates, updatedAt: new Date().toISOString() } : d
      );
      setCache('fob_deposits', updated);
      return updated;
    });

    try {
      await apiUpdateFobDeposit(id, updates);
    } catch (err) {
      console.warn('[DB Error] Gagal mengupdate DP ke backend:', err);
    }
  };

  const deleteFobDeposit = async (id: string) => {
    setFobDeposits((prev) => {
      const updated = prev.filter((d) => d.id !== id);
      setCache('fob_deposits', updated);
      return updated;
    });

    try {
      await apiDeleteFobDeposit(id);
    } catch (err) {
      console.warn('[DB Error] Gagal menghapus DP dari backend:', err);
    }
  };

  const receiveFabricFromFobDeposit = async (
    depositId: string,
    fabricData: {
      jenisKain: string;
      meterLength: number;
      hargaModalMeter: number;
      keterangan?: string;
    }
  ): Promise<{ success: boolean; rollCode?: string; message?: string }> => {
    const deposit = fobDeposits.find((d) => d.id === depositId);
    if (!deposit) {
      return { success: false, message: 'Data DP FOB tidak ditemukan.' };
    }

    const matchedBrand = brands.find(
      (b) => b.name.trim().toUpperCase() === deposit.brand.trim().toUpperCase()
    );
    const brandCode = (
      matchedBrand?.code ||
      deposit.brand.replace(/[^a-zA-Z0-9]/g, '').substring(0, 3) ||
      'ROL'
    ).toUpperCase();
    const prefix = `ROL-${brandCode}-`;

    let maxSeq = 0;
    inboundRolls.forEach((roll) => {
      if (roll.rollCode && roll.rollCode.toUpperCase().startsWith(prefix)) {
        const seqStr = roll.rollCode.substring(prefix.length);
        const parsedNum = parseInt(seqStr, 10);
        if (!isNaN(parsedNum) && parsedNum > maxSeq) {
          maxSeq = parsedNum;
        }
      } else if (roll.brand?.trim().toUpperCase() === deposit.brand.trim().toUpperCase()) {
        const match = roll.rollCode?.match(/(\d+)$/);
        if (match) {
          const parsedNum = parseInt(match[1], 10);
          if (!isNaN(parsedNum) && parsedNum > maxSeq) {
            maxSeq = parsedNum;
          }
        }
      }
    });

    const generatedRollCode = `${prefix}${String(maxSeq + 1).padStart(3, '0')}`;

    await addInboundRoll({
      rollCode: generatedRollCode,
      brand: deposit.brand,
      jenisKain: fabricData.jenisKain,
      meterLength: fabricData.meterLength,
      meterUsed: 0,
      hargaModalMeter: fabricData.hargaModalMeter,
      status: 'DI_GUDANG',
      tanggalMasuk: new Date().toISOString().split('T')[0],
      keterangan: `[FOB DP: ${deposit.poNumber}] ${fabricData.keterangan || ''}`.trim(),
      sourceType: 'FOB',
      sourcePONumber: deposit.poNumber,
      fobDepositId: deposit.id,
    });

    const currentAllocation = deposit.alokasiKain || { totalMeter: 0, totalBiaya: 0, rolCodes: [] };
    const newTotalMeter = currentAllocation.totalMeter + fabricData.meterLength;
    const newTotalBiaya =
      currentAllocation.totalBiaya + fabricData.meterLength * fabricData.hargaModalMeter;
    const updatedRolCodes = [...currentAllocation.rolCodes, generatedRollCode];

    const updatedAllocation: FobFabricAllocation = {
      totalMeter: newTotalMeter,
      totalBiaya: newTotalBiaya,
      rolCodes: updatedRolCodes,
    };

    await updateFobDeposit(depositId, {
      statusBahan: 'SUDAH_JADI_KAIN',
      alokasiKain: updatedAllocation,
    });

    return {
      success: true,
      rollCode: generatedRollCode,
      message: `Rol kain ${generatedRollCode} (${fabricData.meterLength} m) berhasil diterima ke gudang dan siap dipotong.`,
    };
  };

  // SPK Handlers
  const createSPK = async (spkData: Omit<SPKCutting, 'id' | 'spkNumber' | 'deliveredQty' | 'status'>) => {
    // Generate next SPK number based on highest existing number for current month
    const now = new Date();
    const yearMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
    const prefix = `SPK-${yearMonth}-`;

    const existingNums = spkList
      .filter((s) => s.spkNumber && s.spkNumber.startsWith(prefix))
      .map((s) => {
        const parts = s.spkNumber.split('-');
        const n = parseInt(parts[parts.length - 1], 10);
        return isNaN(n) ? 0 : n;
      });
    const nextSeq = (existingNums.length > 0 ? Math.max(...existingNums) : 0) + 1;
    const spkNumber = `${prefix}${String(nextSeq).padStart(2, '0')}`;

    const tempId = `spk-${Date.now()}`;

    // Normalize items: if provided, use them; otherwise create a single default item
    let items: SPKProductItem[] = [];
    if (spkData.items && spkData.items.length > 0) {
      items = spkData.items.map((it, idx) => ({
        ...it,
        id: it.id || `item-${Date.now()}-${idx + 1}`,
        deliveredQty: it.deliveredQty || { s: 0, m: 0, l: 0, xl: 0, xxl: 0, anak4: 0, anak6: 0, anak8: 0, anak10: 0, anak12: 0, anak14: 0, anak16: 0 },
      }));
    } else {
      items = [
        {
          id: `item-${Date.now()}-1`,
          produk: spkData.produk,
          vendor: spkData.vendor,
          targetCutQty: { ...spkData.targetCutQty },
          deliveredQty: { s: 0, m: 0, l: 0, xl: 0, xxl: 0, anak4: 0, anak6: 0, anak8: 0, anak10: 0, anak12: 0, anak14: 0, anak16: 0 },
        },
      ];
    }

    const newSPK: SPKCutting = {
      ...spkData,
      id: tempId,
      spkNumber,
      items,
      deliveredQty: { s: 0, m: 0, l: 0, xl: 0, xxl: 0, anak4: 0, anak6: 0, anak8: 0, anak10: 0, anak12: 0, anak14: 0, anak16: 0 },
      status: 'IN_PRODUCTION',
    };

    // Update status of pooled rolls to DIPROSES (hanya jika bersumber dari gudang pusat)
    if (spkData.fabricSourceType !== 'TITIPAN_VENDOR' && spkData.rollIds && spkData.rollIds.length > 0) {
      setInboundRolls(prev => {
        const updated = prev.map(roll => {
          if (spkData.rollIds.includes(roll.id)) {
            return { ...roll, status: 'DIPROSES' as RollStatus, meterUsed: roll.meterLength };
          }
          return roll;
        });
        setCache('inbound_rolls', updated);
        return updated;
      });
    }

    // Jika bersumber dari Saldo Titipan di Vendor, tandai titipan menjadi TERPAKAI
    if (spkData.fabricSourceType === 'TITIPAN_VENDOR' && spkData.depositId) {
      setVendorFabricDeposits(prev => {
        const updated = prev.map(dep => {
          if (dep.id === spkData.depositId) {
            return {
              ...dep,
              status: 'TERPAKAI' as FabricDepositStatus,
              allocatedSPKId: tempId,
              allocatedSPKNumber: spkNumber,
              updatedAt: new Date().toISOString(),
            };
          }
          return dep;
        });
        setCache('vendor_fabric_deposits', updated);
        return updated;
      });
    }

    setSpkList(prev => {
      const updated = [newSPK, ...prev];
      setCache('spk_list', updated);
      return updated;
    });

    try {
      const { data, error } = await apiCreateSpk({
        spkNumber,
        brand: spkData.brand,
        produk: spkData.produk,
        vendor: spkData.vendor,
        status: 'IN_PRODUCTION',
        tanggalSPK: spkData.tanggalSPK || new Date().toISOString(),
        targetSelesai: spkData.targetSelesai ? new Date(spkData.targetSelesai).toISOString() : undefined,
        catatan: spkData.catatan || '',
        targetS: spkData.targetCutQty.s || 0,
        targetM: spkData.targetCutQty.m || 0,
        targetL: spkData.targetCutQty.l || 0,
        targetXL: spkData.targetCutQty.xl || 0,
        targetXXL: spkData.targetCutQty.xxl || 0,
        targetAnak4: spkData.targetCutQty.anak4 || 0,
        targetAnak6: spkData.targetCutQty.anak6 || 0,
        targetAnak8: spkData.targetCutQty.anak8 || 0,
        targetAnak10: spkData.targetCutQty.anak10 || 0,
        targetAnak12: spkData.targetCutQty.anak12 || 0,
        targetAnak14: spkData.targetCutQty.anak14 || 0,
        targetAnak16: spkData.targetCutQty.anak16 || 0,
        rollIds: spkData.rollIds || [],
        sourcePONumber: spkData.sourcePONumber || null,
        items: items || null,
      });

      if (error) {
        throw new Error(error);
      }

      if (data && (data as any).id) {
        const realId = (data as any).id;
        const realSpkNumber = (data as any).spkNumber || spkNumber;
        setSpkList(prev => {
          const updated = prev.map(s => (s.id === tempId ? { ...s, id: realId, spkNumber: realSpkNumber } : s));
          setCache('spk_list', updated);
          return updated;
        });
        if (spkData.fabricSourceType === 'TITIPAN_VENDOR' && spkData.depositId) {
          setVendorFabricDeposits(prev => {
            const updated = prev.map(dep => dep.id === spkData.depositId ? { ...dep, allocatedSPKId: realId, allocatedSPKNumber: realSpkNumber } : dep);
            setCache('vendor_fabric_deposits', updated);
            return updated;
          });
        }
      }
    } catch (err: any) {
      console.error('Backend sync SPK failed, rolling back local state:', err);
      // Rollback optimistic SPK from list
      setSpkList(prev => {
        const reverted = prev.filter(s => s.id !== tempId);
        setCache('spk_list', reverted);
        return reverted;
      });
      // Rollback fabric roll status
      if (spkData.fabricSourceType !== 'TITIPAN_VENDOR' && spkData.rollIds && spkData.rollIds.length > 0) {
        setInboundRolls(prev => {
          const reverted = prev.map(roll => {
            if (spkData.rollIds.includes(roll.id)) {
              return { ...roll, status: 'DI_GUDANG' as RollStatus, meterUsed: 0 };
            }
            return roll;
          });
          setCache('inbound_rolls', reverted);
          return reverted;
        });
      }
      // Rollback fabric deposit status
      if (spkData.fabricSourceType === 'TITIPAN_VENDOR' && spkData.depositId) {
        setVendorFabricDeposits(prev => {
          const reverted = prev.map(dep => {
            if (dep.id === spkData.depositId) {
              return {
                ...dep,
                status: 'TERSEDIA' as FabricDepositStatus,
                allocatedSPKId: undefined,
                allocatedSPKNumber: undefined,
              };
            }
            return dep;
          });
          setCache('vendor_fabric_deposits', reverted);
          return reverted;
        });
      }
      throw err;
    }
  };

  const updateSPK = async (
    id: string,
    spkData: Partial<SPKCutting> & { rollIds?: string[]; depositId?: string | null }
  ): Promise<{ success: boolean; message?: string }> => {
    const existingSpk = spkList.find((s) => s.id === id);
    if (!existingSpk) {
      return { success: false, message: 'SPK tidak ditemukan.' };
    }

    const previousSpkList = [...spkList];
    const previousInboundRolls = [...inboundRolls];
    const previousDeposits = [...vendorFabricDeposits];

    // Compute updated targetCutQty
    const updatedTargetCutQty: SizeBreakdown = {
      ...existingSpk.targetCutQty,
      ...(spkData.targetCutQty || {}),
    };

    // Calculate total targets and delivered
    const targetTotal = Object.values(updatedTargetCutQty).reduce((a, b) => a + b, 0);
    const delivTotal = Object.values(existingSpk.deliveredQty || {}).reduce((a, b) => a + b, 0);

    let newStatus = existingSpk.status;
    if (delivTotal > 0) {
      if (delivTotal > targetTotal) {
        newStatus = 'OVER_DELIVERY';
      } else if (delivTotal >= targetTotal && targetTotal > 0) {
        newStatus = 'COMPLETED';
      } else {
        newStatus = 'PARTIAL_DELIVERED';
      }
    } else if (newStatus !== 'DRAFT') {
      newStatus = 'IN_PRODUCTION';
    }

    const newRollIds = spkData.rollIds !== undefined ? spkData.rollIds : (existingSpk.rollIds || []);

    // Build updated SPK object
    const updatedSPK: SPKCutting = {
      ...existingSpk,
      ...spkData,
      targetCutQty: updatedTargetCutQty,
      status: newStatus,
      rollIds: newRollIds,
    };

    // 1. Sync rolls state
    if (spkData.rollIds !== undefined) {
      const oldRollIds = existingSpk.rollIds || [];
      const toRelease = oldRollIds.filter((rId) => !newRollIds.includes(rId));
      const toClaim = newRollIds.filter((rId) => !oldRollIds.includes(rId));

      if (toRelease.length > 0 || toClaim.length > 0) {
        setInboundRolls((prev) => {
          const updated = prev.map((roll) => {
            if (toRelease.includes(roll.id)) {
              return { ...roll, status: 'DI_GUDANG' as RollStatus, meterUsed: 0 };
            }
            if (toClaim.includes(roll.id)) {
              return { ...roll, status: 'DIPROSES' as RollStatus, meterUsed: roll.meterLength };
            }
            return roll;
          });
          setCache('inbound_rolls', updated);
          return updated;
        });
      }
    }

    // 2. Sync fabric deposit if switched
    if (spkData.depositId !== undefined && spkData.depositId !== existingSpk.depositId) {
      setVendorFabricDeposits((prev) => {
        const updated = prev.map((dep) => {
          if (existingSpk.depositId && dep.id === existingSpk.depositId) {
            return {
              ...dep,
              status: 'TERSEDIA' as FabricDepositStatus,
              allocatedSPKId: undefined,
              allocatedSPKNumber: undefined,
            };
          }
          if (spkData.depositId && dep.id === spkData.depositId) {
            return {
              ...dep,
              status: 'TERPAKAI' as FabricDepositStatus,
              allocatedSPKId: id,
              allocatedSPKNumber: existingSpk.spkNumber,
            };
          }
          return dep;
        });
        setCache('vendor_fabric_deposits', updated);
        return updated;
      });
    }

    // 3. Optimistic local update
    setSpkList((prev) => {
      const updated = prev.map((s) => (s.id === id ? updatedSPK : s));
      setCache('spk_list', updated);
      return updated;
    });

    // 4. Send PUT to backend
    try {
      const { data, error } = await apiUpdateSpk(id, {
        brand: updatedSPK.brand,
        produk: updatedSPK.produk,
        vendor: updatedSPK.vendor,
        status: updatedSPK.status,
        tanggalSPK: updatedSPK.tanggalSPK,
        targetSelesai: updatedSPK.targetSelesai ? new Date(updatedSPK.targetSelesai).toISOString() : null,
        catatan: updatedSPK.catatan || '',
        targetS: updatedTargetCutQty.s || 0,
        targetM: updatedTargetCutQty.m || 0,
        targetL: updatedTargetCutQty.l || 0,
        targetXL: updatedTargetCutQty.xl || 0,
        targetXXL: updatedTargetCutQty.xxl || 0,
        targetAnak4: updatedTargetCutQty.anak4 || 0,
        targetAnak6: updatedTargetCutQty.anak6 || 0,
        targetAnak8: updatedTargetCutQty.anak8 || 0,
        targetAnak10: updatedTargetCutQty.anak10 || 0,
        targetAnak12: updatedTargetCutQty.anak12 || 0,
        targetAnak14: updatedTargetCutQty.anak14 || 0,
        targetAnak16: updatedTargetCutQty.anak16 || 0,
        rollIds: newRollIds,
        sourcePONumber: updatedSPK.sourcePONumber || null,
        items: updatedSPK.items || null,
      });

      if (error) {
        throw new Error(error);
      }

      return { success: true };
    } catch (err: any) {
      console.error('Backend sync update SPK failed, rolling back:', err);
      setSpkList(previousSpkList);
      setCache('spk_list', previousSpkList);
      setInboundRolls(previousInboundRolls);
      setCache('inbound_rolls', previousInboundRolls);
      setVendorFabricDeposits(previousDeposits);
      setCache('vendor_fabric_deposits', previousDeposits);
      return { success: false, message: err?.message || 'Gagal menyimpan perubahan SPK ke server.' };
    }
  };

  const deleteSPK = async (id: string): Promise<{ success: boolean; message?: string }> => {
    const targetSpk = spkList.find(s => s.id === id);
    if (!targetSpk) {
      return { success: false, message: 'SPK tidak ditemukan.' };
    }

    const linkedSJ = suratJalanList.filter(sj => sj.spkId === id);
    if (linkedSJ.length > 0) {
      return {
        success: false,
        message: `SPK ${targetSpk.spkNumber} memiliki ${linkedSJ.length} Surat Jalan pengiriman. Hapus semua Surat Jalan terkait terlebih dahulu.`,
      };
    }

    const linkedReturn = returnList.filter(r => r.spkId === id);
    if (linkedReturn.length > 0) {
      return {
        success: false,
        message: `SPK ${targetSpk.spkNumber} memiliki ${linkedReturn.length} tiket retur. Hapus tiket retur terkait terlebih dahulu.`,
      };
    }

    try {
      const { data, error } = await apiDeleteSpk(id);
      if (error) {
        return { success: false, message: error };
      }
    } catch (err) {
      console.warn('Backend sync delete SPK failed, removing locally:', err);
    }

    // Kembalikan status rol kain yang digunakan SPK menjadi DI_GUDANG dan meterUsed: 0
    if (targetSpk.rollIds && targetSpk.rollIds.length > 0) {
      setInboundRolls(prev => {
        const updated = prev.map(r => {
          if (targetSpk.rollIds.includes(r.id)) {
            return { ...r, status: 'DI_GUDANG' as RollStatus, meterUsed: 0 };
          }
          return r;
        });
        setCache('inbound_rolls', updated);
        return updated;
      });
    }

    // Kembalikan status kain titipan jika SPK bersumber dari saldo titipan vendor
    if (targetSpk.depositId) {
      setVendorFabricDeposits(prev => {
        const updated = prev.map(dep => {
          if (dep.id === targetSpk.depositId) {
            return {
              ...dep,
              status: 'TERSEDIA' as FabricDepositStatus,
              allocatedSPKId: null,
              allocatedSPKNumber: null,
              updatedAt: new Date().toISOString(),
            };
          }
          return dep;
        });
        setCache('vendor_fabric_deposits', updated);
        return updated;
      });
    }

    setSpkList(prev => {
      const updated = prev.filter(s => s.id !== id);
      setCache('spk_list', updated);
      return updated;
    });
    return { success: true, message: `SPK ${targetSpk.spkNumber} berhasil dihapus.` };
  };

  // Helper to normalize Surat Jalan items (Multi-Item and Legacy support)
  const getSuratJalanItems = (sj: SuratJalan): SuratJalanItem[] => {
    if (sj.items && sj.items.length > 0) {
      return sj.items;
    }
    // Fallback for legacy single-item SJ
    let jenisKain = sj.jenisKain || '';
    if (!jenisKain && sj.spkId) {
      const spk = spkList.find(s => s.id === sj.spkId || s.spkNumber === sj.spkId);
      if (spk && spk.rollIds && spk.rollIds.length > 0) {
        const rolls = inboundRolls.filter(r => spk.rollIds.includes(r.id));
        jenisKain = Array.from(new Set(rolls.map(r => r.jenisKain).filter(Boolean))).join(', ');
      }
    }

    // Auto-split if produk has multiple articles separated by comma or plus
    if (sj.produk && (sj.produk.includes(',') || sj.produk.includes('+'))) {
      const parts = sj.produk.split(/[,+]/).map(p => p.trim()).filter(Boolean);
      if (parts.length > 1) {
        const numParts = parts.length;
        const baseQty = sj.qtyDelivered || { s: 0, m: 0, l: 0, xl: 0, xxl: 0, anak4: 0, anak6: 0, anak8: 0, anak10: 0, anak12: 0, anak14: 0, anak16: 0 };
        return parts.map((partName, idx) => {
          const partQty: SizeBreakdown = {
            s: Math.floor((baseQty.s || 0) / numParts) + (idx === 0 ? (baseQty.s || 0) % numParts : 0),
            m: Math.floor((baseQty.m || 0) / numParts) + (idx === 0 ? (baseQty.m || 0) % numParts : 0),
            l: Math.floor((baseQty.l || 0) / numParts) + (idx === 0 ? (baseQty.l || 0) % numParts : 0),
            xl: Math.floor((baseQty.xl || 0) / numParts) + (idx === 0 ? (baseQty.xl || 0) % numParts : 0),
            xxl: Math.floor((baseQty.xxl || 0) / numParts) + (idx === 0 ? (baseQty.xxl || 0) % numParts : 0),
            anak4: Math.floor((baseQty.anak4 || 0) / numParts) + (idx === 0 ? (baseQty.anak4 || 0) % numParts : 0),
            anak6: Math.floor((baseQty.anak6 || 0) / numParts) + (idx === 0 ? (baseQty.anak6 || 0) % numParts : 0),
            anak8: Math.floor((baseQty.anak8 || 0) / numParts) + (idx === 0 ? (baseQty.anak8 || 0) % numParts : 0),
            anak10: Math.floor((baseQty.anak10 || 0) / numParts) + (idx === 0 ? (baseQty.anak10 || 0) % numParts : 0),
            anak12: Math.floor((baseQty.anak12 || 0) / numParts) + (idx === 0 ? (baseQty.anak12 || 0) % numParts : 0),
            anak14: Math.floor((baseQty.anak14 || 0) / numParts) + (idx === 0 ? (baseQty.anak14 || 0) % numParts : 0),
            anak16: Math.floor((baseQty.anak16 || 0) / numParts) + (idx === 0 ? (baseQty.anak16 || 0) % numParts : 0),
          };
          const partTotal = Object.values(partQty).reduce((a, b) => a + b, 0);

          return {
            id: `item-${sj.id}-${idx + 1}`,
            spkId: sj.spkId || '',
            spkNumber: sj.spkId || '',
            spkItemId: undefined,
            brand: sj.brand,
            produk: partName,
            vendor: sj.vendor || '',
            jenisKain: jenisKain || 'Kain Standar',
            qtyDelivered: partQty,
            totalPcs: partTotal,
            catatan: sj.catatan,
          };
        });
      }
    }

    return [
      {
        id: sj.spkItemId || `item-${sj.id}`,
        spkId: sj.spkId || '',
        spkNumber: sj.spkId || '',
        spkItemId: sj.spkItemId,
        brand: sj.brand,
        produk: sj.produk || '',
        vendor: sj.vendor || '',
        jenisKain: jenisKain || 'Kain Standar',
        qtyDelivered: sj.qtyDelivered || { s: 0, m: 0, l: 0, xl: 0, xxl: 0, anak4: 0, anak6: 0, anak8: 0, anak10: 0, anak12: 0, anak14: 0, anak16: 0 },
        totalPcs: sj.totalPcs || 0,
        catatan: sj.catatan,
      },
    ];
  };

  // Surat Jalan Handlers (Multi-Item & Multi-SPK per Brand Delivery)
  const createSuratJalan = async (sjData: Omit<SuratJalan, 'id' | 'noSuratJalan' | 'status'>): Promise<{ success: boolean; message?: string }> => {
    // Determine the items array to process
    let itemsToProcess: SuratJalanItem[] = [];
    if (sjData.items && sjData.items.length > 0) {
      itemsToProcess = sjData.items;
    } else if (sjData.spkId && sjData.produk && sjData.qtyDelivered) {
      const targetSPK = spkList.find(s => s.id === sjData.spkId || s.spkNumber === sjData.spkId);
      itemsToProcess = [
        {
          id: sjData.spkItemId || `item-${Date.now()}`,
          spkId: sjData.spkId,
          spkNumber: targetSPK ? targetSPK.spkNumber : sjData.spkId,
          spkItemId: sjData.spkItemId,
          brand: sjData.brand,
          produk: sjData.produk,
          vendor: sjData.vendor || targetSPK?.vendor || '',
          jenisKain: sjData.jenisKain,
          qtyDelivered: sjData.qtyDelivered,
          totalPcs: sjData.totalPcs || Object.values(sjData.qtyDelivered).reduce((a, b) => a + b, 0),
          catatan: sjData.catatan,
        },
      ];
    }

    if (itemsToProcess.length === 0) {
      return { success: false, message: 'Tidak ada item produk yang dipilih untuk Surat Jalan ini.' };
    }

    // Process each item and update corresponding SPKs
    let updatedSpkList = [...spkList];
    let grandTotalPcs = 0;

    for (const item of itemsToProcess) {
      grandTotalPcs += item.totalPcs;
      if (!item.spkId || item.isManual) {
        continue;
      }

      const targetSPKIndex = updatedSpkList.findIndex(s => s.id === item.spkId || s.spkNumber === item.spkId);
      if (targetSPKIndex !== -1) {
        const targetSPK = updatedSpkList[targetSPKIndex];
        const deliv = item.qtyDelivered;

        let updatedItems = targetSPK.items;
        if ((!updatedItems || updatedItems.length === 0) && targetSPK.produk && targetSPK.produk.includes('+')) {
          const parts = targetSPK.produk.split('+').map(p => p.trim()).filter(Boolean);
          updatedItems = parts.map((p, idx) => ({
            id: `part-${idx}`,
            produk: p,
            vendor: targetSPK.vendor,
            targetCutQty: { ...targetSPK.targetCutQty },
            deliveredQty: { s: 0, m: 0, l: 0, xl: 0, xxl: 0, anak4: 0, anak6: 0, anak8: 0, anak10: 0, anak12: 0, anak14: 0, anak16: 0 },
          }));
        }

        if (updatedItems && updatedItems.length > 0) {
          updatedItems = updatedItems.map(it => {
            const isTargetItem = item.spkItemId
              ? it.id === item.spkItemId || it.produk.trim().toUpperCase() === item.produk.trim().toUpperCase()
              : it.produk.trim().toUpperCase() === item.produk.trim().toUpperCase();

            if (isTargetItem) {
              const itemDeliv = it.deliveredQty || { s: 0, m: 0, l: 0, xl: 0, xxl: 0, anak4: 0, anak6: 0, anak8: 0, anak10: 0, anak12: 0, anak14: 0, anak16: 0 };
              return {
                ...it,
                deliveredQty: {
                  s: itemDeliv.s + deliv.s,
                  m: itemDeliv.m + deliv.m,
                  l: itemDeliv.l + deliv.l,
                  xl: itemDeliv.xl + deliv.xl,
                  xxl: itemDeliv.xxl + deliv.xxl,
                  anak4: itemDeliv.anak4 + deliv.anak4,
                  anak6: itemDeliv.anak6 + deliv.anak6,
                  anak8: itemDeliv.anak8 + deliv.anak8,
                  anak10: itemDeliv.anak10 + deliv.anak10,
                  anak12: itemDeliv.anak12 + deliv.anak12,
                  anak14: itemDeliv.anak14 + deliv.anak14,
                  anak16: itemDeliv.anak16 + deliv.anak16,
                },
              };
            }
            return it;
          });
        }

        const updatedDelivered: SizeBreakdown = {
          s: targetSPK.deliveredQty.s + deliv.s,
          m: targetSPK.deliveredQty.m + deliv.m,
          l: targetSPK.deliveredQty.l + deliv.l,
          xl: targetSPK.deliveredQty.xl + deliv.xl,
          xxl: targetSPK.deliveredQty.xxl + deliv.xxl,
          anak4: targetSPK.deliveredQty.anak4 + deliv.anak4,
          anak6: targetSPK.deliveredQty.anak6 + deliv.anak6,
          anak8: targetSPK.deliveredQty.anak8 + deliv.anak8,
          anak10: targetSPK.deliveredQty.anak10 + deliv.anak10,
          anak12: targetSPK.deliveredQty.anak12 + deliv.anak12,
          anak14: targetSPK.deliveredQty.anak14 + deliv.anak14,
          anak16: targetSPK.deliveredQty.anak16 + deliv.anak16,
        };

        const targetTotal = Object.values(targetSPK.targetCutQty).reduce((a, b) => a + b, 0);
        const newTotalDelivered = Object.values(updatedDelivered).reduce((a, b) => a + b, 0);
        const SIZES_CHECK: (keyof SizeBreakdown)[] = ['s', 'm', 'l', 'xl', 'xxl', 'anak4', 'anak6', 'anak8', 'anak10', 'anak12', 'anak14', 'anak16'];
        const hasUnfulfilledSize = SIZES_CHECK.some(sz => (targetSPK.targetCutQty[sz] || 0) > (updatedDelivered[sz] || 0));

        const newStatus: SPKCutting['status'] =
          targetTotal > 0 && newTotalDelivered > targetTotal
            ? 'OVER_DELIVERY'
            : newTotalDelivered >= targetTotal && !hasUnfulfilledSize
            ? 'COMPLETED'
            : 'PARTIAL_DELIVERED';

        updatedSpkList[targetSPKIndex] = {
          ...targetSPK,
          items: updatedItems,
          deliveredQty: updatedDelivered,
          status: newStatus,
        };
      }
    }

    setSpkList(updatedSpkList);

    const now = new Date();
    const yearMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
    const prefix = `SJ/${yearMonth}/`;

    const existingNums = suratJalanList
      .filter((s) => s.noSuratJalan && s.noSuratJalan.startsWith(prefix))
      .map((s) => {
        const parts = s.noSuratJalan.split('/');
        const n = parseInt(parts[parts.length - 1], 10);
        return isNaN(n) ? 0 : n;
      });
    const nextSeq = (existingNums.length > 0 ? Math.max(...existingNums) : 0) + 1;
    const noSuratJalan = `${prefix}${String(nextSeq).padStart(3, '0')}`;

    const tempId = `sj-${Date.now()}`;
    const firstSpkItem = itemsToProcess.find(i => Boolean(i.spkId) && !i.isManual);
    const primarySpkId = firstSpkItem?.spkId || undefined;
    const primarySpkItemId = firstSpkItem?.spkItemId || undefined;
    const firstItem = itemsToProcess[0];

    const newSJ: SuratJalan = {
      ...sjData,
      id: tempId,
      noSuratJalan,
      brand: sjData.brand,
      tanggal: sjData.tanggal || new Date().toISOString().split('T')[0],
      items: itemsToProcess,
      totalPcs: grandTotalPcs,
      driverName: sjData.driverName,
      nomorKendaraan: sjData.nomorKendaraan,
      status: 'DELIVERED',
      catatan: sjData.catatan,
      // Backward compatible single item fields
      spkId: primarySpkId,
      spkItemId: primarySpkItemId,
      produk: itemsToProcess.map(i => i.produk).join(', '),
      vendor: Array.from(new Set(itemsToProcess.map(i => i.vendor))).join(', '),
      qtyDelivered: firstItem.qtyDelivered,
      jenisKain: itemsToProcess.map(i => i.jenisKain).filter(Boolean).join(', '),
    };

    setSuratJalanList(prev => [newSJ, ...prev]);

    try {
      const { data, error } = await apiCreateSuratJalan({
        noSuratJalan,
        spkId: primarySpkId || null,
        brand: sjData.brand,
        produk: newSJ.produk,
        vendor: newSJ.vendor,
        tanggal: newSJ.tanggal ? new Date(newSJ.tanggal).toISOString() : new Date().toISOString(),
        driverName: sjData.driverName || '',
        nomorKendaraan: sjData.nomorKendaraan || '',
        catatan: sjData.catatan || '',
        status: 'DELIVERED',
        totalPcs: grandTotalPcs,
        items: itemsToProcess,
        qtySML: (firstItem.qtyDelivered.s || 0) + (firstItem.qtyDelivered.m || 0) + (firstItem.qtyDelivered.l || 0),
        qtyM: firstItem.qtyDelivered.m || 0,
        qtyL: firstItem.qtyDelivered.l || 0,
        qtyXL: firstItem.qtyDelivered.xl || 0,
        qtyXXL: firstItem.qtyDelivered.xxl || 0,
        qtyAnak4: firstItem.qtyDelivered.anak4 || 0,
        qtyAnak6: firstItem.qtyDelivered.anak6 || 0,
        qtyAnak8: firstItem.qtyDelivered.anak8 || 0,
        qtyAnak10: firstItem.qtyDelivered.anak10 || 0,
        qtyAnak12: firstItem.qtyDelivered.anak12 || 0,
        qtyAnak14: firstItem.qtyDelivered.anak14 || 0,
        qtyAnak16: firstItem.qtyDelivered.anak16 || 0,
      });

      if (error) {
        throw new Error(error);
      }

      if (data && (data as any).id) {
        const realId = (data as any).id;
        const realNoSj = (data as any).noSuratJalan || noSuratJalan;
        setSuratJalanList(prev => prev.map(sj => (sj.id === tempId ? { ...sj, id: realId, noSuratJalan: realNoSj } : sj)));
      }
      return { success: true, message: 'Surat Jalan berhasil diterbitkan' };
    } catch (err: any) {
      console.error('Backend sync Surat Jalan failed, rolling back local state:', err);
      setSuratJalanList(prev => prev.filter(sj => sj.id !== tempId));
      setSpkList(spkList);
      return { success: false, message: err?.message || 'Gagal menyimpan Surat Jalan ke server.' };
    }
  };

  const updateSuratJalanReceipt = async (
    id: string,
    verifiedItems: SuratJalanItem[],
    verificationNote?: string
  ): Promise<{ success: boolean; message?: string }> => {
    const targetSJ = suratJalanList.find(sj => sj.id === id);
    if (!targetSJ) {
      return { success: false, message: 'Surat Jalan tidak ditemukan.' };
    }

    const oldItems = getSuratJalanItems(targetSJ);
    const newTotalPcs = verifiedItems.reduce((acc, it) => acc + (Number(it.totalPcs) || 0), 0);
    const originalTotal = targetSJ.originalTotalPcs || targetSJ.totalPcs;
    const hasDiscrepancy = newTotalPcs !== originalTotal;
    const discrepancyPcs = newTotalPcs - originalTotal;
    const newStatus = hasDiscrepancy ? 'DISCREPANCY' : 'VERIFIED';
    const verifier = userRole === 'BRAND' ? `Brand ${activeBrand}` : 'Admin';
    const verifiedAt = new Date().toISOString();

    const itemsWithAudit: SuratJalanItem[] = verifiedItems.map((vIt, idx) => {
      const origItem = oldItems[idx];
      const origQty = vIt.originalQtyDelivered || origItem?.qtyDelivered || vIt.qtyDelivered;
      const origTotal = vIt.originalTotalPcs || origItem?.totalPcs || vIt.totalPcs;
      const itemDisc = vIt.totalPcs - origTotal;

      return {
        ...vIt,
        originalQtyDelivered: origQty,
        originalTotalPcs: origTotal,
        itemDiscrepancyPcs: itemDisc,
      };
    });

    const updatedSJ: SuratJalan = {
      ...targetSJ,
      items: itemsWithAudit,
      totalPcs: newTotalPcs,
      originalTotalPcs: originalTotal,
      realTotalPcs: newTotalPcs,
      discrepancyPcs,
      status: newStatus,
      verifiedBy: verifier,
      verifiedAt,
      verificationNote: verificationNote || targetSJ.verificationNote,
      qtyDelivered: itemsWithAudit[0]?.qtyDelivered || targetSJ.qtyDelivered,
    };

    setSuratJalanList(prev => prev.map(sj => (sj.id === id ? updatedSJ : sj)));

    // Update delta on linked SPKs
    setSpkList(prev => {
      let updatedList = [...prev];

      for (let idx = 0; idx < itemsWithAudit.length; idx++) {
        const newItem = itemsWithAudit[idx];
        const oldItem = oldItems[idx];
        const spkId = newItem.spkId || targetSJ.spkId;
        if (!spkId) continue;

        const spkIdx = updatedList.findIndex(s => s.id === spkId || s.spkNumber === spkId);
        if (spkIdx === -1) continue;

        const spk = updatedList[spkIdx];
        const newDeliv = newItem.qtyDelivered;
        const oldDeliv = oldItem?.qtyDelivered;

        const deltaS = (newDeliv?.s || 0) - (oldDeliv?.s || 0);
        const deltaM = (newDeliv?.m || 0) - (oldDeliv?.m || 0);
        const deltaL = (newDeliv?.l || 0) - (oldDeliv?.l || 0);
        const deltaXL = (newDeliv?.xl || 0) - (oldDeliv?.xl || 0);
        const deltaXXL = (newDeliv?.xxl || 0) - (oldDeliv?.xxl || 0);
        const deltaAnak4 = (newDeliv?.anak4 || 0) - (oldDeliv?.anak4 || 0);
        const deltaAnak6 = (newDeliv?.anak6 || 0) - (oldDeliv?.anak6 || 0);
        const deltaAnak8 = (newDeliv?.anak8 || 0) - (oldDeliv?.anak8 || 0);
        const deltaAnak10 = (newDeliv?.anak10 || 0) - (oldDeliv?.anak10 || 0);
        const deltaAnak12 = (newDeliv?.anak12 || 0) - (oldDeliv?.anak12 || 0);
        const deltaAnak14 = (newDeliv?.anak14 || 0) - (oldDeliv?.anak14 || 0);
        const deltaAnak16 = (newDeliv?.anak16 || 0) - (oldDeliv?.anak16 || 0);

        let updatedItems = spk.items;
        if (updatedItems && updatedItems.length > 0) {
          updatedItems = updatedItems.map(it => {
            const isTarget = newItem.spkItemId
              ? it.id === newItem.spkItemId
              : it.produk.trim().toUpperCase() === newItem.produk.trim().toUpperCase();

            if (isTarget && it.deliveredQty) {
              return {
                ...it,
                deliveredQty: {
                  s: Math.max(0, it.deliveredQty.s + deltaS),
                  m: Math.max(0, it.deliveredQty.m + deltaM),
                  l: Math.max(0, it.deliveredQty.l + deltaL),
                  xl: Math.max(0, it.deliveredQty.xl + deltaXL),
                  xxl: Math.max(0, it.deliveredQty.xxl + deltaXXL),
                  anak4: Math.max(0, it.deliveredQty.anak4 + deltaAnak4),
                  anak6: Math.max(0, it.deliveredQty.anak6 + deltaAnak6),
                  anak8: Math.max(0, it.deliveredQty.anak8 + deltaAnak8),
                  anak10: Math.max(0, it.deliveredQty.anak10 + deltaAnak10),
                  anak12: Math.max(0, it.deliveredQty.anak12 + deltaAnak12),
                  anak14: Math.max(0, it.deliveredQty.anak14 + deltaAnak14),
                  anak16: Math.max(0, it.deliveredQty.anak16 + deltaAnak16),
                },
              };
            }
            return it;
          });
        }

        const newDelivered: SizeBreakdown = {
          s: Math.max(0, (spk.deliveredQty?.s || 0) + deltaS),
          m: Math.max(0, (spk.deliveredQty?.m || 0) + deltaM),
          l: Math.max(0, (spk.deliveredQty?.l || 0) + deltaL),
          xl: Math.max(0, (spk.deliveredQty?.xl || 0) + deltaXL),
          xxl: Math.max(0, (spk.deliveredQty?.xxl || 0) + deltaXXL),
          anak4: Math.max(0, (spk.deliveredQty?.anak4 || 0) + deltaAnak4),
          anak6: Math.max(0, (spk.deliveredQty?.anak6 || 0) + deltaAnak6),
          anak8: Math.max(0, (spk.deliveredQty?.anak8 || 0) + deltaAnak8),
          anak10: Math.max(0, (spk.deliveredQty?.anak10 || 0) + deltaAnak10),
          anak12: Math.max(0, (spk.deliveredQty?.anak12 || 0) + deltaAnak12),
          anak14: Math.max(0, (spk.deliveredQty?.anak14 || 0) + deltaAnak14),
          anak16: Math.max(0, (spk.deliveredQty?.anak16 || 0) + deltaAnak16),
        };

        const targetTotal = Object.values(spk.targetCutQty || {}).reduce((a, b) => a + b, 0);
        const totalDelivered = Object.values(newDelivered).reduce((a, b) => a + b, 0);

        const newStatus: SPKCutting['status'] =
          totalDelivered <= 0
            ? 'IN_PRODUCTION'
            : targetTotal > 0 && totalDelivered > targetTotal
            ? 'OVER_DELIVERY'
            : targetTotal > 0 && totalDelivered === targetTotal
            ? 'COMPLETED'
            : 'PARTIAL_DELIVERED';

        updatedList[spkIdx] = {
          ...spk,
          items: updatedItems,
          deliveredQty: newDelivered,
          status: newStatus,
        };
      }

      return updatedList;
    });

    try {
      await apiUpdateSuratJalan(id, {
        items: itemsWithAudit,
        totalPcs: newTotalPcs,
        status: newStatus,
        catatan: targetSJ.catatan,
        driverName: targetSJ.driverName,
        nomorKendaraan: targetSJ.nomorKendaraan,
      });
    } catch (err) {
      console.warn('Backend sync update Surat Jalan failed, saved locally:', err);
    }

    return {
      success: true,
      message: hasDiscrepancy
        ? `Verifikasi penerimaan tersimpan. Tercatat selisih ${discrepancyPcs > 0 ? '+' : ''}${discrepancyPcs} Pcs.`
        : 'Verifikasi penerimaan tersimpan. Barang diterima lengkap sesuai surat jalan.',
    };
  };

  const deleteSuratJalan = async (id: string): Promise<{ success: boolean; message?: string }> => {
    const targetSJ = suratJalanList.find(sj => sj.id === id);
    if (!targetSJ) {
      return { success: false, message: 'Surat Jalan tidak ditemukan.' };
    }

    const linkedReturn = returnList.filter(r => r.suratJalanId === id);
    if (linkedReturn.length > 0) {
      return {
        success: false,
        message: `Surat Jalan ${targetSJ.noSuratJalan} memiliki ${linkedReturn.length} tiket retur. Hapus tiket retur terlebih dahulu.`,
      };
    }

    try {
      const { error } = await apiDeleteSuratJalan(id);
      if (error) {
        return { success: false, message: error };
      }
    } catch (err) {
      console.warn('Backend delete Surat Jalan failed, removing locally:', err);
    }

    // Revert kuantiti terkirim pada semua SPK terkait
    const itemsToRevert: SuratJalanItem[] = getSuratJalanItems(targetSJ);

    setSpkList(prev => {
      let updatedList = [...prev];
      for (const item of itemsToRevert) {
        const spkIdx = updatedList.findIndex(s => s.id === item.spkId || s.spkNumber === item.spkId);
        if (spkIdx !== -1) {
          const spk = updatedList[spkIdx];
          let updatedItems = spk.items;
          if (updatedItems && updatedItems.length > 0) {
            updatedItems = updatedItems.map(it => {
              const isTargetItem =
                (item.spkItemId && it.id === item.spkItemId) ||
                (it.produk && item.produk && it.produk.trim().toUpperCase() === item.produk.trim().toUpperCase());

              if (isTargetItem && it.deliveredQty) {
                return {
                  ...it,
                  deliveredQty: {
                    s: Math.max(0, it.deliveredQty.s - item.qtyDelivered.s),
                    m: Math.max(0, it.deliveredQty.m - item.qtyDelivered.m),
                    l: Math.max(0, it.deliveredQty.l - item.qtyDelivered.l),
                    xl: Math.max(0, it.deliveredQty.xl - item.qtyDelivered.xl),
                    xxl: Math.max(0, it.deliveredQty.xxl - item.qtyDelivered.xxl),
                    anak4: Math.max(0, it.deliveredQty.anak4 - item.qtyDelivered.anak4),
                    anak6: Math.max(0, it.deliveredQty.anak6 - item.qtyDelivered.anak6),
                    anak8: Math.max(0, it.deliveredQty.anak8 - item.qtyDelivered.anak8),
                    anak10: Math.max(0, it.deliveredQty.anak10 - item.qtyDelivered.anak10),
                    anak12: Math.max(0, it.deliveredQty.anak12 - item.qtyDelivered.anak12),
                    anak14: Math.max(0, it.deliveredQty.anak14 - item.qtyDelivered.anak14),
                    anak16: Math.max(0, it.deliveredQty.anak16 - item.qtyDelivered.anak16),
                  },
                };
              }
              return it;
            });
          }

          const newDelivered: SizeBreakdown = {
            s: Math.max(0, spk.deliveredQty.s - item.qtyDelivered.s),
            m: Math.max(0, spk.deliveredQty.m - item.qtyDelivered.m),
            l: Math.max(0, spk.deliveredQty.l - item.qtyDelivered.l),
            xl: Math.max(0, spk.deliveredQty.xl - item.qtyDelivered.xl),
            xxl: Math.max(0, spk.deliveredQty.xxl - item.qtyDelivered.xxl),
            anak4: Math.max(0, spk.deliveredQty.anak4 - item.qtyDelivered.anak4),
            anak6: Math.max(0, spk.deliveredQty.anak6 - item.qtyDelivered.anak6),
            anak8: Math.max(0, spk.deliveredQty.anak8 - item.qtyDelivered.anak8),
            anak10: Math.max(0, spk.deliveredQty.anak10 - item.qtyDelivered.anak10),
            anak12: Math.max(0, spk.deliveredQty.anak12 - item.qtyDelivered.anak12),
            anak14: Math.max(0, spk.deliveredQty.anak14 - item.qtyDelivered.anak14),
            anak16: Math.max(0, spk.deliveredQty.anak16 - item.qtyDelivered.anak16),
          };
          const targetTotal = Object.values(spk.targetCutQty).reduce((a, b) => a + b, 0);
          const totalDelivered = Object.values(newDelivered).reduce((a, b) => a + b, 0);
          const SIZES_CHECK: (keyof SizeBreakdown)[] = ['s', 'm', 'l', 'xl', 'xxl', 'anak4', 'anak6', 'anak8', 'anak10', 'anak12', 'anak14', 'anak16'];
          const hasUnfulfilledSize = SIZES_CHECK.some(sz => (spk.targetCutQty[sz] || 0) > (newDelivered[sz] || 0));

          const newStatus: SPKCutting['status'] =
            totalDelivered <= 0
              ? 'IN_PRODUCTION'
              : targetTotal > 0 && totalDelivered > targetTotal
              ? 'OVER_DELIVERY'
              : targetTotal > 0 && totalDelivered >= targetTotal && !hasUnfulfilledSize
              ? 'COMPLETED'
              : 'PARTIAL_DELIVERED';

          updatedList[spkIdx] = {
            ...spk,
            items: updatedItems,
            deliveredQty: newDelivered,
            status: newStatus,
          };
        }
      }
      setCache('spk_list', updatedList);
      return updatedList;
    });

    setSuratJalanList(prev => {
      const filtered = prev.filter(sj => sj.id !== id);
      setCache('surat_jalan', filtered);
      return filtered;
    });
    return { success: true, message: `Surat Jalan ${targetSJ.noSuratJalan} berhasil dihapus.` };
  };

  const updateSuratJalan = async (
    id: string,
    updatedData: Partial<SuratJalan>
  ): Promise<{ success: boolean; message?: string }> => {
    const targetSJ = suratJalanList.find(sj => sj.id === id);
    if (!targetSJ) {
      return { success: false, message: 'Surat Jalan tidak ditemukan.' };
    }

    const SIZES: (keyof SizeBreakdown)[] = ['s', 'm', 'l', 'xl', 'xxl', 'anak4', 'anak6', 'anak8', 'anak10', 'anak12', 'anak14', 'anak16'];

    // 1. Dapatkan items lama sebelum diedit
    const oldItems: SuratJalanItem[] = getSuratJalanItems(targetSJ);

    // 2. Dapatkan items baru setelah diedit
    const newItems: SuratJalanItem[] = updatedData.items && updatedData.items.length > 0
      ? updatedData.items
      : oldItems;

    const grandTotalPcs = newItems.reduce((acc, item) => acc + (Number(item.totalPcs) || 0), 0);

    // 3. Sinkronisasi kuantiti terkirim pada seluruh SPK terkait (Revert lama + Apply baru)
    setSpkList(prev => {
      let updatedList = [...prev];

      // Langkah A: Revert kuantiti lama dari SPK terkait
      for (const item of oldItems) {
        if (!item.spkId || item.isManual) continue;
        const spkIdx = updatedList.findIndex(s => s.id === item.spkId || s.spkNumber === item.spkId);
        if (spkIdx !== -1) {
          const spk = updatedList[spkIdx];
          let updatedItems = spk.items;
          if (updatedItems && updatedItems.length > 0) {
            updatedItems = updatedItems.map(it => {
              const isTargetItem = item.spkItemId
                ? it.id === item.spkItemId || it.produk.trim().toUpperCase() === item.produk.trim().toUpperCase()
                : it.produk.trim().toUpperCase() === item.produk.trim().toUpperCase();

              if (isTargetItem && it.deliveredQty) {
                return {
                  ...it,
                  deliveredQty: {
                    s: Math.max(0, it.deliveredQty.s - (item.qtyDelivered?.s || 0)),
                    m: Math.max(0, it.deliveredQty.m - (item.qtyDelivered?.m || 0)),
                    l: Math.max(0, it.deliveredQty.l - (item.qtyDelivered?.l || 0)),
                    xl: Math.max(0, it.deliveredQty.xl - (item.qtyDelivered?.xl || 0)),
                    xxl: Math.max(0, it.deliveredQty.xxl - (item.qtyDelivered?.xxl || 0)),
                    anak4: Math.max(0, it.deliveredQty.anak4 - (item.qtyDelivered?.anak4 || 0)),
                    anak6: Math.max(0, it.deliveredQty.anak6 - (item.qtyDelivered?.anak6 || 0)),
                    anak8: Math.max(0, it.deliveredQty.anak8 - (item.qtyDelivered?.anak8 || 0)),
                    anak10: Math.max(0, it.deliveredQty.anak10 - (item.qtyDelivered?.anak10 || 0)),
                    anak12: Math.max(0, it.deliveredQty.anak12 - (item.qtyDelivered?.anak12 || 0)),
                    anak14: Math.max(0, it.deliveredQty.anak14 - (item.qtyDelivered?.anak14 || 0)),
                    anak16: Math.max(0, it.deliveredQty.anak16 - (item.qtyDelivered?.anak16 || 0)),
                  },
                };
              }
              return it;
            });
          }

          const newDelivered: SizeBreakdown = {
            s: Math.max(0, spk.deliveredQty.s - (item.qtyDelivered?.s || 0)),
            m: Math.max(0, spk.deliveredQty.m - (item.qtyDelivered?.m || 0)),
            l: Math.max(0, spk.deliveredQty.l - (item.qtyDelivered?.l || 0)),
            xl: Math.max(0, spk.deliveredQty.xl - (item.qtyDelivered?.xl || 0)),
            xxl: Math.max(0, spk.deliveredQty.xxl - (item.qtyDelivered?.xxl || 0)),
            anak4: Math.max(0, spk.deliveredQty.anak4 - (item.qtyDelivered?.anak4 || 0)),
            anak6: Math.max(0, spk.deliveredQty.anak6 - (item.qtyDelivered?.anak6 || 0)),
            anak8: Math.max(0, spk.deliveredQty.anak8 - (item.qtyDelivered?.anak8 || 0)),
            anak10: Math.max(0, spk.deliveredQty.anak10 - (item.qtyDelivered?.anak10 || 0)),
            anak12: Math.max(0, spk.deliveredQty.anak12 - (item.qtyDelivered?.anak12 || 0)),
            anak14: Math.max(0, spk.deliveredQty.anak14 - (item.qtyDelivered?.anak14 || 0)),
            anak16: Math.max(0, spk.deliveredQty.anak16 - (item.qtyDelivered?.anak16 || 0)),
          };

          updatedList[spkIdx] = {
            ...spk,
            items: updatedItems,
            deliveredQty: newDelivered,
          };
        }
      }

      // Langkah B: Terapkan kuantiti baru ke SPK terkait
      for (const item of newItems) {
        if (!item.spkId || item.isManual) continue;
        const spkIdx = updatedList.findIndex(s => s.id === item.spkId || s.spkNumber === item.spkId);
        if (spkIdx !== -1) {
          const spk = updatedList[spkIdx];
          const deliv = item.qtyDelivered || { s: 0, m: 0, l: 0, xl: 0, xxl: 0, anak4: 0, anak6: 0, anak8: 0, anak10: 0, anak12: 0, anak14: 0, anak16: 0 };
          let updatedItems = spk.items;
          if (updatedItems && updatedItems.length > 0) {
            updatedItems = updatedItems.map(it => {
              const isTargetItem = item.spkItemId
                ? it.id === item.spkItemId || it.produk.trim().toUpperCase() === item.produk.trim().toUpperCase()
                : it.produk.trim().toUpperCase() === item.produk.trim().toUpperCase();

              if (isTargetItem) {
                const itemDeliv = it.deliveredQty || { s: 0, m: 0, l: 0, xl: 0, xxl: 0, anak4: 0, anak6: 0, anak8: 0, anak10: 0, anak12: 0, anak14: 0, anak16: 0 };
                return {
                  ...it,
                  deliveredQty: {
                    s: itemDeliv.s + (deliv.s || 0),
                    m: itemDeliv.m + (deliv.m || 0),
                    l: itemDeliv.l + (deliv.l || 0),
                    xl: itemDeliv.xl + (deliv.xl || 0),
                    xxl: itemDeliv.xxl + (deliv.xxl || 0),
                    anak4: itemDeliv.anak4 + (deliv.anak4 || 0),
                    anak6: itemDeliv.anak6 + (deliv.anak6 || 0),
                    anak8: itemDeliv.anak8 + (deliv.anak8 || 0),
                    anak10: itemDeliv.anak10 + (deliv.anak10 || 0),
                    anak12: itemDeliv.anak12 + (deliv.anak12 || 0),
                    anak14: itemDeliv.anak14 + (deliv.anak14 || 0),
                    anak16: itemDeliv.anak16 + (deliv.anak16 || 0),
                  },
                };
              }
              return it;
            });
          }

          const updatedDelivered: SizeBreakdown = {
            s: spk.deliveredQty.s + (deliv.s || 0),
            m: spk.deliveredQty.m + (deliv.m || 0),
            l: spk.deliveredQty.l + (deliv.l || 0),
            xl: spk.deliveredQty.xl + (deliv.xl || 0),
            xxl: spk.deliveredQty.xxl + (deliv.xxl || 0),
            anak4: spk.deliveredQty.anak4 + (deliv.anak4 || 0),
            anak6: spk.deliveredQty.anak6 + (deliv.anak6 || 0),
            anak8: spk.deliveredQty.anak8 + (deliv.anak8 || 0),
            anak10: spk.deliveredQty.anak10 + (deliv.anak10 || 0),
            anak12: spk.deliveredQty.anak12 + (deliv.anak12 || 0),
            anak14: spk.deliveredQty.anak14 + (deliv.anak14 || 0),
            anak16: spk.deliveredQty.anak16 + (deliv.anak16 || 0),
          };

          updatedList[spkIdx] = {
            ...spk,
            items: updatedItems,
            deliveredQty: updatedDelivered,
          };
        }
      }

      // Langkah C: Hitung ulang status seluruh SPK yang terdampak
      const affectedSpkIds = new Set<string>();
      for (const it of [...oldItems, ...newItems]) {
        if (it.spkId && !it.isManual) affectedSpkIds.add(it.spkId);
      }

      updatedList = updatedList.map(spk => {
        if (!affectedSpkIds.has(spk.id) && !affectedSpkIds.has(spk.spkNumber)) {
          return spk;
        }

        const targetTotal = Object.values(spk.targetCutQty).reduce((a, b) => a + b, 0);
        const totalDelivered = Object.values(spk.deliveredQty).reduce((a, b) => a + b, 0);
        const hasUnfulfilledSize = SIZES.some(sz => (spk.targetCutQty[sz] || 0) > (spk.deliveredQty[sz] || 0));

        const newStatus: SPKCutting['status'] =
          totalDelivered <= 0
            ? 'IN_PRODUCTION'
            : targetTotal > 0 && totalDelivered > targetTotal
            ? 'OVER_DELIVERY'
            : targetTotal > 0 && totalDelivered >= targetTotal && !hasUnfulfilledSize
            ? 'COMPLETED'
            : 'PARTIAL_DELIVERED';

        return {
          ...spk,
          status: newStatus,
        };
      });

      return updatedList;
    });

    // 4. Update data Surat Jalan di local state
    const firstItem: Partial<SuratJalanItem> = newItems[0] || {};
    const distinctBrands = Array.from(new Set(newItems.map(i => i.brand).filter(Boolean)));
    const sjBrand = updatedData.brand || (distinctBrands.length === 1 ? distinctBrands[0] : distinctBrands.join(', ') || targetSJ.brand);

    const updatedCompleteSJ: SuratJalan = {
      ...targetSJ,
      ...updatedData,
      brand: sjBrand,
      items: newItems,
      totalPcs: grandTotalPcs,
      driverName: updatedData.driverName !== undefined ? updatedData.driverName : targetSJ.driverName,
      nomorKendaraan: updatedData.nomorKendaraan !== undefined ? updatedData.nomorKendaraan : targetSJ.nomorKendaraan,
      tanggal: updatedData.tanggal || targetSJ.tanggal,
      catatan: updatedData.catatan !== undefined ? updatedData.catatan : targetSJ.catatan,
      produk: newItems.map(i => i.produk).join(', ') || targetSJ.produk,
      vendor: Array.from(new Set(newItems.map(i => i.vendor).filter(Boolean))).join(', ') || targetSJ.vendor,
      jenisKain: newItems.map(i => i.jenisKain).filter(Boolean).join(', ') || targetSJ.jenisKain,
      qtyDelivered: firstItem.qtyDelivered || targetSJ.qtyDelivered,
      spkId: firstItem.spkId || targetSJ.spkId,
      spkItemId: firstItem.spkItemId || targetSJ.spkItemId,
    };

    setSuratJalanList(prev => prev.map(sj => sj.id === id ? updatedCompleteSJ : sj));

    // 5. Kirim sinkronisasi ke backend server
    try {
      await apiUpdateSuratJalan(id, {
        noSuratJalan: updatedCompleteSJ.noSuratJalan,
        spkId: updatedCompleteSJ.spkId || null,
        brand: updatedCompleteSJ.brand,
        produk: updatedCompleteSJ.produk,
        vendor: updatedCompleteSJ.vendor,
        tanggal: updatedCompleteSJ.tanggal ? new Date(updatedCompleteSJ.tanggal).toISOString() : new Date().toISOString(),
        driverName: updatedCompleteSJ.driverName || '',
        nomorKendaraan: updatedCompleteSJ.nomorKendaraan || '',
        catatan: updatedCompleteSJ.catatan || '',
        status: updatedCompleteSJ.status,
        totalPcs: grandTotalPcs,
        items: newItems,
        qtySML: (firstItem.qtyDelivered?.s || 0) + (firstItem.qtyDelivered?.m || 0) + (firstItem.qtyDelivered?.l || 0),
        qtyM: firstItem.qtyDelivered?.m || 0,
        qtyL: firstItem.qtyDelivered?.l || 0,
        qtyXL: firstItem.qtyDelivered?.xl || 0,
        qtyXXL: firstItem.qtyDelivered?.xxl || 0,
        qtyAnak4: firstItem.qtyDelivered?.anak4 || 0,
        qtyAnak6: firstItem.qtyDelivered?.anak6 || 0,
        qtyAnak8: firstItem.qtyDelivered?.anak8 || 0,
        qtyAnak10: firstItem.qtyDelivered?.anak10 || 0,
        qtyAnak12: firstItem.qtyDelivered?.anak12 || 0,
        qtyAnak14: firstItem.qtyDelivered?.anak14 || 0,
        qtyAnak16: firstItem.qtyDelivered?.anak16 || 0,
      });
    } catch (err) {
      console.warn('Backend update Surat Jalan failed, updated locally:', err);
    }

    return { success: true, message: `Surat Jalan ${targetSJ.noSuratJalan} berhasil diperbarui.` };
  };

  // Kasbon Handlers
  const addKasbon = async (kasbonData: Omit<KasbonTransaction, 'id'>) => {
    const tempId = `ksb-${Date.now()}`;
    const newKasbon: KasbonTransaction = { ...kasbonData, id: tempId };
    setKasbonList(prev => [newKasbon, ...prev]);

    // Update Vendor currentKasbon
    setVendors(prev =>
      prev.map(v => {
        if (v.name === kasbonData.vendor) {
          const delta = kasbonData.tipe === 'PINJAMAN' ? kasbonData.jumlah : -kasbonData.jumlah;
          return { ...v, currentKasbon: Math.max(0, v.currentKasbon + delta) };
        }
        return v;
      })
    );

    try {
      const { data } = await apiAddKasbon({
        vendor: kasbonData.vendor,
        tanggal: kasbonData.tanggal,
        jumlah: kasbonData.jumlah,
        tipe: kasbonData.tipe === 'POTONGAN_GAJI' ? 'PELUNASAN' : 'PINJAMAN',
        keterangan: kasbonData.keterangan,
      });
      if (data) {
        setKasbonList(prev => prev.map(k => (k.id === tempId ? { ...k, id: data.id } : k)));
      }
    } catch (err) {
      console.warn('Backend sync failed, saved locally:', err);
    }
  };

  // Helper Lookups
  const getVendorRate = (vendor: string, produk: string, brand: string): number => {
    const matched = hargaKonveksi.find(
      hk =>
        hk.vendor.trim().toLowerCase() === vendor.trim().toLowerCase() &&
        hk.produk.trim().toLowerCase() === produk.trim().toLowerCase() &&
        hk.brand.trim().toLowerCase() === brand.trim().toLowerCase()
    );
    return matched ? matched.harga : 12500; // fallback standard default
  };

  const getBuyerRates = (brand: string, produk: string) => {
    const matched = hargaBuyer.find(
      hb =>
        hb.brand.trim().toLowerCase() === brand.trim().toLowerCase() &&
        hb.produk.trim().toLowerCase() === produk.trim().toLowerCase()
    );
    if (matched) {
      const rS = matched.rateS ?? matched.rateSML ?? 45000;
      const rM = matched.rateM ?? matched.rateSML ?? 45000;
      const rL = matched.rateL ?? matched.rateSML ?? 45000;
      const rXL = matched.rateXL ?? 50000;
      const rXXL = matched.rateXXL ?? matched.rateXL ?? 52000;
      return {
        rateS: rS,
        rateM: rM,
        rateL: rL,
        rateXL: rXL,
        rateXXL: rXXL,
        rateSML: matched.rateSML ?? rS,
        rateAnak4: matched.rateAnak4 || 0,
        rateAnak6: matched.rateAnak6 || 0,
        rateAnak8: matched.rateAnak8 || 0,
        rateAnak10: matched.rateAnak10 || 0,
        rateAnak12: matched.rateAnak12 || 0,
        rateAnak14: matched.rateAnak14 || 0,
        rateAnak16: matched.rateAnak16 || 0,
      };
    }
    return {
      rateS: 45000,
      rateM: 45000,
      rateL: 45000,
      rateXL: 50000,
      rateXXL: 52000,
      rateSML: 45000,
      rateAnak4: 35000,
      rateAnak6: 37000,
      rateAnak8: 39000,
      rateAnak10: 41000,
      rateAnak12: 43000,
      rateAnak14: 45000,
      rateAnak16: 47000,
    };
  };

  const getSPKRemainingQty = (spk: SPKCutting, spkItemId?: string): SizeBreakdown & { totalRemaining: number } => {
    let target: SizeBreakdown = spk.targetCutQty;
    let deliv: SizeBreakdown = { s: 0, m: 0, l: 0, xl: 0, xxl: 0, anak4: 0, anak6: 0, anak8: 0, anak10: 0, anak12: 0, anak14: 0, anak16: 0 };

    const matchedItem = spkItemId && spk.items && spk.items.length > 0
      ? spk.items.find(it => it.id === spkItemId || it.produk.trim().toUpperCase() === spkItemId.trim().toUpperCase())
      : undefined;

    if (matchedItem) {
      target = matchedItem.targetCutQty;
    }

    // Hitung akumulasi terkirim secara dinamis dari daftar Surat Jalan aktif
    const matchedSJs = Array.isArray(suratJalanList)
      ? suratJalanList.filter(
          sj =>
            sj.spkId === spk.id ||
            (sj as any).spkNumber === spk.spkNumber ||
            getSuratJalanItems(sj).some(it => it.spkId === spk.id || it.spkNumber === spk.spkNumber)
        )
      : [];

    if (matchedSJs.length > 0) {
      const targetProductName = matchedItem ? matchedItem.produk.trim().toUpperCase() : spk.produk.trim().toUpperCase();
      for (const sj of matchedSJs) {
        const sjItems = getSuratJalanItems(sj);
        if (sjItems.length > 0) {
          for (const item of sjItems) {
            if (item.spkId === spk.id || item.spkNumber === spk.spkNumber) {
              const itemProd = (item.produk || '').trim().toUpperCase();
              if (matchedItem) {
                if (itemProd === targetProductName || (item.spkItemId && item.spkItemId === matchedItem.id)) {
                  deliv.s += Number(item.qtyDelivered?.s) || 0;
                  deliv.m += Number(item.qtyDelivered?.m) || 0;
                  deliv.l += Number(item.qtyDelivered?.l) || 0;
                  deliv.xl += Number(item.qtyDelivered?.xl) || 0;
                  deliv.xxl += Number(item.qtyDelivered?.xxl) || 0;
                  deliv.anak4 += Number(item.qtyDelivered?.anak4) || 0;
                  deliv.anak6 += Number(item.qtyDelivered?.anak6) || 0;
                  deliv.anak8 += Number(item.qtyDelivered?.anak8) || 0;
                  deliv.anak10 += Number(item.qtyDelivered?.anak10) || 0;
                  deliv.anak12 += Number(item.qtyDelivered?.anak12) || 0;
                  deliv.anak14 += Number(item.qtyDelivered?.anak14) || 0;
                  deliv.anak16 += Number(item.qtyDelivered?.anak16) || 0;
                }
              } else {
                deliv.s += Number(item.qtyDelivered?.s) || 0;
                deliv.m += Number(item.qtyDelivered?.m) || 0;
                deliv.l += Number(item.qtyDelivered?.l) || 0;
                deliv.xl += Number(item.qtyDelivered?.xl) || 0;
                deliv.xxl += Number(item.qtyDelivered?.xxl) || 0;
                deliv.anak4 += Number(item.qtyDelivered?.anak4) || 0;
                deliv.anak6 += Number(item.qtyDelivered?.anak6) || 0;
                deliv.anak8 += Number(item.qtyDelivered?.anak8) || 0;
                deliv.anak10 += Number(item.qtyDelivered?.anak10) || 0;
                deliv.anak12 += Number(item.qtyDelivered?.anak12) || 0;
                deliv.anak14 += Number(item.qtyDelivered?.anak14) || 0;
                deliv.anak16 += Number(item.qtyDelivered?.anak16) || 0;
              }
            }
          }
        }
      }
    } else {
      if (matchedItem && matchedItem.deliveredQty) {
        deliv = matchedItem.deliveredQty;
      } else {
        deliv = spk.deliveredQty || deliv;
      }
    }

    const s = Math.max(0, target.s - deliv.s);
    const m = Math.max(0, target.m - deliv.m);
    const l = Math.max(0, target.l - deliv.l);
    const xl = Math.max(0, target.xl - deliv.xl);
    const xxl = Math.max(0, target.xxl - deliv.xxl);
    const anak4 = Math.max(0, target.anak4 - deliv.anak4);
    const anak6 = Math.max(0, target.anak6 - deliv.anak6);
    const anak8 = Math.max(0, target.anak8 - deliv.anak8);
    const anak10 = Math.max(0, target.anak10 - deliv.anak10);
    const anak12 = Math.max(0, target.anak12 - deliv.anak12);
    const anak14 = Math.max(0, target.anak14 - deliv.anak14);
    const anak16 = Math.max(0, target.anak16 - deliv.anak16);
    const totalRemaining = s + m + l + xl + xxl + anak4 + anak6 + anak8 + anak10 + anak12 + anak14 + anak16;

    return { s, m, l, xl, xxl, anak4, anak6, anak8, anak10, anak12, anak14, anak16, totalRemaining };
  };

  // Payroll Calculation Engine (Support Payment by Completed PO)
  const calculateVendorPayroll = (
    vendorName: string,
    startDate?: string,
    endDate?: string,
    allowPartialPayment: boolean = false
  ): VendorPayrollSummary => {
    // 1. Akumulasi total kuantiti terkirim per nomor PO secara global (seluruh SJ aktif) untuk vendor ini
    const poTotalDeliveredMap = new Map<string, number>();
    for (const sj of suratJalanList) {
      const sjItems = getSuratJalanItems(sj);
      for (const it of sjItems) {
        if (it.vendor === vendorName) {
          const linkedSPK = spkList.find(s => s.id === it.spkId || s.spkNumber === it.spkId || s.spkNumber === it.spkNumber);
          const poKey = it.sourcePONumber || linkedSPK?.sourcePONumber || it.spkNumber || it.legacyPoNumber || 'NON-PO';
          poTotalDeliveredMap.set(poKey, (poTotalDeliveredMap.get(poKey) || 0) + (it.totalPcs || 0));
        }
      }
    }

    // 2. Tentukan target pcs dan info untuk setiap PO
    const poTargetMap = new Map<string, { targetPcs: number; poId?: string; brand: string; produk: string }>();
    for (const po of productionPOs) {
      if (!po.vendorTujuan || po.vendorTujuan === vendorName) {
        const targetTotal = po.totalPcs || (po.items ? po.items.reduce((s, it) => s + (it.qty || 0), 0) : 0);
        const prod = po.items && po.items.length > 0 ? Array.from(new Set(po.items.map(i => i.namaProduk))).join(' + ') : 'PRODUK';
        poTargetMap.set(po.noPO, { targetPcs: targetTotal, poId: po.id, brand: po.brand, produk: prod });
      }
    }
    for (const spk of spkList) {
      if (spk.vendor === vendorName || (spk.items && spk.items.some(it => it.vendor === vendorName))) {
        const key = spk.sourcePONumber || spk.spkNumber;
        if (!poTargetMap.has(key)) {
          const targetTotal = Object.values(spk.targetCutQty || {}).reduce((a, b) => a + b, 0);
          poTargetMap.set(key, { targetPcs: targetTotal, brand: spk.brand, produk: spk.produk });
        }
      }
    }

    const matchedSJs = suratJalanList.filter(sj => {
      const sjDate = sj.tanggal.split('T')[0];
      if (startDate && sjDate < startDate) return false;
      if (endDate && sjDate > endDate) return false;
      return true;
    });

    const vendorObj = vendors.find(v => v.name === vendorName);
    const kasbon = vendorObj ? vendorObj.currentKasbon : 0;

    let totalPcs = 0;
    let totalGrossPay = 0;
    let totalPendingPcs = 0;
    let totalPendingPay = 0;

    const items: VendorPayrollSummary['items'] = [];
    const packagesMap = new Map<string, VendorPOPayrollPackage>();

    for (const sj of matchedSJs) {
      const sjItems = getSuratJalanItems(sj);
      for (const it of sjItems) {
        if (it.vendor === vendorName) {
          const linkedSPK = spkList.find(s => s.id === it.spkId || s.spkNumber === it.spkId || s.spkNumber === it.spkNumber);
          const poKey = it.sourcePONumber || linkedSPK?.sourcePONumber || it.spkNumber || it.legacyPoNumber || 'NON-PO';
          const rate = getVendorRate(it.vendor, it.produk, it.brand);
          const subtotal = it.totalPcs * rate;

          // Cek kelengkapan PO
          const targetInfo = poTargetMap.get(poKey);
          const globalDelivered = poTotalDeliveredMap.get(poKey) || it.totalPcs;
          const targetPcs = targetInfo ? targetInfo.targetPcs : globalDelivered;
          const isCompleted = targetPcs > 0 ? globalDelivered >= targetPcs : true;

          // Build Paket PO
          if (!packagesMap.has(poKey)) {
            const remainingPcs = Math.max(0, targetPcs - globalDelivered);
            const percent = targetPcs > 0 ? Math.min(100, Math.round((globalDelivered / targetPcs) * 100)) : 100;
            const settlement = vendorSettlements.find(
              (s) => s.vendor === vendorName && s.poNumber.trim().toUpperCase() === poKey.trim().toUpperCase()
            );
            const isSettled = !!settlement;

            packagesMap.set(poKey, {
              poId: targetInfo?.poId,
              poNumber: poKey,
              brand: it.brand,
              produk: targetInfo?.produk || it.produk,
              targetPcs,
              deliveredPcs: globalDelivered,
              remainingPcs,
              percent,
              rate,
              subtotal: 0,
              totalPay: 0,
              isComplete: isCompleted,
              isSettled,
              settlementInfo: settlement,
              status: isCompleted ? 'COMPLETED' : 'PENDING_DELIVERY',
              suratJalanList: [],
            });
          }

          const pkg = packagesMap.get(poKey)!;
          pkg.subtotal += subtotal;
          pkg.totalPay += subtotal;
          pkg.suratJalanList.push({
            noSuratJalan: sj.noSuratJalan,
            tanggal: sj.tanggal,
            pcs: it.totalPcs,
          });

          const itemIsSettled = !!pkg.isSettled;

          items.push({
            suratJalanNo: sj.noSuratJalan,
            tanggal: sj.tanggal,
            produk: it.produk,
            jenisKain: it.jenisKain,
            brand: it.brand,
            pcs: it.totalPcs,
            rate,
            subtotal,
            poNumber: poKey,
            isCompletedPO: isCompleted,
            isSettled: itemIsSettled,
          });

          // Akumulasi payroll aktif (hanya mengakumulasi yang BELUM lunas / unpaid)
          if (!itemIsSettled) {
            if (isCompleted || allowPartialPayment) {
              totalPcs += it.totalPcs;
              totalGrossPay += subtotal;
            } else {
              totalPendingPcs += it.totalPcs;
              totalPendingPay += subtotal;
            }
          }
        }
      }
    }

    const netPay = Math.max(0, totalGrossPay - kasbon);

    let periodeLabel: string | undefined;
    if (startDate && endDate) {
      periodeLabel = `Sabtu, ${formatDateIndo(startDate)} – Sabtu, ${formatDateIndo(endDate)}`;
    }

    return {
      vendor: vendorName,
      totalPcs,
      totalGrossPay,
      kasbonDeduction: kasbon,
      netPay,
      totalPendingPcs,
      totalPendingPay,
      periodeAwal: startDate,
      periodeAkhir: endDate,
      periodeLabel,
      packages: Array.from(packagesMap.values()),
      items,
    };
  };

  // Invoice Calculation Engine
  const calculateBuyerInvoice = (
    brandName: string,
    startDate?: string,
    endDate?: string
  ): BuyerInvoiceSummary => {
    const brandSJs = suratJalanList.filter(sj => {
      const sjItems = getSuratJalanItems(sj);
      const matchBrand =
        sj.brand === brandName ||
        sj.brand.split(',').map(b => b.trim()).includes(brandName) ||
        sjItems.some(it => it.brand === brandName);
      if (!matchBrand) return false;
      const sjDate = sj.tanggal.split('T')[0];
      if (startDate && sjDate < startDate) return false;
      if (endDate && sjDate > endDate) return false;
      return true;
    });

    let grandTotal = 0;
    let totalPcs = 0;
    const items: BuyerInvoiceSummary['items'] = [];

    for (const sj of brandSJs) {
      const sjItems = getSuratJalanItems(sj);
      for (const it of sjItems) {
        const itBrand = it.brand || sj.brand;
        if (itBrand !== brandName && !itBrand.split(',').map(b => b.trim()).includes(brandName)) {
          continue;
        }
        const rates = getBuyerRates(brandName, it.produk);
        const qtyS = it.qtyDelivered?.s || 0;
        const qtyM = it.qtyDelivered?.m || 0;
        const qtyL = it.qtyDelivered?.l || 0;
        const qtyXL = it.qtyDelivered?.xl || 0;
        const qtyXXL = it.qtyDelivered?.xxl || 0;
        const qtySML = qtyS + qtyM + qtyL;
        const qtyAnak4 = it.qtyDelivered?.anak4 || 0;
        const qtyAnak6 = it.qtyDelivered?.anak6 || 0;
        const qtyAnak8 = it.qtyDelivered?.anak8 || 0;
        const qtyAnak10 = it.qtyDelivered?.anak10 || 0;
        const qtyAnak12 = it.qtyDelivered?.anak12 || 0;
        const qtyAnak14 = it.qtyDelivered?.anak14 || 0;
        const qtyAnak16 = it.qtyDelivered?.anak16 || 0;

        const subS = qtyS * rates.rateS;
        const subM = qtyM * rates.rateM;
        const subL = qtyL * rates.rateL;
        const subXL = qtyXL * rates.rateXL;
        const subXXL = qtyXXL * rates.rateXXL;
        const subAnak4 = qtyAnak4 * rates.rateAnak4;
        const subAnak6 = qtyAnak6 * rates.rateAnak6;
        const subAnak8 = qtyAnak8 * rates.rateAnak8;
        const subAnak10 = qtyAnak10 * rates.rateAnak10;
        const subAnak12 = qtyAnak12 * rates.rateAnak12;
        const subAnak14 = qtyAnak14 * rates.rateAnak14;
        const subAnak16 = qtyAnak16 * rates.rateAnak16;

        const totalAmount = subS + subM + subL + subXL + subXXL + subAnak4 + subAnak6 + subAnak8 + subAnak10 + subAnak12 + subAnak14 + subAnak16;
        grandTotal += totalAmount;
        totalPcs += it.totalPcs;

        items.push({
          suratJalanNo: sj.noSuratJalan,
          tanggal: sj.tanggal,
          produk: it.produk,
          jenisKain: it.jenisKain,
          qtyS,
          rateS: rates.rateS,
          qtyM,
          rateM: rates.rateM,
          qtyL,
          rateL: rates.rateL,
          qtyXL,
          rateXL: rates.rateXL,
          qtyXXL,
          rateXXL: rates.rateXXL,
          qtySML,
          rateSML: rates.rateSML,
          qtyAnak4,
          rateAnak4: rates.rateAnak4,
          qtyAnak6,
          rateAnak6: rates.rateAnak6,
          qtyAnak8,
          rateAnak8: rates.rateAnak8,
          qtyAnak10,
          rateAnak10: rates.rateAnak10,
          qtyAnak12,
          rateAnak12: rates.rateAnak12,
          qtyAnak14,
          rateAnak14: rates.rateAnak14,
          qtyAnak16,
          rateAnak16: rates.rateAnak16,
          totalPcs: it.totalPcs,
          totalAmount,
        });
      }
    }

    const now = new Date();
    const invoiceNo = `INV/${brandName.toUpperCase()}/${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}/01`;

    let jatuhTempoDate: Date;
    if (endDate) {
      jatuhTempoDate = new Date(endDate);
      jatuhTempoDate.setDate(jatuhTempoDate.getDate() + 7);
    } else {
      jatuhTempoDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    }

    let periodeLabel: string | undefined;
    if (startDate && endDate) {
      periodeLabel = `Sabtu, ${formatDateIndo(startDate)} – Sabtu, ${formatDateIndo(endDate)}`;
    }

    return {
      brand: brandName,
      invoiceNo,
      tanggal: now.toISOString().split('T')[0],
      jatuhTempo: jatuhTempoDate.toISOString().split('T')[0],
      periodeAwal: startDate,
      periodeAkhir: endDate,
      periodeLabel,
      items,
      totalPcs,
      grandTotal,
    };
  };

  // Arus Kas Handlers
  const addPembayaran = async (p: Omit<PembayaranBrand, 'id'>) => {
    const tempId = `pay-${Date.now()}`;
    const newP: PembayaranBrand = { ...p, id: tempId };
    setPembayaranList(prev => {
      const next = [newP, ...prev];
      setCache('pembayaran', next);
      return next;
    });

    try {
      const { data } = await apiAddPembayaran({
        brand: p.brand,
        tanggal: p.tanggal,
        jumlah: p.jumlah,
        metode: p.metode,
        keterangan: p.keterangan,
        referensiNomor: p.referensiNomor,
      });
      if (data) {
        setPembayaranList(prev => {
          const next = prev.map(item => (item.id === tempId ? { ...item, id: data.id } : item));
          setCache('pembayaran', next);
          return next;
        });
      }
    } catch (err) {
      console.warn('Backend sync failed, saved locally:', err);
    }
  };

  const updatePembayaran = async (id: string, p: Partial<Omit<PembayaranBrand, 'id'>>) => {
    setPembayaranList(prev => {
      const next = prev.map(item => (item.id === id ? { ...item, ...p } : item));
      setCache('pembayaran', next);
      return next;
    });
    try {
      await apiUpdatePembayaran(id, p);
    } catch (err) {
      console.warn('Backend sync failed, updated locally:', err);
    }
  };

  const deletePembayaran = async (id: string) => {
    setPembayaranList(prev => {
      const next = prev.filter(p => p.id !== id);
      setCache('pembayaran', next);
      return next;
    });
    try {
      await apiDeletePembayaran(id);
    } catch (err) {
      console.warn('Backend sync failed, deleted locally:', err);
    }
  };

  // Return Handlers
  const createReturn = async (data: {
    sumber: ReturnSource;
    spkId?: string;
    suratJalanId?: string;
    brand: string;
    produk: string;
    vendor: string;
    tanggalRetur?: string;
    alasanCacat: string;
    kategoriCacat: string;
    catatan?: string;
    qtyBreakdown: SizeBreakdown;
  }): Promise<{ success: boolean; message?: string }> => {
    const totalPcs =
      data.qtyBreakdown.s +
      data.qtyBreakdown.m +
      data.qtyBreakdown.l +
      data.qtyBreakdown.xl +
      data.qtyBreakdown.xxl +
      data.qtyBreakdown.anak4 +
      data.qtyBreakdown.anak6 +
      data.qtyBreakdown.anak8 +
      data.qtyBreakdown.anak10 +
      data.qtyBreakdown.anak12 +
      data.qtyBreakdown.anak14 +
      data.qtyBreakdown.anak16;

    if (totalPcs <= 0) {
      return { success: false, message: 'Jumlah barang retur harus lebih dari 0 pcs.' };
    }

    const today = new Date();
    const prefix = `RET-${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}`;
    const noRetur = `${prefix}-${String(returnList.length + 1).padStart(3, '0')}`;
    const tempId = `ret-${Date.now()}`;

    const matchedSpk = data.spkId ? spkList.find(s => s.id === data.spkId) : undefined;
    const matchedSj = data.suratJalanId ? suratJalanList.find(s => s.id === data.suratJalanId) : undefined;

    const newReturn: ReturnItem = {
      id: tempId,
      noRetur,
      sumber: data.sumber,
      spkId: data.spkId,
      suratJalanId: data.suratJalanId,
      brand: data.brand,
      produk: data.produk,
      vendor: data.vendor,
      tanggalRetur: data.tanggalRetur || new Date().toISOString().split('T')[0],
      alasanCacat: data.alasanCacat,
      kategoriCacat: data.kategoriCacat,
      catatan: data.catatan,
      status: 'DIAJUKAN',
      qtyBreakdown: data.qtyBreakdown,
      totalPcs,
      qtyReworked: 0,
      qtyRejectTotal: 0,
      spk: matchedSpk ? { spkNumber: matchedSpk.spkNumber } : undefined,
      suratJalan: matchedSj ? { noSuratJalan: matchedSj.noSuratJalan } : undefined,
    };

    setReturnList(prev => [newReturn, ...prev]);

    try {
      const { data: resData, error } = await apiCreateReturn({
        sumber: data.sumber,
        spkId: data.spkId,
        suratJalanId: data.suratJalanId,
        brand: data.brand,
        produk: data.produk,
        vendor: data.vendor,
        tanggalRetur: data.tanggalRetur,
        alasanCacat: data.alasanCacat,
        kategoriCacat: data.kategoriCacat,
        catatan: data.catatan,
        qtyS: data.qtyBreakdown.s,
        qtyM: data.qtyBreakdown.m,
        qtyL: data.qtyBreakdown.l,
        qtyXL: data.qtyBreakdown.xl,
        qtyXXL: data.qtyBreakdown.xxl,
        qtyAnak4: data.qtyBreakdown.anak4,
        qtyAnak6: data.qtyBreakdown.anak6,
        qtyAnak8: data.qtyBreakdown.anak8,
        qtyAnak10: data.qtyBreakdown.anak10,
        qtyAnak12: data.qtyBreakdown.anak12,
        qtyAnak14: data.qtyBreakdown.anak14,
        qtyAnak16: data.qtyBreakdown.anak16,
      });

      if (error) {
        console.warn('Backend return creation warning:', error);
      } else if (resData && resData.id) {
        setReturnList(prev => prev.map(r => (r.id === tempId ? { ...r, id: resData.id, noRetur: resData.noRetur } : r)));
      }
    } catch (err) {
      console.warn('Backend sync failed, saved locally:', err);
    }

    return { success: true };
  };

  const updateReturnStatus = async (
    id: string,
    data: {
      status: ReturnStatus;
      qtyReworked?: number;
      qtyRejectTotal?: number;
      catatan?: string;
    }
  ): Promise<{ success: boolean; message?: string }> => {
    setReturnList(prev =>
      prev.map(r => {
        if (r.id === id) {
          return {
            ...r,
            status: data.status,
            qtyReworked: data.qtyReworked !== undefined ? data.qtyReworked : r.qtyReworked,
            qtyRejectTotal: data.qtyRejectTotal !== undefined ? data.qtyRejectTotal : r.qtyRejectTotal,
            catatan: data.catatan !== undefined ? data.catatan : r.catatan,
            tanggalSelesai: data.status === 'SELESAI_REWORK' || data.status === 'REJECT_TOTAL' ? new Date().toISOString().split('T')[0] : r.tanggalSelesai,
          };
        }
        return r;
      })
    );

    try {
      await apiUpdateReturnStatus(id, data);
    } catch (err) {
      console.warn('Backend update return failed, updated locally:', err);
    }

    return { success: true };
  };

  const deleteReturn = async (id: string): Promise<{ success: boolean; message?: string }> => {
    setReturnList(prev => prev.filter(r => r.id !== id));
    try {
      await apiDeleteReturn(id);
    } catch (err) {
      console.warn('Backend delete return failed, deleted locally:', err);
    }
    return { success: true };
  };

  // ============================================================
  // Accessory & Trims (Non-Kain) Management Methods
  // ============================================================

  const addAccessory = async (item: Omit<AccessoryItem, 'id' | 'createdAt' | 'updatedAt'>) => {
    const tempId = 'aks-' + Date.now().toString(36);
    const newItem: AccessoryItem = {
      ...item,
      id: tempId,
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
    };
    setAccessories(prev => [newItem, ...prev]);

    try {
      const { data } = await apiCreateAccessory({
        sku: item.sku,
        name: item.name,
        category: item.category,
        brand: item.brand,
        unit: item.unit,
        stock: Number(item.stock),
        safetyStock: Number(item.safetyStock),
        location: item.location,
        costPerUnit: item.costPerUnit,
        notes: item.notes,
      });
      if (data?.id) {
        setAccessories(prev => prev.map(a => a.id === tempId ? { ...a, id: data.id } : a));
      }
    } catch (err) {
      console.warn('Backend create accessory failed, saved locally:', err);
    }
  };

  const updateAccessory = async (item: AccessoryItem) => {
    setAccessories(prev =>
      prev.map(a =>
        a.id === item.id
          ? { ...item, updatedAt: new Date().toISOString().split('T')[0] }
          : a
      )
    );

    try {
      await apiUpdateAccessory(item.id, {
        sku: item.sku,
        name: item.name,
        category: item.category,
        brand: item.brand,
        unit: item.unit,
        stock: Number(item.stock),
        safetyStock: Number(item.safetyStock),
        location: item.location,
        costPerUnit: item.costPerUnit,
        notes: item.notes,
      });
    } catch (err) {
      console.warn('Backend update accessory failed, updated locally:', err);
    }
  };

  const deleteAccessory = async (id: string) => {
    setAccessories(prev => prev.filter(a => a.id !== id));
    try {
      await apiDeleteAccessory(id);
    } catch (err) {
      console.warn('Backend delete accessory failed, deleted locally:', err);
    }
  };

  const recordStockIn = async (data: {
    accessoryId: string;
    quantity: number;
    date: string;
    sourceOrDestination?: string;
    recipientOrVendor?: string;
    notes?: string;
    costTotal?: number;
  }) => {
    const acc = accessories.find(a => a.id === data.accessoryId);
    if (!acc) return;

    const qty = Number(data.quantity);
    const newMutation: AccessoryMutation = {
      id: 'mut-' + Date.now().toString(36),
      accessoryId: acc.id,
      accessoryName: acc.name,
      sku: acc.sku,
      type: 'MASUK',
      quantity: qty,
      unit: acc.unit,
      date: data.date,
      sourceOrDestination: data.sourceOrDestination || 'Restock Pembelian',
      recipientOrVendor: data.recipientOrVendor,
      notes: data.notes,
      costTotal: data.costTotal,
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
    };

    setAccessoryMutations(prev => [newMutation, ...prev]);
    setAccessories(prev =>
      prev.map(a =>
        a.id === data.accessoryId
          ? { ...a, stock: a.stock + qty, updatedAt: new Date().toISOString().split('T')[0] }
          : a
      )
    );

    try {
      await apiRecordAccessoryMutation({
        accessoryId: acc.id,
        type: 'MASUK',
        quantity: qty,
        date: data.date,
        sourceOrDestination: data.sourceOrDestination,
        recipientOrVendor: data.recipientOrVendor,
        notes: data.notes,
        costTotal: data.costTotal,
      });
    } catch (err) {
      console.warn('Backend record stock in failed, saved locally:', err);
    }
  };

  const recordStockOut = async (data: {
    accessoryId: string;
    quantity: number;
    date: string;
    sourceOrDestination?: string;
    spkId?: string;
    recipientOrVendor?: string;
    notes?: string;
  }): Promise<{ success: boolean; message?: string }> => {
    const acc = accessories.find(a => a.id === data.accessoryId);
    if (!acc) return { success: false, message: 'Aksesoris tidak ditemukan.' };

    const qty = Number(data.quantity);
    if (acc.stock < qty) {
      return {
        success: false,
        message: `Stok tidak mencukupi! Stok saat ini ${acc.stock} ${acc.unit}, permintaan ${qty} ${acc.unit}.`,
      };
    }

    const spk = spkList.find(s => s.id === data.spkId);

    const newMutation: AccessoryMutation = {
      id: 'mut-' + Date.now().toString(36),
      accessoryId: acc.id,
      accessoryName: acc.name,
      sku: acc.sku,
      type: 'KELUAR',
      quantity: qty,
      unit: acc.unit,
      date: data.date,
      sourceOrDestination: data.sourceOrDestination || (spk ? `Alokasi SPK: ${spk.spkNumber}` : 'Pemakaian Produksi'),
      spkId: data.spkId,
      spkNumber: spk?.spkNumber,
      recipientOrVendor: data.recipientOrVendor,
      notes: data.notes,
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
    };

    setAccessoryMutations(prev => [newMutation, ...prev]);
    setAccessories(prev =>
      prev.map(a =>
        a.id === data.accessoryId
          ? { ...a, stock: Math.max(0, a.stock - qty), updatedAt: new Date().toISOString().split('T')[0] }
          : a
      )
    );

    try {
      await apiRecordAccessoryMutation({
        accessoryId: acc.id,
        type: 'KELUAR',
        quantity: qty,
        date: data.date,
        sourceOrDestination: data.sourceOrDestination,
        spkId: data.spkId,
        spkNumber: spk?.spkNumber,
        recipientOrVendor: data.recipientOrVendor,
        notes: data.notes,
      });
    } catch (err) {
      console.warn('Backend record stock out failed, saved locally:', err);
    }

    return { success: true };
  };

  const adjustStock = async (accessoryId: string, physicalCount: number, notes: string) => {
    const acc = accessories.find(a => a.id === accessoryId);
    if (!acc) return;

    const count = Number(physicalCount);
    const diff = count - acc.stock;

    const newMutation: AccessoryMutation = {
      id: 'mut-' + Date.now().toString(36),
      accessoryId: acc.id,
      accessoryName: acc.name,
      sku: acc.sku,
      type: 'PENYESUAIAN',
      quantity: Math.abs(diff),
      unit: acc.unit,
      date: new Date().toISOString().split('T')[0],
      sourceOrDestination: `Stock Opname (Selisih: ${diff >= 0 ? '+' : ''}${diff} ${acc.unit})`,
      notes: notes || `Penyesuaian stok fisik dari ${acc.stock} menjadi ${count}`,
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
    };

    setAccessoryMutations(prev => [newMutation, ...prev]);
    setAccessories(prev =>
      prev.map(a =>
        a.id === accessoryId
          ? { ...a, stock: count, updatedAt: new Date().toISOString().split('T')[0] }
          : a
      )
    );

    try {
      await apiRecordAccessoryMutation({
        accessoryId: acc.id,
        type: 'PENYESUAIAN',
        quantity: count,
        date: new Date().toISOString().split('T')[0],
        sourceOrDestination: `Stock Opname (Selisih: ${diff >= 0 ? '+' : ''}${diff} ${acc.unit})`,
        notes: notes || `Penyesuaian stok fisik dari ${acc.stock} menjadi ${count}`,
      });
    } catch (err) {
      console.warn('Backend adjust stock failed, saved locally:', err);
    }
  };

  const getArusKasSummary = (): ArusKasSummary[] => {
    return brands.map(brand => {
      const invoice = calculateBuyerInvoice(brand.name);
      const totalTagihan = invoice.grandTotal;
      const totalTerbayar = pembayaranList
        .filter(p => p.brand === brand.name)
        .reduce((acc, p) => acc + p.jumlah, 0);
      const selisih = totalTagihan - totalTerbayar;
      const outstanding = selisih > 0 ? selisih : 0;
      const lebihBayar = selisih < 0 ? Math.abs(selisih) : 0;
      const persentase = totalTagihan > 0
        ? Math.min(100, Math.round((totalTerbayar / totalTagihan) * 100))
        : (totalTerbayar > 0 ? 100 : 0);
      return { brand: brand.name, totalTagihan, totalTerbayar, outstanding, lebihBayar, persentase };
    });
  };

  const resetToDefaultData = () => {
    localStorage.clear();
    clearAllCache();
    window.location.reload();
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        login,
        loginAsPreset,
        logout,
        activeTab,
        setActiveTab,
        userRole,
        setUserRole,
        activeBrand,
        setActiveBrand,
        switchBrand,
        pendingBrands,
        fetchPendingBrands,
        registerBrand,
        approveBrandUser,
        rejectBrandUser,
        managedUsers,
        fetchManagedUsers,
        createManagedUser,
        updateManagedUser,
        deleteManagedUser,
        brandSKUs,
        brandSales,
        brandStockExits,
        fetchBrandInventoryData,
        createBrandSKU,
        updateBrandSKU,
        deleteBrandSKU,
        createBrandSale,
        deleteBrandSale,
        createBrandStockExit,
        deleteBrandStockExit,
        productionPOs,
        fetchProductionPOs,
        createProductionPO,
        updateProductionPO,
        updateProductionPOStatus,
        deleteProductionPO,
        pendingSpkPrefillFromPO,
        setPendingSpkPrefillFromPO,
        vendorFabricDeposits,
        fabricTransferNotes,
        createFabricTransfer,
        useVendorDeposit,
        returnDepositToWarehouse,
        deleteFabricDeposit,
        hppRecords,
        fobQuotations,
        fobMaterials,
        fobProducts,
        fobOrders,
        isLoadingFob,
        saveHppRecord,
        updateHppRecord,
        deleteHppRecord,
        saveFobQuotation,
        deleteFobQuotation,
        saveFobMaterial,
        deleteFobMaterial,
        saveFobProduct,
        deleteFobProduct,
        saveFobOrder,
        updateFobOrder,
        updateFobOrderStatus,
        deleteFobOrder,
        productionTimelines,
        saveProductionTimeline,
        updateProductionTimeline,
        deleteProductionTimeline,
        refreshFobData,
        isApprovalModalOpen,
        setIsApprovalModalOpen,
        syncFromBackend,
        isSidebarCollapsed,
        setIsSidebarCollapsed,
        toggleSidebar,
        isMobileMenuOpen,
        setIsMobileMenuOpen,
        toggleMobileMenu,
        brands,
        addBrand,
        updateBrand,
        deleteBrand,
        vendors,
        hargaKonveksi,
        hargaBuyer,
        addVendor,
        updateVendor,
        deleteVendor,
        addHargaKonveksi,
        updateHargaKonveksi,
        deleteHargaKonveksi,
        addHargaBuyer,
        updateHargaBuyer,
        deleteHargaBuyer,
        inboundRolls,
        addInboundRoll,
        updateInboundRollStatus,
        deleteInboundRoll,
        spkList,
        createSPK,
        updateSPK,
        deleteSPK,
        suratJalanList,
        createSuratJalan,
        updateSuratJalan,
        updateSuratJalanReceipt,
        deleteSuratJalan,
        getSuratJalanItems,
        returnList,
        createReturn,
        updateReturnStatus,
        deleteReturn,
        accessories,
        accessoryMutations,
        addAccessory,
        updateAccessory,
        deleteAccessory,
        recordStockIn,
        recordStockOut,
        adjustStock,
        kasbonList,
        addKasbon,
        pembayaranList,
        addPembayaran,
        updatePembayaran,
        deletePembayaran,
        getArusKasSummary,
        getVendorRate,
        getBuyerRates,
        getSPKRemainingQty,
        vendorSettlements,
        settleVendorPO,
        unsettleVendorPO,
        fobDeposits,
        addFobDeposit,
        updateFobDeposit,
        deleteFobDeposit,
        receiveFabricFromFobDeposit,
        calculateVendorPayroll,
        calculateBuyerInvoice,
        resetToDefaultData,
        isSyncing,
        lastSyncedAt,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
