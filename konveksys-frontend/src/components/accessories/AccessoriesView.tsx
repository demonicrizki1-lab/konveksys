import React, { useState, useMemo } from 'react';
import {
  Archive,
  Plus,
  ArrowDownLeft,
  ArrowUpRight,
  ClipboardCheck,
  Search,
  Download,
  Printer,
  AlertTriangle,
  Edit2,
  Trash2,
  CheckCircle2,
  Clock,
  XCircle,
  FileText,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { AccessoryItem, AccessoryMutation } from '../../types';
import { formatRp, formatDateIndo } from '../../utils/formatters';
import { AccessoryModal } from './AccessoryModal';
import { StockMutationModal } from './StockMutationModal';
import { StockOpnameModal } from './StockOpnameModal';
import { StockOpnamePrintModal } from './StockOpnamePrintModal';

export const AccessoriesView: React.FC = () => {
  const { accessories, accessoryMutations, brands, userRole, activeBrand, deleteAccessory } = useApp();

  // Tab State
  const [activeTab, setActiveTab] = useState<'CATALOG' | 'MUTATIONS'>('CATALOG');

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [brandFilter, setBrandFilter] = useState<string>(userRole === 'BRAND' ? activeBrand : 'ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'AMAN' | 'MENIPIS' | 'HABIS'>('ALL');

  // Modals
  const [isAccessoryModalOpen, setIsAccessoryModalOpen] = useState(false);
  const [editingAccessory, setEditingAccessory] = useState<AccessoryItem | null>(null);

  const [isMutationModalOpen, setIsMutationModalOpen] = useState(false);
  const [mutationType, setMutationType] = useState<'MASUK' | 'KELUAR'>('MASUK');
  const [selectedMutationAccessory, setSelectedMutationAccessory] = useState<AccessoryItem | null>(null);

  const [isOpnameModalOpen, setIsOpnameModalOpen] = useState(false);
  const [selectedOpnameAccessory, setSelectedOpnameAccessory] = useState<AccessoryItem | null>(null);

  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  // Category format helper
  const formatCategory = (cat: string) => {
    const map: Record<string, string> = {
      LABEL: 'Label',
      BORDIR: 'Bordir',
      HANGTAG: 'Hangtag',
      PLASTIK_PACKING: 'Plastik Packing',
      WOVEN: 'Woven',
      KANCING: 'Kancing',
      RESLETING: 'Resleting',
      BENANG: 'Benang',
      KARET_ELASTIS: 'Karet Elastis',
      LAINNYA: 'Lainnya',
    };
    return map[cat] || cat;
  };

  // Status helper
  const getItemStatus = (item: AccessoryItem): 'AMAN' | 'MENIPIS' | 'HABIS' => {
    if (item.stock <= 0) return 'HABIS';
    if (item.stock <= item.safetyStock) return 'MENIPIS';
    return 'AMAN';
  };

  // Filtered accessories
  const filteredAccessories = useMemo(() => {
    return accessories.filter((item) => {
      const effectiveBrand = userRole === 'BRAND' ? activeBrand : brandFilter;
      const matchBrand =
        effectiveBrand === 'ALL' ||
        item.brand === effectiveBrand ||
        (!item.brand || item.brand === 'UMUM');

      const matchCategory = categoryFilter === 'ALL' || item.category === categoryFilter;
      const status = getItemStatus(item);
      const matchStatus = statusFilter === 'ALL' || status === statusFilter;

      const q = searchTerm.toLowerCase();
      const matchSearch =
        !searchTerm ||
        item.sku.toLowerCase().includes(q) ||
        item.name.toLowerCase().includes(q) ||
        (item.location || '').toLowerCase().includes(q) ||
        (item.brand || '').toLowerCase().includes(q);

      return matchBrand && matchCategory && matchStatus && matchSearch;
    });
  }, [accessories, userRole, activeBrand, brandFilter, categoryFilter, statusFilter, searchTerm]);

  // Calculation Stats
  const kpi = useMemo(() => {
    const totalSku = filteredAccessories.length;
    let safeCount = 0;
    let lowCount = 0;
    let emptyCount = 0;
    let totalStockValue = 0;

    filteredAccessories.forEach((item) => {
      const st = getItemStatus(item);
      if (st === 'HABIS') emptyCount++;
      else if (st === 'MENIPIS') lowCount++;
      else safeCount++;

      if (item.costPerUnit && item.costPerUnit > 0) {
        totalStockValue += item.stock * item.costPerUnit;
      }
    });

    const criticalItems = filteredAccessories.filter((i) => i.stock <= i.safetyStock);

    return { totalSku, safeCount, lowCount, emptyCount, totalStockValue, criticalItems };
  }, [filteredAccessories]);

  // Filtered mutations
  const filteredMutations = useMemo(() => {
    return accessoryMutations.filter((mut) => {
      if (!searchTerm) return true;
      const q = searchTerm.toLowerCase();
      return (
        mut.accessoryName.toLowerCase().includes(q) ||
        mut.sku.toLowerCase().includes(q) ||
        (mut.sourceOrDestination || '').toLowerCase().includes(q) ||
        (mut.spkNumber || '').toLowerCase().includes(q) ||
        (mut.recipientOrVendor || '').toLowerCase().includes(q)
      );
    });
  }, [accessoryMutations, searchTerm]);

  const handleDeleteItem = async (item: AccessoryItem) => {
    if (window.confirm(`Hapus data master aksesoris "${item.name}" (${item.sku})?`)) {
      await deleteAccessory(item.id);
    }
  };

  const handleExportCSV = () => {
    const headers = [
      'Kode SKU',
      'Nama Aksesoris',
      'Kategori',
      'Brand',
      'Stok Fisik',
      'Satuan',
      'Safety Stock',
      'Status',
      'Lokasi',
      'Harga Beli Satuan',
      'Total Nilai',
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
      item.stock * (item.costPerUnit || 0),
      `"${(item.notes || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Stok_Aksesoris_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      
      {/* 1. Header Banner */}
      <div className="bg-white rounded-xl p-6 sm:p-7 border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-medium text-indigo-600 bg-indigo-50 px-3 py-1 rounded-lg mb-2 border border-indigo-100">
              <Archive className="w-3.5 h-3.5" />
              Gudang Bahan Pembantu & Trims
            </div>
            <h1 className="text-xl font-bold text-slate-900">Manajemen Stok Aksesoris & Trims</h1>
            <p className="text-slate-500 text-xs mt-1">
              Pelacakan stok kancing, zipper, label woven, hangtag, karet elastis, benang, dan packaging terhubung ke SPK.
            </p>
          </div>

          {/* Action Buttons Toolbar */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {userRole === 'ADMIN' && (
              <>
                <button
                  onClick={() => {
                    setEditingAccessory(null);
                    setIsAccessoryModalOpen(true);
                  }}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-4 py-2.5 rounded-lg flex items-center gap-1.5 shadow-sm transition-base btn-press"
                >
                  <Plus className="w-4 h-4" />
                  Tambah Aksesoris
                </button>

                <button
                  onClick={() => {
                    setMutationType('MASUK');
                    setSelectedMutationAccessory(null);
                    setIsMutationModalOpen(true);
                  }}
                  className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-semibold px-3.5 py-2.5 rounded-lg flex items-center gap-1.5 shadow-2xs transition-base btn-press"
                  title="Catat barang masuk dari pembelian atau titipan buyer"
                >
                  <ArrowDownLeft className="w-4 h-4 text-emerald-600" />
                  Stok Masuk
                </button>

                <button
                  onClick={() => {
                    setMutationType('KELUAR');
                    setSelectedMutationAccessory(null);
                    setIsMutationModalOpen(true);
                  }}
                  className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-semibold px-3.5 py-2.5 rounded-lg flex items-center gap-1.5 shadow-2xs transition-base btn-press"
                  title="Keluarkan aksesoris untuk SPK"
                >
                  <ArrowUpRight className="w-4 h-4 text-rose-600" />
                  Stok Keluar
                </button>

                <button
                  onClick={() => {
                    setSelectedOpnameAccessory(null);
                    setIsOpnameModalOpen(true);
                  }}
                  className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-semibold px-3.5 py-2.5 rounded-lg flex items-center gap-1.5 shadow-2xs transition-base btn-press"
                  title="Penyesuaian stok fisik hasil opname"
                >
                  <ClipboardCheck className="w-4 h-4 text-amber-600" />
                  Opname
                </button>
              </>
            )}

            <button
              onClick={handleExportCSV}
              className="p-2.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 rounded-lg transition"
              title="Export Data ke Excel (.csv)"
            >
              <Download className="w-4 h-4" />
            </button>

            <button
              onClick={() => setIsPrintModalOpen(true)}
              className="p-2.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 rounded-lg transition"
              title="Cetak Formulir Stock Opname A4"
            >
              <Printer className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200">
            <span className="text-[11px] font-medium text-slate-500">Total Material</span>
            <div className="text-xl font-bold text-slate-900 mt-0.5">{kpi.totalSku} SKU</div>
            <span className="text-[10px] text-slate-400">Nilai: {formatRp(kpi.totalStockValue)}</span>
          </div>

          <div className="bg-emerald-50 p-3.5 rounded-lg border border-emerald-100">
            <span className="text-[11px] font-medium text-emerald-700">Stok Aman</span>
            <div className="text-xl font-bold text-emerald-700 mt-0.5">{kpi.safeCount} Item</div>
            <span className="text-[10px] text-emerald-600">Di atas safety stock</span>
          </div>

          <div className="bg-amber-50 p-3.5 rounded-lg border border-amber-100">
            <span className="text-[11px] font-medium text-amber-700">Stok Menipis</span>
            <div className="text-xl font-bold text-amber-700 mt-0.5">{kpi.lowCount} Item</div>
            <span className="text-[10px] text-amber-600">Perlu restock segera</span>
          </div>

          <div className="bg-rose-50 p-3.5 rounded-lg border border-rose-100">
            <span className="text-[11px] font-medium text-rose-700">Stok Kosong</span>
            <div className="text-xl font-bold text-rose-700 mt-0.5">{kpi.emptyCount} Item</div>
            <span className="text-[10px] text-rose-600">Stok habis (0)</span>
          </div>
        </div>

        {/* Warning Notice if Low Stock */}
        {kpi.criticalItems.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-amber-900">Perhatian Ketersediaan Stok:</span>{' '}
              {kpi.criticalItems.map((item) => `${item.name} (${item.stock} ${item.unit})`).join(', ')}.
            </div>
          </div>
        )}

        {/* Search & Filter Toolbar */}
        <div className="flex flex-col sm:flex-row gap-3 pt-1">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Cari kode SKU, nama aksesoris, atau lokasi rak..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-base"
            />
          </div>

          <div className="w-full sm:w-44">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-base"
            >
              <option value="ALL">Semua Kategori</option>
              <option value="LABEL">Label</option>
              <option value="BORDIR">Bordir</option>
              <option value="HANGTAG">Hangtag</option>
              <option value="PLASTIK_PACKING">Plastik Packing</option>
              <option value="WOVEN">Woven</option>
              <option value="KANCING">Kancing</option>
              <option value="RESLETING">Resleting</option>
              <option value="BENANG">Benang</option>
              <option value="KARET_ELASTIS">Karet Elastis</option>
              <option value="LAINNYA">Lainnya</option>
            </select>
          </div>

          {userRole === 'ADMIN' && (
            <div className="w-full sm:w-44">
              <select
                value={brandFilter}
                onChange={(e) => setBrandFilter(e.target.value)}
                className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-base"
              >
                <option value="ALL">Semua Brand</option>
                <option value="UMUM">Stok Umum Workshop</option>
                {brands.map((b) => (
                  <option key={b.id} value={b.name}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="w-full sm:w-40">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-base"
            >
              <option value="ALL">Semua Status</option>
              <option value="AMAN">Stok Aman</option>
              <option value="MENIPIS">Stok Menipis</option>
              <option value="HABIS">Stok Habis</option>
            </select>
          </div>
        </div>

      </div>

      {/* 2. Tabs Navigation */}
      <div className="flex border-b border-slate-200 gap-6">
        <button
          onClick={() => setActiveTab('CATALOG')}
          className={`pb-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition ${
            activeTab === 'CATALOG'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Archive className="w-4 h-4" />
          <span>Katalog Stok Aksesoris</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-100 text-slate-600 font-bold">
            {filteredAccessories.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('MUTATIONS')}
          className={`pb-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition ${
            activeTab === 'MUTATIONS'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Riwayat Mutasi Keluar-Masuk</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-100 text-slate-600 font-bold">
            {filteredMutations.length}
          </span>
        </button>
      </div>

      {/* 3. Main Data Table */}
      {activeTab === 'CATALOG' ? (
        
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-900 text-white font-semibold text-xs">
                <tr>
                  <th className="p-3.5 whitespace-nowrap">Kode SKU</th>
                  <th className="p-3.5">Nama Aksesoris</th>
                  <th className="p-3.5">Kategori / Brand</th>
                  <th className="p-3.5">Lokasi Rak</th>
                  <th className="p-3.5 text-center whitespace-nowrap">Stok Fisik</th>
                  <th className="p-3.5 text-center whitespace-nowrap">Batas Minimum</th>
                  <th className="p-3.5 text-right whitespace-nowrap">Harga Beli</th>
                  <th className="p-3.5 text-center whitespace-nowrap">Status</th>
                  {userRole === 'ADMIN' && (
                    <th className="p-3.5 text-center whitespace-nowrap">Aksi</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-700">
                {filteredAccessories.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-slate-400">
                      Tidak ada data aksesoris yang sesuai.
                    </td>
                  </tr>
                ) : (
                  filteredAccessories.map((item) => {
                    const status = getItemStatus(item);
                    return (
                      <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-3.5 font-mono font-bold text-indigo-600 whitespace-nowrap">
                          {item.sku}
                        </td>

                        <td className="p-3.5">
                          <div className="font-semibold text-slate-900">{item.name}</div>
                          {item.notes && (
                            <span className="text-[10px] text-slate-400 block truncate max-w-xs">
                              {item.notes}
                            </span>
                          )}
                        </td>

                        <td className="p-3.5">
                          <span className="font-medium text-slate-800">{formatCategory(item.category)}</span>
                          <span className="text-[10px] text-slate-400 block">
                            {item.brand || 'UMUM'}
                          </span>
                        </td>

                        <td className="p-3.5 text-slate-600 font-mono text-[11px]">
                          {item.location || '-'}
                        </td>

                        <td className="p-3.5 text-center font-bold text-slate-900 whitespace-nowrap tabular-nums">
                          {item.stock} <span className="text-slate-400 font-normal text-[11px]">{item.unit}</span>
                        </td>

                        <td className="p-3.5 text-center text-slate-500 whitespace-nowrap tabular-nums">
                          {item.safetyStock} {item.unit}
                        </td>

                        <td className="p-3.5 text-right text-slate-700 whitespace-nowrap tabular-nums">
                          {item.costPerUnit && item.costPerUnit > 0 ? formatRp(item.costPerUnit) : '-'}
                        </td>

                        <td className="p-3.5 text-center whitespace-nowrap">
                          {status === 'AMAN' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 font-bold rounded-lg text-[10px] border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3" /> Aman
                            </span>
                          )}
                          {status === 'MENIPIS' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 text-amber-700 font-bold rounded-lg text-[10px] border border-amber-200">
                              <Clock className="w-3 h-3" /> Menipis
                            </span>
                          )}
                          {status === 'HABIS' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-rose-50 text-rose-700 font-bold rounded-lg text-[10px] border border-rose-200">
                              <XCircle className="w-3 h-3" /> Habis
                            </span>
                          )}
                        </td>

                        {userRole === 'ADMIN' && (
                          <td className="p-3.5 text-center whitespace-nowrap">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => {
                                  setEditingAccessory(item);
                                  setIsAccessoryModalOpen(true);
                                }}
                                className="p-1 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded transition"
                                title="Edit Master"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteItem(item)}
                                className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition"
                                title="Hapus Master"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

      ) : (

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-900 text-white font-semibold text-xs">
                <tr>
                  <th className="p-3.5 whitespace-nowrap">Tanggal</th>
                  <th className="p-3.5 whitespace-nowrap">Kode SKU</th>
                  <th className="p-3.5">Nama Aksesoris</th>
                  <th className="p-3.5 text-center whitespace-nowrap">Tipe Mutasi</th>
                  <th className="p-3.5 text-center whitespace-nowrap">Jumlah (+/-)</th>
                  <th className="p-3.5">Sumber / Alokasi SPK</th>
                  <th className="p-3.5">Penerima / Petugas</th>
                  <th className="p-3.5 text-right whitespace-nowrap">Biaya Total</th>
                  <th className="p-3.5">Catatan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-700">
                {filteredMutations.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-slate-400">
                      Belum ada riwayat mutasi.
                    </td>
                  </tr>
                ) : (
                  filteredMutations.map((mut) => (
                    <tr key={mut.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3.5 font-mono text-slate-500 whitespace-nowrap">
                        {formatDateIndo(mut.date)}
                      </td>
                      <td className="p-3.5 font-mono font-bold text-indigo-600 whitespace-nowrap">
                        {mut.sku}
                      </td>
                      <td className="p-3.5 font-semibold text-slate-900">
                        {mut.accessoryName}
                      </td>
                      <td className="p-3.5 text-center whitespace-nowrap">
                        {mut.type === 'MASUK' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 font-bold rounded text-[10px] border border-emerald-200">
                            <ArrowDownLeft className="w-3 h-3" /> Masuk
                          </span>
                        )}
                        {mut.type === 'KELUAR' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-rose-50 text-rose-700 font-bold rounded text-[10px] border border-rose-200">
                            <ArrowUpRight className="w-3 h-3" /> Keluar
                          </span>
                        )}
                        {mut.type === 'PENYESUAIAN' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-700 font-bold rounded text-[10px] border border-amber-200">
                            <ClipboardCheck className="w-3 h-3" /> Opname
                          </span>
                        )}
                      </td>
                      <td className="p-3.5 text-center font-bold text-slate-900 whitespace-nowrap tabular-nums">
                        {mut.type === 'MASUK' ? `+${mut.quantity}` : mut.type === 'KELUAR' ? `-${mut.quantity}` : `±${mut.quantity}`}{' '}
                        <span className="text-slate-400 font-normal text-[11px]">{mut.unit}</span>
                      </td>
                      <td className="p-3.5 text-slate-800">
                        {mut.sourceOrDestination || '-'}
                      </td>
                      <td className="p-3.5 text-slate-600">
                        {mut.recipientOrVendor || '-'}
                      </td>
                      <td className="p-3.5 text-right text-slate-700 whitespace-nowrap tabular-nums">
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
