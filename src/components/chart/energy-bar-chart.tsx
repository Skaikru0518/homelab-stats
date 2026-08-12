"use client";

import {
	AXIS_TICK,
	ChartTooltip,
	GRID_COLOR,
	SERIES_COLORS,
} from "@/components/chart/chart-theme";
import { formatKwh } from "@/lib/format";
import {
	Bar,
	BarChart,
	CartesianGrid,
	Legend,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";

export interface EnergySeries {
	slug: string;
	name: string;
}

export interface EnergyBucket {
	key: string;
	label: string;
	byDevice: Record<string, number>;
}

interface EnergyBarChartProps {
	buckets: EnergyBucket[];
	series: EnergySeries[];
	/** Hányadik oszlop kap tengelycímkét. 30 napnál 1-nél nagyobb kell. */
	labelInterval?: number;
	showLegend?: boolean;
	height?: number;
}

export function EnergyBarChart({
	buckets,
	series,
	labelInterval = 0,
	showLegend = true,
	height = 224,
}: EnergyBarChartProps) {
	const hasData = buckets.some((bucket) =>
		series.some((entry) => (bucket.byDevice[entry.slug] ?? 0) > 0),
	);

	if (!hasData) {
		return (
			<div
				className="flex items-center justify-center rounded-lg border border-dashed border-app-border text-sm text-app-muted"
				style={{ height }}
			>
				Ebben az időszakban még nincs rögzített fogyasztás.
			</div>
		);
	}

	const data = buckets.map((bucket) => {
		const row: Record<string, string | number> = { label: bucket.label };
		for (const entry of series) {
			row[entry.slug] = bucket.byDevice[entry.slug] ?? 0;
		}
		return row;
	});

	return (
		<div style={{ height }} className="w-full">
			<ResponsiveContainer width="100%" height="100%">
				<BarChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -8 }}>
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
						interval={labelInterval}
					/>
					<YAxis
						tick={AXIS_TICK}
						tickLine={false}
						axisLine={false}
						width={44}
						tickFormatter={(value: number) => formatKwh(value)}
					/>
					<Tooltip
						cursor={{ fill: "var(--app-inset)" }}
						content={
							<ChartTooltip unit="kWh" showTotal format={formatKwh} />
						}
					/>
					{showLegend && (
						<Legend
							verticalAlign="bottom"
							height={28}
							iconType="circle"
							iconSize={8}
							formatter={(value: string) => (
								<span className="text-[11px] text-app-muted">{value}</span>
							)}
						/>
					)}
					{series.map((entry, index) => (
						<Bar
							key={entry.slug}
							dataKey={entry.slug}
							name={entry.name}
							stackId="kwh"
							fill={SERIES_COLORS[index % SERIES_COLORS.length]}
							radius={index === series.length - 1 ? [3, 3, 0, 0] : undefined}
							isAnimationActive={false}
						/>
					))}
				</BarChart>
			</ResponsiveContainer>
		</div>
	);
}
