import React, { useState, useMemo, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Plus,
  Coins,
  Building2,
  Calendar,
  CreditCard,
  FileText,
  CheckCircle2,
  Layers,
  Sparkles,
  Upload,
  Image as ImageIcon,
  Trash2,
  Eye,
  ShoppingBag,
  Clock,
  Printer,
  PackageCheck,
  Scissors,
  Check,
  AlertCircle,
  ExternalLink,
  Edit2,
  ArrowRight,
  Share2,
} from 'lucide-react';
import { FobDownPayment, FobMaterialItem, FobMaterialCategory } from '../../types';
import { formatRp, formatRupiahInput, parseRupiahInput, formatDateIndo } from '../../utils/formatters';
import { useApp } from '../../context/AppContext';
import { printIsolatedDocument } from '../../utils/printHelper';

/**
 * Kompresi file foto struk / nota toko menjadi Base64 Data URL (~150-250KB)
 */
function processImageFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const maxDim = 1200;

        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.82);
        resolve(dataUrl);
      };
      img.onerror = () => resolve(e.target?.result as string);
      img.src = e.target?.result as string;
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

interface FobMaterialProcurementModalProps {
  isOpen: boolean;
  deposit: FobDownPayment | null;
  onClose: () => void;
  onUpdateDeposit: (id: string, updates: Partial<FobDownPayment>) => Promise<void>;
}

