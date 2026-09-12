import React, { useRef } from 'react';
import { Download, Printer, X, FileText, Building2, Calendar, Clock } from 'lucide-react';
import { ProductionPO } from '../../types';
import { printIsolatedDocument } from '../../utils/printHelper';
import { formatDateIndo } from '../../utils/formatters';
import ttdRizkiMaulana from '../../assets/ttd-rizki-maulana.png';

interface ProductionPOPrintModalProps {
  po: ProductionPO;
  onClose: () => void;
}

export const ProductionPOPrintModal: React.FC<ProductionPOPrintModalProps> = ({ po, onClose }) => {
  const paperRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    if (!paperRef.current) return;
    printIsolatedDocument(paperRef.current, `PO_Produksi_${po.noPO}`);
  };

  const statusBadge = () => {
    switch (po.status) {
      case 'SELESAI':
        return { label: 'SELESAI DIJAHIT', bg: 'bg-emerald-100 text-emerald-800 border-emerald-300' };
      case 'DALAM_PROSES':
        return { label: 'DALAM PROSES JAHIT', bg: 'bg-blue-100 text-blue-800 border-blue-300' };
      case 'DIKIRIM':
        return { label: 'DIKIRIM KE KONVEKSI', bg: 'bg-amber-100 text-amber-800 border-amber-300' };
      default:
        return { label: 'DRAFT PO', bg: 'bg-slate-100 text-slate-700 border-slate-300' };
    }
  };

  const badge = statusBadge();

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex flex-col items-center justify-start p-2 sm:p-4 overflow-y-auto">
      {/* Top Floating Control Bar */}
      <div className="sticky top-2 z-20 w-full max-w-4xl bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-slate-200 p-3 mb-4 flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-700">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-800 flex items-center gap-2">
              <span>Pratinjau Cetak Surat PO Produksi</span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${badge.bg}`}>
                {badge.label}
              </span>
            </div>
            <div className="text-[11px] text-slate-500 font-mono">{po.noPO} • Brand {po.brand}</div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-md shadow-indigo-200 transition cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak / Simpan PDF</span>
          </button>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition cursor-pointer"
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
          <div className="border-b-2 border-slate-900 pb-2 mb-2.5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 pr-2">
                <h1 className="text-lg font-black tracking-wider text-slate-900 uppercase leading-none">
                  MAISON RAYYAN MANUFACTURING
                </h1>
                <p className="text-[10.5px] font-semibold text-slate-700 tracking-wide mt-1">
                  Konveksi & Makloon Garment Terpadu
                </p>
                <p className="text-[9.5px] text-slate-500 mt-0.5 leading-tight">
                  Jl. Industri Makloon No. 88, Bandung • Telp: 0821-2822-4328
                </p>
              </div>
              <div className="text-right shrink-0">
                <div className="inline-block px-3 py-1 border-2 border-slate-900 font-black text-[11px] uppercase tracking-wide rounded bg-slate-50 whitespace-nowrap">
                  SURAT PO PRODUKSI
                </div>
                <div className="text-[10.5px] font-mono font-bold text-slate-800 mt-1 whitespace-nowrap">
                  No: {po.noPO}
                </div>
              </div>
            </div>
          </div>

          {/* PO Metadata Grid */}
          <div className="grid grid-cols-2 gap-2 p-2 bg-slate-50 rounded-lg border border-slate-200 mb-2 text-[10.5px]">
            <div className="space-y-1">
              <div className="flex items-center">
                <span className="w-26 text-slate-500 font-medium">Brand Mitra:</span>
                <span className="text-slate-900 font-bold uppercase">{po.brand}</span>
              </div>
              <div className="flex items-center">
                <span className="w-26 text-slate-500 font-medium">Vendor / Penjahit:</span>
                {po.vendorTujuan ? (
                  <span className="text-slate-900 font-bold">{po.vendorTujuan}</span>
                ) : (
                  <span className="inline-block border-b border-slate-400 w-36 h-3.5"></span>
                )}
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center">
                <span className="w-28 text-slate-500 font-medium">Tanggal Terbit:</span>
                <span className="text-slate-800 font-semibold">
                  {po.tanggalPO ? formatDateIndo(String(po.tanggalPO).split('T')[0]) : '-'}
                </span>
              </div>
              <div className="flex items-center">
                <span className="w-28 text-slate-500 font-medium">Target Deadline:</span>
                <span className="text-rose-700 font-bold">
                  {po.targetDeadline ? formatDateIndo(String(po.targetDeadline).split('T')[0]) : '-'}
                </span>
              </div>
            </div>
          </div>

          {/* Instruction / Production Notes */}
          {po.catatan && (
            <div className="mb-2 p-1.5 px-2 rounded-lg bg-amber-50/70 border border-amber-200 text-[10px] leading-tight">
              <span className="font-bold text-amber-900 uppercase tracking-wide mr-1.5">
                Catatan:
              </span>
              <span className="text-amber-950 font-medium">
                {po.catatan}
              </span>
            </div>
          )}

          {/* Production Items Table */}
          {(() => {
            const isCompact = po.items.length > 6;
            const thPad = isCompact ? 'py-1 px-1.5 text-[9px]' : 'py-1.5 px-2 text-[10px]';
            const tdPad = isCompact ? 'py-1 px-1.5 text-[10px]' : 'py-1.5 px-2 text-[11px]';

            return (
              <div className="mb-2">
                <div className="text-[10px] font-bold text-slate-800 uppercase tracking-wider mb-1">
                  Daftar Artikel & Rincian Potong Jahit
                </div>
                <table className="w-full border-collapse text-center border border-slate-300">
                  <tbody style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}>
                    <tr className="bg-slate-100 text-slate-700 font-bold uppercase border-b border-slate-300" style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}>
                      <th className={`${thPad} border-r border-slate-300 w-10 text-center`}>No.</th>
                      <th className={`${thPad} border-r border-slate-300 text-center`}>Model / Nama Artikel</th>
                      <th className={`${thPad} border-r border-slate-300 w-24 text-center`}>Warna</th>
                      <th className={`${thPad} border-r border-slate-300 w-16 text-center`}>Size</th>
                      <th className={`${thPad} border-r border-slate-300 text-center w-20`}>Qty (Pcs)</th>
                      <th className={`${thPad} border-r border-slate-300 text-center`}>Bahan / Kain</th>
                      <th className={`${thPad} text-center`}>Keterangan</th>
                    </tr>
                  </tbody>
                  <tbody className="divide-y divide-slate-200 text-slate-800">
                    {po.items.map((item, idx) => (
                      <tr key={item.id || idx} className="hover:bg-slate-50/60">
                        <td className={`${tdPad} border-r border-slate-300 text-center text-slate-500 font-mono`}>
                          {idx + 1}
                        </td>
                        <td className={`${tdPad} border-r border-slate-300 font-bold text-slate-900 text-center`}>
                          {item.namaProduk}
                        </td>
                        <td className={`${tdPad} border-r border-slate-300 text-slate-700 text-center`}>
                          {item.warna || '-'}
                        </td>
                        <td className={`${tdPad} border-r border-slate-300 text-center font-bold text-slate-800`}>
                          {item.ukuran || '-'}
                        </td>
                        <td className={`${tdPad} border-r border-slate-300 text-center font-mono font-bold text-indigo-700`}>
                          {Number(item.qty).toLocaleString('id-ID')}
                        </td>
                        <td className={`${tdPad} border-r border-slate-300 text-slate-600 text-center`}>
                          {item.bahanKain || '-'}
                        </td>
                        <td className={`${tdPad} text-slate-500 text-[9.5px] italic text-center`}>
                          {item.catatan || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tbody style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}>
                    <tr className="bg-slate-100 font-bold text-slate-900 border-t-2 border-slate-400" style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}>
                      <td colSpan={4} className={`${tdPad} border-r border-slate-300 text-center uppercase tracking-wider text-[10.5px]`}>
                        Total Keseluruhan Produksi
                      </td>
                      <td className={`${tdPad} border-r border-slate-300 text-center font-mono text-xs text-indigo-900`}>
                        {po.totalPcs.toLocaleString('id-ID')} Pcs
                      </td>
                      <td colSpan={2} className={`${tdPad} text-center`}></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            );
          })()}

          {/* Standard Quality & SOP Clauses */}
          <div className="border border-slate-200 rounded p-1.5 px-2 bg-slate-50/50 text-[8.5px] text-slate-500 mb-2.5 space-y-0.5">
            <div className="font-bold text-slate-700 uppercase text-[9px]">Ketentuan & Standar Jahit:</div>
            <ul className="list-disc list-inside space-y-0 text-[8px] leading-tight text-slate-600">
              <li>Pengerjaan wajib mengikuti sample approved dan spesifikasi ukuran standar brand pemesan.</li>
              <li>Hasil jahitan wajib bebas dari cacat kritis: jahitan loncat, benang sisa belum dibersihkan, kotoran minyak mesin, atau bolong.</li>
              <li>Barang selesai dikirim ke gudang pusat Maison Rayyan beserta Surat Jalan Pengembalian resmi.</li>
            </ul>
          </div>

          {/* 3-Column Formal Signature Blocks */}
          <div className="grid grid-cols-3 gap-3 pt-1 text-center" style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}>
            <div>
              <div className="text-[9px] text-slate-500 mb-0.5">Dibuat Oleh:</div>
              <div className="text-[10px] font-bold text-slate-800 whitespace-nowrap">Admin Produksi</div>
              <div className="relative h-12 flex items-end justify-center">
                <img 
                  src={ttdRizkiMaulana} 
                  alt="Tanda Tangan Rizki Maulana" 
                  className="absolute bottom-[-2px] h-12 w-auto object-contain pointer-events-none select-none z-10" 
                />
                <div className="w-28 border-b border-slate-400"></div>
              </div>
              <div className="text-[9px] text-slate-700 mt-0.5 font-mono font-medium whitespace-nowrap">( Rizki Maulana )</div>
            </div>

            <div>
              <div className="text-[9px] text-slate-500 mb-0.5">Disetujui:</div>
              <div className="text-[10px] font-bold text-slate-800 whitespace-nowrap">Pimpinan / Kepala Workshop</div>
              <div className="h-12 flex items-end justify-center">
                <div className="w-28 border-b border-slate-400"></div>
              </div>
              <div className="text-[9px] text-slate-700 mt-0.5 font-mono font-medium whitespace-nowrap">( Cecep Dayat )</div>
            </div>

            <div>
              <div className="text-[9px] text-slate-500 mb-0.5">Diterima & Disanggupi:</div>
              <div className="text-[10px] font-bold text-slate-800 whitespace-nowrap">Vendor / Penjahit Konveksi</div>
              <div className="h-12 flex items-end justify-center">
                <div className="w-28 border-b border-slate-400"></div>
              </div>
              <div className="text-[9px] text-slate-600 mt-0.5 font-mono whitespace-nowrap">
                {po.vendorTujuan ? (
                  <span>( {po.vendorTujuan.slice(0, 22)} )</span>
                ) : (
                  <span className="tracking-widest">( .................... )</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
