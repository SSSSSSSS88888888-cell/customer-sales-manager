// BOM付きUTF-8でCSVを生成（Excelで文字化けしない）
const BOM = "\uFEFF";

interface CSVColumn<T> {
  header: string;
  key: keyof T | ((item: T) => string);
}

export function generateCSV<T extends Record<string, unknown>>(
  data: T[],
  columns: CSVColumn<T>[]
): string {
  // ヘッダー行
  const headers = columns.map((col) => escapeCSVField(col.header));

  // データ行
  const rows = data.map((item) =>
    columns.map((col) => {
      let value: string;
      if (typeof col.key === "function") {
        value = col.key(item);
      } else {
        const rawValue = item[col.key];
        value = rawValue != null ? String(rawValue) : "";
      }
      return escapeCSVField(value);
    })
  );

  // CSV文字列を生成（BOM付き）
  const csvContent = [headers.join(","), ...rows.map((row) => row.join(","))].join("\r\n");
  return BOM + csvContent;
}

// CSVフィールドをエスケープ
function escapeCSVField(field: string): string {
  // ダブルクォート、カンマ、改行を含む場合はダブルクォートで囲む
  if (field.includes('"') || field.includes(",") || field.includes("\n") || field.includes("\r")) {
    // ダブルクォートは2つ重ねてエスケープ
    return `"${field.replace(/"/g, '""')}"`;
  }
  return field;
}

// 日付をYYYYMMDD形式でフォーマット
export function formatDateForFilename(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}${month}${day}`;
}

// 日付をYYYY/MM/DD形式でフォーマット
export function formatDateForCSV(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}
