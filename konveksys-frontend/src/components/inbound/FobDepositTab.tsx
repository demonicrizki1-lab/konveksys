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
  Banknote,
  PackageCheck,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  AlertCircle,
  Building2,
  CreditCard,
  ArrowUpRight,
  ShoppingBag,
  Image as ImageIcon,
  Download,
  X,
  Eye,
  Calendar,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { FobDownPayment, FobDepositStatus } from '../../types';
import { FobDepositModal } from './FobDepositModal';
import { FobReceiveFabricModal } from './FobReceiveFabricModal';
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
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
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

  // Quick Stats
  const totalNominalDp = filteredDeposits.reduce((acc, d) => acc + d.nominalDp, 0);
  const belumBelanjaNominal = filteredDeposits
    .filter((d) => d.statusBahan === 'BELUM_DIBELANJAKAN')
    .reduce((acc, d) => acc + d.nominalDp, 0);
  const totalMeterKainFob = filteredDeposits.reduce((acc, d) => acc + (d.alokasiKain?.totalMeter || 0), 0);

  const getStatusBadge = (status: FobDepositStatus) => {
    switch (status) {
      case 'BELUM_DIBELANJAKAN':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 text-amber-700 font-bold rounded-full text-[10px] border border-amber-200/80 whitespace-nowrap">
            <Clock className="w-3.5 h-3.5 shrink-0 text-amber-500" />
            <span>Belum Belanja</span>
          </span>
        );
      case 'SEBAGIAN_DIBELANJAKAN':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 text-blue-700 font-bold rounded-full text-[10px] border border-blue-200/80 whitespace-nowrap">
            <Layers className="w-3.5 h-3.5 shrink-0 text-blue-500" />
            <span>Sebagian Kain</span>
          </span>
        );
      case 'SUDAH_JADI_KAIN':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-700 font-bold rounded-full text-[10px] border border-emerald-200/80 whitespace-nowrap">
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-500" />
            <span>Kain di Gudang</span>
          </span>
        );
    }
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
        {/* Card 1: Total DP Masuk */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Total DP FOB Masuk</span>
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Coins className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-0.5">{formatRp(totalNominalDp)}</div>
          <p className="text-xs text-slate-400">Dari {filteredDeposits.length} transaksi penerimaan DP</p>
        </div>

        {/* Card 2: DP Belum Dibelanjakan */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Dana Kas Mengendap (Belum Belanja)</span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-amber-700 mt-0.5">{formatRp(belumBelanjaNominal)}</div>
          <p className="text-xs text-slate-400">
            {filteredDeposits.filter((d) => d.statusBahan === 'BELUM_DIBELANJAKAN').length} PO siap dibelikan bahan
          </p>
        </div>

        {/* Card 3: Kain Tiba dari DP */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Kain Fisik Masuk Gudang (FOB)</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Scissors className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-emerald-700 mt-0.5">
            {totalMeterKainFob.toLocaleString('id-ID')}{' '}
            <span className="text-sm font-semibold text-slate-500">m</span>
          </div>
          <p className="text-xs text-slate-400">Telah dikonversi & siap dipotong di SPK</p>
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
            <option value="ALL">Semua Status Bahan</option>
            <option value="BELUM_DIBELANJAKAN">Dana Belum Dibelanjakan</option>
            <option value="SEBAGIAN_DIBELANJAKAN">Sebagian Jadi Kain</option>
            <option value="SUDAH_JADI_KAIN">Kain Sudah di Gudang</option>
          </select>
        </div>

        {userRole === 'ADMIN' && (
          <button
            onClick={() => setIsDepositModalOpen(true)}
            className="w-full sm:w-auto px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-sm flex items-center justify-center gap-1.5 transition-all shrink-0"
          >
            <Plus className="w-4 h-4" />
            + Catat DP Uang Masuk (FOB)
          </button>
        )}
      </div>

      {/* Tabel Daftar DP FOB */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <colgroup>
              <col className="w-[17%] min-w-[180px]" />
              <col className="w-[23%] min-w-[210px]" />
              <col className="w-[13%] min-w-[130px]" />
              <col className="w-[13%] min-w-[140px]" />
              <col className="w-[12%] min-w-[130px]" />
              <col className="w-[10%] min-w-[120px]" />
              <col className="w-[6%] min-w-[95px]" />
              <col className="w-[6%] min-w-[115px]" />
            </colgroup>
            <thead>
              <tr className="bg-slate-50/90 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">No. Bukti DP & Tgl</th>
                <th className="py-3 px-4">Buyer & PO Rujukan</th>
                <th className="py-3 px-4 text-right">Nilai Total PO</th>
                <th className="py-3 px-4 text-right">Nominal DP (% DP)</th>
                <th className="py-3 px-4">Metode Bayar</th>
                <th className="py-3 px-4">Status Pengadaan</th>
                <th className="py-3 px-4">Kain di Gudang</th>
                <th className="py-3 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {paginatedDeposits.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <Coins className="w-10 h-10 mx-auto text-slate-300 mb-2 stroke-1" />
                    Belum ada data penerimaan DP Uang FOB yang sesuai dengan filter.
                  </td>
                </tr>
              ) : (
                paginatedDeposits.map((dep) => {
                  const hasRol = dep.alokasiKain && dep.alokasiKain.rolCodes && dep.alokasiKain.rolCodes.length > 0;
                  const poList = dep.poNumbers && dep.poNumbers.length > 0
                    ? dep.poNumbers
                    : (dep.poNumber ? dep.poNumber.split(',').map((s) => s.trim()).filter(Boolean) : []);

                  // Fallback kalkulasi total order: nominalTotalOrder -> totalNilaiPo -> estimasi dari DP % -> 0
                  const totalOrder = Number(
                    dep.nominalTotalOrder ||
                    dep.totalNilaiPo ||
                    (dep.persentaseDp > 0 && dep.nominalDp > 0 ? Math.round(dep.nominalDp / (dep.persentaseDp / 100)) : 0)
                  );

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
                              title="Lihat Bukti Transfer"
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

                      {/* Nilai Total PO */}
                      <td className="py-3 px-4 text-right align-top whitespace-nowrap">
                        <div className="font-bold text-slate-800 text-xs tabular-nums">
                          {totalOrder > 0 ? formatRp(totalOrder) : '-'}
                        </div>
                        {poList.length > 1 && (
                          <div className="text-[10px] text-slate-400 font-medium mt-0.5">
                            Akumulasi {poList.length} PO
                          </div>
                        )}
                      </td>

                      {/* Nominal DP & % */}
                      <td className="py-3 px-4 text-right align-top whitespace-nowrap">
                        <div className="font-bold text-emerald-700 text-xs tabular-nums">{formatRp(dep.nominalDp)}</div>
                        <div className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[10px] border border-emerald-200/80">
                          <span>{dep.persentaseDp}% DP</span>
                        </div>
                      </td>

                      {/* Metode Bayar */}
                      <td className="py-3 px-4 align-top">
                        <div className="font-semibold text-slate-700 flex items-center gap-1.5 text-xs whitespace-nowrap">
                          <CreditCard className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{dep.metodePembayaran}</span>
                        </div>
                        <div className="text-[11px] text-slate-500 truncate max-w-[140px] mt-0.5">
                          {dep.bankTujuan || 'Kas Operasional'}
                        </div>
                        {dep.nomorReferensi && (
                          <div className="text-[10px] font-mono text-slate-400 truncate max-w-[140px]">
                            Ref: {dep.nomorReferensi}
                          </div>
                        )}
                        {dep.buktiBayarUrl && (
                          <button
                            type="button"
                            onClick={() => setReceiptPreview({ url: dep.buktiBayarUrl!, title: dep.depositNumber })}
                            className="mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 hover:bg-indigo-100 text-[10px] font-bold border border-indigo-200/60 transition cursor-pointer"
                          >
                            <ImageIcon className="w-3 h-3 text-indigo-500 shrink-0" />
                            <span>Lihat Struk</span>
                          </button>
                        )}
                      </td>

                      {/* Status Bahan */}
                      <td className="py-3 px-4 align-top whitespace-nowrap">
                        {getStatusBadge(dep.statusBahan)}
                      </td>

                      {/* Kain Tiba */}
                      <td className="py-3 px-4 align-top whitespace-nowrap">
                        {hasRol ? (
                          <div>
                            <div className="font-bold text-slate-800 text-xs tabular-nums">
                              {dep.alokasiKain?.totalMeter?.toLocaleString('id-ID') || 0}{' '}
                              <span className="text-[10px] text-slate-500 font-normal">m</span>
                            </div>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {dep.alokasiKain?.rolCodes.map((code) => (
                                <span
                                  key={code}
                                  className="px-1.5 py-0.5 bg-indigo-50 text-indigo-700 font-mono text-[9px] font-semibold rounded border border-indigo-200/60"
                                >
                                  {code}
                                </span>
                              ))}
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
                                onClick={() => setReceiveModalDeposit(dep)}
                                title="Terima Kain dari DP ini ke Gudang"
                                className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg font-bold text-[11px] border border-emerald-200/80 flex items-center gap-1 transition-all cursor-pointer shadow-2xs hover:shadow-xs"
                              >
                                <PackageCheck className="w-3.5 h-3.5 shrink-0" />
                                <span>Terima Kain</span>
                              </button>

                              <button
                                onClick={() => {
                                  if (confirm(`Hapus pencatatan DP ${dep.depositNumber}?`)) {
                                    deleteFobDeposit(dep.id);
                                  }
                                }}
                                title="Hapus DP"
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
              Menampilkan {startIndex + 1} - {Math.min(startIndex + itemsPerPage, filteredDeposits.length)} dari {filteredDeposits.length} data DP
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
                    Bukti Transfer / Struk: {receiptPreview.title}
                  </h3>
                  <p className="text-[10px] text-slate-400">
                    Bukti pembayaran down payment dari buyer
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
