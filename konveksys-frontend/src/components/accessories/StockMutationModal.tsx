import React, { useState, useEffect } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { AccessoryItem } from '../../types';
import { useApp } from '../../context/AppContext';
import { formatRp } from '../../utils/formatters';

interface StockMutationModalProps {
  isOpen: boolean;
  type: 'MASUK' | 'KELUAR';
  onClose: () => void;
  selectedAccessory?: AccessoryItem | null;
}

export const StockMutationModal: React.FC<StockMutationModalProps> = ({
  isOpen,
  type,
  onClose,
  selectedAccessory,
}) => {
  const { accessories, spkList, recordStockIn, recordStockOut } = useApp();

  const [accessoryId, setAccessoryId] = useState('');
  const [quantity, setQuantity] = useState<number>(1);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [sourceOrDestination, setSourceOrDestination] = useState('');
  const [spkId, setSpkId] = useState('');
  const [recipientOrVendor, setRecipientOrVendor] = useState('');
  const [costTotal, setCostTotal] = useState<number>(0);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  const currentAcc = accessories.find((a) => a.id === accessoryId) || selectedAccessory;

  useEffect(() => {
    if (selectedAccessory) {
      setAccessoryId(selectedAccessory.id);
    } else if (accessories.length > 0 && !accessoryId) {
      setAccessoryId(accessories[0].id);
    }
    setQuantity(1);
    setDate(new Date().toISOString().split('T')[0]);
    setSourceOrDestination(
      type === 'MASUK' ? 'Restock Pembelian Toko' : 'Alokasi Produksi Workshop'
    );
    setSpkId('');
    setRecipientOrVendor('');
    setCostTotal(0);
    setNotes('');
    setError('');
  }, [isOpen, selectedAccessory, type, accessories]);

  const handleSpkChange = (selectedSpkId: string) => {
    setSpkId(selectedSpkId);
    if (selectedSpkId) {
      const spk = spkList.find((s) => s.id === selectedSpkId);
      if (spk) {
        setRecipientOrVendor(`Penjahit: ${spk.vendor}`);
        setSourceOrDestination(`Alokasi SPK: ${spk.spkNumber} (${spk.produk} - ${spk.brand})`);
      }
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessoryId) {
      setError('Silakan pilih aksesoris terlebih dahulu.');
      return;
    }

    const qty = Number(quantity);
    if (qty <= 0) {
      setError('Jumlah harus lebih dari 0.');
      return;
    }

    if (type === 'MASUK') {
      await recordStockIn({
        accessoryId,
        quantity: qty,
        date,
        sourceOrDestination: sourceOrDestination.trim(),
        recipientOrVendor: recipientOrVendor.trim(),
        notes: notes.trim(),
        costTotal: costTotal > 0 ? costTotal : undefined,
      });
      onClose();
    } else {
      const result = await recordStockOut({
        accessoryId,
        quantity: qty,
        date,
        sourceOrDestination: sourceOrDestination.trim(),
        spkId: spkId || undefined,
        recipientOrVendor: recipientOrVendor.trim(),
        notes: notes.trim(),
      });

      if (!result.success) {
        setError(result.message || 'Gagal mengeluarkan stok.');
        return;
      }
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto shadow-lg border border-slate-100 space-y-5 animate-slideUp">
        
        {/* Header (Clean white like SPK cutting modal) */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="font-bold text-slate-900 text-base">
              {type === 'MASUK' ? 'Catat Stok Masuk (Restock / Inbound)' : 'Catat Stok Keluar (Alokasi SPK)'}
            </h3>
            <p className="text-[11px] text-slate-400">
              {type === 'MASUK'
                ? 'Penerimaan bahan pembantu dari supplier toko atau titipan buyer'
                : 'Pengambilan bahan pembantu untuk proses produksi / penjahit'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 font-medium flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Pilih Aksesoris */}
          <div>
            <label className="block font-bold text-slate-600 mb-1">Pilih Aksesoris / Trims:</label>
            <select
              value={accessoryId}
              onChange={(e) => setAccessoryId(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 outline-none focus:border-indigo-400 focus:bg-white transition"
            >
              {accessories.length === 0 && (
                <option value="">-- Belum ada master data aksesoris --</option>
              )}
              {accessories.map((a) => (
                <option key={a.id} value={a.id}>
                  [{a.sku}] {a.name} — (Sisa Stok: {a.stock} {a.unit})
                </option>
              ))}
            </select>
          </div>

          {/* Info Card Selected Accessory */}
          {currentAcc && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 block">Stok Tersedia Saat Ini:</span>
                <span className="text-base font-bold text-slate-900">
                  {currentAcc.stock} {currentAcc.unit}
                </span>
                <span className="text-[10px] text-slate-500 block">
                  Lokasi: {currentAcc.location || '-'} • Safety: {currentAcc.safetyStock} {currentAcc.unit}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 block">Kategori:</span>
                <span className="px-2 py-0.5 bg-white border border-slate-200 text-slate-700 font-bold rounded text-[10px]">
                  {currentAcc.category}
                </span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Jumlah Mutasi */}
            <div>
              <label className="block font-bold text-slate-600 mb-1">
                Jumlah {type === 'MASUK' ? 'Masuk' : 'Dikeluarkan'} ({currentAcc?.unit || 'Unit'}):
              </label>
              <input
                type="number"
                min="0.1"
                step="any"
                required
                value={quantity}
                onChange={(e) => setQuantity(parseFloat(e.target.value) || 0)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 outline-none focus:border-indigo-400 focus:bg-white transition"
              />
            </div>

            {/* Tanggal */}
            <div>
              <label className="block font-bold text-slate-600 mb-1">Tanggal Transaksi:</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 outline-none focus:border-indigo-400 focus:bg-white transition"
              />
            </div>
          </div>

          {/* Conditional SPK Linkage for Stock Out */}
          {type === 'KELUAR' && (
            <div>
              <label className="block font-bold text-slate-600 mb-1">
                Alokasi ke SPK Cutting & Jahit (Opsional):
              </label>
              <select
                value={spkId}
                onChange={(e) => handleSpkChange(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 outline-none focus:border-indigo-400 focus:bg-white transition"
              >
                <option value="">-- Tidak Terhubung ke SPK Tertentu (Umum) --</option>
                {spkList.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.spkNumber} — {s.produk} ({s.brand}) • Vendor: {s.vendor}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Sumber / Tujuan */}
            <div>
              <label className="block font-bold text-slate-600 mb-1">
                {type === 'MASUK' ? 'Sumber Penerimaan / Toko:' : 'Tujuan Pemakaian:'}
              </label>
              <input
                type="text"
                value={sourceOrDestination}
                onChange={(e) => setSourceOrDestination(e.target.value)}
                placeholder={type === 'MASUK' ? 'Contoh: Toko Kancing Jaya / Titipan Buyer' : 'Contoh: Produksi Kemeja'}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 outline-none focus:border-indigo-400 focus:bg-white transition"
              />
            </div>

            {/* Penerima / Petugas */}
            <div>
              <label className="block font-bold text-slate-600 mb-1">
                {type === 'MASUK' ? 'Penerima / Admin:' : 'Pengambil / Penjahit:'}
              </label>
              <input
                type="text"
                value={recipientOrVendor}
                onChange={(e) => setRecipientOrVendor(e.target.value)}
                placeholder="Contoh: SAHIRA / Mas Joko (QC)"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 outline-none focus:border-indigo-400 focus:bg-white transition"
              />
            </div>
          </div>

          {/* Biaya Pembelian Total (Hanya jika Masuk) */}
          {type === 'MASUK' && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block font-bold text-slate-600">Total Biaya Pembelian (Rp):</label>
                {costTotal > 0 && (
                  <span className="text-emerald-700 font-bold">{formatRp(costTotal)}</span>
                )}
              </div>
              <input
                type="number"
                min="0"
                value={costTotal}
                onChange={(e) => setCostTotal(parseInt(e.target.value, 10) || 0)}
                placeholder="0 (Kosongkan jika titipan buyer tanpa biaya)"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 outline-none focus:border-indigo-400 focus:bg-white transition"
              />
            </div>
          )}

          {/* Catatan */}
          <div>
            <label className="block font-bold text-slate-600 mb-1">Catatan / No Bukti Nota:</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="No Nota toko, batch kedatangan, keterangan tambahan..."
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 outline-none focus:border-indigo-400 focus:bg-white transition"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition"
            >
              Batal
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition"
            >
              {type === 'MASUK' ? 'Konfirmasi Stok Masuk' : 'Keluarkan Stok'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};

