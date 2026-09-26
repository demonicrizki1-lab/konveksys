import React, { useState, useMemo } from 'react';
import {
  Coins,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  Scissors,
  Layers,
  Sparkles,
  Trash2,
  PackageCheck,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  AlertCircle,
  Building2,
  CreditCard,
  ShoppingBag,
  Image as ImageIcon,
  Download,
  X,
  Eye,
  Calendar,
  FileText,
  Landmark,
  ArrowRight,
  Edit2,
  Printer,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { FobDownPayment, FobDepositStatus } from '../../types';
import { FobDepositModal } from './FobDepositModal';
import { FobReceiveFabricModal } from './FobReceiveFabricModal';
import { FobMaterialProcurementModal } from './FobMaterialProcurementModal';
import { formatDateIndo } from '../../utils/formatters';

interface FobDepositTabProps {
  searchTerm: string;
  setSearchTerm: (s: string) => void;
  brandFilter: string;
  setBrandFilter: (b: string) => void;
}

export const FobDepositTab: React.FC<FobDepositTabProps> = ({
  searchTerm,
  setSearchTerm,
  brandFilter,
  setBrandFilter,
}) => {
  const {
    fobDeposits,
    addFobDeposit,
    updateFobDeposit,
    deleteFobDeposit,
    receiveFabricFromFobDeposit,
    fobOrders,
    brands,
    userRole,
    activeBrand,
  } = useApp();

  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Modal States
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [receiveModalDeposit, setReceiveModalDeposit] = useState<FobDownPayment | null>(null);
  const [procurementModalDeposit, setProcurementModalDeposit] = useState<FobDownPayment | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<{ url: string; title: string } | null>(null);

  const formatRp = (num: number) => 'Rp ' + (num || 0).toLocaleString('id-ID');

  // Filtered deposits
  const filteredDeposits = useMemo(() => {
    return fobDeposits.filter((dep) => {
      const effectiveBrand = userRole === 'BRAND' ? activeBrand : brandFilter;
      const matchBrand = effectiveBrand === 'ALL' || dep.brand.trim().toUpperCase() === effectiveBrand.trim().toUpperCase();
      const matchStatus = statusFilter === 'ALL' || dep.statusBahan === statusFilter;
      const matchSearch =
        dep.depositNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        dep.poNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        dep.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (dep.keterangan && dep.keterangan.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (dep.nomorReferensi && dep.nomorReferensi.toLowerCase().includes(searchTerm.toLowerCase()));

      return matchBrand && matchStatus && matchSearch;
    });
  }, [fobDeposits, userRole, activeBrand, brandFilter, statusFilter, searchTerm]);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const totalPages = Math.max(1, Math.ceil(filteredDeposits.length / itemsPerPage));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * itemsPerPage;
  const paginatedDeposits = filteredDeposits.slice(startIndex, startIndex + itemsPerPage);

  // Agregasi Finansial Ringkasan Berbasis Real Cost Pengadaan Bahan & Direct Payment Toko
  const totalNilaiKontrakPo = filteredDeposits.reduce((acc, d) => {
    return acc + Number(d.totalNilaiPo || d.nominalTotalOrder || 0);
  }, 0);

  const totalBelanjaBahanToko = filteredDeposits.reduce((acc, d) => {
    if (d.rincianBahan && d.rincianBahan.length > 0) {
      return acc + d.rincianBahan.reduce((sub, it) => sub + (it.subtotal || 0), 0);
    }
    return acc + Number(d.nominalDp || 0);
  }, 0);

  const totalSisaHakJasaCmt = Math.max(0, totalNilaiKontrakPo - totalBelanjaBahanToko);

  const getStatusBadge = (status: FobDepositStatus, itemsCount: number = 0, allTransferred: boolean = false) => {
    if (status === 'SUDAH_JADI_KAIN') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 font-bold rounded-full text-[10px] border border-emerald-200 whitespace-nowrap">
          <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-600" />
          <span>Bahan Lengkap di Gudang</span>
        </span>
      );
    }

    if (allTransferred && itemsCount > 0) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-700 font-bold rounded-full text-[10px] border border-blue-200 whitespace-nowrap">
          <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-blue-600" />
          <span>Lunas Ditransfer ke Toko</span>
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 text-amber-700 font-bold rounded-full text-[10px] border border-amber-200 whitespace-nowrap">
        <Clock className="w-3.5 h-3.5 shrink-0 text-amber-600" />
        <span>Menunggu Transfer Buyer</span>
      </span>
    );
  };

  const handleSaveDeposit = async (
    depositData: Omit<FobDownPayment, 'id' | 'depositNumber' | 'createdAt'>,
    syncToFinance: boolean
  ) => {
    await addFobDeposit(depositData, syncToFinance);
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-150">
      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Card 1: Nilai Total Kontrak PO */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Total Nilai Kontrak PO (FOB)</span>
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <FileText className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-0.5 tabular-nums">{formatRp(totalNilaiKontrakPo)}</div>
          <p className="text-xs text-slate-400">Dari {filteredDeposits.length} PO FOB aktif</p>
        </div>

        {/* Card 2: Belanja Bahan Toko (Kain + Aksesoris) */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Belanja Bahan Toko (Kain & Trims)</span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <ShoppingBag className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-amber-700 mt-0.5 tabular-nums">{formatRp(totalBelanjaBahanToko)}</div>
          <p className="text-xs text-slate-400">
            Ditransfer langsung oleh buyer ke rekening toko supplier
          </p>
        </div>

        {/* Card 3: Estimasi Hak Jasa Konveksi (CMT) */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Estimasi Hak Jasa Konveksi (CMT)</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Scissors className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-emerald-700 mt-0.5 tabular-nums">
            {formatRp(totalSisaHakJasaCmt)}
          </div>
          <p className="text-xs text-slate-400">Sisa hak jasa (ditagih saat kirim barang jadi)</p>
        </div>
      </div>

      {/* Filter & Action Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:bg-white focus:border-indigo-500 outline-none"
          >
            <option value="ALL">Semua Status Pengadaan</option>
            <option value="BELUM_DIBELANJAKAN">Menunggu Transfer Buyer ke Toko</option>
            <option value="SEBAGIAN_DIBELANJAKAN">Sebagian / Sudah Ditransfer ke Toko</option>
            <option value="SUDAH_JADI_KAIN">Bahan Sudah Lengkap di Gudang</option>
          </select>
        </div>

        {userRole === 'ADMIN' && (
          <button
            onClick={() => setIsDepositModalOpen(true)}
            className="w-full sm:w-auto px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-sm flex items-center justify-center gap-1.5 transition-all shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            + Catat Pengadaan Bahan PO (FOB)
          </button>
        )}
      </div>

      {/* Tabel Daftar Pengadaan Bahan FOB */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <colgroup>
              <col className="w-[15%] min-w-[160px]" />
              <col className="w-[20%] min-w-[190px]" />
              <col className="w-[14%] min-w-[130px]" />
              <col className="w-[18%] min-w-[180px]" />
              <col className="w-[13%] min-w-[130px]" />
              <col className="w-[10%] min-w-[110px]" />
              <col className="w-[10%] min-w-[110px]" />
            </colgroup>
            <thead>
              <tr className="bg-slate-50/90 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">No. Pengadaan & Tgl</th>
                <th className="py-3 px-4">Buyer & PO Rujukan</th>
                <th className="py-3 px-4 text-right">Nilai Total PO</th>
                <th className="py-3 px-4">Rincian Belanja Bahan</th>
                <th className="py-3 px-4">Transfer Buyer ke Toko</th>
                <th className="py-3 px-4">Fisik di Gudang</th>
                <th className="py-3 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {paginatedDeposits.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <ShoppingBag className="w-10 h-10 mx-auto text-slate-300 mb-2 stroke-1" />
                    Belum ada data pengadaan bahan PO FOB yang sesuai dengan filter.
                  </td>
                </tr>
              ) : (
                paginatedDeposits.map((dep) => {
                  const hasRol = dep.alokasiKain && dep.alokasiKain.rolCodes && dep.alokasiKain.rolCodes.length > 0;
                  const poList = dep.poNumbers && dep.poNumbers.length > 0
                    ? dep.poNumbers
                    : (dep.poNumber ? dep.poNumber.split(',').map((s) => s.trim()).filter(Boolean) : []);

                  const totalOrder = Number(dep.nominalTotalOrder || dep.totalNilaiPo || 0);

                  const rincian = dep.rincianBahan || [];
                  const subtotalKain = rincian.filter((i) => i.kategori === 'KAIN').reduce((a, b) => a + (b.subtotal || 0), 0);
                  const subtotalTrims = rincian.filter((i) => i.kategori === 'AKSESORIS').reduce((a, b) => a + (b.subtotal || 0), 0);
                  const totalBahan = rincian.length > 0 ? (subtotalKain + subtotalTrims) : Number(dep.nominalDp || 0);

                  const allTransferred = rincian.length > 0 && rincian.every((i) => i.statusBayarBuyer === 'SUDAH_DITRANSFER');
                  const pendingTfCount = rincian.filter((i) => i.statusBayarBuyer === 'BELUM_DITRANSFER').length;

                  return (
                    <tr key={dep.id} className="hover:bg-indigo-50/20 transition-colors">
                      {/* No Bukti & Tgl */}
                      <td className="py-3 px-4 align-top whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-slate-800 font-mono text-xs tracking-tight">
                            {dep.depositNumber}
                          </span>
                          {dep.buktiBayarUrl && (
                            <button
                              type="button"
                              onClick={() => setReceiptPreview({ url: dep.buktiBayarUrl!, title: dep.depositNumber })}
                              title="Lihat Struk Bukti Transfer"
                              className="p-1 rounded bg-indigo-50 text-indigo-600 hover:bg-indigo-100 hover:text-indigo-800 transition cursor-pointer shrink-0"
                            >
                              <ImageIcon className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-1 font-medium">
                          <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{formatDateIndo(dep.tanggalBayar)}</span>
                        </div>
                      </td>

                      {/* Buyer & PO Rujukan */}
                      <td className="py-3 px-4 align-top">
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-bold text-slate-800 text-xs">
                              {dep.brand}
                            </span>
                            {poList.length > 1 && (
                              <span className="px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-700 font-bold text-[10px] border border-amber-200/80 shrink-0">
                                {poList.length} PO Bundel
                              </span>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-1">
                            {poList.length > 0 ? (
                              poList.map((po) => (
                                <span
                                  key={po}
                                  className="px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 font-semibold font-mono text-[10px] border border-indigo-100"
                                >
                                  {po}
                                </span>
                              ))
                            ) : (
                              <span className="text-[10px] font-mono text-slate-400 italic">Tanpa PO</span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Nilai Total PO (Master Kontrak) */}
                      <td className="py-3 px-4 text-right align-top whitespace-nowrap">
                        <div className="font-bold text-slate-900 text-xs tabular-nums">
                          {totalOrder > 0 ? formatRp(totalOrder) : '-'}
                        </div>
                        <div className="text-[10px] text-emerald-700 font-semibold mt-0.5">
                          Hak CMT: {formatRp(Math.max(0, totalOrder - totalBahan))}
                        </div>
                      </td>

                      {/* Rincian Belanja Bahan */}
                      <td className="py-3 px-4 align-top">
                        <div className="font-bold text-indigo-700 text-xs tabular-nums">
                          {formatRp(totalBahan)}
                        </div>
                        <div className="flex flex-wrap items-center gap-1 mt-1 text-[10px]">
                          {rincian.length > 0 ? (
                            <>
                              <span className="px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-700 font-semibold border border-indigo-100">
                                Kain {formatRp(subtotalKain)}
                              </span>
                              <span className="px-1.5 py-0.2 rounded bg-purple-50 text-purple-700 font-semibold border border-purple-100">
                                Trims {formatRp(subtotalTrims)}
                              </span>
                            </>
                          ) : (
                            <span className="text-slate-400 italic">Belum ada rincian item</span>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => setProcurementModalDeposit(dep)}
                          className="mt-1.5 inline-flex items-center gap-1 text-[11px] text-indigo-600 hover:text-indigo-800 font-bold hover:underline cursor-pointer"
                        >
                          <Edit2 className="w-3 h-3" />
                          <span>{rincian.length > 0 ? `Kelola (${rincian.length} Item)` : '+ Input Belanja Bahan'}</span>
                        </button>
                      </td>

                      {/* Status Transfer Buyer ke Toko */}
                      <td className="py-3 px-4 align-top whitespace-nowrap">
                        {rincian.length > 0 ? (
                          allTransferred ? (
                            <div className="space-y-1">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 font-bold rounded-full text-[10px] border border-emerald-200">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                <span>Lunas ke Toko</span>
                              </span>
                              <div className="text-[10px] text-slate-400">Seluruh toko lunas</div>
                            </div>
                          ) : (
                            <div className="space-y-1">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-700 font-bold rounded-full text-[10px] border border-amber-200">
                                <Clock className="w-3 h-3 text-amber-600" />
                                <span>{pendingTfCount} Belum Transfer</span>
                              </span>
                              <div className="text-[10px] text-slate-400">Menunggu transfer toko</div>
                            </div>
                          )
                        ) : (
                          getStatusBadge(dep.statusBahan)
                        )}
                      </td>

                      {/* Kain / Bahan di Gudang */}
                      <td className="py-3 px-4 align-top whitespace-nowrap">
                        {hasRol ? (
                          <div>
                            <div className="font-bold text-slate-800 text-xs tabular-nums">
                              {dep.alokasiKain?.totalMeter?.toLocaleString('id-ID') || 0}{' '}
                              <span className="text-[10px] text-slate-500 font-normal">m</span>
                            </div>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {dep.alokasiKain?.rolCodes.slice(0, 2).map((code) => (
                                <span
                                  key={code}
                                  className="px-1.5 py-0.5 bg-indigo-50 text-indigo-700 font-mono text-[9px] font-semibold rounded border border-indigo-200/60"
                                >
                                  {code}
                                </span>
                              ))}
                              {dep.alokasiKain && dep.alokasiKain.rolCodes.length > 2 && (
                                <span className="text-[9px] text-slate-400 font-mono">
                                  +{dep.alokasiKain.rolCodes.length - 2}
                                </span>
                              )}
                            </div>
                          </div>
                        ) : (
                          <span className="inline-block px-2 py-0.5 rounded text-[10px] text-slate-400 bg-slate-50 border border-slate-200/60 font-medium">
                            Belum ada rol
                          </span>
                        )}
                      </td>

                      {/* Aksi */}
                      <td className="py-3 px-4 text-center align-top whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          {userRole === 'ADMIN' && (
                            <>
                              <button
                                onClick={() => setProcurementModalDeposit(dep)}
                                title="Buka Rincian Belanja Bahan & Tagihan Toko"
                                className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg font-bold text-[11px] border border-indigo-200/80 flex items-center gap-1 transition-all cursor-pointer shadow-2xs hover:shadow-xs"
                              >
                                <ShoppingBag className="w-3.5 h-3.5 shrink-0" />
                                <span>Kelola Belanja</span>
                              </button>

                              <button
                                onClick={() => setReceiveModalDeposit(dep)}
                                title="Terima Kain dari DP ini ke Gudang"
                                className="p-1.5 text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                              >
                                <PackageCheck className="w-3.5 h-3.5 shrink-0" />
                              </button>

                              <button
                                onClick={() => {
                                  if (confirm(`Hapus pencatatan pengadaan ${dep.depositNumber}?`)) {
                                    deleteFobDeposit(dep.id);
                                  }
                                }}
                                title="Hapus Pengadaan"
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5 shrink-0" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>
              Menampilkan {startIndex + 1} - {Math.min(startIndex + itemsPerPage, filteredDeposits.length)} dari {filteredDeposits.length} data
            </span>
            <div className="flex items-center gap-1">
              <button
                disabled={safeCurrentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-3 font-semibold text-slate-700">
                {safeCurrentPage} / {totalPages}
              </span>
              <button
                disabled={safeCurrentPage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {isDepositModalOpen && (
        <FobDepositModal
          isOpen={isDepositModalOpen}
          onClose={() => setIsDepositModalOpen(false)}
          onSave={handleSaveDeposit}
          fobOrders={fobOrders}
          brands={brands}
          activeBrand={activeBrand}
          userRole={userRole}
        />
      )}

      {/* Modal Kelola Pengadaan Belanja Bahan (Kain & Aksesoris) */}
      {procurementModalDeposit && (
        <FobMaterialProcurementModal
          isOpen={!!procurementModalDeposit}
          deposit={procurementModalDeposit}
          onClose={() => setProcurementModalDeposit(null)}
          onUpdateDeposit={async (id, updates) => {
            await updateFobDeposit(id, updates);
            setProcurementModalDeposit((prev) => (prev ? { ...prev, ...updates } : null));
          }}
        />
      )}

      {receiveModalDeposit && (
        <FobReceiveFabricModal
          isOpen={!!receiveModalDeposit}
          deposit={receiveModalDeposit}
          onClose={() => setReceiveModalDeposit(null)}
          onReceive={receiveFabricFromFobDeposit}
        />
      )}

      {/* Lightbox Modal Bukti Transfer */}
      {receiptPreview && (
        <div
          className="fixed inset-0 z-70 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in"
          onClick={() => setReceiptPreview(null)}
        >
          <div
            className="relative max-w-2xl w-full max-h-[90vh] bg-white rounded-2xl overflow-hidden shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 bg-slate-50">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-4.5 h-4.5 text-indigo-600" />
                <div>
                  <h3 className="text-xs font-bold text-slate-800">
                    Bukti Transfer: {receiptPreview.title}
                  </h3>
                  <p className="text-[10px] text-slate-400">
                    Struk pembayaran pengadaan dari buyer ke toko
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={receiptPreview.url}
                  download={`Bukti-Transfer-${receiptPreview.title}.jpg`}
                  className="px-2.5 py-1 text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100 transition flex items-center gap-1 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Unduh</span>
                </a>
                <button
                  type="button"
                  onClick={() => setReceiptPreview(null)}
                  className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200 transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="p-4 bg-slate-900/5 flex items-center justify-center overflow-auto max-h-[78vh]">
              <img
                src={receiptPreview.url}
                alt="Bukti Transfer"
                className="max-h-[72vh] w-auto object-contain rounded-xl shadow-md"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
