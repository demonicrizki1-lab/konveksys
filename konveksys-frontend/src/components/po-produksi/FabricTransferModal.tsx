import React, { useState, useEffect } from 'react';
import {
  X,
  ArrowRightLeft,
  Scissors,
  Truck,
  CheckCircle2,
  AlertCircle,
  Building2,
  FileText,
  UserCheck,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ProductionPO, VendorFabricDeposit, FabricTransferNote } from '../../types';

interface FabricTransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  sourcePO: ProductionPO | null;
  onSuccess?: (deposit: VendorFabricDeposit, transferNote: FabricTransferNote) => void;
}

export const FabricTransferModal: React.FC<FabricTransferModalProps> = ({
  isOpen,
  onClose,
  sourcePO,
  onSuccess,
}) => {
  const { vendors, createFabricTransfer, currentUser } = useApp();

  const [jenisKain, setJenisKain] = useState('');
  const [warna, setWarna] = useState('');
  const [panjang, setPanjang] = useState<number | ''>('');
  const [satuan, setSatuan] = useState<'METER' | 'YARD'>('METER');
  const [targetVendor, setTargetVendor] = useState('');
  const [driverName, setDriverName] = useState(currentUser?.name || 'Rizki Maulana');
  const [kondisiKain, setKondisiKain] = useState('Utuh gulungan bersih, siap jahit');
  const [catatan, setCatatan] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Inisialisasi data form saat modal dibuka
  useEffect(() => {
    if (sourcePO) {
      const firstItem = sourcePO.items && sourcePO.items.length > 0 ? sourcePO.items[0] : null;
      setJenisKain(firstItem?.bahanKain || '');
      setWarna(firstItem?.warna || '');
      setPanjang('');
      setSatuan('METER');
      
      // Pilih target vendor selain vendor asal jika ada
      const otherVendor = vendors.find(v => v.name !== sourcePO.vendorTujuan);
      setTargetVendor(otherVendor ? otherVendor.name : '');
      setDriverName(currentUser?.name || 'Rizki Maulana');
      setKondisiKain('Utuh gulungan bersih, diukur langsung di konveksi');
      setCatatan(`Sisa produksi kain dari PO ${sourcePO.noPO}`);
      setErrorMsg(null);
    }
  }, [sourcePO, vendors, currentUser]);

  if (!isOpen || !sourcePO) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!panjang || Number(panjang) <= 0) {
      setErrorMsg('Panjang sisa kain harus diisi lebih dari 0.');
      return;
    }

    if (!targetVendor) {
      setErrorMsg('Pilih konveksi tujuan yang akan menerima titipan bahan.');
      return;
    }

    if (targetVendor === sourcePO.vendorTujuan) {
      setErrorMsg('Konveksi tujuan titipan harus berbeda dengan konveksi asal.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await createFabricTransfer({
        sourcePOId: sourcePO.id,
        sourcePONumber: sourcePO.noPO,
        sourceVendor: sourcePO.vendorTujuan || 'Vendor Asal',
        targetVendor,
        brand: sourcePO.brand,
        jenisKain: jenisKain.trim() || 'Bahan Kain Sisa',
        warna: warna.trim() || undefined,
        panjang: Number(panjang),
        satuan,
        driverName: driverName.trim() || 'Tim Logistik',
        kondisiKain: kondisiKain.trim(),
        catatan: catatan.trim(),
      });

      if (!res.success) {
        setErrorMsg(res.message);
        setIsSubmitting(false);
        return;
      }

      setIsSubmitting(false);
      onClose();
      if (res.deposit && res.transferNote && onSuccess) {
        onSuccess(res.deposit, res.transferNote);
      }
    } catch (err: any) {
      setIsSubmitting(false);
      setErrorMsg(err?.message || 'Terjadi kesalahan sistem.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden my-6">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-indigo-700 to-violet-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-white/10 backdrop-blur-xs border border-white/20">
              <ArrowRightLeft className="w-5 h-5 text-indigo-100" />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight">Oper Sisa Kain Antar-Konveksi</h2>
              <p className="text-[11px] text-indigo-100">
                Pencatatan hasil ukur di lokasi & penitipan bahan ke vendor lain
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error Notification */}
        {errorMsg && (
          <div className="m-5 mb-0 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Card Ringkasan PO Asal */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2 text-xs">
            <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
              <span className="font-semibold text-slate-500 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-indigo-600" />
                PO Asal (Pengukuran Fisik):
              </span>
              <span className="font-mono font-bold text-slate-800">{sourcePO.noPO}</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div>
                <span className="text-slate-400 block">Brand:</span>
                <span className="font-semibold text-slate-700 uppercase">{sourcePO.brand}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Konveksi Asal (Lokasi Ukur):</span>
                <span className="font-bold text-indigo-700">{sourcePO.vendorTujuan || 'Konveksi Asal'}</span>
              </div>
            </div>
          </div>

          {/* Form Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Jenis Kain */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Jenis Kain <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={jenisKain}
                onChange={e => setJenisKain(e.target.value)}
                placeholder="Cth: Ceruty Babydoll / Rayon Twill"
                required
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            {/* Warna Kain */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Warna Kain</label>
              <input
                type="text"
                value={warna}
                onChange={e => setWarna(e.target.value)}
                placeholder="Cth: Hitam / Sage Green / Navy"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            {/* Panjang Sisa Hasil Ukur */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Panjang Sisa Hasil Ukur <span className="text-rose-500">*</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  value={panjang}
                  onChange={e => setPanjang(e.target.value === '' ? '' : parseFloat(e.target.value))}
                  placeholder="0.0"
                  required
                  className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
                <select
                  value={satuan}
                  onChange={e => setSatuan(e.target.value as 'METER' | 'YARD')}
                  className="w-24 px-2.5 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none"
                >
                  <option value="METER">Meter</option>
                  <option value="YARD">Yard</option>
                </select>
              </div>
            </div>

            {/* Konveksi Tujuan (Tempat Penitipan) */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Konveksi Tujuan Penitipan <span className="text-rose-500">*</span>
              </label>
              <select
                value={targetVendor}
                onChange={e => setTargetVendor(e.target.value)}
                required
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              >
                <option value="">-- Pilih Konveksi Tujuan --</option>
                {vendors
                  .filter(v => v.name !== sourcePO.vendorTujuan)
                  .map(v => (
                    <option key={v.id} value={v.name}>
                      {v.name}
                    </option>
                  ))}
              </select>
            </div>

            {/* Petugas Pengukur / Kurir */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Petugas Pengukur & Pengantar
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={driverName}
                  onChange={e => setDriverName(e.target.value)}
                  placeholder="Nama kurir / admin"
                  className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
                <UserCheck className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
              </div>
            </div>

            {/* Kondisi Fisik Kain */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Kondisi Fisik Kain</label>
              <input
                type="text"
                value={kondisiKain}
                onChange={e => setKondisiKain(e.target.value)}
                placeholder="Cth: Gulungan utuh, tanpa cacat"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Catatan */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Catatan Tambahan</label>
            <textarea
              rows={2}
              value={catatan}
              onChange={e => setCatatan(e.target.value)}
              placeholder="Catatan instruksi atau perjanjian serah terima..."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          {/* Info Banner Alur */}
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2.5 text-[11px] text-amber-800">
            <Truck className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              Kain sisa ini akan langsung dioper ke <b>{targetVendor || 'Konveksi Tujuan'}</b> dan berstatus{' '}
              <b>Saldo Titipan Tersedia</b>. Anda bisa mengalokasikannya saat menerbitkan PO Produksi baru untuk vendor tersebut.
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold transition cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-200 transition cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <span>Memproses...</span>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Simpan & Buat Surat Jalan</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
