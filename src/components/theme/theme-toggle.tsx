"use client";

import { Moon, Sun } from "lucide-react";
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
				<Sun size={18} aria-hidden="true" />
			) : (
				<Moon size={18} aria-hidden="true" />
			)}
		</button>
	);
}
