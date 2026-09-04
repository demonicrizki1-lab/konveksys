import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  apiLogin,
  saveToken,
  clearToken,
  getToken,
  apiGetBrands,
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
} from '../services/api';
import {
  AuthUser,
  PendingBrandUser,
  UserRole,
  Brand,
  Vendor,
  HargaKonveksi,
  HargaBuyer,
  InboundRoll,
  SPKCutting,
  SuratJalan,
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

export type ActiveTab = 'dashboard' | 'master-harga' | 'inbound' | 'spk' | 'outbound' | 'return' | 'finance' | 'arus-kas' | 'margin-analytics' | 'accessories';

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

  // Sidebar & Layout State
  isSidebarCollapsed: boolean;
  setIsSidebarCollapsed: (collapsed: boolean) => void;
  toggleSidebar: () => void;
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (open: boolean) => void;
  toggleMobileMenu: () => void;

  // Master Data
  brands: Brand[];
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
  }) => { success: boolean; message?: string };
  adjustStock: (accessoryId: string, physicalCount: number, notes: string) => void;

  // Helper Lookups & Calculation Engines
  getVendorRate: (vendor: string, produk: string, brand: string) => number;
  getBuyerRates: (brand: string, produk: string) => {
    rateSML: number;
    rateXL: number;
    rateAnak4: number;
    rateAnak6: number;
    rateAnak8: number;
    rateAnak10: number;
    rateAnak12: number;
    rateAnak14: number;
    rateAnak16: number;
  };
  getSPKRemainingQty: (spk: SPKCutting) => SizeBreakdown & { totalRemaining: number };
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
    return saved ? JSON.parse(saved) : initialBrands;
  });

  const [vendors, setVendors] = useState<Vendor[]>(() => {
    const saved = localStorage.getItem('konvek_vendors');
    return saved ? JSON.parse(saved) : [];
  });

  const [hargaKonveksi, setHargaKonveksi] = useState<HargaKonveksi[]>(() => {
    const saved = localStorage.getItem('konvek_harga_konveksi');
    return saved ? JSON.parse(saved) : [];
  });

  const [hargaBuyer, setHargaBuyer] = useState<HargaBuyer[]>(() => {
    const saved = localStorage.getItem('konvek_harga_buyer');
    return saved ? JSON.parse(saved) : [];
  });

  const [inboundRolls, setInboundRolls] = useState<InboundRoll[]>(() => {
    const saved = localStorage.getItem('konvek_inbound_rolls');
    return saved ? JSON.parse(saved) : [];
  });

  const [spkList, setSpkList] = useState<SPKCutting[]>(() => {
    const saved = localStorage.getItem('konvek_spk_list');
    return saved ? JSON.parse(saved) : [];
  });

  const [suratJalanList, setSuratJalanList] = useState<SuratJalan[]>(() => {
    const saved = localStorage.getItem('konvek_surat_jalan');
    return saved ? JSON.parse(saved) : [];
  });

  const [kasbonList, setKasbonList] = useState<KasbonTransaction[]>(() => {
    const saved = localStorage.getItem('konvek_kasbon');
    return saved ? JSON.parse(saved) : [];
  });

  const [pembayaranList, setPembayaranList] = useState<PembayaranBrand[]>(() => {
    const saved = localStorage.getItem('konvek_pembayaran');
    return saved ? JSON.parse(saved) : [];
  });

  const [returnList, setReturnList] = useState<ReturnItem[]>(() => {
    const saved = localStorage.getItem('konvek_returns');
    return saved ? JSON.parse(saved) : initialReturnList;
  });

  const [accessories, setAccessories] = useState<AccessoryItem[]>(() => {
    const saved = localStorage.getItem('konvek_accessories');
    return saved ? JSON.parse(saved) : initialAccessories;
  });

  const [accessoryMutations, setAccessoryMutations] = useState<AccessoryMutation[]>(() => {
    const saved = localStorage.getItem('konvek_accessory_mutations');
    return saved ? JSON.parse(saved) : initialAccessoryMutations;
  });

  useEffect(() => {
    localStorage.setItem('konvek_accessories', JSON.stringify(accessories));
  }, [accessories]);

  useEffect(() => {
    localStorage.setItem('konvek_accessory_mutations', JSON.stringify(accessoryMutations));
  }, [accessoryMutations]);

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
          name: b.name,
          code: b.code,
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
          brand: hk.brand,
          produk: hk.produk,
          harga: Number(hk.harga),
        })));
      }

      // 4. Fetch Harga Buyer
      const { data: hbData } = await apiGetHargaBuyer();
      if (Array.isArray(hbData)) {
        setHargaBuyer(hbData.map(hb => ({
          id: hb.id,
          brand: hb.brand,
          produk: hb.produk,
          rateSML: Number(hb.rateSML),
          rateXL: Number(hb.rateXL),
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
          brand: r.brand,
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
          brand: s.brand,
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
          spkId: sj.spkId,
          brand: sj.brand,
          produk: sj.produk,
          vendor: sj.vendor,
          tanggal: sj.tanggal,
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
          totalPcs: sj.totalPcs || 0,
          driverName: sj.driverName || '',
          nomorKendaraan: sj.nomorKendaraan || '',
          status: sj.status || 'DELIVERED',
          catatan: sj.catatan || '',
        })));
      }

      // 9. Fetch Pembayaran Brand
      const { data: payData } = await apiGetPembayaran();
      if (Array.isArray(payData)) {
        setPembayaranList(payData.map((p: any) => ({
          id: p.id,
          brand: p.brand,
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
          brand: r.brand,
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
      }
      return { success: true };
    } catch {
      return { success: false, message: 'Tidak dapat terhubung ke server.' };
    }
  };

  const loginAsPreset = (presetUser: AuthUser) => {
    setCurrentUser(presetUser);
    setUserRole(presetUser.role);
    if (presetUser.role === 'BRAND' && presetUser.brandName) {
      setActiveBrand(presetUser.brandName);
    }
    setActiveTab('dashboard');
  };

  const logout = () => {
    setCurrentUser(null);
    clearToken();
    localStorage.removeItem('konvek_auth_user');
    setActiveTab('dashboard');
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
          rateSML: Number(data.rateSML),
          rateXL: Number(data.rateXL),
          rateAnak4: Number(data.rateAnak4 || 0),
          rateAnak6: Number(data.rateAnak6 || 0),
          rateAnak8: Number(data.rateAnak8 || 0),
          rateAnak10: Number(data.rateAnak10 || 0),
          rateAnak12: Number(data.rateAnak12 || 0),
          rateAnak14: Number(data.rateAnak14 || 0),
          rateAnak16: Number(data.rateAnak16 || 0),
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
    const newSPK: SPKCutting = {
      ...spkData,
      id: tempId,
      spkNumber,
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

  // Surat Jalan Handlers (with strict Auto-Deduct logic)
  const createSuratJalan = async (sjData: Omit<SuratJalan, 'id' | 'noSuratJalan' | 'status'>): Promise<{ success: boolean; message?: string }> => {
    const targetSPK = spkList.find(s => s.id === sjData.spkId);
    if (!targetSPK) {
      return { success: false, message: 'SPK tidak ditemukan.' };
    }

    const deliv = sjData.qtyDelivered;

    const noSuratJalan = `SJ/${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}/${String(suratJalanList.length + 1).padStart(3, '0')}`;
    const tempId = `sj-${Date.now()}`;
    const newSJ: SuratJalan = {
      ...sjData,
      id: tempId,
      noSuratJalan,
      status: 'DELIVERED',
    };

    // Update SPK Delivered Quantities (mendukung over-delivery)
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

    setSpkList(prev =>
      prev.map(spk =>
        spk.id === targetSPK.id
          ? { ...spk, deliveredQty: updatedDelivered, status: newStatus }
          : spk
      )
    );

    setSuratJalanList(prev => [newSJ, ...prev]);

    try {
      const { data } = await apiCreateSuratJalan({
        noSuratJalan,
        spkId: targetSPK.id,
        brand: sjData.brand,
        produk: sjData.produk,
        vendor: sjData.vendor,
        tanggal: sjData.tanggal ? new Date(sjData.tanggal).toISOString() : new Date().toISOString(),
        driverName: sjData.driverName || '',
        nomorKendaraan: sjData.nomorKendaraan || '',
        catatan: sjData.catatan || '',
        status: 'DELIVERED',
        qtySML: deliv.s,
        qtyM: deliv.m,
        qtyL: deliv.l,
        qtyXL: deliv.xl,
        qtyXXL: deliv.xxl,
        qtyAnak4: deliv.anak4,
        qtyAnak6: deliv.anak6,
        qtyAnak8: deliv.anak8,
        qtyAnak10: deliv.anak10,
        qtyAnak12: deliv.anak12,
        qtyAnak14: deliv.anak14,
        qtyAnak16: deliv.anak16,
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
      const { data, error } = await apiDeleteSuratJalan(id);
      if (error) {
        return { success: false, message: error };
      }
    } catch (err) {
      console.warn('Backend delete Surat Jalan failed, removing locally:', err);
    }

    // Kembalikan kuantiti terkirim pada SPK terkait
    setSpkList(prev =>
      prev.map(spk => {
        if (spk.id === targetSJ.spkId) {
          const newDelivered: SizeBreakdown = {
            s: Math.max(0, spk.deliveredQty.s - targetSJ.qtyDelivered.s),
            m: Math.max(0, spk.deliveredQty.m - targetSJ.qtyDelivered.m),
            l: Math.max(0, spk.deliveredQty.l - targetSJ.qtyDelivered.l),
            xl: Math.max(0, spk.deliveredQty.xl - targetSJ.qtyDelivered.xl),
            xxl: Math.max(0, spk.deliveredQty.xxl - targetSJ.qtyDelivered.xxl),
            anak4: Math.max(0, spk.deliveredQty.anak4 - targetSJ.qtyDelivered.anak4),
            anak6: Math.max(0, spk.deliveredQty.anak6 - targetSJ.qtyDelivered.anak6),
            anak8: Math.max(0, spk.deliveredQty.anak8 - targetSJ.qtyDelivered.anak8),
            anak10: Math.max(0, spk.deliveredQty.anak10 - targetSJ.qtyDelivered.anak10),
            anak12: Math.max(0, spk.deliveredQty.anak12 - targetSJ.qtyDelivered.anak12),
            anak14: Math.max(0, spk.deliveredQty.anak14 - targetSJ.qtyDelivered.anak14),
            anak16: Math.max(0, spk.deliveredQty.anak16 - targetSJ.qtyDelivered.anak16),
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

          return {
            ...spk,
            deliveredQty: newDelivered,
            status: newStatus,
          };
        }
        return spk;
      })
    );

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
    return matched
      ? {
          rateSML: matched.rateSML,
          rateXL: matched.rateXL,
          rateAnak4: matched.rateAnak4,
          rateAnak6: matched.rateAnak6,
          rateAnak8: matched.rateAnak8,
          rateAnak10: matched.rateAnak10,
          rateAnak12: matched.rateAnak12,
          rateAnak14: matched.rateAnak14,
          rateAnak16: matched.rateAnak16,
        }
      : {
          rateSML: 45000,
          rateXL: 50000,
          rateAnak4: 35000,
          rateAnak6: 37000,
          rateAnak8: 39000,
          rateAnak10: 41000,
          rateAnak12: 43000,
          rateAnak14: 45000,
          rateAnak16: 47000,
        };
  };

  const getSPKRemainingQty = (spk: SPKCutting): SizeBreakdown & { totalRemaining: number } => {
    const s = Math.max(0, spk.targetCutQty.s - spk.deliveredQty.s);
    const m = Math.max(0, spk.targetCutQty.m - spk.deliveredQty.m);
    const l = Math.max(0, spk.targetCutQty.l - spk.deliveredQty.l);
    const xl = Math.max(0, spk.targetCutQty.xl - spk.deliveredQty.xl);
    const xxl = Math.max(0, spk.targetCutQty.xxl - spk.deliveredQty.xxl);
    const anak4 = Math.max(0, spk.targetCutQty.anak4 - spk.deliveredQty.anak4);
    const anak6 = Math.max(0, spk.targetCutQty.anak6 - spk.deliveredQty.anak6);
    const anak8 = Math.max(0, spk.targetCutQty.anak8 - spk.deliveredQty.anak8);
    const anak10 = Math.max(0, spk.targetCutQty.anak10 - spk.deliveredQty.anak10);
    const anak12 = Math.max(0, spk.targetCutQty.anak12 - spk.deliveredQty.anak12);
    const anak14 = Math.max(0, spk.targetCutQty.anak14 - spk.deliveredQty.anak14);
    const anak16 = Math.max(0, spk.targetCutQty.anak16 - spk.deliveredQty.anak16);
    const totalRemaining = s + m + l + xl + xxl + anak4 + anak6 + anak8 + anak10 + anak12 + anak14 + anak16;

    return { s, m, l, xl, xxl, anak4, anak6, anak8, anak10, anak12, anak14, anak16, totalRemaining };
  };

  // Payroll Calculation Engine
  const calculateVendorPayroll = (
    vendorName: string,
    startDate?: string,
    endDate?: string
  ): VendorPayrollSummary => {
    const vendorSJs = suratJalanList.filter(sj => {
      const matchVendor = sj.vendor === vendorName;
      if (!matchVendor) return false;
      const sjDate = sj.tanggal.split('T')[0];
      if (startDate && sjDate < startDate) return false;
      if (endDate && sjDate > endDate) return false;
      return true;
    });

    const vendorObj = vendors.find(v => v.name === vendorName);
    const kasbon = vendorObj ? vendorObj.currentKasbon : 0;

    let totalPcs = 0;
    let totalGrossPay = 0;

    const items = vendorSJs.map(sj => {
      const rate = getVendorRate(sj.vendor, sj.produk, sj.brand);
      const subtotal = sj.totalPcs * rate;
      totalPcs += sj.totalPcs;
      totalGrossPay += subtotal;

      return {
        suratJalanNo: sj.noSuratJalan,
        tanggal: sj.tanggal,
        produk: sj.produk,
        brand: sj.brand,
        pcs: sj.totalPcs,
        rate,
        subtotal,
      };
    });

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

    const items = brandSJs.map(sj => {
      const rates = getBuyerRates(sj.brand, sj.produk);
      const qtySML = sj.qtyDelivered.s + sj.qtyDelivered.m + sj.qtyDelivered.l;
      const qtyXL = sj.qtyDelivered.xl + sj.qtyDelivered.xxl;
      const qtyAnak4 = sj.qtyDelivered.anak4;
      const qtyAnak6 = sj.qtyDelivered.anak6;
      const qtyAnak8 = sj.qtyDelivered.anak8;
      const qtyAnak10 = sj.qtyDelivered.anak10;
      const qtyAnak12 = sj.qtyDelivered.anak12;
      const qtyAnak14 = sj.qtyDelivered.anak14;
      const qtyAnak16 = sj.qtyDelivered.anak16;

      const subSML = qtySML * rates.rateSML;
      const subXL = qtyXL * rates.rateXL;
      const subAnak4 = qtyAnak4 * rates.rateAnak4;
      const subAnak6 = qtyAnak6 * rates.rateAnak6;
      const subAnak8 = qtyAnak8 * rates.rateAnak8;
      const subAnak10 = qtyAnak10 * rates.rateAnak10;
      const subAnak12 = qtyAnak12 * rates.rateAnak12;
      const subAnak14 = qtyAnak14 * rates.rateAnak14;
      const subAnak16 = qtyAnak16 * rates.rateAnak16;

      const totalAmount = subSML + subXL + subAnak4 + subAnak6 + subAnak8 + subAnak10 + subAnak12 + subAnak14 + subAnak16;
      grandTotal += totalAmount;
      totalPcs += sj.totalPcs;

      return {
        suratJalanNo: sj.noSuratJalan,
        tanggal: sj.tanggal,
        produk: sj.produk,
        qtySML,
        rateSML: rates.rateSML,
        qtyXL,
        rateXL: rates.rateXL,
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
        totalPcs: sj.totalPcs,
        totalAmount,
      };
    });

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
      tanggal: endDate || now.toISOString().split('T')[0],
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

  const addAccessory = (item: Omit<AccessoryItem, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newId = 'aks-' + Date.now().toString(36);
    const newItem: AccessoryItem = {
      ...item,
      id: newId,
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
    };
    setAccessories(prev => [newItem, ...prev]);
  };

  const updateAccessory = (item: AccessoryItem) => {
    setAccessories(prev =>
      prev.map(a =>
        a.id === item.id
          ? { ...item, updatedAt: new Date().toISOString().split('T')[0] }
          : a
      )
    );
  };

  const deleteAccessory = (id: string) => {
    setAccessories(prev => prev.filter(a => a.id !== id));
  };

  const recordStockIn = (data: {
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
  };

  const recordStockOut = (data: {
    accessoryId: string;
    quantity: number;
    date: string;
    sourceOrDestination?: string;
    spkId?: string;
    recipientOrVendor?: string;
    notes?: string;
  }): { success: boolean; message?: string } => {
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

    return { success: true };
  };

  const adjustStock = (accessoryId: string, physicalCount: number, notes: string) => {
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
        isApprovalModalOpen,
        setIsApprovalModalOpen,
        isSidebarCollapsed,
        setIsSidebarCollapsed,
        toggleSidebar,
        isMobileMenuOpen,
        setIsMobileMenuOpen,
        toggleMobileMenu,
        brands,
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
