import React, { useState, useMemo, useEffect } from 'react';
import {
  FileText,
  Plus,
  Search,
  Filter,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  Truck,
  Building2,
  Trash2,
  Edit2,
  Printer,
  ChevronDown,
  RefreshCw,
  Layers,
  X,
  Save,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ProductionPO, ProductionPOItem, ProductionPOStatus } from '../../types';
import { ProductionPOPrintModal } from './ProductionPOPrintModal';
import { formatDateIndo } from '../../utils/formatters';

interface ItemFormState {
  id?: string;
  namaProduk: string;
  warna: string;
  ukuran: string;
  qty: number;
  bahanKain: string;
  catatan: string;
}

export const SuratPOProduksiView: React.FC = () => {
  const {
    productionPOs,
    fetchProductionPOs,
    createProductionPO,
    updateProductionPO,
    updateProductionPOStatus,
    deleteProductionPO,
    brands,
    vendors,
  } = useApp();

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBrandFilter, setSelectedBrandFilter] = useState('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('ALL');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Modals State
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingPO, setEditingPO] = useState<ProductionPO | null>(null);
  const [printingPO, setPrintingPO] = useState<ProductionPO | null>(null);
  const [deleteConfirmPO, setDeleteConfirmPO] = useState<ProductionPO | null>(null);
  const [statusMenuPO, setStatusMenuPO] = useState<ProductionPO | null>(null);

  // Form State
  const [formNoPO, setFormNoPO] = useState('');
  const [formBrand, setFormBrand] = useState('');
  const [formVendor, setFormVendor] = useState('Workshop Internal (Maison Rayyan)');
  const [formTanggal, setFormTanggal] = useState('');
  const [formDeadline, setFormDeadline] = useState('');
  const [formCatatan, setFormCatatan] = useState('');
  const [formItems, setFormItems] = useState<ItemFormState[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Toast State
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  // Helper generate No PO
  const generatePONumber = (brandName?: string) => {
    const brandCode = brandName ? brandName.slice(0, 3).toUpperCase() : 'MR';
    const dateStr = new Date().toISOString().slice(2, 10).replace(/-/g, '');
    const rand = Math.floor(100 + Math.random() * 900);
    return `PO-${brandCode}-${dateStr}-${rand}`;
  };

  // Open Form for Create
  const handleOpenCreateModal = () => {
    const today = new Date().toISOString().split('T')[0];
    const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const initialBrand = brands.length > 0 ? brands[0].name : '';
    const initialVendor = vendors.length > 0 ? vendors[0].name : '';

    setEditingPO(null);
    setFormNoPO(generatePONumber(initialBrand));
    setFormBrand(initialBrand);
    setFormVendor(initialVendor);
    setFormTanggal(today);
    setFormDeadline(nextWeek);
    setFormCatatan('Prioritas potong dan jahit segera. Standar QC butik Maison Rayyan berlaku.');
    setFormItems([
      {
        namaProduk: '',
        warna: '',
        ukuran: 'All Size',
        qty: 50,
        bahanKain: '',
        catatan: '',
      },
    ]);
    setIsFormModalOpen(true);
  };

  const handleBrandChange = (newBrand: string) => {
    setFormBrand(newBrand);
    if (!editingPO) {
      setFormNoPO(generatePONumber(newBrand));
    }
  };

  // Open Form for Edit
  const handleOpenEditModal = (po: ProductionPO) => {
    setEditingPO(po);
    setFormNoPO(po.noPO);
    setFormBrand(po.brand);
    setFormVendor(po.vendorTujuan);
    setFormTanggal(po.tanggalPO ? String(po.tanggalPO).split('T')[0] : '');
    setFormDeadline(po.targetDeadline ? String(po.targetDeadline).split('T')[0] : '');
    setFormCatatan(po.catatan || '');
    setFormItems(
      po.items.map(item => ({
        id: item.id,
        namaProduk: item.namaProduk,
        warna: item.warna || '',
        ukuran: item.ukuran || '',
        qty: Number(item.qty || 0),
        bahanKain: item.bahanKain || '',
        catatan: item.catatan || '',
      }))
    );
    setIsFormModalOpen(true);
  };

  // Items manipulation in Form
  const handleAddItemRow = () => {
    setFormItems(prev => [
      ...prev,
      {
        namaProduk: '',
        warna: '',
        ukuran: 'All Size',
        qty: 50,
        bahanKain: '',
        catatan: '',
      },
    ]);
  };

  const handleRemoveItemRow = (index: number) => {
    if (formItems.length <= 1) {
      showToast('error', 'Minimal harus ada 1 baris item produk.');
      return;
    }
    setFormItems(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleItemChange = (index: number, field: keyof ItemFormState, value: any) => {
    setFormItems(prev =>
      prev.map((item, idx) => (idx === index ? { ...item, [field]: value } : item))
    );
  };

  // Calculate live total Pcs in form
  const formTotalPcs = useMemo(() => {
    return formItems.reduce((sum, item) => sum + Math.max(0, Number(item.qty) || 0), 0);
  }, [formItems]);

  // Submit Handler
  const handleSubmitPO = async (andPrint = false) => {
    if (!formNoPO.trim()) {
      showToast('error', 'Nomor PO wajib diisi.');
      return;
    }
    if (!formBrand.trim()) {
      showToast('error', 'Brand pemesan wajib ditentukan.');
      return;
    }
    if (!formVendor.trim()) {
      showToast('error', 'Vendor/Penjahit tujuan wajib ditentukan.');
      return;
    }

    const invalidItems = formItems.filter(item => !item.namaProduk.trim() || Number(item.qty) <= 0);
    if (invalidItems.length > 0) {
      showToast('error', 'Semua item wajib memiliki Nama Model/Artikel dan Qty > 0.');
      return;
    }

    setIsSubmitting(true);

    try {
      if (editingPO) {
        // Edit existing PO
        const res = await updateProductionPO(editingPO.id, {
          noPO: formNoPO.trim(),
          brand: formBrand.trim(),
          vendorTujuan: formVendor.trim(),
          tanggalPO: formTanggal,
          targetDeadline: formDeadline,
          catatan: formCatatan.trim() || undefined,
          items: formItems.map(i => ({
            namaProduk: i.namaProduk.trim(),
            warna: i.warna.trim() || undefined,
            ukuran: i.ukuran.trim() || undefined,
            qty: Number(i.qty),
            bahanKain: i.bahanKain.trim() || undefined,
            catatan: i.catatan.trim() || undefined,
          })),
        });

        if (res.success) {
          showToast('success', 'Surat PO Produksi berhasil diperbarui di database.');
          setIsFormModalOpen(false);
          if (andPrint && res.data) {
            setPrintingPO(res.data);
          }
        } else {
          showToast('error', res.message || 'Gagal memperbarui Surat PO.');
        }
      } else {
        // Create new PO
        const res = await createProductionPO({
          noPO: formNoPO.trim(),
          brand: formBrand.trim(),
          vendorTujuan: formVendor.trim(),
          tanggalPO: formTanggal,
          targetDeadline: formDeadline,
          catatan: formCatatan.trim() || undefined,
          items: formItems.map(i => ({
            namaProduk: i.namaProduk.trim(),
            warna: i.warna.trim() || undefined,
            ukuran: i.ukuran.trim() || undefined,
            qty: Number(i.qty),
            bahanKain: i.bahanKain.trim() || undefined,
            catatan: i.catatan.trim() || undefined,
          })),
        });

        if (res.success) {
          showToast('success', 'Surat PO Produksi baru berhasil disimpan ke database.');
          setIsFormModalOpen(false);
          if (andPrint && res.data) {
            setPrintingPO(res.data);
          }
        } else {
          showToast('error', res.message || 'Gagal membuat Surat PO.');
        }
      }
    } catch (err: any) {
      showToast('error', err.message || 'Terjadi kesalahan sistem.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Status Change Handler
  const handleQuickStatusChange = async (poId: string, status: ProductionPOStatus) => {
    setIsSubmitting(true);
    const res = await updateProductionPOStatus(poId, status);
    setIsSubmitting(false);
    setStatusMenuPO(null);
    if (res.success) {
      showToast('success', res.message);
    } else {
      showToast('error', res.message);
    }
  };

  // Delete Handler
  const handleDeletePO = async () => {
    if (!deleteConfirmPO) return;
    setIsSubmitting(true);
    const res = await deleteProductionPO(deleteConfirmPO.id);
    setIsSubmitting(false);
    setDeleteConfirmPO(null);
    if (res.success) {
      showToast('success', res.message);
    } else {
      showToast('error', res.message);
    }
  };

  // Filtered POs
  const filteredPOs = useMemo(() => {
    return productionPOs.filter(po => {
      const matchBrand = selectedBrandFilter === 'ALL' || po.brand === selectedBrandFilter;
      const matchStatus = selectedStatusFilter === 'ALL' || po.status === selectedStatusFilter;

      const q = searchTerm.toLowerCase().trim();
      const matchSearch =
        !q ||
        po.noPO.toLowerCase().includes(q) ||
        po.brand.toLowerCase().includes(q) ||
        po.vendorTujuan.toLowerCase().includes(q) ||
        po.items.some(
          i =>
            i.namaProduk.toLowerCase().includes(q) ||
            (i.warna && i.warna.toLowerCase().includes(q)) ||
            (i.bahanKain && i.bahanKain.toLowerCase().includes(q))
        );

      return matchBrand && matchStatus && matchSearch;
    });
  }, [productionPOs, selectedBrandFilter, selectedStatusFilter, searchTerm]);

  // Metrics calculation
  const metrics = useMemo(() => {
    const totalPO = productionPOs.length;
    const totalPcs = productionPOs.reduce((acc, po) => acc + (po.totalPcs || 0), 0);
    const aktifPO = productionPOs.filter(po => po.status === 'DALAM_PROSES' || po.status === 'DIKIRIM').length;
    const selesaiPO = productionPOs.filter(po => po.status === 'SELESAI').length;

    return { totalPO, totalPcs, aktifPO, selesaiPO };
  }, [productionPOs]);

  const getStatusBadgeUI = (status: string) => {
    switch (status) {
      case 'SELESAI':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3" />
            Selesai
          </span>
        );
      case 'DALAM_PROSES':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
            <Clock className="w-3 h-3 animate-pulse" />
            Proses Jahit
          </span>
        );
      case 'DIKIRIM':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <Truck className="w-3 h-3" />
            Dikirim ke Konveksi
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
            <FileText className="w-3 h-3" />
            Draft PO
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-5 right-5 z-50 animate-in fade-in slide-in-from-top-3">
          <div
            className={`px-4 py-3 rounded-xl shadow-lg border text-xs font-semibold flex items-center gap-2.5 ${
              toast.type === 'success'
                ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                : 'bg-rose-50 border-rose-300 text-rose-800'
            }`}
          >
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600" />
            )}
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* Top Banner Header */}
      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-lg mb-2 border border-indigo-100">
            <FileText className="w-3.5 h-3.5" />
            <span>Surat PO Produksi</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Surat PO Produksi Konveksi
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
            Penerbitan Surat Perintah Kerja (PO Jahit / Restock) resmi untuk divisi cutting internal,
            tim jahit, dan mitra vendor makloon. Langsung tersimpan di database dan siap cetak/unduh PDF.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={async () => {
              setIsRefreshing(true);
              await fetchProductionPOs();
              setIsRefreshing(false);
              showToast('success', 'Data PO berhasil disinkronkan dari database.');
            }}
            disabled={isRefreshing}
            title="Sinkronkan dengan Database"
            className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition border border-slate-200 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={handleOpenCreateModal}
            className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-200 transition cursor-pointer"
          >
            <span>Buat Surat PO Baru</span>
          </button>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Surat PO */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Total Surat PO</span>
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <FileText className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-0.5">
            {metrics.totalPO} <span className="text-sm font-semibold text-slate-500">Dokumen</span>
          </div>
          <p className="text-xs text-slate-400">Tersimpan di database</p>
        </div>

        {/* Card 2: Total Target Pcs */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Total Target Pcs</span>
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Layers className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-0.5">
            {metrics.totalPcs.toLocaleString('id-ID')} <span className="text-sm font-semibold text-slate-500">Pcs</span>
          </div>
          <p className="text-xs text-slate-400">Akumulasi seluruh PO produksi</p>
        </div>

        {/* Card 3: PO Dalam Proses */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">PO Dalam Proses</span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-0.5">
            {metrics.aktifPO} <span className="text-sm font-semibold text-slate-500">PO</span>
          </div>
          <p className="text-xs text-slate-400">Sedang dikerjakan penjahit</p>
        </div>

        {/* Card 4: PO Selesai */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">PO Selesai</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-0.5">
            {metrics.selesaiPO} <span className="text-sm font-semibold text-slate-500">PO</span>
          </div>
          <p className="text-xs text-slate-400">Produksi selesai 100%</p>
        </div>
      </div>

      {/* Filter & Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari No. PO, Brand, Vendor, atau Model..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2.5 w-full md:w-auto flex-wrap justify-end">
          {/* Brand Filter */}
          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <span className="text-[11px] font-medium text-slate-400">Brand:</span>
            <select
              value={selectedBrandFilter}
              onChange={e => setSelectedBrandFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="ALL">Semua Brand</option>
              {brands.map(b => (
                <option key={b.id} value={b.name}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <span className="text-[11px] font-medium text-slate-400">Status:</span>
            <select
              value={selectedStatusFilter}
              onChange={e => setSelectedStatusFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="ALL">Semua Status</option>
              <option value="DRAFT">Draft PO</option>
              <option value="DIKIRIM">Dikirim ke Konveksi</option>
              <option value="DALAM_PROSES">Proses Jahit</option>
              <option value="SELESAI">Selesai</option>
            </select>
          </div>
        </div>
      </div>

      {/* Production PO Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/90 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">No. Surat PO</th>
                <th className="py-3 px-3">Tanggal & Deadline</th>
                <th className="py-3 px-3">Brand Pemesan</th>
                <th className="py-3 px-3">Vendor / Penjahit</th>
                <th className="py-3 px-3">Rincian Artikel</th>
                <th className="py-3 px-3 text-right">Total Qty</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredPOs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <FileText className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                    <p className="font-semibold text-slate-600 text-sm">Belum ada Surat PO Produksi.</p>
                    <p className="text-xs text-slate-400 mt-1">
                      Klik tombol "+ Buat Surat PO Baru" untuk membuat surat perintah kerja jahit konveksi.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredPOs.map(po => {
                  return (
                    <tr key={po.id} className="hover:bg-slate-50/70 transition">
                      {/* No PO */}
                      <td className="py-3 px-4">
                        <div className="font-mono font-bold text-slate-900 text-xs">{po.noPO}</div>
                        <div className="text-[10px] text-slate-400">ID: {po.id.slice(-6)}</div>
                      </td>

                      {/* Tanggal & Deadline */}
                      <td className="py-3 px-3">
                        <div className="text-slate-700 font-medium">
                          {po.tanggalPO ? formatDateIndo(String(po.tanggalPO).split('T')[0]) : '-'}
                        </div>
                        <div className="text-[10px] font-semibold text-rose-600 flex items-center gap-1 mt-0.5">
                          <Clock className="w-2.5 h-2.5" />
                          <span>DL: {po.targetDeadline ? formatDateIndo(String(po.targetDeadline).split('T')[0]) : '-'}</span>
                        </div>
                      </td>

                      {/* Brand */}
                      <td className="py-3 px-3">
                        <span className="inline-block px-2 py-0.5 rounded text-[11px] font-bold uppercase bg-slate-100 text-slate-800 border border-slate-200">
                          {po.brand}
                        </span>
                      </td>

                      {/* Vendor */}
                      <td className="py-3 px-3">
                        <div className="text-slate-800 font-medium text-xs">{po.vendorTujuan}</div>
                      </td>

                      {/* Item Preview */}
                      <td className="py-3 px-3">
                        <div className="space-y-0.5">
                          {po.items.slice(0, 2).map((item, idx) => (
                            <div key={idx} className="text-[11px] text-slate-700 truncate max-w-xs">
                              <span className="font-semibold text-slate-900">{item.namaProduk}</span>
                              {item.warna && <span className="text-slate-500"> ({item.warna})</span>}
                              <span className="text-indigo-600 font-bold ml-1">{item.qty} pcs</span>
                            </div>
                          ))}
                          {po.items.length > 2 && (
                            <div className="text-[10px] text-slate-400 font-semibold italic">
                              +{po.items.length - 2} artikel lainnya
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Total Qty */}
                      <td className="py-3 px-3 text-right font-mono font-bold text-xs text-indigo-700">
                        {Number(po.totalPcs).toLocaleString('id-ID')} Pcs
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3 text-center">
                        <button
                          onClick={() => setStatusMenuPO(po)}
                          title="Klik untuk ubah status pengerjaan"
                          className="transition hover:scale-105 cursor-pointer inline-block"
                        >
                          {getStatusBadgeUI(po.status)}
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setPrintingPO(po)}
                            title="Cetak / Download PDF"
                            className="p-1.5 rounded-lg border border-indigo-200 text-indigo-700 bg-indigo-50 hover:bg-indigo-100 transition cursor-pointer"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleOpenEditModal(po)}
                            title="Edit PO"
                            className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 transition cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => setStatusMenuPO(po)}
                            title="Ubah Status Pengerjaan"
                            className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 transition cursor-pointer"
                          >
                            <ChevronDown className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => setDeleteConfirmPO(po)}
                            title="Hapus PO"
                            className="p-1.5 rounded-lg border border-slate-200 text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
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

      {/* ============================================================ */}
      {/* MODAL: BUAT / EDIT SURAT PO PRODUKSI */}
      {/* ============================================================ */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full border border-slate-200 flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95">
            {/* Modal Header */}
            <div className="p-4 sm:p-6 border-b border-slate-200 flex items-center justify-between bg-slate-50/50 rounded-t-2xl">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900">
                  {editingPO ? 'Edit Surat PO Produksi' : 'Buat Surat PO Produksi Baru'}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Input manual order jahit/restock konveksi. Data tersimpan langsung ke database.
                </p>
              </div>
              <button
                onClick={() => setIsFormModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1 text-xs">
              {/* Header Fields Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* No PO */}
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Nomor PO <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formNoPO}
                    onChange={e => setFormNoPO(e.target.value)}
                    placeholder="Contoh: PO-MR-260910-001"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>

                {/* Brand */}
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Brand Pemesan <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formBrand}
                    onChange={e => handleBrandChange(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer"
                  >
                    <option value="" disabled>-- Pilih Brand Mitra --</option>
                    {brands.map(b => (
                      <option key={b.id} value={b.name}>
                        {b.name} {b.code ? `(${b.code})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Vendor Tujuan */}
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Vendor / Penjahit Tujuan <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formVendor}
                    onChange={e => setFormVendor(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer"
                  >
                    <option value="" disabled>-- Pilih Vendor / Penjahit --</option>
                    {vendors.map(v => (
                      <option key={v.id} value={v.name}>
                        {v.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Tanggal PO */}
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Tanggal Terbit</label>
                  <input
                    type="date"
                    value={formTanggal}
                    onChange={e => setFormTanggal(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>

                {/* Target Deadline */}
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Target Selesai (Deadline) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formDeadline}
                    onChange={e => setFormDeadline(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-rose-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>

                {/* Catatan Khusus */}
                <div className="sm:col-span-2 lg:col-span-1">
                  <label className="block text-slate-700 font-semibold mb-1">Catatan Instruksi</label>
                  <input
                    type="text"
                    value={formCatatan}
                    onChange={e => setFormCatatan(e.target.value)}
                    placeholder="Instruksi jahitan, aksesoris, prioritas..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
              </div>

              {/* Items Section */}
              <div className="border-t border-slate-200 pt-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      Rincian Artikel & Qty Potong Jahit
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Tambahkan rincian model baju, ukuran, dan jumlah yang harus diproduksi.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddItemRow}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 text-xs font-bold transition cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Tambah Baris Artikel</span>
                  </button>
                </div>

                <div className="space-y-2.5">
                  {formItems.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-slate-50/80 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-end"
                    >
                      {/* Nama Produk / Model */}
                      <div className="sm:col-span-4">
                        <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">
                          Model / Artikel <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={item.namaProduk}
                          onChange={e => handleItemChange(idx, 'namaProduk', e.target.value)}
                          placeholder="Misal: Gamis Rayon, Tunik..."
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
                        />
                      </div>

                      {/* Warna */}
                      <div className="sm:col-span-2">
                        <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">
                          Warna
                        </label>
                        <input
                          type="text"
                          value={item.warna}
                          onChange={e => handleItemChange(idx, 'warna', e.target.value)}
                          placeholder="Hitam, Sage..."
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
                        />
                      </div>

                      {/* Ukuran */}
                      <div className="sm:col-span-2">
                        <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">
                          Ukuran
                        </label>
                        <input
                          type="text"
                          value={item.ukuran}
                          onChange={e => handleItemChange(idx, 'ukuran', e.target.value)}
                          placeholder="S, M, L, XL, All Size..."
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
                        />
                      </div>

                      {/* Qty Pcs */}
                      <div className="sm:col-span-2">
                        <label className="block text-[10px] font-bold text-indigo-700 uppercase mb-0.5">
                          Qty (Pcs) <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={item.qty}
                          onChange={e => handleItemChange(idx, 'qty', e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-white border border-indigo-200 rounded-lg text-xs font-bold text-indigo-700 font-mono text-right focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
                        />
                      </div>

                      {/* Bahan / Kain */}
                      <div className="sm:col-span-2 flex items-center gap-1.5">
                        <div className="flex-1">
                          <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">
                            Bahan / Kain
                          </label>
                          <input
                            type="text"
                            value={item.bahanKain}
                            onChange={e => handleItemChange(idx, 'bahanKain', e.target.value)}
                            placeholder="Rayon Twill, Katun..."
                            className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
                          />
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveItemRow(idx)}
                          title="Hapus baris"
                          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition shrink-0 mt-4 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 sm:p-6 border-t border-slate-200 bg-slate-50/70 rounded-b-2xl flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-xs font-bold text-slate-700 flex items-center gap-2">
                <span>Total Estimasi Order:</span>
                <span className="px-3 py-1 rounded-lg bg-indigo-100 text-indigo-900 text-sm font-mono font-bold">
                  {formTotalPcs.toLocaleString('id-ID')} Pcs
                </span>
                <span className="text-[11px] text-slate-400 font-normal">({formItems.length} artikel)</span>
              </div>

              <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={() => setIsFormModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-200/70 rounded-xl transition cursor-pointer"
                >
                  Batal
                </button>

                <button
                  type="button"
                  onClick={() => handleSubmitPO(false)}
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md shadow-indigo-200 transition disabled:opacity-50 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSubmitting ? 'Menyimpan...' : 'Simpan'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL: CETAK / UNDUH PDF */}
      {/* ============================================================ */}
      {printingPO && (
        <ProductionPOPrintModal
          po={printingPO}
          onClose={() => setPrintingPO(null)}
        />
      )}

      {/* ============================================================ */}
      {/* DIALOG: KONFIRMASI HAPUS PO */}
      {/* ============================================================ */}
      {deleteConfirmPO && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mb-4">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-1">Hapus Surat PO Produksi?</h3>
            <p className="text-xs text-slate-600 mb-4 leading-relaxed">
              Apakah Anda yakin ingin menghapus Surat PO <span className="font-bold text-slate-900">{deleteConfirmPO.noPO}</span> ({deleteConfirmPO.brand}) dari database? Tindakan ini tidak dapat dibatalkan.
            </p>
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setDeleteConfirmPO(null)}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition"
              >
                Batal
              </button>
              <button
                onClick={handleDeletePO}
                disabled={isSubmitting}
                className="px-5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow transition disabled:opacity-50"
              >
                {isSubmitting ? 'Menghapus...' : 'Ya, Hapus dari Database'}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ============================================================ */}
      {/* DIALOG: UBAH STATUS PO CEPAT (CENTERED MODAL) */}
      {/* ============================================================ */}
      {statusMenuPO && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-5 border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h4 className="text-sm font-bold text-slate-900">Ubah Status PO</h4>
                <p className="text-[11px] font-mono text-slate-500 mt-0.5">
                  {statusMenuPO.noPO} • Brand {statusMenuPO.brand}
                </p>
              </div>
              <button
                onClick={() => setStatusMenuPO(null)}
                className="p-1.5 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-700 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="py-4 space-y-2">
              {[
                {
                  value: 'DRAFT',
                  label: 'Draft PO',
                  desc: 'PO baru dibuat, belum diserahkan ke penjahit',
                  badge: 'bg-slate-100 text-slate-700 border-slate-200',
                  icon: FileText,
                },
                {
                  value: 'DIKIRIM',
                  label: 'Dikirim ke Konveksi',
                  desc: 'PO & kain sudah dikirim ke vendor penjahit',
                  badge: 'bg-amber-50 text-amber-700 border-amber-200',
                  icon: Truck,
                },
                {
                  value: 'DALAM_PROSES',
                  label: 'Proses Jahit',
                  desc: 'Sedang dalam pengerjaan potong & jahit',
                  badge: 'bg-blue-50 text-blue-700 border-blue-200',
                  icon: Clock,
                },
                {
                  value: 'SELESAI',
                  label: 'Selesai',
                  desc: 'Seluruh pesanan selesai dijahit & QC lolos',
                  badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
                  icon: CheckCircle2,
                },
              ].map(opt => {
                const isSelected = statusMenuPO.status === opt.value;
                const Icon = opt.icon;
                return (
                  <button
                    key={opt.value}
                    onClick={() => handleQuickStatusChange(statusMenuPO.id, opt.value as ProductionPOStatus)}
                    disabled={isSubmitting}
                    className={`w-full text-left p-3 rounded-xl border transition flex items-center justify-between cursor-pointer ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/70 shadow-sm ring-1 ring-indigo-500/20'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <div className={`p-1.5 rounded-lg border shrink-0 mt-0.5 ${opt.badge}`}>
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <div className={`text-xs font-bold ${isSelected ? 'text-indigo-950' : 'text-slate-800'}`}>
                          {opt.label}
                        </div>
                        <div className="text-[10px] text-slate-500 leading-tight mt-0.5">
                          {opt.desc}
                        </div>
                      </div>
                    </div>
                    {isSelected && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-600 text-white shrink-0">
                        Aktif
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="pt-2 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setStatusMenuPO(null)}
                className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
