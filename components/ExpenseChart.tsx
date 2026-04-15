'use client';

import { Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';

export type ChartDatum = {
	name: string;
	value: number;
};

const COLORS = [
	'#0ea5e9',
	'#22c55e',
	'#f97316',
	'#a855f7',
	'#ef4444',
	'#eab308',
	'#14b8a6',
	'#64748b',
];

export function ExpenseChart({ data }: { data: ChartDatum[] }) {
	if (data.length === 0) {
		return (
			<div className='grid min-h-[240px] place-items-center rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 p-6 text-sm text-zinc-600 ring-1 ring-black/5 cdf-animate-in dark:border-zinc-700 dark:bg-black dark:text-zinc-400 dark:ring-white/10'>
				Немає даних для діаграми.
			</div>
		);
	}

	const total = data.reduce((sum, d) => sum + d.value, 0);
	const coloredData = data.map((d, idx) => ({
		...d,
		fill: COLORS[idx % COLORS.length],
	}));

	return (
		<div className='rounded-2xl border border-zinc-200 bg-zinc-50 p-4 ring-1 ring-black/5 cdf-animate-in dark:border-zinc-800 dark:bg-black dark:ring-white/10'>
			<div
				className='relative mx-auto w-full max-w-[360px] aspect-square rounded-2xl bg-white p-2 shadow-sm dark:bg-zinc-950'
				style={{ userSelect: 'none', WebkitUserSelect: 'none' }}
				onMouseDown={e => e.preventDefault()}
				onDragStart={e => e.preventDefault()}
			>
				<ResponsiveContainer width='100%' height='100%'>
					<PieChart>
						<Tooltip
							wrapperStyle={{
								zIndex: 80,
							}}
							formatter={(value: unknown, name: unknown) => [
								`${Number(value).toFixed(2)} ₴`,
								String(name),
							]}
							contentStyle={{
								background: 'rgba(255,255,255,0.94)',
								border: '1px solid rgba(24,24,27,0.12)',
								borderRadius: 16,
								boxShadow:
									'0 10px 30px rgba(0,0,0,0.10), 0 1px 0 rgba(0,0,0,0.04)',
								backdropFilter: 'blur(10px)',
								WebkitBackdropFilter: 'blur(10px)',
								padding: '10px 12px',
							}}
							labelStyle={{
								color: 'rgba(24,24,27,0.60)',
								fontSize: 12,
								fontWeight: 600,
								marginBottom: 6,
							}}
							itemStyle={{
								color: 'rgba(24,24,27,0.90)',
								fontSize: 13,
								fontWeight: 600,
							}}
							separator=' • '
						/>
						<Pie
							data={coloredData}
							dataKey='value'
							nameKey='name'
							innerRadius={60}
							outerRadius={115}
							paddingAngle={0}
							isAnimationActive
							stroke='transparent'
							strokeWidth={0}
						/>
					</PieChart>
				</ResponsiveContainer>

				{/* Subtle ring behind donut for consistent look */}
				{/* <div className='pointer-events-none absolute inset-0 grid place-items-center'>
					<div className='h-24 w-24 rounded-full bg-zinc-50 ring-1 ring-zinc-200 dark:bg-black dark:ring-zinc-800' />
				</div> */}

				{/* Center cap to match homepage donut style */}
				<div className='pointer-events-none absolute inset-0 grid place-items-center'>
					<div className='grid h-12 w-12 place-items-center rounded-full bg-white text-xs font-semibold text-zinc-900 ring-1 ring-zinc-200 dark:bg-zinc-950 dark:text-zinc-50 dark:ring-zinc-800'>
						100%
					</div>
				</div>
			</div>

			<div className='mt-3 flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400'>
				<span>Разом</span>
				<span className='font-medium text-zinc-700 dark:text-zinc-300'>
					{total.toFixed(2)} ₴
				</span>
			</div>
		</div>
	);
}
