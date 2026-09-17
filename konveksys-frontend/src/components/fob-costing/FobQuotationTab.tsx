import React, { useState } from 'react';
import {
  FileText,
  Plus,
  Trash2,
  Save,
  Printer,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Building,
  User,
  Calendar,
  Layers,
  Coins,
  ArrowDown,
  Eye,
} from 'lucide-react';
import {
  FOBQuotation,
  FOBQuotationItem,
  HPPCalculationRecord,
} from '../../types';
import { formatRp, formatRupiahInput, parseRupiahInput, formatDateIndo } from '../../utils/formatters';

interface FobQuotationTabProps {
  hppRecords: HPPCalculationRecord[];
  savedQuotations: FOBQuotation[];
  onSaveQuotation: (quotation: Partial<FOBQuotation>) => Promise<{ success: boolean; data?: FOBQuotation; error?: string }>;
  onDeleteQuotation: (id: string) => Promise<{ success: boolean; error?: string }>;
  onPrintQuotation: (quotation: FOBQuotation) => void;
}

export const FobQuotationTab: React.FC<FobQuotationTabProps> = ({
  hppRecords,
  savedQuotations,
  onSaveQuotation,
  onDeleteQuotation,
  onPrintQuotation,
}) => {
  // Buyer & Quotation Header State
  const [noSurat, setNoSurat] = useState<string>('SPH/AUTO/0001');
  const [tanggal, setTanggal] = useState<string>(new Date().toISOString().split('T')[0]);
  const [buyerName, setBuyerName] = useState<string>('');
  const [buyerCompany, setBuyerCompany] = useState<string>('');
  const [buyerContact, setBuyerContact] = useState<string>('');
  const [validUntil, setValidUntil] = useState<string>(
    new Date(Date.now() + 14 * 24 * 3600 * 1000).toISOString().split('T')[0]
  );
  const [productionLeadTime, setProductionLeadTime] = useState<string>('14 - 21 Hari Kerja');
  const [termsDPPercent, setTermsDPPercent] = useState<number>(50);
  const [paymentNotes, setPaymentNotes] = useState<string>(
    'DP 50% sebelum potong kain, pelunasan 50% saat barang selesai QC & packing siap kirim.'
  );

  // Producer Company Profile State
  const [companyName, setCompanyName] = useState<string>('MAISON RAYYAN MANUFACTURING');
  const [companyAddress, setCompanyAddress] = useState<string>(
    'Kawasan Industri Garmen & Tekstil No. 88, Jawa Barat - Indonesia'
  );
  const [companyContact, setCompanyContact] = useState<string>(
    'WhatsApp: +62 812-3456-7890 | Email: commercial@maisonmrm.co.id'
  );
  const [companyBank, setCompanyBank] = useState<string>(
    'BCA: 123-456-7890 a.n. Maison Rayyan Manufacturing'
  );

  // Append Mode Input Selector State
  const [selectedHppId, setSelectedHppId] = useState<string>('');
  const [appendWarna, setAppendWarna] = useState<string>('');
  const [appendSize, setAppendSize] = useState<string>('');
  const [appendQty, setAppendQty] = useState<number>(0);
  const [appendHarga, setAppendHarga] = useState<number>(0);
  const [appendCatatan, setAppendCatatan] = useState<string>('');

  // Order Items Collection (Initial: clean empty table as specified in PRD Section 3.5)
  const [orderItems, setOrderItems] = useState<FOBQuotationItem[]>([]);

  // PPN 11% Toggle State (Default Exclude / Tanpa PPN)
  const [isPpnIncluded, setIsPpnIncluded] = useState<boolean>(false);

  // Status & Loading State
  const [saveStatus, setSaveStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // When an HPP record is selected in dropdown, auto-fill default size & FOB recommendation price
  const handleSelectHppReference = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const hppId = e.target.value;
    setSelectedHppId(hppId);
    const selected = hppRecords.find(r => r.id === hppId);
    if (selected) {
      setAppendSize(selected.size || '');
      setAppendHarga(selected.hargaJualRekomendasi || 0);
      if (!appendWarna) {
        setAppendWarna(selected.namaProduk || '');
      }
    }
  };

  // APPEND MODE: Push to orderItems table without removing previous rows!
  const handleAppendItem = () => {
    if (!appendWarna.trim()) {
      alert('Mohon isi nama varian warna atau SKU artikel.');
      return;
    }
    if (!appendSize) {
      alert('Mohon pilih ukuran (size).');
      return;
    }
    if (appendQty <= 0) {
      alert('Jumlah QTY harus lebih dari 0.');
      return;
    }
    if (appendHarga <= 0) {
      alert('Harga penawaran FOB per pcs harus lebih dari 0.');
      return;
    }

    const newItem: FOBQuotationItem = {
      id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      skuWarna: appendWarna.trim(),
      skuSize: appendSize,
      jumlahPcs: appendQty,
      hargaPerPcs: appendHarga,
      total: appendQty * appendHarga,
      catatan: appendCatatan.trim() || null,
      hppReferenceId: selectedHppId || null,
    };

    setOrderItems(prev => [...prev, newItem]);
    setAppendCatatan('');
  };

  const handleUpdateItem = (idx: number, field: 'jumlahPcs' | 'hargaPerPcs' | 'skuWarna' | 'catatan', val: any) => {
    setOrderItems(prev => {
      const updated = [...prev];
      const item = { ...updated[idx], [field]: val };
      if (field === 'jumlahPcs' || field === 'hargaPerPcs') {
        const q = Number(field === 'jumlahPcs' ? val : item.jumlahPcs) || 0;
        const h = Number(field === 'hargaPerPcs' ? val : item.hargaPerPcs) || 0;
        item.total = q * h;
      }
      updated[idx] = item;
      return updated;
    });
  };

  const handleRemoveItem = (idx: number) => {
    setOrderItems(prev => prev.filter((_, i) => i !== idx));
  };

  // Financial Summary Calculations
  const totalQty = orderItems.reduce((acc, it) => acc + (Number(it.jumlahPcs) || 0), 0);
  const totalOrderNominal = orderItems.reduce((acc, it) => acc + (Number(it.total) || 0), 0);
  const ppnPercent = isPpnIncluded ? 11 : 0;
  const ppnNominal = isPpnIncluded ? Math.round(totalOrderNominal * 0.11) : 0;
  const grandTotalWithPpn = totalOrderNominal + ppnNominal;
  const nominalDP = Math.round(grandTotalWithPpn * (termsDPPercent / 100));
  const sisaPelunasan = grandTotalWithPpn - nominalDP;

  // Save SPH to Database
  const handleSaveQuotation = async () => {
    if (!buyerName.trim()) {
      setSaveStatus({ type: 'error', message: 'Nama Buyer / Perusahaan pemesan wajib diisi.' });
      return;
    }
    if (orderItems.length === 0) {
      setSaveStatus({ type: 'error', message: 'Minimal harus ada 1 rincian item order pada penawaran.' });
      return;
    }

    setIsSaving(true);
    setSaveStatus(null);

    const payload: Partial<FOBQuotation> = {
      noSurat: noSurat.includes('AUTO') ? undefined : noSurat,
      tanggal: new Date(tanggal).toISOString(),
      buyerName: buyerName.trim(),
      buyerCompany: buyerCompany.trim() || null,
      buyerContact: buyerContact.trim() || null,
      validUntil: validUntil ? new Date(validUntil).toISOString() : null,
      termsDPPercent,
      totalQty,
      totalOrderNominal,
      isPpnIncluded,
      ppnPercent,
      ppnNominal,
      grandTotalWithPpn,
      nominalDP,
      sisaPelunasan,
      paymentNotes: paymentNotes.trim() || null,
      productionLeadTime: productionLeadTime.trim() || null,
      companyProfile: {
        namaPerusahaan: companyName,
        alamat: companyAddress,
        telepon: companyContact,
        bankInfo: companyBank,
      },
      items: orderItems,
    };

    const res = await onSaveQuotation(payload);
    setIsSaving(false);

    if (res.success && res.data) {
      setNoSurat(res.data.noSurat);
      setSaveStatus({
        type: 'success',
        message: `Surat Penawaran Harga ${res.data.noSurat} untuk ${res.data.buyerName} berhasil disimpan ke database!`,
      });
    } else {
      setSaveStatus({
        type: 'error',
        message: res.error || 'Gagal menyimpan Surat Penawaran Harga.',
      });
    }
  };

  const handleReset = () => {
    setNoSurat('SPH/AUTO/0001');
    setBuyerName('');
    setBuyerCompany('');
    setBuyerContact('');
    setOrderItems([]);
    setSaveStatus(null);
  };

  const currentQuotationSnapshot: FOBQuotation = {
    id: 'temp-sph-preview',
    noSurat: noSurat.includes('AUTO') ? 'SPH/DRAFT' : noSurat,
    tanggal: new Date(tanggal).toISOString(),
    buyerName: buyerName || 'Nama Buyer',
    buyerCompany: buyerCompany || null,
    buyerContact: buyerContact || null,
    validUntil: validUntil ? new Date(validUntil).toISOString() : null,
    termsDPPercent,
    totalQty,
    totalOrderNominal,
    isPpnIncluded,
    ppnPercent,
    ppnNominal,
    grandTotalWithPpn,
    nominalDP,
    sisaPelunasan,
    paymentNotes,
    productionLeadTime,
    companyProfile: {
      namaPerusahaan: companyName,
      alamat: companyAddress,
      telepon: companyContact,
      bankInfo: companyBank,
    },
    items: orderItems,
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
            className="text-slate-400 hover:text-slate-600 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* HEADER: BUYER INFORMATION & METADATA */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-600" />
              <span>Generator Surat Penawaran Harga FOB (SPH)</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Kompilasi pesanan gabungan berbagai warna dan ukuran (*size breakdown*) dengan termin pembayaran DP & Pelunasan.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400">No. SPH:</span>
            <input
              type="text"
              value={noSurat}
              onChange={e => setNoSurat(e.target.value)}
              className="py-1 px-2.5 bg-slate-50 border border-slate-200 rounded-lg font-bold text-indigo-700 w-36"
            />
          </div>
        </div>

        {/* FORM IDENTITAS BUYER & ESTIMASI */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5 text-xs">
          <div>
            <label className="block text-slate-500 font-semibold mb-1">Nama PIC Buyer *</label>
            <input
              type="text"
              value={buyerName}
              onChange={e => setBuyerName(e.target.value)}
              placeholder="Contoh: Pak Budi Gunawan"
              className="w-full py-1.5 px-2.5 rounded-lg border border-slate-200 font-semibold text-slate-900 focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-slate-500 font-semibold mb-1">Nama Perusahaan / Brand</label>
            <input
              type="text"
              value={buyerCompany}
              onChange={e => setBuyerCompany(e.target.value)}
              placeholder="PT / CV / Brand Buyer"
              className="w-full py-1.5 px-2.5 rounded-lg border border-slate-200 font-medium text-slate-800 focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-slate-500 font-semibold mb-1">Kontak / No. Telepon</label>
            <input
              type="text"
              value={buyerContact}
              onChange={e => setBuyerContact(e.target.value)}
              placeholder="0812-xxxx-xxxx"
              className="w-full py-1.5 px-2.5 rounded-lg border border-slate-200 text-slate-800 font-medium focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-slate-500 font-semibold mb-1">Tanggal Surat</label>
            <input
              type="date"
              value={tanggal}
              onChange={e => setTanggal(e.target.value)}
              className="w-full py-1.5 px-2.5 rounded-lg border border-slate-200 font-medium text-slate-800 focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-slate-500 font-semibold mb-1">Masa Berlaku Penawaran</label>
            <input
              type="date"
              value={validUntil}
              onChange={e => setValidUntil(e.target.value)}
              className="w-full py-1.5 px-2.5 rounded-lg border border-slate-200 font-medium text-indigo-700 focus:ring-1 focus:ring-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* MULTI-SIZE APPEND TOOLBAR (PRD Section 3.5: Koleksi Multi-Size Append Mode) */}
      <div className="bg-indigo-50/60 border border-indigo-200/80 rounded-2xl p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse"></span>
            <h4 className="text-xs font-bold text-indigo-950 uppercase tracking-wide">
              Tambahkan Rincian Order Varian Warna & Ukuran (Append Mode)
            </h4>
          </div>
          <span className="text-[11px] font-semibold text-indigo-700 bg-white px-2.5 py-0.5 rounded-full border border-indigo-100">
            Pilih Size & Warna → Masukkan ke Rincian Bertingkat
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
          
          {/* Tarik HPP Acuan */}
          <div className="lg:col-span-2">
            <label className="block text-slate-600 font-bold mb-1">1. Pilih Produk dari Database HPP</label>
            <select
              value={selectedHppId}
              onChange={handleSelectHppReference}
              className="w-full py-1.5 px-2.5 rounded-lg border border-indigo-200 bg-white text-slate-900 font-medium focus:ring-1 focus:ring-indigo-500"
            >
              <option value="">-- Pilih Rekomendasi HPP --</option>
              {hppRecords.map(h => (
                <option key={h.id} value={h.id}>
                  {h.namaProduk} ({h.size}) - Rekomendasi: {formatRp(h.hargaJualRekomendasi)}
                </option>
              ))}
            </select>
          </div>

          {/* SKU / Varian Warna */}
          <div>
            <label className="block text-slate-600 font-bold mb-1">2. Varian Warna / SKU</label>
            <input
              type="text"
              value={appendWarna}
              onChange={e => setAppendWarna(e.target.value)}
              placeholder="Contoh: Navy Blue"
              className="w-full py-1.5 px-2.5 rounded-lg border border-indigo-200 bg-white text-slate-900 font-semibold focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          {/* Size Selector */}
          <div>
            <label className="block text-slate-600 font-bold mb-1">3. Ukuran (Size)</label>
            <select
              value={appendSize}
              onChange={e => setAppendSize(e.target.value)}
              className="w-full py-1.5 px-2.5 rounded-lg border border-indigo-200 bg-white font-bold text-slate-900 focus:ring-1 focus:ring-indigo-500"
            >
              <option value="">-- Pilih Ukuran --</option>
              {['S', 'M', 'L', 'XL', 'XXL', '3XL', 'ALL SIZE'].map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* Qty Pcs */}
          <div>
            <label className="block text-slate-600 font-bold mb-1">4. Target Qty (Pcs)</label>
            <input
              type="number"
              min="0"
              value={appendQty === 0 ? '' : appendQty}
              onChange={e => setAppendQty(parseInt(e.target.value, 10) || 0)}
              placeholder="0"
              className="w-full py-1.5 px-2.5 rounded-lg border border-indigo-200 bg-white font-bold text-slate-900 tabular-nums focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          {/* Harga Penawaran FOB */}
          <div>
            <label className="block text-slate-600 font-bold mb-1">5. Harga FOB / Pcs</label>
            <input
              type="text"
              value={formatRupiahInput(appendHarga)}
              onChange={e => setAppendHarga(parseRupiahInput(e.target.value))}
              className="w-full py-1.5 px-2.5 rounded-lg border border-indigo-200 bg-white font-bold text-indigo-900 tabular-nums focus:ring-1 focus:ring-indigo-500"
              placeholder="0"
            />
          </div>
        </div>

        {/* Append Action Button */}
        <div className="flex justify-end pt-1">
          <button
            type="button"
            onClick={handleAppendItem}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Masukkan ke Rincian Order (Append)</span>
          </button>
        </div>
      </div>

      {/* TABEL RINCIAN ORDER BREAKDOWN */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-600" />
              Tabel Rincian Order Warna & Size
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Daftar seluruh varian warna dan ukuran yang ditawarkan ke buyer dalam surat penawaran ini
            </p>
          </div>
          <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-3 py-1 rounded-full">
            {orderItems.length} Baris Varian
          </span>
        </div>

        <div className="overflow-x-auto border border-slate-200 rounded-xl">
          <table className="w-full text-xs">
            <thead className="bg-slate-50 text-slate-700 text-[11px] uppercase font-bold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3 text-center w-10">No</th>
                <th className="py-2.5 px-3 text-left">SKU / Varian Warna</th>
                <th className="py-2.5 px-3 text-center w-24">Size</th>
                <th className="py-2.5 px-3 text-right w-28">Jumlah (Pcs)</th>
                <th className="py-2.5 px-3 text-right w-36">Harga FOB / Pcs</th>
                <th className="py-2.5 px-3 text-right w-40">Total (Rp)</th>
                <th className="py-2.5 px-3 text-left">Catatan Khusus</th>
                <th className="py-2.5 px-3 text-center w-12">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {orderItems.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-slate-400 italic">
                    Belum ada varian order dimasukkan. Gunakan form di atas untuk memilih size & memasukkan item ke rincian.
                  </td>
                </tr>
              ) : (
                orderItems.map((item, idx) => (
                  <tr key={item.id} className="hover:bg-slate-50/50">
                    <td className="py-2.5 px-3 text-center text-slate-400 font-medium">{idx + 1}</td>
                    
                    <td className="py-2.5 px-3 font-semibold text-slate-900">
                      <input
                        type="text"
                        value={item.skuWarna}
                        onChange={e => handleUpdateItem(idx, 'skuWarna', e.target.value)}
                        className="w-full py-1 px-2 rounded border border-slate-200 font-semibold"
                      />
                    </td>

                    <td className="py-2.5 px-3 text-center">
                      <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 font-bold rounded text-xs">
                        {item.skuSize}
                      </span>
                    </td>

                    <td className="py-2.5 px-3 text-right">
                      <input
                        type="number"
                        min="1"
                        value={item.jumlahPcs}
                        onChange={e => handleUpdateItem(idx, 'jumlahPcs', parseInt(e.target.value, 10) || 1)}
                        className="w-24 py-1 px-2 text-right font-semibold rounded border border-slate-200 tabular-nums"
                      />
                    </td>

                    <td className="py-2.5 px-3 text-right">
                      <input
                        type="text"
                        value={formatRupiahInput(item.hargaPerPcs)}
                        onChange={e => handleUpdateItem(idx, 'hargaPerPcs', parseRupiahInput(e.target.value))}
                        className="w-32 py-1 px-2 text-right font-semibold rounded border border-slate-200 tabular-nums"
                      />
                    </td>

                    <td className="py-2.5 px-3 text-right font-bold text-slate-900 tabular-nums">
                      {formatRp(item.total)}
                    </td>

                    <td className="py-2.5 px-3">
                      <input
                        type="text"
                        value={item.catatan || ''}
                        onChange={e => handleUpdateItem(idx, 'catatan', e.target.value)}
                        placeholder="Catatan..."
                        className="w-full py-1 px-2 text-slate-600 rounded border border-slate-200"
                      />
                    </td>

                    <td className="py-2.5 px-3 text-center">
                      <button
                        onClick={() => handleRemoveItem(idx)}
                        className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition cursor-pointer"
                        title="Hapus baris"
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

      {/* FINANCIAL SUMMARY & TERMIN PEMBAYARAN */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* TERMIN PEMBAYARAN FORM */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3.5 text-xs">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <Coins className="w-4 h-4 text-indigo-600" />
            Termin & Ketentuan Pembayaran
          </h3>

          <div>
            <div className="flex justify-between font-semibold text-slate-700 mb-1">
              <span>Uang Muka / Down Payment (%):</span>
              <span className="font-bold text-indigo-700 tabular-nums">{termsDPPercent}% DP</span>
            </div>
            <input
              type="range"
              min="20"
              max="100"
              step="5"
              value={termsDPPercent}
              onChange={e => setTermsDPPercent(parseInt(e.target.value, 10))}
              className="w-full accent-indigo-600 cursor-pointer"
            />
          </div>

          <div>
            <label className="block text-slate-500 font-semibold mb-1">Estimasi Lead Time Produksi</label>
            <input
              type="text"
              value={productionLeadTime}
              onChange={e => setProductionLeadTime(e.target.value)}
              className="w-full py-1.5 px-2.5 rounded-lg border border-slate-200 text-slate-800 font-medium"
              placeholder="Contoh: 14 - 21 Hari Kerja"
            />
          </div>

          <div>
            <label className="block text-slate-500 font-semibold mb-1">Catatan Termin & Rekening Pembayaran</label>
            <textarea
              rows={3}
              value={paymentNotes}
              onChange={e => setPaymentNotes(e.target.value)}
              className="w-full p-2 text-xs rounded-lg border border-slate-200 text-slate-800"
            />
          </div>

          {/* TOGGLE PPN 11% */}
          <div className="pt-2 border-t border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-semibold text-slate-700 block text-xs">Pajak PPN 11%</span>
                <span className="text-[10.5px] text-slate-500">
                  {isPpnIncluded ? 'Termasuk PPN 11% (Include)' : 'Tanpa PPN (Exclude)'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsPpnIncluded(!isPpnIncluded)}
                className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  isPpnIncluded ? 'bg-indigo-600' : 'bg-slate-300'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    isPpnIncluded ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* SUMMARY CARDS & SAVE TRIGGER (WHITE THEME) */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-sm flex flex-col justify-between space-y-4 text-slate-800">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Ringkasan Nilai Order Surat Penawaran (FOB)
                </span>
                <h4 className="text-lg font-black text-slate-900 mt-0.5">
                  Buyer: {buyerName || 'Belum Ditentukan'}
                </h4>
              </div>
              <div className="text-right">
                <span className="text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2.5 py-1 rounded-md">{noSurat}</span>
                <span className="block text-[11px] text-slate-400 mt-1 font-medium">Total: {totalQty} Pcs</span>
              </div>
            </div>

            {/* FINANCIAL VALUE BOXES */}
            <div className={`grid grid-cols-1 ${isPpnIncluded ? 'sm:grid-cols-4' : 'sm:grid-cols-3'} gap-3 mb-4`}>
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <span className="text-slate-500 block text-[10px] uppercase font-bold">
                  {isPpnIncluded ? 'SUBTOTAL (DPP)' : 'TOTAL NILAI ORDER'}
                </span>
                <div className="text-xl font-black text-slate-900 mt-1 tabular-nums">{formatRp(totalOrderNominal)}</div>
                <span className="text-[10px] text-slate-400 block mt-0.5">Akumulasi seluruh varian</span>
              </div>

              {isPpnIncluded && (
                <div className="bg-indigo-50/70 p-3.5 rounded-xl border border-indigo-200">
                  <span className="text-indigo-800 block text-[10px] uppercase font-bold">GRAND TOTAL (+ PPN 11%)</span>
                  <div className="text-xl font-black text-indigo-900 mt-1 tabular-nums">{formatRp(grandTotalWithPpn)}</div>
                  <span className="text-[10px] text-indigo-600 font-medium block mt-0.5">PPN 11%: +{formatRp(ppnNominal)}</span>
                </div>
              )}

              <div className="bg-indigo-50/50 p-3.5 rounded-xl border-2 border-indigo-300">
                <span className="text-indigo-900 block text-[10px] uppercase font-bold flex justify-between">
                  <span>NOMINAL DP ({termsDPPercent}%)</span>
                </span>
                <div className="text-xl font-black text-indigo-700 mt-1 tabular-nums">{formatRp(nominalDP)}</div>
                <span className="text-[10px] text-indigo-600/80 block mt-0.5">Wajib diselesaikan di awal</span>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <span className="text-slate-500 block text-[10px] uppercase font-bold">SISA PELUNASAN ({100 - termsDPPercent}%)</span>
                <div className="text-xl font-bold text-slate-800 mt-1 tabular-nums">{formatRp(sisaPelunasan)}</div>
                <span className="text-[10px] text-slate-400 block mt-0.5">Sebelum surat jalan kirim</span>
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
              <span>Reset Penawaran</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={() => onPrintQuotation(currentQuotationSnapshot)}
                disabled={orderItems.length === 0}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50 shadow-sm"
              >
                <Printer className="w-4 h-4" />
                <span>Cetak / Download PDF SPH</span>
              </button>

              <button
                onClick={handleSaveQuotation}
                disabled={isSaving || orderItems.length === 0}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-100 flex items-center gap-2 transition active:scale-95 cursor-pointer disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{isSaving ? 'Menyimpan...' : 'Simpan SPH ke Database'}</span>
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* RIWAYAT SURAT PENAWARAN HARGA (SPH) TERSIMPAN */}
      {savedQuotations.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <FileText className="w-4 h-4 text-slate-700" />
              Riwayat Surat Penawaran Harga (SPH) Tersimpan di Database
            </h4>
            <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
              {savedQuotations.length} Dokumen
            </span>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 text-slate-700 text-[11px] uppercase font-bold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3 text-left">No. Surat SPH</th>
                  <th className="py-2.5 px-3 text-left">Nama Buyer / Client</th>
                  <th className="py-2.5 px-3 text-center">Total Volume</th>
                  <th className="py-2.5 px-3 text-right">Total Nilai Order</th>
                  <th className="py-2.5 px-3 text-right">Nominal DP</th>
                  <th className="py-2.5 px-3 text-center">Tanggal</th>
                  <th className="py-2.5 px-3 text-center w-28">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {savedQuotations.map(q => (
                  <tr key={q.id} className="hover:bg-slate-50/60 transition">
                    <td className="py-2.5 px-3 font-semibold text-indigo-700">{q.noSurat}</td>
                    <td className="py-2.5 px-3 font-semibold text-slate-900">
                      {q.buyerName}
                      {q.buyerCompany && <span className="block text-[10px] text-slate-400">{q.buyerCompany}</span>}
                    </td>
                    <td className="py-2.5 px-3 text-center font-semibold tabular-nums">{q.totalQty} Pcs</td>
                    <td className="py-2.5 px-3 text-right font-semibold text-slate-900 tabular-nums">{formatRp(q.totalOrderNominal)}</td>
                    <td className="py-2.5 px-3 text-right font-semibold text-indigo-700 tabular-nums">{formatRp(q.nominalDP)}</td>
                    <td className="py-2.5 px-3 text-center text-slate-500 text-[11px]">{formatDateIndo(q.tanggal)}</td>
                    <td className="py-2.5 px-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => onPrintQuotation(q)}
                          className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded transition cursor-pointer"
                          title="Cetak SPH"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onDeleteQuotation(q.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition cursor-pointer"
                          title="Hapus SPH"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
};
