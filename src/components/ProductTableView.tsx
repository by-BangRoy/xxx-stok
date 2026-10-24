import React, { useState } from 'react';
import { Product, ProductVariant } from '../types/inventory.ts';
import { useInventory } from '../context/InventoryContext.tsx';
import { formatLusin } from '../utils/formatters.ts';
import { 
  SlidersHorizontal, 
  Edit3, 
  AlertTriangle, 
  AlertOctagon,
  CheckCircle2,
  Plus, 
  Minus, 
  MapPin,
  RefreshCw
} from 'lucide-react';

interface ProductTableViewProps {
  products: Product[];
  onOpenAdjust: (product: Product, variantId?: string) => void;
  onOpenEdit: (product: Product) => void;
  filterStatus?: string;
}

export const ProductTableView: React.FC<ProductTableViewProps> = ({
  products,
  onOpenAdjust,
  onOpenEdit,
  filterStatus,
}) => {
  const { adjustStock, settings } = useInventory();
  const defaultMin = settings.defaultMinStockAlert || 3;
  const [adjustingId, setAdjustingId] = useState<string | null>(null);

  const handleQuickAdjust = async (product: Product, variant: ProductVariant, delta: number) => {
    if (variant.stock + delta < 0) return;
    setAdjustingId(variant.id);
    const changeType = delta < 0 ? 'sale' : 'restock';
    const reason = delta < 0 ? 'Barang Keluar (Tabel Kasir)' : 'Barang Masuk (Tabel Restock)';
    await adjustStock(product.id, variant.id, delta, changeType, reason);
    setAdjustingId(null);
  };

  return (
    <div className="bg-white rounded-2xl border border-yellow-200/90 overflow-hidden shadow-xs">
      {/* Mobile scroll hint */}
      <div className="sm:hidden px-3 py-1.5 bg-yellow-50/90 border-b border-yellow-200 text-[10px] text-amber-900 font-semibold flex items-center justify-between">
        <span>Tabel Rinci Stok</span>
        <span className="text-amber-700">← Geser horizontal →</span>
      </div>

      <div className="overflow-x-auto no-scrollbar">
        <table className="w-full text-left text-xs text-slate-700 min-w-[680px] sm:min-w-full">
          <thead className="bg-yellow-50/80 border-b border-yellow-200 text-slate-700 uppercase tracking-wider font-bold text-[11px]">
            <tr>
              <th className="py-3 px-3 sm:px-4">Barang</th>
              <th className="py-3 px-3 sm:px-4">Kategori & SKU</th>
              <th className="py-3 px-3 sm:px-4">Lokasi Rak</th>
              <th className="py-3 px-3 sm:px-4 min-w-[260px]">Varian & Stok Fisik (Per Pcs)</th>
              <th className="py-3 px-3 sm:px-4 whitespace-nowrap">Total Stok</th>
              <th className="py-3 px-3 sm:px-4 whitespace-nowrap">Status Peringatan</th>
              <th className="py-3 px-3 sm:px-4 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-yellow-100/70">
            {products.map((product) => {
              const isOut = Number(product.totalStock) === 0;
              const zeroVariants = product.variants.filter((v) => Number(v.stock) <= 0);
              const hasZeroVariant = zeroVariants.length > 0;
              const lowVariants = product.variants.filter((v) => {
                const vStock = Number(v.stock);
                const min = Number(v.minStock) > 0 ? Number(v.minStock) : defaultMin;
                return vStock > 0 && vStock <= min;
              });
              const isLow = lowVariants.length > 0;

              // Sort variants so out-of-stock (0 pcs) and low-stock appear first
              const displayVariants = [...product.variants].sort((a, b) => {
                const aOut = Number(a.stock) <= 0 ? 0 : 1;
                const bOut = Number(b.stock) <= 0 ? 0 : 1;
                if (aOut !== bOut) return aOut - bOut;
                const aMin = Number(a.minStock) > 0 ? Number(a.minStock) : defaultMin;
                const bMin = Number(b.minStock) > 0 ? Number(b.minStock) : defaultMin;
                const aLow = Number(a.stock) <= aMin ? 0 : 1;
                const bLow = Number(b.stock) <= bMin ? 0 : 1;
                return aLow - bLow;
              });

              return (
                <tr key={product.id} className="hover:bg-yellow-50/50 transition-colors">
                  {/* Photo & Name */}
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={product.imageUrl || '/assets/aistudio/WhatsApp_Image_2026-10-20_at_14.00.08_44e1b065.jpeg'}
                        alt={product.name}
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/assets/aistudio/WhatsApp_Image_2026-10-20_at_14.00.08_44e1b065.jpeg';
                        }}
                        className="w-12 h-12 rounded-xl object-cover border border-yellow-200 shrink-0 shadow-xs"
                      />
                      <div>
                        <div className="font-extrabold text-slate-900 text-sm leading-snug">{product.name}</div>
                        {product.description && !/di+mport\s+dari\s+file\s+rekap\s+stok\s+csv/i.test(product.description) && (
                          <div className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">{product.description}</div>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Category & optional SKU */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    {product.category && (
                      <span className="inline-block text-[11px] font-bold bg-amber-100 text-amber-950 px-2.5 py-0.5 rounded-lg border border-amber-200/80">
                        {product.category}
                      </span>
                    )}
                    {product.sku && product.sku.trim() !== '' && (
                      <div className="font-mono text-[10px] text-slate-500 mt-1 font-semibold">{product.sku}</div>
                    )}
                  </td>

                  {/* Location */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    {product.location ? (
                      <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                        <MapPin className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <span>{product.location}</span>
                      </div>
                    ) : (
                      <span className="text-slate-400 text-[11px]">-</span>
                    )}
                  </td>

                  {/* Variants & Inline +/- Stock Modifiers */}
                  <td className="py-3.5 px-4">
                    <div className="flex flex-wrap gap-2">
                      {displayVariants.map((variant) => {
                        const vStock = Number(variant.stock) || 0;
                        const vMin = Number(variant.minStock) > 0 ? Number(variant.minStock) : defaultMin;
                        const vOut = vStock <= 0;
                        const vLow = vStock <= vMin && vStock > 0;
                        const isThisAdjusting = adjustingId === variant.id;

                        return (
                          <div
                            key={variant.id}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs shadow-xs transition-all ${
                              vOut
                                ? 'bg-rose-50 border-rose-400 text-rose-950 font-bold ring-2 ring-rose-400/50'
                                : vLow
                                ? 'bg-amber-50 border-amber-400 text-amber-950 font-bold ring-1 ring-amber-400/40'
                                : 'bg-emerald-50/60 border-emerald-200/90 text-emerald-950'
                            }`}
                          >
                            {/* Color chip */}
                            {variant.colorHex && (
                              <span
                                className="w-2.5 h-2.5 rounded-full border border-slate-300 shrink-0 shadow-xs"
                                style={{ backgroundColor: variant.colorHex }}
                              />
                            )}
                            <span className="font-extrabold">{variant.size}</span>
                            <span className="text-slate-500 text-[11px]">({variant.color})</span>

                            {/* Stock Display Badge */}
                            <span className={`font-black text-xs px-2 py-0.5 rounded-md ${
                              vOut 
                                ? 'bg-rose-600 text-white shadow-xs' 
                                : vLow 
                                ? 'bg-amber-400 text-slate-950 shadow-xs' 
                                : 'bg-white text-emerald-950 border border-emerald-200 font-black'
                            }`}>
                              {isThisAdjusting ? '...' : vOut ? '0 pcs (HABIS)' : vLow ? `${variant.stock} pcs (MENIPIS)` : `${variant.stock} pcs`}
                            </span>

                            {/* Mini Instant Adjust +/- Buttons */}
                            <div className="flex items-center gap-1 ml-0.5">
                              <button
                                type="button"
                                disabled={variant.stock <= 0 || isThisAdjusting}
                                onClick={() => handleQuickAdjust(product, variant, -1)}
                                className="w-5 h-5 rounded-md bg-white hover:bg-rose-100 border border-slate-200 text-slate-700 hover:text-rose-700 flex items-center justify-center disabled:opacity-25 disabled:pointer-events-none active:scale-90 transition-all shadow-xs"
                                title="Kurang 1 (Barang Keluar / Terjual)"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <button
                                type="button"
                                disabled={isThisAdjusting}
                                onClick={() => handleQuickAdjust(product, variant, 1)}
                                className="w-5 h-5 rounded-md bg-white hover:bg-emerald-100 border border-slate-200 text-slate-700 hover:text-emerald-700 flex items-center justify-center disabled:opacity-25 disabled:pointer-events-none active:scale-90 transition-all shadow-xs"
                                title="Tambah 1 (Barang Masuk / Restock)"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </td>

                  {/* Total Stok & Lusin */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <div className="flex flex-col items-start gap-1">
                      <span className={`text-xs font-black px-2.5 py-0.5 rounded-full ${
                        isOut
                          ? 'bg-rose-100 text-rose-900 border border-rose-400 font-black'
                          : hasZeroVariant
                          ? 'bg-rose-50 text-rose-900 border border-rose-300 font-extrabold'
                          : isLow
                          ? 'bg-amber-100 text-amber-950 border border-amber-300'
                          : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                      }`}>
                        {product.totalStock} pcs
                      </span>
                      <span className="text-[11px] font-bold text-slate-700 bg-yellow-50 px-2 py-0.5 rounded border border-yellow-200">
                        {formatLusin(product.totalStock)}
                      </span>
                    </div>
                  </td>

                  {/* Status Peringatan (Habis / Menipis / Aman) */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    {isOut ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black bg-rose-600 text-white shadow-xs animate-pulse">
                        <AlertOctagon className="w-3.5 h-3.5 shrink-0" />
                        <span>TOTAL HABIS (0 PCS)</span>
                      </span>
                    ) : hasZeroVariant ? (
                      <div className="flex flex-col items-start gap-1">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-black bg-rose-600 text-white shadow-xs">
                          <AlertOctagon className="w-3.5 h-3.5 shrink-0" />
                          <span>HABIS ({zeroVariants.length} VARIAN 0 PCS)</span>
                        </span>
                        {isLow && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-950 border border-amber-300">
                            <AlertTriangle className="w-3 h-3 text-amber-600 shrink-0" />
                            <span>+{lowVariants.length} varian menipis</span>
                          </span>
                        )}
                      </div>
                    ) : isLow ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-black bg-amber-400 text-slate-950 shadow-xs">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-slate-950" />
                        <span>MENIPIS ({lowVariants.length} VARIAN)</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>Stok Aman</span>
                      </span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="py-3.5 px-4 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => onOpenAdjust(product)}
                        className="px-2.5 py-1.5 bg-slate-900 hover:bg-amber-500 hover:text-slate-950 text-white rounded-xl text-xs font-extrabold transition-colors flex items-center gap-1 shadow-sm active:scale-95"
                        title="Ubah & Catat Stok Detail"
                      >
                        <SlidersHorizontal className="w-3.5 h-3.5 text-amber-400" />
                        <span>Ubah Stok</span>
                      </button>

                      <button
                        onClick={() => onOpenEdit(product)}
                        className="p-1.5 bg-yellow-100/80 hover:bg-yellow-200 text-slate-800 rounded-xl transition-colors border border-yellow-300 active:scale-95"
                        title="Edit Barang"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
