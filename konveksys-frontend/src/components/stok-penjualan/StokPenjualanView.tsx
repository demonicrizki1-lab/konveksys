import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  BrandProductSKU,
  BrandSale,
  BrandStockExit,
  MarketplaceChannel,
  StockExitCategory,
} from '../../types';
import { formatDateIndo } from '../../utils/formatters';
import {
  ShoppingBag,
  Layers,
  TrendingUp,
  PackageMinus,
  Search,
  Plus,
  Edit2,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  X,
  SlidersHorizontal,
  Building2,
  Receipt,
  DollarSign,
  Store,
  RefreshCw,
  FileText,
  Zap,
  ClipboardList,
} from 'lucide-react';
import { RestockPOPrintModal } from './RestockPOPrintModal';

const MARKETPLACE_OPTIONS: { value: MarketplaceChannel; label: string; color: string }[] = [
  { value: 'SHOPEE', label: 'Shopee', color: 'bg-orange-100 text-orange-800 border-orange-200' },
  { value: 'TIKTOK', label: 'TikTok Shop', color: 'bg-slate-900 text-white border-slate-900' },
  { value: 'TOKOPEDIA', label: 'Tokopedia', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  { value: 'LAZADA', label: 'Lazada', color: 'bg-blue-100 text-blue-800 border-blue-200' },
  { value: 'OFFLINE', label: 'Toko Offline / Bazar', color: 'bg-amber-100 text-amber-800 border-amber-200' },
  { value: 'LAINNYA', label: 'Lainnya', color: 'bg-slate-100 text-slate-700 border-slate-200' },
];

const STOCK_EXIT_CATEGORIES: { value: StockExitCategory; label: string }[] = [
  { value: 'SAMPLE_FOTO', label: 'Sample / Foto Studio' },
  { value: 'ENDORSEMENT', label: 'Endorsement Selebgram' },
  { value: 'REJECT_RUSAK', label: 'Reject / Rusak Gudang' },
  { value: 'GIFT_BONUS', label: 'Gift / Bonus Customer' },
  { value: 'LAINNYA', label: 'Pengeluaran Lainnya' },
];

const formatRp = (num: number) => {
  return 'Rp ' + Math.round(num).toLocaleString('id-ID');
};

export const StokPenjualanView: React.FC = () => {
  const {
    userRole,
    activeBrand,
    brands,
    suratJalanList,
    getSuratJalanItems,
    brandSKUs,
    brandSales,
    brandStockExits,
    createBrandSKU,
    updateBrandSKU,
    deleteBrandSKU,
    createBrandSale,
    deleteBrandSale,
    createBrandStockExit,
    deleteBrandStockExit,
    fetchBrandInventoryData,
  } = useApp();

  // Selected Brand for querying (Brand users locked to activeBrand, Admin can switch)
  const [selectedBrand, setSelectedBrand] = useState<string>(
    userRole === 'BRAND' ? activeBrand : 'ALL'
  );

  const effectiveBrand = userRole === 'BRAND' ? activeBrand : selectedBrand;

  // Active Sub-Tab: 'database' | 'penjualan' | 'barang_keluar'
  const [activeTab, setActiveTab] = useState<'database' | 'penjualan' | 'barang_keluar'>('database');

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [stockStatusFilter, setStockStatusFilter] = useState<'ALL' | 'CRITICAL' | 'READY'>('ALL');
  const [marketplaceFilter, setMarketplaceFilter] = useState<string>('ALL');

  // Toast State
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Modals State
  const [isAddSKUModalOpen, setIsAddSKUModalOpen] = useState(false);
  const [isEditSKUModalOpen, setIsEditSKUModalOpen] = useState(false);
  const [skuToEdit, setSkuToEdit] = useState<BrandProductSKU | null>(null);
  const [deleteSKUConfirm, setDeleteSKUConfirm] = useState<BrandProductSKU | null>(null);

  const [isAddSaleModalOpen, setIsAddSaleModalOpen] = useState(false);
  const [deleteSaleConfirm, setDeleteSaleConfirm] = useState<BrandSale | null>(null);

  const [isAddExitModalOpen, setIsAddExitModalOpen] = useState(false);
  const [deleteExitConfirm, setDeleteExitConfirm] = useState<BrandStockExit | null>(null);

  // PO Restock Modal & Selection State (Admin Workflow)
  const [selectedSKUIds, setSelectedSKUIds] = useState<string[]>([]);
  const [isPOModalOpen, setIsPOModalOpen] = useState(false);
  const [customPOSKUList, setCustomPOSKUList] = useState<{ sku: BrandProductSKU; currentStock: number }[] | null>(null);

  // SKU Form State
  const [skuForm, setSkuForm] = useState({
    brand: '',
    produk: '',
    warna: '',
    ukuran: '',
    sku: '',
    hpp: 0,
    stokAwal: 0,
    catatan: '',
  });

  // Sale Form State
  const [saleForm, setSaleForm] = useState({
    tanggal: new Date().toISOString().split('T')[0],
    marketplace: 'SHOPEE' as MarketplaceChannel,
    toko: '',
    noPesanan: '',
    username: '',
    sku: '',
    qty: 1,
    hpp: 0,
    omset: 0,
    biayaIklan: 0,
    biayaOperasional: 0,
    catatan: '',
  });

  // Stock Exit Form State
  const [exitForm, setExitForm] = useState({
    tanggal: new Date().toISOString().split('T')[0],
    sku: '',
    qty: 1,
    kategori: 'SAMPLE_FOTO' as StockExitCategory,
    keterangan: '',
  });

  const showToast = (type: 'success' | 'error', text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchBrandInventoryData(effectiveBrand);
    setIsRefreshing(false);
    showToast('success', 'Data stok & penjualan diperbarui.');
  };

  // 1. Calculate Inbound Received Qty from Surat Jalan per Brand & Product/Size
  const receivedFromSJMap = useMemo(() => {
    const map: Record<string, number> = {};

    const filteredSJs = suratJalanList.filter(sj => {
      if (effectiveBrand !== 'ALL' && sj.brand !== effectiveBrand) return false;
      return true;
    });

    filteredSJs.forEach(sj => {
      const items = getSuratJalanItems(sj);
      items.forEach(item => {
        const prod = (item.produk || '').trim().toUpperCase();
        const breakdown = item.qtyDelivered || {};

        Object.entries(breakdown).forEach(([sizeKey, count]) => {
          const qty = Number(count) || 0;
          if (qty > 0) {
            const sizeLabel = sizeKey.toUpperCase();
            // Map keys
            const key1 = `${prod}|${sizeLabel}`;
            map[key1] = (map[key1] || 0) + qty;
          }
        });

        // Also map by total if size is not specified
        if (item.totalPcs && (!item.qtyDelivered || Object.values(item.qtyDelivered).every(v => !v))) {
          map[prod] = (map[prod] || 0) + item.totalPcs;
        }
      });
    });

    return map;
  }, [suratJalanList, getSuratJalanItems, effectiveBrand]);

  // 2. Aggregate Sales Qty per SKU
  const salesQtyMap = useMemo(() => {
    const map: Record<string, { qty: number; omsetTotal: number; hppTotal: number }> = {};
    brandSales.forEach(sale => {
      if (effectiveBrand !== 'ALL' && sale.brand !== effectiveBrand) return;
      const skuKey = sale.sku.trim().toUpperCase();
      if (!map[skuKey]) {
        map[skuKey] = { qty: 0, omsetTotal: 0, hppTotal: 0 };
      }
      map[skuKey].qty += sale.qty;
      map[skuKey].omsetTotal += Number(sale.omset || 0);
      map[skuKey].hppTotal += Number(sale.hpp || 0) * sale.qty;
    });
    return map;
  }, [brandSales, effectiveBrand]);

  // 3. Aggregate Stock Exits Qty per SKU
  const stockExitsQtyMap = useMemo(() => {
    const map: Record<string, number> = {};
    brandStockExits.forEach(exit => {
      if (effectiveBrand !== 'ALL' && exit.brand !== effectiveBrand) return;
      const skuKey = exit.sku.trim().toUpperCase();
      map[skuKey] = (map[skuKey] || 0) + exit.qty;
    });
    return map;
  }, [brandStockExits, effectiveBrand]);

  // 4. Compute Live Stock Items (The "DATA BASE" Sheet View)
  const computedStockItems = useMemo(() => {
    return brandSKUs
      .filter(sku => effectiveBrand === 'ALL' || sku.brand === effectiveBrand)
      .map(sku => {
        const skuKey = sku.sku.trim().toUpperCase();
        const prod = sku.produk.trim().toUpperCase();
        const sizeKey = (sku.ukuran || '').trim().toUpperCase();

        // Calculate Barang Masuk: match by exact prod|size or fallback to prod
        let barangMasuk = 0;
        if (sizeKey) {
          barangMasuk = receivedFromSJMap[`${prod}|${sizeKey}`] || 0;
        }
        if (!barangMasuk) {
          barangMasuk = receivedFromSJMap[prod] || 0;
        }

        const terjual = salesQtyMap[skuKey]?.qty || 0;
        const keluar = stockExitsQtyMap[skuKey] || 0;
        const stokAwal = Number(sku.stokAwal || 0);

        // FORMULA PERSIS SPREADSHEET: Sisa Qty = Stok Awal + Masuk - Terjual - Keluar
        const sisaQty = stokAwal + barangMasuk - terjual - keluar;
        const nilaiInventory = sisaQty * Number(sku.hpp || 0);

        return {
          sku,
          produk: sku.produk,
          skuCode: sku.sku,
          warna: sku.warna || '',
          ukuran: sku.ukuran || '',
          hpp: Number(sku.hpp || 0),
          stokAwal,
          barangMasuk,
          terjual,
          keluar,
          sisaQty,
          nilaiInventory,
          isCritical: sisaQty <= 0,
          isLow: sisaQty > 0 && sisaQty < 5,
        };
      });
  }, [brandSKUs, effectiveBrand, receivedFromSJMap, salesQtyMap, stockExitsQtyMap]);

  // Filtered Stock Items
  const filteredStockItems = useMemo(() => {
    return computedStockItems.filter(item => {
      const matchSearch =
        item.produk.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.skuCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.warna.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.ukuran.toLowerCase().includes(searchTerm.toLowerCase());

      const matchStatus =
        stockStatusFilter === 'ALL' ||
        (stockStatusFilter === 'CRITICAL' && (item.isCritical || item.isLow)) ||
        (stockStatusFilter === 'READY' && !item.isCritical && !item.isLow);

      return matchSearch && matchStatus;
    });
  }, [computedStockItems, searchTerm, stockStatusFilter]);

  // Summary Metrics
  const summaryMetrics = useMemo(() => {
    const totalSKU = computedStockItems.length;
    const totalQtyReady = computedStockItems.reduce((acc, i) => acc + Math.max(0, i.sisaQty), 0);
    const totalNilaiInventory = computedStockItems.reduce((acc, i) => acc + (i.sisaQty > 0 ? i.nilaiInventory : 0), 0);
    const totalCriticalSKUs = computedStockItems.filter(i => i.isCritical).length;

    // Sales Metrics
    const relevantSales = brandSales.filter(s => effectiveBrand === 'ALL' || s.brand === effectiveBrand);
    const totalOmset = relevantSales.reduce((acc, s) => acc + Number(s.omset || 0), 0);
    const totalPcsTerjual = relevantSales.reduce((acc, s) => acc + Number(s.qty || 1), 0);
    const totalProfit = relevantSales.reduce((acc, s) => acc + Number(s.estimasiProfit || 0), 0);

    return {
      totalSKU,
      totalQtyReady,
      totalNilaiInventory,
      totalCriticalSKUs,
      totalOmset,
      totalPcsTerjual,
      totalProfit,
    };
  }, [computedStockItems, brandSales, effectiveBrand]);

  // Selection Handlers for PO Restock (Admin)
  const toggleSelectSKU = (skuId: string) => {
    setSelectedSKUIds(prev =>
      prev.includes(skuId) ? prev.filter(id => id !== skuId) : [...prev, skuId]
    );
  };

  const handleSelectAllFilteredSKUs = () => {
    if (selectedSKUIds.length === filteredStockItems.length) {
      setSelectedSKUIds([]);
    } else {
      setSelectedSKUIds(filteredStockItems.map(i => i.sku.id));
    }
  };

  const handleSelectCriticalSKUs = () => {
    const criticalIds = computedStockItems
      .filter(i => i.isCritical || i.isLow)
      .map(i => i.sku.id);
    setSelectedSKUIds(criticalIds);
    if (criticalIds.length === 0) {
      showToast('error', 'Tidak ada SKU berstatus habis atau kritis saat ini.');
    } else {
      showToast('success', `${criticalIds.length} SKU berstatus habis / kritis berhasil dipilih.`);
    }
  };

  const handleClearSelection = () => {
    setSelectedSKUIds([]);
  };

  const handleOpenPOModal = (specificItems?: { sku: BrandProductSKU; currentStock: number }[]) => {
    if (specificItems && specificItems.length > 0) {
      setCustomPOSKUList(specificItems);
      setIsPOModalOpen(true);
      return;
    }

    if (selectedSKUIds.length > 0) {
      const selected = computedStockItems
        .filter(i => selectedSKUIds.includes(i.sku.id))
        .map(i => ({ sku: i.sku, currentStock: i.sisaQty }));
      setCustomPOSKUList(selected);
      setIsPOModalOpen(true);
      return;
    }

    // Default: auto select critical items
    const critical = computedStockItems
      .filter(i => i.isCritical || i.isLow)
      .map(i => ({ sku: i.sku, currentStock: i.sisaQty }));
    if (critical.length > 0) {
      setCustomPOSKUList(critical);
      setIsPOModalOpen(true);
      return;
    }

    // If no critical, load all filtered items
    if (filteredStockItems.length > 0) {
      setCustomPOSKUList(filteredStockItems.map(i => ({ sku: i.sku, currentStock: i.sisaQty })));
      setIsPOModalOpen(true);
      return;
    }

    showToast('error', 'Belum ada data SKU untuk dibuatkan list PO.');
  };

  // Open Add SKU Modal helper
  const handleOpenAddSKU = () => {
    setSkuForm({
      brand: selectedBrand !== 'ALL' ? selectedBrand : (brands[0]?.name || 'GREYWOLF'),
      produk: '',
      warna: '',
      ukuran: '',
      sku: '',
      hpp: 0,
      stokAwal: 0,
      catatan: '',
    });
    setIsAddSKUModalOpen(true);
  };

  // Form Submit: Create SKU
  const handleCreateSKUSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!skuForm.produk.trim() || !skuForm.sku.trim() || !skuForm.hpp) {
      showToast('error', 'Nama produk, SKU, dan HPP wajib diisi!');
      return;
    }

    const targetBrand = userRole === 'ADMIN'
      ? (skuForm.brand || (selectedBrand !== 'ALL' ? selectedBrand : (brands[0]?.name || 'GREYWOLF')))
      : activeBrand;

    setIsSubmitting(true);
    const res = await createBrandSKU({
      brand: targetBrand,
      produk: skuForm.produk.trim().toUpperCase(),
      warna: skuForm.warna.trim() || undefined,
      ukuran: skuForm.ukuran.trim() || undefined,
      sku: skuForm.sku.trim().toUpperCase(),
      hpp: Number(skuForm.hpp),
      stokAwal: Number(skuForm.stokAwal || 0),
      catatan: skuForm.catatan.trim() || undefined,
    });
    setIsSubmitting(false);

    if (res.success) {
      showToast('success', res.message);
      setIsAddSKUModalOpen(false);
      setSkuForm({ brand: '', produk: '', warna: '', ukuran: '', sku: '', hpp: 0, stokAwal: 0, catatan: '' });
    } else {
      showToast('error', res.message);
    }
  };

  // Form Submit: Update SKU
  const handleUpdateSKUSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!skuToEdit) return;

    setIsSubmitting(true);
    const res = await updateBrandSKU(skuToEdit.id, {
      produk: skuForm.produk.trim().toUpperCase(),
      warna: skuForm.warna.trim() || undefined,
      ukuran: skuForm.ukuran.trim() || undefined,
      sku: skuForm.sku.trim().toUpperCase(),
      hpp: Number(skuForm.hpp),
      stokAwal: Number(skuForm.stokAwal || 0),
      catatan: skuForm.catatan.trim() || undefined,
    });
    setIsSubmitting(false);

    if (res.success) {
      showToast('success', res.message);
      setIsEditSKUModalOpen(false);
      setSkuToEdit(null);
    } else {
      showToast('error', res.message);
    }
  };

  const handleOpenEditSKU = (item: BrandProductSKU) => {
    setSkuToEdit(item);
    setSkuForm({
      brand: item.brand,
      produk: item.produk,
      warna: item.warna || '',
      ukuran: item.ukuran || '',
      sku: item.sku,
      hpp: Number(item.hpp),
      stokAwal: Number(item.stokAwal || 0),
      catatan: item.catatan || '',
    });
    setIsEditSKUModalOpen(true);
  };

  // Auto generate SKU recommendation when typing product, color, and size
  const handleSKUFieldChange = (field: 'produk' | 'warna' | 'ukuran', val: string) => {
    const updated = { ...skuForm, [field]: val };
    const parts = [updated.produk, updated.warna, updated.ukuran]
      .map(p => p.trim().replace(/\s+/g, '-').toUpperCase())
      .filter(Boolean);
    updated.sku = parts.join('-');
    setSkuForm(updated);
  };

  // Form Submit: Create Sale
  const handleCreateSaleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!saleForm.sku || !saleForm.qty || saleForm.omset === undefined) {
      showToast('error', 'SKU, Qty, dan Omset wajib diisi!');
      return;
    }

    const targetBrand = effectiveBrand === 'ALL' ? (brands[0]?.name || 'GREYWOLF') : effectiveBrand;

    setIsSubmitting(true);
    const res = await createBrandSale({
      brand: targetBrand,
      tanggal: saleForm.tanggal,
      marketplace: saleForm.marketplace,
      toko: saleForm.toko.trim() || undefined,
      noPesanan: saleForm.noPesanan.trim() || undefined,
      username: saleForm.username.trim() || undefined,
      sku: saleForm.sku.trim().toUpperCase(),
      qty: Number(saleForm.qty),
      hpp: Number(saleForm.hpp),
      omset: Number(saleForm.omset),
      biayaIklan: Number(saleForm.biayaIklan || 0),
      biayaOperasional: Number(saleForm.biayaOperasional || 0),
      catatan: saleForm.catatan.trim() || undefined,
    });
    setIsSubmitting(false);

    if (res.success) {
      showToast('success', res.message);
      setIsAddSaleModalOpen(false);
      setSaleForm({
        tanggal: new Date().toISOString().split('T')[0],
        marketplace: 'SHOPEE',
        toko: '',
        noPesanan: '',
        username: '',
        sku: '',
        qty: 1,
        hpp: 0,
        omset: 0,
        biayaIklan: 0,
        biayaOperasional: 0,
        catatan: '',
      });
    } else {
      showToast('error', res.message);
    }
  };

  // When SKU is selected in Sale Form, auto-populate HPP
  const handleSelectSKUForSale = (skuCode: string) => {
    const found = brandSKUs.find(s => s.sku.toUpperCase() === skuCode.toUpperCase());
    const hpp = found ? Number(found.hpp) : 0;
    setSaleForm(prev => ({ ...prev, sku: skuCode, hpp }));
  };

  // Form Submit: Create Stock Exit
  const handleCreateExitSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!exitForm.sku || !exitForm.qty) {
      showToast('error', 'SKU dan Qty wajib diisi!');
      return;
    }

    const targetBrand = effectiveBrand === 'ALL' ? (brands[0]?.name || 'GREYWOLF') : effectiveBrand;

    setIsSubmitting(true);
    const res = await createBrandStockExit({
      brand: targetBrand,
      tanggal: exitForm.tanggal,
      sku: exitForm.sku.trim().toUpperCase(),
      qty: Number(exitForm.qty),
      kategori: exitForm.kategori,
      keterangan: exitForm.keterangan.trim() || undefined,
    });
    setIsSubmitting(false);

    if (res.success) {
      showToast('success', res.message);
      setIsAddExitModalOpen(false);
      setExitForm({
        tanggal: new Date().toISOString().split('T')[0],
        sku: '',
        qty: 1,
        kategori: 'SAMPLE_FOTO',
        keterangan: '',
      });
    } else {
      showToast('error', res.message);
    }
  };

  return (
    <div className="space-y-5 pb-12">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border text-sm font-medium transition-all transform animate-in slide-in-from-top-3 ${
            toastMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200 shadow-emerald-500/10'
              : 'bg-rose-50 text-rose-800 border-rose-200 shadow-rose-500/10'
          }`}
        >
          {toastMessage.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0" />
          )}
          <span>{toastMessage.text}</span>
          <button onClick={() => setToastMessage(null)} className="ml-2 text-slate-400 hover:text-slate-600 transition">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header Card (Clean White Aesthetic) */}
      <div className="bg-white rounded-xl p-6 sm:p-7 border border-slate-200 shadow-sm space-y-5">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          <div className="space-y-1.5 flex-1 min-w-0">
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-lg border border-indigo-100">
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>INVENTORI & ORDER MARKETPLACE</span>
            </div>
            <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2.5">
              <span>Stok & Penjualan Brand</span>
              {effectiveBrand !== 'ALL' && (
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 border border-indigo-200">
                  {effectiveBrand}
                </span>
              )}
            </h1>
            <p className="text-slate-500 text-xs mt-1 max-w-2xl">
              Pusat kendali stok live per SKU, integrasi barang masuk dari Surat Jalan konveksi, pencatatan order Shopee/TikTok,
              serta pemantauan sisa inventori secara otomatis.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0 justify-start xl:justify-end">
            {/* Admin Brand Selector */}
            {userRole === 'ADMIN' && (
              <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-2 rounded-lg">
                <Building2 className="w-4 h-4 text-slate-400 shrink-0" />
                <select
                  value={selectedBrand}
                  onChange={e => setSelectedBrand(e.target.value)}
                  className="text-xs font-bold bg-transparent text-indigo-700 focus:outline-none cursor-pointer"
                >
                  <option value="ALL">Semua Brand Mitra</option>
                  {brands.map(b => (
                    <option key={b.id} value={b.name}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-200 transition active:scale-95 disabled:opacity-50 cursor-pointer"
              title="Perbarui / Sinkronkan data inventori"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>Sinkronkan</span>
            </button>

            {activeTab === 'database' && (
              <div className="flex items-center gap-2">
                {userRole === 'ADMIN' && (
                  <button
                    onClick={() => handleOpenPOModal()}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-sm transition active:scale-95 cursor-pointer shrink-0"
                    title="Buat Dokumen PO Restock Konveksi (PDF)"
                  >
                    <FileText className="w-4 h-4" />
                    <span>Buat List PO (PDF)</span>
                  </button>
                )}
                <button
                  onClick={handleOpenAddSKU}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm transition active:scale-95 cursor-pointer shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambah SKU Baru</span>
                </button>
              </div>
            )}

            {activeTab === 'penjualan' && userRole === 'BRAND' && (
              <button
                onClick={() => setIsAddSaleModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm transition active:scale-95 cursor-pointer shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Catat Pesanan Marketplace</span>
              </button>
            )}

            {activeTab === 'barang_keluar' && userRole === 'BRAND' && (
              <button
                onClick={() => setIsAddExitModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm transition active:scale-95 cursor-pointer shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Catat Barang Keluar / Sample</span>
              </button>
            )}
          </div>
        </div>

        {/* Quick KPI Counters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-3 border-t border-slate-100">
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Total Model SKU</span>
              <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Layers className="w-4.5 h-4.5" />
              </div>
            </div>
            <div className="text-2xl font-bold text-slate-900 mt-0.5">
              {summaryMetrics.totalSKU} <span className="text-sm font-semibold text-slate-500">SKU</span>
            </div>
            <p className="text-xs text-slate-400">Terdaftar dalam database</p>
          </div>

          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Stok Fisik Ready</span>
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 className="w-4.5 h-4.5" />
              </div>
            </div>
            <div className="text-2xl font-bold text-slate-900 mt-0.5">
              {summaryMetrics.totalQtyReady.toLocaleString('id-ID')} <span className="text-sm font-semibold text-slate-500">Pcs</span>
            </div>
            <p className="text-xs text-slate-400">Siap dikirim ke pembeli</p>
          </div>

          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Nilai Aset Inventory</span>
              <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <DollarSign className="w-4.5 h-4.5" />
              </div>
            </div>
            <div className="text-2xl font-bold text-slate-900 mt-0.5">
              {formatRp(summaryMetrics.totalNilaiInventory)}
            </div>
            <p className="text-xs text-slate-400">Berdasarkan HPP produk</p>
          </div>

          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">SKU Habis / Kritis</span>
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${summaryMetrics.totalCriticalSKUs > 0 ? 'bg-rose-50 text-rose-600' : 'bg-slate-100 text-slate-400'}`}>
                <AlertTriangle className="w-4.5 h-4.5" />
              </div>
            </div>
            <div className={`text-2xl font-bold mt-0.5 ${summaryMetrics.totalCriticalSKUs > 0 ? 'text-rose-700' : 'text-slate-900'}`}>
              {summaryMetrics.totalCriticalSKUs} <span className="text-sm font-semibold text-slate-500">SKU</span>
            </div>
            <p className="text-xs text-slate-400">Perlu repeat order potong baru</p>
          </div>
        </div>
      </div>

      {/* Main Navigation Tabs (Compact & Clean) */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setActiveTab('database')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
            activeTab === 'database'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>{userRole === 'ADMIN' ? 'Database Stok & PO Restock' : 'Database Stok Live'}</span>
          <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${activeTab === 'database' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'}`}>
            {computedStockItems.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('penjualan')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
            activeTab === 'penjualan'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5" />
          <span>{userRole === 'ADMIN' ? 'Log Penjualan Brand (Audit)' : 'Penjualan Marketplace'}</span>
          <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${activeTab === 'penjualan' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'}`}>
            {brandSales.filter(s => effectiveBrand === 'ALL' || s.brand === effectiveBrand).length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('barang_keluar')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
            activeTab === 'barang_keluar'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <PackageMinus className="w-3.5 h-3.5" />
          <span>{userRole === 'ADMIN' ? 'Log Mutasi & Sample (Audit)' : 'Barang Keluar & Sample'}</span>
          <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${activeTab === 'barang_keluar' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'}`}>
            {brandStockExits.filter(e => effectiveBrand === 'ALL' || e.brand === effectiveBrand).length}
          </span>
        </button>
      </div>

      {/* ============================================================ */}
      {/* TAB 1: DATABASE STOK LIVE (Persis Sheet DATA BASE) */}
      {/* ============================================================ */}
      {activeTab === 'database' && (
        <div className="space-y-4">
          {/* Filters & Action Bar */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
            <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Cari nama produk, SKU, varian warna, atau size..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
                />
                {searchTerm && (
                  <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
                <div className="flex items-center gap-1 text-xs text-slate-500 font-medium shrink-0">
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  <span>Filter:</span>
                </div>
                <select
                  value={stockStatusFilter}
                  onChange={e => setStockStatusFilter(e.target.value as any)}
                  className="text-xs py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
                >
                  <option value="ALL">Semua Status Stok</option>
                  <option value="CRITICAL">🔴 Stok Habis / Kritis (≤ 5 pcs)</option>
                  <option value="READY">🟢 Stok Aman (&gt; 5 pcs)</option>
                </select>

                <button
                  onClick={handleOpenAddSKU}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm transition active:scale-95 shrink-0 cursor-pointer ml-auto sm:ml-0"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambah SKU</span>
                </button>
              </div>
            </div>

            {/* PO RESTOCK ACTION BAR (FOR ADMIN) */}
            {userRole === 'ADMIN' && (
              <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2.5 border-t border-slate-100 text-xs">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Aksi Restock PO:</span>
                  
                  <button
                    onClick={handleSelectCriticalSKUs}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold border border-rose-200 transition text-[11px] cursor-pointer"
                    title="Pilih semua SKU yang berstatus habis atau kritis"
                  >
                    <Zap className="w-3 h-3 text-rose-600" />
                    <span>Pilih Semua SKU Kritis ({summaryMetrics.totalCriticalSKUs})</span>
                  </button>

                  <button
                    onClick={handleSelectAllFilteredSKUs}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium border border-slate-200 transition text-[11px] cursor-pointer"
                  >
                    <span>Pilih Semua Hasil ({filteredStockItems.length})</span>
                  </button>

                  {selectedSKUIds.length > 0 && (
                    <button
                      onClick={handleClearSelection}
                      className="text-[11px] text-slate-400 hover:text-slate-600 underline cursor-pointer ml-1"
                    >
                      Batal Pilih ({selectedSKUIds.length})
                    </button>
                  )}
                </div>

                <button
                  onClick={() => handleOpenPOModal()}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-sm transition active:scale-95 cursor-pointer ml-auto"
                  title="Buka form cetak Purchase Order / Surat Perintah Potong ke Konveksi"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>
                    {selectedSKUIds.length > 0
                      ? `Buat List PO Konveksi (${selectedSKUIds.length} SKU Dipilih)`
                      : 'Buat List PO Restock (PDF)'}
                  </span>
                </button>
              </div>
            )}
          </div>

          {/* Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/90 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    {userRole === 'ADMIN' && (
                      <th className="py-2.5 px-2 w-10 text-center">
                        <input
                          type="checkbox"
                          checked={filteredStockItems.length > 0 && selectedSKUIds.length === filteredStockItems.length}
                          onChange={handleSelectAllFilteredSKUs}
                          className="rounded text-indigo-600 focus:ring-indigo-500/20 cursor-pointer"
                          title="Pilih / Batalkan semua hasil filter"
                        />
                      </th>
                    )}
                    <th className="py-2.5 px-3 w-12 text-center">No</th>
                    <th className="py-2.5 px-3">Produk</th>
                    <th className="py-2.5 px-3">SKU</th>
                    <th className="py-2.5 px-3 text-right">HPP</th>
                    <th className="py-2.5 px-3 text-center">Sisa Qty</th>
                    <th className="py-2.5 px-3 text-right">Nilai Inventory</th>
                    <th className="py-2.5 px-3 text-center">Barang Masuk (SJ)</th>
                    <th className="py-2.5 px-3 text-center">Penjualan</th>
                    <th className="py-2.5 px-3 text-center">Keluar / Sample</th>
                    <th className="py-2.5 px-3 text-center">Stok Awal</th>
                    <th className="py-2.5 px-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                  {filteredStockItems.length === 0 ? (
                    <tr>
                      <td colSpan={userRole === 'ADMIN' ? 12 : 11} className="py-12 text-center text-slate-400">
                        <ShoppingBag className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                        <p className="font-semibold text-slate-600 text-sm">Belum ada data SKU produk.</p>
                        <p className="text-xs text-slate-400 mt-1">Klik "+ Tambah SKU Baru" untuk mendaftarkan master produk & stok awal.</p>
                        <button
                          onClick={handleOpenAddSKU}
                          className="mt-3.5 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm transition active:scale-95 cursor-pointer"
                        >
                          <Plus className="w-4 h-4" />
                          <span>Tambah SKU Baru</span>
                        </button>
                      </td>
                    </tr>
                  ) : (
                    filteredStockItems.map((item, idx) => {
                      return (
                        <tr
                          key={item.sku.id}
                          className={`hover:bg-slate-50/80 transition ${
                            selectedSKUIds.includes(item.sku.id)
                              ? 'bg-indigo-50/40'
                              : item.isCritical
                              ? 'bg-rose-50/40'
                              : item.isLow
                              ? 'bg-amber-50/30'
                              : ''
                          }`}
                        >
                          {userRole === 'ADMIN' && (
                            <td className="py-2.5 px-2 text-center">
                              <input
                                type="checkbox"
                                checked={selectedSKUIds.includes(item.sku.id)}
                                onChange={() => toggleSelectSKU(item.sku.id)}
                                className="rounded text-indigo-600 focus:ring-indigo-500/20 cursor-pointer"
                              />
                            </td>
                          )}
                          <td className="py-2.5 px-3 text-center text-slate-400">{idx + 1}</td>
                          <td className="py-2.5 px-3 font-semibold text-slate-900">{item.produk}</td>
                          <td className="py-2.5 px-3 font-mono font-semibold text-indigo-600">{item.skuCode}</td>
                          <td className="py-2.5 px-3 text-right font-mono text-slate-600">{formatRp(item.hpp)}</td>

                          {/* SISA QTY (HIGHLIGHT WARNA PERSIS GOOGLE SHEETS) */}
                          <td className="py-2.5 px-3 text-center">
                            <span
                              className={`inline-block px-2.5 py-1 rounded-md font-bold text-[10px] ${
                                item.isCritical
                                  ? 'bg-rose-600 text-white shadow-sm'
                                  : item.isLow
                                  ? 'bg-amber-400 text-amber-950 shadow-sm'
                                  : 'bg-emerald-100 text-emerald-800'
                              }`}
                            >
                              {item.sisaQty}
                            </span>
                          </td>

                          {/* Nilai Inventory */}
                          <td className="py-2.5 px-3 text-right font-bold font-mono text-slate-900">
                            {formatRp(item.nilaiInventory)}
                          </td>

                          {/* Barang Masuk (Kuning) */}
                          <td className="py-2.5 px-3 text-center font-bold text-amber-700 bg-amber-50/40">
                            +{item.barangMasuk}
                          </td>

                          {/* Penjualan (Hijau) */}
                          <td className="py-2.5 px-3 text-center font-bold text-emerald-700 bg-emerald-50/40">
                            {item.terjual > 0 ? `-${item.terjual}` : 0}
                          </td>

                          {/* Keluar / Sample (Biru) */}
                          <td className="py-2.5 px-3 text-center font-bold text-blue-700 bg-blue-50/40">
                            {item.keluar > 0 ? `-${item.keluar}` : 0}
                          </td>

                          {/* Stok Awal */}
                          <td className="py-2.5 px-3 text-center font-mono text-slate-500">{item.stokAwal}</td>

                          {/* Actions */}
                          <td className="py-2.5 px-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              {userRole === 'ADMIN' && (
                                <button
                                  onClick={() => handleOpenPOModal([{ sku: item.sku, currentStock: item.sisaQty }])}
                                  title="Buat List PO Restock untuk SKU ini"
                                  className="p-1.5 rounded-lg border border-amber-200 text-amber-700 bg-amber-50 hover:bg-amber-100 transition cursor-pointer"
                                >
                                  <FileText className="w-3.5 h-3.5" />
                                </button>
                              )}
                              <button
                                onClick={() => handleOpenEditSKU(item.sku)}
                                title="Edit SKU"
                                className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 transition cursor-pointer"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setDeleteSKUConfirm(item.sku)}
                                title="Hapus SKU"
                                className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* TAB 2: PENJUALAN MARKETPLACE (Persis Sheet PENJUALAN) */}
      {/* ============================================================ */}
      {activeTab === 'penjualan' && (
        <div className="space-y-4">
          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Total Omset Penjualan</span>
                <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <DollarSign className="w-4.5 h-4.5" />
                </div>
              </div>
              <div className="text-2xl font-bold text-slate-900 mt-0.5">{formatRp(summaryMetrics.totalOmset)}</div>
              <p className="text-xs text-slate-400">Akumulasi penjualan marketplace</p>
            </div>

            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Total Terjual</span>
                <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                  <ShoppingBag className="w-4.5 h-4.5" />
                </div>
              </div>
              <div className="text-2xl font-bold text-slate-900 mt-0.5">
                {summaryMetrics.totalPcsTerjual.toLocaleString('id-ID')} <span className="text-sm font-semibold text-slate-500">Pcs</span>
              </div>
              <p className="text-xs text-slate-400">Produk berhasil terkirim ke customer</p>
            </div>

            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Estimasi Profit Bersih Toko</span>
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <TrendingUp className="w-4.5 h-4.5" />
                </div>
              </div>
              <div className="text-2xl font-bold text-emerald-700 mt-0.5">{formatRp(summaryMetrics.totalProfit)}</div>
              <p className="text-xs text-slate-400">Setelah dikurangi HPP, Ads, & Packing</p>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-medium text-slate-500">Filter Channel:</span>
              <button
                onClick={() => setMarketplaceFilter('ALL')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  marketplaceFilter === 'ALL' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Semua
              </button>
              {MARKETPLACE_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setMarketplaceFilter(opt.value)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                    marketplaceFilter === opt.value ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {userRole === 'BRAND' ? (
              <button
                onClick={() => setIsAddSaleModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm transition cursor-pointer shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>+ Input Pesanan Marketplace</span>
              </button>
            ) : (
              <div className="text-[11px] text-slate-500 italic bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 shrink-0">
                Mode Audit Transparan: Log pesanan diinput oleh akun Brand mitra
              </div>
            )}
          </div>

          {/* Sales Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/90 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-3">Tanggal</th>
                    <th className="py-3 px-3">Marketplace & Toko</th>
                    <th className="py-3 px-3">No. Pesanan & Pembeli</th>
                    <th className="py-3 px-3">SKU Produk</th>
                    <th className="py-3 px-3 text-center">Qty</th>
                    <th className="py-3 px-3 text-right">HPP Penjualan</th>
                    <th className="py-3 px-3 text-right">Omset</th>
                    <th className="py-3 px-3 text-right">Iklan & Ops</th>
                    <th className="py-3 px-3 text-right font-bold text-indigo-900">Estimasi Profit</th>
                    <th className="py-3 px-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {brandSales
                    .filter(s => effectiveBrand === 'ALL' || s.brand === effectiveBrand)
                    .filter(s => marketplaceFilter === 'ALL' || s.marketplace === marketplaceFilter).length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-12 text-center text-slate-400">
                        <TrendingUp className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                        <p className="font-semibold text-slate-600 text-sm">Belum ada transaksi penjualan dicatat.</p>
                        <p className="text-xs text-slate-400 mt-1">Klik "+ Input Pesanan Marketplace" untuk mencatat order baru.</p>
                      </td>
                    </tr>
                  ) : (
                    brandSales
                      .filter(s => effectiveBrand === 'ALL' || s.brand === effectiveBrand)
                      .filter(s => marketplaceFilter === 'ALL' || s.marketplace === marketplaceFilter)
                      .map(sale => {
                        const mpOpt = MARKETPLACE_OPTIONS.find(o => o.value === sale.marketplace);
                        const isProfit = Number(sale.estimasiProfit || 0) >= 0;

                        return (
                          <tr key={sale.id} className="hover:bg-slate-50/70 transition">
                            <td className="py-2.5 px-3 text-slate-600 whitespace-nowrap">
                              {sale.tanggal ? formatDateIndo(String(sale.tanggal).split('T')[0]) : '-'}
                            </td>
                            <td className="py-2.5 px-3">
                              <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border ${mpOpt?.color || 'bg-slate-100 text-slate-700'}`}>
                                {mpOpt?.label || sale.marketplace}
                              </span>
                              {sale.toko && <div className="text-[11px] text-slate-500 font-medium mt-0.5">{sale.toko}</div>}
                            </td>
                            <td className="py-2.5 px-3 font-mono">
                              <div className="font-semibold text-slate-900">{sale.noPesanan || '-'}</div>
                              {sale.username && <div className="text-[11px] text-slate-400">@{sale.username}</div>}
                            </td>
                            <td className="py-2.5 px-3 font-mono font-bold text-slate-800">{sale.sku}</td>
                            <td className="py-2.5 px-3 text-center font-bold">{sale.qty}</td>
                            <td className="py-2.5 px-3 text-right font-mono text-slate-600">
                              {formatRp(Number(sale.hpp) * sale.qty)}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                              {formatRp(Number(sale.omset))}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono text-slate-500">
                              {formatRp(Number(sale.biayaIklan || 0) + Number(sale.biayaOperasional || 0))}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono font-bold">
                              <span className={`px-2 py-0.5 rounded ${isProfit ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                                {formatRp(Number(sale.estimasiProfit))}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-right">
                              <button
                                onClick={() => setDeleteSaleConfirm(sale)}
                                title="Hapus transaksi"
                                className="p-1.5 rounded-lg border border-slate-200 text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        );
                      })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* TAB 3: BARANG KELUAR & SAMPLE (Persis Sheet BARANG KELUAR) */}
      {/* ============================================================ */}
      {activeTab === 'barang_keluar' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div className="text-xs text-slate-600">
              Pencatatan pengeluaran stok non-penjualan seperti <span className="font-semibold text-slate-800">Sample Foto, Endorsement, Rusak/Reject,</span> dan hadiah promosi.
            </div>
            {userRole === 'BRAND' ? (
              <button
                onClick={() => setIsAddExitModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm transition shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>+ Catat Barang Keluar</span>
              </button>
            ) : (
              <div className="text-[11px] text-slate-500 italic bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 shrink-0">
                Mode Audit Transparan: Log mutasi diinput oleh brand mitra
              </div>
            )}
          </div>

          {/* Exits Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/90 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-4">Tanggal</th>
                    <th className="py-3 px-4">SKU Produk</th>
                    <th className="py-3 px-4 text-center">Jumlah (Qty)</th>
                    <th className="py-3 px-4">Kategori Pengeluaran</th>
                    <th className="py-3 px-4">Keterangan / Tujuan</th>
                    <th className="py-3 px-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {brandStockExits.filter(e => effectiveBrand === 'ALL' || e.brand === effectiveBrand).length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400">
                        <PackageMinus className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                        <p className="font-semibold text-slate-600 text-sm">Belum ada catatan pengeluaran stok.</p>
                      </td>
                    </tr>
                  ) : (
                    brandStockExits
                      .filter(e => effectiveBrand === 'ALL' || e.brand === effectiveBrand)
                      .map(exit => {
                        const katOpt = STOCK_EXIT_CATEGORIES.find(k => k.value === exit.kategori);

                        return (
                          <tr key={exit.id} className="hover:bg-slate-50/70 transition">
                            <td className="py-3 px-4 text-slate-600">
                              {exit.tanggal ? formatDateIndo(String(exit.tanggal).split('T')[0]) : '-'}
                            </td>
                            <td className="py-3 px-4 font-mono font-bold text-slate-900">{exit.sku}</td>
                            <td className="py-3 px-4 text-center font-bold text-rose-600">-{exit.qty} Pcs</td>
                            <td className="py-3 px-4">
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 border border-slate-200 text-slate-700">
                                {katOpt?.label || exit.kategori}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-slate-600">{exit.keterangan || <span className="text-slate-400 italic">-</span>}</td>
                            <td className="py-3 px-4 text-right">
                              <button
                                onClick={() => setDeleteExitConfirm(exit)}
                                title="Hapus catatan"
                                className="p-1.5 rounded-lg border border-slate-200 text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        );
                      })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL: TAMBAH SKU BARU */}
      {/* ============================================================ */}
      {isAddSKUModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-bold text-slate-900">Tambah Master SKU & Stok Awal</h3>
              </div>
              <button onClick={() => setIsAddSKUModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSKUSubmit} className="p-6 space-y-4">
              {/* Brand Selector for Admin */}
              {userRole === 'ADMIN' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Brand Mitra *</label>
                  <div className="relative">
                    <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                    <select
                      value={skuForm.brand || (selectedBrand !== 'ALL' ? selectedBrand : brands[0]?.name)}
                      onChange={e => setSkuForm({ ...skuForm, brand: e.target.value })}
                      className="w-full pl-9 pr-3.5 py-2 text-xs font-bold border border-slate-200 rounded-lg text-indigo-700 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
                    >
                      {brands.map(b => (
                        <option key={b.id} value={b.name}>
                          {b.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Model Produk *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: MOIRA, GOLDIE, BEDAH PANJANG"
                  value={skuForm.produk}
                  onChange={e => handleSKUFieldChange('produk', e.target.value)}
                  className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg uppercase font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Varian Warna / Motif</label>
                  <input
                    type="text"
                    placeholder="Contoh: SAGE, PINK, MOCCA"
                    value={skuForm.warna}
                    onChange={e => handleSKUFieldChange('warna', e.target.value)}
                    className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg uppercase"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Ukuran / Size</label>
                  <input
                    type="text"
                    placeholder="Contoh: 10-TAHUN, L, XL"
                    value={skuForm.ukuran}
                    onChange={e => handleSKUFieldChange('ukuran', e.target.value)}
                    className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg uppercase"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Kode SKU Lengkap *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: MOIRA-SAGE-10-TAHUN"
                  value={skuForm.sku}
                  onChange={e => setSkuForm({ ...skuForm, sku: e.target.value.toUpperCase() })}
                  className="w-full px-3.5 py-2 text-sm border border-indigo-200 rounded-lg uppercase font-mono font-bold text-indigo-700 bg-indigo-50/40"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">HPP per Pcs (Rp) *</label>
                  <input
                    type="number"
                    required
                    min={0}
                    placeholder="55000"
                    value={skuForm.hpp || ''}
                    onChange={e => setSkuForm({ ...skuForm, hpp: Number(e.target.value) })}
                    className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Stok Awal Fisik (Pcs)</label>
                  <input
                    type="number"
                    min={0}
                    placeholder="0"
                    value={skuForm.stokAwal}
                    onChange={e => setSkuForm({ ...skuForm, stokAwal: Number(e.target.value) })}
                    className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Catatan Tambahan</label>
                <input
                  type="text"
                  placeholder="Opsional..."
                  value={skuForm.catatan}
                  onChange={e => setSkuForm({ ...skuForm, catatan: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddSKUModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow transition disabled:opacity-50"
                >
                  {isSubmitting ? 'Menyimpan...' : 'Simpan SKU'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL: EDIT SKU */}
      {/* ============================================================ */}
      {isEditSKUModalOpen && skuToEdit && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-bold text-slate-900">Edit Data SKU</h3>
              </div>
              <button onClick={() => setIsEditSKUModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateSKUSubmit} className="p-6 space-y-4">
              {/* Brand Info */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Brand Mitra</label>
                <div className="flex items-center gap-2 px-3.5 py-2 text-xs font-bold border border-slate-200 rounded-lg text-indigo-700 bg-slate-50">
                  <Building2 className="w-4 h-4 text-slate-400" />
                  <span>{skuToEdit.brand}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Model Produk *</label>
                <input
                  type="text"
                  required
                  value={skuForm.produk}
                  onChange={e => setSkuForm({ ...skuForm, produk: e.target.value.toUpperCase() })}
                  className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg uppercase font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Varian Warna / Motif</label>
                  <input
                    type="text"
                    value={skuForm.warna}
                    onChange={e => setSkuForm({ ...skuForm, warna: e.target.value.toUpperCase() })}
                    className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg uppercase"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Ukuran / Size</label>
                  <input
                    type="text"
                    value={skuForm.ukuran}
                    onChange={e => setSkuForm({ ...skuForm, ukuran: e.target.value.toUpperCase() })}
                    className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg uppercase"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Kode SKU Lengkap *</label>
                <input
                  type="text"
                  required
                  value={skuForm.sku}
                  onChange={e => setSkuForm({ ...skuForm, sku: e.target.value.toUpperCase() })}
                  className="w-full px-3.5 py-2 text-sm border border-indigo-200 rounded-lg uppercase font-mono font-bold text-indigo-700 bg-indigo-50/40"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">HPP per Pcs (Rp) *</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={skuForm.hpp || ''}
                    onChange={e => setSkuForm({ ...skuForm, hpp: Number(e.target.value) })}
                    className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Stok Awal Fisik (Pcs)</label>
                  <input
                    type="number"
                    min={0}
                    value={skuForm.stokAwal}
                    onChange={e => setSkuForm({ ...skuForm, stokAwal: Number(e.target.value) })}
                    className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg font-mono"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditSKUModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow transition disabled:opacity-50"
                >
                  {isSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL: INPUT PENJUALAN MARKETPLACE */}
      {/* ============================================================ */}
      {isAddSaleModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <Store className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-bold text-slate-900">Catat Pesanan Marketplace Baru</h3>
              </div>
              <button onClick={() => setIsAddSaleModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSaleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Tanggal Pesanan *</label>
                  <input
                    type="date"
                    required
                    value={saleForm.tanggal}
                    onChange={e => setSaleForm({ ...saleForm, tanggal: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Marketplace / Saluran *</label>
                  <select
                    value={saleForm.marketplace}
                    onChange={e => setSaleForm({ ...saleForm, marketplace: e.target.value as any })}
                    className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg font-bold text-slate-800"
                  >
                    {MARKETPLACE_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Toko</label>
                  <input
                    type="text"
                    placeholder="Contoh: JENAKA KIDS"
                    value={saleForm.toko}
                    onChange={e => setSaleForm({ ...saleForm, toko: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">No. Pesanan</label>
                  <input
                    type="text"
                    placeholder="Contoh: 260829M3UF23AB"
                    value={saleForm.noPesanan}
                    onChange={e => setSaleForm({ ...saleForm, noPesanan: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg font-mono font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Pilih SKU Produk *</label>
                <select
                  required
                  value={saleForm.sku}
                  onChange={e => handleSelectSKUForSale(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg font-bold text-indigo-700 bg-indigo-50/30"
                >
                  <option value="">-- Pilih SKU Produk --</option>
                  {brandSKUs
                    .filter(s => effectiveBrand === 'ALL' || s.brand === effectiveBrand)
                    .map(s => (
                      <option key={s.id} value={s.sku}>
                        {s.sku} (HPP: {formatRp(Number(s.hpp))})
                      </option>
                    ))}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Qty (Pcs) *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={saleForm.qty}
                    onChange={e => setSaleForm({ ...saleForm, qty: Number(e.target.value) })}
                    className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">HPP per Pcs (Rp)</label>
                  <input
                    type="number"
                    min={0}
                    value={saleForm.hpp || ''}
                    onChange={e => setSaleForm({ ...saleForm, hpp: Number(e.target.value) })}
                    className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Omset / Jual (Rp) *</label>
                  <input
                    type="number"
                    required
                    min={0}
                    placeholder="75000"
                    value={saleForm.omset || ''}
                    onChange={e => setSaleForm({ ...saleForm, omset: Number(e.target.value) })}
                    className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg font-mono font-bold text-emerald-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Biaya Iklan / Ads (Rp)</label>
                  <input
                    type="number"
                    min={0}
                    value={saleForm.biayaIklan || ''}
                    onChange={e => setSaleForm({ ...saleForm, biayaIklan: Number(e.target.value) })}
                    className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Biaya Operasional / Pack (Rp)</label>
                  <input
                    type="number"
                    min={0}
                    value={saleForm.biayaOperasional || ''}
                    onChange={e => setSaleForm({ ...saleForm, biayaOperasional: Number(e.target.value) })}
                    className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg font-mono"
                  />
                </div>
              </div>

              {/* Profit Preview */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <div className="text-[11px] text-slate-500 font-medium">Estimasi Laba Bersih:</div>
                  <div className="text-xs text-slate-400">Omset - (HPP × Qty) - Ads - Ops</div>
                </div>
                <div className="text-lg font-bold font-mono text-emerald-700">
                  {formatRp(
                    Number(saleForm.omset || 0) -
                      Number(saleForm.hpp || 0) * Number(saleForm.qty || 1) -
                      Number(saleForm.biayaIklan || 0) -
                      Number(saleForm.biayaOperasional || 0)
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddSaleModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow transition disabled:opacity-50"
                >
                  {isSubmitting ? 'Menyimpan...' : 'Simpan Penjualan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL: INPUT BARANG KELUAR / SAMPLE */}
      {/* ============================================================ */}
      {isAddExitModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <PackageMinus className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-bold text-slate-900">Catat Pengeluaran Stok Non-Penjualan</h3>
              </div>
              <button onClick={() => setIsAddExitModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateExitSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Tanggal Keluar *</label>
                  <input
                    type="date"
                    required
                    value={exitForm.tanggal}
                    onChange={e => setExitForm({ ...exitForm, tanggal: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Kategori Pengeluaran *</label>
                  <select
                    value={exitForm.kategori}
                    onChange={e => setExitForm({ ...exitForm, kategori: e.target.value as any })}
                    className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg font-bold text-slate-800"
                  >
                    {STOCK_EXIT_CATEGORIES.map(opt => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Pilih SKU Produk *</label>
                <select
                  required
                  value={exitForm.sku}
                  onChange={e => setExitForm({ ...exitForm, sku: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg font-bold text-indigo-700 bg-indigo-50/30"
                >
                  <option value="">-- Pilih SKU Produk --</option>
                  {brandSKUs
                    .filter(s => effectiveBrand === 'ALL' || s.brand === effectiveBrand)
                    .map(s => (
                      <option key={s.id} value={s.sku}>
                        {s.sku}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Jumlah Pengeluaran (Pcs) *</label>
                <input
                  type="number"
                  required
                  min={1}
                  value={exitForm.qty}
                  onChange={e => setExitForm({ ...exitForm, qty: Number(e.target.value) })}
                  className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg font-mono font-bold text-rose-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Keterangan / Keperluan</label>
                <input
                  type="text"
                  placeholder="Contoh: Endorsement @selebgram_official atau Foto Studio Katalog"
                  value={exitForm.keterangan}
                  onChange={e => setExitForm({ ...exitForm, keterangan: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddExitModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow transition disabled:opacity-50"
                >
                  {isSubmitting ? 'Menyimpan...' : 'Simpan Pengeluaran'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* CONFIRM DELETE MODALS */}
      {/* ============================================================ */}
      {deleteSKUConfirm && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mb-4">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Hapus Master SKU?</h3>
            <p className="text-sm text-slate-600 mb-4 leading-relaxed">
              Apakah Anda yakin ingin menghapus SKU <span className="font-bold text-slate-900">{deleteSKUConfirm.sku}</span>?
            </p>
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setDeleteSKUConfirm(null)}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition"
              >
                Batal
              </button>
              <button
                onClick={async () => {
                  setIsSubmitting(true);
                  await deleteBrandSKU(deleteSKUConfirm.id);
                  setIsSubmitting(false);
                  setDeleteSKUConfirm(null);
                  showToast('success', 'SKU berhasil dihapus.');
                }}
                disabled={isSubmitting}
                className="px-5 py-2 text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow transition"
              >
                {isSubmitting ? 'Menghapus...' : 'Ya, Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteSaleConfirm && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mb-4">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Hapus Catatan Penjualan?</h3>
            <p className="text-sm text-slate-600 mb-4 leading-relaxed">
              Hapus pesanan <span className="font-bold text-slate-900">{deleteSaleConfirm.noPesanan || deleteSaleConfirm.sku}</span>? Stok akan otomatis dikembalikan.
            </p>
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setDeleteSaleConfirm(null)}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition"
              >
                Batal
              </button>
              <button
                onClick={async () => {
                  setIsSubmitting(true);
                  await deleteBrandSale(deleteSaleConfirm.id);
                  setIsSubmitting(false);
                  setDeleteSaleConfirm(null);
                  showToast('success', 'Catatan penjualan dihapus.');
                }}
                disabled={isSubmitting}
                className="px-5 py-2 text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow transition"
              >
                {isSubmitting ? 'Menghapus...' : 'Ya, Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteExitConfirm && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mb-4">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Hapus Catatan Barang Keluar?</h3>
            <p className="text-sm text-slate-600 mb-4 leading-relaxed">
              Hapus pengeluaran SKU <span className="font-bold text-slate-900">{deleteExitConfirm.sku}</span> sebanyak {deleteExitConfirm.qty} pcs?
            </p>
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setDeleteExitConfirm(null)}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition"
              >
                Batal
              </button>
              <button
                onClick={async () => {
                  setIsSubmitting(true);
                  await deleteBrandStockExit(deleteExitConfirm.id);
                  setIsSubmitting(false);
                  setDeleteExitConfirm(null);
                  showToast('success', 'Catatan barang keluar dihapus.');
                }}
                disabled={isSubmitting}
                className="px-5 py-2 text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow transition"
              >
                {isSubmitting ? 'Menghapus...' : 'Ya, Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Restock PO Print Modal for Admin */}
      {isPOModalOpen && (
        <RestockPOPrintModal
          selectedItems={
            customPOSKUList && customPOSKUList.length > 0
              ? customPOSKUList
              : selectedSKUIds.length > 0
              ? computedStockItems
                  .filter(i => selectedSKUIds.includes(i.sku.id))
                  .map(i => ({ sku: i.sku, currentStock: i.sisaQty }))
              : computedStockItems.map(i => ({ sku: i.sku, currentStock: i.sisaQty }))
          }
          activeBrand={effectiveBrand}
          brandList={brands}
          onClose={() => {
            setIsPOModalOpen(false);
            setCustomPOSKUList(null);
          }}
        />
      )}
    </div>
  );
};

export default StokPenjualanView;
