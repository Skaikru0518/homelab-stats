import type { ReactNode } from "react";

interface CardProps {
	children: ReactNode;
	className?: string;
	/** Beúszás késleltetése ezredmásodpercben. Lépcsőzetes megjelenéshez. */
	delay?: number;
}

/** Alap panel: lekerekített, vékony kerettel, a háttérnél világosabb. */
export function Card({ children, className = "", delay }: CardProps) {
	return (
		<div
			style={delay === undefined ? undefined : { animationDelay: `${delay}ms` }}
			className={`rounded-xl border border-app-border bg-app-panel transition-colors ${
				delay === undefined ? "" : "animate-rise"
			} ${className}`}
		>
			{children}
		</div>
	);
}

interface LabelProps {
	children: ReactNode;
	className?: string;
}

/** Apró, tompa címke a mérőszámok felett. */
export function Label({ children, className = "" }: LabelProps) {
	return (
		<span
			className={`text-[11px] font-medium uppercase tracking-wider text-app-faint ${className}`}
		>
			{children}
		</span>
	);
}
