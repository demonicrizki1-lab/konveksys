import React, { useState, useEffect } from 'react';
import {
  Calculator,
  Plus,
  Trash2,
  Save,
  RotateCcw,
  Printer,
  Sparkles,
  Info,
  CheckCircle2,
  AlertCircle,
  Package,
  Layers,
  Percent,
  ArrowRightLeft,
  Search,
} from 'lucide-react';
import {
  HPPCalculationRecord,
  HPPComponentItem,
  HPPComponentType,
  FOBMaterialMaster,
  FOBProductMaster,
} from '../../types';
import { formatRp, formatRupiahInput, parseRupiahInput } from '../../utils/formatters';

interface FobCalculatorTabProps {
  initialRecord?: HPPCalculationRecord | null;
  existingRecords?: HPPCalculationRecord[];
  materials: FOBMaterialMaster[];
  products: FOBProductMaster[];
  onSave: (record: Partial<HPPCalculationRecord>) => Promise<{ success: boolean; data?: HPPCalculationRecord; error?: string }>;
  onPrint: (record: HPPCalculationRecord) => void;
  onClearInitial: () => void;
}

export const FOB_LETTER_SIZES = ['S', 'M', 'L', 'XL', '2XL', '3XL', '4XL', '5XL', '6XL', '7XL', '8XL', 'ALL SIZE'];
export const FOB_NUMBER_SIZES = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15', '16'];
export const AVAILABLE_SIZES = [...FOB_LETTER_SIZES, ...FOB_NUMBER_SIZES];
import { SATUAN_OPTIONS, SatuanDropdown } from './SatuanDropdown';
export { SATUAN_OPTIONS, SatuanDropdown };

// 1 Yard = 91.44 cm = 0.9144 Meter (1 Meter = 1.09361 Yard)
const YARD_TO_METER_FACTOR = 0.9144;
const convertYardToMeterPrice = (hargaYard: number): number =>
  Math.round((hargaYard || 0) / YARD_TO_METER_FACTOR);

const COMPONENT_TYPES: { key: HPPComponentType; label: string }[] = [
  { key: 'BAHAN_BAKU', label: 'Bahan Baku' },
  { key: 'BAHAN_PENDUKUNG', label: 'Furing / Pendukung' },
  { key: 'AKSESORIS', label: 'Aksesoris & Trims' },
  { key: 'JASA_CMT', label: 'Jasa CMT Jahit' },
  { key: 'SABLON_BORDIR', label: 'Sablon & Bordir' },
  { key: 'PACKAGING', label: 'Packaging' },
  { key: 'OPERASIONAL', label: 'Operasional' },
];

export const generateNextHppNo = (records?: HPPCalculationRecord[]): string => {
  const year = new Date().getFullYear();
  if (!records || records.length === 0) {
    return `HPP/${year}/0001`;
  }
  let maxSeq = 0;
  records.forEach(r => {
    if (r.noHpp) {
      const match = r.noHpp.match(/HPP\/\d{4}\/(\d+)/i) || r.noHpp.match(/HPP\/.*\/(\d+)/i);
      if (match && match[1]) {
        const num = parseInt(match[1], 10);
        if (!isNaN(num) && num > maxSeq) {
          maxSeq = num;
        }
      }
    }
  });
  const nextSeq = maxSeq > 0 ? maxSeq + 1 : records.length + 1;
  return `HPP/${year}/${String(nextSeq).padStart(4, '0')}`;
};

