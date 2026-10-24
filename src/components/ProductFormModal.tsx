import React, { useState, useEffect } from 'react';
import { Product, ProductVariant } from '../types/inventory.ts';
import { useInventory } from '../context/InventoryContext.tsx';
import { 
  X, 
  Plus, 
  Trash2, 
  Save, 
  Layers
} from 'lucide-react';

interface ProductFormModalProps {
  product?: Product | null; // if null, mode: ADD; if provided, mode: EDIT
  isOpen: boolean;
  onClose: () => void;
}

const DEFAULT_IMAGE = '/assets/aistudio/WhatsApp_Image_2026-10-20_at_14.00.08_44e1b065.jpeg';

export const ProductFormModal: React.FC<ProductFormModalProps> = ({
  product,
  isOpen,
  onClose,
}) => {
  const { createProduct, updateProduct, deleteProduct } = useInventory();
  const isEdit = Boolean(product);

  const [name, setName] = useState(product?.name || '');
  const [category, setCategory] = useState(product?.category || '');
  const [sku, setSku] = useState(product?.sku || '');
  const [location, setLocation] = useState(product?.location || '');
  const [imageUrl, setImageUrl] = useState(product?.imageUrl || DEFAULT_IMAGE);
  const cleanInitialDesc = product?.description && /di+mport\s+dari\s+file\s+rekap\s+stok\s+csv/i.test(product.description)
    ? ''
    : (product?.description || '');
  const [description, setDescription] = useState(cleanInitialDesc);

  const [variants, setVariants] = useState<ProductVariant[]>(
    product?.variants || [
      {
        id: `var-new-1`,
        sku: '',
        size: '',
        color: '',
        colorHex: '#CBD5E1',
        stock: 0,
        minStock: 2,
        price: 0,
        costPrice: 0,
        barcode: '',
      },
    ]
  );

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Re-sync all form fields whenever product prop changes or modal opens
  useEffect(() => {
    if (isOpen) {
      if (product) {
        setName(product.name || '');
        setCategory(product.category || '');
        setSku(product.sku || '');
        setLocation(product.location || '');
        setImageUrl(product.imageUrl || DEFAULT_IMAGE);
        const cleanDesc = product.description && /di+mport\s+dari\s+file\s+rekap\s+stok\s+csv/i.test(product.description)
          ? ''
          : (product.description || '');
        setDescription(cleanDesc);
        setVariants(
          product.variants && product.variants.length > 0
            ? product.variants.map((v) => ({ ...v }))
            : [
                {
                  id: `var-new-1`,
                  sku: '',
                  size: 'All Size',
                  color: 'Standar',
                  colorHex: '#CBD5E1',
                  stock: 0,
                  minStock: 2,
                  price: 0,
                  costPrice: 0,
                  barcode: '',
                },
              ]
        );
      } else {
        setName('');
        setCategory('');
        setSku('');
        setLocation('');
        setImageUrl(DEFAULT_IMAGE);
        setDescription('');
        setVariants([
          {
            id: `var-new-1`,
            sku: '',
            size: 'All Size',
            color: 'Standar',
            colorHex: '#CBD5E1',
            stock: 0,
            minStock: 2,
            price: 0,
            costPrice: 0,
            barcode: '',
          },
        ]);
      }
    }
  }, [product, isOpen]);

  // Lock body scroll on mobile and desktop when modal is open
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

  const handleAddVariant = () => {
    const newIndex = variants.length + 1;
    const newVariant: ProductVariant = {
      id: `var-new-${Date.now()}-${newIndex}`,
      sku: '',
      size: '',
      color: '',
      colorHex: '#CBD5E1',
      stock: 0,
      minStock: 2,
      price: 0,
      costPrice: 0,
      barcode: '',
    };
    setVariants([...variants, newVariant]);
  };

  const handleRemoveVariant = (index: number) => {
    if (variants.length <= 1) {
      alert('Produk harus memiliki minimal 1 varian');
      return;
    }
    setVariants(variants.filter((_, i) => i !== index));
  };

  const handleVariantChange = (index: number, field: keyof ProductVariant, value: any) => {
    setVariants((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Nama barang wajib diisi');
      return;
    }

    setIsSubmitting(true);
    const sanitizedVariants = variants.map((v, i) => ({
      ...v,
      sku: v.sku?.trim() || '',
      size: v.size?.trim() || (variants.length === 1 ? 'All Size' : `Varian ${i + 1}`),
      color: v.color?.trim() || 'Standar',
      stock: Number(v.stock) || 0,
      minStock: Number(v.minStock) || 2,
    }));

    const productPayload = {
      name: name.trim(),
      sku: sku.trim(),
      category: category.trim() || 'Umum',
      location: location.trim(),
      imageUrl: imageUrl.trim() || DEFAULT_IMAGE,
      description: description.trim(),
      variants: sanitizedVariants,
    };

    let success = false;
    if (isEdit && product) {
      success = await updateProduct(product.id, productPayload);
    } else {
      success = await createProduct(productPayload);
    }

    setIsSubmitting(false);
    if (success) {
      onClose();
    }
  };

  const handleDelete = async () => {
    if (!product) return;
    if (window.confirm(`Yakin ingin menghapus produk "${product.name}"? Data stok akan dihapus di semua perangkat.`)) {
      setIsSubmitting(true);
      const success = await deleteProduct(product.id);
      setIsSubmitting(false);
      if (success) {
        onClose();
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-2xl shadow-2xl border border-yellow-200 w-full max-w-2xl overflow-hidden max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-yellow-200/80 flex items-center justify-between bg-slate-950 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-300">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-white">
                {isEdit ? 'Edit Data Barang' : 'Tambah Barang'}
              </h2>
              <p className="text-xs text-slate-400">
                Data tersinkron otomatis ke semua perangkat
              </p>
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
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {/* Basic Details: Nama Barang & Kategori */}
          <div className="space-y-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Nama Barang *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Contoh: STZ - GAMIS ABAYA HITAM MEWAH"
                className="w-full px-3 py-2 text-sm font-bold border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Kategori
                </label>
                <span className="text-[10px] text-slate-500">Pilih cepat atau ketik sendiri</span>
              </div>
              <div className="flex flex-wrap gap-1 mb-1.5">
                {['Gamis', 'Tunik', 'Dress', 'Kemeja', 'Setelan', 'Celana', 'Rok', 'Hijab', 'Kaos', 'Mukena'].map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    className={`text-[11px] px-2 py-0.5 rounded-lg font-bold transition-all border ${
                      category.toLowerCase() === cat.toLowerCase()
                        ? 'bg-amber-500 text-slate-950 border-amber-600 font-black'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="Input kategori barang..."
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Kode Barang / SKU
                </label>
                <input
                  type="text"
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                  placeholder="Contoh: GM-01 atau STZ-01"
                  className="w-full px-3 py-2 text-sm font-mono border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Lokasi Rak / Penyimpanan
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Contoh: Rak A-1, Gudang Utama"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Keterangan / Deskripsi (Opsional)
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Catatan bahan, instruksi, atau keterangan tambahan..."
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
              />
            </div>
          </div>

          {/* Variants Management */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Varian Ukuran & Warna</h3>
                <p className="text-xs text-slate-500">
                  Tentukan ukuran, warna, jumlah stok fisik, dan batas alarm stok.
                </p>
              </div>

              <button
                type="button"
                onClick={handleAddVariant}
                className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Varian</span>
              </button>
            </div>

            <div className="space-y-3">
              {variants.map((v, idx) => (
                <div
                  key={v.id || idx}
                  className="p-3 sm:p-3.5 rounded-2xl border border-yellow-200/90 bg-yellow-50/50 space-y-2.5 sm:space-y-0 sm:grid sm:grid-cols-5 sm:gap-2 sm:items-end shadow-xs"
                >
                  {/* Top Row on Mobile: Ukuran & Warna */}
                  <div className="grid grid-cols-2 gap-2 sm:contents">
                    {/* Size */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                        Ukuran
                      </label>
                      <input
                        type="text"
                        value={v.size}
                        onChange={(e) => handleVariantChange(idx, 'size', e.target.value)}
                        placeholder="Misal: S, M, XL, All Size"
                        className="w-full px-2.5 py-2 text-sm sm:text-xs bg-white border border-slate-300 rounded-xl font-bold focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>

                    {/* Color */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                        Warna
                      </label>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="color"
                          value={v.colorHex || '#CBD5E1'}
                          onChange={(e) => handleVariantChange(idx, 'colorHex', e.target.value)}
                          className="w-8 h-9 p-0.5 rounded-lg border border-slate-300 cursor-pointer shrink-0"
                          title="Pilih warna"
                        />
                        <input
                          type="text"
                          value={v.color}
                          onChange={(e) => handleVariantChange(idx, 'color', e.target.value)}
                          placeholder="Misal: Hitam, Navy"
                          className="w-full px-2.5 py-2 text-sm sm:text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Bottom Row on Mobile: Stok, Batas Min, & Tombol Hapus */}
                  <div className="grid grid-cols-5 gap-2 sm:contents items-end">
                    {/* Stock */}
                    <div className="col-span-2 sm:col-auto">
                      <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                        Stok (Pcs)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={v.stock}
                        onChange={(e) => handleVariantChange(idx, 'stock', Math.max(0, parseInt(e.target.value) || 0))}
                        placeholder="0"
                        className="w-full px-2.5 py-2 text-sm sm:text-xs bg-white border border-slate-300 rounded-xl font-black text-amber-950 focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>

                    {/* Min Stock */}
                    <div className="col-span-2 sm:col-auto">
                      <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                        Batas Min.
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={v.minStock}
                        onChange={(e) => handleVariantChange(idx, 'minStock', Math.max(0, parseInt(e.target.value) || 0))}
                        className="w-full px-2.5 py-2 text-sm sm:text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                        title="Batas minimum stok untuk alarm peringatan"
                      />
                    </div>

                    {/* Delete button */}
                    <div className="col-span-1 sm:col-auto flex items-center justify-end pb-0.5">
                      <button
                        type="button"
                        disabled={variants.length <= 1}
                        onClick={() => handleRemoveVariant(idx)}
                        className="w-9 h-9 sm:w-8 sm:h-8 rounded-xl bg-white hover:bg-rose-50 border border-slate-200 text-slate-400 hover:text-rose-600 disabled:opacity-30 disabled:pointer-events-none transition-colors flex items-center justify-center active:scale-95 shadow-xs"
                        title="Hapus Varian Ini"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="p-3.5 sm:p-4 border-t border-yellow-200/80 bg-yellow-50/50 flex items-center justify-between">
          <div>
            {isEdit && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={isSubmitting}
                className="px-3 py-2 text-xs font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition-colors flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Hapus Produk</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 transition-colors"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="px-6 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 rounded-xl text-xs font-extrabold transition-all shadow-md shadow-amber-500/25 flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              <span>{isSubmitting ? 'Menyimpan...' : isEdit ? 'Simpan Perubahan' : 'Tambah Barang'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
