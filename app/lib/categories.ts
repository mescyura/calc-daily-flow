import "server-only";

import type { CategoryRow } from "@/app/lib/expenses.shared";
import { EXPENSE_CATEGORIES } from "@/app/lib/expenses.shared";
import { getSupabaseClerkClient } from "@/app/lib/supabaseAdmin";
import { auth } from "@clerk/nextjs/server";

async function getSupabaseForCurrentUser() {
  const { userId, getToken } = await auth();
  if (!userId) throw new Error("Not authenticated");
  const token = await getToken();
  if (!token) throw new Error("Missing Clerk session token.");
  return { userId, supabase: getSupabaseClerkClient(token) };
}

export async function listCategories(): Promise<CategoryRow[]> {
  const { userId, supabase } = await getSupabaseForCurrentUser();
  const { data, error } = await supabase
    .from("categories")
    .select("id,user_id,name,created_at")
    .order("created_at", { ascending: true });
  if (error) throw error;
  return ((data ?? []) as CategoryRow[]).filter((c) => c.user_id === userId);
}

export async function ensureDefaultCategories(): Promise<void> {
  const { supabase } = await getSupabaseForCurrentUser();
  const { count, error } = await supabase
    .from("categories")
    .select("id", { count: "exact", head: true });
  if (error) throw error;
  if ((count ?? 0) > 0) return;

  const { error: insertError } = await supabase.from("categories").insert(
    EXPENSE_CATEGORIES.map((name) => ({ name }))
  );
  if (insertError) throw insertError;
}

export async function createCategory(name: string): Promise<CategoryRow> {
  const clean = name.trim();
  if (!clean) throw new Error("Category name is required");
  if (clean.length > 40) throw new Error("Category name is too long");

  const { supabase } = await getSupabaseForCurrentUser();
  const { data, error } = await supabase
    .from("categories")
    .insert({ name: clean })
    .select("id,user_id,name,created_at")
    .single();
  if (error) throw error;
  return data as CategoryRow;
}

export async function deleteCategories(ids: string[]): Promise<void> {
  const uniq = Array.from(new Set(ids)).filter(Boolean);
  if (uniq.length === 0) return;
  const { supabase } = await getSupabaseForCurrentUser();
  const { error } = await supabase.from("categories").delete().in("id", uniq);
  if (error) throw error;
}

