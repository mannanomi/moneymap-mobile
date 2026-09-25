import type {
  AppData, BankAccount, CreditCard, Entry, Investment, Kind, MonthTotals, SavingsPlan,
} from "../types";

// ---------- formatting (manual, so it never depends on Intl support) ----------

function groupThousands(intPart: string): string {
  return intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

export function fmtMoney(n: number): string {
  const v = Math.round((Number.isFinite(n) ? n : 0) * 100) / 100;
  const sign = v < 0 ? "-" : "";
  const [i, d] = Math.abs(v).toFixed(2).split(".");
  return `${sign}$${groupThousands(i)}.${d}`;
}

export function fmtMoneyCompact(n: number): string {
  const abs = Math.abs(n);
  const s = abs >= 1000 ? (abs / 1000).toFixed(1).replace(/\.0$/, "") + "K" : abs.toFixed(0);
  return (n < 0 ? "-$" : "$") + s;
}

export const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const MONTH_SHORT = MONTH_NAMES.map((m) => m.slice(0, 3));
const WEEKDAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function parseISO(iso: string | null | undefined): Date | null {
  if (!iso) return null;
  const m = /^(\d{1,4})-(\d{2})-(\d{2})/.exec(iso);
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

export function fmtDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = parseISO(iso);
  if (!d) return iso;
  return `${d.getDate()} ${MONTH_SHORT[d.getMonth()]} ${d.getFullYear()}`;
}

export function toISODate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function todayISO(): string {
  return toISODate(new Date());
}

export function relativeDayHeader(dateStr: string | null): string {
  if (!dateStr) return "No date";
  const d = parseISO(dateStr);
  if (!d) return dateStr;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const label = `${d.getDate()} ${MONTH_SHORT[d.getMonth()]}`;
  if (d.getTime() === today.getTime()) return `Today · ${label}`;
  if (d.getTime() === yesterday.getTime()) return `Yesterday · ${label}`;
  return `${WEEKDAY_SHORT[d.getDay()]} · ${label}`;
}

export function uid(prefix: string): string {
  return prefix + "-" + Math.random().toString(36).slice(2, 9);
}

export function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

// ---------- categories ----------

const CATEGORY_ICONS: Record<string, string> = {
  "Groceries": "cart", "Rent": "home", "Shopping": "bag", "Eating Out": "cup",
  "Transportation": "car", "Utilities": "zap", "Entertainment": "star",
  "Health/Medical": "medical", "Family": "users", "Travel": "plane",
  "Debt/Credit Card": "card", "Mobile Bills": "phone", "Personal": "user",
  "Personal/Urmi": "heart", "Education": "cap", "Investment": "trend",
  "Visa/Immigration": "receipt", "Gifts": "gift", "Workplace": "briefcase",
  "Car Related": "car", "Other": "tag",
};

export function categoryIcon(category: string): string {
  if (CATEGORY_ICONS[category]) return CATEGORY_ICONS[category];
  const lower = (category || "").toLowerCase();
  if (lower.includes("paycheck") || lower.includes("salary")) return "cash";
  if (lower.includes("saving")) return "piggy";
  if (lower.includes("loan")) return "users";
  if (lower.includes("bonus")) return "star";
  if (lower.includes("interest")) return "bank";
  if (lower.includes("refund")) return "undo";
  return "tag";
}

export function categoryTileIndex(data: AppData, category: string, kind: "income" | "expenses"): number {
  const list = kind === "income" ? data.incomeCategories : data.expenseCategories;
  const idx = (list || []).indexOf(category);
  return (idx < 0 ? 0 : idx) % 8;
}

// ---------- months / years ----------

export function sortedMonthKeys(data: AppData): string[] {
  return Object.keys(data.months).sort();
}

export function isHistoryYear(data: AppData, year: string): boolean {
  return (data.historyYears || []).includes(year);
}

export function isHistoryMonth(data: AppData, monthKey: string): boolean {
  return isHistoryYear(data, monthKey.split("-")[0]);
}

export function currentYearMonthKeys(data: AppData): string[] {
  return Object.keys(data.months).filter((k) => !isHistoryMonth(data, k)).sort();
}

export function historyYearsSorted(data: AppData): string[] {
  return [...(data.historyYears || [])].sort().reverse();
}

export function monthsInYear(data: AppData, year: string): string[] {
  return Object.keys(data.months).filter((k) => k.startsWith(year + "-")).sort();
}

// "Savings" income entries are carried forward from the previous month, not
// new earnings — kept out of income/net so the same dollars are not counted twice.
export const CARRY_FORWARD_CATEGORY = "Savings";

export function isCarryForwardEntry(e: Entry): boolean {
  return e.category === CARRY_FORWARD_CATEGORY;
}

export function monthTotals(data: AppData, monthKey: string): MonthTotals {
  const m = data.months[monthKey];
  let income = 0;
  let carriedForward = 0;
  for (const e of m.income) {
    if (isCarryForwardEntry(e)) carriedForward += e.amount;
    else income += e.amount;
  }
  const expense = m.expenses.reduce((s, e) => s + e.amount, 0);
  return { income, expense, net: income - expense, carriedForward };
}

export interface BreakdownRow { category: string; amount: number }

export function categoryBreakdown(entries: Entry[]): BreakdownRow[] {
  const map = new Map<string, number>();
  for (const e of entries) map.set(e.category, (map.get(e.category) || 0) + e.amount);
  return [...map.entries()]
    .map(([category, amount]) => ({ category, amount }))
    .sort((a, b) => b.amount - a.amount);
}

export function recentMonthKeys(data: AppData, monthKey: string, n: number): string[] {
  const result: string[] = [];
  let [y, m] = monthKey.split("-").map(Number);
  let guard = 0;
  while (result.length < n && guard < 36) {
    const key = `${y}-${String(m).padStart(2, "0")}`;
    if (data.months[key]) result.unshift(key);
    m -= 1;
    if (m < 1) { m = 12; y -= 1; }
    guard++;
  }
  return result;
}

export interface Series { labels: string[]; income: number[]; expense: number[] }

export function dailyTotals(data: AppData, monthKey: string): Series {
  const [year, mon] = monthKey.split("-").map(Number);
  const daysInMonth = new Date(year, mon, 0).getDate();
  const income = new Array(daysInMonth).fill(0);
  const expense = new Array(daysInMonth).fill(0);
  const m = data.months[monthKey];
  for (const e of m.expenses) {
    if (!e.date) continue;
    const d = parseInt(e.date.split("-")[2], 10);
    if (d >= 1 && d <= daysInMonth) expense[d - 1] += e.amount;
  }
  for (const e of m.income) {
    if (isCarryForwardEntry(e) || !e.date) continue;
    const d = parseInt(e.date.split("-")[2], 10);
    if (d >= 1 && d <= daysInMonth) income[d - 1] += e.amount;
  }
  const labels: string[] = [];
  for (let d = 1; d <= daysInMonth; d++) labels.push(String(d));
  return { labels, income, expense };
}

export function monthShort(data: AppData, key: string): string {
  return data.months[key].label.split(" ")[0].slice(0, 3);
}

export function monthlyTotalsSeries(data: AppData, monthKey: string, n: number): Series {
  const keys = recentMonthKeys(data, monthKey, n);
  return {
    labels: keys.map((k) => monthShort(data, k)),
    income: keys.map((k) => monthTotals(data, k).income),
    expense: keys.map((k) => monthTotals(data, k).expense),
  };
}

export type TrendRange = "1M" | "3M" | "6M" | "1Y";
export const TREND_RANGES: [TrendRange, string][] = [["1M", "1 Month"], ["3M", "3 Month"], ["6M", "6 Month"], ["1Y", "1 Year"]];
export const REPORT_RANGE_CAPTIONS: Record<TrendRange, string> = {
  "1M": "this month", "3M": "the last 3 months", "6M": "the last 6 months", "1Y": "the last year",
};

export function getTrendSeries(data: AppData, monthKey: string, range: TrendRange): Series {
  if (range === "1M") return dailyTotals(data, monthKey);
  if (range === "3M") return monthlyTotalsSeries(data, monthKey, 3);
  if (range === "6M") return monthlyTotalsSeries(data, monthKey, 6);
  return monthlyTotalsSeries(data, monthKey, 12);
}

export function reportRangeStats(data: AppData, monthKey: string, range: TrendRange) {
  const { income, expense } = getTrendSeries(data, monthKey, range);
  const totalIncome = income.reduce((s, v) => s + v, 0);
  const totalExpense = expense.reduce((s, v) => s + v, 0);
  const net = totalIncome - totalExpense;
  const rate = totalIncome > 0 ? (net / totalIncome) * 100 : 0;
  return { totalIncome, totalExpense, net, rate };
}

export function sortEntriesNewestFirst(entries: Entry[]): Entry[] {
  return [...entries].reverse().sort((a, b) => (b.date || "").localeCompare(a.date || ""));
}

export function niceMax(v: number): number {
  if (v <= 0) return 100;
  const mag = Math.pow(10, Math.floor(Math.log10(v)));
  const norm = v / mag;
  const step = norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 5 ? 5 : 10;
  return step * mag;
}

// ---------- budgets ----------

export function totalCategoryBudget(data: AppData): number {
  return Object.values(data.categoryBudgets || {}).reduce((s, v) => s + (v > 0 ? v : 0), 0);
}

// The limit is the sum of category budgets, so donut and budget list can never
// disagree; a manual monthly limit is only a fallback when no budgets exist.
export function monthlyLimitFor(data: AppData, monthKey: string): { limit: number; derived: boolean } {
  const fromCategories = totalCategoryBudget(data);
  if (fromCategories > 0) return { limit: fromCategories, derived: true };
  return { limit: data.months[monthKey]?.monthlyLimit || 0, derived: false };
}

export function spentByCategory(data: AppData, monthKey: string): Map<string, number> {
  const map = new Map<string, number>();
  for (const e of data.months[monthKey].expenses) map.set(e.category, (map.get(e.category) || 0) + e.amount);
  return map;
}

// ---------- cards ----------

export const CARD_THEMES: { id: string; colors: [string, string] }[] = [
  { id: "midnight", colors: ["#232a3b", "#0f1420"] },
  { id: "ocean", colors: ["#1e5c8f", "#0b2b45"] },
  { id: "violet", colors: ["#5b3fa8", "#241a45"] },
  { id: "ember", colors: ["#a8442a", "#3d1710"] },
  { id: "forest", colors: ["#1f6b4a", "#0c2c1f"] },
  { id: "rose", colors: ["#a3346b", "#3d1128"] },
  { id: "slate", colors: ["#4c5a6e", "#1b222e"] },
  { id: "teal", colors: ["#10726e", "#052b2a"] },
  { id: "indigo", colors: ["#3b3fa0", "#14163f"] },
  { id: "crimson", colors: ["#93203c", "#370b18"] },
  { id: "bronze", colors: ["#8a6524", "#33240a"] },
  { id: "plum", colors: ["#6d2a7a", "#260d2c"] },
];

export function cardThemeColors(card: CreditCard): [string, string] {
  return (CARD_THEMES.find((t) => t.id === card.theme) || CARD_THEMES[0]).colors;
}

export function cardTotals(card: CreditCard) {
  const payments = card.payments || [];
  const paid = payments.reduce((s, p) => s + (p.amount || 0), 0);
  const interest = payments.reduce((s, p) => s + (p.interest || 0), 0);
  const fees = payments.reduce((s, p) => s + (p.fee || 0), 0);
  const principal = paid - interest - fees;
  const owing = Math.max((card.owing || 0) - principal, 0);
  const limit = card.limit || 0;
  const available = Math.max(limit - owing, 0);
  const utilisation = limit > 0 ? owing / limit : 0;
  return { paid, interest, fees, principal, owing, limit, available, utilisation };
}

export function maskedNumber(card: CreditCard): string {
  const last4 = (card.last4 || "").replace(/\D/g, "").slice(-4);
  return last4 ? `•••• •••• •••• ${last4}` : "•••• •••• •••• ••••";
}

// ---------- savings plans / accounts / investments ----------

export interface TypeDef { id: string; label: string; icon: string }

export const SAVINGS_PLAN_TYPES: TypeDef[] = [
  { id: "emergency", label: "Emergency Fund", icon: "alert" },
  { id: "vacation", label: "Vacation / Travel", icon: "plane" },
  { id: "home", label: "Home Deposit", icon: "home" },
  { id: "vehicle", label: "Vehicle", icon: "car" },
  { id: "education", label: "Education", icon: "cap" },
  { id: "wedding", label: "Wedding", icon: "star" },
  { id: "gift", label: "Gift", icon: "gift" },
  { id: "retirement", label: "Retirement", icon: "user" },
  { id: "debt", label: "Debt Payoff", icon: "card" },
  { id: "other", label: "Other", icon: "piggy" },
];
export const BANK_ACCOUNT_TYPES: TypeDef[] = [
  { id: "checking", label: "Checking / Everyday", icon: "bank" },
  { id: "savings", label: "Savings", icon: "piggy" },
  { id: "offset", label: "Offset", icon: "home" },
  { id: "term", label: "Term Deposit", icon: "lock" },
  { id: "other", label: "Other", icon: "bank" },
];
export const INVESTMENT_TYPES: TypeDef[] = [
  { id: "etf", label: "ETF / Index Fund", icon: "trend" },
  { id: "stock", label: "Stock", icon: "bars" },
  { id: "super", label: "Super / Retirement", icon: "user" },
  { id: "crypto", label: "Crypto", icon: "coin" },
  { id: "property", label: "Property", icon: "home" },
  { id: "other", label: "Other", icon: "trend" },
];

export function typeOf(list: TypeDef[], id: string): TypeDef {
  return list.find((t) => t.id === id) || list[list.length - 1];
}

export function planTotals(plan: SavingsPlan) {
  const saved = (plan.contributions || []).reduce((s, c) => s + (c.amount || 0), 0);
  const target = plan.target || 0;
  const remaining = Math.max(target - saved, 0);
  const pct = target > 0 ? saved / target : 0;
  return { saved, target, remaining, pct };
}

export function investmentTotals(inv: Investment) {
  const costBasis = (inv.units || 0) * (inv.avgCost || 0);
  const marketValue = (inv.units || 0) * (inv.currentPrice || 0);
  const gain = marketValue - costBasis;
  const gainPct = costBasis > 0 ? gain / costBasis : 0;
  return { costBasis, marketValue, gain, gainPct };
}

export function totalNetWorth(data: AppData): number {
  const accounts = (data.bankAccounts || []).reduce((s: number, a: BankAccount) => s + (a.balance || 0), 0);
  const invest = (data.investments || []).reduce((s: number, i: Investment) => s + investmentTotals(i).marketValue, 0);
  const saved = (data.savingsPlans || []).reduce((s: number, p: SavingsPlan) => s + planTotals(p).saved, 0);
  return accounts + invest + saved;
}

// ---------- search ----------

export interface SearchFilters {
  kind: Kind | "both";
  category: string;
  from: string;
  to: string;
  text: string;
}
export type SearchMatch = Entry & { monthKey: string; kind: Kind };

export function defaultSearchFilters(data: AppData): SearchFilters {
  const all = sortedMonthKeys(data);
  const current = currentYearMonthKeys(data);
  return {
    kind: "expenses",
    category: "all",
    from: current[0] || all[0] || "",
    to: current[current.length - 1] || all[all.length - 1] || "",
    text: "",
  };
}

export function categoriesInUse(data: AppData, kind: Kind): string[] {
  const set = new Set<string>();
  for (const key of sortedMonthKeys(data)) {
    for (const e of data.months[key][kind]) if (e.category) set.add(e.category);
  }
  return [...set].sort();
}

export function runSearch(data: AppData, filters: SearchFilters) {
  const kinds: Kind[] = filters.kind === "both" ? ["expenses", "income"] : [filters.kind];
  const needle = filters.text.trim().toLowerCase();
  const matches: SearchMatch[] = [];
  const perMonth = new Map<string, number>();
  for (const key of sortedMonthKeys(data)) {
    if (filters.from && key < filters.from) continue;
    if (filters.to && key > filters.to) continue;
    for (const kind of kinds) {
      for (const e of data.months[key][kind]) {
        if (filters.category !== "all" && e.category !== filters.category) continue;
        if (needle) {
          const hay = `${e.description || ""} ${e.category || ""}`.toLowerCase();
          if (!hay.includes(needle)) continue;
        }
        matches.push({ ...e, monthKey: key, kind });
        perMonth.set(key, (perMonth.get(key) || 0) + e.amount);
      }
    }
  }
  matches.sort((a, b) => (b.date || "").localeCompare(a.date || ""));
  const total = matches.reduce((s, e) => s + e.amount, 0);
  return { matches, total, perMonth };
}

// ---------- housekeeping ----------

export function nextSuggestedMonth(data: AppData): { year: number; monthIdx: number } {
  const keys = currentYearMonthKeys(data);
  const last = keys[keys.length - 1];
  if (last) {
    const [y, m] = last.split("-").map(Number);
    return m + 1 > 12 ? { year: y + 1, monthIdx: 1 } : { year: y, monthIdx: m + 1 };
  }
  const now = new Date();
  return { year: now.getFullYear(), monthIdx: now.getMonth() + 1 };
}

export function defaultDateForMonth(monthKey: string): string {
  const [y, m] = monthKey.split("-");
  const today = new Date();
  const todayKey = today.getFullYear() + "-" + String(today.getMonth() + 1).padStart(2, "0");
  return todayKey === monthKey ? todayISO() : `${y}-${m}-01`;
}

export const DEFAULT_EXPENSE_CATEGORIES = [
  "Rent", "Groceries", "Eating Out", "Transportation", "Utilities", "Mobile Bills",
  "Health/Medical", "Entertainment", "Shopping", "Debt/Credit Card", "Gifts", "Other",
];
export const DEFAULT_INCOME_CATEGORIES = ["Paycheck", "Savings", "Other"];

export function emptyData(): AppData {
  return {
    expenseCategories: [...DEFAULT_EXPENSE_CATEGORIES],
    incomeCategories: [...DEFAULT_INCOME_CATEGORIES],
    months: {},
    historyYears: [],
    categoryBudgets: {},
    settings: { theme: "system", accent: "blue" },
    cards: [],
    bankAccounts: [],
    investments: [],
    savingsPlans: [],
  };
}

// Fills in anything an older / partial data.json might lack, without
// dropping fields this app doesn't know about.
export function normalizeData(raw: any): AppData {
  const base = emptyData();
  const d: AppData = { ...raw };
  d.expenseCategories = Array.isArray(raw.expenseCategories) ? raw.expenseCategories : base.expenseCategories;
  d.incomeCategories = Array.isArray(raw.incomeCategories) ? raw.incomeCategories : base.incomeCategories;
  d.months = raw.months && typeof raw.months === "object" ? raw.months : {};
  for (const k of Object.keys(d.months)) {
    const m = d.months[k];
    m.expenses = Array.isArray(m.expenses) ? m.expenses : [];
    m.income = Array.isArray(m.income) ? m.income : [];
    m.startingBalance = m.startingBalance || 0;
    m.label = m.label || k;
  }
  d.historyYears = Array.isArray(raw.historyYears) ? raw.historyYears : [];
  d.categoryBudgets = raw.categoryBudgets && typeof raw.categoryBudgets === "object" ? raw.categoryBudgets : {};
  d.settings = raw.settings && typeof raw.settings === "object" ? raw.settings : {};
  d.cards = Array.isArray(raw.cards) ? raw.cards : [];
  d.bankAccounts = Array.isArray(raw.bankAccounts) ? raw.bankAccounts : [];
  d.investments = Array.isArray(raw.investments) ? raw.investments : [];
  d.savingsPlans = Array.isArray(raw.savingsPlans) ? raw.savingsPlans : [];
  return d;
}

// Archives finished years and starts the current month if missing.
// Returns a message when it changed anything.
export function autoArchiveAndStartMonth(data: AppData): string | null {
  const now = new Date();
  const realYear = String(now.getFullYear());
  const historySet = new Set(data.historyYears || []);
  const activeYears = new Set(
    Object.keys(data.months).filter((k) => !historySet.has(k.split("-")[0])).map((k) => k.split("-")[0]),
  );
  let archivedYear: string | null = null;
  for (const year of activeYears) {
    if (year < realYear) { historySet.add(year); archivedYear = year; }
  }
  if (archivedYear) data.historyYears = [...historySet].sort();

  let createdMonth: string | null = null;
  const key = `${realYear}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  if (!data.months[key]) {
    data.months[key] = {
      label: `${MONTH_NAMES[now.getMonth()]} ${realYear}`,
      startingBalance: 0,
      expenses: [],
      income: [],
    };
    createdMonth = data.months[key].label;
  }
  if (archivedYear && createdMonth) return `${archivedYear} moved to History — started ${createdMonth}`;
  if (archivedYear) return `${archivedYear} moved to History`;
  if (createdMonth) return `Started ${createdMonth}`;
  return null;
}

export function isCategoryInUse(data: AppData, key: "expenseCategories" | "incomeCategories", cat: string): boolean {
  const kind: Kind = key === "expenseCategories" ? "expenses" : "income";
  return sortedMonthKeys(data).some((mk) => data.months[mk][kind].some((e) => e.category === cat));
}
