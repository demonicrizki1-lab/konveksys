import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  Printer,
  Download,
  FileSpreadsheet,
  X,
  Package,
  Layers,
  Shield,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
import { HPPCalculationRecord } from '../../types';
import { formatRp, formatDateIndo } from '../../utils/formatters';

interface FobDatabaseTabProps {
  records: HPPCalculationRecord[];
  onEdit: (record: HPPCalculationRecord) => void;
  onDelete: (id: string) => Promise<{ success: boolean; error?: string }>;
  onPrintSingle: (record: HPPCalculationRecord) => void;
  onOpenRekapPrint: () => void;
  onSyncPending?: () => Promise<{ syncedCount: number; remainingCount: number }>;
}

export const FobDatabaseTab: React.FC<FobDatabaseTabProps> = ({
  records,
  onEdit,
  onDelete,
  onPrintSingle,
  onOpenRekapPrint,
  onSyncPending,
}) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedKategori, setSelectedKategori] = useState<string>('ALL');
  const [selectedSize, setSelectedSize] = useState<string>('ALL');

  // Detail Modal State
  const [detailRecord, setDetailRecord] = useState<HPPCalculationRecord | null>(null);

  // Delete Confirmation State
  const [deleteTarget, setDeleteTarget] = useState<HPPCalculationRecord | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // Pending Offline Sync State
  const pendingRecords = records.filter(r => r.isPendingSync || r.id.startsWith('hpp-') || r.id.startsWith('hpp-local-'));
  const hasPending = pendingRecords.length > 0;
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncFeedback, setSyncFeedback] = useState<{ type: 'success' | 'warning' | 'error'; message: string } | null>(null);

  const handleSyncClick = async () => {
    if (!onSyncPending || isSyncing) return;
    setIsSyncing(true);
    setSyncFeedback(null);
    try {
      const res = await onSyncPending();
      if (res.syncedCount > 0) {
        setSyncFeedback({
          type: 'success',
          message: `Berhasil menyinkronkan ${res.syncedCount} kalkulasi HPP ke database server!`,
        });
      } else if (res.remainingCount > 0) {
        setSyncFeedback({
          type: 'warning',
          message: `Database server belum dapat dihubungi. ${res.remainingCount} draf offline tetap aman tersimpan di browser ini.`,
        });
      }
    } catch {
      setSyncFeedback({
        type: 'error',
        message: 'Gagal menghubungi server database saat mencoba sinkronisasi.',
      });
    } finally {
      setIsSyncing(false);
    }
  };

  // Filter logic
  const filtered = records.filter(r => {
    if (selectedKategori !== 'ALL' && r.kategori !== selectedKategori) return false;
    if (selectedSize !== 'ALL' && r.size !== selectedSize) return false;
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const matchNo = r.noHpp?.toLowerCase().includes(q);
      const matchNama = r.namaProduk?.toLowerCase().includes(q);
      const matchBrand = r.brand?.toLowerCase().includes(q);
      const matchKode = r.kodeProduk?.toLowerCase().includes(q);
      if (!matchNo && !matchNama && !matchBrand && !matchKode) return false;
    }
    return true;
  });

  const categories = Array.from(new Set(records.map(r => r.kategori).filter(Boolean)));
  const sizes = Array.from(new Set(records.map(r => r.size).filter(Boolean)));

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    await onDelete(deleteTarget.id);
    setIsDeleting(false);
    setDeleteTarget(null);
  };

  return (
    <div className="space-y-4">

      {/* PENDING OFFLINE SYNC BANNER */}
      {hasPending && (
        <div className="bg-amber-50 border border-amber-300 rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-start sm:items-center gap-2.5">
            <div className="p-2 bg-amber-100 rounded-xl text-amber-800 shrink-0 mt-0.5 sm:mt-0">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-amber-900 flex items-center gap-2">
                <span>Terdapat {pendingRecords.length} Kalkulasi HPP Tersimpan Offline</span>
                <span className="px-2 py-0.5 bg-amber-200/80 text-amber-900 rounded-full text-[10px] font-extrabold">DRAF LOKAL</span>
              </div>
              <div className="text-amber-800/80 mt-0.5">
                Data ini tersimpan aman di browser Anda saat server tidak terhubung dan tidak akan hilang atau tertimpa.
              </div>
            </div>
          </div>
          {onSyncPending && (
            <button
              onClick={handleSyncClick}
              disabled={isSyncing}
              className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 disabled:bg-amber-400 text-white font-bold rounded-xl flex items-center justify-center gap-2 shrink-0 transition active:scale-95 cursor-pointer shadow-xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Menyinkronkan...' : 'Sinkronkan ke Server'}</span>
            </button>
          )}
        </div>
      )}

      {/* SYNC FEEDBACK ALERT */}
      {syncFeedback && (
        <div
          className={`p-3 rounded-xl border text-xs flex items-center justify-between gap-2 animate-fadeIn ${
            syncFeedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : syncFeedback.type === 'warning'
              ? 'bg-amber-50 border-amber-200 text-amber-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {syncFeedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            )}
            <span>{syncFeedback.message}</span>
          </div>
          <button
            onClick={() => setSyncFeedback(null)}
            className="text-slate-400 hover:text-slate-600 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* HEADER & FILTER TOOLBAR */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-indigo-600" />
            <span>Database Arsip Kalkulasi HPP Garment</span>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700">
              {filtered.length} dari {records.length} Record
            </span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Pencarian dan manajemen riwayat kalkulasi harga pokok per model dan varian ukuran pakaian
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={onOpenRekapPrint}
            disabled={records.length === 0}
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition active:scale-95 cursor-pointer disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Rekapitulasi PDF (Semua)</span>
          </button>
        </div>
      </div>

      {/* FILTER CONTROLS */}
      <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
        {/* Search */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Cari No HPP, Nama Produk, Brand..."
            className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        {/* Kategori Filter */}
        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <select
            value={selectedKategori}
            onChange={e => setSelectedKategori(e.target.value)}
            className="w-full py-1.5 px-2.5 rounded-lg border border-slate-200 text-slate-800 font-medium"
          >
            <option value="ALL">Semua Kategori ({records.length})</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>
                {cat} ({records.filter(r => r.kategori === cat).length})
              </option>
            ))}
          </select>
        </div>

        {/* Size Filter */}
        <div className="flex items-center gap-2">
          <Package className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <select
            value={selectedSize}
            onChange={e => setSelectedSize(e.target.value)}
            className="w-full py-1.5 px-2.5 rounded-lg border border-slate-200 text-slate-800 font-medium"
          >
            <option value="ALL">Semua Ukuran (Size)</option>
            {sizes.map(sz => (
              <option key={sz} value={sz}>
                Size {sz} ({records.filter(r => r.size === sz).length})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* DATA TABLE */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        {filtered.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs">
            <FileSpreadsheet className="w-8 h-8 mx-auto mb-2 text-slate-300" />
            <p className="font-semibold text-slate-600">Tidak ada data kalkulasi HPP ditemukan</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Coba sesuaikan kata kunci pencarian atau filter Anda</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 text-slate-700 text-[11px] uppercase font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-3.5 text-left whitespace-nowrap">No. HPP</th>
                  <th className="py-3 px-3.5 text-left min-w-[150px]">Produk & Kategori</th>
                  <th className="py-3 px-3 text-center min-w-[95px] whitespace-nowrap">Size</th>
                  <th className="py-3 px-3 text-left whitespace-nowrap">Brand / Buyer</th>
                  <th className="py-3 px-3.5 text-right whitespace-nowrap">HPP Final / Pcs</th>
                  <th className="py-3 px-3.5 text-right whitespace-nowrap">Rekomendasi FOB</th>
                  <th className="py-3 px-2.5 text-center min-w-[70px] whitespace-nowrap">Margin</th>
                  <th className="py-3 px-3 text-center whitespace-nowrap">Tanggal</th>
                  <th className="py-3 px-3.5 text-center min-w-[120px] whitespace-nowrap">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map(item => (
                  <tr key={item.id} className="hover:bg-slate-50/60 transition">
                    <td className="py-3 px-3.5 font-semibold text-indigo-700">
                      <div>{item.noHpp}</div>
                      {item.isPendingSync || item.id.startsWith('hpp-') || item.id.startsWith('hpp-local-') ? (
                        <span className="inline-flex items-center gap-1 mt-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-50 text-amber-800 border border-amber-300">
                          <AlertTriangle className="w-2.5 h-2.5 text-amber-600 shrink-0" />
                          Offline Draft
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 mt-1 px-1.5 py-0.5 rounded text-[9px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600 shrink-0" />
                          Database Server
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-3.5">
                      <div className="font-bold text-slate-900">{item.namaProduk}</div>
                      <div className="text-[10px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                        <span className="px-1.5 py-0.5 bg-slate-100 rounded">{item.kategori}</span>
                        {item.kodeProduk && <span className="text-slate-400">SKU: {item.kodeProduk}</span>}
                      </div>
                    </td>

                    <td className="py-3 px-3 text-center whitespace-nowrap">
                      <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-800 font-bold text-xs border border-indigo-100 whitespace-nowrap leading-none tracking-wide">
                        {item.size}
                      </span>
                    </td>

                    <td className="py-3 px-3 text-slate-700 font-medium">
                      {item.brand || 'UMUM'}
                    </td>

                    <td className="py-3 px-3.5 text-right font-semibold text-slate-800 tabular-nums">
                      {formatRp(item.hppFinalPerPcs)}
                    </td>

                    <td className="py-3 px-3.5 text-right font-bold text-emerald-700 text-sm tabular-nums">
                      {formatRp(item.hargaJualRekomendasi)}
                    </td>

                    <td className="py-3 px-2.5 text-center font-semibold text-slate-700 tabular-nums">
                      {item.targetLabaPercent}%
                    </td>

                    <td className="py-3 px-3 text-center text-slate-500 text-[11px]">
                      {formatDateIndo(item.tanggal)}
                    </td>

                    <td className="py-3 px-3.5 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => setDetailRecord(item)}
                          className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition cursor-pointer"
                          title="Lihat Detail Rincian HPP"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onPrintSingle(item)}
                          className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                          title="Cetak Lembar HPP"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onEdit(item)}
                          className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition cursor-pointer"
                          title="Edit Kalkulasi di Form"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(item)}
                          className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                          title="Hapus Kalkulasi"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL 1: DETAIL RINCIAN HPP */}
      {detailRecord && createPortal(
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-hidden">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
            
            {/* Header */}
            <div className="bg-slate-50 px-5 py-4 border-b border-slate-200 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-slate-900 text-sm">{detailRecord.namaProduk}</h4>
                  <span className="px-2 py-0.5 bg-indigo-100 text-indigo-800 font-bold rounded text-xs">
                    Size: {detailRecord.size}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  No. HPP: <strong className="font-semibold text-slate-800">{detailRecord.noHpp}</strong> • Tanggal: {formatDateIndo(detailRecord.tanggal)}
                </p>
              </div>
              <button
                onClick={() => setDetailRecord(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
              
              {/* Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">HPP Bahan</span>
                  <span className="font-bold text-slate-900 text-sm tabular-nums">{formatRp(detailRecord.hppBahanTotal)}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">HPP CMT & Trims</span>
                  <span className="font-bold text-slate-900 text-sm tabular-nums">{formatRp(detailRecord.hppCmtTotal)}</span>
                </div>
                <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-200">
                  <span className="text-indigo-600 text-[10px] uppercase font-bold block">HPP Final / Pcs</span>
                  <span className="font-bold text-indigo-950 text-sm tabular-nums">{formatRp(detailRecord.hppFinalPerPcs)}</span>
                </div>
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200">
                  <span className="text-emerald-700 text-[10px] uppercase font-bold block">Rekomendasi Jual</span>
                  <span className="font-bold text-emerald-800 text-sm tabular-nums">{formatRp(detailRecord.hargaJualRekomendasi)}</span>
                </div>
              </div>

              {/* Rincian Komponen */}
              <div className="space-y-2">
                <h5 className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Rincian Komponen Biaya (Bahan & Jasa)</span>
                </h5>
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-[11px] text-slate-600 font-bold uppercase">
                      <tr>
                        <th className="py-2 px-3 text-left">Komponen</th>
                        <th className="py-2 px-2.5 text-center">Jenis</th>
                        <th className="py-2 px-2.5 text-right">Pemakaian</th>
                        <th className="py-2 px-3 text-right">Tarif Satuan</th>
                        <th className="py-2 px-2.5 text-right">Waste</th>
                        <th className="py-2 px-3 text-right">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {(detailRecord.components || []).map((comp, idx) => (
                        <tr key={comp.id || idx} className="hover:bg-slate-50/50">
                          <td className="py-2 px-3 font-medium text-slate-800">
                            {comp.namaBahan}
                            {comp.supplier && <span className="text-[10px] text-slate-400 block font-normal">Supp: {comp.supplier}</span>}
                          </td>
                          <td className="py-2 px-2.5 text-center">
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold uppercase">
                              {comp.jenisBiaya.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="py-2 px-2.5 text-right font-medium tabular-nums">{comp.pemakaian} {comp.satuan}</td>
                          <td className="py-2 px-3 text-right tabular-nums">{formatRp(comp.hargaSatuan)}</td>
                          <td className="py-2 px-2.5 text-right text-slate-500 tabular-nums">{comp.wastePercent}%</td>
                          <td className="py-2 px-3 text-right font-bold text-slate-900 tabular-nums">{formatRp(comp.subtotal)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Detail Margin & Target */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2 text-xs">
                <div className="flex justify-between text-slate-700">
                  <span>Target Margin Laba:</span>
                  <span className="font-bold text-indigo-700">{detailRecord.targetLabaPercent}%</span>
                </div>
                <div className="flex justify-between text-slate-700">
                  <span>Estimasi Laba per Pcs:</span>
                  <span className="font-bold text-emerald-700 tabular-nums">{formatRp(detailRecord.labaBersihPerPcs)}</span>
                </div>
                <div className="flex justify-between text-slate-700">
                  <span>Proyeksi Laba Batch ({detailRecord.batchQty || 100} Pcs):</span>
                  <span className="font-bold text-slate-900 tabular-nums">{formatRp(detailRecord.totalLabaBatch)}</span>
                </div>
                {detailRecord.catatan && (
                  <div className="pt-2 border-t border-slate-200 text-slate-600">
                    <strong className="block text-slate-800 mb-0.5">Catatan Teknis:</strong>
                    <p>{detailRecord.catatan}</p>
                  </div>
                )}
              </div>

            </div>

            {/* Footer Modal */}
            <div className="bg-slate-50 px-5 py-3 border-t border-slate-200 flex justify-end gap-2">
              <button
                onClick={() => {
                  const target = detailRecord;
                  setDetailRecord(null);
                  onPrintSingle(target);
                }}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Cetak Lembar HPP</span>
              </button>
              <button
                onClick={() => setDetailRecord(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Tutup
              </button>
            </div>

          </div>
        </div>,
        document.body
      )}

      {/* MODAL 2: DELETE CONFIRMATION */}
      {deleteTarget && createPortal(
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-hidden">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-slate-200">
            <div className="flex items-center gap-3 text-rose-600 mb-3">
              <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-sm">Hapus Kalkulasi HPP?</h4>
                <p className="text-xs text-slate-500">Tindakan ini tidak dapat dibatalkan</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              Anda yakin ingin menghapus arsip kalkulasi <strong>{deleteTarget.noHpp}</strong> untuk produk <strong>{deleteTarget.namaProduk} (Size {deleteTarget.size})</strong>?
            </p>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setDeleteTarget(null)}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition cursor-pointer disabled:opacity-50"
              >
                {isDeleting ? 'Menghapus...' : 'Ya, Hapus'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
};
