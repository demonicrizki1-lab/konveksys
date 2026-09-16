import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { SPKCutting, SPKProductItem, SizeBreakdown, VendorFabricDeposit } from '../../types';
import { formatDateIndo } from '../../utils/formatters';
import { ConfirmModal } from '../common/ConfirmModal';
import {
  Scissors,
  Plus,
  Search,
  Layers,
  X,
  Eye,
  ShieldAlert,
  Trash2,
  Package,
  CheckCircle2,
  ArrowRightLeft,
  Check,
  Info,
} from 'lucide-react';

interface ProductFormItem {
  id: string;
  produk: string;
  vendor: string;
  targetCut: SizeBreakdown;
}

const emptySizeBreakdown: SizeBreakdown = {
  s: 0,
  m: 0,
  l: 0,
  xl: 0,
  xxl: 0,
  anak4: 0,
  anak6: 0,
  anak8: 0,
  anak10: 0,
  anak12: 0,
  anak14: 0,
  anak16: 0,
};

export const SPKView: React.FC = () => {
  const { spkList, createSPK, deleteSPK, inboundRolls, brands, vendors, getSPKRemainingQty, userRole, vendorFabricDeposits } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [brandFilter, setBrandFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modal State for New SPK
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    spk?: SPKCutting;
    isBlocked?: boolean;
    blockMessage?: string;
  }>({ isOpen: false });
  const [isDeleting, setIsDeleting] = useState(false);

  // Fabric Source & Selection State
  const [fabricSourceType, setFabricSourceType] = useState<'ROLL_GUDANG' | 'TITIPAN_VENDOR'>('ROLL_GUDANG');
  const [selectedDepositId, setSelectedDepositId] = useState<string | null>(null);
  const [depositVendorFilter, setDepositVendorFilter] = useState<string>('');

  const [selectedBrand, setSelectedBrand] = useState(brands[0]?.name || 'GREYWOLF');
  const [selectedRollIds, setSelectedRollIds] = useState<string[]>([]);
  const [productItems, setProductItems] = useState<ProductFormItem[]>([
    {
      id: 'prod-1',
      produk: '',
      vendor: vendors[0]?.name || 'SAHIRA',
      targetCut: { ...emptySizeBreakdown },
    },
  ]);
  const [activeProductTab, setActiveProductTab] = useState(0);
  const [targetSelesai, setTargetSelesai] = useState(
    new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [catatan, setCatatan] = useState('');

  // Detail Modal State
  const [selectedSPKDetail, setSelectedSPKDetail] = useState<SPKCutting | null>(null);
  const [activeDetailTab, setActiveDetailTab] = useState(0);

  // Available rolls in warehouse for selected Brand
  const availableRolls = inboundRolls.filter(
    (r) => r.brand === selectedBrand && r.status === 'DI_GUDANG'
  );

  // Available fabric deposits (filtered by vendor if selected)
  const availableDeposits = vendorFabricDeposits.filter(
    (d) =>
      d.status === 'TERSEDIA' &&
      d.panjangSisa > 0 &&
      (!depositVendorFilter || d.targetVendor === depositVendorFilter)
  );

  const selectedDeposit = vendorFabricDeposits.find((d) => d.id === selectedDepositId);

  const totalPooledMeters = inboundRolls
    .filter((r) => selectedRollIds.includes(r.id))
    .reduce((a, b) => a + (b.meterLength - b.meterUsed), 0);

  // Calculate sum of a single product item
  const getItemTotalPcs = (cut: SizeBreakdown) =>
    (cut.s || 0) +
    (cut.m || 0) +
    (cut.l || 0) +
    (cut.xl || 0) +
    (cut.xxl || 0) +
    (cut.anak4 || 0) +
    (cut.anak6 || 0) +
    (cut.anak8 || 0) +
    (cut.anak10 || 0) +
    (cut.anak12 || 0) +
    (cut.anak14 || 0) +
    (cut.anak16 || 0);

  // Grand Total of all products
  const grandTotalPcs = productItems.reduce(
    (acc, it) => acc + getItemTotalPcs(it.targetCut),
    0
  );

  const filteredSPK = spkList.filter((spk) => {
    const matchBrand = brandFilter === 'ALL' || spk.brand === brandFilter;
    const matchStatus = statusFilter === 'ALL' || spk.status === statusFilter;
    const matchSearch =
      spk.spkNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      spk.produk.toLowerCase().includes(searchTerm.toLowerCase()) ||
      spk.vendor.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (spk.depositInfo?.jenisKain && spk.depositInfo.jenisKain.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (spk.depositInfo?.sourceVendor && spk.depositInfo.sourceVendor.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (spk.items && spk.items.some((it) => it.produk.toLowerCase().includes(searchTerm.toLowerCase())));
    return matchBrand && matchStatus && matchSearch;
  });

  const handleOpenCreate = () => {
    const initBrand = brands[0]?.name || 'GREYWOLF';
    const initVendor = vendors[0]?.name || 'SAHIRA';
    setFabricSourceType('ROLL_GUDANG');
    setSelectedDepositId(null);
    setDepositVendorFilter(initVendor);
    setSelectedBrand(initBrand);
    setSelectedRollIds([]);
    setProductItems([
      {
        id: `prod-${Date.now()}-1`,
        produk: '',
        vendor: initVendor,
        targetCut: { ...emptySizeBreakdown },
      },
    ]);
    setActiveProductTab(0);
    setCatatan('');
    setTargetSelesai(new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
    setIsCreateModalOpen(true);
  };

  const handleSelectDeposit = (deposit: VendorFabricDeposit) => {
    setSelectedDepositId(deposit.id);
    if (deposit.brand) {
      setSelectedBrand(deposit.brand);
    }
    // Update vendor pada artikel produk agar otomatis diarahkan ke vendor lokasi kain dititipkan
    setProductItems((prev) =>
      prev.map((it) => ({
        ...it,
        vendor: deposit.targetVendor,
      }))
    );
  };

  const toggleRollSelection = (rollId: string) => {
    setSelectedRollIds((prev) =>
      prev.includes(rollId) ? prev.filter((id) => id !== rollId) : [...prev, rollId]
    );
  };

  const addProductItem = () => {
    if (productItems.length >= 3) {
      alert('Maksimal 3 produk per SPK kain.');
      return;
    }
    const newIdx = productItems.length + 1;
    const defaultVendor = selectedDeposit
      ? selectedDeposit.targetVendor
      : productItems[0]?.vendor || vendors[0]?.name || 'SAHIRA';
    const newItem: ProductFormItem = {
      id: `prod-${Date.now()}-${newIdx}`,
      produk: '',
      vendor: defaultVendor,
      targetCut: { ...emptySizeBreakdown },
    };
    setProductItems((prev) => [...prev, newItem]);
    setActiveProductTab(productItems.length);
  };

  const removeProductItem = (index: number) => {
    if (productItems.length <= 1) {
      alert('Minimal harus ada 1 produk dalam SPK.');
      return;
    }
    const updated = productItems.filter((_, idx) => idx !== index);
    setProductItems(updated);
    setActiveProductTab(Math.min(activeProductTab, updated.length - 1));
  };

  const updateProductItem = (
    index: number,
    field: keyof ProductFormItem,
    value: any
  ) => {
    setProductItems((prev) =>
      prev.map((item, idx) => (idx === index ? { ...item, [field]: value } : item))
    );
  };

  const updateProductSize = (
    itemIndex: number,
    sizeKey: keyof SizeBreakdown,
    value: number
  ) => {
    setProductItems((prev) =>
      prev.map((item, idx) =>
        idx === itemIndex
          ? {
              ...item,
              targetCut: {
                ...item.targetCut,
                [sizeKey]: Math.max(0, value || 0),
              },
            }
          : item
      )
    );
  };

  const handleSaveSPK = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validasi pemilihan bahan kain
    if (fabricSourceType === 'ROLL_GUDANG') {
      if (selectedRollIds.length === 0) {
        alert('Pilih minimal 1 rol kain untuk di-pool ke dalam SPK ini!');
        return;
      }
    } else {
      if (!selectedDepositId) {
        alert('Pilih salah satu saldo kain titipan yang akan dicutting!');
        return;
      }
    }

    // Validasi setiap produk item
    for (let i = 0; i < productItems.length; i++) {
      const item = productItems[i];
      if (!item.produk.trim()) {
        alert(`Nama Produk #${i + 1} wajib diisi!`);
        setActiveProductTab(i);
        return;
      }
      const itemTotal = getItemTotalPcs(item.targetCut);
      if (itemTotal <= 0) {
        alert(`Kuantiti potong untuk Produk #${i + 1} (${item.produk}) harus lebih dari 0!`);
        setActiveProductTab(i);
        return;
      }
    }

    // Bangun kombinasi targetCutQty
    const combinedTargetCut: SizeBreakdown = { ...emptySizeBreakdown };
    productItems.forEach((it) => {
      (Object.keys(emptySizeBreakdown) as (keyof SizeBreakdown)[]).forEach((sz) => {
        combinedTargetCut[sz] += it.targetCut[sz] || 0;
      });
    });

    const produkSummary = productItems
      .map((it) => it.produk.trim().toUpperCase())
      .join(' + ');

    const vendorSummary = Array.from(
      new Set(productItems.map((it) => it.vendor))
    ).join(', ');

    const itemsPayload: SPKProductItem[] = productItems.map((it, idx) => ({
      id: `item-${Date.now()}-${idx + 1}`,
      produk: it.produk.trim().toUpperCase(),
      vendor: it.vendor,
      targetCutQty: { ...it.targetCut },
      deliveredQty: { ...emptySizeBreakdown },
    }));

    const chosenDep = fabricSourceType === 'TITIPAN_VENDOR' ? selectedDeposit : null;

    const payload = {
      brand: chosenDep ? chosenDep.brand : selectedBrand,
      produk: produkSummary,
      vendor: vendorSummary,
      rollIds: fabricSourceType === 'ROLL_GUDANG' ? [...selectedRollIds] : [],
      targetCutQty: combinedTargetCut,
      tanggalSPK: new Date().toISOString().split('T')[0],
      targetSelesai,
      catatan,
      items: itemsPayload,
      fabricSourceType,
      depositId: chosenDep ? chosenDep.id : null,
      depositInfo: chosenDep
        ? {
            depositNumber: chosenDep.sourcePONumber ? `DEP-${chosenDep.sourcePONumber}` : undefined,
            sourceVendor: chosenDep.sourceVendor,
            targetVendor: chosenDep.targetVendor,
            jenisKain: chosenDep.jenisKain,
            warna: chosenDep.warna || null,
            panjang: chosenDep.panjangSisa,
            satuan: chosenDep.satuan,
            sourcePONumber: chosenDep.sourcePONumber,
          }
        : null,
    };

    setIsCreateModalOpen(false);

    try {
      await createSPK(payload);
    } catch {
      alert('Gagal membuat SPK');
      setIsCreateModalOpen(true);
    }
  };

  const handleDeleteSPK = (spk: SPKCutting) => {
    setDeleteModal({
      isOpen: true,
      spk,
      isBlocked: false,
    });
  };

  const executeDeleteSPK = async () => {
    if (!deleteModal.spk) return;
    setIsDeleting(true);
    try {
      const res = await deleteSPK(deleteModal.spk.id);
      if (!res.success) {
        setDeleteModal({
          isOpen: true,
          spk: deleteModal.spk,
          isBlocked: true,
          blockMessage: res.message || 'Gagal menghapus SPK.',
        });
      } else {
        setDeleteModal({ isOpen: false });
      }
    } finally {
      setIsDeleting(false);
    }
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

  const currentActiveProduct = productItems[activeProductTab] || productItems[0];
  const currentItemTotalPcs = getItemTotalPcs(currentActiveProduct.targetCut);

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
            <h1 className="text-xl font-bold text-slate-900">Surat Perintah Kerja (SPK) Potong</h1>
            <p className="text-slate-500 text-xs mt-1">
              Penggabungan rol kain (*Smart Pooling*) dan alokasi potong 1 hingga maksimal 3 produk/artikel per batch kain.
            </p>
          </div>

          <button
            onClick={handleOpenCreate}
            className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-4 py-2.5 rounded-lg flex items-center gap-1.5 shadow-sm transition-base btn-press shrink-0 cursor-pointer"
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
              placeholder="Cari nomor SPK, nama produk, atau vendor penjahit..."
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
              <option value="OVER_DELIVERY">Over Delivery</option>
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
            const isOverDelivery = spk.status === 'OVER_DELIVERY' || (targetTotal > 0 && delivTotal > targetTotal);
            const isCompleted = spk.status === 'COMPLETED' || (targetTotal > 0 && delivTotal === targetTotal);
            const displayStatus = isOverDelivery
              ? 'OVER_DELIVERY'
              : isCompleted
              ? 'COMPLETED'
              : delivTotal > 0
              ? 'PARTIAL_DELIVERED'
              : spk.status;

            const hasMultipleProducts = spk.items && spk.items.length > 1;

            return (
              <div
                key={spk.id}
                className="bg-white rounded-xl p-5 sm:p-6 border border-slate-200 shadow-sm hover:shadow-md transition space-y-4"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono font-bold text-slate-900 text-base">{spk.spkNumber}</span>
                      <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-700 font-bold rounded-md text-[10px]">
                        {spk.brand}
                      </span>
                      {spk.fabricSourceType === 'TITIPAN_VENDOR' ? (
                        <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-700 font-bold rounded-md text-[10px] border border-indigo-200">
                          Sisa Kain Konveksi {spk.depositInfo?.sourceVendor ? `(ex-${spk.depositInfo.sourceVendor})` : ''}
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 bg-slate-100 text-slate-700 font-bold rounded-md text-[10px]">
                          Rol Gudang
                        </span>
                      )}
                      {hasMultipleProducts && (
                        <span className="px-2 py-0.5 bg-purple-50 text-purple-700 font-bold rounded-md text-[10px] border border-purple-200">
                          {spk.items?.length} Produk Combo
                        </span>
                      )}
                    </div>
                    <h3 className="font-semibold text-slate-800 text-sm mt-1">{spk.produk}</h3>
                  </div>

                  <span
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${
                      isOverDelivery
                        ? 'bg-amber-100 text-amber-900 border border-amber-300'
                        : isCompleted
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        : delivTotal > 0
                        ? 'bg-amber-100 text-amber-800 border border-amber-200'
                        : 'bg-blue-100 text-blue-800 border border-blue-200'
                    }`}
                  >
                    {displayStatus}
                  </span>
                </div>

                {/* Multi-product Breakdown Badges */}
                {hasMultipleProducts && spk.items && (
                  <div className="space-y-1.5 bg-indigo-50/50 p-3 rounded-xl border border-indigo-100/60">
                    <span className="text-[10px] font-bold text-indigo-900 uppercase tracking-wider block">
                      Rincian Produk Hasil Potong Kain Ini:
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {spk.items.map((it, idx) => {
                        const itTarget = Object.values(it.targetCutQty).reduce((a, b) => a + b, 0);
                        const itDeliv = Object.values(it.deliveredQty || {}).reduce((a, b) => a + b, 0);
                        return (
                          <div
                            key={it.id || idx}
                            className="bg-white p-2 rounded-lg border border-indigo-100 flex items-center justify-between text-xs"
                          >
                            <div>
                              <div className="font-bold text-slate-800 flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-indigo-600"></span>
                                {it.produk}
                              </div>
                              <div className="text-[10px] text-slate-500">Penjahit: {it.vendor}</div>
                            </div>
                            <div className="text-right">
                              <span className="font-bold text-indigo-600 text-xs">
                                {itDeliv} / {itTarget} Pcs
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2 text-xs text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-semibold">Vendor Utama:</span>
                    <strong className="text-slate-800">{spk.vendor}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-semibold">Sumber Kain:</span>
                    {spk.fabricSourceType === 'TITIPAN_VENDOR' ? (
                      <strong className="text-indigo-900 font-bold truncate block" title={spk.depositInfo ? `${spk.depositInfo.panjang} ${spk.depositInfo.satuan} (${spk.depositInfo.jenisKain})` : 'Sisa Kain Konveksi'}>
                        {spk.depositInfo ? `${spk.depositInfo.panjang} ${spk.depositInfo.satuan} ${spk.depositInfo.jenisKain}` : 'Sisa Kain Konveksi'}
                      </strong>
                    ) : (
                      <strong className="text-slate-800">{spk.rollIds?.length || 0} Rol Kain</strong>
                    )}
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
                    <span className="text-slate-600">Total Akumulasi Pengiriman:</span>
                    <span className={isOverDelivery ? 'text-amber-700 font-extrabold' : 'text-indigo-600'}>
                      {delivTotal} / {targetTotal} Pcs ({percent}%) {isOverDelivery && `(+${delivTotal - targetTotal} Pcs Over)`}
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 ${
                        isOverDelivery ? 'bg-amber-500' : percent >= 100 ? 'bg-emerald-500' : 'bg-indigo-600'
                      }`}
                      style={{ width: `${Math.min(100, percent)}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>
                      {isOverDelivery ? (
                        <span className="text-amber-700 font-bold">Over-Kirim: +{delivTotal - targetTotal} Pcs</span>
                      ) : (
                        <span>
                          Sisa Total di Konveksi: <strong>{remaining.totalRemaining} Pcs</strong>
                        </span>
                      )}
                    </span>
                    {spk.catatan && <span className="truncate max-w-[200px]">Note: {spk.catatan}</span>}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  {userRole === 'ADMIN' ? (
                    <button
                      onClick={() => handleDeleteSPK(spk)}
                      className="px-2.5 py-1.5 text-rose-600 hover:text-rose-700 hover:bg-rose-50 font-semibold rounded-lg text-xs flex items-center gap-1.5 transition border border-rose-200 btn-press"
                      title="Hapus SPK ini"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Hapus SPK
                    </button>
                  ) : (
                    <div></div>
                  )}

                  <button
                    onClick={() => {
                      setSelectedSPKDetail(spk);
                      setActiveDetailTab(0);
                    }}
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

      {/* MODAL: Tambah SPK Baru (Multi-Product Combo) */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 max-h-[92vh] overflow-y-auto shadow-2xl border border-slate-100 space-y-5 animate-slideUp">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Terbitkan SPK Cutting Baru</h3>
                <p className="text-[11px] text-slate-400">
                  Smart Pooling Rol Kain & Alokasi Multi-Produk (Maksimal 3 Produk dari 1 Kain)
                </p>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSPK} className="space-y-5 text-xs">
              {/* Pilihan Sumber Bahan Kain */}
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">
                  Pilih Sumber Bahan Kain untuk SPK Cutting Ini:
                </label>
                <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1.5 rounded-xl border border-slate-200">
                  <button
                    type="button"
                    onClick={() => {
                      setFabricSourceType('ROLL_GUDANG');
                      setSelectedDepositId(null);
                    }}
                    className={`py-2.5 px-3 rounded-lg font-bold text-xs transition cursor-pointer text-center ${
                      fabricSourceType === 'ROLL_GUDANG'
                        ? 'bg-white text-indigo-700 shadow-sm border border-slate-200/80'
                        : 'text-slate-600 hover:text-slate-900 font-semibold'
                    }`}
                  >
                    Rol Kain Gudang Pusat
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setFabricSourceType('TITIPAN_VENDOR');
                      setSelectedRollIds([]);
                      if (!depositVendorFilter && vendors.length > 0) {
                        setDepositVendorFilter(vendors[0].name);
                      }
                    }}
                    className={`py-2.5 px-3 rounded-lg font-bold text-xs transition cursor-pointer flex items-center justify-center gap-2 ${
                      fabricSourceType === 'TITIPAN_VENDOR'
                        ? 'bg-white text-indigo-700 shadow-sm border border-slate-200/80'
                        : 'text-slate-600 hover:text-slate-900 font-semibold'
                    }`}
                  >
                    <span>Sisa Kain Konveksi</span>
                    {vendorFabricDeposits.filter((d) => d.status === 'TERSEDIA' && d.panjangSisa > 0).length > 0 && (
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          fabricSourceType === 'TITIPAN_VENDOR'
                            ? 'bg-indigo-100 text-indigo-700'
                            : 'bg-slate-200 text-slate-600'
                        }`}
                      >
                        {vendorFabricDeposits.filter((d) => d.status === 'TERSEDIA' && d.panjangSisa > 0).length}
                      </span>
                    )}
                  </button>
                </div>
              </div>

              {/* TAMPILAN JIKA SUMBER: ROL GUDANG PUSAT */}
              {fabricSourceType === 'ROLL_GUDANG' && (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-600 mb-1">Pilih Brand Pemilik Kain:</label>
                      <select
                        value={selectedBrand}
                        onChange={(e) => {
                          setSelectedBrand(e.target.value);
                          setSelectedRollIds([]);
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
                      <label className="block font-bold text-slate-600 mb-1">Target Selesai Jahit:</label>
                      <input
                        type="date"
                        value={targetSelesai}
                        onChange={(e) => setTargetSelesai(e.target.value)}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold outline-none"
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
                </>
              )}

              {/* TAMPILAN JIKA SUMBER: SISA KAIN KONVEKSI */}
              {fabricSourceType === 'TITIPAN_VENDOR' && (
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Pilih Konveksi Lokasi Sisa Kain:
                      </label>
                      <select
                        value={depositVendorFilter}
                        onChange={(e) => {
                          setDepositVendorFilter(e.target.value);
                          setSelectedDepositId(null);
                        }}
                        className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-bold text-slate-800 focus:border-indigo-500 outline-none"
                      >
                        <option value="">Semua Konveksi</option>
                        {vendors.map((v) => (
                          <option key={v.id} value={v.name}>
                            {v.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Target Selesai Jahit:</label>
                      <input
                        type="date"
                        value={targetSelesai}
                        onChange={(e) => setTargetSelesai(e.target.value)}
                        className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-bold text-slate-800 focus:border-indigo-500 outline-none"
                        required
                      />
                    </div>
                  </div>

                  {/* List Saldo Sisa Kain */}
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                      <span className="font-bold text-slate-800 text-xs">
                        Pilih Sisa Kain yang Akan Dicutting ({availableDeposits.length} Tersedia)
                      </span>
                    </div>

                    {availableDeposits.length === 0 ? (
                      <div className="p-4 bg-white rounded-xl border border-slate-200 text-center space-y-2">
                        <Info className="w-8 h-8 text-slate-400 mx-auto" />
                        <p className="text-slate-800 font-semibold text-xs">
                          Tidak ada sisa kain yang berstatus &quot;TERSEDIA&quot;{' '}
                          {depositVendorFilter ? `di ${depositVendorFilter}` : ''}.
                        </p>
                        <p className="text-[11px] text-slate-500 max-w-md mx-auto">
                          Untuk mencatat sisa bahan kain yang dipindah ke konveksi ini, gunakan tombol transfer di menu{' '}
                          <strong>PO Produksi &gt; Saldo Titipan Bahan</strong>.
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-48 overflow-y-auto pr-1">
                        {availableDeposits.map((dep) => {
                          const isSelected = selectedDepositId === dep.id;
                          return (
                            <div
                              key={dep.id}
                              onClick={() => handleSelectDeposit(dep)}
                              className={`p-3 rounded-xl border cursor-pointer transition flex flex-col justify-between gap-2 shadow-sm ${
                                isSelected
                                  ? 'bg-indigo-50/80 border-indigo-600 ring-2 ring-indigo-500/20'
                                  : 'bg-white text-slate-700 border-slate-200 hover:border-indigo-300 hover:bg-slate-50/50'
                              }`}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <div className="font-bold text-xs flex items-center gap-1.5 text-slate-900">
                                    <span>{dep.jenisKain}</span>
                                    {dep.warna && (
                                      <span className="text-[10px] px-2 py-0.5 rounded-md font-semibold bg-slate-100 text-slate-600 border border-slate-200/60">
                                        {dep.warna}
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-[10px] text-slate-500 mt-1">
                                    Asal: <strong className="text-slate-700">Konveksi {dep.sourceVendor}</strong>
                                    {dep.sourcePONumber && ` (PO: ${dep.sourcePONumber})`}
                                  </div>
                                </div>
                                <span
                                  className={`font-black text-xs px-2.5 py-1 rounded-lg shrink-0 ${
                                    isSelected
                                      ? 'bg-indigo-600 text-white'
                                      : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                                  }`}
                                >
                                  {dep.panjangSisa} {dep.satuan}
                                </span>
                              </div>

                              <div className="flex items-center justify-between text-[10px] pt-1.5 border-t border-slate-100 text-slate-500">
                                <span>Brand: <strong className="text-slate-800">{dep.brand}</strong></span>
                                <span>Lokasi: <strong className="text-slate-800">{dep.targetVendor}</strong></span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {selectedDeposit && (
                      <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2.5 text-xs text-emerald-900">
                        <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                        <div>
                          <strong>Kain Siap Potong:</strong> {selectedDeposit.panjangSisa} {selectedDeposit.satuan} {selectedDeposit.jenisKain} {selectedDeposit.warna ? `(${selectedDeposit.warna})` : ''} di <strong>Konveksi {selectedDeposit.targetVendor}</strong> (Brand: {selectedDeposit.brand}). Silakan input rincian artikel dan target size potong di bawah.
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Multi-Product Builder Section */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
                  <div>
                    <span className="font-bold text-slate-900 text-xs block">
                      Daftar Produk yang Dipotong dari Kain Ini (Maks. 3 Produk):
                    </span>
                    <span className="text-[10px] text-slate-500">
                      Gunakan fitur ini jika 1 gelaran kain menghasilkan beberapa artikel berbeda (misal: Atasan + Bawahan + Perca).
                    </span>
                  </div>

                  {productItems.length < 3 && (
                    <button
                      type="button"
                      onClick={addProductItem}
                      className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-bold rounded-lg text-xs flex items-center gap-1 transition shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Tambah Produk ({productItems.length + 1}/3)
                    </button>
                  )}
                </div>

                {/* Product Tabs Header */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  {productItems.map((item, idx) => {
                    const isActive = activeProductTab === idx;
                    const itemPcs = getItemTotalPcs(item.targetCut);
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setActiveProductTab(idx)}
                        className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 border shrink-0 ${
                          isActive
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <Package className="w-3.5 h-3.5" />
                        <span>
                          {idx === 0 ? '1. Produk Utama' : `${idx + 1}. Produk #${idx + 1}`}
                          {item.produk ? `: ${item.produk}` : ''}
                        </span>
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                            isActive ? 'bg-indigo-700 text-white' : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {itemPcs} Pcs
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Active Product Form Tab */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <span className="font-bold text-slate-800 text-xs">
                      Pengaturan Artikel #{activeProductTab + 1}:
                    </span>

                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg">
                        Subtotal: {currentItemTotalPcs} Pcs
                      </span>
                      {productItems.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeProductItem(activeProductTab)}
                          className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg text-xs font-bold flex items-center gap-1 transition"
                          title="Hapus produk ini dari SPK"
                        >
                          <Trash2 className="w-3 h-3" />
                          Hapus Artikel Ini
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-600 mb-1">
                        Nama Produk / Artikel #{activeProductTab + 1}:
                      </label>
                      <input
                        type="text"
                        value={currentActiveProduct.produk}
                        onChange={(e) =>
                          updateProductItem(activeProductTab, 'produk', e.target.value.toUpperCase())
                        }
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold outline-none uppercase"
                        placeholder={
                          activeProductTab === 0
                            ? 'Contoh: KEMEJA RAYON ANAK'
                            : activeProductTab === 1
                            ? 'Contoh: CELANA KULOT RAYON'
                            : 'Contoh: BANDANA / POUCH KAIN'
                        }
                        required
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-600 mb-1">
                        Mitra Konveksi (Vendor Penjahit):
                      </label>
                      <select
                        value={currentActiveProduct.vendor}
                        onChange={(e) =>
                          updateProductItem(activeProductTab, 'vendor', e.target.value)
                        }
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold outline-none"
                      >
                        {vendors.map((v) => (
                          <option key={v.id} value={v.name}>
                            {v.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Size Breakdown per Product */}
                  <div className="space-y-3 pt-2">
                    {/* Ukuran Anak Seri Huruf */}
                    <div>
                      <span className="text-[10px] font-bold text-indigo-900 uppercase tracking-wider block mb-1.5">
                        Ukuran Anak - Seri Huruf (S - 2XL):
                      </span>
                      <div className="grid grid-cols-5 gap-2">
                        {(['s', 'm', 'l', 'xl', 'xxl'] as (keyof SizeBreakdown)[]).map((sz) => (
                          <div key={sz}>
                            <label className="text-[10px] font-bold text-slate-500 block text-center uppercase">
                              {sz}
                            </label>
                            <input
                              type="number"
                              min="0"
                              value={currentActiveProduct.targetCut[sz]}
                              onFocus={(e) => e.target.select()}
                              onChange={(e) =>
                                updateProductSize(activeProductTab, sz, Number(e.target.value))
                              }
                              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-center focus:border-indigo-400 outline-none"
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Ukuran Anak Seri Angka */}
                    <div>
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                        Ukuran Anak - Seri Angka (Size 4 - 16):
                      </span>
                      <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5">
                        {(['anak4', 'anak6', 'anak8', 'anak10', 'anak12', 'anak14', 'anak16'] as (keyof SizeBreakdown)[]).map(
                          (sz) => (
                            <div key={sz}>
                              <label className="text-[10px] font-bold text-slate-500 block text-center">
                                {sz.replace('anak', 'Anak ')}
                              </label>
                              <input
                                type="number"
                                min="0"
                                value={currentActiveProduct.targetCut[sz]}
                                onFocus={(e) => e.target.select()}
                                onChange={(e) =>
                                  updateProductSize(activeProductTab, sz, Number(e.target.value))
                                }
                                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-center focus:border-indigo-400 outline-none"
                              />
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Grand Total Summary Bar */}
                <div className="bg-indigo-900 text-white p-3.5 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="text-xs font-bold">
                      Akumulasi Hasil Potong Seluruh Produk ({productItems.length} Artikel):
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-xs text-indigo-200">
                      {productItems.map((p, idx) => (
                        <span key={p.id} className="mr-2">
                          {p.produk || `Produk #${idx + 1}`}: <strong>{getItemTotalPcs(p.targetCut)} Pcs</strong>
                        </span>
                      ))}
                    </div>
                    <span className="bg-white text-indigo-950 px-3 py-1 rounded-lg font-black text-sm shrink-0">
                      Total: {grandTotalPcs} Pcs
                    </span>
                  </div>
                </div>
              </div>

              {/* Catatan Khusus */}
              <div>
                <label className="block font-bold text-slate-600 mb-1">Catatan Khusus SPK Potong / Penjahit:</label>
                <input
                  type="text"
                  placeholder="Instruksi pola, warna benang, kancing, label, packaging..."
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
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition cursor-pointer"
                >
                  Simpan & Terbitkan SPK ({grandTotalPcs} Pcs)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Detail SPK (Multi-Product Inspection) */}
      {selectedSPKDetail && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-100 space-y-5 animate-slideUp max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-base">{selectedSPKDetail.spkNumber}</h3>
                <span className="text-xs text-slate-500">
                  {selectedSPKDetail.produk} ({selectedSPKDetail.brand})
                </span>
              </div>
              <button
                onClick={() => setSelectedSPKDetail(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Rol Kain yang Di-Pool atau Sisa Kain Konveksi */}
              {selectedSPKDetail.fabricSourceType === 'TITIPAN_VENDOR' ? (
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 text-xs">
                      Sumber Bahan: Sisa Kain Konveksi
                    </span>
                    <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200">
                      {selectedSPKDetail.depositInfo?.panjang} {selectedSPKDetail.depositInfo?.satuan}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs pt-1">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-semibold">Kain & Warna:</span>
                      <span className="font-bold text-slate-800">
                        {selectedSPKDetail.depositInfo?.jenisKain}{' '}
                        {selectedSPKDetail.depositInfo?.warna ? `(${selectedSPKDetail.depositInfo.warna})` : ''}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-semibold">Konveksi Asal Kain:</span>
                      <span className="font-bold text-slate-800">Konveksi {selectedSPKDetail.depositInfo?.sourceVendor || '-'}</span>
                      {selectedSPKDetail.depositInfo?.sourcePONumber && (
                        <span className="text-[10px] text-slate-500 block font-mono">
                          PO: {selectedSPKDetail.depositInfo.sourcePONumber}
                        </span>
                      )}
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-semibold">Konveksi Penjahit / Potong:</span>
                      <span className="font-bold text-slate-800">
                        Konveksi {selectedSPKDetail.depositInfo?.targetVendor || selectedSPKDetail.vendor}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                  <span className="font-bold text-slate-700 block mb-2">Rol Kain yang Di-Pool:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedSPKDetail.rollIds && selectedSPKDetail.rollIds.length > 0 ? (
                      selectedSPKDetail.rollIds.map((id) => {
                        const r = inboundRolls.find((item) => item.id === id);
                        return (
                          <span
                            key={id}
                            className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg font-mono font-bold text-indigo-700"
                          >
                            {r?.rollCode || id} ({r?.meterLength}m - {r?.jenisKain})
                          </span>
                        );
                      })
                    ) : (
                      <span className="text-slate-400 italic">Tidak ada rol gudang terhubung</span>
                    )}
                  </div>
                </div>
              )}

              {/* Multi-product tab or table */}
              {selectedSPKDetail.items && selectedSPKDetail.items.length > 1 ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 border-b border-slate-200 pb-1">
                    {selectedSPKDetail.items.map((item, idx) => (
                      <button
                        key={item.id || idx}
                        onClick={() => setActiveDetailTab(idx)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition border ${
                          activeDetailTab === idx
                            ? 'bg-indigo-600 text-white border-indigo-600'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {item.produk} ({item.vendor})
                      </button>
                    ))}
                  </div>

                  {(() => {
                    const currentDetailItem =
                      selectedSPKDetail.items[activeDetailTab] || selectedSPKDetail.items[0];
                    const itemRemaining = getSPKRemainingQty(
                      selectedSPKDetail,
                      currentDetailItem.id
                    );

                    return (
                      <div className="border border-slate-200 rounded-xl overflow-hidden">
                        <div className="bg-slate-100 px-3 py-2 font-bold text-slate-800 flex justify-between">
                          <span>
                            Artikel: <strong>{currentDetailItem.produk}</strong> (Mitra:{' '}
                            {currentDetailItem.vendor})
                          </span>
                        </div>
                        <table className="w-full text-center text-xs">
                          <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                            <tr>
                              <th className="p-2 text-left pl-3">Size</th>
                              <th className="p-2">Target Potong</th>
                              <th className="p-2">Terkirim (SJ)</th>
                              <th className="p-2 text-indigo-600">Sisa di Vendor</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {(['s', 'm', 'l', 'xl', 'xxl', 'anak4', 'anak6', 'anak8', 'anak10', 'anak12', 'anak14', 'anak16'] as (keyof SizeBreakdown)[]).map(
                              (sz) => {
                                const target = currentDetailItem.targetCutQty[sz] || 0;
                                const deliv = currentDetailItem.deliveredQty?.[sz] || 0;
                                const rem = itemRemaining[sz] || 0;
                                if (target === 0 && deliv === 0) return null;

                                return (
                                  <tr key={sz}>
                                    <td className="p-2 text-left pl-3 font-bold uppercase">
                                      {sz.replace('anak', 'Anak ')}
                                    </td>
                                    <td className="p-2 font-semibold text-slate-700">{target} Pcs</td>
                                    <td className="p-2 font-bold text-emerald-600">{deliv} Pcs</td>
                                    <td className="p-2 font-bold text-indigo-600">{rem} Pcs</td>
                                  </tr>
                                );
                              }
                            )}
                          </tbody>
                        </table>
                      </div>
                    );
                  })()}
                </div>
              ) : (
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-center text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                      <tr>
                        <th className="p-2 text-left pl-3">Size</th>
                        <th className="p-2">Target Potong</th>
                        <th className="p-2">Terkirim (SJ)</th>
                        <th className="p-2 text-indigo-600">Sisa di Vendor</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {(['s', 'm', 'l', 'xl', 'xxl', 'anak4', 'anak6', 'anak8', 'anak10', 'anak12', 'anak14', 'anak16'] as (keyof SizeBreakdown)[]).map(
                        (sz) => {
                          const target = selectedSPKDetail.targetCutQty[sz] || 0;
                          const deliv = selectedSPKDetail.deliveredQty[sz] || 0;
                          const rem = Math.max(0, target - deliv);
                          if (target === 0 && deliv === 0) return null;

                          return (
                            <tr key={sz}>
                              <td className="p-2 text-left pl-3 font-bold uppercase">
                                {sz.replace('anak', 'Anak ')}
                              </td>
                              <td className="p-2 font-semibold text-slate-700">{target} Pcs</td>
                              <td className="p-2 font-bold text-emerald-600">{deliv} Pcs</td>
                              <td className="p-2 font-bold text-indigo-600">{rem} Pcs</td>
                            </tr>
                          );
                        }
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <button
              onClick={() => setSelectedSPKDetail(null)}
              className="w-full py-2.5 bg-slate-900 text-white font-bold rounded-xl text-xs hover:bg-slate-800 transition cursor-pointer"
            >
              Tutup
            </button>
          </div>
        </div>
      )}

      {/* MODAL: Konfirmasi / Peringatan Hapus SPK */}
      <ConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false })}
        onConfirm={deleteModal.isBlocked ? undefined : executeDeleteSPK}
        title={deleteModal.isBlocked ? 'Gagal Menghapus SPK' : 'Hapus SPK Cutting?'}
        variant={deleteModal.isBlocked ? 'warning' : 'danger'}
        confirmText="Ya, Hapus SPK"
        cancelText="Batal"
        isLoading={isDeleting}
        message={
          deleteModal.isBlocked ? (
            deleteModal.blockMessage
          ) : deleteModal.spk ? (
            <span>
              Apakah Anda yakin ingin menghapus SPK{' '}
              <strong className="text-slate-900 font-mono">{deleteModal.spk.spkNumber}</strong>{' '}
              ({deleteModal.spk.produk} - {deleteModal.spk.brand})?
            </span>
          ) : (
            'Apakah Anda yakin ingin menghapus SPK ini?'
          )
        }
        note={
          deleteModal.isBlocked
            ? undefined
            : "Kain rol yang di-pool akan otomatis dikembalikan ke status 'Di Gudang'."
        }
      />
    </div>
  );
};
