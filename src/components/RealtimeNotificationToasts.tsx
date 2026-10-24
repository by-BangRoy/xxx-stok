import React from 'react';
import { useInventory, RealtimeToast } from '../context/InventoryContext.tsx';
import { 
  ShoppingBag, 
  PackagePlus, 
  AlertTriangle, 
  AlertOctagon, 
  Info, 
  X, 
  Radio, 
  Smartphone,
  CheckCircle2
} from 'lucide-react';

export const RealtimeNotificationToasts: React.FC = () => {
  const { activeToasts, dismissToast, clearAllToasts } = useInventory();

  if (activeToasts.length === 0) return null;

  return (
    <div className="fixed top-16 sm:top-auto sm:bottom-6 right-3 sm:right-6 z-50 flex flex-col gap-2.5 max-w-[calc(100vw-1.5rem)] sm:max-w-md w-full pointer-events-none">
      {activeToasts.length > 2 && (
        <div className="flex justify-end pointer-events-auto">
          <button
            onClick={clearAllToasts}
            className="text-xs font-medium bg-slate-800/80 hover:bg-slate-900 text-slate-200 px-3 py-1 rounded-full shadow-md backdrop-blur transition-all"
          >
            Tutup Semua ({activeToasts.length})
          </button>
        </div>
      )}

      {activeToasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={() => dismissToast(toast.id)} />
      ))}
    </div>
  );
};

const ToastItem: React.FC<{ toast: RealtimeToast; onDismiss: () => void }> = ({ toast, onDismiss }) => {
  const getBadgeConfig = () => {
    switch (toast.type) {
      case 'danger':
        return {
          bg: 'bg-rose-50 border-rose-200 text-rose-900',
          iconBg: 'bg-rose-500 text-white',
          icon: AlertOctagon,
          tag: 'STOK HABIS',
          tagClass: 'bg-rose-600 text-white',
        };
      case 'warning':
        return {
          bg: 'bg-amber-50 border-amber-200 text-amber-900',
          iconBg: 'bg-amber-500 text-white',
          icon: AlertTriangle,
          tag: 'STOK MENIPIS',
          tagClass: 'bg-amber-500 text-white',
        };
      case 'sale':
        return {
          bg: 'bg-emerald-50 border-emerald-200 text-emerald-950',
          iconBg: 'bg-emerald-600 text-white',
          icon: ShoppingBag,
          tag: 'PENJUALAN TERJUAL',
          tagClass: 'bg-emerald-600 text-white',
        };
      case 'restock':
        return {
          bg: 'bg-blue-50 border-blue-200 text-blue-950',
          iconBg: 'bg-blue-600 text-white',
          icon: PackagePlus,
          tag: 'RESTOCK MASUK',
          tagClass: 'bg-blue-600 text-white',
        };
      default:
        return {
          bg: 'bg-slate-50 border-slate-200 text-slate-900',
          iconBg: 'bg-slate-700 text-white',
          icon: Info,
          tag: 'UPDATE STOK',
          tagClass: 'bg-slate-700 text-white',
        };
    }
  };

  const config = getBadgeConfig();
  const IconComponent = config.icon;

  return (
    <div
      className={`pointer-events-auto p-4 rounded-xl border shadow-xl backdrop-blur-md transition-all duration-300 transform translate-y-0 opacity-100 ${config.bg} animate-in slide-in-from-right-8`}
      role="alert"
    >
      <div className="flex items-start gap-3">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 shadow-sm ${config.iconBg}`}>
          <IconComponent className="w-5 h-5" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded tracking-wide ${config.tagClass}`}>
              {config.tag}
            </span>
            {toast.isRemote ? (
              <span className="flex items-center gap-1 text-[11px] font-semibold text-rose-600 bg-rose-100/80 px-2 py-0.5 rounded-full">
                <Radio className="w-3 h-3 animate-pulse" />
                Perangkat Lain: {toast.deviceName}
              </span>
            ) : (
              <span className="flex items-center gap-1 text-[11px] font-medium text-slate-500">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                Perangkat Ini
              </span>
            )}
          </div>

          <p className="text-xs font-bold leading-snug line-clamp-2">
            {toast.title}
          </p>

          <p className="text-xs text-slate-700 mt-1 leading-relaxed">
            {toast.message}
          </p>

          <div className="mt-2 pt-2 border-t border-black/5 flex items-center justify-between text-[11px] text-slate-500">
            <span className="flex items-center gap-1 truncate max-w-[200px]">
              <Smartphone className="w-3 h-3" />
              {toast.operatorName} ({toast.deviceName})
            </span>
            <span>
              {new Date(toast.timestamp).toLocaleTimeString('id-ID', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
              })}
            </span>
          </div>
        </div>

        <button
          onClick={onDismiss}
          className="text-slate-400 hover:text-slate-700 p-1 rounded-md transition-colors"
          title="Tutup Notifikasi"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
