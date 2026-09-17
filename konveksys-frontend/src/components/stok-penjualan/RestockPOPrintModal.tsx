import React, { useState, useRef, useMemo } from 'react';
import { Download, Printer, X, FileText, Building2, Calendar, Clock, Trash2, Plus, AlertCircle } from 'lucide-react';
import { BrandProductSKU } from '../../types';
import { printIsolatedDocument } from '../../utils/printHelper';
import { formatDateIndo } from '../../utils/formatters';

export interface POItemDraft {
  sku: BrandProductSKU;
  currentStock: number;
  targetQty: number;
  kainNotes: string;
}

interface RestockPOPrintModalProps {
  selectedItems: {
    sku: BrandProductSKU;
    currentStock: number;
  }[];
  activeBrand: string;
  brandList?: { id: string; name: string }[];
  onClose: () => void;
}

export const RestockPOPrintModal: React.FC<RestockPOPrintModalProps> = ({
  selectedItems,
  activeBrand,
  brandList = [],
  onClose,
}) => {
  const paperRef = useRef<HTMLDivElement>(null);

  // Default values
  const today = new Date().toISOString().split('T')[0];
  const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const defaultPONumber = useMemo(() => {
    const brandCode = activeBrand !== 'ALL' ? activeBrand.slice(0, 3).toUpperCase() : 'MR';
    const dateNum = today.replace(/-/g, '').slice(2);
    const rand = Math.floor(100 + Math.random() * 900);
    return `PO-${brandCode}-${dateNum}-${rand}`;
  }, [activeBrand, today]);

  // Form State
  const [noPO, setNoPO] = useState(defaultPONumber);
  const [tanggalPO, setTanggalPO] = useState(today);
  const [targetDeadline, setTargetDeadline] = useState(nextWeek);
  const [vendorTujuan, setVendorTujuan] = useState('Divisi Cutting & Jahit Internal (Maison Rayyan)');
  const [brandTarget, setBrandTarget] = useState(activeBrand !== 'ALL' ? activeBrand : 'SEMUA BRAND');
  const [catatanPO, setCatatanPO] = useState(
    'Prioritas potong dan jahit segera untuk restock etalase marketplace. Standar kerapian dan QC makloon berlaku.'
  );

  // Items State (editable per item)
  const [poItems, setPoItems] = useState<POItemDraft[]>(() =>
    selectedItems.map(item => ({
      sku: item.sku,
      currentStock: item.currentStock,
      targetQty: item.currentStock <= 0 ? 100 : item.currentStock < 5 ? 50 : 25,
      kainNotes: item.sku.catatan || '',
    }))
  );

  // Live Calculations
  const totalTargetPcs = useMemo(
    () => poItems.reduce((sum, item) => sum + Number(item.targetQty || 0), 0),
    [poItems]
  );

  const handleUpdateQty = (idx: number, qty: number) => {
    setPoItems(prev => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], targetQty: Math.max(0, qty) };
      return copy;
    });
  };

  const handleUpdateNotes = (idx: number, notes: string) => {
    setPoItems(prev => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], kainNotes: notes };
      return copy;
    });
  };

  const handleRemoveItem = (idx: number) => {
    setPoItems(prev => prev.filter((_, i) => i !== idx));
  };

  const handlePrintPDF = () => {
    if (!paperRef.current) return;
    const safePONo = noPO.replace(/[/\\?%*:|"<>]/g, '-');
    const docTitle = `Surat_PO_Restock_${safePONo}_${brandTarget}`;
    printIsolatedDocument(paperRef.current, docTitle);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-hidden animate-fadeIn">
      <div className="bg-slate-100 rounded-2xl max-w-6xl w-full max-h-[95vh] flex flex-col shadow-2xl border border-slate-300 overflow-hidden">
        
        {/* TOP TOOLBAR */}
        <div className="bg-white px-5 py-3.5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0 shadow-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900 flex items-center gap-2">
                <span>Generator List PO Restock Konveksi</span>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
                  {poItems.length} SKU • {totalTargetPcs} Pcs
                </span>
              </div>
              <div className="text-[11px] text-slate-500">
                Penerbitan surat perintah kerja potong & jahit untuk produk habis/menipis
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrintPDF}
              disabled={poItems.length === 0}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-sm flex items-center gap-1.5 transition active:scale-95 cursor-pointer disabled:opacity-50"
              title="Download dokumen PO dalam format PDF"
            >
              <Download className="w-4 h-4" />
              <span>Download PDF</span>
            </button>
            <button
              onClick={handlePrintPDF}
              disabled={poItems.length === 0}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition active:scale-95 cursor-pointer hidden sm:flex disabled:opacity-50"
              title="Cetak langsung lewat printer"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition ml-1 cursor-pointer"
              title="Tutup Form"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* BODY (SPLIT VIEW: FORM CONFIGURATION & A4 PAPER PREVIEW) */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 gap-0 bg-slate-200/60">
          
          {/* LEFT: EDITABLE CONFIGURATION PANEL (4 Cols) */}
          <div className="lg:col-span-4 p-4 sm:p-5 bg-white border-b lg:border-b-0 lg:border-r border-slate-200 space-y-4 overflow-y-auto max-h-none lg:max-h-[calc(95vh-65px)]">
            <div className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-indigo-600" />
              <span>Konfigurasi Dokumen PO</span>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Nomor PO / SPK</label>
                <input
                  type="text"
                  value={noPO}
                  onChange={e => setNoPO(e.target.value.toUpperCase())}
                  className="w-full px-3 py-1.5 font-mono font-bold text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Tanggal Terbit</label>
                  <input
                    type="date"
                    value={tanggalPO}
                    onChange={e => setTanggalPO(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Target Selesai</label>
                  <input
                    type="date"
                    value={targetDeadline}
                    onChange={e => setTargetDeadline(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Brand Mitra Pemilik</label>
                {activeBrand === 'ALL' && brandList.length > 0 ? (
                  <select
                    value={brandTarget}
                    onChange={e => setBrandTarget(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs font-bold bg-slate-50 border border-slate-200 rounded-lg text-indigo-700"
                  >
                    <option value="SEMUA BRAND">Semua Brand Terkait</option>
                    {brandList.map(b => (
                      <option key={b.id} value={b.name}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={brandTarget}
                    onChange={e => setBrandTarget(e.target.value.toUpperCase())}
                    className="w-full px-3 py-1.5 text-xs font-bold bg-slate-50 border border-slate-200 rounded-lg text-indigo-700"
                  />
                )}
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Ditujukan Kepada (Vendor / Bagian)</label>
                <input
                  type="text"
                  value={vendorTujuan}
                  onChange={e => setVendorTujuan(e.target.value)}
                  placeholder="Contoh: Divisi Cutting & Jahit Internal"
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Catatan Tambahan PO</label>
                <textarea
                  rows={2}
                  value={catatanPO}
                  onChange={e => setCatatanPO(e.target.value)}
                  placeholder="Instruksi khusus bahan, benang, atau prioritas..."
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>
            </div>

            {/* SKU LIST TABLE EDIT */}
            <div className="pt-3 border-t border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-700 uppercase">Target Qty per SKU</span>
                <span className="text-[11px] font-bold text-indigo-600">Total: {totalTargetPcs} Pcs</span>
              </div>

              {poItems.length === 0 ? (
                <div className="text-center py-6 text-slate-400 bg-slate-50 rounded-lg border border-dashed border-slate-200 text-xs">
                  Tidak ada SKU terpilih.
                </div>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {poItems.map((item, idx) => (
                    <div
                      key={item.sku.id}
                      className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1.5"
                    >
                      <div className="flex items-start justify-between gap-1">
                        <div>
                          <div className="font-bold text-slate-900">{item.sku.produk}</div>
                          <div className="font-mono text-[10px] text-indigo-600 font-semibold">{item.sku.sku}</div>
                          <div className="text-[10px] text-slate-500">
                            Warna: {item.sku.warna || '-'} • Size: {item.sku.ukuran || '-'}
                          </div>
                        </div>
                        <button
                          onClick={() => handleRemoveItem(idx)}
                          title="Hapus dari list PO"
                          className="text-slate-400 hover:text-rose-600 p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-200">
                        <div>
                          <span className="text-[10px] text-slate-500 block">Sisa Stok:</span>
                          <span
                            className={`font-bold text-[11px] ${
                              item.currentStock <= 0
                                ? 'text-rose-600'
                                : item.currentStock < 5
                                ? 'text-amber-600'
                                : 'text-emerald-700'
                            }`}
                          >
                            {item.currentStock} Pcs
                          </span>
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-500 block font-semibold">Qty Target PO:</label>
                          <input
                            type="number"
                            min={1}
                            value={item.targetQty}
                            onChange={e => handleUpdateQty(idx, Number(e.target.value))}
                            className="w-full px-2 py-1 text-xs font-bold font-mono text-indigo-700 bg-white border border-indigo-200 rounded text-right focus:outline-none"
                          />
                        </div>
                      </div>

                      <div>
                        <input
                          type="text"
                          placeholder="Catatan kain / bahan (opsional)..."
                          value={item.kainNotes}
                          onChange={e => handleUpdateNotes(idx, e.target.value)}
                          className="w-full px-2 py-1 text-[10px] bg-white border border-slate-200 rounded"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT: A4 PAPER PREVIEW (8 Cols) */}
          <div className="lg:col-span-8 p-4 sm:p-6 md:p-8 flex justify-center items-start overflow-y-auto max-h-none lg:max-h-[calc(95vh-65px)]">
            
            {/* Printable A4 Paper Document */}
            <div
              ref={paperRef}
              id="po-paper"
              className="bg-white rounded-xl shadow-lg border border-slate-300 p-6 sm:p-8 space-y-4 text-slate-800 max-w-3xl w-full text-xs"
            >
              {/* Kop Surat Perusahaan */}
              <div className="flex justify-between items-start border-b-2 border-slate-900 pb-3">
                <div className="flex items-center gap-3.5">
                  <img
                    src="/logo-maison-rayyan.png"
                    alt="Maison Rayyan Manufacturing"
                    className="h-16 sm:h-20 w-auto object-contain shrink-0"
                  />
                  <div>
                    <h2 className="text-lg font-bold tracking-tight text-slate-900">MAISON RAYYAN MANUFACTURING</h2>
                    <p className="text-xs text-slate-600 font-medium mt-0.5">Konveksi & Makloon Garment Terpadu</p>
                    <p className="text-[10px] text-slate-400">Jl. Industri Makloon No. 88, Bandung • Telp: 0812-3456-7890</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="bg-slate-900 text-white text-[10px] font-bold px-3 py-1 rounded uppercase tracking-wider inline-block">
                    PURCHASE ORDER (PO) RESTOCK
                  </span>
                  <div className="text-xs font-mono font-bold text-indigo-700 mt-1.5">{noPO}</div>
                  <div className="text-[10px] text-slate-500">Tanggal: {formatDateIndo(tanggalPO)}</div>
                </div>
              </div>

              {/* Info Grid Metadata */}
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs">
                <div className="space-y-1">
                  <div className="flex">
                    <span className="text-slate-500 w-24">Brand Mitra</span>
                    <span className="font-bold text-slate-900">: {brandTarget}</span>
                  </div>
                  <div className="flex">
                    <span className="text-slate-500 w-24">Tujuan Vendor</span>
                    <span className="font-medium text-slate-800">: {vendorTujuan}</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex">
                    <span className="text-slate-500 w-28">Target Selesai</span>
                    <span className="font-bold text-rose-700">: {formatDateIndo(targetDeadline)}</span>
                  </div>
                  <div className="flex">
                    <span className="text-slate-500 w-28">Status Perintah</span>
                    <span className="font-bold text-emerald-700">: SEGERA DIPROSES</span>
                  </div>
                </div>
              </div>

              {catatanPO && (
                <div className="text-[11px] text-slate-600 italic bg-amber-50/70 border border-amber-200/60 p-2 rounded">
                  <span className="font-semibold text-amber-900 not-italic">Instruksi PO: </span>
                  {catatanPO}
                </div>
              )}

              {/* Table of PO Items */}
              <div className="border border-slate-300 rounded-lg overflow-hidden">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-100 text-slate-700 font-bold text-[9px] uppercase tracking-wider border-b border-slate-300">
                    <tr>
                      <th className="p-2 w-8 text-center">No</th>
                      <th className="p-2">Kode SKU</th>
                      <th className="p-2">Model Produk & Warna</th>
                      <th className="p-2 text-center w-14">Ukuran</th>
                      <th className="p-2 text-center w-20">Sisa Stok</th>
                      <th className="p-2 text-center w-24 bg-amber-100/70 text-amber-900 border-x border-amber-200">Target Qty (PO)</th>
                      <th className="p-2">Kebutuhan Kain / Catatan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-xs">
                    {poItems.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-6 text-center text-slate-400 italic">
                          Belum ada item SKU yang dimasukkan ke dalam daftar PO ini.
                        </td>
                      </tr>
                    ) : (
                      poItems.map((item, idx) => (
                        <tr key={item.sku.id} className="hover:bg-slate-50">
                          <td className="p-2 text-center text-slate-400 font-bold">{idx + 1}</td>
                          <td className="p-2 font-mono font-bold text-indigo-700">{item.sku.sku}</td>
                          <td className="p-2">
                            <span className="font-bold text-slate-900">{item.sku.produk}</span>
                            {item.sku.warna && (
                              <span className="text-slate-500 text-[10px] block">Warna: {item.sku.warna}</span>
                            )}
                          </td>
                          <td className="p-2 text-center font-semibold text-slate-700">{item.sku.ukuran || '-'}</td>
                          <td className="p-2 text-center font-bold">
                            <span
                              className={`inline-block px-1.5 py-0.5 rounded text-[10px] ${
                                item.currentStock <= 0
                                  ? 'bg-rose-100 text-rose-800'
                                  : item.currentStock < 5
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-slate-100 text-slate-700'
                              }`}
                            >
                              {item.currentStock} Pcs
                            </span>
                          </td>
                          <td className="p-2 text-center font-bold text-sm text-indigo-900 bg-indigo-50/50">
                            {item.targetQty} Pcs
                          </td>
                          <td className="p-2 text-[10px] text-slate-600">
                            {item.kainNotes || <span className="text-slate-400 italic">-</span>}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                  {poItems.length > 0 && (
                    <tfoot className="bg-slate-100 font-bold text-xs border-t-2 border-slate-300">
                      <tr>
                        <td colSpan={5} className="p-2 text-right uppercase tracking-wider text-slate-700">
                          Total Keseluruhan Target Produksi:
                        </td>
                        <td className="p-2 text-center text-sm font-bold text-indigo-900 bg-indigo-100">
                          {totalTargetPcs} Pcs
                        </td>
                        <td className="p-2 text-[10px] text-slate-500">
                          {poItems.length} Model SKU Terdaftar
                        </td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>

              {/* Signatures */}
              <div className="grid grid-cols-3 gap-4 pt-6 text-center text-[11px] text-slate-700">
                <div className="space-y-12">
                  <div>Yang Memerintahkan,</div>
                  <div className="font-bold border-t border-slate-400 pt-1 mx-4">
                    Admin Produksi / Konveksi
                  </div>
                </div>
                <div className="space-y-12">
                  <div>Diterima &amp; Dikerjakan Oleh,</div>
                  <div className="font-bold border-t border-slate-400 pt-1 mx-4">
                    Bagian Cutting &amp; Jahit
                  </div>
                </div>
                <div className="space-y-12">
                  <div>Mengetahui,</div>
                  <div className="font-bold border-t border-slate-400 pt-1 mx-4">
                    Owner / Mitra Brand
                  </div>
                </div>
              </div>

              <div className="text-[9px] text-slate-400 text-center pt-3 border-t border-slate-100">
                Dokumen ini digenerate secara otomatis oleh KonvekSys ERP — Sistem Manajemen Produksi Konveksi Terpadu.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
