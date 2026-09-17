import React, { useRef } from 'react';
import { createPortal } from 'react-dom';
import { Printer, X, FileText, CheckCircle2, Building2, Calendar, ShieldCheck } from 'lucide-react';
import { FobPurchaseOrder } from '../../types';
import { formatRp, formatDateIndo } from '../../utils/formatters';
import { printIsolatedDocument } from '../../utils/printHelper';

interface FobOrderPrintModalProps {
  order: FobPurchaseOrder;
  onClose: () => void;
}

// Terbilang helper in Indonesian
function angkaKeTerbilang(nilai: number): string {
  if (isNaN(nilai) || nilai === 0) return 'Nol Rupiah';
  const satuan = ['', 'Satu', 'Dua', 'Tiga', 'Empat', 'Lima', 'Enam', 'Tujuh', 'Delapan', 'Sembilan', 'Sepuluh', 'Sebelas'];

  function pembilang(n: number): string {
    if (n < 12) return satuan[n];
    if (n < 20) return pembilang(n - 10) + ' Belas';
    if (n < 100) return pembilang(Math.floor(n / 10)) + ' Puluh ' + pembilang(n % 10);
    if (n < 200) return 'Seratus ' + pembilang(n - 100);
    if (n < 1000) return pembilang(Math.floor(n / 100)) + ' Ratus ' + pembilang(n % 100);
    if (n < 2000) return 'Seribu ' + pembilang(n - 1000);
    if (n < 1000000) return pembilang(Math.floor(n / 1000)) + ' Ribu ' + pembilang(n % 1000);
    if (n < 1000000000) return pembilang(Math.floor(n / 1000000)) + ' Juta ' + pembilang(n % 1000000);
    if (n < 1000000000000) return pembilang(Math.floor(n / 1000000000)) + ' Miliar ' + pembilang(n % 1000000000);
    return '';
  }

  const hasil = pembilang(Math.floor(Math.abs(nilai))).trim().replace(/\s+/g, ' ');
  return hasil ? `${hasil} Rupiah` : 'Nol Rupiah';
}

