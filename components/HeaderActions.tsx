'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Show, SignInButton, UserButton, useUser } from '@clerk/nextjs';

export function HeaderActions() {
	const { user } = useUser();
	const pathname = usePathname();
	const isDashboard =
		pathname === '/dashboard' || pathname.startsWith('/dashboard/');

	return (
		<div className='flex flex-wrap items-center justify-end gap-2 sm:gap-3'>
			<Show when='signed-out'>
				<SignInButton mode='modal'>
					<button className='cursor-pointer rounded-full bg-zinc-900 px-3 py-2 text-xs font-medium text-white shadow-sm ring-1 ring-black/10 transition-all duration-200 hover:-translate-y-0.5 hover:bg-zinc-800 hover:shadow-md active:translate-y-0 dark:bg-white dark:text-black dark:ring-white/10 dark:hover:bg-zinc-200 sm:px-4 sm:text-sm'>
						Увійти
					</button>
				</SignInButton>
			</Show>
			<Show when='signed-in'>
				<p className='text-sm text-zinc-600 dark:text-zinc-400'>
					З поверненням,{' '}
					{user?.firstName ?? user?.emailAddresses[0].emailAddress}! 👋
				</p>
				<UserButton />
			</Show>
		</div>
	);
}
