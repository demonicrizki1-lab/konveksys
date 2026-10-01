import React, { useRef, useState } from 'react';
import { Download, Printer, X, Scissors, Building2, PackageCheck, Layers, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { VendorFabricDeposit } from '../../types';
import { printIsolatedDocument } from '../../utils/printHelper';
import { formatDateIndo } from '../../utils/formatters';
import ttdRizkiMaulana from '../../assets/ttd-rizki-maulana.png';
import ttdCecepDayat from '../../assets/ttd-cecep-dayat.png';

interface BatchFabricDepositPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  deposits: VendorFabricDeposit[];
  allDeposits?: VendorFabricDeposit[];
  selectedVendorFilter?: string;
}

export const BatchFabricDepositPrintModal: React.FC<BatchFabricDepositPrintModalProps> = ({
  isOpen,
  onClose,
  deposits,
  allDeposits,
  selectedVendorFilter = 'ALL',
}) => {
  const paperRef = useRef<HTMLDivElement>(null);
  const [printOrientation, setPrintOrientation] = useState<'landscape' | 'portrait'>('landscape');
  const [dataScope, setDataScope] = useState<'FILTERED' | 'ALL'>('ALL');

  if (!isOpen) return null;

  // Tentukan dataset yang akan dicetak: Seluruhnya atau sesuai filter
  const targetDeposits = dataScope === 'ALL' && allDeposits && allDeposits.length > 0 ? allDeposits : deposits;

  // Agregasi Data
  const totalItem = targetDeposits.length;
  const totalSisaMeter = targetDeposits
    .filter((d) => d.satuan === 'METER')
    .reduce((sum, d) => sum + (Number(d.panjangSisa) || 0), 0);
  const totalSisaYard = targetDeposits
    .filter((d) => d.satuan === 'YARD')
    .reduce((sum, d) => sum + (Number(d.panjangSisa) || 0), 0);

  const totalAwalMeter = targetDeposits
    .filter((d) => d.satuan === 'METER')
    .reduce((sum, d) => sum + (Number(d.panjangAwal) || 0), 0);

  const uniqueVendors = Array.from(new Set(targetDeposits.map((d) => d.targetVendor).filter(Boolean)));
  const uniqueBrands = Array.from(new Set(targetDeposits.map((d) => d.brand).filter(Boolean)));
  const totalTersedia = targetDeposits.filter((d) => d.status === 'TERSEDIA').length;
  const totalTerpakai = targetDeposits.filter((d) => d.status === 'TERPAKAI').length;

  // Metadata Dokumen
  const today = new Date();
  const pad = (n: number) => n.toString().padStart(2, '0');
  const dateCode = `${today.getFullYear()}${pad(today.getMonth() + 1)}${pad(today.getDate())}`;
  const docNumber = `RPT-SKN-${dateCode}-${pad(today.getHours())}${pad(today.getMinutes())}`;

  const vendorLabel =
    dataScope === 'ALL' || selectedVendorFilter === 'ALL'
      ? 'Semua Mitra Konveksi (Konsolidasi)'
      : selectedVendorFilter;

  const handlePrint = () => {
    if (!paperRef.current) return;
    const cleanVendor = vendorLabel.replace(/[^a-zA-Z0-9]/g, '_');
    const title = `Laporan_Rekap_Sisa_Kain_${cleanVendor}_${dateCode}`;
    printIsolatedDocument(paperRef.current, title, { orientation: printOrientation });
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-hidden animate-in fade-in duration-200">
      <div className="bg-slate-100 rounded-2xl max-w-6xl w-full max-h-[96vh] flex flex-col shadow-2xl border border-slate-300 overflow-hidden">
        
        {/* Top Control Bar */}
        <div className="bg-white px-5 py-3.5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0 z-30 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-violet-50 border border-violet-200 flex items-center justify-center text-violet-700">
              <Scissors className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900 flex items-center gap-2">
                <span>Laporan Rekapitulasi Sisa Kain di Konveksi</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-violet-50 text-violet-700 border border-violet-200">
                  {totalItem} Stok Terdata
                </span>
              </div>
              <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                Total Sisa Kain:{' '}
                <strong className="text-emerald-700 font-bold">
                  {totalSisaMeter > 0 ? `${totalSisaMeter.toLocaleString('id-ID')} m` : ''}
                  {totalSisaMeter > 0 && totalSisaYard > 0 ? ' + ' : ''}
                  {totalSisaYard > 0 ? `${totalSisaYard.toLocaleString('id-ID')} yd` : ''}
                </strong>{' '}
                • {uniqueVendors.length} Konveksi • {uniqueBrands.length} Brand
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Scope Switcher (Jika ada filter aktif) */}
            {allDeposits && allDeposits.length !== deposits.length && (
              <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs mr-2">
                <button
                  type="button"
                  onClick={() => setDataScope('ALL')}
                  className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition cursor-pointer ${
                    dataScope === 'ALL'
                      ? 'bg-violet-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Semua Sisa Kain ({allDeposits.length})
                </button>
                <button
                  type="button"
                  onClick={() => setDataScope('FILTERED')}
                  className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition cursor-pointer ${
                    dataScope === 'FILTERED'
                      ? 'bg-violet-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Hasil Filter ({deposits.length})
                </button>
              </div>
            )}

            {/* Orientation Toggle */}
            <div className="flex items-center bg-slate-100 rounded-xl p-0.5 border border-slate-200 text-[11px] font-bold">
              <button
                type="button"
                onClick={() => setPrintOrientation('landscape')}
                className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                  printOrientation === 'landscape'
                    ? 'bg-white text-violet-700 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Format Melebar (Direkomendasikan untuk tabel banyak kolom)"
              >
                📄 Landscape
              </button>
              <button
                type="button"
                onClick={() => setPrintOrientation('portrait')}
                className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                  printOrientation === 'portrait'
                    ? 'bg-white text-violet-700 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Format Tegak"
              >
                📄 Portrait
              </button>
            </div>

            {/* Cetak / Download Action */}
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-bold shadow-md shadow-violet-200 flex items-center gap-1.5 transition btn-press cursor-pointer"
              title="Download PDF atau Cetak Laporan"
            >
              <Download className="w-4 h-4" />
              <span>Download / Simpan PDF</span>
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
            id="batch-fabric-paper"
            className={`print-wrapper bg-white rounded-xl shadow-lg border border-slate-300 p-5 sm:p-7 text-slate-900 w-full my-auto text-xs space-y-3.5 transition-all ${
              printOrientation === 'landscape' ? 'max-w-5xl' : 'max-w-3xl'
            }`}
          >
            {/* Header Kop Perusahaan */}
            <div className="flex justify-between items-start border-b-2 border-slate-900 pb-2.5 gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <img
                  src="/logo-maison-rayyan.png"
                  alt="Maison Rayyan Manufacturing"
                  className="h-14 w-auto max-w-[130px] object-contain shrink-0"
                />
                <div className="min-w-0">
                  <h2 className="text-base sm:text-lg font-bold tracking-tight text-slate-900 leading-tight">
                    MAISON RAYYAN MANUFACTURING
                  </h2>
                  <p className="text-[10px] text-slate-600 mt-0.5 leading-tight font-medium">
                    Divisi Pengawasan Logistik, Pemotongan & Pengelolaan Saldo Kain Konveksi
                  </p>
                  <p className="text-[9px] text-slate-400 leading-tight">
                    Komp. Industri Tekstil & Konveksi Terpadu • Kontak Logistik: 0819-0011-2233
                  </p>
                </div>
              </div>
              <div className="text-right shrink-0">
                <span className="bg-slate-900 text-white text-[9.5px] font-bold px-2.5 py-0.5 rounded uppercase tracking-wider inline-block">
                  REKAPITULASI SISA KAIN KONVEKSI
                </span>
                <div className="text-[9.5px] font-mono text-slate-500 mt-0.5">No: {docNumber}</div>
                <div className="text-xs font-bold text-violet-800 mt-0.5">
                  Mitra: {vendorLabel}
                </div>
                <div className="text-[9px] text-slate-500">
                  Tanggal Cetak: {formatDateIndo(new Date().toISOString())}
                </div>
              </div>
            </div>

            {/* Executive KPI Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-center text-xs">
              <div className="border-r border-slate-200 pr-2">
                <span className="text-[9px] uppercase font-bold text-slate-400 block whitespace-nowrap">
                  Sisa Kain Siap Pakai:
                </span>
                <strong className="text-emerald-700 text-sm font-bold block mt-0.5 font-mono">
                  {totalSisaMeter.toLocaleString('id-ID')} m
                  {totalSisaYard > 0 && ` + ${totalSisaYard.toLocaleString('id-ID')} yd`}
                </strong>
                <span className="text-[8.5px] text-slate-500 font-medium">Stok Siap Pakai</span>
              </div>

              <div className="border-r border-slate-200 pr-2">
                <span className="text-[9px] uppercase font-bold text-slate-400 block whitespace-nowrap">
                  Mitra Penyimpan:
                </span>
                <strong className="text-slate-900 text-xs font-bold block mt-0.5">
                  {uniqueVendors.length} Konveksi
                </strong>
                <span className="text-[8.5px] text-slate-500">{uniqueVendors.slice(0, 2).join(', ')}{uniqueVendors.length > 2 ? '...' : ''}</span>
              </div>

              <div className="border-r border-slate-200 pr-2">
                <span className="text-[9px] uppercase font-bold text-slate-400 block whitespace-nowrap">
                  Status Ketersediaan:
                </span>
                <strong className="text-violet-700 text-xs font-bold block mt-0.5 font-mono">
                  {totalTersedia} Siap Pakai
                </strong>
                <span className="text-[8.5px] text-slate-500">{totalTerpakai} Terpakai di PO</span>
              </div>

              <div>
                <span className="text-[9px] uppercase font-bold text-slate-400 block whitespace-nowrap">
                  Brand Terkait:
                </span>
                <strong className="text-indigo-700 text-xs font-bold block mt-0.5">
                  {uniqueBrands.length} Brand
                </strong>
                <span className="text-[8.5px] text-slate-500 truncate block">
                  {uniqueBrands.join(', ')}
                </span>
              </div>
            </div>

            {/* Tabel Rincian Sisa Kain */}
            <div className="space-y-1">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-700 flex justify-between items-center">
                <span>Rincian Fisik Sisa Kain per Konveksi</span>
                <span className="text-slate-400 font-normal">Total {targetDeposits.length} Item Bahan</span>
              </div>

              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-left text-xs border-collapse table-fixed">
                  <colgroup>
                    <col style={{ width: '4%' }} />
                    <col style={{ width: '18%' }} />
                    <col style={{ width: '18%' }} />
                    <col style={{ width: '13%' }} />
                    <col style={{ width: '22%' }} />
                    <col style={{ width: '12%' }} />
                    <col style={{ width: '13%' }} />
                  </colgroup>
                  <thead className="bg-slate-100 text-slate-700 font-bold text-[8.5px] uppercase border-b border-slate-300">
                    <tr>
                      <th className="p-1.5 text-center">No</th>
                      <th className="p-1.5">Konveksi Penyimpan</th>
                      <th className="p-1.5">Asal Penjahit & PO</th>
                      <th className="p-1.5">Brand</th>
                      <th className="p-1.5">Jenis Kain & Warna</th>
                      <th className="p-1.5 text-center">Sisa Kain</th>
                      <th className="p-1.5 text-center">Status Kain</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-[9px]">
                    {targetDeposits.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-6 text-center text-slate-400 text-xs">
                          Tidak ada data sisa kain yang cocok untuk dicetak.
                        </td>
                      </tr>
                    ) : (
                      targetDeposits.map((dep, idx) => {
                        const isSame =
                          dep.targetVendor.trim().toLowerCase() === dep.sourceVendor.trim().toLowerCase();
                        return (
                          <tr key={dep.id || idx} className="hover:bg-slate-50">
                            {/* No */}
                            <td className="p-1.5 text-center font-mono text-slate-500 font-bold">
                              {idx + 1}
                            </td>

                            {/* Konveksi Penyimpan */}
                            <td className="p-1.5">
                              <div className="font-bold text-slate-900 truncate">
                                {dep.targetVendor}
                              </div>
                              {isSame ? (
                                <span className="text-[8px] font-semibold text-emerald-700 bg-emerald-50 px-1 py-0.2 rounded border border-emerald-200 inline-block mt-0.5">
                                  Standby Asal
                                </span>
                              ) : (
                                <span className="text-[8px] text-slate-400 block mt-0.5">Oper Transfer</span>
                              )}
                            </td>

                            {/* Asal Penjahit & PO */}
                            <td className="p-1.5">
                              <div className="font-medium text-slate-800 truncate">{dep.sourceVendor}</div>
                              <div className="font-mono text-[8.5px] font-bold text-indigo-700 truncate mt-0.5">
                                {dep.sourcePONumber}
                              </div>
                            </td>

                            {/* Brand */}
                            <td className="p-1.5 font-bold uppercase text-slate-800 truncate">
                              {dep.brand}
                            </td>

                            {/* Jenis Kain & Warna */}
                            <td className="p-1.5">
                              <div className="font-bold text-slate-900 leading-tight truncate">
                                {dep.jenisKain}
                              </div>
                              <div className="text-[8px] text-slate-500 mt-0.5 truncate">
                                Warna: <strong className="text-slate-700">{dep.warna || '-'}</strong>
                              </div>
                            </td>

                            {/* Sisa Kain */}
                            <td className="p-1.5 text-center whitespace-nowrap">
                              <span className="font-mono font-bold text-emerald-800 text-[10px]">
                                {dep.panjangSisa.toLocaleString('id-ID')} {dep.satuan === 'METER' ? 'm' : 'yd'}
                              </span>
                            </td>

                            {/* Status Kain */}
                            <td className="p-1.5 text-center">
                              {dep.status === 'TERSEDIA' && (
                                <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 inline-block whitespace-nowrap">
                                  Tersedia di Konveksi
                                </span>
                              )}
                              {dep.status === 'TERPAKAI' && (
                                <div className="space-y-0.2">
                                  <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-blue-50 text-blue-800 border border-blue-200 inline-block whitespace-nowrap">
                                    Terpakai di PO
                                  </span>
                                  {dep.allocatedPONumber && (
                                    <div className="font-mono text-[7.5px] text-indigo-700 truncate font-bold">
                                      {dep.allocatedPONumber}
                                    </div>
                                  )}
                                </div>
                              )}
                              {dep.status === 'DITARIK' && (
                                <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-slate-100 text-slate-600 border border-slate-200 inline-block whitespace-nowrap">
                                  Ditarik ke Gudang
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                  {targetDeposits.length > 0 && (
                    <tfoot className="bg-slate-100 font-bold text-slate-900 border-t-2 border-slate-300 text-[9.5px]">
                      <tr>
                        <td colSpan={5} className="p-2 text-right uppercase tracking-wider font-extrabold">
                          Total Akumulasi Sisa Kain:
                        </td>
                        <td className="p-2 text-center font-mono font-black text-emerald-800 text-xs">
                          {totalSisaMeter.toLocaleString('id-ID')} m
                          {totalSisaYard > 0 && ` + ${totalSisaYard.toLocaleString('id-ID')} yd`}
                        </td>
                        <td className="p-2 text-center text-slate-500 font-normal text-[8px]">
                          {targetDeposits.length} Baris Terukur
                        </td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </div>

            {/* Ketentuan Kebijakan Pengelolaan Sisa Kain */}
            <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-[9px] text-slate-600 space-y-0.5 leading-relaxed">
              <strong className="text-slate-800 font-bold block text-[9.5px] uppercase">
                Ketentuan & Tata Kelola Saldo Sisa Kain Konveksi:
              </strong>
              <p>
                1. Seluruh saldo sisa potongan kain yang terdata di atas adalah aset resmi milik buyer/pabrik yang disimpan dalam pengawasan mitra konveksi.
              </p>
              <p>
                2. Sisa kain standby siap dialokasikan untuk pemotongan SPK / PO produksi berikutnya tanpa perlu pengiriman kain baru dari gudang pusat.
              </p>
              <p>
                3. Pemindahan sisa bahan antar-konveksi wajib disertai Surat Jalan Transfer resmi yang diterbitkan oleh Tim Logistik Maison Rayyan.
              </p>
            </div>

            {/* Kolom Tanda Tangan Resmi (3 Pihak) */}
            <div className="pt-2 border-t border-slate-200 grid grid-cols-3 gap-4 text-center">
              {/* Kolom 1: Logistik & Kain */}
              <div>
                <div className="text-[8.5px] text-slate-500 mb-0.5">Disiapkan & Diukur Oleh:</div>
                <div className="text-[9.5px] font-bold text-slate-900">Petugas Logistik & Kain</div>
                <div className="relative h-12 flex items-end justify-center">
                  <img
                    src={ttdRizkiMaulana}
                    alt="Tanda Tangan Rizki Maulana"
                    className="absolute bottom-[-1px] h-9 max-w-[120px] w-auto object-contain pointer-events-none select-none z-10"
                  />
                  <div className="w-28 border-b border-slate-400"></div>
                </div>
                <div className="text-[8.5px] text-slate-800 mt-1 font-mono font-bold">
                  ( Rizki Maulana )
                </div>
              </div>

              {/* Kolom 2: Supervisor Produksi & QC */}
              <div>
                <div className="text-[8.5px] text-slate-500 mb-0.5">Diverifikasi Oleh:</div>
                <div className="text-[9.5px] font-bold text-slate-900">SPV Produksi & QC</div>
                <div className="relative h-12 flex items-end justify-center">
                  <img
                    src={ttdCecepDayat}
                    alt="Tanda Tangan Cecep Dayat"
                    className="absolute bottom-[-1px] h-9 max-w-[120px] w-auto object-contain pointer-events-none select-none z-10"
                  />
                  <div className="w-28 border-b border-slate-400"></div>
                </div>
                <div className="text-[8.5px] text-slate-800 mt-1 font-mono font-bold">
                  ( Cecep Dayat )
                </div>
              </div>

              {/* Kolom 3: Manajemen / Owner */}
              <div>
                <div className="text-[8.5px] text-slate-500 mb-0.5">Mengetahui & Menyetujui:</div>
                <div className="text-[9.5px] font-bold text-slate-900">Direktur / Owner</div>
                <div className="h-12 flex items-end justify-center">
                  <div className="w-28 border-b border-slate-400"></div>
                </div>
                <div className="text-[8.5px] text-slate-600 mt-1 font-mono">
                  ( Direktur Operasional )
                </div>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};
