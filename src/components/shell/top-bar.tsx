import { MobileNav } from "@/components/shell/mobile-nav";
import { NavLinks } from "@/components/shell/nav-links";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Zap } from "lucide-react";
import Link from "next/link";

export function TopBar() {
	return (
		<header className="sticky top-0 z-10 border-b border-app-border bg-app-bg/85 backdrop-blur-md transition-colors">
			<div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
				<Link href="/" className="flex items-center gap-2.5">
					<Zap
						size={20}
						className="shrink-0 fill-emerald-500 text-emerald-500"
						aria-hidden="true"
					/>
					<span className="text-base font-semibold tracking-tight">
						Otthoni energia
					</span>
				</Link>
				<div className="flex items-center gap-2">
					<NavLinks />
					<ThemeToggle />
					<MobileNav />
				</div>
			</div>
		</header>
	);
}
