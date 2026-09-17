import React, { useState, useMemo, useEffect } from 'react';
import {
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  PlayCircle,
  Plus,
  Trash2,
  Printer,
  Sparkles,
  Layers,
  Save,
  RotateCcw,
  Check,
  ChevronRight,
  ShieldCheck,
  Building2,
  Package,
  Scissors,
  Truck,
  FileSpreadsheet,
} from 'lucide-react';
import {
  ProductionTimeline,
  ProductionStage,
  ProductionStageCategory,
  ProductionStageStatus,
  TimelineOverallStatus,
  FobPurchaseOrder,
} from '../../types';
import { formatDateIndo } from '../../utils/formatters';

interface FobTimelineTabProps {
  timelines: ProductionTimeline[];
  orders: FobPurchaseOrder[];
  onSaveTimeline: (timeline: Partial<ProductionTimeline>) => Promise<{ success: boolean; data?: ProductionTimeline; error?: string }>;
  onUpdateTimeline: (id: string, timeline: Partial<ProductionTimeline>) => Promise<{ success: boolean; error?: string }>;
  onDeleteTimeline: (id: string) => Promise<{ success: boolean; error?: string }>;
  onPrintTimeline: (timeline: ProductionTimeline) => void;
}

// Helper presets
const PRESET_TEMPLATES: Record<string, { label: string; days: number; stages: Omit<ProductionStage, 'id' | 'startDate' | 'endDate'>[] }> = {
  STANDAR_14: {
    label: 'Kaos / T-Shirt / Polo (14 Hari)',
    days: 14,
    stages: [
      { name: 'Konfirmasi PO & Verifikasi DP', category: 'PRE_PRODUCTION', description: 'Pemeriksaan PO dan konfirmasi DP 50%', picVendor: 'Finance & PPIC', durationDays: 2, progressPercent: 100, status: 'SELESAI' },
      { name: 'Pengadaan Kain & Aksesoris', category: 'FABRIC_TRIMS', description: 'Kedatangan bahan rol kain dan rib/kancing', picVendor: 'Gudang Bahan', durationDays: 3, progressPercent: 100, status: 'SELESAI' },
      { name: 'Spreading & Pemotongan (Cutting)', category: 'CUTTING', description: 'Gelar kain, istirahat kain 24 jam & cutting presisi', picVendor: 'Tim Potong', durationDays: 2, progressPercent: 60, status: 'SEDANG_PROSES' },
      { name: 'Aplikasi Sablon / Bordir Panel', category: 'DECORATION', description: 'Sablon DTF/Plastisol atau bordir komputer', picVendor: 'Vendor Dekorasi', durationDays: 2, progressPercent: 0, status: 'MENUNGGU' },
      { name: 'Jahit & Assembling CMT', category: 'SEWING_CMT', description: 'Obras, jahit rantai pundak, overdeck leher & lipat', picVendor: 'Vendor CMT', durationDays: 3, progressPercent: 0, status: 'MENUNGGU' },
      { name: 'Finishing, QC End-Line & Steam', category: 'FINISHING_QC', description: 'Trimming sisa benang, steam uap, QC ukuran', picVendor: 'Tim QC Garment', durationDays: 1, progressPercent: 0, status: 'MENUNGGU' },
      { name: 'Packing Polybag & Pengiriman Ekspedisi', category: 'DELIVERY', description: 'Pelunasan PO, tagging barcode, dan dispatch kurir', picVendor: 'Logistik', durationDays: 1, progressPercent: 0, status: 'MENUNGGU' },
    ],
  },
  KEMEJA_21: {
    label: 'Kemeja / Seragam / PDL (21 Hari)',
    days: 21,
    stages: [
      { name: 'Finalisasi Desain, Spek & DP', category: 'PRE_PRODUCTION', description: 'Approval techpack & transfer DP produksi', picVendor: 'PPIC & Merchandiser', durationDays: 3, progressPercent: 100, status: 'SELESAI' },
      { name: 'Pengadaan Bahan Utama & Furing', category: 'FABRIC_TRIMS', description: 'Kain drill/tropical, kancing, benang & interlining', picVendor: 'Gudang Kain', durationDays: 4, progressPercent: 100, status: 'SELESAI' },
      { name: 'Sample Approval (PP Sample)', category: 'PRE_PRODUCTION', description: 'Pembuatan 1 pcs sampel fit & persetujuan buyer', picVendor: 'Pattern Maker', durationDays: 3, progressPercent: 100, status: 'SELESAI' },
      { name: 'Cutting & Fusing Kerah/Manset', category: 'CUTTING', description: 'Pemotongan badan, lengan, kantong & press lem interlining', picVendor: 'Tim Potong', durationDays: 3, progressPercent: 50, status: 'SEDANG_PROSES' },
      { name: 'Bordir Komputer Logo & Identitas', category: 'DECORATION', description: 'Bordir dada, punggung, dan badge lengan', picVendor: 'Vendor Bordir', durationDays: 3, progressPercent: 0, status: 'MENUNGGU' },
      { name: 'Proses Jahit, Lubang Kancing & Bartack', category: 'SEWING_CMT', description: 'Perakitan kerah, pasang kancing, jahit sisi & stik', picVendor: 'Vendor CMT', durationDays: 4, progressPercent: 0, status: 'MENUNGGU' },
      { name: 'Finishing, QC Ukuran & Packing Box', category: 'FINISHING_QC', description: 'Gosok uap rapi, folding, karton box packing', picVendor: 'Tim QC', durationDays: 2, progressPercent: 0, status: 'MENUNGGU' },
      { name: 'Pelunasan & Pengiriman Armada', category: 'DELIVERY', description: 'Serah terima invoice pelunasan dan kirim ke gudang buyer', picVendor: 'Ekspedisi', durationDays: 1, progressPercent: 0, status: 'MENUNGGU' },
    ],
  },
  JAKET_PUFFER_30: {
    label: 'Jaket / Puffer / Outerwear (30 Hari)',
    days: 30,
    stages: [
      { name: 'Konfirmasi PO & Techpack Matang', category: 'PRE_PRODUCTION', description: 'Verifikasi klausul PO, size chart & spek padding', picVendor: 'PPIC & Finance', durationDays: 3, progressPercent: 100, status: 'SELESAI' },
      { name: 'Pengadaan Kain Shell, Furing & Dacron', category: 'FABRIC_TRIMS', description: 'Kain parasut micro, furing asahi & dacron 6oz', picVendor: 'Procurement', durationDays: 6, progressPercent: 100, status: 'SELESAI' },
      { name: 'Pengadaan Zipper Metal & Trims Khusus', category: 'FABRIC_TRIMS', description: 'Zipper vislon double-slider, tali stopper & snap button', picVendor: 'Trims Vendor', durationDays: 5, progressPercent: 100, status: 'SELESAI' },
      { name: 'Approval Sample & Pola Grading', category: 'PRE_PRODUCTION', description: 'PP sample disetujui buyer untuk lanjut mass production', picVendor: 'Pattern Room', durationDays: 4, progressPercent: 100, status: 'SELESAI' },
      { name: 'Quilting & Pemotongan Presisi', category: 'CUTTING', description: 'Pola quilting dacron dan cutting badan jaket', picVendor: 'Tim Cutting', durationDays: 4, progressPercent: 75, status: 'SEDANG_PROSES' },
      { name: 'Bordir / Patch Emblem Karet', category: 'DECORATION', description: 'Aplikasi patch rubber & bordir logo', picVendor: 'Vendor Bordir', durationDays: 3, progressPercent: 0, status: 'MENUNGGU' },
      { name: 'Assembling Sewing CMT Jaket', category: 'SEWING_CMT', description: 'Jahit panel quilted, pasang zipper saku, hoodie & karet', picVendor: 'Vendor CMT', durationDays: 6, progressPercent: 0, status: 'MENUNGGU' },
      { name: 'Finishing, Trimming & QC Ketat', category: 'FINISHING_QC', description: 'Inspeksi jahitan bocor dacron, tes zipper & steam', picVendor: 'QC End-Line', durationDays: 3, progressPercent: 0, status: 'MENUNGGU' },
      { name: 'Polybag Individual & Master Box', category: 'FINISHING_QC', description: 'Barcode SKU, hangtag & penataan per box', picVendor: 'Packing Team', durationDays: 1, progressPercent: 0, status: 'MENUNGGU' },
      { name: 'Pelunasan PO & Pengiriman Outbound', category: 'DELIVERY', description: 'Pengiriman surat jalan dan dispatch logistik', picVendor: 'Logistik', durationDays: 1, progressPercent: 0, status: 'MENUNGGU' },
    ],
  },
};

