import { SPKProductItem, SizeBreakdown, SuratJalan, SPKCutting, ProductionPO, FobPurchaseOrder } from '../types';

export const emptySizeBreakdown: SizeBreakdown = {
  s: 0,
  m: 0,
  l: 0,
  xl: 0,
  xxl: 0,
  anak2: 0,
  anak4: 0,
  anak6: 0,
  anak8: 0,
  anak10: 0,
  anak12: 0,
  anak14: 0,
  anak16: 0,
};

export const SIZE_KEYS = [
  's', 'm', 'l', 'xl', 'xxl',
  'anak2', 'anak4', 'anak6', 'anak8', 'anak10', 'anak12', 'anak14', 'anak16',
] as (keyof SizeBreakdown)[];

/**
 * Mencocokkan nama brand dengan toleransi format (misal MONTURE vs MONTURE OUTDOOR)
 */
export function matchBrand(b1?: string | null, b2?: string | null): boolean {
  if (!b1 || !b2) return false;
  const s1 = b1.trim().toUpperCase();
  const s2 = b2.trim().toUpperCase();
  if (s1 === s2) return true;
  if (s1.includes(s2) || s2.includes(s1)) return true;
  const words1 = s1.split(/\s+/);
  const words2 = s2.split(/\s+/);
  return words1.some((w) => words2.includes(w) && w.length >= 3);
}

/**
 * Mengubah array item order FOB menjadi SizeBreakdown untuk surat jalan
 */
export function convertFobItemsToSizeBreakdown(items: any[] = []): SizeBreakdown {
  const sb: SizeBreakdown = { ...emptySizeBreakdown };
  if (!Array.isArray(items)) return sb;

  items.forEach((it) => {
    const rawSize = (it.size || '').trim().toUpperCase();
    const qty = Number(it.qty) || 0;
    if (rawSize === 'S') sb.s += qty;
    else if (rawSize === 'M') sb.m += qty;
    else if (rawSize === 'L') sb.l += qty;
    else if (rawSize === 'XL') sb.xl += qty;
    else if (rawSize === '2XL' || rawSize === 'XXL') sb.xxl += qty;
    else if (rawSize === '3XL' || rawSize === 'XXXL' || rawSize === '4XL' || rawSize === 'XXXXL') {
      sb.xxl += qty;
    } else if (rawSize === '2' || rawSize === 'ANAK 2' || rawSize === 'ANAK2') sb.anak2 += qty;
    else if (rawSize === '4' || rawSize === 'ANAK 4' || rawSize === 'ANAK4') sb.anak4 += qty;
    else if (rawSize === '6' || rawSize === 'ANAK 6' || rawSize === 'ANAK6') sb.anak6 += qty;
    else if (rawSize === '8' || rawSize === 'ANAK 8' || rawSize === 'ANAK8') sb.anak8 += qty;
    else if (rawSize === '10' || rawSize === 'ANAK 10' || rawSize === 'ANAK10') sb.anak10 += qty;
    else if (rawSize === '12' || rawSize === 'ANAK 12' || rawSize === 'ANAK12') sb.anak12 += qty;
    else if (rawSize === '14' || rawSize === 'ANAK 14' || rawSize === 'ANAK14') sb.anak14 += qty;
    else if (rawSize === '16' || rawSize === 'ANAK 16' || rawSize === 'ANAK16') sb.anak16 += qty;
    else {
      sb.l += qty;
    }
  });
  return sb;
}

const COLOR_SYNONYMS: Record<string, string> = {
  'BROKEN WHITE': 'BW',
  'PUTIH TULANG': 'BW',
  'MOKA': 'MOCCA',
  'COKSU': 'COKLAT SUSU',
  'KREM': 'CREAM',
  'TERACOTTA': 'TERRACOTA',
  'DONGKER': 'NAVY',
  'MERAH CABE': 'MERAH',
  'MERAH MUDA': 'PINK',
  'HIJAU BOTOL': 'BOTOL',
  'HIJAU ARMY': 'ARMY',
  'HIJAU LUMUT': 'LUMUT',
  'ABU MISTY': 'MISTY',
  'ABU TUA': 'CHARCOAL'
};

