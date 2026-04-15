'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useRef, useTransition } from 'react';

import { ExpenseChart, type ChartDatum } from '@/components/ExpenseChart';
import type { CategoryRow, ExpenseRow } from '@/app/lib/expenses.shared';
import {
	MotionDiv,
	itemFadeUp,
	pageVariants,
	staggerContainer,
} from '@/components/Motion';
import { Modal } from '@/components/Modal';
import { useAppDispatch, useAppSelector } from '@/app/store/hooks';
import { dashboardActions } from '@/app/store/dashboardSlice';

function formatMoney(amount: number) {
	return new Intl.NumberFormat('uk-UA', {
		style: 'currency',
		currency: 'UAH',
		currencyDisplay: 'narrowSymbol',
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	}).format(amount);
}

export function ExpensesPanelClient(props: {
	initialExpenses: ExpenseRow[];
	categories: CategoryRow[];
	initialFrom: string;
	initialTo: string;
	addExpenseAction: (formData: FormData) => Promise<void>;
	deleteExpenseAction: (formData: FormData) => Promise<void>;
	createCategoryAction: (formData: FormData) => Promise<CategoryRow>;
	deleteCategoriesAction: (formData: FormData) => Promise<void>;
}) {
	const router = useRouter();
	const searchParams = useSearchParams();
	const dispatch = useAppDispatch();
	const optimisticExpenses = useAppSelector(
		s => s.dashboard.optimisticExpenses,
	);
	const [pending, startTransition] = useTransition();
	const error = useAppSelector(s => s.dashboard.error);
	const confirmDeleteId = useAppSelector(s => s.dashboard.confirmDeleteId);
	const confirmDeleteLabel = useAppSelector(
		s => s.dashboard.confirmDeleteLabel,
	);
	const showCreateCategory = useAppSelector(
		s => s.dashboard.showCreateCategory,
	);
	const newCategoryName = useAppSelector(s => s.dashboard.newCategoryName);
	const [creatingCategory, startCreatingCategory] = useTransition();
	const showManageCategories = useAppSelector(
		s => s.dashboard.showManageCategories,
	);
	const categoryChecks = useAppSelector(s => s.dashboard.categoryChecks);
	const [savingCategories, startSavingCategories] = useTransition();
	const from = useAppSelector(s => s.dashboard.from);
	const to = useAppSelector(s => s.dashboard.to);
	const selectedCategoryId = useAppSelector(
		s => s.dashboard.selectedCategoryId,
	);
	const prevSelectedCategoryId = useAppSelector(
		s => s.dashboard.prevSelectedCategoryId,
	);
	const fromRef = useRef<HTMLInputElement | null>(null);
	const toRef = useRef<HTMLInputElement | null>(null);
	const createSpentAtRef = useRef<HTMLInputElement | null>(null);

	useEffect(() => {
		dispatch(
			dashboardActions.hydrateFromServer({
				initialExpenses: props.initialExpenses,
				categories: props.categories,
				initialFrom: props.initialFrom,
				initialTo: props.initialTo,
			}),
		);
	}, [
		dispatch,
		props.categories,
		props.initialExpenses,
		props.initialFrom,
		props.initialTo,
	]);

	useEffect(() => {
		const anyModalOpen = Boolean(
			confirmDeleteId || showCreateCategory || showManageCategories,
		);
		if (!anyModalOpen) return;
		function onKeyDown(e: KeyboardEvent) {
			if (e.key !== 'Escape') return;
			if (confirmDeleteId) dispatch(dashboardActions.closeConfirmDelete());
			else if (showCreateCategory) {
				dispatch(dashboardActions.closeCreateCategory());
				dispatch(
					dashboardActions.setSelectedCategoryId(prevSelectedCategoryId),
				);
			} else if (showManageCategories)
				dispatch(dashboardActions.closeManageCategories());
		}
		window.addEventListener('keydown', onKeyDown);
		return () => window.removeEventListener('keydown', onKeyDown);
	}, [
		confirmDeleteId,
		prevSelectedCategoryId,
		showCreateCategory,
		showManageCategories,
	]);

	const totals = useMemo(() => {
		const total = optimisticExpenses.reduce((sum, e) => sum + e.amount, 0);
		const byCategory = new Map<string, number>();
		for (const e of optimisticExpenses) {
			byCategory.set(
				e.category_name,
				(byCategory.get(e.category_name) ?? 0) + e.amount,
			);
		}
		const chartData: ChartDatum[] = Array.from(byCategory.entries())
			.map(([name, value]) => ({ name, value }))
			.sort((a, b) => b.value - a.value);

		return { total, chartData };
	}, [optimisticExpenses]);

	const expenseRange = useMemo(() => {
		let min: string | null = null;
		let max: string | null = null;
		for (const e of optimisticExpenses) {
			const d = e.spent_at;
			if (!d) continue;
			if (min === null || d < min) min = d;
			if (max === null || d > max) max = d;
		}
		return { from: min, to: max };
	}, [optimisticExpenses]);

	async function onAdd(formData: FormData) {
		dispatch(dashboardActions.setError(null));

		const rawAmount = String(formData.get('amount') ?? '').trim();
		const amount = Number(rawAmount);
		const categoryId = String(formData.get('category_id'));
		const categoryName =
			props.categories.find(c => c.id === categoryId)?.name ?? '—';
		const spentAt = String(formData.get('spent_at'));
		const note = String(formData.get('note') ?? '').trim();

		if (!Number.isFinite(amount) || amount <= 0) {
			dispatch(dashboardActions.setError('Сума має бути числом більше 0.'));
			return;
		}
		if (!spentAt) {
			dispatch(dashboardActions.setError('Оберіть дату.'));
			return;
		}
		if (!categoryId) {
			dispatch(dashboardActions.setError('Оберіть категорію.'));
			return;
		}

		const optimistic: ExpenseRow = {
			id: `optimistic_${crypto.randomUUID()}`,
			user_id: 'me',
			amount,
			category_id: categoryId,
			category_name: categoryName,
			note: note.length ? note : null,
			spent_at: spentAt,
			created_at: new Date().toISOString(),
		};

		dispatch(dashboardActions.prependOptimisticExpense(optimistic));

		startTransition(async () => {
			try {
				await props.addExpenseAction(formData);
			} catch (e) {
				dispatch(dashboardActions.removeOptimisticExpenseById(optimistic.id));
				dispatch(
					dashboardActions.setError(
						e instanceof Error ? e.message : 'Не вдалося додати витрату.',
					),
				);
			}
		});
	}

	function onDelete(id: string) {
		dispatch(dashboardActions.setError(null));
		const prev = optimisticExpenses;
		dispatch(dashboardActions.removeOptimisticExpenseById(id));

		const fd = new FormData();
		fd.set('id', id);

		startTransition(async () => {
			try {
				await props.deleteExpenseAction(fd);
			} catch (e) {
				dispatch(dashboardActions.setOptimisticExpenses(prev));
				dispatch(
					dashboardActions.setError(
						e instanceof Error ? e.message : 'Не вдалося видалити витрату.',
					),
				);
			}
		});
	}

	return (
		<MotionDiv
			className='grid gap-6 md:grid-cols-5'
			variants={pageVariants}
			initial='initial'
			animate='animate'
			exit='exit'
		>
			<Modal
				open={Boolean(confirmDeleteId)}
				onClose={() => dispatch(dashboardActions.closeConfirmDelete())}
			>
				<div className='flex items-start justify-between gap-3'>
					<div>
						<div className='text-sm font-semibold'>Видалити запис?</div>
						<div className='mt-1 text-sm text-zinc-600 dark:text-zinc-400'>
							{confirmDeleteLabel || 'Цю дію не можна скасувати.'}
						</div>
					</div>
					<button
						type='button'
						className='cursor-pointer rounded-lg px-2 py-1 text-sm text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-50'
						onClick={() => dispatch(dashboardActions.closeConfirmDelete())}
						aria-label='Закрити'
					>
						✕
					</button>
				</div>

				<div className='mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end'>
					<button
						type='button'
						className='cursor-pointer rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-sm font-medium shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-zinc-50 hover:shadow-md active:translate-y-0 dark:border-zinc-700 dark:bg-black dark:hover:bg-zinc-900'
						onClick={() => dispatch(dashboardActions.closeConfirmDelete())}
						disabled={pending}
					>
						Скасувати
					</button>
					<button
						type='button'
						className='cursor-pointer rounded-xl bg-red-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm ring-1 ring-red-700/30 transition-all duration-200 hover:-translate-y-0.5 hover:bg-red-500 hover:shadow-md active:translate-y-0 disabled:opacity-60'
						onClick={() => {
							const id = confirmDeleteId;
							if (!id) return;
							dispatch(dashboardActions.closeConfirmDelete());
							onDelete(id);
						}}
						disabled={pending}
					>
						Видалити
					</button>
				</div>
			</Modal>

			<MotionDiv
				className='md:col-span-3 rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm ring-1 ring-black/5 cdf-animate-in dark:border-zinc-800 dark:bg-zinc-950 dark:ring-white/10'
				variants={staggerContainer}
				initial='initial'
				animate='animate'
			>
				<div className='flex flex-col gap-1'>
					<div className='text-sm font-semibold'>Додати витрату</div>
				</div>

				<form
					action={formData => onAdd(formData)}
					className='mt-4 grid gap-3 sm:grid-cols-6'
				>
					<label className='sm:col-span-2'>
						<div className='text-xs font-medium text-zinc-600 dark:text-zinc-400'>
							Сума, ₴
						</div>
						<input
							name='amount'
							type='text'
							inputMode='numeric'
							pattern='[0-9]*'
							className='mt-1 w-full appearance-none rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm shadow-sm outline-none ring-1 ring-transparent transition-all duration-200 focus:border-zinc-400 focus:ring-black/10 dark:border-zinc-700 dark:bg-black dark:focus:border-zinc-600 dark:focus:ring-white/10'
							placeholder='0.00'
							required
							disabled={pending}
							onInput={e => {
								e.currentTarget.value = e.currentTarget.value.replace(
									/[^0-9]/g,
									'',
								);
							}}
						/>
					</label>

					<label className='sm:col-span-2'>
						<div className='text-xs font-medium text-zinc-600 dark:text-zinc-400'>
							Категорія
						</div>
						<div className='mt-1 flex min-w-0 flex-col gap-2 sm:flex-row'>
							<select
								name='category_id'
								className='w-full min-w-0 rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm shadow-sm outline-none ring-1 ring-transparent transition-all duration-200 focus:border-zinc-400 focus:ring-black/10 dark:border-zinc-700 dark:bg-black dark:focus:border-zinc-600 dark:focus:ring-white/10'
								required
								value={selectedCategoryId}
								disabled={pending || creatingCategory}
								onChange={e => {
									const v = e.target.value;
									if (v === '__new__') {
										dispatch(
											dashboardActions.setPrevSelectedCategoryId(
												selectedCategoryId,
											),
										);
										dispatch(dashboardActions.openCreateCategory());
										return;
									}
									dispatch(dashboardActions.setSelectedCategoryId(v));
								}}
							>
								{props.categories.map(c => (
									<option key={c.id} value={c.id}>
										{c.name}
									</option>
								))}
								<option value='__new__'>+ Нова категорія…</option>
							</select>
							<button
								type='button'
								className='w-full shrink-0 rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm font-medium shadow-sm transition-all duration-200 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-black dark:hover:bg-zinc-900 sm:w-auto'
								onClick={() =>
									dispatch(dashboardActions.openManageCategories())
								}
								disabled={pending || creatingCategory}
								title='Керувати категоріями'
							>
								−
							</button>
						</div>
					</label>

					<label className='sm:col-span-2'>
						<div className='text-xs font-medium text-zinc-600 dark:text-zinc-400'>
							Дата
						</div>
						<div className='relative mt-1'>
							<input
								ref={createSpentAtRef}
								name='spent_at'
								type='date'
								className='w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 pr-10 text-sm shadow-sm outline-none ring-1 ring-transparent transition-all duration-200 focus:border-zinc-400 focus:ring-black/10 dark:border-zinc-700 dark:bg-black dark:focus:border-zinc-600 dark:focus:ring-white/10'
								required
								defaultValue={new Date().toISOString().slice(0, 10)}
								disabled={pending}
							/>
							<button
								type='button'
								className='cursor-pointer absolute inset-y-0 right-0 my-auto mr-2 grid h-8 w-8 place-items-center rounded-lg text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-900 dark:hover:text-zinc-50'
								onClick={() => {
									const el = createSpentAtRef.current;
									if (!el) return;
									// eslint-disable-next-line @typescript-eslint/no-explicit-any
									const anyEl = el as any;
									if (typeof anyEl.showPicker === 'function')
										anyEl.showPicker();
									else el.focus();
								}}
								aria-label='Вибрати дату витрати'
							>
								<svg
									viewBox='0 0 24 24'
									width='18'
									height='18'
									fill='none'
									stroke='currentColor'
									strokeWidth='2'
									strokeLinecap='round'
									strokeLinejoin='round'
									aria-hidden='true'
								>
									<rect x='3' y='4' width='18' height='18' rx='3' />
									<path d='M16 2v4M8 2v4' />
									<path d='M3 10h18' />
								</svg>
							</button>
						</div>
					</label>

					<label className='sm:col-span-4'>
						<div className='text-xs font-medium text-zinc-600 dark:text-zinc-400'>
							Нотатка (необовʼязково)
						</div>
						<input
							name='note'
							type='text'
							className='mt-1 w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm shadow-sm outline-none ring-1 ring-transparent transition-all duration-200 focus:border-zinc-400 focus:ring-black/10 dark:border-zinc-700 dark:bg-black dark:focus:border-zinc-600 dark:focus:ring-white/10'
							placeholder='Напр. АТБ, таксі, абонемент…'
							disabled={pending}
						/>
					</label>

					<div className='sm:col-span-2 flex items-end'>
						<button
							type='submit'
							className='cursor-pointer w-full rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white shadow-sm ring-1 ring-black/10 transition-all duration-200 hover:-translate-y-0.5 hover:bg-zinc-800 hover:shadow-md active:translate-y-0 disabled:opacity-60 dark:bg-white dark:text-black dark:ring-white/10 dark:hover:bg-zinc-200'
							disabled={pending}
						>
							Додати
						</button>
					</div>
				</form>

				<Modal
					open={showManageCategories}
					onClose={() => dispatch(dashboardActions.closeManageCategories())}
				>
					<div className='flex items-start justify-between gap-3'>
						<div>
							<div className='text-sm font-semibold'>Категорії</div>
							<div className='mt-1 text-sm text-zinc-600 dark:text-zinc-400'>
								Зніміть галочки з категорій, які потрібно видалити.
							</div>
						</div>
						<button
							type='button'
							className='cursor-pointer rounded-lg px-2 py-1 text-sm text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-50'
							onClick={() => dispatch(dashboardActions.closeManageCategories())}
							aria-label='Закрити'
						>
							✕
						</button>
					</div>

					<div className='mt-4 max-h-[340px] overflow-auto rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950'>
						<ul className='divide-y divide-zinc-100 dark:divide-zinc-900'>
							{props.categories.map(c => (
								<li
									key={c.id}
									className='flex items-center gap-3 px-4 py-3 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-900/40'
								>
									<input
										type='checkbox'
										checked={categoryChecks[c.id] ?? true}
										onChange={e =>
											dispatch(
												dashboardActions.setCategoryCheck({
													id: c.id,
													checked: e.target.checked,
												}),
											)
										}
										className='h-4 w-4 accent-zinc-900 dark:accent-white'
									/>
									<div className='min-w-0 flex-1'>
										<div className='truncate text-sm font-medium'>{c.name}</div>
									</div>
								</li>
							))}
						</ul>
					</div>

					<div className='mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end'>
						<button
							type='button'
							className='cursor-pointer rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-sm font-medium shadow-sm transition-all duration-200 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-black dark:hover:bg-zinc-900'
							onClick={() => dispatch(dashboardActions.closeManageCategories())}
							disabled={savingCategories}
						>
							Скасувати
						</button>
						<button
							type='button'
							className='cursor-pointer rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white shadow-sm ring-1 ring-black/10 transition-all duration-200 hover:bg-zinc-800 disabled:opacity-60 dark:bg-white dark:text-black dark:ring-white/10 dark:hover:bg-zinc-200'
							disabled={savingCategories}
							onClick={() => {
								const idsToDelete = props.categories
									.filter(c => !(categoryChecks[c.id] ?? true))
									.map(c => c.id);

								const fd = new FormData();
								for (const id of idsToDelete) fd.append('ids', id);

								startSavingCategories(async () => {
									try {
										await props.deleteCategoriesAction(fd);
										dispatch(dashboardActions.closeManageCategories());
										router.refresh();
									} catch (e) {
										dispatch(
											dashboardActions.setError(
												e instanceof Error
													? e.message
													: 'Не вдалося видалити категорії.',
											),
										);
									}
								});
							}}
						>
							Зберегти
						</button>
					</div>
				</Modal>

				<Modal
					open={showCreateCategory}
					onClose={() => {
						dispatch(dashboardActions.closeCreateCategory());
						dispatch(
							dashboardActions.setSelectedCategoryId(prevSelectedCategoryId),
						);
					}}
				>
					<div className='flex items-start justify-between gap-3'>
						<div className='text-sm font-semibold'>Нова категорія</div>
						<button
							type='button'
							className='cursor-pointer rounded-lg px-2 py-1 text-sm text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-50'
							onClick={() => {
								dispatch(dashboardActions.closeCreateCategory());
								dispatch(
									dashboardActions.setSelectedCategoryId(
										prevSelectedCategoryId,
									),
								);
							}}
							aria-label='Закрити'
						>
							✕
						</button>
					</div>
					<div className='mt-3'>
						<label className='block'>
							<div className='text-xs font-medium text-zinc-600 dark:text-zinc-400'>
								Назва
							</div>
							<input
								value={newCategoryName}
								onChange={e =>
									dispatch(dashboardActions.setNewCategoryName(e.target.value))
								}
								className='mt-1 w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm shadow-sm outline-none ring-1 ring-transparent transition-all duration-200 focus:border-zinc-400 focus:ring-black/10 dark:border-zinc-700 dark:bg-black dark:focus:border-zinc-600 dark:focus:ring-white/10'
								placeholder='Напр. Кафе'
								autoFocus
							/>
						</label>
					</div>
					<div className='mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end'>
						<button
							type='button'
							className='cursor-pointer rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-sm font-medium shadow-sm transition-all duration-200 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-black dark:hover:bg-zinc-900'
							onClick={() => {
								dispatch(dashboardActions.closeCreateCategory());
								dispatch(
									dashboardActions.setSelectedCategoryId(
										prevSelectedCategoryId,
									),
								);
							}}
							disabled={creatingCategory}
						>
							Скасувати
						</button>
						<button
							type='button'
							className='cursor-pointer rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white shadow-sm ring-1 ring-black/10 transition-all duration-200 hover:bg-zinc-800 disabled:opacity-60 dark:bg-white dark:text-black dark:ring-white/10 dark:hover:bg-zinc-200'
							disabled={creatingCategory || !newCategoryName.trim()}
							onClick={() => {
								const fd = new FormData();
								fd.set('name', newCategoryName);
								startCreatingCategory(async () => {
									try {
										const created = await props.createCategoryAction(fd);
										dispatch(dashboardActions.closeCreateCategory());
										dispatch(dashboardActions.setNewCategoryName(''));
										dispatch(
											dashboardActions.setSelectedCategoryId(created.id),
										);
										dispatch(
											dashboardActions.setPrevSelectedCategoryId(created.id),
										);
										router.refresh();
									} catch (e) {
										dispatch(
											dashboardActions.setError(
												e instanceof Error
													? e.message
													: 'Не вдалося створити категорію.',
											),
										);
									}
								});
							}}
						>
							Створити
						</button>
					</div>
				</Modal>

				{error ? (
					<div className='mt-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-200'>
						{error}
					</div>
				) : null}

				<div
					className='my-6 h-px w-full bg-zinc-200/70 dark:bg-zinc-800/80'
					aria-hidden='true'
				/>

				<MotionDiv
					className='mt-3 grid gap-3 rounded-2xl border border-zinc-200 bg-zinc-50 p-4 shadow-sm ring-1 ring-black/5 dark:border-zinc-800 dark:bg-black dark:ring-white/10'
					variants={itemFadeUp}
				>
					<div className='flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between'>
						<div className='text-sm font-semibold'>Фільтр по даті</div>
						<div className='text-xs text-zinc-500 dark:text-zinc-400'>
							Поля застосовуються до списку/суми/діаграми
						</div>
					</div>
					<div className='flex flex-col gap-3'>
						<div className='flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between'>
							<label className='min-w-0 flex-1'>
								<div className='text-xs font-medium text-zinc-600 dark:text-zinc-400'>
									Від
								</div>
								<div className='relative mt-1'>
									<input
										ref={fromRef}
										type='date'
										value={from}
										onChange={e =>
											dispatch(dashboardActions.setFrom(e.target.value))
										}
										className='w-full min-w-0 max-w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 pr-10 text-sm shadow-sm outline-none ring-1 ring-transparent transition-all duration-200 focus:border-zinc-400 focus:ring-black/10 dark:border-zinc-700 dark:bg-black dark:focus:border-zinc-600 dark:focus:ring-white/10'
									/>
									<button
										type='button'
										className='cursor-pointer absolute inset-y-0 right-0 my-auto mr-2 grid h-8 w-8 place-items-center rounded-lg text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-900 dark:hover:text-zinc-50'
										onClick={() => {
											const el = fromRef.current;
											if (!el) return;
											// eslint-disable-next-line @typescript-eslint/no-explicit-any
											const anyEl = el as any;
											if (typeof anyEl.showPicker === 'function')
												anyEl.showPicker();
											else el.focus();
										}}
										aria-label='Вибрати дату (від)'
									>
										<svg
											viewBox='0 0 24 24'
											width='18'
											height='18'
											fill='none'
											stroke='currentColor'
											strokeWidth='2'
											strokeLinecap='round'
											strokeLinejoin='round'
											aria-hidden='true'
										>
											<rect x='3' y='4' width='18' height='18' rx='3' />
											<path d='M16 2v4M8 2v4' />
											<path d='M3 10h18' />
										</svg>
									</button>
								</div>
							</label>
							<label className='min-w-0 flex-1'>
								<div className='text-xs font-medium text-zinc-600 dark:text-zinc-400'>
									До
								</div>
								<div className='relative mt-1'>
									<input
										ref={toRef}
										type='date'
										value={to}
										onChange={e =>
											dispatch(dashboardActions.setTo(e.target.value))
										}
										className='w-full min-w-0 max-w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 pr-10 text-sm shadow-sm outline-none ring-1 ring-transparent transition-all duration-200 focus:border-zinc-400 focus:ring-black/10 dark:border-zinc-700 dark:bg-black dark:focus:border-zinc-600 dark:focus:ring-white/10'
									/>
									<button
										type='button'
										className='cursor-pointer absolute inset-y-0 right-0 my-auto mr-2 grid h-8 w-8 place-items-center rounded-lg text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-900 dark:hover:text-zinc-50'
										onClick={() => {
											const el = toRef.current;
											if (!el) return;
											// eslint-disable-next-line @typescript-eslint/no-explicit-any
											const anyEl = el as any;
											if (typeof anyEl.showPicker === 'function')
												anyEl.showPicker();
											else el.focus();
										}}
										aria-label='Вибрати дату (до)'
									>
										<svg
											viewBox='0 0 24 24'
											width='18'
											height='18'
											fill='none'
											stroke='currentColor'
											strokeWidth='2'
											strokeLinecap='round'
											strokeLinejoin='round'
											aria-hidden='true'
										>
											<rect x='3' y='4' width='18' height='18' rx='3' />
											<path d='M16 2v4M8 2v4' />
											<path d='M3 10h18' />
										</svg>
									</button>
								</div>
							</label>
						</div>

						<div className='min-w-0 w-full sm:col-span-2 flex flex-col gap-2 items-stretch sm:flex-row sm:items-end'>
							<button
								type='button'
								className='cursor-pointer  w-full flex-1 rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white shadow-sm ring-1 ring-black/10 transition-all duration-200 hover:-translate-y-0.5 hover:bg-zinc-800 hover:shadow-md active:translate-y-0 disabled:opacity-60 dark:bg-white dark:text-black dark:ring-white/10 dark:hover:bg-zinc-200'
								onClick={() => {
									const params = new URLSearchParams(searchParams.toString());
									if (from) params.set('from', from);
									else params.delete('from');
									if (to) params.set('to', to);
									else params.delete('to');
									router.push(`/dashboard?${params.toString()}`);
								}}
							>
								Застосувати
							</button>
							<button
								type='button'
								className='cursor-pointer  w-full flex-1 rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-sm font-medium shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-zinc-50 hover:shadow-md active:translate-y-0 dark:border-zinc-700 dark:bg-black dark:hover:bg-zinc-900'
								onClick={() => {
									dispatch(dashboardActions.setFrom(''));
									dispatch(dashboardActions.setTo(''));
									router.push('/dashboard');
								}}
							>
								Скинути
							</button>
						</div>
					</div>
				</MotionDiv>

				<div
					className='my-6 h-px w-full bg-zinc-200/70 dark:bg-zinc-800/80'
					aria-hidden='true'
				/>

				<MotionDiv
					className='mt-3 overflow-hidden rounded-2xl border border-zinc-200 shadow-sm ring-1 ring-black/5 dark:border-zinc-800 dark:ring-white/10'
					variants={itemFadeUp}
				>
					{/* Mobile: cards */}
					<div className='sm:hidden'>
						{optimisticExpenses.length === 0 ? (
							<div className='px-4 py-10 text-center text-sm text-zinc-600 dark:bg-zinc-950 dark:text-zinc-400'>
								Ще немає витрат. Додайте першу.
							</div>
						) : (
							<ul className='divide-y divide-zinc-100 bg-white dark:divide-zinc-900 dark:bg-zinc-950'>
								{optimisticExpenses.map(e => (
									<li key={e.id} className='p-4'>
										<div className='flex items-start justify-between gap-3'>
											<div className='min-w-0'>
												<div className='text-sm font-semibold'>
													{formatMoney(e.amount)}
												</div>
												<div className='mt-0.5 text-xs text-zinc-600 dark:text-zinc-400'>
													{e.spent_at} • {e.category_name}
												</div>
												<div className='mt-2 text-sm text-zinc-700 dark:text-zinc-300'>
													{e.note?.trim() ? e.note : '—'}
												</div>
											</div>

											<button
												type='button'
												className='cursor-pointer shrink-0 rounded-lg bg-red-50 px-2 py-1 text-xs font-semibold text-red-700 ring-1 ring-red-200 transition-colors duration-150 hover:bg-red-100 disabled:opacity-50 dark:bg-red-950/30 dark:text-red-200 dark:ring-red-900/40 dark:hover:bg-red-950/50'
												onClick={() => {
													dispatch(
														dashboardActions.openConfirmDelete({
															id: e.id,
															label: `${e.spent_at} • ${e.category_name} • ${formatMoney(e.amount)}`,
														}),
													);
												}}
												disabled={pending || e.id.startsWith('optimistic_')}
												title={
													e.id.startsWith('optimistic_')
														? 'Зачекайте, поки збережеться'
														: 'Видалити'
												}
											>
												Видалити
											</button>
										</div>
									</li>
								))}
							</ul>
						)}
					</div>

					{/* Desktop/tablet: table */}
					<div className='hidden max-h-[420px] overflow-auto sm:block'>
						<table className='w-full text-left text-sm'>
							<thead className='sticky top-0 bg-zinc-50 text-xs text-zinc-500 dark:bg-black dark:text-zinc-400'>
								<tr>
									<th className='px-4 py-3 font-medium'>Дата</th>
									<th className='px-4 py-3 font-medium'>Категорія</th>
									<th className='px-4 py-3 font-medium'>Сума</th>
									<th className='px-4 py-3 font-medium'>Нотатка</th>
									<th className='px-4 py-3 font-medium'></th>
								</tr>
							</thead>
							<tbody className='bg-white dark:bg-zinc-950'>
								{optimisticExpenses.length === 0 ? (
									<tr>
										<td
											colSpan={5}
											className='px-4 py-10 text-center text-sm text-zinc-600 dark:text-zinc-400'
										>
											Ще немає витрат. Додайте першу.
										</td>
									</tr>
								) : (
									optimisticExpenses.map(e => (
										<tr
											key={e.id}
											className='border-t border-zinc-100 transition-colors duration-150 hover:bg-zinc-50/70 dark:border-zinc-900 dark:hover:bg-zinc-900/40'
										>
											<td className='px-4 py-3 whitespace-nowrap'>
												{e.spent_at}
											</td>
											<td className='px-4 py-3'>{e.category_name}</td>
											<td className='px-4 py-3 whitespace-nowrap font-medium'>
												{formatMoney(e.amount)}
											</td>
											<td className='px-4 py-3 text-zinc-600 dark:text-zinc-400'>
												{e.note ?? '—'}
											</td>
											<td className='px-4 py-3 text-right'>
												<button
													type='button'
													className='cursor-pointer rounded-lg bg-red-50 px-2 py-1 text-xs font-semibold text-red-700 ring-1 ring-red-200 transition-colors duration-150 hover:bg-red-100 disabled:opacity-50 dark:bg-red-950/30 dark:text-red-200 dark:ring-red-900/40 dark:hover:bg-red-950/50'
													onClick={() => {
														dispatch(
															dashboardActions.openConfirmDelete({
																id: e.id,
																label: `${e.spent_at} • ${e.category_name} • ${formatMoney(e.amount)}`,
															}),
														);
													}}
													disabled={pending || e.id.startsWith('optimistic_')}
													title={
														e.id.startsWith('optimistic_')
															? 'Зачекайте, поки збережеться'
															: 'Видалити'
													}
												>
													<svg
														viewBox='0 0 24 24'
														width='18'
														height='18'
														fill='none'
														stroke='currentColor'
														strokeWidth='2'
														strokeLinecap='round'
														strokeLinejoin='round'
														aria-hidden='true'
													>
														<path d='M3 6h18' />
														<path d='M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2' />
														<line x1='10' y1='11' x2='10' y2='17' />
														<line x1='14' y1='11' x2='14' y2='17' />
													</svg>
												</button>
											</td>
										</tr>
									))
								)}
							</tbody>
						</table>
					</div>
				</MotionDiv>
			</MotionDiv>

			<aside className='md:col-span-2 flex flex-col gap-4 md:sticky md:top-12 h-fit'>
				<MotionDiv
					className='rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm ring-1 ring-black/5 cdf-animate-in cdf-delay-1 dark:border-zinc-800 dark:bg-zinc-950 dark:ring-white/10'
					variants={itemFadeUp}
					whileHover={{ y: -2 }}
				>
					<div className='text-sm font-semibold'>Підсумок</div>
					<div className='mt-3 rounded-2xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-black'>
						<div className='text-xs font-medium text-zinc-500 dark:text-zinc-400'>
							Всього за період
						</div>
						<div className='mt-1 text-2xl font-semibold tracking-tight'>
							{formatMoney(totals.total)}
						</div>
						<div className='mt-3 grid grid-cols-2 gap-2 text-xs text-zinc-600 dark:text-zinc-400'>
							<div className='flex items-center justify-between rounded-xl border border-zinc-200 bg-white px-3 py-2 dark:border-zinc-800 dark:bg-zinc-950'>
								<span>Від</span>
								<span className='font-medium text-zinc-900 dark:text-zinc-50'>
									{from || expenseRange.from || '—'}
								</span>
							</div>
							<div className='flex items-center justify-between rounded-xl border border-zinc-200 bg-white px-3 py-2 dark:border-zinc-800 dark:bg-zinc-950'>
								<span>До</span>
								<span className='font-medium text-zinc-900 dark:text-zinc-50'>
									{to || expenseRange.to || '—'}
								</span>
							</div>
						</div>
					</div>

					<div className='mt-5 text-sm font-semibold'>
						Розподіл по категоріях
					</div>
					<div className='mt-4'>
						<ExpenseChart data={totals.chartData} />
					</div>

					<div className='mt-4 rounded-2xl border border-zinc-200 bg-zinc-50 p-4 text-sm dark:border-zinc-800 dark:bg-black'>
						<div className='grid gap-2'>
							{totals.chartData.slice(0, 6).map(d => (
								<div
									key={d.name}
									className='flex items-center justify-between gap-3'
								>
									<div className='min-w-0 truncate text-zinc-700 dark:text-zinc-300'>
										{d.name}
									</div>
									<div className='shrink-0 text-right'>
										<div className='text-xs font-semibold text-zinc-500 dark:text-zinc-400'>
											{totals.total > 0
												? `${Math.round((d.value / totals.total) * 100)}%`
												: '—'}
										</div>
										<div className='font-medium'>{formatMoney(d.value)}</div>
									</div>
								</div>
							))}
							{totals.chartData.length === 0 ? (
								<div className='text-sm text-zinc-600 dark:text-zinc-400'>
									Ще немає витрат для діаграми.
								</div>
							) : null}
						</div>
					</div>
				</MotionDiv>
			</aside>
		</MotionDiv>
	);
}
