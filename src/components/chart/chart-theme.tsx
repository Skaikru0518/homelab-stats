"use client";

/** Eszközszínek a diagramokon, slug sorrend szerint kiosztva. */
export const SERIES_COLORS = ["#10b981", "#0ea5e9", "#f59e0b", "#8b5cf6"];

/** A tengelyek és a rács a téma változóiból veszik a színt. */
export const AXIS_COLOR = "var(--app-faint)";
export const GRID_COLOR = "var(--app-border)";

export const AXIS_TICK = {
	fill: AXIS_COLOR,
	fontSize: 10,
	fontFamily: "var(--font-jetbrains-mono)",
};

interface TooltipEntry {
	name?: string | number;
	value?: string | number;
	color?: string;
}

interface ChartTooltipProps {
	active?: boolean;
	payload?: TooltipEntry[];
	label?: string | number;
	unit: string;
	/** Kiírja a szegmensek összegét is. Halmozott oszlopokhoz hasznos. */
	showTotal?: boolean;
	format: (value: number) => string;
}

export function ChartTooltip({
	active,
	payload,
	label,
	unit,
	showTotal = false,
	format,
}: ChartTooltipProps) {
	if (!active || !payload || payload.length === 0) {
		return null;
	}

	const entries = payload.filter((entry) => Number(entry.value) > 0);
	if (entries.length === 0) {
		return null;
	}

	const total = entries.reduce((sum, entry) => sum + Number(entry.value), 0);

	return (
		<div className="rounded-lg border border-app-border bg-app-panel px-3 py-2 shadow-lg">
			<p className="mb-1 font-mono text-[11px] text-app-faint">{label}</p>
			{entries.map((entry) => (
				<p
					key={String(entry.name)}
					className="flex items-center gap-2 text-xs text-app-text"
				>
					<span
						className="size-2 shrink-0 rounded-full"
						style={{ backgroundColor: entry.color }}
					/>
					<span className="text-app-muted">{entry.name}</span>
					<span className="ml-auto font-mono tabular-nums">
						{format(Number(entry.value))} {unit}
					</span>
				</p>
			))}
			{showTotal && entries.length > 1 && (
				<p className="mt-1 flex gap-4 border-t border-app-border pt-1 text-xs">
					<span className="text-app-muted">Összesen</span>
					<span className="ml-auto font-mono font-semibold tabular-nums">
						{format(total)} {unit}
					</span>
				</p>
			)}
		</div>
	);
}