const KNOWN_COLORS = [
  'BW', 'PUTIH', 'WHITE', 'HITAM', 'BLACK',
  'MERAH', 'RED', 'BIRU', 'BLUE', 'KUNING', 'YELLOW',
  'HIJAU', 'GREEN', 'ABU', 'GREY', 'GRAY', 'MISTY',
  'COKLAT', 'BROWN', 'COKSU', 'MILO', 'MOCCA', 'MOKA',
  'PINK', 'ROSE', 'MAGENTA', 'FANTA',
  'UNGU', 'PURPLE', 'LILAC', 'LAVENDER',
  'ORANGE', 'OREN', 'JINGGA', 'PEACH', 'SALMON', 'CORAL',
  'CREAM', 'KREM', 'BEIGE', 'KHAKI',
  'NAVY', 'DONGKER', 'BENHUR', 'BCA', 'TURKIS', 'CYAN', 'TEAL',
  'SAGE', 'ARMY', 'LUMUT', 'BOTOL', 'MELON', 'LEMON', 'MINT',
  'MAROON', 'BURGUNDY', 'TERRACOTA', 'TERACOTTA', 'BATA',
  'MUSTARD', 'KUNYIT', 'GOLD', 'EMAS', 'SILVER', 'PERAK',
  'CHARCOAL', 'TOSCA', 'DENIM', 'DUSTY', 'FUCHSIA'
];

function normalizeFabricStr(str?: string): string {
  let s = (str || '').trim().toUpperCase();
  s = s.replace(/^(TITIPAN|ROLL|KAIN|BAHAN)\s*:\s*/i, '');
  s = s.replace(/[()[\]{}]/g, ' ');
  s = s.replace(/[-_\\/]/g, ' ');
  s = s.replace(/\s+/g, ' ').trim();
  for (const [syn, norm] of Object.entries(COLOR_SYNONYMS)) {
    s = s.replace(new RegExp('\\b' + syn + '\\b', 'g'), norm);
  }
  return s;
}

function extractColors(str: string): string[] {
  const words = str.split(/\s+/);
  const found = new Set<string>();
  for (const w of words) {
    if (KNOWN_COLORS.includes(w)) found.add(w);
  }
  return Array.from(found);
}

function extractNumbers(str: string): string[] {
  const matches = str.match(/\b\d{2,5}\b/g) || [];
  return matches.filter(m => !str.includes(m + 'S') && !str.includes(m + 'M') && !str.includes(m + 'GR'));
}

function isSingleFabricCompatible(f1Raw?: string, f2Raw?: string): boolean {
  const f1 = normalizeFabricStr(f1Raw);
  const f2 = normalizeFabricStr(f2Raw);
  if (!f1 || !f2) return true;
  if (f1.startsWith('KAIN STANDAR') || f2.startsWith('KAIN STANDAR')) return true;
  if (f1 === f2) return true;

  const f1Nums = extractNumbers(f1);
  const f2Nums = extractNumbers(f2);
  if (f1Nums.length > 0 && f2Nums.length > 0) {
    const shareNum = f1Nums.some(n => f2Nums.includes(n));
    if (!shareNum) return false;
  }

  const f1Colors = extractColors(f1);
  const f2Colors = extractColors(f2);
  if (f1Colors.length > 0 && f2Colors.length > 0) {
    const shareColor = f1Colors.some(c => f2Colors.includes(c));
    if (!shareColor) return false;
  }

  if (f1.includes(f2) || f2.includes(f1)) return true;

  const f1Tokens = f1.split(/\s+/).filter(w => w.length >= 3 && !['KAIN', 'BAHAN', 'CORAK', 'MOTIF', 'SALUR', 'POLOS'].includes(w));
  const f2Tokens = f2.split(/\s+/).filter(w => w.length >= 3 && !['KAIN', 'BAHAN', 'CORAK', 'MOTIF', 'SALUR', 'POLOS'].includes(w));
  if (f1Tokens.length > 0 && f2Tokens.length > 0) {
    const common = f1Tokens.filter(t => f2Tokens.includes(t));
    if (common.length > 0) return true;
  }

  return false;
}

