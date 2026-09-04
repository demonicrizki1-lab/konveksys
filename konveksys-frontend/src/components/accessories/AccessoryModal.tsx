import React, { useState, useEffect } from 'react';
import { X, Sparkles } from 'lucide-react';
import { AccessoryItem, AccessoryCategory, AccessoryUnit } from '../../types';
import { useApp } from '../../context/AppContext';

interface AccessoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  accessoryToEdit?: AccessoryItem | null;
}

const CATEGORY_OPTIONS: { value: AccessoryCategory; label: string }[] = [
  { value: 'LABEL', label: 'Label' },
  { value: 'BORDIR', label: 'Bordir' },
  { value: 'HANGTAG', label: 'Hangtag' },
  { value: 'PLASTIK_PACKING', label: 'Plastik Packing' },
  { value: 'WOVEN', label: 'Woven' },
  { value: 'KANCING', label: 'Kancing' },
  { value: 'RESLETING', label: 'Resleting' },
  { value: 'BENANG', label: 'Benang' },
  { value: 'KARET_ELASTIS', label: 'Karet Elastis' },
  { value: 'LAINNYA', label: 'Lainnya' },
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
  const { addAccessory, updateAccessory, accessories } = useApp();

  const [sku, setSku] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState<AccessoryCategory>('LABEL');
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
      setCategory(accessoryToEdit.category || 'LABEL');
      setUnit(accessoryToEdit.unit || 'PCS');
      setStock(accessoryToEdit.stock);
      setSafetyStock(accessoryToEdit.safetyStock);
      setLocation(accessoryToEdit.location || '');
      setCostPerUnit(accessoryToEdit.costPerUnit || 0);
      setNotes(accessoryToEdit.notes || '');
    } else {
      const count = accessories.length + 1;
      const countStr = String(count).padStart(3, '0');
      setSku(`AKS-LBL-${countStr}`);
      setName('');
      setCategory('LABEL');
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
      LABEL: 'LBL',
      BORDIR: 'BDR',
      HANGTAG: 'HTG',
      PLASTIK_PACKING: 'PKG',
      WOVEN: 'WVN',
      KANCING: 'KNC',
      RESLETING: 'RSL',
      BENANG: 'BNG',
      KARET_ELASTIS: 'KRT',
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
        brand: accessoryToEdit.brand || 'UMUM',
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
        brand: 'UMUM',
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
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-xl w-full p-6 max-h-[90vh] overflow-y-auto shadow-lg border border-slate-100 space-y-5 animate-slideUp">
        
        {/* Header (Clean white like SPK cutting modal) */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="font-bold text-slate-900 text-base">
              {accessoryToEdit ? 'Edit Data Aksesoris' : 'Tambah Master Aksesoris Baru'}
            </h3>
            <p className="text-[11px] text-slate-400">
              Pencatatan material pembantu (label, hangtag, woven, plastik packing, dll.)
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
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 font-medium">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* SKU */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block font-bold text-slate-600">Kode SKU / Kode Barang:</label>
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
                placeholder="Contoh: AKS-LBL-001"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-slate-900 outline-none focus:border-indigo-400 focus:bg-white transition"
              />
            </div>

            {/* Kategori Material (Plain text names, no icon) */}
            <div>
              <label className="block font-bold text-slate-600 mb-1">Kategori Material:</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as AccessoryCategory)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 outline-none focus:border-indigo-400 focus:bg-white transition"
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
            <label className="block font-bold text-slate-600 mb-1">
              Nama Aksesoris & Spesifikasi Detail:
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: Label Woven Leher 2.5x5cm / Plastik Klip 25x35cm"
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 outline-none focus:border-indigo-400 focus:bg-white transition"
            />
          </div>

          {/* Satuan Unit & Lokasi Rak (Brand dropdown removed per request) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-600 mb-1">Satuan Penghitungan:</label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value as AccessoryUnit)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 outline-none focus:border-indigo-400 focus:bg-white transition"
              >
                {UNIT_OPTIONS.map((u) => (
                  <option key={u.value} value={u.value}>
                    {u.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-600 mb-1">Lokasi Rak / Box Penyimpanan:</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Contoh: Rak A-02, Box Label 1, Laci Benang"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 outline-none focus:border-indigo-400 focus:bg-white transition"
              />
            </div>
          </div>

          {/* 3 Kolom Sejajar: Stok Awal, Batas Minimum (Safety Stock), Harga Beli (Semua netral tanpa warna) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-bold text-slate-600 mb-1">
                {accessoryToEdit ? 'Stok Terkini:' : 'Stok Awal Masuk:'}
              </label>
              <input
                type="number"
                min="0"
                step="any"
                value={stock}
                onChange={(e) => setStock(parseFloat(e.target.value) || 0)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 outline-none focus:border-indigo-400 focus:bg-white transition"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-600 mb-1">
                Batas Minimum:
              </label>
              <input
                type="number"
                min="0"
                step="any"
                value={safetyStock}
                onChange={(e) => setSafetyStock(parseFloat(e.target.value) || 0)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 outline-none focus:border-indigo-400 focus:bg-white transition"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-600 mb-1">Harga Beli / Satuan (Rp):</label>
              <input
                type="number"
                min="0"
                value={costPerUnit}
                onChange={(e) => setCostPerUnit(parseInt(e.target.value, 10) || 0)}
                placeholder="0"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 outline-none focus:border-indigo-400 focus:bg-white transition"
              />
            </div>
          </div>

          {/* Catatan Tambahan */}
          <div>
            <label className="block font-bold text-slate-600 mb-1">Catatan Tambahan:</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Catatan spesifikasi warna, supplier langganan, batch kedatangan, dll."
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 outline-none focus:border-indigo-400 focus:bg-white transition"
            />
          </div>

          {/* Footer Actions (Matching SPK Modal buttons) */}
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
              {accessoryToEdit ? 'Simpan Perubahan' : 'Simpan Aksesoris'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};

