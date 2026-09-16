import React, { useState } from 'react';
import {
  Sparkles,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  ArrowRight,
  Layers,
  Coins,
  Copy,
  Check,
  RefreshCw,
  Info,
  DollarSign,
  Send,
  Zap,
  Tag,
  Boxes,
} from 'lucide-react';
import { HPPCalculationRecord, FobAiAnalysisResult } from '../../types';
import { formatRp, formatDateIndo } from '../../utils/formatters';
import { apiAnalyzeFobHpp } from '../../services/api';

interface FobAiAnalysisTabProps {
  records: HPPCalculationRecord[];
  onNavigateTab: (tabKey: 'kalkulator' | 'database') => void;
}

export const FobAiAnalysisTab: React.FC<FobAiAnalysisTabProps> = ({
  records,
  onNavigateTab,
}) => {
  const [selectedHppId, setSelectedHppId] = useState<string>(
    records.length > 0 ? records[0].id : ''
  );
  const [analyzing, setAnalyzing] = useState<boolean>(false);
  const [analysisResult, setAnalysisResult] = useState<FobAiAnalysisResult | null>(null);
  const [analysisMeta, setAnalysisMeta] = useState<{
    isAiLive: boolean;
    modelUsed: string;
  } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedWa, setCopiedWa] = useState<boolean>(false);

  const selectedRecord = records.find(r => r.id === selectedHppId) || null;

  const handleRunAnalysis = async () => {
    if (!selectedRecord) return;
    setAnalyzing(true);
    setErrorMessage(null);

    try {
      const res = await apiAnalyzeFobHpp({
        hppRecordId: selectedRecord.id,
        hppData: selectedRecord,
      });

      if (res.data && res.data.data) {
        setAnalysisResult(res.data.data);
        setAnalysisMeta({
          isAiLive: res.data.isAiLive,
          modelUsed: res.data.modelUsed || 'openai/gpt-4o-mini',
        });
      } else {
        setErrorMessage(res.error || 'Format respon tidak sesuai. Silakan coba beberapa saat lagi.');
      }
    } catch (err: any) {
      console.error('Error analyzing HPP:', err);
      setErrorMessage(
        err?.message || 'Gagal terhubung dengan server analisis AI. Silakan coba kembali.'
      );
    } finally {
      setAnalyzing(false);
    }
  };

  const handleCopyWhatsApp = () => {
    if (!analysisResult || !selectedRecord) return;

    const waText = `*LAPORAN ANALISIS HPP & REKOMENDASI FOB*\n` +
      `-----------------------------------------\n` +
      `*Artikel:* ${selectedRecord.namaProduk} (Size ${selectedRecord.size || 'M'})\n` +
      `*No HPP:* ${selectedRecord.noHpp}\n` +
      `*Batch Order:* ${selectedRecord.batchQty} Pcs\n` +
      `*HPP Pokok:* ${formatRp(selectedRecord.hppFinalPerPcs)} / Pcs\n` +
      `*Harga Jual Rekomendasi:* ${formatRp(selectedRecord.hargaJualRekomendasi)} (Margin ${selectedRecord.targetLabaPercent}%)\n` +
      `*Status Evaluasi:* ${analysisResult.status} - ${analysisResult.statusLabel}\n` +
      `*Skor Kesehatan Biaya:* ${analysisResult.healthScore}/100\n\n` +
      `*Ringkasan Eksekutif:*\n${analysisResult.executiveSummary}\n\n` +
      `*Peluang Efisiensi Biaya:*\n` +
      analysisResult.costOptimization
        .map(o => `• ${o.area}: Potensi hemat ${formatRp(o.potensiHematPerPcs)}/pcs (${o.saran})`)
        .join('\n') +
      `\n\n*Matriks Negosiasi Diskon Volume Buyer:*\n` +
      analysisResult.volumePricing
        .map(v => `• Qty ≥ ${v.minQty} pcs: ${formatRp(v.hargaRekomendasi)} (Diskon ${v.diskonPersen}%, Margin ${v.marginPersen}%)`)
        .join('\n') +
      `\n\n_Dianalisis otomatis oleh AI Costing Engine KonvekSys_`;

    navigator.clipboard.writeText(waText);
    setCopiedWa(true);
    setTimeout(() => setCopiedWa(false), 3000);
  };

  return (
    <div className="space-y-6">
      
      {/* HEADER HERO BANNER */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold mb-2">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span>AI Garment Intelligence & Optimization Engine</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-[11px] font-medium text-indigo-600">MAIA Router (DeepSeek V3 / Flash)</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Analisis Cerdas HPP & Rekomendasi Negosiasi
          </h2>
          <p className="text-sm text-slate-500 mt-1 max-w-2xl">
            Audit komprehensif struktur pembiayaan garmen FOB, deteksi pemborosan bahan baku, mitigasi risiko teknis pemotongan & jahit, serta simulasi batas diskon kuantiti aman untuk buyer.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {records.length === 0 && (
            <button
              onClick={() => onNavigateTab('kalkulator')}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 transition cursor-pointer flex items-center gap-2"
            >
              <span>Buat Hitungan HPP Pertama</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* SELECTION BAR */}
      {records.length > 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            
            <div className="flex-1 space-y-1">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                Pilih Artikel HPP yang Ingin Diaudit:
              </label>
              <div className="relative">
                <select
                  value={selectedHppId}
                  onChange={e => {
                    setSelectedHppId(e.target.value);
                    setAnalysisResult(null);
                    setErrorMessage(null);
                  }}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition cursor-pointer"
                >
                  {records.map(rec => (
                    <option key={rec.id} value={rec.id}>
                      {rec.noHpp} - {rec.namaProduk} ({rec.size || 'M'}) | Batch: {rec.batchQty} pcs | HPP: {formatRp(rec.hppFinalPerPcs)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {selectedRecord && (
              <div className="flex flex-wrap items-center gap-3 pt-2 lg:pt-5">
                <div className="bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2">
                  <div className="text-[10px] uppercase font-bold text-slate-500">HPP Pokok / Pcs</div>
                  <div className="text-sm font-black text-slate-900">{formatRp(selectedRecord.hppFinalPerPcs)}</div>
                </div>

                <div className="bg-indigo-50/60 border border-indigo-100 rounded-xl px-3.5 py-2">
                  <div className="text-[10px] uppercase font-bold text-indigo-600">Rekomendasi Jual</div>
                  <div className="text-sm font-black text-indigo-700">{formatRp(selectedRecord.hargaJualRekomendasi)}</div>
                </div>

                <div className="bg-emerald-50 border border-emerald-100 rounded-xl px-3.5 py-2">
                  <div className="text-[10px] uppercase font-bold text-emerald-700">Margin Laba</div>
                  <div className="text-sm font-black text-emerald-800">{selectedRecord.targetLabaPercent}%</div>
                </div>

                <button
                  onClick={handleRunAnalysis}
                  disabled={analyzing}
                  className="px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-2 shadow-xs transition cursor-pointer disabled:opacity-50"
                >
                  {analyzing ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Menganalisis Parameter...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-amber-300" />
                      <span>{analysisResult ? 'Audit Ulang dengan AI' : 'Jalankan Analisis Cerdas'}</span>
                    </>
                  )}
                </button>
              </div>
            )}

          </div>

          {errorMessage && (
            <div className="mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMessage}</span>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-3">
            <Boxes className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-800 mb-1">Belum Ada Kalkulasi HPP Tersimpan</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mb-4">
            Silakan buat dan simpan kalkulasi HPP artikel garmen terlebih dahulu melalui tab Kalkulator HPP sebelum menjalankan analisis AI.
          </p>
          <button
            onClick={() => onNavigateTab('kalkulator')}
            className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 transition cursor-pointer"
          >
            Buka Kalkulator HPP
          </button>
        </div>
      )}

      {/* EMPTY STATE BEFORE RUNNING ANALYSIS */}
      {!analysisResult && !analyzing && selectedRecord && (
        <div className="bg-white border border-slate-200 rounded-2xl p-8 sm:p-12 text-center shadow-xs">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center mx-auto mb-4 shadow-xs">
            <Sparkles className="w-7 h-7 text-indigo-600" />
          </div>
          <h3 className="text-base sm:text-lg font-black text-slate-900 mb-2">
            Audit Otomatis Costing & Strategi Penjualan Garmen
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 max-w-xl mx-auto leading-relaxed mb-6">
            Klik tombol <span className="font-bold text-indigo-600">"Jalankan Analisis Cerdas"</span> di atas untuk mengevaluasi artikel <span className="font-semibold text-slate-800">{selectedRecord.namaProduk}</span>. AI akan membedah rasio bahan baku, potensi kebocoran kain, kalkulasi margin bertingkat, dan menghasilkan ringkasan eksekutif siap kirim.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-2xl mx-auto text-left">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <div className="text-xs font-bold text-slate-900 mb-1">🎯 Efisiensi Bahan & CMT</div>
              <div className="text-[11px] text-slate-500">Mendeteksi penghematan rupiah per pcs dari susut marker pola kain dan jasa CMT.</div>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <div className="text-xs font-bold text-slate-900 mb-1">🛡️ Mitigasi Risiko Teknis</div>
              <div className="text-[11px] text-slate-500">Panduan pencegahan cacat produksi, susut cuci kain, dan kontrol aksesoris.</div>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <div className="text-xs font-bold text-slate-900 mb-1">📈 Tiering Volume Buyer</div>
              <div className="text-[11px] text-slate-500">Simulasi batas diskon penawaran untuk 100, 300, 500, hingga 1.000 pcs pesanan.</div>
            </div>
          </div>
        </div>
      )}

      {/* LOADING SKELETON */}
      {analyzing && (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-xs space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto animate-bounce">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-800">Sedang Mengaudit Struktur HPP...</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              Menghubungi MAIA Router Engine (openai/gpt-4o-mini) untuk menganalisis {selectedRecord?.namaProduk} dan menyusun rekomendasi efisiensi...
            </p>
          </div>
          <div className="w-48 h-2 bg-slate-100 rounded-full mx-auto overflow-hidden">
            <div className="w-full h-full bg-indigo-600 rounded-full animate-pulse"></div>
          </div>
        </div>
      )}

      {/* ANALYSIS RESULT DISPLAY */}
      {analysisResult && !analyzing && selectedRecord && (
        <div className="space-y-6">
          
          {/* TOP HEALTH SCORE & DIAGNOSIS */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-100">
              
              <div className="flex items-center gap-4">
                <div
                  className={`w-18 h-18 rounded-2xl flex flex-col items-center justify-center font-black border ${
                    analysisResult.healthScore >= 80
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                      : analysisResult.healthScore >= 65
                      ? 'bg-amber-50 border-amber-200 text-amber-700'
                      : 'bg-rose-50 border-rose-200 text-rose-700'
                  }`}
                >
                  <span className="text-2xl leading-none">{analysisResult.healthScore}</span>
                  <span className="text-[10px] font-bold mt-0.5 opacity-80">/ 100</span>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-wider ${
                        analysisResult.status === 'SEHAT'
                          ? 'bg-emerald-100 text-emerald-800'
                          : analysisResult.status === 'WASPADA'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {analysisResult.status}
                    </span>
                    <span className="text-xs font-bold text-slate-500">
                      Evaluasi Kelayakan Bisnis FOB
                    </span>
                  </div>
                  <h3 className="text-lg font-black text-slate-900">
                    {analysisResult.statusLabel}
                  </h3>
                </div>
              </div>

              {/* ENGINE INFO PILL */}
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs text-slate-600">
                <Zap className="w-3.5 h-3.5 text-indigo-600" />
                <span className="font-semibold">Model:</span>
                <span className="font-bold text-indigo-700">
                  {analysisMeta?.modelUsed || 'openai/gpt-4o-mini'}
                </span>
                {analysisMeta?.isAiLive ? (
                  <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 text-[10px] font-bold">
                    LIVE AI
                  </span>
                ) : (
                  <span className="px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-700 text-[10px] font-bold" title="Garment Manufacturing Engine Active">
                    EXPERT ENGINE
                  </span>
                )}
              </div>

            </div>

            {/* AUDIT SUMMARY TEXT */}
            <div className="mt-5 p-4 rounded-xl bg-slate-50 border border-slate-200/80">
              <div className="flex items-start gap-2.5">
                <Info className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                <p className="text-sm font-medium text-slate-700 leading-relaxed">
                  {analysisResult.ringkasanAudit}
                </p>
              </div>
            </div>

          </div>

          {/* GRID: COST OPTIMIZATION & PRODUCTION RISKS */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* 1. COST OPTIMIZATION (PELUANG EFISIENSI BIAYA) */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
                      <Coins className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-slate-900">Peluang Penghematan Biaya</h4>
                      <p className="text-xs text-slate-500">Rekomendasi optimasi bahan & proses produksi</p>
                    </div>
                  </div>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                    {analysisResult.costOptimization.length} Area
                  </span>
                </div>

                <div className="space-y-3">
                  {analysisResult.costOptimization.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl border border-slate-200 hover:border-emerald-200 hover:bg-emerald-50/20 transition"
                    >
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          {item.area}
                        </span>
                        {item.potensiHematPerPcs > 0 && (
                          <span className="text-xs font-black text-emerald-700 shrink-0 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-lg">
                            -{formatRp(item.potensiHematPerPcs)}/pcs
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed pl-5">
                        {item.saran}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* ESTIMASI TOTAL SAVINGS */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-500">
                  Estimasi Total Hemat / Batch ({selectedRecord.batchQty} pcs):
                </span>
                <span className="font-black text-emerald-700 text-sm">
                  {formatRp(
                    analysisResult.costOptimization.reduce(
                      (sum, item) => sum + (item.potensiHematPerPcs || 0),
                      0
                    ) * (selectedRecord.batchQty || 100)
                  )}
                </span>
              </div>
            </div>

            {/* 2. PRODUCTION RISKS (RADAR RISIKO PRODUKSI) */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-amber-50 text-amber-700">
                      <ShieldAlert className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-slate-900">Radar Risiko Teknis Garmen</h4>
                      <p className="text-xs text-slate-500">Pencegahan cacat kain, ukuran & operasional</p>
                    </div>
                  </div>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                    {analysisResult.productionRisks.length} Poin Kritis
                  </span>
                </div>

                <div className="space-y-3">
                  {analysisResult.productionRisks.map((risk, idx) => {
                    const isHigh = risk.tingkatRisiko?.toUpperCase() === 'TINGGI';
                    const isMed = risk.tingkatRisiko?.toUpperCase() === 'SEDANG';
                    return (
                      <div
                        key={idx}
                        className="p-3.5 rounded-xl border border-slate-200 hover:border-amber-200 hover:bg-amber-50/20 transition"
                      >
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                            <AlertTriangle
                              className={`w-3.5 h-3.5 shrink-0 ${
                                isHigh ? 'text-rose-600' : isMed ? 'text-amber-600' : 'text-emerald-600'
                              }`}
                            />
                            {risk.aspek}
                          </span>
                          <span
                            className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${
                              isHigh
                                ? 'bg-rose-100 text-rose-800'
                                : isMed
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            Risiko {risk.tingkatRisiko}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed pl-5">
                          <span className="font-semibold text-slate-700">Langkah Mitigasi: </span>
                          {risk.mitigasi}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>Cadangan Reject Terpasang:</span>
                <span className="font-bold text-slate-800">
                  {selectedRecord.rejectPercent || 3}% ({formatRp(selectedRecord.nilaiReject)}/pcs)
                </span>
              </div>
            </div>

          </div>

          {/* 3. TIERED BUYER VOLUME PRICING TABLE */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-indigo-50 text-indigo-700">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-900">
                    Matriks Rekomendasi Diskon Volume Buyer
                  </h4>
                  <p className="text-xs text-slate-500">
                    Batas penawaran harga aman agar laba pabrik tetap terjaga pada kuantiti besar
                  </p>
                </div>
              </div>
              <div className="text-xs text-slate-500 font-medium">
                HPP Pokok Acuan: <span className="font-bold text-slate-900">{formatRp(selectedRecord.hppFinalPerPcs)}</span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 font-bold">
                    <th className="py-2.5 px-3 rounded-l-xl">Volume Order (Min. Qty)</th>
                    <th className="py-2.5 px-3">Diskon dari Harga Standar</th>
                    <th className="py-2.5 px-3">Sisa Margin Pabrik</th>
                    <th className="py-2.5 px-3 text-right">Rekomendasi Harga Jual FOB</th>
                    <th className="py-2.5 px-3 rounded-r-xl">Strategi Penawaran</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {analysisResult.volumePricing.map((tier, idx) => {
                    const isBottom = idx === analysisResult.volumePricing.length - 1;
                    return (
                      <tr
                        key={idx}
                        className={`hover:bg-slate-50/80 transition ${
                          isBottom ? 'bg-amber-50/30' : ''
                        }`}
                      >
                        <td className="py-3 px-3 font-black text-slate-900">
                          ≥ {tier.minQty} Pcs
                        </td>
                        <td className="py-3 px-3">
                          <span className={`px-2 py-0.5 rounded font-bold ${
                            tier.diskonPersen === 0
                              ? 'bg-slate-100 text-slate-700'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}>
                            {tier.diskonPersen > 0 ? `Diskon ${tier.diskonPersen}%` : 'Harga Normal'}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-bold text-slate-700">
                          {tier.marginPersen}% Laba Bersih
                        </td>
                        <td className="py-3 px-3 text-right font-black text-indigo-700 text-sm">
                          {formatRp(tier.hargaRekomendasi)}
                        </td>
                        <td className="py-3 px-3 text-slate-600">
                          {tier.catatan}
                          {isBottom && (
                            <span className="ml-2 text-[10px] font-black uppercase text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">
                              Batas Aman (Bottom Price)
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* 4. EXECUTIVE SUMMARY & WHATSAPP SHARE CARD */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-indigo-50 text-indigo-700">
                  <Send className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-900">Ringkasan Eksekutif untuk Manajemen</h4>
                  <p className="text-xs text-slate-500">Format ringkas siap kirim ke WhatsApp direksi atau tim negosiasi buyer</p>
                </div>
              </div>

              <button
                onClick={handleCopyWhatsApp}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-2 transition cursor-pointer self-start sm:self-auto shadow-xs"
              >
                {copiedWa ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-200" />
                    <span>Tersalin ke Clipboard!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Salin Format WhatsApp</span>
                  </>
                )}
              </button>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-700 leading-relaxed font-mono whitespace-pre-wrap select-all">
              {analysisResult.executiveSummary}
            </div>
          </div>

        </div>
      )}

    </div>
  );
};