/**
 * Memeriksa kecocokan jenis dan warna kain secara akurat dan komprehensif.
 * Mencegah kain dengan varian warna atau kode berbeda (misal DEALOVA 2515 PINK vs DEALOVA 2523 BIRU)
 * salah terhubung dan tertukar.
 */
export function isFabricCompatible(itemFabric?: string, targetFabric?: string): boolean {
  if (!itemFabric || !targetFabric) return true;
  const tParts = targetFabric.split(/[,+]/).map(p => p.trim()).filter(Boolean);
  const iParts = itemFabric.split(/[,+]/).map(p => p.trim()).filter(Boolean);
  if (tParts.length === 0 || iParts.length === 0) return true;
  return tParts.some(tp => iParts.some(ip => isSingleFabricCompatible(ip, tp)));
}

/**
 * Memisahkan artikel produk SPK jika merupakan produk kombinasi (Combo) yang digabung dengan tanda "+",
 * serta merekonstruksi alokasi target potong dan progres pengiriman per produk berdasarkan Surat Jalan.
 */
export function buildSplitSpkItems(
  spkId: string,
  spkNumber: string,
  produk: string,
  vendor: string,
  targetCutQty: SizeBreakdown,
  deliveredQty?: SizeBreakdown,
  existingItems?: SPKProductItem[] | string,
  suratJalanList?: SuratJalan[] | any[],
  spkPONumbers?: string[] | string,
  spkFabricName?: string
): SPKProductItem[] {
  let safeExistingItems: SPKProductItem[] = [];
  if (Array.isArray(existingItems)) {
    safeExistingItems = existingItems;
  } else if (typeof existingItems === 'string') {
    try {
      safeExistingItems = JSON.parse(existingItems);
    } catch {
      safeExistingItems = [];
    }
  }

  // Kumpulkan PO acuan yang terikat ke SPK ini
  const allSpkPOs: string[] = [];
  if (typeof spkPONumbers === 'string' && spkPONumbers.trim()) {
    allSpkPOs.push(spkPONumbers.trim().toUpperCase());
  } else if (Array.isArray(spkPONumbers)) {
    spkPONumbers.forEach((p) => {
      if (typeof p === 'string' && p.trim()) allSpkPOs.push(p.trim().toUpperCase());
    });
  }
  safeExistingItems.forEach((ex) => {
    if (ex.sourcePONumber && !allSpkPOs.includes(ex.sourcePONumber.trim().toUpperCase())) {
      allSpkPOs.push(ex.sourcePONumber.trim().toUpperCase());
    }
  });

  // Kumpulkan semua nama produk jika terdapat tanda "+"
  let names: string[] = [];
  if (safeExistingItems && safeExistingItems.length > 0) {
    safeExistingItems.forEach((it) => {
      if (it.produk && it.produk.includes('+')) {
        it.produk.split('+').forEach((p) => {
          const trimmed = p.trim();
          if (trimmed && !names.includes(trimmed)) names.push(trimmed);
        });
      } else if (it.produk && it.produk.trim()) {
        const trimmed = it.produk.trim();
        if (!names.includes(trimmed)) names.push(trimmed);
      }
    });
  }
  if (names.length === 0 && produk) {
    names = produk.split('+').map((p) => p.trim()).filter(Boolean);
  }

  // Jika produk tunggal tanpa tanda "+", kembalikan 1 item
  if (names.length <= 1) {
    let singleDeliv = deliveredQty ? { ...deliveredQty } : { ...emptySizeBreakdown };
    let foundAny = false;
    if (suratJalanList && Array.isArray(suratJalanList)) {
      const calculated: SizeBreakdown = { ...emptySizeBreakdown };
      suratJalanList.forEach((sj) => {
        let items = sj.items || [];
        if (typeof items === 'string') {
          try {
            items = JSON.parse(items);
          } catch {}
        }
        if (Array.isArray(items) && items.length > 0) {
          items.forEach((it: any) => {
            const itemProd = (it.produk || '').trim().toUpperCase();
            const prodMatch = !names[0] || !itemProd || names[0].toUpperCase() === itemProd;
            const directMatch =
              (it.spkId && (it.spkId === spkId || it.spkId === spkNumber)) ||
              (it.spkNumber && (it.spkNumber === spkNumber || it.spkNumber === spkId));
            const hasConflictingSpk =
              (it.spkId && it.spkId !== spkId && it.spkId !== spkNumber) ||
              (it.spkNumber && it.spkNumber !== spkNumber && it.spkNumber !== spkId);
            const fabricMatch = isFabricCompatible(it.jenisKain, spkFabricName);
            const sjHeaderMatch =
              !hasConflictingSpk &&
              !it.spkId &&
              !it.spkNumber &&
              (sj.spkId === spkId || sj.spkNumber === spkNumber || (sj as any).spkNumber === spkNumber);
            const poMatch =
              !hasConflictingSpk &&
              fabricMatch &&
              prodMatch &&
              it.sourcePONumber &&
              allSpkPOs.some((p) => p === it.sourcePONumber?.trim().toUpperCase());

            const isThisSpk = directMatch || sjHeaderMatch || poMatch;
            const qDeliv = it.qtyDelivered || it.deliveredQty;

            if (isThisSpk && prodMatch && qDeliv) {
              foundAny = true;
              SIZE_KEYS.forEach((sz) => {
                calculated[sz] += Number(qDeliv[sz]) || 0;
              });
            }
          });
        } else if (sj.spkId === spkId || sj.spkNumber === spkNumber || (sj as any).spkNumber === spkNumber) {
          const qDeliv = sj.qtyDelivered || (sj as any).deliveredQty;
          const fabricMatch = isFabricCompatible(sj.jenisKain, spkFabricName);
          if (fabricMatch && qDeliv) {
            foundAny = true;
            SIZE_KEYS.forEach((sz) => {
              calculated[sz] += Number(qDeliv[sz]) || 0;
            });
          }
        }
      });
      if (foundAny) {
        singleDeliv = calculated;
      }
    }

    if (
      safeExistingItems &&
      safeExistingItems.length > 0 &&
      !safeExistingItems.some((it) => it.produk && it.produk.includes('+'))
    ) {
      return safeExistingItems.map((orig) => {
        const mergedDeliv: SizeBreakdown = { ...emptySizeBreakdown };
        SIZE_KEYS.forEach((sz) => {
          const calcVal = Number(singleDeliv?.[sz]) || 0;
          const origVal = Number(orig?.deliveredQty?.[sz]) || 0;
          mergedDeliv[sz] = foundAny ? calcVal : Math.max(calcVal, origVal);
        });
        return {
          ...orig,
          deliveredQty: mergedDeliv,
        };
      });
    }
    const orig = safeExistingItems[0];
    return [
      {
        id: orig?.id || `item-${spkId}-1`,
        produk: names[0] || produk || 'PRODUK 1',
        vendor: orig?.vendor || vendor,
        targetCutQty: { ...targetCutQty },
        deliveredQty: singleDeliv,
        sourcePOId: orig?.sourcePOId,
        sourcePONumber: orig?.sourcePONumber,
      },
    ];
  }

  // Multiple names terdeteksi (misal: ["GOLDIE", "MINIBELLE"])
  // 1. Hitung riwayat pengiriman per nama produk dari daftar Surat Jalan secara komprehensif
  const delivPerProduct: Record<string, SizeBreakdown> = {};
  names.forEach((name) => {
    delivPerProduct[name] = { ...emptySizeBreakdown };
  });

  if (suratJalanList && Array.isArray(suratJalanList)) {
    suratJalanList.forEach((sj) => {
      let items = sj.items || [];
      if (typeof items === 'string') {
        try {
          items = JSON.parse(items);
        } catch {}
      }

      if (Array.isArray(items) && items.length > 0) {
        // Multi-item Surat Jalan: periksa setiap artikel muatan tanpa bergantung pada sj.spkId header
        items.forEach((it: any) => {
          const itemProd = (it.produk || '').trim().toUpperCase();
          const matchedName = names.find((n) => n.toUpperCase() === itemProd);
          if (!matchedName) return;

          // Apakah item ini milik SPK yang sedang diproses?
          const directMatch =
            (it.spkId && (it.spkId === spkId || it.spkId === spkNumber)) ||
            (it.spkNumber && (it.spkNumber === spkNumber || it.spkNumber === spkId));

          const itemIdMatch =
            it.spkItemId && safeExistingItems.some((ex) => ex.id === it.spkItemId);

          const hasConflictingSpk =
            (it.spkId && it.spkId !== spkId && it.spkId !== spkNumber) ||
            (it.spkNumber && it.spkNumber !== spkNumber && it.spkNumber !== spkId);

          const fabricMatch = isFabricCompatible(it.jenisKain, spkFabricName);

          const sjHeaderMatch =
            !hasConflictingSpk &&
            !it.spkId &&
            !it.spkNumber &&
            (sj.spkId === spkId || sj.spkNumber === spkNumber || (sj as any).spkNumber === spkNumber);

          const poMatch =
            !hasConflictingSpk &&
            fabricMatch &&
            it.sourcePONumber &&
            allSpkPOs.some((p) => p === it.sourcePONumber?.trim().toUpperCase());

          const isThisSpk = directMatch || itemIdMatch || sjHeaderMatch || poMatch;

          if (isThisSpk) {
            const qDeliv = it.qtyDelivered || it.deliveredQty;
            if (qDeliv) {
              const targetDeliv = delivPerProduct[matchedName];
              SIZE_KEYS.forEach((sz) => {
                targetDeliv[sz] += Number(qDeliv[sz]) || 0;
              });
            }
          }
        });
      } else if (sj.produk) {
        // Single-item Surat Jalan lama
        const itemProd = sj.produk.trim().toUpperCase();
        const matchedName = names.find((n) => n.toUpperCase() === itemProd);
        const matchesSjHeader =
          sj.spkId === spkId ||
          sj.spkNumber === spkNumber ||
          (sj as any).spkNumber === spkNumber;
        const fabricMatch = isFabricCompatible(sj.jenisKain, spkFabricName);

        const qDeliv = sj.qtyDelivered || (sj as any).deliveredQty;
        if (matchedName && matchesSjHeader && fabricMatch && qDeliv) {
          const targetDeliv = delivPerProduct[matchedName];
          SIZE_KEYS.forEach((sz) => {
            targetDeliv[sz] += Number(qDeliv[sz]) || 0;
          });
        }
      }
    });
  }

  // Helper untuk mengambil kalkulasi pengiriman per produk secara case-insensitive
  const getCalculatedDeliv = (prodName: string): SizeBreakdown | undefined => {
    if (!prodName) return undefined;
    if (delivPerProduct[prodName]) return delivPerProduct[prodName];
    const key = Object.keys(delivPerProduct).find(
      (k) => k.trim().toUpperCase() === prodName.trim().toUpperCase()
    );
    return key ? delivPerProduct[key] : undefined;
  };

  // Jika safeExistingItems sudah terpisah rapi (length > 1 dan tidak ada '+'), pertahankan alokasi targetnya
  if (safeExistingItems && safeExistingItems.length > 1) {
    const hasCombinedName = safeExistingItems.some((it) => it.produk && it.produk.includes('+'));
    if (!hasCombinedName) {
      return safeExistingItems.map((ex, idx) => {
        const calculated = getCalculatedDeliv(ex.produk);
        const hasCalculated = calculated && Object.values(calculated).some((v) => v > 0);
        const mergedDeliv: SizeBreakdown = { ...emptySizeBreakdown };
        SIZE_KEYS.forEach((sz) => {
          const calcVal = Number(calculated?.[sz]) || 0;
          const exVal = Number(ex.deliveredQty?.[sz]) || 0;
          mergedDeliv[sz] = hasCalculated ? calcVal : Math.max(calcVal, exVal);
        });

        return {
          ...ex,
          id: ex.id || `item-${spkId}-${idx + 1}`,
          vendor: ex.vendor || vendor,
          deliveredQty: hasCalculated
            ? mergedDeliv
            : (ex.deliveredQty && Object.values(ex.deliveredQty).some((v) => v > 0)
                ? ex.deliveredQty
                : mergedDeliv),
        };
      });
    }
  }

  // 2. Alokasikan target potong per produk
  const targetPerProduct: Record<string, SizeBreakdown> = {};
  names.forEach((name) => {
    targetPerProduct[name] = { ...emptySizeBreakdown };
  });

  SIZE_KEYS.forEach((sz) => {
    const totalSzTarget = Number(targetCutQty?.[sz]) || 0;
    if (totalSzTarget === 0) return;

    // Cek produk mana saja yang memiliki pengiriman di ukuran ini
    const productsWithDeliv = names.filter((name) => {
      const d = getCalculatedDeliv(name);
      return d && Number(d[sz]) > 0;
    });

    if (productsWithDeliv.length === 1) {
      // Seluruh target ukuran ini dialokasikan ke produk yang dikirim
      targetPerProduct[productsWithDeliv[0]][sz] = totalSzTarget;
    } else {
      // Bagi rata sesuai jumlah produk
      const perProductBase = Math.floor(totalSzTarget / names.length);
      const remainder = totalSzTarget % names.length;
      names.forEach((name, idx) => {
        targetPerProduct[name][sz] = perProductBase + (idx === 0 ? remainder : 0);
      });
    }
  });

  // Fallback: Jika ada produk yang targetnya 0 sama sekali karena belum ada pengiriman, bagi rata
  const isAnyProductZero = names.some(
    (name) => Object.values(targetPerProduct[name]).reduce((a, b) => a + b, 0) === 0
  );
  const totalDeliveredAll = Object.values(delivPerProduct).reduce(
    (acc, d) => acc + Object.values(d).reduce((a, b) => a + b, 0),
    0
  );

  if (isAnyProductZero && totalDeliveredAll === 0 && names.length > 1) {
    SIZE_KEYS.forEach((sz) => {
      const totalSzTarget = Number(targetCutQty?.[sz]) || 0;
      if (totalSzTarget === 0) return;
      const perProductBase = Math.floor(totalSzTarget / names.length);
      const remainder = totalSzTarget % names.length;
      names.forEach((name, idx) => {
        targetPerProduct[name][sz] = perProductBase + (idx === 0 ? remainder : 0);
      });
    });
  }

  return names.map((name, idx) => {
    const orig = safeExistingItems.find(
      (it) => it.produk && it.produk.trim().toUpperCase() === name.trim().toUpperCase()
    );
    const calculated = getCalculatedDeliv(name);
    const hasCalculated = calculated && Object.values(calculated).some((v) => v > 0);
    const mergedDeliv: SizeBreakdown = { ...emptySizeBreakdown };
    SIZE_KEYS.forEach((sz) => {
      const calcVal = Number(calculated?.[sz]) || 0;
      const origVal = Number(orig?.deliveredQty?.[sz]) || 0;
      mergedDeliv[sz] = Math.max(calcVal, origVal);
    });

    return {
      id: orig?.id || `item-${spkId}-${idx + 1}`,
      produk: name,
      vendor: orig?.vendor || vendor,
      targetCutQty: targetPerProduct[name],
      deliveredQty: hasCalculated
        ? mergedDeliv
        : (orig?.deliveredQty && Object.values(orig.deliveredQty).some((v) => v > 0)
            ? orig.deliveredQty
            : mergedDeliv),
      sourcePOId: orig?.sourcePOId,
      sourcePONumber: orig?.sourcePONumber,
      fabricSourceType: orig?.fabricSourceType,
      rollIds: orig?.rollIds,
      jenisKain: orig?.jenisKain,
      depositId: orig?.depositId,
      depositInfo: orig?.depositInfo,
    };
  });
}

