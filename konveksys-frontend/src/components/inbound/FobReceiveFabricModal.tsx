import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  PackageCheck,
  Building2,
  Calendar,
  Sparkles,
  CheckCircle2,
  Layers,
  Banknote,
  Scissors,
  ArrowRight,
} from 'lucide-react';
import { FobDownPayment } from '../../types';
import { formatRupiahInput, parseRupiahInput } from '../../utils/formatters';

interface FobReceiveFabricModalProps {
  isOpen: boolean;
  deposit: FobDownPayment | null;
  onClose: () => void;
  onReceive: (
    depositId: string,
    data: {
      jenisKain: string;
      meterLength: number;
      hargaModalMeter: number;
      keterangan?: string;
    }
  ) => Promise<{ success: boolean; rollCode?: string; message?: string }>;
}

export const FobReceiveFabricModal: React.FC<FobReceiveFabricModalProps> = ({
  isOpen,
  deposit,
  onClose,
  onReceive,
}) => {
  const [jenisKain, setJenisKain] = useState<string>('');
  const [meterLength, setMeterLength] = useState<number>(100);
  const [hargaModalMeter, setHargaModalMeter] = useState<number>(40000);
  const [keterangan, setKeterangan] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (deposit) {
      setJenisKain('');
      setMeterLength(100);
      setHargaModalMeter(40000);
      setKeterangan(`Kain pesanan FOB untuk ${deposit.poNumber}`);
    }
  }, [deposit]);

  if (!isOpen || !deposit) return null;

  const formatRp = (num: number) => 'Rp ' + (num || 0).toLocaleString('id-ID');

  const totalBiayaRol = meterLength * hargaModalMeter;
  const currentAlokasiBiaya = deposit.alokasiKain?.totalBiaya || 0;
  const totalBiayaSetelahTerima = currentAlokasiBiaya + totalBiayaRol;
  const sisaDanaDp = deposit.nominalDp - totalBiayaSetelahTerima;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jenisKain.trim()) {
      alert('Nama / jenis kain wajib diisi!');
      return;
    }
    if (meterLength <= 0) {
      alert('Panjang meter kain harus lebih besar dari 0!');
      return;
    }
    if (hargaModalMeter <= 0) {
      alert('Harga modal per meter harus lebih besar dari Rp 0!');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await onReceive(deposit.id, {
        jenisKain: jenisKain.trim(),
        meterLength,
        hargaModalMeter,
        keterangan: keterangan.trim(),
      });
      if (res.success) {
        alert(res.message || 'Rol kain berhasil diterima ke gudang!');
        onClose();
      } else {
        alert(res.message || 'Gagal menerima rol kain.');
      }
    } catch (err) {
      console.error('Failed to receive fabric roll:', err);
      alert('Terjadi kesalahan saat memproses penerimaan kain.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-100 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-linear-to-r from-emerald-50/60 via-white to-emerald-50/20">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-200">
              <PackageCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800">Terima Kain dari DP FOB</h2>
              <p className="text-xs text-slate-500">
                Konversi DP uang menjadi stok fisik rol kain di gudang siap potong
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto custom-scrollbar flex-1 text-xs">
          {/* Card Info DP & PO Rujukan */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-700">{deposit.poNumber}</span>
              <span className="px-2 py-0.5 bg-indigo-100 text-indigo-800 font-bold rounded text-[10px]">
                {deposit.brand}
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px] pt-1">
              <div>
                <span className="text-slate-400 block text-[10px]">Dana DP Diterima:</span>
                <span className="font-bold text-emerald-700">{formatRp(deposit.nominalDp)}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Alokasi Belanja:</span>
                <span className="font-bold text-slate-700">{formatRp(currentAlokasiBiaya)}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Kain Tiba Sebelumnya:</span>
                <span className="font-bold text-indigo-700">{deposit.alokasiKain?.totalMeter || 0} m</span>
              </div>
            </div>
          </div>

          {/* Input Jenis Kain */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1.5">
              Jenis / Spesifikasi Kain <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={jenisKain}
              onChange={(e) => setJenisKain(e.target.value)}
              placeholder="e.g. Parasut Micro WP / Cotton Combed 30s Reaktif"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-semibold text-slate-800 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
              required
            />
            {/* Quick Presets */}
            <div className="flex flex-wrap gap-1.5 mt-1.5">
              {['Parasut Micro WP', 'Cotton Combed 30s', 'Cotton Combed 24s', 'Linen Angel Crepe', 'Furing Despo'].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setJenisKain(preset)}
                  className="px-2 py-0.5 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-600 rounded text-[10px] font-medium border border-slate-200 transition-colors"
                >
                  + {preset}
                </button>
              ))}
            </div>
          </div>

          {/* Grid Meter & Harga Modal */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1.5">
                Panjang Kain Masuk (Meter) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={meterLength || ''}
                  onChange={(e) => setMeterLength(Math.max(1, parseInt(e.target.value, 10) || 0))}
                  className="w-full pl-3 pr-10 py-2 bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-800 focus:bg-white focus:border-emerald-500 outline-none"
                  required
                />
                <span className="absolute right-3 top-2 font-bold text-slate-400">m</span>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1.5">
                Harga Modal Beli / Meter (Rp) <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={formatRupiahInput(hargaModalMeter)}
                onChange={(e) => setHargaModalMeter(parseRupiahInput(e.target.value))}
                placeholder="Rp 0"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-800 focus:bg-white focus:border-emerald-500 outline-none"
                required
              />
            </div>
          </div>

          {/* Total Biaya Rol & Dampak ke DP */}
          <div className="bg-emerald-50/70 p-3.5 rounded-xl border border-emerald-200 space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-emerald-900">Total Biaya Rol Kain Ini:</span>
              <span className="font-black text-emerald-800 text-sm">{formatRp(totalBiayaRol)}</span>
            </div>
            <div className="flex items-center justify-between text-[11px] text-emerald-700 pt-1 border-t border-emerald-200/60">
              <span>Estimasi Sisa Saldo DP:</span>
              <span className={`font-bold ${sisaDanaDp < 0 ? 'text-rose-600' : 'text-emerald-800'}`}>
                {formatRp(sisaDanaDp)} {sisaDanaDp < 0 && '(Over DP / Terbayar dari Kas)'}
              </span>
            </div>
          </div>

          {/* Keterangan */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1.5">Keterangan / Supplier Bahan</label>
            <input
              type="text"
              value={keterangan}
              onChange={(e) => setKeterangan(e.target.value)}
              placeholder="e.g. Kain Parasut dari Supplier Bandung, Lot #21"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-800 focus:bg-white focus:border-emerald-500 outline-none"
            />
          </div>

          {/* Notice info */}
          <div className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-100 flex items-start gap-2 text-[11px] text-indigo-800">
            <Sparkles className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
            <span>
              Kode rol otomatis dibuat dengan format barcode brand (misal <strong>ROL-{deposit.brand.substring(0,3).toUpperCase()}-XXX</strong>), tercatat sebagai sumber <strong>FOB ({deposit.poNumber})</strong>, dan langsung siap dipotong di menu SPK Potong.
            </span>
          </div>

          {/* Footer Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm flex items-center gap-1.5 transition-all disabled:opacity-50"
            >
              <Scissors className="w-4 h-4" />
              {isSubmitting ? 'Memproses...' : 'Terima & Masukkan ke Stok Gudang'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
