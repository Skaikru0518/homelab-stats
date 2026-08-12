"use client";

import {
	AXIS_TICK,
	ChartTooltip,
	GRID_COLOR,
	SERIES_COLORS,
} from "@/components/chart/chart-theme";
import { formatWatts } from "@/lib/format";
import {
	Area,
	AreaChart,
	CartesianGrid,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";

interface PowerAreaChartProps {
	/** Egyenletes időközű értékek. A null adathiány, ott megszakad a vonal. */
	data: (number | null)[];
	windowHours: number;
	name: string;
	height?: number;
}

const ACCENT = SERIES_COLORS[0];

export function PowerAreaChart({
	data,
	windowHours,
	name,
	height = 200,
}: PowerAreaChartProps) {
	const known = data.filter((value): value is number => value !== null);

	if (known.length === 0) {
		return (
			<div
				className="flex items-center justify-center rounded-lg border border-dashed border-app-border text-sm text-app-muted"
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
				<AreaChart data={rows} margin={{ top: 4, right: 4, bottom: 0, left: -8 }}>
					<defs>
						<linearGradient id="power-fill" x1="0" y1="0" x2="0" y2="1">
							<stop offset="0%" stopColor={ACCENT} stopOpacity={0.3} />
							<stop offset="100%" stopColor={ACCENT} stopOpacity={0} />
						</linearGradient>
					</defs>
					<CartesianGrid
						vertical={false}
						stroke={GRID_COLOR}
						strokeDasharray="3 3"
					/>
					<XAxis
						dataKey="label"
						tick={AXIS_TICK}
						tickLine={false}
						axisLine={{ stroke: GRID_COLOR }}
						minTickGap={48}
					/>
					<YAxis
						tick={AXIS_TICK}
						tickLine={false}
						axisLine={false}
						width={44}
						tickFormatter={(value: number) => formatWatts(value)}
					/>
					<Tooltip
						cursor={{ stroke: GRID_COLOR }}
						content={<ChartTooltip unit="W" format={formatWatts} />}
					/>
					<Area
						type="monotone"
						dataKey="power"
						name={name}
						stroke={ACCENT}
						strokeWidth={2}
						fill="url(#power-fill)"
						connectNulls={false}
						dot={false}
						activeDot={{ r: 3 }}
						isAnimationActive={false}
					/>
				</AreaChart>
			</ResponsiveContainer>
		</div>
	);
}