export const FobMaterialProcurementModal: React.FC<FobMaterialProcurementModalProps> = ({
  isOpen,
  deposit,
  onClose,
  onUpdateDeposit,
}) => {
  const { addInboundRoll, brands, addAccessory, recordStockIn } = useApp();

  // Tab filter item dalam modal
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | 'KAIN' | 'AKSESORIS'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'BELUM_DITRANSFER' | 'SUDAH_DITRANSFER'>('ALL');

  // Mode Form: null (tutup), 'ADD' (tambah baru), atau item id (edit)
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [isAddingNew, setIsAddingNew] = useState<boolean>(false);

  // Form States untuk Item
  const [formKategori, setFormKategori] = useState<FobMaterialCategory>('KAIN');
  const [formNamaItem, setFormNamaItem] = useState<string>('');
  const [formTokoSupplier, setFormTokoSupplier] = useState<string>('');
  const [formNoRekeningToko, setFormNoRekeningToko] = useState<string>('');
  const [formJumlah, setFormJumlah] = useState<number>(1);
  const [formSatuan, setFormSatuan] = useState<string>('kg');
  const [formHargaSatuan, setFormHargaSatuan] = useState<number>(0);
  const [formStatusBayarBuyer, setFormStatusBayarBuyer] = useState<'BELUM_DITRANSFER' | 'SUDAH_DITRANSFER'>('BELUM_DITRANSFER');
  const [formNotaTokoUrl, setFormNotaTokoUrl] = useState<string>('');
  const [formBuktiTransferTokoUrl, setFormBuktiTransferTokoUrl] = useState<string>('');
  const [formCatatan, setFormCatatan] = useState<string>('');

  // Preview Gambar Modal
  const [imagePreview, setImagePreview] = useState<{ url: string; title: string } | null>(null);

  // Print Mode State
  const [isPrintMode, setIsPrintMode] = useState<boolean>(false);
  const [copiedWA, setCopiedWA] = useState<boolean>(false);

  // Submitting loading
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Ref untuk printable paper area (A4 isolated printing)
  const paperRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    if (!paperRef.current || !deposit) return;
    const safeDocNo = (deposit.depositNumber || 'FOB-Pengadaan').replace(/[/\\?%*:|"<>]/g, '-');
    const safePo = (deposit.poNumber || 'PO').replace(/[/\\?%*:|"<>]/g, '-');
    const safeBrand = (deposit.brand || 'Brand').replace(/[/\\?%*:|"<>]/g, '-');
    const docTitle = `Tagihan_Bahan_FOB_${safePo}_${safeDocNo}_${safeBrand}`;
    printIsolatedDocument(paperRef.current, docTitle);
  };

  useEffect(() => {
    if (!isPrintMode) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        handlePrint();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPrintMode, deposit]);

  if (!isOpen || !deposit) return null;

  // Daftar item belanja bahan (fallback ke array kosong jika belum ada)
  const materialItems: FobMaterialItem[] = deposit.rincianBahan || [];

  // Hitung Agregasi Finansial
  const totalNilaiPo = Number(deposit.totalNilaiPo || deposit.nominalTotalOrder || 0);

  const totalBelanjaKain = materialItems
    .filter((it) => it.kategori === 'KAIN')
    .reduce((acc, it) => acc + (it.subtotal || 0), 0);

  const totalBelanjaAksesoris = materialItems
    .filter((it) => it.kategori === 'AKSESORIS')
    .reduce((acc, it) => acc + (it.subtotal || 0), 0);

  const totalBelanjaBahan = totalBelanjaKain + totalBelanjaAksesoris;
  const sisaHakJasaPo = Math.max(0, totalNilaiPo - totalBelanjaBahan);

  // Status Transfer Toko
  const totalItemSudahTf = materialItems.filter((it) => it.statusBayarBuyer === 'SUDAH_DITRANSFER').length;
  const totalItemBelumTf = materialItems.filter((it) => it.statusBayarBuyer === 'BELUM_DITRANSFER').length;

  // Filtered Items untuk Tampilan Tabel
  const filteredItems = materialItems.filter((it) => {
    const matchCat = categoryFilter === 'ALL' || it.kategori === categoryFilter;
    const matchStat = statusFilter === 'ALL' || it.statusBayarBuyer === statusFilter;
    return matchCat && matchStat;
  });

  // Reset form item
  const resetItemForm = () => {
    setFormKategori('KAIN');
    setFormNamaItem('');
    setFormTokoSupplier('');
    setFormNoRekeningToko('');
    setFormJumlah(1);
    setFormSatuan('kg');
    setFormHargaSatuan(0);
    setFormStatusBayarBuyer('BELUM_DITRANSFER');
    setFormNotaTokoUrl('');
    setFormBuktiTransferTokoUrl('');
    setFormCatatan('');
    setIsAddingNew(false);
    setEditingItemId(null);
  };

  // Open Edit Form
  const handleOpenEdit = (item: FobMaterialItem) => {
    setEditingItemId(item.id);
    setIsAddingNew(false);
    setFormKategori(item.kategori);
    setFormNamaItem(item.namaItem);
    setFormTokoSupplier(item.tokoSupplier);
    setFormNoRekeningToko(item.noRekeningToko || '');
    setFormJumlah(item.jumlah);
    setFormSatuan(item.satuan);
    setFormHargaSatuan(item.hargaSatuan);
    setFormStatusBayarBuyer(item.statusBayarBuyer);
    setFormNotaTokoUrl(item.notaTokoUrl || '');
    setFormBuktiTransferTokoUrl(item.buktiTransferTokoUrl || '');
    setFormCatatan(item.catatan || '');
  };

  // Simpan Item (Tambah atau Update)
  const handleSaveItem = async () => {
    if (!formNamaItem.trim()) {
      alert('Nama item / jenis bahan wajib diisi!');
      return;
    }
    if (!formTokoSupplier.trim()) {
      alert('Nama toko / supplier bahan wajib diisi!');
      return;
    }
    if (formJumlah <= 0) {
      alert('Jumlah item harus lebih dari 0!');
      return;
    }
    if (formHargaSatuan <= 0) {
      alert('Harga satuan harus lebih dari Rp 0!');
      return;
    }

    const calculatedSubtotal = Math.round(formJumlah * formHargaSatuan);

    let updatedList: FobMaterialItem[];

    if (editingItemId) {
      // Update item yang ada
      updatedList = materialItems.map((it) => {
        if (it.id === editingItemId) {
          return {
            ...it,
            kategori: formKategori,
            namaItem: formNamaItem.trim(),
            tokoSupplier: formTokoSupplier.trim(),
            noRekeningToko: formNoRekeningToko.trim() || undefined,
            jumlah: formJumlah,
            satuan: formSatuan.trim(),
            hargaSatuan: formHargaSatuan,
            subtotal: calculatedSubtotal,
            statusBayarBuyer: formStatusBayarBuyer,
            notaTokoUrl: formNotaTokoUrl || undefined,
            buktiTransferTokoUrl: formBuktiTransferTokoUrl || undefined,
            catatan: formCatatan.trim() || undefined,
          };
        }
        return it;
      });
    } else {
      // Tambah item baru
      const newItem: FobMaterialItem = {
        id: `mat-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        kategori: formKategori,
        namaItem: formNamaItem.trim(),
        tokoSupplier: formTokoSupplier.trim(),
        noRekeningToko: formNoRekeningToko.trim() || undefined,
        jumlah: formJumlah,
        satuan: formSatuan.trim(),
        hargaSatuan: formHargaSatuan,
        subtotal: calculatedSubtotal,
        statusBayarBuyer: formStatusBayarBuyer,
        notaTokoUrl: formNotaTokoUrl || undefined,
        buktiTransferTokoUrl: formBuktiTransferTokoUrl || undefined,
        catatan: formCatatan.trim() || undefined,
        statusFisik: 'BELUM_DITERIMA',
        createdAt: new Date().toISOString(),
      };
      updatedList = [newItem, ...materialItems];
    }

    // Hitung total belanja bahan baru
    const newTotalBahan = updatedList.reduce((acc, it) => acc + (it.subtotal || 0), 0);
    const allTransferred = updatedList.length > 0 && updatedList.every((it) => it.statusBayarBuyer === 'SUDAH_DITRANSFER');

    setIsSaving(true);
    try {
      await onUpdateDeposit(deposit.id, {
        rincianBahan: updatedList,
        nominalDp: newTotalBahan, // sync total belanja bahan
        statusBahan: allTransferred ? 'SEBAGIAN_DIBELANJAKAN' : 'BELUM_DIBELANJAKAN',
      });
      resetItemForm();
    } catch (err) {
      console.error('Failed to update procurement items:', err);
      alert('Gagal menyimpan rincian belanja bahan.');
    } finally {
      setIsSaving(false);
    }
  };

  // Hapus Item Belanja
  const handleDeleteItem = async (itemId: string) => {
    if (!confirm('Hapus item belanja bahan ini?')) return;

    const updatedList = materialItems.filter((it) => it.id !== itemId);
    const newTotalBahan = updatedList.reduce((acc, it) => acc + (it.subtotal || 0), 0);

    setIsSaving(true);
    try {
      await onUpdateDeposit(deposit.id, {
        rincianBahan: updatedList,
        nominalDp: newTotalBahan,
      });
      if (editingItemId === itemId) resetItemForm();
    } catch (err) {
      console.error('Failed to delete item:', err);
      alert('Gagal menghapus item belanja.');
    } finally {
      setIsSaving(false);
    }
  };

  // Toggle Cepat Status Transfer Buyer
  const handleToggleTransferStatus = async (item: FobMaterialItem) => {
    const nextStatus: 'BELUM_DITRANSFER' | 'SUDAH_DITRANSFER' =
      item.statusBayarBuyer === 'BELUM_DITRANSFER' ? 'SUDAH_DITRANSFER' : 'BELUM_DITRANSFER';
    const updatedList: FobMaterialItem[] = materialItems.map((it) =>
      it.id === item.id ? { ...it, statusBayarBuyer: nextStatus } : it
    );
    const allTransferred = updatedList.length > 0 && updatedList.every((it) => it.statusBayarBuyer === 'SUDAH_DITRANSFER');

    try {
      await onUpdateDeposit(deposit.id, {
        rincianBahan: updatedList,
        statusBahan: allTransferred ? 'SEBAGIAN_DIBELANJAKAN' : deposit.statusBahan,
      });
    } catch (err) {
      console.error('Failed to toggle transfer status:', err);
    }
  };

  // Terima Fisik Bahan ke Gudang (Integrasi Rol Kain atau Stok Aksesoris)
  const handleReceivePhysical = async (item: FobMaterialItem) => {
    if (item.statusFisik === 'DITERIMA_GUDANG') {
      alert('Bahan ini sudah berstatus Diterima di Gudang.');
      return;
    }

    if (item.statusBayarBuyer === 'BELUM_DITRANSFER') {
      const proceed = confirm(
        'Perhatian: Item ini belum ditandai sudah ditransfer oleh buyer ke toko. Lanjutkan mencatat kedatangan fisik ke gudang?'
      );
      if (!proceed) return;
    }

    const confirmMsg =
      item.kategori === 'KAIN'
        ? `Konfirmasi penerimaan kain ${item.namaItem} (${item.jumlah} ${item.satuan}) ke Inbound Stok Rol Gudang?`
        : `Konfirmasi penerimaan aksesoris ${item.namaItem} (${item.jumlah} ${item.satuan}) ke Stok Aksesoris?`;

    if (!confirm(confirmMsg)) return;

    try {
      if (item.kategori === 'KAIN') {
        // Otomatis catat ke Inbound Stok Kain Rol
        const matchedBrand = brands.find((b) => b.name.trim().toUpperCase() === deposit.brand.trim().toUpperCase());
        const brandCode = (matchedBrand?.code || deposit.brand.substring(0, 3) || 'ROL').toUpperCase();
        const generatedRollCode = `ROL-${brandCode}-${Date.now().toString().slice(-4)}`;

        await addInboundRoll({
          rollCode: generatedRollCode,
          brand: deposit.brand,
          jenisKain: item.namaItem,
          meterLength: Number(item.jumlah) || 100,
          meterUsed: 0,
          hargaModalMeter: Math.round((item.subtotal || 0) / Math.max(1, Number(item.jumlah) || 1)),
          status: 'DI_GUDANG',
          tanggalMasuk: new Date().toISOString().split('T')[0],
          keterangan: `[FOB Direct Transfer: ${deposit.poNumber}] Toko: ${item.tokoSupplier}`,
          sourceType: 'FOB',
          sourcePONumber: deposit.poNumber,
          fobDepositId: deposit.id,
        });
      } else {
        // Otomatis catat ke Stok Aksesoris
        addAccessory({
          sku: `ACC-${Date.now().toString().slice(-5)}`,
          name: `${item.namaItem} (${deposit.brand})`,
          category: 'LAINNYA',
          unit: 'PCS',
          stock: Number(item.jumlah) || 0,
          safetyStock: 0,
          brand: deposit.brand,
          notes: `[FOB PO ${deposit.poNumber}] Supplier: ${item.tokoSupplier}`,
        });
      }

      // Tandai item sebagai DITERIMA_GUDANG
      const updatedList = materialItems.map((it) =>
        it.id === item.id ? { ...it, statusFisik: 'DITERIMA_GUDANG' as const, tanggalTerima: new Date().toISOString().split('T')[0] } : it
      );

      const allReceived = updatedList.every((it) => it.statusFisik === 'DITERIMA_GUDANG');

      await onUpdateDeposit(deposit.id, {
        rincianBahan: updatedList,
        statusBahan: allReceived ? 'SUDAH_JADI_KAIN' : 'SEBAGIAN_DIBELANJAKAN',
      });

      alert(`Bahan "${item.namaItem}" berhasil diterima dan dicatat ke inventaris gudang!`);
    } catch (err) {
      console.error('Failed to process physical intake:', err);
      alert('Terjadi kesalahan saat menerima bahan fisik.');
    }
  };

  // Salin Rincian ke WhatsApp
  const handleCopyWA = () => {
    let text = `*RINCIAN TAGIHAN PENGADAAN BAHAN PO FOB*\n`;
    text += `*Buyer:* ${deposit.brand}\n`;
    text += `*PO Rujukan:* ${deposit.poNumber}\n`;
    text += `*No. Pengadaan:* ${deposit.depositNumber}\n`;
    text += `*Tgl:* ${formatDateIndo(deposit.tanggalBayar || new Date().toISOString())}\n\n`;
    text += `*REKAPITULASI NILAI KONTRAK PO:*\n`;
    text += `• Nilai Total Kontrak PO: ${formatRp(totalNilaiPo)}\n`;
    text += `• Total Belanja Kain: ${formatRp(totalBelanjaKain)}\n`;
    text += `• Total Belanja Aksesoris: ${formatRp(totalBelanjaAksesoris)}\n`;
    text += `• *Subtotal:* ${formatRp(totalBelanjaBahan)}\n\n`;
    text += `_Rincian item belanja bahan dapat dilihat pada lembar dokumen pengadaan FOB. Terima kasih!_`;

    navigator.clipboard.writeText(text);
    setCopiedWA(true);
    setTimeout(() => setCopiedWA(false), 3000);
  };

  // ==========================================
  // VIEW MODE: PRINT LEMBAR TAGIHAN TOKO
  // ==========================================
  if (isPrintMode) {
    return createPortal(
      <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 backdrop-blur-xs flex flex-col items-center justify-start p-3 sm:p-6 print:static print:h-auto print:overflow-visible print:block print:p-0 print:bg-white">
        {/* STICKY TOP ACTION TOOLBAR (ALWAYS VISIBLE & FLOATING AT TOP) */}
        <div className="sticky top-2 z-40 w-full max-w-4xl bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200 shadow-xl px-4 sm:px-6 py-3 mb-4 flex flex-wrap items-center justify-between gap-3 print:hidden">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold shrink-0">
              <Printer className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xs sm:text-sm font-bold text-slate-900">
                Lembar Tagihan Belanja Bahan (Direct Transfer Toko)
              </h2>
              <p className="text-[10px] text-slate-500 font-mono">
                {deposit.depositNumber} &bull; {deposit.brand} &bull; {materialItems.length} Item
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handleCopyWA}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer border shadow-xs ${
                copiedWA
                  ? 'bg-emerald-600 text-white border-emerald-600'
                  : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
              }`}
              title="Salin rincian rekening toko ke WhatsApp"
            >
              {copiedWA ? <Check className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
              <span>{copiedWA ? 'Tersalin ke WA!' : 'Salin untuk WA'}</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak / Simpan PDF</span>
            </button>

            <button
              type="button"
              onClick={() => setIsPrintMode(false)}
              className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1"
            >
              <X className="w-4 h-4" />
              <span>Tutup Preview</span>
            </button>
          </div>
        </div>

        {/* DOKUMEN CETAK (PAPER VIEW) */}
        <div
          ref={paperRef}
          id="fob-material-print-sheet"
          className="bg-white rounded-2xl max-w-4xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 text-slate-800 space-y-5 print:shadow-none print:border-none print:p-0 print:m-0 mb-4 font-sans text-xs"
        >
          {/* Header Kop Perusahaan Maison Rayyan Manufacturing */}
          <div className="flex justify-between items-start border-b-2 border-slate-900 pb-3">
            <div className="flex items-center gap-3.5 min-w-0 pr-2">
              <img
                src="/logo-maison-rayyan.png"
                alt="Maison Rayyan Manufacturing"
                className="h-14 sm:h-16 w-auto object-contain shrink-0"
              />
              <div className="min-w-0">
                <h1 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 leading-tight">
                  MAISON RAYYAN MANUFACTURING
                </h1>
                <p className="text-[11px] text-slate-600 mt-0.5">Konveksi & Makloon Garment Terpadu</p>
                <p className="text-[9.5px] text-slate-400">
                  Jl. Industri Makloon No. 88, Bandung • Telp: 0821-2822-4328 • Email: commercial@maisonmrm.co.id
                </p>
              </div>
            </div>

            <div className="text-right shrink-0">
              <span className="bg-slate-900 text-white text-[10px] font-bold px-2.5 py-1 rounded uppercase tracking-wider inline-block">
                RINCIAN PENGADAAN BAHAN FOB
              </span>
              <div className="text-xs font-mono font-bold text-slate-800 mt-1">{deposit.depositNumber}</div>
              <div className="text-[10px] text-slate-500">
                Tgl: {formatDateIndo(deposit.tanggalBayar || new Date().toISOString())}
              </div>
            </div>
          </div>

          {/* INFORMASI PO & BUYER */}
          <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-3 rounded-xl border border-slate-200">
            <div className="space-y-0.5">
              <span className="text-[9.5px] text-slate-400 uppercase font-bold tracking-wider block">
                Ditagihkan Kepada (Buyer / Brand):
              </span>
              <p className="text-sm font-bold text-slate-900 uppercase">{deposit.brand}</p>
              <p className="text-[11px] text-slate-600">
                PO Rujukan: <span className="font-mono font-bold text-indigo-600">{deposit.poNumber}</span>
              </p>
            </div>
            <div className="text-right space-y-0.5">
              <span className="text-[9.5px] text-slate-400 uppercase font-bold tracking-wider block">
                Skema Pengadaan Bahan:
              </span>
              <p className="text-xs font-bold text-indigo-700">Direct Transfer Buyer ke Toko</p>
              <p className="text-[11px] text-slate-500">
                Status:{' '}
                {materialItems.length > 0 && totalItemSudahTf === materialItems.length ? (
                  <span className="font-bold text-emerald-700">Lunas ke Toko</span>
                ) : totalItemSudahTf > 0 ? (
                  <span className="font-bold text-amber-700">
                    Sebagian Ditransfer ({totalItemSudahTf}/{materialItems.length} Lunas)
                  </span>
                ) : (
                  <span className="font-bold text-amber-700">Menunggu Transfer Buyer</span>
                )}
              </p>
            </div>
          </div>

          {/* PENGANTAR */}
          {materialItems.length > 0 && totalItemSudahTf === materialItems.length ? (
            <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl text-xs text-emerald-900 leading-relaxed">
              <p className="font-semibold mb-0.5">Konfirmasi Pembayaran Pengadaan Bahan:</p>
              Seluruh bahan baku di bawah ini telah diverifikasi <strong>Lunas ke Toko</strong> (telah ditransfer langsung oleh buyer ke rekening toko/supplier terkait).
            </div>
          ) : (
            <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl text-xs text-amber-900 leading-relaxed">
              <p className="font-semibold mb-0.5">Instruksi Pembayaran Buyer:</p>
              Bahan baku di bawah ini telah disurvei dan disiapkan oleh pihak konveksi sesuai spesifikasi pesanan PO FOB. Mohon melakukan transfer <strong>langsung ke nomor rekening toko/supplier</strong> yang tercantum di bawah ini agar bahan dapat segera diproses dan dikirim ke gudang konveksi.
            </div>
          )}

          {/* TABEL RINCIAN BELANJA */}
          <div className="border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px] border-b border-slate-200">
                  <th className="py-2.5 px-3 text-center w-12">No</th>
                  <th className="py-2.5 px-3 text-left w-28">Kategori</th>
                  <th className="py-2.5 px-3 text-left">Nama Bahan / Item</th>
                  <th className="py-2.5 px-3 text-right w-28">Qty</th>
                  <th className="py-2.5 px-3 text-right w-32">Harga Satuan</th>
                  <th className="py-2.5 px-3 text-right w-36">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {materialItems.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-slate-400 italic">
                      Belum ada rincian item belanja yang dimasukkan.
                    </td>
                  </tr>
                ) : (
                  materialItems.map((it, idx) => (
                    <tr
                      key={it.id}
                      className="hover:bg-slate-50/50"
                      style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}
                    >
                      <td className="py-2.5 px-3 font-mono text-slate-500 text-center">{idx + 1}</td>
                      <td className="py-2.5 px-3 text-left font-medium text-slate-900">
                        {it.kategori === 'KAIN' ? 'Kain' : 'Aksesoris'}
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-slate-900">{it.namaItem}</td>
                      <td className="py-2.5 px-3 text-right font-medium text-slate-800 whitespace-nowrap tabular-nums">
                        {it.jumlah} {it.satuan}
                      </td>
                      <td className="py-2.5 px-3 text-right text-slate-600 tabular-nums">{formatRp(it.hargaSatuan)}</td>
                      <td className="py-2.5 px-3 text-right font-bold text-slate-900 tabular-nums">{formatRp(it.subtotal)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* SUMMARY BOX FINANSIAL */}
          <div
            className="w-full p-4 bg-indigo-50/50 rounded-xl border border-indigo-100 text-xs space-y-2"
            style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}
          >
            <span className="font-bold text-indigo-900 text-[11px] uppercase tracking-wide block">
              Rekapitulasi Nilai Kontrak PO:
            </span>
            <div className="space-y-1.5 pt-1">
              <div className="flex justify-between text-slate-600 pb-1 border-b border-indigo-100/60">
                <span>Nilai Total Kontrak PO:</span>
                <span className="font-bold text-slate-900">{formatRp(totalNilaiPo)}</span>
              </div>
              <div className="flex justify-between text-slate-600 pb-1 border-b border-indigo-100/60">
                <span>Total Belanja Kain Toko:</span>
                <span className="font-medium text-slate-800">{formatRp(totalBelanjaKain)}</span>
              </div>
              <div className="flex justify-between text-slate-600 pb-1 border-b border-indigo-100/60">
                <span>Total Belanja Aksesoris Toko:</span>
                <span className="font-medium text-slate-800">{formatRp(totalBelanjaAksesoris)}</span>
              </div>
              <div className="flex justify-between text-indigo-900 font-bold border-t border-indigo-200 pt-2 pb-1">
                <span>Subtotal:</span>
                <span className="text-sm text-indigo-700">{formatRp(totalBelanjaBahan)}</span>
              </div>
            </div>
          </div>

          {/* TANDA TANGAN */}
          <div
            className="grid grid-cols-2 gap-8 pt-6 text-center text-xs"
            style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}
          >
            <div>
              <p className="text-slate-500 mb-12">Admin Pengadaan Konveksi,</p>
              <p className="font-bold text-slate-900 border-t border-slate-300 pt-1 mx-12">Bagian Pengadaan Bahan</p>
            </div>
            <div>
              <p className="text-slate-500 mb-12">Diterima & Disetujui Buyer,</p>
              <p className="font-bold text-slate-900 border-t border-slate-300 pt-1 mx-12">{deposit.brand}</p>
            </div>
          </div>
        </div>

        {/* BOTTOM ACTIONS TOOLBAR */}
        <div className="w-full max-w-4xl flex items-center justify-between border-t border-slate-700/50 pt-4 pb-8 print:hidden">
          <p className="text-xs text-slate-400">
            Dokumen resmi rincian pengadaan bahan konveksi KonvekSys
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyWA}
              className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 transition cursor-pointer flex items-center gap-1.5"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Salin untuk WA</span>
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm transition cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak / Simpan PDF</span>
            </button>
            <button
              type="button"
              onClick={() => setIsPrintMode(false)}
              className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-bold transition cursor-pointer"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>,
      document.body
    );
  }

  // ==========================================
  // VIEW MODE: MODAL UTAMA PENGADAAN BAHAN
  // ==========================================
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-100 overflow-hidden">
        {/* HEADER MODAL */}
        <div className="flex items-start justify-between px-6 py-4 border-b border-slate-100 bg-linear-to-r from-indigo-50/80 via-white to-amber-50/40 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-100 shrink-0">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base font-bold text-slate-900">Pendataan Belanja Bahan PO FOB</h2>
                <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200">
                  Direct Payment ke Toko
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Buyer: <strong className="text-slate-800">{deposit.brand}</strong> &bull; No. Pengadaan:{' '}
                <span className="font-mono text-indigo-600 font-bold">{deposit.depositNumber}</span> &bull; PO:{' '}
                <span className="font-mono font-semibold text-slate-700">{deposit.poNumber}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* FINANCIAL SUMMARY CARDS */}
        <div className="p-4 sm:p-5 bg-slate-50/70 border-b border-slate-200/80 grid grid-cols-1 sm:grid-cols-3 gap-3 shrink-0">
          {/* Card 1: Nilai Total Kontrak PO */}
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs space-y-1">
            <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500">
              <span>Nilai Total Kontrak PO</span>
              <FileText className="w-4 h-4 text-indigo-500" />
            </div>
            <div className="text-lg font-bold text-slate-900 tabular-nums">{formatRp(totalNilaiPo)}</div>
            <p className="text-[10px] text-slate-400">Master kontrak pesanan baju jadi</p>
          </div>

          {/* Card 2: Total Belanja Bahan Toko */}
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs space-y-1">
            <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500">
              <span>Belanja Bahan (Kain + Aksesoris)</span>
              <Coins className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-lg font-bold text-indigo-700 tabular-nums">{formatRp(totalBelanjaBahan)}</div>
            <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
              <span className="font-medium text-slate-700">Kain: {formatRp(totalBelanjaKain)}</span>
              <span>&bull;</span>
              <span className="font-medium text-slate-700">Trims: {formatRp(totalBelanjaAksesoris)}</span>
            </div>
          </div>

          {/* Card 3: Estimasi Hak Jasa Konveksi */}
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs space-y-1">
            <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500">
              <span>Sisa Hak Jasa Konveksi (CMT)</span>
              <Scissors className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-lg font-bold text-emerald-700 tabular-nums">{formatRp(sisaHakJasaPo)}</div>
            <p className="text-[10px] text-slate-400">Ditagih saat kirim barang jadi (Surat Jalan)</p>
          </div>
        </div>

        {/* BODY WORKSPACE */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {/* Action & Filter Bar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              <button
                type="button"
                onClick={() => setCategoryFilter('ALL')}
                className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                  categoryFilter === 'ALL' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Semua Bahan ({materialItems.length})
              </button>
              <button
                type="button"
                onClick={() => setCategoryFilter('KAIN')}
                className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer flex items-center gap-1 ${
                  categoryFilter === 'KAIN' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Kain ({materialItems.filter((i) => i.kategori === 'KAIN').length})</span>
              </button>
              <button
                type="button"
                onClick={() => setCategoryFilter('AKSESORIS')}
                className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer flex items-center gap-1 ${
                  categoryFilter === 'AKSESORIS' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Aksesoris & Trims ({materialItems.filter((i) => i.kategori === 'AKSESORIS').length})</span>
              </button>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setIsPrintMode(true)}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                title="Cetak lembar rincian tagihan belanja untuk dikirim ke buyer"
              >
                <Printer className="w-3.5 h-3.5 text-slate-600" />
                <span>Cetak / Bagikan ke Buyer</span>
              </button>

              {!isAddingNew && !editingItemId && (
                <button
                  type="button"
                  onClick={() => {
                    resetItemForm();
                    setIsAddingNew(true);
                  }}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-xs transition cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Tambah Item Belanja</span>
                </button>
              )}
            </div>
          </div>

          {/* FORM TAMBAH / EDIT ITEM BELANJA */}
          {(isAddingNew || editingItemId) && (
            <div className="p-4 bg-indigo-50/40 rounded-xl border-2 border-indigo-200/80 space-y-4 animate-in fade-in duration-150">
              <div className="flex items-center justify-between border-b border-indigo-100 pb-2">
                <span className="text-xs font-bold text-indigo-900 uppercase tracking-wide flex items-center gap-1.5">
                  <Edit2 className="w-3.5 h-3.5 text-indigo-600" />
                  {editingItemId ? 'Edit Item Belanja Bahan' : 'Tambah Rincian Item Belanja Baru'}
                </span>
                <button
                  type="button"
                  onClick={resetItemForm}
                  className="text-slate-400 hover:text-slate-600 text-xs font-semibold"
                >
                  Batal
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 text-xs">
                {/* Kategori Bahan */}
                <div className="sm:col-span-3">
                  <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                    Kategori Bahan <span className="text-rose-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setFormKategori('KAIN');
                        if (formSatuan === 'pcs') setFormSatuan('kg');
                      }}
                      className={`py-1.5 rounded-lg font-bold text-xs text-center border transition cursor-pointer ${
                        formKategori === 'KAIN'
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      Kain
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setFormKategori('AKSESORIS');
                        if (formSatuan === 'kg') setFormSatuan('pcs');
                      }}
                      className={`py-1.5 rounded-lg font-bold text-xs text-center border transition cursor-pointer ${
                        formKategori === 'AKSESORIS'
                          ? 'bg-purple-600 text-white border-purple-600 shadow-2xs'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      Aksesoris
                    </button>
                  </div>
                </div>

                {/* Nama Bahan / Artikel */}
                <div className="sm:col-span-5">
                  <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                    Nama Bahan / Item <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formNamaItem}
                    onChange={(e) => setFormNamaItem(e.target.value)}
                    placeholder={formKategori === 'KAIN' ? 'Contoh: Cotton Fleece Heavy 330gsm Hitam' : 'Contoh: Resleting YKK Besi 5 inch / Kancing Grafir'}
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:border-indigo-500 outline-none"
                  />
                </div>

                {/* Toko / Supplier */}
                <div className="sm:col-span-4">
                  <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                    Nama Toko / Supplier <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formTokoSupplier}
                    onChange={(e) => setFormTokoSupplier(e.target.value)}
                    placeholder="Contoh: Toko Bahan Dunia Mas"
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:border-indigo-500 outline-none"
                  />
                </div>

                {/* No Rekening Toko (Tujuan Transfer Buyer) */}
                <div className="sm:col-span-6">
                  <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                    Rekening Toko Tujuan Transfer Buyer (Bank, No. Rek, A/N)
                  </label>
                  <input
                    type="text"
                    value={formNoRekeningToko}
                    onChange={(e) => setFormNoRekeningToko(e.target.value)}
                    placeholder="Contoh: BCA 1234567890 a/n PT Dunia Mas"
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:border-indigo-500 outline-none"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    Akan dicetak di lembar tagihan agar buyer bisa langsung transfer ke toko ini.
                  </span>
                </div>

                {/* Qty & Satuan */}
                <div className="sm:col-span-3">
                  <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                    Jumlah & Satuan <span className="text-rose-500">*</span>
                  </label>
                  <div className="flex gap-1">
                    <input
                      type="number"
                      min={0.1}
                      step="any"
                      value={formJumlah}
                      onChange={(e) => setFormJumlah(parseFloat(e.target.value) || 0)}
                      className="w-20 px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-800 focus:border-indigo-500 outline-none text-right"
                    />
                    <select
                      value={formSatuan}
                      onChange={(e) => setFormSatuan(e.target.value)}
                      className="flex-1 px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 outline-none"
                    >
                      <option value="kg">kg</option>
                      <option value="yard">yard</option>
                      <option value="meter">meter</option>
                      <option value="pcs">pcs</option>
                      <option value="roll">roll</option>
                      <option value="gross">gross</option>
                      <option value="lusin">lusin</option>
                      <option value="pack">pack</option>
                      <option value="set">set</option>
                    </select>
                  </div>
                </div>

                {/* Harga Satuan & Subtotal */}
                <div className="sm:col-span-3">
                  <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                    Harga / Satuan <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-1.5 text-xs text-slate-400 font-semibold">Rp</span>
                    <input
                      type="text"
                      value={formatRupiahInput(formHargaSatuan)}
                      onChange={(e) => setFormHargaSatuan(parseRupiahInput(e.target.value))}
                      placeholder="0"
                      className="w-full pl-8 pr-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-800 focus:border-indigo-500 outline-none text-right"
                    />
                  </div>
                  <div className="text-[10px] text-indigo-700 font-bold mt-1 text-right">
                    Subtotal: {formatRp(Math.round(formJumlah * formHargaSatuan))}
                  </div>
                </div>

                {/* Upload Foto Nota Toko */}
                <div className="sm:col-span-6">
                  <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                    Foto Nota / Bon Toko
                  </label>
                  <div className="flex items-center gap-2">
                    <label className="px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg font-semibold text-xs text-slate-700 cursor-pointer flex items-center gap-1.5 shadow-2xs">
                      <Upload className="w-3.5 h-3.5 text-indigo-600" />
                      <span>{formNotaTokoUrl ? 'Ganti Nota' : 'Upload Nota Toko'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const compressed = await processImageFile(file);
                            setFormNotaTokoUrl(compressed);
                          }
                        }}
                      />
                    </label>
                    {formNotaTokoUrl && (
                      <button
                        type="button"
                        onClick={() => setImagePreview({ url: formNotaTokoUrl, title: `Nota: ${formNamaItem}` })}
                        className="px-2 py-1 bg-indigo-50 text-indigo-700 rounded text-[11px] font-bold flex items-center gap-1 border border-indigo-200"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Lihat Nota</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Status Bayar Buyer & Upload Bukti Transfer */}
                <div className="sm:col-span-6">
                  <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                    Status Transfer Buyer ke Toko
                  </label>
                  <div className="flex items-center gap-3">
                    <label className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-800 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formStatusBayarBuyer === 'SUDAH_DITRANSFER'}
                        onChange={(e) => setFormStatusBayarBuyer(e.target.checked ? 'SUDAH_DITRANSFER' : 'BELUM_DITRANSFER')}
                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                      />
                      <span>Buyer Sudah Transfer ke Toko</span>
                    </label>

                    {formStatusBayarBuyer === 'SUDAH_DITRANSFER' && (
                      <label className="px-2.5 py-1 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg font-semibold text-[11px] text-slate-700 cursor-pointer flex items-center gap-1 shadow-2xs">
                        <Upload className="w-3 h-3 text-emerald-600" />
                        <span>{formBuktiTransferTokoUrl ? 'Ganti Struk' : 'Upload Struk Transfer'}</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const compressed = await processImageFile(file);
                              setFormBuktiTransferTokoUrl(compressed);
                            }
                          }}
                        />
                      </label>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons Form */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-indigo-100">
                <button
                  type="button"
                  onClick={resetItemForm}
                  className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-xs transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleSaveItem}
                  disabled={isSaving}
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold rounded-lg text-xs flex items-center gap-1.5 shadow-sm transition cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>{isSaving ? 'Menyimpan...' : 'Simpan Item Belanja'}</span>
                </button>
              </div>
            </div>
          )}

          {/* TABEL ITEM BELANJA BAHAN */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50/90 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-3">Kategori</th>
                    <th className="py-3 px-3">Nama Bahan & Toko</th>
                    <th className="py-3 px-3 text-right">Volume</th>
                    <th className="py-3 px-3 text-right">Harga Satuan</th>
                    <th className="py-3 px-3 text-right">Subtotal</th>
                    <th className="py-3 px-3 text-center">Nota Toko</th>
                    <th className="py-3 px-3">Transfer Buyer</th>
                    <th className="py-3 px-3">Fisik di Gudang</th>
                    <th className="py-3 px-3 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {filteredItems.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-10 text-center text-slate-400">
                        <ShoppingBag className="w-9 h-9 mx-auto text-slate-300 mb-2 stroke-1" />
                        Belum ada item belanja bahan yang dicatat. Klik{' '}
                        <strong className="text-indigo-600 font-bold">+ Tambah Item Belanja</strong> untuk memulai.
                      </td>
                    </tr>
                  ) : (
                    filteredItems.map((item) => (
                      <tr key={item.id} className="hover:bg-indigo-50/20 transition-colors">
                        {/* Kategori */}
                        <td className="py-3 px-3 align-top whitespace-nowrap">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                              item.kategori === 'KAIN'
                                ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                                : 'bg-purple-50 text-purple-700 border-purple-200'
                            }`}
                          >
                            {item.kategori === 'KAIN' ? 'Kain' : 'Aksesoris'}
                          </span>
                        </td>

                        {/* Nama Bahan & Toko */}
                        <td className="py-3 px-3 align-top">
                          <div className="font-bold text-slate-900 text-xs">{item.namaItem}</div>
                          <div className="text-[11px] text-slate-600 flex items-center gap-1 mt-0.5">
                            <Building2 className="w-3 h-3 text-slate-400 shrink-0" />
                            <span>{item.tokoSupplier}</span>
                          </div>
                          {item.noRekeningToko && (
                            <div className="text-[10px] font-mono text-indigo-600 font-semibold truncate max-w-[200px] mt-0.5">
                              Rek: {item.noRekeningToko}
                            </div>
                          )}
                          {item.catatan && (
                            <div className="text-[10px] text-slate-400 italic mt-0.5">{item.catatan}</div>
                          )}
                        </td>

                        {/* Volume */}
                        <td className="py-3 px-3 text-right align-top whitespace-nowrap font-medium text-slate-800">
                          {item.jumlah} <span className="text-[10px] text-slate-500 font-normal">{item.satuan}</span>
                        </td>

                        {/* Harga Satuan */}
                        <td className="py-3 px-3 text-right align-top whitespace-nowrap text-slate-600">
                          {formatRp(item.hargaSatuan)}
                        </td>

                        {/* Subtotal */}
                        <td className="py-3 px-3 text-right align-top whitespace-nowrap font-bold text-slate-900 tabular-nums">
                          {formatRp(item.subtotal)}
                        </td>

                        {/* Nota Toko */}
                        <td className="py-3 px-3 align-top text-center whitespace-nowrap">
                          {item.notaTokoUrl ? (
                            <button
                              type="button"
                              onClick={() => setImagePreview({ url: item.notaTokoUrl!, title: `Nota: ${item.namaItem}` })}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-[10px] border border-indigo-200 transition cursor-pointer"
                              title="Lihat foto nota dari toko"
                            >
                              <ImageIcon className="w-3 h-3" />
                              <span>Nota</span>
                            </button>
                          ) : (
                            <span className="text-[10px] text-slate-300">-</span>
                          )}
                        </td>

                        {/* Status Transfer Buyer */}
                        <td className="py-3 px-3 align-top whitespace-nowrap">
                          {item.statusBayarBuyer === 'SUDAH_DITRANSFER' ? (
                            <div className="space-y-1">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 font-bold rounded-full text-[10px] border border-emerald-200">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                <span>Lunas ke Toko</span>
                              </span>
                              {item.buktiTransferTokoUrl && (
                                <div>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setImagePreview({
                                        url: item.buktiTransferTokoUrl!,
                                        title: `Struk Transfer Buyer: ${item.namaItem}`,
                                      })
                                    }
                                    className="text-[10px] text-emerald-700 hover:underline flex items-center gap-1 font-semibold"
                                  >
                                    <ImageIcon className="w-3 h-3" />
                                    <span>Lihat Struk TF</span>
                                  </button>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="space-y-1">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-700 font-bold rounded-full text-[10px] border border-amber-200">
                                <Clock className="w-3 h-3 text-amber-600" />
                                <span>Menunggu Transfer</span>
                              </span>
                              <div>
                                <button
                                  type="button"
                                  onClick={() => handleToggleTransferStatus(item)}
                                  className="text-[10px] text-indigo-600 hover:text-indigo-800 hover:underline font-bold"
                                >
                                  Tandai Sudah TF
                                </button>
                              </div>
                            </div>
                          )}
                        </td>

                        {/* Status Fisik Gudang */}
                        <td className="py-3 px-3 align-top whitespace-nowrap">
                          {item.statusFisik === 'DITERIMA_GUDANG' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 font-bold rounded-full text-[10px] border border-emerald-200">
                              <PackageCheck className="w-3 h-3 text-emerald-600" />
                              <span>Di Gudang</span>
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleReceivePhysical(item)}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 font-bold text-[10px] border border-slate-200 hover:border-emerald-300 transition cursor-pointer shadow-2xs"
                              title="Konfirmasi barang sudah sampai di konveksi & masukkan ke stok"
                            >
                              <PackageCheck className="w-3 h-3 text-slate-500" />
                              <span>Terima ke Gudang</span>
                            </button>
                          )}
                        </td>

                        {/* Aksi */}
                        <td className="py-3 px-3 align-top text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(item)}
                              className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition cursor-pointer"
                              title="Edit item belanja"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteItem(item.id)}
                              className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition cursor-pointer"
                              title="Hapus item belanja"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* FOOTER MODAL */}
        <div className="px-6 py-3.5 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs shrink-0">
          <div className="text-slate-500">
            Total {materialItems.length} item bahan tercatat &bull;{' '}
            <span className="font-semibold text-emerald-700">{totalItemSudahTf} Lunas ke Toko</span>,{' '}
            <span className="font-semibold text-amber-700">{totalItemBelumTf} Menunggu Transfer</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-xs shadow-xs transition cursor-pointer"
          >
            Selesai & Tutup
          </button>
        </div>
      </div>

      {/* MODAL ZOOM PREVIEW GAMBAR (NOTA / STRUK) */}
      {imagePreview && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-4 space-y-3 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="font-bold text-xs text-slate-800">{imagePreview.title}</span>
              <button
                type="button"
                onClick={() => setImagePreview(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="max-h-[75vh] overflow-auto flex items-center justify-center bg-slate-50 rounded-xl p-2">
              <img src={imagePreview.url} alt="Preview" className="max-w-full max-h-[70vh] object-contain rounded-lg shadow" />
            </div>
          </div>
        </div>
      )}
    </div>,
    document.body
  );
};
