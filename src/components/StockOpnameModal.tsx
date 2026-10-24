import React, { useState, useEffect } from 'react';
import { Product, ProductVariant } from '../types/inventory.ts';
import { useInventory } from '../context/InventoryContext.tsx';
import { 
  X, 
  ClipboardCheck, 
  CheckCircle2, 
  AlertTriangle, 
  Search, 
  Save, 
  ArrowRight,
  Sparkles,
  Download
} from 'lucide-react';
import { exportInventoryToCSV } from '../utils/csvExport.ts';

interface StockOpnameModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface OpnameEntry {
  productId: string;
  productName: string;
  variantId: string;
  variantDesc: string;
  systemStock: number;
  actualStock: number;
}

export const StockOpnameModal: React.FC<StockOpnameModalProps> = ({ isOpen, onClose }) => {
  const { products, batchAdjustStock } = useInventory();
  const [search, setSearch] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      const originalStyle = window.getComputedStyle(document.body).overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalStyle;
      };
    }
  }, [isOpen]);

  // Initialize opname state from all products & variants
  const [entries, setEntries] = useState<OpnameEntry[]>(() => {
    const list: OpnameEntry[] = [];
    products.forEach((p) => {
      p.variants.forEach((v) => {
        list.push({
          productId: p.id,
          productName: p.name,
          variantId: v.id,
          variantDesc: `${v.size} • ${v.color}`,
          systemStock: v.stock,
          actualStock: v.stock, // Default to system stock
        });
      });
    });
    return list;
  });

  if (!isOpen) return null;

  const handleActualStockChange = (variantId: string, val: number) => {
    setEntries((prev) =>
      prev.map((e) => (e.variantId === variantId ? { ...e, actualStock: Math.max(0, val) } : e))
    );
  };

  const filteredEntries = entries.filter(
    (e) =>
      e.productName.toLowerCase().includes(search.toLowerCase()) ||
      e.variantDesc.toLowerCase().includes(search.toLowerCase())
  );

  const changedEntries = entries.filter((e) => e.actualStock !== e.systemStock);

  const handleSaveOpname = async () => {
    if (changedEntries.length === 0) {
      alert('Tidak ada perbedaan stok yang diubah');
      return;
    }

    setIsSubmitting(true);
    const batchItems = changedEntries.map((e) => ({
      productId: e.productId,
      variantId: e.variantId,
      delta: e.actualStock - e.systemStock,
      changeType: 'adjustment' as const,
      reason: `Stock Opname Fisik: ${e.systemStock} -> ${e.actualStock}`,
    }));

    const success = await batchAdjustStock(batchItems);
    setIsSubmitting(false);

    if (success) {
      alert(`Berhasil memperbarui ${changedEntries.length} varian stok opname! Semua perangkat telah disinkronkan.`);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl overflow-hidden max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-900 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
              <ClipboardCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Mode Stock Opname & Audit Fisik</h2>
              <p className="text-xs text-slate-400">
                Hitung stok fisik di rak/gudang dan samakan dengan sistem secara massal
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

        {/* Search & Stats Bar */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari barang / varian..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center gap-2 sm:gap-3 text-xs w-full sm:w-auto justify-end">
            <span className="text-slate-500">
              Total Varian: <strong className="text-slate-800">{entries.length}</strong>
            </span>
            <span className="h-4 w-px bg-slate-300" />
            <span className={`px-2.5 py-1 rounded-full font-bold ${
              changedEntries.length > 0 ? 'bg-amber-100 text-amber-800' : 'bg-slate-200 text-slate-600'
            }`}>
              {changedEntries.length} Selisih Ditemukan
            </span>
            <button
              type="button"
              onClick={() => exportInventoryToCSV(products, 'Opname')}
              className="flex items-center gap-1 px-2.5 py-1 bg-yellow-100 hover:bg-yellow-200 text-amber-900 border border-yellow-300 rounded-lg text-xs font-bold transition-colors ml-1"
              title="Unduh Lembar Stok Opname (.CSV Excel)"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Unduh CSV</span>
            </button>
          </div>
        </div>

        {/* Table of Entries */}
        <div className="p-4 overflow-y-auto flex-1">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-100 text-slate-500 uppercase font-bold text-[10px] tracking-wider sticky top-0">
              <tr>
                <th className="py-2.5 px-3">Nama Barang</th>
                <th className="py-2.5 px-3">Varian</th>
                <th className="py-2.5 px-3 text-center">Stok Sistem</th>
                <th className="py-2.5 px-3 text-center">Stok Fisik Dihitung</th>
                <th className="py-2.5 px-3 text-center">Selisih</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredEntries.map((entry) => {
                const delta = entry.actualStock - entry.systemStock;
                const hasDiff = delta !== 0;

                return (
                  <tr
                    key={entry.variantId}
                    className={`transition-colors ${
                      hasDiff ? 'bg-amber-50/50 hover:bg-amber-50' : 'hover:bg-slate-50'
                    }`}
                  >
                    <td className="py-2.5 px-3 font-bold text-slate-900">{entry.productName}</td>
                    <td className="py-2.5 px-3 text-slate-600">{entry.variantDesc}</td>
                    <td className="py-2.5 px-3 text-center font-bold text-slate-700">
                      {entry.systemStock} pcs
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <input
                        type="number"
                        min="0"
                        value={entry.actualStock}
                        onChange={(e) =>
                          handleActualStockChange(
                            entry.variantId,
                            parseInt(e.target.value) || 0
                          )
                        }
                        className={`w-20 text-center font-black py-1 px-2 border rounded-lg text-sm ${
                          hasDiff
                            ? 'border-amber-400 bg-white text-amber-900 ring-2 ring-amber-300/40'
                            : 'border-slate-300 bg-white text-slate-800'
                        }`}
                      />
                    </td>
                    <td className="py-2.5 px-3 text-center whitespace-nowrap">
                      {hasDiff ? (
                        <span
                          className={`inline-block font-black px-2 py-0.5 rounded text-xs ${
                            delta > 0
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {delta > 0 ? `+${delta}` : delta} pcs
                        </span>
                      ) : (
                        <span className="text-slate-400 font-medium">Sesuai (0)</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            {changedEntries.length > 0
              ? `Akan memperbarui ${changedEntries.length} stok varian yang mengalami selisih fisik.`
              : 'Semua jumlah fisik saat ini sesuai dengan data sistem.'}
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
              disabled={changedEntries.length === 0 || isSubmitting}
              onClick={handleSaveOpname}
              className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:pointer-events-none text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-600/30 flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>{isSubmitting ? 'Menerapkan Opname...' : `Terapkan ${changedEntries.length} Selisih Opname`}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
