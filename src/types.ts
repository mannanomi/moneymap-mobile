export type Kind = "expenses" | "income";
export type ThemeMode = "system" | "light" | "dark";
export type AccentId = "blue" | "teal" | "purple" | "green" | "orange" | "pink";

export interface Entry {
  id: string;
  date: string | null;
  amount: number;
  description: string;
  category: string;
}

export interface Month {
  label: string;
  startingBalance: number;
  monthlyLimit?: number;
  expenses: Entry[];
  income: Entry[];
}

export interface Payment {
  id: string;
  date: string;
  amount: number;
  interest: number;
  fee: number;
  note: string;
}

export interface CreditCard {
  id: string;
  name: string;
  issuer: string;
  network: string;
  last4: string;
  limit: number;
  owing: number;
  theme: string;
  payments: Payment[];
}

export interface Contribution {
  id: string;
  date: string;
  amount: number;
  note: string;
}

export interface SavingsPlan {
  id: string;
  name: string;
  goalType: string;
  target: number;
  targetDate: string | null;
  contributions: Contribution[];
}

export interface BankAccount {
  id: string;
  name: string;
  bank: string;
  type: string;
  balance: number;
}

export interface Investment {
  id: string;
  name: string;
  type: string;
  units: number;
  avgCost: number;
  currentPrice: number;
}

export interface Settings {
  theme?: ThemeMode;
  accent?: AccentId;
  [key: string]: unknown;
}

export interface AppData {
  expenseCategories: string[];
  incomeCategories: string[];
  months: Record<string, Month>;
  historyYears: string[];
  categoryBudgets: Record<string, number>;
  settings: Settings;
  cards: CreditCard[];
  bankAccounts: BankAccount[];
  investments: Investment[];
  savingsPlans: SavingsPlan[];
}

export interface MonthTotals {
  income: number;
  expense: number;
  net: number;
  carriedForward: number;
}
