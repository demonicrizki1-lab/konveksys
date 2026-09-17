import React, { useRef } from 'react';
import { createPortal } from 'react-dom';
import { Printer, X, Calendar, Layers } from 'lucide-react';
import { ProductionTimeline } from '../../types';
import { formatDateIndo } from '../../utils/formatters';
import { printIsolatedDocument } from '../../utils/printHelper';

interface FobTimelinePrintModalProps {
  timeline: ProductionTimeline;
  onClose: () => void;
}

export const FobTimelinePrintModal: React.FC<FobTimelinePrintModalProps> = ({ timeline, onClose }) => {
  const paperRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    if (!paperRef.current) return;
    const safePo = (timeline.poNumber || 'PO').replace(/[/\\?%*:|"<>]/g, '-');
    const docTitle = `Timeline_Produksi_${safePo}_${timeline.brand}`;
    printIsolatedDocument(paperRef.current, docTitle);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'SELESAI':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'SEDANG_PROSES':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'TERLAMBAT':
        return 'bg-rose-100 text-rose-800 border-rose-300';
      case 'MENUNGGU':
      default:
        return 'bg-slate-100 text-slate-700 border-slate-300';
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex flex-col items-center justify-start p-2 sm:p-4 overflow-y-auto">
      {/* Top Floating Control Bar */}
      <div className="sticky top-2 z-20 w-full max-w-4xl bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-slate-200 p-3 mb-4 flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-700 shrink-0">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-800 flex items-center gap-2">
              <span>Pratinjau Jadwal & Rincian Pengerjaan Produksi (T&A)</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold border bg-indigo-50 text-indigo-700 border-indigo-200">
                {timeline.poNumber}
              </span>
            </div>
            <div className="text-[11px] text-slate-500">
              Brand: <strong>{timeline.brand}</strong> • Produk: <strong>{timeline.productName}</strong> • Total:{' '}
              <strong>{timeline.totalQty} Pcs</strong> • Durasi: <strong>{timeline.totalDays} Hari</strong>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-md shadow-indigo-200 transition cursor-pointer"
            title="Download PDF / Cetak Jadwal untuk Buyer"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak / Simpan PDF</span>
          </button>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
            title="Tutup Pratinjau"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* PRINTABLE A4 PAPER */}
      <div className="w-full flex justify-center pb-12">
        <div
          ref={paperRef}
          className="w-full max-w-[210mm] min-h-[297mm] bg-white shadow-2xl rounded-sm p-8 sm:p-10 text-slate-900 border border-slate-300 font-sans text-xs print:shadow-none print:border-none print:p-4"
          style={{ boxSizing: 'border-box' }}
        >
          {/* 1. KOP SURAT PERUSAHAAN */}
          <div className="border-b-2 border-slate-900 pb-3 mb-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-lg font-black tracking-wider text-slate-900">
                  MAISON RAYYAN MANUFACTURING
                </div>
                <div className="text-[11px] font-medium text-slate-600 uppercase tracking-wide">
                  Divisi Garmen & FOB Apparel Supply Chain Management
                </div>
                <div className="text-[10px] text-slate-500 mt-1 leading-tight">
                  Kawasan Industri Tekstil & Konveksi Terpadu • Jawa Barat, Indonesia
                  <br />
                  WhatsApp / Hotline: +62 812-3456-7890 • Email: commercial@maisonmrm.co.id
                </div>
              </div>
              <div className="text-right">
                <span className="inline-block px-3 py-1 bg-slate-900 text-white text-[10px] font-bold uppercase tracking-wider rounded">
                  LAMPIRAN RESMI PO
                </span>
                <div className="text-[11px] font-black text-slate-800 mt-1 font-mono">{timeline.poNumber}</div>
                <div className="text-[10px] text-slate-500">Tgl Cetak: {formatDateIndo(new Date().toISOString())}</div>
              </div>
            </div>
          </div>

          {/* 2. TITLE DOKUMEN */}
          <div className="text-center my-4">
            <h1 className="text-sm font-black uppercase tracking-widest text-slate-900 border-b border-slate-200 pb-1.5 inline-block px-6">
              JADWAL & RINCIAN TAHAPAN PRODUKSI (TIME & ACTION SCHEDULE)
            </h1>
            <p className="text-[10px] text-slate-500 mt-1 italic">
              Dokumen komitmen jadwal pengerjaan pesanan garmen antara Pabrik Konveksi dan Buyer Pemesan
            </p>
          </div>

          {/* 3. INFORMASI ORDER & PROYEK */}
          <div className="grid grid-cols-2 gap-4 mb-4 text-[11px] bg-slate-50/80 p-3.5 rounded-lg border border-slate-200">
            <div className="space-y-1">
              <div className="flex">
                <span className="w-32 text-slate-500 font-semibold">Nomor PO Acuan:</span>
                <span className="font-bold text-slate-900">{timeline.poNumber}</span>
              </div>
              <div className="flex">
                <span className="w-32 text-slate-500 font-semibold">Brand / Buyer:</span>
                <span className="font-bold text-slate-900 uppercase">{timeline.brand}</span>
              </div>
              <div className="flex">
                <span className="w-32 text-slate-500 font-semibold">Vendor Pelaksana:</span>
                <span className="font-semibold text-slate-800 uppercase">{timeline.vendor || 'In-House MRM'}</span>
              </div>
              <div className="flex">
                <span className="w-32 text-slate-500 font-semibold">Artikel / Model:</span>
                <span className="font-bold text-indigo-900">{timeline.productName}</span>
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex">
                <span className="w-32 text-slate-500 font-semibold">Volume Produksi:</span>
                <span className="font-black text-slate-900 tabular-nums">{timeline.totalQty.toLocaleString('id-ID')} Pcs</span>
              </div>
              <div className="flex">
                <span className="w-32 text-slate-500 font-semibold">Periode Pengerjaan:</span>
                <span className="font-bold text-slate-900">
                  {formatDateIndo(timeline.startDate)} s/d {formatDateIndo(timeline.targetDeliveryDate)}
                </span>
              </div>
              <div className="flex">
                <span className="w-32 text-slate-500 font-semibold">Total Durasi Kerja:</span>
                <span className="font-bold text-slate-900">{timeline.totalDays} Hari Kalender</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-32 text-slate-500 font-semibold">Status Pengerjaan:</span>
                <span className="font-black text-emerald-800 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded text-[10px]">
                  {timeline.status} ({timeline.overallProgress}% Selesai)
                </span>
              </div>
            </div>
          </div>

          {/* 4. TABEL RINCIAN TAHAPAN PENGERJAAN */}
          <div className="mb-4">
            <div className="text-[11px] font-bold text-slate-900 uppercase tracking-wide mb-2 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-indigo-600" />
              <span>Rincian Urutan Alur & Durasi Tahapan Produksi:</span>
            </div>

            <table className="w-full text-[10px] border-collapse border border-slate-300">
              <thead>
                <tr className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300 uppercase">
                  <th className="border border-slate-300 py-2 px-1.5 text-center w-8">No</th>
                  <th className="border border-slate-300 py-2 px-2 text-left">Tahapan Proses Produksi</th>
                  <th className="border border-slate-300 py-2 px-2 text-left w-28">PIC / Pelaksana</th>
                  <th className="border border-slate-300 py-2 px-2 text-center w-24">Tgl Mulai</th>
                  <th className="border border-slate-300 py-2 px-2 text-center w-24">Target Selesai</th>
                  <th className="border border-slate-300 py-2 px-1.5 text-center w-14">Durasi</th>
                  <th className="border border-slate-300 py-2 px-1.5 text-center w-16">Progres</th>
                  <th className="border border-slate-300 py-2 px-2 text-center w-24">Status</th>
                </tr>
              </thead>
              <tbody>
                {timeline.stages.map((stage, idx) => (
                  <tr key={stage.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'}>
                    <td className="border border-slate-300 py-2 px-1.5 text-center font-bold text-slate-500">
                      {idx + 1}
                    </td>
                    <td className="border border-slate-300 py-2 px-2">
                      <div className="font-bold text-slate-900">{stage.name}</div>
                      {stage.description && (
                        <div className="text-[9px] text-slate-500 mt-0.5 leading-tight">{stage.description}</div>
                      )}
                    </td>
                    <td className="border border-slate-300 py-2 px-2 font-medium text-slate-700">
                      {stage.picVendor || '-'}
                    </td>
                    <td className="border border-slate-300 py-2 px-2 text-center tabular-nums font-medium text-slate-800">
                      {formatDateIndo(stage.startDate)}
                    </td>
                    <td className="border border-slate-300 py-2 px-2 text-center tabular-nums font-medium text-slate-800">
                      {formatDateIndo(stage.endDate)}
                    </td>
                    <td className="border border-slate-300 py-2 px-1.5 text-center font-bold text-slate-900">
                      {stage.durationDays} Hari
                    </td>
                    <td className="border border-slate-300 py-2 px-1.5 text-center font-bold">
                      <div className="flex flex-col items-center gap-0.5">
                        <span className="tabular-nums">{stage.progressPercent}%</span>
                        <div className="w-10 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${
                              stage.progressPercent === 100
                                ? 'bg-emerald-600'
                                : stage.progressPercent > 0
                                ? 'bg-indigo-600'
                                : 'bg-slate-300'
                            }`}
                            style={{ width: `${stage.progressPercent}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="border border-slate-300 py-2 px-2 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[9px] font-bold border ${getStatusBadge(
                          stage.status
                        )}`}
                      >
                        {stage.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 5. CATATAN & KLAUSUL PPIC */}
          <div className="mb-8 p-3 rounded bg-slate-50 border border-slate-200 text-[10px] text-slate-600 space-y-1">
            <div className="font-bold text-slate-800 uppercase tracking-wider text-[10px]">
              Ketentuan & Catatan Operasional Produksi:
            </div>
            <p>1. Jadwal ini disusun berdasarkan perhitungan kapasitas terpasang garmen dan estimasi kedatangan bahan baku.</p>
            <p>2. Keterlambatan pembayaran termin (DP) atau revisi spek dari pihak buyer dapat menggeser tanggal target pengerjaan.</p>
            <p>3. Tim QC bertindak independen melakukan inspeksi berkala pada tahapan Cutting, Sewing, dan Final Packing.</p>
            {timeline.notes && (
              <p className="font-semibold text-slate-800 pt-1 border-t border-slate-200 mt-1">
                Catatan Khusus: {timeline.notes}
              </p>
            )}
          </div>

          {/* 6. KOLOM TANDA TANGAN DUA PIHAK */}
          <div className="pt-2 border-t border-slate-200">
            <div className="grid grid-cols-2 gap-8 text-center text-[10px]">
              {/* Kolom Pabrik */}
              <div className="space-y-12">
                <div>
                  <div className="font-bold text-slate-700">Dibuat & Dijadwalkan Oleh:</div>
                  <div className="font-black text-slate-900">TIM PPIC & PRODUKSI MRM</div>
                </div>
                <div>
                  <div className="border-b border-slate-400 w-40 mx-auto"></div>
                  <div className="font-bold text-slate-800 mt-1">( Cecep / Manajer Produksi )</div>
                  <div className="text-slate-400 text-[9px]">Maison Rayyan Manufacturing</div>
                </div>
              </div>

              {/* Kolom Buyer */}
              <div className="space-y-12">
                <div>
                  <div className="font-bold text-slate-700">Disetujui & Diterima Oleh Buyer:</div>
                  <div className="font-black text-slate-900 uppercase">PERWAKILAN BRAND {timeline.brand}</div>
                </div>
                <div>
                  <div className="border-b border-slate-400 w-40 mx-auto"></div>
                  <div className="font-bold text-slate-800 mt-1">( Perwakilan Resmi Buyer )</div>
                  <div className="text-slate-400 text-[9px]">Brand Partner / Merchandiser</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
