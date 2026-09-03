// ============================================================
// KonvekSys Currency & Number Formatters
// ============================================================

/**
 * Format string atau number menjadi format titik ribuan Indonesia (contoh: 40000 -> "40.000")
 */
export function formatRupiahInput(value: number | string): string {
  if (value === '' || value === undefined || value === null) return '';
  const numStr = String(value).replace(/\D/g, '');
  if (!numStr) return '';
  return new Intl.NumberFormat('id-ID').format(parseInt(numStr, 10));
}

/**
 * Parse string format ribuan bertitik kembali ke number (contoh: "40.000" -> 40000)
 */
export function parseRupiahInput(formattedStr: string): number {
  if (!formattedStr) return 0;
  const clean = String(formattedStr).replace(/\D/g, '');
  return clean ? parseInt(clean, 10) : 0;
}

/**
 * Format number ke tampilan lengkap Rp (contoh: 40000 -> "Rp 40.000")
 */
export function formatRp(num: number | null | undefined): string {
  if (!num || num === 0) return 'Rp 0';
  return 'Rp ' + new Intl.NumberFormat('id-ID').format(num);
}

/**
 * Format string tanggal (ISO string atau YYYY-MM-DD) menjadi format tanggal Indonesia (contoh: "01 Sep 2026")
 */
export function formatDateIndo(dateStr?: string | null): string {
  if (!dateStr) return '-';
  try {
    const clean = String(dateStr).split('T')[0];
    const parts = clean.split('-');
    if (parts.length === 3) {
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
      const day = parts[2];
      const mIdx = parseInt(parts[1], 10) - 1;
      const year = parts[0];
      return `${day} ${months[mIdx] || ''} ${year}`;
    }
    return clean;
  } catch {
    return String(dateStr);
  }
}

/**
 * Menghitung periode Sabtuan (Sabtu ke Sabtu).
 * offsetWeeks: 0 = Sabtuan pekan ini, -1 = Sabtuan pekan lalu
 */
export function getSabtuanPeriod(offsetWeeks = 0, refDate = new Date()) {
  const d = new Date(refDate);
  d.setDate(d.getDate() + offsetWeeks * 7);
  const day = d.getDay(); // 0 = Minggu, 1 = Senin, ..., 6 = Sabtu

  // Sabtu akhir pekan ini
  const diffToSaturday = 6 - day;
  const thisSaturday = new Date(d);
  thisSaturday.setDate(d.getDate() + diffToSaturday);

  // Sabtu awal (7 hari sebelumnya)
  const lastSaturday = new Date(thisSaturday);
  lastSaturday.setDate(thisSaturday.getDate() - 7);

  const startDate = lastSaturday.toISOString().split('T')[0];
  const endDate = thisSaturday.toISOString().split('T')[0];

  return {
    startDate,
    endDate,
    label: `Sabtu, ${formatDateIndo(startDate)} – Sabtu, ${formatDateIndo(endDate)}`,
  };
}

