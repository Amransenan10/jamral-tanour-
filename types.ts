
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
  id: string;
  userId: string;
  userName: string;
  amount: number;
  pointsEarned: number;
  pointsSpent: number;
  type: 'EARN' | 'REDEEM';
  createdAt: string;
  cashierId: string;
}

export interface LoyaltyConfig {
  pointsPerRiyal: number;
  pointsToRedeem1SAR: number;
}
