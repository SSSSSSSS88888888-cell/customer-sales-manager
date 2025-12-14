import jsPDF from "jspdf";
import "jspdf-autotable";
import * as XLSX from "xlsx";

// jsPDF-autotable の型拡張
declare module "jspdf" {
  interface jsPDF {
    autoTable: (options: {
      head?: string[][];
      body?: (string | number)[][];
      startY?: number;
      theme?: string;
      styles?: Record<string, unknown>;
      headStyles?: Record<string, unknown>;
      margin?: { left?: number; right?: number };
    }) => jsPDF;
    lastAutoTable?: { finalY: number };
  }
}

// 日本語対応のため、標準フォントを使用
// 金額フォーマット
const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat("ja-JP").format(value);
};

// 日付フォーマット
const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

// ========== 貸借対照表 (BS) ==========
interface BSData {
  date: string;
  assets: {
    sections: { title: string; items: { code: string; name: string; balance: number }[]; total: number }[];
    total: number;
  };
  liabilities: {
    sections: { title: string; items: { code: string; name: string; balance: number }[]; total: number }[];
    total: number;
  };
  equity: {
    sections: { title: string; items: { code: string; name: string; balance: number }[]; total: number }[];
    total: number;
  };
}

export const exportBSToPDF = (data: BSData): void => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // タイトル
  doc.setFontSize(18);
  doc.text("Balance Sheet", pageWidth / 2, 20, { align: "center" });
  doc.setFontSize(12);
  doc.text(`As of: ${formatDate(data.date)}`, pageWidth / 2, 30, { align: "center" });

  let yPos = 45;

  // 資産の部
  doc.setFontSize(14);
  doc.text("Assets", 14, yPos);
  yPos += 5;

  const assetRows: (string | number)[][] = [];
  data.assets.sections.forEach((section) => {
    assetRows.push([section.title, "", ""]);
    section.items.forEach((item) => {
      assetRows.push(["  " + item.name, item.code, formatCurrency(item.balance)]);
    });
    assetRows.push(["  Subtotal", "", formatCurrency(section.total)]);
  });
  assetRows.push(["Total Assets", "", formatCurrency(data.assets.total)]);

  doc.autoTable({
    head: [["Account", "Code", "Amount"]],
    body: assetRows,
    startY: yPos,
    theme: "grid",
    styles: { fontSize: 10 },
    headStyles: { fillColor: [220, 38, 38] },
  });

  yPos = (doc.lastAutoTable?.finalY || yPos) + 15;

  // 負債の部
  doc.setFontSize(14);
  doc.text("Liabilities", 14, yPos);
  yPos += 5;

  const liabilityRows: (string | number)[][] = [];
  data.liabilities.sections.forEach((section) => {
    liabilityRows.push([section.title, "", ""]);
    section.items.forEach((item) => {
      liabilityRows.push(["  " + item.name, item.code, formatCurrency(item.balance)]);
    });
    liabilityRows.push(["  Subtotal", "", formatCurrency(section.total)]);
  });
  liabilityRows.push(["Total Liabilities", "", formatCurrency(data.liabilities.total)]);

  doc.autoTable({
    head: [["Account", "Code", "Amount"]],
    body: liabilityRows,
    startY: yPos,
    theme: "grid",
    styles: { fontSize: 10 },
    headStyles: { fillColor: [220, 38, 38] },
  });

  yPos = (doc.lastAutoTable?.finalY || yPos) + 15;

  // 純資産の部
  doc.setFontSize(14);
  doc.text("Equity", 14, yPos);
  yPos += 5;

  const equityRows: (string | number)[][] = [];
  data.equity.sections.forEach((section) => {
    equityRows.push([section.title, "", ""]);
    section.items.forEach((item) => {
      equityRows.push(["  " + item.name, item.code, formatCurrency(item.balance)]);
    });
    equityRows.push(["  Subtotal", "", formatCurrency(section.total)]);
  });
  equityRows.push(["Total Equity", "", formatCurrency(data.equity.total)]);
  equityRows.push(["Total Liabilities & Equity", "", formatCurrency(data.liabilities.total + data.equity.total)]);

  doc.autoTable({
    head: [["Account", "Code", "Amount"]],
    body: equityRows,
    startY: yPos,
    theme: "grid",
    styles: { fontSize: 10 },
    headStyles: { fillColor: [220, 38, 38] },
  });

  doc.save(`balance_sheet_${data.date}.pdf`);
};

