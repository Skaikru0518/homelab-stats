"use client";

import { NAV_LINKS, isActive } from "@/components/shell/nav-links";
import { Menu, X, Zap } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

const CLOSE_MS = 200;

type SheetState = "closed" | "open" | "closing";

export function MobileNav() {
	const pathname = usePathname();
	const [state, setState] = useState<SheetState>("closed");
	const [mounted, setMounted] = useState(false);
	const trigger = useRef<HTMLButtonElement>(null);
	const closeButton = useRef<HTMLButtonElement>(null);

	useEffect(() => setMounted(true), []);

	function close() {
		setState((current) => (current === "open" ? "closing" : current));
	}

	useEffect(() => {
		if (state !== "closing") {
			return;
		}
		const timer = setTimeout(() => {
			setState("closed");
			trigger.current?.focus();
		}, CLOSE_MS);
		return () => clearTimeout(timer);
	}, [state]);

	useEffect(() => {
		setState((current) => (current === "open" ? "closing" : current));
	}, [pathname]);

	useEffect(() => {
		if (state !== "open") {
			return;
		}

		closeButton.current?.focus();

		const previousOverflow = document.body.style.overflow;
		document.body.style.overflow = "hidden";

		function onKey(event: KeyboardEvent) {
			if (event.key === "Escape") {
				close();
			}
		}

		window.addEventListener("keydown", onKey);
		return () => {
			window.removeEventListener("keydown", onKey);
			document.body.style.overflow = previousOverflow;
		};
	}, [state]);

	const visible = state !== "closed";
	const leaving = state === "closing";

	return (
		<>
			<button
				ref={trigger}
				type="button"
				onClick={() => setState("open")}
				aria-label="Menü megnyitása"
				aria-expanded={state === "open"}
				aria-haspopup="dialog"
				className="grid size-11 place-items-center rounded-lg border border-app-border bg-app-panel text-app-muted transition-colors hover:text-app-text sm:hidden"
			>
				<Menu size={18} aria-hidden="true" />
			</button>

			{mounted &&
				visible &&
				createPortal(
					<div className="sm:hidden">
						<button
							type="button"
							tabIndex={-1}
							aria-hidden="true"
							onClick={close}
							className={`fixed inset-0 z-40 cursor-default bg-black/50 backdrop-blur-[2px] ${
								leaving ? "animate-scrim-out" : "animate-scrim-in"
							}`}
						/>

						<div
							role="dialog"
							aria-modal="true"
							aria-label="Menü"
							className={`fixed inset-y-0 right-0 z-50 flex w-[17rem] max-w-[85vw] flex-col border-l border-app-border bg-app-panel shadow-2xl ${
								leaving ? "animate-sheet-out" : "animate-sheet-in"
							}`}
						>
							<div className="flex items-center justify-between border-b border-app-border px-4 py-3">
								<span className="flex items-center gap-2">
									<Zap
										size={16}
										className="shrink-0 fill-emerald-500 text-emerald-500"
										aria-hidden="true"
									/>
									<span className="text-sm font-semibold tracking-tight">
										Otthoni energia
									</span>
								</span>
								<button
									ref={closeButton}
									type="button"
									onClick={close}
									aria-label="Menü bezárása"
									className="-mr-1.5 grid size-9 place-items-center rounded-lg text-app-muted transition-colors hover:bg-app-inset hover:text-app-text"
								>
									<X size={18} aria-hidden="true" />
								</button>
							</div>

							<nav className="flex flex-col gap-1 p-3">
								{NAV_LINKS.map((link, index) => {
									const active = isActive(link.href, pathname);
									const Icon = link.icon;

									return (
										<Link
											key={link.href}
											href={link.href}
											aria-current={active ? "page" : undefined}
											style={
												leaving
													? undefined
													: { animationDelay: `${70 + index * 50}ms` }
											}
											className={`flex min-h-12 items-center gap-3 rounded-xl px-3 text-sm font-medium transition-colors ${
												leaving ? "" : "animate-item-in"
											} ${
												active
													? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
													: "text-app-muted hover:bg-app-inset hover:text-app-text"
											}`}
										>
											<Icon size={17} aria-hidden="true" />
											{link.label}
											{active && (
												<span className="ml-auto size-1.5 rounded-full bg-emerald-500" />
											)}
										</Link>
									);
								})}
							</nav>
						</div>
					</div>,
					document.body,
				)}
		</>
	);
}
