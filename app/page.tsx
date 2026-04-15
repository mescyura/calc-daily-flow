import Link from 'next/link';
import Image from 'next/image';
import { Show, SignInButton, SignUpButton } from '@clerk/nextjs';
import {
	MotionDiv,
	MotionSection,
	itemFadeUp,
	pageVariants,
	staggerContainer,
} from '@/components/Motion';

export default function Home() {
	return (
		<MotionDiv
			className='flex w-full flex-1 flex-col gap-8'
			variants={pageVariants}
			initial='initial'
			animate='animate'
			exit='exit'
		>
			<MotionSection
				className='rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 sm:p-8'
				variants={staggerContainer}
				initial='initial'
				animate='animate'
			>
				<div className='grid gap-6 lg:grid-cols-[minmax(0,1fr)_420px] lg:items-center'>
					<div className='min-w-0'>
						<MotionDiv variants={itemFadeUp}>
							<h1 className='text-2xl font-semibold tracking-tight sm:text-3xl'>
								Облік витрат по категоріях
							</h1>
						</MotionDiv>
						<MotionDiv variants={itemFadeUp}>
							<p className='mt-2 max-w-2xl text-sm leading-6 text-zinc-600 dark:text-zinc-400 sm:text-base sm:leading-7'>
								Додавайте витрати, дивіться загальну суму за період і діаграму
								розподілу по категоріях.
							</p>
						</MotionDiv>

						<MotionDiv variants={itemFadeUp}>
							<div className='my-4 rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950'>
								<div className='flex flex-wrap items-center justify-between gap-2'>
									<div className='text-sm font-semibold'>Як це працює</div>
									<span className='inline-flex select-none items-center rounded-full border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-xs font-semibold text-zinc-700 dark:border-zinc-800 dark:bg-black dark:text-zinc-200'>
										3 кроки
									</span>
								</div>

								<div className='mt-4 grid gap-2 text-sm text-zinc-600 dark:text-zinc-400'>
									{[
										{
											title: '1) Додай витрату',
											detail: 'Сума • Дата • Категорія',
										},
										{
											title: '2) Обери період',
											detail: 'ДД.ММ.РРРР',
										},
										{
											title: '3) Переглянь дашборд',
											detail: 'Сума + діаграма',
										},
									].map(s => (
										<div
											key={s.title}
											className='rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-zinc-800 dark:bg-black'
										>
											<div className='flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-3'>
												<div className='font-medium text-zinc-900 dark:text-zinc-50'>
													{s.title}
												</div>
												<div className='text-sm text-zinc-600 dark:text-zinc-400 sm:text-right'>
													{s.detail}
												</div>
											</div>
										</div>
									))}
								</div>
							</div>
						</MotionDiv>
						<Show  when='signed-in'>
							<Link
								className='inline-flex w-full items-center justify-center rounded-full bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-white dark:text-black dark:hover:bg-zinc-200 sm:w-auto'
								href='/dashboard'
							>
								Перейти на дашборд
							</Link>
						</Show>
					</div>

					<MotionDiv variants={itemFadeUp}>
						<div className='relative'>
							<div className='pointer-events-none absolute -inset-6 rounded-[28px] bg-linear-to-tr from-sky-500/15 via-emerald-500/10 to-fuchsia-500/15 blur-2xl dark:from-sky-400/10 dark:via-emerald-400/10 dark:to-fuchsia-400/10' />
							<div className='relative overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-sm ring-1 ring-black/5 dark:border-zinc-800 dark:bg-zinc-950 dark:ring-white/10'>
								<Image
									src='https://images.unsplash.com/photo-1772588627354-ca3617853217?auto=format&fit=crop&w=1600&q=80'
									alt='Expense tracking on desk'
									width={1600}
									height={1000}
									className='h-[240px] w-full object-cover sm:h-[280px] lg:h-[420px]'
									priority
								/>
								<div className='absolute inset-x-0 bottom-0 h-24 bg-linear-to-t from-white/85 to-transparent dark:from-zinc-950/75' />
								<div className='absolute bottom-4 left-4 right-4'>
									<div className='inline-flex items-center gap-2 rounded-full border border-white/40 bg-white/70 px-3 py-1 text-xs font-semibold text-zinc-800 shadow-sm backdrop-blur dark:border-zinc-800/60 dark:bg-zinc-950/60 dark:text-zinc-100'>
										Calc DailyFlow 
									</div>
								</div>
							</div>
						</div>
					</MotionDiv>
				</div>
			</MotionSection>

			<MotionSection
				className='grid gap-4 md:grid-cols-3'
				variants={staggerContainer}
				initial='initial'
				animate='animate'
			>
				<div className='md:col-span-3 flex items-center justify-between gap-3'>
					<div className='inline-flex items-center gap-2'>
						<span className='inline-flex select-none items-center rounded-full border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-xs font-semibold text-zinc-700 dark:border-zinc-800 dark:bg-black dark:text-zinc-200'>
							Функціонал дашборду
						</span>
					</div>
				</div>

				<MotionDiv
					className='rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950'
					variants={itemFadeUp}
					whileHover={{ y: -2 }}
				>
					<div className='text-sm font-semibold'>Категорії</div>
					<div className='mt-1 text-sm text-zinc-600 dark:text-zinc-400'>
						Продукти, транспорт, житло, здоровʼя, розваги та інші.
					</div>
					<div className='mt-4 flex flex-wrap gap-2'>
						{['Продукти', 'Транспорт', 'Житло', 'Здоровʼя', 'Розваги'].map(
							x => (
								<span
									key={x}
									className='inline-flex items-center rounded-full border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-xs font-medium text-zinc-700 dark:border-zinc-800 dark:bg-black dark:text-zinc-200'
								>
									{x}
								</span>
							),
						)}
						<span className='inline-flex items-center rounded-full border border-zinc-200 bg-white px-2.5 py-1 text-xs font-medium text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400'>
							+ нова…
						</span>
					</div>
				</MotionDiv>

				<MotionDiv
					className='rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950'
					variants={itemFadeUp}
					whileHover={{ y: -2 }}
				>
					<div className='text-sm font-semibold'>Сума</div>
					<div className='mt-1 text-sm text-zinc-600 dark:text-zinc-400'>
						Автоматично рахуємо загальну суму витрат за вибраний період.
					</div>
					<div className='mt-4 rounded-2xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-black'>
						<div className='text-xs font-medium text-zinc-500 dark:text-zinc-400'>
							Всього за період
						</div>
						<div className='mt-1 text-2xl font-semibold tracking-tight'>
							8&nbsp;788,10&nbsp;₴
						</div>
						<div className='mt-3 grid grid-cols-2 gap-2 text-xs text-zinc-600 dark:text-zinc-400'>
							<div className='flex items-center justify-between rounded-xl border border-zinc-200 bg-white px-3 py-2 dark:border-zinc-800 dark:bg-zinc-950'>
								<span>Від</span>
								<span className='font-medium text-zinc-900 dark:text-zinc-50'>
									2026-04-01
								</span>
							</div>
							<div className='flex items-center justify-between rounded-xl border border-zinc-200 bg-white px-3 py-2 dark:border-zinc-800 dark:bg-zinc-950'>
								<span>До</span>
								<span className='font-medium text-zinc-900 dark:text-zinc-50'>
									2026-04-15
								</span>
							</div>
						</div>
					</div>
				</MotionDiv>

				<MotionDiv
					className='rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950'
					variants={itemFadeUp}
					whileHover={{ y: -2 }}
				>
					<div className='text-sm font-semibold'>Діаграма</div>
					<div className='mt-1 text-sm text-zinc-600 dark:text-zinc-400'>
						Пай-чарт показує розподіл витрат по категоріях.
					</div>

					<div className='mt-4 flex items-center gap-4'>
						<div className='relative grid h-24 w-24 place-items-center rounded-full bg-zinc-50 ring-1 ring-zinc-200 dark:bg-black dark:ring-zinc-800'>
							<div className='h-20 w-20 rounded-full bg-[conic-gradient(#0ea5e9_0_40%,#22c55e_40%_62%,#f97316_62%_78%,#a855f7_78%_100%)] dark:bg-[conic-gradient(#0ea5e9_0_40%,#22c55e_40%_62%,#f97316_62%_78%,#a855f7_78%_100%)]' />
							<div className='absolute grid h-12 w-12 place-items-center rounded-full bg-white text-xs font-semibold text-zinc-900 ring-1 ring-zinc-200 dark:bg-zinc-950 dark:text-zinc-50 dark:ring-zinc-800'>
								100%
							</div>
						</div>

						<div className='min-w-0 flex-1 space-y-2 text-xs'>
							{[
								{ name: 'Продукти', v: '40%' },
								{ name: 'Транспорт', v: '22%' },
								{ name: 'Житло', v: '16%' },
								{ name: 'Інше', v: '22%' },
							].map(r => (
								<div
									key={r.name}
									className='flex items-center justify-between gap-3'
								>
									<div className='truncate text-zinc-700 dark:text-zinc-300'>
										{r.name}
									</div>
									<div className='font-medium text-zinc-900 dark:text-zinc-50'>
										{r.v}
									</div>
								</div>
							))}
						</div>
					</div>
				</MotionDiv>
			</MotionSection>
		</MotionDiv>
	);
}
