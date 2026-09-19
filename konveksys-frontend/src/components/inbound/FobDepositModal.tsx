import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Plus,
  Coins,
  Building2,
  Calendar,
  CreditCard,
  FileText,
  CheckCircle2,
  TrendingUp,
  Hash,
  ShoppingBag,
  Check,
  Layers,
  Sparkles,
  Upload,
  Image as ImageIcon,
  Trash2,
  Eye,
  ZoomIn,
} from 'lucide-react';
import { FobPurchaseOrder, Brand, FobDownPayment, MetodePembayaran } from '../../types';
import { formatRp, formatRupiahInput, parseRupiahInput } from '../../utils/formatters';

/**
 * Mengubah input nilai yang mungkin berupa number, string biasa, maupun string berformat (titik ribuan / desimal)
 * menjadi tipe number murni agar kalkulasi matematika selalu berupa penjumlahan (bukan string concatenation).
 */
export function parseSafeNumber(val: any): number {
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  if (!val) return 0;
  if (typeof val === 'string') {
    const trimmed = val.trim();
    if (!trimmed) return 0;
    // Deteksi jika terdapat lebih dari 1 titik pemisah ribuan (format Indo e.g. 10.290.000)
    const dotCount = (trimmed.match(/\./g) || []).length;
    if (dotCount > 1) {
      const clean = trimmed.replace(/\./g, '').replace(/,/g, '.');
      const num = parseFloat(clean);
      return isNaN(num) ? 0 : num;
    } else if (dotCount === 1) {
      const parts = trimmed.split('.');
      if (parts[1] && parts[1].length === 3 && !trimmed.includes(',')) {
        // Format ribuan 1 titik (misal: 10.290)
        const clean = trimmed.replace(/\./g, '');
        const num = parseFloat(clean);
        return isNaN(num) ? 0 : num;
      }
    }
    const clean = trimmed.replace(/[^0-9.-]/g, '');
    const num = parseFloat(clean);
    return isNaN(num) ? 0 : num;
  }
  return 0;
}

/**
 * Mengompresi file foto struk/bukti transfer agar hemat memori (~150-250KB) dan menghasilkan Base64 Data URL.
 */
function processImageFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const maxDim = 1200;

        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.82);
        resolve(dataUrl);
      };
      img.onerror = () => resolve(e.target?.result as string);
      img.src = e.target?.result as string;
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

interface FobDepositModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (
    deposit: Omit<FobDownPayment, 'id' | 'depositNumber' | 'createdAt'>,
    syncToFinance: boolean
  ) => Promise<void>;
  fobOrders: FobPurchaseOrder[];
  brands: Brand[];
  activeBrand?: string;
  userRole?: 'ADMIN' | 'BRAND';
}

