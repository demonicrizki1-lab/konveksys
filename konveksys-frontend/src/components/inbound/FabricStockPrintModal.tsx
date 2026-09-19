import React, { useRef } from 'react';
import { Download, Printer, X, Layers, Building2 } from 'lucide-react';
import { InboundRoll } from '../../types';
import { printIsolatedDocument } from '../../utils/printHelper';
import { formatDateIndo } from '../../utils/formatters';
import ttdRizkiMaulana from '../../assets/ttd-rizki-maulana.png';
import ttdCecepDayat from '../../assets/ttd-cecep-dayat.png';

interface FabricStockPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedRolls: InboundRoll[];
  brandFilter?: string;
}

export const FabricStockPrintModal: React.FC<FabricStockPrintModalProps> = ({
  isOpen,
  onClose,
  selectedRolls,
  brandFilter,
}) => {
  const paperRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  // Helper rupiah
  const formatRp = (num: number) => 'Rp ' + Math.round(num || 0).toLocaleString('id-ID');

  // Kalkulasi agregat
  const totalRol = selectedRolls.length;
  const totalPanjang = selectedRolls.reduce((sum, r) => sum + (Number(r.meterLength) || 0), 0);
  const grandTotalHarga = selectedRolls.reduce((sum, r) => {
    const panjang = Number(r.meterLength) || 0;
    const harga = Number(r.hargaModalMeter) || 0;
    return sum + panjang * harga;
  }, 0);

  // Daftar Brand unik
  const uniqueBrands = Array.from(new Set(selectedRolls.map((r) => r.brand).filter(Boolean)));
  const brandName =
    uniqueBrands.length === 1
      ? uniqueBrands[0]
      : brandFilter && brandFilter !== 'ALL'
      ? brandFilter
      : 'MULTI-BRAND BUYER';

  // Dokumen Meta
  const today = new Date();
  const dateStr = today.toISOString().split('T')[0].replace(/-/g, '');
  const docNumber = `STK-BUYER-${dateStr}-${String(totalRol).padStart(3, '0')}`;

  const handlePrint = () => {
    if (!paperRef.current) return;
    const title = `Rincian_Stok_Kain_${brandName.replace(/\s+/g, '_')}_${dateStr}`;
    printIsolatedDocument(paperRef.current, title);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-hidden animate-in fade-in duration-200">
      <div className="bg-slate-100 rounded-2xl max-w-5xl w-full max-h-[94vh] flex flex-col shadow-2xl border border-slate-300 overflow-hidden">
        {/* Top Control Bar */}
        <div className="bg-white px-5 py-3.5 border-b border-slate-200 flex items-center justify-between shrink-0 z-30 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-700">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900 flex items-center gap-2">
                <span>Laporan Rincian Ketersediaan Stok Kain (Buyer)</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                  {totalRol} Rol Dipilih
                </span>
              </div>
              <div className="text-[11px] text-slate-500 font-mono">
                Brand: <strong className="text-slate-700">{brandName}</strong> • Total Panjang:{' '}
                <strong className="text-slate-900 font-bold">{totalPanjang.toLocaleString('id-ID')} m</strong>
                {grandTotalHarga > 0 && (
                  <>
                    {' '}• Total Nilai:{' '}
                    <strong className="text-emerald-700 font-bold">{formatRp(grandTotalHarga)}</strong>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-200 flex items-center gap-1.5 transition btn-press cursor-pointer"
              title="Cetak atau Simpan PDF"
            >
              <Download className="w-4 h-4" />
              <span>Download PDF</span>
            </button>
            <button
              onClick={handlePrint}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition btn-press hidden sm:flex cursor-pointer"
              title="Cetak langsung"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition cursor-pointer ml-1"
              title="Tutup Preview"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Printable Paper Preview Canvas */}
        <div className="overflow-y-auto p-4 sm:p-6 md:p-8 flex-1 flex justify-center bg-slate-200/60">
          <div
            ref={paperRef}
            id="fabric-stock-paper"
            className="print-wrapper bg-white rounded-xl shadow-lg border border-slate-300 p-6 sm:p-8 text-slate-900 max-w-4xl w-full my-auto text-xs space-y-4"
          >
            {/* Kop Surat Maison Rayyan */}
            <div className="flex justify-between items-start border-b-2 border-slate-900 pb-3">
              <div className="flex items-center gap-3.5">
                <img
                  src="/logo-maison-rayyan.png"
                  alt="Maison Rayyan Manufacturing"
                  className="h-16 sm:h-18 w-auto object-contain shrink-0"
                />
                <div>
                  <h1 className="text-base sm:text-lg font-bold tracking-tight text-slate-900 uppercase">
                    MAISON RAYYAN MANUFACTURING
                  </h1>
                  <p className="text-[10px] text-slate-600 font-medium">
                    Divisi Pengelolaan Gudang Bahan Baku & Logistik Tekstil Terpadu
                  </p>
                  <p className="text-[9.5px] text-slate-500">
                    Komp. Sentra Industri & Konveksi Terpadu, Bandung • WhatsApp CS: 0819-0011-2233
                  </p>
                </div>
              </div>

              <div className="text-right">
                <span className="bg-slate-900 text-white text-[9.5px] font-bold px-2.5 py-1 rounded uppercase tracking-wider inline-block">
                  SURAT RINCIAN STOK KAIN
                </span>
                <div className="text-xs font-mono font-bold text-indigo-700 mt-1.5">{docNumber}</div>
                <div className="text-[10px] text-slate-500 mt-0.5">
                  Tanggal: {formatDateIndo(today.toISOString())}
                </div>
              </div>
            </div>

            {/* Buyer & Target Brand Header */}
            <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                  Ditujukan Kepada (Buyer / Brand):
                </span>
                <span className="text-sm font-bold text-slate-900 flex items-center gap-1.5 mt-0.5">
                  <Building2 className="w-4 h-4 text-indigo-600" />
                  {brandName}
                </span>
              </div>
              <div className="text-left sm:text-right">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                  Peruntukan Dokumen:
                </span>
                <span className="text-xs font-semibold text-slate-700">
                  Laporan Ketersediaan & Nilai Stok Bahan Baku
                </span>
              </div>
            </div>

            {/* 3 Summary Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  Total Rol Terpilih
                </span>
                <span className="text-xl font-bold text-slate-900 mt-0.5 block">{totalRol} Rol</span>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  Total Panjang Kain
                </span>
                <span className="text-xl font-bold text-slate-800 mt-0.5 block font-mono">
                  {totalPanjang.toLocaleString('id-ID')} m
                </span>
              </div>
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-center">
                <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">
                  Total Nilai / Harga Kain
                </span>
                <span className="text-xl font-bold text-emerald-700 mt-0.5 block font-mono">
                  {grandTotalHarga > 0 ? formatRp(grandTotalHarga) : '-'}
                </span>
              </div>
            </div>

            {/* Table Rincian Kain (Sesuai Permintaan Buyer) */}
            <div className="border border-slate-300 rounded-lg overflow-hidden">
              <table className="w-full text-left text-[11px] border-collapse">
                <thead className="bg-slate-100 text-slate-700 font-bold text-[9.5px] uppercase border-b border-slate-300">
                  <tr>
                    <th className="p-2.5 w-8 text-center border-r border-slate-200">No</th>
                    <th className="p-2.5 whitespace-nowrap border-r border-slate-200">Tanggal Masuk</th>
                    <th className="p-2.5 whitespace-nowrap border-r border-slate-200">Kode Rol Kain</th>
                    <th className="p-2.5 whitespace-nowrap border-r border-slate-200">Brand</th>
                    <th className="p-2.5 border-r border-slate-200">Nama Kain</th>
                    <th className="p-2.5 text-right w-28 border-r border-slate-200">Panjang Kain</th>
                    <th className="p-2.5 text-right w-28 border-r border-slate-200">Harga Satuan</th>
                    <th className="p-2.5 text-right w-32 bg-emerald-50/80 text-emerald-900 font-bold">
                      Total Harga
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {selectedRolls.map((roll, idx) => {
                    const panjang = Number(roll.meterLength) || 0;
                    const harga = Number(roll.hargaModalMeter) || 0;
                    const subtotal = panjang * harga;
                    return (
                      <tr key={roll.id} className="hover:bg-slate-50">
                        <td className="p-2.5 text-center text-slate-400 font-semibold border-r border-slate-200">
                          {idx + 1}
                        </td>
                        <td className="p-2.5 text-slate-600 whitespace-nowrap border-r border-slate-200 font-medium">
                          {formatDateIndo(roll.tanggalMasuk)}
                        </td>
                        <td className="p-2.5 font-mono font-bold text-indigo-700 whitespace-nowrap border-r border-slate-200">
                          {roll.rollCode}
                        </td>
                        <td className="p-2.5 font-semibold text-slate-800 whitespace-nowrap border-r border-slate-200">
                          {roll.brand}
                        </td>
                        <td className="p-2.5 font-medium text-slate-900 border-r border-slate-200">
                          {roll.jenisKain}
                        </td>
                        <td className="p-2.5 text-right text-slate-800 border-r border-slate-200 font-bold font-mono">
                          {panjang.toLocaleString('id-ID')} m
                        </td>
                        <td className="p-2.5 text-right text-slate-600 border-r border-slate-200 font-mono">
                          {harga > 0 ? formatRp(harga) : '-'}
                        </td>
                        <td className="p-2.5 text-right font-bold text-emerald-800 bg-emerald-50/30 font-mono">
                          {subtotal > 0 ? formatRp(subtotal) : '-'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="bg-slate-100/90 font-bold text-slate-900 border-t-2 border-slate-300 text-[11px]">
                  <tr>
                    <td colSpan={5} className="p-2.5 text-right uppercase tracking-wider border-r border-slate-200">
                      Total ({totalRol} Rol Kain):
                    </td>
                    <td className="p-2.5 text-right border-r border-slate-200 font-mono text-slate-900 font-bold">
                      {totalPanjang.toLocaleString('id-ID')} m
                    </td>
                    <td className="p-2.5 text-right border-r border-slate-200 text-slate-400 text-[10px]">
                      -
                    </td>
                    <td className="p-2.5 text-right bg-emerald-100/90 text-emerald-950 font-bold font-mono text-xs">
                      {grandTotalHarga > 0 ? formatRp(grandTotalHarga) : '-'}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Catatan & Ketentuan Gudang */}
            <div className="bg-slate-50/80 rounded-xl p-3 border border-slate-200 text-[9.5px] text-slate-600 space-y-1">
              <span className="font-bold text-slate-800 block">Pernyataan & Catatan Gudang Bahan Baku:</span>
              <p>
                1. Data fisik rol kain di atas telah diverifikasi keberadaannya di rak penyimpanan gudang logistik
                Maison Rayyan dalam kondisi terbungkus rapi dan terlindungi.
              </p>
              <p>
                2. Laporan ini merupakan dokumen mutasi dan saldo aset bahan baku resmi antara pihak konveksi dan
                perwakilan buyer/brand mitra.
              </p>
            </div>

            {/* Formal Signature Blocks (Sesuai Format List PO) */}
            <div className="pt-3 border-t border-slate-200 signature-block" style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}>
              <div className="grid grid-cols-3 gap-4 text-center">
                {/* Kolom 1: Admin Produksi (Rizki Maulana) */}
                <div>
                  <div className="text-[9.5px] text-slate-500 mb-0.5">Dibuat Oleh:</div>
                  <div className="text-[11px] font-bold text-slate-900 whitespace-nowrap">Admin Produksi</div>
                  <div className="relative h-11 flex items-end justify-center">
                    <img
                      src={ttdRizkiMaulana}
                      alt="Tanda Tangan Rizki Maulana"
                      className="absolute bottom-[-2px] h-9 max-w-[120px] w-auto object-contain pointer-events-none select-none z-10"
                    />
                    <div className="w-28 border-b border-slate-400"></div>
                  </div>
                  <div className="text-[9.5px] text-slate-700 mt-1 font-mono font-medium whitespace-nowrap">
                    ( Rizki Maulana )
                  </div>
                </div>

                {/* Kolom 2: Pimpinan / Kepala Workshop (Cecep Dayat) */}
                <div>
                  <div className="text-[9.5px] text-slate-500 mb-0.5">Disetujui:</div>
                  <div className="text-[11px] font-bold text-slate-900 whitespace-nowrap">Pimpinan / Kepala Workshop</div>
                  <div className="relative h-11 flex items-end justify-center">
                    <img
                      src={ttdCecepDayat}
                      alt="Tanda Tangan Cecep Dayat"
                      className="absolute bottom-[-2px] h-9 max-w-[120px] w-auto object-contain pointer-events-none select-none z-10"
                    />
                    <div className="w-28 border-b border-slate-400"></div>
                  </div>
                  <div className="text-[9.5px] text-slate-700 mt-1 font-mono font-medium whitespace-nowrap">
                    ( Cecep Dayat )
                  </div>
                </div>

                {/* Kolom 3: Perwakilan Buyer / Brand */}
                <div>
                  <div className="text-[9.5px] text-slate-500 mb-0.5">Diterima &amp; Diverifikasi:</div>
                  <div className="text-[11px] font-bold text-slate-900 whitespace-nowrap">Perwakilan Buyer / Brand</div>
                  <div className="relative h-11 flex items-end justify-center">
                    <div className="w-28 border-b border-slate-400"></div>
                  </div>
                  <div className="text-[9.5px] text-slate-700 mt-1 font-mono font-medium whitespace-nowrap">
                    ( {brandName} )
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
