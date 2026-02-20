
export type UserRole = 'CUSTOMER' | 'CASHIER' | 'ADMIN';

export interface User {
  id: string;
  phone: string;
  name: string;
  role: UserRole;
  points: number;
  username?: string; // للموظفين
  password?: string; // للموظفين
}

export interface Transaction {
  id: number;
  customer_phone: string;
  bill_amount: number;
  points_earned: number;
  points_redeemed: number;
  created_at: string;
  staff_id: string;
}

export interface LoyaltyConfig {
  earning_rate: number;
  redemption_rate: number;
}

export interface Customer {
  phone_number: string;
  full_name: string;
  points_balance: number;
  created_at: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image_url: string;
  ingredients: string[];
  calories: number;
  created_at: string;
}
