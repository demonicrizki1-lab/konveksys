import React, { useState, useEffect } from 'react';
import {
  Package,
  Layers,
  Plus,
  Trash2,
  Save,
  CheckCircle2,
  AlertCircle,
  Tag,
  Building2,
  ArrowRightLeft,
} from 'lucide-react';
import {
  FOBMaterialMaster,
  FOBProductMaster,
  HPPComponentType,
} from '../../types';
import { formatRp, formatRupiahInput, parseRupiahInput } from '../../utils/formatters';
import { SATUAN_OPTIONS, SatuanDropdown } from './FobCalculatorTab';

// 1 Yard = 91.44 cm = 0.9144 Meter (1 Meter = 1.09361 Yard)
export const YARD_TO_METER_FACTOR = 0.9144;
export const convertYardToMeterPrice = (hargaYard: number): number =>
  Math.round((hargaYard || 0) / YARD_TO_METER_FACTOR);

// Generator Kode Material Otomatis berurutan (misal: K01 -> K02 atau MAT-001 -> MAT-002)
export const generateNextMaterialCode = (materials?: FOBMaterialMaster[]): string => {
  if (!materials || materials.length === 0) {
    return 'MAT-001';
  }

  let maxK = 0;
  let maxMat = 0;
  let maxNum = 0;

  materials.forEach(m => {
    if (!m.kodeMaterial) return;
    const code = m.kodeMaterial.trim().toUpperCase();

    // Check pattern K01, K02...
    const kMatch = code.match(/^K(\d+)$/i);
    if (kMatch) {
      const n = parseInt(kMatch[1], 10);
      if (!isNaN(n) && n > maxK) maxK = n;
    }

    // Check pattern MAT-001, MAT001...
    const matMatch = code.match(/^MAT-?(\d+)$/i);
    if (matMatch) {
      const n = parseInt(matMatch[1], 10);
      if (!isNaN(n) && n > maxMat) maxMat = n;
    }

    const anyMatch = code.match(/(\d+)$/);
    if (anyMatch) {
      const n = parseInt(anyMatch[1], 10);
      if (!isNaN(n) && n > maxNum) maxNum = n;
    }
  });

  if (maxK > 0 && maxK >= maxMat) {
    return `K${String(maxK + 1).padStart(2, '0')}`;
  }
  if (maxMat > 0) {
    return `MAT-${String(maxMat + 1).padStart(3, '0')}`;
  }

  const next = (maxNum > 0 ? maxNum : materials.length) + 1;
  return `MAT-${String(next).padStart(3, '0')}`;
};

interface FobMasterDataTabProps {
  materials: FOBMaterialMaster[];
  products: FOBProductMaster[];
  onSaveMaterial: (mat: Partial<FOBMaterialMaster>) => Promise<{ success: boolean; error?: string }>;
  onDeleteMaterial: (id: string) => Promise<{ success: boolean; error?: string }>;
  onSaveProduct: (prod: Partial<FOBProductMaster>) => Promise<{ success: boolean; error?: string }>;
  onDeleteProduct: (id: string) => Promise<{ success: boolean; error?: string }>;
}

const MATERIAL_CATEGORIES: { key: HPPComponentType; label: string }[] = [
  { key: 'BAHAN_BAKU', label: 'Bahan Baku Utama' },
  { key: 'BAHAN_PENDUKUNG', label: 'Bahan Pendukung / Furing' },
  { key: 'AKSESORIS', label: 'Aksesoris & Trims' },
  { key: 'JASA_CMT', label: 'Jasa CMT Jahit' },
  { key: 'SABLON_BORDIR', label: 'Sablon & Bordir' },
  { key: 'PACKAGING', label: 'Finishing & Packaging' },
  { key: 'OPERASIONAL', label: 'Biaya Operasional' },
];

