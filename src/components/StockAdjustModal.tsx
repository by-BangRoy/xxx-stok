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
  SlidersHorizontal,
  Edit3,
  Tag,
  MapPin,
  Barcode,
  FileText,
  Image as ImageIcon,
  Save,
  Layers,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { ProductBarcode } from './ProductBarcode.tsx';

interface StockAdjustModalProps {
  product: Product;
  initialVariantId?: string;
  isOpen: boolean;
  onClose: () => void;
  onOpenFullEdit?: (product: Product) => void;
}

type MainMode = 'decrease' | 'increase' | 'exact';
type ModalTab = 'stock' | 'edit_info';

const POPULAR_CATEGORIES = [
  'Gamis',
  'Tunik',
  'Dress',
  'Kemeja',
  'Setelan',
  'Celana',
  'Rok',
  'Hijab',
  'Kaos',
  'Mukena'
];

const POPULAR_LOCATIONS = [
  'Gudang Utama',
  'Rak A-1',
  'Rak B-1',
  'Rak C-1',
  'Etalase Depan',
  'Lantai 2'
];

export const StockAdjustModal: React.FC<StockAdjustModalProps> = ({
  product,
  initialVariantId,
  isOpen,
  onClose,
  onOpenFullEdit,
}) => {
  const { adjustStock, updateProduct, products } = useInventory();

  // Find the reactive product from context so any updates immediately reflect
  const activeProduct = products.find((p) => p.id === product.id) || product;

  // Active top-level tab: 'stock' (Kelola Stok) or 'edit_info' (Edit Nama, Kategori, dll)
  const [activeTab, setActiveTab] = useState<ModalTab>('stock');

  // Stock Adjustment States
  const [selectedVariantId, setSelectedVariantId] = useState<string>(
    initialVariantId || activeProduct.variants[0]?.id || ''
  );
  const [mainMode, setMainMode] = useState<MainMode>('decrease');
  const [subReason, setSubReason] = useState<string>('sale');
  const [quantity, setQuantity] = useState<number>(1);
  const [exactStock, setExactStock] = useState<number>(0);
  const [note, setNote] = useState<string>('');
  const [isSubmittingStock, setIsSubmittingStock] = useState<boolean>(false);

  // Product Info Edit States
  const [editName, setEditName] = useState<string>(activeProduct.name || '');
  const [editCategory, setEditCategory] = useState<string>(activeProduct.category || '');
  const [editSku, setEditSku] = useState<string>(activeProduct.sku || '');
  const [editLocation, setEditLocation] = useState<string>(activeProduct.location || '');
  const cleanDesc = activeProduct.description && /di+mport\s+dari\s+file\s+rekap\s+stok\s+csv/i.test(activeProduct.description)
    ? ''
    : (activeProduct.description || '');
  const [editDescription, setEditDescription] = useState<string>(cleanDesc);
  const [editImageUrl, setEditImageUrl] = useState<string>(activeProduct.imageUrl || '');
  const [isSavingInfo, setIsSavingInfo] = useState<boolean>(false);
  const [infoSaveSuccess, setInfoSaveSuccess] = useState<boolean>(false);

  // Sync state when activeProduct changes
  useEffect(() => {
    if (activeProduct) {
      setEditName(activeProduct.name || '');
      setEditCategory(activeProduct.category || '');
      setEditSku(activeProduct.sku || '');
      setEditLocation(activeProduct.location || '');
      const cDesc = activeProduct.description && /di+mport\s+dari\s+file\s+rekap\s+stok\s+csv/i.test(activeProduct.description)
        ? ''
        : (activeProduct.description || '');
      setEditDescription(cDesc);
      setEditImageUrl(activeProduct.imageUrl || '');
    }
  }, [activeProduct.id, activeProduct.name, activeProduct.category, activeProduct.sku, activeProduct.location]);

  // Sync selected variant when opened with initialVariantId
  useEffect(() => {
    if (initialVariantId) {
      setSelectedVariantId(initialVariantId);
    } else if (activeProduct.variants[0]) {
      setSelectedVariantId(activeProduct.variants[0].id);
    }
  }, [initialVariantId, activeProduct.variants]);

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

  const currentVariant = activeProduct.variants.find((v) => v.id === selectedVariantId) || activeProduct.variants[0];
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
    const variant = activeProduct.variants.find((v) => v.id === variantId);
    if (variant && mainMode === 'exact') {
      setExactStock(variant.stock);
    }
  };

  const handleSubmitStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mainMode !== 'exact' && quantity <= 0) return;
    if (mainMode === 'exact' && delta === 0 && !note.trim()) {
      onClose();
      return;
    }

    setIsSubmittingStock(true);
    let defaultReason = '';
    if (mainMode === 'decrease') {
      defaultReason = subReason === 'damage' ? 'Barang Cacat / Rusak' : 'Penjualan Kasir Toko';
    } else if (mainMode === 'increase') {
      defaultReason = subReason === 'return' ? 'Retur Penukaran Pelanggan' : 'Restock Barang Masuk';
    } else {
      defaultReason = 'Penyesuaian Opname Fisik';
    }

    const finalReasonText = note.trim() ? `${defaultReason} - ${note.trim()}` : defaultReason;
    const success = await adjustStock(activeProduct.id, currentVariant.id, delta, finalChangeType, finalReasonText);
    setIsSubmittingStock(false);

    if (success) {
      onClose();
    }
  };

  const handleSaveProductInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim()) {
      alert('Nama barang wajib diisi!');
      return;
    }

    setIsSavingInfo(true);
    const success = await updateProduct(activeProduct.id, {
      name: editName.trim(),
      category: editCategory.trim() || 'Umum',
      sku: editSku.trim(),
      location: editLocation.trim(),
      description: editDescription.trim(),
      imageUrl: editImageUrl.trim() || activeProduct.imageUrl,
    });
    setIsSavingInfo(false);

    if (success) {
      setInfoSaveSuccess(true);
      setTimeout(() => {
        setInfoSaveSuccess(false);
      }, 3000);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl shadow-2xl border border-yellow-200/80 w-full max-w-lg max-h-[94vh] flex flex-col overflow-hidden text-slate-800"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Compact Header */}
        <div className="px-4 py-3 border-b border-slate-800 bg-slate-950 text-white shrink-0">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <img 
                src={editImageUrl || activeProduct.imageUrl || '/assets/aistudio/WhatsApp_Image_2026-10-20_at_14.00.08_44e1b065.jpeg'} 
                alt={activeProduct.name}
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/assets/aistudio/WhatsApp_Image_2026-10-20_at_14.00.08_44e1b065.jpeg';
                }} 
                className="w-10 h-10 rounded-xl object-cover border border-amber-400/40 shrink-0"
              />
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 text-[10px] font-extrabold text-amber-300 uppercase tracking-wider">
                  <span className="bg-amber-400/20 px-1.5 py-0.5 rounded text-amber-300 border border-amber-400/30">
                    {activeProduct.category || 'Umum'}
                  </span>
                  {activeProduct.sku && activeProduct.sku.trim() !== '' && (
                    <>
                      <span>•</span>
                      <span className="font-mono text-slate-300">{activeProduct.sku}</span>
                    </>
                  )}
                  {activeProduct.location && (
                    <>
                      <span>•</span>
                      <span className="text-slate-300 flex items-center gap-0.5">
                        <MapPin className="w-2.5 h-2.5 text-amber-400" />
                        {activeProduct.location}
                      </span>
                    </>
                  )}
                </div>
                <h2 className="text-sm font-black text-white truncate leading-tight mt-0.5">
                  {activeProduct.name}
                </h2>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button 
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 flex items-center justify-center text-white/80 hover:text-white transition-all"
                title="Tutup"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Tab Navigation: Kelola Stok vs Edit Info Barang */}
          <div className="flex items-center gap-1.5 mt-3 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setActiveTab('stock')}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'stock'
                  ? 'bg-amber-500 text-slate-950 shadow-md font-extrabold'
                  : 'bg-white/10 text-white/80 hover:bg-white/15 hover:text-white'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Kelola & Ubah Stok</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ml-1 ${
                activeTab === 'stock' ? 'bg-slate-950/20 text-slate-950' : 'bg-white/20 text-white'
              }`}>
                {activeProduct.totalStock} pcs
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('edit_info')}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'edit_info'
                  ? 'bg-amber-500 text-slate-950 shadow-md font-extrabold'
                  : 'bg-white/10 text-white/80 hover:bg-white/15 hover:text-white'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit Nama, Kategori & Info</span>
            </button>
          </div>
        </div>

        {/* TAB 1: KELOLA & UBAH STOK */}
        {activeTab === 'stock' && (
          <>
            <form onSubmit={handleSubmitStock} className="flex-1 overflow-y-auto p-3.5 space-y-3">
              {/* Variant Selection */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[11px] font-extrabold text-slate-700 uppercase tracking-wider">
                    Pilih Varian ({activeProduct.variants.length})
                  </label>
                  <span className="text-[10px] text-amber-800 font-semibold bg-amber-100 px-1.5 py-0.5 rounded">
                    Sentuh varian yang ingin diubah
                  </span>
                </div>

                {/* Scrollable Variant List */}
                <div className="max-h-32 overflow-y-auto space-y-1 p-1 bg-slate-50 rounded-xl border border-slate-200">
                  {activeProduct.variants.map((v) => {
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

              {/* Active Variant Quick Bar & Barcode */}
              <div className="px-3 py-2 bg-yellow-50/80 rounded-xl border border-yellow-200 flex flex-col gap-1.5 text-xs">
                <div className="flex items-center justify-between">
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

                {/* Visual Barcode Display (Rendered 100% locally via SVG, never 403 error) */}
                {(currentVariant.barcode || currentVariant.sku || activeProduct.sku) && (
                  <div className="pt-1.5 border-t border-yellow-200/80 flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1">
                      <Barcode className="w-3.5 h-3.5 text-amber-700" />
                      <span>Barcode:</span>
                    </span>
                    <ProductBarcode 
                      value={currentVariant.barcode || currentVariant.sku || activeProduct.sku || ''} 
                      height={28}
                      width={1.2}
                    />
                  </div>
                )}
              </div>

              {/* Action Type (3 Compact Tabs) */}
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

              {/* Stepper & Controls */}
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
                  </div>
                ) : (
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
                  </div>
                )}
              </div>

              {/* Optional Note / Invoice */}
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

              {/* Live Result Simulation Card */}
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

              {/* Switch to Edit Info Hint */}
              <div className="p-2 bg-yellow-50/80 rounded-xl border border-yellow-200/90 flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-1.5 text-slate-700">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span>Ingin ubah nama barang, kategori, atau lokasi rak?</span>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('edit_info')}
                  className="font-extrabold text-amber-800 hover:text-amber-950 underline flex items-center gap-1 shrink-0 ml-2"
                >
                  <span>Edit Info Barang</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </form>

            {/* Sticky Footer for Stock Adjust */}
            <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-2 shrink-0">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmittingStock}
                className="px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-200 active:scale-95 rounded-xl transition-all"
              >
                Batal
              </button>

              <button
                type="button"
                onClick={handleSubmitStock}
                disabled={isSubmittingStock}
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
                  {isSubmittingStock 
                    ? 'Menyimpan...' 
                    : mainMode === 'decrease' 
                    ? `Simpan Pengurangan (${Math.abs(delta)} pcs)` 
                    : mainMode === 'increase' 
                    ? `Simpan Penambahan (+${delta} pcs)` 
                    : `Set Stok Menjadi ${projectedStock} pcs`}
                </span>
              </button>
            </div>
          </>
        )}

        {/* TAB 2: EDIT NAMA BARANG, KATEGORI, DAN INFO LAIN */}
        {activeTab === 'edit_info' && (
          <>
            <form onSubmit={handleSaveProductInfo} className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Success Notification Alert */}
              {infoSaveSuccess && (
                <div className="p-3 bg-emerald-500 text-slate-950 font-black rounded-xl border border-emerald-600 shadow-md flex items-center gap-2 animate-in fade-in slide-in-from-top-1 text-xs">
                  <CheckCircle2 className="w-4 h-4 text-slate-950 shrink-0" />
                  <span>✓ Informasi barang berhasil disimpan dan diperbarui di seluruh perangkat!</span>
                </div>
              )}

              {/* 1. Nama Barang */}
              <div>
                <label className="flex items-center gap-1.5 text-xs font-black text-slate-900 uppercase tracking-wider mb-1.5">
                  <Tag className="w-3.5 h-3.5 text-amber-600" />
                  <span>Nama Barang *</span>
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Contoh: STZ - GAMIS ABAYA HITAM MEWAH"
                  className="w-full px-3 py-2 text-sm font-bold border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white text-slate-900 shadow-xs"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Nama ini akan muncul pada kartu stok, tabel stok, pencarian, dan cetak laporan.
                </p>
              </div>

              {/* 2. Kategori */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="flex items-center gap-1.5 text-xs font-black text-slate-900 uppercase tracking-wider">
                    <Layers className="w-3.5 h-3.5 text-amber-600" />
                    <span>Kategori Barang</span>
                  </label>
                  <span className="text-[10px] text-slate-500">Pilih cepat atau ketik sendiri</span>
                </div>

                {/* Quick Category Chips */}
                <div className="flex flex-wrap gap-1 mb-2">
                  {POPULAR_CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setEditCategory(cat)}
                      className={`text-xs px-2.5 py-1 rounded-lg font-bold transition-all border ${
                        editCategory.toLowerCase() === cat.toLowerCase()
                          ? 'bg-amber-500 text-slate-950 border-amber-600 shadow-xs font-black'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                <input
                  type="text"
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value)}
                  placeholder="Atau ketik kategori lain..."
                  className="w-full px-3 py-2 text-xs font-bold border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white text-slate-900"
                />
              </div>

              {/* 3. SKU / Kode Barang & Lokasi Rak/Gudang */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Kode SKU */}
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-black text-slate-900 uppercase tracking-wider mb-1.5">
                    <Barcode className="w-3.5 h-3.5 text-amber-600" />
                    <span>Kode Barang / SKU</span>
                  </label>
                  <input
                    type="text"
                    value={editSku}
                    onChange={(e) => setEditSku(e.target.value)}
                    placeholder="Contoh: GM-01 atau STZ-001"
                    className="w-full px-3 py-2 text-xs font-mono font-bold border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white text-slate-900"
                  />
                </div>

                {/* Lokasi Rak / Gudang */}
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-black text-slate-900 uppercase tracking-wider mb-1.5">
                    <MapPin className="w-3.5 h-3.5 text-amber-600" />
                    <span>Lokasi Rak / Penyimpanan</span>
                  </label>
                  <input
                    type="text"
                    value={editLocation}
                    onChange={(e) => setEditLocation(e.target.value)}
                    placeholder="Contoh: Rak A-1 / Gudang Utama"
                    className="w-full px-3 py-2 text-xs font-bold border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white text-slate-900"
                  />
                  {/* Quick location chips */}
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {POPULAR_LOCATIONS.slice(0, 4).map((loc) => (
                      <button
                        key={loc}
                        type="button"
                        onClick={() => setEditLocation(loc)}
                        className={`text-[10px] px-1.5 py-0.5 rounded font-semibold border ${
                          editLocation === loc
                            ? 'bg-amber-100 text-amber-900 border-amber-300'
                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {loc}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* 4. Deskripsi / Keterangan */}
              <div>
                <label className="flex items-center gap-1.5 text-xs font-black text-slate-900 uppercase tracking-wider mb-1.5">
                  <FileText className="w-3.5 h-3.5 text-amber-600" />
                  <span>Keterangan / Deskripsi Barang</span>
                </label>
                <textarea
                  rows={2}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  placeholder="Catatan bahan, instruksi penyimpanan, atau deskripsi produk..."
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white text-slate-900 resize-none"
                />
              </div>

              {/* 5. Foto Produk */}
              <div>
                <label className="flex items-center gap-1.5 text-xs font-black text-slate-900 uppercase tracking-wider mb-1.5">
                  <ImageIcon className="w-3.5 h-3.5 text-amber-600" />
                  <span>Link / Foto Produk</span>
                </label>
                <div className="flex items-center gap-2">
                  <img
                    src={editImageUrl || activeProduct.imageUrl || '/assets/aistudio/WhatsApp_Image_2026-10-20_at_14.00.08_44e1b065.jpeg'}
                    alt="Preview"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/assets/aistudio/WhatsApp_Image_2026-10-20_at_14.00.08_44e1b065.jpeg';
                    }}
                    className="w-9 h-9 rounded-lg object-cover border border-slate-200 shrink-0"
                  />
                  <input
                    type="text"
                    value={editImageUrl}
                    onChange={(e) => setEditImageUrl(e.target.value)}
                    placeholder="Link URL foto produk..."
                    className="flex-1 px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white text-slate-900"
                  />
                </div>
              </div>

              {/* 6. Varian Info & Buka Form Lengkap */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <span className="text-xs font-black text-slate-900">
                      Daftar Varian ({activeProduct.variants.length} Varian)
                    </span>
                    <p className="text-[11px] text-slate-500">
                      Total {activeProduct.totalStock} pcs stok fisik saat ini.
                    </p>
                  </div>

                  {onOpenFullEdit && (
                    <button
                      type="button"
                      onClick={() => onOpenFullEdit(activeProduct)}
                      className="px-2.5 py-1 bg-white hover:bg-yellow-50 text-slate-800 border border-slate-300 hover:border-amber-400 rounded-lg text-xs font-bold flex items-center gap-1 shadow-2xs active:scale-95 transition-all"
                      title="Buka form lengkap untuk menambah atau menghapus varian ukuran/warna"
                    >
                      <ExternalLink className="w-3 h-3 text-amber-600" />
                      <span>Kelola Varian Lengkap</span>
                    </button>
                  )}
                </div>

                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                  {activeProduct.variants.map((v) => (
                    <span 
                      key={v.id}
                      className="px-2 py-0.5 bg-white rounded border border-slate-200 text-[11px] font-bold text-slate-800 flex items-center gap-1 shadow-2xs"
                    >
                      {v.colorHex && (
                        <span 
                          className="w-2 h-2 rounded-full border border-slate-300"
                          style={{ backgroundColor: v.colorHex }}
                        />
                      )}
                      <span>{v.size} ({v.color})</span>
                      <span className="text-slate-400">•</span>
                      <span className="text-emerald-700 font-extrabold">{v.stock} pcs</span>
                    </span>
                  ))}
                </div>
              </div>
            </form>

            {/* Sticky Footer for Edit Info */}
            <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setActiveTab('stock')}
                className="px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-200 active:scale-95 rounded-xl transition-all flex items-center gap-1"
              >
                <span>Kembali ke Ubah Stok</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3 py-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors"
                >
                  Tutup
                </button>
                <button
                  type="button"
                  onClick={handleSaveProductInfo}
                  disabled={isSavingInfo}
                  className="px-5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 rounded-xl text-xs font-black shadow-md shadow-amber-500/25 flex items-center gap-1.5 active:scale-95 transition-all disabled:opacity-50"
                >
                  <Save className="w-4 h-4 text-slate-950" />
                  <span>{isSavingInfo ? 'Menyimpan...' : 'Simpan Perubahan Info'}</span>
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
