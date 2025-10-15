/**
 * CSV Export Utilities
 * Helpers for generating CSV files from data
 */

export function arrayToCSV(data: any[], headers?: string[]): string {
  if (!data || data.length === 0) {
    return '';
  }

  // Get headers from first object if not provided
  const csvHeaders = headers || Object.keys(data[0]);

  // Escape and quote CSV values
  const escapeValue = (value: any): string => {
    if (value === null || value === undefined) {
      return '';
    }

    const stringValue = String(value);

    // Check if value needs quoting (contains comma, quote, or newline)
    if (
      stringValue.includes(',') ||
      stringValue.includes('"') ||
      stringValue.includes('\n') ||
      stringValue.includes('\r')
    ) {
      // Escape quotes by doubling them
      return `"${stringValue.replace(/"/g, '""')}"`;
    }

    return stringValue;
  };

  // Build CSV rows
  const rows: string[] = [];

  // Add header row
  rows.push(csvHeaders.map(escapeValue).join(','));

  // Add data rows
  data.forEach((item) => {
    const row = csvHeaders.map((header) => {
      const value = item[header];
      return escapeValue(value);
    });
    rows.push(row.join(','));
  });

  // Join rows with newlines and add UTF-8 BOM for Excel compatibility
  return '\ufeff' + rows.join('\r\n');
}

export function generateCSVFilename(prefix: string, extension: string = 'csv'): string {
  const timestamp = new Date()
    .toISOString()
    .replace(/:/g, '-')
    .replace(/\..+/, '');
  return `${prefix}_${timestamp}.${extension}`;
}

export function formatDateForCSV(date: Date | string | null | undefined): string {
  if (!date) return '';
  
  const d = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(d.getTime())) return '';
  
  return d.toISOString().replace('T', ' ').substring(0, 19);
}

export function formatNumberForCSV(num: number | null | undefined): string {
  if (num === null || num === undefined) return '';
  return String(num);
}

export function formatBooleanForCSV(bool: boolean | null | undefined): string {
  if (bool === null || bool === undefined) return '';
  return bool ? 'Yes' : 'No';
}
