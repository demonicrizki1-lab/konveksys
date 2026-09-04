import React, { useRef } from 'react';
import { Download, Printer, X, ClipboardList } from 'lucide-react';
import { AccessoryItem } from '../../types';
import { printIsolatedDocument } from '../../utils/printHelper';
import { formatDateIndo } from '../../utils/formatters';

interface StockOpnamePrintModalProps {
  items: AccessoryItem[];
  categoryFilter: string;
  brandFilter: string;
  onClose: () => void;
}

export const StockOpnamePrintModal: React.FC<StockOpnamePrintModalProps> = ({
  items,
  categoryFilter,
  brandFilter,
  onClose,
}) => {
  const paperRef = useRef<HTMLDivElement>(null);

  const handleExportPDF = () => {
    if (!paperRef.current) return;
    const dateStr = new Date().toISOString().split('T')[0];
    const docTitle = `Lembar_Stock_Opname_Aksesoris_${dateStr}`;
    printIsolatedDocument(paperRef.current, docTitle);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-hidden">
      <div className="bg-slate-100 rounded-2xl max-w-5xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-300 overflow-hidden animate-slideUp">
        
        {/* Top Control Toolbar */}
        <div className="bg-white px-5 py-3.5 border-b border-slate-200 flex items-center justify-between shrink-0 z-30 shadow-xs">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <ClipboardList className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <span>Formulir Cetak Stock Opname Aksesoris & Trims</span>
                <span className="text-slate-400">•</span>
                <span className="text-amber-700">{items.length} Item Terdata</span>
              </div>
              <div className="text-[11px] text-slate-500 font-mono">
                Kategori: {categoryFilter} • Brand: {brandFilter}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportPDF}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold shadow-sm flex items-center gap-1.5 transition btn-press"
              title="Download PDF Form Stock Opname"
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
          
          {/* Printable A4 Paper Document */}
          <div
            ref={paperRef}
            id="statement-paper"
            className="bg-white rounded-xl shadow-lg border border-slate-200 p-6 sm:p-8 space-y-4 text-slate-800 max-w-4xl w-full my-auto text-xs"
          >
            {/* Header Kop Perusahaan */}
            <div className="flex justify-between items-start border-b-2 border-slate-900 pb-3">
              <div>
                <h2 className="text-xl font-bold tracking-tight text-slate-900">MAISON RAYYAN MANUFACTURING</h2>
                <p className="text-xs text-slate-500 mt-0.5">Konveksi & Makloon Garment Terpadu</p>
                <p className="text-[10px] text-slate-400">Jl. Industri Makloon No. 88, Bandung • Telp: 0812-3456-7890</p>
              </div>
              <div className="text-right">
                <span className="badge-dark bg-slate-900 text-white text-[10px] font-bold px-3 py-1 rounded uppercase tracking-wider inline-block">
                  LEMBAR STOCK OPNAME AKSESORIS
                </span>
                <div className="text-xs font-bold text-amber-800 mt-1.5">
                  Tanggal Cek: {formatDateIndo(new Date().toISOString())}
                </div>
                <div className="text-[11px] text-slate-500">
                  Gudang Utama & Material Trims
                </div>
              </div>
            </div>

            {/* Table Checklist */}
            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-900 text-white font-bold text-[9px] uppercase">
                  <tr>
                    <th className="p-2 w-8 text-center">No</th>
                    <th className="p-2 whitespace-nowrap">Kode SKU</th>
                    <th className="p-2">Nama Aksesoris & Spesifikasi</th>
                    <th className="p-2">Brand / Kategori</th>
                    <th className="p-2">Lokasi Rak</th>
                    <th className="p-2 text-center whitespace-nowrap">Stok Sistem</th>
                    <th className="p-2 text-center w-24 bg-slate-800 text-amber-300 whitespace-nowrap">
                      Hitung Fisik
                    </th>
                    <th className="p-2 text-center w-20 whitespace-nowrap">Selisih</th>
                    <th className="p-2 w-28">Keterangan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {items.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="p-6 text-center text-slate-400">
                        Tidak ada data aksesoris pada filter ini.
                      </td>
                    </tr>
                  ) : (
                    items.map((item, idx) => (
                      <tr key={item.id} className="hover:bg-slate-50">
                        <td className="p-2 text-center font-bold text-slate-400">{idx + 1}</td>
                        <td className="p-2 font-mono font-bold text-indigo-700 whitespace-nowrap">
                          {item.sku}
                        </td>
                        <td className="p-2 font-semibold text-slate-900">
                          {item.name}
                        </td>
                        <td className="p-2">
                          <span className="font-medium text-slate-800">{item.brand || 'UMUM'}</span>
                          <span className="text-[9px] text-slate-400 block">{item.category}</span>
                        </td>
                        <td className="p-2 text-slate-600 font-mono text-[11px]">
                          {item.location || '-'}
                        </td>
                        <td className="p-2 text-center font-bold text-slate-800 whitespace-nowrap">
                          {item.stock} {item.unit}
                        </td>
                        {/* Blank boxes for physical checking */}
                        <td className="p-2 text-center bg-slate-50 border-x border-slate-200 font-bold">
                          <span className="inline-block w-full border-b border-dashed border-slate-400 pb-2"></span>
                        </td>
                        <td className="p-2 text-center">
                          <span className="inline-block w-full border-b border-dashed border-slate-400 pb-2"></span>
                        </td>
                        <td className="p-2 text-[10px] text-slate-500">
                          <span className="inline-block w-full border-b border-dashed border-slate-400 pb-2"></span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Petunjuk & Tanda Tangan */}
            <div className="pt-4 flex justify-between items-end text-[10px] text-slate-600 border-t border-slate-200 mt-4">
              <div className="max-w-md text-slate-500 space-y-1">
                <span className="font-bold text-slate-700 block">Petunjuk Pemeriksaan Fisik:</span>
                <p>1. Lakukan penghitungan fisik secara teliti per lokasi rak/box penyimpanan.</p>
                <p>2. Tuliskan jumlah fisik riil pada kolom 'Hitung Fisik'.</p>
                <p>3. Jika terdapat selisih rusak/hilang, beri catatan pada kolom keterangan dan serahkan ke Admin untuk input penyesuaian di sistem.</p>
              </div>

              <div className="flex gap-10 text-center">
                <div className="w-36">
                  <div className="text-slate-400 mb-12">Petugas Gudang (Checker),</div>
                  <div className="border-b border-slate-400 font-bold text-slate-800 pb-0.5">( ..................................... )</div>
                  <div className="text-[9px] text-slate-400 mt-0.5">Staff Gudang Trims</div>
                </div>
                <div className="w-36">
                  <div className="text-slate-400 mb-12">Kepala Gudang / SPV,</div>
                  <div className="border-b border-slate-400 font-bold text-slate-800 pb-0.5">( ..................................... )</div>
                  <div className="text-[9px] text-slate-400 mt-0.5">Maison Rayyan Mfg</div>
                </div>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};
