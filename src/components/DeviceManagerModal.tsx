import React, { useState, useEffect } from 'react';
import { useInventory } from '../context/InventoryContext.tsx';
import { 
  Smartphone, 
  Laptop, 
  Tablet,
  Monitor,
  Wifi, 
  WifiOff, 
  Copy, 
  Check, 
  X, 
  Radio, 
  User, 
  ShieldCheck,
  RefreshCw,
  QrCode,
  Lock,
  Eye,
  EyeOff,
  Users,
  Clock,
  Globe,
  Sparkles,
  ExternalLink,
  ChevronRight
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
  const [showPlainUrl, setShowPlainUrl] = useState(false);
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
      const originalStyle = window.getComputedStyle(document.body).overflow;
      document.body.style.overflow = 'hidden';
      fetchDevicesList();
      return () => {
        document.body.style.overflow = originalStyle;
      };
    }
  }, [isOpen]);

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
      typeLabel: 'Komputer / Laptop Gudang',
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-gradient-to-r from-slate-900 via-rose-950 to-slate-900 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-400/30 flex items-center justify-center text-rose-300 shrink-0">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold flex items-center gap-2">
                <span>Sinkronisasi Multi-Perangkat</span>
                <span className="text-[11px] bg-rose-500/30 text-rose-200 px-2 py-0.5 rounded-full font-medium border border-rose-400/20">
                  Real-Time Live
                </span>
              </h2>
              <p className="text-xs text-rose-200/80 line-clamp-1">
                Pembaruan stok otomatis antar HP, Tablet kasir, dan Laptop toko
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/80 hover:text-white transition-colors shrink-0"
            title="Tutup dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation Controls */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-3 sm:px-6 pt-2 gap-1 overflow-x-auto">
          <button
            onClick={() => setActiveTab('devices')}
            className={`flex items-center gap-2 px-3 sm:px-4 py-2.5 text-xs font-bold border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'devices'
                ? 'border-rose-600 text-rose-700 bg-white rounded-t-xl shadow-xs'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100/60 rounded-t-xl'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Perangkat Online</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
              activeTab === 'devices' ? 'bg-rose-100 text-rose-800' : 'bg-slate-200 text-slate-700'
            }`}>
              {totalOnlineCount}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('connect')}
            className={`flex items-center gap-2 px-3 sm:px-4 py-2.5 text-xs font-bold border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'connect'
                ? 'border-rose-600 text-rose-700 bg-white rounded-t-xl shadow-xs'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100/60 rounded-t-xl'
            }`}
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>Sambungkan HP Lain</span>
          </button>

          <button
            onClick={() => setActiveTab('identity')}
            className={`flex items-center gap-2 px-3 sm:px-4 py-2.5 text-xs font-bold border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'identity'
                ? 'border-rose-600 text-rose-700 bg-white rounded-t-xl shadow-xs'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100/60 rounded-t-xl'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Nama Perangkat Ini</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {/* Status Bar Widget with Quick Action */}
          <div className="p-3.5 sm:p-4 rounded-xl bg-gradient-to-r from-slate-50 to-rose-50/30 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="relative flex h-3.5 w-3.5 shrink-0">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                  connectionStatus === 'connected' ? 'bg-emerald-400' : 'bg-rose-400'
                }`} />
                <span className={`relative inline-flex rounded-full h-3.5 w-3.5 ${
                  connectionStatus === 'connected' ? 'bg-emerald-500' : 'bg-rose-500'
                }`} />
              </div>
              <div>
                <div className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-2">
                  <span>Server Real-Time:</span>
                  <span className={`px-2 py-0.5 rounded text-[11px] sm:text-xs font-bold ${
                    connectionStatus === 'connected' 
                      ? 'bg-emerald-100 text-emerald-800' 
                      : 'bg-rose-100 text-rose-800'
                  }`}>
                    {connectionStatus === 'connected' ? '🟢 Terhubung & Siaga' : '🔴 Menghubungkan...'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Latensi siaran &lt;50ms. Stok langsung terupdate di semua perangkat tanpa reload.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-center">
              <button
                onClick={() => {
                  setActiveTab('devices');
                  fetchDevicesList();
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs ${
                  activeTab === 'devices'
                    ? 'bg-rose-600 text-white'
                    : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-300'
                }`}
                title="Cek daftar siapa saja perangkat yang tersambung online"
              >
                <Users className="w-3.5 h-3.5" />
                <span>Cek Detail Perangkat ({totalOnlineCount})</span>
              </button>
            </div>
          </div>

          {/* TAB 1: DAFTAR PERANGKAT ONLINE & DETAIL LENGKAP */}
          {activeTab === 'devices' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Users className="w-4 h-4 text-rose-600" />
                    <span>Daftar Perangkat Tersambung Online ({allDisplayDevices.length})</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Perangkat yang saat ini sedang membuka aplikasi toko dan aktif saling sinkron stok.
                  </p>
                </div>
                <button
                  onClick={fetchDevicesList}
                  disabled={isRefreshingDevices}
                  className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50 shadow-xs shrink-0"
                  title="Segarkan daftar perangkat online"
                >
                  <RefreshCw className={`w-3.5 h-3.5 text-slate-600 ${isRefreshingDevices ? 'animate-spin' : ''}`} />
                  <span className="hidden sm:inline">Segarkan</span>
                </button>
              </div>

              {/* Device Cards List */}
              <div className="space-y-2.5">
                {allDisplayDevices.map((dev, idx) => {
                  const isCurrent = dev.deviceId === currentDevice.deviceId;
                  const visuals = getDeviceVisuals(dev);
                  return (
                    <div 
                      key={dev.deviceId || idx}
                      className={`p-3.5 sm:p-4 rounded-xl border transition-all ${
                        isCurrent
                          ? 'bg-rose-50/40 border-rose-300 ring-1 ring-rose-200 shadow-sm'
                          : 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
                      }`}
                    >
                      <div className="flex items-start sm:items-center justify-between gap-3">
                        <div className="flex items-start sm:items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${visuals.colorBg}`}>
                            {visuals.icon}
                          </div>
                          <div>
                            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                              <span className="text-sm font-bold text-slate-900">
                                {dev.deviceName || 'Perangkat Browser'}
                              </span>
                              {isCurrent ? (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-600 text-white shadow-xs">
                                  Perangkat Anda Saat Ini
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                  Online Sekarang
                                </span>
                              )}
                            </div>
                            
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-slate-600">
                              <span className="flex items-center gap-1 font-medium text-slate-700">
                                <User className="w-3.5 h-3.5 text-rose-500" />
                                <span>Operator: <strong className="text-slate-900">{dev.operatorName || 'Staf'}</strong></span>
                              </span>
                              <span className="text-slate-300 hidden sm:inline">•</span>
                              <span className="text-[11px] text-slate-500">
                                Tipe: <span className="font-semibold text-slate-700">{visuals.typeLabel}</span>
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                            Aktif Real-Time
                          </span>
                          <div className="text-[10px] font-mono text-slate-400 mt-1">
                            {dev.deviceId.length > 18 ? `${dev.deviceId.substring(0, 16)}...` : dev.deviceId}
                          </div>
                        </div>
                      </div>

                      {/* Detail Footer for Device */}
                      <div className="mt-2.5 pt-2.5 border-t border-slate-100 flex flex-wrap items-center justify-between text-[11px] text-slate-500 gap-2">
                        <div className="flex items-center gap-3">
                          <span className="flex items-center gap-1">
                            <Globe className="w-3 h-3 text-slate-400" />
                            <span>Jaringan: {dev.ip || 'Lokal / Cloud Toko'}</span>
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-400" />
                            <span>Terhubung: Siaga aktif</span>
                          </span>
                        </div>
                        {isCurrent && (
                          <button
                            onClick={() => setActiveTab('identity')}
                            className="text-rose-600 hover:text-rose-800 font-bold text-[11px] flex items-center gap-0.5 hover:underline"
                          >
                            <span>Ubah Nama Perangkat Ini</span>
                            <ChevronRight className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Informative Connection Helper Box */}
              <div className="p-3.5 rounded-xl bg-amber-50/60 border border-amber-200/80 flex items-start gap-3 text-xs text-amber-900">
                <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <span className="font-bold">Ingin menyambungkan HP kasir atau gudang lain?</span>
                  <p className="text-[11px] text-amber-800 mt-0.5">
                    Buka tab <strong>"Sambungkan HP Lain"</strong> untuk scan QR Code atau menyalin tautan privat aman ke smartphone staf Anda.
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab('connect')}
                  className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold shrink-0 transition-colors shadow-xs"
                >
                  Sambungkan HP
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: SAMBUNGKAN HP LAIN (QR CODE & TAUTAN PRIVAT DENGAN URL TERSEMBUNYI) */}
          {activeTab === 'connect' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="border border-rose-100 bg-rose-50/40 rounded-xl p-4 sm:p-5">
                <div className="flex flex-col sm:flex-row items-center gap-5">
                  <div className="p-2.5 bg-white rounded-xl shadow-sm border border-rose-200 shrink-0 text-center">
                    <img 
                      src={qrCodeUrl} 
                      alt="QR Code Buka di HP" 
                      className="w-32 h-32 object-contain"
                      loading="lazy"
                    />
                    <span className="block text-[10px] text-slate-500 font-medium mt-1">
                      Arahkan kamera HP ke sini
                    </span>
                  </div>

                  <div className="flex-1 text-center sm:text-left space-y-2">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-200/70 text-rose-800 text-[11px] font-bold">
                      <QrCode className="w-3.5 h-3.5" />
                      Scan Kamera HP / Salin Tautan
                    </div>
                    <h4 className="text-sm font-bold text-slate-900">
                      Buka di Smartphone Kasir, Gudang, atau Tablet Toko
                    </h4>
                    <p className="text-xs text-slate-600">
                      Cukup scan QR Code menggunakan kamera HP atau klik <strong>Salin URL</strong> di bawah untuk dibagikan ke WhatsApp staf toko. Stok akan tersinkronisasi otomatis seketika!
                    </p>

                    {/* URL BOX - ALAMAT URL RAW DISEMBUNYIKAN DEMI KEAMANAN & KERAPIAN */}
                    <div className="pt-2">
                      <div className="flex items-center gap-2">
                        {/* Masked / Hidden URL Box with Padlock */}
                        <div 
                          onClick={handleCopyLink}
                          className="flex-1 flex items-center justify-between px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl cursor-pointer hover:border-rose-400 transition-colors shadow-xs group"
                          title="Klik untuk salin tautan"
                        >
                          <div className="flex items-center gap-2 overflow-hidden flex-1">
                            <Lock className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                            {showPlainUrl ? (
                              <span className="text-xs font-mono text-slate-800 truncate select-all">
                                {currentUrl}
                              </span>
                            ) : (
                              <div className="flex items-center gap-2 text-xs text-slate-600 font-medium overflow-hidden">
                                <span className="tracking-widest font-mono text-slate-400 select-none">
                                  •••••••••••••••••••••••••••••••••••••••••••••
                                </span>
                                <span className="hidden sm:inline-block text-[10px] font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200 shrink-0">
                                  Tautan Privat Toko
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Eye toggle to reveal URL if desired */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowPlainUrl(!showPlainUrl);
                            }}
                            className="p-1 rounded-md hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors ml-2 shrink-0"
                            title={showPlainUrl ? 'Sembunyikan URL asli' : 'Tampilkan teks URL asli'}
                          >
                            {showPlainUrl ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                        </div>

                        {/* TOMBOL SALIN URL YANG TETAP BERFUNGSI SEMPURNA */}
                        <button
                          onClick={handleCopyLink}
                          className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm active:scale-95 shrink-0"
                          title="Salin tautan asli ke clipboard perangkat"
                        >
                          {copied ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-300" />
                              <span>Tersalin!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>Salin URL</span>
                            </>
                          )}
                        </button>
                      </div>

                      {/* Notification feedback below copy box */}
                      <div className="mt-1.5 text-[11px]">
                        {copied ? (
                          <span className="text-emerald-700 font-bold flex items-center gap-1 animate-in fade-in">
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Tautan berhasil disalin ke clipboard! Siap ditempel di WhatsApp atau browser HP staf.</span>
                          </span>
                        ) : (
                          <span className="text-slate-500 flex items-center gap-1">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span>Teks URL asli disembunyikan demi keamanan tampilan toko. Tombol "Salin URL" tetap berfungsi normal.</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Instructions steps */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                <div className="p-3 bg-white rounded-xl border border-slate-200">
                  <div className="w-6 h-6 rounded-full bg-rose-100 text-rose-800 text-xs font-bold flex items-center justify-center mb-1.5">
                    1
                  </div>
                  <div className="text-xs font-bold text-slate-800">Buka Kamera HP</div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Arahkan kamera ke QR code di atas, atau buka tautan yang disalin lewat WhatsApp.
                  </p>
                </div>

                <div className="p-3 bg-white rounded-xl border border-slate-200">
                  <div className="w-6 h-6 rounded-full bg-rose-100 text-rose-800 text-xs font-bold flex items-center justify-center mb-1.5">
                    2
                  </div>
                  <div className="text-xs font-bold text-slate-800">Beri Nama HP</div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Beri nama misalnya "HP Kasir 2" atau "Smartphone Gudang" beserta nama staf Anda.
                  </p>
                </div>

                <div className="p-3 bg-white rounded-xl border border-slate-200">
                  <div className="w-6 h-6 rounded-full bg-rose-100 text-rose-800 text-xs font-bold flex items-center justify-center mb-1.5">
                    3
                  </div>
                  <div className="text-xs font-bold text-slate-800">Sinkron Otomatis</div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Semua transaksi, restock, dan perubahan stok langsung terlihat seketika di semua layar.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: PENGATURAN IDENTITAS PERANGKAT INI & SIMULASI */}
          {activeTab === 'identity' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="border border-slate-200 rounded-xl p-4 bg-white">
                <h3 className="text-sm font-bold text-slate-800 mb-1 flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-rose-600" />
                  Identitas Perangkat Ini
                </h3>
                <p className="text-xs text-slate-500 mb-4">
                  Nama ini akan muncul pada riwayat log perubahan dan notifikasi di layar HP/kasir lainnya saat Anda mengubah stok pakaian.
                </p>

                <form onSubmit={handleSave} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Perangkat</label>
                    <input
                      type="text"
                      value={deviceName}
                      onChange={(e) => setDeviceName(e.target.value)}
                      placeholder="Contoh: HP Kasir Depan"
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Staf / Operator</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={operatorName}
                        onChange={(e) => setOperatorName(e.target.value)}
                        placeholder="Contoh: Siti (Kasir)"
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
                      />
                      <button
                        type="submit"
                        className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition-colors shrink-0 shadow-sm"
                      >
                        {isSaved ? 'Tersimpan!' : 'Simpan'}
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <div className="text-xs text-slate-500 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>STZ Stok Engine • {totalOnlineCount} Perangkat Terhubung</span>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition-colors shadow-xs"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