/**
 * Resolves the accurate PO reference number for a specific item in a Surat Jalan.
 * Takes into account:
 * 1. Specific product item sourcePONumber inside the linked SPK (for combo multi-PO SPKs)
 * 2. Item's direct sourcePONumber
 * 3. Item's legacyPoNumber
 * 4. Linked SPK's global sourcePONumber
 * 5. Other SPKs from the same brand producing the same product
 * 6. Master Production POs matching the brand and product
 * 7. First item's sourcePONumber in Surat Jalan as fallback
 */
export function resolveItemPONumber(
  item?: {
    produk?: string;
    sourcePONumber?: string | null;
    sourcePOId?: string | null;
    spkId?: string;
    spkNumber?: string;
    spkItemId?: string;
    legacyPoNumber?: string;
    brand?: string;
  } | null,
  spkList: SPKCutting[] = [],
  sjFallback?: {
    spkId?: string;
    spkNumber?: string;
    spkItemId?: string;
    brand?: string;
    vendor?: string;
    items?: any[];
  } | null,
  productionPOs: ProductionPO[] = [],
  fobOrders: FobPurchaseOrder[] = []
): string | null {
  if (!item) return null;

  // 1. Explicit item-level PO takes top priority
  if (item.sourcePONumber) {
    return item.sourcePONumber;
  }

  // 2. Legacy PO takes priority if manual migration
  if (item.legacyPoNumber) {
    return item.legacyPoNumber;
  }

  const itemProd = (item.produk || '').trim().toUpperCase();

  // 3. Find linked SPK to inspect item-level PO
  const targetSpkId = item.spkId || sjFallback?.spkId;
  const targetSpkNumber = item.spkNumber || sjFallback?.spkNumber;

  let linkedSPK: SPKCutting | undefined;
  if (targetSpkId || targetSpkNumber) {
    linkedSPK = spkList.find(
      (s) =>
        (targetSpkId && (s.id === targetSpkId || s.spkNumber === targetSpkId)) ||
        (targetSpkNumber && (s.id === targetSpkNumber || s.spkNumber === targetSpkNumber))
    );
  }

  // If no direct ID match, try matching by brand & product combo in SPKs
  if (!linkedSPK && itemProd) {
    const brandName = item.brand || sjFallback?.brand;
    linkedSPK = spkList.find(
      (s) =>
        (!brandName || matchBrand(s.brand, brandName)) &&
        (s.items?.some((p) => p.produk?.trim().toUpperCase() === itemProd) ||
         s.produk?.trim().toUpperCase().includes(itemProd))
    );
  }

  // 4. In linked SPK, find the exact product item
  if (linkedSPK) {
    const spkItems = linkedSPK.items || [];
    const targetItemId = item.spkItemId || sjFallback?.spkItemId;
    const matchedItem = spkItems.find(
      (p) =>
        (targetItemId && p.id === targetItemId) ||
        (itemProd && p.produk?.trim().toUpperCase() === itemProd)
    );
    // If the SPK product item has a specific PO, that is the most accurate PO for this article!
    if (matchedItem?.sourcePONumber) {
      return matchedItem.sourcePONumber;
    }
  }

  // 5. Next, if linkedSPK has a sourcePONumber (single PO SPK)
  if (linkedSPK?.sourcePONumber) {
    return linkedSPK.sourcePONumber;
  }

  // 6. Check other SPKs matching brand and product name
  if (itemProd && spkList.length > 0) {
    const brandName = item.brand || sjFallback?.brand;
    for (const spk of spkList) {
      if (brandName && !matchBrand(spk.brand, brandName)) continue;
      const matched = spk.items?.find(
        (p) => p.produk?.trim().toUpperCase() === itemProd && p.sourcePONumber
      );
      if (matched?.sourcePONumber) {
        return matched.sourcePONumber;
      }
    }
  }

  // 7. Check productionPOs matching brand and product name
  if (productionPOs && productionPOs.length > 0 && itemProd) {
    const brandName = item.brand || sjFallback?.brand;
    const matchedPO = productionPOs.find(
      (po) =>
        (!brandName || matchBrand(po.brand, brandName)) &&
        po.items?.some((it) => it.namaProduk?.trim().toUpperCase() === itemProd)
    );
    if (matchedPO?.noPO) {
      return matchedPO.noPO;
    }
  }

  // 8. Check fobOrders (HPP & Penawaran -> Order Masuk PO)
  if (fobOrders && fobOrders.length > 0 && itemProd) {
    const brandName = item.brand || sjFallback?.brand;
    const matchedFOB = fobOrders.find(
      (fob) =>
        (!brandName || matchBrand(fob.brand, brandName)) &&
        ((fob.skuInduk && itemProd.includes(fob.skuInduk.trim().toUpperCase())) ||
         fob.items?.some((it) => it.sku && itemProd.includes(it.sku.trim().toUpperCase())))
    );
    if (matchedFOB?.poNumber) {
      return matchedFOB.poNumber;
    }
  }

  // 9. Fallback to first item in sj if any
  if (sjFallback?.items?.[0]?.sourcePONumber) {
    return sjFallback.items[0].sourcePONumber;
  }

  return null;
}

