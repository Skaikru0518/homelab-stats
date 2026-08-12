import { TopBar } from "@/components/shell/top-bar";
import type { ReactNode } from "react";

export default function DashboardLayout({
	children,
}: {
	children: ReactNode;
}) {
	return (
		<div className="flex min-h-dvh flex-col">
			<TopBar />
			<main className="mx-auto w-full max-w-6xl flex-1 px-4 py-4 sm:px-6 sm:py-6">
				{children}
			</main>
			<footer className="mx-auto w-full max-w-6xl px-4 pb-6 sm:px-6">
				<p className="text-[11px] text-app-faint">
					Az élő értékek 5 másodpercenként, az összesítők percenként frissülnek.
				</p>
			</footer>
		</div>
	);
}
