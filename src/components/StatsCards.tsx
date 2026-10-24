import React from 'react';
import { useInventory } from '../context/InventoryContext.tsx';
import { 
  Package, 
  Layers, 
  AlertTriangle, 
  AlertOctagon, 
  Activity
} from 'lucide-react';

interface StatsCardsProps {
  onFilterLowStock: () => void;
  onFilterOutOfStock: () => void;
  onResetFilter: () => void;
  activeFilter: string;
}

export const StatsCards: React.FC<StatsCardsProps> = ({
  onFilterLowStock,
  onFilterOutOfStock,
  onResetFilter,
  activeFilter,
}) => {
  const { products, stockLogs } = useInventory();

  const totalModels = products.length;
  const totalUnits = products.reduce((sum, p) => sum + p.totalStock, 0);

  const outOfStockProducts = products.filter((p) => p.totalStock === 0).length;
  const lowStockProducts = products.filter(
    (p) => p.totalStock > 0 && p.variants.some((v) => v.stock <= v.minStock)
  ).length;

  const todayLogsCount = stockLogs.filter((l) => {
    try {
      const d = new Date(l.timestamp);
      return d.toDateString() === new Date().toDateString();
    } catch {
      return false;
    }
  }).length;

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-4 mb-5">
      {/* 1. Total Unit Stok */}
      <div 
        onClick={onResetFilter}
        className={`p-3.5 sm:p-4 rounded-2xl border transition-all cursor-pointer ${
          activeFilter === 'all'
            ? 'bg-gradient-to-br from-slate-900 to-slate-800 text-white border-yellow-500/40 shadow-md ring-2 ring-amber-400/50'
            : 'bg-white hover:border-yellow-300 text-slate-800 border-yellow-200/90 shadow-sm'
        }`}
      >
        <div className="flex items-center justify-between mb-1.5 sm:mb-2">
          <span className={`text-[11px] sm:text-xs font-bold uppercase tracking-wider ${
            activeFilter === 'all' ? 'text-amber-300' : 'text-slate-500'
          }`}>
            Total Stok
          </span>
          <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center ${
            activeFilter === 'all' ? 'bg-amber-400/20 text-amber-300' : 'bg-yellow-50 text-amber-700'
          }`}>
            <Layers className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </div>
        </div>
        <div className="text-xl sm:text-3xl font-black">
          {totalUnits.toLocaleString('id-ID')}
          <span className="text-xs font-normal ml-1 opacity-70">pcs</span>
        </div>
        <div className={`text-[10px] sm:text-[11px] mt-0.5 sm:mt-1 font-bold ${activeFilter === 'all' ? 'text-amber-300' : 'text-amber-800'}`}>
          ≈ {(totalUnits / 12).toLocaleString('id-ID', { maximumFractionDigits: 1 })} lusin
        </div>
      </div>

      {/* 2. Total Model Busana */}
      <div 
        onClick={onResetFilter}
        className="p-3.5 sm:p-4 rounded-2xl bg-white border border-yellow-200/90 shadow-sm cursor-pointer hover:border-yellow-300 transition-all"
      >
        <div className="flex items-center justify-between mb-1.5 sm:mb-2">
          <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-500">
            Model Barang
          </span>
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
            <Package className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </div>
        </div>
        <div className="text-xl sm:text-3xl font-black text-slate-900">
          {totalModels}
          <span className="text-xs font-normal ml-1 text-slate-500">model</span>
        </div>
        <div className="text-[10px] sm:text-[11px] text-slate-400 mt-0.5 sm:mt-1">
          Kategori aktif
        </div>
      </div>

      {/* 3. Stok Menipis */}
      <div
        onClick={onFilterLowStock}
        className={`p-3.5 sm:p-4 rounded-2xl border transition-all cursor-pointer ${
          activeFilter === 'low'
            ? 'bg-amber-500 text-slate-950 font-bold border-amber-600 shadow-md ring-2 ring-amber-300'
            : 'bg-white hover:border-amber-300 text-slate-800 border-yellow-200/90 shadow-sm'
        }`}
      >
        <div className="flex items-center justify-between mb-1.5 sm:mb-2">
          <span className={`text-[11px] sm:text-xs font-bold uppercase tracking-wider ${
            activeFilter === 'low' ? 'text-slate-950' : 'text-amber-800'
          }`}>
            Menipis
          </span>
          <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center ${
            activeFilter === 'low' ? 'bg-black/10 text-slate-950' : 'bg-amber-50 text-amber-600'
          }`}>
            <AlertTriangle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </div>
        </div>
        <div className={`text-xl sm:text-3xl font-black ${
          activeFilter === 'low' ? 'text-slate-950' : lowStockProducts > 0 ? 'text-amber-600' : 'text-slate-800'
        }`}>
          {lowStockProducts}
          <span className="text-xs font-normal ml-1 opacity-80">model</span>
        </div>
        <div className={`text-[10px] sm:text-[11px] mt-0.5 sm:mt-1 ${activeFilter === 'low' ? 'text-slate-800' : 'text-slate-400'}`}>
          Perlu restock
        </div>
      </div>

      {/* 4. Stok Habis (0) */}
      <div
        onClick={onFilterOutOfStock}
        className={`p-3.5 sm:p-4 rounded-2xl border transition-all cursor-pointer ${
          activeFilter === 'out'
            ? 'bg-rose-600 text-white border-rose-700 shadow-md ring-2 ring-rose-400'
            : 'bg-white hover:border-rose-300 text-slate-800 border-yellow-200/90 shadow-sm'
        }`}
      >
        <div className="flex items-center justify-between mb-1.5 sm:mb-2">
          <span className={`text-[11px] sm:text-xs font-bold uppercase tracking-wider ${
            activeFilter === 'out' ? 'text-white' : 'text-rose-700'
          }`}>
            Habis (0)
          </span>
          <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center ${
            activeFilter === 'out' ? 'bg-white/20 text-white' : 'bg-rose-50 text-rose-600'
          }`}>
            <AlertOctagon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </div>
        </div>
        <div className={`text-xl sm:text-3xl font-black ${
          activeFilter === 'out' ? 'text-white' : outOfStockProducts > 0 ? 'text-rose-600' : 'text-slate-800'
        }`}>
          {outOfStockProducts}
          <span className="text-xs font-normal ml-1 opacity-80">model</span>
        </div>
        <div className={`text-[10px] sm:text-[11px] mt-0.5 sm:mt-1 ${activeFilter === 'out' ? 'text-rose-100' : 'text-slate-400'}`}>
          Perlu produksi
        </div>
      </div>

      {/* 5. Aktivitas Real-Time Hari Ini */}
      <div className="p-3.5 sm:p-4 rounded-2xl bg-white border border-yellow-200/90 shadow-sm col-span-2 md:col-span-1">
        <div className="flex items-center justify-between mb-1.5 sm:mb-2">
          <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-500">
            Aktivitas Hari Ini
          </span>
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-yellow-50 text-amber-700 flex items-center justify-center">
            <Activity className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </div>
        </div>
        <div className="text-xl sm:text-3xl font-black text-slate-900">
          {todayLogsCount}
          <span className="text-xs font-normal ml-1 text-slate-500">log</span>
        </div>
        <div className="text-[10px] sm:text-[11px] text-amber-800 font-semibold mt-0.5 sm:mt-1 flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Real-time aktif
        </div>
      </div>
    </div>
  );
};
