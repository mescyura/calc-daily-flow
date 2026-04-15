import { auth, currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

import { ExpensesPanel } from '../../components/ExpensesPanel';
import { MotionDiv, itemFadeUp, staggerContainer } from '@/components/Motion';

export const dynamic = 'force-dynamic';

export default async function DashboardPage(props: {
	searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
	const { userId } = await auth();
	const user = await currentUser();
	if (!userId) redirect('/sign-in');

	const sp = (await props.searchParams) ?? {};
	const from = Array.isArray(sp.from) ? sp.from[0] : sp.from;
	const to = Array.isArray(sp.to) ? sp.to[0] : sp.to;

	return (
		<MotionDiv
			className='flex w-full flex-1 flex-col gap-6'
			variants={staggerContainer}
			initial='initial'
			animate='animate'
		>
			<MotionDiv variants={itemFadeUp}>
				<header className='rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm ring-1 ring-black/5 dark:border-zinc-800 dark:bg-zinc-950 dark:ring-white/10 sm:p-8'>
				<div className='flex flex-wrap items-start justify-between gap-3'>
					<div className='min-w-0'>
						<div className='flex flex-wrap items-center gap-2'>
							
							<p className='text-sm text-zinc-600 dark:text-zinc-400'>
								З поверненням,{' '}
								<span className='font-medium text-zinc-900 dark:text-zinc-50'>
									{user?.firstName ?? user?.emailAddresses[0].emailAddress}
								</span>
								! 👋
							</p>
						</div>
						<h1 className='mt-3 text-2xl font-semibold tracking-tight sm:text-3xl'>
							Ваш Дашборд
						</h1>
						<p className='mt-2 max-w-2xl text-sm leading-6 text-zinc-600 dark:text-zinc-400 sm:text-base sm:leading-7'>
							Додавайте витрати і слідкуйте за розподілом по категоріях.
						</p>
					</div>
				</div>
				</header>
			</MotionDiv>

			<MotionDiv variants={itemFadeUp}>
				<ExpensesPanel from={from} to={to} />
			</MotionDiv>
		</MotionDiv>
	);
}
