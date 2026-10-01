import React, { useRef, useState } from 'react';
import { Download, Printer, X, FileSpreadsheet, Scissors, Package } from 'lucide-react';
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
  orderType?: 'CMT' | 'FOB';
  fobPoNumber?: string;
  itemPo?: string;
  itemCount?: number;
  subItems?: any[];
}

export interface FabricReportItem {
  id: string;
  rollCode: string;
  jenisKain: string;
  tanggalMasuk?: string;
  meterUsed: number;
  hargaModalMeter: number;
  totalNilaiKain: number;
}

interface MonthlyStatementModalProps {
  reportTitle?: string;
  reportNumber?: string;
  monthLabel: string;
  brandFilter: string;
  orderScheme?: 'ALL' | 'CMT' | 'FOB';
  kpi: {
    totalPcs: number;
    totalRevenue: number;
    totalCost: number;
    totalFabricCost?: number;
    fabricMeters?: number;
    grossProfit: number;
    netProfit?: number;
    avgMargin: number;
    cmtProfit?: number;
    fobProfit?: number;
  };
  items: MarginReportItem[];
  fabricItems?: FabricReportItem[];
  poNumbers?: string[];
  notes?: string;
  onClose: () => void;
}

export const MonthlyStatementModal: React.FC<MonthlyStatementModalProps> = ({
  reportTitle,
  reportNumber,
  monthLabel,
  brandFilter,
  orderScheme = 'ALL',
  kpi,
  items,
  fabricItems = [],
  poNumbers = [],
  notes,
  onClose,
}) => {
  const paperRef = useRef<HTMLDivElement>(null);
  const [printOrientation, setPrintOrientation] = useState<'landscape' | 'portrait'>('landscape');

  const finalNetProfit =
    kpi.netProfit !== undefined
      ? kpi.netProfit
      : Math.max(0, kpi.grossProfit - (kpi.totalFabricCost || 0));

  const handleExportPDF = () => {
    if (!paperRef.current) return;
    const safeTitle = (reportTitle || `Laporan_Net_Profit_${monthLabel}`).replace(/[/\\?%*:|"<> ]/g, '_');
    printIsolatedDocument(paperRef.current, safeTitle, { orientation: printOrientation });
  };

  const schemeTitle =
    orderScheme === 'FOB'
      ? 'Khusus Pesanan FOB (Order Bahan)'
      : orderScheme === 'CMT'
      ? 'Khusus Pesanan CMT (Makloon Jasa)'
      : 'Konsolidasi (CMT & FOB)';

  const displayTitle = reportTitle || 'Laporan Laba Rugi Operasional & Net Profit';

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-hidden">
      <div className="bg-slate-100 rounded-2xl max-w-7xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-300 overflow-hidden animate-slideUp">
        
        {/* Top Control Toolbar */}
        <div className="bg-white px-5 py-3 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0 z-30 shadow-xs">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5 flex-wrap">
                <span>{displayTitle}</span>
                <span className="text-slate-400">•</span>
                <span className="text-emerald-700">{monthLabel}</span>
                <span className="text-slate-400">•</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                  {schemeTitle}
                </span>
                {reportNumber && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 text-slate-700 border border-slate-200">
                    {reportNumber}
                  </span>
                )}
              </div>
              <div className="text-[11px] text-slate-500 font-mono">
                {brandFilter === 'ALL' ? 'Semua Brand (Konsolidasi)' : `Filter: ${brandFilter}`}
                {poNumbers && poNumbers.length > 0 && ` • ${poNumbers.length} PO Terpilih`}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Pilihan Orientasi Kertas Cetak */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
              <button
                type="button"
                onClick={() => setPrintOrientation('landscape')}
                className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer flex items-center gap-1 ${
                  printOrientation === 'landscape'
                    ? 'bg-white text-indigo-700 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Format Lebar / Landscape (Rekomendasi agar tabel 9 kolom pas & tidak terpotong)"
              >
                <span>📄 Landscape (Lebar)</span>
              </button>
              <button
                type="button"
                onClick={() => setPrintOrientation('portrait')}
                className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer flex items-center gap-1 ${
                  printOrientation === 'portrait'
                    ? 'bg-white text-indigo-700 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Format Tegak / Portrait"
              >
                <span>📄 Portrait</span>
              </button>
            </div>

            <button
              onClick={handleExportPDF}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-sm flex items-center gap-1.5 transition btn-press cursor-pointer"
              title="Download & Simpan Laporan sebagai PDF A4"
            >
              <Download className="w-4 h-4" />
              <span>Download PDF</span>
            </button>
            <button
              onClick={handleExportPDF}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition btn-press hidden sm:flex cursor-pointer"
              title="Cetak Fisik / Printer"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition ml-1 cursor-pointer"
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
            className={`bg-white rounded-xl shadow-lg border border-slate-200 p-5 sm:p-6 space-y-3.5 text-slate-800 w-full my-auto text-xs transition-all ${
              printOrientation === 'landscape' ? 'max-w-5xl' : 'max-w-3xl'
            }`}
          >
            {/* Header Kop Perusahaan */}
            <div className="flex justify-between items-start border-b-2 border-slate-900 pb-2.5 gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <img
                  src="/logo-maison-rayyan.png"
                  alt="Maison Rayyan Manufacturing"
                  className="h-12 w-auto max-w-[120px] object-contain shrink-0"
                />
                <div className="min-w-0">
                  <h2 className="text-base sm:text-lg font-bold tracking-tight text-slate-900 leading-tight">MAISON RAYYAN MANUFACTURING</h2>
                  <p className="text-[10.5px] text-slate-500 mt-0.5 leading-tight">Konveksi & Makloon Garment Terpadu</p>
                  <p className="text-[9px] text-slate-400 leading-tight">Jl. Industri Makloon No. 88, Bandung • Telp: 0812-3456-7890</p>
                </div>
              </div>
              <div className="text-right shrink-0">
                <span className="badge-dark bg-slate-900 text-white text-[9.5px] font-bold px-2.5 py-0.5 rounded uppercase tracking-wider inline-block">
                  LAPORAN NET PROFIT & MARGIN BULANAN
                </span>
                {reportNumber && (
                  <div className="text-[9.5px] font-mono text-slate-500 mt-0.5">No: {reportNumber}</div>
                )}
                <div className="text-xs font-bold text-emerald-800 mt-0.5">Periode: {monthLabel}</div>
                <div className="text-[9.5px] text-slate-600 font-semibold">
                  Brand: {brandFilter === 'ALL' ? 'Semua Brand (Konsolidasi)' : brandFilter}
                </div>
                <div className="text-[9px] text-slate-400">Dicetak: {formatDateIndo(new Date().toISOString())}</div>
              </div>
            </div>

            {/* Rujukan PO Produksi Terpilih (Jika ada) */}
            {poNumbers && poNumbers.length > 0 && (
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg flex items-center gap-2 flex-wrap text-[11px]">
                <span className="font-bold text-slate-700 flex items-center gap-1">
                  <Package className="w-3.5 h-3.5 text-indigo-600" />
                  Rujukan Surat PO:
                </span>
                <div className="flex flex-wrap gap-1">
                  {poNumbers.map((po) => (
                    <span key={po} className="px-1.5 py-0.5 bg-white border border-slate-300 rounded font-mono font-bold text-slate-800 text-[10px]">
                      {po}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Executive KPI Summary Box */}
            <div className={`grid gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200 text-center ${
              (kpi.totalFabricCost || 0) > 0 ? 'grid-cols-2 sm:grid-cols-5' : 'grid-cols-2 sm:grid-cols-4'
            }`}>
              <div className="border-r border-slate-200 pr-2">
                <span className="text-[9.5px] uppercase font-bold text-slate-400 block whitespace-nowrap">Total Omzet:</span>
                <strong className="text-slate-900 text-xs font-bold block mt-0.5 whitespace-nowrap tabular-nums">{formatRp(kpi.totalRevenue)}</strong>
                <span className="text-[9px] text-slate-500 whitespace-nowrap">{kpi.totalPcs.toLocaleString('id-ID')} pcs kirim</span>
              </div>

              <div className="border-r border-slate-200 pr-2">
                <span className="text-[9.5px] uppercase font-bold text-slate-400 block whitespace-nowrap">Beban Jahit (CMT):</span>
                <strong className="text-rose-600 text-xs font-bold block mt-0.5 whitespace-nowrap tabular-nums">- {formatRp(kpi.totalCost)}</strong>
                <span className="text-[9px] text-slate-500 whitespace-nowrap">Upah penjahit</span>
              </div>

              {(kpi.totalFabricCost || 0) > 0 && (
                <div className="border-r border-slate-200 pr-2">
                  <span className="text-[9.5px] uppercase font-bold text-slate-400 block whitespace-nowrap">Beban Kain:</span>
                  <strong className="text-amber-700 text-xs font-bold block mt-0.5 whitespace-nowrap tabular-nums">- {formatRp(kpi.totalFabricCost || 0)}</strong>
                  <span className="text-[9px] text-slate-500 whitespace-nowrap">{kpi.fabricMeters || 0} m terpakai</span>
                </div>
              )}

              <div className="border-r border-slate-200 pr-2">
                <span className="text-[9.5px] uppercase font-bold text-slate-400 block whitespace-nowrap">Net Profit:</span>
                <strong className="text-emerald-700 text-xs font-bold block mt-0.5 whitespace-nowrap tabular-nums">{formatRp(finalNetProfit)}</strong>
                <span className="text-[9px] text-emerald-600 font-semibold whitespace-nowrap">Laba Bersih Akhir</span>
              </div>

              <div>
                <span className="text-[9.5px] uppercase font-bold text-slate-400 block whitespace-nowrap">Net Margin:</span>
                <strong className="text-indigo-600 text-sm font-bold block mt-0.5 whitespace-nowrap tabular-nums">{kpi.avgMargin.toFixed(1)}%</strong>
                <span className="text-[9px] text-indigo-500 font-semibold whitespace-nowrap">Profitabilitas</span>
              </div>
            </div>

            {/* Formula Breakdown Banner */}
            <div className="p-2.5 bg-emerald-50/60 border border-emerald-200 rounded-lg text-[10.5px] text-emerald-950 flex justify-between items-center flex-wrap gap-2">
              <span className="font-semibold">
                Rumus Net Profit: Omzet ({formatRp(kpi.totalRevenue)}) - Beban Jahit ({formatRp(kpi.totalCost)}) {(kpi.totalFabricCost || 0) > 0 ? `- Beban Kain (${formatRp(kpi.totalFabricCost || 0)})` : ''}
              </span>
              <span className="font-bold text-emerald-800 font-mono text-xs">
                = {formatRp(finalNetProfit)} ({kpi.avgMargin.toFixed(1)}%)
              </span>
            </div>

            {/* Table 1: Rincian Pengiriman Surat Jalan */}
            <div className="space-y-1.5">
              <div className="text-[10.5px] font-bold uppercase tracking-wider text-slate-700 flex justify-between items-center">
                <span>1. Rincian Pengiriman per Surat Jalan & Pendapatan</span>
                <span className="text-slate-400 font-normal">
                  Total {items.length} Surat Jalan ({items.reduce((s, it) => s + (it.totalPcs || 0), 0).toLocaleString('id-ID')} pcs)
                </span>
              </div>

              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-left text-xs border-collapse table-fixed">
                  <colgroup>
                    <col style={{ width: '13%' }} />
                    <col style={{ width: '11%' }} />
                    <col style={{ width: '17%' }} />
                    <col style={{ width: '13%' }} />
                    <col style={{ width: '6%' }} />
                    <col style={{ width: '13%' }} />
                    <col style={{ width: '11%' }} />
                    <col style={{ width: '10%' }} />
                    <col style={{ width: '6%' }} />
                  </colgroup>
                  <thead className="bg-slate-100 text-slate-700 font-bold text-[8.5px] uppercase border-b border-slate-300">
                    <tr>
                      <th className="p-1.5 whitespace-nowrap">No SJ / Tgl</th>
                      <th className="p-1.5 whitespace-nowrap">Ref PO / SPK</th>
                      <th className="p-1.5">Artikel & Bahan</th>
                      <th className="p-1.5">Brand / Penjahit</th>
                      <th className="p-1.5 text-center whitespace-nowrap">Pcs</th>
                      <th className="p-1.5 text-right whitespace-nowrap">Omzet Buyer</th>
                      <th className="p-1.5 text-right whitespace-nowrap">Beban Jahit</th>
                      <th className="p-1.5 text-right whitespace-nowrap">Margin Jahit</th>
                      <th className="p-1.5 text-center whitespace-nowrap">%</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {items.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="p-6 text-center text-slate-400">
                          Tidak ada data transaksi pengiriman pada periode ini.
                        </td>
                      </tr>
                    ) : (
                      items.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="p-1.5 whitespace-nowrap">
                            <div className="font-mono font-bold text-indigo-700 text-[9px] truncate">{item.noSuratJalan}</div>
                            <span className="text-[8px] text-slate-400 font-normal block leading-tight">{formatDateIndo(item.tanggal)}</span>
                          </td>
                          <td className="p-1.5 font-mono text-[8.5px]">
                            {item.itemPo ? (
                              <span className="font-bold text-blue-700 bg-blue-50 px-1 py-0.2 rounded border border-blue-200 inline-block truncate max-w-full">
                                {item.itemPo}
                              </span>
                            ) : (
                              <span className="text-slate-500 truncate block">{item.spkNumber || '-'}</span>
                            )}
                          </td>
                          <td className="p-1.5">
                            <div className="font-bold text-slate-900 text-[9px] break-words leading-tight">{item.produk}</div>
                            <div className="text-[8px] text-slate-400 break-words leading-tight">{item.jenisKain}</div>
                          </td>
                          <td className="p-1.5">
                            <div className="font-semibold text-slate-800 text-[9px] truncate">{item.brand}</div>
                            <div className="text-[8px] text-slate-500 truncate">Penjahit: {item.vendor}</div>
                          </td>
                          <td className="p-1.5 text-center font-bold text-slate-800 text-[9px] whitespace-nowrap">{item.totalPcs}</td>
                          <td className="p-1.5 text-right font-medium text-slate-700 text-[9px] whitespace-nowrap tabular-nums">{formatRp(item.omzetBuyer)}</td>
                          <td className="p-1.5 text-right font-medium text-rose-600 text-[9px] whitespace-nowrap tabular-nums">{formatRp(item.biayaCmt)}</td>
                          <td className="p-1.5 text-right font-bold text-emerald-700 text-[9px] whitespace-nowrap tabular-nums">{formatRp(item.labaBersih)}</td>
                          <td className="p-1.5 text-center whitespace-nowrap">
                            <span
                              className={`px-1 py-0.2 rounded text-[8.5px] font-bold ${
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
                        <td colSpan={4} className="p-1.5 text-right uppercase text-[9px] whitespace-nowrap">Subtotal Pengiriman:</td>
                        <td className="p-1.5 text-center whitespace-nowrap text-[9px]">{kpi.totalPcs.toLocaleString('id-ID')} Pcs</td>
                        <td className="p-1.5 text-right whitespace-nowrap tabular-nums text-[9px]">{formatRp(kpi.totalRevenue)}</td>
                        <td className="p-1.5 text-right text-rose-600 whitespace-nowrap tabular-nums text-[9px]">{formatRp(kpi.totalCost)}</td>
                        <td className="p-1.5 text-right text-emerald-700 whitespace-nowrap tabular-nums text-[9px]">{formatRp(kpi.grossProfit)}</td>
                        <td className="p-1.5 text-center text-indigo-700 whitespace-nowrap text-[9px]">
                          {kpi.totalRevenue > 0 ? ((kpi.grossProfit / kpi.totalRevenue) * 100).toFixed(1) : 0}%
                        </td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </div>

            {/* Table 2: Rincian Pemakaian Kain (Jika Ada) */}
            {fabricItems && fabricItems.length > 0 && (
              <div className="space-y-1.5 pt-1.5">
                <div className="text-[10.5px] font-bold uppercase tracking-wider text-rose-800 flex justify-between items-center">
                  <span className="flex items-center gap-1.5">
                    <Scissors className="w-3.5 h-3.5" />
                    2. Rincian Pemakaian & Beban Modal Kain
                  </span>
                  <span className="text-slate-400 font-normal">Total {fabricItems.length} Rol Terpakai</span>
                </div>

                <div className="border border-rose-200 rounded-lg overflow-hidden">
                  <table className="w-full text-left text-xs border-collapse table-fixed">
                    <colgroup>
                      <col style={{ width: '18%' }} />
                      <col style={{ width: '28%' }} />
                      <col style={{ width: '14%' }} />
                      <col style={{ width: '12%' }} />
                      <col style={{ width: '14%' }} />
                      <col style={{ width: '14%' }} />
                    </colgroup>
                    <thead className="bg-rose-50/80 text-rose-900 font-bold text-[8.5px] uppercase border-b border-rose-200">
                      <tr>
                        <th className="p-1.5 whitespace-nowrap">Kode Rol Kain</th>
                        <th className="p-1.5">Jenis / Nama Bahan Kain</th>
                        <th className="p-1.5 whitespace-nowrap">Tgl Masuk</th>
                        <th className="p-1.5 text-center whitespace-nowrap">Meter Terpakai</th>
                        <th className="p-1.5 text-right whitespace-nowrap">Harga Modal / m</th>
                        <th className="p-1.5 text-right whitespace-nowrap">Total Beban Kain</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-rose-100">
                      {fabricItems.map((f, idx) => (
                        <tr key={f.id || idx} className="hover:bg-rose-50/40">
                          <td className="p-1.5 font-mono font-bold text-rose-900 whitespace-nowrap text-[9px] truncate">{f.rollCode}</td>
                          <td className="p-1.5 font-semibold text-slate-800 text-[9px] break-words leading-tight">{f.jenisKain}</td>
                          <td className="p-1.5 text-slate-500 whitespace-nowrap text-[8.5px]">{f.tanggalMasuk ? formatDateIndo(f.tanggalMasuk) : '-'}</td>
                          <td className="p-1.5 text-center font-bold text-slate-800 whitespace-nowrap font-mono text-[9px]">{f.meterUsed} m</td>
                          <td className="p-1.5 text-right text-slate-700 whitespace-nowrap font-mono tabular-nums text-[9px]">{formatRp(f.hargaModalMeter)}</td>
                          <td className="p-1.5 text-right font-bold text-rose-700 whitespace-nowrap font-mono tabular-nums text-[9px]">{formatRp(f.totalNilaiKain)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-rose-50 font-bold border-t border-rose-300">
                      <tr>
                        <td colSpan={3} className="p-1.5 text-right uppercase text-[9px] text-rose-950">Total Beban Bahan Kain:</td>
                        <td className="p-1.5 text-center font-mono text-rose-950 text-[9px]">{kpi.fabricMeters || 0} m</td>
                        <td className="p-1.5"></td>
                        <td className="p-1.5 text-right text-rose-800 font-mono tabular-nums text-[9px]">{formatRp(kpi.totalFabricCost || 0)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            )}

            {/* Catatan Tambahan (Jika Ada) */}
            {notes && (
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-[10px] text-slate-600">
                <span className="font-bold text-slate-800 block mb-0.5">Catatan Tambahan Laporan:</span>
                <p className="whitespace-pre-wrap">{notes}</p>
              </div>
            )}

            {/* Signature Area */}
            <div className="pt-6 flex justify-between text-center text-[10px] text-slate-600 border-t border-slate-200 mt-6">
              <div className="w-44">
                <div className="text-slate-400 mb-10">Dibuat Oleh (Finance),</div>
                <div className="border-b border-slate-400 font-bold text-slate-800 pb-0.5">Admin Keuangan & P&L</div>
                <div className="text-[9px] text-slate-400 mt-0.5">Maison Rayyan Manufacturing</div>
              </div>
              <div className="w-44">
                <div className="text-slate-400 mb-10">Mengetahui & Menyetujui,</div>
                <div className="border-b border-slate-400 font-bold text-slate-800 pb-0.5">Owner / Direktur Utama</div>
                <div className="text-[9px] text-slate-400 mt-0.5">Maison Rayyan Manufacturing</div>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};
