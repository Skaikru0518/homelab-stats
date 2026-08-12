import type { ReactNode } from "react";

interface CardProps {
	children: ReactNode;
	className?: string;
}

/** Alap panel: lekerekített, vékony kerettel, a háttérnél világosabb. */
export function Card({ children, className = "" }: CardProps) {
	return (
		<div
			className={`rounded-xl border border-app-border bg-app-panel transition-colors ${className}`}
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