export const FobOrderPrintModal: React.FC<FobOrderPrintModalProps> = ({ order, onClose }) => {
  const paperRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    if (!paperRef.current) return;
    const safeNo = (order.poNumber || 'PO').replace(/[/\\?%*:|"<>]/g, '-');
    const docTitle = `Konfirmasi_Order_FOB_${safeNo}_${order.brand}`;
    printIsolatedDocument(paperRef.current, docTitle);
  };

  const keteranganLines = order.keterangan
    ? order.keterangan.split('\n').filter((l) => l.trim().length > 0)
    : [
        '1. Produk yang disepakati memakai bahan dan spesifikasi grade standar yang telah disetujui.',
        '2. Packaging menggunakan plastik kemasan dan label lengkap standar brand.',
        '3. Target batas bawah efisiensi dan margin laba operasional tetap terjaga.',
        '4. Target deadline produksi diselesaikan tepat waktu sesuai durasi kesepakatan PO.',
      ];

  return createPortal(
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex flex-col items-center justify-start p-2 sm:p-4 overflow-y-auto">
      {/* Top Floating Control Bar */}
      <div className="sticky top-2 z-20 w-full max-w-4xl bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-slate-200 p-3 mb-4 flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-700 shrink-0">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-800 flex items-center gap-2">
              <span>Pratinjau Dokumen Konfirmasi Order Brand (FOB)</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold border bg-indigo-50 text-indigo-700 border-indigo-200">
                {order.poNumber}
              </span>
            </div>
            <div className="text-[11px] text-slate-500">
              Brand: <strong>{order.brand}</strong> • Vendor: <strong>{order.vendor}</strong> • Total: <strong>{order.totalQty} Pcs</strong> • {formatRp(order.grandTotal)}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-md shadow-indigo-200 transition cursor-pointer"
            title="Download PDF / Cetak Dokumen"
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

      {/* PRINTABLE A4 PAPER (KONVEKSYS CORPORATE DESIGN) */}
      <div className="w-full flex justify-center pb-12">
        <div
          ref={paperRef}
          className="w-full max-w-[210mm] min-h-[297mm] bg-white shadow-2xl rounded-sm p-8 sm:p-10 text-slate-900 border border-slate-300 font-sans text-xs print:shadow-none print:border-none print:p-4"
          style={{ boxSizing: 'border-box' }}
        >
          {/* 1. KOP SURAT FORMAL MAISON RAYYAN MANUFACTURING */}
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
                    Jl. Industri Makloon No. 88, Bandung • Telp: 0821–2822–4328 • Email: commercial@maisonmrm.co.id
                  </p>
                </div>
              </div>

              <div className="text-right shrink-0">
                <div className="inline-block px-3 py-1 border-2 border-slate-900 font-black text-[11px] uppercase tracking-wide rounded bg-slate-50 whitespace-nowrap">
                  PURCHASE ORDER (PO) BRAND
                </div>
                <div className="text-[10.5px] font-bold text-slate-800 mt-1 whitespace-nowrap">
                  No: {order.poNumber}
                </div>
                {order.internalId && (
                  <div className="text-[9.5px] font-semibold text-slate-500 whitespace-nowrap">
                    Ref ID: {order.internalId}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 2. DUA KARTU INFORMASI UTAMA: BUYER & PRODUKSI */}
          <div className="grid grid-cols-2 gap-4 mb-5">
            {/* Kartu Pihak Buyer / Brand */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-1.5">
              <div className="text-[10px] font-black text-indigo-700 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-200 pb-1">
                <Building2 className="w-3.5 h-3.5" />
                <span>Pihak Pemesan (Buyer / Brand)</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-slate-500">Nama Brand:</span>
                <span className="font-bold text-slate-900">{order.brand}</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-slate-500">PIC Penanggung Jawab:</span>
                <span className="font-semibold text-slate-800">{order.pic || '-'}</span>
              </div>
              {order.management && (
                <div className="flex justify-between text-[11px]">
                  <span className="text-slate-500">Management:</span>
                  <span className="font-semibold text-slate-800">{order.management}</span>
                </div>
              )}
              <div className="flex justify-between text-[11px]">
                <span className="text-slate-500">Tanggal Terbit PO:</span>
                <span className="font-semibold text-slate-800">{formatDateIndo(order.tanggalPo)}</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-slate-500">Prioritas Order:</span>
                <span className={`font-bold ${order.prioritas === 'TINGGI' ? 'text-red-600' : 'text-slate-800'}`}>
                  {order.prioritas}
                </span>
              </div>
            </div>

            {/* Kartu Pihak Pelaksana / Manufaktur */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-1.5">
              <div className="text-[10px] font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-200 pb-1">
                <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                <span>Ketentuan Produksi & Jadwal</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-slate-500">Vendor / Konveksi CMT:</span>
                <span className="font-bold text-slate-900">{order.vendor}</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-slate-500">Target Barang Tiba / Deadline:</span>
                <span className="font-bold text-slate-900">{order.targetTiba ? formatDateIndo(order.targetTiba) : '-'}</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-slate-500">Durasi Pengerjaan:</span>
                <span className="font-bold text-indigo-700">{order.deadlineDays} Hari Kerja</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-slate-500">Status Kontrak:</span>
                <span className="font-black px-1.5 py-0.2 rounded text-[9.5px] bg-emerald-100 text-emerald-800 border border-emerald-200">
                  {order.status}
                </span>
              </div>
            </div>
          </div>

          {/* 3. ARTIKEL INDUK INFO BAR */}
          <div className="bg-indigo-50/70 border border-indigo-100 rounded-lg px-4 py-2.5 mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-slate-500 uppercase">Artikel Induk:</span>
              <span className="text-xs font-black text-slate-900">{order.skuInduk}</span>
            </div>
            <div className="text-xs text-slate-600 font-medium">
              Total Volume: <strong className="text-slate-900">{order.totalQty} Pcs</strong> • Varian: <strong className="text-slate-900">{order.items?.length || 0} Size/Warna</strong>
            </div>
          </div>

          {/* 4. TABEL RINCIAN ITEM & MATRIKS VARIAN */}
          <div className="border border-slate-200 rounded-lg overflow-hidden mb-4">
            <table className="w-full text-left border-collapse text-[10.5px]">
              <thead>
                <tr className="bg-slate-900 text-white font-bold">
                  <th className="py-2 px-2.5 text-center w-8">No</th>
                  <th className="py-2 px-3">Nama SKU / Artikel</th>
                  <th className="py-2 px-2.5 text-center w-24">Warna</th>
                  <th className="py-2 px-2.5 text-center w-16">Size</th>
                  <th className="py-2 px-2.5 text-center w-16">Qty</th>
                  <th className="py-2 px-3 text-right w-28">Harga Satuan</th>
                  <th className="py-2 px-3 text-right w-32">Subtotal</th>
                  <th className="py-2 px-3">Catatan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {order.items && order.items.length > 0 ? (
                  order.items.map((item, idx) => {
                    const isEven = idx % 2 === 0;
                    return (
                      <tr
                        key={item.id || idx}
                        className={`hover:bg-indigo-50/30 transition ${isEven ? 'bg-white' : 'bg-slate-50/70'}`}
                      >
                        <td className="py-1.5 px-2.5 text-center text-slate-400 font-medium">{item.no || idx + 1}</td>
                        <td className="py-1.5 px-3 font-semibold text-slate-900">{item.sku || order.skuInduk}</td>
                        <td className="py-1.5 px-2.5 text-center font-bold text-slate-700 uppercase">{item.warna}</td>
                        <td className="py-1.5 px-2.5 text-center font-black text-indigo-900">{item.size}</td>
                        <td className="py-1.5 px-2.5 text-center font-bold text-slate-900 tabular-nums">{item.qty}</td>
                        <td className="py-1.5 px-3 text-right text-slate-700 font-medium tabular-nums">{formatRp(item.hargaBeli)}</td>
                        <td className="py-1.5 px-3 text-right font-bold text-slate-900 tabular-nums">{formatRp(item.subtotal)}</td>
                        <td className="py-1.5 px-3 text-slate-500 italic text-[10px]">{item.catatan || '-'}</td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={8} className="py-6 text-center text-slate-400 italic">
                      Tidak ada rincian varian produk
                    </td>
                  </tr>
                )}
              </tbody>
              <tfoot>
                <tr className="bg-slate-100 font-black text-slate-900 border-t-2 border-slate-300">
                  <td colSpan={4} className="py-2 px-3 text-right uppercase tracking-wider text-[10px]">
                    Total Volume Pesanan:
                  </td>
                  <td className="py-2 px-2.5 text-center text-xs text-indigo-900">{order.totalQty} Pcs</td>
                  <td className="py-2 px-3 text-right text-[10px] text-slate-500 font-semibold uppercase">Total Pembelian:</td>
                  <td className="py-2 px-3 text-right text-xs text-slate-900">{formatRp(order.totalPembelian)}</td>
                  <td className="py-2 px-3"></td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* 5. IKHTISAR FINANSIAL & TERBILANG */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 mb-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-slate-500">Total Volume Qty:</span>
                  <span className="font-bold text-slate-900">{order.totalQty} Pcs</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Harga Beli Rata-Rata:</span>
                  <span className="font-semibold text-slate-800">{formatRp(order.hargaRataRata)} / Pcs</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Biaya Tambahan / Operasional:</span>
                  <span className="font-semibold text-slate-800">{formatRp(order.biayaLain)}</span>
                </div>
              </div>

              <div className="flex flex-col justify-between border-l border-slate-200 pl-4">
                <div className="flex justify-between items-baseline">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">GRAND TOTAL PO:</span>
                  <span className="text-base font-black text-indigo-900">{formatRp(order.grandTotal)}</span>
                </div>
                <div className="mt-1 pt-1.5 border-t border-slate-200">
                  <span className="text-[9.5px] font-bold text-slate-400 uppercase tracking-wider block">Terbilang:</span>
                  <span className="text-[10px] font-bold text-slate-800 italic leading-snug block">
                    "{angkaKeTerbilang(order.grandTotal)}"
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 6. KETENTUAN & KLAUSUL KESEPAKATAN */}
          <div className="border border-slate-200 rounded-xl p-3 mb-5 bg-white">
            <div className="text-[10.5px] font-bold text-slate-800 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
              <span>Ketentuan Khusus & Klausul Kesepakatan Order</span>
            </div>
            <div className="text-[10px] text-slate-700 space-y-1 font-medium leading-relaxed pl-1">
              {keteranganLines.map((line, idx) => (
                <div key={idx} className="flex items-start gap-1.5">
                  <span>•</span>
                  <span>{line.replace(/^[0-9]+\.\s*/, '')}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 7. LEMBAR PENGESAHAN (SIGNATURE BLOCKS) */}
          <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50">
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider text-center mb-3">
              Lembar Pengesahan & Otorisasi Dokumen PO
            </div>
            <div className="grid grid-cols-3 gap-6 text-center">
              {/* Dibuat Oleh */}
              <div className="flex flex-col justify-between h-24">
                <div className="text-[10px] font-bold text-slate-600 uppercase">DIBUAT OLEH (PIC)</div>
                <div className="border-b border-slate-400 pb-1 mx-2">
                  <span className="text-[10.5px] font-bold text-slate-900">{order.persetujuanDibuat || '........................'}</span>
                </div>
                <div className="text-[9px] text-slate-400">Tim Order & Merchandiser</div>
              </div>

              {/* Disetujui Oleh */}
              <div className="flex flex-col justify-between h-24">
                <div className="text-[10px] font-bold text-slate-600 uppercase">DISETUJUI OLEH (BRAND)</div>
                <div className="border-b border-slate-400 pb-1 mx-2">
                  <span className="text-[10.5px] font-bold text-slate-900">{order.persetujuanDisetujui || order.management || '........................'}</span>
                </div>
                <div className="text-[9px] text-slate-400">Pihak Buyer / Brand</div>
              </div>

              {/* Diterima Vendor */}
              <div className="flex flex-col justify-between h-24">
                <div className="text-[10px] font-bold text-slate-600 uppercase">DITERIMA VENDOR (CMT)</div>
                <div className="border-b border-slate-400 pb-1 mx-2">
                  <span className="text-[10.5px] font-bold text-slate-900">{order.persetujuanVendor || '........................'}</span>
                </div>
                <div className="text-[9px] text-slate-400">Pihak Produsen / Konveksi</div>
              </div>
            </div>
          </div>

          {/* FOOTER NOTE */}
          <div className="mt-4 pt-2 border-t border-slate-200 text-center text-[9px] text-slate-400">
            Dokumen ini diterbitkan secara resmi melalui Sistem KonvekSys Operasional Manufaktur Garment • Dicetak pada {formatDateIndo(new Date().toISOString())}
          </div>

        </div>
      </div>
    </div>,
    document.body
  );
};
