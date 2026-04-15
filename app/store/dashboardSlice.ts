import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { CategoryRow, ExpenseRow } from "@/app/lib/expenses.shared";

export type DashboardState = {
  optimisticExpenses: ExpenseRow[];
  error: string | null;

  confirmDeleteId: string | null;
  confirmDeleteLabel: string;

  showCreateCategory: boolean;
  newCategoryName: string;
  showManageCategories: boolean;
  categoryChecks: Record<string, boolean>;

  from: string;
  to: string;

  selectedCategoryId: string;
  prevSelectedCategoryId: string;
};

const initialState: DashboardState = {
  optimisticExpenses: [],
  error: null,

  confirmDeleteId: null,
  confirmDeleteLabel: "",

  showCreateCategory: false,
  newCategoryName: "",
  showManageCategories: false,
  categoryChecks: {},

  from: "",
  to: "",

  selectedCategoryId: "",
  prevSelectedCategoryId: "",
};

function computeNextSelection(
  categories: CategoryRow[],
  selectedCategoryId: string
) {
  if (categories.length === 0) return { selectedCategoryId: "", prevSelectedCategoryId: "" };
  const stillExists = categories.some((c) => c.id === selectedCategoryId);
  const nextId = stillExists ? selectedCategoryId : categories[0].id;
  return { selectedCategoryId: nextId, prevSelectedCategoryId: nextId };
}

export const dashboardSlice = createSlice({
  name: "dashboard",
  initialState,
  reducers: {
    hydrateFromServer: (
      state,
      action: PayloadAction<{
        initialExpenses: ExpenseRow[];
        categories: CategoryRow[];
        initialFrom: string;
        initialTo: string;
      }>
    ) => {
      const { initialExpenses, categories, initialFrom, initialTo } = action.payload;

      state.optimisticExpenses = initialExpenses;
      state.from = initialFrom;
      state.to = initialTo;

      const nextChecks: Record<string, boolean> = {};
      for (const c of categories) nextChecks[c.id] = true;
      state.categoryChecks = nextChecks;

      const nextSel = computeNextSelection(categories, state.selectedCategoryId);
      state.selectedCategoryId = nextSel.selectedCategoryId;
      state.prevSelectedCategoryId = nextSel.prevSelectedCategoryId;
    },

    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },

    setOptimisticExpenses: (state, action: PayloadAction<ExpenseRow[]>) => {
      state.optimisticExpenses = action.payload;
    },
    prependOptimisticExpense: (state, action: PayloadAction<ExpenseRow>) => {
      state.optimisticExpenses = [action.payload, ...state.optimisticExpenses];
    },
    removeOptimisticExpenseById: (state, action: PayloadAction<string>) => {
      state.optimisticExpenses = state.optimisticExpenses.filter((e) => e.id !== action.payload);
    },

    openConfirmDelete: (
      state,
      action: PayloadAction<{ id: string; label: string }>
    ) => {
      state.confirmDeleteId = action.payload.id;
      state.confirmDeleteLabel = action.payload.label;
    },
    closeConfirmDelete: (state) => {
      state.confirmDeleteId = null;
    },

    openCreateCategory: (state) => {
      state.showCreateCategory = true;
    },
    closeCreateCategory: (state) => {
      state.showCreateCategory = false;
    },
    setNewCategoryName: (state, action: PayloadAction<string>) => {
      state.newCategoryName = action.payload;
    },

    openManageCategories: (state) => {
      state.showManageCategories = true;
    },
    closeManageCategories: (state) => {
      state.showManageCategories = false;
    },

    setCategoryCheck: (
      state,
      action: PayloadAction<{ id: string; checked: boolean }>
    ) => {
      state.categoryChecks[action.payload.id] = action.payload.checked;
    },

    setFrom: (state, action: PayloadAction<string>) => {
      state.from = action.payload;
    },
    setTo: (state, action: PayloadAction<string>) => {
      state.to = action.payload;
    },

    setSelectedCategoryId: (state, action: PayloadAction<string>) => {
      state.selectedCategoryId = action.payload;
    },
    setPrevSelectedCategoryId: (state, action: PayloadAction<string>) => {
      state.prevSelectedCategoryId = action.payload;
    },
  },
});

export const dashboardActions = dashboardSlice.actions;
export const dashboardReducer = dashboardSlice.reducer;

