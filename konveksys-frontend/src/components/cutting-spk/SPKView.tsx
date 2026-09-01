import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { SPKCutting, SizeBreakdown } from '../../types';
import { formatDateIndo } from '../../utils/formatters';
import {
  Scissors,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  Layers,
  X,
  Eye,
  AlertCircle,
  ShieldAlert,
} from 'lucide-react';

export const SPKView: React.FC = () => {
  const { spkList, createSPK, inboundRolls, brands, vendors, getSPKRemainingQty, userRole } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [brandFilter, setBrandFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modal State for New SPK
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedBrand, setSelectedBrand] = useState(brands[0]?.name || 'GREYWOLF');
  const [selectedVendor, setSelectedVendor] = useState(vendors[0]?.name || 'SAHIRA');
  const [produkName, setProdukName] = useState('BEDAH PANJANG');
  const [selectedRollIds, setSelectedRollIds] = useState<string[]>([]);
  const [targetCut, setTargetCut] = useState<SizeBreakdown>({
    s: 100,
    m: 150,
    l: 150,
    xl: 50,
    xxl: 50,
    anak4_10: 0,
    anak12_16: 0,
  });
  const [targetSelesai, setTargetSelesai] = useState(
    new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [catatan, setCatatan] = useState('');

  // Detail Modal State
  const [selectedSPKDetail, setSelectedSPKDetail] = useState<SPKCutting | null>(null);

  // Available rolls in warehouse for selected Brand
  const availableRolls = inboundRolls.filter(
    (r) => r.brand === selectedBrand && r.status === 'DI_GUDANG'
  );

  const totalPooledMeters = inboundRolls
    .filter((r) => selectedRollIds.includes(r.id))
    .reduce((a, b) => a + (b.meterLength - b.meterUsed), 0);

  const totalTargetPcs =
    targetCut.s +
    targetCut.m +
    targetCut.l +
    targetCut.xl +
    targetCut.xxl +
    targetCut.anak4_10 +
    targetCut.anak12_16;

  const filteredSPK = spkList.filter((spk) => {
    const matchBrand = brandFilter === 'ALL' || spk.brand === brandFilter;
    const matchStatus = statusFilter === 'ALL' || spk.status === statusFilter;
    const matchSearch =
      spk.spkNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      spk.produk.toLowerCase().includes(searchTerm.toLowerCase()) ||
      spk.vendor.toLowerCase().includes(searchTerm.toLowerCase());
    return matchBrand && matchStatus && matchSearch;
  });

  const handleOpenCreate = () => {
    const initBrand = brands[0]?.name || 'GREYWOLF';
    setSelectedBrand(initBrand);
    setSelectedVendor(vendors[0]?.name || 'SAHIRA');
    setProdukName('BEDAH PANJANG');
    setSelectedRollIds([]);
    setTargetCut({ s: 100, m: 150, l: 150, xl: 50, xxl: 50, anak4_10: 0, anak12_16: 0 });
    setCatatan('');
    setIsCreateModalOpen(true);
  };

  const toggleRollSelection = (rollId: string) => {
    setSelectedRollIds((prev) =>
      prev.includes(rollId) ? prev.filter((id) => id !== rollId) : [...prev, rollId]
    );
  };

  const handleSaveSPK = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!produkName.trim()) {
      alert('Nama produk artikel wajib diisi!');
      return;
    }
    if (selectedRollIds.length === 0) {
      alert('Pilih minimal 1 rol kain untuk di-pool ke dalam SPK ini!');
      return;
    }
    if (totalTargetPcs <= 0) {
      alert('Total kuantiti potong harus lebih dari 0!');
      return;
    }

    await createSPK({
      brand: selectedBrand,
      produk: produkName.toUpperCase(),
      vendor: selectedVendor,
      rollIds: selectedRollIds,
      targetCutQty: targetCut,
      tanggalSPK: new Date().toISOString().split('T')[0],
      targetSelesai,
      catatan,
    });

    setIsCreateModalOpen(false);
  };

  if (userRole === 'BRAND') {
    return (
      <div className="bg-white rounded-xl p-12 text-center border border-slate-200 shadow-sm space-y-4">
        <ShieldAlert className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-xl font-bold text-slate-900">Akses Dibatasi (Admin Only)</h2>
        <p className="text-slate-500 text-xs max-w-md mx-auto">
          Alokasi SPK Potong & Manajemen Vendor hanya dapat dikelola oleh tim Admin / Konveksi.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="bg-white rounded-xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-lg mb-2 border border-indigo-100">
              <Scissors className="w-3.5 h-3.5" />
              SPK & Smart Cutting
            </div>
            <h1 className="text-2xl font-bold text-slate-900">Surat Perintah Kerja (SPK) Potong</h1>
            <p className="text-slate-500 text-xs mt-1">
              Penggabungan beberapa rol kain (*Smart Pooling*) milik Brand yang sama menjadi satu batch SPK produksi per size.
            </p>
          </div>

          <button
            onClick={handleOpenCreate}
            className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-4 py-2.5 rounded-lg flex items-center gap-1.5 shadow-sm transition-base btn-press shrink-0"
          >
            <Plus className="w-4 h-4" />
            Terbitkan SPK Baru
          </button>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Cari nomor SPK, produk, atau vendor penjahit..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 transition-base outline-none"
            />
          </div>

          <div className="w-full sm:w-48">
            <select
              value={brandFilter}
              onChange={(e) => setBrandFilter(e.target.value)}
              className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 transition-base outline-none"
            >
              <option value="ALL">Semua Brand</option>
              {brands.map((b) => (
                <option key={b.id} value={b.name}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          <div className="w-full sm:w-48">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 transition-base outline-none"
            >
              <option value="ALL">Semua Status</option>
              <option value="IN_PRODUCTION">In Production</option>
              <option value="PARTIAL_DELIVERED">Partial Delivered</option>
              <option value="COMPLETED">Completed</option>
            </select>
          </div>
        </div>
      </div>

      {/* SPK List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filteredSPK.length === 0 ? (
          <div className="col-span-2 bg-white rounded-xl p-12 text-center border border-slate-200 text-slate-400 text-xs">
            Tidak ada SPK yang sesuai dengan filter pencarian.
          </div>
        ) : (
          filteredSPK.map((spk) => {
            const targetTotal = Object.values(spk.targetCutQty).reduce((a, b) => a + b, 0);
            const delivTotal = Object.values(spk.deliveredQty).reduce((a, b) => a + b, 0);
            const percent = targetTotal > 0 ? Math.round((delivTotal / targetTotal) * 100) : 0;
            const remaining = getSPKRemainingQty(spk);
            const isCompleted = spk.status === 'COMPLETED' || (targetTotal > 0 && delivTotal >= targetTotal);
            const displayStatus = isCompleted ? 'COMPLETED' : (delivTotal > 0 ? 'PARTIAL_DELIVERED' : spk.status);

            return (
              <div
                key={spk.id}
                className="bg-white rounded-xl p-5 sm:p-6 border border-slate-200 shadow-sm hover:shadow-md transition space-y-4"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-900 text-base">{spk.spkNumber}</span>
                      <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-700 font-bold rounded-md text-[10px]">
                        {spk.brand}
                      </span>
                    </div>
                    <h3 className="font-semibold text-slate-800 text-sm mt-1">{spk.produk}</h3>
                  </div>

                  <span
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${
                      isCompleted
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        : delivTotal > 0
                        ? 'bg-amber-100 text-amber-800 border border-amber-200'
                        : 'bg-blue-100 text-blue-800 border border-blue-200'
                    }`}
                  >
                    {displayStatus}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-semibold">Vendor Penjahit:</span>
                    <strong className="text-slate-800">{spk.vendor}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-semibold">Rol Di-Pool:</span>
                    <strong className="text-slate-800">{spk.rollIds.length} Rol Kain</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-semibold">Tgl SPK:</span>
                    <span className="font-medium text-slate-700">{formatDateIndo(spk.tanggalSPK)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-semibold">Target Selesai:</span>
                    <span className="font-medium text-slate-700">{formatDateIndo(spk.targetSelesai)}</span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-slate-600">Progress Pengiriman (Surat Jalan):</span>
                    <span className="text-indigo-600">
                      {delivTotal} / {targetTotal} Pcs ({percent}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 ${
                        percent >= 100 ? 'bg-emerald-500' : 'bg-indigo-600'
                      }`}
                      style={{ width: `${Math.min(100, percent)}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>Sisa di Konveksi: <strong>{remaining.totalRemaining} Pcs</strong></span>
                    {spk.catatan && <span className="truncate max-w-[200px]">Note: {spk.catatan}</span>}
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    onClick={() => setSelectedSPKDetail(spk)}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs flex items-center gap-1.5 transition"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    Rincian Size Potong & Rol
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* MODAL: Tambah SPK Baru (Smart Pooling) */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto shadow-lg border border-slate-100 space-y-5 animate-slideUp">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Terbitkan SPK Cutting Baru</h3>
                <p className="text-[11px] text-slate-400">Smart Pooling Rol Kain & Alokasi Potong per Size</p>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSPK} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Pilih Brand:</label>
                  <select
                    value={selectedBrand}
                    onChange={(e) => {
                      setSelectedBrand(e.target.value);
                      setSelectedRollIds([]); // Reset selection when brand changes
                    }}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold outline-none"
                  >
                    {brands.map((b) => (
                      <option key={b.id} value={b.name}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-600 mb-1">Mitra Konveksi (Vendor):</label>
                  <select
                    value={selectedVendor}
                    onChange={(e) => setSelectedVendor(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold outline-none"
                  >
                    {vendors.map((v) => (
                      <option key={v.id} value={v.name}>
                        {v.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-600 mb-1">Nama Produk / Artikel:</label>
                  <input
                    type="text"
                    value={produkName}
                    onChange={(e) => setProdukName(e.target.value.toUpperCase())}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold outline-none uppercase"
                    placeholder="BEDAH PANJANG..."
                    required
                  />
                </div>
              </div>

              {/* Smart Pooling Box: Select Rolls */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-indigo-600" />
                    Smart Pooling: Pilih Rol Kain Milik {selectedBrand}
                  </span>
                  <span className="text-[11px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                    Total Pool: {totalPooledMeters} Meter ({selectedRollIds.length} Rol)
                  </span>
                </div>

                {availableRolls.length === 0 ? (
                  <p className="text-slate-400 italic py-2">
                    Tidak ada stok rol kain yang berstatus &quot;Di Gudang&quot; untuk brand {selectedBrand}. Harap tambahkan rol di Modul Inbound terlebih dahulu.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-36 overflow-y-auto pr-1">
                    {availableRolls.map((roll) => {
                      const isSelected = selectedRollIds.includes(roll.id);
                      return (
                        <div
                          key={roll.id}
                          onClick={() => toggleRollSelection(roll.id)}
                          className={`p-2.5 rounded-xl border cursor-pointer transition flex items-center justify-between ${
                            isSelected
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                              : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <div>
                            <div className="font-mono font-bold text-xs">{roll.rollCode}</div>
                            <div className={`text-[10px] ${isSelected ? 'text-indigo-100' : 'text-slate-500'}`}>
                              {roll.jenisKain}
                            </div>
                          </div>
                          <span className="font-bold text-xs">{roll.meterLength} m</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Rincian Target Potong per Size */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <span className="font-semibold text-slate-800">Rincian Hasil Potong Kotor per Size (Pcs)</span>
                  <span className="font-bold text-slate-900 text-sm">Total: {totalTargetPcs} Pcs</span>
                </div>

                {/* Dewasa Sizes */}
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                    Kategori Dewasa (S - 2XL):
                  </span>
                  <div className="grid grid-cols-5 gap-2">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block">Size S:</label>
                      <input
                        type="number"
                        value={targetCut.s}
                        onChange={(e) => setTargetCut({ ...targetCut, s: Number(e.target.value) })}
                        className="w-full p-2 bg-white border border-slate-200 rounded-xl font-bold text-center"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block">Size M:</label>
                      <input
                        type="number"
                        value={targetCut.m}
                        onChange={(e) => setTargetCut({ ...targetCut, m: Number(e.target.value) })}
                        className="w-full p-2 bg-white border border-slate-200 rounded-xl font-bold text-center"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block">Size L:</label>
                      <input
                        type="number"
                        value={targetCut.l}
                        onChange={(e) => setTargetCut({ ...targetCut, l: Number(e.target.value) })}
                        className="w-full p-2 bg-white border border-slate-200 rounded-xl font-bold text-center"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block">Size XL:</label>
                      <input
                        type="number"
                        value={targetCut.xl}
                        onChange={(e) => setTargetCut({ ...targetCut, xl: Number(e.target.value) })}
                        className="w-full p-2 bg-white border border-slate-200 rounded-xl font-bold text-center"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block">Size 2XL:</label>
                      <input
                        type="number"
                        value={targetCut.xxl}
                        onChange={(e) => setTargetCut({ ...targetCut, xxl: Number(e.target.value) })}
                        className="w-full p-2 bg-white border border-slate-200 rounded-xl font-bold text-center"
                      />
                    </div>
                  </div>
                </div>

                {/* Anak Sizes */}
                <div className="pt-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                    Kategori Anak-Anak (Optional):
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block">Anak Size (4-10):</label>
                      <input
                        type="number"
                        value={targetCut.anak4_10}
                        onChange={(e) => setTargetCut({ ...targetCut, anak4_10: Number(e.target.value) })}
                        className="w-full p-2 bg-white border border-slate-200 rounded-xl font-bold text-center"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block">Anak Size (12-16):</label>
                      <input
                        type="number"
                        value={targetCut.anak12_16}
                        onChange={(e) => setTargetCut({ ...targetCut, anak12_16: Number(e.target.value) })}
                        className="w-full p-2 bg-white border border-slate-200 rounded-xl font-bold text-center"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Target Selesai:</label>
                  <input
                    type="date"
                    value={targetSelesai}
                    onChange={(e) => setTargetSelesai(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Catatan Khusus Penjahit:</label>
                  <input
                    type="text"
                    placeholder="Warna benang, model kancing, label..."
                    value={catatan}
                    onChange={(e) => setCatatan(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium outline-none"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition"
                >
                  Simpan & Terbitkan SPK
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Detail SPK */}
      {selectedSPKDetail && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-lg border border-slate-100 space-y-5 animate-slideUp">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-base">{selectedSPKDetail.spkNumber}</h3>
                <span className="text-xs text-slate-500">{selectedSPKDetail.produk} ({selectedSPKDetail.brand})</span>
              </div>
              <button
                onClick={() => setSelectedSPKDetail(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <span className="font-bold text-slate-700 block mb-2">Rol Kain yang Di-Pool:</span>
                <div className="flex flex-wrap gap-1.5">
                  {selectedSPKDetail.rollIds.map((id) => {
                    const r = inboundRolls.find((item) => item.id === id);
                    return (
                      <span key={id} className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg font-mono font-bold text-indigo-700">
                        {r?.rollCode || id} ({r?.meterLength}m)
                      </span>
                    );
                  })}
                </div>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-center text-xs">
                  <thead className="bg-slate-900 text-white font-bold text-[10px]">
                    <tr>
                      <th className="p-2 text-left pl-3">Size</th>
                      <th className="p-2">Target Potong</th>
                      <th className="p-2">Terkirim (SJ)</th>
                      <th className="p-2 text-indigo-300">Sisa di Vendor</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(['s', 'm', 'l', 'xl', 'xxl', 'anak4_10', 'anak12_16'] as (keyof SizeBreakdown)[]).map((sz) => {
                      const target = selectedSPKDetail.targetCutQty[sz];
                      const deliv = selectedSPKDetail.deliveredQty[sz];
                      const rem = Math.max(0, target - deliv);
                      if (target === 0 && deliv === 0) return null;

                      return (
                        <tr key={sz}>
                          <td className="p-2 text-left pl-3 font-bold uppercase">{sz.replace('anak', 'Anak ')}</td>
                          <td className="p-2 font-semibold text-slate-700">{target} Pcs</td>
                          <td className="p-2 font-bold text-emerald-600">{deliv} Pcs</td>
                          <td className="p-2 font-bold text-indigo-600">{rem} Pcs</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <button
              onClick={() => setSelectedSPKDetail(null)}
              className="w-full py-2.5 bg-slate-900 text-white font-bold rounded-xl text-xs hover:bg-slate-800 transition"
            >
              Tutup
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
