import React, { useState, useMemo } from 'react';
import {
  ShoppingBag,
  Plus,
  Search,
  Filter,
  Printer,
  Edit2,
  Trash2,
  Calendar,
  Layers,
  Clock,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Coins,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import { FobPurchaseOrder, FobOrderStatus } from '../../types';
import { formatRp, formatDateIndo } from '../../utils/formatters';

interface FobOrdersTabProps {
  orders: FobPurchaseOrder[];
  onOpenCreate: () => void;
  onEditOrder: (order: FobPurchaseOrder) => void;
  onDeleteOrder: (id: string) => Promise<{ success: boolean; error?: string }>;
  onUpdateStatus: (id: string, status: string) => Promise<{ success: boolean; error?: string }>;
  onPrintOrder: (order: FobPurchaseOrder) => void;
}

export const FobOrdersTab: React.FC<FobOrdersTabProps> = ({
  orders,
  onOpenCreate,
  onEditOrder,
  onDeleteOrder,
  onUpdateStatus,
  onPrintOrder,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

  // Pagination (Default 10)
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Available brands
  const availableBrands = useMemo(() => {
    const set = new Set<string>();
    orders.forEach((o) => {
      if (o.brand) set.add(o.brand);
    });
    return Array.from(set);
  }, [orders]);

  // Filtered orders
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      if (selectedBrand !== 'ALL' && o.brand !== selectedBrand) return false;
      if (selectedStatus !== 'ALL' && o.status !== selectedStatus) return false;
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchPo = o.poNumber?.toLowerCase().includes(q);
        const matchId = o.internalId?.toLowerCase().includes(q);
        const matchSku = o.skuInduk?.toLowerCase().includes(q);
        const matchBrand = o.brand?.toLowerCase().includes(q);
        const matchVendor = o.vendor?.toLowerCase().includes(q);
        if (!matchPo && !matchId && !matchSku && !matchBrand && !matchVendor) return false;
      }
      return true;
    });
  }, [orders, selectedBrand, selectedStatus, searchTerm]);

  // Pagination calculations
  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / itemsPerPage));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * itemsPerPage;
  const paginatedOrders = useMemo(() => {
    return filteredOrders.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredOrders, startIndex, itemsPerPage]);

  // Metrics
  const totalOrdersCount = orders.length;
  const totalPcsCount = orders.reduce((sum, o) => sum + (Number(o.totalQty) || 0), 0);
  const totalNominalValue = orders.reduce((sum, o) => sum + (Number(o.grandTotal) || 0), 0);
  const activeOrdersCount = orders.filter((o) => o.status === 'DISETUJUI' || o.status === 'PROSES').length;

  const getStatusBadge = (status: FobOrderStatus) => {
    switch (status) {
      case 'DISETUJUI':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'PROSES':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'SELESAI':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'BATAL':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'DRAF':
      default:
        return 'bg-amber-50 text-amber-700 border-amber-200';
    }
  };

  const calculateDaysRemaining = (targetDateStr?: string | null) => {
    if (!targetDateStr) return null;
    const target = new Date(targetDateStr);
    const now = new Date();
    const diffTime = target.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* 1. KPI SUMMARY CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Card 1: Total PO */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Total PO Masuk</div>
            <div className="text-2xl font-black text-slate-900 mt-1">{totalOrdersCount} PO</div>
            <div className="text-[11px] text-slate-400 mt-0.5">{activeOrdersCount} PO Aktif / Berjalan</div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
            <ShoppingBag className="w-6 h-6" />
          </div>
        </div>

        {/* Card 2: Total Qty */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Total Volume Pcs</div>
            <div className="text-2xl font-black text-slate-900 mt-1">{totalPcsCount.toLocaleString('id-ID')} Pcs</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Seluruh pesanan deal FOB</div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
            <Layers className="w-6 h-6" />
          </div>
        </div>

        {/* Card 3: Total Nilai Deal */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Total Nilai Kontrak PO</div>
            <div className="text-2xl font-black text-indigo-900 mt-1">{formatRp(totalNominalValue)}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Grand Total Pembelian SKU Brand</div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 shrink-0">
            <Coins className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* 2. FILTER & ACTION CONTROLS */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Cari nomor PO, SKU, Brand, Vendor, atau PIC..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Filter Brand */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 text-xs">
              <span className="text-slate-500 font-medium">Brand:</span>
              <select
                value={selectedBrand}
                onChange={(e) => {
                  setSelectedBrand(e.target.value);
                  setCurrentPage(1);
                }}
                className="bg-transparent font-bold text-slate-800 focus:outline-hidden cursor-pointer"
              >
                <option value="ALL">Semua Brand</option>
                {availableBrands.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>

            {/* Filter Status */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 text-xs">
              <span className="text-slate-500 font-medium">Status:</span>
              <select
                value={selectedStatus}
                onChange={(e) => {
                  setSelectedStatus(e.target.value);
                  setCurrentPage(1);
                }}
                className="bg-transparent font-bold text-slate-800 focus:outline-hidden cursor-pointer"
              >
                <option value="ALL">Semua Status</option>
                <option value="DRAF">DRAF</option>
                <option value="DISETUJUI">DISETUJUI (Deal)</option>
                <option value="PROSES">PROSES PRODUKSI</option>
                <option value="SELESAI">SELESAI</option>
                <option value="BATAL">DIBATALKAN</option>
              </select>
            </div>

            {/* Tombol Buat PO */}
            <button
              onClick={onOpenCreate}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs shadow-indigo-200 transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Input PO Brand</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. ORDERS TABLE */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4 w-10 text-center">No</th>
                <th className="py-3 px-4">No. PO & Internal ID</th>
                <th className="py-3 px-4">Brand & Vendor</th>
                <th className="py-3 px-4">SKU / Produk & Varian</th>
                <th className="py-3 px-4 text-center">Total Qty</th>
                <th className="py-3 px-4 text-right">Nilai Kontrak (PO)</th>
                <th className="py-3 px-4 text-center">Target Tiba / Deadline</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center w-28">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedOrders.length > 0 ? (
                paginatedOrders.map((order, idx) => {
                  const daysRemaining = calculateDaysRemaining(order.targetTiba);

                  return (
                    <tr key={order.id || idx} className="hover:bg-slate-50/70 transition">
                      <td className="py-3 px-4 text-center text-slate-400 font-medium">
                        {startIndex + idx + 1}
                      </td>

                      {/* No PO */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 flex items-center gap-1.5">
                          <span>{order.poNumber}</span>
                          {order.prioritas === 'TINGGI' && (
                            <span className="text-[9px] font-black px-1.5 py-0.2 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                              URGENT
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                          <span>ID: {order.internalId || '-'}</span>
                          <span>• PIC: {order.pic || '-'}</span>
                        </div>
                      </td>

                      {/* Brand & Vendor */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-indigo-900">{order.brand}</div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                          <span>CMT:</span>
                          <span className="font-medium text-slate-700">{order.vendor}</span>
                        </div>
                      </td>

                      {/* SKU & Items */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">{order.skuInduk}</div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {order.items?.length || 0} kombinasi varian warna & size
                        </div>
                      </td>

                      {/* Total Qty */}
                      <td className="py-3 px-4 text-center">
                        <div className="font-black text-slate-900">{order.totalQty} Pcs</div>
                        <div className="text-[10.5px] text-slate-400">
                          @ {formatRp(order.hargaRataRata)}
                        </div>
                      </td>

                      {/* Grand Total */}
                      <td className="py-3 px-4 text-right">
                        <div className="font-black text-slate-900 text-sm">
                          {formatRp(order.grandTotal)}
                        </div>
                        {order.biayaLain > 0 && (
                          <div className="text-[10px] text-slate-400">
                            + Biaya Lain: {formatRp(order.biayaLain)}
                          </div>
                        )}
                      </td>

                      {/* Deadline */}
                      <td className="py-3 px-4 text-center">
                        <div className="font-medium text-slate-800">
                          {order.targetTiba ? formatDateIndo(order.targetTiba) : '-'}
                        </div>
                        {daysRemaining !== null && (
                          <div className="mt-1">
                            {daysRemaining > 3 ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                Sisa {daysRemaining} Hari
                              </span>
                            ) : daysRemaining >= 0 ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                Sisa {daysRemaining} Hari (Mepet)
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                                Lewat {Math.abs(daysRemaining)} Hari
                              </span>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4 text-center">
                        <select
                          value={order.status}
                          onChange={(e) => onUpdateStatus(order.id, e.target.value)}
                          className={`text-[10.5px] font-bold px-2.5 py-1 rounded-full border focus:outline-hidden cursor-pointer ${getStatusBadge(
                            order.status
                          )}`}
                        >
                          <option value="DRAF">DRAF</option>
                          <option value="DISETUJUI">DISETUJUI</option>
                          <option value="PROSES">PROSES PRODUKSI</option>
                          <option value="SELESAI">SELESAI</option>
                          <option value="BATAL">BATAL</option>
                        </select>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => onPrintOrder(order)}
                            className="p-1.5 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition cursor-pointer"
                            title="Cetak Purchase Order (A4 / PDF)"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onEditOrder(order)}
                            className="p-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition cursor-pointer"
                            title="Edit Data PO"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={async () => {
                              if (confirm(`Apakah Anda yakin ingin menghapus PO ${order.poNumber}?`)) {
                                await onDeleteOrder(order.id);
                              }
                            }}
                            className="p-1.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 transition cursor-pointer"
                            title="Hapus PO"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <ShoppingBag className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <div className="font-semibold">Belum ada dokumen Order Masuk (PO Brand)</div>
                    <div className="text-[11px] mt-1">
                      Klik tombol "+ Input PO Brand Baru" di atas untuk mencatat pesanan resmi dari brand.
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION FOOTER */}
        {filteredOrders.length > 0 && (
          <div className="px-4 py-3 border-t border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-slate-500">Tampilkan:</span>
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="bg-white border border-slate-200 rounded px-2 py-1 text-xs font-semibold text-slate-800"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
              <span className="text-slate-500">
                dari <strong>{filteredOrders.length}</strong> total data
              </span>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={safeCurrentPage === 1}
                className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 transition cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-3 py-1 font-bold text-slate-700">
                Halaman {safeCurrentPage} dari {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={safeCurrentPage === totalPages}
                className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 transition cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

    </div>
  );
};
