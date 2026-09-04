import React, { useState, useMemo } from 'react';
import {
  PackagePlus,
  ArrowDownLeft,
  ArrowUpRight,
  ClipboardCheck,
  Search,
  Download,
  Printer,
  AlertTriangle,
  Layers,
  Building2,
  Tag,
  Edit2,
  Trash2,
  Sparkles,
  History,
  Archive,
  CheckCircle2,
  XCircle,
  HelpCircle,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { AccessoryItem, AccessoryCategory, AccessoryMutation } from '../../types';
import { formatRp, formatDateIndo } from '../../utils/formatters';
import { AccessoryModal } from './AccessoryModal';
import { StockMutationModal } from './StockMutationModal';
import { StockOpnameModal } from './StockOpnameModal';
import { StockOpnamePrintModal } from './StockOpnamePrintModal';

export const AccessoriesView: React.FC = () => {
  const { accessories, accessoryMutations, brands, deleteAccessory } = useApp();

  // Active Tab: 'CATALOG' | 'MUTATIONS'
  const [activeTab, setActiveTab] = useState<'CATALOG' | 'MUTATIONS'>('CATALOG');

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [brandFilter, setBrandFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'AMAN' | 'MENIPIS' | 'HABIS'>('ALL');

  // Modals state
  const [isAccessoryModalOpen, setIsAccessoryModalOpen] = useState(false);
  const [editingAccessory, setEditingAccessory] = useState<AccessoryItem | null>(null);

  const [isMutationModalOpen, setIsMutationModalOpen] = useState(false);
  const [mutationType, setMutationType] = useState<'MASUK' | 'KELUAR'>('MASUK');
  const [selectedMutationAccessory, setSelectedMutationAccessory] = useState<AccessoryItem | null>(null);

  const [isOpnameModalOpen, setIsOpnameModalOpen] = useState(false);
  const [selectedOpnameAccessory, setSelectedOpnameAccessory] = useState<AccessoryItem | null>(null);

  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  // Helper status calculation
  const getItemStatus = (item: AccessoryItem): 'AMAN' | 'MENIPIS' | 'HABIS' => {
    if (item.stock <= 0) return 'HABIS';
    if (item.stock <= item.safetyStock) return 'MENIPIS';
    return 'AMAN';
  };

  // KPI Metrics Calculation
  const kpi = useMemo(() => {
    const totalSku = accessories.length;
    let safeCount = 0;
    let lowCount = 0;
    let outOfStockCount = 0;
    let totalEstimatedValue = 0;

    accessories.forEach((item) => {
      const status = getItemStatus(item);
      if (status === 'HABIS') outOfStockCount++;
      else if (status === 'MENIPIS') lowCount++;
      else safeCount++;

      if (item.costPerUnit && item.costPerUnit > 0) {
        totalEstimatedValue += item.stock * item.costPerUnit;
      }
    });

    const lowStockItems = accessories.filter(
      (item) => item.stock <= item.safetyStock
    );

    return {
      totalSku,
      safeCount,
      lowCount,
      outOfStockCount,
      totalEstimatedValue,
      lowStockItems,
    };
  }, [accessories]);

  // Filtered Catalog Items
  const filteredAccessories = useMemo(() => {
    return accessories.filter((item) => {
      // 1. Search filter
      if (searchTerm) {
        const query = searchTerm.toLowerCase();
        const matchSku = item.sku.toLowerCase().includes(query);
        const matchName = item.name.toLowerCase().includes(query);
        const matchLoc = (item.location || '').toLowerCase().includes(query);
        const matchBrand = (item.brand || '').toLowerCase().includes(query);
        if (!matchSku && !matchName && !matchLoc && !matchBrand) return false;
      }

      // 2. Category filter
      if (categoryFilter !== 'ALL' && item.category !== categoryFilter) {
        return false;
      }

      // 3. Brand filter
      if (brandFilter !== 'ALL') {
        if (brandFilter === 'UMUM' && item.brand && item.brand !== 'UMUM') return false;
        if (brandFilter !== 'UMUM' && item.brand !== brandFilter) return false;
      }

      // 4. Status filter
      if (statusFilter !== 'ALL') {
        const st = getItemStatus(item);
        if (st !== statusFilter) return false;
      }

      return true;
    });
  }, [accessories, searchTerm, categoryFilter, brandFilter, statusFilter]);

  // Filtered Mutations
  const filteredMutations = useMemo(() => {
    return accessoryMutations.filter((mut) => {
      if (!searchTerm) return true;
      const query = searchTerm.toLowerCase();
      return (
        mut.accessoryName.toLowerCase().includes(query) ||
        mut.sku.toLowerCase().includes(query) ||
        (mut.sourceOrDestination || '').toLowerCase().includes(query) ||
        (mut.spkNumber || '').toLowerCase().includes(query) ||
        (mut.recipientOrVendor || '').toLowerCase().includes(query)
      );
    });
  }, [accessoryMutations, searchTerm]);

  // Handle Export CSV
  const handleExportCSV = () => {
    if (activeTab === 'CATALOG') {
      const headers = [
        'Kode SKU',
        'Nama Aksesoris',
        'Kategori',
        'Brand Peruntukan',
        'Stok Terkini',
        'Satuan',
        'Batas Safety Stock',
        'Status Stok',
        'Lokasi Gudang',
        'Harga Beli Satuan (Rp)',
        'Total Nilai Stok (Rp)',
        'Catatan',
      ];

      const rows = filteredAccessories.map((item) => [
        `"${item.sku}"`,
        `"${item.name.replace(/"/g, '""')}"`,
        `"${item.category}"`,
        `"${item.brand || 'UMUM'}"`,
        item.stock,
        `"${item.unit}"`,
        item.safetyStock,
        `"${getItemStatus(item)}"`,
        `"${(item.location || '-').replace(/"/g, '""')}"`,
        item.costPerUnit || 0,
        (item.stock * (item.costPerUnit || 0)),
        `"${(item.notes || '').replace(/"/g, '""')}"`,
      ]);

      const csvContent =
        'data:text/csv;charset=utf-8,\uFEFF' +
        [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `Stok_Aksesoris_Maison_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      // Export Mutations
      const headers = [
        'Tanggal',
        'Kode SKU',
        'Nama Aksesoris',
        'Tipe Mutasi',
        'Jumlah',
        'Satuan',
        'Sumber / Alokasi SPK',
        'No SPK',
        'Penerima / Vendor',
        'Total Biaya (Rp)',
        'Catatan',
      ];

      const rows = filteredMutations.map((m) => [
        `"${m.date}"`,
        `"${m.sku}"`,
        `"${m.accessoryName.replace(/"/g, '""')}"`,
        `"${m.type}"`,
        m.quantity,
        `"${m.unit}"`,
        `"${(m.sourceOrDestination || '').replace(/"/g, '""')}"`,
        `"${m.spkNumber || '-'}"`,
        `"${(m.recipientOrVendor || '').replace(/"/g, '""')}"`,
        m.costTotal || 0,
        `"${(m.notes || '').replace(/"/g, '""')}"`,
      ]);

      const csvContent =
        'data:text/csv;charset=utf-8,\uFEFF' +
        [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `Riwayat_Mutasi_Aksesoris_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleDeleteItem = (id: string, name: string) => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus master aksesoris "${name}"?`)) {
      deleteAccessory(id);
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-fadeIn">
      
      {/* 1. Header & Top Action Buttons */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
              <Archive className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <span>Manajemen Inventori Aksesoris & Trims</span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800">
                  Gudang Trims
                </span>
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Monitoring kancing, zipper, label woven, hangtag, karet elastis, benang, dan packaging
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons Toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Tambah Master */}
          <button
            onClick={() => {
              setEditingAccessory(null);
              setIsAccessoryModalOpen(true);
            }}
            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-sm shadow-indigo-600/20 flex items-center gap-1.5 transition btn-press"
          >
            <PackagePlus className="w-4 h-4" />
            <span>+ Tambah Aksesoris</span>
          </button>

          {/* Stok Masuk */}
          <button
            onClick={() => {
              setMutationType('MASUK');
              setSelectedMutationAccessory(null);
              setIsMutationModalOpen(true);
            }}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-sm flex items-center gap-1.5 transition btn-press"
            title="Catat barang masuk dari pembelian atau titipan buyer"
          >
            <ArrowDownLeft className="w-4 h-4" />
            <span>Stok Masuk</span>
          </button>

          {/* Stok Keluar */}
          <button
            onClick={() => {
              setMutationType('KELUAR');
              setSelectedMutationAccessory(null);
              setIsMutationModalOpen(true);
            }}
            className="px-3.5 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold shadow-sm flex items-center gap-1.5 transition btn-press"
            title="Keluarkan aksesoris untuk alokasi SPK jahit"
          >
            <ArrowUpRight className="w-4 h-4" />
            <span>Stok Keluar (SPK)</span>
          </button>

          {/* Stock Opname */}
          <button
            onClick={() => {
              setSelectedOpnameAccessory(null);
              setIsOpnameModalOpen(true);
            }}
            className="px-3 py-2 bg-amber-500 hover:bg-amber-400 text-white rounded-xl text-xs font-bold shadow-sm flex items-center gap-1.5 transition btn-press"
            title="Penyesuaian stok riil hasil cek fisik"
          >
            <ClipboardCheck className="w-4 h-4" />
            <span>Stock Opname</span>
          </button>

          {/* Export CSV */}
          <button
            onClick={handleExportCSV}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition btn-press"
            title="Export Data ke File Excel / CSV"
          >
            <Download className="w-4 h-4" />
            <span>Export</span>
          </button>

          {/* Cetak Form Opname */}
          <button
            onClick={() => setIsPrintModalOpen(true)}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition btn-press"
            title="Cetak Formulir Cek Fisik Gudang A4"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak Form</span>
          </button>
        </div>
      </div>

      {/* 2. Four KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Total SKU */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Jenis Aksesoris</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Archive className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">{kpi.totalSku} SKU</div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
            <span>Estimasi Nilai Stok: <strong>{formatRp(kpi.totalEstimatedValue)}</strong></span>
          </div>
          <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-xl pointer-events-none" />
        </div>

        {/* Card 2: Stok Aman */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Stok Aman</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-emerald-600 mt-2">{kpi.safeCount} Item</div>
          <div className="text-[11px] text-emerald-600 mt-1">
            Ketersediaan di atas batas safety stock
          </div>
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl pointer-events-none" />
        </div>

        {/* Card 3: Peringatan Menipis */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Stok Menipis</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-amber-600 mt-2">{kpi.lowCount} Item</div>
          <div className="text-[11px] text-amber-700 mt-1 font-medium">
            Perlu restock segera sebelum kehabisan
          </div>
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-xl pointer-events-none" />
        </div>

        {/* Card 4: Stok Habis */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Stok Habis (0)</span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <XCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-rose-600 mt-2">{kpi.outOfStockCount} Item</div>
          <div className="text-[11px] text-rose-600 mt-1 font-medium">
            Stok kosong, proses produksi dapat terhambat
          </div>
          <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/5 rounded-full blur-xl pointer-events-none" />
        </div>

      </div>

      {/* 3. Emergency Low Stock Warning Banner */}
      {kpi.lowStockItems.length > 0 && (
        <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-rose-500/10 border border-amber-300 rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 mt-0.5">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                <span>Peringatan Ketersediaan Aksesoris ({kpi.lowStockItems.length} Material Butuh Perhatian)</span>
              </h4>
              <p className="text-[11px] text-amber-800 mt-0.5">
                Material berikut berada di bawah safety stock:{' '}
                <span className="font-bold">
                  {kpi.lowStockItems.map((item) => `${item.name} (${item.stock} ${item.unit})`).join(', ')}
                </span>
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              setStatusFilter('MENIPIS');
              setActiveTab('CATALOG');
            }}
            className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold shadow-xs transition shrink-0"
          >
            Tampilkan Item Menipis
          </button>
        </div>
      )}

      {/* 4. Tab Navigation & Search / Filter Controls */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
        
        {/* Tab Headers */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('CATALOG')}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition ${
                activeTab === 'CATALOG'
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/20'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              <Archive className="w-4 h-4" />
              <span>Katalog & Stok Aksesoris</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                  activeTab === 'CATALOG' ? 'bg-indigo-700 text-indigo-100' : 'bg-slate-200 text-slate-600'
                }`}
              >
                {accessories.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('MUTATIONS')}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition ${
                activeTab === 'MUTATIONS'
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/20'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              <History className="w-4 h-4" />
              <span>Riwayat Mutasi Masuk / Keluar</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                  activeTab === 'MUTATIONS' ? 'bg-indigo-700 text-indigo-100' : 'bg-slate-200 text-slate-600'
                }`}
              >
                {accessoryMutations.length}
              </span>
            </button>
          </div>

          {/* Quick Search Bar */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={
                activeTab === 'CATALOG'
                  ? 'Cari SKU, Nama, Lokasi Rak...'
                  : 'Cari Riwayat, SPK, Penjahit...'
              }
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-medium"
            />
          </div>
        </div>

        {/* Filter Bar (Hanya muncul jika Tab Katalog Aktif) */}
        {activeTab === 'CATALOG' && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            {/* Filter Kategori */}
            <div>
              <label className="block font-bold text-slate-600 mb-1 flex items-center gap-1">
                <Tag className="w-3.5 h-3.5 text-indigo-600" />
                Filter Kategori:
              </label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              >
                <option value="ALL">Semua Kategori Aksesoris</option>
                <option value="KANCING">🔘 Kancing</option>
                <option value="RESLETING">🤐 Resleting</option>
                <option value="LABEL_HANGTAG">🏷️ Label & Hangtag</option>
                <option value="KARET_ELASTIS">🪢 Karet & Elastis</option>
                <option value="BENANG">🧵 Benang Jahit</option>
                <option value="PACKAGING">📦 Packaging & Polybag</option>
                <option value="LAINNYA">✨ Lainnya</option>
              </select>
            </div>

            {/* Filter Brand */}
            <div>
              <label className="block font-bold text-slate-600 mb-1 flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-emerald-600" />
                Filter Brand Buyer:
              </label>
              <select
                value={brandFilter}
                onChange={(e) => setBrandFilter(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              >
                <option value="ALL">Semua Brand (Termasuk Stok Umum)</option>
                <option value="UMUM">🌐 Stok Umum / Workshop</option>
                {brands.map((b) => (
                  <option key={b.id} value={b.name}>
                    🏢 {b.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Filter Kesehatan Stok */}
            <div>
              <label className="block font-bold text-slate-600 mb-1 flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-amber-600" />
                Status Ketersediaan:
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              >
                <option value="ALL">Semua Tingkat Stok</option>
                <option value="AMAN">🟢 Stok Aman (&gt; Safety Stock)</option>
                <option value="MENIPIS">🟡 Stok Menipis (≤ Safety Stock)</option>
                <option value="HABIS">🔴 Stok Habis (0)</option>
              </select>
            </div>
          </div>
        )}

      </div>

      {/* 5. Content View: Tab 1 (Catalog) vs Tab 2 (Mutations) */}
      {activeTab === 'CATALOG' ? (
        
        /* Table Katalog Master Stok */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-900 text-white font-bold uppercase text-[10px]">
                <tr>
                  <th className="p-3.5 whitespace-nowrap">Kode SKU</th>
                  <th className="p-3.5">Nama Aksesoris & Spesifikasi</th>
                  <th className="p-3.5">Kategori & Brand</th>
                  <th className="p-3.5">Lokasi Rak</th>
                  <th className="p-3.5 text-center whitespace-nowrap">Stok Fisik</th>
                  <th className="p-3.5 text-center whitespace-nowrap">Safety Stock</th>
                  <th className="p-3.5 text-right whitespace-nowrap">Harga Beli</th>
                  <th className="p-3.5 text-center whitespace-nowrap">Status</th>
                  <th className="p-3.5 text-center whitespace-nowrap">Aksi Cepat</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {filteredAccessories.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-slate-400">
                      Tidak ada data aksesoris yang sesuai dengan filter pencarian.
                    </td>
                  </tr>
                ) : (
                  filteredAccessories.map((item) => {
                    const status = getItemStatus(item);
                    return (
                      <tr key={item.id} className="hover:bg-slate-50 transition">
                        {/* SKU */}
                        <td className="p-3.5 font-mono font-bold text-indigo-700 whitespace-nowrap">
                          {item.sku}
                        </td>

                        {/* Name & Notes */}
                        <td className="p-3.5">
                          <div className="font-bold text-slate-900">{item.name}</div>
                          {item.notes && (
                            <span className="text-[10px] text-slate-400 block truncate max-w-xs mt-0.5">
                              {item.notes}
                            </span>
                          )}
                        </td>

                        {/* Kategori & Brand */}
                        <td className="p-3.5">
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-700 font-semibold rounded text-[10px] inline-block mb-1">
                            {item.category}
                          </span>
                          <div className="text-[11px] font-medium text-slate-600 flex items-center gap-1">
                            <Building2 className="w-3 h-3 text-slate-400" />
                            <span>{item.brand || 'UMUM'}</span>
                          </div>
                        </td>

                        {/* Lokasi Rak */}
                        <td className="p-3.5 text-slate-600 font-mono text-[11px]">
                          {item.location || '-'}
                        </td>

                        {/* Stok Fisik */}
                        <td className="p-3.5 text-center font-bold text-sm text-slate-900 whitespace-nowrap tabular-nums">
                          {item.stock} <span className="text-xs font-normal text-slate-500">{item.unit}</span>
                        </td>

                        {/* Safety Stock */}
                        <td className="p-3.5 text-center text-slate-500 font-medium whitespace-nowrap tabular-nums">
                          {item.safetyStock} {item.unit}
                        </td>

                        {/* Harga Beli */}
                        <td className="p-3.5 text-right font-medium text-slate-700 whitespace-nowrap tabular-nums">
                          {item.costPerUnit && item.costPerUnit > 0 ? formatRp(item.costPerUnit) : '-'}
                        </td>

                        {/* Status Badge */}
                        <td className="p-3.5 text-center whitespace-nowrap">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold inline-block ${
                              status === 'AMAN'
                                ? 'bg-emerald-100 text-emerald-800'
                                : status === 'MENIPIS'
                                ? 'bg-amber-100 text-amber-800 animate-pulse'
                                : 'bg-rose-100 text-rose-800 font-extrabold'
                            }`}
                          >
                            {status === 'AMAN' ? '🟢 AMAN' : status === 'MENIPIS' ? '🟡 MENIPIS' : '🔴 HABIS'}
                          </span>
                        </td>

                        {/* Quick Actions */}
                        <td className="p-3.5 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1">
                            {/* Quick Masuk */}
                            <button
                              onClick={() => {
                                setMutationType('MASUK');
                                setSelectedMutationAccessory(item);
                                setIsMutationModalOpen(true);
                              }}
                              className="p-1.5 text-emerald-700 hover:bg-emerald-50 rounded-lg transition"
                              title="Catat Stok Masuk"
                            >
                              <ArrowDownLeft className="w-3.5 h-3.5" />
                            </button>

                            {/* Quick Keluar */}
                            <button
                              onClick={() => {
                                setMutationType('KELUAR');
                                setSelectedMutationAccessory(item);
                                setIsMutationModalOpen(true);
                              }}
                              className="p-1.5 text-rose-700 hover:bg-rose-50 rounded-lg transition"
                              title="Keluarkan Stok untuk SPK"
                            >
                              <ArrowUpRight className="w-3.5 h-3.5" />
                            </button>

                            {/* Quick Opname */}
                            <button
                              onClick={() => {
                                setSelectedOpnameAccessory(item);
                                setIsOpnameModalOpen(true);
                              }}
                              className="p-1.5 text-amber-700 hover:bg-amber-50 rounded-lg transition"
                              title="Stock Opname (Cek Fisik)"
                            >
                              <ClipboardCheck className="w-3.5 h-3.5" />
                            </button>

                            {/* Edit */}
                            <button
                              onClick={() => {
                                setEditingAccessory(item);
                                setIsAccessoryModalOpen(true);
                              }}
                              className="p-1.5 text-indigo-700 hover:bg-indigo-50 rounded-lg transition ml-1"
                              title="Edit Data Master"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>

                            {/* Delete */}
                            <button
                              onClick={() => handleDeleteItem(item.id, item.name)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                              title="Hapus Master"
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

      ) : (

        /* Table Log Riwayat Mutasi */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-900 text-white font-bold uppercase text-[10px]">
                <tr>
                  <th className="p-3.5 whitespace-nowrap">Tanggal</th>
                  <th className="p-3.5 whitespace-nowrap">Kode SKU</th>
                  <th className="p-3.5">Nama Material Aksesoris</th>
                  <th className="p-3.5 text-center whitespace-nowrap">Tipe Mutasi</th>
                  <th className="p-3.5 text-center whitespace-nowrap">Jumlah (+/-)</th>
                  <th className="p-3.5">Sumber / Alokasi SPK</th>
                  <th className="p-3.5">Penerima / Petugas</th>
                  <th className="p-3.5 text-right whitespace-nowrap">Biaya Pembelian</th>
                  <th className="p-3.5">Catatan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {filteredMutations.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-slate-400">
                      Belum ada riwayat transaksi mutasi stok.
                    </td>
                  </tr>
                ) : (
                  filteredMutations.map((mut) => (
                    <tr key={mut.id} className="hover:bg-slate-50 transition">
                      <td className="p-3.5 font-mono text-slate-500 whitespace-nowrap">
                        {formatDateIndo(mut.date)}
                      </td>
                      <td className="p-3.5 font-mono font-bold text-indigo-700 whitespace-nowrap">
                        {mut.sku}
                      </td>
                      <td className="p-3.5 font-semibold text-slate-900">
                        {mut.accessoryName}
                      </td>
                      <td className="p-3.5 text-center whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold inline-block ${
                            mut.type === 'MASUK'
                              ? 'bg-emerald-100 text-emerald-800'
                              : mut.type === 'KELUAR'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {mut.type === 'MASUK' ? '📥 MASUK' : mut.type === 'KELUAR' ? '📤 KELUAR' : '🔍 OPNAME'}
                        </span>
                      </td>
                      <td className="p-3.5 text-center font-bold text-sm whitespace-nowrap tabular-nums">
                        <span
                          className={
                            mut.type === 'MASUK'
                              ? 'text-emerald-700'
                              : mut.type === 'KELUAR'
                              ? 'text-rose-700'
                              : 'text-amber-700'
                          }
                        >
                          {mut.type === 'MASUK' ? `+${mut.quantity}` : mut.type === 'KELUAR' ? `-${mut.quantity}` : `±${mut.quantity}`}
                        </span>{' '}
                        <span className="text-xs font-normal text-slate-500">{mut.unit}</span>
                      </td>
                      <td className="p-3.5 font-medium text-slate-800">
                        {mut.sourceOrDestination || '-'}
                      </td>
                      <td className="p-3.5 text-slate-600">
                        {mut.recipientOrVendor || '-'}
                      </td>
                      <td className="p-3.5 text-right font-medium text-slate-700 whitespace-nowrap tabular-nums">
                        {mut.costTotal && mut.costTotal > 0 ? formatRp(mut.costTotal) : '-'}
                      </td>
                      <td className="p-3.5 text-slate-500 text-[11px]">
                        {mut.notes || '-'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      )}

      {/* Modals */}
      <AccessoryModal
        isOpen={isAccessoryModalOpen}
        onClose={() => setIsAccessoryModalOpen(false)}
        accessoryToEdit={editingAccessory}
      />

      <StockMutationModal
        isOpen={isMutationModalOpen}
        type={mutationType}
        onClose={() => setIsMutationModalOpen(false)}
        selectedAccessory={selectedMutationAccessory}
      />

      <StockOpnameModal
        isOpen={isOpnameModalOpen}
        onClose={() => setIsOpnameModalOpen(false)}
        accessoryToAdjust={selectedOpnameAccessory}
      />

      {isPrintModalOpen && (
        <StockOpnamePrintModal
          items={filteredAccessories}
          categoryFilter={categoryFilter === 'ALL' ? 'Semua Kategori' : categoryFilter}
          brandFilter={brandFilter === 'ALL' ? 'Semua Brand' : brandFilter}
          onClose={() => setIsPrintModalOpen(false)}
        />
      )}

    </div>
  );
};
