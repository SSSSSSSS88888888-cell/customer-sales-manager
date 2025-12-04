import * as XLSX from "xlsx";

interface XLSXColumn<T> {
  header: string;
  key: keyof T | ((item: T) => string | number);
  width?: number;
}

export function generateXLSX<T extends object>(
  data: T[],
  columns: XLSXColumn<T>[],
  sheetName: string = "Sheet1"
): Uint8Array {
  // ヘッダー行
  const headers = columns.map((col) => col.header);

  // データ行
  const rows = data.map((item) =>
    columns.map((col) => {
      if (typeof col.key === "function") {
        return col.key(item);
      } else {
        const rawValue = item[col.key];
        return rawValue != null ? rawValue : "";
      }
    })
  );

  // ワークシートを作成
  const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);

  // 列幅を設定
  worksheet["!cols"] = columns.map((col) => ({
    wch: col.width || 15,
  }));

  // ワークブックを作成
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

  // Uint8Arrayとして出力
  const buffer = XLSX.write(workbook, { type: "array", bookType: "xlsx" });
  return new Uint8Array(buffer);
}

// 日付をYYYYMMDD形式でフォーマット（ファイル名用）
export function formatDateForFilename(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}${month}${day}`;
}

// 日付をYYYY/MM/DD形式でフォーマット
export function formatDateForXLSX(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const year = d.getFullYear();
  const month = d.getMonth() + 1;
  const day = d.getDate();
  return `${year}/${month}/${day}`;
}
