import { ThemeToggle } from "@/components/theme/theme-toggle";

export function TopBar() {
	return (
		<header className="sticky top-0 z-10 border-b border-app-border bg-app-bg/85 backdrop-blur-md transition-colors">
			<div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
				<div className="flex items-center gap-2.5">
					<BoltIcon />
					<span className="text-base font-semibold tracking-tight">
						Otthoni energia
					</span>
				</div>
				<ThemeToggle />
			</div>
		</header>
	);
}

function BoltIcon() {
	return (
		<svg
			width="20"
			height="20"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
			className="text-emerald-500"
			aria-hidden="true"
		>
			<path d="M13 2 4.5 13.5H11l-1 8.5 8.5-11.5H12l1-8.5Z" />
		</svg>
	);
}