export const exportBSToExcel = (data: BSData): void => {
  const wb = XLSX.utils.book_new();

  const rows: (string | number)[][] = [
    ["貸借対照表"],
    [`基準日: ${formatDate(data.date)}`],
    [],
    ["【資産の部】", "", ""],
    ["勘定科目", "コード", "金額"],
  ];

  data.assets.sections.forEach((section) => {
    rows.push([section.title, "", ""]);
    section.items.forEach((item) => {
      rows.push(["  " + item.name, item.code, item.balance]);
    });
    rows.push(["  小計", "", section.total]);
  });
  rows.push(["資産合計", "", data.assets.total]);

  rows.push([]);
  rows.push(["【負債の部】", "", ""]);
  rows.push(["勘定科目", "コード", "金額"]);

  data.liabilities.sections.forEach((section) => {
    rows.push([section.title, "", ""]);
    section.items.forEach((item) => {
      rows.push(["  " + item.name, item.code, item.balance]);
    });
    rows.push(["  小計", "", section.total]);
  });
  rows.push(["負債合計", "", data.liabilities.total]);

  rows.push([]);
  rows.push(["【純資産の部】", "", ""]);
  rows.push(["勘定科目", "コード", "金額"]);

  data.equity.sections.forEach((section) => {
    rows.push([section.title, "", ""]);
    section.items.forEach((item) => {
      rows.push(["  " + item.name, item.code, item.balance]);
    });
    rows.push(["  小計", "", section.total]);
  });
  rows.push(["純資産合計", "", data.equity.total]);
  rows.push(["負債・純資産合計", "", data.liabilities.total + data.equity.total]);

  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws["!cols"] = [{ wch: 30 }, { wch: 10 }, { wch: 15 }];
  XLSX.utils.book_append_sheet(wb, ws, "貸借対照表");
  XLSX.writeFile(wb, `貸借対照表_${data.date}.xlsx`, { bookType: "xlsx", type: "binary" });
};

// ========== 損益計算書 (PL) ==========
interface PLData {
  period: {
    startDate: string;
    endDate: string;
  };
  revenues: {
    sections: { title: string; items: { code: string; name: string; amount: number }[]; total: number }[];
    total: number;
  };
  expenses: {
    sections: { title: string; items: { code: string; name: string; amount: number }[]; total: number }[];
    total: number;
  };
  summary: {
    sales: number;
    costOfSales: number;
    grossProfit: number;
    sgaExpenses: number;
    operatingIncome: number;
    ordinaryIncome: number;
    netIncome: number;
  };
}

export const exportPLToPDF = (data: PLData): void => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // タイトル
  doc.setFontSize(18);
  doc.text("Profit and Loss Statement", pageWidth / 2, 20, { align: "center" });
  doc.setFontSize(12);
  doc.text(`Period: ${formatDate(data.period.startDate)} - ${formatDate(data.period.endDate)}`, pageWidth / 2, 30, { align: "center" });

  // サマリー
  const summaryRows: (string | number)[][] = [
    ["Sales", formatCurrency(data.summary.sales)],
    ["Cost of Sales", formatCurrency(data.summary.costOfSales)],
    ["Gross Profit", formatCurrency(data.summary.grossProfit)],
    ["SG&A Expenses", formatCurrency(data.summary.sgaExpenses)],
    ["Operating Income", formatCurrency(data.summary.operatingIncome)],
    ["Ordinary Income", formatCurrency(data.summary.ordinaryIncome)],
    ["Net Income", formatCurrency(data.summary.netIncome)],
  ];

  doc.autoTable({
    head: [["Item", "Amount"]],
    body: summaryRows,
    startY: 40,
    theme: "grid",
    styles: { fontSize: 10 },
    headStyles: { fillColor: [220, 38, 38] },
  });

  let yPos = (doc.lastAutoTable?.finalY || 40) + 15;

  // 収益明細
  doc.setFontSize(14);
  doc.text("Revenue Details", 14, yPos);
  yPos += 5;

  const revenueRows: (string | number)[][] = [];
  data.revenues.sections.forEach((section) => {
    revenueRows.push([section.title, "", ""]);
    section.items.forEach((item) => {
      revenueRows.push(["  " + item.name, item.code, formatCurrency(item.amount)]);
    });
  });

  doc.autoTable({
    head: [["Account", "Code", "Amount"]],
    body: revenueRows,
    startY: yPos,
    theme: "grid",
    styles: { fontSize: 10 },
    headStyles: { fillColor: [34, 197, 94] },
  });

  yPos = (doc.lastAutoTable?.finalY || yPos) + 15;

  // 費用明細
  doc.setFontSize(14);
  doc.text("Expense Details", 14, yPos);
  yPos += 5;

  const expenseRows: (string | number)[][] = [];
  data.expenses.sections.forEach((section) => {
    expenseRows.push([section.title, "", ""]);
    section.items.forEach((item) => {
      expenseRows.push(["  " + item.name, item.code, formatCurrency(item.amount)]);
    });
  });

  doc.autoTable({
    head: [["Account", "Code", "Amount"]],
    body: expenseRows,
    startY: yPos,
    theme: "grid",
    styles: { fontSize: 10 },
    headStyles: { fillColor: [239, 68, 68] },
  });

  doc.save(`profit_loss_${data.period.endDate}.pdf`);
};

