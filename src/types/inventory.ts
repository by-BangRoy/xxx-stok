export interface ProductVariant {
  id: string;
  sku: string;
  size: string; // e.g. S, M, L, XL, XXL, All Size
  color: string; // e.g. Sage Green, Dusty Pink, Broken White, Black, Mocca
  colorHex?: string; // e.g. #9CAF88
  stock: number;
  minStock: number;
  price: number; // Harga Jual (IDR)
  costPrice?: number; // Modal / HPP (IDR)
  barcode?: string;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  category: string;
  description?: string;
  imageUrl: string;
  location: string; // e.g. "Rak Display A-1", "Gudang B", "Etalase Depan"
  variants: ProductVariant[];
  totalStock: number;
  createdAt: string;
  updatedAt: string;
  lastUpdatedBy?: {
    deviceId: string;
    deviceName: string;
    operatorName?: string;
  };
}

export type StockChangeType = 'sale' | 'restock' | 'adjustment' | 'return' | 'damage';

export interface StockLog {
  id: string;
  timestamp: string;
  productId: string;
  productName: string;
  variantId: string;
  variantDescription: string; // e.g. "L / Sage Green"
  changeType: StockChangeType;
  delta: number; // e.g. -1 for sale, +10 for restock
  previousStock: number;
  newStock: number;
  reason?: string;
  deviceId: string;
  deviceName: string;
  operatorName: string;
}

export interface RealtimeMessage {
  type: 
    | 'INIT' 
    | 'STOCK_UPDATED' 
    | 'PRODUCT_CREATED' 
    | 'PRODUCT_UPDATED' 
    | 'PRODUCT_DELETED' 
    | 'BATCH_RESTOCK' 
    | 'DEVICE_PRESENCE' 
    | 'SETTINGS_UPDATED'
    | 'ALL_STOCK_CLEARED'
    | 'ALL_PRODUCTS_DELETED'
    | 'TODAY_LOGS_CLEARED'
    | 'PING' 
    | 'PONG';
  payload?: any;
  meta?: {
    deviceId: string;
    deviceName: string;
    operatorName?: string;
    timestamp: string;
  };
}

export interface DeviceInfo {
  deviceId: string;
  deviceName: string;
  operatorName: string;
  ip?: string;
  lastSeen: string;
  userAgent?: string;
  connectedAt?: string;
}

export interface StoreProfile {
  storeName: string;
  storeBranch: string;
  tagline: string;
  phone: string;
  address: string;
  ownerName: string;
  socialMedia: string;
}

export interface AppSettings {
  securityPin: string; // PIN string (default "000000")
  pinRequired: boolean;
  autoLockMinutes: number; // 0 for disabled
  soundEnabled: boolean;
  defaultMinStockAlert: number;
  enableStockNotifications: boolean;
  profile: StoreProfile;
}

export const DEFAULT_SETTINGS: AppSettings = {
  securityPin: '000000',
  pinRequired: true,
  autoLockMinutes: 0,
  soundEnabled: true,
  defaultMinStockAlert: 3,
  enableStockNotifications: true,
  profile: {
    storeName: '',
    storeBranch: '',
    tagline: '',
    phone: '',
    address: '',
    ownerName: '',
    socialMedia: '',
  },
};


