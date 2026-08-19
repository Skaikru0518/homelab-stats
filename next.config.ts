import type { NextConfig } from "next";
import { BASE_PATH } from "@/lib/base-path";

const nextConfig: NextConfig = {
	output: "standalone",
	basePath: BASE_PATH,
	// A basePath a <Link>-re és az assetekre rákerül, a nyers fetch()-re nem.
	// Innen veszi a kliens is, hogy egy helyen legyen leírva.
	experimental: {},
};

export default nextConfig;
