import React, { useRef } from 'react';
import { createPortal } from 'react-dom';
import { Download, Printer, X, FileSpreadsheet } from 'lucide-react';
import { HPPCalculationRecord } from '../../types';
import { formatRp, formatDateIndo } from '../../utils/formatters';
import { printIsolatedDocument } from '../../utils/printHelper';

interface FobRekapPrintModalProps {
  records: HPPCalculationRecord[];
  onClose: () => void;
}

export const FobRekapPrintModal: React.FC<FobRekapPrintModalProps> = ({ records, onClose }) => {
  const paperRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    if (!paperRef.current) return;
    const docTitle = `Rekapitulasi_Katalog_HPP_FOB_${new Date().toISOString().split('T')[0]}`;
    printIsolatedDocument(paperRef.current, docTitle);
  };

  const sorted = [...records].sort((a, b) => a.namaProduk.localeCompare(b.namaProduk) || a.size.localeCompare(b.size));

  return createPortal(
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex flex-col items-center justify-start p-2 sm:p-4 overflow-y-auto">
      {/* Top Floating Sticky Control Bar */}
      <div className="sticky top-2 z-20 w-full max-w-4xl bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-slate-200 p-3 mb-4 flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-700 shrink-0">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-800 flex items-center gap-2">
              <span>Pratinjau Rekapitulasi Katalog HPP FOB</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold border bg-indigo-50 text-indigo-700 border-indigo-200">
                {records.length} Item Terdata
              </span>
            </div>
            <div className="text-[11px] text-slate-500">
              Kompilasi ringkasan harga pokok dan rekomendasi harga jual seluruh katalog
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-md shadow-indigo-200 transition cursor-pointer"
            title="Download PDF / Cetak Rekapitulasi"
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
          {/* Header Kop Formal */}
          <div className="border-b-2 border-slate-900 pb-2.5 mb-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3.5 min-w-0 pr-2">
                <img
                  src="/logo-maison-rayyan.png"
                  alt="Maison Rayyan Manufacturing"
                  className="h-16 sm:h-20 w-auto object-contain shrink-0"
                />
                <div className="min-w-0">
                  <h1 className="text-lg font-black tracking-wider text-slate-900 uppercase leading-none">
                    MAISON RAYYAN MANUFACTURING
                  </h1>
                  <p className="text-[10.5px] font-semibold text-slate-700 tracking-wide mt-1">
                    Sistem Manufaktur FOB & Garment Costing
                  </p>
                  <p className="text-[9.5px] text-slate-500 mt-0.5 leading-tight">
                    Jl. Industri Makloon No. 88, Bandung • Telp: 0821-2822-4328 • Email: commercial@maisonmrm.co.id
                  </p>
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="inline-block px-3 py-1 border-2 border-slate-900 font-black text-[11px] uppercase tracking-wide rounded bg-slate-50 whitespace-nowrap">
                  REKAPITULASI HPP FOB
                </div>
                <div className="text-[10.5px] text-slate-600 mt-1 whitespace-nowrap font-medium">
                  Tgl: {formatDateIndo(new Date().toISOString())}
                </div>
              </div>
            </div>
          </div>

          <div className="mb-3">
            <h2 className="text-sm font-bold text-slate-950 uppercase tracking-tight">
              Daftar Harga Pokok Produksi & Rekomendasi Jual Garment
            </h2>
            <p className="text-[11px] text-slate-500">
              Ringkasan size-based costing FOB untuk seluruh artikel dan varian ukuran aktif di katalog.
            </p>
          </div>

          {/* TABEL REKAPITULASI */}
          <table className="w-full text-xs border border-slate-200 rounded-lg overflow-hidden mb-6">
            <thead className="bg-slate-100 text-slate-700 text-[10.5px] uppercase font-bold border-b border-slate-300">
              <tr>
                <th className="py-2 px-2 text-center w-8 border-r border-slate-200">No</th>
                <th className="py-2 px-3 text-left border-r border-slate-200">Nama Produk & Kode</th>
                <th className="py-2 px-3 text-left w-24 border-r border-slate-200">Kategori</th>
                <th className="py-2 px-2 text-center w-14 border-r border-slate-200">Size</th>
                <th className="py-2 px-3 text-right w-28 border-r border-slate-200">HPP Final / Pcs</th>
                <th className="py-2 px-3 text-right w-32 border-r border-slate-200">Rekomendasi Jual</th>
                <th className="py-2 px-2 text-center w-16 border-r border-slate-200">Margin</th>
                <th className="py-2 px-3 text-left w-28">No. HPP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sorted.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-6 text-center text-slate-400 italic">
                    Belum ada database HPP tersimpan
                  </td>
                </tr>
              ) : (
                sorted.map((item, idx) => (
                  <tr key={item.id} className={idx % 2 === 1 ? 'bg-slate-50/60 hover:bg-slate-50' : 'bg-white hover:bg-slate-50'}>
                    <td className="py-2 px-2 text-center text-slate-400 font-medium border-r border-slate-200">{idx + 1}</td>
                    <td className="py-2 px-3 font-semibold text-slate-900 border-r border-slate-200">
                      {item.namaProduk}
                      {item.kodeProduk && <span className="text-[10px] text-slate-400 block font-normal">Kode: {item.kodeProduk}</span>}
                    </td>
                    <td className="py-2 px-3 text-slate-600 border-r border-slate-200">{item.kategori || '-'}</td>
                    <td className="py-2 px-2 text-center border-r border-slate-200">
                      <span className="px-1.5 py-0.5 bg-indigo-50 text-indigo-700 rounded font-bold text-[10.5px]">
                        {item.size}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-right font-medium text-slate-800 tabular-nums border-r border-slate-200">
                      {formatRp(item.hppFinalPerPcs)}
                    </td>
                    <td className="py-2 px-3 text-right font-bold text-emerald-700 tabular-nums border-r border-slate-200">
                      {formatRp(item.hargaJualRekomendasi)}
                    </td>
                    <td className="py-2 px-2 text-center font-medium text-slate-700 tabular-nums border-r border-slate-200">
                      {item.targetLabaPercent}%
                    </td>
                    <td className="py-2 px-3 text-[10.5px] text-slate-500 font-medium">
                      {item.noHpp}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {/* TANDA TANGAN */}
          <div className="grid grid-cols-2 gap-8 text-center text-xs mt-10 pt-4 border-t border-slate-200 break-inside-avoid">
            <div>
              <div className="text-[9.5px] text-slate-500 mb-0.5">Dipersiapkan Oleh:</div>
              <div className="text-[10px] font-bold text-slate-800 whitespace-nowrap mb-12">Staff Costing FOB</div>
              <p className="font-medium text-slate-800 border-b border-slate-400 pb-1 mx-12 text-[9.5px]">
                ( ........................................ )
              </p>
              <div className="text-[8.5px] text-slate-400 mt-0.5">Merchandiser / Costing</div>
            </div>

            <div>
              <div className="text-[9.5px] text-slate-500 mb-0.5">Disetujui Oleh:</div>
              <div className="text-[10px] font-bold text-slate-800 whitespace-nowrap mb-12">Manajemen / Direksi</div>
              <p className="font-medium text-slate-800 border-b border-slate-400 pb-1 mx-12 text-[9.5px]">
                ( ........................................ )
              </p>
              <div className="text-[8.5px] text-slate-400 mt-0.5">Pimpinan Manufaktur</div>
            </div>
          </div>

          {/* FOOTER */}
          <div className="mt-8 pt-2 border-t border-slate-100 flex justify-between items-center text-[10px] text-slate-400">
            <span>Dicetak otomatis oleh Sistem FOB Garment - Maison Rayyan Manufacturing</span>
            <span>Dokumen Rahasia & Hak Milik Perusahaan</span>
          </div>

        </div>
      </div>
    </div>,
    document.body
  );
};
