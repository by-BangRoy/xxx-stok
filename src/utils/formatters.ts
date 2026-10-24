/**
 * Utility helpers for formatting quantities into dozens (lusin)
 * 1 lusin = 12 pcs
 */

export const formatLusin = (pcs: number): string => {
  if (!pcs || pcs <= 0) return '0 lusin';
  const lusin = pcs / 12;
  // If whole number, display as integer, otherwise format nicely up to 2 decimal places
  const formatted =
    lusin % 1 === 0
      ? lusin.toString()
      : lusin.toLocaleString('id-ID', {
          minimumFractionDigits: 0,
          maximumFractionDigits: 2,
        });
  return `${formatted} lusin`;
};

export const formatStockWithLusin = (pcs: number): string => {
  return `${pcs} pcs (${formatLusin(pcs)})`;
};
