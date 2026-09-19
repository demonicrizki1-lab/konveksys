import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { SuratJalan, SuratJalanItem, SizeBreakdown, SPKCutting } from '../../types';
import { formatDateIndo } from '../../utils/formatters';
import { printIsolatedDocument } from '../../utils/printHelper';
import { ConfirmModal } from '../common/ConfirmModal';
import {
  Truck,
  Plus,
  Search,
  CheckCircle2,
  AlertTriangle,
  FileText,
  X,
  Eye,
  ShieldCheck,
  Trash2,
  Printer,
  Package,
  Layers,
  Sparkles,
  ArrowRight,
  Check,
  Edit2,
} from 'lucide-react';

interface ArticleOption {
  id?: string;
  produk: string;
  vendor: string;
  sourcePOId?: string | null;
  sourcePONumber?: string | null;
}

const emptySizeBreakdown = (): SizeBreakdown => ({
  s: 0,
  m: 0,
  l: 0,
  xl: 0,
  xxl: 0,
  anak4: 0,
  anak6: 0,
  anak8: 0,
  anak10: 0,
  anak12: 0,
  anak14: 0,
  anak16: 0,
});

const calculateTotalPcs = (sz: SizeBreakdown): number => {
  return (
    (sz.s || 0) +
    (sz.m || 0) +
    (sz.l || 0) +
    (sz.xl || 0) +
    (sz.xxl || 0) +
    (sz.anak4 || 0) +
    (sz.anak6 || 0) +
    (sz.anak8 || 0) +
    (sz.anak10 || 0) +
    (sz.anak12 || 0) +
    (sz.anak14 || 0) +
    (sz.anak16 || 0)
  );
};

const SIZE_DISPLAY_ORDER: { key: keyof SizeBreakdown; label: string }[] = [
  { key: 's', label: 'S' },
  { key: 'm', label: 'M' },
  { key: 'l', label: 'L' },
  { key: 'xl', label: 'XL' },
  { key: 'xxl', label: '2XL' },
  { key: 'anak4', label: 'Anak 4' },
  { key: 'anak6', label: 'Anak 6' },
  { key: 'anak8', label: 'Anak 8' },
  { key: 'anak10', label: 'Anak 10' },
  { key: 'anak12', label: 'Anak 12' },
  { key: 'anak14', label: 'Anak 14' },
  { key: 'anak16', label: 'Anak 16' },
];

