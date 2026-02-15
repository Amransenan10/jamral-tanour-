
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
  customerPhone: string;
  billAmount: number;
  pointsEarned: number;
  pointsRedeemed: number;
  type: 'EARN' | 'REDEEM';
  createdAt: string;
  staffId: string;
}


export interface LoyaltyConfig {
  earning_rate: number;
  redemption_rate: number;
}

