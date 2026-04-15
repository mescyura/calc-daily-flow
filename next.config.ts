import path from 'path';
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
	turbopack: {
		// Ensure Next detects the correct root (otherwise proxy.ts may be ignored).
		root: path.join(__dirname),
	},
	images: {
		remotePatterns: [
			{
				protocol: 'https',
				hostname: 'images.unsplash.com',
			},
		],
	},
};

export default nextConfig;