export const exportPLToExcel = (data: PLData): void => {
  const wb = XLSX.utils.book_new();

  const rows: (string | number)[][] = [
    ["損益計算書"],
    [`期間: ${formatDate(data.period.startDate)} ～ ${formatDate(data.period.endDate)}`],
    [],
    ["【損益サマリー】"],
    ["項目", "金額"],
    ["売上高", data.summary.sales],
    ["売上原価", data.summary.costOfSales],
    ["売上総利益", data.summary.grossProfit],
    ["販売費及び一般管理費", data.summary.sgaExpenses],
    ["営業利益", data.summary.operatingIncome],
    ["経常利益", data.summary.ordinaryIncome],
    ["当期純利益", data.summary.netIncome],
    [],
    ["【収益明細】"],
    ["勘定科目", "コード", "金額"],
  ];

  data.revenues.sections.forEach((section) => {
    rows.push([section.title, "", ""]);
    section.items.forEach((item) => {
      rows.push(["  " + item.name, item.code, item.amount]);
    });
  });
  rows.push(["収益合計", "", data.revenues.total]);

  rows.push([]);
  rows.push(["【費用明細】"]);
  rows.push(["勘定科目", "コード", "金額"]);

  data.expenses.sections.forEach((section) => {
    rows.push([section.title, "", ""]);
    section.items.forEach((item) => {
      rows.push(["  " + item.name, item.code, item.amount]);
    });
  });
  rows.push(["費用合計", "", data.expenses.total]);

  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws["!cols"] = [{ wch: 30 }, { wch: 10 }, { wch: 15 }];
  XLSX.utils.book_append_sheet(wb, ws, "損益計算書");
  XLSX.writeFile(wb, `損益計算書_${data.period.endDate}.xlsx`, { bookType: "xlsx", type: "binary" });
};

// ========== キャッシュフロー計算書 (CF) ==========
interface CFData {
  period: {
    startDate: string;
    endDate: string;
  };
  operating: {
    items: { name: string; amount: number }[];
    total: number;
  };
  investing: {
    items: { name: string; amount: number }[];
    total: number;
  };
  financing: {
    items: { name: string; amount: number }[];
    total: number;
  };
  summary: {
    netCashFlow: number;
    beginningCash: number;
    endingCash: number;
  };
}

