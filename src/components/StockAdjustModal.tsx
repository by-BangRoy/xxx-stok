import React, { useState, useEffect } from 'react';
import { Product, ProductVariant, StockChangeType } from '../types/inventory.ts';
import { useInventory } from '../context/InventoryContext.tsx';
import { 
  X, 
  ShoppingBag, 
  PackagePlus, 
  RotateCcw, 
  AlertTriangle, 
  ClipboardCheck, 
  Plus, 
  Minus,
  Sparkles,
  ArrowRight
} from 'lucide-react';

interface StockAdjustModalProps {
  product: Product;
  initialVariantId?: string;
  isOpen: boolean;
  onClose: () => void;
}

export const StockAdjustModal: React.FC<StockAdjustModalProps> = ({
  product,
  initialVariantId,
  isOpen,
  onClose,
}) => {
  const { adjustStock } = useInventory();
  const [selectedVariantId, setSelectedVariantId] = useState<string>(
    initialVariantId || product.variants[0]?.id || ''
  );
  const [changeType, setChangeType] = useState<StockChangeType>('sale');
  const [quantity, setQuantity] = useState<number>(1);
  const [reason, setReason] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Lock body scroll on mobile and desktop
  useEffect(() => {
    if (isOpen) {
      const originalStyle = window.getComputedStyle(document.body).overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalStyle;
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const currentVariant = product.variants.find((v) => v.id === selectedVariantId) || product.variants[0];
  if (!currentVariant) return null;

  // Determine if delta is positive or negative based on changeType
  const isAddition = changeType === 'restock' || changeType === 'return';
  const delta = isAddition ? Math.abs(quantity) : -Math.abs(quantity);
  const currentStock = currentVariant.stock;
  const projectedStock = Math.max(0, currentStock + delta);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (quantity <= 0) return;

    setIsSubmitting(true);
    const defaultReason = 
      changeType === 'sale' ? 'Penjualan Kasir Toko' :
      changeType === 'restock' ? 'Restock Barang Masuk' :
      changeType === 'return' ? 'Retur Penukaran Pelanggan' :
      changeType === 'damage' ? 'Barang Cacat / Rusak' : 'Penyesuaian Opname Fisik';

    const finalReason = reason.trim() || defaultReason;
    const success = await adjustStock(product.id, currentVariant.id, delta, changeType, finalReason);
    setIsSubmitting(false);

    if (success) {
      onClose();
    }
  };

  const setPresetQuantity = (qty: number) => {
    setQuantity(qty);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-900 text-white">
          <div className="flex items-center gap-3">
            <img 
              src={product.imageUrl || '/assets/aistudio/WhatsApp_Image_2026-10-20_at_14.00.08_44e1b065.jpeg'} 
              alt={product.name}
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/assets/aistudio/WhatsApp_Image_2026-10-20_at_14.00.08_44e1b065.jpeg';
              }} 
              className="w-12 h-12 rounded-lg object-cover border border-white/20 shrink-0"
            />
            <div>
              <span className="text-[10px] font-bold text-amber-300 tracking-wider uppercase">
                {product.category}{product.sku && product.sku.trim() !== '' ? ` • ${product.sku}` : ''}
              </span>
              <h2 className="text-base font-bold text-white line-clamp-1">{product.name}</h2>
              <p className="text-xs text-slate-300">Lokasi: {product.location || 'Gudang Utama'}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/80 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Variant Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Pilih Varian (Ukuran & Warna)
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {product.variants.map((v) => {
                const isSelected = v.id === currentVariant.id;
                return (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => setSelectedVariantId(v.id)}
                    className={`p-2.5 rounded-xl border text-left transition-all relative ${
                      isSelected
                        ? 'border-rose-600 bg-rose-50/60 ring-2 ring-rose-500/30'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      {v.colorHex && (
                        <span 
                          className="w-3 h-3 rounded-full border border-slate-300 shrink-0" 
                          style={{ backgroundColor: v.colorHex }}
                        />
                      )}
                      <span className="text-xs font-bold text-slate-800 truncate">{v.size}</span>
                    </div>
                    <div className="text-[11px] text-slate-500 truncate mb-1">{v.color}</div>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-400">Stok:</span>
                      <span className={`font-black ${
                        v.stock === 0 ? 'text-rose-600' : v.stock <= v.minStock ? 'text-amber-600' : 'text-slate-800'
                      }`}>
                        {v.stock} pcs
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Action Type */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Jenis Perubahan Stok
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setChangeType('sale')}
                className={`p-2.5 rounded-xl border flex items-center gap-2 text-xs font-bold transition-all ${
                  changeType === 'sale'
                    ? 'bg-rose-50 border-rose-500 text-rose-700 ring-2 ring-rose-400/20'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <ShoppingBag className="w-4 h-4 text-rose-600" />
                <span>Penjualan (-)</span>
              </button>

              <button
                type="button"
                onClick={() => setChangeType('restock')}
                className={`p-2.5 rounded-xl border flex items-center gap-2 text-xs font-bold transition-all ${
                  changeType === 'restock'
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-700 ring-2 ring-emerald-400/20'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <PackagePlus className="w-4 h-4 text-emerald-600" />
                <span>Restock (+)</span>
              </button>

              <button
                type="button"
                onClick={() => setChangeType('return')}
                className={`p-2.5 rounded-xl border flex items-center gap-2 text-xs font-bold transition-all ${
                  changeType === 'return'
                    ? 'bg-blue-50 border-blue-500 text-blue-700 ring-2 ring-blue-400/20'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <RotateCcw className="w-4 h-4 text-blue-600" />
                <span>Retur Masuk (+)</span>
              </button>

              <button
                type="button"
                onClick={() => setChangeType('damage')}
                className={`p-2.5 rounded-xl border flex items-center gap-2 text-xs font-bold transition-all ${
                  changeType === 'damage'
                    ? 'bg-amber-50 border-amber-500 text-amber-700 ring-2 ring-amber-400/20'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>Rusak / Reject (-)</span>
              </button>

              <button
                type="button"
                onClick={() => setChangeType('adjustment')}
                className={`p-2.5 rounded-xl border flex items-center gap-2 text-xs font-bold transition-all ${
                  changeType === 'adjustment'
                    ? 'bg-indigo-50 border-indigo-500 text-indigo-700 ring-2 ring-indigo-400/20'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <ClipboardCheck className="w-4 h-4 text-indigo-600" />
                <span>Opname Koreksi</span>
              </button>
            </div>
          </div>

          {/* Quantity Input & Quick Buttons */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Jumlah Unit (Pcs)
              </label>
              <div className="flex gap-1.5">
                {[1, 2, 5, 10, 20].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setPresetQuantity(preset)}
                    className="text-xs px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md font-semibold transition-colors"
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="w-12 h-12 rounded-xl border border-slate-300 hover:bg-slate-100 flex items-center justify-center text-slate-700 text-lg font-bold transition-colors"
              >
                <Minus className="w-5 h-5" />
              </button>
              <input
                type="number"
                min="1"
                max="9999"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                className="flex-1 h-12 text-center text-xl font-black text-slate-900 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
              />
              <button
                type="button"
                onClick={() => setQuantity((q) => q + 1)}
                className="w-12 h-12 rounded-xl border border-slate-300 hover:bg-slate-100 flex items-center justify-center text-slate-700 text-lg font-bold transition-colors"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Reason / Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Catatan / No. Nota (Opsional)
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Contoh: Nota #INV-8829 atau Kiriman Konveksi"
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
            />
          </div>

          {/* Projected Stock Preview */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
            <div>
              <div className="text-[11px] text-slate-500 uppercase font-semibold">Simulasi Stok Real-Time</div>
              <div className="text-xs text-slate-700 mt-0.5">
                {currentVariant.size} • {currentVariant.color}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-xs text-slate-400">Saat Ini</div>
                <div className="text-base font-bold text-slate-700">{currentStock} pcs</div>
              </div>

              <ArrowRight className="w-4 h-4 text-slate-400" />

              <div className="text-right">
                <div className="text-xs text-slate-400">Menjadi</div>
                <div className={`text-lg font-black ${
                  projectedStock === 0 ? 'text-rose-600' : projectedStock <= currentVariant.minStock ? 'text-amber-600' : 'text-emerald-600'
                }`}>
                  {projectedStock} pcs
                </div>
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:text-slate-800 transition-colors"
            >
              Batal
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white text-xs font-bold rounded-xl shadow-lg shadow-rose-600/30 transition-all flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>{isSubmitting ? 'Menyinkronkan...' : 'Konfirmasi & Sinkronkan Sekarang'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
