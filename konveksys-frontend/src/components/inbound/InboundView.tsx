import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { InboundRoll, RollStatus } from '../../types';
import { formatRupiahInput, parseRupiahInput, formatDateIndo } from '../../utils/formatters';
import {
  PackageCheck,
  Plus,
  Search,
  CheckCircle,
  Clock,
  Scissors,
  CheckCircle2,
  X,
  Layers,
  Sparkles,
} from 'lucide-react';

export const InboundView: React.FC = () => {
  const { inboundRolls, addInboundRoll, updateInboundRollStatus, brands, userRole, activeBrand } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [brandFilter, setBrandFilter] = useState(userRole === 'BRAND' ? activeBrand : 'ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [form, setForm] = useState({
    rollCode: '',
    brand: userRole === 'BRAND' ? activeBrand : 'GREYWOLF',
    jenisKain: '',
    meterLength: 100,
    hargaModalMeter: 40000,
    keterangan: '',
    status: (userRole === 'BRAND' ? 'MENUNGGU_FISIK' : 'DI_GUDANG') as RollStatus,
  });

  const formatRp = (num: number) => 'Rp ' + num.toLocaleString('id-ID');

  const filteredRolls = inboundRolls.filter((roll) => {
    // If brand user, strictly only see their own rolls
    const effectiveBrand = userRole === 'BRAND' ? activeBrand : brandFilter;
    const matchBrand = effectiveBrand === 'ALL' || roll.brand === effectiveBrand;
    const matchStatus = statusFilter === 'ALL' || roll.status === statusFilter;
    const matchSearch =
      roll.rollCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      roll.jenisKain.toLowerCase().includes(searchTerm.toLowerCase()) ||
      roll.brand.toLowerCase().includes(searchTerm.toLowerCase());

    return matchBrand && matchStatus && matchSearch;
  });

  // Calculation Stats
  const totalMeters = filteredRolls.reduce((a, b) => a + b.meterLength, 0);
  const totalStockMeters = filteredRolls
    .filter((r) => r.status === 'DI_GUDANG')
    .reduce((a, b) => a + (b.meterLength - b.meterUsed), 0);
  const totalAssetValue = filteredRolls.reduce((a, b) => a + b.meterLength * b.hargaModalMeter, 0);

  const handleOpenAdd = () => {
    const selectedBrand = userRole === 'BRAND' ? activeBrand : brands[0]?.name || 'GREYWOLF';
    const randomCode = `ROL-${selectedBrand.substring(0, 3).toUpperCase()}-${String(inboundRolls.length + 1).padStart(3, '0')}`;
    setForm({
      rollCode: randomCode,
      brand: selectedBrand,
      jenisKain: '',
      meterLength: 120,
      hargaModalMeter: 40000,
      keterangan: '',
      status: userRole === 'BRAND' ? 'MENUNGGU_FISIK' : 'DI_GUDANG',
    });
    setIsAddModalOpen(true);
  };

  const handleSaveRoll = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.jenisKain.trim()) {
      alert('Jenis kain wajib diisi!');
      return;
    }

    addInboundRoll({
      rollCode: form.rollCode.toUpperCase(),
      brand: form.brand,
      jenisKain: form.jenisKain,
      meterLength: Number(form.meterLength),
      meterUsed: 0,
      hargaModalMeter: Number(form.hargaModalMeter),
      status: form.status,
      tanggalMasuk: new Date().toISOString().split('T')[0],
      keterangan: form.keterangan,
    });

    setIsAddModalOpen(false);
  };

  const getStatusBadge = (status: RollStatus) => {
    switch (status) {
      case 'MENUNGGU_FISIK':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 text-amber-700 font-bold rounded-lg text-[10px] border border-amber-200">
            <Clock className="w-3 h-3" /> Menunggu Fisik
          </span>
        );
      case 'DI_GUDANG':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 font-bold rounded-lg text-[10px] border border-emerald-200">
            <CheckCircle className="w-3 h-3" /> Di Gudang (Ready)
          </span>
        );
      case 'DIPROSES':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-50 text-indigo-700 font-bold rounded-lg text-[10px] border border-indigo-200">
            <Scissors className="w-3 h-3" /> Diproses SPK
          </span>
        );
      case 'SELESAI':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 text-slate-700 font-bold rounded-lg text-[10px]">
            <CheckCircle2 className="w-3 h-3" /> Selesai
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="bg-white rounded-xl p-6 sm:p-7 border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-medium text-indigo-600 bg-indigo-50 px-3 py-1 rounded-lg mb-2 border border-indigo-100">
              <PackageCheck className="w-3.5 h-3.5" />
              Inbound Stok Kain Rol
            </div>
            <h1 className="text-xl font-bold text-slate-900">Pencatatan Stok Kain Masuk</h1>
            <p className="text-slate-500 text-xs mt-1">
              Pelacakan kain milik Brand per nomor rol. Rol berstatus &quot;Di Gudang&quot; siap di-pooling menjadi SPK Potong.
            </p>
          </div>

          <button
            onClick={handleOpenAdd}
            className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-4 py-2.5 rounded-lg flex items-center gap-1.5 shadow-sm transition-base btn-press shrink-0"
          >
            <Plus className="w-4 h-4" />
            {userRole === 'BRAND' ? '+ Rencana Kirim Kain' : '+ Terima Rol Kain Baru'}
          </button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
            <span className="text-[11px] font-medium text-slate-500">Total Rol Kain</span>
            <div className="text-xl font-bold text-slate-900 mt-0.5">{filteredRolls.length} Rol</div>
            <span className="text-[10px] text-slate-400">Akumulasi: {totalMeters.toLocaleString('id-ID')} m</span>
          </div>

          <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-100">
            <span className="text-[11px] font-medium text-emerald-700">Stok Siap Potong</span>
            <div className="text-xl font-bold text-emerald-700 mt-0.5">{totalStockMeters.toLocaleString('id-ID')} m</div>
            <span className="text-[10px] text-emerald-600">
              {filteredRolls.filter((r) => r.status === 'DI_GUDANG').length} Rol di gudang
            </span>
          </div>

          <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-100">
            <span className="text-[11px] font-medium text-indigo-700">Nilai Kain</span>
            <div className="text-xl font-bold text-indigo-700 mt-0.5">{formatRp(totalAssetValue)}</div>
            <span className="text-[10px] text-indigo-600">Berdasarkan harga modal meter</span>
          </div>
        </div>

        {/* Search & Filter */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Cari nomor rol atau jenis kain..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-base"
            />
          </div>

          {userRole === 'ADMIN' && (
            <div className="w-full sm:w-48">
              <select
                value={brandFilter}
                onChange={(e) => setBrandFilter(e.target.value)}
                className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-base"
              >
                <option value="ALL">Semua Brand</option>
                {brands.map((b) => (
                  <option key={b.id} value={b.name}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="w-full sm:w-48">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-base"
            >
              <option value="ALL">Semua Status</option>
              <option value="MENUNGGU_FISIK">Menunggu Fisik</option>
              <option value="DI_GUDANG">Di Gudang (Ready)</option>
              <option value="DIPROSES">Diproses SPK</option>
              <option value="SELESAI">Selesai</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tabel Rol */}
      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-slate-900 text-sm">
            Inventaris Rol Kain ({filteredRolls.length} Rol)
          </h2>
          <span className="text-[11px] text-slate-400">Per nomor rol kain</span>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-slate-200">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-900 text-white font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="p-3.5">Kode Rol</th>
                <th className="p-3.5">Pemilik (Brand)</th>
                <th className="p-3.5">Jenis Kain</th>
                <th className="p-3.5">Panjang Kain</th>
                <th className="p-3.5">Status Fisik</th>
                <th className="p-3.5">Tgl Masuk</th>
                <th className="p-3.5">Keterangan</th>
                {userRole === 'ADMIN' && <th className="p-3.5 text-right">Aksi Admin</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filteredRolls.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400">
                    Tidak ada data rol kain yang sesuai dengan filter.
                  </td>
                </tr>
              ) : (
                filteredRolls.map((roll) => (
                  <tr key={roll.id} className="hover:bg-slate-50 transition">
                    <td className="p-3.5 font-semibold text-indigo-600 font-mono">{roll.rollCode}</td>
                    <td className="p-3.5">
                      <span className="px-2.5 py-1 bg-slate-100 text-slate-800 font-bold rounded-md text-[10px]">
                        {roll.brand}
                      </span>
                    </td>
                    <td className="p-3.5 font-semibold text-slate-900">{roll.jenisKain}</td>
                    <td className="p-3.5 font-bold">
                      {roll.meterLength} m
                      {roll.meterUsed > 0 && (
                        <span className="text-[10px] text-slate-400 block font-normal">
                          Terpakai: {roll.meterUsed} m
                        </span>
                      )}
                    </td>
                    <td className="p-3.5">{getStatusBadge(roll.status)}</td>
                    <td className="p-3.5 text-slate-600 font-medium">{formatDateIndo(roll.tanggalMasuk)}</td>
                    <td className="p-3.5 text-slate-500 text-[11px]">{roll.keterangan || '-'}</td>
                    {userRole === 'ADMIN' && (
                      <td className="p-3.5 text-right space-x-1">
                        {roll.status === 'MENUNGGU_FISIK' && (
                          <button
                            onClick={() => updateInboundRollStatus(roll.id, 'DI_GUDANG')}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg text-[10px] transition-base btn-press shadow-sm"
                            title="Konfirmasi barang telah sampai di gudang"
                          >
                            Konfirmasi Sampai
                          </button>
                        )}
                        {roll.status === 'DI_GUDANG' && (
                          <span className="text-[10px] font-medium text-slate-400">Siap Dipotong</span>
                        )}
                        {roll.status === 'DIPROSES' && (
                          <span className="text-[10px] font-medium text-indigo-600">Dalam SPK</span>
                        )}
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: Tambah Rol Kain Baru */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-lg border border-slate-200 space-y-5 animate-slideUp">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-semibold text-slate-900 text-base">
                {userRole === 'BRAND' ? 'Rencana Pengiriman Kain ke Gudang' : 'Penerimaan Rol Kain Baru'}
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 btn-press"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveRoll} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-600 mb-1">Kode / Barcode Rol</label>
                  <input
                    type="text"
                    value={form.rollCode}
                    onChange={(e) => setForm({ ...form, rollCode: e.target.value.toUpperCase() })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none uppercase font-mono focus:border-indigo-400 transition-base"
                    required
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-600 mb-1">Pemilik (Brand)</label>
                  {userRole === 'BRAND' ? (
                    <input
                      type="text"
                      value={activeBrand}
                      disabled
                      className="w-full p-2.5 bg-slate-100 border border-slate-200 rounded-lg text-slate-700"
                    />
                  ) : (
                    <select
                      value={form.brand}
                      onChange={(e) => setForm({ ...form, brand: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-indigo-400 transition-base"
                    >
                      {brands.map((b) => (
                        <option key={b.id} value={b.name}>
                          {b.name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-600 mb-1">Jenis Kain &amp; Warna</label>
                <input
                  type="text"
                  placeholder="Misal: Cotton Combed 30s Hitam, Rayon Twill Sage..."
                  value={form.jenisKain}
                  onChange={(e) => setForm({ ...form, jenisKain: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-indigo-400 transition-base"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-600 mb-1">Panjang (Meter)</label>
                  <input
                    type="number"
                    value={form.meterLength}
                    onChange={(e) => setForm({ ...form, meterLength: Number(e.target.value) })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-indigo-400 transition-base"
                    required
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-600 mb-1">Harga Modal / Meter (Rp)</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="Contoh: 40.000"
                    value={formatRupiahInput(form.hargaModalMeter)}
                    onChange={(e) => setForm({ ...form, hargaModalMeter: parseRupiahInput(e.target.value) })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-indigo-400 transition-base font-semibold text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-600 mb-1">Keterangan / Lokasi Rak</label>
                <input
                  type="text"
                  placeholder="Misal: Rak A-2, Lot #990..."
                  value={form.keterangan}
                  onChange={(e) => setForm({ ...form, keterangan: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-indigo-400 transition-base"
                />
              </div>

              <div className="flex gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg transition-base btn-press"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg transition-base btn-press shadow-sm"
                >
                  Simpan Rol Kain
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
