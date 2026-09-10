import React, { useRef } from 'react';
import { Download, Printer, X, FileText, Building2, Calendar, Clock } from 'lucide-react';
import { ProductionPO } from '../../types';
import { printIsolatedDocument } from '../../utils/printHelper';
import { formatDateIndo } from '../../utils/formatters';

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
          className="w-full max-w-[210mm] min-h-[297mm] bg-white shadow-2xl rounded-sm p-8 sm:p-12 text-slate-900 border border-slate-300 font-sans text-xs print:shadow-none print:border-none print:p-6"
          style={{ boxSizing: 'border-box' }}
        >
          {/* Header Kop Surat Formal */}
          <div className="border-b-2 border-slate-900 pb-4 mb-5">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-xl font-black tracking-wider text-slate-900 uppercase">
                  MAISON RAYYAN APPAREL
                </h1>
                <p className="text-[11px] font-semibold text-slate-700 uppercase tracking-widest mt-0.5">
                  Garment & Konveksi Makloon Busana Terintegrasi
                </p>
                <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">
                  Workshop & Cutting Centre • Jl. Industri Konveksi No. 88, Bandung • Telp/WA: 0812-3456-7890
                </p>
              </div>
              <div className="text-right">
                <div className="inline-block px-3 py-1 border-2 border-slate-900 font-black text-xs uppercase tracking-wider rounded bg-slate-50">
                  SURAT PO PRODUKSI
                </div>
                <div className="text-[11px] font-mono font-bold text-slate-800 mt-2">
                  No: {po.noPO}
                </div>
              </div>
            </div>
          </div>

          {/* PO Metadata Grid */}
          <div className="grid grid-cols-2 gap-4 p-3 bg-slate-50 rounded-lg border border-slate-200 mb-5">
            <div className="space-y-1.5">
              <div className="flex">
                <span className="w-28 text-slate-500 text-[11px] font-medium">Brand Mitra:</span>
                <span className="text-slate-900 font-bold uppercase text-[11px]">{po.brand}</span>
              </div>
              <div className="flex">
                <span className="w-28 text-slate-500 text-[11px] font-medium">Vendor / Penjahit:</span>
                <span className="text-slate-900 font-bold text-[11px]">{po.vendorTujuan}</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex">
                <span className="w-32 text-slate-500 text-[11px] font-medium">Tanggal Terbit:</span>
                <span className="text-slate-800 font-semibold text-[11px]">
                  {po.tanggalPO ? formatDateIndo(String(po.tanggalPO).split('T')[0]) : '-'}
                </span>
              </div>
              <div className="flex">
                <span className="w-32 text-slate-500 text-[11px] font-medium">Target Deadline:</span>
                <span className="text-rose-700 font-bold text-[11px]">
                  {po.targetDeadline ? formatDateIndo(String(po.targetDeadline).split('T')[0]) : '-'}
                </span>
              </div>
            </div>
          </div>

          {/* Instruction / Production Notes */}
          {po.catatan && (
            <div className="mb-5 p-3 rounded-lg bg-amber-50/70 border border-amber-200">
              <div className="text-[10px] font-bold text-amber-900 uppercase tracking-wider mb-1">
                Catatan & Spesifikasi Pengerjaan Khusus:
              </div>
              <div className="text-[11px] text-amber-900 leading-relaxed font-medium">
                {po.catatan}
              </div>
            </div>
          )}

          {/* Production Items Table */}
          <div className="mb-6">
            <div className="text-[11px] font-bold text-slate-800 uppercase tracking-wider mb-2">
              Daftar Artikel & Rincian Potong Jahit
            </div>
            <table className="w-full border-collapse text-center border border-slate-300">
              <thead>
                <tr className="bg-slate-100 text-slate-700 text-[10px] font-bold uppercase border-b border-slate-300">
                  <th className="py-2.5 px-3 border-r border-slate-300 w-12 text-center">No.</th>
                  <th className="py-2.5 px-3 border-r border-slate-300 text-center">Model / Nama Artikel</th>
                  <th className="py-2.5 px-3 border-r border-slate-300 w-28 text-center">Warna</th>
                  <th className="py-2.5 px-3 border-r border-slate-300 w-20 text-center">Size</th>
                  <th className="py-2.5 px-3 border-r border-slate-300 text-center">Bahan / Kain</th>
                  <th className="py-2.5 px-3 border-r border-slate-300 text-center w-24">Qty (Pcs)</th>
                  <th className="py-2.5 px-3 text-center">Keterangan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-800 text-[11px]">
                {po.items.map((item, idx) => (
                  <tr key={item.id || idx} className="hover:bg-slate-50/60">
                    <td className="py-2.5 px-3 border-r border-slate-300 text-center text-slate-500 font-mono">
                      {idx + 1}
                    </td>
                    <td className="py-2.5 px-3 border-r border-slate-300 font-bold text-slate-900 text-center">
                      {item.namaProduk}
                    </td>
                    <td className="py-2.5 px-3 border-r border-slate-300 text-slate-700 text-center">
                      {item.warna || '-'}
                    </td>
                    <td className="py-2.5 px-3 border-r border-slate-300 text-center font-bold text-slate-800">
                      {item.ukuran || '-'}
                    </td>
                    <td className="py-2.5 px-3 border-r border-slate-300 text-slate-600 text-center">
                      {item.bahanKain || '-'}
                    </td>
                    <td className="py-2.5 px-3 border-r border-slate-300 text-center font-mono font-bold text-indigo-700 text-xs">
                      {Number(item.qty).toLocaleString('id-ID')}
                    </td>
                    <td className="py-2.5 px-3 text-slate-500 text-[10px] italic text-center">
                      {item.catatan || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-slate-100 font-bold text-slate-900 border-t-2 border-slate-400 text-xs">
                  <td colSpan={5} className="py-2.5 px-3 border-r border-slate-300 text-right uppercase">
                    Total Keseluruhan Produksi:
                  </td>
                  <td className="py-2.5 px-3 border-r border-slate-300 text-center font-mono text-sm text-indigo-900">
                    {po.totalPcs.toLocaleString('id-ID')} Pcs
                  </td>
                  <td className="py-2.5 px-3 text-center"></td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Standard Quality & SOP Clauses */}
          <div className="border border-slate-200 rounded-lg p-3 bg-slate-50/50 text-[9.5px] text-slate-500 mb-8 space-y-1">
            <div className="font-bold text-slate-700 uppercase">Ketentuan & Standar Jahit:</div>
            <ul className="list-disc list-inside space-y-0.5">
              <li>Pengerjaan wajib mengikuti sample approved dan spesifikasi ukuran standar brand pemesan.</li>
              <li>Hasil jahitan wajib bebas dari cacat kritis: jahitan loncat, benang sisa belum dibersihkan, kotoran minyak mesin, atau bolong.</li>
              <li>Barang selesai dikirim ke gudang pusat Maison Rayyan beserta Surat Jalan Pengembalian resmi.</li>
            </ul>
          </div>

          {/* 3-Column Formal Signature Blocks */}
          <div className="grid grid-cols-3 gap-6 pt-4 text-center">
            <div>
              <div className="text-[10px] text-slate-500 mb-1">Dibuat Oleh:</div>
              <div className="text-[11px] font-bold text-slate-800">Admin Produksi</div>
              <div className="h-16 flex items-end justify-center">
                <div className="w-32 border-b border-slate-400"></div>
              </div>
              <div className="text-[10px] text-slate-500 mt-1 font-mono">( Maison Rayyan )</div>
            </div>

            <div>
              <div className="text-[10px] text-slate-500 mb-1">Disetujui:</div>
              <div className="text-[11px] font-bold text-slate-800">Pimpinan / Kepala Workshop</div>
              <div className="h-16 flex items-end justify-center">
                <div className="w-32 border-b border-slate-400"></div>
              </div>
              <div className="text-[10px] text-slate-500 mt-1 font-mono">( .............................. )</div>
            </div>

            <div>
              <div className="text-[10px] text-slate-500 mb-1">Diterima & Disanggupi:</div>
              <div className="text-[11px] font-bold text-slate-800">Vendor / Penjahit Konveksi</div>
              <div className="h-16 flex items-end justify-center">
                <div className="w-32 border-b border-slate-400"></div>
              </div>
              <div className="text-[10px] text-slate-500 mt-1 font-mono">
                ( {po.vendorTujuan.slice(0, 24)} )
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
