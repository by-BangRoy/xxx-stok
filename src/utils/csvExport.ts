import { Product, StockLog } from '../types/inventory.ts';

/**
 * Escapes cell content for RFC 4180 CSV standard
 */
function escapeCsvCell(value: any): string {
  if (value === null || value === undefined) return '';
  const str = String(value).trim();
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Exports products as a clean, structured, and beautiful CSV file.
 * Includes UTF-8 BOM (\uFEFF) and Windows CRLF so Microsoft Excel, Google Sheets,
 * and WPS Office open it directly with clean separated columns.
 */
export function exportInventoryToCSV(products: Product[], storeName: string = 'STZstok') {
  if (!products || products.length === 0) {
    alert('Katalog masih kosong, tidak ada data barang untuk diekspor.');
    return;
  }

  // Standar Kolom Rapi & Terstruktur
  const headers = [
    'No',
    'Nama Barang',
    'Kategori',
    'Warna',
    'Ukuran / Size',
    'Stok (Pcs)',
    'Stok (Lusin)',
    'Batas Min Stok (Pcs)',
    'Status Stok',
    'Catatan / Terakhir Diperbarui'
  ];

  const rows: string[] = [];
  let rowNumber = 1;

  products.forEach((product) => {
    (product.variants || []).forEach((variant) => {
      const stockPcs = Number(variant.stock) || 0;
      const minStock = Number(variant.minStock) || 0;
      const lusinStr = `${(stockPcs / 12).toFixed(1).replace('.', ',')} Lsn`;

      let statusStok = 'AMAN';
      if (stockPcs === 0) {
        statusStok = 'HABIS';
      } else if (stockPcs <= minStock) {
        statusStok = 'MENIPIS';
      }

      const lastUpdated = product.updatedAt
        ? new Date(product.updatedAt).toLocaleDateString('id-ID', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
          })
        : '-';

      const row = [
        String(rowNumber++),
        escapeCsvCell(product.name),
        escapeCsvCell(product.category || 'Umum'),
        escapeCsvCell(variant.color || 'Standar'),
        escapeCsvCell(variant.size || 'All Size'),
        String(stockPcs),
        escapeCsvCell(lusinStr),
        String(minStock),
        statusStok,
        escapeCsvCell(product.description ? `${product.description} (${lastUpdated})` : lastUpdated)
      ];

      rows.push(row.join(','));
    });
  });

  const csvRows = [
    headers.map(escapeCsvCell).join(','),
    ...rows
  ];

  // UTF-8 BOM (\uFEFF) ensures Excel opens Indonesian characters and numbers neatly separated into columns
  const csvContent = '\uFEFF' + csvRows.join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const dateStr = `${year}-${month}-${day}`;
  const cleanStoreName = (storeName || 'STZstok').trim().replace(/[^a-zA-Z0-9]/g, '_');

  link.setAttribute('href', url);
  link.setAttribute('download', `Stok_Inventaris_${cleanStoreName}_${dateStr}_RAPI.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Exports Audit activity logs as clean CSV
 */
export function exportAuditLogsToCSV(logs: StockLog[]) {
  if (!logs || logs.length === 0) {
    alert('Belum ada catatan aktivitas riwayat stok.');
    return;
  }

  const headers = [
    'No',
    'Waktu & Tanggal',
    'Nama Barang',
    'Varian (Ukuran / Warna)',
    'Tipe Aktivitas',
    'Perubahan (Pcs)',
    'Stok Sebelum (Pcs)',
    'Stok Sesudah (Pcs)',
    'Keterangan / Alasan',
    'Perangkat',
    'Operator / Kasir'
  ];

  const getIndonesianType = (type: string) => {
    switch (type) {
      case 'sale': return 'Penjualan (Barang Keluar)';
      case 'restock': return 'Restock (Barang Masuk)';
      case 'adjustment': return 'Penyesuaian Opname';
      case 'return': return 'Retur Barang';
      case 'damage': return 'Barang Rusak / Reject';
      default: return type;
    }
  };

  const rows = logs.map((log, idx) => {
    const formattedDate = new Date(log.timestamp).toLocaleString('id-ID', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });

    return [
      String(idx + 1),
      escapeCsvCell(formattedDate),
      escapeCsvCell(log.productName),
      escapeCsvCell(log.variantDescription),
      escapeCsvCell(getIndonesianType(log.changeType)),
      String(log.delta > 0 ? `+${log.delta}` : log.delta),
      String(log.previousStock),
      String(log.newStock),
      escapeCsvCell(log.reason || '-'),
      escapeCsvCell(log.deviceName),
      escapeCsvCell(log.operatorName)
    ].join(',');
  });

  const csvContent = '\uFEFF' + [headers.map(escapeCsvCell).join(','), ...rows].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10);
  link.setAttribute('href', url);
  link.setAttribute('download', `Riwayat_Aktivitas_STZstok_${dateStr}_RAPI.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Parses a standard inventory CSV text and returns structured Product payloads
 */
export function parseInventoryCSV(csvText: string): Partial<Product>[] {
  const lines = csvText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  if (lines.length < 2) return [];

  // Parse header
  const headerLine = lines[0].replace(/^\uFEFF/, '');
  const headers = parseCSVLine(headerLine).map(h => h.toLowerCase().trim());

  const idxName = headers.findIndex(h => h.includes('nama') || h.includes('pakaian') || h.includes('barang'));
  const idxColor = headers.findIndex(h => h.includes('warna') || h.includes('color'));
  const idxSize = headers.findIndex(h => h.includes('ukuran') || h.includes('size'));
  const idxStock = headers.findIndex(h => h.includes('stok (pcs)') || h.includes('stok') || h.includes('qty'));
  const idxMinStock = headers.findIndex(h => h.includes('min') || h.includes('batas'));
  const idxCategory = headers.findIndex(h => h.includes('kategori') || h.includes('category'));

  // Group by product name
  const productMap = new Map<string, { category: string; variants: any[] }>();

  for (let i = 1; i < lines.length; i++) {
    const cols = parseCSVLine(lines[i]);
    if (cols.length === 0) continue;

    const rawName = idxName !== -1 && cols[idxName] ? cols[idxName].trim() : `Produk ${i}`;
    if (!rawName) continue;

    const color = idxColor !== -1 && cols[idxColor] ? cols[idxColor].trim() : 'Standar';
    const size = idxSize !== -1 && cols[idxSize] ? cols[idxSize].trim() : 'All Size';
    const stock = idxStock !== -1 && cols[idxStock] ? Math.max(0, parseInt(cols[idxStock].replace(/[^0-9]/g, '')) || 0) : 0;
    const minStock = idxMinStock !== -1 && cols[idxMinStock] ? Math.max(0, parseInt(cols[idxMinStock].replace(/[^0-9]/g, '')) || 2) : 2;
    const category = idxCategory !== -1 && cols[idxCategory] ? cols[idxCategory].trim() : 'Pakaian';

    if (!productMap.has(rawName)) {
      productMap.set(rawName, { category, variants: [] });
    }

    const item = productMap.get(rawName)!;
    item.variants.push({
      id: `var-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      size,
      color,
      colorHex: getColorHex(color),
      stock,
      minStock,
      price: 0,
      costPrice: 0,
    });
  }

  const result: Partial<Product>[] = [];
  for (const [name, data] of productMap.entries()) {
    result.push({
      name,
      category: data.category,
      imageUrl: '/assets/aistudio/WhatsApp_Image_2026-10-20_at_14.00.08_44e1b065.jpeg',
      description: 'Diimpor dari file rekap stok CSV',
      variants: data.variants,
    });
  }

  return result;
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

function getColorHex(colorName: string): string {
  const c = colorName.toLowerCase();
  if (c.includes('hitam') || c.includes('black')) return '#1E293B';
  if (c.includes('putih') || c.includes('white')) return '#F8FAFC';
  if (c.includes('army') || c.includes('sage') || c.includes('green') || c.includes('hijau')) return '#4D7C0F';
  if (c.includes('mocca') || c.includes('coklat') || c.includes('brown')) return '#A27B5C';
  if (c.includes('cream') || c.includes('krem') || c.includes('beige')) return '#E2D4B7';
  if (c.includes('navy') || c.includes('biru') || c.includes('blue')) return '#1E3A8A';
  if (c.includes('abu') || c.includes('grey') || c.includes('gray')) return '#64748B';
  if (c.includes('merah') || c.includes('maroon') || c.includes('red')) return '#991B1B';
  if (c.includes('pink') || c.includes('dusty')) return '#F472B6';
  if (c.includes('kuning') || c.includes('yellow') || c.includes('mustard')) return '#F59E0B';
  return '#94A3B8';
}