export const FobMasterDataTab: React.FC<FobMasterDataTabProps> = ({
  materials,
  products,
  onSaveMaterial,
  onDeleteMaterial,
  onSaveProduct,
  onDeleteProduct,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'materials' | 'products'>('materials');

  // Form Material State (Kode Material Otomatis)
  const [matKode, setMatKode] = useState<string>(() => generateNextMaterialCode(materials));
  const [matNama, setMatNama] = useState<string>('');
  const [matKategori, setMatKategori] = useState<HPPComponentType>('BAHAN_BAKU');
  const [matSatuan, setMatSatuan] = useState<string>('Yard');
  const [matQty, setMatQty] = useState<number>(1);
  const [matHarga, setMatHarga] = useState<number>(0);
  const [matSupplier, setMatSupplier] = useState<string>('');
  const [matCatatan, setMatCatatan] = useState<string>('');

  // Sinkronkan kode material otomatis jika daftar materials diperbarui
  useEffect(() => {
    if (!matKode || materials.some(m => m.kodeMaterial === matKode)) {
      setMatKode(generateNextMaterialCode(materials));
    }
  }, [materials]);

  // Form Product State
  const [prodKode, setProdKode] = useState<string>('');
  const [prodNama, setProdNama] = useState<string>('');
  const [prodSize, setProdSize] = useState<string>('M');
  const [prodKategori, setProdKategori] = useState<string>('Jaket');
  const [prodBrand, setProdBrand] = useState<string>('');
  const [prodVendorCmt, setProdVendorCmt] = useState<string>('');
  const [prodDeskripsi, setProdDeskripsi] = useState<string>('');

  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Submit Material
  const handleSubmitMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalKode = matKode.trim() ? matKode.trim().toUpperCase() : generateNextMaterialCode(materials);
    if (!matNama.trim()) {
      setStatusMsg({ type: 'error', text: 'Nama Bahan wajib diisi.' });
      return;
    }

    const res = await onSaveMaterial({
      kodeMaterial: finalKode,
      namaBahan: matNama.trim(),
      kategori: matKategori,
      satuan: matSatuan.trim() || 'Pcs',
      qty: Number(matQty) || 1,
      hargaStandar: Number(matHarga) || 0,
      supplier: matSupplier.trim() || null,
      catatan: matCatatan.trim() || null,
    });

    if (res.success) {
      setStatusMsg({ type: 'success', text: `Master Material ${matNama} (${finalKode}) berhasil disimpan!` });
      const nextList = [...materials, { kodeMaterial: finalKode } as any];
      setMatKode(generateNextMaterialCode(nextList));
      setMatNama('');
      setMatQty(1);
      setMatHarga(0);
      setMatSupplier('');
      setMatCatatan('');
    } else {
      setStatusMsg({ type: 'error', text: res.error || 'Gagal menyimpan material.' });
    }
  };

  // Submit Product
  const handleSubmitProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodKode.trim() || !prodNama.trim()) {
      setStatusMsg({ type: 'error', text: 'Kode dan Nama Produk wajib diisi.' });
      return;
    }

    const res = await onSaveProduct({
      kodeProduk: prodKode.trim().toUpperCase(),
      namaProduk: prodNama.trim(),
      size: prodSize,
      kategori: prodKategori,
      brand: prodBrand.trim() || null,
      vendorCmt: prodVendorCmt.trim() || null,
      deskripsi: prodDeskripsi.trim() || null,
    });

    if (res.success) {
      setStatusMsg({ type: 'success', text: `Master Produk ${prodNama} (${prodSize}) berhasil disimpan!` });
      setProdKode('');
      setProdNama('');
      setProdBrand('');
      setProdVendorCmt('');
      setProdDeskripsi('');
    } else {
      setStatusMsg({ type: 'error', text: res.error || 'Gagal menyimpan produk.' });
    }
  };

  return (
    <div className="space-y-5">
      
      {/* HEADER & SUB-TABS */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-600" />
            <span>Katalog Master Data Acuan Garment FOB</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Database acuan harga standar material bahan baku, ongkos CMT, serta daftar model produk
          </p>
        </div>

        {/* SUBTAB TOGGLE */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200 self-start sm:self-auto">
          <button
            onClick={() => { setActiveSubTab('materials'); setStatusMsg(null); }}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              activeSubTab === 'materials'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Master Bahan & Vendor ({materials.length})
          </button>
          <button
            onClick={() => { setActiveSubTab('products'); setStatusMsg(null); }}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              activeSubTab === 'products'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Master Produk Acuan ({products.length})
          </button>
        </div>
      </div>

      {/* STATUS BANNER */}
      {statusMsg && (
        <div
          className={`p-3 rounded-xl border flex items-center justify-between gap-2 text-xs font-medium animate-fadeIn ${
            statusMsg.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {statusMsg.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{statusMsg.text}</span>
          </div>
          <button onClick={() => setStatusMsg(null)} className="text-slate-400 hover:text-slate-600">✕</button>
        </div>
      )}

      {/* SUBTAB 1: MASTER MATERIAL & SUPPLIER */}
      {activeSubTab === 'materials' && (
        <div className="space-y-4">
          {/* FORM TAMBAH/EDIT MATERIAL */}
          <form onSubmit={handleSubmitMaterial} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <Plus className="w-4 h-4 text-indigo-600" />
              Tambah / Update Bahan Baku & Tarif CMT
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-slate-500 font-semibold">Kode Material</label>
                  <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded">
                    Otomatis
                  </span>
                </div>
                <input
                  type="text"
                  value={matKode}
                  onChange={e => setMatKode(e.target.value)}
                  placeholder="K02"
                  className="w-full py-1.5 px-2.5 rounded-lg border border-slate-200 bg-slate-50 font-bold text-slate-900 focus:bg-white focus:ring-1 focus:ring-indigo-500 uppercase"
                  title="Kode material diterbitkan berurutan otomatis oleh sistem (bisa diubah jika perlu)"
                />
              </div>

              <div className="lg:col-span-2">
                <label className="block text-slate-500 font-semibold mb-1">Nama Komponen Bahan *</label>
                <input
                  type="text"
                  value={matNama}
                  onChange={e => setMatNama(e.target.value)}
                  placeholder="Contoh: Cotton Combed 30s Reaktif"
                  className="w-full py-1.5 px-2.5 rounded-lg border border-slate-200 font-medium text-slate-900 focus:ring-1 focus:ring-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-500 font-semibold mb-1">Kategori Biaya</label>
                <select
                  value={matKategori}
                  onChange={e => setMatKategori(e.target.value as HPPComponentType)}
                  className="w-full py-1.5 px-2.5 rounded-lg border border-slate-200 font-medium text-slate-800"
                >
                  {MATERIAL_CATEGORIES.map(c => (
                    <option key={c.key} value={c.key}>{c.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-500 font-semibold mb-1">Satuan</label>
                <SatuanDropdown
                  value={matSatuan}
                  onChange={setMatSatuan}
                  size="md"
                />
              </div>

              <div>
                <label className="block text-slate-500 font-semibold mb-1">Qty (Kuantitas)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={matQty}
                  onChange={e => setMatQty(Number(e.target.value) || 0)}
                  placeholder="1"
                  className="w-full py-1.5 px-2.5 rounded-lg border border-slate-200 font-semibold text-slate-900 tabular-nums focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-500 font-semibold mb-1">Harga Standar (Rp)</label>
                <input
                  type="text"
                  value={formatRupiahInput(matHarga)}
                  onChange={e => setMatHarga(parseRupiahInput(e.target.value))}
                  placeholder="0"
                  className="w-full py-1.5 px-2.5 rounded-lg border border-slate-200 font-semibold text-slate-900 tabular-nums"
                />
              </div>

              <div>
                <label className="block text-slate-500 font-semibold mb-1">Total Estimasi (Rp)</label>
                <div className="w-full py-1.5 px-2.5 rounded-lg border border-slate-200 bg-slate-50 font-bold text-slate-900 tabular-nums text-right flex items-center justify-end h-[35px]">
                  {formatRp((matQty || 0) * (matHarga || 0))}
                </div>
              </div>

              <div className="lg:col-span-2">
                <label className="block text-slate-500 font-semibold mb-1">Supplier / Vendor Rekanan</label>
                <input
                  type="text"
                  value={matSupplier}
                  onChange={e => setMatSupplier(e.target.value)}
                  placeholder="Nama Pabrik / Toko Kain..."
                  className="w-full py-1.5 px-2.5 rounded-lg border border-slate-200 text-slate-800"
                />
              </div>

              <div className="lg:col-span-3">
                <label className="block text-slate-500 font-semibold mb-1">Catatan</label>
                <input
                  type="text"
                  value={matCatatan}
                  onChange={e => setMatCatatan(e.target.value)}
                  placeholder="Gramasi, lebar kain, toleransi susut..."
                  className="w-full py-1.5 px-2.5 rounded-lg border border-slate-200 text-slate-800"
                />
              </div>

              {/* Live Preview Konversi Yard ke Meter */}
              {matSatuan.trim().toLowerCase() === 'yard' && (
                <div className="lg:col-span-6 p-3.5 bg-indigo-50/90 border border-indigo-200/90 rounded-xl text-xs text-indigo-900 flex items-start gap-2.5 shadow-2xs">
                  <ArrowRightLeft className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <div className="font-bold flex items-center justify-between text-indigo-950">
                      <span>Konversi Otomatis ke Meter (1 Yard = 91,44 cm / 0,9144 Meter)</span>
                      <span className="text-[10px] text-indigo-600 font-semibold">Standar Tekstil Garment</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-2 pt-2 border-t border-indigo-200/60 text-[11px]">
                      <div className="bg-white/80 p-2 rounded-lg border border-indigo-100">
                        <span className="text-slate-500 block text-[10px] uppercase font-semibold">Kuantitas (Qty):</span>
                        <span className="font-bold text-slate-900 text-xs">{matQty || 0} Yard</span>
                        <span className="text-indigo-600 font-bold block text-[11px] mt-0.5">
                          ➔ {((matQty || 0) * 0.9144).toLocaleString('id-ID', { maximumFractionDigits: 2 })} Meter
                        </span>
                      </div>
                      <div className="bg-white/80 p-2 rounded-lg border border-indigo-100">
                        <span className="text-slate-500 block text-[10px] uppercase font-semibold">Harga Satuan:</span>
                        <span className="font-bold text-slate-900 text-xs">{formatRp(matHarga)} / Yard</span>
                        <span className="text-indigo-600 font-bold block text-[11px] mt-0.5">
                          ➔ {formatRp(convertYardToMeterPrice(matHarga))} / Meter
                        </span>
                      </div>
                      <div className="bg-white/80 p-2 rounded-lg border border-indigo-100">
                        <span className="text-slate-500 block text-[10px] uppercase font-semibold">Total Nilai Bahan:</span>
                        <span className="font-bold text-slate-900 text-xs">{formatRp((matQty || 0) * (matHarga || 0))}</span>
                        <span className="text-slate-500 block text-[10px] mt-0.5">
                          (Nilai total tetap seimbang)
                        </span>
                      </div>
                    </div>

                    <p className="text-[10.5px] text-indigo-700 mt-2 font-medium">
                      ✓ Saat bahan ini ditarik ke <strong>Kalkulator HPP</strong>, satuannya otomatis menjadi <strong>Meter</strong> dengan kuantitas dan harga per meter di atas.
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm flex items-center gap-1.5 transition cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Simpan Master Material</span>
              </button>
            </div>
          </form>

          {/* TABEL MATERIAL */}
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Daftar Katalog Material Tersimpan
              </span>
              <span className="text-xs text-slate-500">{materials.length} item</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-slate-50 text-slate-700 text-[11px] uppercase font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3 text-left">Kode</th>
                    <th className="py-2.5 px-3 text-left">Nama Bahan</th>
                    <th className="py-2.5 px-3 text-left">Kategori</th>
                    <th className="py-2.5 px-3 text-center">Satuan</th>
                    <th className="py-2.5 px-3 text-center">Qty</th>
                    <th className="py-2.5 px-3 text-right">Harga Standar</th>
                    <th className="py-2.5 px-3 text-right">Total Nilai</th>
                    <th className="py-2.5 px-3 text-left">Supplier</th>
                    <th className="py-2.5 px-3 text-center w-12">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {materials.map(m => {
                    const isYard = (m.satuan || '').trim().toLowerCase() === 'yard';
                    const qty = Number(m.qty) || 1;
                    const harga = Number(m.hargaStandar) || 0;
                    const totalNilai = qty * harga;

                    return (
                      <tr key={m.id || m.kodeMaterial} className="hover:bg-slate-50/50">
                        <td className="py-2.5 px-3 font-semibold text-indigo-700">{m.kodeMaterial}</td>
                        <td className="py-2.5 px-3 font-semibold text-slate-900">{m.namaBahan}</td>
                        <td className="py-2.5 px-3">
                          <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-semibold">
                            {m.kategori}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center font-medium text-slate-600">
                          <span className="font-semibold text-slate-800">{m.satuan}</span>
                        </td>
                        <td className="py-2.5 px-3 text-center font-semibold text-slate-900 tabular-nums">
                          <span>{qty.toLocaleString('id-ID')}</span>
                          {isYard && (
                            <span className="block text-[9.5px] text-indigo-600 font-bold mt-0.5 whitespace-nowrap bg-indigo-50 px-1 py-0.5 rounded border border-indigo-100">
                              ≈ {(qty * 0.9144).toLocaleString('id-ID', { maximumFractionDigits: 2 })} m
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-right font-semibold text-slate-900 tabular-nums">
                          {formatRp(harga)}
                          {isYard && (
                            <span className="block text-[9px] text-indigo-600 font-semibold mt-0.5">
                              ≈ {formatRp(convertYardToMeterPrice(harga))}/m
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold text-slate-900 tabular-nums">
                          {formatRp(totalNilai)}
                        </td>
                        <td className="py-2.5 px-3 text-slate-600">{m.supplier || '-'}</td>
                        <td className="py-2.5 px-3 text-center">
                          <button
                            onClick={() => onDeleteMaterial(m.id || m.kodeMaterial)}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded transition cursor-pointer"
                            title="Hapus Material"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 2: MASTER PRODUK ACUAN */}
      {activeSubTab === 'products' && (
        <div className="space-y-4">
          {/* FORM TAMBAH/EDIT PRODUK */}
          <form onSubmit={handleSubmitProduct} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <Plus className="w-4 h-4 text-indigo-600" />
              Tambah / Update Model Produk Acuan
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
              <div>
                <label className="block text-slate-500 font-semibold mb-1">Kode Model *</label>
                <input
                  type="text"
                  value={prodKode}
                  onChange={e => setProdKode(e.target.value)}
                  placeholder="JKT-MICRON"
                  className="w-full py-1.5 px-2.5 rounded-lg border border-slate-200 font-semibold text-slate-900 focus:ring-1 focus:ring-indigo-500"
                  required
                />
              </div>

              <div className="lg:col-span-2">
                <label className="block text-slate-500 font-semibold mb-1">Nama Model Pakaian *</label>
                <input
                  type="text"
                  value={prodNama}
                  onChange={e => setProdNama(e.target.value)}
                  placeholder="Jaket Puffer Micron Water Resistant"
                  className="w-full py-1.5 px-2.5 rounded-lg border border-slate-200 font-medium text-slate-900 focus:ring-1 focus:ring-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-500 font-semibold mb-1">Ukuran (Size)</label>
                <select
                  value={prodSize}
                  onChange={e => setProdSize(e.target.value)}
                  className="w-full py-1.5 px-2.5 rounded-lg border border-slate-200 font-bold text-slate-900"
                >
                  <optgroup label="Seri Huruf (Dewasa & Big Size)">
                    {['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL', '5XL', '6XL', '7XL', '8XL', 'ALL SIZE'].map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </optgroup>
                  <optgroup label="Seri Angka (Ukuran 1 - 16)">
                    {['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15', '16'].map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </optgroup>
                </select>
              </div>

              <div>
                <label className="block text-slate-500 font-semibold mb-1">Kategori Pakaian</label>
                <select
                  value={prodKategori}
                  onChange={e => setProdKategori(e.target.value)}
                  className="w-full py-1.5 px-2.5 rounded-lg border border-slate-200 font-medium text-slate-800"
                >
                  <option value="Jaket">Jaket</option>
                  <option value="Rompi">Rompi</option>
                  <option value="Kemeja">Kemeja</option>
                  <option value="Kaos">Kaos</option>
                  <option value="Celana">Celana</option>
                  <option value="Hoodie">Hoodie</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-500 font-semibold mb-1">Brand / Buyer</label>
                <input
                  type="text"
                  value={prodBrand}
                  onChange={e => setProdBrand(e.target.value)}
                  placeholder="Maison Supply"
                  className="w-full py-1.5 px-2.5 rounded-lg border border-slate-200 text-slate-800"
                />
              </div>

              <div className="lg:col-span-3">
                <label className="block text-slate-500 font-semibold mb-1">Vendor CMT Acuan</label>
                <input
                  type="text"
                  value={prodVendorCmt}
                  onChange={e => setProdVendorCmt(e.target.value)}
                  placeholder="Nama Konveksi..."
                  className="w-full py-1.5 px-2.5 rounded-lg border border-slate-200 text-slate-800"
                />
              </div>

              <div className="lg:col-span-3">
                <label className="block text-slate-500 font-semibold mb-1">Deskripsi Produk</label>
                <input
                  type="text"
                  value={prodDeskripsi}
                  onChange={e => setProdDeskripsi(e.target.value)}
                  placeholder="Bahan utama, potongan pola, fitur..."
                  className="w-full py-1.5 px-2.5 rounded-lg border border-slate-200 text-slate-800"
                />
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm flex items-center gap-1.5 transition cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Simpan Model Produk</span>
              </button>
            </div>
          </form>

          {/* TABEL PRODUK */}
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Daftar Model Produk Acuan Tersimpan
              </span>
              <span className="text-xs text-slate-500">{products.length} model/size</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-slate-50 text-slate-700 text-[11px] uppercase font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3 text-left">Kode Model</th>
                    <th className="py-2.5 px-3 text-left">Nama Produk</th>
                    <th className="py-2.5 px-3 text-center w-20">Size</th>
                    <th className="py-2.5 px-3 text-left">Kategori</th>
                    <th className="py-2.5 px-3 text-left">Brand</th>
                    <th className="py-2.5 px-3 text-left">Vendor CMT</th>
                    <th className="py-2.5 px-3 text-center w-12">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {products.map(p => (
                    <tr key={p.id || `${p.kodeProduk}-${p.size}`} className="hover:bg-slate-50/50">
                      <td className="py-2.5 px-3 font-semibold text-indigo-700">{p.kodeProduk}</td>
                      <td className="py-2.5 px-3 font-semibold text-slate-900">{p.namaProduk}</td>
                      <td className="py-2.5 px-3 text-center">
                        <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-bold text-xs">
                          {p.size}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-600">{p.kategori}</td>
                      <td className="py-2.5 px-3 text-slate-700">{p.brand || '-'}</td>
                      <td className="py-2.5 px-3 text-slate-600">{p.vendorCmt || '-'}</td>
                      <td className="py-2.5 px-3 text-center">
                        <button
                          onClick={() => onDeleteProduct(p.id || p.kodeProduk)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded transition cursor-pointer"
                          title="Hapus Model"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
