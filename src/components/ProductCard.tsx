import React, { useState } from 'react';
import { Product, ProductVariant } from '../types/inventory.ts';
import { useInventory } from '../context/InventoryContext.tsx';
import { formatLusin } from '../utils/formatters.ts';
import { 
  Plus, 
  Minus, 
  MapPin, 
  AlertTriangle, 
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
  const { adjustStock } = useInventory();
  const [selectedVariantId, setSelectedVariantId] = useState<string>(product.variants[0]?.id || '');
  const [quickAdjustingId, setQuickAdjustingId] = useState<string | null>(null);

  const selectedVariant = product.variants.find((v) => v.id === selectedVariantId) || product.variants[0];

  const isOutOfStock = product.totalStock === 0;
  const isAnyVariantLow = product.variants.some((v) => v.stock <= v.minStock && v.stock > 0);

  // Quick 1-click stock adjust (+1 restock or -1 sale)
  const handleQuickAdjust = async (e: React.MouseEvent, variant: ProductVariant, delta: number) => {
    e.stopPropagation();
    if (variant.stock + delta < 0) return;

    setQuickAdjustingId(variant.id);
    const changeType = delta < 0 ? 'sale' : 'restock';
    const reason = delta < 0 ? 'Barang Keluar (Penjualan Kasir)' : 'Barang Masuk (Restock Cepat)';
    await adjustStock(product.id, variant.id, delta, changeType, reason);
    setQuickAdjustingId(null);
  };

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
            {isOutOfStock ? (
              <span className="text-[10px] sm:text-[11px] font-black bg-rose-600 text-white px-2 py-0.5 rounded shadow">
                0 pcs (0 lusin)
              </span>
            ) : isAnyVariantLow ? (
              <span className="text-[10px] sm:text-[11px] font-black bg-amber-500 text-slate-950 px-2 py-0.5 rounded shadow flex items-center gap-1">
                <AlertTriangle className="w-3 h-3 text-slate-950" />
                {product.totalStock} pcs ({formatLusin(product.totalStock)})
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
          <div className="flex items-start justify-between gap-1.5 mb-1">
            <h3 className="font-bold text-slate-900 text-sm leading-snug line-clamp-2">
              {product.name}
            </h3>
          </div>

          {product.description && (
            <p className="text-xs text-slate-500 line-clamp-1 mb-2">
              {product.description}
            </p>
          )}

          {/* Variant Selector Chips with Instant +/- controls */}
          <div className="space-y-1.5 mb-2.5">
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
              <span>Varian & Stok Fisik:</span>
              <span className="text-amber-800/80 font-medium">Sentuh varian</span>
            </div>

            <div className="grid grid-cols-1 gap-1 max-h-36 overflow-y-auto pr-0.5">
              {product.variants.map((variant) => {
                const isSelected = variant.id === selectedVariant?.id;
                const isLow = variant.stock <= variant.minStock && variant.stock > 0;
                const isOut = variant.stock === 0;

                return (
                  <div
                    key={variant.id}
                    onClick={() => setSelectedVariantId(variant.id)}
                    className={`p-1.5 rounded-xl border text-xs flex items-center justify-between transition-all cursor-pointer ${
                      isSelected
                        ? 'border-amber-400 bg-amber-50/80 ring-1 ring-amber-400/40'
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

                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={`font-black text-xs px-2 py-0.5 rounded-md shadow-xs ${
                          isOut
                            ? 'bg-rose-600 text-white'
                            : isLow
                            ? 'bg-amber-400 text-slate-950'
                            : 'bg-emerald-50 text-emerald-900 border border-emerald-200 font-bold'
                        }`}
                      >
                        {quickAdjustingId === variant.id ? '...' : isOut ? '0 pcs (Habis)' : isLow ? `${variant.stock} pcs (Menipis)` : `${variant.stock} pcs`}
                      </span>

                      {/* Quick 1-click +/- touch buttons */}
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          disabled={variant.stock <= 0 || quickAdjustingId === variant.id}
                          onClick={(e) => handleQuickAdjust(e, variant, -1)}
                          className="w-6 h-6 rounded-lg bg-white hover:bg-rose-100 border border-slate-200 text-slate-700 hover:text-rose-600 flex items-center justify-center disabled:opacity-30 disabled:pointer-events-none active:scale-90 transition-all shadow-xs"
                          title="Kurang 1 (Barang Keluar)"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          disabled={quickAdjustingId === variant.id}
                          onClick={(e) => handleQuickAdjust(e, variant, 1)}
                          className="w-6 h-6 rounded-lg bg-white hover:bg-emerald-100 border border-slate-200 text-slate-700 hover:text-emerald-600 flex items-center justify-center disabled:opacity-30 disabled:pointer-events-none active:scale-90 transition-all shadow-xs"
                          title="Tambah 1 (Barang Masuk)"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
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
