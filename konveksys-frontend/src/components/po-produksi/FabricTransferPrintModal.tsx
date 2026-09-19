import React, { useRef } from 'react';
import { X, Printer, FileText, ArrowRightLeft, Building2, Truck, ShieldCheck } from 'lucide-react';
import { FabricTransferNote, VendorFabricDeposit } from '../../types';
import { printIsolatedDocument } from '../../utils/printHelper';
import { formatDateIndo } from '../../utils/formatters';
import ttdRizkiMaulana from '../../assets/ttd-rizki-maulana.png';

interface FabricTransferPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  transferNote: FabricTransferNote | null;
  deposit?: VendorFabricDeposit | null;
}

export const FabricTransferPrintModal: React.FC<FabricTransferPrintModalProps> = ({
  isOpen,
  onClose,
  transferNote,
  deposit,
}) => {
  const printRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !transferNote) return null;

  const handlePrint = () => {
    if (printRef.current) {
      printIsolatedDocument(printRef.current, `Surat-Jalan-Transfer-${transferNote.transferNumber}`);
    }
  };

  const isRizkiDriver =
    transferNote.driverName.toLowerCase().includes('rizki') ||
    transferNote.driverName.toLowerCase().includes('maulana');

  const isSameVendor = Boolean(
    transferNote.sourceVendor &&
    transferNote.targetVendor &&
    transferNote.sourceVendor.trim().toLowerCase() === transferNote.targetVendor.trim().toLowerCase()
  );

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex flex-col items-center justify-start p-2 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      {/* Top Floating Control Bar */}
      <div className="sticky top-2 z-20 w-full max-w-4xl bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-slate-200 p-3 mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-violet-50 border border-violet-200 flex items-center justify-center text-violet-700">
            {isSameVendor ? <Building2 className="w-5 h-5" /> : <ArrowRightLeft className="w-5 h-5" />}
          </div>
          <div>
            <div className="text-xs font-bold text-slate-800 flex items-center gap-2">
              <span>
                {isSameVendor
                  ? 'Berita Acara Saldo Titipan Standby di Konveksi'
                  : 'Surat Jalan Transfer & Penitipan Bahan Baku'}
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold border bg-emerald-50 text-emerald-700 border-emerald-200">
                {isSameVendor ? 'Standby Workshop' : 'Resmi Oper'}
              </span>
            </div>
            <div className="text-[11px] text-slate-500 font-mono">
              {transferNote.transferNumber} • Ex-PO {transferNote.sourcePONumber}
            </div>
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

      {/* Printable Paper Preview */}
      <div className="w-full flex justify-center pb-12">
        <div
          ref={printRef}
          className="print-wrapper bg-white w-full max-w-4xl rounded-xl shadow-2xl p-6 sm:p-8 text-slate-900 border border-slate-300"
          style={{ minHeight: '600px' }}
        >
          {/* Header Kop */}
          <div className="border-b-2 border-slate-900 pb-3 mb-4 flex items-start justify-between">
            <div className="flex items-center gap-3.5">
              <img
                src="/logo-maison-rayyan.png"
                alt="Maison Rayyan Manufacturing"
                className="h-16 sm:h-20 w-auto object-contain shrink-0"
              />
              <div>
                <h1 className="text-base font-bold text-slate-900 uppercase tracking-wide">
                  MAISON RAYYAN MANUFACTURING
                </h1>
                <p className="text-[10px] text-slate-600">
                  Divisi Logistik Produksi, Pemotongan & Pengelolaan Aset Bahan Baku
                </p>
                <p className="text-[9.5px] text-slate-500">
                  Komp. Industri Tekstil & Konveksi Terpadu • Kontak Pengawas: 0819-0011-2233
                </p>
              </div>
            </div>

            <div className="text-right">
              <span className="inline-block px-2.5 py-1 bg-slate-900 text-white font-bold text-[10px] uppercase tracking-wider rounded">
                {isSameVendor ? 'Berita Acara Sisa Bahan (Standby)' : 'Surat Jalan Oper Bahan'}
              </span>
              <div className="font-mono font-bold text-xs text-slate-900 mt-1.5">
                {transferNote.transferNumber}
              </div>
              <div className="text-[10px] text-slate-600 mt-0.5">
                Tanggal: {formatDateIndo(transferNote.tanggal)}
              </div>
            </div>
          </div>

          {/* Transfer Metadata: Asal -> Tujuan / Penyimpanan */}
          <div className="grid grid-cols-2 gap-4 mb-4 text-xs">
            {/* Konveksi Asal */}
            <div className="border border-slate-300 rounded-lg p-3 bg-slate-50/60">
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                <Building2 className="w-3 h-3 text-slate-700" />
                <span>{isSameVendor ? 'Konveksi Penyimpan (Lokasi Bahan):' : 'Pihak Menyerahkan (Asal):'}</span>
              </div>
              <div className="text-sm font-bold text-slate-900">{transferNote.sourceVendor}</div>
              <div className="text-[11px] text-slate-600 mt-0.5">
                Referensi PO Asal: <b className="font-mono">{transferNote.sourcePONumber}</b>
              </div>
              <div className="text-[10.5px] text-slate-500 mt-0.5">
                Brand Pemesan: <span className="font-semibold uppercase">{transferNote.brand}</span>
              </div>
            </div>

            {/* Konveksi Tujuan */}
            <div className="border border-indigo-200 rounded-lg p-3 bg-indigo-50/40">
              <div className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider mb-1 flex items-center gap-1">
                {isSameVendor ? <ShieldCheck className="w-3 h-3 text-indigo-700" /> : <Truck className="w-3 h-3 text-indigo-700" />}
                <span>{isSameVendor ? 'Status Alokasi & Pengawasan:' : 'Pihak Penerima (Tempat Penitipan):'}</span>
              </div>
              <div className="text-sm font-bold text-indigo-950">
                {isSameVendor ? `Tetap Disimpan di ${transferNote.targetVendor}` : transferNote.targetVendor}
              </div>
              <div className="text-[11px] text-indigo-900 mt-0.5 font-medium">
                Status Bahan:{' '}
                <b>
                  {isSameVendor
                    ? 'Saldo Standby (Siap Dipakai PO / Produk Berbeda)'
                    : 'Saldo Titipan Bahan (Menunggu PO Jahit)'}
                </b>
              </div>
              <div className="text-[10.5px] text-slate-600 mt-0.5">
                {isSameVendor ? 'Petugas Pengukur / QC:' : 'Petugas Pengukur & Pengantar:'}{' '}
                <b>{transferNote.driverName}</b>
              </div>
            </div>
          </div>

          {/* Rincian Bahan yang Dioper / Dititipkan */}
          <div className="mb-4">
            <table className="w-full text-left border-collapse border border-slate-300 text-xs">
              <thead>
                <tr className="bg-slate-100 text-slate-800 text-[10px] font-bold uppercase tracking-wider border-b border-slate-300">
                  <th className="py-2 px-3 border-r border-slate-300 text-center w-10">No</th>
                  <th className="py-2 px-3 border-r border-slate-300">Jenis Kain / Material</th>
                  <th className="py-2 px-3 border-r border-slate-300">Warna</th>
                  <th className="py-2 px-3 border-r border-slate-300 text-center">Hasil Ukur Fisik</th>
                  <th className="py-2 px-3 border-r border-slate-300">Kondisi Kain</th>
                  <th className="py-2 px-3">Catatan Khusus</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-300 text-[11px]">
                <tr>
                  <td className="py-2.5 px-3 border-r border-slate-300 text-center font-mono font-bold">
                    1
                  </td>
                  <td className="py-2.5 px-3 border-r border-slate-300 font-bold text-slate-900">
                    {transferNote.jenisKain}
                  </td>
                  <td className="py-2.5 px-3 border-r border-slate-300 text-slate-700">
                    {transferNote.warna || '-'}
                  </td>
                  <td className="py-2.5 px-3 border-r border-slate-300 text-center font-mono font-bold text-indigo-900 text-xs">
                    {transferNote.panjang.toLocaleString('id-ID')} {transferNote.satuan === 'METER' ? 'Meter' : 'Yard'}
                  </td>
                  <td className="py-2.5 px-3 border-r border-slate-300 text-slate-700">
                    {transferNote.kondisiKain || 'Utuh Bersih'}
                  </td>
                  <td className="py-2.5 px-3 text-slate-500 italic text-[10px]">
                    {transferNote.catatan || `Sisa potongan dari PO ${transferNote.sourcePONumber}`}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Klausul Resmi Penitipan */}
          <div className="border border-slate-200 rounded p-2 px-2.5 bg-slate-50/60 text-[9px] text-slate-600 mb-5 space-y-1">
            <div className="font-bold text-slate-800 uppercase flex items-center gap-1 text-[9.5px]">
              <ShieldCheck className="w-3 h-3 text-indigo-600" />
              <span>Ketentuan & Tanggung Jawab Penitipan Bahan:</span>
            </div>
            {isSameVendor ? (
              <ul className="list-disc list-inside space-y-0.5 text-[8.5px] leading-tight text-slate-600">
                <li>
                  Sisa kain di atas telah diukur bersama di lokasi workshop <b>{transferNote.sourceVendor}</b> dan disimpan dalam kondisi bersih & baik.
                </li>
                <li>
                  Bahan baku berstatus <b>Titipan Standby Aset Maison Rayyan</b> di <b>{transferNote.targetVendor}</b> dan siap dialokasikan untuk pesanan PO / produk berikutnya yang diterbitkan.
                </li>
                <li>
                  Pihak konveksi bertanggung jawab penuh menjaga fisik bahan dari basah, debu, dan risiko kerusakan selama masa penyimpanan standby.
                </li>
              </ul>
            ) : (
              <ul className="list-disc list-inside space-y-0.5 text-[8.5px] leading-tight text-slate-600">
                <li>
                  Sisa kain di atas telah diukur bersama di lokasi <b>{transferNote.sourceVendor}</b> dan diserahterimakan dalam kondisi bersih.
                </li>
                <li>
                  Bahan baku berstatus <b>Titipan Aset Maison Rayyan</b> di <b>{transferNote.targetVendor}</b> dan tidak boleh digunakan untuk pesanan lain selain PO resmi yang akan diterbitkan.
                </li>
                <li>
                  Penerima titipan wajib menjaga fisik bahan dari basah, debu, dan risiko kerusakan sampai proses jahit dimulai.
                </li>
              </ul>
            )}
          </div>

          {/* 3 Kolom Tanda Tangan Formal */}
          <div className="grid grid-cols-3 gap-4 text-center pt-2" style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}>
            {/* Kolom 1: Konveksi */}
            <div>
              <div className="text-[9px] text-slate-500 mb-0.5">{isSameVendor ? 'Disimpan Oleh:' : 'Diserahkan Oleh:'}</div>
              <div className="text-[10px] font-bold text-slate-800 whitespace-nowrap">
                Konveksi ({transferNote.sourceVendor})
              </div>
              <div className="h-12 flex items-end justify-center">
                <div className="w-32 border-b border-slate-400"></div>
              </div>
              <div className="text-[9px] text-slate-600 mt-1 font-mono">( Pihak Konveksi )</div>
            </div>

            {/* Kolom 2: Kurir / Pengukur Lapangan */}
            <div>
              <div className="text-[9px] text-slate-500 mb-0.5">
                {isSameVendor ? 'Petugas Pengukur / QC:' : 'Pengukur & Pengantar:'}
              </div>
              <div className="text-[10px] font-bold text-slate-800 whitespace-nowrap">
                Tim Logistik Maison Rayyan
              </div>
              <div className="relative h-12 flex items-end justify-center">
                {isRizkiDriver && (
                  <img
                    src={ttdRizkiMaulana}
                    alt="Tanda Tangan Rizki Maulana"
                    className="absolute bottom-[-1px] h-9 max-w-[120px] w-auto object-contain pointer-events-none select-none z-10"
                  />
                )}
                <div className="w-32 border-b border-slate-400"></div>
              </div>
              <div className="text-[9px] text-slate-800 mt-1 font-mono font-medium">
                ( {transferNote.driverName} )
              </div>
            </div>

            {/* Kolom 3: Konveksi Penerima / SPV */}
            <div>
              <div className="text-[9px] text-slate-500 mb-0.5">
                {isSameVendor ? 'Mengetahui / Menyetujui:' : 'Diterima & Disimpan Oleh:'}
              </div>
              <div className="text-[10px] font-bold text-slate-800 whitespace-nowrap">
                {isSameVendor ? 'SPV Produksi / Management' : `Konveksi Penerima (${transferNote.targetVendor})`}
              </div>
              <div className="h-12 flex items-end justify-center">
                <div className="w-32 border-b border-slate-400"></div>
              </div>
              <div className="text-[9px] text-slate-600 mt-1 font-mono">
                {isSameVendor ? '( SPV / Owner )' : '( Pihak Konveksi Penerima )'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
