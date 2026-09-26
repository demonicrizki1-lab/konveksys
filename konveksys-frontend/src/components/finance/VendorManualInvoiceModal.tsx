import React, { useRef } from 'react';
import { VendorManualInvoice } from '../../types';
import { Printer, X, Download, FileText, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { printIsolatedDocument } from '../../utils/printHelper';

interface VendorManualInvoiceModalProps {
  invoice: VendorManualInvoice;
  onClose: () => void;
}

export const VendorManualInvoiceModal: React.FC<VendorManualInvoiceModalProps> = ({ invoice, onClose }) => {
  const paperRef = useRef<HTMLDivElement>(null);
  const formatRp = (amount: number) => 'Rp ' + (amount || 0).toLocaleString('id-ID');

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
    const safeInvoiceNo = (invoice.invoiceNo || 'INV-MAN').replace(/[/\\?%*:|"<>]/g, '-');
    const safeVendor = (invoice.vendor || 'Vendor').replace(/[/\\?%*:|"<>]/g, '-');
    const docTitle = `InvoiceManual_${safeVendor}_${safeInvoiceNo}`;
    printIsolatedDocument(paperRef.current, docTitle);
  };

  const getKategoriLabel = (cat: string) => {
    switch (cat) {
      case 'DP_ONGKOS_JAHIT':
        return 'Uang Muka Ongkos Jahit (DP Pra-Kirim)';
      case 'PELUNASAN_DIMUKA':
        return 'Pelunasan Dimuka (Sebelum Barang Dikirim)';
      case 'TALANGAN_OPERASIONAL':
        return 'Talangan Operasional Jahit';
      case 'BORONGAN_KHUSUS':
        return 'Borongan Jahit Khusus';
      default:
        return 'Pembayaran Manual Vendor';
    }
  };

  const isPaid = invoice.status === 'DIBAYAR';

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-hidden">
      <div className="bg-slate-100 rounded-2xl max-w-3xl w-full max-h-[94vh] flex flex-col shadow-2xl border border-slate-300 overflow-hidden animate-slideUp">
        
        {/* Top Control Toolbar */}
        <div className="bg-white px-5 py-3.5 border-b border-slate-200 flex items-center justify-between shrink-0 z-30 shadow-xs">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <span>Voucher Invoice Manual Vendor</span>
                <span className="text-slate-400">•</span>
                <span className="text-indigo-700">{invoice.vendor}</span>
                {invoice.poNumber && (
                  <span className="font-mono font-bold text-blue-700 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded text-[10px]">
                    PO: {invoice.poNumber}
                  </span>
                )}
              </div>
              <div className="text-[11px] font-mono text-slate-500">{invoice.invoiceNo}</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportPDF}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-sm flex items-center gap-1.5 transition btn-press cursor-pointer"
              title="Download & Simpan Dokumen sebagai PDF"
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
          
          {/* Printable Document Paper Area */}
          <div
            ref={paperRef}
            id="vendor-manual-invoice-paper"
            className="bg-white rounded-xl shadow-lg border border-slate-200 p-6 sm:p-8 space-y-4 text-slate-800 max-w-2xl w-full my-auto"
          >
            {/* Header Kop Surat */}
            <div className="flex justify-between items-start border-b-2 border-slate-900 pb-3">
              <div className="flex items-center gap-3.5">
                <img
                  src="/logo-maison-rayyan.png"
                  alt="Maison Rayyan Manufacturing"
                  className="h-16 sm:h-20 w-auto object-contain shrink-0"
                />
                <div>
                  <h2 className="text-xl font-bold tracking-tight text-slate-900">MAISON RAYYAN MANUFACTURING</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Konveksi & Makloon Garment Terpadu</p>
                  <p className="text-[10px] text-slate-400">Jl. Industri Makloon No. 88, Bandung • Telp: 0812-3456-7890</p>
                </div>
              </div>
              <div className="text-right">
                <span className="badge-dark bg-slate-900 text-white text-[10.5px] font-bold px-3 py-1 rounded uppercase tracking-wider inline-block">
                  INVOICE & VOUCHER BAYAR DIMUKA
                </span>
                <div className="mt-1.5">
                  {isPaid ? (
                    <span className="px-2.5 py-0.5 rounded text-[10px] font-black bg-emerald-600 text-white uppercase tracking-wider inline-flex items-center gap-1 shadow-2xs">
                      <CheckCircle2 className="w-3 h-3" />
                      LUNAS (DIBAYARKAN)
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded text-[10px] font-black bg-amber-500 text-white uppercase tracking-wider inline-flex items-center gap-1 shadow-2xs">
                      <Clock className="w-3 h-3" />
                      MENUNGGU PEMBAYARAN
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Document Info Grid */}
            <div className="grid grid-cols-2 gap-4 text-xs border-b border-slate-200 pb-3">
              <div className="space-y-1">
                <div className="text-slate-500 font-semibold uppercase text-[10px]">Penerima Dana / Mitra Penjahit:</div>
                <div className="font-bold text-sm text-slate-900">{invoice.vendor}</div>
                {invoice.bankTujuan && (
                  <div className="text-slate-600 text-[11px]">
                    Rekening: <span className="font-semibold">{invoice.bankTujuan} {invoice.nomorRekening}</span>
                    {invoice.namaRekening && ` a.n ${invoice.namaRekening}`}
                  </div>
                )}
                {invoice.metodePembayaran && (
                  <div className="text-slate-500 text-[10.5px]">
                    Metode: <span className="font-semibold text-slate-700">{invoice.metodePembayaran}</span>
                    {invoice.referensiTransfer && ` (Ref: ${invoice.referensiTransfer})`}
                  </div>
                )}
              </div>

              <div className="space-y-1 text-right">
                <div className="text-slate-500 font-semibold uppercase text-[10px]">Nomor & Tanggal Dokumen:</div>
                <div className="font-mono font-bold text-xs text-indigo-700">{invoice.invoiceNo}</div>
                <div className="text-slate-600 text-[11px]">
                  Tgl Terbit: <span className="font-semibold text-slate-800">{formatDateIndo(invoice.tanggal)}</span>
                </div>
                {invoice.tanggalBayar && (
                  <div className="text-emerald-700 text-[11px]">
                    Tgl Dibayar: <span className="font-semibold">{formatDateIndo(invoice.tanggalBayar)}</span>
                  </div>
                )}
                <div className="text-slate-500 text-[10.5px]">
                  Kategori: <span className="font-semibold text-slate-800">{getKategoriLabel(invoice.kategori)}</span>
                </div>
              </div>
            </div>

            {/* Reference & Description Highlight Box */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs space-y-1.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-700">Terkait PO / SPK:</span>
                  {invoice.poNumber ? (
                    <span className="font-mono font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-[11px]">
                      {invoice.poNumber}
                    </span>
                  ) : (
                    <span className="text-slate-500 italic">Non-PO / Operasional Jahit Umum</span>
                  )}
                  {invoice.brand && (
                    <span className="bg-slate-200 text-slate-800 px-1.5 py-0.5 rounded font-bold text-[10px]">
                      Brand: {invoice.brand}
                    </span>
                  )}
                  {invoice.produk && (
                    <span className="text-slate-700 font-medium text-[11px]">
                      Artikel: {invoice.produk}
                    </span>
                  )}
                </div>

                {invoice.potongDiSlipGaji && (
                  <span className="inline-flex items-center gap-1 text-[10.5px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full">
                    ✓ Otomatis Terpotong di Slip Gaji Kelak
                  </span>
                )}
              </div>

              {invoice.keterangan && (
                <div className="text-slate-600 text-[11px] pt-1 border-t border-slate-200/70">
                  <span className="font-bold text-slate-700">Uraian / Keterangan: </span>
                  {invoice.keterangan}
                </div>
              )}
            </div>

            {/* Alert Catatan Kebijakan Bayar Dimuka */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-2.5 text-[11px] text-amber-900 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Ketentuan Pembayaran Dimuka:</span> Barang hasil jahit belum dikirimkan via Surat Jalan saat pencairan dana ini.
                {invoice.potongDiSlipGaji
                  ? ' Nilai nominal ini akan otomatis dipotong pada penerbitan Slip Gaji Surat Jalan saat paket jahitan PO tersebut tuntas dikirim.'
                  : ' Pembayaran ini bersifat mandiri / non-potong slip gaji.'}
              </div>
            </div>

            {/* Items Table */}
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 border-b border-slate-200 text-left">
                    <th className="p-2.5 w-10 text-center">No</th>
                    <th className="p-2.5">Rincian Pembayaran</th>
                    <th className="p-2.5 text-center w-20">Qty Est</th>
                    <th className="p-2.5 text-right w-28">Tarif Satuan</th>
                    <th className="p-2.5 text-right w-32">Nominal Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {invoice.items && invoice.items.length > 0 ? (
                    invoice.items.map((it, idx) => (
                      <tr key={it.id || idx} className="hover:bg-slate-50">
                        <td className="p-2.5 text-center text-slate-400 font-mono">{idx + 1}</td>
                        <td className="p-2.5 font-medium text-slate-800">{it.deskripsi}</td>
                        <td className="p-2.5 text-center text-slate-700">
                          {it.qty ? `${it.qty} ${it.satuan || 'Pcs'}` : '-'}
                        </td>
                        <td className="p-2.5 text-right text-slate-600">
                          {it.hargaSatuan ? formatRp(it.hargaSatuan) : '-'}
                        </td>
                        <td className="p-2.5 text-right font-bold text-slate-900">{formatRp(it.subtotal)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td className="p-2.5 text-center text-slate-400 font-mono">1</td>
                      <td className="p-2.5 font-medium text-slate-800">{invoice.keterangan || 'Pembayaran Dimuka Jahit'}</td>
                      <td className="p-2.5 text-center text-slate-700">-</td>
                      <td className="p-2.5 text-right text-slate-600">-</td>
                      <td className="p-2.5 text-right font-bold text-slate-900">{formatRp(invoice.totalNominal)}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Total Calculation Box */}
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1.5 text-xs">
              <div className="flex justify-between items-center text-slate-900 font-bold text-base">
                <span>TOTAL DIBAYARKAN:</span>
                <span className="text-indigo-700 text-lg font-black">{formatRp(invoice.totalNominal)}</span>
              </div>
              {invoice.catatan && (
                <div className="text-[10.5px] text-slate-500 pt-1 border-t border-slate-200">
                  <span className="font-semibold text-slate-700">Catatan Tambahan:</span> {invoice.catatan}
                </div>
              )}
            </div>

            {/* Signatures Table: 2 Kolom Sejajar */}
            <table style={{ width: '100%', border: 'none', marginTop: '24px', borderCollapse: 'collapse' }}>
              <tbody>
                <tr>
                  <td style={{ width: '45%', textAlign: 'center', border: 'none', padding: '0', verticalAlign: 'top' }}>
                    <div style={{ color: '#64748b', fontSize: '11px', marginBottom: '45px' }}>Penerima Uang (Mitra Penjahit)</div>
                    <div style={{ borderTop: '1.5px solid #0f172a', fontWeight: 'bold', fontSize: '11px', color: '#0f172a', paddingTop: '6px' }}>
                      ( {invoice.vendor} )
                    </div>
                  </td>
                  <td style={{ width: '10%', border: 'none', padding: '0' }}></td>
                  <td style={{ width: '45%', textAlign: 'center', border: 'none', padding: '0', verticalAlign: 'top' }}>
                    <div style={{ color: '#64748b', fontSize: '11px', marginBottom: '45px' }}>Bagian Keuangan / Kasir</div>
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