function calculateStageDates(startDateStr: string, stages: Omit<ProductionStage, 'id' | 'startDate' | 'endDate'>[]): ProductionStage[] {
  let currentDate = new Date(startDateStr);
  if (isNaN(currentDate.getTime())) currentDate = new Date();

  return stages.map((stg, idx) => {
    const sDate = new Date(currentDate);
    const duration = Math.max(1, stg.durationDays || 1);
    const eDate = new Date(sDate.getTime() + (duration - 1) * 86400000);

    // Majukan current date untuk tahapan berikutnya
    currentDate = new Date(eDate.getTime() + 86400000);

    return {
      ...stg,
      id: `stg-${idx + 1}-${Math.random().toString(36).substring(2, 6)}`,
      startDate: sDate.toISOString().substring(0, 10),
      endDate: eDate.toISOString().substring(0, 10),
    };
  });
}

export const FobTimelineTab: React.FC<FobTimelineTabProps> = ({
  timelines,
  orders,
  onSaveTimeline,
  onUpdateTimeline,
  onDeleteTimeline,
  onPrintTimeline,
}) => {
  // Active Timeline Selector
  const [selectedTimelineId, setSelectedTimelineId] = useState<string>(() => {
    return timelines.length > 0 ? timelines[0].id : '';
  });

  // Current Working Timeline State
  const activeTimeline = useMemo(() => {
    return timelines.find((t) => t.id === selectedTimelineId) || timelines[0] || null;
  }, [timelines, selectedTimelineId]);

  // Form Editing State
  const [poNumber, setPoNumber] = useState('');
  const [brand, setBrand] = useState('');
  const [vendor, setVendor] = useState('');
  const [productName, setProductName] = useState('');
  const [totalQty, setTotalQty] = useState<number>(0);
  const [startDate, setStartDate] = useState(new Date().toISOString().substring(0, 10));
  const [targetDeliveryDate, setTargetDeliveryDate] = useState(
    new Date(Date.now() + 14 * 86400000).toISOString().substring(0, 10)
  );
  const [notes, setNotes] = useState('');
  const [stages, setStages] = useState<ProductionStage[]>([]);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState(false);

  // Sync state when activeTimeline changes
  useEffect(() => {
    if (activeTimeline) {
      setPoNumber(activeTimeline.poNumber || '');
      setBrand(activeTimeline.brand || '');
      setVendor(activeTimeline.vendor || '');
      setProductName(activeTimeline.productName || '');
      setTotalQty(activeTimeline.totalQty || 0);
      setStartDate(activeTimeline.startDate || new Date().toISOString().substring(0, 10));
      setTargetDeliveryDate(activeTimeline.targetDeliveryDate || new Date(Date.now() + 14 * 86400000).toISOString().substring(0, 10));
      setNotes(activeTimeline.notes || '');
      setStages(activeTimeline.stages || []);
    }
  }, [activeTimeline]);

  // Overall progress calculation
  const overallProgress = useMemo(() => {
    if (stages.length === 0) return 0;
    const sum = stages.reduce((acc, s) => acc + (s.progressPercent || 0), 0);
    return Math.round(sum / stages.length);
  }, [stages]);

  // Total days calculation
  const totalDays = useMemo(() => {
    const s = new Date(startDate).getTime();
    const e = new Date(targetDeliveryDate).getTime();
    if (isNaN(s) || isNaN(e) || e < s) return stages.reduce((acc, stg) => acc + (stg.durationDays || 1), 0);
    return Math.max(1, Math.round((e - s) / 86400000) + 1);
  }, [startDate, targetDeliveryDate, stages]);

  // Overall status evaluation
  const overallStatus: TimelineOverallStatus = useMemo(() => {
    if (overallProgress === 100) return 'SELESAI';
    const hasDelayed = stages.some((s) => s.status === 'TERLAMBAT');
    if (hasDelayed) return 'AT_RISK';
    const hasProgress = stages.some((s) => s.status === 'SEDANG_PROSES' || s.progressPercent > 0);
    if (hasProgress) return 'ON_TRACK';
    return 'DRAF';
  }, [stages, overallProgress]);

  // Handle Load from Existing PO Brand
  const handleSelectExistingPo = (poNum: string) => {
    const found = orders.find((o) => o.poNumber === poNum);
    if (found) {
      setPoNumber(found.poNumber);
      setBrand(found.brand);
      setVendor(found.vendor || '');
      setProductName(found.skuInduk);
      setTotalQty(found.totalQty || 0);
      const start = found.tanggalPo ? found.tanggalPo.substring(0, 10) : new Date().toISOString().substring(0, 10);
      const end = found.targetTiba
        ? found.targetTiba.substring(0, 10)
        : new Date(new Date(start).getTime() + (found.deadlineDays || 14) * 86400000).toISOString().substring(0, 10);
      setStartDate(start);
      setTargetDeliveryDate(end);

      // Otomatis terapkan preset jika belum ada tahapan
      if (stages.length === 0) {
        const tpl = PRESET_TEMPLATES.STANDAR_14;
        const newStages = calculateStageDates(start, tpl.stages);
        setStages(newStages);
      }
    }
  };

  // Handle Apply Preset Template
  const handleApplyPreset = (presetKey: string) => {
    const tpl = PRESET_TEMPLATES[presetKey];
    if (!tpl) return;
    const newStages = calculateStageDates(startDate, tpl.stages);
    setStages(newStages);
    const end = new Date(new Date(startDate).getTime() + (tpl.days - 1) * 86400000).toISOString().substring(0, 10);
    setTargetDeliveryDate(end);
  };

  // Handle Stage Changes
  const handleUpdateStage = (id: string, field: keyof ProductionStage, value: any) => {
    setStages((prev) =>
      prev.map((stg) => {
        if (stg.id === id) {
          const updated = { ...stg, [field]: value };
          // Auto update status if progress is changed
          if (field === 'progressPercent') {
            const num = Number(value);
            if (num >= 100) updated.status = 'SELESAI';
            else if (num > 0) updated.status = 'SEDANG_PROSES';
            else updated.status = 'MENUNGGU';
          }
          return updated;
        }
        return stg;
      })
    );
  };

  // Handle Add Stage
  const handleAddStage = () => {
    const lastStage = stages[stages.length - 1];
    const sDate = lastStage ? lastStage.endDate : startDate;
    const eDate = new Date(new Date(sDate).getTime() + 86400000 * 2).toISOString().substring(0, 10);

    const newStage: ProductionStage = {
      id: `stg-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      name: 'Tahapan Tambahan Produksi',
      category: 'SEWING_CMT',
      description: 'Deskripsi rincian proses pengerjaan baru',
      picVendor: vendor || 'In-House MRM',
      startDate: sDate,
      endDate: eDate,
      durationDays: 2,
      progressPercent: 0,
      status: 'MENUNGGU',
    };
    setStages((prev) => [...prev, newStage]);
  };

  // Handle Delete Stage
  const handleDeleteStage = (id: string) => {
    setStages((prev) => prev.filter((s) => s.id !== id));
  };

  // Handle Save
  const handleSave = async () => {
    const timelineData: Partial<ProductionTimeline> = {
      id: activeTimeline ? activeTimeline.id : `tl-${Date.now()}`,
      poNumber: poNumber.trim() || 'PO-DRAF',
      brand: brand.trim() || 'BRAND UMUM',
      vendor: vendor.trim() || 'IN-HOUSE',
      productName: productName.trim() || 'PRODUK GARMENT',
      totalQty: totalQty || 0,
      startDate,
      targetDeliveryDate,
      totalDays,
      stages,
      overallProgress,
      status: overallStatus,
      notes,
    };

    if (activeTimeline) {
      await onUpdateTimeline(activeTimeline.id, timelineData);
    } else {
      const res = await onSaveTimeline(timelineData);
      if (res.data) setSelectedTimelineId(res.data.id);
    }

    setSaveSuccessMsg(true);
    setTimeout(() => setSaveSuccessMsg(false), 3000);
  };

  // Handle New Timeline
  const handleCreateNewTimeline = () => {
    const tpl = PRESET_TEMPLATES.STANDAR_14;
    const today = new Date().toISOString().substring(0, 10);
    const newStages = calculateStageDates(today, tpl.stages);

    const newTl: Partial<ProductionTimeline> = {
      id: `tl-${Date.now()}`,
      poNumber: 'PO-NEW',
      brand: '',
      vendor: '',
      productName: '',
      totalQty: 0,
      startDate: today,
      targetDeliveryDate: new Date(Date.now() + 14 * 86400000).toISOString().substring(0, 10),
      totalDays: 14,
      stages: newStages,
      overallProgress: 0,
      status: 'DRAF',
      notes: '',
    };
    onSaveTimeline(newTl).then((res) => {
      if (res.data) setSelectedTimelineId(res.data.id);
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* 1. TOP SELECTOR & ACTION HEADER */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-lg mb-1 border border-indigo-100">
              <Calendar className="w-3.5 h-3.5" />
              <span>Time & Action Schedule (T&A)</span>
            </div>
            <h2 className="text-lg font-black text-slate-900">Timeline & Jadwal Pengerjaan Produksi</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Rincikan estimasi durasi dan progres riil pengerjaan per tahapan produksi garansi tepat waktu untuk buyer.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Buat Timeline Baru */}
            <button
              onClick={handleCreateNewTimeline}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Timeline Baru</span>
            </button>

            {/* Cetak untuk Buyer */}
            {activeTimeline && (
              <button
                onClick={() => onPrintTimeline({ ...activeTimeline, poNumber, brand, vendor, productName, totalQty, startDate, targetDeliveryDate, totalDays, stages, overallProgress, status: overallStatus, notes })}
                className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition cursor-pointer"
              >
                <Printer className="w-4 h-4 text-indigo-600" />
                <span>Cetak Jadwal Buyer (PDF)</span>
              </button>
            )}

            {/* Simpan Perubahan */}
            <button
              onClick={handleSave}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition btn-press cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Simpan Timeline</span>
            </button>
          </div>
        </div>

        {saveSuccessMsg && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-800 flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Jadwal timeline produksi berhasil disimpan ke database.</span>
          </div>
        )}

        {/* CONTROLS BAR: TIMELINE SELECTOR, PRESET & PO SYNC */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-3 border-t border-slate-100 text-xs">
          {/* Timeline Aktif */}
          <div>
            <label className="block text-slate-500 font-bold mb-1">Pilih Timeline Proyek Aktif</label>
            <select
              value={selectedTimelineId}
              onChange={(e) => setSelectedTimelineId(e.target.value)}
              className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              {timelines.map((tl) => (
                <option key={tl.id} value={tl.id}>
                  {tl.poNumber} - {tl.brand} ({tl.productName}) [{tl.overallProgress}%]
                </option>
              ))}
            </select>
          </div>

          {/* Tarik dari PO Brand yang Sudah Ada */}
          <div>
            <label className="block text-slate-500 font-bold mb-1">Sinkronisasi Data dari PO Brand</label>
            <select
              onChange={(e) => handleSelectExistingPo(e.target.value)}
              defaultValue=""
              className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="" disabled>
                -- Pilih PO Masuk untuk Diisi Otomatis --
              </option>
              {orders.map((o) => (
                <option key={o.id} value={o.poNumber}>
                  {o.poNumber} • {o.brand} • {o.skuInduk} ({o.totalQty} Pcs)
                </option>
              ))}
            </select>
          </div>

          {/* Muat Template Preset Alur Produksi */}
          <div>
            <label className="block text-slate-500 font-bold mb-1 flex items-center gap-1 text-indigo-700">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Ganti Alur dengan Template Preset</span>
            </label>
            <select
              onChange={(e) => handleApplyPreset(e.target.value)}
              defaultValue=""
              className="w-full py-2 px-3 bg-indigo-50/50 border border-indigo-200 rounded-xl font-bold text-indigo-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="" disabled>
                -- Pilih Preset Standar Industri --
              </option>
              <option value="STANDAR_14">{PRESET_TEMPLATES.STANDAR_14.label}</option>
              <option value="KEMEJA_21">{PRESET_TEMPLATES.KEMEJA_21.label}</option>
              <option value="JAKET_PUFFER_30">{PRESET_TEMPLATES.JAKET_PUFFER_30.label}</option>
            </select>
          </div>
        </div>
      </div>

      {/* 2. KPI METRIC SUMMARY CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* Card 1: Total Durasi & Target */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Durasi Proyek</span>
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
              <Clock className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
            {totalDays} <span className="text-sm font-semibold text-slate-500">Hari</span>
          </div>
          <p className="text-xs text-slate-400 font-medium">
            {formatDateIndo(startDate)} s/d {formatDateIndo(targetDeliveryDate)}
          </p>
        </div>

        {/* Card 2: Total Order Volume */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Kuantitas Order</span>
            <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
              <Package className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
            {totalQty.toLocaleString('id-ID')} <span className="text-sm font-semibold text-slate-500">Pcs</span>
          </div>
          <p className="text-xs text-slate-400 font-medium truncate">
            {productName || 'Belum ditentukan'}
          </p>
        </div>

        {/* Card 3: Progres Keseluruhan */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Progres Produksi</span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <PlayCircle className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-blue-700 mt-1">
            {overallProgress}%
          </div>
          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${
                overallProgress === 100 ? 'bg-emerald-600' : 'bg-blue-600'
              }`}
              style={{ width: `${overallProgress}%` }}
            />
          </div>
        </div>

        {/* Card 4: Status Operasional */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Kesiapan Pabrik</span>
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                overallStatus === 'SELESAI'
                  ? 'bg-emerald-50 text-emerald-600'
                  : overallStatus === 'AT_RISK'
                  ? 'bg-rose-50 text-rose-600'
                  : 'bg-emerald-50 text-emerald-600'
              }`}
            >
              <ShieldCheck className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="mt-1">
            <span
              className={`inline-block px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wider ${
                overallStatus === 'SELESAI'
                  ? 'bg-emerald-100 text-emerald-800'
                  : overallStatus === 'AT_RISK'
                  ? 'bg-rose-100 text-rose-800'
                  : 'bg-indigo-100 text-indigo-800'
              }`}
            >
              {overallStatus === 'ON_TRACK' ? 'ON TRACK (SESUAI)' : overallStatus}
            </span>
          </div>
          <p className="text-xs text-slate-400 font-medium">
            {stages.filter((s) => s.status === 'SELESAI').length} dari {stages.length} Tahapan Selesai
          </p>
        </div>
      </div>

      {/* 3. PROYEK INFO HEADER FORM */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
        <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
          <Building2 className="w-4 h-4 text-indigo-600" />
          <span>Informasi Identitas Pesanan & Rencana Waktu</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
          <div>
            <label className="block text-slate-500 font-semibold mb-1">No. PO Brand</label>
            <input
              type="text"
              value={poNumber}
              onChange={(e) => setPoNumber(e.target.value)}
              placeholder="e.g. PO-PH-0002"
              className="w-full py-1.5 px-2.5 rounded-lg border border-slate-200 font-bold text-slate-900 focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-slate-500 font-semibold mb-1">Brand / Buyer</label>
            <input
              type="text"
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              placeholder="e.g. MONTURE"
              className="w-full py-1.5 px-2.5 rounded-lg border border-slate-200 font-bold text-slate-900 focus:ring-1 focus:ring-indigo-500 uppercase"
            />
          </div>

          <div>
            <label className="block text-slate-500 font-semibold mb-1">Vendor Pelaksana (CMT)</label>
            <input
              type="text"
              value={vendor}
              onChange={(e) => setVendor(e.target.value)}
              placeholder="e.g. TRIKARSA"
              className="w-full py-1.5 px-2.5 rounded-lg border border-slate-200 font-bold text-slate-900 focus:ring-1 focus:ring-indigo-500 uppercase"
            />
          </div>

          <div>
            <label className="block text-slate-500 font-semibold mb-1">Nama Model / Artikel</label>
            <input
              type="text"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              placeholder="e.g. ROMPI HOODIE PUFFER"
              className="w-full py-1.5 px-2.5 rounded-lg border border-slate-200 font-bold text-indigo-900 focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-slate-500 font-semibold mb-1">Tanggal Mulai Produksi</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                const newStart = e.target.value;
                setStartDate(newStart);
                if (stages.length > 0) {
                  const recalculated = calculateStageDates(newStart, stages);
                  setStages(recalculated);
                }
              }}
              className="w-full py-1.5 px-2.5 rounded-lg border border-slate-200 font-bold text-slate-900 focus:ring-1 focus:ring-indigo-500 cursor-pointer"
            />
          </div>

          <div>
            <label className="block text-slate-500 font-semibold mb-1">Target Deadline Tiba</label>
            <input
              type="date"
              value={targetDeliveryDate}
              onChange={(e) => setTargetDeliveryDate(e.target.value)}
              className="w-full py-1.5 px-2.5 rounded-lg border border-slate-200 font-bold text-emerald-800 focus:ring-1 focus:ring-indigo-500 cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* 4. VISUAL GANTT / TIMELINE MILESTONE TRACKER */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-600" />
              <span>Visualisasi Alur & Progres Pengerjaan (Gantt Milestones)</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Grafik alur kronologis tahapan garmen dari hulu ke hilir beserta capaian progres riil.
            </p>
          </div>
          <span className="text-xs font-bold px-3 py-1 bg-slate-100 text-slate-700 rounded-full border border-slate-200">
            {stages.length} Tahapan Terjadwal
          </span>
        </div>

        {/* Milestone Steps Bar */}
        <div className="space-y-3 pt-2">
          {stages.map((stage, idx) => (
            <div
              key={stage.id}
              className="p-3.5 rounded-xl border border-slate-200/90 bg-slate-50/50 hover:bg-white hover:border-indigo-200 transition space-y-2"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white font-bold flex items-center justify-center text-[11px] shrink-0">
                    {idx + 1}
                  </span>
                  <span className="font-bold text-slate-900 text-sm">{stage.name}</span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-200 text-slate-700">
                    {stage.category}
                  </span>
                  {stage.picVendor && (
                    <span className="text-[11px] text-slate-500 font-medium">
                      PIC: <strong>{stage.picVendor}</strong>
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-500 font-medium">
                    {formatDateIndo(stage.startDate)} → {formatDateIndo(stage.endDate)} ({stage.durationDays} Hari)
                  </span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      stage.status === 'SELESAI'
                        ? 'bg-emerald-100 text-emerald-800'
                        : stage.status === 'SEDANG_PROSES'
                        ? 'bg-blue-100 text-blue-800'
                        : stage.status === 'TERLAMBAT'
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {stage.status}
                  </span>
                </div>
              </div>

              {/* Progress Slider & Bar */}
              <div className="flex items-center gap-3">
                <div className="flex-1 h-3 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${
                      stage.progressPercent === 100
                        ? 'bg-emerald-500'
                        : stage.progressPercent > 0
                        ? 'bg-indigo-600'
                        : 'bg-slate-300'
                    }`}
                    style={{ width: `${stage.progressPercent}%` }}
                  />
                </div>
                <span className="text-xs font-black text-slate-800 tabular-nums w-12 text-right">
                  {stage.progressPercent}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 5. INTERACTIVE STAGE EDITING TABLE */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-indigo-600" />
              <span>Tabel Rincian Parameter Tahapan Pengerjaan Produksi</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Sesuaikan durasi hari, tanggal target, PIC pelaksana, dan update progres aktual secara langsung.
            </p>
          </div>

          <button
            onClick={handleAddStage}
            className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-sm transition btn-press cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Tahapan</span>
          </button>
        </div>

        {/* TABLE */}
        <div className="overflow-x-auto border border-slate-200 rounded-xl">
          <table className="w-full text-xs">
            <thead className="bg-slate-50 text-slate-700 text-[11px] uppercase font-bold border-b border-slate-200">
              <tr>
                <th className="py-2 px-2 text-center w-8">#</th>
                <th className="py-2 px-3 text-left min-w-[200px]">Nama Tahapan Proses</th>
                <th className="py-2 px-2.5 text-left w-36">Kategori</th>
                <th className="py-2 px-2.5 text-left w-36">PIC / Vendor</th>
                <th className="py-2 px-2 text-center w-28">Tgl Mulai</th>
                <th className="py-2 px-2 text-center w-28">Tgl Selesai</th>
                <th className="py-2 px-2 text-center w-20">Durasi (Hari)</th>
                <th className="py-2 px-3 text-center w-36">Progres (% Selesai)</th>
                <th className="py-2 px-2.5 text-center w-32">Status</th>
                <th className="py-2 px-2 text-center w-10">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {stages.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-10 text-center text-slate-400">
                    Belum ada tahapan jadwal produksi. Klik tombol &ldquo;Tambah Tahapan&rdquo; atau pilih salah satu
                    template preset di atas.
                  </td>
                </tr>
              ) : (
                stages.map((stage, idx) => (
                  <tr key={stage.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-2 px-2 text-center font-bold text-slate-400">{idx + 1}</td>

                    {/* Nama & Deskripsi */}
                    <td className="py-2 px-3">
                      <input
                        type="text"
                        value={stage.name}
                        onChange={(e) => handleUpdateStage(stage.id, 'name', e.target.value)}
                        className="w-full py-1 px-2 rounded-lg border border-slate-200 font-bold text-slate-900 focus:ring-1 focus:ring-indigo-500 mb-1"
                        placeholder="Nama Tahapan"
                      />
                      <input
                        type="text"
                        value={stage.description || ''}
                        onChange={(e) => handleUpdateStage(stage.id, 'description', e.target.value)}
                        className="w-full py-0.5 px-2 rounded border border-slate-200 text-[11px] text-slate-500 focus:ring-1 focus:ring-indigo-500"
                        placeholder="Rincian proses..."
                      />
                    </td>

                    {/* Kategori */}
                    <td className="py-2 px-2.5">
                      <select
                        value={stage.category}
                        onChange={(e) => handleUpdateStage(stage.id, 'category', e.target.value)}
                        className="w-full py-1 px-2 rounded-lg border border-slate-200 font-medium text-slate-700 focus:ring-1 focus:ring-indigo-500 cursor-pointer text-[11px]"
                      >
                        <option value="PRE_PRODUCTION">Pre-Production</option>
                        <option value="FABRIC_TRIMS">Kain & Trims</option>
                        <option value="CUTTING">Cutting</option>
                        <option value="DECORATION">Bordir / Sablon</option>
                        <option value="SEWING_CMT">Sewing (CMT)</option>
                        <option value="FINISHING_QC">Finishing & QC</option>
                        <option value="DELIVERY">Delivery</option>
                      </select>
                    </td>

                    {/* PIC / Pelaksana */}
                    <td className="py-2 px-2.5">
                      <input
                        type="text"
                        value={stage.picVendor || ''}
                        onChange={(e) => handleUpdateStage(stage.id, 'picVendor', e.target.value)}
                        className="w-full py-1 px-2 rounded-lg border border-slate-200 font-medium text-slate-800 focus:ring-1 focus:ring-indigo-500 text-[11px]"
                        placeholder="Nama PIC / Konveksi"
                      />
                    </td>

                    {/* Tanggal Mulai */}
                    <td className="py-2 px-2 text-center">
                      <input
                        type="date"
                        value={stage.startDate}
                        onChange={(e) => handleUpdateStage(stage.id, 'startDate', e.target.value)}
                        className="w-full py-1 px-1 rounded-lg border border-slate-200 font-medium text-slate-800 text-[11px] focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                      />
                    </td>

                    {/* Tanggal Selesai */}
                    <td className="py-2 px-2 text-center">
                      <input
                        type="date"
                        value={stage.endDate}
                        onChange={(e) => handleUpdateStage(stage.id, 'endDate', e.target.value)}
                        className="w-full py-1 px-1 rounded-lg border border-slate-200 font-medium text-slate-800 text-[11px] focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                      />
                    </td>

                    {/* Durasi */}
                    <td className="py-2 px-2 text-center">
                      <input
                        type="number"
                        min="1"
                        value={stage.durationDays}
                        onChange={(e) => handleUpdateStage(stage.id, 'durationDays', parseInt(e.target.value, 10) || 1)}
                        className="w-16 py-1 px-2 rounded-lg border border-slate-200 font-bold text-center text-slate-900 tabular-nums focus:ring-1 focus:ring-indigo-500"
                      />
                    </td>

                    {/* Progres Slider */}
                    <td className="py-2 px-3 text-center">
                      <div className="flex items-center gap-2">
                        <input
                          type="range"
                          min="0"
                          max="100"
                          step="5"
                          value={stage.progressPercent}
                          onChange={(e) => handleUpdateStage(stage.id, 'progressPercent', parseInt(e.target.value, 10) || 0)}
                          className="w-full accent-indigo-600 cursor-pointer"
                        />
                        <span className="font-bold text-slate-800 tabular-nums w-8 text-right">
                          {stage.progressPercent}%
                        </span>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-2 px-2.5 text-center">
                      <select
                        value={stage.status}
                        onChange={(e) => handleUpdateStage(stage.id, 'status', e.target.value)}
                        className={`w-full py-1 px-2 rounded-lg border font-bold text-[11px] cursor-pointer ${
                          stage.status === 'SELESAI'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : stage.status === 'SEDANG_PROSES'
                            ? 'bg-blue-50 text-blue-800 border-blue-200'
                            : stage.status === 'TERLAMBAT'
                            ? 'bg-rose-50 text-rose-800 border-rose-200'
                            : 'bg-slate-50 text-slate-700 border-slate-200'
                        }`}
                      >
                        <option value="MENUNGGU">MENUNGGU</option>
                        <option value="SEDANG_PROSES">SEDANG PROSES</option>
                        <option value="SELESAI">SELESAI</option>
                        <option value="TERLAMBAT">TERLAMBAT</option>
                      </select>
                    </td>

                    {/* Aksi */}
                    <td className="py-2 px-2 text-center">
                      <button
                        onClick={() => handleDeleteStage(stage.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                        title="Hapus baris tahapan"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 6. PRODUCTION NOTES / KLAUSUL OPERASIONAL */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-2">
        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
          Catatan Khusus Operasional Produksi & Komitmen Buyer (Akan Tercetak pada Lampiran Jadwal):
        </label>
        <textarea
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Tuliskan catatan teknis, jadwal pengiriman kain, toleransi keterlambatan, atau kesepakatan khusus dengan pihak buyer..."
          className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 leading-relaxed"
        />
      </div>
    </div>
  );
};
