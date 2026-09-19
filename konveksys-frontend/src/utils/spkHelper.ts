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
  suratJalanList?: SuratJalan[] | any[]
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
    if (safeExistingItems && safeExistingItems.length > 0 && !safeExistingItems.some(it => it.produk && it.produk.includes('+'))) {
      return safeExistingItems;
    }
    const orig = safeExistingItems[0];
    return [
      {
        id: orig?.id || `item-${spkId}-1`,
        produk: names[0] || produk || 'PRODUK 1',
        vendor: orig?.vendor || vendor,
        targetCutQty: { ...targetCutQty },
        deliveredQty: deliveredQty ? { ...deliveredQty } : { ...emptySizeBreakdown },
        sourcePOId: orig?.sourcePOId,
        sourcePONumber: orig?.sourcePONumber,
      },
    ];
  }

  // Multiple names terdeteksi (misal: ["GOLDIE", "MINIBELLE"])
  // 1. Hitung riwayat pengiriman per nama produk dari daftar Surat Jalan
  const delivPerProduct: Record<string, SizeBreakdown> = {};
  names.forEach((name) => {
    delivPerProduct[name] = { ...emptySizeBreakdown };
  });

  if (suratJalanList && Array.isArray(suratJalanList)) {
    suratJalanList.forEach((sj) => {
      if (sj.spkId === spkId || sj.spkNumber === spkNumber) {
        let items = sj.items || [];
        if (typeof items === 'string') {
          try {
            items = JSON.parse(items);
          } catch {}
        }
        if (Array.isArray(items) && items.length > 0) {
          items.forEach((it: any) => {
            if ((it.spkId === spkId || it.spkNumber === spkNumber) && it.produk) {
              const matchedName = names.find(
                (n) => n.toUpperCase() === it.produk.trim().toUpperCase()
              );
              if (matchedName && it.qtyDelivered) {
                const targetDeliv = delivPerProduct[matchedName];
                SIZE_KEYS.forEach((sz) => {
                  targetDeliv[sz] += Number(it.qtyDelivered[sz]) || 0;
                });
              }
            }
          });
        } else if (sj.produk) {
          const matchedName = names.find(
            (n) => n.toUpperCase() === sj.produk.trim().toUpperCase()
          );
          if (matchedName && sj.qtyDelivered) {
            const targetDeliv = delivPerProduct[matchedName];
            SIZE_KEYS.forEach((sz) => {
              targetDeliv[sz] += Number(sj.qtyDelivered[sz]) || 0;
            });
          }
        }
      }
    });
  }

  // Jika safeExistingItems sudah terpisah rapi (length > 1 dan tidak ada '+'), pertahankan alokasi targetnya
  if (safeExistingItems && safeExistingItems.length > 1) {
    const hasCombinedName = safeExistingItems.some((it) => it.produk && it.produk.includes('+'));
    if (!hasCombinedName) {
      return safeExistingItems.map((ex, idx) => ({
        ...ex,
        id: ex.id || `item-${spkId}-${idx + 1}`,
        vendor: ex.vendor || vendor,
        deliveredQty: delivPerProduct[ex.produk] || ex.deliveredQty || { ...emptySizeBreakdown },
      }));
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
    const productsWithDeliv = names.filter((n) => (delivPerProduct[n][sz] || 0) > 0);

    if (productsWithDeliv.length === 1) {
      // Hanya 1 produk yang dikirim untuk ukuran ini -> alokasikan seluruh target ke produk tersebut (minimal sama dgn terkirim)
      const prod = productsWithDeliv[0];
      targetPerProduct[prod][sz] = Math.max(totalSzTarget, delivPerProduct[prod][sz]);
    } else if (productsWithDeliv.length > 1) {
      // Lebih dari 1 produk memiliki pengiriman -> bagi proporsional dengan batas minimal sama dengan delivered
      const sumDeliv = productsWithDeliv.reduce((sum, n) => sum + delivPerProduct[n][sz], 0);
      productsWithDeliv.forEach((prod) => {
        const ratio = delivPerProduct[prod][sz] / sumDeliv;
        targetPerProduct[prod][sz] = Math.max(
          delivPerProduct[prod][sz],
          Math.round(totalSzTarget * ratio)
        );
      });
    } else {
      // Belum ada produk yang dikirim di ukuran ini -> alokasikan ke produk utama (Produk #1)
      targetPerProduct[names[0]][sz] = totalSzTarget;
    }
  });

  // Pastikan jika ada produk yang targetnya 0 sementara total SPK > 0 dan belum ada pengiriman,
  // distribusikan target potong secara proporsional ke seluruh produk agar tidak memicu error kuantiti 0
  const isAnyProductZero = names.some(
    (name) => Object.values(targetPerProduct[name]).reduce((a, b) => a + b, 0) === 0
  );
  const totalDeliveredAll = Object.values(delivPerProduct).reduce(
    (acc, deliv) => acc + Object.values(deliv).reduce((a, b) => a + b, 0),
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
    return {
      id: orig?.id || `item-${spkId}-${idx + 1}`,
      produk: name,
      vendor: orig?.vendor || vendor,
      targetCutQty: targetPerProduct[name],
      deliveredQty: delivPerProduct[name],
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

  const itemProd = (item.produk || '').trim().toUpperCase();

  // 1. Find linked SPK first to inspect item-level PO
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

  // 2. In linked SPK, find the exact product item
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

  // 3. Next, check if the item itself already has an explicit sourcePONumber
  if (item.sourcePONumber) {
    return item.sourcePONumber;
  }

  // 4. Next, check legacyPoNumber
  if (item.legacyPoNumber) {
    return item.legacyPoNumber;
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