export const OutboundView: React.FC = () => {
  const {
    suratJalanList,
    createSuratJalan,
    updateSuratJalan,
    deleteSuratJalan,
    getSuratJalanItems,
    spkList,
    getSPKRemainingQty,
    userRole,
    activeBrand,
    inboundRolls,
    brands,
    vendors,
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [brandFilter, setBrandFilter] = useState(userRole === 'BRAND' ? activeBrand : 'ALL');

  // Modal State for Create / Edit Surat Jalan
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingSJ, setEditingSJ] = useState<SuratJalan | null>(null);
  const [editingDraftIndex, setEditingDraftIndex] = useState<number | null>(null);
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    sj?: SuratJalan;
    isBlocked?: boolean;
    blockMessage?: string;
  }>({ isOpen: false });
  const [isDeleting, setIsDeleting] = useState(false);

  const [selectedBrand, setSelectedBrand] = useState<string>('NAMI');
  const [driverName, setDriverName] = useState('Pak Wardi');
  const [nomorKendaraan, setNomorKendaraan] = useState('D 1829 XYZ');
  const [tanggalKirim, setTanggalKirim] = useState<string>(new Date().toISOString().split('T')[0]);
  const [catatan, setCatatan] = useState('');

  // Multi-Item Draft List (Items currently in the cargo of this Surat Jalan)
  const [draftItems, setDraftItems] = useState<SuratJalanItem[]>([]);

  // Selected SPK in sub-form
  const [selectedSPKId, setSelectedSPKId] = useState<string>('');
  
  // Selected Article within the SPK
  const [selectedArticleName, setSelectedArticleName] = useState<string>('');
  const [selectedArticleVendor, setSelectedArticleVendor] = useState<string>('');
  const [selectedSpkItemId, setSelectedSpkItemId] = useState<string>('');
  const [customJenisKain, setCustomJenisKain] = useState<string>('');
  const [qtySend, setQtySend] = useState<SizeBreakdown>(emptySizeBreakdown());

  // Mode Muatan: 'SPK' (dari cutting) vs 'MANUAL' (PO Lama / Non-SPK)
  const [cargoSourceMode, setCargoSourceMode] = useState<'SPK' | 'MANUAL'>('SPK');
  const [manualVendor, setManualVendor] = useState<string>('');
  const [manualProduk, setManualProduk] = useState<string>('');
  const [manualJenisKain, setManualJenisKain] = useState<string>('');
  const [manualPoNumber, setManualPoNumber] = useState<string>('');

  // Modal State for View / Print Detail Surat Jalan
  const [selectedSJDetail, setSelectedSJDetail] = useState<SuratJalan | null>(null);
  const printPaperRef = useRef<HTMLDivElement>(null);

  // Helper function for SPK Fabric info
  const getSPKFabricName = (spk: SPKCutting) => {
    if (spk.fabricSourceType === 'TITIPAN_VENDOR' && spk.depositInfo) {
      return `${spk.depositInfo.jenisKain}${spk.depositInfo.warna ? ` (${spk.depositInfo.warna})` : ''} [Titipan Vendor]`;
    }
    if (!spk.rollIds || spk.rollIds.length === 0) return '';
    const matchedRolls = inboundRolls.filter((r) => spk.rollIds.includes(r.id));
    if (matchedRolls.length === 0) return '';
    const names = Array.from(new Set(matchedRolls.map((r) => r.jenisKain).filter(Boolean)));
    return names.join(', ');
  };

  // Helper to extract article options from an SPK (supports spk.items and spk.produk with "+")
  const getArticlesForSPK = (spk?: SPKCutting): ArticleOption[] => {
    if (!spk) return [];
    if (spk.items && spk.items.length > 0) {
      return spk.items.map((it) => ({
        id: it.id,
        produk: it.produk,
        vendor: it.vendor || spk.vendor,
        sourcePOId: it.sourcePOId || spk.sourcePOId || null,
        sourcePONumber: it.sourcePONumber || spk.sourcePONumber || null,
      }));
    }
    if (spk.produk && spk.produk.includes('+')) {
      return spk.produk
        .split('+')
        .map((p, idx) => ({
          id: `part-${idx}`,
          produk: p.trim(),
          vendor: spk.vendor,
          sourcePOId: spk.sourcePOId || null,
          sourcePONumber: spk.sourcePONumber || null,
        }))
        .filter((p) => Boolean(p.produk));
    }
    return [
      {
        id: undefined,
        produk: spk.produk,
        vendor: spk.vendor,
        sourcePOId: spk.sourcePOId || null,
        sourcePONumber: spk.sourcePONumber || null,
      },
    ];
  };

  // Active SPKs available for the selected brand (include linked SPKs when editing)
  const activeSPKsForBrand = spkList.filter((s) => {
    if (s.brand !== selectedBrand) return false;
    if (s.status !== 'COMPLETED') return true;
    if (editingSJ && (editingSJ.spkId === s.id || editingSJ.spkId === s.spkNumber)) return true;
    if (draftItems.some((it) => it.spkId === s.id || it.spkId === s.spkNumber)) return true;
    return false;
  });

  const currentSPK = spkList.find((s) => s.id === selectedSPKId) || activeSPKsForBrand[0];
  const availableArticles = getArticlesForSPK(currentSPK);

  // Remaining and Target calculation for currently selected article
  const currentRemaining = currentSPK
    ? getSPKRemainingQty(currentSPK, selectedSpkItemId || selectedArticleName)
    : null;

  const currentTargetCut = currentSPK?.items?.find(
    (it) => it.id === selectedSpkItemId || it.produk.trim().toUpperCase() === selectedArticleName.trim().toUpperCase()
  )?.targetCutQty || currentSPK?.targetCutQty || null;

  const currentDelivered: SizeBreakdown | null = currentTargetCut && currentRemaining
    ? (['s', 'm', 'l', 'xl', 'xxl', 'anak4', 'anak6', 'anak8', 'anak10', 'anak12', 'anak14', 'anak16'] as (keyof SizeBreakdown)[]).reduce<SizeBreakdown>(
        (acc, sz) => {
          acc[sz] = Math.max(0, (currentTargetCut[sz] || 0) - (currentRemaining[sz] || 0));
          return acc;
        },
        emptySizeBreakdown()
      )
    : currentSPK?.items?.find(
        (it) => it.id === selectedSpkItemId || it.produk.trim().toUpperCase() === selectedArticleName.trim().toUpperCase()
      )?.deliveredQty || currentSPK?.deliveredQty || null;

  const currentSendingPcs = calculateTotalPcs(qtySend);

  // Setup initial selection when changing SPK
  const selectSPK = (spkId: string) => {
    setSelectedSPKId(spkId);
    const spk = spkList.find((s) => s.id === spkId);
    const articles = getArticlesForSPK(spk);
    if (articles.length > 0) {
      setSelectedArticleName(articles[0].produk);
      setSelectedArticleVendor(articles[0].vendor);
      setSelectedSpkItemId(articles[0].id || '');
    } else {
      setSelectedArticleName(spk?.produk || '');
      setSelectedArticleVendor(spk?.vendor || '');
      setSelectedSpkItemId('');
    }
    if (spk) {
      setCustomJenisKain(getSPKFabricName(spk) || 'Kain Standar');
    }
    setQtySend(emptySizeBreakdown());
  };

  // Setup initial selection when changing article
  const selectArticle = (article: ArticleOption) => {
    setSelectedArticleName(article.produk);
    setSelectedArticleVendor(article.vendor);
    setSelectedSpkItemId(article.id || '');
    setQtySend(emptySizeBreakdown());
  };

  // Open Create Modal
  const handleOpenCreate = () => {
    setEditingSJ(null);
    setEditingDraftIndex(null);
    const initialBrand = userRole === 'BRAND' ? activeBrand : 'NAMI';
    setSelectedBrand(initialBrand);

    const availableSpks = spkList.filter((s) => s.brand === initialBrand && s.status !== 'COMPLETED');
    if (availableSpks.length > 0) {
      selectSPK(availableSpks[0].id);
    } else {
      setSelectedSPKId('');
      setSelectedArticleName('');
      setSelectedArticleVendor('');
      setSelectedSpkItemId('');
      setCustomJenisKain('');
    }

    setDriverName('Pak Wardi');
    setNomorKendaraan('D 1829 XYZ');
    setTanggalKirim(new Date().toISOString().split('T')[0]);
    setCatatan('');
    setDraftItems([]);
    setQtySend(emptySizeBreakdown());
    setCargoSourceMode('SPK');
    setManualVendor(vendors && vendors.length > 0 ? vendors[0].name : '');
    setManualProduk('');
    setManualJenisKain('');
    setManualPoNumber('');
    setIsCreateModalOpen(true);
  };

  // Open Edit Modal for Existing Surat Jalan
  const handleOpenEdit = (sj: SuratJalan) => {
    setEditingSJ(sj);
    setEditingDraftIndex(null);
    setSelectedBrand(sj.brand);
    setDriverName(sj.driverName || '');
    setNomorKendaraan(sj.nomorKendaraan || '');
    setTanggalKirim(sj.tanggal ? sj.tanggal.split('T')[0] : new Date().toISOString().split('T')[0]);
    setCatatan(sj.catatan || '');

    const items = getSuratJalanItems(sj);
    setDraftItems([...items]);
    setQtySend(emptySizeBreakdown());

    const availableSpks = spkList.filter(
      (s) =>
        s.brand === sj.brand &&
        (s.status !== 'COMPLETED' ||
          s.id === sj.spkId ||
          s.spkNumber === sj.spkId ||
          items.some((it) => it.spkId === s.id || it.spkId === s.spkNumber))
    );
    if (availableSpks.length > 0) {
      selectSPK(availableSpks[0].id);
    } else {
      setSelectedSPKId('');
      setSelectedArticleName('');
      setSelectedArticleVendor('');
      setSelectedSpkItemId('');
      setCustomJenisKain('');
    }
    setCargoSourceMode('SPK');
    setManualVendor(vendors && vendors.length > 0 ? vendors[0].name : '');
    setManualProduk('');
    setManualJenisKain('');
    setManualPoNumber('');
    setIsCreateModalOpen(true);
  };

  // Change Brand in Modal (Filter SPK yang ingin dimuat)
  const handleBrandChange = (brand: string) => {
    setSelectedBrand(brand);
    const availableSpks = spkList.filter((s) => s.brand === brand && s.status !== 'COMPLETED');
    if (availableSpks.length > 0) {
      selectSPK(availableSpks[0].id);
    } else {
      setSelectedSPKId('');
      setSelectedArticleName('');
      setSelectedArticleVendor('');
      setSelectedSpkItemId('');
      setCustomJenisKain('');
    }
    // PERBAIKAN: Jangan hapus draftItems! Pertahankan muatan yang sudah ditambahkan dari brand lain
    setQtySend(emptySizeBreakdown());
  };

  // Add Item to Draft Cargo List
  const handleAddItemToDraft = () => {
    if (cargoSourceMode === 'MANUAL') {
      if (!manualProduk.trim()) {
        alert('Harap masukkan Nama Produk / Artikel untuk muatan Non-SPK!');
        return;
      }
      if (!manualVendor) {
        alert('Harap pilih Mitra Konveksi (Vendor Penjahit)!');
        return;
      }
      if (currentSendingPcs <= 0) {
        alert(`Harap masukkan kuantiti minimal 1 pcs untuk artikel "${manualProduk}"!`);
        return;
      }

      const newItem: SuratJalanItem = {
        id: `draft-manual-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        spkId: undefined,
        spkNumber: manualPoNumber.trim() ? `PO LAMA: ${manualPoNumber.trim()}` : 'PO LAMA',
        isManual: true,
        legacyPoNumber: manualPoNumber.trim() || undefined,
        brand: selectedBrand,
        produk: manualProduk.trim().toUpperCase(),
        vendor: manualVendor,
        jenisKain: manualJenisKain.trim() || 'Kain Standar (PO Lama)',
        qtyDelivered: { ...qtySend },
        totalPcs: currentSendingPcs,
      };

      if (editingDraftIndex !== null) {
        setDraftItems((prev) => {
          const next = [...prev];
          next[editingDraftIndex] = newItem;
          return next;
        });
        setEditingDraftIndex(null);
        setQtySend(emptySizeBreakdown());
        setManualProduk('');
        setManualJenisKain('');
        return;
      }

      setDraftItems((prev) => [...prev, newItem]);
      setQtySend(emptySizeBreakdown());
      setManualProduk('');
      setManualJenisKain('');
      return;
    }

    if (!currentSPK) {
      alert('Silakan pilih SPK terlebih dahulu.');
      return;
    }

    if (currentSendingPcs <= 0) {
      alert(`Harap masukkan kuantiti minimal 1 pcs untuk artikel "${selectedArticleName}"!`);
      return;
    }

    const matchedItem = currentSPK.items?.find(
      (it) =>
        (selectedSpkItemId && it.id === selectedSpkItemId) ||
        it.produk.trim().toUpperCase() === selectedArticleName.trim().toUpperCase()
    );

    const newItem: SuratJalanItem = {
      id: `draft-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      spkId: currentSPK.id,
      spkNumber: currentSPK.spkNumber,
      spkItemId: selectedSpkItemId || undefined,
      brand: currentSPK.brand || selectedBrand,
      produk: selectedArticleName,
      vendor: selectedArticleVendor || currentSPK.vendor,
      jenisKain: customJenisKain || getSPKFabricName(currentSPK) || 'Kain Standar',
      qtyDelivered: { ...qtySend },
      totalPcs: currentSendingPcs,
      sourcePOId: matchedItem?.sourcePOId || currentSPK.sourcePOId || undefined,
      sourcePONumber: matchedItem?.sourcePONumber || currentSPK.sourcePONumber || undefined,
    };

    if (editingDraftIndex !== null) {
      setDraftItems((prev) => {
        const next = [...prev];
        next[editingDraftIndex] = newItem;
        return next;
      });
      setEditingDraftIndex(null);
      setQtySend(emptySizeBreakdown());
      return;
    }

    setDraftItems((prev) => [...prev, newItem]);
    setQtySend(emptySizeBreakdown());

    // Auto-advance to next article if available in this SPK
    const currentIdx = availableArticles.findIndex(
      (a) => a.produk.trim().toUpperCase() === selectedArticleName.trim().toUpperCase()
    );
    if (currentIdx !== -1 && currentIdx + 1 < availableArticles.length) {
      const nextArt = availableArticles[currentIdx + 1];
      selectArticle(nextArt);
    }
  };

  // Edit an item inside draft cargo
  const handleEditDraftItem = (index: number) => {
    const item = draftItems[index];
    if (!item) return;
    setEditingDraftIndex(index);
    if (item.isManual) {
      setCargoSourceMode('MANUAL');
      setManualVendor(item.vendor || (vendors && vendors[0] ? vendors[0].name : ''));
      setManualProduk(item.produk || '');
      setManualJenisKain(item.jenisKain || '');
      setManualPoNumber(item.legacyPoNumber || '');
      setQtySend({ ...item.qtyDelivered });
    } else {
      setCargoSourceMode('SPK');
      if (item.spkId) {
        setSelectedSPKId(item.spkId);
        setSelectedArticleName(item.produk);
        setSelectedArticleVendor(item.vendor);
        setSelectedSpkItemId(item.spkItemId || '');
        setCustomJenisKain(item.jenisKain || '');
      }
      setQtySend({ ...item.qtyDelivered });
    }
  };

  const handleCancelEditDraftItem = () => {
    setEditingDraftIndex(null);
    setQtySend(emptySizeBreakdown());
  };

  // Remove Item from Draft Cargo List
  const handleRemoveDraftItem = (index: number) => {
    if (editingDraftIndex === index) {
      setEditingDraftIndex(null);
      setQtySend(emptySizeBreakdown());
    }
    setDraftItems((prev) => prev.filter((_, i) => i !== index));
  };

  // Total Pcs of All Draft Items
  const grandTotalDraftPcs = draftItems.reduce((acc, item) => acc + item.totalPcs, 0);

  // Filtered Surat Jalan list for table
  const filteredSJ = suratJalanList.filter((sj) => {
    const effectiveBrand = userRole === 'BRAND' ? activeBrand : brandFilter;
    const items = getSuratJalanItems(sj);
    const matchBrand =
      effectiveBrand === 'ALL' ||
      sj.brand === effectiveBrand ||
      sj.brand.split(',').map((b) => b.trim()).includes(effectiveBrand) ||
      items.some((it) => it.brand === effectiveBrand);
    const searchLow = searchTerm.toLowerCase();

    const matchSearch =
      sj.noSuratJalan.toLowerCase().includes(searchLow) ||
      (sj.brand && sj.brand.toLowerCase().includes(searchLow)) ||
      (sj.produk && sj.produk.toLowerCase().includes(searchLow)) ||
      (sj.vendor && sj.vendor.toLowerCase().includes(searchLow)) ||
      (sj.driverName && sj.driverName.toLowerCase().includes(searchLow)) ||
      (sj.nomorKendaraan && sj.nomorKendaraan.toLowerCase().includes(searchLow)) ||
      items.some(
        (it) =>
          it.produk.toLowerCase().includes(searchLow) ||
          it.vendor.toLowerCase().includes(searchLow) ||
          (it.brand && it.brand.toLowerCase().includes(searchLow)) ||
          (it.jenisKain && it.jenisKain.toLowerCase().includes(searchLow))
      );

    return matchBrand && matchSearch;
  });

  // Submit and Create Surat Jalan
  const handleSaveSJ = async (e: React.FormEvent) => {
    e.preventDefault();

    let finalItems = [...draftItems];

    // If no draft items yet, but user filled quantities in the current form, auto-add it
    if (finalItems.length === 0 && currentSendingPcs > 0) {
      if (cargoSourceMode === 'MANUAL' && manualProduk.trim() && manualVendor) {
        finalItems.push({
          id: `draft-manual-${Date.now()}`,
          spkId: undefined,
          spkNumber: manualPoNumber.trim() ? `PO LAMA: ${manualPoNumber.trim()}` : 'PO LAMA',
          isManual: true,
          legacyPoNumber: manualPoNumber.trim() || undefined,
          brand: selectedBrand,
          produk: manualProduk.trim().toUpperCase(),
          vendor: manualVendor,
          jenisKain: manualJenisKain.trim() || 'Kain Standar (PO Lama)',
          qtyDelivered: { ...qtySend },
          totalPcs: currentSendingPcs,
        });
      } else if (currentSPK) {
        const matchedItem = currentSPK.items?.find(
          (it) =>
            (selectedSpkItemId && it.id === selectedSpkItemId) ||
            it.produk.trim().toUpperCase() === selectedArticleName.trim().toUpperCase()
        );
        finalItems.push({
          id: `draft-${Date.now()}`,
          spkId: currentSPK.id,
          spkNumber: currentSPK.spkNumber,
          spkItemId: selectedSpkItemId || undefined,
          brand: currentSPK.brand || selectedBrand,
          produk: selectedArticleName,
          vendor: selectedArticleVendor || currentSPK.vendor,
          jenisKain: customJenisKain || getSPKFabricName(currentSPK) || 'Kain Standar',
          qtyDelivered: { ...qtySend },
          totalPcs: currentSendingPcs,
          sourcePOId: matchedItem?.sourcePOId || currentSPK.sourcePOId || undefined,
          sourcePONumber: matchedItem?.sourcePONumber || currentSPK.sourcePONumber || undefined,
        });
      }
    }

    if (finalItems.length === 0) {
      alert('Surat Jalan harus memuat minimal 1 artikel produk. Masukkan kuantiti ukuran lalu klik "+ Tambahkan Artikel Ini ke Surat Jalan".');
      return;
    }

    const firstItem = finalItems[0];
    const distinctBrands = Array.from(new Set(finalItems.map((i) => i.brand).filter(Boolean)));
    const sjBrand = distinctBrands.length === 1 ? distinctBrands[0] : distinctBrands.join(', ');

    const payload = {
      brand: sjBrand,
      produk: finalItems.map((i) => i.produk).join(', '),
      vendor: Array.from(new Set(finalItems.map((i) => i.vendor))).join(', '),
      tanggal: tanggalKirim,
      items: finalItems,
      totalPcs: finalItems.reduce((acc, item) => acc + item.totalPcs, 0),
      driverName,
      nomorKendaraan,
      catatan,
      spkId: firstItem?.spkId,
      spkItemId: firstItem?.spkItemId,
      jenisKain: finalItems.map((i) => i.jenisKain).filter(Boolean).join(', '),
      qtyDelivered: firstItem?.qtyDelivered,
    };

    setIsCreateModalOpen(false);
    setDraftItems([]);
    setEditingDraftIndex(null);

    if (editingSJ) {
      const result = await updateSuratJalan(editingSJ.id, payload);
      setEditingSJ(null);
      if (!result.success) {
        alert(result.message || 'Gagal memperbarui Surat Jalan');
        setIsCreateModalOpen(true);
      }
    } else {
      const result = await createSuratJalan(payload);
      if (!result.success) {
        alert(result.message || 'Gagal menyimpan Surat Jalan');
        setIsCreateModalOpen(true);
      }
    }
  };

  // Delete Surat Jalan
  const handleDeleteSJ = (sj: SuratJalan) => {
    setDeleteModal({
      isOpen: true,
      sj,
      isBlocked: false,
    });
  };

  const executeDeleteSJ = async () => {
    if (!deleteModal.sj) return;
    setIsDeleting(true);
    try {
      const res = await deleteSuratJalan(deleteModal.sj.id);
      if (!res.success) {
        setDeleteModal({
          isOpen: true,
          sj: deleteModal.sj,
          isBlocked: true,
          blockMessage: res.message || 'Gagal menghapus Surat Jalan.',
        });
      } else {
        setDeleteModal({ isOpen: false });
      }
    } finally {
      setIsDeleting(false);
    }
  };

  // Print Isolated Document
  const handlePrintSJ = () => {
    if (!printPaperRef.current || !selectedSJDetail) return;
    const safeSJNo = (selectedSJDetail.noSuratJalan || 'SJ').replace(/[/\\?%*:|"<>]/g, '-');
    const docTitle = `SuratJalan_${selectedSJDetail.brand}_${safeSJNo}`;
    printIsolatedDocument(printPaperRef.current, docTitle);
  };

  const isOverDelivering =
    currentRemaining &&
    (qtySend.s > currentRemaining.s ||
      qtySend.m > currentRemaining.m ||
      qtySend.l > currentRemaining.l ||
      qtySend.xl > currentRemaining.xl ||
      qtySend.xxl > currentRemaining.xxl ||
      qtySend.anak4 > currentRemaining.anak4 ||
      qtySend.anak6 > currentRemaining.anak6 ||
      qtySend.anak8 > currentRemaining.anak8 ||
      qtySend.anak10 > currentRemaining.anak10 ||
      qtySend.anak12 > currentRemaining.anak12 ||
      qtySend.anak14 > currentRemaining.anak14 ||
      qtySend.anak16 > currentRemaining.anak16);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-lg mb-2 border border-indigo-100">
              <Truck className="w-3.5 h-3.5" />
              Outbound Surat Jalan Multi-Item
            </div>
            <h1 className="text-xl font-bold text-slate-900">Pengiriman Barang (Surat Jalan)</h1>
            <p className="text-slate-500 text-xs mt-1">
              Pencatatan pengiriman multi-artikel dalam 1 armada/trip dengan keterangan bahan kain lengkap. Dilengkapi validasi *auto-deduct*.
            </p>
          </div>

          {userRole === 'ADMIN' && (
            <button
              onClick={handleOpenCreate}
              className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-4 py-2.5 rounded-lg flex items-center gap-1.5 shadow-sm shadow-indigo-600/25 transition-base btn-press shrink-0 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Terbitkan Surat Jalan (SJ)
            </button>
          )}
        </div>

        {/* Filter Controls */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Cari no surat jalan, produk, jenis kain, driver, atau vendor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 transition-base outline-none"
            />
          </div>

          {userRole === 'ADMIN' && (
            <div className="w-full sm:w-48">
              <select
                value={brandFilter}
                onChange={(e) => setBrandFilter(e.target.value)}
                className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 transition-base outline-none"
              >
                <option value="ALL">Semua Brand</option>
                {brands.map((b) => (
                  <option key={b.id} value={b.name}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Surat Jalan Table */}
      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-slate-900 text-sm flex items-center gap-2">
            Riwayat Surat Jalan Outbound ({filteredSJ.length} Kiriman)
          </h3>
          <span className="text-[11px] text-slate-400">Tersinkronisasi ke modul Finance & Invoice</span>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50/90 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="p-3.5">No Surat Jalan</th>
                <th className="p-3.5 text-center whitespace-nowrap">Brand</th>
                <th className="p-3.5">Rincian Artikel & Bahan Kain</th>
                <th className="p-3.5">Vendor Penjahit</th>
                <th className="p-3.5">Total Muatan</th>
                <th className="p-3.5">Driver & No Polisi</th>
                <th className="p-3.5">Tgl Kirim</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filteredSJ.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-400">
                    Belum ada riwayat surat jalan pengiriman.
                  </td>
                </tr>
              ) : (
                filteredSJ.map((sj) => {
                  const items = getSuratJalanItems(sj);
                  const uniqueVendors = Array.from(new Set(items.map((i) => i.vendor).filter(Boolean)));

                  return (
                    <tr key={sj.id} className="hover:bg-slate-50 transition">
                      <td className="p-3.5 font-mono font-bold text-indigo-600 align-top">
                        <div>{sj.noSuratJalan}</div>
                        {(() => {
                          const allSJPOs = Array.from(
                            new Set(
                              items
                                .map(
                                  (it) =>
                                    it.sourcePONumber ||
                                    spkList.find(
                                      (s) => s.id === it.spkId || s.spkNumber === it.spkNumber
                                    )?.sourcePONumber
                                )
                                .filter(Boolean)
                            )
                          ) as string[];

                          if (allSJPOs.length === 0) return null;
                          return (
                            <div className="mt-1 flex flex-wrap gap-1">
                              {allSJPOs.map((po) => (
                                <span
                                  key={po}
                                  className="px-1.5 py-0.5 bg-blue-50 text-blue-700 font-sans font-bold rounded text-[9.5px] border border-blue-200"
                                >
                                  PO: {po}
                                </span>
                              ))}
                            </div>
                          );
                        })()}
                      </td>
                      <td className="p-3.5 align-top text-center">
                        <div className="flex flex-wrap gap-1 justify-center max-w-[140px]">
                          {sj.brand.split(',').map((b, bIdx) => (
                            <span key={bIdx} className="inline-flex items-center justify-center px-2 py-0.5 bg-slate-100 text-slate-800 font-bold rounded text-[10px] uppercase border border-slate-200 whitespace-nowrap">
                              {b.trim()}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="p-3.5 align-top space-y-1.5 min-w-[240px]">
                        {items.map((it, idx) => {
                          const itemPO =
                            it.sourcePONumber ||
                            spkList.find(
                              (s) => s.id === it.spkId || s.spkNumber === it.spkNumber
                            )?.sourcePONumber;

                          return (
                            <div key={idx} className="bg-slate-50 p-2 rounded-lg border border-slate-100 space-y-0.5">
                              <div className="flex items-center justify-between gap-2">
                                <span className="font-bold text-slate-900">{it.produk}</span>
                                <span className="font-bold text-indigo-600 shrink-0">{it.totalPcs} Pcs</span>
                              </div>
                              {itemPO && (
                                <div className="text-[10px] text-blue-700 font-semibold flex items-center gap-1 font-mono">
                                  <span>📋</span>
                                  <span>PO: {itemPO}</span>
                                </div>
                              )}
                              {it.jenisKain && (
                                <div className="text-[10px] text-slate-500 flex items-center gap-1 font-medium">
                                  <span>🧵</span>
                                  <span className="truncate">{it.jenisKain}</span>
                                </div>
                              )}
                            <div className="text-[10px] text-slate-500 flex flex-wrap gap-1 pt-1">
                              {SIZE_DISPLAY_ORDER.map(({ key, label }) => {
                                const qty = it.qtyDelivered?.[key] || 0;
                                if (qty === 0) return null;
                                return (
                                  <span key={key} className="bg-white border border-slate-200 text-slate-700 px-1.5 py-0.5 rounded font-medium text-[9px]">
                                    {label}: <strong className="text-slate-900">{qty}</strong>
                                  </span>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                      </td>
                      <td className="p-3.5 font-bold text-slate-700 align-top">
                        {uniqueVendors.join(', ') || sj.vendor || '-'}
                      </td>
                      <td className="p-3.5 align-top">
                        <div className="font-bold text-slate-900 text-sm">{sj.totalPcs} Pcs</div>
                        <span className="text-[10px] text-slate-500 font-medium">
                          {items.length} Artikel
                        </span>
                      </td>
                      <td className="p-3.5 text-slate-500 align-top">
                        <div className="font-semibold text-slate-800">{sj.driverName}</div>
                        <span className="text-[10px] text-slate-400 font-mono">{sj.nomorKendaraan}</span>
                      </td>
                      <td className="p-3.5 text-slate-500 font-medium align-top whitespace-nowrap">
                        {formatDateIndo(sj.tanggal)}
                      </td>
                      <td className="p-3.5 align-top">
                        {sj.status === 'VERIFIED' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 font-bold rounded-lg text-[10px] border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" /> Fisik Sesuai
                          </span>
                        ) : sj.status === 'DISCREPANCY' ? (
                          <div className="space-y-1">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 text-amber-700 font-bold rounded-lg text-[10px] border border-amber-200" title={sj.verificationNote || undefined}>
                              <AlertTriangle className="w-3 h-3" /> Selisih {sj.discrepancyPcs ?? (sj.realTotalPcs ? sj.realTotalPcs - (sj.originalTotalPcs || sj.totalPcs) : 0)} Pcs
                            </span>
                            {sj.verificationNote && (
                              <p className="text-[10px] text-slate-500 italic max-w-[150px] truncate" title={sj.verificationNote}>
                                "{sj.verificationNote}"
                              </p>
                            )}
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-700 font-bold rounded-lg text-[10px] border border-blue-200">
                            <Truck className="w-3 h-3" /> {sj.status || 'DELIVERED'}
                          </span>
                        )}
                      </td>
                      <td className="p-3.5 text-right space-x-1 whitespace-nowrap align-top">
                        <button
                          onClick={() => setSelectedSJDetail(sj)}
                          className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition btn-press inline-flex items-center align-middle"
                          title="Lihat & Cetak Surat Jalan"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {userRole === 'ADMIN' && (
                          <>
                            <button
                              onClick={() => handleOpenEdit(sj)}
                              className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition btn-press inline-flex items-center align-middle"
                              title="Edit Surat Jalan ini"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteSJ(sj)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition btn-press inline-flex items-center align-middle"
                              title="Hapus Surat Jalan ini"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: Terbitkan Surat Jalan Baru (Multi-Item Cargo Builder) */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-5 sm:p-6 max-h-[92vh] overflow-y-auto shadow-2xl border border-slate-200 space-y-4 animate-slideUp">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                  <Truck className={`w-5 h-5 ${editingSJ ? 'text-amber-600' : 'text-indigo-600'}`} />
                  {editingSJ ? `Edit Surat Jalan (${editingSJ.noSuratJalan})` : 'Terbitkan Surat Jalan (Outbound Multi-Artikel)'}
                </h3>
                <p className="text-[11px] text-slate-500">
                  {editingSJ
                    ? 'Sesuaikan driver, tanggal, catatan, atau sesuaikan rincian kuantiti artikel yang dimuat pada surat jalan ini'
                    : 'Pilih SPK/Kain, tentukan artikel produk yang dikirim, isi ukuran, lalu tambahkan ke muatan Surat Jalan'}
                </p>
              </div>
              <button
                onClick={() => {
                  setIsCreateModalOpen(false);
                  setEditingSJ(null);
                  setEditingDraftIndex(null);
                }}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSJ} className="space-y-4 text-xs">
              
              {/* Header Info: Brand, Driver, Plat, Tanggal */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Brand Penerima (Pilih SPK):</label>
                  <select
                    value={selectedBrand}
                    onChange={(e) => handleBrandChange(e.target.value)}
                    className="w-full p-2 bg-white border border-slate-200 rounded-lg font-bold text-slate-800 outline-none"
                  >
                    {brands.map((b) => (
                      <option key={b.id} value={b.name}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nama Driver / Kurir:</label>
                  <input
                    type="text"
                    value={driverName}
                    onChange={(e) => setDriverName(e.target.value)}
                    className="w-full p-2 bg-white border border-slate-200 rounded-lg font-bold text-slate-800 outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">No Polisi Kendaraan:</label>
                  <input
                    type="text"
                    value={nomorKendaraan}
                    onChange={(e) => setNomorKendaraan(e.target.value.toUpperCase())}
                    className="w-full p-2 bg-white border border-slate-200 rounded-lg font-mono font-bold text-slate-800 outline-none uppercase"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tanggal Pengiriman:</label>
                  <input
                    type="date"
                    value={tanggalKirim}
                    onChange={(e) => setTanggalKirim(e.target.value)}
                    className="w-full p-2 bg-white border border-slate-200 rounded-lg font-bold text-slate-800 outline-none"
                    required
                  />
                </div>
              </div>

              {/* SECTION: Daftar Muatan Surat Jalan Ini */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 flex items-center gap-1.5 text-xs">
                    <Package className="w-4 h-4 text-indigo-600" />
                    Daftar Muatan Surat Jalan Ini ({draftItems.length} Artikel Siap Kirim):
                  </span>
                  <span className="font-bold text-indigo-600 text-sm">
                    Total Muatan: {grandTotalDraftPcs} Pcs
                  </span>
                </div>

                {draftItems.length === 0 ? (
                  <div className="p-4 bg-slate-50 border border-dashed border-slate-200 rounded-xl text-center text-slate-400">
                    Belum ada artikel yang ditambahkan. Silakan pilih SPK & artikel di bawah, isi kuantiti size, lalu klik <strong>"+ Tambahkan Artikel Ini ke Surat Jalan"</strong>.
                  </div>
                ) : (
                  <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 bg-white">
                    {draftItems.map((item, idx) => (
                      <div key={item.id || idx} className="p-3 flex items-center justify-between gap-3 hover:bg-slate-50/60 transition">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-bold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded text-[10px] border border-indigo-100">
                              Artikel {idx + 1}
                            </span>
                            <span className="font-bold bg-slate-100 text-slate-800 px-2 py-0.5 rounded text-[10px] border border-slate-200 uppercase">
                              {item.brand}
                            </span>
                            {item.isManual ? (
                              <span className="font-bold bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 rounded text-[10px] flex items-center gap-1">
                                <span>📦</span>
                                <span>PO LAMA {item.legacyPoNumber ? `(${item.legacyPoNumber})` : ''}</span>
                              </span>
                            ) : (
                              <span className="font-mono text-[10px] text-slate-400 font-bold">
                                [{item.spkNumber}]
                              </span>
                            )}
                            <strong className="font-bold text-slate-900 text-xs">{item.produk}</strong>
                            <span className="text-slate-500 font-medium text-[11px]">(@ {item.vendor})</span>
                          </div>
                          {item.jenisKain && (
                            <div className="text-[10px] text-slate-500 font-medium flex items-center gap-1">
                              <span>🧵</span>
                              <span>{item.jenisKain}</span>
                            </div>
                          )}
                          <div className="text-[10px] text-slate-500 flex flex-wrap gap-1 pt-0.5">
                            {Object.entries(item.qtyDelivered).map(([sz, qty]) => {
                              if (qty === 0) return null;
                              return (
                                <span key={sz} className="bg-slate-100 text-slate-700 px-1.5 py-0.2 rounded font-semibold">
                                  {sz.toUpperCase()}: {qty}
                                </span>
                              );
                            })}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <div className="text-right">
                            <strong className="text-sm font-bold text-indigo-600 block">
                              {item.totalPcs} Pcs
                            </strong>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleEditDraftItem(idx)}
                            className={`p-1.5 rounded-lg transition ${
                              editingDraftIndex === idx
                                ? 'bg-amber-100 text-amber-800'
                                : 'text-slate-400 hover:text-amber-600 hover:bg-amber-50'
                            }`}
                            title="Edit kuantiti artikel ini"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveDraftItem(idx)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                            title="Hapus artikel ini dari Surat Jalan"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Editing Notification Banner */}
              {editingDraftIndex !== null && (
                <div className="p-2.5 bg-amber-50 border border-amber-300 rounded-xl flex items-center justify-between text-amber-900 text-xs animate-fadeIn">
                  <div className="flex items-center gap-2">
                    <Edit2 className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>
                      Sedang mengedit <strong>Artikel #{editingDraftIndex + 1} ({draftItems[editingDraftIndex]?.produk})</strong>. Ubah kuantiti di bawah lalu klik tombol perbarui.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleCancelEditDraftItem}
                    className="text-[11px] font-bold text-amber-800 hover:underline px-2.5 py-1 bg-amber-100 rounded-lg cursor-pointer"
                  >
                    Batal Edit
                  </button>
                </div>
              )}

              {/* SECTION: Form Pemilih SPK vs Non-SPK */}
              <div className="p-4 bg-indigo-50/50 border border-indigo-200 rounded-2xl space-y-3.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-indigo-100 pb-2.5 gap-2">
                  <span className="font-bold text-indigo-950 text-xs flex items-center gap-1.5">
                    <Plus className="w-4 h-4 text-indigo-600" />
                    Pilih & Muat Artikel ke Surat Jalan
                  </span>

                  {/* Mode Tab Switcher: SPK vs Non-SPK / PO Lama */}
                  <div className="flex p-1 bg-slate-200/70 rounded-xl gap-1 self-start sm:self-auto">
                    <button
                      type="button"
                      onClick={() => setCargoSourceMode('SPK')}
                      className={`py-1 px-2.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                        cargoSourceMode === 'SPK'
                          ? 'bg-white text-indigo-700 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <Layers className="w-3.5 h-3.5" />
                      <span>1. Dari SPK Cutting ({activeSPKsForBrand.length} SPK)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setCargoSourceMode('MANUAL')}
                      className={`py-1 px-2.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                        cargoSourceMode === 'MANUAL'
                          ? 'bg-amber-600 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>2. Non-SPK / PO Lama (Migrasi)</span>
                    </button>
                  </div>
                </div>

                {cargoSourceMode === 'MANUAL' ? (
                  /* ======================================================== */
                  /* SUB-FORM NON-SPK / PO LAMA                               */
                  /* ======================================================== */
                  <div className="space-y-3">
                    <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-xl text-amber-900 text-xs flex items-start gap-2">
                      <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <strong>Mode Input Manual (Non-SPK / PO Lama):</strong>
                        <p className="text-[11px] text-amber-800 mt-0.5">
                          Gunakan fitur ini untuk mengirimkan produk dari PO lama yang dipotong sebelum sistem ini aktif. Pengiriman ini tidak memotong kuota SPK, namun tetap tercatat rapi pada Surat Jalan dan stok penerimaan Brand.
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 bg-white p-3 rounded-xl border border-slate-200">
                      <div>
                        <label className="block font-bold text-slate-700 mb-1 text-[11px]">
                          1. Mitra Konveksi (Penjahit): <span className="text-rose-500">*</span>
                        </label>
                        <select
                          value={manualVendor}
                          onChange={(e) => setManualVendor(e.target.value)}
                          className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-800 outline-none text-xs"
                        >
                          <option value="">-- Pilih Penjahit --</option>
                          {vendors.map((v) => (
                            <option key={v.id || v.name} value={v.name}>
                              {v.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 mb-1 text-[11px]">
                          2. Nama Produk / Artikel: <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={manualProduk}
                          onChange={(e) => setManualProduk(e.target.value)}
                          placeholder="Contoh: QANITA KIDS"
                          className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-800 outline-none text-xs uppercase"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 mb-1 text-[11px]">
                          3. Bahan / Kain (Opsional):
                        </label>
                        <input
                          type="text"
                          value={manualJenisKain}
                          onChange={(e) => setManualJenisKain(e.target.value)}
                          placeholder="Contoh: Linen Angel Crepe"
                          className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-800 outline-none text-xs"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 mb-1 text-[11px]">
                          4. No PO Lama / Ket. (Opsional):
                        </label>
                        <input
                          type="text"
                          value={manualPoNumber}
                          onChange={(e) => setManualPoNumber(e.target.value)}
                          placeholder="Contoh: PO-AGUSTUS-05"
                          className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold text-slate-800 outline-none text-xs uppercase"
                        />
                      </div>
                    </div>

                    {/* Size Inputs Grid for Manual */}
                    <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-3">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                        <span className="font-bold text-slate-800 text-xs">
                          5. Masukkan Kuantitas Ukuran untuk Artikel "{manualProduk || 'Non-SPK'}":
                        </span>
                        <span className="font-bold text-amber-600 text-xs">
                          Subtotal Artikel Ini: {currentSendingPcs} Pcs
                        </span>
                      </div>

                      {/* Ukuran Seri Huruf */}
                      <div>
                        <div className="text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                          Ukuran Seri Huruf (S - 2XL)
                        </div>
                        <div className="grid grid-cols-5 gap-2">
                          {(['s', 'm', 'l', 'xl', 'xxl'] as (keyof SizeBreakdown)[]).map((sz) => {
                            const val = qtySend[sz] || 0;
                            return (
                              <div key={sz} className="space-y-1">
                                <div className="flex justify-between text-[10px]">
                                  <span className="uppercase font-bold text-slate-700">Size {sz}</span>
                                </div>
                                <input
                                  type="number"
                                  min="0"
                                  value={val === 0 ? '' : val}
                                  placeholder="0"
                                  onFocus={(e) => e.target.select()}
                                  onChange={(e) =>
                                    setQtySend({
                                      ...qtySend,
                                      [sz]: Number(e.target.value) || 0,
                                    })
                                  }
                                  className={`w-full p-2 border rounded-lg font-bold text-center outline-none text-xs transition ${
                                    val > 0
                                      ? 'bg-amber-50 border-amber-400 text-amber-900 font-extrabold'
                                      : 'bg-slate-50 border-slate-200 focus:bg-white focus:border-amber-400 text-slate-800'
                                  }`}
                                />
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Ukuran Seri Angka */}
                      <div className="pt-2 border-t border-slate-100">
                        <div className="text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                          Ukuran Anak - Seri Angka (4 - 16)
                        </div>
                        <div className="grid grid-cols-7 gap-1.5">
                          {(['anak4', 'anak6', 'anak8', 'anak10', 'anak12', 'anak14', 'anak16'] as (keyof SizeBreakdown)[]).map((sz) => {
                            const val = qtySend[sz] || 0;
                            return (
                              <div key={sz} className="space-y-1">
                                <div className="text-[9px] text-center font-bold text-slate-600 truncate">
                                  {sz.replace('anak', 'A')}
                                </div>
                                <input
                                  type="number"
                                  min="0"
                                  value={val === 0 ? '' : val}
                                  placeholder="0"
                                  onFocus={(e) => e.target.select()}
                                  onChange={(e) =>
                                    setQtySend({
                                      ...qtySend,
                                      [sz]: Number(e.target.value) || 0,
                                    })
                                  }
                                  className={`w-full p-1.5 border rounded-lg font-bold text-center outline-none text-xs transition ${
                                    val > 0
                                      ? 'bg-amber-50 border-amber-400 text-amber-900 font-extrabold'
                                      : 'bg-slate-50 border-slate-200 focus:bg-white focus:border-amber-400 text-slate-800'
                                  }`}
                                />
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Tombol Tambahkan / Perbarui Artikel Non-SPK */}
                      <div className="flex justify-end pt-1">
                        <button
                          type="button"
                          onClick={handleAddItemToDraft}
                          disabled={currentSendingPcs <= 0 || !manualProduk.trim() || !manualVendor}
                          className={`px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 transition ${
                            currentSendingPcs <= 0 || !manualProduk.trim() || !manualVendor
                              ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                              : 'bg-amber-600 hover:bg-amber-500 text-white shadow-md shadow-amber-600/25 cursor-pointer'
                          }`}
                        >
                          <Plus className="w-4 h-4" />
                          <span>
                            {editingDraftIndex !== null
                              ? `Perbarui Artikel "${manualProduk || 'Non-SPK'}" (${currentSendingPcs} Pcs)`
                              : `+ Tambahkan Artikel "${manualProduk || 'Non-SPK'}" (${currentSendingPcs} Pcs) ke Surat Jalan`}
                          </span>
                        </button>
                      </div>
                    </div>
                  </div>
                ) : activeSPKsForBrand.length === 0 ? (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-xs">
                    Tidak ada SPK aktif untuk Brand <strong>{selectedBrand}</strong>. Silakan buat SPK baru terlebih dahulu atau pilih tab <strong>"Non-SPK / PO Lama"</strong> di atas.
                  </div>
                ) : (
                  <>
                    {/* SPK Selector */}
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        1. Pilih SPK Sumber / Batch Kain:
                      </label>
                      <select
                        value={selectedSPKId}
                        onChange={(e) => selectSPK(e.target.value)}
                        className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-bold font-mono text-slate-800 outline-none text-xs"
                      >
                        {activeSPKsForBrand.map((spk) => {
                          const fabric = getSPKFabricName(spk);
                          const fabricLabel = fabric ? ` • ${fabric}` : '';
                          const multiLabel =
                            spk.items && spk.items.length > 1
                              ? ` [${spk.items.length} Artikel Combo]`
                              : spk.produk.includes('+')
                              ? ' [Artikel Combo]'
                              : '';
                          const allPos = Array.from(
                            new Set([
                              spk.sourcePONumber,
                              ...(spk.sourcePONumbers || []),
                              ...(spk.items?.map((it) => it.sourcePONumber) || []),
                            ].filter(Boolean))
                          ) as string[];
                          const poLabel = allPos.length > 0 ? ` [PO: ${allPos.join(', ')}]` : '';

                          return (
                            <option key={spk.id} value={spk.id}>
                              {spk.spkNumber}
                              {poLabel} - {spk.produk}
                              {fabricLabel}
                              {multiLabel}
                            </option>
                          );
                        })}
                      </select>
                    </div>

                    {/* Article Selector (Ketika 1 kain menghasilkan > 1 produk, user dapat memilih artikel mana yang dikirim sekarang) */}
                    {availableArticles.length > 1 && (
                      <div className="p-3 bg-white rounded-xl border border-indigo-100 space-y-2">
                        <label className="font-bold text-indigo-950 text-xs block">
                          2. Pilih Artikel yang Dikirim Sekarang (Kain ini menghasilkan {availableArticles.length} produk):
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                          {availableArticles.map((art) => {
                            const isSelected =
                              art.produk.trim().toUpperCase() === selectedArticleName.trim().toUpperCase();
                            const rem = currentSPK
                              ? getSPKRemainingQty(currentSPK, art.id || art.produk)
                              : null;
                            const artPO = art.sourcePONumber || currentSPK?.sourcePONumber;

                            return (
                              <button
                                key={art.id || art.produk}
                                type="button"
                                onClick={() => selectArticle(art)}
                                className={`p-2.5 rounded-xl text-left border transition text-xs font-bold flex items-center justify-between gap-2 cursor-pointer ${
                                  isSelected
                                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm ring-2 ring-indigo-300'
                                    : 'bg-slate-50 text-slate-800 border-slate-200 hover:bg-indigo-50/50 hover:border-indigo-200'
                                }`}
                              >
                                <div className="truncate">
                                  <div className="truncate">{art.produk}</div>
                                  <div className={`text-[10px] font-normal ${isSelected ? 'text-indigo-100' : 'text-slate-500'}`}>
                                    Vendor: {art.vendor}
                                    {artPO && <span> • PO: {artPO}</span>}
                                  </div>
                                </div>
                                <div className="text-right shrink-0">
                                  {rem && (
                                    <span className={`text-[10px] font-bold block ${isSelected ? 'text-indigo-100' : 'text-emerald-700'}`}>
                                      Sisa: {rem.totalRemaining} pcs
                                    </span>
                                  )}
                                  {isSelected && <Check className="w-3.5 h-3.5 text-white inline-block mt-0.5" />}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Article & Fabric Metadata */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-white p-3 rounded-xl border border-slate-200">
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase block">Artikel Terpilih:</span>
                        <div className="font-bold text-slate-900 text-sm flex items-center gap-1.5 mt-0.5">
                          <span>👕</span>
                          <span>{selectedArticleName || currentSPK?.produk}</span>
                          <span className="text-slate-400 font-normal text-xs">(@ {selectedArticleVendor || currentSPK?.vendor})</span>
                        </div>
                      </div>

                      <div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase block">Keterangan Bahan Kain:</span>
                        <input
                          type="text"
                          value={customJenisKain}
                          onChange={(e) => setCustomJenisKain(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 p-1.5 rounded-lg font-bold text-slate-800 outline-none text-xs mt-0.5"
                          placeholder="Contoh: Poly Micro Emerald / Cotton 24s"
                        />
                      </div>
                    </div>

                    {/* Sisa & Target Stats Card */}
                    {currentSPK && currentRemaining && (
                      <div className="grid grid-cols-3 gap-2 text-center p-2.5 bg-white border border-slate-200 rounded-xl text-xs">
                        <div>
                          <span className="text-slate-400 block text-[10px] font-medium">Target Potong Artikel</span>
                          <span className="text-slate-900 font-bold">
                            {currentTargetCut
                              ? Object.values(currentTargetCut).reduce((a, b) => a + b, 0)
                              : 0}{' '}
                            Pcs
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px] font-medium">Sudah Terkirim</span>
                          <span className="text-indigo-600 font-bold">
                            {currentDelivered
                              ? Object.values(currentDelivered).reduce((a: number, b: any) => a + (Number(b) || 0), 0)
                              : 0}{' '}
                            Pcs
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px] font-medium">Sisa Belum Kirim</span>
                          <span className="text-emerald-700 font-bold">
                            {currentRemaining.totalRemaining} Pcs
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Over-Delivery Alert */}
                    {isOverDelivering && (
                      <div className="bg-amber-50 border border-amber-300 text-amber-950 p-2.5 rounded-xl flex items-center gap-2 font-medium text-[11px]">
                        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                        <span>
                          <strong>Over-Delivery:</strong> Kuantitas kirim pada ukuran tertentu melebihi sisa target potong artikel ini.
                        </span>
                      </div>
                    )}

                    {/* Size Inputs Grid */}
                    <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-3">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                        <span className="font-bold text-slate-800 text-xs">
                          3. Masukkan Kuantitas Ukuran untuk Artikel "{selectedArticleName}":
                        </span>
                        <span className="font-bold text-indigo-600 text-xs">
                          Subtotal Artikel Ini: {currentSendingPcs} Pcs
                        </span>
                      </div>

                      {/* Ukuran Anak Seri Huruf */}
                      <div>
                        <div className="text-[10px] font-bold text-indigo-900 uppercase tracking-wider mb-1.5">
                          Ukuran Anak - Seri Huruf (S - 2XL)
                        </div>
                        <div className="grid grid-cols-5 gap-2">
                          {(['s', 'm', 'l', 'xl', 'xxl'] as (keyof SizeBreakdown)[]).map((sz) => {
                            const rem = currentRemaining?.[sz] || 0;
                            const val = qtySend[sz] || 0;
                            const isSizeOver = val > rem;

                            return (
                              <div key={sz} className="space-y-1">
                                <div className="flex justify-between text-[10px]">
                                  <span className="uppercase font-bold text-slate-700">Size {sz}</span>
                                  <span className={`font-semibold ${isSizeOver ? 'text-amber-600' : 'text-slate-400'}`}>
                                    Sisa {rem}
                                  </span>
                                </div>
                                <input
                                  type="number"
                                  min="0"
                                  value={val === 0 ? '' : val}
                                  placeholder="0"
                                  onFocus={(e) => e.target.select()}
                                  onChange={(e) =>
                                    setQtySend({
                                      ...qtySend,
                                      [sz]: Number(e.target.value) || 0,
                                    })
                                  }
                                  className={`w-full p-2 border rounded-lg font-bold text-center outline-none text-xs transition ${
                                    isSizeOver
                                      ? 'bg-amber-50 border-amber-400 text-amber-950'
                                      : val > 0
                                      ? 'bg-indigo-50/80 border-indigo-400 text-indigo-900 font-extrabold'
                                      : 'bg-slate-50 border-slate-200 focus:bg-white focus:border-indigo-400 text-slate-800'
                                  }`}
                                />
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Ukuran Anak Seri Angka */}
                      <div className="pt-2 border-t border-slate-100">
                        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                          Ukuran Anak - Seri Angka (4 - 16)
                        </div>
                        <div className="grid grid-cols-7 gap-1.5">
                          {(['anak4', 'anak6', 'anak8', 'anak10', 'anak12', 'anak14', 'anak16'] as (keyof SizeBreakdown)[]).map((sz) => {
                            const rem = currentRemaining?.[sz] || 0;
                            const val = qtySend[sz] || 0;
                            const isSizeOver = val > rem;

                            return (
                              <div key={sz} className="space-y-1">
                                <div className="text-[9px] text-center font-bold text-slate-600 truncate">
                                  {sz.replace('anak', 'A')}
                                </div>
                                <input
                                  type="number"
                                  min="0"
                                  value={val === 0 ? '' : val}
                                  placeholder="0"
                                  onFocus={(e) => e.target.select()}
                                  onChange={(e) =>
                                    setQtySend({
                                      ...qtySend,
                                      [sz]: Number(e.target.value) || 0,
                                    })
                                  }
                                  className={`w-full p-1.5 border rounded-lg font-bold text-center outline-none text-xs transition ${
                                    isSizeOver
                                      ? 'bg-amber-50 border-amber-400 text-amber-950'
                                      : val > 0
                                      ? 'bg-indigo-50/80 border-indigo-400 text-indigo-900 font-extrabold'
                                      : 'bg-slate-50 border-slate-200 focus:bg-white focus:border-indigo-400 text-slate-800'
                                  }`}
                                />
                                <div className="text-[9px] text-center text-slate-400">
                                  Sisa {rem}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Tombol Tambahkan / Perbarui Artikel SPK */}
                      <div className="flex justify-end pt-1">
                        <button
                          type="button"
                          onClick={handleAddItemToDraft}
                          disabled={currentSendingPcs <= 0}
                          className={`px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 transition ${
                            currentSendingPcs <= 0
                              ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                              : editingDraftIndex !== null
                              ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-md shadow-amber-600/25 cursor-pointer'
                              : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/25 cursor-pointer'
                          }`}
                        >
                          <Plus className="w-4 h-4" />
                          <span>
                            {editingDraftIndex !== null
                              ? `Perbarui Artikel "${selectedArticleName}" (${currentSendingPcs} Pcs)`
                              : `+ Tambahkan Artikel "${selectedArticleName}" (${currentSendingPcs} Pcs) ke Surat Jalan`}
                          </span>
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Catatan Keseluruhan */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Catatan Pengiriman:</label>
                <input
                  type="text"
                  value={catatan}
                  onChange={(e) => setCatatan(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium outline-none"
                  placeholder="Catatan pengiriman untuk driver atau penerima brand..."
                />
              </div>

              {/* Bottom Sticky Submit Bar */}
              <div className="bg-slate-900 text-white p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
                <div>
                  <div className="text-[10px] text-slate-400 uppercase font-bold">Ringkasan Surat Jalan</div>
                  <div className="text-base font-bold text-white flex items-center gap-2">
                    <span>Total Muatan: {grandTotalDraftPcs > 0 ? grandTotalDraftPcs : currentSendingPcs} Pcs</span>
                    <span className="text-slate-400 text-xs font-normal">
                      ({draftItems.length > 0 ? draftItems.length : currentSendingPcs > 0 ? 1 : 0} Artikel)
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsCreateModalOpen(false);
                      setEditingSJ(null);
                      setEditingDraftIndex(null);
                    }}
                    className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl transition cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={draftItems.length === 0 && currentSendingPcs <= 0}
                    className={`px-5 py-2.5 text-white font-bold rounded-xl transition shadow-md ${
                      draftItems.length === 0 && currentSendingPcs <= 0
                        ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                        : editingSJ
                        ? 'bg-amber-600 hover:bg-amber-500 shadow-amber-600/30 cursor-pointer'
                        : 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/30 cursor-pointer'
                    }`}
                  >
                    {editingSJ
                      ? `Simpan Perubahan Surat Jalan (${draftItems.length > 0 ? draftItems.length : 1} Artikel • ${grandTotalDraftPcs > 0 ? grandTotalDraftPcs : currentSendingPcs} Pcs)`
                      : `Terbitkan Surat Jalan (${draftItems.length > 0 ? draftItems.length : 1} Artikel • ${grandTotalDraftPcs > 0 ? grandTotalDraftPcs : currentSendingPcs} Pcs)`}
                  </button>
                </div>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* MODAL: Detail & Cetak Surat Jalan Resmi (Printable Isolated Paper) */}
      {selectedSJDetail && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4 overflow-hidden">
          <div className="bg-slate-100 rounded-2xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-300 overflow-hidden animate-slideUp">
            {/* Sticky Header Toolbar */}
            <div className="bg-white px-5 py-3.5 border-b border-slate-200 flex items-center justify-between shrink-0 z-30 shadow-xs">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <span>Surat Jalan Pengiriman Resmi</span>
                    <span className="text-slate-400">•</span>
                    <span className="text-indigo-600">{selectedSJDetail.brand}</span>
                  </div>
                  <div className="text-[11px] font-mono text-slate-500">{selectedSJDetail.noSuratJalan}</div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {userRole === 'ADMIN' && (
                  <button
                    onClick={() => {
                      const sj = selectedSJDetail;
                      setSelectedSJDetail(null);
                      handleOpenEdit(sj);
                    }}
                    className="px-3.5 py-2 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 transition btn-press cursor-pointer"
                    title="Edit Data Surat Jalan Ini"
                  >
                    <Edit2 className="w-4 h-4" />
                    <span>Edit Surat Jalan</span>
                  </button>
                )}
                <button
                  onClick={handlePrintSJ}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-sm flex items-center gap-1.5 transition btn-press cursor-pointer"
                  title="Download & Cetak Surat Jalan PDF"
                >
                  <Printer className="w-4 h-4" />
                  <span>Cetak / PDF</span>
                </button>
                <button
                  onClick={() => setSelectedSJDetail(null)}
                  className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition ml-1 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable Paper Canvas */}
            <div className="overflow-y-auto p-4 sm:p-6 flex-1 flex justify-center bg-slate-200/50">
              <div
                ref={printPaperRef}
                className="bg-white rounded-xl shadow-lg border border-slate-200 p-6 sm:p-8 space-y-4 text-slate-800 max-w-2xl w-full my-auto"
              >
                {/* Header Kop Perusahaan */}
                <div className="flex justify-between items-start border-b-2 border-slate-900 pb-3">
                  <div className="flex items-center gap-3.5">
                    <img
                      src="/logo-maison-rayyan.png"
                      alt="Maison Rayyan Manufacturing"
                      className="h-16 sm:h-20 w-auto object-contain shrink-0"
                    />
                    <div>
                      <h2 className="text-xl font-bold tracking-tight text-slate-900">MAISON RAYYAN MANUFACTURING</h2>
                      <p className="text-xs text-slate-500 mt-0.5">Konveksi & Makloon Garment Terpadu</p>
                      <p className="text-[10px] text-slate-400">Jl. Industri Makloon No. 88, Bandung • Telp: 0812-3456-7890</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="bg-slate-900 text-white text-[11px] font-bold px-3 py-1 rounded uppercase tracking-wider inline-block">
                      SURAT JALAN
                    </span>
                    <div className="text-xs font-mono font-bold text-slate-800 mt-1.5">{selectedSJDetail.noSuratJalan}</div>
                    <div className="text-[11px] text-slate-500">Tgl: {formatDateIndo(selectedSJDetail.tanggal)}</div>
                  </div>
                </div>

                {/* Info Pengiriman Box */}
                <div className="text-xs bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Brand Tujuan:</span>
                      <strong className="text-slate-900 text-sm font-bold">{selectedSJDetail.brand}</strong>
                      <div className="text-slate-500 text-[11px] mt-0.5">Partner Brand Makloon</div>
                    </div>

                    {(() => {
                      const detailItems = getSuratJalanItems(selectedSJDetail);
                      const distinctPOs = Array.from(
                        new Set(
                          detailItems
                            .map(
                              (it) =>
                                it.sourcePONumber ||
                                spkList.find(
                                  (s) => s.id === it.spkId || s.spkNumber === it.spkNumber
                                )?.sourcePONumber
                            )
                            .filter(Boolean)
                        )
                      ) as string[];

                      if (distinctPOs.length === 0) return null;
                      return (
                        <div className="sm:text-right">
                          <span className="text-slate-400 block text-[10px] uppercase font-bold">
                            Referensi PO Produksi:
                          </span>
                          <div className="flex flex-wrap gap-1 sm:justify-end mt-1">
                            {distinctPOs.map((po) => (
                              <span
                                key={po}
                                className="px-2 py-0.5 bg-blue-50 text-blue-700 font-mono font-bold rounded text-[10px] border border-blue-200"
                              >
                                PO: {po}
                              </span>
                            ))}
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                  {selectedSJDetail.catatan && (
                    <div className="pt-2 mt-2 border-t border-slate-200/60 text-[11px] text-slate-600">
                      <span className="font-bold">Catatan Pengiriman:</span> {selectedSJDetail.catatan}
                    </div>
                  )}
                  {selectedSJDetail.status === 'VERIFIED' && (
                    <div className="pt-2 mt-2 border-t border-slate-200/60 text-[11px] text-emerald-700 flex items-center gap-1.5 font-bold">
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                      <span>Verifikasi Brand: Fisik Diterima Lengkap & Sesuai {selectedSJDetail.verifiedBy ? `(${selectedSJDetail.verifiedBy})` : ''}</span>
                    </div>
                  )}
                  {selectedSJDetail.status === 'DISCREPANCY' && (
                    <div className="pt-2 mt-2 border-t border-slate-200/60 text-[11px] text-amber-800 space-y-0.5 bg-amber-50/60 p-2 rounded-lg border border-amber-200">
                      <div className="flex items-center gap-1.5 font-bold">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-amber-600" />
                        <span>Verifikasi Brand: Terdapat Selisih Fisik Diterima ({selectedSJDetail.discrepancyPcs ?? 0} Pcs)</span>
                      </div>
                      {selectedSJDetail.verificationNote && (
                        <div className="text-slate-600 font-normal italic">
                          Keterangan Brand: "{selectedSJDetail.verificationNote}"
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Table of Shipped Items */}
                <div className="space-y-1.5">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
                    Rincian Barang yang Dikirim
                  </div>

                  <div className="border border-slate-200 rounded-lg overflow-hidden">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-slate-100 text-slate-700 font-bold text-[9px] uppercase border-b border-slate-300">
                        <tr>
                          <th className="p-2 w-[6%] text-center">No</th>
                          <th className="p-2 w-[32%]">Artikel Produk</th>
                          <th className="p-2 w-[28%]">Bahan / Kain</th>
                          <th className="p-2 w-[22%]">Rincian Size</th>
                          <th className="p-2 w-[12%] text-right whitespace-nowrap">Qty Pcs</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {getSuratJalanItems(selectedSJDetail).map((item, idx) => {
                          const itemPO =
                            item.sourcePONumber ||
                            spkList.find(
                              (s) => s.id === item.spkId || s.spkNumber === item.spkNumber
                            )?.sourcePONumber;

                          return (
                            <tr key={idx} className="align-top">
                              <td className="p-2 text-center font-bold text-slate-400">{idx + 1}</td>
                              <td className="p-2 font-bold text-slate-900">
                                <div>{item.produk}</div>
                                <div className="flex flex-wrap items-center gap-1 mt-0.5">
                                  {item.brand && (
                                    <span className="px-1.5 py-0.2 bg-slate-100 text-slate-700 rounded text-[9px] font-bold uppercase border border-slate-200">
                                      {item.brand}
                                    </span>
                                  )}
                                  {item.isManual && (
                                    <span className="px-1.5 py-0.2 bg-amber-100 text-amber-900 rounded text-[9px] font-bold uppercase border border-amber-300">
                                      NON-SPK / PO LAMA {item.legacyPoNumber ? `(${item.legacyPoNumber})` : ''}
                                    </span>
                                  )}
                                  {!item.isManual && item.spkNumber && (
                                    <span className="text-[9px] text-slate-400 font-mono">
                                      [{item.spkNumber}]
                                    </span>
                                  )}
                                  {itemPO && (
                                    <span className="px-1.5 py-0.2 bg-blue-50 text-blue-700 rounded text-[9px] font-bold uppercase border border-blue-200 font-mono">
                                      PO: {itemPO}
                                    </span>
                                  )}
                                </div>
                              </td>
                            <td className="p-2 text-slate-600 text-[11px]">{item.jenisKain || 'Kain Standar'}</td>
                            <td className="p-2 text-[10px] text-slate-600 space-y-0.5">
                              {SIZE_DISPLAY_ORDER.map(({ key, label }) => {
                                const qty = item.qtyDelivered?.[key] || 0;
                                if (qty === 0) return null;
                                return (
                                  <div key={key} className="whitespace-nowrap">
                                    <span className="font-bold uppercase">{label}:</span> {qty} pcs
                                  </div>
                                );
                              })}
                            </td>
                            <td className="p-2 text-right font-bold text-slate-900 whitespace-nowrap">
                              {item.totalPcs} Pcs
                            </td>
                          </tr>
                        );
                      })}
                      </tbody>
                      <tfoot className="bg-slate-100 font-bold border-t-2 border-slate-300">
                        <tr>
                          <td colSpan={4} className="p-2 text-right uppercase text-[10px]">
                            Total Keseluruhan Barang:
                          </td>
                          <td className="p-2 text-right text-indigo-700 font-bold text-sm whitespace-nowrap">
                            {selectedSJDetail.totalPcs} Pcs
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>

                {/* Kolom Tanda Tangan */}
                <div className="grid grid-cols-3 gap-2 pt-4 text-center text-xs">
                  <div className="border border-slate-200 rounded-xl p-2.5 flex flex-col justify-between h-24">
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Dibuat Oleh</span>
                    <div className="border-b border-slate-300 w-3/4 mx-auto"></div>
                    <span className="text-[10px] text-slate-400">(Admin / Gudang)</span>
                  </div>
                  <div className="border border-slate-200 rounded-xl p-2.5 flex flex-col justify-between h-24">
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Dikirim Oleh</span>
                    <div className="border-b border-slate-300 w-3/4 mx-auto"></div>
                    <span className="text-[10px] text-slate-400">(Kurir / Driver)</span>
                  </div>
                  <div className="border border-slate-200 rounded-xl p-2.5 flex flex-col justify-between h-24">
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Diterima Oleh</span>
                    <div className="border-b border-slate-300 w-3/4 mx-auto"></div>
                    <span className="text-[10px] text-slate-400">(Nama & Cap Penerima)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Konfirmasi / Peringatan Hapus Surat Jalan */}
      <ConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false })}
        onConfirm={deleteModal.isBlocked ? undefined : executeDeleteSJ}
        title={deleteModal.isBlocked ? 'Gagal Menghapus Surat Jalan' : 'Hapus Surat Jalan?'}
        variant={deleteModal.isBlocked ? 'warning' : 'danger'}
        confirmText="Ya, Hapus Surat Jalan"
        cancelText="Batal"
        isLoading={isDeleting}
        message={
          deleteModal.isBlocked ? (
            deleteModal.blockMessage
          ) : deleteModal.sj ? (
            <span>
              Apakah Anda yakin ingin menghapus Surat Jalan{' '}
              <strong className="text-slate-900 font-mono">{deleteModal.sj.noSuratJalan}</strong>{' '}
              ({getSuratJalanItems(deleteModal.sj).length} Artikel - {deleteModal.sj.totalPcs} Pcs)?
            </span>
          ) : (
            'Apakah Anda yakin ingin menghapus Surat Jalan ini?'
          )
        }
        note={
          deleteModal.isBlocked
            ? undefined
            : 'Kuantiti terkirim pada semua SPK terkait akan otomatis dikembalikan (revert).'
        }
      />
    </div>
  );
};
