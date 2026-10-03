import React, { useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Download, Printer, X, Shield, ShieldAlert, FileSpreadsheet } from 'lucide-react';
import { HPPCalculationRecord } from '../../types';
import { formatRp, formatDateIndo } from '../../utils/formatters';
import { printIsolatedDocument } from '../../utils/printHelper';

interface FobHppPrintModalProps {
  hpp: HPPCalculationRecord;
  onClose: () => void;
}

export const FobHppPrintModal: React.FC<FobHppPrintModalProps> = ({ hpp, onClose }) => {
  const paperRef = useRef<HTMLDivElement>(null);
  const [hideSupplier, setHideSupplier] = useState<boolean>(true);

  const handlePrint = () => {
    if (!paperRef.current) return;
    const safeNo = (hpp.noHpp || 'HPP').replace(/[/\\?%*:|"<>]/g, '-');
    const docTitle = `Lembar_Kerja_HPP_${safeNo}_${hpp.namaProduk}_Size_${hpp.size}`;
    printIsolatedDocument(paperRef.current, docTitle);
  };

  const bahanItems = (hpp.components || []).filter(
    c => c.jenisBiaya === 'BAHAN_BAKU' || c.jenisBiaya === 'BAHAN_PENDUKUNG' || c.jenisBiaya === 'AKSESORIS'
  );
  const cmtItems = (hpp.components || []).filter(
    c => c.jenisBiaya !== 'BAHAN_BAKU' && c.jenisBiaya !== 'BAHAN_PENDUKUNG' && c.jenisBiaya !== 'AKSESORIS'
  );

  const bahanTotal = Number(hpp.hppBahanTotal) || 0;
  const cmtTotal = Number(hpp.hppCmtTotal) || 0;
  const totalBahanCmt = bahanTotal + cmtTotal;

  const ovhPct = hpp.overheadPercent !== undefined && hpp.overheadPercent !== null
    ? Number(hpp.overheadPercent)
    : (hpp.nilaiOverhead !== undefined && hpp.nilaiOverhead !== null
        ? (totalBahanCmt > 0 ? Math.round((Number(hpp.nilaiOverhead) / totalBahanCmt) * 100) : 0)
        : (
          (Number(hpp.totalSebelumReject) || 0) > totalBahanCmt && totalBahanCmt > 0
            ? Math.round(((Number(hpp.totalSebelumReject) - totalBahanCmt) / totalBahanCmt) * 100)
            : 0
        )
      );

  const ovhVal = hpp.nilaiOverhead !== undefined && hpp.nilaiOverhead !== null
    ? Number(hpp.nilaiOverhead)
    : Math.round(totalBahanCmt * (ovhPct / 100));

  return createPortal(
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex flex-col items-center justify-start p-2 sm:p-4 overflow-y-auto">
      {/* Top Floating Sticky Control Bar */}
      <div className="sticky top-2 z-20 w-full max-w-4xl bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-slate-200 p-3 mb-4 flex flex-wrap items-center justify-between gap-3 animate-in fade-in slide-in-from-top-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-700 shrink-0">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-800 flex items-center gap-2">
              <span>Pratinjau Lembar Kalkulasi HPP</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold border bg-indigo-50 text-indigo-700 border-indigo-200">
                {hpp.noHpp}
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold border bg-slate-100 text-slate-700 border-slate-200">
                Size {hpp.size}
              </span>
            </div>
            <div className="text-[11px] text-slate-500">
              {hpp.namaProduk} • Brand {hpp.brand || 'UMUM'} • Batch {hpp.batchQty || 100} Pcs
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Toggle Kerahasiaan Supplier */}
          <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 cursor-pointer transition text-xs font-semibold text-slate-700 select-none">
            <input
              type="checkbox"
              checked={hideSupplier}
              onChange={e => setHideSupplier(e.target.checked)}
              className="w-3.5 h-3.5 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
            />
            {hideSupplier ? (
              <span className="flex items-center gap-1 text-emerald-700">
                <Shield className="w-3.5 h-3.5" /> Supplier Disembunyikan
              </span>
            ) : (
              <span className="flex items-center gap-1 text-amber-700">
                <ShieldAlert className="w-3.5 h-3.5" /> Supplier Ditampilkan
              </span>
            )}
          </label>

          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-md shadow-indigo-200 transition cursor-pointer"
            title="Download PDF atau Cetak Lembar HPP"
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
          {/* Header Kop Surat Formal */}
          <div className="border-b-2 border-slate-900 pb-2.5 mb-3.5">
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
                  LEMBAR KERJA HPP
                </div>
                <div className="text-[10.5px] font-bold text-slate-800 mt-1 whitespace-nowrap">
                  No: {hpp.noHpp}
                </div>
              </div>
            </div>
          </div>
          {/* Document Metadata Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-2.5 bg-slate-50 rounded-lg border border-slate-200 mb-3 text-[11px]">
            <div>
              <span className="text-slate-400 block text-[9.5px] uppercase font-bold">Brand Mitra</span>
              <span className="font-bold text-slate-900 uppercase">{hpp.brand || 'UMUM'}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[9.5px] uppercase font-bold">Kategori</span>
              <span className="font-semibold text-slate-800">{hpp.kategori || '-'}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[9.5px] uppercase font-bold">Tanggal Kalkulasi</span>
              <span className="font-semibold text-slate-800">{formatDateIndo(hpp.tanggal)}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[9.5px] uppercase font-bold">Target Produksi</span>
              <span className="font-bold text-indigo-700">{hpp.batchQty || 100} Pcs / Batch</span>
            </div>
          </div>

            {/* PRODUCT SPECIFICATION BANNER */}
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 mb-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">NAMA PRODUK</span>
                <span className="font-bold text-slate-900 text-sm">{hpp.namaProduk}</span>
                {hpp.kodeProduk && <span className="block text-[11px] text-slate-500">Kode: {hpp.kodeProduk}</span>}
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">UKURAN (SIZE)</span>
                <span className="inline-block px-2 py-0.5 mt-0.5 bg-indigo-100 text-indigo-800 rounded font-bold text-sm">
                  {hpp.size}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">VENDOR CMT ACUAN</span>
                <span className="font-semibold text-slate-800">{hpp.vendorCmt || 'In-House'}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">STATUS BIAYA</span>
                <span className="inline-block text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 mt-0.5">
                  FOB Complete
                </span>
              </div>
            </div>

            {/* TABEL 1: BAHAN BAKU & AKSESORIS */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-1.5">
                <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
                  I. Rincian Bahan Baku & Aksesoris
                </h2>
                <span className="text-xs font-bold text-slate-700 tabular-nums">
                  Subtotal: {formatRp(hpp.hppBahanTotal)} / Pcs
                </span>
              </div>
              <table className="w-full text-xs border border-slate-200 rounded-lg overflow-hidden">
                <thead className="bg-slate-100 text-slate-700 text-[11px] uppercase font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-1.5 px-2.5 text-center w-8">No</th>
                    <th className="py-1.5 px-2.5 text-left">Nama Komponen Bahan</th>
                    {!hideSupplier && <th className="py-1.5 px-2.5 text-left">Supplier</th>}
                    <th className="py-1.5 px-2.5 text-center w-16">Satuan</th>
                    <th className="py-1.5 px-2.5 text-right w-20">Marker/Pcs</th>
                    <th className="py-1.5 px-2.5 text-right w-24">Harga (Rp)</th>
                    <th className="py-1.5 px-2.5 text-right w-16">Waste</th>
                    <th className="py-1.5 px-2.5 text-right w-28">Subtotal (Rp)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {bahanItems.length === 0 ? (
                    <tr>
                      <td colSpan={hideSupplier ? 7 : 8} className="py-3 text-center text-slate-400 italic">
                        Tidak ada komponen bahan baku
                      </td>
                    </tr>
                  ) : (
                    bahanItems.map((item, idx) => (
                      <tr key={item.id || idx} className="hover:bg-slate-50/50">
                        <td className="py-1.5 px-2.5 text-center text-slate-400 font-medium">{idx + 1}</td>
                        <td className="py-1.5 px-2.5 font-medium text-slate-800">
                          {item.namaBahan}
                          <span className="ml-1.5 text-[10px] text-slate-400 uppercase font-bold">({item.jenisBiaya.replace('_', ' ')})</span>
                        </td>
                        {!hideSupplier && <td className="py-1.5 px-2.5 text-slate-600 text-[11px]">{item.supplier || '-'}</td>}
                        <td className="py-1.5 px-2.5 text-center text-slate-600 font-medium text-[11px]">{item.satuan}</td>
                        <td className="py-1.5 px-2.5 text-right font-medium tabular-nums">
                          {item.pemakaian}
                          {item.satuan?.toLowerCase() === 'yard' && (
                            <span className="block text-[9.5px] text-slate-400 leading-tight">
                              ≈ {((item.pemakaian || 0) * 0.9144).toFixed(2)} m
                            </span>
                          )}
                        </td>
                        <td className="py-1.5 px-2.5 text-right font-medium tabular-nums">
                          {formatRp(item.hargaSatuan)}
                          {item.satuan?.toLowerCase() === 'yard' && (
                            <span className="block text-[9.5px] text-slate-400 leading-tight">
                              ≈ {formatRp(Math.round((item.hargaSatuan || 0) / 0.9144))}/m
                            </span>
                          )}
                        </td>
                        <td className="py-1.5 px-2.5 text-right text-slate-500 tabular-nums">{item.wastePercent}%</td>
                        <td className="py-1.5 px-2.5 text-right font-bold text-slate-900 tabular-nums">{formatRp(item.subtotal)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* TABEL 2: CMT, SABLON, FINISHING & PACKAGING */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-1.5">
                <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                  II. Jasa CMT, Sablon/Bordir, Finishing & Packaging
                </h2>
                <span className="text-xs font-bold text-slate-700 tabular-nums">
                  Subtotal: {formatRp(hpp.hppCmtTotal)} / Pcs
                </span>
              </div>
              <table className="w-full text-xs border border-slate-200 rounded-lg overflow-hidden">
                <thead className="bg-slate-100 text-slate-700 text-[11px] uppercase font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-1.5 px-2.5 text-center w-8">No</th>
                    <th className="py-1.5 px-2.5 text-left">Nama Pekerjaan / Jasa</th>
                    {!hideSupplier && <th className="py-1.5 px-2.5 text-left">Pelaksana</th>}
                    <th className="py-1.5 px-2.5 text-center w-16">Satuan</th>
                    <th className="py-1.5 px-2.5 text-right w-20">Volume</th>
                    <th className="py-1.5 px-2.5 text-right w-24">Tarif (Rp)</th>
                    <th className="py-1.5 px-2.5 text-right w-28">Subtotal (Rp)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {cmtItems.length === 0 ? (
                    <tr>
                      <td colSpan={hideSupplier ? 6 : 7} className="py-3 text-center text-slate-400 italic">
                        Tidak ada komponen CMT / finishing
                      </td>
                    </tr>
                  ) : (
                    cmtItems.map((item, idx) => (
                      <tr key={item.id || idx} className="hover:bg-slate-50/50">
                        <td className="py-1.5 px-2.5 text-center text-slate-400 font-medium">{idx + 1}</td>
                        <td className="py-1.5 px-2.5 font-medium text-slate-800">
                          {item.namaBahan}
                          <span className="ml-1.5 text-[10px] text-slate-400 uppercase font-bold">({item.jenisBiaya.replace('_', ' ')})</span>
                        </td>
                        {!hideSupplier && <td className="py-1.5 px-2.5 text-slate-600 text-[11px]">{item.supplier || '-'}</td>}
                        <td className="py-1.5 px-2.5 text-center text-slate-600 font-medium text-[11px]">{item.satuan}</td>
                        <td className="py-1.5 px-2.5 text-right font-medium tabular-nums">{item.pemakaian}</td>
                        <td className="py-1.5 px-2.5 text-right font-medium tabular-nums">{formatRp(item.hargaSatuan)}</td>
                        <td className="py-1.5 px-2.5 text-right font-bold text-slate-900 tabular-nums">{formatRp(item.subtotal)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* RINGKASAN REKAPITULASI HPP & MARGIN */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <div className="border border-slate-200 rounded-lg p-3.5 bg-slate-50/50 text-xs">
                <h3 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] mb-2 pb-1 border-b border-slate-200">
                  Komposisi Biaya & Cadangan
                </h3>
                <div className="space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Total Biaya Bahan Baku:</span>
                    <span className="font-semibold tabular-nums">{formatRp(hpp.hppBahanTotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Total Jasa CMT & Finishing:</span>
                    <span className="font-semibold tabular-nums">{formatRp(hpp.hppCmtTotal)}</span>
                  </div>
                  <div className="flex justify-between text-blue-700">
                    <span>Biaya Overhead Pabrik ({ovhPct}%):</span>
                    <span className="font-semibold tabular-nums">+ {formatRp(ovhVal)}</span>
                  </div>
                  <div className="flex justify-between text-amber-700">
                    <span>Cadangan Reject ({hpp.rejectPercent}%):</span>
                    <span className="font-semibold tabular-nums">+ {formatRp(hpp.nilaiReject)}</span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-slate-200 font-bold text-slate-900">
                    <span>HPP Pokok Final / Pcs:</span>
                    <span className="tabular-nums text-indigo-900 font-black">{formatRp(hpp.hppFinalPerPcs)}</span>
                  </div>
                </div>
              </div>

              <div className="border-2 border-indigo-200 bg-indigo-50/40 rounded-lg p-3.5 text-xs">
                <h3 className="font-bold text-indigo-950 uppercase tracking-wider text-[11px] mb-2 pb-1 border-b border-indigo-200 flex justify-between">
                  <span>Hasil Akhir & Rekomendasi Jual</span>
                  <span className="text-indigo-700 font-bold tabular-nums">Markup {hpp.targetLabaPercent}%</span>
                </h3>
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-slate-700">
                    <span className="font-bold">HPP FINAL / PCS:</span>
                    <span className="font-bold text-slate-900 text-sm tabular-nums">{formatRp(hpp.hppFinalPerPcs)}</span>
                  </div>
                  <div className="flex justify-between items-center text-emerald-800 bg-emerald-50 px-2 py-1 rounded border border-emerald-200">
                    <span className="font-bold text-[11px] uppercase tracking-wide">
                      REKOMENDASI JUAL FOB{hpp.isPpnIncluded ? ' (DPP)' : ''}:
                    </span>
                    <span className="font-bold text-emerald-700 text-base tabular-nums">{formatRp(hpp.hargaJualRekomendasi)}</span>
                  </div>
                  {hpp.isPpnIncluded && (
                    <div className="flex justify-between items-center text-slate-700 bg-slate-100/80 px-2 py-1 rounded border border-slate-200">
                      <span className="font-medium text-[11px]">PPN 11%:</span>
                      <span className="font-semibold text-slate-800 tabular-nums">
                        + {formatRp(hpp.nilaiPpn ?? Math.round(hpp.hargaJualRekomendasi * 0.11))}
                      </span>
                    </div>
                  )}
                  {hpp.isPpnIncluded && (
                    <div className="flex justify-between items-center text-indigo-900 bg-indigo-100/60 px-2 py-1 rounded border border-indigo-300">
                      <span className="font-bold text-[11px] uppercase">TOTAL (+ PPN 11%):</span>
                      <span className="font-bold text-indigo-800 text-sm tabular-nums">
                        {formatRp(hpp.hargaJualPlusPpn ?? (hpp.hargaJualRekomendasi + Math.round(hpp.hargaJualRekomendasi * 0.11)))}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between text-slate-600 pt-1">
                    <span>Estimasi Laba Bersih / Pcs:</span>
                    <span className="font-bold text-slate-800 tabular-nums">{formatRp(hpp.labaBersihPerPcs)}</span>
                  </div>
                  <div className="flex justify-between text-slate-500 text-[11px]">
                    <span>Total Proyeksi Laba ({hpp.batchQty || 100} Pcs):</span>
                    <span className="font-bold text-indigo-700 tabular-nums">{formatRp(hpp.totalLabaBatch)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* CATATAN TAMBAHAN */}
            {hpp.catatan && (
              <div className="mb-6 p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600">
                <strong className="text-slate-800 font-bold block mb-0.5">Catatan Teknis / Finishing:</strong>
                <p className="whitespace-pre-line">{hpp.catatan}</p>
              </div>
            )}

            {/* TANDA TANGAN */}
            <div className="grid grid-cols-3 gap-4 text-center text-xs mt-8 pt-4 border-t border-slate-200 break-inside-avoid">
              <div>
                <div className="text-[9.5px] text-slate-500 mb-0.5">Dihitung Oleh:</div>
                <div className="text-[10px] font-bold text-slate-800 whitespace-nowrap mb-12">Costing / Merchandiser</div>
                <p className="font-medium text-slate-800 border-b border-slate-400 pb-1 mx-4 text-[9.5px]">( .............................. )</p>
                <p className="text-[9px] text-slate-400 mt-0.5">Staff Costing FOB</p>
              </div>

              <div>
                <div className="text-[9.5px] text-slate-500 mb-0.5">Diperiksa Oleh:</div>
                <div className="text-[10px] font-bold text-slate-800 whitespace-nowrap mb-12">Kepala Produksi</div>
                <p className="font-medium text-slate-800 border-b border-slate-400 pb-1 mx-4 text-[9.5px]">( .............................. )</p>
                <p className="text-[9px] text-slate-400 mt-0.5">Production Manager</p>
              </div>

              <div>
                <div className="text-[9.5px] text-slate-500 mb-0.5">Disetujui Oleh:</div>
                <div className="text-[10px] font-bold text-slate-800 whitespace-nowrap mb-12">Manajemen / Direksi</div>
                <p className="font-medium text-slate-800 border-b border-slate-400 pb-1 mx-4 text-[9.5px]">( .............................. )</p>
                <p className="text-[9px] text-slate-400 mt-0.5">Direktur / Costing Head</p>
              </div>
            </div>

            {/* FOOTER */}
            <div className="mt-6 pt-2 border-t border-slate-100 flex justify-between items-center text-[10px] text-slate-400">
              <span>Dicetak otomatis oleh Sistem FOB Garment - Maison Rayyan Manufacturing</span>
              <span>Dokumen Rahasia & Hak Milik Perusahaan</span>
            </div>

          </div>
        </div>
      </div>,
      document.body
    );
};
