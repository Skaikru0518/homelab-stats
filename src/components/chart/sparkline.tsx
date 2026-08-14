"use client";

import { GRID_COLOR, SERIES_COLORS } from "@/components/chart/chart-theme";
import { formatWatts } from "@/lib/format";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";

interface SparklineProps {
	data: (number | null)[];
	gradientId: string;
	windowHours?: number;
	height?: number;
}

const ACCENT = SERIES_COLORS[0];

export function Sparkline({
	data,
	gradientId,
	windowHours = 24,
	height = 32,
}: SparklineProps) {
	const known = data.filter((value): value is number => value !== null);

	if (known.length === 0) {
		return (
			<div
				className="flex items-center text-[11px] text-app-faint"
				style={{ height }}
			>
				Nincs még elég mérés a grafikonhoz.
			</div>
		);
	}

	const minutesPerPoint = (windowHours * 60) / data.length;

	const rows = data.map((value, index) => {
		const minutesAgo = Math.round((data.length - 1 - index) * minutesPerPoint);
		const stamp = new Date(Date.now() - minutesAgo * 60_000);
		return {
			label: `${String(stamp.getHours()).padStart(2, "0")}:${String(
				stamp.getMinutes(),
			).padStart(2, "0")}`,
			power: value,
		};
	});

	return (
		<div style={{ height }} className="w-full">
			<ResponsiveContainer width="100%" height="100%">
				<AreaChart data={rows} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
					<defs>
						<linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
							<stop offset="0%" stopColor={ACCENT} stopOpacity={0.28} />
							<stop offset="100%" stopColor={ACCENT} stopOpacity={0} />
						</linearGradient>
					</defs>
					<XAxis dataKey="label" hide />
					<Tooltip
						cursor={{ stroke: GRID_COLOR, strokeWidth: 1 }}
						content={<SparkTooltip />}
						allowEscapeViewBox={{ x: false, y: true }}
						offset={12}
					/>
					<Area
						type="monotone"
						dataKey="power"
						stroke={ACCENT}
						strokeWidth={1.5}
						fill={`url(#${gradientId})`}
						connectNulls={false}
						dot={false}
						activeDot={{ r: 2.5, strokeWidth: 0 }}
						isAnimationActive={false}
					/>
				</AreaChart>
			</ResponsiveContainer>
		</div>
	);
}

interface SparkTooltipProps {
	active?: boolean;
	payload?: { value?: string | number }[];
	label?: string | number;
}

function SparkTooltip({ active, payload, label }: SparkTooltipProps) {
	const value = payload?.[0]?.value;

	if (!active || value === undefined || value === null) {
		return null;
	}

	return (
		<div className="rounded-md border border-app-border bg-app-panel px-2 py-1 shadow-lg">
			<span className="font-mono text-[11px] tabular-nums">
				<span className="text-app-faint">{label}</span>
				<span className="ml-2 font-semibold">{formatWatts(Number(value))} W</span>
			</span>
		</div>
	);
}
