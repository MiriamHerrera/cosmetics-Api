import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	images: {
		remotePatterns: [
			{ protocol: 'https', hostname: 'images.unsplash.com' },
			{ protocol: 'https', hostname: 'example.com' },
			{ protocol: 'http', hostname: 'localhost' },
			{ protocol: 'https', hostname: 'localhost' }
		]
	}
};

export default nextConfig;