export const FobDepositModal: React.FC<FobDepositModalProps> = ({
  isOpen,
  onClose,
  onSave,
  fobOrders,
  brands,
  activeBrand,
  userRole,
}) => {
  // Mode: 'AUTO' (Multi-PO Selection) vs 'MANUAL' (Input PO bebas)
  const [inputMode, setInputMode] = useState<'AUTO' | 'MANUAL'>('AUTO');
  const [selectedPoIds, setSelectedPoIds] = useState<string[]>([]);
  const [poNumber, setPoNumber] = useState<string>('');
  const [brand, setBrand] = useState<string>(userRole === 'BRAND' ? activeBrand || '' : '');
  const [tanggalBayar, setTanggalBayar] = useState<string>(new Date().toISOString().split('T')[0]);
  const [nominalTotalOrder, setNominalTotalOrder] = useState<number>(0);
  const [totalPcs, setTotalPcs] = useState<number>(0);
  const [persentaseDp, setPersentaseDp] = useState<number>(50);
  const [nominalDp, setNominalDp] = useState<number>(0);
  const [metodePembayaran, setMetodePembayaran] = useState<MetodePembayaran>('TRANSFER');
  const [bankTujuan, setBankTujuan] = useState<string>('BCA (Bisnis MRM)');
  const [nomorReferensi, setNomorReferensi] = useState<string>('');
  const [keterangan, setKeterangan] = useState<string>('');
  const [buktiBayarUrl, setBuktiBayarUrl] = useState<string>('');
  const [buktiFileName, setBuktiFileName] = useState<string>('');
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isImagePreviewOpen, setIsImagePreviewOpen] = useState<boolean>(false);
  const [syncToFinance, setSyncToFinance] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Filter FOB orders according to role
  const availableOrders = useMemo(() => {
    return userRole === 'BRAND'
      ? fobOrders.filter((o) => o.brand === activeBrand)
      : fobOrders;
  }, [fobOrders, userRole, activeBrand]);

  // Orders matching current brand
  const brandOrders = useMemo(() => {
    if (!brand) return availableOrders;
    return availableOrders.filter(
      (o) => (o.brand || '').trim().toUpperCase() === brand.trim().toUpperCase()
    );
  }, [availableOrders, brand]);

  // Recalculate combined totals from selected PO IDs
  const updateTotalsFromSelected = (
    chosenIds: string[],
    pct: number = persentaseDp,
    targetBrand: string = brand
  ) => {
    const chosenOrders = availableOrders.filter((o) => chosenIds.includes(o.id));
    if (chosenOrders.length === 0) {
      setPoNumber('');
      setNominalTotalOrder(0);
      setTotalPcs(0);
      setNominalDp(0);
      setKeterangan('');
      return;
    }

    const poNumbersArr = chosenOrders.map((o) => o.poNumber);
    const combinedPoStr = poNumbersArr.join(', ');

    // Pastikan penjumlahan bertipe number murni (akumulasi aritmatika, bukan konkatenasi string)
    const sumTotalOrder = chosenOrders.reduce((acc, o) => acc + parseSafeNumber(o.grandTotal), 0);
    const sumPcs = chosenOrders.reduce((acc, o) => acc + parseSafeNumber(o.totalQty), 0);

    setPoNumber(combinedPoStr);
    setNominalTotalOrder(sumTotalOrder);
    setTotalPcs(sumPcs);

    const calculatedDp = Math.round(sumTotalOrder * (pct / 100));
    setNominalDp(calculatedDp);

    if (chosenOrders.length === 1) {
      const o = chosenOrders[0];
      setKeterangan(
        `DP Termin 1 (${pct}%) Pesanan FOB: ${o.skuInduk || 'Produk'} (${parseSafeNumber(o.totalQty)} Pcs) - ${o.poNumber}`
      );
    } else {
      setKeterangan(
        `DP Termin 1 (${pct}%) Bundel ${chosenOrders.length} PO: ${combinedPoStr} (${sumPcs} Pcs) - ${targetBrand}`
      );
    }
  };

  // Toggle selection of a single PO
  const handleTogglePo = (poId: string) => {
    const next = selectedPoIds.includes(poId)
      ? selectedPoIds.filter((id) => id !== poId)
      : [...selectedPoIds, poId];
    setSelectedPoIds(next);
    updateTotalsFromSelected(next, persentaseDp, brand);
  };

  // Select all POs of current brand
  const handleSelectAllBrandPos = () => {
    const allIds = brandOrders.map((o) => o.id);
    setSelectedPoIds(allIds);
    updateTotalsFromSelected(allIds, persentaseDp, brand);
  };

  // Clear selected POs
  const handleClearSelectedPos = () => {
    setSelectedPoIds([]);
    updateTotalsFromSelected([], persentaseDp, brand);
  };

  // Brand change handler
  const handleBrandChange = (newBrand: string) => {
    setBrand(newBrand);
    const matching = availableOrders.filter(
      (o) => (o.brand || '').trim().toUpperCase() === newBrand.trim().toUpperCase()
    );
    if (matching.length > 0) {
      const initialIds = [matching[0].id];
      setSelectedPoIds(initialIds);
      updateTotalsFromSelected(initialIds, persentaseDp, newBrand);
    } else {
      setSelectedPoIds([]);
      updateTotalsFromSelected([], persentaseDp, newBrand);
    }
  };

  // Recalculate DP if percentage preset changes
  const handlePercentChange = (pct: number) => {
    setPersentaseDp(pct);
    const orderTotal = parseSafeNumber(nominalTotalOrder);
    if (orderTotal > 0) {
      setNominalDp(Math.round(orderTotal * (pct / 100)));
    }
    if (selectedPoIds.length > 0) {
      updateTotalsFromSelected(selectedPoIds, pct, brand);
    }
  };

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      const initialBrand = userRole === 'BRAND'
        ? activeBrand || ''
        : (availableOrders[0]?.brand || brands[0]?.name || 'MONTURE OUTDOOR');
      setBrand(initialBrand);

      const matching = availableOrders.filter(
        (o) => (o.brand || '').trim().toUpperCase() === initialBrand.trim().toUpperCase()
      );

      if (matching.length > 0) {
        setInputMode('AUTO');
        const defaultIds = [matching[0].id];
        setSelectedPoIds(defaultIds);
        updateTotalsFromSelected(defaultIds, 50, initialBrand);
      } else {
        setInputMode('MANUAL');
        setSelectedPoIds([]);
        setPoNumber('');
        setNominalTotalOrder(0);
        setTotalPcs(0);
        setNominalDp(0);
      }

      setTanggalBayar(new Date().toISOString().split('T')[0]);
      setMetodePembayaran('TRANSFER');
      setBankTujuan('BCA (Bisnis MRM)');
      setNomorReferensi('');
      setBuktiBayarUrl('');
      setBuktiFileName('');
      setIsDragging(false);
      setIsImagePreviewOpen(false);
      setSyncToFinance(true);
      setPersentaseDp(50);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!poNumber.trim()) {
      alert('Nomor PO FOB wajib diisi / dipilih!');
      return;
    }
    if (!brand.trim()) {
      alert('Brand / Buyer wajib dipilih!');
      return;
    }
    if (nominalDp <= 0) {
      alert('Nominal DP harus lebih besar dari Rp 0!');
      return;
    }

    setIsSubmitting(true);
    try {
      const chosenOrders = availableOrders.filter((o) => selectedPoIds.includes(o.id));
      const bundleInfo = chosenOrders.map((o) => ({
        poId: o.id,
        poNumber: o.poNumber,
        skuInduk: o.skuInduk || '',
        totalQty: parseSafeNumber(o.totalQty),
        grandTotal: parseSafeNumber(o.grandTotal),
      }));

      await onSave(
        {
          poId: chosenOrders.length === 1 ? chosenOrders[0].id : null,
          poNumber: poNumber.trim().toUpperCase(),
          poNumbers: chosenOrders.map((o) => o.poNumber),
          poIds: chosenOrders.map((o) => o.id),
          totalQty: parseSafeNumber(totalPcs),
          bundleInfo: bundleInfo.length > 0 ? bundleInfo : undefined,
          brand,
          tanggalBayar,
          nominalTotalOrder: parseSafeNumber(nominalTotalOrder),
          persentaseDp: parseSafeNumber(persentaseDp),
          nominalDp: parseSafeNumber(nominalDp),
          metodePembayaran,
          bankTujuan,
          nomorReferensi: nomorReferensi.trim(),
          buktiBayarUrl: buktiBayarUrl.trim() || undefined,
          keterangan: keterangan.trim(),
          statusBahan: 'BELUM_DIBELANJAKAN',
        },
        syncToFinance
      );
      onClose();
    } catch (err) {
      console.error('Failed to save FOB DP:', err);
      alert('Gagal menyimpan penerimaan DP FOB.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-100 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-linear-to-r from-indigo-50/60 via-white to-indigo-50/30">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-200">
              <Coins className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800">Catat Penerimaan DP Uang (FOB)</h2>
              <p className="text-xs text-slate-500">
                Mendukung setoran DP 1 PO maupun Bundel Multi-PO sekaligus dalam 1 transfer
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto custom-scrollbar flex-1 text-xs">
          
          {/* Mode Switcher */}
          <div className="flex items-center justify-between bg-slate-100/80 p-1 rounded-xl border border-slate-200/80">
            <button
              type="button"
              onClick={() => {
                setInputMode('AUTO');
                if (brandOrders.length > 0 && selectedPoIds.length === 0) {
                  const initialIds = [brandOrders[0].id];
                  setSelectedPoIds(initialIds);
                  updateTotalsFromSelected(initialIds, persentaseDp, brand);
                }
              }}
              className={`flex-1 py-1.5 px-3 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer ${
                inputMode === 'AUTO'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Tautkan ke PO FOB (Bisa Multi-PO)</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setInputMode('MANUAL');
                setSelectedPoIds([]);
                setPoNumber('');
                setNominalTotalOrder(0);
                setTotalPcs(0);
                setNominalDp(0);
              }}
              className={`flex-1 py-1.5 px-3 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer ${
                inputMode === 'MANUAL'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Input Nomor PO Mandiri (Manual)</span>
            </button>
          </div>

          {/* SECTION PILIH PO (MODE AUTO MULTI-PO) */}
          {inputMode === 'AUTO' ? (
            <div className="bg-slate-50/80 border border-slate-200 rounded-xl p-3.5 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/70 pb-2.5">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-700 flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5 text-indigo-600" />
                    Brand / Buyer:
                  </span>
                  {userRole === 'BRAND' ? (
                    <span className="font-bold text-slate-900 bg-white px-2.5 py-0.5 rounded border border-slate-200">
                      {activeBrand}
                    </span>
                  ) : (
                    <select
                      value={brand}
                      onChange={(e) => handleBrandChange(e.target.value)}
                      className="bg-white border border-slate-300 rounded-md px-2.5 py-1 font-bold text-slate-800 outline-hidden focus:ring-1 focus:ring-indigo-500"
                    >
                      {brands.map((b) => (
                        <option key={b.id} value={b.name}>
                          {b.name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {brandOrders.length > 0 && (
                  <div className="flex items-center gap-1.5 self-end sm:self-auto">
                    <button
                      type="button"
                      onClick={handleSelectAllBrandPos}
                      className="text-[10.5px] font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200 transition cursor-pointer"
                    >
                      Pilih Semua ({brandOrders.length} PO)
                    </button>
                    <button
                      type="button"
                      onClick={handleClearSelectedPos}
                      className="text-[10.5px] font-medium text-slate-500 hover:text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-200 transition cursor-pointer"
                    >
                      Reset
                    </button>
                  </div>
                )}
              </div>

              {/* LIST CHECKLIST PO */}
              {brandOrders.length === 0 ? (
                <div className="py-5 text-center text-slate-400 bg-white rounded-lg border border-dashed border-slate-200">
                  <ShoppingBag className="w-6 h-6 mx-auto text-slate-300 mb-1" />
                  Belum ada dokumen PO terdaftar untuk brand <strong>{brand}</strong>.
                  <div className="mt-1">
                    <button
                      type="button"
                      onClick={() => setInputMode('MANUAL')}
                      className="text-indigo-600 font-bold hover:underline"
                    >
                      Beralih ke Input Mandiri →
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-1.5 max-h-44 overflow-y-auto custom-scrollbar pr-1">
                  {brandOrders.map((o) => {
                    const isSelected = selectedPoIds.includes(o.id);
                    return (
                      <div
                        key={o.id}
                        onClick={() => handleTogglePo(o.id)}
                        className={`p-2.5 rounded-lg border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                          isSelected
                            ? 'bg-indigo-50/70 border-indigo-400 ring-1 ring-indigo-400/40'
                            : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}} // handled by parent div
                            className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                          />
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-bold text-indigo-700 text-xs">{o.poNumber}</span>
                              <span className="text-[11px] font-semibold text-slate-700 truncate max-w-[200px]">
                                {o.skuInduk}
                              </span>
                            </div>
                            <div className="text-[10.5px] text-slate-500 flex items-center gap-2 mt-0.5">
                              <span>Volume: <strong>{o.totalQty} Pcs</strong></span>
                              <span>•</span>
                              <span>Status: <strong className="text-slate-700">{o.status}</strong></span>
                            </div>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <div className="font-bold text-slate-900 text-xs">
                            {formatRp(o.grandTotal)}
                          </div>
                          {isSelected && (
                            <span className="inline-block text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.2 rounded mt-0.5">
                              ✓ Terpilih
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Rangkuman Pilihan Multi-PO */}
              {selectedPoIds.length > 0 && (
                <div className="flex items-center justify-between bg-indigo-100/60 text-indigo-900 px-3 py-1.5 rounded-lg text-[11px] font-semibold">
                  <span>
                    Terpilih: <strong>{selectedPoIds.length} Dokumen PO</strong> ({totalPcs} Pcs)
                  </span>
                  <span>
                    Total Kontrak: <strong>{formatRp(nominalTotalOrder)}</strong>
                  </span>
                </div>
              )}
            </div>
          ) : (
            /* SECTION INPUT MANDIRI (MODE MANUAL) */
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50/70 p-3.5 rounded-xl border border-slate-200">
              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">
                  Nomor PO FOB (Bisa lebih dari satu, pisahkan koma) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Hash className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={poNumber}
                    onChange={(e) => setPoNumber(e.target.value)}
                    placeholder="e.g. PO-PH-0001, PO-PH-0002"
                    className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-lg font-bold text-slate-800 focus:border-indigo-500 outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">
                  Brand / Buyer <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  {userRole === 'BRAND' ? (
                    <input
                      type="text"
                      disabled
                      value={activeBrand}
                      className="w-full pl-9 pr-3 py-2 bg-slate-100 border border-slate-200 rounded-lg font-semibold text-slate-600 outline-none"
                    />
                  ) : (
                    <select
                      value={brand}
                      onChange={(e) => setBrand(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-lg font-semibold text-slate-800 focus:border-indigo-500 outline-none"
                      required
                    >
                      {brands.map((b) => (
                        <option key={b.id} value={b.name}>
                          {b.name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Total Nilai Order & Persentase DP */}
          <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100 space-y-3">
            <div className="flex items-center justify-between text-xs text-indigo-900 font-semibold">
              <span className="flex items-center gap-1.5">
                <ShoppingBag className="w-4 h-4 text-indigo-600" />
                <span>Perhitungan Down Payment</span>
                {selectedPoIds.length > 1 && (
                  <span className="px-1.5 py-0.2 rounded bg-indigo-200 text-indigo-800 text-[10px] font-bold">
                    Bundel {selectedPoIds.length} PO
                  </span>
                )}
              </span>
              <div className="flex items-center gap-1">
                {[30, 50, 70, 100].map((pct) => (
                  <button
                    key={pct}
                    type="button"
                    onClick={() => handlePercentChange(pct)}
                    className={`px-2 py-0.5 rounded text-[11px] font-bold transition-colors cursor-pointer ${
                      persentaseDp === pct
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-white text-indigo-700 border border-indigo-200 hover:bg-indigo-100'
                    }`}
                  >
                    {pct}%
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Total Nilai Order (Rp) {selectedPoIds.length > 1 && '(Akumulasi Seluruh PO)'}
                </label>
                <input
                  type="text"
                  value={formatRupiahInput(nominalTotalOrder)}
                  onChange={(e) => {
                    const val = parseRupiahInput(e.target.value);
                    setNominalTotalOrder(val);
                    if (val > 0) {
                      setNominalDp(Math.round(val * (persentaseDp / 100)));
                    }
                  }}
                  className="w-full px-3 py-2 bg-white border border-indigo-200 rounded-lg font-semibold text-slate-800 outline-none focus:border-indigo-500 tabular-nums"
                  placeholder="Rp 0"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Nominal DP Masuk (Rp) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={formatRupiahInput(nominalDp)}
                  onChange={(e) => {
                    const val = parseRupiahInput(e.target.value);
                    setNominalDp(val);
                    const orderTotal = parseSafeNumber(nominalTotalOrder);
                    if (orderTotal > 0 && val > 0) {
                      setPersentaseDp(Math.round((val / orderTotal) * 100));
                    }
                  }}
                  className="w-full px-3 py-2 bg-white border border-indigo-300 rounded-lg font-black text-indigo-700 outline-none focus:border-indigo-500 text-sm tabular-nums"
                  placeholder="Rp 0"
                  required
                />
              </div>
            </div>
          </div>

          {/* Grid Tanggal, Metode, & Rekening */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1.5">
                Tanggal Diterima <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="date"
                  value={tanggalBayar}
                  onChange={(e) => setTanggalBayar(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-800 focus:bg-white focus:border-indigo-500 outline-none"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1.5">Metode Pembayaran</label>
              <select
                value={metodePembayaran}
                onChange={(e) => setMetodePembayaran(e.target.value as MetodePembayaran)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-800 focus:bg-white focus:border-indigo-500 outline-none"
              >
                <option value="TRANSFER">Transfer Bank</option>
                <option value="TUNAI">Kas Tunai</option>
                <option value="GIRO">Bilyet Giro / Cek</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1.5">Rekening / Kas Tujuan</label>
              <input
                type="text"
                value={bankTujuan}
                onChange={(e) => setBankTujuan(e.target.value)}
                placeholder="e.g. BCA Bisnis MRM"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-800 focus:bg-white focus:border-indigo-500 outline-none"
              />
            </div>
          </div>

          {/* No Referensi & Keterangan */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1.5">
                Nomor Bukti Transfer / Referensi
              </label>
              <input
                type="text"
                value={nomorReferensi}
                onChange={(e) => setNomorReferensi(e.target.value)}
                placeholder="e.g. TRF-BCA-123456"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-800 focus:bg-white focus:border-indigo-500 outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1.5">Keterangan Tambahan</label>
              <input
                type="text"
                value={keterangan}
                onChange={(e) => setKeterangan(e.target.value)}
                placeholder="e.g. DP Termin 1 (50%) Bundel PO..."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-800 focus:bg-white focus:border-indigo-500 outline-none"
              />
            </div>
          </div>

          {/* Upload Bukti Transfer (Image) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-slate-700 flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-indigo-600" />
                <span>Bukti Transfer (Foto / Gambar Struk)</span>
              </label>
              <span className="text-[10px] text-slate-400 font-normal">Opsional (JPG, PNG, WebP)</span>
            </div>

            {!buktiBayarUrl ? (
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={async (e) => {
                  e.preventDefault();
                  setIsDragging(false);
                  const file = e.dataTransfer.files?.[0];
                  if (file && file.type.startsWith('image/')) {
                    setBuktiFileName(file.name);
                    const base64 = await processImageFile(file);
                    setBuktiBayarUrl(base64);
                  } else {
                    alert('Harap pilih file gambar (JPG, PNG, WebP).');
                  }
                }}
                onClick={() => {
                  const input = document.getElementById('fob-bukti-file-input') as HTMLInputElement;
                  if (input) input.click();
                }}
                className={`border-2 border-dashed rounded-xl p-4 text-center transition-all cursor-pointer ${
                  isDragging
                    ? 'border-indigo-500 bg-indigo-50/70 ring-2 ring-indigo-300/50'
                    : 'border-slate-300 hover:border-indigo-400 hover:bg-slate-50/80 bg-slate-50/40'
                }`}
              >
                <input
                  id="fob-bukti-file-input"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setBuktiFileName(file.name);
                      const base64 = await processImageFile(file);
                      setBuktiBayarUrl(base64);
                    }
                  }}
                />
                <div className="flex flex-col items-center justify-center gap-1.5">
                  <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <Upload className="w-4 h-4" />
                  </div>
                  <div className="text-xs font-bold text-slate-700">
                    Klik untuk unggah struk atau seret & lepas foto di sini
                  </div>
                  <p className="text-[10.5px] text-slate-400">
                    Mendukung JPG, PNG, WEBP (Otomatis dikompresi & disimpan ke server)
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-2.5 bg-indigo-50/60 rounded-xl border border-indigo-200 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    onClick={() => setIsImagePreviewOpen(true)}
                    className="w-12 h-12 rounded-lg bg-slate-200 border border-indigo-200 overflow-hidden shrink-0 cursor-pointer relative group shadow-xs"
                    title="Klik untuk memperbesar gambar"
                  >
                    <img src={buktiBayarUrl} alt="Bukti Transfer" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white">
                      <ZoomIn className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 truncate">
                      <span className="truncate max-w-[220px]">{buktiFileName || 'Bukti_Transfer.jpg'}</span>
                      <span className="px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 text-[9.5px] font-bold shrink-0">
                        ✓ Terunggah
                      </span>
                    </div>
                    <p className="text-[10.5px] text-slate-500 mt-0.5">
                      Foto struk siap disimpan ke database bersama dokumen DP.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => setIsImagePreviewOpen(true)}
                    className="px-2.5 py-1 text-[11px] font-semibold text-indigo-700 bg-white border border-indigo-200 hover:bg-indigo-50 rounded-lg transition cursor-pointer flex items-center gap-1"
                  >
                    <Eye className="w-3 h-3" />
                    <span>Lihat</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setBuktiBayarUrl('');
                      setBuktiFileName('');
                    }}
                    className="px-2.5 py-1 text-[11px] font-semibold text-rose-600 bg-white border border-rose-200 hover:bg-rose-50 rounded-lg transition cursor-pointer flex items-center gap-1"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Hapus</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Integrasi Otomatis ke Arus Kas */}
          <div className="pt-1">
            <label className="flex items-start gap-2.5 p-3 rounded-xl border border-emerald-200 bg-emerald-50/50 cursor-pointer hover:bg-emerald-50 transition-colors">
              <input
                type="checkbox"
                checked={syncToFinance}
                onChange={(e) => setSyncToFinance(e.target.checked)}
                className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
              />
              <div className="text-xs">
                <span className="font-bold text-emerald-900 block">
                  Otomatis Catat Kas Masuk ke Arus Kas (Finance)
                </span>
                <span className="text-emerald-700 text-[11px] leading-relaxed block mt-0.5">
                  Setoran DP ini akan langsung memperbarui kartu arus kas brand {brand || 'terkait'} dan menambah saldo kas masuk sebesar <strong>{formatRp(nominalDp)}</strong> tanpa perlu input manual di menu Keuangan.
                </span>
              </div>
            </label>
          </div>

          {/* Footer Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm flex items-center gap-1.5 transition-all disabled:opacity-50 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              {isSubmitting ? 'Menyimpan...' : 'Simpan Penerimaan DP'}
            </button>
          </div>
        </form>
      </div>

      {/* Lightbox Preview Modal (Jika diperbesar) */}
      {isImagePreviewOpen && buktiBayarUrl && (
        <div
          className="fixed inset-0 z-70 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in"
          onClick={() => setIsImagePreviewOpen(false)}
        >
          <div
            className="relative max-w-2xl w-full max-h-[88vh] bg-white rounded-2xl overflow-hidden shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-indigo-600" />
                <span className="text-xs font-bold text-slate-800">
                  Pratinjau Bukti Transfer: {buktiFileName || 'Struk Transfer'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsImagePreviewOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-3 bg-slate-900/5 flex items-center justify-center overflow-auto max-h-[75vh]">
              <img
                src={buktiBayarUrl}
                alt="Preview Bukti Transfer"
                className="max-h-[70vh] w-auto object-contain rounded-lg shadow-sm"
              />
            </div>
          </div>
        </div>
      )}
    </div>,
    document.body
  );
};
