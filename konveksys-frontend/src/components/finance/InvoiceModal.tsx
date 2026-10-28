import React, { useRef } from 'react';
import { BuyerInvoiceSummary } from '../../types';
import { Printer, X, Download, FileText, Package, Scissors, Calendar, Building2 } from 'lucide-react';
import { printIsolatedDocument } from '../../utils/printHelper';
import ttdRizkiMaulana from '../../assets/ttd-rizki-maulana.png';
import ttdCecepDayat from '../../assets/ttd-cecep-dayat.png';

interface InvoiceModalProps {
  invoice: BuyerInvoiceSummary;
  onClose: () => void;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({ invoice, onClose }) => {
  const paperRef = useRef<HTMLDivElement>(null);
  const formatRp = (amount: number) => 'Rp ' + amount.toLocaleString('id-ID');

  const formatDateIndo = (dateStr?: string) => {
    if (!dateStr) return '-';
    try {
      const clean = dateStr.split('T')[0];
      const parts = clean.split('-');
      if (parts.length === 3) {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
        const day = parts[2];
        const mIdx = parseInt(parts[1], 10) - 1;
        const year = parts[0];
        return `${day} ${months[mIdx] || ''} ${year}`;
      }
      return clean;
    } catch {
      return dateStr;
    }
  };

  const handleExportPDF = () => {
    if (!paperRef.current) return;
    const safeInvoiceNo = (invoice.invoiceNo || 'INV').replace(/[/\\?%*:|"<>]/g, '-');
    const safePoNo = invoice.poInfo?.noPO ? `_${invoice.poInfo.noPO.replace(/[/\\?%*:|"<>]/g, '-')}` : '';
    const docTitle = `Invoice_${invoice.brand}${safePoNo}_${safeInvoiceNo}`;
    printIsolatedDocument(paperRef.current, docTitle);
  };

  const hasFabricDeductions = (invoice.fabricItems && invoice.fabricItems.length > 0) || (invoice.totalFabricDeduction || 0) > 0;

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-hidden">
      <div className="bg-slate-100 rounded-2xl max-w-4xl w-full max-h-[94vh] flex flex-col shadow-2xl border border-slate-300 overflow-hidden animate-slideUp">
        
        {/* Sticky Top Control Toolbar */}
        <div className="bg-white px-5 py-3.5 border-b border-slate-200 flex items-center justify-between shrink-0 z-30 shadow-xs">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <span>Invoice Tagihan Buyer Resmi</span>
                {invoice.poInfo?.noPO && (
                  <span className="font-mono font-bold text-blue-700 bg-blue-50 border border-blue-200 px-1.5 py-0.2 rounded text-[10.5px]">
                    PO: {invoice.poInfo.noPO}
                  </span>
                )}
                <span className="text-slate-400">•</span>
                <span className="text-emerald-700">{invoice.brand}</span>
              </div>
              <div className="text-[11px] font-mono text-slate-500">{invoice.invoiceNo}</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportPDF}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-sm flex items-center gap-1.5 transition btn-press cursor-pointer"
              title="Download & Simpan Invoice sebagai file PDF"
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
          
          {/* Printable Invoice Paper Area (Format A4 Standar) */}
          <div
            ref={paperRef}
            id="invoice-paper"
            className="bg-white rounded-xl shadow-lg border border-slate-200 p-6 sm:p-8 space-y-4 text-slate-800 max-w-3xl w-full my-auto text-xs"
          >
            {/* Header Kop Perusahaan */}
            <div className="flex justify-between items-start border-b-2 border-slate-900 pb-3">
              <div className="flex items-center gap-3.5">
                <img
                  src="/logo-maison-rayyan.png"
                  alt="Maison Rayyan Manufacturing"
                  className="h-14 sm:h-16 w-auto object-contain shrink-0"
                />
                <div>
                  <h2 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 leading-tight">MAISON RAYYAN MANUFACTURING</h2>
                  <p className="text-[11px] text-slate-500 mt-0.5">Konveksi & Makloon Garment Terpadu</p>
                  <p className="text-[9.5px] text-slate-400">Jl. Industri Makloon No. 88, Bandung • Telp: 0812-3456-7890</p>
                </div>
              </div>
              <div className="text-right shrink-0">
                <span className="bg-emerald-700 text-white text-[10px] font-bold px-2.5 py-1 rounded uppercase tracking-wider inline-block">
                  INVOICE TAGIHAN BUYER
                </span>
                <div className="text-xs font-mono font-bold text-slate-800 mt-1">{invoice.invoiceNo}</div>
                <div className="text-[10px] text-slate-500">Tgl: {formatDateIndo(invoice.tanggal || new Date().toISOString().split('T')[0])}</div>
              </div>
            </div>

            {/* Client, Payment Details & PO Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1">
                <span className="text-slate-400 block text-[9.5px] uppercase font-bold tracking-wider">Ditagihkan Kepada (Buyer):</span>
                <strong className="text-slate-900 text-sm font-bold block">{invoice.brand}</strong>
                <div className="text-slate-500 text-[10.5px]">Partner Brand Makloon / Pemesan</div>
                <div className="pt-1 border-t border-slate-200 mt-1 flex items-center justify-between text-[10px]">
                  <span className="text-slate-500">Jatuh Tempo:</span>
                  <span className="font-bold text-rose-600">{formatDateIndo(invoice.jatuhTempo)}</span>
                </div>
              </div>

              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1">
                <span className="text-slate-400 block text-[9.5px] uppercase font-bold tracking-wider">Pembayaran Rekening Resmi:</span>
                <div className="flex items-center justify-between">
                  <strong className="text-slate-900 text-xs font-bold font-mono">BCA 3760923906</strong>
                  <span className="text-[9.5px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">Transfer</span>
                </div>
                <div className="text-[10.5px] text-slate-600">a/n Cecep Dayat</div>
                <div className="pt-1 border-t border-slate-200 mt-1 flex items-center justify-between text-[10px]">
                  <span className="text-slate-500">Status Pembayaran:</span>
                  <span className="font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">Menunggu Pembayaran</span>
                </div>
              </div>
            </div>

            {/* Informasi PO Produksi Terkait (Multi-PO) */}
            {invoice.poInfo && (
              <div className="bg-indigo-50/70 border border-indigo-200 rounded-lg p-3 space-y-2.5">
                {/* PO Badges Header */}
                <div className="flex items-center justify-between flex-wrap gap-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-1.5 py-0.5 rounded bg-indigo-200 text-indigo-900 text-[9px] font-bold uppercase tracking-wider">
                      Rujukan PO Produksi
                    </span>
                    {(invoice.poInfo.selectedPoNumbers || [invoice.poInfo.noPO]).map((poNo, i) => (
                      <span key={i} className="font-mono font-bold text-indigo-950 text-[11px] bg-indigo-100 px-1.5 py-0.5 rounded border border-indigo-200">
                        {poNo}
                      </span>
                    ))}
                  </div>
                  {invoice.poInfo.vendorTujuan && (
                    <span className="text-[10px] text-indigo-800 font-medium">
                      Workshop: <b>{invoice.poInfo.vendorTujuan}</b>
                    </span>
                  )}
                </div>

                {/* Per-PO Detail List (for multi-PO) */}
                {invoice.poInfo.pos && invoice.poInfo.pos.length > 1 && (
                  <div className="border border-indigo-200 rounded overflow-hidden bg-white shadow-2xs">
                    <table className="w-full text-center text-[10px] border-collapse">
                      <thead className="bg-indigo-100/70 text-indigo-950 font-bold uppercase text-[8px] border-b border-indigo-200">
                        <tr>
                          <th className="py-1 px-1.5 text-left border-r border-indigo-200">No. PO</th>
                          <th className="py-1 px-1.5 text-left border-r border-indigo-200">Workshop</th>
                          <th className="py-1 px-1.5 text-center border-r border-indigo-200">Tgl PO</th>
                          <th className="py-1 px-1.5 text-center border-r border-indigo-200">Deadline</th>
                          <th className="py-1 px-1.5 text-center border-r border-indigo-200">Target Qty</th>
                          <th className="py-1 px-1.5 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-indigo-50 text-slate-800">
                        {invoice.poInfo.pos.map((po, idx) => (
                          <tr key={idx} className="hover:bg-indigo-50/30">
                            <td className="py-1 px-1.5 text-left font-mono font-bold text-indigo-800 border-r border-indigo-100">{po.noPO}</td>
                            <td className="py-1 px-1.5 text-left text-slate-700 border-r border-indigo-100">{po.vendorTujuan || '-'}</td>
                            <td className="py-1 px-1.5 text-center text-slate-600 border-r border-indigo-100">{formatDateIndo(po.tanggalPO)}</td>
                            <td className="py-1 px-1.5 text-center text-slate-600 border-r border-indigo-100">{formatDateIndo(po.targetDeadline)}</td>
                            <td className="py-1 px-1.5 text-center font-mono font-bold text-indigo-700 border-r border-indigo-100">{(po.targetPcs || 0).toLocaleString('id-ID')} Pcs</td>
                            <td className="py-1 px-1.5 text-center">
                              <span className={`px-1.5 py-0.2 rounded-full text-[8px] font-bold ${
                                po.status === 'SELESAI' ? 'bg-emerald-100 text-emerald-800' : 'bg-indigo-100 text-indigo-800'
                              }`}>{po.status}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Aggregate Metrics */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px] pt-1 border-t border-indigo-100 text-indigo-950">
                  <div>
                    <span className="text-indigo-600 block text-[9px]">Tgl Terbit PO:</span>
                    <span className="font-semibold">{formatDateIndo(invoice.poInfo.tanggalPO)}</span>
                  </div>
                  <div>
                    <span className="text-indigo-600 block text-[9px]">Target Total PO:</span>
                    <span className="font-bold font-mono">{(invoice.poInfo.totalTargetPcs || invoice.poInfo.targetPcs || 0).toLocaleString('id-ID')} Pcs</span>
                  </div>
                  <div>
                    <span className="text-indigo-600 block text-[9px]">Realisasi Terkirim:</span>
                    <span className="font-bold font-mono text-emerald-700">{(invoice.poInfo.totalDeliveredPcs || invoice.totalPcs || 0).toLocaleString('id-ID')} Pcs</span>
                  </div>
                  <div>
                    <span className="text-indigo-600 block text-[9px]">Sisa Belum Terkirim:</span>
                    <span className={`font-bold font-mono ${(invoice.poInfo.totalRemainingPcs || 0) > 0 ? 'text-amber-700' : 'text-slate-400'}`}>
                      {(invoice.poInfo.totalRemainingPcs || 0).toLocaleString('id-ID')} Pcs
                    </span>
                  </div>
                </div>

                {/* Rincian Tabel Item PO & Progres Pengiriman */}
                {invoice.poInfo.itemsProgress && invoice.poInfo.itemsProgress.length > 0 && (
                  <div className="pt-2 border-t border-indigo-200/80 space-y-1">
                    <div className="flex items-center justify-between text-[9.5px] font-bold uppercase tracking-wider text-indigo-950">
                      <span>Rincian Item PO & Progres Pengiriman:</span>
                      <span className="text-indigo-700 font-medium lowercase text-[9px]">
                        {invoice.poInfo.itemsProgress.length} item pesanan
                      </span>
                    </div>

                    <div className="border border-indigo-200 rounded overflow-hidden bg-white shadow-2xs">
                      <table className="w-full text-center text-[10px] border-collapse">
                        <thead className="bg-indigo-100/70 text-indigo-950 font-bold uppercase text-[8.5px] border-b border-indigo-200">
                          <tr>
                            <th className="py-1 px-1 w-6 border-r border-indigo-200 text-center">No</th>
                            {(invoice.poInfo.selectedPoNumbers || []).length > 1 && (
                              <th className="py-1 px-1.5 border-r border-indigo-200 text-left">No. PO</th>
                            )}
                            <th className="py-1 px-1.5 text-left border-r border-indigo-200">Model / Nama Artikel</th>
                            <th className="py-1 px-1.5 border-r border-indigo-200 text-center">Warna</th>
                            <th className="py-1 px-1.5 border-r border-indigo-200 text-center">Size</th>
                            <th className="py-1 px-1.5 border-r border-indigo-200 text-center font-mono">Target PO</th>
                            <th className="py-1 px-1.5 border-r border-indigo-200 text-center font-mono">Terkirim</th>
                            <th className="py-1 px-1.5 border-r border-indigo-200 text-center font-mono" style={{ color: '#b45309' }}>Sisa*</th>
                            <th className="py-1 px-1.5 text-left">Bahan / Kain</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-indigo-50 text-slate-800">
                          {invoice.poInfo.itemsProgress.map((it, idx) => (
                            <tr key={idx} className="hover:bg-indigo-50/30">
                              <td className="py-1 px-1 text-slate-400 font-mono border-r border-indigo-100 text-[9px] text-center">{idx + 1}</td>
                              {(invoice.poInfo!.selectedPoNumbers || []).length > 1 && (
                                <td className="py-1 px-1.5 text-left font-mono text-indigo-700 text-[9px] border-r border-indigo-100">{it.poNumber}</td>
                              )}
                              <td className="py-1 px-1.5 text-left font-bold text-slate-900 border-r border-indigo-100">{it.namaProduk}</td>
                              <td className="py-1 px-1.5 text-slate-700 border-r border-indigo-100 text-center">{it.warna || '-'}</td>
                              <td className="py-1 px-1.5 font-bold text-slate-800 border-r border-indigo-100 text-center">{it.ukuran || '-'}</td>
                              <td className="py-1 px-1.5 font-mono font-bold text-indigo-700 border-r border-indigo-100 text-center">
                                {it.targetQty.toLocaleString('id-ID')}
                              </td>
                              <td className="py-1 px-1.5 font-mono font-bold text-emerald-700 border-r border-indigo-100 text-center">
                                {it.deliveredQty.toLocaleString('id-ID')}
                              </td>
                              <td className={`py-1 px-1.5 font-mono font-bold border-r border-indigo-100 text-center ${it.remainingQty > 0 ? 'text-amber-700 bg-amber-50/50' : 'text-slate-400'}`}>
                                {it.remainingQty.toLocaleString('id-ID')}
                              </td>
                              <td className="py-1 px-1.5 text-left text-slate-600 text-[9px]">{it.bahanKain || '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot className="bg-indigo-50/80 font-bold border-t border-indigo-200 text-[9.5px]">
                          <tr>
                            <td colSpan={(invoice.poInfo.selectedPoNumbers || []).length > 1 ? 5 : 4} className="py-1 px-2 text-right uppercase tracking-wider text-indigo-950">
                              Total:
                            </td>
                            <td className="py-1 px-1.5 text-center text-indigo-950 font-mono">
                              {(invoice.poInfo.totalTargetPcs || 0).toLocaleString('id-ID')} Pcs
                            </td>
                            <td className="py-1 px-1.5 text-center text-emerald-700 font-mono">
                              {(invoice.poInfo.totalDeliveredPcs || 0).toLocaleString('id-ID')} Pcs
                            </td>
                            <td className={`py-1 px-1.5 text-center font-mono ${(invoice.poInfo.totalRemainingPcs || 0) > 0 ? 'text-amber-700' : 'text-slate-400'}`}>
                              {(invoice.poInfo.totalRemainingPcs || 0).toLocaleString('id-ID')} Pcs
                            </td>
                            <td className="py-1 px-1.5"></td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>

                    {/* Footnote / Disclaimer */}
                    <div className="text-[8.5px] text-slate-500 italic pt-1 flex items-start gap-1">
                      <span className="text-amber-600 font-bold">*</span>
                      <span>
                        Kolom "Sisa Belum Terkirim" merupakan acuan progres produksi bagi Buyer. 
                        Tagihan invoice di bawah murni hanya menghitung barang yang telah terkirim via Surat Jalan.
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TABEL 1: Rincian Pengiriman Surat Jalan (Barang Jadi) */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[10.5px] font-bold uppercase tracking-wider text-slate-700">
                <span>1. Rincian Pengiriman Barang (Surat Jalan)</span>
                <span className="text-slate-500 font-normal lowercase text-[10px]">
                  {invoice.items.length} transaksi pengiriman
                </span>
              </div>
              <div className="border border-slate-300 rounded-lg overflow-hidden">
                <table className="w-full text-left text-[11px] border-collapse">
                  <thead className="bg-slate-100 text-slate-700 font-bold text-[9px] uppercase border-b border-slate-300">
                    <tr>
                      <th className="p-2 w-[16%] whitespace-nowrap">No Surat Jalan</th>
                      <th className="p-2 w-[18%]">Artikel Produk</th>
                      <th className="p-2 w-[34%]">Rincian Size & Tarif</th>
                      <th className="p-2 w-[14%] text-center whitespace-nowrap">Total Qty</th>
                      <th className="p-2 w-[18%] text-right whitespace-nowrap">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {invoice.items.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-4 text-center text-slate-400 italic">
                          Tidak ada surat jalan yang dipilih.
                        </td>
                      </tr>
                    ) : (
                      invoice.items.map((item, idx) => (
                        <tr key={idx} className="align-top hover:bg-slate-50/50">
                          <td className="p-2 whitespace-nowrap">
                            <div className="font-mono font-bold text-indigo-700">{item.suratJalanNo}</div>
                            <span className="text-[9.5px] text-slate-500 font-medium block mt-0.5">
                              {formatDateIndo(item.tanggal)}
                            </span>
                            {item.itemPo && (
                              <span className="text-[9px] font-mono font-bold text-blue-700 bg-blue-50 border border-blue-200 px-1 py-0.2 rounded mt-0.5 inline-block">
                                PO: {item.itemPo}
                              </span>
                            )}
                          </td>
                          <td className="p-2">
                            <div className="font-bold text-slate-900">{item.produk}</div>
                            {item.jenisKain && (
                              <div className="text-[9.5px] text-slate-500 font-normal mt-0.5">{item.jenisKain}</div>
                            )}
                          </td>
                          <td className="p-2 text-[10px] space-y-0.5 text-slate-700">
                            {item.qtyS > 0 && <div>Size S: {item.qtyS} pcs @ {formatRp(item.rateS)}</div>}
                            {item.qtyM > 0 && <div>Size M: {item.qtyM} pcs @ {formatRp(item.rateM)}</div>}
                            {item.qtyL > 0 && <div>Size L: {item.qtyL} pcs @ {formatRp(item.rateL)}</div>}
                            {item.qtyXL > 0 && <div>Size XL: {item.qtyXL} pcs @ {formatRp(item.rateXL)}</div>}
                            {item.qtyXXL > 0 && <div>Size 2XL: {item.qtyXXL} pcs @ {formatRp(item.rateXXL)}</div>}
                            {!item.qtyS && !item.qtyM && !item.qtyL && (item.qtySML || 0) > 0 && (
                              <div>Size Huruf: {item.qtySML} pcs @ {formatRp(item.rateSML || 0)}</div>
                            )}
                            {item.qtyAnak2 > 0 && <div>Anak 2: {item.qtyAnak2} pcs @ {formatRp(item.rateAnak2)}</div>}
                            {item.qtyAnak4 > 0 && <div>Anak 4: {item.qtyAnak4} pcs @ {formatRp(item.rateAnak4)}</div>}
                            {item.qtyAnak6 > 0 && <div>Anak 6: {item.qtyAnak6} pcs @ {formatRp(item.rateAnak6)}</div>}
                            {item.qtyAnak8 > 0 && <div>Anak 8: {item.qtyAnak8} pcs @ {formatRp(item.rateAnak8)}</div>}
                            {item.qtyAnak10 > 0 && <div>Anak 10: {item.qtyAnak10} pcs @ {formatRp(item.rateAnak10)}</div>}
                            {item.qtyAnak12 > 0 && <div>Anak 12: {item.qtyAnak12} pcs @ {formatRp(item.rateAnak12)}</div>}
                            {item.qtyAnak14 > 0 && <div>Anak 14: {item.qtyAnak14} pcs @ {formatRp(item.rateAnak14)}</div>}
                            {item.qtyAnak16 > 0 && <div>Anak 16: {item.qtyAnak16} pcs @ {formatRp(item.rateAnak16)}</div>}
                            {item.qtyAnak18 > 0 && <div>Anak 18: {item.qtyAnak18} pcs @ {formatRp(item.rateAnak18)}</div>}
                          </td>
                          <td className="p-2 text-center font-bold text-slate-800 whitespace-nowrap">
                            {item.totalPcs.toLocaleString('id-ID')} Pcs
                          </td>
                          <td className="p-2 text-right font-bold text-slate-900 whitespace-nowrap">
                            {formatRp(item.totalAmount)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                  <tfoot className="bg-slate-50 font-bold border-t border-slate-300 text-[10.5px]">
                    <tr>
                      <td colSpan={3} className="p-2 text-right uppercase tracking-wider text-slate-600">
                        Subtotal Tagihan Kiriman Barang:
                      </td>
                      <td className="p-2 text-center text-slate-900 font-mono">
                        {invoice.totalPcs.toLocaleString('id-ID')} Pcs
                      </td>
                      <td className="p-2 text-right text-slate-900 font-mono">
                        {formatRp(invoice.subtotalGross || invoice.grandTotal)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* TABEL 2: Rincian Kain yang Dipakai (Pengurang Tagihan) */}
            {hasFabricDeductions && (
              <div className="space-y-1 pt-1" style={{ breakInside: 'avoid' }}>
                <div className="flex items-center justify-between text-[10.5px] font-bold uppercase tracking-wider text-rose-700">
                  <div className="flex items-center gap-1.5">
                    <Scissors className="w-3.5 h-3.5" />
                    <span>2. Rincian Pemakaian Kain (Kompensasi / Pengurang Tagihan)</span>
                  </div>
                  <span className="text-rose-600 font-normal lowercase text-[10px]">
                    {invoice.fabricItems?.length || 0} rol kain
                  </span>
                </div>

                <div className="border border-rose-200 rounded-lg overflow-hidden bg-rose-50/20">
                  <table className="w-full text-left text-[11px] border-collapse">
                    <thead className="bg-rose-100/70 text-rose-900 font-bold text-[9px] uppercase border-b border-rose-200">
                      <tr>
                        <th className="p-2 w-[7%] text-center">No</th>
                        <th className="p-2 w-[16%]">Tgl Masuk</th>
                        <th className="p-2 w-[22%]">Kode Rol Kain</th>
                        <th className="p-2 w-[25%]">Jenis / Nama Kain</th>
                        <th className="p-2 w-[12%] text-center">Terpakai</th>
                        <th className="p-2 w-[18%] text-right">Nilai Kain</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-rose-100 text-slate-800">
                      {invoice.fabricItems?.map((fab, fIdx) => (
                        <tr key={fab.id || fIdx} className="align-top hover:bg-rose-50/40">
                          <td className="p-2 text-center font-mono text-slate-500 text-[10px]">{fIdx + 1}</td>
                          <td className="p-2 text-[10px] text-slate-600">{formatDateIndo(fab.tanggalMasuk)}</td>
                          <td className="p-2 font-mono font-bold text-rose-800">{fab.rollCode}</td>
                          <td className="p-2 font-medium">{fab.jenisKain}</td>
                          <td className="p-2 text-center font-mono font-bold text-slate-900">{fab.meterUsed} m</td>
                          <td className="p-2 text-right font-mono font-bold text-rose-700">
                            - {formatRp(fab.totalNilaiKain)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-rose-100/50 font-bold border-t border-rose-200 text-[10.5px]">
                      <tr>
                        <td colSpan={4} className="p-2 text-right uppercase tracking-wider text-rose-900">
                          Total Potongan Nilai Kain:
                        </td>
                        <td className="p-2 text-center text-rose-950 font-mono">
                          {invoice.totalFabricMeters || 0} m
                        </td>
                        <td className="p-2 text-right text-rose-700 font-mono">
                          - {formatRp(invoice.totalFabricDeduction || 0)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            )}

            {/* Kotak Kalkulasi Grand Total Bersih */}
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-300 space-y-2" style={{ breakInside: 'avoid' }}>
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200 pb-1">
                Kalkulasi Akhir Tagihan Buyer
              </div>
              
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-700">
                  <span>Subtotal Tagihan Barang Jadi ({invoice.totalPcs} Pcs):</span>
                  <span className="font-mono font-semibold">{formatRp(invoice.subtotalGross || invoice.grandTotal)}</span>
                </div>

                {hasFabricDeductions && (
                  <div className="flex justify-between text-rose-700">
                    <span>Potongan Total Pemakaian Kain ({invoice.totalFabricMeters || 0} m):</span>
                    <span className="font-mono font-semibold">- {formatRp(invoice.totalFabricDeduction || 0)}</span>
                  </div>
                )}

                <div className="flex justify-between items-center pt-2 border-t border-slate-300">
                  <div>
                    <span className="text-slate-900 font-bold text-xs uppercase block">Total Tagihan Bersih (Grand Total):</span>
                    <span className="text-[10px] text-slate-500">Nominal yang wajib dibayarkan oleh Buyer</span>
                  </div>
                  <div className="text-right font-mono font-bold text-emerald-700 text-lg sm:text-xl">
                    {formatRp(invoice.grandTotal)}
                  </div>
                </div>
              </div>
            </div>

            {/* 3-Kolom Tanda Tangan Resmi Sesuai Format List PO (Image 2) */}
            <div className="grid grid-cols-3 gap-3 pt-2 text-center" style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}>
              <div>
                <div className="text-[9px] text-slate-500 mb-0.5">Dibuat Oleh:</div>
                <div className="text-[10px] font-bold text-slate-800 whitespace-nowrap">Admin Produksi</div>
                <div className="relative h-10 flex items-end justify-center">
                  <img 
                    src={ttdRizkiMaulana} 
                    alt="Tanda Tangan Rizki Maulana" 
                    className="absolute bottom-[-1px] h-8 max-w-[120px] w-auto object-contain pointer-events-none select-none z-10" 
                  />
                  <div className="w-28 border-b border-slate-400"></div>
                </div>
                <div className="text-[9px] text-slate-700 mt-0.5 font-mono font-medium whitespace-nowrap">( Rizki Maulana )</div>
              </div>

              <div>
                <div className="text-[9px] text-slate-500 mb-0.5">Disetujui:</div>
                <div className="text-[10px] font-bold text-slate-800 whitespace-nowrap">Pimpinan / Kepala Workshop</div>
                <div className="relative h-10 flex items-end justify-center">
                  <img 
                    src={ttdCecepDayat} 
                    alt="Tanda Tangan Cecep Dayat" 
                    className="absolute bottom-[-1px] h-8 max-w-[120px] w-auto object-contain pointer-events-none select-none z-10" 
                  />
                  <div className="w-28 border-b border-slate-400"></div>
                </div>
                <div className="text-[9px] text-slate-700 mt-0.5 font-mono font-medium whitespace-nowrap">( Cecep Dayat )</div>
              </div>

              <div>
                <div className="text-[9px] text-slate-500 mb-0.5">Diterima & Diverifikasi:</div>
                <div className="text-[10px] font-bold text-slate-800 whitespace-nowrap">Perwakilan Buyer / Brand</div>
                <div className="h-10 flex items-end justify-center">
                  <div className="w-28 border-b border-slate-400"></div>
                </div>
                <div className="text-[9px] text-slate-700 mt-0.5 font-mono font-medium whitespace-nowrap">
                  ( {invoice.brand} )
                </div>
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};
