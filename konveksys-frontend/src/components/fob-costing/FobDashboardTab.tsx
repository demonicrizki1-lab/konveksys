import React from 'react';
import {
  Calculator,
  TrendingUp,
  FileSpreadsheet,
  PlusCircle,
  FileText,
  Tag,
  Calendar,
  Layers,
  Percent,
  Coins,
  ArrowRight,
} from 'lucide-react';
import { HPPCalculationRecord } from '../../types';
import { formatRp, formatDateIndo } from '../../utils/formatters';

interface FobDashboardTabProps {
  records: HPPCalculationRecord[];
  onNavigateTab: (tabKey: 'kalkulator' | 'database' | 'penawaran' | 'master-data') => void;
  onEditRecord: (record: HPPCalculationRecord) => void;
  onPrintRecord: (record: HPPCalculationRecord) => void;
}

export const FobDashboardTab: React.FC<FobDashboardTabProps> = ({
  records,
  onNavigateTab,
  onEditRecord,
  onPrintRecord,
}) => {
  // Hitung agregat metrik
  const totalRecords = records.length;
  const avgHpp = totalRecords > 0 ? Math.round(records.reduce((acc, r) => acc + (Number(r.hppFinalPerPcs) || 0), 0) / totalRecords) : 0;
  const avgHargaJual = totalRecords > 0 ? Math.round(records.reduce((acc, r) => acc + (Number(r.hargaJualRekomendasi) || 0), 0) / totalRecords) : 0;
  const avgMargin = totalRecords > 0 ? Math.round(records.reduce((acc, r) => acc + (Number(r.targetLabaPercent) || 0), 0) / totalRecords) : 30;

  // Hitung rata-rata proporsi biaya
  const totalBahanAvg = totalRecords > 0 ? Math.round(records.reduce((acc, r) => acc + (Number(r.hppBahanTotal) || 0), 0) / totalRecords) : 60000;
  const totalCmtAvg = totalRecords > 0 ? Math.round(records.reduce((acc, r) => acc + (Number(r.hppCmtTotal) || 0), 0) / totalRecords) : 30000;
  const totalRejectAvg = totalRecords > 0 ? Math.round(records.reduce((acc, r) => acc + (Number(r.nilaiReject) || 0), 0) / totalRecords) : 2700;
  const totalProfitAvg = avgHargaJual > avgHpp ? avgHargaJual - avgHpp : 25000;
  const grandTotalKomposisi = totalBahanAvg + totalCmtAvg + totalRejectAvg + totalProfitAvg || 1;

  const pctBahan = Math.round((totalBahanAvg / grandTotalKomposisi) * 100);
  const pctCmt = Math.round((totalCmtAvg / grandTotalKomposisi) * 100);
  const pctReject = Math.round((totalRejectAvg / grandTotalKomposisi) * 100);
  const pctProfit = Math.max(0, 100 - pctBahan - pctCmt - pctReject);

  const recentRecords = records.slice(0, 5);

  return (
    <div className="space-y-6">
      
      {/* HERO BANNER & QUICK ACTIONS */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold mb-2">
            <Calculator className="w-3.5 h-3.5" />
            <span>Garment FOB Costing Engine & SPH System</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Dashboard HPP FOB & Penawaran Buyer
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl">
            Sistem kalkulasi biaya produksi garmen berbasis ukuran (*size-based costing*), cadangan *reject* kain, dan otomatisasi Surat Penawaran Harga komersial.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            onClick={() => onNavigateTab('kalkulator')}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm flex items-center gap-2 transition active:scale-95 cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Hitung HPP Baru</span>
          </button>
          <button
            onClick={() => onNavigateTab('penawaran')}
            className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-sm flex items-center gap-2 transition active:scale-95 cursor-pointer"
          >
            <FileText className="w-4 h-4" />
            <span>Buat Surat SPH</span>
          </button>
        </div>
      </div>

      {/* 4 SUMMARY METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1 */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs hover:border-indigo-300 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Kalkulasi</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2 tabular-nums">
            {totalRecords}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Model pakaian & varian size terhitung
          </p>
        </div>

        {/* Card 2 */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs hover:border-indigo-300 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Rata-rata HPP</span>
            <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center font-bold">
              <Coins className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2 tabular-nums">
            {formatRp(avgHpp)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Biaya pokok produksi per potong pakaian
          </p>
        </div>

        {/* Card 3 */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs hover:border-emerald-300 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">Rekomendasi FOB</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-emerald-700 mt-2 tabular-nums">
            {formatRp(avgHargaJual)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Rata-rata harga jual penawaran buyer
          </p>
        </div>

        {/* Card 4 */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs hover:border-indigo-300 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Rata-rata Margin</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <Percent className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-indigo-700 mt-2 tabular-nums">
            {avgMargin}%
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Rata-rata target laba bersih yang diterapkan
          </p>
        </div>

      </div>

      {/* VISUALISASI KOMPOSISI BIAYA GARMENT FOB */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-600" />
              Komposisi Biaya & Struktur Harga Jual FOB
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Distribusi proporsional antara bahan baku, CMT/sablon, cadangan reject, dan proyeksi keuntungan
            </p>
          </div>
          <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg">
            Berdasarkan data tersimpan
          </span>
        </div>

        {/* DISTRIBUTION PROGRESS BAR */}
        <div className="h-6 w-full bg-slate-100 rounded-lg overflow-hidden flex shadow-inner mb-4">
          <div
            style={{ width: `${pctBahan}%` }}
            className="bg-indigo-600 transition-all duration-500 flex items-center justify-center text-[10px] text-white font-bold"
            title={`Bahan Baku & Aksesoris: ${pctBahan}%`}
          >
            {pctBahan > 12 && `${pctBahan}%`}
          </div>
          <div
            style={{ width: `${pctCmt}%` }}
            className="bg-amber-500 transition-all duration-500 flex items-center justify-center text-[10px] text-white font-bold"
            title={`Jasa CMT & Finishing: ${pctCmt}%`}
          >
            {pctCmt > 12 && `${pctCmt}%`}
          </div>
          <div
            style={{ width: `${pctReject}%` }}
            className="bg-rose-500 transition-all duration-500 flex items-center justify-center text-[10px] text-white font-bold"
            title={`Cadangan Reject: ${pctReject}%`}
          >
            {pctReject > 6 && `${pctReject}%`}
          </div>
          <div
            style={{ width: `${pctProfit}%` }}
            className="bg-emerald-600 transition-all duration-500 flex items-center justify-center text-[10px] text-white font-bold"
            title={`Target Laba Bersih: ${pctProfit}%`}
          >
            {pctProfit > 12 && `${pctProfit}%`}
          </div>
        </div>

        {/* LEGEND BADGES */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-100 bg-slate-50/50">
            <span className="w-3.5 h-3.5 rounded-md bg-indigo-600 shrink-0"></span>
            <div>
              <span className="text-slate-500 block text-[11px]">Bahan Baku & Trims</span>
              <strong className="text-slate-900 font-bold">{pctBahan}%</strong>
              <span className="text-[11px] text-slate-400 block tabular-nums">~{formatRp(totalBahanAvg)}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-100 bg-slate-50/50">
            <span className="w-3.5 h-3.5 rounded-md bg-amber-500 shrink-0"></span>
            <div>
              <span className="text-slate-500 block text-[11px]">Jasa CMT & Sablon</span>
              <strong className="text-slate-900 font-bold">{pctCmt}%</strong>
              <span className="text-[11px] text-slate-400 block tabular-nums">~{formatRp(totalCmtAvg)}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-100 bg-slate-50/50">
            <span className="w-3.5 h-3.5 rounded-md bg-rose-500 shrink-0"></span>
            <div>
              <span className="text-slate-500 block text-[11px]">Cadangan Reject</span>
              <strong className="text-slate-900 font-bold">{pctReject}%</strong>
              <span className="text-[11px] text-slate-400 block tabular-nums">~{formatRp(totalRejectAvg)}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-100 bg-slate-50/50">
            <span className="w-3.5 h-3.5 rounded-md bg-emerald-600 shrink-0"></span>
            <div>
              <span className="text-slate-500 block text-[11px]">Target Laba Bersih</span>
              <strong className="text-emerald-700 font-bold">{pctProfit}%</strong>
              <span className="text-[11px] text-slate-400 block tabular-nums">~{formatRp(totalProfitAvg)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* RECENT ACTIVITIES TABLE */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Calendar className="w-4 h-4 text-slate-700" />
              Kalkulasi HPP Terakhir
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              5 produk pakaian terakhir yang diinput ke dalam database
            </p>
          </div>
          <button
            onClick={() => onNavigateTab('database')}
            className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 transition cursor-pointer"
          >
            <span>Lihat Seluruh Database</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {recentRecords.length === 0 ? (
          <div className="text-center py-8 border border-dashed border-slate-200 rounded-xl">
            <Calculator className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-xs font-semibold text-slate-600">Belum ada kalkulasi HPP tersimpan</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Mulai dengan menghitung HPP varian ukuran pertama Anda</p>
            <button
              onClick={() => onNavigateTab('kalkulator')}
              className="mt-3 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition cursor-pointer"
            >
              + Hitung HPP Sekarang
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 text-slate-600 text-[11px] uppercase font-bold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3 text-left">No. HPP</th>
                  <th className="py-2.5 px-3 text-left">Nama Produk</th>
                  <th className="py-2.5 px-3 text-center min-w-[85px] whitespace-nowrap">Size</th>
                  <th className="py-2.5 px-3 text-left">Brand</th>
                  <th className="py-2.5 px-3 text-right">HPP Final / Pcs</th>
                  <th className="py-2.5 px-3 text-right">Rekomendasi Jual</th>
                  <th className="py-2.5 px-3 text-center">Margin</th>
                  <th className="py-2.5 px-3 text-center">Tanggal</th>
                  <th className="py-2.5 px-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentRecords.map(item => (
                  <tr key={item.id} className="hover:bg-slate-50/60 transition">
                    <td className="py-2.5 px-3 font-semibold text-indigo-700">
                      {item.noHpp}
                    </td>
                    <td className="py-2.5 px-3 font-medium text-slate-900">
                      {item.namaProduk}
                      <span className="block text-[10px] text-slate-400">{item.kategori}</span>
                    </td>
                    <td className="py-2.5 px-3 text-center whitespace-nowrap">
                      <span className="inline-flex items-center justify-center px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-bold text-[11px] whitespace-nowrap leading-none tracking-wide">
                        {item.size}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 font-medium">
                      {item.brand || 'UMUM'}
                    </td>
                    <td className="py-2.5 px-3 text-right font-semibold text-slate-800 tabular-nums">
                      {formatRp(item.hppFinalPerPcs)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-semibold text-emerald-700 tabular-nums">
                      {formatRp(item.hargaJualRekomendasi)}
                    </td>
                    <td className="py-2.5 px-3 text-center font-semibold text-slate-700 tabular-nums">
                      {item.targetLabaPercent}%
                    </td>
                    <td className="py-2.5 px-3 text-center text-slate-500 text-[11px]">
                      {formatDateIndo(item.tanggal)}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => onPrintRecord(item)}
                          className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] font-semibold transition cursor-pointer"
                          title="Cetak Lembar HPP"
                        >
                          Cetak
                        </button>
                        <button
                          onClick={() => onEditRecord(item)}
                          className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded text-[11px] font-semibold transition cursor-pointer"
                          title="Edit di Form Kalkulator"
                        >
                          Edit
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

    </div>
  );
};
