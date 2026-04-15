export const EXPENSE_CATEGORIES = [
  "Продукти",
  "Транспорт",
  "Житло",
  "Здоровʼя",
  "Розваги",
  "Освіта",
  "Подарунки",
  "Інше",
] as const;

export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];

export type CategoryRow = {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
};

export type ExpenseRow = {
  id: string;
  user_id: string;
  category_id: string;
  category_name: string;
  amount: number;
  note: string | null;
  spent_at: string; // ISO date (yyyy-mm-dd)
  created_at: string;
};

