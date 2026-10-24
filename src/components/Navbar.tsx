import React from 'react';
import { useInventory } from '../context/InventoryContext.tsx';
import { 
  Volume2, 
  VolumeX, 
  History, 
  Plus, 
  ClipboardCheck, 
  Smartphone, 
  Sliders, 
  Lock, 
  LayoutGrid,
  RefreshCw 
} from 'lucide-react';

interface NavbarProps {
  onOpenDeviceManager: () => void;
  onOpenAuditLog: () => void;
  onOpenOpname: () => void;
  onOpenAddProduct: () => void;
  onOpenSettings: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenDeviceManager,
  onOpenAuditLog,
  onOpenOpname,
  onOpenAddProduct,
  onOpenSettings,
}) => {
  const { 
    connectedDevicesCount, 
    connectionStatus, 
    currentDevice, 
    soundOn, 
    toggleSound, 
    stockLogs,
    settings,
    lockApp,
    refreshData,
    isRefreshing
  } = useInventory();

  return (
    <>
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-yellow-500/20 text-white shadow-md">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-18 gap-2 sm:gap-3">
            {/* Logo & Brand */}
            <div className="flex items-center gap-2.5 sm:gap-3">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-[#FEF9C3] p-1 shadow-md shadow-amber-500/20 border border-yellow-300 shrink-0 flex items-center justify-center overflow-hidden">
                <img 
                  src="/assets/aistudio/WhatsApp_Image_2026-10-20_at_14.00.08_44e1b065.jpeg" 
                  alt="STZ Stok Logo" 
                  className="w-full h-full object-contain"
                />
              </div>

              <div>
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <span className="font-extrabold text-sm sm:text-lg tracking-tight text-white truncate max-w-[140px] xs:max-w-[190px] sm:max-w-xs">
                    {settings.profile.storeName ? settings.profile.storeName : 'STZ'}{' '}
                    <span className="text-amber-400 font-semibold">Stok</span>
                  </span>
                  <span className="hidden sm:inline-block text-[10px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/40 px-1.5 py-0.5 rounded">
                    REAL-TIME
                  </span>
                </div>
                <div className="text-[10px] sm:text-[11px] text-yellow-100/70 truncate max-w-[180px] sm:max-w-sm">
                  {settings.profile.storeBranch ? `${settings.profile.storeBranch} • ` : ''}Rekap Barang Keluar / Masuk
                </div>
              </div>
            </div>

            {/* Center: Live Multi-Device Sync Badge */}
            <div className="flex items-center gap-2">
              <button
                onClick={onOpenDeviceManager}
                className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs font-semibold border transition-all hover:scale-105 active:scale-95 ${
                  connectionStatus === 'connected'
                    ? 'bg-emerald-950/70 border-emerald-500/50 text-emerald-300 hover:bg-emerald-900/80 shadow-sm'
                    : 'bg-amber-950/70 border-amber-500/50 text-amber-300 hover:bg-amber-900/80'
                }`}
                title="Klik untuk cek daftar siapa saja perangkat yang tersambung online & detail perangkat"
              >
                <span className="relative flex h-2 w-2 sm:h-2.5 sm:w-2.5">
                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                    connectionStatus === 'connected' ? 'bg-emerald-400' : 'bg-amber-400'
                  }`} />
                  <span className={`relative inline-flex rounded-full h-2 w-2 sm:h-2.5 sm:w-2.5 ${
                    connectionStatus === 'connected' ? 'bg-emerald-500' : 'bg-amber-500'
                  }`} />
                </span>
                <span className="hidden md:inline">
                  {connectionStatus === 'connected' ? 'Perangkat:' : 'Menghubungkan:'}
                </span>
                <span className="font-bold text-[11px] sm:text-xs">
                  {connectedDevicesCount} <span className="hidden xs:inline">Online</span>
                </span>
              </button>

              {/* Current Device Pill */}
              <button
                onClick={onOpenDeviceManager}
                className="hidden lg:flex items-center gap-1.5 text-xs text-yellow-100/80 bg-slate-800/80 hover:bg-slate-700/80 px-2.5 py-1.5 rounded-xl border border-slate-700 transition-colors"
                title="Ubah identitas perangkat ini"
              >
                <Smartphone className="w-3.5 h-3.5 text-amber-400" />
                <span className="truncate max-w-[120px] font-medium">{currentDevice.deviceName}</span>
              </button>
            </div>

            {/* Right Action Controls (Desktop & Mobile) */}
            <div className="flex items-center gap-1 sm:gap-2">
              {/* Tombol Refresh Halaman / Segarkan Data */}
              <button
                onClick={() => refreshData(true)}
                disabled={isRefreshing}
                className="flex items-center gap-1 px-2 sm:px-2.5 py-1.5 rounded-xl bg-amber-400/20 hover:bg-amber-400/30 border border-amber-400/50 text-amber-300 text-xs font-bold transition-all active:scale-95 shadow-xs disabled:opacity-50"
                title="Segarkan / Refresh Data Stok Real-Time"
              >
                <RefreshCw className={`w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span className="hidden xs:inline">{isRefreshing ? 'Memuat...' : 'Refresh'}</span>
              </button>

              {/* Sound Toggle */}
              <button
                onClick={toggleSound}
                className={`p-1.5 sm:p-2 rounded-xl border text-xs font-semibold transition-all ${
                  soundOn
                    ? 'bg-amber-400/20 border-amber-400/50 text-amber-300 hover:bg-amber-400/30'
                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
                }`}
                title={soundOn ? 'Suara Notifikasi Aktif' : 'Suara Notifikasi Senyap'}
              >
                {soundOn ? <Volume2 className="w-4 h-4 text-amber-400" /> : <VolumeX className="w-4 h-4" />}
              </button>

              {/* Audit Log Button (Desktop) */}
              <button
                onClick={onOpenAuditLog}
                className="hidden sm:flex relative p-2 sm:px-3 sm:py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-200 transition-colors items-center gap-1.5"
                title="Buka Riwayat Perubahan Real-Time"
              >
                <History className="w-4 h-4 text-amber-400" />
                <span className="hidden md:inline">Riwayat</span>
                {stockLogs.length > 0 && (
                  <span className="bg-amber-500 text-slate-950 text-[10px] font-black px-1.5 py-0.2 rounded-full">
                    {stockLogs.length > 99 ? '99+' : stockLogs.length}
                  </span>
                )}
              </button>

              {/* Opname Mode (Desktop) */}
              <button
                onClick={onOpenOpname}
                className="hidden md:flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-200 transition-colors"
                title="Audit & Opname Fisik Stok"
              >
                <ClipboardCheck className="w-4 h-4 text-amber-400" />
                <span>Opname</span>
              </button>

              {/* Pengaturan Button (Desktop) */}
              <button
                onClick={onOpenSettings}
                className="hidden sm:flex p-2 sm:px-3 sm:py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-200 transition-colors items-center gap-1.5"
                title="Buka Menu Pengaturan"
              >
                <Sliders className="w-4 h-4 text-amber-400" />
                <span className="hidden md:inline">Pengaturan</span>
              </button>

              {/* Lock Button (Both Desktop & Mobile) */}
              <button
                onClick={lockApp}
                className="p-1.5 sm:p-2 rounded-xl bg-slate-800 hover:bg-amber-950/70 border border-slate-700 text-slate-300 hover:text-amber-300 transition-colors"
                title="Kunci Layar Aplikasi (PIN Lock)"
              >
                <Lock className="w-4 h-4 text-amber-400" />
              </button>

              {/* Add Product Button (Desktop) */}
              <button
                onClick={onOpenAddProduct}
                className="hidden sm:flex px-3 sm:px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 rounded-xl text-xs font-extrabold transition-all shadow-md shadow-amber-500/30 items-center gap-1.5 shrink-0"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>Tambah Barang</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation Bar (Specifically for Smartphone / HP View) */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t border-yellow-200/90 shadow-[0_-4px_24px_rgba(202,138,4,0.15)] px-2 py-1.5 safe-area-pb">
        <div className="flex items-center justify-around max-w-md mx-auto">
          {/* 1. Katalog / Beranda */}
          <button
            onClick={() => {
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="flex flex-col items-center justify-center py-1.5 px-3 rounded-2xl text-slate-700 hover:text-amber-600 active:scale-95 transition-all"
          >
            <LayoutGrid className="w-5 h-5 text-amber-600" />
            <span className="text-[10px] font-extrabold mt-0.5">Katalog</span>
          </button>

          {/* 2. Opname */}
          <button
            onClick={onOpenOpname}
            className="flex flex-col items-center justify-center py-1.5 px-3 rounded-2xl text-slate-700 hover:text-amber-600 active:scale-95 transition-all"
          >
            <ClipboardCheck className="w-5 h-5 text-slate-600" />
            <span className="text-[10px] font-bold mt-0.5">Opname</span>
          </button>

          {/* 3. Center Action: Tambah Barang */}
          <button
            onClick={onOpenAddProduct}
            className="-mt-6 w-14 h-14 rounded-full bg-gradient-to-tr from-amber-500 via-amber-400 to-yellow-300 text-slate-950 shadow-xl shadow-amber-500/50 border-2 border-white flex flex-col items-center justify-center active:scale-90 transition-transform cursor-pointer"
            title="Tambah Barang"
          >
            <Plus className="w-7 h-7 stroke-[3]" />
          </button>

          {/* 4. Riwayat Activity */}
          <button
            onClick={onOpenAuditLog}
            className="relative flex flex-col items-center justify-center py-1.5 px-3 rounded-2xl text-slate-700 hover:text-amber-600 active:scale-95 transition-all"
          >
            <History className="w-5 h-5 text-slate-600" />
            <span className="text-[10px] font-bold mt-0.5">Riwayat</span>
            {stockLogs.length > 0 && (
              <span className="absolute top-0 right-1.5 w-4 h-4 bg-amber-500 text-slate-950 text-[9px] font-black rounded-full flex items-center justify-center shadow-xs">
                {stockLogs.length > 99 ? '99' : stockLogs.length}
              </span>
            )}
          </button>

          {/* 5. Pengaturan */}
          <button
            onClick={onOpenSettings}
            className="flex flex-col items-center justify-center py-1.5 px-3 rounded-2xl text-slate-700 hover:text-amber-600 active:scale-95 transition-all"
          >
            <Sliders className="w-5 h-5 text-slate-600" />
            <span className="text-[10px] font-bold mt-0.5">Pengaturan</span>
          </button>
        </div>
      </nav>
    </>
  );
};
