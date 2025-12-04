// ==========================================
// Customer（顧客）
// ==========================================
export interface Customer {
  id: string;
  userId: string;
  name: string;        // 会社名/個人名
  email: string | null;
  phone: string | null;
  address: string | null;
  memo: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// ==========================================
// Sale（売上）
// ==========================================
export interface Sale {
  id: string;
  userId: string;
  customerId: string | null;
  productName: string;
  amount: number;      // 円単位
  saleDate: Date;
  memo: string | null;
  createdAt: Date;
  updatedAt: Date;
  customer?: Customer | null;
}

// ==========================================
// Dashboard統計
// ==========================================
export interface DashboardStats {
  totalCustomers: number;
  totalSales: number;
  totalRevenue: number;
  recentSales: Sale[];
}
