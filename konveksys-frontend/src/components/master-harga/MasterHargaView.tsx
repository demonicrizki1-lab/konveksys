import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { HargaKonveksi, HargaBuyer, Vendor } from '../../types';
import { formatRupiahInput, parseRupiahInput } from '../../utils/formatters';
import { Coins, Plus, Search, Edit2, Trash2, Check, X, ShieldAlert, Sparkles, Factory, Phone, Tag } from 'lucide-react';

export const MasterHargaView: React.FC = () => {
  const {
    hargaKonveksi,
    hargaBuyer,
    brands,
    vendors,
    addVendor,
    updateVendor,
    deleteVendor,
    addHargaKonveksi,
    updateHargaKonveksi,
    deleteHargaKonveksi,
    addHargaBuyer,
    updateHargaBuyer,
    deleteHargaBuyer,
    userRole,
  } = useApp();

  const [activeSubTab, setActiveSubTab] = useState<'vendor' | 'konveksi' | 'buyer'>('vendor');
  const [searchTerm, setSearchTerm] = useState('');
  const [brandFilter, setBrandFilter] = useState('ALL');

  // Vendor Modal State
  const [isVendorModalOpen, setIsVendorModalOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
  const [vendorForm, setVendorForm] = useState({
    name: '',
    contact: '',
  });

  // Modal State
  const [isKonveksiModalOpen, setIsKonveksiModalOpen] = useState(false);
  const [editingKonveksi, setEditingKonveksi] = useState<HargaKonveksi | null>(null);
  const [konveksiForm, setKonveksiForm] = useState({
    vendor: '',
    produk: '',
    brand: 'GREYWOLF',
    harga: 12500,
  });

  const [isBuyerModalOpen, setIsBuyerModalOpen] = useState(false);
  const [editingBuyer, setEditingBuyer] = useState<HargaBuyer | null>(null);
  const [buyerForm, setBuyerForm] = useState({
    brand: 'GREYWOLF',
    produk: '',
    rateSML: 30000,
    rateXL: 34000,
    rateAnak4: 0,
    rateAnak6: 0,
    rateAnak8: 0,
    rateAnak10: 0,
    rateAnak12: 0,
    rateAnak14: 0,
    rateAnak16: 0,
  });

  const formatRp = (num: number) => {
    if (!num || num === 0) return '-';
    return 'Rp ' + num.toLocaleString('id-ID');
  };

  // Filtered Vendor List
  const filteredVendors = vendors.filter((v) => {
    return (
      v.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.contact.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  // Handlers for Vendor Modal
  const openAddVendor = () => {
    setEditingVendor(null);
    setVendorForm({ name: '', contact: '' });
    setIsVendorModalOpen(true);
  };

  const openEditVendor = (v: Vendor) => {
    setEditingVendor(v);
    setVendorForm({ name: v.name, contact: v.contact });
    setIsVendorModalOpen(true);
  };

  const handleSaveVendor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vendorForm.name.trim()) {
      alert('Nama vendor konveksi wajib diisi!');
      return;
    }
    if (editingVendor) {
      await updateVendor({ ...editingVendor, ...vendorForm });
    } else {
      await addVendor(vendorForm);
    }
    setIsVendorModalOpen(false);
  };

  // Filtered Konveksi List
  const filteredKonveksi = hargaKonveksi.filter((item) => {
    const matchSearch =
      item.vendor.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.produk.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.brand.toLowerCase().includes(searchTerm.toLowerCase());
    const matchBrand = brandFilter === 'ALL' || item.brand === brandFilter;
    return matchSearch && matchBrand;
  });

  // Filtered Buyer List
  const filteredBuyer = hargaBuyer.filter((item) => {
    const matchSearch =
      item.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.produk.toLowerCase().includes(searchTerm.toLowerCase());
    const matchBrand = brandFilter === 'ALL' || item.brand === brandFilter;
    return matchSearch && matchBrand;
  });

  // Handlers for Konveksi Modal
  const openAddKonveksi = () => {
    setEditingKonveksi(null);
    setKonveksiForm({ vendor: vendors[0]?.name || 'SAHIRA', produk: '', brand: brands[0]?.name || 'GREYWOLF', harga: 12500 });
    setIsKonveksiModalOpen(true);
  };

  const openEditKonveksi = (item: HargaKonveksi) => {
    setEditingKonveksi(item);
    setKonveksiForm({ vendor: item.vendor, produk: item.produk, brand: item.brand, harga: item.harga });
    setIsKonveksiModalOpen(true);
  };

  const handleSaveKonveksi = (e: React.FormEvent) => {
    e.preventDefault();
    if (!konveksiForm.produk.trim()) {
      alert('Nama produk wajib diisi!');
      return;
    }
    if (editingKonveksi) {
      updateHargaKonveksi({ ...editingKonveksi, ...konveksiForm });
    } else {
      addHargaKonveksi(konveksiForm);
    }
    setIsKonveksiModalOpen(false);
  };

  // Handlers for Buyer Modal
  const openAddBuyer = () => {
    setEditingBuyer(null);
    setBuyerForm({
      brand: brands[0]?.name || 'GREYWOLF',
      produk: '',
      rateSML: 30000,
      rateXL: 34000,
      rateAnak4: 0,
      rateAnak6: 0,
      rateAnak8: 0,
      rateAnak10: 0,
      rateAnak12: 0,
      rateAnak14: 0,
      rateAnak16: 0,
    });
    setIsBuyerModalOpen(true);
  };

  const openEditBuyer = (item: HargaBuyer) => {
    setEditingBuyer(item);
    setBuyerForm({
      brand: item.brand,
      produk: item.produk,
      rateSML: item.rateSML,
      rateXL: item.rateXL,
      rateAnak4: item.rateAnak4 || 0,
      rateAnak6: item.rateAnak6 || 0,
      rateAnak8: item.rateAnak8 || 0,
      rateAnak10: item.rateAnak10 || 0,
      rateAnak12: item.rateAnak12 || 0,
      rateAnak14: item.rateAnak14 || 0,
      rateAnak16: item.rateAnak16 || 0,
    });
    setIsBuyerModalOpen(true);
  };

  const handleSaveBuyer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!buyerForm.produk.trim()) {
      alert('Nama produk wajib diisi!');
      return;
    }
    if (editingBuyer) {
      updateHargaBuyer({ ...editingBuyer, ...buyerForm });
    } else {
      addHargaBuyer(buyerForm);
    }
    setIsBuyerModalOpen(false);
  };

  if (userRole === 'BRAND') {
    return (
      <div className="bg-white rounded-xl p-12 text-center border border-slate-200 shadow-sm space-y-4">
        <ShieldAlert className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-xl font-bold text-slate-900">Akses Dibatasi (Admin Only)</h2>
        <p className="text-slate-500 text-xs max-w-md mx-auto">
          Master Database Harga hanya dapat diakses dan dimodifikasi oleh Admin/Owner konveksi untuk menjaga kerahasiaan tarif internal.
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
              <Coins className="w-3.5 h-3.5" />
              Master Pricing Matrix Engine
            </div>
            <h1 className="text-2xl font-bold text-slate-900">Master Database Harga Dinamis</h1>
            <p className="text-slate-500 text-xs mt-1">
              Data referensi tarif yang menjadi dasar otomatisasi perhitungan gaji penjahit dan invoice tagihan Brand.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {activeSubTab === 'vendor' && (
              <button
                onClick={openAddVendor}
                className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-4 py-2.5 rounded-lg flex items-center gap-1.5 shadow-sm transition-base btn-press"
              >
                <Plus className="w-4 h-4" />
                Tambah Vendor Baru
              </button>
            )}
            {activeSubTab === 'konveksi' && (
              <button
                onClick={openAddKonveksi}
                className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-4 py-2.5 rounded-lg flex items-center gap-1.5 shadow-sm transition-base btn-press"
              >
                <Plus className="w-4 h-4" />
                Tambah Tarif Konveksi
              </button>
            )}
            {activeSubTab === 'buyer' && (
              <button
                onClick={openAddBuyer}
                className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-4 py-2.5 rounded-lg flex items-center gap-1.5 shadow-sm transition-base btn-press"
              >
                <Plus className="w-4 h-4" />
                Tambah Matriks Buyer
              </button>
            )}
          </div>
        </div>

        {/* Sub Tab Switcher */}
        <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-4">
          <button
            onClick={() => setActiveSubTab('vendor')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-base btn-press ${
              activeSubTab === 'vendor'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Mitra Vendor Konveksi
          </button>
          <button
            onClick={() => setActiveSubTab('konveksi')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-base btn-press ${
              activeSubTab === 'konveksi'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Matriks Harga Konveksi
          </button>
          <button
            onClick={() => setActiveSubTab('buyer')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-base btn-press ${
              activeSubTab === 'buyer'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Matriks Harga Buyer
          </button>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Cari nama produk, vendor, atau brand..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 transition-base outline-none"
            />
          </div>

          <div className="w-full sm:w-56">
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
        </div>
      </div>

      {/* TABLE 0: MITRA VENDOR KONVEKSI */}
      {activeSubTab === 'vendor' && (
        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-slate-900 text-sm flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-600"></span>
              Daftar Mitra Vendor Konveksi ({filteredVendors.length} Mitra)
            </h3>
            <span className="text-[11px] text-slate-400">Database Penjahit & CMT Partner</span>
          </div>

          {filteredVendors.length === 0 ? (
            <div className="p-8 text-center border-2 border-dashed border-slate-200 rounded-xl bg-slate-50 space-y-3">
              <Factory className="w-10 h-10 text-slate-400 mx-auto" />
              <p className="text-sm font-semibold text-slate-700">Belum ada mitra vendor konveksi</p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Tambahkan vendor konveksi pertama Anda untuk mulai mengelola ongkos jahit, SPK potong, dan perhitungan kasbon.
              </p>
              <button
                onClick={openAddVendor}
                className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-4 py-2 rounded-lg inline-flex items-center gap-1.5 shadow-sm transition-base btn-press"
              >
                <Plus className="w-4 h-4" />
                Tambah Vendor Sekarang
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-900 text-white font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="p-3.5 w-1/3">Nama Vendor / Konveksi</th>
                    <th className="p-3.5 w-1/3">Kontak / No. Telepon</th>
                    <th className="p-3.5">Status Kasbon Berjalan</th>
                    <th className="p-3.5 text-right w-24">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {filteredVendors.map((v) => (
                    <tr key={v.id} className="hover:bg-indigo-50/40 transition">
                      <td className="p-3.5 font-bold text-slate-900">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-xs shrink-0">
                            {v.name.slice(0, 2).toUpperCase()}
                          </div>
                          <span>{v.name}</span>
                        </div>
                      </td>
                      <td className="p-3.5 text-slate-600">
                        <div className="flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{v.contact || '-'}</span>
                        </div>
                      </td>
                      <td className="p-3.5">
                        <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold inline-block ${
                          v.currentKasbon > 0 ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {v.currentKasbon > 0 ? `Kasbon: ${formatRp(v.currentKasbon)}` : 'Lunas / Nihil'}
                        </span>
                      </td>
                      <td className="p-3.5 text-right space-x-1">
                        <button
                          onClick={() => openEditVendor(v)}
                          className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                          title="Edit Vendor"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Hapus vendor ${v.name}? Semua riwayat tarif vendor ini akan terhapus.`)) {
                              deleteVendor(v.id);
                            }
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                          title="Hapus"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TABLE 1: HARGA KONVEKSI */}
      {activeSubTab === 'konveksi' && (
        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-slate-900 text-sm flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-600"></span>
              Daftar Tarif Ongkos Jahit per Vendor ({filteredKonveksi.length} Data)
            </h3>
            <span className="text-[11px] text-slate-400">Lookup: Vendor + Produk + Brand</span>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-900 text-white font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="p-3.5">Vendor (Konveksi)</th>
                  <th className="p-3.5">Nama Produk</th>
                  <th className="p-3.5">Brand Pemilik</th>
                  <th className="p-3.5">Tarif / Pcs</th>
                  <th className="p-3.5">Logika Lookup</th>
                  <th className="p-3.5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {filteredKonveksi.map((row) => (
                  <tr key={row.id} className="hover:bg-indigo-50/40 transition">
                    <td className="p-3.5 font-bold text-slate-900">{row.vendor}</td>
                    <td className="p-3.5 font-semibold text-slate-800">{row.produk}</td>
                    <td className="p-3.5">
                      <span className="px-2.5 py-1 bg-slate-100 text-slate-700 font-bold rounded-md text-[10px]">
                        {row.brand}
                      </span>
                    </td>
                    <td className="p-3.5 font-bold text-indigo-600 text-sm">{formatRp(row.harga)}</td>
                    <td className="p-3.5 text-slate-400 text-[11px]">
                      <code>[{row.vendor} + {row.produk} + {row.brand}]</code>
                    </td>
                    <td className="p-3.5 text-right space-x-1">
                      <button
                        onClick={() => openEditKonveksi(row)}
                        className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                        title="Edit Tarif"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Hapus tarif ${row.vendor} untuk ${row.produk}?`)) {
                            deleteHargaKonveksi(row.id);
                          }
                        }}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                        title="Hapus"
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
      )}

      {/* TABLE 2: HARGA BUYER MULTI-SIZE */}
      {activeSubTab === 'buyer' && (
        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-slate-900 text-sm flex items-center gap-2">
              
              Matriks Tarif Tagihan Buyer Multi-Size ({filteredBuyer.length} Data)
            </h3>
            <span className="text-[11px] text-slate-400">Lookup: Brand + Produk + Size</span>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs text-slate-700 min-w-[980px]">
              <thead className="bg-slate-900 text-white font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="p-3 border-r border-slate-800">Brand</th>
                  <th className="p-3 border-r border-slate-800">Nama Produk</th>
                  <th className="p-3 text-center bg-indigo-950 border-r border-slate-800">S/M/L</th>
                  <th className="p-3 text-center bg-indigo-900 border-r border-slate-800">XL/2XL</th>
                  <th className="p-3 text-center bg-slate-800 border-r border-slate-700">Anak 4</th>
                  <th className="p-3 text-center bg-slate-800 border-r border-slate-700">Anak 6</th>
                  <th className="p-3 text-center bg-slate-800 border-r border-slate-700">Anak 8</th>
                  <th className="p-3 text-center bg-slate-800 border-r border-slate-700">Anak 10</th>
                  <th className="p-3 text-center bg-slate-800 border-r border-slate-700">Anak 12</th>
                  <th className="p-3 text-center bg-slate-800 border-r border-slate-700">Anak 14</th>
                  <th className="p-3 text-center bg-slate-800 border-r border-slate-700">Anak 16</th>
                  <th className="p-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {filteredBuyer.map((row) => (
                  <tr key={row.id} className="hover:bg-emerald-50/40 transition">
                    <td className="p-3 font-bold text-slate-900 border-r border-slate-100">
                      <span className="px-2.5 py-1 bg-blue-50 text-blue-700 font-bold rounded-md text-[10px]">
                        {row.brand}
                      </span>
                    </td>
                    <td className="p-3 font-semibold text-slate-800 border-r border-slate-100">{row.produk}</td>
                    <td className="p-3 text-center font-bold text-slate-800 border-r border-slate-100">
                      {formatRp(row.rateSML)}
                    </td>
                    <td className="p-3 text-center font-bold text-indigo-600 bg-indigo-50/30 border-r border-slate-100">
                      {formatRp(row.rateXL)}
                    </td>
                    <td className="p-3 text-center font-bold text-slate-600 border-r border-slate-100">
                      {formatRp(row.rateAnak4)}
                    </td>
                    <td className="p-3 text-center font-bold text-slate-600 border-r border-slate-100">
                      {formatRp(row.rateAnak6)}
                    </td>
                    <td className="p-3 text-center font-bold text-slate-600 border-r border-slate-100">
                      {formatRp(row.rateAnak8)}
                    </td>
                    <td className="p-3 text-center font-bold text-slate-600 border-r border-slate-100">
                      {formatRp(row.rateAnak10)}
                    </td>
                    <td className="p-3 text-center font-bold text-slate-600 border-r border-slate-100">
                      {formatRp(row.rateAnak12)}
                    </td>
                    <td className="p-3 text-center font-bold text-slate-600 border-r border-slate-100">
                      {formatRp(row.rateAnak14)}
                    </td>
                    <td className="p-3 text-center font-bold text-slate-600 border-r border-slate-100">
                      {formatRp(row.rateAnak16)}
                    </td>
                    <td className="p-3 text-right space-x-1">
                      <button
                        onClick={() => openEditBuyer(row)}
                        className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                        title="Edit Tarif Size"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Hapus matriks tarif ${row.brand} untuk ${row.produk}?`)) {
                            deleteHargaBuyer(row.id);
                          }
                        }}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                        title="Hapus"
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
      )}

      {/* MODAL: Form Vendor Baru / Edit */}
      {isVendorModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-lg border border-slate-100 space-y-5 animate-slideUp">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Factory className="w-5 h-5 text-indigo-600" />
                {editingVendor ? 'Edit Data Mitra Vendor' : 'Tambah Mitra Vendor Baru'}
              </h3>
              <button
                onClick={() => setIsVendorModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveVendor} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nama Konveksi / Vendor:</label>
                <input
                  type="text"
                  placeholder="Contoh: SAHIRA, RAKSUKAN, BU NIKEN..."
                  value={vendorForm.name}
                  onChange={(e) => setVendorForm({ ...vendorForm, name: e.target.value.toUpperCase() })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 outline-none uppercase focus:border-indigo-400"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">No. Kontak / WhatsApp Vendor:</label>
                <input
                  type="text"
                  placeholder="Contoh: 0812-3456-7890"
                  value={vendorForm.contact}
                  onChange={(e) => setVendorForm({ ...vendorForm, contact: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 outline-none focus:border-indigo-400"
                />
              </div>

              <div className="flex gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsVendorModalOpen(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition"
                >
                  {editingVendor ? 'Simpan Perubahan' : 'Tambah Vendor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Form Tarif Konveksi */}
      {isKonveksiModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-lg border border-slate-100 space-y-5 animate-slideUp">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base">
                {editingKonveksi ? 'Edit Tarif Jahit Konveksi' : 'Tambah Tarif Baru Konveksi'}
              </h3>
              <button
                onClick={() => setIsKonveksiModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveKonveksi} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-600 mb-1">Vendor (Mitra Konveksi):</label>
                <select
                  value={konveksiForm.vendor}
                  onChange={(e) => setKonveksiForm({ ...konveksiForm, vendor: e.target.value })}
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
                <label className="block font-bold text-slate-600 mb-1">Brand Pemilik Produk:</label>
                <select
                  value={konveksiForm.brand}
                  onChange={(e) => setKonveksiForm({ ...konveksiForm, brand: e.target.value })}
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
                <label className="block font-bold text-slate-600 mb-1">Nama Produk / Artikel:</label>
                <input
                  type="text"
                  placeholder="Misal: BEDAH PANJANG, KEMEJA HAWAI..."
                  value={konveksiForm.produk}
                  onChange={(e) => setKonveksiForm({ ...konveksiForm, produk: e.target.value.toUpperCase() })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold outline-none uppercase"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-600 mb-1">Tarif Ongkos Jahit per Pcs (Rp):</label>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="Contoh: 12.500"
                  value={formatRupiahInput(konveksiForm.harga)}
                  onChange={(e) => setKonveksiForm({ ...konveksiForm, harga: parseRupiahInput(e.target.value) })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-indigo-600 outline-none text-sm focus:border-indigo-400"
                  required
                />
              </div>

              <div className="flex gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsKonveksiModalOpen(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition"
                >
                  Simpan Tarif
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Form Tarif Buyer Multi-Size */}
      {isBuyerModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-lg border border-slate-100 space-y-5 animate-slideUp">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base">
                {editingBuyer ? 'Edit Matriks Harga Buyer' : 'Tambah Matriks Harga Buyer Baru'}
              </h3>
              <button
                onClick={() => setIsBuyerModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveBuyer} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Brand Buyer:</label>
                  <select
                    value={buyerForm.brand}
                    onChange={(e) => setBuyerForm({ ...buyerForm, brand: e.target.value })}
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
                  <label className="block font-bold text-slate-600 mb-1">Nama Produk / Artikel:</label>
                  <input
                    type="text"
                    placeholder="BEDAH PANJANG..."
                    value={buyerForm.produk}
                    onChange={(e) => setBuyerForm({ ...buyerForm, produk: e.target.value.toUpperCase() })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold outline-none uppercase"
                    required
                  />
                </div>
              </div>

              {/* Dewasa */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2.5">
                <span className="font-bold text-slate-800 block border-b border-slate-200 pb-1">
                  Pengaturan Tarif Dewasa (Rp):
                </span>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-600 mb-1">Dewasa Size S/M/L:</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="Contoh: 30.000"
                      value={formatRupiahInput(buyerForm.rateSML)}
                      onChange={(e) => setBuyerForm({ ...buyerForm, rateSML: parseRupiahInput(e.target.value) })}
                      className="w-full p-2 bg-white border border-slate-300 rounded-xl font-bold outline-none focus:border-indigo-400"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-600 mb-1">Dewasa Size XL/2XL:</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="Contoh: 34.000"
                      value={formatRupiahInput(buyerForm.rateXL)}
                      onChange={(e) => setBuyerForm({ ...buyerForm, rateXL: parseRupiahInput(e.target.value) })}
                      className="w-full p-2 bg-white border border-slate-300 rounded-xl font-bold outline-none focus:border-indigo-400"
                    />
                  </div>
                </div>
              </div>

              {/* Anak (Terpisah 4 - 16) */}
              <div className="bg-blue-50/50 p-3.5 rounded-xl border border-blue-100 space-y-2.5">
                <span className="font-bold text-blue-900 block border-b border-blue-100 pb-1">
                  Pengaturan Tarif Ukuran Anak (Terpisah Size 4 - 16) (Rp):
                </span>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div>
                    <label className="block font-semibold text-slate-600 mb-1">Anak Size 4:</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="0"
                      value={formatRupiahInput(buyerForm.rateAnak4)}
                      onChange={(e) => setBuyerForm({ ...buyerForm, rateAnak4: parseRupiahInput(e.target.value) })}
                      className="w-full p-2 bg-white border border-slate-300 rounded-xl font-bold outline-none focus:border-indigo-400"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-600 mb-1">Anak Size 6:</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="0"
                      value={formatRupiahInput(buyerForm.rateAnak6)}
                      onChange={(e) => setBuyerForm({ ...buyerForm, rateAnak6: parseRupiahInput(e.target.value) })}
                      className="w-full p-2 bg-white border border-slate-300 rounded-xl font-bold outline-none focus:border-indigo-400"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-600 mb-1">Anak Size 8:</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="0"
                      value={formatRupiahInput(buyerForm.rateAnak8)}
                      onChange={(e) => setBuyerForm({ ...buyerForm, rateAnak8: parseRupiahInput(e.target.value) })}
                      className="w-full p-2 bg-white border border-slate-300 rounded-xl font-bold outline-none focus:border-indigo-400"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-600 mb-1">Anak Size 10:</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="0"
                      value={formatRupiahInput(buyerForm.rateAnak10)}
                      onChange={(e) => setBuyerForm({ ...buyerForm, rateAnak10: parseRupiahInput(e.target.value) })}
                      className="w-full p-2 bg-white border border-slate-300 rounded-xl font-bold outline-none focus:border-indigo-400"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-600 mb-1">Anak Size 12:</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="0"
                      value={formatRupiahInput(buyerForm.rateAnak12)}
                      onChange={(e) => setBuyerForm({ ...buyerForm, rateAnak12: parseRupiahInput(e.target.value) })}
                      className="w-full p-2 bg-white border border-slate-300 rounded-xl font-bold outline-none focus:border-indigo-400"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-600 mb-1">Anak Size 14:</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="0"
                      value={formatRupiahInput(buyerForm.rateAnak14)}
                      onChange={(e) => setBuyerForm({ ...buyerForm, rateAnak14: parseRupiahInput(e.target.value) })}
                      className="w-full p-2 bg-white border border-slate-300 rounded-xl font-bold outline-none focus:border-indigo-400"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-600 mb-1">Anak Size 16:</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="0"
                      value={formatRupiahInput(buyerForm.rateAnak16)}
                      onChange={(e) => setBuyerForm({ ...buyerForm, rateAnak16: parseRupiahInput(e.target.value) })}
                      className="w-full p-2 bg-white border border-slate-300 rounded-xl font-bold outline-none focus:border-indigo-400"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsBuyerModalOpen(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition"
                >
                  Simpan Matriks
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
