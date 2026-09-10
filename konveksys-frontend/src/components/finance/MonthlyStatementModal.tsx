import React, { useRef } from 'react';
import { Download, Printer, X, FileSpreadsheet } from 'lucide-react';
import { printIsolatedDocument } from '../../utils/printHelper';
import { formatRp, formatDateIndo } from '../../utils/formatters';

export interface MarginReportItem {
  id: string;
  noSuratJalan: string;
  spkNumber: string;
  tanggal: string;
  produk: string;
  jenisKain: string;
  brand: string;
  vendor: string;
  totalPcs: number;
  omzetBuyer: number;
  biayaCmt: number;
  labaBersih: number;
  marginPersen: number;
  statusMargin: 'SEHAT' | 'MODERAT' | 'TIPIS';
}

interface MonthlyStatementModalProps {
  monthLabel: string;
  brandFilter: string;
  kpi: {
    totalPcs: number;
    totalRevenue: number;
    totalCost: number;
    grossProfit: number;
    avgMargin: number;
  };
  items: MarginReportItem[];
  onClose: () => void;
}

export const MonthlyStatementModal: React.FC<MonthlyStatementModalProps> = ({
  monthLabel,
  brandFilter,
  kpi,
  items,
  onClose,
}) => {
  const paperRef = useRef<HTMLDivElement>(null);

  const handleExportPDF = () => {
    if (!paperRef.current) return;
    const safeMonth = monthLabel.replace(/[/\\?%*:|"<> ]/g, '_');
    const docTitle = `Laporan_Laba_Rugi_Maison_${safeMonth}`;
    printIsolatedDocument(paperRef.current, docTitle);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-hidden">
      <div className="bg-slate-100 rounded-2xl max-w-5xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-300 overflow-hidden animate-slideUp">
        
        {/* Top Control Toolbar */}
        <div className="bg-white px-5 py-3.5 border-b border-slate-200 flex items-center justify-between shrink-0 z-30 shadow-xs">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <span>Laporan Laba Rugi Operasional & Margin</span>
                <span className="text-slate-400">•</span>
                <span className="text-emerald-700">{monthLabel}</span>
              </div>
              <div className="text-[11px] text-slate-500 font-mono">
                {brandFilter === 'ALL' ? 'Semua Brand' : `Filter: ${brandFilter}`}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportPDF}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-sm flex items-center gap-1.5 transition btn-press"
              title="Download & Simpan Laporan sebagai PDF A4"
            >
              <Download className="w-4 h-4" />
              <span>Download PDF</span>
            </button>
            <button
              onClick={handleExportPDF}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition btn-press hidden sm:flex"
              title="Cetak Fisik / Printer"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition ml-1"
              title="Tutup Preview"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Preview Canvas */}
        <div className="overflow-y-auto p-4 sm:p-6 md:p-8 flex-1 flex justify-center bg-slate-200/50">
          
          {/* Printable A4 Paper Document */}
          <div
            ref={paperRef}
            id="statement-paper"
            className="bg-white rounded-xl shadow-lg border border-slate-200 p-6 sm:p-8 space-y-4 text-slate-800 max-w-4xl w-full my-auto text-xs"
          >
            {/* Header Kop Perusahaan */}
            <div className="flex justify-between items-start border-b-2 border-slate-900 pb-3">
              <div>
                <h2 className="text-xl font-bold tracking-tight text-slate-900">MAISON RAYYAN MANUFACTURING</h2>
                <p className="text-xs text-slate-500 mt-0.5">Konveksi & Makloon Garment Terpadu</p>
                <p className="text-[10px] text-slate-400">Jl. Industri Makloon No. 88, Bandung • Telp: 0812-3456-7890</p>
              </div>
              <div className="text-right">
                <span className="badge-dark bg-slate-900 text-white text-[10px] font-bold px-3 py-1 rounded uppercase tracking-wider inline-block">
                  IKHTISAR LABA RUGI OPERASIONAL
                </span>
                <div className="text-xs font-bold text-emerald-800 mt-1.5">Periode: {monthLabel}</div>
                <div className="text-[11px] text-slate-500">Dicetak: {formatDateIndo(new Date().toISOString())}</div>
              </div>
            </div>

            {/* Executive KPI Summary Box */}
            <div className="grid grid-cols-4 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200 text-center">
              <div className="border-r border-slate-200 pr-2">
                <span className="text-[10px] uppercase font-bold text-slate-400 block whitespace-nowrap">Total Omzet Buyer:</span>
                <strong className="text-slate-900 text-xs font-bold block mt-0.5 whitespace-nowrap tabular-nums">{formatRp(kpi.totalRevenue)}</strong>
                <span className="text-[9px] text-slate-500 whitespace-nowrap">{kpi.totalPcs} pcs terkirim</span>
              </div>
              <div className="border-r border-slate-200 pr-2">
                <span className="text-[10px] uppercase font-bold text-slate-400 block whitespace-nowrap">Beban Jahit (CMT):</span>
                <strong className="text-rose-600 text-xs font-bold block mt-0.5 whitespace-nowrap tabular-nums">{formatRp(kpi.totalCost)}</strong>
                <span className="text-[9px] text-slate-500 whitespace-nowrap">Upah mitra penjahit</span>
              </div>
              <div className="border-r border-slate-200 pr-2">
                <span className="text-[10px] uppercase font-bold text-slate-400 block whitespace-nowrap">Laba Bersih Workshop:</span>
                <strong className="text-emerald-700 text-xs font-bold block mt-0.5 whitespace-nowrap tabular-nums">{formatRp(kpi.grossProfit)}</strong>
                <span className="text-[9px] text-emerald-600 font-semibold whitespace-nowrap">Omzet - Beban CMT</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block whitespace-nowrap">Rata-rata Margin:</span>
                <strong className="text-indigo-600 text-sm font-bold block mt-0.5 whitespace-nowrap tabular-nums">{kpi.avgMargin.toFixed(1)}%</strong>
                <span className="text-[9px] text-indigo-500 font-semibold whitespace-nowrap">Tingkat Profitabilitas</span>
              </div>
            </div>

            {/* Table of Itemized Margin Analysis */}
            <div className="space-y-1.5">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-700 flex justify-between items-center">
                <span>Rincian Pengiriman & Analisis Margin per Surat Jalan</span>
                <span className="text-slate-400 font-normal">Total {items.length} Transaksi</span>
              </div>

              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-100 text-slate-700 font-bold text-[9px] uppercase border-b border-slate-300">
                    <tr>
                      <th className="p-2 whitespace-nowrap">No SJ / Tgl</th>
                      <th className="p-2">Artikel & Bahan</th>
                      <th className="p-2">Brand / Vendor</th>
                      <th className="p-2 text-center whitespace-nowrap">Qty Pcs</th>
                      <th className="p-2 text-right whitespace-nowrap">Omzet Buyer</th>
                      <th className="p-2 text-right whitespace-nowrap">Beban CMT</th>
                      <th className="p-2 text-right whitespace-nowrap">Laba Bersih</th>
                      <th className="p-2 text-center whitespace-nowrap">Margin</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {items.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="p-6 text-center text-slate-400">
                          Tidak ada data transaksi pengiriman pada periode ini.
                        </td>
                      </tr>
                    ) : (
                      items.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="p-2 font-mono font-bold text-indigo-700 whitespace-nowrap">
                            <div>{item.noSuratJalan}</div>
                            <span className="text-[9px] text-slate-400 font-normal block">{formatDateIndo(item.tanggal)}</span>
                          </td>
                          <td className="p-2">
                            <div className="font-bold text-slate-900">{item.produk}</div>
                            <div className="text-[9px] text-slate-400">{item.jenisKain}</div>
                          </td>
                          <td className="p-2">
                            <div className="font-semibold text-slate-800">{item.brand}</div>
                            <div className="text-[9px] text-slate-500">Penjahit: {item.vendor}</div>
                          </td>
                          <td className="p-2 text-center font-bold text-slate-800 whitespace-nowrap">{item.totalPcs}</td>
                          <td className="p-2 text-right font-medium text-slate-700 whitespace-nowrap tabular-nums">{formatRp(item.omzetBuyer)}</td>
                          <td className="p-2 text-right font-medium text-rose-600 whitespace-nowrap tabular-nums">{formatRp(item.biayaCmt)}</td>
                          <td className="p-2 text-right font-bold text-emerald-700 whitespace-nowrap tabular-nums">{formatRp(item.labaBersih)}</td>
                          <td className="p-2 text-center whitespace-nowrap">
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                item.marginPersen >= 30
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : item.marginPersen >= 15
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-rose-100 text-rose-800'
                              }`}
                            >
                              {item.marginPersen.toFixed(0)}%
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                  {items.length > 0 && (
                    <tfoot className="bg-slate-100 font-bold border-t-2 border-slate-300">
                      <tr>
                        <td colSpan={3} className="p-2 text-right uppercase text-[10px] whitespace-nowrap">Total Akumulasi:</td>
                        <td className="p-2 text-center whitespace-nowrap">{kpi.totalPcs} Pcs</td>
                        <td className="p-2 text-right whitespace-nowrap tabular-nums">{formatRp(kpi.totalRevenue)}</td>
                        <td className="p-2 text-right text-rose-600 whitespace-nowrap tabular-nums">{formatRp(kpi.totalCost)}</td>
                        <td className="p-2 text-right text-emerald-700 whitespace-nowrap tabular-nums">{formatRp(kpi.grossProfit)}</td>
                        <td className="p-2 text-center text-indigo-700 whitespace-nowrap">{kpi.avgMargin.toFixed(1)}%</td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </div>

            {/* Signature Area */}
            <div className="pt-6 flex justify-between text-center text-[10px] text-slate-600 border-t border-slate-200 mt-6">
              <div className="w-40">
                <div className="text-slate-400 mb-10">Dibuat Oleh (Finance),</div>
                <div className="border-b border-slate-400 font-bold text-slate-800 pb-0.5">Admin Keuangan</div>
                <div className="text-[9px] text-slate-400 mt-0.5">Maison Rayyan Manufacturing</div>
              </div>
              <div className="w-40">
                <div className="text-slate-400 mb-10">Mengetahui & Menyetujui,</div>
                <div className="border-b border-slate-400 font-bold text-slate-800 pb-0.5">Owner / Direktur</div>
                <div className="text-[9px] text-slate-400 mt-0.5">Maison Rayyan Manufacturing</div>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};
