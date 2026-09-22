// ============================================================
// PO Item Sorter Utility
// Memastikan urutan rincian item Surat PO Produksi tetap konsisten,
// rapi, dan terkelompok berdasarkan Model, Warna, dan Size (4..16 / S..XXL)
// ============================================================

/**
 * Memberikan bobot angka untuk ukuran pakaian anak & dewasa agar bisa diurutkan dari terkecil ke terbesar.
 */
export function getSizeRank(sizeStr?: string | null): number {
  if (!sizeStr) return 999;
  const s = sizeStr.trim().toUpperCase();

  // Cek jika ukuran murni angka (contoh: "4", "6", "8", "10", "12", "14", "16")
  const directNum = parseInt(s, 10);
  if (!isNaN(directNum) && String(directNum) === s) {
    return directNum;
  }

  // Cek jika ada pola seperti "SIZE 6", "A6", "ANAK 8", "NO. 10"
  const matchNum = s.match(/(?:SIZE|ANAK|A|NO\.?)\s*(\d+)/i);
  if (matchNum && matchNum[1]) {
    return parseInt(matchNum[1], 10);
  }

  // Ukuran standar bayi, huruf dewasa, dan all size
  const letterMap: Record<string, number> = {
    'NB': 1,
    'NEWBORN': 1,
    '0-3M': 2,
    '3-6M': 3,
    '6-12M': 4,
    '1Y': 5,
    '2Y': 6,
    '3Y': 7,
    'XXS': 100,
    'XS': 101,
    'S': 102,
    'M': 103,
    'L': 104,
    'XL': 105,
    '2XL': 106,
    'XXL': 106,
    '3XL': 107,
    'XXXL': 107,
    '4XL': 108,
    '5XL': 109,
    'ALL SIZE': 200,
    'ALLSIZE': 200,
    'FREE SIZE': 200,
    'FREESIZE': 200,
  };

  if (letterMap[s] !== undefined) {
    return letterMap[s];
  }

  return 999;
}

/**
 * Mengurutkan item PO untuk tampilan dan cetak.
 * - Jika terdapat `sortOrder` yang eksplisit dan berbeda, ikuti `sortOrder`.
 * - Jika `sortOrder` sama/kosong (seperti data lama), terapkan pengurutan cerdas:
 *   Nama Produk -> Warna -> Ukuran (Terkecil ke Terbesar).
 */
export function sortProductionPOItems<
  T extends {
    namaProduk?: string;
    warna?: string | null;
    ukuran?: string | null;
    sortOrder?: number | null;
  }
>(items: T[]): T[] {
  if (!Array.isArray(items) || items.length <= 1) return items;

  // Cek apakah ada sortOrder eksplisit yang berbeda
  const sortOrders = items
    .map(i => i.sortOrder)
    .filter((v): v is number => typeof v === 'number');

  const hasDistinctSortOrders =
    sortOrders.length === items.length &&
    new Set(sortOrders).size > 1;

  if (hasDistinctSortOrders) {
    return [...items].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  }

  // Fallback: Smart sorting berdasarkan Model -> Warna -> Size
  return autoSortItemsByColorAndSize(items);
}

/**
 * Mengurutkan item secara ketat berdasarkan Model -> Warna -> Ukuran (Terkecil ke Terbesar).
 * Cocok digunakan pada tombol "Rapikan Urutan" di modal form agar langsung rapi.
 */
export function autoSortItemsByColorAndSize<
  T extends {
    namaProduk?: string;
    warna?: string | null;
    ukuran?: string | null;
  }
>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    // 1. Kelompokkan Model / Nama Artikel
    const prodA = (a.namaProduk || '').trim().toUpperCase();
    const prodB = (b.namaProduk || '').trim().toUpperCase();
    if (prodA !== prodB) {
      return prodA.localeCompare(prodB);
    }

    // 2. Kelompokkan Warna (contoh: MOCCA dulu, lalu BIRU, lalu PINK)
    const colorA = (a.warna || '').trim().toUpperCase();
    const colorB = (b.warna || '').trim().toUpperCase();
    if (colorA !== colorB) {
      return colorA.localeCompare(colorB);
    }

    // 3. Urutkan Ukuran (Size 4 -> 6 -> 8 -> 10 -> 12 -> 14 -> 16 atau S -> M -> L)
    const rankA = getSizeRank(a.ukuran);
    const rankB = getSizeRank(b.ukuran);
    if (rankA !== rankB) {
      return rankA - rankB;
    }

    // 4. Jika ukuran sama persis, urutkan string ukuran
    return (a.ukuran || '').localeCompare(b.ukuran || '');
  });
}
