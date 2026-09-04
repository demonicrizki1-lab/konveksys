import React, { useState, useEffect } from 'react';
import { X, PackagePlus, Sparkles, Building2, MapPin, Tag } from 'lucide-react';
import { AccessoryItem, AccessoryCategory, AccessoryUnit } from '../../types';
import { useApp } from '../../context/AppContext';

interface AccessoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  accessoryToEdit?: AccessoryItem | null;
}

const CATEGORY_OPTIONS: { value: AccessoryCategory; label: string; icon: string }[] = [
  { value: 'KANCING', label: '🔘 Kancing (Buttons)', icon: '🔘' },
  { value: 'RESLETING', label: '🤐 Resleting / Zipper', icon: '🤐' },
  { value: 'LABEL_HANGTAG', label: '🏷️ Label Woven & Hangtag', icon: '🏷️' },
  { value: 'KARET_ELASTIS', label: '🪢 Karet & Elastis', icon: '🪢' },
  { value: 'BENANG', label: '🧵 Benang Jahit & Obras', icon: '🧵' },
  { value: 'PACKAGING', label: '📦 Packaging & Polybag', icon: '📦' },
  { value: 'LAINNYA', label: '✨ Lainnya / Trims', icon: '✨' },
];

const UNIT_OPTIONS: { value: AccessoryUnit; label: string }[] = [
  { value: 'PCS', label: 'Pcs (Buah / Lembar)' },
  { value: 'GROSS', label: 'Gross (144 pcs)' },
  { value: 'LUSIN', label: 'Lusin (12 pcs)' },
  { value: 'METER', label: 'Meter' },
  { value: 'ROLL', label: 'Roll / Gulung' },
  { value: 'CONE', label: 'Cone (Benang)' },
  { value: 'PACK', label: 'Pack' },
  { value: 'LEMBAR', label: 'Lembar' },
  { value: 'BAL', label: 'Bal' },
];

