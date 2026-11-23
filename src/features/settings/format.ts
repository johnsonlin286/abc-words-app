const MONTHS = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

/** "November 2026" without depending on the device's Intl data. */
export function monthYear(epochMs: number): string {
  const date = new Date(epochMs);
  return `${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}
