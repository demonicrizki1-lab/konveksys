import React, { useRef } from 'react';
import { BuyerInvoiceSummary } from '../../types';
import { Printer, X, Download, FileText } from 'lucide-react';
import { printIsolatedDocument } from '../../utils/printHelper';

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
    const docTitle = `Invoice_${invoice.brand}_${safeInvoiceNo}`;
    printIsolatedDocument(paperRef.current, docTitle);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-hidden">
      <div className="bg-slate-100 rounded-2xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-300 overflow-hidden animate-slideUp">
        
        {/* Sticky Top Control Toolbar (Selalu terlihat di atas & tidak terpotong) */}
        <div className="bg-white px-5 py-3.5 border-b border-slate-200 flex items-center justify-between shrink-0 z-30 shadow-xs">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <span>Invoice Tagihan Digital (1 Halaman A4)</span>
                <span className="text-slate-400">•</span>
                <span className="text-emerald-700">{invoice.brand}</span>
              </div>
              <div className="text-[11px] font-mono text-slate-500">{invoice.invoiceNo}</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportPDF}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-sm flex items-center gap-1.5 transition btn-press"
              title="Download & Simpan Invoice sebagai file PDF (Murni 1 Halaman)"
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
          
          {/* Printable Invoice Paper Area (Format A4 Standar Murni) */}
          <div
            ref={paperRef}
            id="invoice-paper"
            className="bg-white rounded-xl shadow-lg border border-slate-200 p-6 sm:p-8 space-y-4 text-slate-800 max-w-3xl w-full my-auto"
          >
            {/* Header Kop Perusahaan */}
            <div className="flex justify-between items-start border-b-2 border-slate-900 pb-3">
              <div>
                <h2 className="text-xl font-bold tracking-tight text-slate-900">MAISON RAYYAN MANUFACTURING</h2>
                <p className="text-xs text-slate-500 mt-0.5">Konveksi & Makloon Garment Terpadu</p>
                <p className="text-[10px] text-slate-400">Jl. Industri Makloon No. 88, Bandung • Telp: 0812-3456-7890</p>
              </div>
              <div className="text-right">
                <span className="badge-green bg-emerald-700 text-white text-[11px] font-bold px-3 py-1 rounded uppercase tracking-wider inline-block">
                  INVOICE TAGIHAN
                </span>
                <div className="text-xs font-mono font-bold text-slate-800 mt-1.5">{invoice.invoiceNo}</div>
                <div className="text-[11px] text-slate-500">Tgl: {formatDateIndo(invoice.tanggal)}</div>
              </div>
            </div>

            {/* Client & Payment Details */}
            <div className="box-gray grid grid-cols-2 gap-4 text-xs bg-slate-50 p-3 rounded-xl border border-slate-200">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Ditagihkan Kepada (Buyer):</span>
                <strong className="text-slate-900 text-sm font-bold">{invoice.brand}</strong>
                <div className="text-slate-500 text-[11px] mt-0.5">Partner Brand Makloon Resmi</div>
                {invoice.periodeLabel && (
                  <div className="text-[11px] text-emerald-800 font-semibold mt-1">
                    Periode: {invoice.periodeLabel}
                  </div>
                )}
              </div>
              <div className="text-right">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Jatuh Tempo Pembayaran:</span>
                <strong className="text-rose text-rose-600 text-sm font-bold">{formatDateIndo(invoice.jatuhTempo)}</strong>
                <div className="text-[10px] text-slate-500 mt-0.5">Transfer BCA 123-456-7890 a/n Maison Rayyan</div>
              </div>
            </div>

            {/* Table of Delivered Items & Multi-Size Rates */}
            <div className="space-y-1.5">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
                Rincian Pengiriman Barang (Berdasarkan Surat Jalan & Matriks Harga)
              </div>
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-900 text-white font-bold text-[9px] uppercase">
                    <tr>
                      <th className="p-2 w-[17%] whitespace-nowrap">No Surat Jalan</th>
                      <th className="p-2 w-[17%]">Artikel Produk</th>
                      <th className="p-2 w-[27%]">Rincian Size & Tarif DB</th>
                      <th className="p-2 w-[15%] text-right whitespace-nowrap">Harga</th>
                      <th className="p-2 w-[9%] text-center whitespace-nowrap">Total Qty</th>
                      <th className="p-2 w-[15%] text-right whitespace-nowrap">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {invoice.items.map((item, idx) => (
                      <tr key={idx} className="align-top">
                        <td className="p-2 whitespace-nowrap">
                          <div className="font-mono font-bold text-indigo-700">{item.suratJalanNo}</div>
                          <span className="text-[10px] text-slate-500 font-medium block mt-0.5">
                            {formatDateIndo(item.tanggal)}
                          </span>
                        </td>
                        <td className="p-2">
                          <div className="font-bold text-slate-900">{item.produk}</div>
                          {item.jenisKain && (
                            <div className="text-[10px] text-slate-500 font-normal mt-0.5">{item.jenisKain}</div>
                          )}
                        </td>
                        <td className="p-2 text-[11px] space-y-0.5 text-slate-700">
                          {item.qtySML > 0 && (
                            <div className="whitespace-nowrap">S/M/L ({item.qtySML} pcs x {formatRp(item.rateSML)})</div>
                          )}
                          {item.qtyXL > 0 && (
                            <div className="whitespace-nowrap">XL/2XL ({item.qtyXL} pcs x {formatRp(item.rateXL)})</div>
                          )}
                          {item.qtyAnak4 > 0 && (
                            <div className="whitespace-nowrap">Anak 4 ({item.qtyAnak4} pcs x {formatRp(item.rateAnak4)})</div>
                          )}
                          {item.qtyAnak6 > 0 && (
                            <div className="whitespace-nowrap">Anak 6 ({item.qtyAnak6} pcs x {formatRp(item.rateAnak6)})</div>
                          )}
                          {item.qtyAnak8 > 0 && (
                            <div className="whitespace-nowrap">Anak 8 ({item.qtyAnak8} pcs x {formatRp(item.rateAnak8)})</div>
                          )}
                          {item.qtyAnak10 > 0 && (
                            <div className="whitespace-nowrap">Anak 10 ({item.qtyAnak10} pcs x {formatRp(item.rateAnak10)})</div>
                          )}
                          {item.qtyAnak12 > 0 && (
                            <div className="whitespace-nowrap">Anak 12 ({item.qtyAnak12} pcs x {formatRp(item.rateAnak12)})</div>
                          )}
                          {item.qtyAnak14 > 0 && (
                            <div className="whitespace-nowrap">Anak 14 ({item.qtyAnak14} pcs x {formatRp(item.rateAnak14)})</div>
                          )}
                          {item.qtyAnak16 > 0 && (
                            <div className="whitespace-nowrap">Anak 16 ({item.qtyAnak16} pcs x {formatRp(item.rateAnak16)})</div>
                          )}
                        </td>
                        <td className="p-2 text-[11px] space-y-0.5 text-right font-medium text-slate-800 whitespace-nowrap" style={{ whiteSpace: 'nowrap' }}>
                          {item.qtySML > 0 && (
                            <div>{formatRp(item.qtySML * item.rateSML)}</div>
                          )}
                          {item.qtyXL > 0 && (
                            <div>{formatRp(item.qtyXL * item.rateXL)}</div>
                          )}
                          {item.qtyAnak4 > 0 && (
                            <div>{formatRp(item.qtyAnak4 * item.rateAnak4)}</div>
                          )}
                          {item.qtyAnak6 > 0 && (
                            <div>{formatRp(item.qtyAnak6 * item.rateAnak6)}</div>
                          )}
                          {item.qtyAnak8 > 0 && (
                            <div>{formatRp(item.qtyAnak8 * item.rateAnak8)}</div>
                          )}
                          {item.qtyAnak10 > 0 && (
                            <div>{formatRp(item.qtyAnak10 * item.rateAnak10)}</div>
                          )}
                          {item.qtyAnak12 > 0 && (
                            <div>{formatRp(item.qtyAnak12 * item.rateAnak12)}</div>
                          )}
                          {item.qtyAnak14 > 0 && (
                            <div>{formatRp(item.qtyAnak14 * item.rateAnak14)}</div>
                          )}
                          {item.qtyAnak16 > 0 && (
                            <div>{formatRp(item.qtyAnak16 * item.rateAnak16)}</div>
                          )}
                        </td>
                        <td className="p-2 text-center font-bold text-slate-800 whitespace-nowrap">{item.totalPcs} Pcs</td>
                        <td className="p-2 text-right font-bold text-slate-900 whitespace-nowrap" style={{ whiteSpace: 'nowrap' }}>
                          {formatRp(item.totalAmount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Grand Total Summary */}
            <div className="box-gray bg-slate-50 p-3 rounded-xl border border-slate-200 flex justify-between items-center">
              <div className="text-xs text-slate-500 text-left">
                <div>Total Akumulasi Barang: <strong className="text-slate-900">{invoice.totalPcs} Pcs</strong></div>
                <div className="text-[10px] text-slate-400">Terima kasih atas kerja samanya.</div>
              </div>
              <div className="text-right">
                <div className="text-[10px] text-slate-500 font-bold uppercase">Total Tagihan (Grand Total):</div>
                <div className="text-xl font-bold text-emerald text-emerald-700">{formatRp(invoice.grandTotal)}</div>
              </div>
            </div>

            {/* Signatures Table: Pasti 2 Kolom Sejajar (Kiri Buyer, Kanan Maison Rayyan) */}
            <table style={{ width: '100%', border: 'none', marginTop: '20px', borderCollapse: 'collapse' }}>
              <tbody>
                <tr>
                  <td style={{ width: '45%', textAlign: 'center', border: 'none', padding: '0', verticalAlign: 'top' }}>
                    <div style={{ color: '#64748b', fontSize: '11px', marginBottom: '45px' }}>Disetujui Oleh (Buyer)</div>
                    <div style={{ borderTop: '1.5px solid #0f172a', fontWeight: 'bold', fontSize: '11px', color: '#0f172a', paddingTop: '6px' }}>
                      ( {invoice.brand} )
                    </div>
                  </td>
                  <td style={{ width: '10%', border: 'none', padding: '0' }}></td>
                  <td style={{ width: '45%', textAlign: 'center', border: 'none', padding: '0', verticalAlign: 'top' }}>
                    <div style={{ color: '#64748b', fontSize: '11px', marginBottom: '45px' }}>Hormat Kami (Finance)</div>
                    <div style={{ borderTop: '1.5px solid #0f172a', fontWeight: 'bold', fontSize: '11px', color: '#0f172a', paddingTop: '6px' }}>
                      ( Maison Rayyan Mfg )
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>

          </div>

        </div>

      </div>
    </div>
  );
};
