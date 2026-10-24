import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { Product, StockLog, RealtimeMessage, DeviceInfo, StockChangeType, AppSettings, DEFAULT_SETTINGS } from '../types/inventory.ts';
import { playChime, isSoundEnabled, setSoundEnabled } from '../utils/audio.ts';

export interface RealtimeToast {
  id: string;
  title: string;
  message: string;
  type: 'sale' | 'restock' | 'warning' | 'danger' | 'info';
  timestamp: string;
  deviceName: string;
  operatorName: string;
  isRemote: boolean;
  productName: string;
  delta?: number;
  newStock?: number;
}

interface InventoryContextType {
  products: Product[];
  stockLogs: StockLog[];
  connectedDevicesCount: number;
  connectedDevices: DeviceInfo[];
  connectionStatus: 'connected' | 'connecting' | 'disconnected';
  activeToasts: RealtimeToast[];
  currentDevice: {
    deviceId: string;
    deviceName: string;
    operatorName: string;
  };
  soundOn: boolean;
  toggleSound: () => void;
  updateDeviceProfile: (deviceName: string, operatorName: string) => void;
  // Auth & PIN
  isAuthenticated: boolean;
  unlockWithPin: (pin: string) => Promise<{ success: boolean; error?: string }>;
  lockApp: () => void;
  // Settings & Store Profile
  settings: AppSettings;
  updateSettings: (newSettings: Partial<AppSettings>) => Promise<boolean>;
  resetSettings: () => Promise<boolean>;
  clearAllStock: (pin: string) => Promise<{ success: boolean; error?: string }>;
  clearAllProducts: (pin: string) => Promise<{ success: boolean; error?: string }>;
  clearTodayLogs: (pin: string) => Promise<{ success: boolean; error?: string; count?: number }>;
  // Stock Mutations
  adjustStock: (
    productId: string,
    variantId: string,
    delta: number,
    changeType?: StockChangeType,
    reason?: string
  ) => Promise<boolean>;
  batchAdjustStock: (
    items: Array<{
      productId: string;
      variantId: string;
      delta: number;
      changeType?: StockChangeType;
      reason?: string;
    }>
  ) => Promise<boolean>;
  createProduct: (productData: Partial<Product>) => Promise<boolean>;
  updateProduct: (id: string, productData: Partial<Product>) => Promise<boolean>;
  deleteProduct: (id: string) => Promise<boolean>;
  dismissToast: (id: string) => void;
  clearAllToasts: () => void;
  resetDemoData: () => Promise<void>;
  simulateRemoteChange: (scenario?: 'sale' | 'restock' | 'critical') => Promise<void>;
  isRefreshing: boolean;
  refreshData: (manual?: boolean) => Promise<void>;
}

const InventoryContext = createContext<InventoryContextType | null>(null);

