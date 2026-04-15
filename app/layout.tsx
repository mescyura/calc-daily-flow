import type { Metadata } from 'next';
import { ClerkProvider } from '@clerk/nextjs';
import { Geist, Geist_Mono } from 'next/font/google';
import Link from 'next/link';
import './globals.css';
import { HeaderActions } from '@/components/HeaderActions';
import { PageMotion } from '@/components/MotionProviders';
import { ReduxProvider } from '@/app/ReduxProvider';
import { dark } from '@clerk/ui/themes';

const geistSans = Geist({
	variable: '--font-geist-sans',
	subsets: ['latin'],
});

const geistMono = Geist_Mono({
	variable: '--font-geist-mono',
	subsets: ['latin'],
});

export const metadata: Metadata = {
	title: 'Calc DailyFlow',
	description: 'Облік витрат по категоріях',
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<ClerkProvider
			appearance={{
				theme: dark,
			}}
		>
			<html
				lang='en'
				className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
			>
				<body className='min-h-full flex flex-col bg-zinc-50 font-sans text-zinc-900 dark:bg-black dark:text-zinc-50'>
					<ReduxProvider>
						<header className='w-full border-b border-zinc-200 bg-white/70 backdrop-blur dark:border-zinc-800 dark:bg-black/40'>
							<div className='mx-auto flex w-full max-w-5xl items-center justify-between gap-3 px-4 py-3 sm:px-6 sm:py-4'>
								<Link href='/' className='flex min-w-0 items-center gap-3'>
									<div className='grid h-9 w-9 place-items-center rounded-xl bg-zinc-900 text-sm font-semibold text-white shadow-sm ring-1 ring-black/5 transition-transform duration-200 hover:scale-[1.02] dark:bg-white dark:text-black dark:ring-white/10'>
										₴
									</div>
									<div className='min-w-0 leading-tight'>
										<div className='truncate text-sm font-semibold'>
											Calc DailyFlow
										</div>
										<div className='hidden text-xs text-zinc-500 dark:text-zinc-400 sm:block'>
											Калькулятор витрат
										</div>
									</div>
								</Link>

								<HeaderActions />
							</div>
						</header>

						<main className='mx-auto flex w-full max-w-5xl flex-1 flex-col px-4 py-6 sm:justify-center sm:px-6 sm:py-10 cdf-animate-in'>
							<PageMotion>{children}</PageMotion>
						</main>

						<footer className='w-full border-t border-zinc-200 bg-white/50 backdrop-blur dark:border-zinc-800 dark:bg-black/20'>
							<div className='mx-auto flex w-full max-w-5xl gap-2 px-4 py-4 text-xs text-zinc-500 dark:text-zinc-400 items-center justify-between sm:px-6'>
								<div className='min-w-0 truncate'>
									<span className='font-semibold'>© Calc DailyFlow</span>{' '}
									{new Date().getFullYear()}
								</div>
								<div>
									made with ♥ by{' '}
									<Link
										href='https://github.com/mescyura'
										className='text-zinc-500 dark:text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 underline'
										target='_blank'
										rel='noopener noreferrer'
									>
										mescyura
									</Link>
								</div>
							</div>
						</footer>
					</ReduxProvider>
				</body>
			</html>
		</ClerkProvider>
	);
}
