export interface Customer {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  address: string | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
}

export interface Sale {
  id: string;
  amount: number;
  description: string | null;
  saleDate: Date;
  status: SaleStatus;
  createdAt: Date;
  updatedAt: Date;
  customerId: string;
  userId: string;
  customer?: Customer;
}

export type SaleStatus = "PENDING" | "COMPLETED" | "CANCELLED";

export interface DashboardStats {
  totalCustomers: number;
  totalSales: number;
  totalRevenue: number;
  recentSales: Sale[];
}
