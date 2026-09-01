import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { SuratJalan, SizeBreakdown } from '../../types';
import { formatDateIndo } from '../../utils/formatters';
import {
  Truck,
  Plus,
  Search,
  CheckCircle2,
  AlertTriangle,
  FileText,
  X,
  Eye,
  ShieldCheck,
} from 'lucide-react';

export const OutboundView: React.FC = () => {
  const { suratJalanList, createSuratJalan, spkList, getSPKRemainingQty, userRole, activeBrand } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [brandFilter, setBrandFilter] = useState(userRole === 'BRAND' ? activeBrand : 'ALL');

  // Modal State for Create Surat Jalan
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedSPKId, setSelectedSPKId] = useState<string>('');
  const [driverName, setDriverName] = useState('Pak Wardi');
  const [nomorKendaraan, setNomorKendaraan] = useState('D 1829 XYZ');
  const [catatan, setCatatan] = useState('');
  const [qtySend, setQtySend] = useState<SizeBreakdown>({
    s: 0,
    m: 0,
    l: 0,
    xl: 0,
    xxl: 0,
    anak4_10: 0,
    anak12_16: 0,
  });

  const [selectedSJDetail, setSelectedSJDetail] = useState<SuratJalan | null>(null);

  // Active SPKs available for shipping
  const activeSPKs = spkList.filter((s) => s.status !== 'COMPLETED');

  // Selected SPK object & remaining calculation
  const currentSPK = spkList.find((s) => s.id === selectedSPKId) || activeSPKs[0];
  const remaining = currentSPK ? getSPKRemainingQty(currentSPK) : null;

  const totalSendingPcs =
    qtySend.s +
    qtySend.m +
    qtySend.l +
    qtySend.xl +
    qtySend.xxl +
    qtySend.anak4_10 +
    qtySend.anak12_16;

  // Validation: Check if sending exceeds remaining
  const isOverDelivering =
    remaining &&
    (qtySend.s > remaining.s ||
      qtySend.m > remaining.m ||
      qtySend.l > remaining.l ||
      qtySend.xl > remaining.xl ||
      qtySend.xxl > remaining.xxl ||
      qtySend.anak4_10 > remaining.anak4_10 ||
      qtySend.anak12_16 > remaining.anak12_16);

  const filteredSJ = suratJalanList.filter((sj) => {
    const effectiveBrand = userRole === 'BRAND' ? activeBrand : brandFilter;
    const matchBrand = effectiveBrand === 'ALL' || sj.brand === effectiveBrand;
    const matchSearch =
      sj.noSuratJalan.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sj.produk.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sj.vendor.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sj.driverName.toLowerCase().includes(searchTerm.toLowerCase());

    return matchBrand && matchSearch;
  });

  const handleOpenCreate = () => {
    if (activeSPKs.length === 0) {
      alert('Tidak ada SPK aktif yang memiliki sisa barang di konveksi.');
      return;
    }
    const defaultSPK = activeSPKs[0];
    setSelectedSPKId(defaultSPK.id);
    const rem = getSPKRemainingQty(defaultSPK);
    setQtySend({
      s: Math.min(50, rem.s),
      m: Math.min(50, rem.m),
      l: Math.min(50, rem.l),
      xl: Math.min(20, rem.xl),
      xxl: Math.min(10, rem.xxl),
      anak4_10: Math.min(50, rem.anak4_10),
      anak12_16: Math.min(50, rem.anak12_16),
    });
    setCatatan('Pengiriman parsial harian');
    setIsCreateModalOpen(true);
  };

  const handleSPKChange = (spkId: string) => {
    setSelectedSPKId(spkId);
    const spk = spkList.find((s) => s.id === spkId);
    if (spk) {
      const rem = getSPKRemainingQty(spk);
      setQtySend({
        s: Math.min(30, rem.s),
        m: Math.min(30, rem.m),
        l: Math.min(30, rem.l),
        xl: Math.min(10, rem.xl),
        xxl: Math.min(10, rem.xxl),
        anak4_10: Math.min(30, rem.anak4_10),
        anak12_16: Math.min(30, rem.anak12_16),
      });
    }
  };

  const handleSaveSJ = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentSPK) return;

    if (totalSendingPcs <= 0) {
      alert('Total kuantiti barang kirim harus lebih dari 0!');
      return;
    }

    const result = await createSuratJalan({
      spkId: currentSPK.id,
      brand: currentSPK.brand,
      produk: currentSPK.produk,
      vendor: currentSPK.vendor,
      tanggal: new Date().toISOString().split('T')[0],
      qtyDelivered: qtySend,
      totalPcs: totalSendingPcs,
      driverName,
      nomorKendaraan,
      catatan,
    });

    if (!result.success) {
      alert(result.message || 'Gagal menyimpan Surat Jalan');
      return;
    }

    setIsCreateModalOpen(false);
  };

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="bg-white rounded-xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-lg mb-2 border border-indigo-100">
              <Truck className="w-3.5 h-3.5" />
              Outbound Surat Jalan
            </div>
            <h1 className="text-2xl font-bold text-slate-900">Pengiriman Barang (Surat Jalan)</h1>
            <p className="text-slate-500 text-xs mt-1">
              Pencatatan pengiriman parsial harian dari mitra penjahit. Dilengkapi validasi *auto-deduct* untuk mencegah *over-delivery*.
            </p>
          </div>

          {userRole === 'ADMIN' && (
            <button
              onClick={handleOpenCreate}
              className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2.5 rounded-lg flex items-center gap-1.5 shadow-sm transition-base btn-press shrink-0"
            >
              <Plus className="w-4 h-4" />
              + Terbitkan Surat Jalan (SJ)
            </button>
          )}
        </div>

        {/* Filter Controls */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Cari no surat jalan, produk, driver, atau vendor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 transition-base outline-none"
            />
          </div>

          {userRole === 'ADMIN' && (
            <div className="w-full sm:w-48">
              <select
                value={brandFilter}
                onChange={(e) => setBrandFilter(e.target.value)}
                className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 transition-base outline-none"
              >
                <option value="ALL">Semua Brand</option>
                <option value="GREYWOLF">GREYWOLF</option>
                <option value="CITA-CITA">CITA-CITA</option>
                <option value="CREADIVE">CREADIVE</option>
                <option value="JENAKA KIDS">JENAKA KIDS</option>
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Surat Jalan Table */}
      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-slate-900 text-sm flex items-center gap-2">
            
            Riwayat Surat Jalan Outbound ({filteredSJ.length} Kiriman)
          </h3>
          <span className="text-[11px] text-slate-400">Tersinkronisasi ke modul Finance</span>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-900 text-white font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="p-3.5">No Surat Jalan</th>
                <th className="p-3.5">Brand</th>
                <th className="p-3.5">Nama Produk</th>
                <th className="p-3.5">Vendor Penjahit</th>
                <th className="p-3.5">Total Pcs</th>
                <th className="p-3.5">Driver & No Polisi</th>
                <th className="p-3.5">Tgl Kirim</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Rincian</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filteredSJ.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-400">
                    Belum ada riwayat surat jalan pengiriman.
                  </td>
                </tr>
              ) : (
                filteredSJ.map((sj) => (
                  <tr key={sj.id} className="hover:bg-slate-50 transition">
                    <td className="p-3.5 font-mono font-bold text-indigo-600">{sj.noSuratJalan}</td>
                    <td className="p-3.5">
                      <span className="px-2.5 py-1 bg-slate-100 text-slate-800 font-bold rounded-md text-[10px]">
                        {sj.brand}
                      </span>
                    </td>
                    <td className="p-3.5 font-semibold text-slate-900">{sj.produk}</td>
                    <td className="p-3.5 font-bold text-slate-700">{sj.vendor}</td>
                    <td className="p-3.5 font-bold text-slate-900 text-sm">{sj.totalPcs} Pcs</td>
                    <td className="p-3.5 text-slate-500">
                      <div>{sj.driverName}</div>
                      <span className="text-[10px] text-slate-400 font-mono">{sj.nomorKendaraan}</span>
                    </td>
                    <td className="p-3.5 text-slate-500 font-medium">{formatDateIndo(sj.tanggal)}</td>
                    <td className="p-3.5">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 font-bold rounded-lg text-[10px] border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3" /> {sj.status}
                      </span>
                    </td>
                    <td className="p-3.5 text-right">
                      <button
                        onClick={() => setSelectedSJDetail(sj)}
                        className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                        title="Lihat Detail Size"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: Terbitkan Surat Jalan Baru (Auto-Deduct) */}
      {isCreateModalOpen && currentSPK && remaining && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto shadow-lg border border-slate-100 space-y-5 animate-slideUp">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Terbitkan Surat Jalan (Outbound)</h3>
                <p className="text-[11px] text-slate-400">Otomatis mengurangi sisa kuota potong di SPK</p>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSJ} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Pilih SPK yang Dikirim:</label>
                  <select
                    value={selectedSPKId}
                    onChange={(e) => handleSPKChange(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold outline-none font-mono"
                  >
                    {activeSPKs.map((spk) => (
                      <option key={spk.id} value={spk.id}>
                        {spk.spkNumber} - {spk.brand} ({spk.produk} @ {spk.vendor})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-600 mb-1">Vendor & Brand:</label>
                  <div className="p-2.5 bg-slate-100 border border-slate-200 rounded-xl font-bold text-slate-700">
                    {currentSPK.vendor} &rarr; {currentSPK.brand}
                  </div>
                </div>
              </div>

              {/* Real-Time Auto Deduct Checker */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    Kuantitas Kirim per Size (Auto-Deduct Validator)
                  </span>
                  <span className="font-bold text-slate-900 text-sm">Total Kirim: {totalSendingPcs} Pcs</span>
                </div>

                {isOverDelivering && (
                  <div className="bg-amber-50 border border-amber-300 text-amber-950 p-3.5 rounded-xl flex items-center gap-2.5 font-medium text-xs">
                    <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                    <span>
                      <strong className="font-bold text-amber-900">Perhatian (Over-Delivery):</strong> Kuantitas kirim melebihi sisa estimasi potong SPK. Surat Jalan tetap dapat diterbitkan dan status SPK otomatis diset ke <strong>OVER_DELIVERY</strong>.
                    </span>
                  </div>
                )}

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div>
                    <div className="flex justify-between text-[10px] text-slate-500 mb-1">
                      <span>Size S:</span>
                      <span className="font-bold text-indigo-600">Sisa {remaining.s}</span>
                    </div>
                    <input
                      type="number"
                      value={qtySend.s}
                      onChange={(e) => setQtySend({ ...qtySend, s: Number(e.target.value) })}
                      className={`w-full p-2 border rounded-xl font-bold text-center ${
                        qtySend.s > remaining.s ? 'bg-amber-50 border-amber-400 text-amber-950' : 'bg-white border-slate-200'
                      }`}
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-[10px] text-slate-500 mb-1">
                      <span>Size M:</span>
                      <span className="font-bold text-indigo-600">Sisa {remaining.m}</span>
                    </div>
                    <input
                      type="number"
                      value={qtySend.m}
                      onChange={(e) => setQtySend({ ...qtySend, m: Number(e.target.value) })}
                      className={`w-full p-2 border rounded-xl font-bold text-center ${
                        qtySend.m > remaining.m ? 'bg-amber-50 border-amber-400 text-amber-950' : 'bg-white border-slate-200'
                      }`}
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-[10px] text-slate-500 mb-1">
                      <span>Size L:</span>
                      <span className="font-bold text-indigo-600">Sisa {remaining.l}</span>
                    </div>
                    <input
                      type="number"
                      value={qtySend.l}
                      onChange={(e) => setQtySend({ ...qtySend, l: Number(e.target.value) })}
                      className={`w-full p-2 border rounded-xl font-bold text-center ${
                        qtySend.l > remaining.l ? 'bg-amber-50 border-amber-400 text-amber-950' : 'bg-white border-slate-200'
                      }`}
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-[10px] text-slate-500 mb-1">
                      <span>Size XL:</span>
                      <span className="font-bold text-indigo-600">Sisa {remaining.xl}</span>
                    </div>
                    <input
                      type="number"
                      value={qtySend.xl}
                      onChange={(e) => setQtySend({ ...qtySend, xl: Number(e.target.value) })}
                      className={`w-full p-2 border rounded-xl font-bold text-center ${
                        qtySend.xl > remaining.xl ? 'bg-amber-50 border-amber-400 text-amber-950' : 'bg-white border-slate-200'
                      }`}
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-[10px] text-slate-500 mb-1">
                      <span>Size 2XL:</span>
                      <span className="font-bold text-indigo-600">Sisa {remaining.xxl}</span>
                    </div>
                    <input
                      type="number"
                      value={qtySend.xxl}
                      onChange={(e) => setQtySend({ ...qtySend, xxl: Number(e.target.value) })}
                      className={`w-full p-2 border rounded-xl font-bold text-center ${
                        qtySend.xxl > remaining.xxl ? 'bg-amber-50 border-amber-400 text-amber-950' : 'bg-white border-slate-200'
                      }`}
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-[10px] text-slate-500 mb-1">
                      <span>Anak (4-10):</span>
                      <span className="font-bold text-indigo-600">Sisa {remaining.anak4_10}</span>
                    </div>
                    <input
                      type="number"
                      value={qtySend.anak4_10}
                      onChange={(e) => setQtySend({ ...qtySend, anak4_10: Number(e.target.value) })}
                      className={`w-full p-2 border rounded-xl font-bold text-center ${
                        qtySend.anak4_10 > remaining.anak4_10 ? 'bg-amber-50 border-amber-400 text-amber-950' : 'bg-white border-slate-200'
                      }`}
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-[10px] text-slate-500 mb-1">
                      <span>Anak (12-16):</span>
                      <span className="font-bold text-indigo-600">Sisa {remaining.anak12_16}</span>
                    </div>
                    <input
                      type="number"
                      value={qtySend.anak12_16}
                      onChange={(e) => setQtySend({ ...qtySend, anak12_16: Number(e.target.value) })}
                      className={`w-full p-2 border rounded-xl font-bold text-center ${
                        qtySend.anak12_16 > remaining.anak12_16 ? 'bg-amber-50 border-amber-400 text-amber-950' : 'bg-white border-slate-200'
                      }`}
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Nama Driver / Kurir:</label>
                  <input
                    type="text"
                    value={driverName}
                    onChange={(e) => setDriverName(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-600 mb-1">Nomor Polisi Kendaraan:</label>
                  <input
                    type="text"
                    value={nomorKendaraan}
                    onChange={(e) => setNomorKendaraan(e.target.value.toUpperCase())}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold outline-none uppercase"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-600 mb-1">Catatan Pengiriman:</label>
                <input
                  type="text"
                  value={catatan}
                  onChange={(e) => setCatatan(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium outline-none"
                />
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
                  disabled={totalSendingPcs <= 0}
                  className={`flex-1 py-2.5 text-white font-bold rounded-xl transition ${
                    totalSendingPcs <= 0
                      ? 'bg-slate-300 cursor-not-allowed'
                      : 'bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-600/30 cursor-pointer'
                  }`}
                >
                  {isOverDelivering ? 'Terbitkan Surat Jalan (Over-Delivery)' : 'Terbitkan Surat Jalan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Detail Surat Jalan */}
      {selectedSJDetail && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-lg border border-slate-100 space-y-5 animate-slideUp">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-base">{selectedSJDetail.noSuratJalan}</h3>
                <span className="text-xs text-slate-500">{selectedSJDetail.brand} • {selectedSJDetail.produk}</span>
              </div>
              <button
                onClick={() => setSelectedSJDetail(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 grid grid-cols-2 gap-2">
                <div>
                  <span className="text-slate-400 block text-[10px]">Vendor Penjahit:</span>
                  <strong className="text-slate-800">{selectedSJDetail.vendor}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Tanggal Kirim:</span>
                  <strong className="text-slate-800">{formatDateIndo(selectedSJDetail.tanggal)}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Driver:</span>
                  <span className="text-slate-700">{selectedSJDetail.driverName}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">No Polisi:</span>
                  <span className="text-slate-700 font-mono">{selectedSJDetail.nomorKendaraan}</span>
                </div>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-center text-xs">
                  <thead className="bg-slate-900 text-white font-bold text-[10px]">
                    <tr>
                      <th className="p-2 text-left pl-3">Size</th>
                      <th className="p-2">Jumlah Pcs Terkirim</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {Object.entries(selectedSJDetail.qtyDelivered).map(([size, qty]) => {
                      if (qty === 0) return null;
                      return (
                        <tr key={size}>
                          <td className="p-2 text-left pl-3 font-bold uppercase">{size.replace('anak', 'Anak ')}</td>
                          <td className="p-2 font-bold text-emerald-600">{qty} Pcs</td>
                        </tr>
                      );
                    })}
                    <tr className="bg-slate-50 font-bold">
                      <td className="p-2 text-left pl-3">Total Kirim</td>
                      <td className="p-2 text-indigo-600">{selectedSJDetail.totalPcs} Pcs</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <button
              onClick={() => setSelectedSJDetail(null)}
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
