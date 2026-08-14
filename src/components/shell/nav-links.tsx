"use client";

import {
	ChartColumn,
	Coins,
	LayoutDashboard,
	PlugZap,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export const NAV_LINKS = [
	{ href: "/", label: "Áttekintés", icon: LayoutDashboard },
	{ href: "/history", label: "Előzmények", icon: ChartColumn },
	{ href: "/devices", label: "Eszközök", icon: PlugZap },
	{ href: "/prices", label: "Áram ára", icon: Coins },
] as const;

/** Az eszköz oldalak az áttekintés alá tartoznak. */
export function isActive(href: string, pathname: string): boolean {
	return href === "/"
		? pathname === "/" || pathname.startsWith("/device/")
		: pathname.startsWith(href);
}

export function NavLinks() {
	const pathname = usePathname();

	return (
		<nav className="hidden gap-1 rounded-lg border border-app-border bg-app-panel p-1 sm:flex">
			{NAV_LINKS.map((link) => {
				const active = isActive(link.href, pathname);

				return (
					<Link
						key={link.href}
						href={link.href}
						aria-current={active ? "page" : undefined}
						className={`flex min-h-9 items-center rounded-md px-3 text-sm font-medium transition-colors ${
							active
								? "bg-app-inset text-app-text"
								: "text-app-muted hover:text-app-text"
						}`}
					>
						{link.label}
					</Link>
				);
			})}
		</nav>
	);
}