/**
 * Mencocokkan warna item PO dengan warna/kain pada Surat Jalan atau SPK
 */
export function matchPOItemColor(
  poColor?: string | null,
  sjFabricOrColor?: string | null,
  spk?: SPKCutting | null,
  allKnownPOColors: string[] = []
): boolean {
  if (!poColor || !poColor.trim()) return true;

  const targetColor = poColor.trim().toUpperCase();
  const fabricStr = (sjFabricOrColor || '').trim().toUpperCase();
  const depWarna = (spk?.depositInfo?.warna || '').trim().toUpperCase();
  const spkFabric = (spk?.depositInfo?.jenisKain || '').trim().toUpperCase();

  const isColorKeywordMatch = (str: string, color: string) => {
    if (!str || !color) return false;
    if (str.includes(color)) return true;
    if (
      (color === 'BROKEN WHITE' || color === 'BW' || color === 'B.W') &&
      (str.includes('BW') || str.includes('BROKEN WHITE') || str.includes('PUTIH TULANG'))
    ) {
      return true;
    }
    if (
      (color === 'HITAM' || color === 'BLACK') &&
      (str.includes('HITAM') || str.includes('BLACK'))
    ) {
      return true;
    }
    if (
      (color === 'PUTIH' || color === 'WHITE') &&
      (str.includes('PUTIH') || str.includes('WHITE'))
    ) {
      return true;
    }
    if (
      (color === 'MOCCA' || color === 'MOKA') &&
      (str.includes('MOCCA') || str.includes('MOKA'))
    ) {
      return true;
    }
    if (
      (color === 'TERRACOTA' || color === 'TERRACOTTA' || color === 'TERAKOTA') &&
      (str.includes('TERRACOTA') || str.includes('TERRACOTTA') || str.includes('TERAKOTA'))
    ) {
      return true;
    }
    return false;
  };

  // 1. Cek langsung apakah kain / spk cocok dengan targetColor
  if (
    isColorKeywordMatch(fabricStr, targetColor) ||
    isColorKeywordMatch(depWarna, targetColor) ||
    isColorKeywordMatch(spkFabric, targetColor)
  ) {
    return true;
  }

  // 2. Jika kain / spk ternyata memuat warna LAIN yang ada di PO ini, maka BUKAN warna ini
  const hasOtherColor = allKnownPOColors.some((otherCol) => {
    if (otherCol.trim().toUpperCase() === targetColor) return false;
    return (
      isColorKeywordMatch(fabricStr, otherCol.trim().toUpperCase()) ||
      isColorKeywordMatch(depWarna, otherCol.trim().toUpperCase()) ||
      isColorKeywordMatch(spkFabric, otherCol.trim().toUpperCase())
    );
  });

  if (hasOtherColor) {
    return false;
  }

  // 3. Jika kain tidak memuat warna apapun dan PO hanya memiliki 1 warna, anggap cocok
  if (allKnownPOColors.length <= 1) {
    return true;
  }

  return false;
}