function getInitialDeviceProfile() {
  if (typeof window === 'undefined') {
    return { deviceId: 'dev-srv', deviceName: 'Browser Web', operatorName: 'Staf' };
  }

  let deviceId = localStorage.getItem('stz_device_id');
  if (!deviceId) {
    deviceId = `dev-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
    localStorage.setItem('stz_device_id', deviceId);
  }

  let deviceName = localStorage.getItem('stz_device_name');
  if (!deviceName) {
    // Determine friendly device name based on screen size or user agent
    const isMobile = /Mobi|Android|iPhone/i.test(navigator.userAgent);
    const isTablet = /iPad|Tablet/i.test(navigator.userAgent) || (window.innerWidth >= 600 && window.innerWidth <= 1024);
    if (isTablet) {
      deviceName = 'Tablet Kasir Toko';
    } else if (isMobile) {
      deviceName = 'Smartphone Kasir / Gudang';
    } else {
      deviceName = 'Komputer Kasir Utama';
    }
    localStorage.setItem('stz_device_name', deviceName);
  }

  let operatorName = localStorage.getItem('stz_operator_name');
  if (!operatorName) {
    operatorName = 'Kasir 1';
    localStorage.setItem('stz_operator_name', operatorName);
  }

  return { deviceId, deviceName, operatorName };
}

export const InventoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [stockLogs, setStockLogs] = useState<StockLog[]>([]);
  const [settings, setSettings] = useState<AppSettings>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('stz_cached_settings');
      if (saved) {
        try {
          return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
        } catch (e) {}
      }
    }
    return DEFAULT_SETTINGS;
  });

  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return sessionStorage.getItem('stz_unlocked') === 'true';
  });

  const [connectedDevicesCount, setConnectedDevicesCount] = useState<number>(1);
  const [connectedDevices, setConnectedDevices] = useState<DeviceInfo[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'connecting' | 'disconnected'>('connecting');
  const [activeToasts, setActiveToasts] = useState<RealtimeToast[]>([]);
  const [currentDevice, setCurrentDevice] = useState(getInitialDeviceProfile);
  const currentDeviceRef = useRef(currentDevice);
  useEffect(() => {
    currentDeviceRef.current = currentDevice;
  }, [currentDevice]);
  const [soundOn, setSoundOn] = useState(isSoundEnabled);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<any>(null);
  const pingIntervalRef = useRef<any>(null);
  const reconnectAttemptsRef = useRef<number>(0);

  const toggleSound = () => {
    const next = !soundOn;
    setSoundOn(next);
    setSoundEnabled(next);
    if (next) {
      playChime('sale');
    }
  };

  const updateDeviceProfile = (deviceName: string, operatorName: string) => {
    const updated = { ...currentDevice, deviceName, operatorName };
    setCurrentDevice(updated);
    localStorage.setItem('stz_device_name', deviceName);
    localStorage.setItem('stz_operator_name', operatorName);

    // Broadcast updated device profile over WebSocket
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(
        JSON.stringify({
          type: 'DEVICE_PRESENCE',
          meta: {
            deviceId: updated.deviceId,
            deviceName: updated.deviceName,
            operatorName: updated.operatorName,
            timestamp: new Date().toISOString(),
          },
        })
      );
    }
  };

  // Auth & PIN functions
  const unlockWithPin = async (inputPin: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch('/api/auth/verify-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: inputPin }),
      });
      const data = await res.json();
      if (data.success) {
        setIsAuthenticated(true);
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('stz_unlocked', 'true');
        }
        playChime('sale');
        return { success: true };
      } else {
        playChime('alert');
        return { success: false, error: 'PIN yang Anda masukkan salah' };
      }
    } catch (err) {
      // Local fallback
      if (inputPin === settings.securityPin) {
        setIsAuthenticated(true);
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('stz_unlocked', 'true');
        }
        playChime('sale');
        return { success: true };
      }
      return { success: false, error: 'PIN tidak sesuai' };
    }
  };

  const lockApp = () => {
    setIsAuthenticated(false);
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('stz_unlocked');
    }
    playChime('warning');
  };

  const dismissToast = (id: string) => {
    setActiveToasts(prev => prev.filter(t => t.id !== id));
  };

  const clearAllToasts = () => {
    setActiveToasts([]);
  };

  const addNotificationToast = useCallback((toast: Omit<RealtimeToast, 'id' | 'timestamp'>) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const newToast: RealtimeToast = {
      ...toast,
      id,
      timestamp: new Date().toISOString(),
    };

    setActiveToasts(prev => [newToast, ...prev.slice(0, 4)]); // Keep max 5 visible toasts

    // Auto dismiss after 6 seconds
    setTimeout(() => {
      setActiveToasts(prev => prev.filter(t => t.id !== id));
    }, 6000);
  }, []);

  // Fetch full inventory, logs & settings via REST
  const refreshData = useCallback(async (manual = false) => {
    if (manual) setIsRefreshing(true);
    try {
      const [resInv, resLogs, resSettings, resDevices] = await Promise.all([
        fetch('/api/inventory'),
        fetch('/api/logs?limit=50'),
        fetch('/api/settings'),
        fetch('/api/devices').catch(() => null),
      ]);
      if (resInv.ok) {
        const invData = await resInv.json();
        const incoming: Product[] = invData.products || [];
        setProducts(prev => {
          // Check if any product counts or variant stocks changed
          const changed =
            prev.length !== incoming.length ||
            prev.some((p) => {
              const inc = incoming.find((item) => item.id === p.id);
              if (!inc) return true;
              if (inc.totalStock !== p.totalStock) return true;
              return inc.variants.some((iv, idx) => iv.stock !== p.variants[idx]?.stock);
            });
          if (changed || prev.length === 0) {
            return incoming.map((p) => ({
              ...p,
              variants: p.variants.map((v) => ({ ...v })),
            }));
          }
          return prev;
        });
      }
      if (resLogs.ok) {
        const logsData = await resLogs.json();
        setStockLogs(logsData.logs || []);
      }
      if (resSettings.ok) {
        const settingsData = await resSettings.json();
        if (settingsData.settings) {
          setSettings(settingsData.settings);
          if (typeof window !== 'undefined') {
            localStorage.setItem('stz_cached_settings', JSON.stringify(settingsData.settings));
          }
        }
      }
      if (resDevices && resDevices.ok) {
        const devicesData = await resDevices.json();
        if (devicesData && Array.isArray(devicesData.devices)) {
          setConnectedDevices(devicesData.devices);
          if (typeof devicesData.count === 'number') {
            setConnectedDevicesCount(devicesData.count);
          }
        }
      }
      if (manual) {
        playChime('sale');
      }
    } catch (err) {
      console.error('Failed to refresh data from server:', err);
    } finally {
      if (manual) {
        setTimeout(() => setIsRefreshing(false), 500);
      }
    }
  }, []);

  // WebSocket Connection Logic
  const connectWebSocket = useCallback(() => {
    if (typeof window === 'undefined') return;

    if (socketRef.current) {
      socketRef.current.close();
    }

    setConnectionStatus('connecting');

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const wsUrl = `${protocol}//${host}/ws`;

    try {
      const ws = new WebSocket(wsUrl);
      socketRef.current = ws;

      ws.onopen = () => {
        setConnectionStatus('connected');
        reconnectAttemptsRef.current = 0;

        // Send identity to server
        ws.send(
          JSON.stringify({
            type: 'DEVICE_PRESENCE',
            meta: {
              deviceId: currentDeviceRef.current.deviceId,
              deviceName: currentDeviceRef.current.deviceName,
              operatorName: currentDeviceRef.current.operatorName,
              timestamp: new Date().toISOString(),
            },
          })
        );

        // Start ping heartbeat
        if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
        pingIntervalRef.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'PING' }));
          }
        }, 20000);
      };

      ws.onmessage = (event) => {
        try {
          const msg: RealtimeMessage = JSON.parse(event.data);
          handleRealtimeMessage(msg);
        } catch (err) {
          console.error('Error handling WebSocket message:', err);
        }
      };

      ws.onclose = () => {
        setConnectionStatus('disconnected');
        if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);

        // Auto-reconnect with exponential backoff (capped at 5s)
        const delay = Math.min(1000 * Math.pow(1.5, reconnectAttemptsRef.current), 5000);
        reconnectAttemptsRef.current += 1;
        reconnectTimeoutRef.current = setTimeout(() => {
          connectWebSocket();
        }, delay);
      };

      ws.onerror = (err) => {
        console.warn('WebSocket connection error:', err);
        ws.close();
      };
    } catch (err) {
      console.error('Failed to construct WebSocket:', err);
      setConnectionStatus('disconnected');
    }
  }, []);

  // Handle all real-time event updates
  const handleRealtimeMessage = useCallback((msg: RealtimeMessage) => {
    const isRemote = Boolean(msg.meta && msg.meta.deviceId !== currentDeviceRef.current.deviceId);
    const senderDevice = msg.meta?.deviceName || 'Perangkat Lain';
    const senderOperator = msg.meta?.operatorName || 'Staf';

    switch (msg.type) {
      case 'INIT': {
        if (msg.payload?.products) {
          setProducts(msg.payload.products);
        }
        if (msg.payload?.logs) {
          setStockLogs(msg.payload.logs);
        }
        if (msg.payload?.settings) {
          setSettings(msg.payload.settings);
          if (typeof window !== 'undefined') {
            localStorage.setItem('stz_cached_settings', JSON.stringify(msg.payload.settings));
          }
        }
        break;
      }

      case 'DEVICE_PRESENCE': {
        if (msg.payload?.count !== undefined) {
          setConnectedDevicesCount(msg.payload.count);
        }
        if (msg.payload?.devices) {
          setConnectedDevices(msg.payload.devices);
        }
        break;
      }

      case 'SETTINGS_UPDATED': {
        if (msg.payload?.settings) {
          setSettings(msg.payload.settings);
          if (typeof window !== 'undefined') {
            localStorage.setItem('stz_cached_settings', JSON.stringify(msg.payload.settings));
          }
        }
        playChime('adjustment');
        addNotificationToast({
          title: `⚙️ Pengaturan Diperbarui (${senderDevice})`,
          message: `Profil butik & pengaturan sistem telah disinkronkan oleh ${senderOperator}.`,
          type: 'info',
          deviceName: senderDevice,
          operatorName: senderOperator,
          isRemote,
          productName: 'Pengaturan Sistem',
        });
        break;
      }

      case 'ALL_STOCK_CLEARED': {
        if (msg.payload?.products) {
          setProducts(msg.payload.products);
        }
        if (msg.payload?.log) {
          setStockLogs(prev => [msg.payload.log, ...prev]);
        }
        playChime('alert');
        addNotificationToast({
          title: `⛔ PERINGATAN: SEMUA STOK DIKOSONGKAN!`,
          message: `Seluruh stok katalog diatur menjadi 0 pcs oleh ${senderDevice} (${senderOperator}).`,
          type: 'danger',
          deviceName: senderDevice,
          operatorName: senderOperator,
          isRemote,
          productName: 'Semua Busana',
        });
        break;
      }

      case 'ALL_PRODUCTS_DELETED': {
        setProducts([]);
        if (msg.payload?.log) {
          setStockLogs(prev => [msg.payload.log, ...prev]);
        }
        playChime('alert');
        addNotificationToast({
          title: `🗑️ SEMUA PRODUK TELAH DIHAPUS!`,
          message: `Seluruh produk di katalog telah dihapus oleh ${senderDevice} (${senderOperator}).`,
          type: 'danger',
          deviceName: senderDevice,
          operatorName: senderOperator,
          isRemote,
          productName: 'Semua Produk',
        });
        break;
      }

      case 'TODAY_LOGS_CLEARED': {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const todayDateStr = `${year}-${month}-${day}`;

        setStockLogs(prev => prev.filter(log => {
          try {
            const d = new Date(log.timestamp);
            const lYear = d.getFullYear();
            const lMonth = String(d.getMonth() + 1).padStart(2, '0');
            const lDay = String(d.getDate()).padStart(2, '0');
            return `${lYear}-${lMonth}-${lDay}` !== todayDateStr;
          } catch {
            return true;
          }
        }));
        playChime('adjustment');
        addNotificationToast({
          title: `🧹 Aktivitas Hari Ini Dihapus (${senderDevice})`,
          message: `Riwayat perubahan stok hari ini telah dibersihkan oleh ${senderOperator}.`,
          type: 'info',
          deviceName: senderDevice,
          operatorName: senderOperator,
          isRemote,
          productName: 'Riwayat Log Hari Ini',
        });
        break;
      }

      case 'STOCK_UPDATED': {
        const { product, log, isLowStock, isOutOfStock } = msg.payload || {};
        if (product) {
          // Deep clone to guarantee immediate re-rendering in all table columns and card components
          const clonedProduct: Product = {
            ...product,
            variants: product.variants.map((v: any) => ({ ...v })),
          };
          setProducts(prev => {
            const index = prev.findIndex(p => p.id === product.id);
            if (index === -1) return [clonedProduct, ...prev];
            const next = [...prev];
            next[index] = clonedProduct;
            return next;
          });
        }
        if (log) {
          setStockLogs(prev => [log, ...prev.filter(l => l.id !== log.id).slice(0, 100)]);
        }

        const isAnyOut = Number(product?.totalStock) === 0 || product?.variants?.some((v: any) => Number(v.stock) <= 0) || Boolean(isOutOfStock);
        const isAnyLow = (product?.variants?.some((v: any) => Number(v.stock) <= Number(v.minStock) && Number(v.stock) > 0) && !isAnyOut) || Boolean(isLowStock);

        // Notification and sound
        if (isAnyOut) {
          playChime('alert');
          addNotificationToast({
            title: '⛔ PERINGATAN: STOK HABIS (0 PCS)!',
            message: `${log?.productName || product?.name} (${log?.variantDescription || 'Stok 0'}) habis! Diperbarui oleh ${senderDevice} (${senderOperator}).`,
            type: 'danger',
            deviceName: senderDevice,
            operatorName: senderOperator,
            isRemote,
            productName: log?.productName || product?.name || 'Barang',
            delta: log?.delta,
            newStock: 0,
          });
        } else if (isAnyLow) {
          playChime('warning');
          addNotificationToast({
            title: '⚠️ PERINGATAN: STOK MENIPIS',
            message: `${log?.productName || product?.name} (${log?.variantDescription || 'Varian'}) tersisa ${log?.newStock ?? 'sedikit'} pcs (di bawah batas minimum).`,
            type: 'warning',
            deviceName: senderDevice,
            operatorName: senderOperator,
            isRemote,
            productName: log?.productName || product?.name || 'Barang',
            delta: log?.delta,
            newStock: log?.newStock,
          });
        } else if (log?.changeType === 'sale') {
          playChime('sale');
          addNotificationToast({
            title: isRemote ? `🔔 Penjualan di ${senderDevice}` : '✓ Penjualan Dicatat',
            message: `${log?.productName} (${log?.variantDescription}): terjual ${Math.abs(log?.delta || 1)} pcs. Sisa stok: ${log?.newStock} pcs.`,
            type: 'sale',
            deviceName: senderDevice,
            operatorName: senderOperator,
            isRemote,
            productName: log?.productName || 'Barang',
            delta: log?.delta,
            newStock: log?.newStock,
          });
        } else if (log?.changeType === 'restock') {
          playChime('restock');
          addNotificationToast({
            title: isRemote ? `📦 Restock Baru dari ${senderDevice}` : '✓ Restock Berhasil',
            message: `${log?.productName} (${log?.variantDescription}): bertambah +${log?.delta} pcs. Total stok: ${log?.newStock} pcs.`,
            type: 'restock',
            deviceName: senderDevice,
            operatorName: senderOperator,
            isRemote,
            productName: log?.productName || 'Barang',
            delta: log?.delta,
            newStock: log?.newStock,
          });
        } else if (log?.changeType === 'damage') {
          playChime('warning');
          addNotificationToast({
            title: isRemote ? `⚠️ Barang Rusak dari ${senderDevice}` : '⚠️ Barang Rusak / Reject Dicatat',
            message: `${log?.productName} (${log?.variantDescription}): -${Math.abs(log?.delta || 1)} pcs (${log?.reason || 'Cacat/Rusak'}). Sisa stok: ${log?.newStock} pcs.`,
            type: 'danger',
            deviceName: senderDevice,
            operatorName: senderOperator,
            isRemote,
            productName: log?.productName || 'Barang',
            delta: log?.delta,
            newStock: log?.newStock,
          });
        } else {
          playChime('adjustment');
          addNotificationToast({
            title: isRemote ? `🔄 Koreksi Stok dari ${senderDevice}` : '✓ Stok Diperbarui',
            message: `${log?.productName} (${log?.variantDescription}): ${log?.reason || 'Penyesuaian stok'}. Sisa stok: ${log?.newStock} pcs.`,
            type: 'info',
            deviceName: senderDevice,
            operatorName: senderOperator,
            isRemote,
            productName: log?.productName || 'Barang',
            delta: log?.delta,
            newStock: log?.newStock,
          });
        }
        break;
      }

      case 'BATCH_RESTOCK': {
        const { products: updatedProducts, logs: createdLogs } = msg.payload || {};
        if (Array.isArray(updatedProducts)) {
          setProducts(prev => {
            const map = new Map(prev.map(p => [p.id, p]));
            for (const p of updatedProducts) {
              map.set(p.id, p);
            }
            return Array.from(map.values());
          });
        }
        if (Array.isArray(createdLogs)) {
          setStockLogs(prev => [...createdLogs, ...prev].slice(0, 100));
        }

        playChime('restock');
        addNotificationToast({
          title: `📦 Update Batch / Opname (${senderDevice})`,
          message: `${updatedProducts?.length || 0} produk berhasil disinkronkan secara massal.`,
          type: 'restock',
          deviceName: senderDevice,
          operatorName: senderOperator,
          isRemote,
          productName: 'Multi-Produk',
        });
        break;
      }

      case 'PRODUCT_CREATED': {
        const { product, log } = msg.payload || {};
        if (product) {
          setProducts(prev => [product, ...prev.filter(p => p.id !== product.id)]);
        }
        if (log) {
          setStockLogs(prev => [log, ...prev]);
        }
        playChime('restock');
        addNotificationToast({
          title: `✨ Produk Baru Ditambahkan (${senderDevice})`,
          message: `"${product?.name}" dengan ${product?.variants?.length} varian berhasil masuk katalog.`,
          type: 'info',
          deviceName: senderDevice,
          operatorName: senderOperator,
          isRemote,
          productName: product?.name || 'Produk Baru',
        });
        break;
      }

      case 'PRODUCT_UPDATED': {
        const { product } = msg.payload || {};
        if (product) {
          setProducts(prev => prev.map(p => (p.id === product.id ? product : p)));
        }
        break;
      }

      case 'PRODUCT_DELETED': {
        const { productId, productName } = msg.payload || {};
        if (productId) {
          setProducts(prev => prev.filter(p => p.id !== productId));
        }
        addNotificationToast({
          title: `🗑️ Produk Dihapus (${senderDevice})`,
          message: `"${productName || 'Produk'}" telah dihapus dari katalog stok.`,
          type: 'warning',
          deviceName: senderDevice,
          operatorName: senderOperator,
          isRemote,
          productName: productName || 'Produk Dihapus',
        });
        break;
      }

      case 'PONG':
        // Heartbeat ACK
        break;

      default:
        break;
    }
  }, [addNotificationToast]);

  // Initial load, WebSocket connection & resilient multi-device sync
  useEffect(() => {
    refreshData();
    connectWebSocket();

    // BroadcastChannel for instant zero-latency cross-tab sync
    let bc: BroadcastChannel | null = null;
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        bc = new BroadcastChannel('stz_inventory_channel');
        bc.onmessage = (event) => {
          const msg = event.data;
          if (msg && msg.type) {
            handleRealtimeMessage(msg);
          }
        };
      } catch (e) {}
    }

    // Fallback sync polling every 1.8s ensures data stays 100% synchronized across all devices
    const pollInterval = setInterval(() => {
      refreshData();
    }, 1800);

    // Auto-reconnect & resync immediately when user wakes up screen, unlocks phone, or refocuses tab
    const handleWakeOrFocus = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        refreshData();
        if (
          !socketRef.current ||
          socketRef.current.readyState === WebSocket.CLOSED ||
          socketRef.current.readyState === WebSocket.CLOSING
        ) {
          connectWebSocket();
        } else if (socketRef.current.readyState === WebSocket.OPEN) {
          try {
            socketRef.current.send(JSON.stringify({ type: 'PING' }));
          } catch {
            connectWebSocket();
          }
        }
      }
    };

    document.addEventListener('visibilitychange', handleWakeOrFocus);
    window.addEventListener('focus', handleWakeOrFocus);
    window.addEventListener('online', handleWakeOrFocus);

    return () => {
      if (bc) bc.close();
      clearInterval(pollInterval);
      document.removeEventListener('visibilitychange', handleWakeOrFocus);
      window.removeEventListener('focus', handleWakeOrFocus);
      window.removeEventListener('online', handleWakeOrFocus);
      if (socketRef.current) socketRef.current.close();
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
    };
  }, [connectWebSocket, refreshData]);

  // Settings Actions
  const updateSettings = async (newSettings: Partial<AppSettings>): Promise<boolean> => {
    try {
      const merged = {
        ...settings,
        ...newSettings,
        profile: {
          ...settings.profile,
          ...(newSettings.profile || {}),
        },
      };
      setSettings(merged);
      if (typeof window !== 'undefined') {
        localStorage.setItem('stz_cached_settings', JSON.stringify(merged));
      }

      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          settings: merged,
          deviceId: currentDevice.deviceId,
          deviceName: currentDevice.deviceName,
          operatorName: currentDevice.operatorName,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.settings) {
          setSettings(data.settings);
          if (typeof window !== 'undefined') {
            localStorage.setItem('stz_cached_settings', JSON.stringify(data.settings));
          }
        }
        return true;
      }
      return false;
    } catch (err) {
      console.error('Error updating settings:', err);
      return false;
    }
  };

  const resetSettings = async (): Promise<boolean> => {
    try {
      const res = await fetch('/api/settings/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deviceId: currentDevice.deviceId,
          deviceName: currentDevice.deviceName,
          operatorName: currentDevice.operatorName,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.settings) {
          setSettings(data.settings);
          if (typeof window !== 'undefined') {
            localStorage.setItem('stz_cached_settings', JSON.stringify(data.settings));
          }
        }
        return true;
      }
      return false;
    } catch (err) {
      console.error('Error resetting settings:', err);
      return false;
    }
  };

  // Kosongkan semua stok
  const clearAllStock = async (pin: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch('/api/stock/clear-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pin,
          deviceId: currentDevice.deviceId,
          deviceName: currentDevice.deviceName,
          operatorName: currentDevice.operatorName,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Gagal mengosongkan stok' };
      }

      if (data.products) {
        setProducts(data.products);
      }
      if (data.log) {
        setStockLogs(prev => [data.log, ...prev]);
      }
      return { success: true };
    } catch (err: any) {
      console.error('Error clearing all stock:', err);
      return { success: false, error: err?.message || 'Koneksi gagal saat mengosongkan stok' };
    }
  };

  // Hapus semua produk dari katalog
  const clearAllProducts = async (pin: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch('/api/products/clear-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pin,
          deviceId: currentDevice.deviceId,
          deviceName: currentDevice.deviceName,
          operatorName: currentDevice.operatorName,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Gagal menghapus seluruh produk' };
      }

      setProducts([]);
      if (data.log) {
        setStockLogs(prev => [data.log, ...prev]);
      }
      return { success: true };
    } catch (err: any) {
      console.error('Error clearing all products:', err);
      return { success: false, error: err?.message || 'Koneksi gagal saat menghapus produk' };
    }
  };

  // Hapus aktivitas hari ini
  const clearTodayLogs = async (pin: string): Promise<{ success: boolean; error?: string; count?: number }> => {
    try {
      const res = await fetch('/api/logs/clear-today', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pin,
          deviceId: currentDevice.deviceId,
          deviceName: currentDevice.deviceName,
          operatorName: currentDevice.operatorName,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Gagal menghapus aktivitas hari ini' };
      }

      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const todayDateStr = `${year}-${month}-${day}`;

      setStockLogs(prev => prev.filter(log => {
        try {
          const d = new Date(log.timestamp);
          const lYear = d.getFullYear();
          const lMonth = String(d.getMonth() + 1).padStart(2, '0');
          const lDay = String(d.getDate()).padStart(2, '0');
          return `${lYear}-${lMonth}-${lDay}` !== todayDateStr;
        } catch {
          return true;
        }
      }));

      return { success: true, count: data.deletedCount };
    } catch (err: any) {
      console.error('Error clearing today logs:', err);
      return { success: false, error: err?.message || 'Koneksi gagal saat menghapus aktivitas' };
    }
  };

  // Stock Mutations Actions
  const adjustStock = async (
    productId: string,
    variantId: string,
    delta: number,
    changeType: StockChangeType = 'adjustment',
    reason: string = ''
  ): Promise<boolean> => {
    try {
      const response = await fetch('/api/stock/adjust', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId,
          variantId,
          delta,
          changeType,
          reason,
          deviceId: currentDevice.deviceId,
          deviceName: currentDevice.deviceName,
          operatorName: currentDevice.operatorName,
        }),
      });

      if (!response.ok) {
        throw new Error('Gagal memperbarui stok di server');
      }

      const data = await response.json();
      if (data.product) {
        const clonedProduct: Product = {
          ...data.product,
          variants: data.product.variants.map((v: any) => ({ ...v })),
        };
        setProducts(prev => prev.map(p => (p.id === clonedProduct.id ? clonedProduct : p)));

        if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
          try {
            const bc = new BroadcastChannel('stz_inventory_channel');
            bc.postMessage({
              type: 'STOCK_UPDATED',
              payload: {
                product: clonedProduct,
                log: data.log,
                isLowStock: clonedProduct.variants.some((v: any) => v.stock <= v.minStock && v.stock > 0),
                isOutOfStock: clonedProduct.totalStock === 0,
              },
              meta: {
                deviceId: currentDevice.deviceId,
                deviceName: currentDevice.deviceName,
                operatorName: currentDevice.operatorName,
                timestamp: new Date().toISOString(),
              },
            });
            bc.close();
          } catch (e) {}
        }
      }
      if (data.log) {
        setStockLogs(prev => [data.log, ...prev.filter(l => l.id !== data.log.id)]);
      }
      return true;
    } catch (err) {
      console.error('Error adjusting stock:', err);
      return false;
    }
  };

  const batchAdjustStock = async (
    items: Array<{
      productId: string;
      variantId: string;
      delta: number;
      changeType?: StockChangeType;
      reason?: string;
    }>
  ): Promise<boolean> => {
    try {
      const response = await fetch('/api/stock/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items,
          deviceId: currentDevice.deviceId,
          deviceName: currentDevice.deviceName,
          operatorName: currentDevice.operatorName,
        }),
      });
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data.affectedProducts)) {
          setProducts(prev => {
            const map = new Map(prev.map(p => [p.id, p]));
            for (const p of data.affectedProducts) {
              map.set(p.id, p);
            }
            return Array.from(map.values());
          });
        }
        if (Array.isArray(data.logs)) {
          setStockLogs(prev => [...data.logs, ...prev].slice(0, 100));
        }
        return true;
      }
      return false;
    } catch (err) {
      console.error('Error batch adjusting stock:', err);
      return false;
    }
  };

  const createProduct = async (productData: Partial<Product>): Promise<boolean> => {
    try {
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...productData,
          deviceId: currentDevice.deviceId,
          deviceName: currentDevice.deviceName,
          operatorName: currentDevice.operatorName,
        }),
      });
      if (response.ok) {
        const data = await response.json();
        if (data.product) {
          setProducts(prev => [data.product, ...prev.filter(p => p.id !== data.product.id)]);
        }
        if (data.log) {
          setStockLogs(prev => [data.log, ...prev]);
        }
        return true;
      }
      return false;
    } catch (err) {
      console.error('Error creating product:', err);
      return false;
    }
  };

  const updateProduct = async (id: string, productData: Partial<Product>): Promise<boolean> => {
    try {
      const response = await fetch(`/api/products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...productData,
          deviceId: currentDevice.deviceId,
          deviceName: currentDevice.deviceName,
          operatorName: currentDevice.operatorName,
        }),
      });
      if (response.ok) {
        const data = await response.json();
        if (data.product) {
          setProducts(prev => prev.map(p => (p.id === data.product.id ? data.product : p)));
        }
        return true;
      }
      return false;
    } catch (err) {
      console.error('Error updating product:', err);
      return false;
    }
  };

  const deleteProduct = async (id: string): Promise<boolean> => {
    try {
      const params = new URLSearchParams({
        deviceId: currentDevice.deviceId,
        deviceName: currentDevice.deviceName,
        operatorName: currentDevice.operatorName,
      });
      const response = await fetch(`/api/products/${id}?${params.toString()}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        setProducts(prev => prev.filter(p => p.id !== id));
        return true;
      }
      return false;
    } catch (err) {
      console.error('Error deleting product:', err);
      return false;
    }
  };

  const resetDemoData = async () => {
    try {
      await fetch('/api/reset-demo', { method: 'POST' });
      await refreshData();
    } catch (err) {
      console.error('Error resetting demo data:', err);
    }
  };

  // Helper function to simulate a change from a separate external device (e.g. "Kasir 2 - Lantai 2" or "Gudang Konveksi")
  const simulateRemoteChange = async (scenario: 'sale' | 'restock' | 'critical' = 'sale') => {
    if (products.length === 0) return;

    if (scenario === 'sale') {
      // Find a product with stock
      const product = products.find(p => p.variants.some(v => v.stock > 0)) || products[0];
      const variant = product.variants.find(v => v.stock > 0) || product.variants[0];
      await fetch('/api/stock/adjust', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: product.id,
          variantId: variant.id,
          delta: -1,
          changeType: 'sale',
          reason: 'Transaksi Kasir 2 (Lantai 2)',
          deviceId: 'simulated-device-cashier-2',
          deviceName: 'Tablet Kasir 2 (Lt. 2)',
          operatorName: 'Dinda (Kasir 2)',
        }),
      });
    } else if (scenario === 'restock') {
      const product = products[0];
      const variant = product.variants[0];
      await fetch('/api/stock/adjust', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: product.id,
          variantId: variant.id,
          delta: 10,
          changeType: 'restock',
          reason: 'Penerimaan Ekspedisi Bahan Konveksi',
          deviceId: 'simulated-device-gudang-pusat',
          deviceName: 'Scanner Gudang Ekspedisi',
          operatorName: 'Budi (Gudang)',
        }),
      });
    } else {
      // Critical: drop stock to 1 to trigger low stock warning
      const product = products[1] || products[0];
      const variant = product.variants[0];
      const targetDelta = 1 - variant.stock;
      await fetch('/api/stock/adjust', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: product.id,
          variantId: variant.id,
          delta: targetDelta,
          changeType: 'sale',
          reason: 'Pembelian Grosir Reseller (Sisa 1 pcs)',
          deviceId: 'simulated-device-admin-olshop',
          deviceName: 'Admin WhatsApp / Shopee',
          operatorName: 'Maya (Admin Online)',
        }),
      });
    }
  };

  return (
    <InventoryContext.Provider
      value={{
        products,
        stockLogs,
        connectedDevicesCount,
        connectedDevices,
        connectionStatus,
        activeToasts,
        currentDevice,
        soundOn,
        toggleSound,
        updateDeviceProfile,
        isAuthenticated,
        unlockWithPin,
        lockApp,
        settings,
        updateSettings,
        resetSettings,
        clearAllStock,
        clearAllProducts,
        clearTodayLogs,
        adjustStock,
        batchAdjustStock,
        createProduct,
        updateProduct,
        deleteProduct,
        dismissToast,
        clearAllToasts,
        resetDemoData,
        simulateRemoteChange,
        isRefreshing,
        refreshData,
      }}
    >
      {children}
    </InventoryContext.Provider>
  );
};

export const useInventory = () => {
  const context = useContext(InventoryContext);
  if (!context) {
    throw new Error('useInventory must be used within an InventoryProvider');
  }
  return context;
};
