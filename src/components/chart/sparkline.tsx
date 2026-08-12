"use client";

import { SERIES_COLORS } from "@/components/chart/chart-theme";
import { Area, AreaChart, ResponsiveContainer } from "recharts";

interface SparklineProps {
	/** Egyenletes időközű értékek. A null adathiány, ott megszakad a vonal. */
	data: (number | null)[];
	/** Egyedi azonosító a gradienshez, hogy több sparkline ne ütközzön. */
	gradientId: string;
	height?: number;
}

const ACCENT = SERIES_COLORS[0];

/** Tengely és tooltip nélküli mini grafikon a kártyákra. */
export function Sparkline({ data, gradientId, height = 32 }: SparklineProps) {
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

	const rows = data.map((value, index) => ({ index, power: value }));

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
					<Area
						type="monotone"
						dataKey="power"
						stroke={ACCENT}
						strokeWidth={1.5}
						fill={`url(#${gradientId})`}
						connectNulls={false}
						dot={false}
						isAnimationActive={false}
					/>
				</AreaChart>
			</ResponsiveContainer>
		</div>
	);
}
