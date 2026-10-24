import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  onSnapshot, 
  deleteDoc, 
  writeBatch,
  query,
  orderBy,
  limit,
  serverTimestamp
} from 'firebase/firestore';
import { getAuth, signInAnonymously } from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';
import { Product, StockLog, AppSettings } from '../types/inventory.ts';

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const db = firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== '(default)'
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

export const auth = getAuth(app);

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Authenticate gracefully if provider is enabled
export async function ensureFirebaseAuth(): Promise<void> {
  if (!auth.currentUser) {
    try {
      await signInAnonymously(auth);
    } catch {
      // Anonymous provider may not be enabled in console, allow store devices to continue
    }
  }
}

// Collections references
export const PRODUCTS_COLLECTION = 'products';
export const LOGS_COLLECTION = 'stockLogs';
export const SETTINGS_COLLECTION = 'settings';
export const SETTINGS_DOC_ID = 'current';

/**
 * Save or update a product in Firestore
 */
export async function syncProductToFirestore(product: Product): Promise<void> {
  const path = `${PRODUCTS_COLLECTION}/${product.id}`;
  try {
    await ensureFirebaseAuth();
    const productRef = doc(db, PRODUCTS_COLLECTION, product.id);
    await setDoc(productRef, product, { merge: true });
  } catch (err: any) {
    if (err?.code === 'permission-denied' || (err instanceof Error && err.message.includes('insufficient permissions'))) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
    console.error('[Firebase] Failed to sync product:', err);
  }
}

/**
 * Delete a product from Firestore
 */
export async function deleteProductFromFirestore(productId: string): Promise<void> {
  const path = `${PRODUCTS_COLLECTION}/${productId}`;
  try {
    await ensureFirebaseAuth();
    const productRef = doc(db, PRODUCTS_COLLECTION, productId);
    await deleteDoc(productRef);
  } catch (err: any) {
    if (err?.code === 'permission-denied' || (err instanceof Error && err.message.includes('insufficient permissions'))) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
    console.error('[Firebase] Failed to delete product:', err);
  }
}

/**
 * Save stock log entry to Firestore
 */
export async function saveLogToFirestore(log: StockLog): Promise<void> {
  const path = `${LOGS_COLLECTION}/${log.id}`;
  try {
    await ensureFirebaseAuth();
    const logRef = doc(db, LOGS_COLLECTION, log.id);
    await setDoc(logRef, log, { merge: true });
  } catch (err: any) {
    if (err?.code === 'permission-denied' || (err instanceof Error && err.message.includes('insufficient permissions'))) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
    console.error('[Firebase] Failed to save log:', err);
  }
}

/**
 * Save app settings to Firestore
 */
export async function saveSettingsToFirestore(settings: AppSettings): Promise<void> {
  const path = `${SETTINGS_COLLECTION}/${SETTINGS_DOC_ID}`;
  try {
    await ensureFirebaseAuth();
    const settingsRef = doc(db, SETTINGS_COLLECTION, SETTINGS_DOC_ID);
    await setDoc(settingsRef, settings, { merge: true });
  } catch (err: any) {
    if (err?.code === 'permission-denied' || (err instanceof Error && err.message.includes('insufficient permissions'))) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
    console.error('[Firebase] Failed to save settings:', err);
  }
}

/**
 * Batch update multiple products (Opname / batch)
 */
export async function batchSyncProductsToFirestore(products: Product[], logs?: StockLog[]): Promise<void> {
  const path = PRODUCTS_COLLECTION;
  try {
    await ensureFirebaseAuth();
    const batch = writeBatch(db);
    
    for (const p of products) {
      const ref = doc(db, PRODUCTS_COLLECTION, p.id);
      batch.set(ref, p, { merge: true });
    }

    if (logs && logs.length > 0) {
      for (const l of logs) {
        const lRef = doc(db, LOGS_COLLECTION, l.id);
        batch.set(lRef, l, { merge: true });
      }
    }

    await batch.commit();
  } catch (err: any) {
    if (err?.code === 'permission-denied' || (err instanceof Error && err.message.includes('insufficient permissions'))) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
    console.error('[Firebase] Failed to batch sync products:', err);
  }
}
