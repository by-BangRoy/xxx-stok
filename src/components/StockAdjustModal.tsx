import React, { useState, useEffect } from 'react';
import { Product, StockChangeType } from '../types/inventory.ts';
import { useInventory } from '../context/InventoryContext.tsx';
import { formatLusin } from '../utils/formatters.ts';
import { 
  X, 
  ShoppingBag, 
  PackagePlus, 
  RotateCcw, 
  AlertTriangle, 
  ClipboardCheck, 
  Plus, 
  Minus,
  ArrowRight,
  Check,
  CheckCircle2,
  AlertOctagon
} from 'lucide-react';

interface StockAdjustModalProps {
  product: Product;
  initialVariantId?: string;
  isOpen: boolean;
  onClose: () => void;
}

type MainMode = 'decrease' | 'increase' | 'exact';

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
  
  // 3 Primary intuitive modes
  const [mainMode, setMainMode] = useState<MainMode>('decrease');
  // Specific sub-reason
  const [subReason, setSubReason] = useState<string>('sale');
  // Quantity to adjust (or target physical stock if in 'exact' mode)
  const [quantity, setQuantity] = useState<number>(1);
  const [exactStock, setExactStock] = useState<number>(0);
  const [note, setNote] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Sync selected variant when opened with initialVariantId
  useEffect(() => {
    if (initialVariantId) {
      setSelectedVariantId(initialVariantId);
    } else if (product.variants[0]) {
      setSelectedVariantId(product.variants[0].id);
    }
  }, [initialVariantId, product]);

  // Lock body scroll when open
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

  const currentStock = Number(currentVariant.stock) || 0;
  const minStock = Number(currentVariant.minStock) || 2;

  // Calculate delta & projected stock based on active mode
  let delta = 0;
  let projectedStock = currentStock;
  let finalChangeType: StockChangeType = 'adjustment';

  if (mainMode === 'decrease') {
    const qty = Math.max(1, quantity);
    delta = -qty;
    projectedStock = Math.max(0, currentStock - qty);
    finalChangeType = subReason === 'damage' ? 'damage' : 'sale';
  } else if (mainMode === 'increase') {
    const qty = Math.max(1, quantity);
    delta = qty;
    projectedStock = currentStock + qty;
    finalChangeType = subReason === 'return' ? 'return' : 'restock';
  } else {
    // Exact opname mode
    const target = Math.max(0, exactStock);
    delta = target - currentStock;
    projectedStock = target;
    finalChangeType = 'adjustment';
  }

  const handleModeChange = (mode: MainMode) => {
    setMainMode(mode);
    if (mode === 'decrease') {
      setSubReason('sale');
      setQuantity(1);
    } else if (mode === 'increase') {
      setSubReason('restock');
      setQuantity(1);
    } else {
      setSubReason('opname');
      setExactStock(currentStock);
    }
  };

  const handleSelectVariant = (variantId: string) => {
    setSelectedVariantId(variantId);
    const variant = product.variants.find((v) => v.id === variantId);
    if (variant && mainMode === 'exact') {
      setExactStock(variant.stock);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mainMode !== 'exact' && quantity <= 0) return;
    if (mainMode === 'exact' && delta === 0 && !note.trim()) {
      // Nothing changed
      onClose();
      return;
    }

    setIsSubmitting(true);
    let defaultReason = '';
    if (mainMode === 'decrease') {
      defaultReason = subReason === 'damage' ? 'Barang Cacat / Rusak' : 'Penjualan Kasir Toko';
    } else if (mainMode === 'increase') {
      defaultReason = subReason === 'return' ? 'Retur Penukaran Pelanggan' : 'Restock Barang Masuk';
    } else {
      defaultReason = 'Penyesuaian Opname Fisik';
    }

    const finalReasonText = note.trim() ? `${defaultReason} - ${note.trim()}` : defaultReason;
    const success = await adjustStock(product.id, currentVariant.id, delta, finalChangeType, finalReasonText);
    setIsSubmitting(false);

    if (success) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl shadow-2xl border border-yellow-200/80 w-full max-w-md max-h-[92vh] flex flex-col overflow-hidden text-slate-800"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Compact Header */}
        <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between bg-slate-950 text-white shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <img 
              src={product.imageUrl || '/assets/aistudio/WhatsApp_Image_2026-10-20_at_14.00.08_44e1b065.jpeg'} 
              alt={product.name}
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/assets/aistudio/WhatsApp_Image_2026-10-20_at_14.00.08_44e1b065.jpeg';
              }} 
              className="w-9 h-9 rounded-lg object-cover border border-white/20 shrink-0"
            />
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 text-[10px] font-extrabold text-amber-300 uppercase tracking-wider">
                <span>{product.category}</span>
                {product.sku && product.sku.trim() !== '' && (
                  <>
                    <span>•</span>
                    <span className="font-mono">{product.sku}</span>
                  </>
                )}
              </div>
              <h2 className="text-sm font-bold text-white truncate leading-tight">
                {product.name}
              </h2>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 active:scale-95 flex items-center justify-center text-white/80 hover:text-white transition-all shrink-0 ml-2"
            title="Tutup"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-3.5 space-y-3">
          {/* Section 1: Variant Selection (Compact & Readable List) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[11px] font-extrabold text-slate-700 uppercase tracking-wider">
                Pilih Varian ({product.variants.length})
              </label>
              <span className="text-[10px] text-amber-800 font-semibold bg-amber-100 px-1.5 py-0.5 rounded">
                Sentuh untuk ubah
              </span>
            </div>

            {/* Scrollable Variant List */}
            <div className="max-h-32 overflow-y-auto space-y-1 p-1 bg-slate-50 rounded-xl border border-slate-200">
              {product.variants.map((v) => {
                const isSelected = v.id === currentVariant.id;
                const vStock = Number(v.stock) || 0;
                const vMin = Number(v.minStock) || 2;
                const isOut = vStock <= 0;
                const isLow = vStock <= vMin && vStock > 0;

                return (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => handleSelectVariant(v.id)}
                    className={`w-full px-2.5 py-1.5 rounded-lg flex items-center justify-between text-left transition-all ${
                      isSelected
                        ? 'bg-amber-100 border-2 border-amber-500 shadow-xs'
                        : 'bg-white border border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                        isSelected ? 'border-amber-600 bg-amber-500 text-slate-950' : 'border-slate-300 bg-white'
                      }`}>
                        {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                      </div>
                      <div className="flex items-center gap-1.5 min-w-0">
                        {v.colorHex && (
                          <span 
                            className="w-2.5 h-2.5 rounded-full border border-slate-300 shrink-0" 
                            style={{ backgroundColor: v.colorHex }}
                          />
                        )}
                        <span className="text-xs font-black text-slate-900">{v.size}</span>
                        <span className="text-[11px] text-slate-500 truncate">({v.color})</span>
                      </div>
                    </div>

                    <div className="shrink-0 ml-2">
                      <span className={`text-[11px] font-black px-2 py-0.5 rounded shadow-xs ${
                        isOut
                          ? 'bg-rose-600 text-white'
                          : isLow
                          ? 'bg-amber-400 text-slate-950'
                          : 'bg-emerald-100 text-emerald-950 border border-emerald-300'
                      }`}>
                        {isOut ? '0 pcs (HABIS)' : isLow ? `${vStock} pcs (MENIPIS)` : `${vStock} pcs`}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 2: Active Variant Quick Bar */}
          <div className="px-3 py-2 bg-yellow-50/80 rounded-xl border border-yellow-200 flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500">Varian aktif:</span>
              <span className="font-extrabold text-slate-900 bg-white px-2 py-0.5 rounded border border-yellow-300">
                {currentVariant.size} • {currentVariant.color}
              </span>
            </div>
            <div className="flex items-center gap-1 font-bold text-slate-700">
              <span>Stok saat ini:</span>
              <span className={`font-black ${currentStock === 0 ? 'text-rose-600' : currentStock <= minStock ? 'text-amber-600' : 'text-emerald-700'}`}>
                {currentStock} pcs
              </span>
            </div>
          </div>

          {/* Section 3: Action Type (3 Compact Tabs) */}
          <div>
            <label className="block text-[11px] font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
              Jenis Perubahan Stok
            </label>
            <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200">
              {/* Kurang (-) */}
              <button
                type="button"
                onClick={() => handleModeChange('decrease')}
                className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  mainMode === 'decrease'
                    ? 'bg-rose-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>Kurang (-)</span>
              </button>

              {/* Tambah (+) */}
              <button
                type="button"
                onClick={() => handleModeChange('increase')}
                className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  mainMode === 'increase'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <PackagePlus className="w-3.5 h-3.5" />
                <span>Tambah (+)</span>
              </button>

              {/* Set Opname (=) */}
              <button
                type="button"
                onClick={() => handleModeChange('exact')}
                className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  mainMode === 'exact'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <ClipboardCheck className="w-3.5 h-3.5" />
                <span>Set Fisik (=)</span>
              </button>
            </div>

            {/* Sub-reason quick pills */}
            <div className="flex items-center gap-1.5 mt-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Alasan:</span>
              {mainMode === 'decrease' && (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setSubReason('sale');
                      if (note.includes('Rusak') || note.includes('Cacat')) setNote('');
                    }}
                    className={`px-2 py-0.5 rounded-md text-[11px] font-bold transition-colors ${
                      subReason === 'sale'
                        ? 'bg-rose-100 text-rose-800 border border-rose-300'
                        : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    Penjualan Toko
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSubReason('damage');
                      if (!note) setNote('Cacat Pabrik');
                    }}
                    className={`px-2 py-0.5 rounded-md text-[11px] font-bold transition-colors flex items-center gap-1 ${
                      subReason === 'damage'
                        ? 'bg-rose-600 text-white font-extrabold shadow-xs'
                        : 'bg-white text-rose-700 border border-rose-300 hover:bg-rose-50'
                    }`}
                  >
                    <AlertTriangle className="w-3 h-3" />
                    <span>Barang Rusak / Reject</span>
                  </button>
                </>
              )}

              {mainMode === 'increase' && (
                <>
                  <button
                    type="button"
                    onClick={() => setSubReason('restock')}
                    className={`px-2 py-0.5 rounded-md text-[11px] font-bold transition-colors ${
                      subReason === 'restock'
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    Restock Masuk
                  </button>
                  <button
                    type="button"
                    onClick={() => setSubReason('return')}
                    className={`px-2 py-0.5 rounded-md text-[11px] font-bold transition-colors flex items-center gap-1 ${
                      subReason === 'return'
                        ? 'bg-blue-100 text-blue-800 border border-blue-300'
                        : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <RotateCcw className="w-3 h-3 text-blue-600" />
                    <span>Retur Pelanggan</span>
                  </button>
                </>
              )}

              {mainMode === 'exact' && (
                <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                  Hitung Fisik Opname (Stok Riil)
                </span>
              )}
            </div>
          </div>

          {/* Section 4: Stepper & Quick Shortcuts */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[11px] font-extrabold text-slate-700 uppercase tracking-wider">
                {mainMode === 'exact' ? 'Stok Fisik Sebenarnya (Pcs)' : 'Jumlah Pcs yang Diubah'}
              </label>
              {mainMode !== 'exact' && (
                <span className="text-[11px] font-bold text-slate-500">
                  = {formatLusin(quantity)}
                </span>
              )}
            </div>

            {/* Stepper controls */}
            {mainMode !== 'exact' ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 active:scale-90 text-slate-800 font-black flex items-center justify-center transition-all border border-slate-300 shrink-0"
                    title="Kurang 1"
                  >
                    <Minus className="w-4 h-4 stroke-[3]" />
                  </button>

                  <input
                    type="number"
                    min="1"
                    max="9999"
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    className="flex-1 h-10 text-center text-xl font-black text-slate-900 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  />

                  <button
                    type="button"
                    onClick={() => setQuantity((q) => q + 1)}
                    className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 active:scale-90 text-slate-800 font-black flex items-center justify-center transition-all border border-slate-300 shrink-0"
                    title="Tambah 1"
                  >
                    <Plus className="w-4 h-4 stroke-[3]" />
                  </button>
                </div>

                {/* Quick Presets (½ Lusin, 1 Lusin, 2 Lusin, and Full Stock if Damage) */}
                <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                  <span className="text-[10px] font-bold text-slate-400">Pintasan:</span>
                  {[
                    { label: '+1', val: 1 },
                    { label: '+2', val: 2 },
                    { label: '+6 (½ Lsn)', val: 6 },
                    { label: '+12 (1 Lsn)', val: 12 },
                    ...(subReason === 'damage' && currentStock > 0
                      ? [{ label: `Semua Rusak (${currentStock} pcs)`, val: currentStock }]
                      : [{ label: '+24 (2 Lsn)', val: 24 }]),
                  ].map((p) => (
                    <button
                      key={p.label}
                      type="button"
                      onClick={() => setQuantity(p.val)}
                      className={`text-xs px-2 py-1 rounded-lg font-bold transition-all active:scale-95 border ${
                        quantity === p.val
                          ? subReason === 'damage'
                            ? 'bg-rose-600 text-white border-rose-700 shadow-xs'
                            : 'bg-amber-400 text-slate-950 border-amber-500 shadow-xs'
                          : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              /* Exact mode input */
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setExactStock((s) => Math.max(0, s - 1))}
                    className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 active:scale-90 text-slate-800 font-black flex items-center justify-center transition-all border border-slate-300 shrink-0"
                  >
                    <Minus className="w-4 h-4 stroke-[3]" />
                  </button>

                  <input
                    type="number"
                    min="0"
                    max="9999"
                    value={exactStock}
                    onChange={(e) => setExactStock(Math.max(0, parseInt(e.target.value) || 0))}
                    className="flex-1 h-10 text-center text-xl font-black text-slate-900 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />

                  <button
                    type="button"
                    onClick={() => setExactStock((s) => s + 1)}
                    className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 active:scale-90 text-slate-800 font-black flex items-center justify-center transition-all border border-slate-300 shrink-0"
                  >
                    <Plus className="w-4 h-4 stroke-[3]" />
                  </button>
                </div>

                {/* Quick Presets for exact stock */}
                <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                  <span className="text-[10px] font-bold text-slate-400">Pintasan:</span>
                  {[
                    { label: '0 (Habis)', val: 0 },
                    { label: '6 (½ Lsn)', val: 6 },
                    { label: '12 (1 Lsn)', val: 12 },
                    { label: '24 (2 Lsn)', val: 24 },
                  ].map((p) => (
                    <button
                      key={p.label}
                      type="button"
                      onClick={() => setExactStock(p.val)}
                      className={`text-xs px-2 py-1 rounded-lg font-bold transition-all active:scale-95 border ${
                        exactStock === p.val
                          ? 'bg-indigo-600 text-white border-indigo-700 shadow-xs'
                          : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Section 5: Optional Note / Invoice */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-[11px] font-extrabold text-slate-700 uppercase tracking-wider">
                {subReason === 'damage' ? 'Alasan / Jenis Kerusakan' : 'Catatan / No. Nota (Opsional)'}
              </label>
              {subReason === 'damage' && (
                <span className="text-[10px] text-rose-600 font-extrabold">Pilih cepat jenis cacat:</span>
              )}
            </div>

            {subReason === 'damage' && (
              <div className="flex flex-wrap items-center gap-1 mb-1.5">
                {[
                  'Cacat Pabrik',
                  'Noda / Kotor',
                  'Sobek / Robek',
                  'Cacat Jahitan',
                  'Rusak Display / Fitting',
                  'Kancing / Resleting Rusak',
                ].map((reasonTag) => (
                  <button
                    key={reasonTag}
                    type="button"
                    onClick={() => setNote(reasonTag)}
                    className={`text-[10px] px-2 py-0.5 rounded-md font-bold transition-all border ${
                      note === reasonTag
                        ? 'bg-rose-600 text-white border-rose-700 shadow-xs'
                        : 'bg-rose-50 hover:bg-rose-100 text-rose-800 border-rose-200'
                    }`}
                  >
                    {reasonTag}
                  </button>
                ))}
              </div>
            )}

            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={subReason === 'damage' ? 'Contoh: Jahitan samping robek / noda tinta' : 'Contoh: Nota #INV-102 atau Kiriman Vendor'}
              className="w-full h-8 px-2.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
            />
          </div>

          {/* Section 6: Live Result Simulation Card (Single-Row High Contrast) */}
          <div className="p-2.5 rounded-xl bg-slate-900 text-white flex items-center justify-between text-xs">
            <div className="min-w-0">
              <div className="text-[10px] text-amber-300 uppercase font-extrabold tracking-wider">
                Simulasi Hasil
              </div>
              <div className="text-slate-300 text-[11px] truncate">
                {currentVariant.size} • {currentVariant.color}
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <div className="text-right">
                <span className="text-[10px] text-slate-400 block">Awal</span>
                <span className="font-bold text-slate-200">{currentStock}</span>
              </div>

              <div className="flex items-center">
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                <span className={`text-[11px] font-extrabold px-1 rounded ml-1 ${
                  delta < 0 ? 'bg-rose-500/20 text-rose-300' : delta > 0 ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-300'
                }`}>
                  {delta > 0 ? `+${delta}` : delta}
                </span>
              </div>

              <div className="text-right">
                <span className="text-[10px] text-slate-400 block">Menjadi</span>
                <span className={`font-black text-sm px-2 py-0.5 rounded shadow-xs ${
                  projectedStock === 0 
                    ? 'bg-rose-600 text-white' 
                    : projectedStock <= minStock 
                    ? 'bg-amber-400 text-slate-950' 
                    : 'bg-emerald-500 text-slate-950 font-black'
                }`}>
                  {projectedStock} pcs
                </span>
              </div>
            </div>
          </div>
        </form>

        {/* Sticky Footer */}
        <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-2 shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-200 active:scale-95 rounded-xl transition-all"
          >
            Batal
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className={`px-4 py-2 text-xs font-extrabold rounded-xl shadow-md transition-all flex items-center gap-1.5 active:scale-95 ${
              mainMode === 'decrease'
                ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/30'
                : mainMode === 'increase'
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/30'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/30'
            }`}
          >
            {mainMode === 'decrease' ? (
              <ShoppingBag className="w-3.5 h-3.5" />
            ) : mainMode === 'increase' ? (
              <PackagePlus className="w-3.5 h-3.5" />
            ) : (
              <CheckCircle2 className="w-3.5 h-3.5" />
            )}
            <span>
              {isSubmitting 
                ? 'Menyimpan...' 
                : mainMode === 'decrease' 
                ? `Simpan Pengurangan (${Math.abs(delta)} pcs)` 
                : mainMode === 'increase' 
                ? `Simpan Penambahan (+${delta} pcs)` 
                : `Set Stok Menjadi ${projectedStock} pcs`}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
