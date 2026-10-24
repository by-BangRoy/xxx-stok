import React, { useState, useEffect } from 'react';
import { useInventory } from '../context/InventoryContext.tsx';
import { StockLog, StockChangeType } from '../types/inventory.ts';
import { exportAuditLogsToCSV } from '../utils/csvExport.ts';
import { 
  X, 
  Download, 
  History, 
  Filter, 
  ShoppingBag, 
  PackagePlus, 
  RotateCcw, 
  AlertTriangle, 
  ClipboardCheck, 
  Smartphone,
  Search
} from 'lucide-react';

interface AuditLogDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuditLogDrawer: React.FC<AuditLogDrawerProps> = ({ isOpen, onClose }) => {
  const { stockLogs } = useInventory();
  const [filterType, setFilterType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Lock body scroll when drawer is open
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

  const filteredLogs = stockLogs.filter((log) => {
    const matchesType = filterType === 'all' || log.changeType === filterType;
    const matchesSearch =
      searchQuery === '' ||
      log.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.variantDescription.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.deviceName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.operatorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (log.reason && log.reason.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesType && matchesSearch;
  });

  const exportToCSV = () => {
    exportAuditLogsToCSV(filteredLogs);
  };

  const getChangeBadge = (type: StockChangeType) => {
    switch (type) {
      case 'sale':
        return {
          icon: ShoppingBag,
          label: 'Penjualan',
          class: 'bg-emerald-100 text-emerald-800 border-emerald-200',
        };
      case 'restock':
        return {
          icon: PackagePlus,
          label: 'Restock',
          class: 'bg-blue-100 text-blue-800 border-blue-200',
        };
      case 'return':
        return {
          icon: RotateCcw,
          label: 'Retur',
          class: 'bg-indigo-100 text-indigo-800 border-indigo-200',
        };
      case 'damage':
        return {
          icon: AlertTriangle,
          label: 'Cacat/Rusak',
          class: 'bg-rose-100 text-rose-800 border-rose-200',
        };
      default:
        return {
          icon: ClipboardCheck,
          label: 'Opname',
          class: 'bg-slate-100 text-slate-800 border-slate-200',
        };
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-xl bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-900 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-400/20 border border-amber-400/40 flex items-center justify-center text-amber-300">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Riwayat Rekap Stok</h2>
              <p className="text-xs text-yellow-100/70">
                Log audit otomatis setiap kali perangkat di jaringan mengubah stok
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={exportToCSV}
              className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
              title="Unduh CSV untuk Excel"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Ekspor CSV</span>
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/80 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="p-4 border-b border-slate-200 bg-slate-50 space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari produk, perangkat, operator, atau nota..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1 rounded-full font-bold whitespace-nowrap transition-all ${
                filterType === 'all'
                  ? 'bg-slate-900 text-white'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              Semua ({stockLogs.length})
            </button>
            <button
              onClick={() => setFilterType('sale')}
              className={`px-3 py-1 rounded-full font-bold whitespace-nowrap transition-all ${
                filterType === 'sale'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              Penjualan
            </button>
            <button
              onClick={() => setFilterType('restock')}
              className={`px-3 py-1 rounded-full font-bold whitespace-nowrap transition-all ${
                filterType === 'restock'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              Restock Masuk
            </button>
            <button
              onClick={() => setFilterType('return')}
              className={`px-3 py-1 rounded-full font-bold whitespace-nowrap transition-all ${
                filterType === 'return'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              Retur
            </button>
            <button
              onClick={() => setFilterType('damage')}
              className={`px-3 py-1 rounded-full font-bold whitespace-nowrap transition-all ${
                filterType === 'damage'
                  ? 'bg-rose-600 text-white'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              Cacat/Reject
            </button>
          </div>
        </div>

        {/* Logs Feed */}
        <div className="p-4 flex-1 overflow-y-auto divide-y divide-slate-100 space-y-3">
          {filteredLogs.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <History className="w-10 h-10 mx-auto text-slate-300 mb-2" />
              <p className="text-sm font-semibold">Belum ada riwayat perubahan yang cocok</p>
              <p className="text-xs text-slate-400 mt-1">
                Setiap kali stok ditambah atau dikurangi, log akan otomatis muncul di sini.
              </p>
            </div>
          ) : (
            filteredLogs.map((log) => {
              const badge = getChangeBadge(log.changeType);
              const BadgeIcon = badge.icon;
              const isPositive = log.delta > 0;

              return (
                <div key={log.id} className="pt-3 first:pt-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2.5">
                      <div className={`p-1.5 rounded-lg border ${badge.class} shrink-0 mt-0.5`}>
                        <BadgeIcon className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <div className="font-bold text-xs text-slate-900 leading-snug">
                          {log.productName}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          Varian: <span className="font-semibold text-slate-700">{log.variantDescription}</span>
                        </div>
                        {log.reason && (
                          <div className="text-[11px] text-slate-600 bg-slate-50 px-2 py-0.5 rounded border border-slate-200 mt-1 w-fit">
                            "{log.reason}"
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-1.5">
                          <span className="flex items-center gap-1 font-medium text-slate-600">
                            <Smartphone className="w-2.5 h-2.5" />
                            {log.deviceName} ({log.operatorName})
                          </span>
                          <span>•</span>
                          <span>
                            {new Date(log.timestamp).toLocaleTimeString('id-ID', {
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit',
                            })}{' '}
                            - {new Date(log.timestamp).toLocaleDateString('id-ID', {
                              day: 'numeric',
                              month: 'short',
                            })}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Stock Numbers */}
                    <div className="text-right shrink-0">
                      <div className={`text-sm font-black ${
                        isPositive ? 'text-emerald-600' : 'text-rose-600'
                      }`}>
                        {isPositive ? `+${log.delta}` : log.delta} pcs
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {log.previousStock} → <span className="font-bold text-slate-700">{log.newStock} pcs</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
          <span>Menampilkan {filteredLogs.length} dari {stockLogs.length} transaksi</span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