export const AccessoryModal: React.FC<AccessoryModalProps> = ({
  isOpen,
  onClose,
  accessoryToEdit,
}) => {
  const { brands, addAccessory, updateAccessory, accessories } = useApp();

  const [sku, setSku] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState<AccessoryCategory>('KANCING');
  const [brand, setBrand] = useState('UMUM');
  const [unit, setUnit] = useState<AccessoryUnit>('PCS');
  const [stock, setStock] = useState<number>(0);
  const [safetyStock, setSafetyStock] = useState<number>(10);
  const [location, setLocation] = useState('');
  const [costPerUnit, setCostPerUnit] = useState<number>(0);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (accessoryToEdit) {
      setSku(accessoryToEdit.sku);
      setName(accessoryToEdit.name);
      setCategory(accessoryToEdit.category);
      setBrand(accessoryToEdit.brand || 'UMUM');
      setUnit(accessoryToEdit.unit);
      setStock(accessoryToEdit.stock);
      setSafetyStock(accessoryToEdit.safetyStock);
      setLocation(accessoryToEdit.location || '');
      setCostPerUnit(accessoryToEdit.costPerUnit || 0);
      setNotes(accessoryToEdit.notes || '');
    } else {
      // Auto generate sample SKU
      const count = accessories.length + 1;
      const countStr = String(count).padStart(3, '0');
      setSku(`AKS-TRM-${countStr}`);
      setName('');
      setCategory('KANCING');
      setBrand('UMUM');
      setUnit('PCS');
      setStock(0);
      setSafetyStock(10);
      setLocation('Rak A-01');
      setCostPerUnit(0);
      setNotes('');
    }
    setError('');
  }, [accessoryToEdit, isOpen, accessories.length]);

  if (!isOpen) return null;

  const handleGenerateSku = () => {
    const prefixMap: Record<AccessoryCategory, string> = {
      KANCING: 'KNC',
      RESLETING: 'RSL',
      LABEL_HANGTAG: 'LBL',
      KARET_ELASTIS: 'KRT',
      BENANG: 'BNG',
      PACKAGING: 'PKG',
      LAINNYA: 'TRM',
    };
    const code = prefixMap[category] || 'AKS';
    const rand = Math.floor(100 + Math.random() * 900);
    setSku(`AKS-${code}-${rand}`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Nama aksesoris wajib diisi.');
      return;
    }

    if (accessoryToEdit) {
      await updateAccessory({
        ...accessoryToEdit,
        sku: sku.trim() || accessoryToEdit.sku,
        name: name.trim(),
        category,
        brand,
        unit,
        stock: Number(stock),
        safetyStock: Number(safetyStock),
        location: location.trim(),
        costPerUnit: Number(costPerUnit),
        notes: notes.trim(),
      });
    } else {
      await addAccessory({
        sku: sku.trim() || `AKS-${Date.now().toString(36).toUpperCase()}`,
        name: name.trim(),
        category,
        brand,
        unit,
        stock: Number(stock),
        safetyStock: Number(safetyStock),
        location: location.trim(),
        costPerUnit: Number(costPerUnit),
        notes: notes.trim(),
      });
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden animate-slideUp my-auto">
        
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/20 text-indigo-300 flex items-center justify-center border border-indigo-500/30">
              <PackagePlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base">
                {accessoryToEdit ? 'Edit Data Aksesoris & Trims' : 'Tambah Master Aksesoris Baru'}
              </h3>
              <p className="text-xs text-slate-400">
                Pencatatan material pembantu (kancing, zipper, label, hangtag, benang, dll.)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 font-medium">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* SKU */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-bold text-slate-700">Kode SKU / Kode Barang:</label>
                <button
                  type="button"
                  onClick={handleGenerateSku}
                  className="text-[10px] text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-0.5"
                >
                  <Sparkles className="w-3 h-3" /> Auto SKU
                </button>
              </div>
              <input
                type="text"
                required
                value={sku}
                onChange={(e) => setSku(e.target.value.toUpperCase())}
                placeholder="Contoh: AKS-KNC-001"
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              />
            </div>

            {/* Kategori */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">Kategori Material:</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as AccessoryCategory)}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              >
                {CATEGORY_OPTIONS.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Nama Aksesoris */}
          <div>
            <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1">
              <Tag className="w-3.5 h-3.5 text-indigo-600" />
              Nama Aksesoris & Spesifikasi Detail:
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: Kancing Batok 18L Natural / Resleting YKK 50cm Hitam"
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Kepemilikan Brand */}
            <div>
              <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-emerald-600" />
                Kepemilikan / Peruntukan Brand:
              </label>
              <select
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              >
                <option value="UMUM">🌐 Stok Umum / Workshop (Bisa Semua Brand)</option>
                {brands.map((b) => (
                  <option key={b.id} value={b.name}>
                    🏢 Khusus Brand: {b.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Satuan Unit */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">Satuan Penghitungan:</label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value as AccessoryUnit)}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              >
                {UNIT_OPTIONS.map((u) => (
                  <option key={u.value} value={u.value}>
                    {u.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            {/* Stok Awal / Riil */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                {accessoryToEdit ? 'Stok Terkini:' : 'Stok Awal Masuk:'}
              </label>
              <input
                type="number"
                min="0"
                step="any"
                value={stock}
                onChange={(e) => setStock(parseFloat(e.target.value) || 0)}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              />
            </div>

            {/* Safety Stock Threshold */}
            <div>
              <label className="block font-bold text-amber-700 mb-1">
                Batas Minimum (Safety Stock):
              </label>
              <input
                type="number"
                min="0"
                step="any"
                value={safetyStock}
                onChange={(e) => setSafetyStock(parseFloat(e.target.value) || 0)}
                className="w-full p-2.5 bg-amber-50/60 border border-amber-300 rounded-xl font-bold text-amber-900 focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                title="Sistem akan memberi alert peringatan jika stok di bawah angka ini"
              />
            </div>

            {/* Estimasi Harga Modal */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">Harga Beli / Satuan (Rp):</label>
              <input
                type="number"
                min="0"
                value={costPerUnit}
                onChange={(e) => setCostPerUnit(parseInt(e.target.value, 10) || 0)}
                placeholder="0"
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Lokasi Rak Penyimpanan */}
          <div>
            <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-rose-600" />
              Lokasi Rak / Box Penyimpanan di Gudang:
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Contoh: Rak A-02, Box Label 1, Laci Benang 3"
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
            />
          </div>

          {/* Catatan */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">Catatan Tambahan:</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Catatan spesifikasi warna, supplier langganan, dll."
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
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold shadow-md shadow-indigo-600/20 transition"
            >
              {accessoryToEdit ? 'Simpan Perubahan' : 'Simpan Aksesoris'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
