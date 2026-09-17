import React, { useRef } from 'react';
import { createPortal } from 'react-dom';
import { Download, Printer, X, FileText, CheckCircle2, AlertCircle } from 'lucide-react';
import { FOBQuotation } from '../../types';
import { formatRp, formatDateIndo } from '../../utils/formatters';
import { printIsolatedDocument } from '../../utils/printHelper';

interface FobQuotationPrintModalProps {
  quotation: FOBQuotation;
  onClose: () => void;
}

export const FobQuotationPrintModal: React.FC<FobQuotationPrintModalProps> = ({ quotation, onClose }) => {
  const paperRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    if (!paperRef.current) return;
    const safeNo = (quotation.noSurat || 'SPH').replace(/[/\\?%*:|"<>]/g, '-');
    const docTitle = `Surat_Penawaran_Harga_${safeNo}_${quotation.buyerName}`;
    printIsolatedDocument(paperRef.current, docTitle);
  };

  const company = quotation.companyProfile || {
    namaPerusahaan: 'MAISON RAYYAN MANUFACTURING',
    alamat: 'Kawasan Industri Garmen & Tekstil No. 88, Jawa Barat - Indonesia',
    telepon: 'WhatsApp / Call: +62 812-3456-7890 | Email: commercial@maisonmrm.co.id',
    bankInfo: 'BCA: 123-456-7890 a.n. Maison Rayyan Manufacturing',
  };

  return createPortal(
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex flex-col items-center justify-start p-2 sm:p-4 overflow-y-auto">
      {/* Top Floating Sticky Control Bar */}
      <div className="sticky top-2 z-20 w-full max-w-4xl bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-slate-200 p-3 mb-4 flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-700 shrink-0">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-800 flex items-center gap-2">
              <span>Pratinjau Surat Penawaran Harga (SPH) FOB</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold border bg-indigo-50 text-indigo-700 border-indigo-200">
                {quotation.noSurat}
              </span>
            </div>
            <div className="text-[11px] text-slate-500">
              Kepada: {quotation.buyerName} ({quotation.buyerCompany || 'Mitra Buyer'}) • Total {quotation.totalQty} Pcs ({quotation.items?.length || 0} Varian Size)
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-md shadow-indigo-200 transition cursor-pointer"
            title="Download PDF / Cetak SPH"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak / Simpan PDF</span>
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
          {/* HEADER KORPORAT */}
          <div className="flex justify-between items-start border-b-2 border-slate-900 pb-3 mb-4">
            <div className="flex items-center gap-3.5 max-w-[55%]">
              <img
                src="/logo-maison-rayyan.png"
                alt="Maison Rayyan Manufacturing"
                className="h-16 sm:h-20 w-auto object-contain shrink-0"
              />
              <div>
                <h1 className="text-lg font-black tracking-wider text-slate-900 uppercase leading-none">
                  {company.namaPerusahaan || 'MAISON RAYYAN MANUFACTURING'}
                </h1>
                <p className="text-[10.5px] font-semibold text-slate-700 tracking-wide mt-1">
                  Produsen & Manufaktur Garment Full Order (FOB)
                </p>
                <p className="text-[9.5px] text-slate-500 mt-0.5 leading-relaxed">
                  {company.alamat}
                </p>
                <p className="text-[9.5px] text-slate-500 font-medium">
                  {company.telepon}
                </p>
              </div>
            </div>

              {/* BUYER INFO BOX */}
              <div className="text-right max-w-[42%]">
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-left">
                  <span className="text-slate-400 block text-[9px] uppercase font-bold tracking-wider mb-1">
                    KEPADA YTH (BUYER / CLIENT):
                  </span>
                  <p className="text-sm font-bold text-slate-900 leading-tight">
                    {quotation.buyerName}
                  </p>
                  {quotation.buyerCompany && (
                    <p className="text-xs font-semibold text-slate-700 mt-0.5">
                      {quotation.buyerCompany}
                    </p>
                  )}
                  {quotation.buyerContact && (
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Kontak: {quotation.buyerContact}
                    </p>
                  )}
                  <div className="pt-2 mt-2 border-t border-slate-200 text-[10px] text-slate-500 space-y-0.5">
                    <div>No. SPH: <strong className="font-semibold text-slate-800">{quotation.noSurat}</strong></div>
                    <div>Tanggal: <strong className="text-slate-800">{formatDateIndo(quotation.tanggal)}</strong></div>
                    {quotation.validUntil && (
                      <div>Berlaku s/d: <strong className="text-indigo-700">{formatDateIndo(quotation.validUntil)}</strong></div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* INTRODUCTORY GREETING */}
            <div className="text-xs text-slate-600 mb-4 leading-relaxed">
              Dengan hormat,<br />
              Bersama surat ini kami menyampaikan penawaran harga produksi garment sistem <strong>Full Order / Free On Board (FOB)</strong> lengkap dengan penyediaan bahan baku, aksesoris, jasa jahit CMT, sablon/bordir, dan finishing packaging, dengan rincian sebagai berikut:
            </div>

            {/* TABEL 1: RINGKASAN PRODUKSI FOB */}
            <div className="mb-4">
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-slate-800"></span>
                I. Ringkasan Kesepakatan Order FOB
              </h2>
              <table className="w-full text-xs border border-slate-200 rounded-lg overflow-hidden">
                <thead className="bg-slate-100 text-slate-700 text-[11px] uppercase font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-2 px-3 text-left">Nama Artikel / Model</th>
                    <th className="py-2 px-3 text-center w-28">Total Volume</th>
                    <th className="py-2 px-3 text-center w-28">Termin DP</th>
                    <th className="py-2 px-3 text-right w-44">
                      {quotation.isPpnIncluded ? 'Total Nilai (+ PPN 11%)' : 'Total Nilai Order'}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="bg-slate-50/70">
                    <td className="py-2.5 px-3 font-bold text-slate-900 text-sm">
                      {quotation.items[0]?.skuWarna ? `${quotation.items[0]?.skuWarna} (Seri Ukuran)` : 'Paket Produksi FOB Garment'}
                      <span className="block text-[11px] font-normal text-slate-500">
                        {quotation.items.length} Rincian Varian Size/Warna
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center font-bold text-slate-900 text-sm tabular-nums">
                      {quotation.totalQty.toLocaleString('id-ID')} Pcs
                    </td>
                    <td className="py-2.5 px-3 text-center font-semibold text-indigo-700 tabular-nums">
                      {quotation.termsDPPercent}% DP
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-slate-900 text-sm tabular-nums">
                      {formatRp(quotation.isPpnIncluded ? (quotation.grandTotalWithPpn ?? (quotation.totalOrderNominal + Math.round(quotation.totalOrderNominal * 0.11))) : quotation.totalOrderNominal)}
                      <span className="block text-[10px] font-normal text-slate-500">
                        {quotation.isPpnIncluded ? 'Termasuk PPN 11%' : 'Tanpa PPN (Exclude)'}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* TABEL 2: RINCIAN BREAKDOWN WARNA & SIZE */}
            <div className="mb-4">
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
                II. Rincian Order Warna, Ukuran & Harga Satuan FOB
              </h2>
              <table className="w-full text-xs border border-slate-200 rounded-lg overflow-hidden">
                <thead className="bg-slate-100 text-slate-700 text-[11px] uppercase font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-1.5 px-2 text-center w-8">No</th>
                    <th className="py-1.5 px-2.5 text-left">SKU / Varian Warna</th>
                    <th className="py-1.5 px-2.5 text-center w-20">Size</th>
                    <th className="py-1.5 px-2.5 text-right w-24">Jumlah (Pcs)</th>
                    <th className="py-1.5 px-2.5 text-right w-32">Harga FOB / Pcs</th>
                    <th className="py-1.5 px-2.5 text-right w-36">Total Nilai</th>
                    <th className="py-1.5 px-2.5 text-left">Keterangan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {quotation.items.map((item, idx) => (
                    <tr key={item.id || idx} className="hover:bg-slate-50/50">
                      <td className="py-1.5 px-2 text-center text-slate-400 font-medium">{idx + 1}</td>
                      <td className="py-1.5 px-2.5 font-bold text-slate-900">{item.skuWarna}</td>
                      <td className="py-1.5 px-2.5 text-center">
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-800 rounded font-bold text-[11px]">
                          {item.skuSize}
                        </span>
                      </td>
                      <td className="py-1.5 px-2.5 text-right font-semibold tabular-nums">{item.jumlahPcs.toLocaleString('id-ID')}</td>
                      <td className="py-1.5 px-2.5 text-right font-semibold tabular-nums">{formatRp(item.hargaPerPcs)}</td>
                      <td className="py-1.5 px-2.5 text-right font-bold text-slate-900 tabular-nums">{formatRp(item.total)}</td>
                      <td className="py-1.5 px-2.5 text-slate-500 text-[11px]">{item.catatan || '-'}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-slate-50 font-bold border-t border-slate-300">
                  {quotation.isPpnIncluded ? (
                    <>
                      <tr>
                        <td colSpan={3} className="py-1.5 px-2.5 text-right uppercase text-[11px] text-slate-600">
                          SUBTOTAL DPP:
                        </td>
                        <td className="py-1.5 px-2.5 text-right font-bold text-xs text-slate-900 tabular-nums">
                          {quotation.totalQty.toLocaleString('id-ID')} Pcs
                        </td>
                        <td></td>
                        <td className="py-1.5 px-2.5 text-right font-bold text-xs text-slate-900 tabular-nums">
                          {formatRp(quotation.totalOrderNominal)}
                        </td>
                        <td></td>
                      </tr>
                      <tr className="text-slate-700 bg-slate-100/60">
                        <td colSpan={5} className="py-1 px-2.5 text-right uppercase text-[10.5px]">
                          PAJAK PERTAMBAHAN NILAI (PPN 11%):
                        </td>
                        <td className="py-1 px-2.5 text-right font-bold text-xs tabular-nums text-slate-800">
                          + {formatRp(quotation.ppnNominal ?? Math.round(quotation.totalOrderNominal * 0.11))}
                        </td>
                        <td></td>
                      </tr>
                      <tr className="bg-indigo-50/80 border-t border-indigo-200 text-indigo-950">
                        <td colSpan={5} className="py-2 px-2.5 text-right uppercase text-[11px] font-black">
                          GRAND TOTAL AKHIR (+ PPN 11%):
                        </td>
                        <td className="py-2 px-2.5 text-right font-black text-sm text-indigo-900 tabular-nums">
                          {formatRp(quotation.grandTotalWithPpn ?? (quotation.totalOrderNominal + Math.round(quotation.totalOrderNominal * 0.11)))}
                        </td>
                        <td></td>
                      </tr>
                    </>
                  ) : (
                    <tr>
                      <td colSpan={3} className="py-2 px-2.5 text-right uppercase text-[11px] text-slate-600">
                        TOTAL AKUMULASI ORDER:
                      </td>
                      <td className="py-2 px-2.5 text-right font-bold text-sm text-slate-900 tabular-nums">
                        {quotation.totalQty.toLocaleString('id-ID')} Pcs
                      </td>
                      <td></td>
                      <td className="py-2 px-2.5 text-right font-bold text-sm text-indigo-900 tabular-nums">
                        {formatRp(quotation.totalOrderNominal)}
                      </td>
                      <td className="py-2 px-2.5 text-[10px] text-slate-400 font-normal italic">
                        *Non-PPN
                      </td>
                    </tr>
                  )}
                </tfoot>
              </table>
            </div>

            {/* KETENTUAN PEMBAYARAN & TERMIN */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
              <div className="border border-slate-200 rounded-lg p-3.5 bg-slate-50/50 text-xs">
                <h3 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] mb-2 pb-1 border-b border-slate-200 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Skema Termin Pembayaran
                </h3>
                <div className="space-y-2">
                  <div className="p-2 bg-white rounded border border-slate-200">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-slate-800">1. Uang Muka / Down Payment ({quotation.termsDPPercent}%):</span>
                      <span className="font-bold text-indigo-700 text-sm tabular-nums">{formatRp(quotation.nominalDP)}</span>
                    </div>
                    <span className="text-[10px] text-slate-500 block mt-0.5">
                      Wajib diselesaikan sebelum pengadaan bahan baku & proses pemotongan (cutting) dimulai.
                    </span>
                  </div>
                  <div className="p-2 bg-white rounded border border-slate-200">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-slate-800">2. Pelunasan ({100 - quotation.termsDPPercent}%):</span>
                      <span className="font-bold text-slate-900 text-sm tabular-nums">{formatRp(quotation.sisaPelunasan)}</span>
                    </div>
                    <span className="text-[10px] text-slate-500 block mt-0.5">
                      Wajib diselesaikan saat barang selesai QC & packing, sebelum surat jalan pengiriman diterbitkan.
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-500 pt-1">
                    <strong>Rekening Pembayaran:</strong> {company.bankInfo}
                  </div>
                </div>
              </div>

              <div className="border border-slate-200 rounded-lg p-3.5 bg-slate-50/50 text-xs">
                <h3 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] mb-2 pb-1 border-b border-slate-200 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-indigo-600" />
                  Ketentuan Teknis & Garansi Produksi
                </h3>
                <ul className="list-disc list-inside space-y-1 text-slate-600 text-[11px]">
                  <li>
                    <strong>Estimasi Waktu Produksi (Lead Time):</strong> {quotation.productionLeadTime || '14 - 21 Hari Kerja'} sejak DP diterima dan sampel disetujui (*approval sample*).
                  </li>
                  <li>
                    Harga FOB sudah mencakup seluruh bahan, kancing/zipper, hangtag/polybag standar, dan biaya packaging.
                  </li>
                  <li>
                    <strong>Pajak Pertambahan Nilai:</strong> {quotation.isPpnIncluded ? 'Harga penawaran di atas sudah termasuk PPN 11%.' : 'Harga penawaran di atas belum termasuk PPN 11% (Exclude PPN).'}
                  </li>
                  <li>
                    <strong>Garansi Reject / Cacat Jahit:</strong> Kami memberikan jaminan perbaikan (*rework*) atau penggantian untuk cacat produksi dalam jangka waktu 7 hari sejak barang diterima.
                  </li>
                  {quotation.paymentNotes && (
                    <li className="text-indigo-800 font-medium">
                      <strong>Catatan Khusus:</strong> {quotation.paymentNotes}
                    </li>
                  )}
                </ul>
              </div>
            </div>

            {/* BLOK TANDA TANGAN */}
            <div className="grid grid-cols-2 gap-8 text-center text-xs mt-8 pt-4 border-t border-slate-200 break-inside-avoid">
              <div>
                <p className="text-slate-500 mb-0.5 text-[9.5px]">Disetujui & Diterima Oleh (Pihak Buyer),</p>
                <p className="font-bold text-slate-800 text-xs mb-14">{quotation.buyerCompany || quotation.buyerName}</p>
                <p className="font-medium text-slate-800 border-b border-slate-400 pb-1 mx-12 text-[9.5px]">
                  ( {quotation.buyerName || '........................................'} )
                </p>
                <p className="text-[9px] text-slate-400 mt-0.5">Tanda Tangan & Cap Perusahaan</p>
              </div>

              <div>
                <p className="text-slate-500 mb-0.5 text-[9.5px]">Hormat Kami (Pihak Produsen),</p>
                <p className="font-bold text-slate-800 text-xs mb-14">{company.namaPerusahaan || 'MAISON RAYYAN MANUFACTURING'}</p>
                <p className="font-medium text-slate-800 border-b border-slate-400 pb-1 mx-12 text-[9.5px]">
                  ( ........................................ )
                </p>
                <p className="text-[9px] text-slate-400 mt-0.5">Commercial & Marketing Director</p>
              </div>
            </div>

            {/* FOOTER */}
            <div className="mt-8 pt-2 border-t border-slate-100 flex justify-between items-center text-[10px] text-slate-400">
              <span>Sistem HPP FOB & Penawaran Garment Terpadu - Maison Rayyan Manufacturing</span>
              <span>Dokumen Penawaran Komersial Resmi</span>
            </div>

          </div>
        </div>
      </div>,
      document.body
    );
};
