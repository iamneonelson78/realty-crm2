/**
 * Listing import/export using SheetJS (xlsx).
 *
 * Install: npm install xlsx
 *
 * Export: converts listing rows to an .xlsx download.
 * Import: reads uploaded .xlsx/.csv file, returns normalized listing objects.
 * Download Template: returns a blank xlsx with the correct columns.
 */

import * as XLSX from 'xlsx';

const COLUMNS = [
  { header: 'Title*', key: 'title' },
  { header: 'Location*', key: 'location' },
  { header: 'Rent (PHP)*', key: 'rent' },
  { header: 'Beds', key: 'beds' },
  { header: 'Bathrooms', key: 'bathrooms' },
  { header: 'Floor Area (sqm)', key: 'floor_area' },
  { header: 'Category', key: 'category' },
  { header: 'Status', key: 'status' },
  { header: 'Description', key: 'description' },
  { header: 'Amenities', key: 'amenities' },
  { header: 'Rules/Terms', key: 'rules' },
  { header: 'Contact', key: 'contact' },
];

/**
 * Export a list of listing rows to an .xlsx file and trigger download.
 * @param {Array<Object>} rows   — array of listing objects
 * @param {string} [filename]
 */
export function exportListingsXlsx(rows, filename = 'listings-export.xlsx') {
  const header = COLUMNS.map((c) => c.header);
  const data = rows.map((row) => COLUMNS.map((c) => row[c.key] ?? ''));

  const ws = XLSX.utils.aoa_to_sheet([header, ...data]);

  // Column widths
  ws['!cols'] = COLUMNS.map((c) => ({
    wch: Math.max(c.header.length + 2, c.key === 'description' || c.key === 'rules' ? 40 : 18),
  }));

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Listings');
  XLSX.writeFile(wb, filename);
}

/**
 * Download a blank listing import template.
 */
export function downloadImportTemplate() {
  const header = COLUMNS.map((c) => c.header);
  const exampleRow = [
    'Modern Studio near BGC',
    'Fort Bonifacio, Taguig',
    '18000',
    '0',
    '1',
    '28',
    'Condo',
    'available',
    'Semi-furnished cozy unit',
    'Pool, Gym, Security',
    'No pets',
    'Agent Name',
  ];
  const ws = XLSX.utils.aoa_to_sheet([header, exampleRow]);
  ws['!cols'] = COLUMNS.map((c) => ({ wch: Math.max(c.header.length + 2, 18) }));

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Listings');
  XLSX.writeFile(wb, 'listings-import-template.xlsx');
}

/**
 * Parse an uploaded .xlsx or .csv file and return normalized listing objects.
 * @param {File} file
 * @returns {Promise<Array<Object>>}
 */
export function importListingsXlsx(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const wb = XLSX.read(e.target.result, { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(ws, { defval: '' });

        const colMap = {};
        COLUMNS.forEach((c) => {
          colMap[c.header] = c.key;
          colMap[c.header.replace('*', '').trim()] = c.key; // alias without asterisk
        });

        const normalized = rows
          .filter((row) => Object.values(row).some((v) => String(v).trim()))
          .map((row) => {
            const obj = {};
            for (const [rawKey, rawVal] of Object.entries(row)) {
              const mappedKey = colMap[rawKey.trim()] || rawKey.trim().toLowerCase().replace(/\s+/g, '_');
              obj[mappedKey] = String(rawVal).trim();
            }
            // Cast numeric fields
            if (obj.rent) obj.rent = Number(String(obj.rent).replace(/[^0-9.]/g, '')) || null;
            if (obj.beds) obj.beds = Number(obj.beds) || 0;
            return obj;
          })
          .filter((row) => row.title); // must have title

        resolve(normalized);
      } catch (err) {
        reject(new Error(`Failed to parse file: ${err.message}`));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsArrayBuffer(file);
  });
}
