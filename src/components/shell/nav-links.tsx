"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
	{ href: "/", label: "Áttekintés" },
	{ href: "/history", label: "Előzmények" },
	{ href: "/devices", label: "Eszközök" },
] as const;

export function NavLinks() {
	const pathname = usePathname();

	return (
		<nav className="flex gap-1 rounded-lg border border-app-border bg-app-panel p-1">
			{LINKS.map((link) => {
				// Az eszköz oldalak az áttekintés alá tartoznak.
				const active =
					link.href === "/"
						? pathname === "/" || pathname.startsWith("/device")
						: pathname.startsWith(link.href);

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
