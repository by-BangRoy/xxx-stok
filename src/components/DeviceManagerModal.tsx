import React, { useState, useEffect } from 'react';
import { useInventory } from '../context/InventoryContext.tsx';
import { 
  Smartphone, 
  Laptop, 
  Wifi, 
  WifiOff, 
  Share2, 
  Copy, 
  Check, 
  X, 
  Radio, 
  User, 
  ShieldCheck,
  RefreshCw,
  QrCode
} from 'lucide-react';

interface DeviceManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DeviceManagerModal: React.FC<DeviceManagerModalProps> = ({ isOpen, onClose }) => {
  const { 
    connectedDevicesCount, 
    connectedDevices, 
    connectionStatus, 
    currentDevice, 
    updateDeviceProfile,
    simulateRemoteChange
  } = useInventory();

  const [deviceName, setDeviceName] = useState(currentDevice.deviceName);
  const [operatorName, setOperatorName] = useState(currentDevice.operatorName);
  const [isSaved, setIsSaved] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showSimulateOptions, setShowSimulateOptions] = useState(false);

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

  if (!isOpen) return null;

  const currentUrl = typeof window !== 'undefined' ? window.location.href : 'https://stz-fashion-stok.ai.studio';
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(currentUrl)}`;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (deviceName.trim() && operatorName.trim()) {
      updateDeviceProfile(deviceName.trim(), operatorName.trim());
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2000);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(currentUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-900 via-rose-950 to-slate-900 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-400/30 flex items-center justify-center text-rose-300">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Sinkronisasi Multi-Perangkat Real-Time</h2>
              <p className="text-xs text-rose-200/80">
                Pembaruan stok otomatis di semua perangkat (HP, Tablet, Laptop) terhubung internet
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

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Status Bar */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div className="flex items-center gap-3">
              <div className={`w-3.5 h-3.5 rounded-full ${
                connectionStatus === 'connected' ? 'bg-emerald-500 animate-ping' : 'bg-rose-500'
              }`} />
              <div>
                <div className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <span>Status Server Real-Time:</span>
                  <span className={`px-2 py-0.5 rounded text-xs ${
                    connectionStatus === 'connected' 
                      ? 'bg-emerald-100 text-emerald-800 font-semibold' 
                      : 'bg-rose-100 text-rose-800 font-semibold'
                  }`}>
                    {connectionStatus === 'connected' ? '🟢 Terhubung & Sinkron' : '🔴 Menghubungkan Ulang...'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Protokol WebSocket latensi rendah (&lt;50ms) dengan siaran instan.
                </p>
              </div>
            </div>

            <div className="text-right">
              <div className="text-2xl font-black text-rose-600">{connectedDevicesCount}</div>
              <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Perangkat Online</div>
            </div>
          </div>

          {/* Identity of This Device */}
          <div className="border border-slate-200 rounded-xl p-4 bg-white">
            <h3 className="text-sm font-bold text-slate-800 mb-1 flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-rose-600" />
              Identitas Perangkat Ini
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Nama ini akan muncul pada riwayat perubahan dan notifikasi di layar perangkat kasir/gudang lainnya saat Anda mengubah stok.
            </p>

            <form onSubmit={handleSave} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Perangkat</label>
                <input
                  type="text"
                  value={deviceName}
                  onChange={(e) => setDeviceName(e.target.value)}
                  placeholder="Contoh: Tablet Kasir Depan"
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

          {/* Quick Connect Another Device (QR Code & Link) */}
          <div className="border border-rose-100 bg-rose-50/50 rounded-xl p-4">
            <div className="flex flex-col sm:flex-row items-center gap-5">
              <div className="p-2 bg-white rounded-xl shadow-sm border border-rose-200 shrink-0">
                <img 
                  src={qrCodeUrl} 
                  alt="QR Code Buka di HP" 
                  className="w-28 h-28 object-contain"
                  loading="lazy"
                />
              </div>

              <div className="flex-1 text-center sm:text-left">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-200/70 text-rose-800 text-[11px] font-bold mb-1.5">
                  <QrCode className="w-3.5 h-3.5" />
                  Buka di Smartphone / Tablet Lain
                </div>
                <h4 className="text-sm font-bold text-slate-900">
                  Scan QR atau Buka Link di Perangkat Lain
                </h4>
                <p className="text-xs text-slate-600 mt-1 mb-3">
                  Buka tautan ini di smartphone, tablet kasir, atau laptop gudang. Coba ubah stok di satu perangkat, perangkat lain akan langsung terupdate detik itu juga!
                </p>

                <div className="flex items-center gap-2">
                  <input 
                    type="text" 
                    readOnly 
                    value={currentUrl} 
                    className="flex-1 text-xs bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-600 select-all"
                  />
                  <button
                    onClick={handleCopyLink}
                    className="px-3 py-2 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? 'Tersalin' : 'Salin URL'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Test Multi-Device Simulation */}
          <div className="border border-slate-200 rounded-xl p-4 bg-slate-50">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-indigo-600" />
                Uji Coba Langsung Simulasi Perangkat Lain
              </h3>
              <span className="text-[11px] font-medium text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-full">
                Fitur Demo Cepat
              </span>
            </div>
            <p className="text-xs text-slate-500 mb-3">
              Jika Anda sedang membuka di 1 tab/layar dan ingin melihat bagaimana notifikasi dan sinkronisasi real-time bekerja saat kasir atau gudang lain mengubah stok:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                onClick={() => {
                  simulateRemoteChange('sale');
                  onClose();
                }}
                className="p-2.5 bg-white hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 rounded-lg text-left transition-all group"
              >
                <div className="text-xs font-bold text-emerald-700 flex items-center justify-between">
                  <span>Simulasi Kasir 2 Jual</span>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded">-1 pcs</span>
                </div>
                <div className="text-[11px] text-slate-500 mt-1 group-hover:text-slate-700">
                  Kirim event penjualan dari "Tablet Kasir 2 (Lt. 2)"
                </div>
              </button>

              <button
                onClick={() => {
                  simulateRemoteChange('restock');
                  onClose();
                }}
                className="p-2.5 bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-300 rounded-lg text-left transition-all group"
              >
                <div className="text-xs font-bold text-blue-700 flex items-center justify-between">
                  <span>Simulasi Gudang Restock</span>
                  <span className="text-[10px] bg-blue-100 text-blue-800 px-1.5 py-0.2 rounded">+10 pcs</span>
                </div>
                <div className="text-[11px] text-slate-500 mt-1 group-hover:text-slate-700">
                  Kirim event barang masuk dari "Scanner Gudang Ekspedisi"
                </div>
              </button>

              <button
                onClick={() => {
                  simulateRemoteChange('critical');
                  onClose();
                }}
                className="p-2.5 bg-white hover:bg-amber-50 border border-slate-200 hover:border-amber-300 rounded-lg text-left transition-all group"
              >
                <div className="text-xs font-bold text-amber-700 flex items-center justify-between">
                  <span>Simulasi Stok Kritis</span>
                  <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded">Menipis</span>
                </div>
                <div className="text-[11px] text-slate-500 mt-1 group-hover:text-slate-700">
                  Picu alarm stok menipis dari "Admin Olshop Shopee"
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <div className="text-xs text-slate-500 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>STZ Stok Real-time Engine</span>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
