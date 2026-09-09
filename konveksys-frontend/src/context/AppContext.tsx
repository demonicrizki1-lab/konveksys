import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
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
  apiDeletePembayaran,
  apiGetSpk,
  apiCreateSpk,
  apiDeleteSpk,
  apiGetSuratJalan,
  apiCreateSuratJalan,
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
  SPKCutting,
  SPKProductItem,
  SuratJalan,
  SuratJalanItem,
  KasbonTransaction,
  SizeBreakdown,
  VendorPayrollSummary,
  BuyerInvoiceSummary,
  PembayaranBrand,
  ArusKasSummary,
  ReturnItem,
  ReturnStatus,
  ReturnSource,
  AccessoryItem,
  AccessoryMutation,
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
} from '../data/initialData';
import { formatDateIndo } from '../utils/formatters';

export type ActiveTab = 'dashboard' | 'master-harga' | 'inbound' | 'spk' | 'outbound' | 'return' | 'finance' | 'arus-kas' | 'margin-analytics' | 'accessories' | 'barang-masuk' | 'manajemen-user';

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

  // Sidebar & Layout State
  isSidebarCollapsed: boolean;
  setIsSidebarCollapsed: (collapsed: boolean) => void;
  toggleSidebar: () => void;
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (open: boolean) => void;
  toggleMobileMenu: () => void;

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

  spkList: SPKCutting[];
  createSPK: (spk: Omit<SPKCutting, 'id' | 'spkNumber' | 'deliveredQty' | 'status'>) => Promise<void> | void;
  deleteSPK: (id: string) => Promise<{ success: boolean; message?: string }>;

  suratJalanList: SuratJalan[];
  createSuratJalan: (sj: Omit<SuratJalan, 'id' | 'noSuratJalan' | 'status'>) => Promise<{ success: boolean; message?: string }> | { success: boolean; message?: string };
  deleteSuratJalan: (id: string) => Promise<{ success: boolean; message?: string }>;
  getSuratJalanItems: (sj: SuratJalan) => SuratJalanItem[];

  kasbonList: KasbonTransaction[];
  addKasbon: (kasbon: Omit<KasbonTransaction, 'id'>) => void;

  // Arus Kas Brand
  pembayaranList: PembayaranBrand[];
  addPembayaran: (p: Omit<PembayaranBrand, 'id'>) => void;
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
  calculateVendorPayroll: (vendorName: string, startDate?: string, endDate?: string) => VendorPayrollSummary;
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

  // Persistence State
  const [brands, setBrands] = useState<Brand[]>(() => {
    const saved = localStorage.getItem('konvek_brands');
    if (!saved) return initialBrands;
    try {
      const parsed: Brand[] = JSON.parse(saved);
      return parsed.map(b => b.name === 'CREADIVE' ? { ...b, name: 'NAMI', code: 'NMI' } : b);
    } catch {
      return initialBrands;
    }
  });

  const [vendors, setVendors] = useState<Vendor[]>(() => {
    const saved = localStorage.getItem('konvek_vendors');
    return saved ? JSON.parse(saved) : [];
  });

  const [hargaKonveksi, setHargaKonveksi] = useState<HargaKonveksi[]>(() => {
    const saved = localStorage.getItem('konvek_harga_konveksi');
    if (!saved) return [];
    try {
      const parsed: HargaKonveksi[] = JSON.parse(saved);
      return parsed.map(h => h.brand === 'CREADIVE' ? { ...h, brand: 'NAMI' } : h);
    } catch {
      return [];
    }
  });

  const [hargaBuyer, setHargaBuyer] = useState<HargaBuyer[]>(() => {
    const saved = localStorage.getItem('konvek_harga_buyer');
    if (!saved) return [];
    try {
      const parsed: HargaBuyer[] = JSON.parse(saved);
      return parsed.map(h => h.brand === 'CREADIVE' ? { ...h, brand: 'NAMI' } : h);
    } catch {
      return [];
    }
  });

  const [inboundRolls, setInboundRolls] = useState<InboundRoll[]>(() => {
    const saved = localStorage.getItem('konvek_inbound_rolls');
    if (!saved) return [];
    try {
      const parsed: InboundRoll[] = JSON.parse(saved);
      return parsed.map(r => r.brand === 'CREADIVE' ? { ...r, brand: 'NAMI' } : r);
    } catch {
      return [];
    }
  });

  const [spkList, setSpkList] = useState<SPKCutting[]>(() => {
    const saved = localStorage.getItem('konvek_spk_list');
    if (!saved) return [];
    try {
      const parsed: SPKCutting[] = JSON.parse(saved);
      return parsed.map(s => s.brand === 'CREADIVE' ? { ...s, brand: 'NAMI' } : s);
    } catch {
      return [];
    }
  });

  const [suratJalanList, setSuratJalanList] = useState<SuratJalan[]>(() => {
    const saved = localStorage.getItem('konvek_surat_jalan');
    if (!saved) return [];
    try {
      const parsed: SuratJalan[] = JSON.parse(saved);
      return parsed.map(sj => sj.brand === 'CREADIVE' ? { ...sj, brand: 'NAMI' } : sj);
    } catch {
      return [];
    }
  });

  const [kasbonList, setKasbonList] = useState<KasbonTransaction[]>(() => {
    const saved = localStorage.getItem('konvek_kasbon');
    return saved ? JSON.parse(saved) : [];
  });

  const [pembayaranList, setPembayaranList] = useState<PembayaranBrand[]>(() => {
    const saved = localStorage.getItem('konvek_pembayaran');
    if (!saved) return [];
    try {
      const parsed: PembayaranBrand[] = JSON.parse(saved);
      return parsed.map(p => p.brand === 'CREADIVE' ? { ...p, brand: 'NAMI' } : p);
    } catch {
      return [];
    }
  });

  const [returnList, setReturnList] = useState<ReturnItem[]>(() => {
    const saved = localStorage.getItem('konvek_returns');
    return saved ? JSON.parse(saved) : initialReturnList;
  });

  const [accessories, setAccessories] = useState<AccessoryItem[]>(() => {
    const saved = localStorage.getItem('konvek_accessories');
    if (saved) {
      try {
        const parsed: AccessoryItem[] = JSON.parse(saved);
        // Filter out legacy dummy sample IDs (aks-001..010)
        return parsed.filter(item => !item.id.startsWith('aks-00') && !item.id.startsWith('aks-01'));
      } catch {
        return initialAccessories;
      }
    }
    return initialAccessories;
  });

  const [accessoryMutations, setAccessoryMutations] = useState<AccessoryMutation[]>(() => {
    const saved = localStorage.getItem('konvek_accessory_mutations');
    if (saved) {
      try {
        const parsed: AccessoryMutation[] = JSON.parse(saved);
        // Filter out legacy dummy sample mutation IDs (mut-001..005)
        return parsed.filter(m => !m.id.startsWith('mut-00'));
      } catch {
        return initialAccessoryMutations;
      }
    }
    return initialAccessoryMutations;
  });

  useEffect(() => {
    localStorage.setItem('konvek_accessories', JSON.stringify(accessories));
  }, [accessories]);

  useEffect(() => {
    localStorage.setItem('konvek_accessory_mutations', JSON.stringify(accessoryMutations));
  }, [accessoryMutations]);

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

  // Sync to Backend Database if token exists
  const syncFromBackend = useCallback(async () => {
    const token = getToken();
    if (!token) return;

    try {
      // 1. Fetch Brands
      const { data: bData } = await apiGetBrands();
      if (Array.isArray(bData)) {
        setBrands(bData.map(b => ({
          id: b.id,
          name: normalizeBrandName(b.name),
          code: normalizeBrandCode(b.name, b.code),
          contactPerson: b.contactPerson || '',
          phone: b.phone || '',
        })));
      }

      // 2. Fetch Vendors
      const { data: vData } = await apiGetVendors();
      if (Array.isArray(vData)) {
        setVendors(prev =>
          vData.map(v => {
            const existing = prev.find(p => p.name === v.name);
            return {
              id: v.id,
              name: v.name,
              specialty: v.specialty || '',
              contact: v.contact || '',
              currentKasbon: existing ? existing.currentKasbon : 0,
            };
          })
        );
      }

      // 3. Fetch Harga Konveksi
      const { data: hkData } = await apiGetHargaKonveksi();
      if (Array.isArray(hkData)) {
        setHargaKonveksi(hkData.map(hk => ({
          id: hk.id,
          vendor: hk.vendor,
          brand: normalizeBrandName(hk.brand),
          produk: hk.produk,
          harga: Number(hk.harga),
        })));
      }

      // 4. Fetch Harga Buyer
      const { data: hbData } = await apiGetHargaBuyer();
      if (Array.isArray(hbData)) {
        setHargaBuyer(hbData.map(hb => ({
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
        })));
      }

      // 5. Fetch Inbound Rolls
      const { data: rollData } = await apiGetInboundRolls();
      if (Array.isArray(rollData)) {
        setInboundRolls(rollData.map(r => ({
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
        })));
      }

      // 6. Fetch Kasbon
      const { data: ksbData } = await apiGetKasbon();
      if (Array.isArray(ksbData)) {
        setKasbonList(ksbData.map(k => ({
          id: k.id,
          vendor: k.vendor,
          tanggal: k.tanggal,
          jumlah: Number(k.jumlah),
          tipe: k.tipe === 'PELUNASAN' ? 'POTONGAN_GAJI' : 'PINJAMAN',
          keterangan: k.keterangan,
        })));
      }

      // 7. Fetch SPK
      const { data: spkData } = await apiGetSpk();
      if (Array.isArray(spkData)) {
        setSpkList(spkData.map((s: any) => ({
          id: s.id,
          spkNumber: s.spkNumber,
          brand: normalizeBrandName(s.brand),
          produk: s.produk,
          vendor: s.vendor,
          rollIds: s.rolsDigunakan ? s.rolsDigunakan.map((r: any) => r.rolId) : [],
          targetCutQty: {
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
          },
          deliveredQty: {
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
          },
          tanggalSPK: s.tanggalSPK,
          targetSelesai: s.targetSelesai || '',
          status: s.status,
          catatan: s.catatan || '',
        })));
      }

      // 8. Fetch Surat Jalan
      const { data: sjData } = await apiGetSuratJalan();
      if (Array.isArray(sjData)) {
        setSuratJalanList(sjData.map((sj: any) => ({
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
        })));
      }

      // 9. Fetch Pembayaran Brand
      const { data: payData } = await apiGetPembayaran();
      if (Array.isArray(payData)) {
        setPembayaranList(payData.map((p: any) => ({
          id: p.id,
          brand: normalizeBrandName(p.brand),
          tanggal: p.tanggal,
          jumlah: Number(p.jumlah),
          metode: p.metode,
          keterangan: p.keterangan || '',
          referensiNomor: p.referensiNomor || '',
        })));
      }

      // 10. Fetch Returns
      const { data: retData } = await apiGetReturns();
      if (Array.isArray(retData)) {
        setReturnList(retData.map((r: any) => ({
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
        })));
      }

      // 11. Fetch Accessories
      const { data: accData } = await apiGetAccessories();
      if (Array.isArray(accData)) {
        setAccessories(accData.map((a: any) => ({
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
        })));
      }

      // 12. Fetch Accessory Mutations
      const { data: mutData } = await apiGetAccessoryMutations();
      if (Array.isArray(mutData)) {
        setAccessoryMutations(mutData.map((m: any) => ({
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
        })));
      }

      // 13. Fetch Users (if Admin)
      try {
        const { data: userData } = await apiGetUsers();
        if (Array.isArray(userData)) {
          setManagedUsers(userData);
        }
      } catch {
        // Not admin or unauthenticated
      }
    } catch (err) {
      console.warn('[Sync Error] Continuing with cached data:', err);
    }
  }, []);

  // Run backend sync on startup or when currentUser changes
  useEffect(() => {
    if (currentUser) {
      syncFromBackend();
    }
  }, [currentUser, syncFromBackend]);

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem('konvek_brands', JSON.stringify(brands));
  }, [brands]);

  useEffect(() => {
    localStorage.setItem('konvek_returns', JSON.stringify(returnList));
  }, [returnList]);

  useEffect(() => {
    localStorage.setItem('konvek_vendors', JSON.stringify(vendors));
  }, [vendors]);

  useEffect(() => {
    localStorage.setItem('konvek_harga_konveksi', JSON.stringify(hargaKonveksi));
  }, [hargaKonveksi]);

  useEffect(() => {
    localStorage.setItem('konvek_harga_buyer', JSON.stringify(hargaBuyer));
  }, [hargaBuyer]);

  useEffect(() => {
    localStorage.setItem('konvek_inbound_rolls', JSON.stringify(inboundRolls));
  }, [inboundRolls]);

  useEffect(() => {
    localStorage.setItem('konvek_spk_list', JSON.stringify(spkList));
  }, [spkList]);

  useEffect(() => {
    localStorage.setItem('konvek_surat_jalan', JSON.stringify(suratJalanList));
  }, [suratJalanList]);

  useEffect(() => {
    localStorage.setItem('konvek_kasbon', JSON.stringify(kasbonList));
  }, [kasbonList]);

  useEffect(() => {
    localStorage.setItem('konvek_pembayaran', JSON.stringify(pembayaranList));
  }, [pembayaranList]);

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
    setActiveTab('dashboard');
  };

  // Master Brand Handlers
  const addBrand = async (brandData: Omit<Brand, 'id'>) => {
    const tempId = `b-${Date.now()}`;
    const newBrand: Brand = { ...brandData, id: tempId };
    setBrands(prev => [...prev, newBrand]);

    try {
      const { data } = await apiAddBrand(brandData);
      if (data) {
        setBrands(prev => prev.map(b => (b.id === tempId ? { ...b, id: data.id } : b)));
      }
    } catch (err) {
      console.warn('Backend sync addBrand failed:', err);
    }
  };

  const updateBrand = async (brand: Brand) => {
    setBrands(prev => prev.map(b => (b.id === brand.id ? brand : b)));
    try {
      await apiUpdateBrand(brand.id, {
        name: brand.name,
        code: brand.code,
        contactPerson: brand.contactPerson,
        phone: brand.phone,
      });
    } catch (err) {
      console.warn('Backend sync updateBrand failed:', err);
    }
  };

  const deleteBrand = async (id: string) => {
    setBrands(prev => prev.filter(b => b.id !== id));
    try {
      await apiDeleteBrand(id);
    } catch (err) {
      console.warn('Backend sync deleteBrand failed:', err);
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
    const tempId = `rol-${Date.now()}`;
    const newRoll: InboundRoll = { ...roll, id: tempId };
    setInboundRolls(prev => [newRoll, ...prev]);

    try {
      const { data } = await apiAddInboundRoll({
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
        setInboundRolls(prev => prev.map(r => (r.id === tempId ? {
          ...r,
          id: data.id,
          meterLength: Number(data.meterLength),
          meterUsed: Number(data.meterUsed || 0),
          hargaModalMeter: Number(data.hargaModalMeter),
        } : r)));
      }
    } catch (err) {
      console.warn('Backend sync failed, saved locally:', err);
    }
  };

  const updateInboundRollStatus = async (id: string, status: InboundRoll['status']) => {
    setInboundRolls(prev => prev.map(r => (r.id === id ? { ...r, status } : r)));
    try {
      await apiUpdateInboundStatus(id, status);
    } catch (err) {
      console.warn('Backend sync failed, updated locally:', err);
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

  // SPK Handlers
  const createSPK = async (spkData: Omit<SPKCutting, 'id' | 'spkNumber' | 'deliveredQty' | 'status'>) => {
    const spkNumber = `SPK-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(spkList.length + 1).padStart(2, '0')}`;
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

    // Update status of pooled rolls to DIPROSES
    setInboundRolls(prev =>
      prev.map(roll => {
        if (spkData.rollIds.includes(roll.id)) {
          return { ...roll, status: 'DIPROSES', meterUsed: roll.meterLength };
        }
        return roll;
      })
    );

    setSpkList(prev => [newSPK, ...prev]);

    try {
      const { data } = await apiCreateSpk({
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
        rollIds: spkData.rollIds,
      });

      if (data && (data as any).id) {
        const realId = (data as any).id;
        setSpkList(prev => prev.map(s => (s.id === tempId ? { ...s, id: realId } : s)));
      }
    } catch (err) {
      console.warn('Backend sync SPK failed, saved locally:', err);
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
      setInboundRolls(prev =>
        prev.map(r => {
          if (targetSpk.rollIds.includes(r.id)) {
            return { ...r, status: 'DI_GUDANG', meterUsed: 0 };
          }
          return r;
        })
      );
    }

    setSpkList(prev => prev.filter(s => s.id !== id));
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

        const newStatus: SPKCutting['status'] =
          targetTotal > 0 && newTotalDelivered > targetTotal
            ? 'OVER_DELIVERY'
            : newTotalDelivered === targetTotal
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

    const noSuratJalan = `SJ/${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}/${String(suratJalanList.length + 1).padStart(3, '0')}`;
    const tempId = `sj-${Date.now()}`;
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
      spkId: firstItem.spkId,
      spkItemId: firstItem.spkItemId,
      produk: itemsToProcess.map(i => i.produk).join(', '),
      vendor: Array.from(new Set(itemsToProcess.map(i => i.vendor))).join(', '),
      qtyDelivered: firstItem.qtyDelivered,
      jenisKain: itemsToProcess.map(i => i.jenisKain).filter(Boolean).join(', '),
    };

    setSuratJalanList(prev => [newSJ, ...prev]);

    try {
      const { data } = await apiCreateSuratJalan({
        noSuratJalan,
        spkId: firstItem.spkId,
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
        qtySML: firstItem.qtyDelivered.s + firstItem.qtyDelivered.m + firstItem.qtyDelivered.l,
        qtyM: firstItem.qtyDelivered.m,
        qtyL: firstItem.qtyDelivered.l,
        qtyXL: firstItem.qtyDelivered.xl,
        qtyXXL: firstItem.qtyDelivered.xxl,
        qtyAnak4: firstItem.qtyDelivered.anak4,
        qtyAnak6: firstItem.qtyDelivered.anak6,
        qtyAnak8: firstItem.qtyDelivered.anak8,
        qtyAnak10: firstItem.qtyDelivered.anak10,
        qtyAnak12: firstItem.qtyDelivered.anak12,
        qtyAnak14: firstItem.qtyDelivered.anak14,
        qtyAnak16: firstItem.qtyDelivered.anak16,
      });

      if (data && (data as any).id) {
        const realId = (data as any).id;
        setSuratJalanList(prev => prev.map(sj => (sj.id === tempId ? { ...sj, id: realId } : sj)));
      }
    } catch (err) {
      console.warn('Backend sync Surat Jalan failed, saved locally:', err);
    }

    return { success: true };
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
              const isTargetItem = item.spkItemId
                ? it.id === item.spkItemId
                : it.produk.trim().toUpperCase() === item.produk.trim().toUpperCase();

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
      }
      return updatedList;
    });

    setSuratJalanList(prev => prev.filter(sj => sj.id !== id));
    return { success: true, message: `Surat Jalan ${targetSJ.noSuratJalan} berhasil dihapus.` };
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
    let deliv: SizeBreakdown = spk.deliveredQty;

    if (spkItemId && spk.items && spk.items.length > 0) {
      const matchedItem = spk.items.find(it => it.id === spkItemId || it.produk.trim().toUpperCase() === spkItemId.trim().toUpperCase());
      if (matchedItem) {
        target = matchedItem.targetCutQty;
        deliv = matchedItem.deliveredQty || { s: 0, m: 0, l: 0, xl: 0, xxl: 0, anak4: 0, anak6: 0, anak8: 0, anak10: 0, anak12: 0, anak14: 0, anak16: 0 };
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

  // Payroll Calculation Engine
  const calculateVendorPayroll = (
    vendorName: string,
    startDate?: string,
    endDate?: string
  ): VendorPayrollSummary => {
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
    const items: VendorPayrollSummary['items'] = [];

    for (const sj of matchedSJs) {
      const sjItems = getSuratJalanItems(sj);
      for (const it of sjItems) {
        if (it.vendor === vendorName) {
          const rate = getVendorRate(it.vendor, it.produk, it.brand);
          const subtotal = it.totalPcs * rate;
          totalPcs += it.totalPcs;
          totalGrossPay += subtotal;

          items.push({
            suratJalanNo: sj.noSuratJalan,
            tanggal: sj.tanggal,
            produk: it.produk,
            jenisKain: it.jenisKain,
            brand: it.brand,
            pcs: it.totalPcs,
            rate,
            subtotal,
          });
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
      periodeAwal: startDate,
      periodeAkhir: endDate,
      periodeLabel,
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
      const matchBrand = sj.brand === brandName;
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
    setPembayaranList(prev => [newP, ...prev]);

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
        setPembayaranList(prev => prev.map(item => (item.id === tempId ? { ...item, id: data.id } : item)));
      }
    } catch (err) {
      console.warn('Backend sync failed, saved locally:', err);
    }
  };

  const deletePembayaran = async (id: string) => {
    setPembayaranList(prev => prev.filter(p => p.id !== id));
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
      const outstanding = Math.max(0, totalTagihan - totalTerbayar);
      const persentase = totalTagihan > 0 ? Math.min(100, Math.round((totalTerbayar / totalTagihan) * 100)) : 0;
      return { brand: brand.name, totalTagihan, totalTerbayar, outstanding, persentase };
    });
  };

  const resetToDefaultData = () => {
    localStorage.clear();
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
        isApprovalModalOpen,
        setIsApprovalModalOpen,
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
        deleteSPK,
        suratJalanList,
        createSuratJalan,
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
        deletePembayaran,
        getArusKasSummary,
        getVendorRate,
        getBuyerRates,
        getSPKRemainingQty,
        calculateVendorPayroll,
        calculateBuyerInvoice,
        resetToDefaultData,
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
