'use client';

import { usePathname } from 'next/navigation';
import { Show, SignInButton, SignUpButton, UserButton } from '@clerk/nextjs';

export function HeaderActions() {
	const pathname = usePathname();
	return (
		<div className='flex flex-wrap items-center justify-end gap-2 sm:gap-3'>
			<Show when='signed-out'>
				<SignInButton mode='modal' forceRedirectUrl='/dashboard'>
					<button className='cursor-pointer rounded-full bg-zinc-900 px-3 py-2 text-xs font-medium text-white shadow-sm ring-1 ring-black/10 transition-all duration-200 hover:-translate-y-0.5 hover:bg-zinc-800 hover:shadow-md active:translate-y-0 dark:bg-white dark:text-black dark:ring-white/10 dark:hover:bg-zinc-200 sm:px-4 sm:text-sm'>
						Увійти
					</button>
				</SignInButton>
				<SignUpButton mode='modal' forceRedirectUrl='/dashboard'>
					<button className='cursor-pointer rounded-full border border-zinc-300 bg-white px-3 py-2 text-xs font-medium text-zinc-900 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-zinc-50 hover:shadow-md active:translate-y-0 dark:border-zinc-700 dark:bg-black dark:text-zinc-50 dark:hover:bg-zinc-900 sm:px-4 sm:text-sm'>
						Реєстрація
					</button>
				</SignUpButton>
			</Show>
			<Show when='signed-in'>
				<UserButton />
			</Show>
		</div>
	);
}
