import React, { useRef } from 'react';
import { Printer, X, FileText, Scissors, Package, CheckCircle2 } from 'lucide-react';
import { SPKCutting, InboundRoll, SizeBreakdown } from '../../types';
import { printIsolatedDocument } from '../../utils/printHelper';
import { formatDateIndo } from '../../utils/formatters';

interface SPKPrintModalProps {
  spk: SPKCutting;
  inboundRolls: InboundRoll[];
  onClose: () => void;
}

const ALL_SIZES: { key: keyof SizeBreakdown; label: string }[] = [
  { key: 's', label: 'S' },
  { key: 'm', label: 'M' },
  { key: 'l', label: 'L' },
  { key: 'xl', label: 'XL' },
  { key: 'xxl', label: '2XL' },
  { key: 'anak2', label: 'A-2' },
  { key: 'anak4', label: 'A-4' },
  { key: 'anak6', label: 'A-6' },
  { key: 'anak8', label: 'A-8' },
  { key: 'anak10', label: 'A-10' },
  { key: 'anak12', label: 'A-12' },
  { key: 'anak14', label: 'A-14' },
  { key: 'anak16', label: 'A-16' },
];

export const SPKPrintModal: React.FC<SPKPrintModalProps> = ({ spk, inboundRolls, onClose }) => {
  const paperRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    if (!paperRef.current) return;
    printIsolatedDocument(paperRef.current, `SPK_Cutting_${spk.spkNumber}`);
  };

  const isMultiFabric = Boolean(
    spk.isMultiFabric ||
    (spk.items && spk.items.length > 1 && spk.items.some(it => it.rollIds && it.rollIds.length > 0))
  );

  const items = spk.items && spk.items.length > 0 ? spk.items : [
    {
      id: 'default-1',
      produk: spk.produk,
      vendor: spk.vendor,
      targetCutQty: spk.targetCutQty,
      deliveredQty: spk.deliveredQty,
      sourcePONumber: spk.sourcePONumber,
      rollIds: spk.rollIds,
    }
  ];

  const getFabricForItem = (it: any) => {
    if (it.jenisKain) return it.jenisKain;
    if (it.depositInfo?.jenisKain) {
      return `${it.depositInfo.jenisKain}${it.depositInfo.warna ? ` (${it.depositInfo.warna})` : ''} [Sisa Kain]`;
    }
    if (it.rollIds && it.rollIds.length > 0) {
      const rolls = inboundRolls.filter(r => it.rollIds.includes(r.id));
      const names = Array.from(new Set(rolls.map(r => r.jenisKain).filter(Boolean)));
      if (names.length > 0) return names.join(', ');
    }
    if (spk.depositInfo?.jenisKain) {
      return `${spk.depositInfo.jenisKain}${spk.depositInfo.warna ? ` (${spk.depositInfo.warna})` : ''} [Sisa Kain]`;
    }
    if (spk.rollIds && spk.rollIds.length > 0) {
      const rolls = inboundRolls.filter(r => spk.rollIds.includes(r.id));
      const names = Array.from(new Set(rolls.map(r => r.jenisKain).filter(Boolean)));
      if (names.length > 0) return names.join(', ');
    }
    return 'Bahan Standar';
  };

  const getRollsForItem = (it: any): InboundRoll[] => {
    const ids = it.rollIds && it.rollIds.length > 0 ? it.rollIds : (isMultiFabric ? [] : (spk.rollIds || []));
    return inboundRolls.filter(r => ids.includes(r.id));
  };

  // Grand Total Target Pcs
  const grandTotalPcs = items.reduce((acc, it) => {
    return acc + Object.values(it.targetCutQty || {}).reduce((a, b) => a + (Number(b) || 0), 0);
  }, 0);

  // Distinct POs
  const distinctPOs = Array.from(
    new Set([
      spk.sourcePONumber,
      ...(spk.sourcePONumbers || []),
      ...(items.map(it => it.sourcePONumber)),
    ].filter(Boolean))
  ) as string[];

  // Active sizes across all items
  const activeSizes = ALL_SIZES.filter(sz =>
    items.some(it => (it.targetCutQty?.[sz.key] || 0) > 0)
  );

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex flex-col items-center justify-start p-2 sm:p-4 overflow-y-auto">
      {/* Top Floating Control Bar */}
      <div className="sticky top-2 z-20 w-full max-w-4xl bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-slate-200 p-3 mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-700">
            <Scissors className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-800 flex items-center gap-2">
              <span>Pratinjau SPK Cutting / Meja Potong</span>
              {isMultiFabric ? (
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-300">
                  Setelan Multi-Bahan ({items.length} Komponen)
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">
                  SPK Standar
                </span>
              )}
            </div>
            <div className="text-[11px] text-slate-500 font-mono">
              {spk.spkNumber} • {spk.brand} • {spk.produk}
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

      {/* Printable Sheet (A4) */}
      <div
        ref={paperRef}
        className="w-full max-w-4xl bg-white shadow-2xl rounded-sm p-8 text-slate-900 border border-slate-200 space-y-5 print:shadow-none print:border-none print:p-2"
        style={{ minHeight: '297mm' }}
      >
        {/* Document Header */}
        <div className="border-b-2 border-slate-900 pb-4">
          <div className="flex justify-between items-start gap-4">
            <div>
              <h1 className="text-xl font-black tracking-tight uppercase text-slate-900">
                SURAT PERINTAH KERJA (SPK) CUTTING
              </h1>
              <p className="text-xs text-slate-600 font-medium tracking-wide uppercase mt-0.5">
                Konveksys Workshop • Perintah Gelar & Potong Bahan Baku
              </p>
            </div>
            <div className="text-right">
              <div className="inline-block px-3 py-1 bg-slate-900 text-white font-mono font-black text-sm rounded">
                {spk.spkNumber}
              </div>
              <div className="text-[10px] text-slate-500 mt-1">
                Tgl Terbit: <strong>{formatDateIndo(spk.tanggalSPK)}</strong>
              </div>
            </div>
          </div>

          {/* Metadata Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 border border-slate-200 rounded-lg p-3 mt-3 text-xs">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Brand Pemilik:</span>
              <strong className="text-slate-900 font-bold">{spk.brand}</strong>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Mitra Konveksi (Penjahit):</span>
              <strong className="text-slate-900 font-bold">{spk.vendor}</strong>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Target Selesai Jahit:</span>
              <strong className="text-slate-900 font-bold">{formatDateIndo(spk.targetSelesai)}</strong>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Referensi PO:</span>
              <strong className="text-slate-900 font-mono">
                {distinctPOs.length > 0 ? distinctPOs.join(', ') : '-'}
              </strong>
            </div>
          </div>
        </div>

        {/* Section: Rincian Bahan Kain yang Digelar */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xs font-black uppercase text-slate-800 tracking-wider flex items-center gap-1.5">
              <span>🧵</span>
              <span>Rincian Bahan Baku & Alokasi Rol Kain</span>
            </h2>
            {isMultiFabric && (
              <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                Mode Setelan: Setiap Komponen Menggunakan Gelaran Bahan Terpisah
              </span>
            )}
          </div>

          <div className="space-y-2.5">
            {items.map((it, idx) => {
              const fabricName = getFabricForItem(it);
              const rolls = getRollsForItem(it);
              const totalMeters = rolls.reduce((a, b) => a + (b.meterLength - b.meterUsed), 0);

              return (
                <div
                  key={it.id || idx}
                  className="border border-slate-200 rounded-lg p-3 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-slate-900 text-white font-bold text-[10px] flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <strong className="text-slate-900 font-black text-xs uppercase">
                        {it.produk}
                      </strong>
                      <span className="text-[10px] text-slate-500 font-medium">
                        (Mitra: {it.vendor})
                      </span>
                    </div>
                    <div className="mt-1 pl-7 text-[11px] text-indigo-900 font-semibold">
                      Bahan: <span className="font-bold underline">{fabricName}</span>
                    </div>
                  </div>

                  <div className="pl-7 sm:pl-0 sm:text-right shrink-0">
                    {rolls.length > 0 ? (
                      <div>
                        <div className="text-[11px] font-bold text-slate-800">
                          {rolls.length} Rol ({totalMeters > 0 ? `${totalMeters} m` : `${rolls.reduce((a, b) => a + b.meterLength, 0)} m`})
                        </div>
                        <div className="flex flex-wrap gap-1 mt-0.5 sm:justify-end">
                          {rolls.map(r => (
                            <span
                              key={r.id}
                              className="px-1.5 py-0.5 bg-white border border-slate-200 rounded font-mono text-[9.5px] text-slate-700"
                            >
                              {r.rollCode} ({r.meterLength}m)
                            </span>
                          ))}
                        </div>
                      </div>
                    ) : it.depositInfo ? (
                      <div>
                        <div className="text-[11px] font-bold text-slate-800">
                          Sisa Kain: {it.depositInfo.panjang} {it.depositInfo.satuan}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          Asal: Konveksi {it.depositInfo.sourceVendor || '-'}
                        </div>
                      </div>
                    ) : (
                      <span className="text-slate-400 italic text-[11px]">Bahan Terpusat / Sesuai SPK</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Section: Matriks Target Potong per Ukuran */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xs font-black uppercase text-slate-800 tracking-wider flex items-center gap-1.5">
              <span>📐</span>
              <span>Matriks Target Potong & Size Breakdown</span>
            </h2>
            <span className="text-xs font-black text-slate-900">
              Total Target: <span className="underline">{grandTotalPcs} Pcs</span>
            </span>
          </div>

          <div className="border border-slate-900 rounded-lg overflow-hidden">
            <table className="w-full text-center text-xs border-collapse">
              <thead className="bg-slate-900 text-white font-bold text-[10px] uppercase">
                <tr>
                  <th className="p-2 text-left pl-3">Artikel / Komponen</th>
                  <th className="p-2 text-left">Bahan Kain</th>
                  {activeSizes.map(sz => (
                    <th key={sz.key} className="p-2 border-l border-slate-700">
                      {sz.label}
                    </th>
                  ))}
                  <th className="p-2 border-l border-slate-700 bg-slate-800">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {items.map((it, idx) => {
                  const itemTotal = Object.values(it.targetCutQty || {}).reduce((a, b) => a + (Number(b) || 0), 0);
                  const fabricName = getFabricForItem(it);

                  return (
                    <tr key={it.id || idx} className="hover:bg-slate-50/50">
                      <td className="p-2.5 text-left pl-3 font-black text-slate-900">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] text-slate-400">#{idx + 1}</span>
                          <span>{it.produk}</span>
                        </div>
                        {it.sourcePONumber && (
                          <span className="text-[9.5px] font-mono text-indigo-700 block font-semibold">
                            PO: {it.sourcePONumber}
                          </span>
                        )}
                      </td>
                      <td className="p-2 text-left font-medium text-slate-700 text-[11px] max-w-[160px] truncate" title={fabricName}>
                        {fabricName}
                      </td>
                      {activeSizes.map(sz => {
                        const val = it.targetCutQty?.[sz.key] || 0;
                        return (
                          <td key={sz.key} className="p-2 border-l border-slate-200 font-bold tabular-nums">
                            {val > 0 ? `${val}` : '-'}
                          </td>
                        );
                      })}
                      <td className="p-2 border-l border-slate-200 font-black text-slate-900 bg-slate-50 tabular-nums">
                        {itemTotal} Pcs
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-slate-100 border-t-2 border-slate-900 font-black text-slate-900 text-xs">
                <tr>
                  <td colSpan={2} className="p-2.5 text-left pl-3 uppercase">
                    Total Keseluruhan Potong:
                  </td>
                  {activeSizes.map(sz => {
                    const colTotal = items.reduce(
                      (acc, it) => acc + (Number(it.targetCutQty?.[sz.key]) || 0),
                      0
                    );
                    return (
                      <td key={sz.key} className="p-2 border-l border-slate-300 tabular-nums">
                        {colTotal > 0 ? colTotal : '-'}
                      </td>
                    );
                  })}
                  <td className="p-2.5 border-l border-slate-300 bg-slate-900 text-white font-black tabular-nums">
                    {grandTotalPcs} Pcs
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Catatan Khusus */}
        {spk.catatan && (
          <div className="bg-amber-50/80 border border-amber-300 rounded-lg p-3 text-xs text-amber-950">
            <strong className="block text-[10px] uppercase font-black text-amber-800 mb-0.5">
              Instruksi Khusus Meja Potong & Bundling:
            </strong>
            <p className="leading-relaxed">{spk.catatan}</p>
          </div>
        )}

        {/* Kolom Tanda Tangan */}
        <div className="pt-4 border-t border-slate-200">
          <div className="grid grid-cols-4 gap-4 text-center text-xs">
            <div className="border border-slate-300 rounded-lg p-2.5 flex flex-col justify-between h-28">
              <span className="text-[10px] uppercase font-bold text-slate-500">Operator Meja Potong (Cutter)</span>
              <div className="border-b border-slate-400 w-3/4 mx-auto"></div>
              <span className="text-[10px] text-slate-400">( Tanda Tangan & Nama )</span>
            </div>

            <div className="border border-slate-300 rounded-lg p-2.5 flex flex-col justify-between h-28">
              <span className="text-[10px] uppercase font-bold text-slate-500">Checker / Bundling Ikat</span>
              <div className="border-b border-slate-400 w-3/4 mx-auto"></div>
              <span className="text-[10px] text-slate-400">( Tanda Tangan & Nama )</span>
            </div>

            <div className="border border-slate-300 rounded-lg p-2.5 flex flex-col justify-between h-28">
              <span className="text-[10px] uppercase font-bold text-slate-500">Kepala Produksi (Spv)</span>
              <div className="border-b border-slate-400 w-3/4 mx-auto"></div>
              <span className="text-[10px] text-slate-400">( Tanda Tangan & Nama )</span>
            </div>

            <div className="border border-slate-300 rounded-lg p-2.5 flex flex-col justify-between h-28">
              <span className="text-[10px] uppercase font-bold text-slate-500">Penerima Vendor Penjahit</span>
              <div className="border-b border-slate-400 w-3/4 mx-auto"></div>
              <span className="text-[10px] text-slate-400">Konveksi {spk.vendor}</span>
            </div>
          </div>
        </div>

        {/* Footer print note */}
        <div className="text-[9px] text-slate-400 flex items-center justify-between pt-2">
          <span>Dicetak otomatis melalui Konveksys Management System</span>
          <span>Halaman 1 dari 1</span>
        </div>
      </div>
    </div>
  );
};
