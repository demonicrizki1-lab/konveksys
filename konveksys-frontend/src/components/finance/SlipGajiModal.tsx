import React, { useRef } from 'react';
import { VendorPayrollSummary } from '../../types';
import { Printer, X, Download, FileText } from 'lucide-react';
import { printIsolatedDocument } from '../../utils/printHelper';

interface SlipGajiModalProps {
  payroll: VendorPayrollSummary;
  onClose: () => void;
}

export const SlipGajiModal: React.FC<SlipGajiModalProps> = ({ payroll, onClose }) => {
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
    const safeVendor = (payroll.vendor || 'Vendor').replace(/[/\\?%*:|"<>]/g, '-');
    const safeDate = new Date().toISOString().split('T')[0];
    const docTitle = `SlipGaji_${safeVendor}_${safeDate}`;
    printIsolatedDocument(paperRef.current, docTitle);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-hidden">
      <div className="bg-slate-100 rounded-2xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-300 overflow-hidden animate-slideUp">
        
        {/* Sticky Top Control Toolbar */}
        <div className="bg-white px-5 py-3.5 border-b border-slate-200 flex items-center justify-between shrink-0 z-30 shadow-xs">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <span>Slip Gaji Penjahit Digital (1 Halaman)</span>
                <span className="text-slate-400">•</span>
                <span className="text-indigo-700">{payroll.vendor}</span>
              </div>
              <div className="text-[11px] text-slate-500 font-medium">
                {payroll.periodeLabel || new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportPDF}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-sm flex items-center gap-1.5 transition btn-press"
              title="Download & Simpan Slip Gaji sebagai PDF (Murni 1 Halaman)"
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
          
          {/* Printable Paper Area */}
          <div
            ref={paperRef}
            id="payroll-paper"
            className="bg-white rounded-xl shadow-lg border border-slate-200 p-6 sm:p-8 space-y-4 text-slate-800 max-w-2xl w-full my-auto"
          >
            {/* Header */}
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
                <span className="badge-dark bg-slate-900 text-white text-[11px] font-bold px-3 py-1 rounded uppercase tracking-wider inline-block">
                  SLIP GAJI PENJAHIT
                </span>
                <div className="text-[11px] text-slate-600 font-bold mt-1.5">
                  {payroll.periodeLabel || new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
                </div>
              </div>
            </div>

            {/* Vendor Info */}
            <div className="box-gray grid grid-cols-2 items-center gap-4 text-xs bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <div className="flex flex-col justify-center">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Nama Penjahit / Vendor:</span>
                <strong className="text-slate-900 text-sm font-bold">{payroll.vendor}</strong>
              </div>
              <div className="text-right flex flex-col justify-center">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Tanggal Pembayaran:</span>
                <strong className="text-slate-900 text-xs font-bold">
                  {payroll.periodeAkhir ? formatDateIndo(payroll.periodeAkhir) : formatDateIndo(new Date().toISOString())}
                </strong>
                <div className="text-[10px] text-slate-500 mt-0.5">Metode: Tunai / Transfer Bank</div>
              </div>
            </div>

            {/* Rincian Surat Jalan & Tarif */}
            <div className="space-y-1.5">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
                Rincian Pekerjaan Selesai (Berdasarkan Surat Jalan)
              </div>
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-700 font-bold text-[9.5px] uppercase">
                    <tr>
                      <th className="p-2">No SJ / Tgl</th>
                      <th className="p-2">Produk (Brand)</th>
                      <th className="p-2 text-center">Qty Pcs</th>
                      <th className="p-2 text-right">Tarif DB / Pcs</th>
                      <th className="p-2 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {payroll.items.map((item, idx) => (
                      <tr key={idx}>
                        <td className="p-2">
                          <div className="font-mono font-bold text-slate-900">{item.suratJalanNo}</div>
                          <span className="text-[10px] text-slate-400">{formatDateIndo(item.tanggal)}</span>
                        </td>
                        <td className="p-2">
                          <div className="font-bold text-slate-800">{item.produk}</div>
                          {item.jenisKain && (
                            <div className="text-[9px] text-slate-500 font-normal">{item.jenisKain}</div>
                          )}
                          <span className="text-[10px] text-slate-500 font-medium">Brand: {item.brand}</span>
                        </td>
                        <td className="p-2 text-center font-bold text-slate-800">{item.pcs}</td>
                        <td className="p-2 text-right font-medium text-slate-600">{formatRp(item.rate)}</td>
                        <td className="p-2 text-right font-bold text-slate-900">{formatRp(item.subtotal)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Calculation Summary */}
            <div className="box-gray bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Total Pcs Diselesaikan:</span>
                <span className="font-bold text-slate-900">{payroll.totalPcs} Pcs</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Total Gaji Kotor (Pcs x Tarif DB):</span>
                <span className="font-bold text-slate-900">{formatRp(payroll.totalGrossPay)}</span>
              </div>
              <div className="flex justify-between text-rose-600 border-t border-slate-200 pt-1.5 font-medium">
                <span>Potongan Kasbon / Uang Muka:</span>
                <span className="font-bold text-rose">- {formatRp(payroll.kasbonDeduction)}</span>
              </div>
              <div className="flex justify-between text-slate-900 border-t-2 border-slate-900 pt-1.5 text-sm font-bold">
                <span>TOTAL GAJI BERSIH (NETTO):</span>
                <span className="text-emerald text-emerald-700 text-base">{formatRp(payroll.netPay)}</span>
              </div>
            </div>

            {/* Signatures Table: Pasti 2 Kolom Sejajar */}
            <table style={{ width: '100%', border: 'none', marginTop: '20px', borderCollapse: 'collapse' }}>
              <tbody>
                <tr>
                  <td style={{ width: '45%', textAlign: 'center', border: 'none', padding: '0', verticalAlign: 'top' }}>
                    <div style={{ color: '#64748b', fontSize: '11px', marginBottom: '45px' }}>Penerima (Penjahit)</div>
                    <div style={{ borderTop: '1.5px solid #0f172a', fontWeight: 'bold', fontSize: '11px', color: '#0f172a', paddingTop: '6px' }}>
                      ( {payroll.vendor} )
                    </div>
                  </td>
                  <td style={{ width: '10%', border: 'none', padding: '0' }}></td>
                  <td style={{ width: '45%', textAlign: 'center', border: 'none', padding: '0', verticalAlign: 'top' }}>
                    <div style={{ color: '#64748b', fontSize: '11px', marginBottom: '45px' }}>Bagian Keuangan / Owner</div>
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