export const exportCFToPDF = (data: CFData): void => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // タイトル
  doc.setFontSize(18);
  doc.text("Cash Flow Statement", pageWidth / 2, 20, { align: "center" });
  doc.setFontSize(12);
  doc.text(`Period: ${formatDate(data.period.startDate)} - ${formatDate(data.period.endDate)}`, pageWidth / 2, 30, { align: "center" });

  let yPos = 45;

  // 営業活動
  doc.setFontSize(14);
  doc.text("Operating Activities", 14, yPos);
  yPos += 5;

  const operatingRows: (string | number)[][] = data.operating.items.map((item) => [
    item.name,
    formatCurrency(item.amount),
  ]);
  operatingRows.push(["Net Cash from Operating", formatCurrency(data.operating.total)]);

  doc.autoTable({
    head: [["Item", "Amount"]],
    body: operatingRows,
    startY: yPos,
    theme: "grid",
    styles: { fontSize: 10 },
    headStyles: { fillColor: [59, 130, 246] },
  });

  yPos = (doc.lastAutoTable?.finalY || yPos) + 15;

  // 投資活動
  doc.setFontSize(14);
  doc.text("Investing Activities", 14, yPos);
  yPos += 5;

  const investingRows: (string | number)[][] = data.investing.items.map((item) => [
    item.name,
    formatCurrency(item.amount),
  ]);
  investingRows.push(["Net Cash from Investing", formatCurrency(data.investing.total)]);

  doc.autoTable({
    head: [["Item", "Amount"]],
    body: investingRows,
    startY: yPos,
    theme: "grid",
    styles: { fontSize: 10 },
    headStyles: { fillColor: [168, 85, 247] },
  });

  yPos = (doc.lastAutoTable?.finalY || yPos) + 15;

  // 財務活動
  doc.setFontSize(14);
  doc.text("Financing Activities", 14, yPos);
  yPos += 5;

  const financingRows: (string | number)[][] = data.financing.items.map((item) => [
    item.name,
    formatCurrency(item.amount),
  ]);
  financingRows.push(["Net Cash from Financing", formatCurrency(data.financing.total)]);

  doc.autoTable({
    head: [["Item", "Amount"]],
    body: financingRows,
    startY: yPos,
    theme: "grid",
    styles: { fontSize: 10 },
    headStyles: { fillColor: [34, 197, 94] },
  });

  yPos = (doc.lastAutoTable?.finalY || yPos) + 15;

  // サマリー
  doc.setFontSize(14);
  doc.text("Summary", 14, yPos);
  yPos += 5;

  const summaryRows: (string | number)[][] = [
    ["Net Cash Flow", formatCurrency(data.summary.netCashFlow)],
    ["Beginning Cash", formatCurrency(data.summary.beginningCash)],
    ["Ending Cash", formatCurrency(data.summary.endingCash)],
  ];

  doc.autoTable({
    head: [["Item", "Amount"]],
    body: summaryRows,
    startY: yPos,
    theme: "grid",
    styles: { fontSize: 10 },
    headStyles: { fillColor: [220, 38, 38] },
  });

  doc.save(`cash_flow_${data.period.endDate}.pdf`);
};

export const exportCFToExcel = (data: CFData): void => {
  const wb = XLSX.utils.book_new();

  const rows: (string | number)[][] = [
    ["キャッシュフロー計算書"],
    [`期間: ${formatDate(data.period.startDate)} ～ ${formatDate(data.period.endDate)}`],
    [],
    ["【営業活動によるキャッシュフロー】"],
    ["項目", "金額"],
  ];

  data.operating.items.forEach((item) => {
    rows.push([item.name, item.amount]);
  });
  rows.push(["営業活動によるキャッシュフロー", data.operating.total]);

  rows.push([]);
  rows.push(["【投資活動によるキャッシュフロー】"]);
  rows.push(["項目", "金額"]);

  data.investing.items.forEach((item) => {
    rows.push([item.name, item.amount]);
  });
  rows.push(["投資活動によるキャッシュフロー", data.investing.total]);

  rows.push([]);
  rows.push(["【財務活動によるキャッシュフロー】"]);
  rows.push(["項目", "金額"]);

  data.financing.items.forEach((item) => {
    rows.push([item.name, item.amount]);
  });
  rows.push(["財務活動によるキャッシュフロー", data.financing.total]);

  rows.push([]);
  rows.push(["【サマリー】"]);
  rows.push(["現金及び現金同等物の増減額", data.summary.netCashFlow]);
  rows.push(["現金及び現金同等物の期首残高", data.summary.beginningCash]);
  rows.push(["現金及び現金同等物の期末残高", data.summary.endingCash]);

  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws["!cols"] = [{ wch: 40 }, { wch: 15 }];
  XLSX.utils.book_append_sheet(wb, ws, "キャッシュフロー計算書");
  XLSX.writeFile(wb, `キャッシュフロー計算書_${data.period.endDate}.xlsx`, { bookType: "xlsx", type: "binary" });
};
