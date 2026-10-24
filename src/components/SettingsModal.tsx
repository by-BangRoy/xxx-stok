import React, { useState, useEffect } from 'react';
import { useInventory } from '../context/InventoryContext.tsx';
import { StoreProfile, AppSettings } from '../types/inventory.ts';
import { exportInventoryToCSV } from '../utils/csvExport.ts';
import { 
  X, 
  Store, 
  Shield, 
  Sliders, 
  Trash2, 
  RotateCcw, 
  Save, 
  KeyRound, 
  Download, 
  Volume2, 
  VolumeX, 
  AlertTriangle, 
  CheckCircle2, 
  Radio, 
  Smartphone,
  Sparkles,
  Lock,
  PackageX,
  CalendarX
} from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'profile' | 'security' | 'preferences' | 'danger';
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ 
  isOpen, 
  onClose,
  initialTab = 'profile'
}) => {
  const { 
    settings, 
    updateSettings, 
    resetSettings, 
    clearAllStock, 
    clearAllProducts,
    clearTodayLogs,
    currentDevice, 
    updateDeviceProfile,
    products,
    stockLogs,
    resetDemoData,
    lockApp
  } = useInventory();

  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'preferences' | 'danger'>(initialTab);
  const wasOpenRef = React.useRef(false);

  // Profile Form state
  const [profile, setProfile] = useState<StoreProfile>({
    storeName: settings.profile?.storeName || '',
    storeBranch: settings.profile?.storeBranch || '',
    tagline: settings.profile?.tagline || '',
    phone: settings.profile?.phone || '',
    address: settings.profile?.address || '',
    ownerName: settings.profile?.ownerName || '',
    socialMedia: settings.profile?.socialMedia || '',
  });
  const [deviceName, setDeviceName] = useState(currentDevice.deviceName);
  const [operatorName, setOperatorName] = useState(currentDevice.operatorName);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Security / PIN Form state
  const [currentPinInput, setCurrentPinInput] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinRequired, setPinRequired] = useState(settings.pinRequired);
  const [pinChangeMsg, setPinChangeMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Preferences Form state
  const [soundEnabled, setSoundEnabled] = useState(settings.soundEnabled);
  const [defaultMinStock, setDefaultMinStock] = useState<number>(settings.defaultMinStockAlert || 3);
  const [enableStockNotifications, setEnableStockNotifications] = useState(settings.enableStockNotifications);

  // Clear stock confirmation dialog state
  const [showClearStockConfirm, setShowClearStockConfirm] = useState(false);
  const [clearStockPin, setClearStockPin] = useState('');
  const [clearStockError, setClearStockError] = useState('');
  const [isClearing, setIsClearing] = useState(false);

  // Clear ALL products confirmation dialog state
  const [showClearProductsConfirm, setShowClearProductsConfirm] = useState(false);
  const [clearProductsPin, setClearProductsPin] = useState('');
  const [clearProductsError, setClearProductsError] = useState('');
  const [isClearingProducts, setIsClearingProducts] = useState(false);

  // Clear TODAY's activity logs state
  const [showClearTodayConfirm, setShowClearTodayConfirm] = useState(false);
  const [clearTodayPin, setClearTodayPin] = useState('');
  const [clearTodayError, setClearTodayError] = useState('');
  const [isClearingToday, setIsClearingToday] = useState(false);

  // Reset settings confirmation state
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [resetSuccessMsg, setResetSuccessMsg] = useState(false);
  const [actionSuccessNotice, setActionSuccessNotice] = useState('');

  const [saveSuccessMsg, setSaveSuccessMsg] = useState(false);

  // Lock body scroll and sync state when modal is opened (only on initial open to prevent wiping typed inputs)
  useEffect(() => {
    if (isOpen) {
      if (initialTab) {
        setActiveTab(initialTab);
      }
      if (!wasOpenRef.current) {
        setProfile({
          storeName: settings.profile?.storeName || '',
          storeBranch: settings.profile?.storeBranch || '',
          tagline: settings.profile?.tagline || '',
          phone: settings.profile?.phone || '',
          address: settings.profile?.address || '',
          ownerName: settings.profile?.ownerName || '',
          socialMedia: settings.profile?.socialMedia || '',
        });
        setPinRequired(settings.pinRequired);
        setSoundEnabled(settings.soundEnabled);
        setDefaultMinStock(settings.defaultMinStockAlert || 3);
        setEnableStockNotifications(settings.enableStockNotifications);
        setDeviceName(currentDevice.deviceName);
        setOperatorName(currentDevice.operatorName);
        setProfileMsg(null);
        setPinChangeMsg(null);
        setSaveSuccessMsg(false);
      }
      const originalStyle = window.getComputedStyle(document.body).overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalStyle;
      };
    }
    wasOpenRef.current = isOpen;
  }, [isOpen, initialTab]);

  if (!isOpen) return null;

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    setProfileMsg(null);
    try {
      updateDeviceProfile(deviceName.trim() || 'Perangkat Toko', operatorName.trim() || 'Staf');
      const cleanedProfile: StoreProfile = {
        storeName: (profile.storeName || '').trim(),
        storeBranch: (profile.storeBranch || '').trim(),
        tagline: (profile.tagline || '').trim(),
        phone: (profile.phone || '').trim(),
        address: (profile.address || '').trim(),
        ownerName: (profile.ownerName || '').trim(),
        socialMedia: (profile.socialMedia || '').trim(),
      };
      const ok = await updateSettings({ profile: cleanedProfile });
      if (ok) {
        setProfile(cleanedProfile);
        setProfileMsg({ type: 'success', text: '✓ Profil toko & staf berhasil disimpan dan disinkronkan ke semua perangkat!' });
        setTimeout(() => setProfileMsg(null), 3500);
      } else {
        setProfileMsg({ type: 'error', text: 'Gagal menyimpan profil toko ke server. Silakan periksa koneksi internet.' });
      }
    } catch (err: any) {
      setProfileMsg({ type: 'error', text: err?.message || 'Terjadi kesalahan saat menyimpan profil' });
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleChangePin = async (e: React.FormEvent) => {
    e.preventDefault();
    setPinChangeMsg(null);

    // Verify current PIN
    if (currentPinInput !== settings.securityPin) {
      setPinChangeMsg({ type: 'error', text: 'PIN Lama salah! Tidak dapat mengubah PIN.' });
      return;
    }

    if (newPin.length < 4 || newPin.length > 6) {
      setPinChangeMsg({ type: 'error', text: 'PIN Baru harus terdiri dari 4 hingga 6 digit angka.' });
      return;
    }

    if (newPin !== confirmPin) {
      setPinChangeMsg({ type: 'error', text: 'Konfirmasi PIN Baru tidak cocok!' });
      return;
    }

    const ok = await updateSettings({ securityPin: newPin });
    if (ok) {
      setPinChangeMsg({ type: 'success', text: `PIN Berhasil Diubah! Harap ingat PIN baru ini.` });
      setCurrentPinInput('');
      setNewPin('');
      setConfirmPin('');
    } else {
      setPinChangeMsg({ type: 'error', text: 'Gagal memperbarui PIN di server.' });
    }
  };

  const handleSavePreferences = async (e: React.FormEvent) => {
    e.preventDefault();
    const ok = await updateSettings({
      soundEnabled,
      defaultMinStockAlert: Number(defaultMinStock) || 3,
      enableStockNotifications,
    });
    if (ok) {
      setSaveSuccessMsg(true);
      setTimeout(() => setSaveSuccessMsg(false), 2500);
    }
  };

  const handleExecuteClearStock = async () => {
    setClearStockError('');
    if (!clearStockPin.trim()) {
      setClearStockError('Masukkan PIN keamanan untuk konfirmasi pengosongan stok');
      return;
    }

    setIsClearing(true);
    const result = await clearAllStock(clearStockPin.trim());
    setIsClearing(false);

    if (result.success) {
      setShowClearStockConfirm(false);
      setClearStockPin('');
      setActionSuccessNotice('✓ Berhasil! Seluruh stok barang telah dikosongkan (0 pcs) dan disinkronkan ke semua perangkat.');
      setTimeout(() => setActionSuccessNotice(''), 4500);
    } else {
      setClearStockError(result.error || 'PIN Keamanan salah! Gagal mengosongkan stok.');
    }
  };

  const handleExecuteClearProducts = async () => {
    setClearProductsError('');
    if (!clearProductsPin.trim()) {
      setClearProductsError('Masukkan PIN keamanan untuk konfirmasi penghapusan seluruh produk');
      return;
    }

    setIsClearingProducts(true);
    const result = await clearAllProducts(clearProductsPin.trim());
    setIsClearingProducts(false);

    if (result.success) {
      setShowClearProductsConfirm(false);
      setClearProductsPin('');
      setActionSuccessNotice('✓ Berhasil! Seluruh produk barang telah dihapus dari katalog.');
      setTimeout(() => setActionSuccessNotice(''), 4500);
    } else {
      setClearProductsError(result.error || 'PIN Keamanan salah! Gagal menghapus seluruh produk.');
    }
  };

  const handleExecuteClearTodayLogs = async () => {
    setClearTodayError('');
    if (!clearTodayPin.trim()) {
      setClearTodayError('Masukkan PIN keamanan untuk konfirmasi penghapusan aktivitas hari ini');
      return;
    }

    setIsClearingToday(true);
    const result = await clearTodayLogs(clearTodayPin.trim());
    setIsClearingToday(false);

    if (result.success) {
      setShowClearTodayConfirm(false);
      setClearTodayPin('');
      setActionSuccessNotice(`✓ Berhasil! ${result.count ?? 0} catatan aktivitas hari ini telah dihapus dan disinkronkan ke semua perangkat.`);
      setTimeout(() => setActionSuccessNotice(''), 4500);
    } else {
      setClearTodayError(result.error || 'PIN Keamanan salah! Gagal menghapus aktivitas hari ini.');
    }
  };

  const handleExecuteResetSettings = async () => {
    setIsResetting(true);
    const ok = await resetSettings();
    setIsResetting(false);
    if (ok) {
      setProfile({
        storeName: '',
        storeBranch: '',
        tagline: '',
        phone: '',
        address: '',
        ownerName: '',
        socialMedia: '',
      });
      setPinRequired(true);
      setSoundEnabled(true);
      setDefaultMinStock(3);
      setEnableStockNotifications(true);
      setCurrentPinInput('');
      setNewPin('');
      setConfirmPin('');
      setShowResetConfirm(false);
      setResetSuccessMsg(true);
      setTimeout(() => setResetSuccessMsg(false), 4000);
    }
  };

  const handleDownloadBackup = () => {
    const backupData = {
      backupDate: new Date().toISOString(),
      storeProfile: settings.profile,
      settings,
      products,
      stockLogs,
    };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `STZ_Fashion_Backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-yellow-500/20 flex items-center justify-between bg-slate-900 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-400/20 border border-amber-400/40 flex items-center justify-center text-amber-300">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Menu Pengaturan Sistem</h2>
              <p className="text-xs text-yellow-100/70">
                Profil toko, keamanan PIN, reset, dan penghapusan aktivitas stok
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

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 p-2 bg-yellow-50/80 border-b border-yellow-200/90 overflow-x-auto text-xs font-bold no-scrollbar">
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl whitespace-nowrap transition-all ${
              activeTab === 'profile'
                ? 'bg-white text-slate-900 shadow-sm border border-yellow-200'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
            }`}
          >
            <Store className="w-4 h-4 text-amber-600" />
            <span>Profil Toko & Staf</span>
          </button>

          <button
            onClick={() => setActiveTab('security')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl whitespace-nowrap transition-all ${
              activeTab === 'security'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
            }`}
          >
            <Shield className="w-4 h-4 text-amber-600" />
            <span>Keamanan & PIN</span>
          </button>

          <button
            onClick={() => setActiveTab('preferences')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl whitespace-nowrap transition-all ${
              activeTab === 'preferences'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
            }`}
          >
            <Sliders className="w-4 h-4 text-indigo-600" />
            <span>Preferensi Sistem</span>
          </button>

          <button
            onClick={() => setActiveTab('danger')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl whitespace-nowrap transition-all ${
              activeTab === 'danger'
                ? 'bg-rose-50 text-rose-700 shadow-sm'
                : 'text-rose-600 hover:bg-rose-50/50'
            }`}
          >
            <Trash2 className="w-4 h-4 text-rose-600" />
            <span>Aksi Kritis & Hapus Data</span>
          </button>
        </div>

        {/* Tab Contents */}
        <div className="p-6 overflow-y-auto flex-1">
          {saveSuccessMsg && (
            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Pengaturan berhasil disimpan dan disinkronkan ke seluruh perangkat!</span>
            </div>
          )}

          {/* TAB 1: EDIT PROFIL BUTIK & STAF */}
          {activeTab === 'profile' && (
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Edit Profil Toko</h3>
                  <p className="text-xs text-slate-500">
                    Informasi profil usaha toko Anda
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Nama Toko
                  </label>
                  <input
                    type="text"
                    placeholder="Masukkan nama toko..."
                    value={profile.storeName}
                    onChange={(e) => setProfile({ ...profile, storeName: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Nama Cabang / Galeri
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Cabang Utama / Lantai 1"
                    value={profile.storeBranch}
                    onChange={(e) => setProfile({ ...profile, storeBranch: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Slogan / Tagline
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Modest Fashion & Boutique"
                    value={profile.tagline}
                    onChange={(e) => setProfile({ ...profile, tagline: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    No. WhatsApp / Telepon
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: +62 8..."
                    value={profile.phone}
                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Nama Pemilik / Penanggung Jawab
                  </label>
                  <input
                    type="text"
                    placeholder="Nama owner / manajer..."
                    value={profile.ownerName}
                    onChange={(e) => setProfile({ ...profile, ownerName: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Instagram / TikTok Toko
                  </label>
                  <input
                    type="text"
                    placeholder="@akun.toko"
                    value={profile.socialMedia}
                    onChange={(e) => setProfile({ ...profile, socialMedia: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Alamat Lengkap Toko
                </label>
                <textarea
                  rows={2}
                  placeholder="Alamat toko, nomor ruko, kota..."
                  value={profile.address}
                  onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              {/* Operator info on this device */}
              <div className="pt-3 border-t border-slate-100">
                <h4 className="text-xs font-bold text-slate-800 uppercase mb-2 flex items-center gap-1.5">
                  <Smartphone className="w-3.5 h-3.5 text-rose-600" />
                  Identitas Perangkat & Operator Ini
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Nama Perangkat Ini
                    </label>
                    <input
                      type="text"
                      value={deviceName}
                      onChange={(e) => setDeviceName(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Nama Staf yang Bertugas
                    </label>
                    <input
                      type="text"
                      value={operatorName}
                      onChange={(e) => setOperatorName(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-3 flex justify-end">
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-md shadow-rose-600/30 flex items-center gap-2 transition-all"
                >
                  <Save className="w-4 h-4" />
                  <span>Simpan Profil & Identitas</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: KEAMANAN & PIN */}
          {activeTab === 'security' && (
            <div className="space-y-6">
              {/* PIN Status Card */}
              <div className="p-4 rounded-2xl bg-slate-900 text-white flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Proteksi PIN Keamanan Toko</h4>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Hanya staf yang mengetahui PIN yang dapat mengakses sistem stok, mengubah data, dan mengosongkan stok.
                  </p>
                </div>
              </div>

              {/* Form Ubah PIN */}
              <form onSubmit={handleChangePin} className="border border-slate-200 rounded-2xl p-5 bg-white space-y-4">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <Shield className="w-4 h-4 text-rose-600" />
                  Ubah PIN Keamanan
                </h4>

                {pinChangeMsg && (
                  <div className={`p-3 rounded-xl text-xs font-bold ${
                    pinChangeMsg.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
                  }`}>
                    {pinChangeMsg.text}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      PIN Lama
                    </label>
                    <input
                      type="password"
                      maxLength={6}
                      required
                      placeholder="Ketik PIN lama"
                      value={currentPinInput}
                      onChange={(e) => setCurrentPinInput(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl font-mono text-center"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      PIN Baru (4-6 digit)
                    </label>
                    <input
                      type="password"
                      maxLength={6}
                      required
                      placeholder="Ketik PIN baru"
                      value={newPin}
                      onChange={(e) => setNewPin(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl font-mono text-center"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Konfirmasi PIN Baru
                    </label>
                    <input
                      type="password"
                      maxLength={6}
                      required
                      placeholder="Ketik ulang"
                      value={confirmPin}
                      onChange={(e) => setConfirmPin(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl font-mono text-center"
                    />
                  </div>
                </div>

                <div className="flex justify-end items-center pt-2">
                  <button
                    type="submit"
                    className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
                  >
                    Perbarui PIN
                  </button>
                </div>
              </form>

              {/* Quick Lock Button */}
              <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Kunci Layar Sekarang (Lock Screen)</h4>
                  <p className="text-xs text-slate-500">
                    Segera kunci tampilan saat Anda hendak meninggalkan meja kasir/gudang.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    lockApp();
                  }}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Kunci Aplikasi</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: PREFERENSI SISTEM */}
          {activeTab === 'preferences' && (
            <form onSubmit={handleSavePreferences} className="space-y-5">
              <div className="border border-slate-200 rounded-2xl p-4 bg-white space-y-4">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Notifikasi & Suara
                </h4>

                <div className="flex items-center justify-between py-2 border-b border-slate-100">
                  <div>
                    <div className="text-xs font-bold text-slate-900">Suara Lonceng Notifikasi</div>
                    <div className="text-[11px] text-slate-500">
                      Memutar nada chime saat terjadi penjualan atau restock dari perangkat lain
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSoundEnabled(!soundEnabled)}
                    className={`p-2 rounded-xl border text-xs font-bold transition-all ${
                      soundEnabled ? 'bg-rose-50 border-rose-300 text-rose-700' : 'bg-slate-100 border-slate-200 text-slate-500'
                    }`}
                  >
                    {soundEnabled ? 'Suara Aktif 🔔' : 'Mute Senyap 🔕'}
                  </button>
                </div>

                <div className="flex items-center justify-between py-2">
                  <div>
                    <div className="text-xs font-bold text-slate-900">Notifikasi Toast Mengambang</div>
                    <div className="text-[11px] text-slate-500">
                      Menampilkan kartu notifikasi mengambang saat ada update data stok real-time
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={enableStockNotifications}
                    onChange={(e) => setEnableStockNotifications(e.target.checked)}
                    className="w-4 h-4 text-rose-600 rounded focus:ring-rose-500"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  <span>Simpan Preferensi</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 4: AKSI KRITIS & PENGELOLAAN DATA */}
          {activeTab === 'danger' && (
            <div className="space-y-5">
              {actionSuccessNotice && (
                <div className="p-3.5 bg-emerald-50 border border-emerald-300 text-emerald-950 text-xs font-bold rounded-xl flex items-center gap-2 animate-in fade-in shadow-sm">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{actionSuccessNotice}</span>
                </div>
              )}

              {/* TOMBOL: HAPUS AKTIVITAS HARI INI */}
              <div className="p-5 rounded-2xl bg-amber-50/90 border border-amber-300 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-600 text-white flex items-center justify-center shrink-0 shadow-md">
                    <CalendarX className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-black text-amber-950 uppercase tracking-wide">
                        Hapus Aktivitas Hari Ini
                      </h4>
                      <span className="text-[10px] bg-amber-200 text-amber-900 px-2 py-0.5 rounded-full font-bold">
                        Hari Ini
                      </span>
                    </div>
                    <p className="text-xs text-amber-900/80 mt-1">
                      Menghapus seluruh rekaman log transaksi dan perubahan stok yang terjadi pada hari ini ({new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}). Stok fisik barang tetap aman dan tidak akan berubah.
                    </p>
                  </div>
                </div>

                {!showClearTodayConfirm ? (
                  <div className="flex justify-end pt-2">
                    <button
                      type="button"
                      onClick={() => setShowClearTodayConfirm(true)}
                      className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center gap-2"
                    >
                      <CalendarX className="w-4 h-4" />
                      <span>Hapus Aktivitas Hari Ini...</span>
                    </button>
                  </div>
                ) : (
                  <div className="p-4 bg-white rounded-xl border border-amber-300 space-y-3 animate-in fade-in">
                    <div className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-amber-600" />
                      <span>Konfirmasi Hapus Aktivitas Hari Ini: Masukkan PIN Keamanan</span>
                    </div>

                    {clearTodayError && (
                      <div className="text-xs text-rose-600 font-semibold bg-rose-50 p-2 rounded-lg">
                        {clearTodayError}
                      </div>
                    )}

                    <div className="flex gap-2">
                      <input
                        type="password"
                        placeholder="Ketik PIN Keamanan"
                        value={clearTodayPin}
                        onChange={(e) => setClearTodayPin(e.target.value)}
                        className="flex-1 px-3 py-2 text-xs border border-slate-300 rounded-xl font-mono focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowClearTodayConfirm(false)}
                        className="px-3 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-xl"
                      >
                        Batal
                      </button>
                      <button
                        type="button"
                        disabled={isClearingToday}
                        onClick={handleExecuteClearTodayLogs}
                        className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shrink-0"
                      >
                        {isClearingToday ? 'Menghapus...' : 'Ya, Hapus Aktivitas Hari Ini'}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* TOMBOL 1: HAPUS SEMUA PRODUK DARI KATALOG */}
              <div className="p-5 rounded-2xl bg-rose-50 border border-rose-300 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-rose-700 text-white flex items-center justify-center shrink-0 shadow-md">
                    <PackageX className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-black text-rose-950 uppercase tracking-wide">
                      Hapus Semua Produk dari Katalog
                    </h4>
                    <p className="text-xs text-rose-800/80 mt-1">
                      Menghapus seluruh model barang dan variannya secara permanen dari database. Katalog akan menjadi kosong bersih di semua perangkat.
                    </p>
                  </div>
                </div>

                {!showClearProductsConfirm ? (
                  <div className="flex justify-end pt-2">
                    <button
                      type="button"
                      onClick={() => setShowClearProductsConfirm(true)}
                      className="px-4 py-2 bg-rose-700 hover:bg-rose-800 text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center gap-2"
                    >
                      <PackageX className="w-4 h-4" />
                      <span>Hapus Semua Produk...</span>
                    </button>
                  </div>
                ) : (
                  <div className="p-4 bg-white rounded-xl border border-rose-300 space-y-3 animate-in fade-in">
                    <div className="text-xs font-bold text-rose-900 flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-rose-600" />
                      <span>Konfirmasi Hapus Semua Produk: Masukkan PIN Keamanan</span>
                    </div>

                    {clearProductsError && (
                      <div className="text-xs text-rose-600 font-semibold bg-rose-50 p-2 rounded-lg">
                        {clearProductsError}
                      </div>
                    )}

                    <div className="flex gap-2">
                      <input
                        type="password"
                        placeholder="Ketik PIN Keamanan"
                        value={clearProductsPin}
                        onChange={(e) => setClearProductsPin(e.target.value)}
                        className="flex-1 px-3 py-2 text-xs border border-slate-300 rounded-xl font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => setShowClearProductsConfirm(false)}
                        className="px-3 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-xl"
                      >
                        Batal
                      </button>
                      <button
                        type="button"
                        disabled={isClearingProducts}
                        onClick={handleExecuteClearProducts}
                        className="px-4 py-2 bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold rounded-xl shrink-0"
                      >
                        {isClearingProducts ? 'Menghapus...' : 'Ya, Hapus Semua Produk'}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* TOMBOL 2: KOSONGKAN SEMUA STOK (0 PCS) */}
              <div className="p-5 rounded-2xl bg-amber-50/70 border border-amber-300 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-600 text-white flex items-center justify-center shrink-0 shadow-md">
                    <Trash2 className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-black text-amber-950 uppercase tracking-wide">
                      Kosongkan Semua Stok (Reset ke 0 Pcs)
                    </h4>
                    <p className="text-xs text-amber-900/80 mt-1">
                      Produk tetap ada di katalog, namun seluruh jumlah stok fisik di semua varian diubah menjadi <strong>0 pcs</strong> secara serentak di semua perangkat.
                    </p>
                  </div>
                </div>

                {!showClearStockConfirm ? (
                  <div className="flex justify-end pt-2">
                    <button
                      type="button"
                      onClick={() => setShowClearStockConfirm(true)}
                      className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Kosongkan Semua Stok...</span>
                    </button>
                  </div>
                ) : (
                  <div className="p-4 bg-white rounded-xl border border-amber-300 space-y-3 animate-in fade-in">
                    <div className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-amber-600" />
                      <span>Konfirmasi Pengosongan Stok: Masukkan PIN Keamanan</span>
                    </div>

                    {clearStockError && (
                      <div className="text-xs text-rose-600 font-semibold bg-rose-50 p-2 rounded-lg">
                        {clearStockError}
                      </div>
                    )}

                    <div className="flex gap-2">
                      <input
                        type="password"
                        placeholder="Ketik PIN Keamanan"
                        value={clearStockPin}
                        onChange={(e) => setClearStockPin(e.target.value)}
                        className="flex-1 px-3 py-2 text-xs border border-slate-300 rounded-xl font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => setShowClearStockConfirm(false)}
                        className="px-3 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-xl"
                      >
                        Batal
                      </button>
                      <button
                        type="button"
                        disabled={isClearing}
                        onClick={handleExecuteClearStock}
                        className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shrink-0"
                      >
                        {isClearing ? 'Mengosongkan...' : 'Ya, Kosongkan Stok'}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* RESET PENGATURAN PABRIK */}
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Reset Pengaturan ke Bawaan</h4>
                    <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                      Mengosongkan kembali profil butik (nama toko, alamat, kontak) dan menyetel ulang preferensi sistem ke pengaturan awal.
                    </p>
                  </div>
                  {!showResetConfirm && (
                    <button
                      type="button"
                      onClick={() => setShowResetConfirm(true)}
                      className="px-4 py-2.5 bg-slate-800 hover:bg-slate-900 active:scale-95 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 shadow-sm"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                      <span>Reset Pengaturan</span>
                    </button>
                  )}
                </div>

                {resetSuccessMsg && (
                  <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-950 text-xs font-bold rounded-xl flex items-center gap-2 animate-in fade-in">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>✓ Seluruh profil dan pengaturan toko berhasil dikembalikan ke bawaan pabrik!</span>
                  </div>
                )}

                {showResetConfirm && (
                  <div className="p-4 bg-amber-50 rounded-xl border border-amber-300 space-y-3 animate-in fade-in">
                    <div className="text-xs font-bold text-amber-950 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>Konfirmasi: Kembalikan seluruh pengaturan ke bawaan pabrik?</span>
                    </div>
                    <p className="text-xs text-amber-900/80 leading-relaxed">
                      Profil butik (nama toko, cabang, alamat, no. telepon) dan preferensi alarm stok akan diatur ulang ke setelan awal. Data katalog dan jumlah stok fisik barang tetap aman dan tidak akan terhapus.
                    </p>
                    <div className="flex justify-end gap-2 pt-1">
                      <button
                        type="button"
                        disabled={isResetting}
                        onClick={() => setShowResetConfirm(false)}
                        className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200/70 rounded-xl transition-colors"
                      >
                        Batal
                      </button>
                      <button
                        type="button"
                        disabled={isResetting}
                        onClick={handleExecuteResetSettings}
                        className="px-5 py-2 bg-slate-900 hover:bg-black active:scale-95 text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center gap-2"
                      >
                        <RotateCcw className={`w-3.5 h-3.5 text-amber-400 ${isResetting ? 'animate-spin' : ''}`} />
                        <span>{isResetting ? 'Mereset...' : 'Ya, Reset Sekarang'}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* RESET DEMO DATA PRODUK */}
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Isi Ulang Data Contoh Barang</h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Mengisi ulang katalog dengan 7 produk barang demo jika katalog sedang kosong.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    resetDemoData();
                    setActionSuccessNotice('✓ Data barang contoh berhasil dimuat ulang ke katalog!');
                    setTimeout(() => setActionSuccessNotice(''), 4500);
                  }}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Muat Demo Data</span>
                </button>
              </div>

              {/* EKSPOR STOK CSV (EXCEL) */}
              <div className="p-5 rounded-2xl bg-amber-50/70 border border-amber-300 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-amber-950">Ekspor Rekap Stok (.CSV Excel)</h4>
                  <p className="text-xs text-amber-900/80 mt-0.5">
                    Unduh file CSV format kolom terstruktur (No, Nama Barang, Kategori, Warna, Ukuran, Stok Pcs, Lusin, Batas Min, Status Stok).
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => exportInventoryToCSV(products, settings.profile.storeName)}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1.5 shadow-sm shrink-0"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Unduh CSV</span>
                </button>
              </div>

              {/* CADANGKAN DATA BACKUP JSON */}
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Cadangkan Data (Backup File JSON)</h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Unduh seluruh data produk, varian, dan log transaksi sebagai cadangan offline.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleDownloadBackup}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Unduh JSON</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <div className="text-xs text-slate-400">
            Sistem Inventaris STZ Stok • Versi Real-Time 2.0
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
