import { formatAmps } from "@/lib/format";

/** A NOUS A1T névleges terhelhetősége. A sáv ehhez viszonyít, nem tetszőleges skálához. */
const RATED_AMPS = 16;

const WARN_RATIO = 0.6;
const DANGER_RATIO = 0.85;

interface LoadBarProps {
	/** Pillanatnyi áramfelvétel, amper. */
	current: number;
}

/**
 * Mennyire terhelt a konnektor a 16 A-es korlátjához képest.
 *
 * Wattban is lehetne, de a konnektort az áramerősség melegíti — a valódi
 * fizikai határ 16 A, ezért ahhoz viszonyítunk.
 */
export function LoadBar({ current }: LoadBarProps) {
	const ratio = Math.min(Math.max(current / RATED_AMPS, 0), 1);
	const percent = ratio * 100;

	const color =
		ratio >= DANGER_RATIO
			? "bg-rose-500"
			: ratio >= WARN_RATIO
				? "bg-amber-500"
				: "bg-emerald-500";

	return (
		<div className="flex items-center gap-2.5">
			<div
				className="h-1.5 flex-1 overflow-hidden rounded-full bg-app-inset"
				role="meter"
				aria-valuenow={Math.round(percent)}
				aria-valuemin={0}
				aria-valuemax={100}
				aria-label={`Terhelés: ${formatAmps(current)} amper a 16 amperes határból`}
			>
				<div
					className={`h-full rounded-full transition-[width] duration-500 ease-out ${color}`}
					style={{ width: `${percent}%` }}
				/>
			</div>
			<span className="font-mono text-[11px] tabular-nums text-app-faint">
				{RATED_AMPS} A
			</span>
		</div>
	);
}
