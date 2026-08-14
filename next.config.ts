import type { NextConfig } from "next";

const basePath = process.env["BASE_PATH"] ?? "/homelab";

const nextConfig: NextConfig = {
	output: "standalone",
	basePath,
	// A basePath a <Link>-re és az assetekre rákerül, a nyers fetch()-re nem.
	// Innen veszi a kliens is, hogy egy helyen legyen leírva.
	env: { NEXT_PUBLIC_BASE_PATH: basePath },
	experimental: {},
};

export default nextConfig;
