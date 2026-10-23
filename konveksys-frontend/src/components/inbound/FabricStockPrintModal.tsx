import React, { useRef, useMemo, useState, useEffect } from 'react';
import { Download, Printer, X, Layers, Building2, Truck, FileText } from 'lucide-react';
import { InboundRoll } from '../../types';
import { useApp } from '../../context/AppContext';
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
  const { vendors } = useApp();

  // Mode Dokumen: Surat Jalan Vendor vs Laporan Stok Buyer
  const [docMode, setDocMode] = useState<'VENDOR_SURAT_JALAN' | 'BUYER_REPORT'>('VENDOR_SURAT_JALAN');
  const [selectedVendor, setSelectedVendor] = useState<string>('');
  const [customVendorName, setCustomVendorName] = useState<string>('');
  const [driverName, setDriverName] = useState<string>('Rizki Maulana');
  const [kendaraan, setKendaraan] = useState<string>('');

  // Default vendor pertama jika belum dipilih
  useEffect(() => {
    if (!selectedVendor && vendors && vendors.length > 0) {
      setSelectedVendor(vendors[0].name);
    }
  }, [vendors, selectedVendor]);

  const effectiveVendor =
    selectedVendor === '__CUSTOM__'
      ? customVendorName.trim() || 'Vendor Penjahit'
      : selectedVendor || (vendors && vendors.length > 0 ? vendors[0].name : 'Vendor Penjahit');

  const activeVendorObj = vendors
    ? vendors.find((v) => v.name.trim().toLowerCase() === effectiveVendor.trim().toLowerCase())
    : undefined;

  // Sorting: Urutkan berdasarkan Brand, lalu Warna / Jenis Kain (jenisKain), lalu Kode Rol Kain (rollCode natural)
  const sortedRolls = useMemo(() => {
    return [...selectedRolls].sort((a, b) => {
      // 1. Urutkan berdasarkan Brand jika multi-brand
      const brandA = (a.brand || '').trim();
      const brandB = (b.brand || '').trim();
      const brandComp = brandA.localeCompare(brandB, 'id', { sensitivity: 'base' });
      if (brandComp !== 0 && (!brandFilter || brandFilter === 'ALL')) {
        return brandComp;
      }

      // 2. Urutkan berdasarkan Warna & Nama Kain (jenisKain)
      const kainA = (a.jenisKain || '').trim();
      const kainB = (b.jenisKain || '').trim();
      const kainComp = kainA.localeCompare(kainB, 'id', { sensitivity: 'base' });
      if (kainComp !== 0) return kainComp;

      // 3. Urutkan berdasarkan Kode Rol (natural numeric, e.g. ROL-CRE-050 < ROL-CRE-077)
      const rollA = (a.rollCode || '').trim();
      const rollB = (b.rollCode || '').trim();
      return rollA.localeCompare(rollB, 'id', { numeric: true, sensitivity: 'base' });
    });
  }, [selectedRolls, brandFilter]);

  if (!isOpen) return null;

  // Kalkulasi agregat
  const totalRol = sortedRolls.length;
  const totalPanjang = sortedRolls.reduce((sum, r) => sum + (Number(r.meterLength) || 0), 0);

  // Daftar Brand unik
  const uniqueBrands = Array.from(new Set(sortedRolls.map((r) => r.brand).filter(Boolean)));
  const brandName =
    uniqueBrands.length === 1
      ? uniqueBrands[0]
      : brandFilter && brandFilter !== 'ALL'
      ? brandFilter
      : 'MULTI-BRAND BUYER';

  // Dokumen Meta
  const today = new Date();
  const dateStr = today.toISOString().split('T')[0].replace(/-/g, '');
  const docNumber =
    docMode === 'VENDOR_SURAT_JALAN'
      ? `SJ-KAIN-${dateStr}-${String(totalRol).padStart(3, '0')}`
      : `STK-BUYER-${dateStr}-${String(totalRol).padStart(3, '0')}`;

  const handlePrint = () => {
    if (!paperRef.current) return;
    const prefix = docMode === 'VENDOR_SURAT_JALAN' ? 'Surat_Jalan_Kain' : 'Rincian_Stok_Kain';
    const targetName =
      docMode === 'VENDOR_SURAT_JALAN'
        ? effectiveVendor.replace(/\s+/g, '_')
        : brandName.replace(/\s+/g, '_');
    const title = `${prefix}_${targetName}_${dateStr}`;
    printIsolatedDocument(paperRef.current, title);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-hidden animate-in fade-in duration-200">
      <div className="bg-slate-100 rounded-2xl max-w-5xl w-full max-h-[94vh] flex flex-col shadow-2xl border border-slate-300 overflow-hidden">
        {/* Top Control Bar */}
        <div className="bg-white px-5 py-3 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0 z-30 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-700 shrink-0">
              {docMode === 'VENDOR_SURAT_JALAN' ? <Truck className="w-5 h-5" /> : <Layers className="w-5 h-5" />}
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900 flex items-center gap-2 flex-wrap">
                <span>
                  {docMode === 'VENDOR_SURAT_JALAN'
                    ? 'Surat Jalan Pengiriman Kain ke Vendor'
                    : 'Laporan Rincian Ketersediaan Stok Kain (Buyer)'}
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 tabular-nums">
                  {totalRol} Rol Dipilih
                </span>
              </div>
              <div className="text-[11px] text-slate-500">
                Brand: <strong className="text-slate-700">{brandName}</strong> • Total Panjang:{' '}
                <strong className="text-slate-900 font-bold tabular-nums">{totalPanjang.toLocaleString('id-ID')} m</strong>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            {/* Mode Switcher Pill */}
            <div className="bg-slate-100 p-0.5 rounded-xl border border-slate-200 flex items-center">
              <button
                type="button"
                onClick={() => setDocMode('VENDOR_SURAT_JALAN')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  docMode === 'VENDOR_SURAT_JALAN'
                    ? 'bg-white text-indigo-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Truck className="w-3.5 h-3.5" />
                <span>Surat Jalan Vendor</span>
              </button>
              <button
                type="button"
                onClick={() => setDocMode('BUYER_REPORT')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  docMode === 'BUYER_REPORT'
                    ? 'bg-white text-indigo-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Rincian Stok Buyer</span>
              </button>
            </div>

            <div className="flex items-center gap-1.5 ml-auto sm:ml-0">
              <button
                onClick={handlePrint}
                className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-200 flex items-center gap-1.5 transition btn-press cursor-pointer whitespace-nowrap"
                title="Cetak atau Simpan PDF"
              >
                <Download className="w-4 h-4" />
                <span>Download PDF</span>
              </button>
              <button
                onClick={handlePrint}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition btn-press hidden sm:flex cursor-pointer whitespace-nowrap"
                title="Cetak langsung"
              >
                <Printer className="w-4 h-4" />
                <span>Cetak</span>
              </button>
              <button
                onClick={onClose}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                title="Tutup Preview"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Vendor & Delivery Controls (Hanya muncul saat mode Surat Jalan Vendor) */}
        {docMode === 'VENDOR_SURAT_JALAN' && (
          <div className="bg-indigo-50/70 border-b border-indigo-100 px-5 py-2.5 flex flex-wrap items-center gap-3 text-xs shrink-0">
            <div className="flex items-center gap-2">
              <span className="font-bold text-indigo-900 text-[11px] flex items-center gap-1">
                <Truck className="w-3.5 h-3.5 text-indigo-600" />
                Pilih Vendor Tujuan:
              </span>
              <select
                value={selectedVendor}
                onChange={(e) => {
                  setSelectedVendor(e.target.value);
                  if (e.target.value !== '__CUSTOM__') {
                    setCustomVendorName('');
                  }
                }}
                className="bg-white border border-indigo-200 text-slate-800 text-xs rounded-lg px-2.5 py-1 font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none cursor-pointer"
              >
                <option value="" disabled>-- Pilih Vendor Penjahit --</option>
                {vendors &&
                  vendors.map((v) => (
                    <option key={v.id} value={v.name}>
                      {v.name}
                    </option>
                  ))}
                <option value="__CUSTOM__">+ Ketik Nama Vendor Lainnya...</option>
              </select>

              {selectedVendor === '__CUSTOM__' && (
                <input
                  type="text"
                  placeholder="Ketik Nama Vendor..."
                  value={customVendorName}
                  onChange={(e) => setCustomVendorName(e.target.value)}
                  className="bg-white border border-indigo-300 text-slate-800 text-xs rounded-lg px-2 py-1 font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none w-44"
                />
              )}
            </div>

            <div className="h-4 w-px bg-indigo-200 hidden sm:block" />

            <div className="flex items-center gap-2">
              <span className="font-medium text-indigo-900 text-[11px]">Pengantar / Driver:</span>
              <input
                type="text"
                placeholder="Nama Supir / Kurir"
                value={driverName}
                onChange={(e) => setDriverName(e.target.value)}
                className="bg-white border border-indigo-200 text-slate-800 text-xs rounded-lg px-2 py-1 focus:ring-2 focus:ring-indigo-500 focus:outline-none w-36"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="font-medium text-indigo-900 text-[11px]">No. Polisi:</span>
              <input
                type="text"
                placeholder="Plat No (opsional)"
                value={kendaraan}
                onChange={(e) => setKendaraan(e.target.value)}
                className="bg-white border border-indigo-200 text-slate-800 text-xs rounded-lg px-2 py-1 focus:ring-2 focus:ring-indigo-500 focus:outline-none w-28 uppercase"
              />
            </div>
          </div>
        )}

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
                  {docMode === 'VENDOR_SURAT_JALAN' ? 'SURAT JALAN PENGIRIMAN KAIN' : 'SURAT RINCIAN STOK KAIN'}
                </span>
                <div className="text-xs font-bold text-indigo-700 mt-1.5 tracking-wider tabular-nums">{docNumber}</div>
                <div className="text-[10px] text-slate-500 mt-0.5">
                  Tanggal: {formatDateIndo(today.toISOString())}
                </div>
              </div>
            </div>

            {/* Buyer & Target Brand Header OR Vendor Delivery Header */}
            {docMode === 'VENDOR_SURAT_JALAN' ? (
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                    Ditujukan Kepada (Vendor / Penjahit):
                  </span>
                  <span className="text-sm font-bold text-slate-900 flex items-center gap-1.5 mt-0.5">
                    <Truck className="w-4 h-4 text-indigo-600 shrink-0" />
                    {effectiveVendor}
                  </span>
                  {activeVendorObj?.contact && (
                    <span className="text-[10px] text-slate-500 block mt-0.5">
                      Kontak: {activeVendorObj.contact}
                    </span>
                  )}
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                    Brand / Pemilik Bahan:
                  </span>
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5 mt-0.5">
                    <Building2 className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                    {brandName}
                  </span>
                  <span className="text-[10px] text-slate-500 block mt-0.5">
                    Pengantar: <b>{driverName || 'Logistik Internal'}</b> {kendaraan ? `(${kendaraan})` : ''}
                  </span>
                </div>

                <div className="text-left sm:text-right">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                    Peruntukan Dokumen:
                  </span>
                  <span className="text-xs font-semibold text-slate-700 block mt-0.5">
                    Surat Jalan Pengiriman Bahan Baku
                  </span>
                  <span className="text-[9.5px] text-slate-500 block mt-0.5">
                    Alokasi Bahan Siap Potong &amp; Jahit
                  </span>
                </div>
              </div>
            ) : (
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
                    Laporan Ketersediaan Stok Bahan Baku
                  </span>
                </div>
              </div>
            )}

            {/* 2 Summary Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  {docMode === 'VENDOR_SURAT_JALAN' ? 'Total Rol Dikirim' : 'Total Rol Terpilih'}
                </span>
                <span className="text-xl font-bold text-slate-900 mt-0.5 block tabular-nums">{totalRol} Rol</span>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  {docMode === 'VENDOR_SURAT_JALAN' ? 'Total Panjang Bahan Dikirim' : 'Total Panjang Kain'}
                </span>
                <span className="text-xl font-bold text-slate-800 mt-0.5 block tabular-nums">
                  {totalPanjang.toLocaleString('id-ID')} m
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
                    <th className="p-2.5 text-right w-28 whitespace-nowrap border-r border-slate-200">Panjang Kain</th>
                    <th className="p-2.5 min-w-[130px]">Keterangan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {sortedRolls.map((roll, idx) => {
                    const panjang = Number(roll.meterLength) || 0;
                    return (
                      <tr key={roll.id} className="hover:bg-slate-50">
                        <td className="p-2.5 text-center text-slate-400 font-semibold border-r border-slate-200 tabular-nums">
                          {idx + 1}
                        </td>
                        <td className="p-2.5 text-slate-600 whitespace-nowrap border-r border-slate-200 font-medium">
                          {formatDateIndo(roll.tanggalMasuk)}
                        </td>
                        <td className="p-2.5 font-bold text-indigo-700 whitespace-nowrap border-r border-slate-200 tracking-tight tabular-nums">
                          {roll.rollCode}
                        </td>
                        <td className="p-2.5 font-semibold text-slate-800 whitespace-nowrap border-r border-slate-200">
                          {roll.brand}
                        </td>
                        <td className="p-2.5 font-medium text-slate-900 border-r border-slate-200">
                          {roll.jenisKain}
                        </td>
                        <td className="p-2.5 text-right text-slate-800 font-bold tabular-nums border-r border-slate-200 whitespace-nowrap">
                          {panjang.toLocaleString('id-ID')} m
                        </td>
                        <td className="p-2.5 text-slate-600 text-[10.5px]">
                          {roll.keterangan ? (
                            <span className="font-medium text-slate-800">{roll.keterangan}</span>
                          ) : (
                            <span className="text-slate-400 italic text-[10px]">-</span>
                          )}
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
                    <td className="p-2.5 text-right font-bold text-slate-900 tabular-nums border-r border-slate-200 whitespace-nowrap">
                      {totalPanjang.toLocaleString('id-ID')} m
                    </td>
                    <td className="p-2.5 text-center text-slate-400 text-[10px]">-</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Catatan & Ketentuan */}
            {docMode === 'VENDOR_SURAT_JALAN' ? (
              <div className="bg-slate-50/80 rounded-xl p-3 border border-slate-200 text-[9.5px] text-slate-600 space-y-1">
                <span className="font-bold text-slate-800 block">Ketentuan &amp; Tanggung Jawab Pengiriman Bahan:</span>
                <p>
                  1. Fisik rol kain yang tercantum di atas telah dihitung bersama dalam kondisi terbungkus rapi, bersih, dan sesuai ukuran meter.
                </p>
                <p>
                  2. Pihak vendor/workshop penjahit bertanggung jawab penuh menjaga keutuhan serta kebersihan bahan baku titipan sejak surat jalan ini ditandatangani.
                </p>
                <p>
                  3. Bahan baku hanya boleh dialokasikan dan dipotong sesuai arahan Surat Perintah Kerja (SPK) resmi Maison Rayyan Manufacturing.
                </p>
              </div>
            ) : (
              <div className="bg-slate-50/80 rounded-xl p-3 border border-slate-200 text-[9.5px] text-slate-600 space-y-1">
                <span className="font-bold text-slate-800 block">Pernyataan &amp; Catatan Gudang Bahan Baku:</span>
                <p>
                  1. Data fisik rol kain di atas telah diverifikasi keberadaannya di rak penyimpanan gudang logistik
                  Maison Rayyan dalam kondisi terbungkus rapi dan terlindungi.
                </p>
                <p>
                  2. Laporan ini merupakan dokumen mutasi dan saldo aset bahan baku resmi antara pihak konveksi dan
                  perwakilan buyer/brand mitra.
                </p>
              </div>
            )}

            {/* Formal Signature Blocks */}
            <div className="pt-3 border-t border-slate-200 signature-block" style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}>
              {docMode === 'VENDOR_SURAT_JALAN' ? (
                <div className="grid grid-cols-3 gap-4 text-center">
                  {/* Kolom 1: Diserahkan Oleh (Gudang Logistik) */}
                  <div>
                    <div className="text-[9.5px] text-slate-500 mb-0.5">Diserahkan Oleh:</div>
                    <div className="text-[11px] font-bold text-slate-900 whitespace-nowrap">Admin Gudang / Logistik</div>
                    <div className="relative h-11 flex items-end justify-center">
                      <img
                        src={ttdRizkiMaulana}
                        alt="Tanda Tangan Rizki Maulana"
                        className="absolute bottom-[-2px] h-9 max-w-[120px] w-auto object-contain pointer-events-none select-none z-10"
                      />
                      <div className="w-28 border-b border-slate-400"></div>
                    </div>
                    <div className="text-[9.5px] text-slate-700 mt-1 font-medium whitespace-nowrap">
                      ( Rizki Maulana )
                    </div>
                  </div>

                  {/* Kolom 2: Dibawa / Dikirim Oleh (Supir / Kurir) */}
                  <div>
                    <div className="text-[9.5px] text-slate-500 mb-0.5">Dibawa / Dikirim Oleh:</div>
                    <div className="text-[11px] font-bold text-slate-900 whitespace-nowrap">Driver / Ekspedisi</div>
                    <div className="relative h-11 flex items-end justify-center">
                      <div className="w-28 border-b border-slate-400"></div>
                    </div>
                    <div className="text-[9.5px] text-slate-700 mt-1 font-medium whitespace-nowrap">
                      ( {driverName || 'Driver / Kurir'} )
                    </div>
                  </div>

                  {/* Kolom 3: Diterima Oleh (Vendor) */}
                  <div>
                    <div className="text-[9.5px] text-slate-500 mb-0.5">Diterima &amp; Diperiksa:</div>
                    <div className="text-[11px] font-bold text-slate-900 whitespace-nowrap">Pihak Vendor / Penjahit</div>
                    <div className="relative h-11 flex items-end justify-center">
                      <div className="w-28 border-b border-slate-400"></div>
                    </div>
                    <div className="text-[9.5px] text-slate-700 mt-1 font-medium whitespace-nowrap truncate max-w-[180px] mx-auto">
                      ( {effectiveVendor} )
                    </div>
                  </div>
                </div>
              ) : (
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
                    <div className="text-[9.5px] text-slate-700 mt-1 font-medium whitespace-nowrap">
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
                    <div className="text-[9.5px] text-slate-700 mt-1 font-medium whitespace-nowrap">
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
                    <div className="text-[9.5px] text-slate-700 mt-1 font-medium whitespace-nowrap">
                      ( {brandName} )
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

