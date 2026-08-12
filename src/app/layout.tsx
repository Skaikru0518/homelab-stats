import { ThemeScript } from "@/components/theme/theme-script";
import type { Metadata, Viewport } from "next";
import { JetBrains_Mono, Manrope } from "next/font/google";
import "./globals.css";

const manrope = Manrope({
	variable: "--font-manrope",
	subsets: ["latin", "latin-ext"],
	display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
	variable: "--font-jetbrains-mono",
	subsets: ["latin", "latin-ext"],
	display: "swap",
});

export const metadata: Metadata = {
	title: "Otthoni energia",
	description:
		"Élő fogyasztás és költség a hálózaton lévő konnektorokról és a klímáról.",
};

export const viewport: Viewport = {
	themeColor: [
		{ media: "(prefers-color-scheme: light)", color: "#f4f4f5" },
		{ media: "(prefers-color-scheme: dark)", color: "#09090b" },
	],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
	return (
		<html
			lang="hu"
			// A téma scriptje a hidratálás előtt módosítja a class-t.
			suppressHydrationWarning
			className={`${manrope.variable} ${jetbrainsMono.variable} h-full antialiased`}
		>
			<head>
				<ThemeScript />
			</head>
			<body className="min-h-full font-sans">{children}</body>
		</html>
	);
}
