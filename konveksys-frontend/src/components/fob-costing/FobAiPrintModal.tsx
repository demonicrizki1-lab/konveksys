import React, { useRef } from 'react';
import { createPortal } from 'react-dom';
import { Printer, X, Sparkles, TrendingUp, ShieldAlert, Coins, FileText, CheckCircle2 } from 'lucide-react';
import { HPPCalculationRecord, FobAiAnalysisResult } from '../../types';
import { formatRp, formatDateIndo } from '../../utils/formatters';
import { printIsolatedDocument } from '../../utils/printHelper';

interface FobAiPrintModalProps {
  hpp: HPPCalculationRecord;
  analysis: FobAiAnalysisResult;
  modelUsed?: string;
  onClose: () => void;
}

export const FobAiPrintModal: React.FC<FobAiPrintModalProps> = ({
  hpp,
  analysis,
  modelUsed = 'DeepSeek V3 (via MAIA Router)',
  onClose,
}) => {
  const paperRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    if (!paperRef.current) return;
    const safeNo = (hpp.noHpp || 'HPP').replace(/[/\\?%*:|"<>]/g, '-');
    const docTitle = `Laporan_Audit_AI_${safeNo}_${hpp.namaProduk}_Size_${hpp.size}`;
    printIsolatedDocument(paperRef.current, docTitle);
  };

  const totalPotensiHematPerPcs = (analysis.costOptimization || []).reduce(
    (acc, cur) => acc + (cur.potensiHematPerPcs || 0),
    0
  );
  const totalHematBatch = totalPotensiHematPerPcs * (hpp.batchQty || 100);

  return createPortal(
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex flex-col items-center justify-start p-2 sm:p-4 overflow-y-auto">
      
      {/* Top Floating Sticky Control Bar */}
      <div className="sticky top-2 z-20 w-full max-w-4xl bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-slate-200 p-3 mb-4 flex flex-wrap items-center justify-between gap-3 animate-in fade-in slide-in-from-top-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-700 shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-800 flex items-center gap-2">
              <span>Pratinjau Dokumen Audit AI</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold border bg-indigo-50 text-indigo-700 border-indigo-200">
                {hpp.noHpp}
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold border bg-slate-100 text-slate-700 border-slate-200">
                Size {hpp.size}
              </span>
            </div>
            <div className="text-[11px] text-slate-500">
              {hpp.namaProduk} • AI Engine: {modelUsed}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-200 transition cursor-pointer"
            title="Download PDF atau Cetak Laporan Audit AI"
          >
            <Printer className="w-4 h-4" />
            <span>Download / Cetak PDF</span>
          </button>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition cursor-pointer"
            title="Tutup Pratinjau"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Printable A4 Paper Preview */}
      <div className="w-full flex justify-center pb-12">
        <div
          ref={paperRef}
          className="w-full max-w-[210mm] min-h-[297mm] bg-white shadow-2xl rounded-sm p-6 sm:p-10 text-slate-900 border border-slate-300 font-sans text-xs print:shadow-none print:border-none print:p-4"
          style={{ boxSizing: 'border-box' }}
        >
          
          {/* Header Kop Surat Formal */}
          <div className="border-b-2 border-slate-900 pb-2.5 mb-3.5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 pr-2">
                <h1 className="text-lg font-black tracking-wider text-slate-900 uppercase leading-none">
                  MAISON RAYYAN MANUFACTURING
                </h1>
                <p className="text-[10.5px] font-semibold text-slate-700 tracking-wide mt-1">
                  Sistem Manufaktur FOB & Garment Costing Intelligence
                </p>
                <p className="text-[9.5px] text-slate-500 mt-0.5 leading-tight">
                  Jl. Industri Makloon No. 88, Bandung • Telp: 0821-2822-4328 • Email: commercial@maisonmrm.co.id
                </p>
              </div>
              <div className="text-right shrink-0">
                <div className="inline-block px-3 py-1 border-2 border-slate-900 font-black text-[11px] uppercase tracking-wide rounded bg-slate-50 whitespace-nowrap">
                  AUDIT HPP & STRATEGI AI
                </div>
                <div className="text-[10.5px] font-bold text-slate-800 mt-1 whitespace-nowrap">
                  Ref: {hpp.noHpp}
                </div>
              </div>
            </div>
          </div>

          {/* Document Metadata Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-2.5 bg-slate-50 rounded-lg border border-slate-200 mb-3.5 text-[11px]">
            <div>
              <span className="text-slate-400 block text-[9.5px] uppercase font-bold">Brand Mitra</span>
              <span className="font-bold text-slate-900 uppercase">{hpp.brand || 'UMUM'}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[9.5px] uppercase font-bold">Kategori / Ukuran</span>
              <span className="font-semibold text-slate-800">{hpp.kategori || 'Garmen'} • Size {hpp.size || 'M'}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[9.5px] uppercase font-bold">Tanggal Analisis</span>
              <span className="font-semibold text-slate-800">{formatDateIndo(new Date().toISOString())}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[9.5px] uppercase font-bold">AI Engine Evaluator</span>
              <span className="font-bold text-indigo-700">{modelUsed}</span>
            </div>
          </div>

          {/* Product Specification Banner */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 mb-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">NAMA ARTIKEL</span>
              <span className="font-bold text-slate-900 text-sm">{hpp.namaProduk}</span>
              {hpp.kodeProduk && <span className="block text-[11px] text-slate-500">Kode: {hpp.kodeProduk}</span>}
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">HPP POKOK PRODUKSI</span>
              <span className="font-bold text-slate-900 text-sm">{formatRp(hpp.hppFinalPerPcs)} / Pcs</span>
              <span className="block text-[10px] text-slate-500">Batch: {hpp.batchQty || 100} Pcs</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">REKOMENDASI JUAL FOB</span>
              <span className="font-bold text-indigo-700 text-sm">{formatRp(hpp.hargaJualRekomendasi)}</span>
              <span className="block text-[10px] text-slate-500">Target Margin: {hpp.targetLabaPercent || 10}%</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">STATUS KESEHATAN BIAYA</span>
              <span className={`inline-block text-[11px] font-black px-2 py-0.5 rounded border mt-0.5 ${
                analysis.healthScore >= 80
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                  : analysis.healthScore >= 65
                  ? 'bg-amber-50 text-amber-800 border-amber-300'
                  : 'bg-rose-50 text-rose-800 border-rose-300'
              }`}>
                {analysis.status} ({analysis.healthScore}/100)
              </span>
            </div>
          </div>

          {/* SECTION 1: RINGKASAN AUDIT BIAYA */}
          <div className="mb-4 p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs leading-relaxed">
            <strong className="text-slate-900 font-bold block mb-1 uppercase tracking-wide text-[10.5px]">
              I. Ringkasan Audit & Diagnosis Bisnis:
            </strong>
            <p className="text-slate-700">{analysis.ringkasanAudit}</p>
          </div>

          {/* SECTION 2: TABEL PELUANG PENGHEMATAN BIAYA */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-1.5">
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
                <Coins className="w-3.5 h-3.5 text-emerald-600" />
                <span>II. Peluang Penghematan Biaya & Efisiensi Bahan</span>
              </h2>
              <span className="text-[11px] font-bold text-emerald-700">
                Potensi Hemat: -{formatRp(totalPotensiHematPerPcs)} / Pcs
              </span>
            </div>
            <table className="w-full text-xs border border-slate-200 rounded-lg overflow-hidden">
              <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 text-[10.5px]">
                <tr>
                  <th className="p-2 text-left w-1/4">Area Optimasi</th>
                  <th className="p-2 text-left">Rekomendasi Tindakan</th>
                  <th className="p-2 text-right w-1/5">Potensi Hemat / Pcs</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {analysis.costOptimization.map((opt, idx) => (
                  <tr key={idx} className={idx % 2 === 1 ? 'bg-slate-50/60' : 'bg-white'}>
                    <td className="p-2 font-bold text-slate-800">{opt.area}</td>
                    <td className="p-2 text-slate-600 leading-snug">{opt.saran}</td>
                    <td className="p-2 text-right font-bold text-emerald-700 tabular-nums">
                      {opt.potensiHematPerPcs > 0 ? `-${formatRp(opt.potensiHematPerPcs)}` : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-emerald-50/50 font-bold border-t border-slate-200 text-[11px]">
                <tr>
                  <td colSpan={2} className="p-2 text-slate-700 text-right">
                    Total Estimasi Efisiensi per Batch ({hpp.batchQty || 100} Pcs):
                  </td>
                  <td className="p-2 text-right text-emerald-800 tabular-nums font-black">
                    {formatRp(totalHematBatch)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* SECTION 3: TABEL RISIKO TEKNIS PRODUKSI */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-1.5">
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
                <span>III. Radar & Mitigasi Risiko Teknis Produksi</span>
              </h2>
              <span className="text-[11px] font-bold text-slate-600">
                Cadangan Reject: {hpp.rejectPercent || 3}% ({formatRp(hpp.nilaiReject)}/pcs)
              </span>
            </div>
            <table className="w-full text-xs border border-slate-200 rounded-lg overflow-hidden">
              <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 text-[10.5px]">
                <tr>
                  <th className="p-2 text-left w-1/4">Aspek Risiko</th>
                  <th className="p-2 text-center w-24">Tingkat Risiko</th>
                  <th className="p-2 text-left">Langkah Pencegahan di Lantai Produksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {analysis.productionRisks.map((risk, idx) => {
                  const isHigh = risk.tingkatRisiko?.toUpperCase() === 'TINGGI';
                  const isMed = risk.tingkatRisiko?.toUpperCase() === 'SEDANG';
                  return (
                    <tr key={idx} className={idx % 2 === 1 ? 'bg-slate-50/60' : 'bg-white'}>
                      <td className="p-2 font-bold text-slate-800">{risk.aspek}</td>
                      <td className="p-2 text-center">
                        <span className={`inline-block px-1.5 py-0.5 rounded text-[9.5px] font-black uppercase ${
                          isHigh
                            ? 'bg-rose-100 text-rose-800'
                            : isMed
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {risk.tingkatRisiko}
                        </span>
                      </td>
                      <td className="p-2 text-slate-600 leading-snug">{risk.mitigasi}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* SECTION 4: MATRIKS TIERING VOLUME BUYER */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-1.5">
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-indigo-600" />
                <span>IV. Matriks Rekomendasi Diskon Volume Buyer</span>
              </h2>
              <span className="text-[10.5px] text-slate-500">
                Dasar HPP: <strong className="text-slate-800">{formatRp(hpp.hppFinalPerPcs)}</strong>
              </span>
            </div>
            <table className="w-full text-xs border border-slate-200 rounded-lg overflow-hidden">
              <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 text-[10.5px]">
                <tr>
                  <th className="p-2 text-left">Min. Volume Qty</th>
                  <th className="p-2 text-center">Diskon (%)</th>
                  <th className="p-2 text-center">Sisa Margin (%)</th>
                  <th className="p-2 text-right">Rekomendasi Harga FOB</th>
                  <th className="p-2 text-left">Strategi Penawaran</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {analysis.volumePricing.map((tier, idx) => {
                  const isBottom = idx === analysis.volumePricing.length - 1;
                  return (
                    <tr key={idx} className={isBottom ? 'bg-amber-50/40' : idx % 2 === 1 ? 'bg-slate-50/60' : 'bg-white'}>
                      <td className="p-2 font-bold text-slate-900">≥ {tier.minQty} Pcs</td>
                      <td className="p-2 text-center font-bold text-slate-700">
                        {tier.diskonPersen > 0 ? `${tier.diskonPersen}%` : '0%'}
                      </td>
                      <td className="p-2 text-center font-bold text-slate-700">{tier.marginPersen}%</td>
                      <td className="p-2 text-right font-black text-indigo-700 tabular-nums">
                        {formatRp(tier.hargaRekomendasi)}
                      </td>
                      <td className="p-2 text-slate-600 text-[11px]">
                        {tier.catatan}
                        {isBottom && (
                          <span className="ml-1.5 font-bold text-[9.5px] uppercase text-amber-700 bg-amber-100 px-1 py-0.5 rounded">
                            Batas Aman
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* SECTION 5: RINGKASAN EKSEKUTIF */}
          <div className="mb-6 p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs">
            <strong className="text-slate-900 font-bold block mb-1 uppercase tracking-wide text-[10.5px]">
              V. Ringkasan Eksekutif untuk Manajemen:
            </strong>
            <p className="text-slate-700 leading-relaxed italic">{analysis.executiveSummary}</p>
          </div>

          {/* TANDA TANGAN KORPORAT */}
          <div className="grid grid-cols-3 gap-4 text-center text-xs mt-6 pt-3 border-t border-slate-200 break-inside-avoid">
            <div>
              <div className="text-[9.5px] text-slate-500 mb-0.5">Dianalisis & Dihitung Oleh:</div>
              <div className="text-[10px] font-bold text-slate-800 whitespace-nowrap mb-12">Costing / Merchandiser</div>
              <p className="font-medium text-slate-800 border-b border-slate-400 pb-1 mx-4 text-[9.5px]">( .............................. )</p>
              <p className="text-[9px] text-slate-400 mt-0.5">Staff Costing FOB</p>
            </div>

            <div>
              <div className="text-[9.5px] text-slate-500 mb-0.5">Divalidasi Oleh:</div>
              <div className="text-[10px] font-bold text-slate-800 whitespace-nowrap mb-12">Kepala Produksi</div>
              <p className="font-medium text-slate-800 border-b border-slate-400 pb-1 mx-4 text-[9.5px]">( .............................. )</p>
              <p className="text-[9px] text-slate-400 mt-0.5">Production Manager</p>
            </div>

            <div>
              <div className="text-[9.5px] text-slate-500 mb-0.5">Disetujui Oleh:</div>
              <div className="text-[10px] font-bold text-slate-800 whitespace-nowrap mb-12">Manajemen / Direksi</div>
              <p className="font-medium text-slate-800 border-b border-slate-400 pb-1 mx-4 text-[9.5px]">( .............................. )</p>
              <p className="text-[9px] text-slate-400 mt-0.5">Direktur / Commercial Head</p>
            </div>
          </div>

          {/* FOOTER */}
          <div className="mt-6 pt-2 border-t border-slate-100 flex justify-between items-center text-[10px] text-slate-400">
            <span>Dicetak otomatis oleh Sistem FOB Garment AI Engine - Maison Rayyan Manufacturing</span>
            <span>Dokumen Rahasia Internal Manajemen</span>
          </div>

        </div>
      </div>

    </div>,
    document.body
  );
};