export const FobCalculatorTab: React.FC<FobCalculatorTabProps> = ({
  initialRecord,
  existingRecords = [],
  materials,
  products,
  onSave,
  onPrint,
  onClearInitial,
}) => {
  // Form Header State (Default Kosong & No HPP Otomatis)
  const [recordId, setRecordId] = useState<string | null>(null);
  const [noHpp, setNoHpp] = useState<string>(() => generateNextHppNo(existingRecords));
  const [tanggal, setTanggal] = useState<string>(new Date().toISOString().split('T')[0]);
  const [namaProduk, setNamaProduk] = useState<string>('');
  const [kodeProduk, setKodeProduk] = useState<string>('');
  const [selectedSize, setSelectedSize] = useState<string>('M');
  const [kategori, setKategori] = useState<string>('Kaos');
  const [brand, setBrand] = useState<string>('');
  const [vendorCmt, setVendorCmt] = useState<string>('');
  const [batchQty, setBatchQty] = useState<number>(100);
  const [catatan, setCatatan] = useState<string>('');

  // Cost Parameters State
  const [targetLabaPercent, setTargetLabaPercent] = useState<number>(30);
  const [overheadPercent, setOverheadPercent] = useState<number>(0);
  const [rejectPercent, setRejectPercent] = useState<number>(3);
  const [isPpnIncluded, setIsPpnIncluded] = useState<boolean>(false);
  const [ppnPercent, setPpnPercent] = useState<number>(0);
  const [zakatPercent, setZakatPercent] = useState<number>(0);
  const [affiliatePercent, setAffiliatePercent] = useState<number>(0);

  // Dynamic Components State (Default Kosong)
  const [components, setComponents] = useState<HPPComponentItem[]>([]);

  // Alert/Banner State
  const [saveStatus, setSaveStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [yardNotice, setYardNotice] = useState<string | null>(null);
  // Master Material Selection Modal State
  const [isMasterModalOpen, setIsMasterModalOpen] = useState<boolean>(false);
  const [masterModalSearch, setMasterModalSearch] = useState<string>('');
  const [targetRowForMaster, setTargetRowForMaster] = useState<number | null>(null);

  // Auto-generate No HPP when existingRecords loads if not in edit mode
  useEffect(() => {
    if (!initialRecord && !recordId) {
      setNoHpp(generateNextHppNo(existingRecords));
    }
  }, [existingRecords, initialRecord, recordId]);

  // Load initialRecord if provided (Edit Mode)
  useEffect(() => {
    if (initialRecord) {
      setRecordId(initialRecord.id);
      setNoHpp(initialRecord.noHpp);
      setTanggal(initialRecord.tanggal ? initialRecord.tanggal.split('T')[0] : new Date().toISOString().split('T')[0]);
      setNamaProduk(initialRecord.namaProduk);
      setKodeProduk(initialRecord.kodeProduk || '');
      setSelectedSize(initialRecord.size || 'M');
      setKategori(initialRecord.kategori || 'Kaos');
      setBrand(initialRecord.brand || 'UMUM');
      setVendorCmt(initialRecord.vendorCmt || '');
      setBatchQty(initialRecord.batchQty || 100);
      setTargetLabaPercent(initialRecord.targetLabaPercent !== undefined && initialRecord.targetLabaPercent !== null ? Number(initialRecord.targetLabaPercent) : 30);
      setOverheadPercent(initialRecord.overheadPercent !== undefined && initialRecord.overheadPercent !== null ? Number(initialRecord.overheadPercent) : 0);
      setRejectPercent(initialRecord.rejectPercent !== undefined && initialRecord.rejectPercent !== null ? Number(initialRecord.rejectPercent) : 3);
      setIsPpnIncluded(initialRecord.isPpnIncluded ?? false);
      setPpnPercent(initialRecord.ppnPercent || 0);
      setZakatPercent(initialRecord.zakatPercent || 0);
      setAffiliatePercent(initialRecord.affiliatePercent || 0);
      setCatatan(initialRecord.catatan || '');
      if (Array.isArray(initialRecord.components) && initialRecord.components.length > 0) {
        setComponents(initialRecord.components);
      }
      setSaveStatus({
        type: 'success',
        message: `Memuat data kalkulasi ${initialRecord.noHpp} (${initialRecord.namaProduk} - Size ${initialRecord.size}) ke form.`,
      });
    }
  }, [initialRecord]);

  // LIVE CALCULATIONS
  const hppBahanTotal = components
    .filter(c => c.jenisBiaya === 'BAHAN_BAKU' || c.jenisBiaya === 'BAHAN_PENDUKUNG' || c.jenisBiaya === 'AKSESORIS')
    .reduce((acc, c) => acc + (Number(c.subtotal) || 0), 0);

  const hppCmtTotal = components
    .filter(c => c.jenisBiaya !== 'BAHAN_BAKU' && c.jenisBiaya !== 'BAHAN_PENDUKUNG' && c.jenisBiaya !== 'AKSESORIS')
    .reduce((acc, c) => acc + (Number(c.subtotal) || 0), 0);

  const totalSebelumOverhead = hppBahanTotal + hppCmtTotal;
  const nilaiOverhead = Math.round(totalSebelumOverhead * (overheadPercent / 100));
  const totalSebelumReject = totalSebelumOverhead + nilaiOverhead;
  const nilaiReject = Math.round(totalSebelumReject * (rejectPercent / 100));
  const hppFinalPerPcs = totalSebelumReject + nilaiReject;

  // Harga rekomendasi jual FOB: Markup on Cost: HPP Final * (1 + Target Laba %)
  const hargaJualSebelumBulat = Math.round(hppFinalPerPcs * (1 + targetLabaPercent / 100));
  // Pembulatan ke ribuan terdekat (Rp 1.000 ke atas)
  const hargaJualRekomendasi = Math.ceil(hargaJualSebelumBulat / 1000) * 1000;
  const labaBersihPerPcs = hargaJualRekomendasi - hppFinalPerPcs;

  // Pajak PPN 11% jika toggle aktif
  const nilaiPpn = isPpnIncluded ? Math.round(hargaJualRekomendasi * 0.11) : 0;
  const hargaJualPlusPpn = hargaJualRekomendasi + nilaiPpn;

  // Proyeksi Batch
  const totalBiayaBatch = hppFinalPerPcs * (batchQty || 1);
  const totalOmzetBatch = (isPpnIncluded ? hargaJualPlusPpn : hargaJualRekomendasi) * (batchQty || 1);
  const totalLabaBatch = labaBersihPerPcs * (batchQty || 1);

  // Component Row Handlers
  const handleUpdateComponent = (idx: number, field: keyof HPPComponentItem, val: any) => {
    setComponents(prev => {
      const updated = [...prev];
      const item = { ...updated[idx], [field]: val };

      // Jika user memilih satuan 'Yard' di tabel kalkulator HPP,
      // otomatis diconvert ke 'Meter' dengan patokan 1 yard = 91,44 cm (0,9144 m)
      if (field === 'satuan' && typeof val === 'string' && val.trim().toLowerCase() === 'yard') {
        item.satuan = 'Meter';
        item.isYardConverted = true;
        if (item.hargaSatuan && item.hargaSatuan > 0) {
          const oldHarga = item.hargaSatuan;
          item.originalYardPrice = oldHarga;
          item.hargaSatuan = convertYardToMeterPrice(item.hargaSatuan);
          setYardNotice(
            `Komponen #${idx + 1} (${item.namaBahan || 'Bahan'}) diconvert dari Yard ke Meter (1 Yard = 91,44 cm). Harga: ${formatRp(oldHarga)}/yd ➔ ${formatRp(item.hargaSatuan)}/m.`
          );
        } else {
          setYardNotice(
            `Komponen #${idx + 1} dialihkan ke satuan Meter (standar perhitungan HPP: 1 Yard = 91,44 cm / 0,9144 m).`
          );
        }
      }

      if (field === 'supplier' && typeof val === 'string') {
        item.supplier = val.replace(/^\[Asal:.*?\]\s*/, '');
      }

      // Auto hitung subtotal jika pemakaian, harga, atau waste diubah
      if (field === 'pemakaian' || field === 'hargaSatuan' || field === 'wastePercent' || field === 'satuan') {
        const p = Number(field === 'pemakaian' ? val : item.pemakaian) || 0;
        const h = Number(field === 'hargaSatuan' ? val : item.hargaSatuan) || 0;
        const w = Number(field === 'wastePercent' ? val : item.wastePercent) || 0;
        item.subtotal = Math.round(p * h * (1 + w / 100));
      }

      updated[idx] = item;
      return updated;
    });
  };

  const handleAddComponent = (type: HPPComponentType = 'BAHAN_BAKU') => {
    const newItem: HPPComponentItem = {
      id: `c-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      jenisBiaya: type,
      namaBahan: '',
      satuan: type === 'BAHAN_BAKU' ? 'Meter' : 'Pcs',
      pemakaian: 1,
      hargaSatuan: 0,
      wastePercent: type === 'BAHAN_BAKU' ? 5 : 0,
      subtotal: 0,
      supplier: '',
    };
    setComponents(prev => [...prev, newItem]);
  };

  const handleRemoveComponent = (idx: number) => {
    setComponents(prev => prev.filter((_, i) => i !== idx));
  };

  // Quick select master product
  const handleSelectMasterProduct = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = products.find(p => p.id === e.target.value);
    if (selected) {
      setNamaProduk(selected.namaProduk);
      setKodeProduk(selected.kodeProduk);
      setSelectedSize(selected.size);
      setKategori(selected.kategori);
      if (selected.brand) setBrand(selected.brand);
      if (selected.vendorCmt) setVendorCmt(selected.vendorCmt);
    }
  };

  // Quick insert master material into row
  const handleInsertMasterMaterial = (idx: number, matKode: string) => {
    const mat = materials.find(m => m.kodeMaterial === matKode);
    if (mat) {
      const isYard = (mat.satuan || '').trim().toLowerCase() === 'yard';
      // 1 Yard = 91.44 cm (0.9144 meter) -> Konversi ke Meter
      const targetSatuan = isYard ? 'Meter' : mat.satuan;
      const targetHarga = isYard
        ? convertYardToMeterPrice(Number(mat.hargaStandar) || 0)
        : Number(mat.hargaStandar) || 0;

      if (isYard) {
        const qtyYard = Number(mat.qty) || 1;
        const qtyMeter = (qtyYard * 0.9144).toLocaleString('id-ID', { maximumFractionDigits: 2 });
        setYardNotice(
          `Bahan "${mat.namaBahan}" (satuan Yard) otomatis dikonversi ke Meter (1 Yard = 91,44 cm). Kuantitas: ${qtyYard} Yd ➔ ${qtyMeter} m | Harga: ${formatRp(mat.hargaStandar)}/yd ➔ ${formatRp(targetHarga)}/m.`
        );
      }

      setComponents(prev => {
        const updated = [...prev];
        const current = updated[idx];
        const p = Number(current.pemakaian) || 1;
        const w = Number(current.wastePercent) || 0;
        updated[idx] = {
          ...current,
          namaBahan: mat.namaBahan,
          jenisBiaya: (mat.kategori as HPPComponentType) || current.jenisBiaya || 'BAHAN_BAKU',
          satuan: targetSatuan,
          hargaSatuan: targetHarga,
          supplier: (mat.supplier || '').replace(/^\[Asal:.*?\]\s*/, ''),
          isYardConverted: isYard,
          originalYardPrice: isYard ? Number(mat.hargaStandar) || 0 : undefined,
          subtotal: Math.round(p * targetHarga * (1 + w / 100)),
        };
        return updated;
      });
    }
  };

  // Quick add new material from Master Modal
  const handleAddFromMasterModal = (mat: FOBMaterialMaster) => {
    const isYard = (mat.satuan || '').trim().toLowerCase() === 'yard';
    const targetSatuan = isYard ? 'Meter' : mat.satuan;
    const targetHarga = isYard
      ? convertYardToMeterPrice(Number(mat.hargaStandar) || 0)
      : Number(mat.hargaStandar) || 0;

    if (isYard) {
      const qtyYard = Number(mat.qty) || 1;
      const qtyMeter = (qtyYard * 0.9144).toLocaleString('id-ID', { maximumFractionDigits: 2 });
      setYardNotice(
        `Bahan "${mat.namaBahan}" (satuan Yard) otomatis dikonversi ke Meter (1 Yard = 91,44 cm). Kuantitas: ${qtyYard} Yd ➔ ${qtyMeter} m | Harga: ${formatRp(mat.hargaStandar)}/yd ➔ ${formatRp(targetHarga)}/m.`
      );
    }

    const isBahan = mat.kategori === 'BAHAN_BAKU' || !mat.kategori;
    const wasteVal = isBahan ? 5 : 0;
    const newItem: HPPComponentItem = {
      id: `c-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      jenisBiaya: (mat.kategori as HPPComponentType) || 'BAHAN_BAKU',
      namaBahan: mat.namaBahan,
      satuan: targetSatuan,
      pemakaian: 1,
      hargaSatuan: targetHarga,
      wastePercent: wasteVal,
      subtotal: Math.round(1 * targetHarga * (1 + wasteVal / 100)),
      supplier: (mat.supplier || '').replace(/^\[Asal:.*?\]\s*/, ''),
      isYardConverted: isYard,
      originalYardPrice: isYard ? Number(mat.hargaStandar) || 0 : undefined,
    };

    setComponents(prev => [...prev, newItem]);
  };

  // Save Record
  const handleSaveRecord = async () => {
    if (!namaProduk.trim()) {
      setSaveStatus({ type: 'error', message: 'Nama produk wajib diisi.' });
      return;
    }
    if (components.length === 0) {
      setSaveStatus({ type: 'error', message: 'Minimal harus ada 1 komponen bahan/CMT.' });
      return;
    }

    setIsSaving(true);
    setSaveStatus(null);

    const payload: Partial<HPPCalculationRecord> = {
      ...(recordId && { id: recordId }),
      noHpp: noHpp.trim() || generateNextHppNo(existingRecords),
      tanggal: new Date(tanggal).toISOString(),
      namaProduk: namaProduk.trim(),
      kodeProduk: kodeProduk.trim() || null,
      size: selectedSize,
      kategori,
      brand: brand.trim() || 'UMUM',
      vendorCmt: vendorCmt.trim() || null,
      batchQty: Number(batchQty) || 100,

      targetLabaPercent: Number(targetLabaPercent) || 30,
      overheadPercent: overheadPercent !== undefined && overheadPercent !== null ? Number(overheadPercent) : 0,
      rejectPercent: Number(rejectPercent) || 3,
      ppnPercent: isPpnIncluded ? 11 : 0,
      zakatPercent: Number(zakatPercent) || 0,
      affiliatePercent: Number(affiliatePercent) || 0,
      isPpnIncluded,

      hppBahanTotal,
      hppCmtTotal,
      totalSebelumReject,
      nilaiOverhead,
      nilaiReject,
      hppFinalPerPcs,
      hargaJualSebelumBulat,
      hargaJualRekomendasi,
      labaBersihPerPcs,
      nilaiPpn,
      hargaJualPlusPpn,

      totalBiayaBatch,
      totalOmzetBatch,
      totalLabaBatch,
      catatan: catatan.trim() || null,
      components,
    };

    const res = await onSave(payload);
    setIsSaving(false);

    if (res.success && res.data) {
      setRecordId(res.data.id);
      setNoHpp(res.data.noHpp);
      setSaveStatus({
        type: 'success',
        message: `Kalkulasi HPP ${res.data.noHpp} (${res.data.namaProduk} - Size ${res.data.size}) berhasil disimpan ke database!`,
      });
    } else {
      setSaveStatus({
        type: 'error',
        message: res.error || 'Gagal menyimpan kalkulasi ke database.',
      });
    }
  };

  const handleReset = () => {
    setRecordId(null);
    setNoHpp(generateNextHppNo(existingRecords));
    setTanggal(new Date().toISOString().split('T')[0]);
    setNamaProduk('');
    setKodeProduk('');
    setSelectedSize('M');
    setKategori('Kaos');
    setBrand('');
    setVendorCmt('');
    setBatchQty(100);
    setTargetLabaPercent(30);
    setOverheadPercent(0);
    setRejectPercent(3);
    setIsPpnIncluded(false);
    setPpnPercent(0);
    setZakatPercent(0);
    setAffiliatePercent(0);
    setCatatan('');
    setComponents([]);
    setSaveStatus(null);
    onClearInitial();
  };

  const currentRecordSnapshot: HPPCalculationRecord = {
    id: recordId || 'temp-preview',
    noHpp: noHpp.includes('AUTO') ? 'HPP/DRAFT' : noHpp,
    tanggal: new Date(tanggal).toISOString(),
    namaProduk: namaProduk || 'Produk Baru',
    kodeProduk,
    size: selectedSize,
    kategori,
    brand,
    vendorCmt,
    batchQty,
    targetLabaPercent,
    overheadPercent,
    rejectPercent,
    ppnPercent: isPpnIncluded ? 11 : 0,
    zakatPercent,
    affiliatePercent,
    isPpnIncluded,
    hppBahanTotal,
    hppCmtTotal,
    totalSebelumReject,
    nilaiOverhead,
    nilaiReject,
    hppFinalPerPcs,
    hargaJualSebelumBulat,
    hargaJualRekomendasi,
    labaBersihPerPcs,
    nilaiPpn,
    hargaJualPlusPpn,
    totalBiayaBatch,
    totalOmzetBatch,
    totalLabaBatch,
    catatan,
    components,
    createdAt: new Date().toISOString(),
  };

  return (
    <div className="space-y-6">
      
      {/* STATUS BANNER */}
      {saveStatus && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between gap-3 text-xs font-medium animate-fadeIn ${
            saveStatus.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {saveStatus.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{saveStatus.message}</span>
          </div>
          <button
            onClick={() => setSaveStatus(null)}
            className="text-slate-400 hover:text-slate-600 cursor-pointer text-sm"
          >
            ✕
          </button>
        </div>
      )}

      {/* HEADER BAR: INFORMASI PRODUK & SIZE SELECTOR */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-900">
                Lembar Kerja Kalkulasi Biaya HPP FOB
              </h3>
              {recordId ? (
                <span className="px-2 py-0.5 bg-amber-50 text-amber-700 rounded text-xs font-bold border border-amber-200">
                  Mode Edit ({noHpp})
                </span>
              ) : (
                <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded text-xs font-bold">
                  Kalkulasi Baru
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Tentukan marker pemakaian bahan dan ongkos kerja per potong pakaian berdasarkan ukuran.
            </p>
          </div>

          {/* Quick Select Master Product Dropdown */}
          {products.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-semibold whitespace-nowrap">Tarik Produk Master:</span>
              <select
                onChange={handleSelectMasterProduct}
                defaultValue=""
                className="text-xs py-1.5 px-3 rounded-lg border border-slate-200 bg-slate-50 text-slate-800 font-medium focus:ring-1 focus:ring-indigo-500 focus:bg-white"
              >
                <option value="" disabled>-- Pilih Katalog Acuan --</option>
                {products.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.namaProduk} ({p.size}) - {p.kategori}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* METADATA FORM ROW */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3.5 text-xs">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-slate-500 font-semibold">No. HPP Invoice</label>
              <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded">
                Otomatis
              </span>
            </div>
            <input
              type="text"
              value={noHpp}
              readOnly
              className="w-full py-1.5 px-2.5 rounded-lg border border-slate-200 bg-slate-50 font-bold text-slate-800 cursor-default"
              placeholder="HPP/YYYY/0001"
              title="Nomor HPP otomatis diterbitkan berurutan oleh sistem"
            />
          </div>

          <div>
            <label className="block text-slate-500 font-semibold mb-1">Tanggal Costing</label>
            <input
              type="date"
              value={tanggal}
              onChange={e => setTanggal(e.target.value)}
              className="w-full py-1.5 px-2.5 rounded-lg border border-slate-200 text-slate-800 font-medium focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div className="lg:col-span-2">
            <label className="block text-slate-500 font-semibold mb-1">Nama Produk / Model</label>
            <input
              type="text"
              value={namaProduk}
              onChange={e => setNamaProduk(e.target.value)}
              className="w-full py-1.5 px-2.5 rounded-lg border border-slate-200 font-semibold text-slate-900 focus:ring-1 focus:ring-indigo-500"
              placeholder="Contoh: Jaket Puffer Micron Water Resistant"
            />
          </div>

          <div>
            <label className="block text-slate-500 font-semibold mb-1">Kode Artikel SKU</label>
            <input
              type="text"
              value={kodeProduk}
              onChange={e => setKodeProduk(e.target.value)}
              className="w-full py-1.5 px-2.5 rounded-lg border border-slate-200 font-semibold text-slate-800 focus:ring-1 focus:ring-indigo-500"
              placeholder="JKT-MICRON"
            />
          </div>

          <div>
            <label className="block text-slate-500 font-semibold mb-1">Kategori Pakaian</label>
            <select
              value={kategori}
              onChange={e => setKategori(e.target.value)}
              className="w-full py-1.5 px-2 rounded-lg border border-slate-200 font-medium text-slate-800 focus:ring-1 focus:ring-indigo-500"
            >
              <option value="Jaket">Jaket</option>
              <option value="Rompi">Rompi</option>
              <option value="Kemeja">Kemeja</option>
              <option value="Kaos">Kaos</option>
              <option value="Celana">Celana</option>
              <option value="Hoodie">Hoodie</option>
              <option value="Seragam">Seragam</option>
            </select>
          </div>

          <div className="sm:col-span-1 md:col-span-2 lg:col-span-3">
            <label className="block text-slate-500 font-semibold mb-1">Brand / Buyer</label>
            <input
              type="text"
              value={brand}
              onChange={e => setBrand(e.target.value)}
              className="w-full py-1.5 px-2.5 rounded-lg border border-slate-200 text-slate-800 font-medium focus:ring-1 focus:ring-indigo-500"
              placeholder="Nama Brand"
            />
          </div>

          <div className="sm:col-span-1 md:col-span-2 lg:col-span-3">
            <label className="block text-slate-500 font-semibold mb-1">Vendor CMT Acuan</label>
            <input
              type="text"
              value={vendorCmt}
              onChange={e => setVendorCmt(e.target.value)}
              className="w-full py-1.5 px-2.5 rounded-lg border border-slate-200 text-slate-800 font-medium focus:ring-1 focus:ring-indigo-500"
              placeholder="Nama Konveksi"
            />
          </div>
        </div>

        {/* DEDICATED SIZE SELECTOR WITH HIGHLIGHT */}
        <div className="pt-2 border-t border-slate-100 space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Package className="w-4 h-4 text-indigo-600" />
                Pilih Ukuran (Size):
              </span>
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-2xs">
                Terpilih: {selectedSize}
              </span>
            </div>

            <div className="text-[11px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-100 px-3 py-1 rounded-full flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 shrink-0 text-indigo-500" />
              <span>Size Berbeda = Pemakaian Konsumsi Marker Berbeda</span>
            </div>
          </div>

          {/* BARIS 1: SERI HURUF (STANDAR & BIG SIZE HINGGA 8XL) */}
          <div className="flex flex-wrap items-center gap-1.5 bg-slate-50/70 p-2 rounded-xl border border-slate-200/80">
            <span className="text-[10.5px] font-bold text-slate-500 uppercase tracking-wider px-2 py-1 bg-white rounded-md border border-slate-200 shrink-0">
              Seri Huruf:
            </span>
            <div className="flex flex-wrap items-center gap-1.5">
              {FOB_LETTER_SIZES.map((sz) => {
                const isSelected = selectedSize === sz || (sz === '2XL' && selectedSize === 'XXL');
                return (
                  <button
                    key={sz}
                    type="button"
                    onClick={() => setSelectedSize(sz)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-600 text-white shadow-xs scale-105 ring-2 ring-indigo-300'
                        : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                    }`}
                  >
                    {sz}
                  </button>
                );
              })}
            </div>
          </div>

          {/* BARIS 2: SERI ANGKA (UKURAN 1 - 16) */}
          <div className="flex flex-wrap items-center gap-1.5 bg-slate-50/70 p-2 rounded-xl border border-slate-200/80">
            <span className="text-[10.5px] font-bold text-slate-500 uppercase tracking-wider px-2 py-1 bg-white rounded-md border border-slate-200 shrink-0">
              Seri Angka:
            </span>
            <div className="flex flex-wrap items-center gap-1">
              {FOB_NUMBER_SIZES.map((num) => {
                const isSelected = selectedSize === num;
                return (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setSelectedSize(num)}
                    className={`min-w-[34px] px-2.5 py-1 text-center rounded-lg text-xs font-bold transition cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-600 text-white shadow-xs scale-105 ring-2 ring-indigo-300'
                        : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                    }`}
                  >
                    {num}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* DYNAMIC COMPONENT TABLE */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-600" />
              Rincian Komponen Bahan, CMT & Finishing
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 font-mono">
                {components.length} Item
              </span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Tambahkan konsumsi marker bahan baku, ongkos jahit, dan perlengkapan garment
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleAddComponent('BAHAN_BAKU')}
              className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-3 py-2 rounded-lg flex items-center gap-1.5 shadow-sm transition btn-press shrink-0 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Bahan Baku</span>
            </button>
          </div>
        </div>

        {/* Notifikasi Konversi Yard ke Meter */}
        {yardNotice && (
          <div className="bg-amber-50/90 border border-amber-200/90 text-amber-900 rounded-xl px-3.5 py-2 text-xs flex items-center justify-between gap-3 shadow-2xs animate-in fade-in slide-in-from-top-1 duration-200">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="p-1 rounded-md bg-amber-200/70 text-amber-800 shrink-0">
                <ArrowRightLeft className="w-3.5 h-3.5" />
              </span>
              <div className="text-[11.5px] leading-tight truncate">
                <span className="font-bold text-amber-950 mr-1.5">Konversi Yard ke Meter:</span>
                <span className="text-amber-800">{yardNotice}</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setYardNotice(null)}
              className="text-amber-600 hover:text-amber-900 p-1 rounded hover:bg-amber-100/60 transition cursor-pointer shrink-0 font-bold"
              title="Tutup Notifikasi"
            >
              ✕
            </button>
          </div>
        )}

        {/* TABLE */}
        <div className="overflow-x-auto border border-slate-200 rounded-xl shadow-2xs">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/90 text-slate-600 text-[11px] uppercase font-bold tracking-wider border-b border-slate-200 select-none">
                <th className="py-3 px-2 text-center w-10">#</th>
                <th className="py-3 px-3 text-left w-44">Kategori Biaya</th>
                <th className="py-3 px-3 text-left min-w-[280px]">Nama Komponen Bahan</th>
                <th className="py-3 px-2 text-center w-28">Satuan</th>
                <th className="py-3 px-2.5 text-right w-24">Pemakaian</th>
                <th className="py-3 px-2.5 text-right w-32">Harga Satuan (Rp)</th>
                <th className="py-3 px-2 text-center w-20">Waste %</th>
                <th className="py-3 px-3 text-right w-32">Subtotal / Pcs</th>
                <th className="py-3 px-3 text-left w-36">Supplier / Vendor</th>
                <th className="py-3 px-2 text-center w-12">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {components.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                        <Layers className="w-5 h-5" />
                      </div>
                      <p className="text-xs font-semibold text-slate-600">
                        Belum ada rincian komponen bahan atau jasa CMT dimasukkan.
                      </p>
                      <p className="text-[11px] text-slate-400 max-w-sm">
                        Klik tombol <strong className="text-indigo-600">+ Bahan Baku</strong>, <strong className="text-indigo-600">⚡ Tarik Master Bahan</strong>, atau <strong className="text-slate-700">+ Jasa CMT</strong> di atas untuk mulai menyusun kalkulasi.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                components.map((item, idx) => (
                  <tr key={item.id} className="hover:bg-slate-50/60 transition-colors border-b border-slate-100 last:border-b-0">
                    {/* Index */}
                    <td className="py-2.5 px-2 text-center font-bold text-slate-400 text-xs align-middle">
                      {idx + 1}
                    </td>
                    
                    {/* Kategori Biaya */}
                    <td className="py-2.5 px-2.5 align-middle">
                      <select
                        value={item.jenisBiaya}
                        onChange={e => handleUpdateComponent(idx, 'jenisBiaya', e.target.value)}
                        className="w-full h-9 py-1 px-2.5 rounded-lg border border-slate-200 text-slate-800 text-xs font-semibold focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 bg-white shadow-2xs cursor-pointer truncate"
                      >
                        {COMPONENT_TYPES.map(ct => (
                          <option key={ct.key} value={ct.key}>{ct.label}</option>
                        ))}
                      </select>
                    </td>

                    {/* Nama Bahan + Master Material Quick Pick */}
                    <td className="py-2.5 px-2.5 align-middle">
                      <div className="relative flex items-center">
                        <input
                          type="text"
                          value={item.namaBahan}
                          onChange={e => handleUpdateComponent(idx, 'namaBahan', e.target.value)}
                          placeholder="Ketik nama bahan/aksesoris..."
                          className="w-full h-9 pl-3 pr-20 rounded-lg border border-slate-200 font-semibold text-xs text-slate-900 placeholder:text-slate-400 placeholder:font-normal focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 shadow-2xs transition"
                        />
                        {materials.length > 0 && (
                          <button
                            type="button"
                            onClick={() => {
                              setTargetRowForMaster(idx);
                              setIsMasterModalOpen(true);
                            }}
                            className="absolute right-1 px-2 py-1 text-[10px] font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 hover:text-indigo-800 rounded-md border border-indigo-200/80 transition flex items-center gap-1 cursor-pointer select-none"
                            title="Pilih atau ganti dari Katalog Master Bahan"
                          >
                            <span>⚡ Master</span>
                          </button>
                        )}
                      </div>
                    </td>

                    {/* Satuan Dropdown */}
                    <td className="py-2.5 px-1.5 align-middle">
                      <SatuanDropdown
                        value={item.satuan}
                        onChange={(newSat: string) => handleUpdateComponent(idx, 'satuan', newSat)}
                        size="md"
                      />
                    </td>

                    {/* Pemakaian */}
                    <td className="py-2.5 px-2 align-middle">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={item.pemakaian}
                        onChange={e => handleUpdateComponent(idx, 'pemakaian', parseFloat(e.target.value) || 0)}
                        className="w-full h-9 py-1 px-2.5 text-right font-bold text-xs rounded-lg border border-slate-200 text-slate-900 tabular-nums shadow-2xs focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500"
                      />
                    </td>

                    {/* Harga Satuan */}
                    <td className="py-2.5 px-2 align-middle">
                      <input
                        type="text"
                        value={formatRupiahInput(item.hargaSatuan)}
                        onChange={e => handleUpdateComponent(idx, 'hargaSatuan', parseRupiahInput(e.target.value))}
                        className="w-full h-9 py-1 px-2.5 text-right font-bold text-xs rounded-lg border border-slate-200 text-slate-900 tabular-nums shadow-2xs focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500"
                        placeholder="0"
                      />
                    </td>

                    {/* Waste % */}
                    <td className="py-2.5 px-1.5 align-middle">
                      <div className="relative">
                        <input
                          type="number"
                          step="0.5"
                          min="0"
                          value={item.wastePercent}
                          onChange={e => handleUpdateComponent(idx, 'wastePercent', parseFloat(e.target.value) || 0)}
                          className="w-full h-9 py-1 pr-5 pl-2 text-center font-bold text-xs rounded-lg border border-slate-200 text-slate-800 tabular-nums shadow-2xs focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500"
                          title="Susut pemotongan kain (Cutting waste %)"
                        />
                        <span className="absolute right-2 top-2.5 text-[10px] font-bold text-slate-400 pointer-events-none">%</span>
                      </div>
                    </td>

                    {/* Subtotal */}
                    <td className="py-2.5 px-2.5 align-middle">
                      <div className="h-9 px-2.5 rounded-lg bg-slate-50 border border-slate-200/80 font-bold text-xs text-slate-900 font-mono tabular-nums flex items-center justify-end shadow-2xs">
                        {formatRp(item.subtotal)}
                      </div>
                    </td>

                    {/* Supplier */}
                    <td className="py-2.5 px-2 align-middle">
                      <input
                        type="text"
                        value={(item.supplier || '').replace(/^\[Asal:.*?\]\s*/, '')}
                        onChange={e => handleUpdateComponent(idx, 'supplier', e.target.value)}
                        placeholder="Nama supplier..."
                        className="w-full h-9 py-1 px-2.5 rounded-lg border border-slate-200 text-xs text-slate-700 shadow-2xs focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 placeholder:text-slate-400"
                      />
                    </td>

                    {/* Delete button */}
                    <td className="py-2.5 px-2 text-center align-middle">
                      <button
                        type="button"
                        onClick={() => handleRemoveComponent(idx)}
                        className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition cursor-pointer mx-auto"
                        title="Hapus Baris Komponen"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {components.length > 0 && (
              <tfoot className="bg-slate-50/80 border-t-2 border-slate-200 font-semibold text-slate-700">
                <tr>
                  <td colSpan={3} className="py-3 px-3 text-right font-bold text-xs text-slate-600 uppercase tracking-wider">
                    Total Biaya Komponen / Pcs:
                  </td>
                  <td className="py-3 px-2 text-center text-xs text-slate-500 font-semibold">
                    <span className="px-2 py-0.5 bg-white border border-slate-200 rounded-md shadow-2xs">
                      {components.length} item
                    </span>
                  </td>
                  <td className="py-3 px-2 text-right font-bold text-xs text-slate-800 font-mono tabular-nums">
                    {components.reduce((sum, c) => sum + (c.jenisBiaya === 'BAHAN_BAKU' ? (c.pemakaian || 0) : 0), 0).toFixed(2)} m
                  </td>
                  <td colSpan={2}></td>
                  <td className="py-3 px-2.5 text-right font-black text-sm text-indigo-700 font-mono tabular-nums bg-indigo-50/60 border-x border-indigo-100">
                    {formatRp(components.reduce((sum, c) => sum + (c.subtotal || 0), 0))}
                  </td>
                  <td colSpan={2}></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* MASTER MATERIAL SELECTION MODAL */}
      {isMasterModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center">
                  <Package className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">
                    {targetRowForMaster !== null
                      ? `Pilih Bahan Baku untuk Baris #${targetRowForMaster + 1}`
                      : 'Katalog Master Bahan Baku & Trims'}
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    {targetRowForMaster !== null
                      ? 'Pilih bahan untuk menggantikan atau mengisi rincian baris ini.'
                      : 'Pilih bahan untuk langsung menambahkannya ke lembar kerja kalkulasi HPP.'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsMasterModalOpen(false);
                  setMasterModalSearch('');
                  setTargetRowForMaster(null);
                }}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Search Bar */}
            <div className="p-3.5 border-b border-slate-100 bg-white">
              <div className="relative flex items-center">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
                <input
                  type="text"
                  value={masterModalSearch}
                  onChange={e => setMasterModalSearch(e.target.value)}
                  placeholder="Cari berdasarkan nama bahan, kode, kategori, atau supplier..."
                  className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 text-slate-800"
                  autoFocus
                />
              </div>
            </div>

            {/* Materials List */}
            <div className="overflow-y-auto p-4 space-y-2 divide-y divide-slate-100 max-h-[60vh]">
              {materials
                .filter(m => {
                  if (!masterModalSearch.trim()) return true;
                  const q = masterModalSearch.toLowerCase();
                  return (
                    m.namaBahan.toLowerCase().includes(q) ||
                    m.kodeMaterial.toLowerCase().includes(q) ||
                    (m.supplier && m.supplier.toLowerCase().includes(q)) ||
                    (m.kategori && m.kategori.toLowerCase().includes(q))
                  );
                })
                .map(m => {
                  const isYard = (m.satuan || '').trim().toLowerCase() === 'yard';
                  const qty = Number(m.qty) || 1;
                  const hargaPerMeter = isYard
                    ? convertYardToMeterPrice(Number(m.hargaStandar) || 0)
                    : Number(m.hargaStandar) || 0;
                  const qtyMeter = isYard
                    ? (qty * 0.9144).toLocaleString('id-ID', { maximumFractionDigits: 1 })
                    : null;

                  return (
                    <div
                      key={m.id || m.kodeMaterial}
                      className="pt-2.5 first:pt-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl hover:bg-indigo-50/40 border border-transparent hover:border-indigo-100 transition"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-bold text-xs text-slate-900">{m.namaBahan}</span>
                          <span className="text-[10px] font-mono px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded">
                            {m.kodeMaterial}
                          </span>
                          <span className="text-[10px] font-semibold px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-full border border-indigo-100">
                            {m.kategori}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-1 flex flex-wrap items-center gap-3">
                          {isYard ? (
                            <span className="text-amber-700 font-medium">
                              Stok: {qty} Yard ➔ Konversi: <strong>{qtyMeter} Meter</strong>
                            </span>
                          ) : (
                            <span>Stok: <strong>{qty} {m.satuan}</strong></span>
                          )}
                          {m.supplier && <span>Supplier: <strong className="text-slate-700">{m.supplier}</strong></span>}
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0 justify-between sm:justify-end">
                        <div className="text-right">
                          {isYard ? (
                            <div>
                              <div className="text-xs font-bold text-indigo-600 font-mono">
                                {formatRp(hargaPerMeter)} / Meter
                              </div>
                              <div className="text-[10px] text-amber-600 font-medium">
                                (Asal: {formatRp(m.hargaStandar)} / Yard)
                              </div>
                            </div>
                          ) : (
                            <div className="text-xs font-bold text-slate-800 font-mono">
                              {formatRp(m.hargaStandar)} / {m.satuan}
                            </div>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            if (targetRowForMaster !== null) {
                              handleInsertMasterMaterial(targetRowForMaster, m.kodeMaterial);
                            } else {
                              handleAddFromMasterModal(m);
                            }
                            setIsMasterModalOpen(false);
                            setMasterModalSearch('');
                            setTargetRowForMaster(null);
                          }}
                          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-xs transition cursor-pointer flex items-center gap-1 btn-press"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>{targetRowForMaster !== null ? 'Terapkan' : 'Pilih'}</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      )}

      {/* PARAMETER BIAYA & LIVE SUMMARY PANEL */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* PARAMETER PERSENTASE (REJECT, LABA, PAJAK) */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <Percent className="w-4 h-4 text-indigo-600" />
            Parameter Margin & Cadangan Biaya
          </h3>

          <div className="space-y-3.5 text-xs">
            <div>
              <div className="flex justify-between font-semibold text-slate-700 mb-1">
                <span>Target Laba Bersih (Markup %):</span>
                <span className="font-bold text-indigo-700 tabular-nums">+{targetLabaPercent}%</span>
              </div>
              <input
                type="range"
                min="5"
                max="80"
                step="1"
                value={targetLabaPercent}
                onChange={e => setTargetLabaPercent(parseInt(e.target.value, 10))}
                className="w-full accent-indigo-600 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between font-semibold text-slate-700 mb-1">
                <span>Biaya Overhead Pabrik (%):</span>
                <span className="font-bold text-blue-700 tabular-nums">{overheadPercent}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="15"
                step="0.5"
                value={overheadPercent}
                onChange={e => setOverheadPercent(parseFloat(e.target.value) || 0)}
                className="w-full accent-blue-600 cursor-pointer"
              />
              <span className="text-[10px] text-slate-400 block mt-0.5 tabular-nums">
                Nilai overhead: +{formatRp(nilaiOverhead)} / Pcs (Listrik, benang, perawatan mesin)
              </span>
            </div>

            <div>
              <div className="flex justify-between font-semibold text-slate-700 mb-1">
                <span>Cadangan Reject Cacat Kain (%):</span>
                <span className="font-bold text-rose-700 tabular-nums">{rejectPercent}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="10"
                step="0.5"
                value={rejectPercent}
                onChange={e => setRejectPercent(parseFloat(e.target.value))}
                className="w-full accent-rose-600 cursor-pointer"
              />
              <span className="text-[10px] text-slate-400 block mt-0.5 tabular-nums">
                Nilai cadangan reject: +{formatRp(nilaiReject)} / Pcs
              </span>
            </div>

            {/* TOGGLE PPN 11% */}
            <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-200">
              <div>
                <span className="font-bold text-slate-800 text-xs block">Pajak PPN 11% (Buyer Resmi)</span>
                <span className="text-[10px] text-slate-500 block mt-0.5">
                  {isPpnIncluded ? `Termasuk PPN 11% (+${formatRp(nilaiPpn)} / Pcs)` : 'Tanpa PPN (Exclude / Non-Faktur)'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsPpnIncluded(!isPpnIncluded)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  isPpnIncluded ? 'bg-indigo-600' : 'bg-slate-300'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                    isPpnIncluded ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            <div className="pt-2 border-t border-slate-100">
              <label className="block text-slate-500 font-semibold mb-1">Catatan Teknis Costing</label>
              <textarea
                rows={2}
                value={catatan}
                onChange={e => setCatatan(e.target.value)}
                placeholder="Spesifikasi jahitan, toleransi susut, atau instruksi QC..."
                className="w-full p-2 text-xs rounded-lg border border-slate-200 text-slate-800"
              />
            </div>
          </div>
        </div>

        {/* HASIL AKHIR KALKULASI HPP & HARGA FOB (WHITE THEME) */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-sm flex flex-col justify-between space-y-4 text-slate-800">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Hasil Kalkulasi Garment FOB Size: {selectedSize}
                </span>
                <h4 className="text-xl font-black text-slate-900 mt-0.5">{namaProduk || 'Belum Ada Nama'}</h4>
              </div>
              <div className="text-right">
                <span className="text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2.5 py-1 rounded-md">{noHpp}</span>
              </div>
            </div>

            {/* BREAKDOWN BOXES */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs mb-4">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="text-slate-500 block text-[10px] uppercase font-bold">HPP Bahan Baku</span>
                <span className="font-black text-slate-900 text-sm tabular-nums">{formatRp(hppBahanTotal)}</span>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="text-slate-500 block text-[10px] uppercase font-bold">HPP CMT & Trims</span>
                <span className="font-black text-slate-900 text-sm tabular-nums">{formatRp(hppCmtTotal)}</span>
              </div>

              <div className="bg-blue-50/70 p-3 rounded-xl border border-blue-200 text-blue-900">
                <span className="text-blue-800 block text-[10px] uppercase font-bold">Overhead ({overheadPercent}%)</span>
                <span className="font-bold text-blue-700 text-sm tabular-nums">+ {formatRp(nilaiOverhead)}</span>
              </div>

              <div className="bg-rose-50/70 p-3 rounded-xl border border-rose-200 text-rose-900">
                <span className="text-rose-800 block text-[10px] uppercase font-bold">Reject ({rejectPercent}%)</span>
                <span className="font-bold text-rose-700 text-sm tabular-nums">+ {formatRp(nilaiReject)}</span>
              </div>
            </div>

            {/* HIGHLIGHTED HPP FINAL & REKOMENDASI FOB */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
              <div className="bg-slate-50 p-4 rounded-xl border-2 border-slate-200">
                <span className="text-slate-500 block text-xs font-bold uppercase tracking-wider">
                  HPP FINAL PER POTONG (PCS)
                </span>
                <div className="text-2xl font-black text-slate-900 mt-1 tabular-nums">
                  {formatRp(hppFinalPerPcs)}
                </div>
                <span className="text-[11px] text-slate-400 block mt-0.5">
                  Modal bersih riil produksi per varian size {selectedSize}
                </span>
              </div>

              <div className="bg-emerald-50/90 p-4 rounded-xl border-2 border-emerald-500 shadow-xs">
                <span className="text-emerald-900 block text-xs font-bold uppercase tracking-wider flex items-center justify-between">
                  <span>REKOMENDASI HARGA FOB</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-600 text-white shadow-xs">
                    Bulat Rp 1.000
                  </span>
                </span>
                <div className="text-2xl font-black text-emerald-700 mt-1 tabular-nums">
                  {formatRp(hargaJualRekomendasi)}
                </div>
                <div className="text-[11px] text-emerald-800 mt-1 flex flex-wrap items-center justify-between gap-1">
                  <span>Laba Bersih: <strong className="font-black text-emerald-950">{formatRp(labaBersihPerPcs)} / Pcs</strong></span>
                  {isPpnIncluded && (
                    <span className="text-indigo-700 font-bold">
                      Inc. PPN 11%: {formatRp(hargaJualPlusPpn)}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* ACTION BUTTONS */}
          <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
            <button
              onClick={handleReset}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Form</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={() => onPrint(currentRecordSnapshot)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
              >
                <Printer className="w-4 h-4" />
                <span>Cetak Lembar HPP</span>
              </button>

              <button
                onClick={handleSaveRecord}
                disabled={isSaving}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-100 flex items-center gap-2 transition active:scale-95 cursor-pointer disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{isSaving ? 'Menyimpan...' : recordId ? 'Simpan Perubahan' : 'Simpan ke Database'}</span>
              </button>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
