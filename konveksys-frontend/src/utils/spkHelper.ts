import { SPKProductItem, SizeBreakdown, SuratJalan } from '../types';

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
  existingItems?: SPKProductItem[],
  suratJalanList?: SuratJalan[] | any[]
): SPKProductItem[] {
  // Kumpulkan semua nama produk jika terdapat tanda "+"
  let names: string[] = [];
  if (existingItems && existingItems.length > 0) {
    existingItems.forEach((it) => {
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
    if (existingItems && existingItems.length > 0 && !existingItems.some(it => it.produk && it.produk.includes('+'))) {
      return existingItems;
    }
    return [
      {
        id: `item-${spkId}-1`,
        produk: names[0] || produk || 'PRODUK 1',
        vendor,
        targetCutQty: { ...targetCutQty },
        deliveredQty: deliveredQty ? { ...deliveredQty } : { ...emptySizeBreakdown },
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

  // Jika existingItems sudah terpisah rapi (length > 1 dan tidak ada '+'), pertahankan alokasi targetnya
  if (existingItems && existingItems.length > 1) {
    const hasCombinedName = existingItems.some((it) => it.produk && it.produk.includes('+'));
    if (!hasCombinedName) {
      return existingItems.map((ex, idx) => ({
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

  return names.map((name, idx) => ({
    id: `item-${spkId}-${idx + 1}`,
    produk: name,
    vendor,
    targetCutQty: targetPerProduct[name],
    deliveredQty: delivPerProduct[name],
  }));
}
