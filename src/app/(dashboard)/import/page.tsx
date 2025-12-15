"use client";

import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Upload,
  FileSpreadsheet,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Download,
  Loader2,
} from "lucide-react";

interface ImportResult {
  success: number;
  failed: number;
  errors: string[];
  message: string;
}

export default function ImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [previewData, setPreviewData] = useState<Array<Record<string, string>>>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const parseCSV = (text: string): Array<Record<string, string>> => {
    const lines = text.trim().split("\n");
    if (lines.length < 2) return [];

    const headers = lines[0].split(",").map(h => h.trim().replace(/"/g, ""));
    const data: Array<Record<string, string>> = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(",").map(v => v.trim().replace(/"/g, ""));
      const row: Record<string, string> = {};
      headers.forEach((header, idx) => {
        row[header] = values[idx] || "";
      });
      data.push(row);
    }

    return data;
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setResult(null);

    // ファイルを読み込んでプレビュー
    const text = await selectedFile.text();
    const data = parseCSV(text);
    setPreviewData(data.slice(0, 5)); // 最初の5行をプレビュー
  };

  const handleImport = async () => {
    if (!file) return;

    setIsLoading(true);
    setResult(null);

    try {
      const text = await file.text();
      const parsedData = parseCSV(text);

      // カラムマッピング
      const mappedData = parsedData.map(row => ({
        date: row["日付"] || row["date"] || "",
        description: row["摘要"] || row["description"] || "",
        debitAccountCode: row["借方コード"] || row["debitAccountCode"] || "",
        creditAccountCode: row["貸方コード"] || row["creditAccountCode"] || "",
        amount: parseInt(row["金額"] || row["amount"] || "0", 10),
      }));

      const res = await fetch("/api/journals/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: mappedData }),
      });

      const data = await res.json();
      setResult(data);
    } catch (error) {
      console.error("インポートエラー:", error);
      setResult({
        success: 0,
        failed: 0,
        errors: ["ファイルの読み込みに失敗しました"],
        message: "エラーが発生しました",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const downloadTemplate = () => {
    const template = `日付,摘要,借方コード,貸方コード,金額
2024-01-15,商品売上,100,400,50000
2024-01-16,仕入,500,200,30000
2024-01-17,給料支払,510,100,250000`;

    const blob = new Blob([template], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "仕訳インポートテンプレート.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
          <Upload className="h-5 w-5 text-green-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">CSVインポート</h1>
          <p className="text-sm text-slate-500">CSVファイルから仕訳データを一括登録</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* アップロードエリア */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">ファイルアップロード</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div
              className="border-2 border-dashed border-slate-200 rounded-lg p-8 text-center cursor-pointer hover:border-green-400 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
                className="hidden"
              />
              <FileSpreadsheet className="h-12 w-12 text-slate-300 mx-auto mb-4" />
              {file ? (
                <div>
                  <p className="text-slate-900 font-medium">{file.name}</p>
                  <p className="text-sm text-slate-500">{(file.size / 1024).toFixed(1)} KB</p>
                </div>
              ) : (
                <div>
                  <p className="text-slate-600 mb-1">クリックしてCSVファイルを選択</p>
                  <p className="text-sm text-slate-400">または、ドラッグ＆ドロップ</p>
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleImport}
                disabled={!file || isLoading}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    インポート中...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    インポート実行
                  </>
                )}
              </Button>
              <Button variant="outline" onClick={downloadTemplate}>
                <Download className="h-4 w-4 mr-2" />
                テンプレート
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* フォーマット説明 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">CSVフォーマット</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-slate-600">
              以下のカラムを含むCSVファイルを準備してください：
            </p>
            <div className="bg-slate-50 rounded-lg p-4 text-sm font-mono">
              <p className="text-slate-600">日付,摘要,借方コード,貸方コード,金額</p>
              <p className="text-slate-400">2024-01-15,商品売上,100,400,50000</p>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex gap-2">
                <span className="font-medium text-slate-700 w-24">日付</span>
                <span className="text-slate-500">YYYY-MM-DD形式</span>
              </div>
              <div className="flex gap-2">
                <span className="font-medium text-slate-700 w-24">摘要</span>
                <span className="text-slate-500">取引の説明（任意）</span>
              </div>
              <div className="flex gap-2">
                <span className="font-medium text-slate-700 w-24">借方コード</span>
                <span className="text-slate-500">勘定科目コード（例: 100）</span>
              </div>
              <div className="flex gap-2">
                <span className="font-medium text-slate-700 w-24">貸方コード</span>
                <span className="text-slate-500">勘定科目コード（例: 400）</span>
              </div>
              <div className="flex gap-2">
                <span className="font-medium text-slate-700 w-24">金額</span>
                <span className="text-slate-500">数値（カンマなし）</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* プレビュー */}
      {previewData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">プレビュー（最初の5行）</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    {Object.keys(previewData[0]).map((key) => (
                      <th key={key} className="text-left py-2 px-3 font-medium text-slate-700">
                        {key}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {previewData.map((row, idx) => (
                    <tr key={idx} className="border-b last:border-0">
                      {Object.values(row).map((value, vidx) => (
                        <td key={vidx} className="py-2 px-3 text-slate-600">
                          {value}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 結果 */}
      {result && (
        <Card className={result.failed > 0 ? "border-amber-200" : "border-green-200"}>
          <CardHeader>
            <div className="flex items-center gap-3">
              {result.failed === 0 ? (
                <CheckCircle className="h-6 w-6 text-green-600" />
              ) : (
                <AlertTriangle className="h-6 w-6 text-amber-600" />
              )}
              <CardTitle className="text-lg">{result.message}</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-6">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="text-slate-700">成功: {result.success}件</span>
              </div>
              {result.failed > 0 && (
                <div className="flex items-center gap-2">
                  <XCircle className="h-5 w-5 text-red-600" />
                  <span className="text-slate-700">失敗: {result.failed}件</span>
                </div>
              )}
            </div>

            {result.errors.length > 0 && (
              <div className="bg-red-50 rounded-lg p-4">
                <p className="font-medium text-red-800 mb-2">エラー詳細:</p>
                <ul className="space-y-1 text-sm text-red-700">
                  {result.errors.slice(0, 10).map((error, idx) => (
                    <li key={idx}>• {error}</li>
                  ))}
                  {result.errors.length > 10 && (
                    <li className="text-red-500">...他 {result.errors.length - 10} 件のエラー</li>
                  )}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
