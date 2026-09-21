import { SPKProductItem, SizeBreakdown, SuratJalan, SPKCutting, ProductionPO } from '../types';

export const emptySizeBreakdown: SizeBreakdown = {
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
};

export const SIZE_KEYS = [
  's', 'm', 'l', 'xl', 'xxl',
  'anak4', 'anak6', 'anak8', 'anak10', 'anak12', 'anak14', 'anak16',
] as (keyof SizeBreakdown)[];

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

  // Helper untuk memeriksa kecocokan jenis / warna kain
  const isFabricCompatible = (itemFabric?: string, targetFabric?: string) => {
    if (!itemFabric || !targetFabric) return true;
    const f1 = itemFabric.trim().toUpperCase();
    const f2 = targetFabric.trim().toUpperCase();
    if (f1 === f2) return true;
    if (f1.includes(f2) || f2.includes(f1)) return true;

    // Deteksi warna spesifik agar warna berbeda tidak saling campur
    const colors = [
      'BW', 'PUTIH', 'PINK', 'MOCCA', 'MOKA', 'TERRACOTA', 'TERACOTTA',
      'HITAM', 'NAVY', 'SAGE', 'LILAC', 'CREAM', 'MAROON', 'DENIM', 'ARMY'
    ];
    const f1Colors = colors.filter((c) => f1.includes(c));
    const f2Colors = colors.filter((c) => f2.includes(c));
    if (f1Colors.length > 0 && f2Colors.length > 0) {
      const hasSharedColor = f1Colors.some((c) => f2Colors.includes(c));
      if (!hasSharedColor) return false;
    }
    return true;
  };

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
    if (suratJalanList && Array.isArray(suratJalanList)) {
      const calculated: SizeBreakdown = { ...emptySizeBreakdown };
      let foundAny = false;
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
          mergedDeliv[sz] = Math.max(calcVal, origVal);
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
          mergedDeliv[sz] = Math.max(calcVal, exVal);
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
  productionPOs: ProductionPO[] = []
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
        (!brandName || s.brand?.trim().toUpperCase() === brandName.trim().toUpperCase()) &&
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
      if (brandName && spk.brand?.trim().toUpperCase() !== brandName.trim().toUpperCase()) continue;
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
        (!brandName || po.brand?.trim().toUpperCase() === brandName.trim().toUpperCase()) &&
        po.items?.some((it) => it.namaProduk?.trim().toUpperCase() === itemProd)
    );
    if (matchedPO?.noPO) {
      return matchedPO.noPO;
    }
  }

  // 8. Fallback to first item in sj if any
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
