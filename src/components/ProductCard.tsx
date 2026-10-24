import React, { useState } from 'react';
import { Product } from '../types/inventory.ts';
import { useInventory } from '../context/InventoryContext.tsx';
import { formatLusin } from '../utils/formatters.ts';
import { 
  MapPin, 
  AlertTriangle, 
  AlertOctagon,
  Edit3, 
  SlidersHorizontal
} from 'lucide-react';

interface ProductCardProps {
  product: Product;
  onOpenAdjust: (product: Product, variantId?: string) => void;
  onOpenEdit: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onOpenAdjust,
  onOpenEdit,
}) => {
  const { settings } = useInventory();
  const defaultMin = settings.defaultMinStockAlert || 3;
  const defaultVar = product.variants.find((v) => Number(v.stock) <= 0) || product.variants[0];
  const [selectedVariantId, setSelectedVariantId] = useState<string>(defaultVar?.id || '');

  const selectedVariant = product.variants.find((v) => v.id === selectedVariantId) || product.variants[0];

  const isTotalOut = Number(product.totalStock) === 0;
  const zeroVariants = product.variants.filter((v) => Number(v.stock) <= 0);
  const hasZeroVariant = zeroVariants.length > 0;
  const lowVariants = product.variants.filter((v) => {
    const vStock = Number(v.stock);
    const min = Number(v.minStock) > 0 ? Number(v.minStock) : defaultMin;
    return vStock > 0 && vStock <= min;
  });
  const hasLowVariant = lowVariants.length > 0;

  // Sort variants so out of stock (0 pcs) and low stock variants appear first
  const sortedVariants = [...product.variants].sort((a, b) => {
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
    <div className="bg-white rounded-2xl border border-yellow-200/90 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden flex flex-col group">
      {/* Product Image & Top Badges */}
      <div className="relative aspect-[4/3] bg-yellow-50 overflow-hidden">
        <img
          src={product.imageUrl || '/assets/aistudio/WhatsApp_Image_2026-10-20_at_14.00.08_44e1b065.jpeg'}
          alt={product.name}
          onError={(e) => {
            (e.target as HTMLImageElement).src = '/assets/aistudio/WhatsApp_Image_2026-10-20_at_14.00.08_44e1b065.jpeg';
          }}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />

        {/* Gradient Overlay for badges readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30 pointer-events-none" />

        {/* Top Badges */}
        <div className="absolute top-2 left-2 flex flex-wrap gap-1 items-center">
          {product.sku && product.sku.trim() !== '' && (
            <span className="text-[10px] font-extrabold tracking-wider bg-slate-900/85 backdrop-blur-md text-amber-300 px-2 py-0.5 rounded-md shadow-sm">
              {product.sku}
            </span>
          )}
          {product.category && product.category.trim() !== '' && (
            <span className="text-[10px] font-bold bg-amber-400 text-slate-950 px-2 py-0.5 rounded-md shadow-sm">
              {product.category}
            </span>
          )}
        </div>

        {/* Edit Button */}
        <button
          onClick={() => onOpenEdit(product)}
          className="absolute top-2 right-2 w-7 h-7 rounded-lg bg-white/95 hover:bg-white text-slate-700 flex items-center justify-center shadow-md transition-all active:scale-95"
          title="Edit Barang"
        >
          <Edit3 className="w-3.5 h-3.5" />
        </button>

        {/* Bottom Badges on Image */}
        <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-white">
          {product.location ? (
            <div className="flex items-center gap-1 text-[10px] sm:text-[11px] font-medium bg-black/50 backdrop-blur-sm px-2 py-0.5 rounded">
              <MapPin className="w-3 h-3 text-amber-300" />
              <span className="truncate max-w-[110px] sm:max-w-[130px]">{product.location}</span>
            </div>
          ) : (
            <div />
          )}

          <div>
            {isTotalOut ? (
              <span className="text-[10px] sm:text-[11px] font-black bg-rose-600 text-white px-2 py-0.5 rounded shadow flex items-center gap-1 animate-pulse">
                <AlertOctagon className="w-3 h-3 text-white" />
                <span>0 pcs (TOTAL HABIS)</span>
              </span>
            ) : hasZeroVariant ? (
              <span className="text-[10px] sm:text-[11px] font-black bg-rose-600 text-white px-2 py-0.5 rounded shadow flex items-center gap-1">
                <AlertOctagon className="w-3 h-3 text-white" />
                <span>{product.totalStock} pcs ({zeroVariants.length} Varian Habis)</span>
              </span>
            ) : hasLowVariant ? (
              <span className="text-[10px] sm:text-[11px] font-black bg-amber-500 text-slate-950 px-2 py-0.5 rounded shadow flex items-center gap-1">
                <AlertTriangle className="w-3 h-3 text-slate-950" />
                <span>{product.totalStock} pcs (Menipis)</span>
              </span>
            ) : (
              <span className="text-[10px] sm:text-[11px] font-bold bg-emerald-600/95 text-white px-2 py-0.5 rounded shadow">
                {product.totalStock} pcs ({formatLusin(product.totalStock)})
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Card Content */}
      <div className="p-3 sm:p-4 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-start justify-between gap-1.5 mb-2">
            <h3 className="font-bold text-slate-900 text-sm leading-snug line-clamp-2">
              {product.name}
            </h3>
          </div>

          {/* Variant Selector Chips */}
          <div className="space-y-1.5 mb-2.5">
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
              <span>Varian & Stok Fisik:</span>
              <span className="text-amber-800/80 font-medium">Pilih varian</span>
            </div>

            <div className="grid grid-cols-1 gap-1 max-h-36 overflow-y-auto pr-0.5">
              {sortedVariants.map((variant) => {
                const isSelected = variant.id === selectedVariant?.id;
                const vStock = Number(variant.stock) || 0;
                const vMin = Number(variant.minStock) > 0 ? Number(variant.minStock) : defaultMin;
                const isOut = vStock <= 0;
                const isLow = vStock <= vMin && vStock > 0;

                return (
                  <div
                    key={variant.id}
                    onClick={() => setSelectedVariantId(variant.id)}
                    className={`p-1.5 sm:p-2 rounded-xl border text-xs flex items-center justify-between transition-all cursor-pointer ${
                      isSelected
                        ? isOut
                          ? 'border-rose-500 bg-rose-50 ring-2 ring-rose-400/40'
                          : 'border-amber-400 bg-amber-50/80 ring-1 ring-amber-400/40'
                        : isOut
                        ? 'border-rose-300 bg-rose-50/40'
                        : 'border-yellow-100 hover:border-yellow-300 bg-yellow-50/30'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 min-w-0">
                      {variant.colorHex && (
                        <span
                          className="w-2.5 h-2.5 rounded-full border border-slate-300 shrink-0"
                          style={{ backgroundColor: variant.colorHex }}
                        />
                      )}
                      <span className="font-bold text-slate-800">{variant.size}</span>
                      <span className="text-slate-400 text-[11px] truncate">({variant.color})</span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <span
                        className={`font-black text-xs px-2 py-0.5 rounded-md shadow-xs ${
                          isOut
                            ? 'bg-rose-600 text-white'
                            : isLow
                            ? 'bg-amber-400 text-slate-950'
                            : 'bg-emerald-50 text-emerald-900 border border-emerald-200 font-bold'
                        }`}
                      >
                        {isOut ? '0 pcs (HABIS)' : isLow ? `${vStock} pcs (MENIPIS)` : `${vStock} pcs`}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-2 border-t border-yellow-100 flex items-center gap-2">
          <button
            onClick={() => onOpenAdjust(product, selectedVariant?.id)}
            className="flex-1 py-2 px-3 bg-slate-900 hover:bg-amber-500 hover:text-slate-950 text-white rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-1.5 shadow-sm active:scale-95"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-amber-400 group-hover:text-slate-950" />
            <span>Kelola & Ubah Stok</span>
          </button>
        </div>
      </div>
    </div>
  );
};
