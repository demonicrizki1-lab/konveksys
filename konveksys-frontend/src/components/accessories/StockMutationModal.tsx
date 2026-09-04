import React, { useState, useEffect } from 'react';
import { X, ArrowDownLeft, ArrowUpRight, Scissors, AlertTriangle } from 'lucide-react';
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

  // When SPK selected for stock out, auto-fill recipient with vendor name
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

  const handleSubmit = (e: React.FormEvent) => {
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
      recordStockIn({
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
      // Keluar
      const result = recordStockOut({
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
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-slideUp my-auto">
        
        {/* Header */}
        <div
          className={`px-6 py-4 flex items-center justify-between text-white ${
            type === 'MASUK' ? 'bg-emerald-800' : 'bg-rose-800'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center border border-white/20">
              {type === 'MASUK' ? (
                <ArrowDownLeft className="w-5 h-5 text-emerald-200" />
              ) : (
                <ArrowUpRight className="w-5 h-5 text-rose-200" />
              )}
            </div>
            <div>
              <h3 className="font-bold text-base">
                {type === 'MASUK' ? 'Catat Stok Masuk (Restock / Inbound)' : 'Catat Stok Keluar (Alokasi SPK)'}
              </h3>
              <p className="text-xs text-white/80">
                {type === 'MASUK'
                  ? 'Penerimaan barang dari toko atau titipan brand buyer'
                  : 'Pengambilan bahan pembantu untuk proses jahit / packing'}
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
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Pilih Aksesoris */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">Pilih Aksesoris / Trims:</label>
            <select
              value={accessoryId}
              onChange={(e) => setAccessoryId(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
            >
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
                <span className="text-[10px] text-slate-400 block">Brand:</span>
                <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 font-bold rounded text-[10px]">
                  {currentAcc.brand || 'UMUM'}
                </span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Jumlah Mutasi */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Jumlah {type === 'MASUK' ? 'Masuk' : 'Dikeluarkan'} ({currentAcc?.unit || 'Unit'}):
              </label>
              <input
                type="number"
                min="0.1"
                step="any"
                required
                value={quantity}
                onChange={(e) => setQuantity(parseFloat(e.target.value) || 0)}
                className={`w-full p-2.5 border rounded-xl font-bold text-base focus:outline-hidden ${
                  type === 'MASUK'
                    ? 'bg-emerald-50/50 border-emerald-300 text-emerald-900 focus:ring-2 focus:ring-emerald-500'
                    : 'bg-rose-50/50 border-rose-300 text-rose-900 focus:ring-2 focus:ring-rose-500'
                }`}
              />
            </div>

            {/* Tanggal */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">Tanggal Transaksi:</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Conditional SPK Linkage for Stock Out */}
          {type === 'KELUAR' && (
            <div>
              <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1">
                <Scissors className="w-3.5 h-3.5 text-indigo-600" />
                Alokasi ke SPK Cutting & Jahit (Opsional):
              </label>
              <select
                value={spkId}
                onChange={(e) => handleSpkChange(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Sumber / Tujuan */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                {type === 'MASUK' ? 'Sumber Penerimaan / Toko:' : 'Tujuan Pemakaian:'}
              </label>
              <input
                type="text"
                value={sourceOrDestination}
                onChange={(e) => setSourceOrDestination(e.target.value)}
                placeholder={type === 'MASUK' ? 'Contoh: Toko Kancing Jaya / Titipan Buyer' : 'Contoh: Produksi Kemeja'}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              />
            </div>

            {/* Penerima / Petugas */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                {type === 'MASUK' ? 'Penerima / Admin:' : 'Pengambil / Penjahit:'}
              </label>
              <input
                type="text"
                value={recipientOrVendor}
                onChange={(e) => setRecipientOrVendor(e.target.value)}
                placeholder="Contoh: SAHIRA / Mas Joko (QC)"
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Biaya Pembelian Total (Hanya jika Masuk) */}
          {type === 'MASUK' && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-bold text-slate-700">Total Biaya Pembelian (Rp):</label>
                {costTotal > 0 && (
                  <span className="text-emerald-700 font-bold">{formatRp(costTotal)}</span>
                )}
              </div>
              <input
                type="number"
                min="0"
                value={costTotal}
                onChange={(e) => setCostTotal(parseInt(e.target.value, 10) || 0)}
                placeholder="0 (Kosongkan jika titipan buyer tanpa bayar)"
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
            </div>
          )}

          {/* Catatan */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">Catatan / No Bukti Nota:</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="No Nota toko, batch kedatangan, keterangan tambahan..."
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
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
              className={`px-5 py-2 text-white rounded-xl font-bold shadow-md transition ${
                type === 'MASUK'
                  ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/20'
                  : 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/20'
              }`}
            >
              {type === 'MASUK' ? 'Konfirmasi Stok Masuk' : 'Keluarkan Stok'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
