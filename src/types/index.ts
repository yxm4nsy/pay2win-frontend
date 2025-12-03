/**
 * Type definitions for the Loyalty Program application
 * Defines interfaces and types for users, transactions, events, and promotions
 * Aligned with Prisma schema
 */

// User types
export type UserRole = 'regular' | 'cashier' | 'manager' | 'superuser';

export interface User {
  id: number;
  utorid: string;
  name: string;
  email: string;
  birthday?: string;
  role: UserRole;
  points: number;
  createdAt: string;
  lastLogin?: string;
  verified: boolean;
  suspicious?: boolean;
  avatarUrl?: string;
}

export interface AuthResponse {
  token: string;
  expiresAt: string;
}

// Transaction types
export type TransactionType = 'purchase' | 'adjustment' | 'redemption' | 'transfer' | 'event';

export interface Transaction {
  id: number;
  utorid?: string;
  type: TransactionType;
  amount: number;
  spent?: number;
  redeemed?: number;
  sent?: number;
  earned?: number;
  awarded?: number;
  relatedId?: number;
  promotionIds: number[];
  suspicious?: boolean;
  remark: string;
  createdBy: string;
  createdAt?: string;
  processedBy?: string | null;
  sender?: string;
  recipient?: string;
}

// Paginated response wrapper
export interface PaginatedResponse<T> {
  count: number;
  results: T[];
}

// Event types
export interface Event {
  id: number;
  name: string;
  description: string;
  location: string;
  startTime: string;
  endTime: string;
  capacity?: number;
  pointsTotal: number;
  pointsRemain?: number;
  pointsAwarded?: number;
  published?: boolean;
  numGuests?: number;
  organizers?: Array<{
    id: number;
    utorid: string;
    name: string;
  }>;
  guests?: Array<{
    id: number;
    utorid: string;
    name: string;
  }>;
}

// Promotion types
export type PromotionType = 'automatic' | 'one-time';

export interface Promotion {
  id: number;
  name: string;
  description?: string;
  type: PromotionType;
  startTime?: string;
  endTime: string;
  minSpending?: number;
  rate?: number;
  points?: number;
}