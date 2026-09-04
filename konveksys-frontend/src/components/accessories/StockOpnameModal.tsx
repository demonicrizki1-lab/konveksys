import React, { useState, useEffect } from 'react';
import { X, ClipboardCheck, AlertCircle, ArrowRight } from 'lucide-react';
import { AccessoryItem } from '../../types';
import { useApp } from '../../context/AppContext';

interface StockOpnameModalProps {
  isOpen: boolean;
  onClose: () => void;
  accessoryToAdjust?: AccessoryItem | null;
}

export const StockOpnameModal: React.FC<StockOpnameModalProps> = ({
  isOpen,
  onClose,
  accessoryToAdjust,
}) => {
  const { accessories, adjustStock } = useApp();

  const [accessoryId, setAccessoryId] = useState('');
  const [physicalCount, setPhysicalCount] = useState<number>(0);
  const [reason, setReason] = useState('Selisih Hitung Fisik');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  const currentAcc = accessories.find((a) => a.id === accessoryId) || accessoryToAdjust;

  useEffect(() => {
    if (accessoryToAdjust) {
      setAccessoryId(accessoryToAdjust.id);
      setPhysicalCount(accessoryToAdjust.stock);
    } else if (accessories.length > 0 && !accessoryId) {
      setAccessoryId(accessories[0].id);
      setPhysicalCount(accessories[0].stock);
    }
    setReason('Selisih Hitung Fisik Gudang');
    setNotes('');
    setError('');
  }, [isOpen, accessoryToAdjust, accessories]);

  if (!isOpen) return null;

  const currentStock = currentAcc ? currentAcc.stock : 0;
  const difference = Number(physicalCount) - currentStock;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessoryId) {
      setError('Silakan pilih aksesoris.');
      return;
    }

    const count = Number(physicalCount);
    if (count < 0) {
      setError('Stok fisik tidak boleh bernilai negatif.');
      return;
    }

    const fullNotes = `[${reason}] ${notes.trim()}`.trim();
    adjustStock(accessoryId, count, fullNotes);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-slideUp my-auto">
        
        {/* Header */}
        <div className="bg-amber-600 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center border border-white/30">
              <ClipboardCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base">Penyesuaian Stok Fisik (Stock Opname)</h3>
              <p className="text-xs text-amber-100">
                Koreksi selisih antara data sistem dengan penghitungan riil di gudang
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Pilih Aksesoris */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">Aksesoris yang Disesuaikan:</label>
            <select
              value={accessoryId}
              onChange={(e) => {
                setAccessoryId(e.target.value);
                const found = accessories.find((a) => a.id === e.target.value);
                if (found) setPhysicalCount(found.stock);
              }}
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
            >
              {accessories.map((a) => (
                <option key={a.id} value={a.id}>
                  [{a.sku}] {a.name} — (Sistem: {a.stock} {a.unit})
                </option>
              ))}
            </select>
          </div>

          {/* Perbandingan Stok Sistem vs Fisik */}
          {currentAcc && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
              <div className="grid grid-cols-3 gap-2 items-center text-center">
                <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                  <span className="text-[10px] text-slate-400 block font-semibold">Stok di Sistem</span>
                  <span className="text-lg font-bold text-slate-800">{currentAcc.stock}</span>
                  <span className="text-[10px] text-slate-500 block">{currentAcc.unit}</span>
                </div>

                <div className="flex justify-center text-slate-400">
                  <ArrowRight className="w-5 h-5" />
                </div>

                <div className="bg-amber-50 p-2.5 rounded-lg border border-amber-200">
                  <span className="text-[10px] text-amber-700 block font-semibold">Stok Fisik Riil</span>
                  <span className="text-lg font-bold text-amber-900">{physicalCount}</span>
                  <span className="text-[10px] text-amber-700 block">{currentAcc.unit}</span>
                </div>
              </div>

              {/* Selisih Indicator */}
              <div className="mt-3 pt-3 border-t border-slate-200 flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-600">Selisih Penyesuaian:</span>
                <span
                  className={`font-bold px-2 py-0.5 rounded text-xs ${
                    difference > 0
                      ? 'bg-emerald-100 text-emerald-800'
                      : difference < 0
                      ? 'bg-rose-100 text-rose-800'
                      : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {difference > 0 ? `+${difference}` : difference} {currentAcc.unit}
                  {difference === 0 ? ' (Sesuai / Tidak Ada Selisih)' : ''}
                </span>
              </div>
            </div>
          )}

          {/* Input Stok Fisik Riil */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Input Jumlah Hasil Hitung Fisik di Gudang ({currentAcc?.unit || 'Unit'}):
            </label>
            <input
              type="number"
              min="0"
              step="any"
              required
              value={physicalCount}
              onChange={(e) => setPhysicalCount(parseFloat(e.target.value) || 0)}
              className="w-full p-2.5 bg-amber-50/50 border border-amber-300 rounded-xl font-bold text-lg text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
            />
          </div>

          {/* Alasan Penyesuaian */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">Alasan Penyesuaian:</label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-semibold text-slate-800 focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
            >
              <option value="Selisih Hitung Fisik Gudang">🔍 Selisih Hitung Fisik (Rutin)</option>
              <option value="Barang Rusak / Cacat / Afval">💥 Barang Rusak / Cacat / Patah</option>
              <option value="Barang Hilang / Tertinggal">❓ Barang Hilang / Tidak Ditemukan</option>
              <option value="Koreksi Input Awal / Human Error">✏️ Koreksi Input Sebelumnya</option>
              <option value="Lainnya">📋 Lainnya</option>
            </select>
          </div>

          {/* Keterangan Tambahan */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">Keterangan / Catatan Tambahan:</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Detail temuan saat pengecekan fisik di rak..."
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold transition"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl font-bold shadow-md shadow-amber-600/20 transition"
            >
              Simpan Penyesuaian
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
