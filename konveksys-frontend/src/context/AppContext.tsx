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
  apiGetKasbon,
  apiAddKasbon,
  apiGetPembayaran,
  apiAddPembayaran,
  apiDeletePembayaran,
  apiGetSpk,
  apiCreateSpk,
  apiGetSuratJalan,
  apiCreateSuratJalan,
  apiAddVendor,
  apiUpdateVendor,
  apiDeleteVendor,
  apiRegisterBrand,
  apiGetPendingBrands,
  apiApproveBrand,
  apiRejectBrand,
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
} from '../data/initialData';

export type ActiveTab = 'dashboard' | 'master-harga' | 'inbound' | 'spk' | 'outbound' | 'finance' | 'arus-kas';

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

  spkList: SPKCutting[];
  createSPK: (spk: Omit<SPKCutting, 'id' | 'spkNumber' | 'deliveredQty' | 'status'>) => Promise<void> | void;

  suratJalanList: SuratJalan[];
  createSuratJalan: (sj: Omit<SuratJalan, 'id' | 'noSuratJalan' | 'status'>) => Promise<{ success: boolean; message?: string }> | { success: boolean; message?: string };

  kasbonList: KasbonTransaction[];
  addKasbon: (kasbon: Omit<KasbonTransaction, 'id'>) => void;

  // Arus Kas Brand
  pembayaranList: PembayaranBrand[];
  addPembayaran: (p: Omit<PembayaranBrand, 'id'>) => void;
  deletePembayaran: (id: string) => void;
  getArusKasSummary: () => ArusKasSummary[];

  // Helper Lookups & Calculation Engines
  getVendorRate: (vendor: string, produk: string, brand: string) => number;
  getBuyerRates: (brand: string, produk: string) => { rateSML: number; rateXL: number; rateAnak4_10: number; rateAnak12_16: number };
  getSPKRemainingQty: (spk: SPKCutting) => SizeBreakdown & { totalRemaining: number };
  calculateVendorPayroll: (vendorName: string) => VendorPayrollSummary;
  calculateBuyerInvoice: (brandName: string) => BuyerInvoiceSummary;
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
          rateAnak4_10: Number(hb.rateAnak4_10),
          rateAnak12_16: Number(hb.rateAnak12_16),
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
            anak4_10: s.targetAnak4_10 || 0,
            anak12_16: s.targetAnak12_16 || 0,
          },
          deliveredQty: {
            s: s.deliveredS || 0,
            m: s.deliveredM || 0,
            l: s.deliveredL || 0,
            xl: s.deliveredXL || 0,
            xxl: s.deliveredXXL || 0,
            anak4_10: s.deliveredAnak4_10 || 0,
            anak12_16: s.deliveredAnak12_16 || 0,
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
            anak4_10: sj.qtyAnak4_10 || 0,
            anak12_16: sj.qtyAnak12_16 || 0,
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
          rateAnak4_10: Number(data.rateAnak4_10),
          rateAnak12_16: Number(data.rateAnak12_16),
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

  // SPK Handlers
  const createSPK = async (spkData: Omit<SPKCutting, 'id' | 'spkNumber' | 'deliveredQty' | 'status'>) => {
    const spkNumber = `SPK-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(spkList.length + 1).padStart(2, '0')}`;
    const tempId = `spk-${Date.now()}`;
    const newSPK: SPKCutting = {
      ...spkData,
      id: tempId,
      spkNumber,
      deliveredQty: { s: 0, m: 0, l: 0, xl: 0, xxl: 0, anak4_10: 0, anak12_16: 0 },
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
        targetAnak4_10: spkData.targetCutQty.anak4_10 || 0,
        targetAnak12_16: spkData.targetCutQty.anak12_16 || 0,
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

  // Surat Jalan Handlers (with strict Auto-Deduct logic)
  const createSuratJalan = async (sjData: Omit<SuratJalan, 'id' | 'noSuratJalan' | 'status'>): Promise<{ success: boolean; message?: string }> => {
    const targetSPK = spkList.find(s => s.id === sjData.spkId);
    if (!targetSPK) {
      return { success: false, message: 'SPK tidak ditemukan.' };
    }

    // Auto-Deduct Validation: Check if sending more than remaining
    const remaining = getSPKRemainingQty(targetSPK);
    const deliv = sjData.qtyDelivered;

    if (
      deliv.s > remaining.s ||
      deliv.m > remaining.m ||
      deliv.l > remaining.l ||
      deliv.xl > remaining.xl ||
      deliv.xxl > remaining.xxl ||
      deliv.anak4_10 > remaining.anak4_10 ||
      deliv.anak12_16 > remaining.anak12_16
    ) {
      return {
        success: false,
        message: 'Gagal! Kuantitas pengiriman melebihi sisa hasil potong di konveksi (Anti Over-Delivery).',
      };
    }

    const noSuratJalan = `SJ/${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}/${String(suratJalanList.length + 1).padStart(3, '0')}`;
    const tempId = `sj-${Date.now()}`;
    const newSJ: SuratJalan = {
      ...sjData,
      id: tempId,
      noSuratJalan,
      status: 'DELIVERED',
    };

    // Update SPK Delivered Quantities
    const updatedDelivered: SizeBreakdown = {
      s: targetSPK.deliveredQty.s + deliv.s,
      m: targetSPK.deliveredQty.m + deliv.m,
      l: targetSPK.deliveredQty.l + deliv.l,
      xl: targetSPK.deliveredQty.xl + deliv.xl,
      xxl: targetSPK.deliveredQty.xxl + deliv.xxl,
      anak4_10: targetSPK.deliveredQty.anak4_10 + deliv.anak4_10,
      anak12_16: targetSPK.deliveredQty.anak12_16 + deliv.anak12_16,
    };

    const targetTotal = Object.values(targetSPK.targetCutQty).reduce((a, b) => a + b, 0);
    const newTotalDelivered = Object.values(updatedDelivered).reduce((a, b) => a + b, 0);

    const newStatus: SPKCutting['status'] =
      newTotalDelivered >= targetTotal ? 'COMPLETED' : 'PARTIAL_DELIVERED';

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
        qtyAnak4_10: deliv.anak4_10,
        qtyAnak12_16: deliv.anak12_16,
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
          rateAnak4_10: matched.rateAnak4_10,
          rateAnak12_16: matched.rateAnak12_16,
        }
      : { rateSML: 45000, rateXL: 50000, rateAnak4_10: 40000, rateAnak12_16: 45000 };
  };

  const getSPKRemainingQty = (spk: SPKCutting): SizeBreakdown & { totalRemaining: number } => {
    const s = Math.max(0, spk.targetCutQty.s - spk.deliveredQty.s);
    const m = Math.max(0, spk.targetCutQty.m - spk.deliveredQty.m);
    const l = Math.max(0, spk.targetCutQty.l - spk.deliveredQty.l);
    const xl = Math.max(0, spk.targetCutQty.xl - spk.deliveredQty.xl);
    const xxl = Math.max(0, spk.targetCutQty.xxl - spk.deliveredQty.xxl);
    const anak4_10 = Math.max(0, spk.targetCutQty.anak4_10 - spk.deliveredQty.anak4_10);
    const anak12_16 = Math.max(0, spk.targetCutQty.anak12_16 - spk.deliveredQty.anak12_16);
    const totalRemaining = s + m + l + xl + xxl + anak4_10 + anak12_16;

    return { s, m, l, xl, xxl, anak4_10, anak12_16, totalRemaining };
  };

  // Payroll Calculation Engine
  const calculateVendorPayroll = (vendorName: string): VendorPayrollSummary => {
    const vendorSJs = suratJalanList.filter(sj => sj.vendor === vendorName);
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

    return {
      vendor: vendorName,
      totalPcs,
      totalGrossPay,
      kasbonDeduction: kasbon,
      netPay,
      items,
    };
  };

  // Invoice Calculation Engine
  const calculateBuyerInvoice = (brandName: string): BuyerInvoiceSummary => {
    const brandSJs = suratJalanList.filter(sj => sj.brand === brandName);

    let grandTotal = 0;
    let totalPcs = 0;

    const items = brandSJs.map(sj => {
      const rates = getBuyerRates(sj.brand, sj.produk);
      const qtySML = sj.qtyDelivered.s + sj.qtyDelivered.m + sj.qtyDelivered.l;
      const qtyXL = sj.qtyDelivered.xl + sj.qtyDelivered.xxl;
      const qtyAnak4_10 = sj.qtyDelivered.anak4_10;
      const qtyAnak12_16 = sj.qtyDelivered.anak12_16;

      const subSML = qtySML * rates.rateSML;
      const subXL = qtyXL * rates.rateXL;
      const subAnak4_10 = qtyAnak4_10 * rates.rateAnak4_10;
      const subAnak12_16 = qtyAnak12_16 * rates.rateAnak12_16;

      const totalAmount = subSML + subXL + subAnak4_10 + subAnak12_16;
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
        qtyAnak4_10,
        rateAnak4_10: rates.rateAnak4_10,
        qtyAnak12_16,
        rateAnak12_16: rates.rateAnak12_16,
        totalPcs: sj.totalPcs,
        totalAmount,
      };
    });

    const invoiceNo = `INV/${brandName.toUpperCase()}/${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}/01`;

    return {
      brand: brandName,
      invoiceNo,
      tanggal: new Date().toISOString().split('T')[0],
      jatuhTempo: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
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
        spkList,
        createSPK,
        suratJalanList,
        createSuratJalan,
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
