import "server-only";
import { auth } from "@clerk/nextjs/server";

import type { ExpenseRow } from "@/app/lib/expenses.shared";
import { getSupabaseClerkClient } from "@/app/lib/supabaseAdmin";

async function getSupabaseForCurrentUser() {
  const { userId, getToken } = await auth();
  if (!userId) throw new Error("Not authenticated");

  // Supabase third-party auth provider for Clerk accepts Clerk session tokens directly.
  const token = await getToken();
  if (!token) {
    throw new Error("Missing Clerk session token. Please sign in and retry.");
  }
  return { userId, supabase: getSupabaseClerkClient(token) };
}

export async function listExpenses(params?: {
  limit?: number;
  from?: string;
  to?: string;
}): Promise<ExpenseRow[]> {
  const { userId, supabase } = await getSupabaseForCurrentUser();

  const limit = params?.limit ?? 50;
  const from = params?.from;
  const to = params?.to;

  let query = supabase
    .from("expenses")
    .select(
      "id,user_id,category_id,amount,note,spent_at,created_at,categories(name)"
    )
    .order("spent_at", { ascending: false })
    .order("created_at", { ascending: false });

  if (from) query = query.gte("spent_at", from);
  if (to) query = query.lte("spent_at", to);

  const { data, error } = await query.limit(limit);

  if (error) throw error;
  // RLS should already scope rows to the current user.
  return (data ?? [])
    .map((r: any) => ({
      id: r.id,
      user_id: r.user_id,
      category_id: r.category_id,
      category_name: r.categories?.name ?? "—",
      amount: Number(r.amount),
      note: r.note,
      spent_at: r.spent_at,
      created_at: r.created_at,
    }))
    .filter((r: ExpenseRow) => r.user_id === userId);
}

export async function addExpense(input: {
  amount: number;
  categoryId: string;
  spentAt: string;
  note?: string;
}): Promise<void> {
  const { supabase } = await getSupabaseForCurrentUser();
  const { error } = await supabase.from("expenses").insert({
    amount: input.amount,
    category_id: input.categoryId,
    spent_at: input.spentAt,
    note: input.note ?? null,
  });

  if (error) throw error;
}

export async function deleteExpense(id: string): Promise<void> {
  const { supabase } = await getSupabaseForCurrentUser();
  const { error } = await supabase.from("expenses").delete().eq("id", id);

  if (error) throw error;
}

