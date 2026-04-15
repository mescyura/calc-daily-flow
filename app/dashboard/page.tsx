import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { ExpensesPanel } from "../../components/ExpensesPanel";

export const dynamic = "force-dynamic";

export default async function DashboardPage(props: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const sp = (await props.searchParams) ?? {};
  const from = Array.isArray(sp.from) ? sp.from[0] : sp.from;
  const to = Array.isArray(sp.to) ? sp.to[0] : sp.to;

  return (
    <div className="flex w-full flex-1 flex-col gap-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Дашборд</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Додавайте витрати і слідкуйте за розподілом по категоріях.
        </p>
      </header>

      <ExpensesPanel from={from} to={to} />
    </div>
  );
}

