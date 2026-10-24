import React, { useState, useEffect } from 'react';
import { useInventory } from '../context/InventoryContext.tsx';
import { 
  Smartphone, 
  Laptop, 
  Tablet,
  Copy, 
  Check, 
  X, 
  Radio, 
  User, 
  ShieldCheck,
  RefreshCw,
  QrCode,
  Lock,
  Users,
  Clock,
  Globe,
  Sparkles,
  ChevronRight,
  ExternalLink,
  MessageSquare,
  Share2,
  Camera,
  CheckCircle2
} from 'lucide-react';
import { DeviceInfo } from '../types/inventory.ts';

interface DeviceManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'devices' | 'connect' | 'identity';
}

export const DeviceManagerModal: React.FC<DeviceManagerModalProps> = ({ 
  isOpen, 
  onClose,
  initialTab = 'devices'
}) => {
  const { 
    connectedDevicesCount, 
    connectedDevices, 
    connectionStatus, 
    currentDevice, 
    updateDeviceProfile
  } = useInventory();

  const [activeTab, setActiveTab] = useState<'devices' | 'connect' | 'identity'>(initialTab);
  const [deviceName, setDeviceName] = useState(currentDevice.deviceName);
  const [operatorName, setOperatorName] = useState(currentDevice.operatorName);
  const [isSaved, setIsSaved] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isRefreshingDevices, setIsRefreshingDevices] = useState(false);
  const [localDevices, setLocalDevices] = useState<DeviceInfo[]>([]);

  // Keep device name and operator name in sync with current device profile
  useEffect(() => {
    setDeviceName(currentDevice.deviceName);
    setOperatorName(currentDevice.operatorName);
  }, [currentDevice]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      if (initialTab) setActiveTab(initialTab);
      const originalStyle = window.getComputedStyle(document.body).overflow;
      document.body.style.overflow = 'hidden';
      fetchDevicesList();
      return () => {
        document.body.style.overflow = originalStyle;
      };
    }
  }, [isOpen, initialTab]);

  const fetchDevicesList = async () => {
    setIsRefreshingDevices(true);
    try {
      const res = await fetch('/api/devices');
      if (res.ok) {
        const data = await res.json();
        if (data.devices && Array.isArray(data.devices)) {
          setLocalDevices(data.devices);
        }
      }
    } catch (e) {
      console.warn('Failed to fetch devices list:', e);
    } finally {
      setTimeout(() => setIsRefreshingDevices(false), 400);
    }
  };

  if (!isOpen) return null;

  const currentUrl = typeof window !== 'undefined' ? window.location.href : 'https://stz-fashion-stok.ai.studio';
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(currentUrl)}`;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (deviceName.trim() && operatorName.trim()) {
      updateDeviceProfile(deviceName.trim(), operatorName.trim());
      setIsSaved(true);
      fetchDevicesList();
      setTimeout(() => setIsSaved(false), 2000);
    }
  };

  const handleCopyLink = () => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(currentUrl);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = currentUrl;
        textarea.style.position = 'fixed';
        textarea.style.left = '-9999px';
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
    } catch (err) {
      console.error('Failed to copy URL:', err);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleShareWhatsApp = () => {
    const text = `Halo, berikut tautan sistem inventaris STZ Stok:\n${currentUrl}\n\nSilakan buka di HP untuk mulai mencatat stok barang keluar & masuk secara real-time.`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleOpenNewTab = () => {
    window.open(currentUrl, '_blank');
  };

  // Helper to determine device icon and badge
  const getDeviceVisuals = (device: DeviceInfo) => {
    const raw = `${device.deviceName} ${device.userAgent || ''}`.toLowerCase();
    if (/tablet|ipad/.test(raw)) {
      return {
        icon: <Tablet className="w-5 h-5 text-indigo-600" />,
        typeLabel: 'Tablet Kasir / Etalase',
        colorBg: 'bg-indigo-50 border-indigo-200 text-indigo-700'
      };
    }
    if (/mobi|phone|android|iphone/.test(raw)) {
      return {
        icon: <Smartphone className="w-5 h-5 text-emerald-600" />,
        typeLabel: 'Smartphone / HP Kasir',
        colorBg: 'bg-emerald-50 border-emerald-200 text-emerald-700'
      };
    }
    return {
      icon: <Laptop className="w-5 h-5 text-blue-600" />,
      typeLabel: 'Komputer / Laptop Toko',
      colorBg: 'bg-blue-50 border-blue-200 text-blue-700'
    };
  };

  // Combine localDevices and connectedDevices, ensuring current device is always shown
  const rawList = localDevices.length > 0 ? localDevices : connectedDevices;
  const mergedMap = new Map<string, DeviceInfo>();

  // Ensure current device is present
  mergedMap.set(currentDevice.deviceId, {
    deviceId: currentDevice.deviceId,
    deviceName: currentDevice.deviceName,
    operatorName: currentDevice.operatorName,
    lastSeen: new Date().toISOString(),
    ip: '127.0.0.1 (Perangkat Ini)'
  });

  // Add all other devices
  for (const d of rawList) {
    mergedMap.set(d.deviceId, d);
  }

  const allDisplayDevices = Array.from(mergedMap.values()).sort((a, b) => {
    if (a.deviceId === currentDevice.deviceId) return -1;
    if (b.deviceId === currentDevice.deviceId) return 1;
    return 0;
  });

  const totalOnlineCount = Math.max(connectedDevicesCount, allDisplayDevices.length);

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-3xl shadow-2xl border border-yellow-200/90 w-full max-w-2xl overflow-hidden max-h-[92vh] flex flex-col text-slate-800"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-yellow-500/20 flex items-center justify-between bg-slate-900 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-400/20 border border-amber-400/40 flex items-center justify-center text-amber-300 shrink-0">
              <Radio className="w-5 h-5 animate-pulse text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black tracking-tight text-white">
                  Sinkronisasi Multi-Perangkat
                </h2>
                <span className="text-[10px] bg-amber-400/20 text-amber-300 px-2 py-0.5 rounded-full font-bold border border-amber-400/40">
                  REAL-TIME
                </span>
              </div>
              <p className="text-xs text-yellow-100/70 mt-0.5">
                Stok otomatis tersinkron seketika antar HP kasir, tablet, dan komputer toko
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/80 hover:text-white transition-colors shrink-0"
            title="Tutup dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation Controls */}
        <div className="flex border-b border-yellow-200/80 bg-yellow-50/50 px-3 sm:px-6 pt-2.5 gap-1.5 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('devices')}
            className={`flex items-center gap-2 px-3.5 sm:px-4 py-2.5 text-xs font-bold border-b-2 transition-all whitespace-nowrap rounded-t-xl ${
              activeTab === 'devices'
                ? 'border-amber-500 text-slate-900 bg-white shadow-xs'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-white/60'
            }`}
          >
            <Users className={`w-3.5 h-3.5 ${activeTab === 'devices' ? 'text-amber-600' : 'text-slate-400'}`} />
            <span>Perangkat Online</span>
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${
              activeTab === 'devices' ? 'bg-amber-400 text-slate-950' : 'bg-slate-200 text-slate-700'
            }`}>
              {totalOnlineCount}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('connect')}
            className={`flex items-center gap-2 px-3.5 sm:px-4 py-2.5 text-xs font-bold border-b-2 transition-all whitespace-nowrap rounded-t-xl ${
              activeTab === 'connect'
                ? 'border-amber-500 text-slate-900 bg-white shadow-xs'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-white/60'
            }`}
          >
            <QrCode className={`w-3.5 h-3.5 ${activeTab === 'connect' ? 'text-amber-600' : 'text-slate-400'}`} />
            <span>Sambungkan HP Lain</span>
          </button>

          <button
            onClick={() => setActiveTab('identity')}
            className={`flex items-center gap-2 px-3.5 sm:px-4 py-2.5 text-xs font-bold border-b-2 transition-all whitespace-nowrap rounded-t-xl ${
              activeTab === 'identity'
                ? 'border-amber-500 text-slate-900 bg-white shadow-xs'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-white/60'
            }`}
          >
            <Smartphone className={`w-3.5 h-3.5 ${activeTab === 'identity' ? 'text-amber-600' : 'text-slate-400'}`} />
            <span>Nama Perangkat Ini</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1">
          {/* Status Bar */}
          <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-amber-50/70 via-yellow-50/60 to-emerald-50/40 border border-yellow-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="relative flex h-3 w-3 shrink-0">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                  connectionStatus === 'connected' ? 'bg-emerald-400' : 'bg-amber-400'
                }`} />
                <span className={`relative inline-flex rounded-full h-3 w-3 ${
                  connectionStatus === 'connected' ? 'bg-emerald-500' : 'bg-amber-500'
                }`} />
              </div>
              <div>
                <div className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-2">
                  <span>Status Server:</span>
                  <span className={`px-2 py-0.5 rounded-md text-[11px] font-black ${
                    connectionStatus === 'connected' 
                      ? 'bg-emerald-100 text-emerald-900 border border-emerald-300' 
                      : 'bg-amber-100 text-amber-900 border border-amber-300'
                  }`}>
                    {connectionStatus === 'connected' ? '🟢 Terhubung & Siaga' : '🟡 Menghubungkan...'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Latensi siaran otomatis &lt;50ms. Setiap ada barang keluar atau masuk langsung diperbarui.
                </p>
              </div>
            </div>

            <button
              onClick={fetchDevicesList}
              disabled={isRefreshingDevices}
              className="px-3 py-1.5 bg-white hover:bg-amber-50 border border-yellow-300 text-slate-800 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs shrink-0 self-start sm:self-center disabled:opacity-50 active:scale-95"
              title="Segarkan daftar perangkat online"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-amber-600 ${isRefreshingDevices ? 'animate-spin' : ''}`} />
              <span>{isRefreshingDevices ? 'Memuat...' : 'Segarkan Daftar'}</span>
            </button>
          </div>

          {/* TAB 1: DAFTAR PERANGKAT ONLINE */}
          {activeTab === 'devices' && (
            <div className="space-y-3 animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-amber-600" />
                    <span>Daftar Perangkat Terhubung ({allDisplayDevices.length})</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Perangkat yang saat ini sedang membuka aplikasi stok dan aktif saling sinkronisasi.
                  </p>
                </div>
              </div>

              {/* Device Cards List */}
              <div className="space-y-2.5">
                {allDisplayDevices.map((dev, idx) => {
                  const isCurrent = dev.deviceId === currentDevice.deviceId;
                  const visuals = getDeviceVisuals(dev);
                  return (
                    <div 
                      key={dev.deviceId || idx}
                      className={`p-3.5 sm:p-4 rounded-2xl border transition-all ${
                        isCurrent
                          ? 'bg-amber-50/50 border-amber-300 ring-1 ring-amber-300 shadow-xs'
                          : 'bg-white border-yellow-200/90 hover:border-yellow-300 shadow-xs'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 border ${visuals.colorBg}`}>
                            {visuals.icon}
                          </div>
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                              <span className="text-sm font-bold text-slate-900 truncate">
                                {dev.deviceName || 'Perangkat Browser'}
                              </span>
                              {isCurrent ? (
                                <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-slate-900 text-amber-300 shadow-xs">
                                  Perangkat Ini
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                  Online
                                </span>
                              )}
                            </div>
                            
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-slate-600">
                              <span className="flex items-center gap-1 font-medium text-slate-700">
                                <User className="w-3.5 h-3.5 text-amber-600" />
                                <span>Kasir/Staf: <strong className="text-slate-900">{dev.operatorName || 'Staf Toko'}</strong></span>
                              </span>
                              <span className="text-slate-300 hidden sm:inline">•</span>
                              <span className="text-[11px] text-slate-500 hidden sm:inline">
                                {visuals.typeLabel}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            Aktif
                          </span>
                        </div>
                      </div>

                      {/* Detail Footer for Device */}
                      <div className="mt-2.5 pt-2.5 border-t border-slate-100 flex flex-wrap items-center justify-between text-[11px] text-slate-500 gap-2">
                        <div className="flex items-center gap-3">
                          <span className="flex items-center gap-1">
                            <Globe className="w-3 h-3 text-slate-400" />
                            <span>Koneksi: {dev.ip || 'Lokal Toko'}</span>
                          </span>
                        </div>
                        {isCurrent && (
                          <button
                            onClick={() => setActiveTab('identity')}
                            className="text-amber-700 hover:text-amber-900 font-bold text-[11px] flex items-center gap-0.5 hover:underline"
                          >
                            <span>Ubah Nama Perangkat</span>
                            <ChevronRight className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Informative Helper Box */}
              <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200 flex items-center justify-between gap-3 text-xs text-amber-950">
                <div className="flex items-center gap-2.5">
                  <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
                  <div>
                    <span className="font-extrabold text-slate-900">Ingin menyambungkan HP kasir atau smartphone staf lain?</span>
                    <p className="text-[11px] text-slate-600 mt-0.5">
                      Buka tab <strong>"Sambungkan HP Lain"</strong> untuk scan QR Code atau menyalin tautan toko ke HP staf.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveTab('connect')}
                  className="px-3.5 py-1.5 bg-slate-900 hover:bg-amber-500 hover:text-slate-950 text-white rounded-xl text-xs font-bold shrink-0 transition-colors shadow-xs active:scale-95"
                >
                  Sambungkan HP
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: SAMBUNGKAN HP LAIN */}
          {activeTab === 'connect' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              {/* Main Hub Card */}
              <div className="bg-gradient-to-br from-amber-500/10 via-yellow-500/5 to-white border border-amber-200/90 rounded-2xl p-4 sm:p-5 shadow-xs">
                <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
                  {/* Kolom Kiri: QR Code Card */}
                  <div className="w-full sm:w-auto flex flex-col items-center shrink-0">
                    <div className="p-3.5 bg-white rounded-2xl shadow-md border-2 border-amber-300 ring-4 ring-amber-100/70 flex flex-col items-center">
                      <img 
                        src={qrCodeUrl} 
                        alt="QR Code Buka di HP" 
                        className="w-40 h-40 object-contain rounded-xl"
                        loading="lazy"
                      />
                      <div className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-950 text-[11px] font-black border border-amber-300">
                        <Camera className="w-3.5 h-3.5 text-amber-700" />
                        <span>Scan Kamera HP</span>
                      </div>
                    </div>
                    <span className="text-[11px] text-slate-500 mt-2 text-center max-w-[210px] leading-tight">
                      Arahkan kamera smartphone ke kode ini untuk langsung membuka sistem
                    </span>
                  </div>

                  {/* Kolom Kanan: Detail Tautan & Tombol Aksi Rapi */}
                  <div className="flex-1 w-full space-y-3.5">
                    <div>
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-amber-200/70 text-amber-950 text-[11px] font-black uppercase tracking-wider mb-1.5">
                        <QrCode className="w-3.5 h-3.5 text-amber-700" />
                        <span>Koneksi Instan Multi-Perangkat</span>
                      </div>
                      <h4 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                        Sambungkan Smartphone Kasir & Gudang
                      </h4>
                      <p className="text-xs text-slate-600 leading-relaxed mt-1">
                        Buka sistem kasir di HP staf kasir atau staf gudang tanpa perlu mengunduh aplikasi di Play Store atau App Store. Semua data stok langsung terhubung otomatis seketika.
                      </p>
                    </div>

                    {/* URL Card Display */}
                    <div className="space-y-1.5">
                      <label className="block text-[11px] font-bold text-slate-700">
                        Tautan Langsung Aplikasi Toko:
                      </label>
                      <div 
                        onClick={handleCopyLink}
                        className="flex items-center justify-between bg-white border border-yellow-300 hover:border-amber-400 rounded-xl p-2 pl-3.5 shadow-xs cursor-pointer transition-colors group"
                        title="Klik untuk salin tautan toko"
                      >
                        <div className="flex items-center gap-2 overflow-hidden flex-1">
                          <Lock className="w-4 h-4 text-amber-600 shrink-0" />
                          <span className="text-xs font-bold text-slate-800 truncate">
                            Tautan Privat Toko STZ Stok
                          </span>
                          <span className="hidden sm:inline-block text-[10px] font-bold bg-amber-100 text-amber-950 px-2 py-0.5 rounded-md border border-amber-300 shrink-0">
                            Terproteksi
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopyLink();
                          }}
                          className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-extrabold flex items-center gap-1.5 transition-all active:scale-95 shrink-0 ml-2 cursor-pointer shadow-xs"
                          title="Salin tautan ke clipboard"
                        >
                          {copied ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-400 stroke-[3]" />
                              <span className="text-emerald-300">Tersalin!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5 text-amber-400" />
                              <span>Salin URL</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Tombol-Tombol Aksi Rapi */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                      {/* Tombol WhatsApp */}
                      <button
                        onClick={handleShareWhatsApp}
                        className="w-full px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 transition-all shadow-xs active:scale-95 cursor-pointer"
                      >
                        <MessageSquare className="w-4 h-4" />
                        <span>Kirim via WhatsApp</span>
                      </button>

                      {/* Tombol Buka Tab Baru */}
                      <button
                        onClick={handleOpenNewTab}
                        className="w-full px-4 py-2.5 bg-white hover:bg-yellow-50 text-slate-800 border border-yellow-300 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 transition-all shadow-xs active:scale-95 cursor-pointer"
                      >
                        <ExternalLink className="w-4 h-4 text-amber-600" />
                        <span>Buka di Tab Baru</span>
                      </button>
                    </div>

                    {/* Status Alert Badge */}
                    {copied && (
                      <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold flex items-center gap-2 animate-in fade-in">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>Tautan berhasil disalin! Silakan kirimkan ke chat WhatsApp staf kasir Anda.</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Panduan 3 Langkah Cepat & Terstruktur */}
              <div className="space-y-2 pt-1">
                <div className="text-xs font-black text-slate-800 flex items-center gap-1.5 uppercase tracking-wider">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  <span>3 Langkah Mudah Sambungkan HP Lain:</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Langkah 1 */}
                  <div className="p-3.5 bg-white rounded-2xl border border-yellow-200/90 shadow-xs flex flex-col justify-between">
                    <div>
                      <div className="w-7 h-7 rounded-xl bg-amber-400 text-slate-950 text-xs font-black flex items-center justify-center mb-2.5 shadow-xs">
                        1
                      </div>
                      <div className="text-xs font-extrabold text-slate-900">
                        Scan QR atau Buka Link
                      </div>
                      <p className="text-[11px] text-slate-600 mt-1.5 leading-relaxed">
                        Arahkan kamera smartphone ke QR Code di atas, atau klik link toko yang dikirimkan via WhatsApp.
                      </p>
                    </div>
                    <div className="mt-3 pt-2 border-t border-slate-100 text-[10px] text-amber-800 font-bold">
                      ✓ Tanpa unduh aplikasi
                    </div>
                  </div>

                  {/* Langkah 2 */}
                  <div className="p-3.5 bg-white rounded-2xl border border-yellow-200/90 shadow-xs flex flex-col justify-between">
                    <div>
                      <div className="w-7 h-7 rounded-xl bg-amber-400 text-slate-950 text-xs font-black flex items-center justify-center mb-2.5 shadow-xs">
                        2
                      </div>
                      <div className="text-xs font-extrabold text-slate-900">
                        Beri Nama HP & Kasir
                      </div>
                      <p className="text-[11px] text-slate-600 mt-1.5 leading-relaxed">
                        Ketik nama staf (contoh: "Siti - Kasir Depan") agar semua transaksi tercatat jelas di riwayat aktivitas.
                      </p>
                    </div>
                    <div className="mt-3 pt-2 border-t border-slate-100 text-[10px] text-amber-800 font-bold">
                      ✓ Otomatis tercatat di riwayat
                    </div>
                  </div>

                  {/* Langkah 3 */}
                  <div className="p-3.5 bg-white rounded-2xl border border-yellow-200/90 shadow-xs flex flex-col justify-between">
                    <div>
                      <div className="w-7 h-7 rounded-xl bg-amber-400 text-slate-950 text-xs font-black flex items-center justify-center mb-2.5 shadow-xs">
                        3
                      </div>
                      <div className="text-xs font-extrabold text-slate-900">
                        Sinkronisasi Siaga
                      </div>
                      <p className="text-[11px] text-slate-600 mt-1.5 leading-relaxed">
                        Setiap kali ada barang keluar atau masuk, stok di seluruh HP dan tablet terupdate seketika (&lt;50ms).
                      </p>
                    </div>
                    <div className="mt-3 pt-2 border-t border-slate-100 text-[10px] text-emerald-700 font-bold">
                      ✓ Real-time & siaga otomatis
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: IDENTITAS PERANGKAT INI */}
          {activeTab === 'identity' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="border border-yellow-200 rounded-2xl p-4 sm:p-5 bg-white shadow-xs">
                <h3 className="text-sm font-bold text-slate-900 mb-1 flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-amber-600" />
                  <span>Identitas Perangkat Ini</span>
                </h3>
                <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                  Nama ini akan muncul pada riwayat catatan aktivitas dan notifikasi di layar HP kasir lainnya setiap kali Anda mengubah stok barang.
                </p>

                <form onSubmit={handleSave} className="space-y-3.5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Nama Perangkat
                      </label>
                      <input
                        type="text"
                        value={deviceName}
                        onChange={(e) => setDeviceName(e.target.value)}
                        placeholder="Contoh: Tablet Kasir Utama / HP Kasir Depan"
                        className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-yellow-50/50 border border-yellow-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400 focus:bg-white transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Nama Staf / Operator
                      </label>
                      <input
                        type="text"
                        value={operatorName}
                        onChange={(e) => setOperatorName(e.target.value)}
                        placeholder="Contoh: Siti (Kasir) / Budi (Gudang)"
                        className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-yellow-50/50 border border-yellow-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400 focus:bg-white transition-colors"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2">
                    {isSaved && (
                      <span className="text-xs text-emerald-700 font-bold flex items-center gap-1 animate-in fade-in">
                        <Check className="w-4 h-4 text-emerald-600" />
                        <span>Identitas tersimpan!</span>
                      </span>
                    )}
                    <button
                      type="submit"
                      className="px-5 py-2.5 bg-slate-900 hover:bg-amber-500 hover:text-slate-950 text-white rounded-xl text-xs font-extrabold transition-all shadow-sm active:scale-95"
                    >
                      Simpan Identitas
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-yellow-100 bg-yellow-50/50 flex items-center justify-between">
          <div className="text-xs text-slate-600 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span className="font-medium">STZ Stok Engine • {totalOnlineCount} Perangkat Terhubung</span>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors shadow-xs active:scale-95"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
