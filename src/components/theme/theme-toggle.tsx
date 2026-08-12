"use client";

import { useEffect, useState } from "react";

export function ThemeToggle() {
	// A szerver nem tudja a felhasználó témáját, ezért a gomb ikonja csak
	// mountolás után dől el. Addig semlegesen renderelünk.
	const [isDark, setIsDark] = useState<boolean | null>(null);

	useEffect(() => {
		setIsDark(document.documentElement.classList.contains("dark"));
	}, []);

	function toggle() {
		const next = !document.documentElement.classList.contains("dark");
		document.documentElement.classList.toggle("dark", next);
		localStorage.setItem("theme", next ? "dark" : "light");
		setIsDark(next);
	}

	const label = isDark ? "Váltás világos témára" : "Váltás sötét témára";

	return (
		<button
			type="button"
			onClick={toggle}
			aria-label={label}
			title={label}
			className="grid size-11 place-items-center rounded-lg border border-app-border bg-app-panel text-app-muted transition-colors hover:text-app-text hover:bg-app-inset"
		>
			{isDark === null ? (
				<span className="size-[18px]" />
			) : isDark ? (
				<SunIcon />
			) : (
				<MoonIcon />
			)}
		</button>
	);
}

function SunIcon() {
	return (
		<svg
			width="18"
			height="18"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			aria-hidden="true"
		>
			<circle cx="12" cy="12" r="4" />
			<path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
		</svg>
	);
}

function MoonIcon() {
	return (
		<svg
			width="18"
			height="18"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
			aria-hidden="true"
		>
			<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />
		</svg>
	);
}
