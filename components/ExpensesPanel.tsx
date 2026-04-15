import { revalidatePath } from "next/cache";

import {
  addExpense,
  deleteExpense,
  listExpenses,
} from "@/app/lib/expenses";
import {
  createCategory,
  deleteCategories,
  ensureDefaultCategories,
  listCategories,
} from "@/app/lib/categories";
import { ExpensesPanelClient } from "@/components/ExpensesPanelClient";

export async function ExpensesPanel(props: { from?: string; to?: string }) {
  await ensureDefaultCategories();
  const categories = await listCategories();
  const expenses = await listExpenses({ limit: 200, from: props.from, to: props.to });

  async function addExpenseAction(formData: FormData) {
    "use server";
    const amount = Number(formData.get("amount"));
    const categoryId = String(formData.get("category_id"));
    const spentAt = String(formData.get("spent_at"));
    const note = String(formData.get("note") ?? "");

    if (!Number.isFinite(amount) || amount <= 0) {
      throw new Error("Invalid amount");
    }
    if (!spentAt) {
      throw new Error("Missing date");
    }
    if (!categoryId) {
      throw new Error("Missing category");
    }

    await addExpense({
      amount,
      categoryId,
      spentAt,
      note,
    });
    revalidatePath("/dashboard");
  }

  async function deleteExpenseAction(formData: FormData) {
    "use server";
    const id = String(formData.get("id"));
    await deleteExpense(id);
    revalidatePath("/dashboard");
  }

  async function createCategoryAction(formData: FormData) {
    "use server";
    const name = String(formData.get("name") ?? "");
    const created = await createCategory(name);
    revalidatePath("/dashboard");
    return created;
  }

  async function deleteCategoriesAction(formData: FormData) {
    "use server";
    const ids = formData.getAll("ids").map((v) => String(v));
    await deleteCategories(ids);
    revalidatePath("/dashboard");
  }

  return (
    <ExpensesPanelClient
      initialExpenses={expenses}
      categories={categories}
      initialFrom={props.from ?? ""}
      initialTo={props.to ?? ""}
      addExpenseAction={addExpenseAction}
      deleteExpenseAction={deleteExpenseAction}
      createCategoryAction={createCategoryAction}
      deleteCategoriesAction={deleteCategoriesAction}
    />
  );
}

