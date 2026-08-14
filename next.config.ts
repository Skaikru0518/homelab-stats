import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	output: "standalone",
	// Next.js 15+ handles CORS differently - no need for allowedDevOrigins
	// For local network testing, use: next dev -H 0.0.0.0
	experimental: {},
};

export default nextConfig;
