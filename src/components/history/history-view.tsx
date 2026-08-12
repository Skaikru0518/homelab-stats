"use client";

import { EnergyBarChart } from "@/components/chart/energy-bar-chart";
import { Card, Label } from "@/components/ui/card";
import type { HistoryRange, HistoryResponse } from "@/interface";
import { formatHuf, formatKwh } from "@/lib/format";
import { useEffect, useState } from "react";

const RANGES: { value: HistoryRange; label: string }[] = [
	{ value: "week", label: "7 nap" },
	{ value: "month", label: "30 nap" },
	{ value: "year", label: "12 hónap" },
];

/** Recharts interval: hány címkét hagyjon ki két kiírt között. */
const LABEL_INTERVAL: Record<HistoryRange, number> = {
	week: 0,
	month: 4,
	year: 0,
};

interface HistoryViewProps {
	initial: HistoryResponse;
}

export function HistoryView({ initial }: HistoryViewProps) {
	const [range, setRange] = useState<HistoryRange>(initial.range);
	const [data, setData] = useState(initial);
	const [loading, setLoading] = useState(false);

	useEffect(() => {
		if (range === data.range) {
			return;
		}

		let cancelled = false;
		setLoading(true);

		fetch(`/api/history?range=${range}`, { cache: "no-store" })
			.then((response) => response.json() as Promise<HistoryResponse>)
			.then((next) => {
				if (!cancelled) {
					setData(next);
				}
			})
			.catch(() => undefined)
			.finally(() => {
				if (!cancelled) {
					setLoading(false);
				}
			});

		return () => {
			cancelled = true;
		};
	}, [range, data.range]);

	const unit = data.range === "year" ? "hónap" : "nap";

	return (
		<div className="flex flex-col gap-4">
			<div className="flex flex-wrap items-center justify-between gap-3">
				<h1 className="text-lg font-semibold tracking-tight">Előzmények</h1>
				<div
					className="flex gap-1 rounded-lg border border-app-border bg-app-panel p-1"
					role="group"
					aria-label="Időszak"
				>
					{RANGES.map((option) => (
						<button
							key={option.value}
							type="button"
							onClick={() => setRange(option.value)}
							aria-pressed={range === option.value}
							className={`min-h-9 rounded-md px-3 text-sm font-medium transition-colors ${
								range === option.value
									? "bg-app-inset text-app-text"
									: "text-app-muted hover:text-app-text"
							}`}
						>
							{option.label}
						</button>
					))}
				</div>
			</div>

			<Card className="grid grid-cols-2 gap-4 p-4 sm:grid-cols-4 sm:p-5">
				<Stat label="Fogyasztás" value={`${formatKwh(data.totalKwh)} kWh`} />
				<Stat
					label="Költség"
					value={`${formatHuf(data.totalCostHuf)} Ft`}
					note={`átlagáron ${formatHuf(data.totalCostBlendedHuf)} Ft`}
				/>
				<Stat
					label={`Átlag / ${unit}`}
					value={`${formatKwh(data.averageKwh)} kWh`}
				/>
				<Stat
					label="Csúcs"
					value={
						data.peak ? `${formatKwh(data.peak.kwh)} kWh` : "–"
					}
					note={data.peak?.label}
				/>
			</Card>

			<Card
				className={`p-4 transition-opacity duration-200 sm:p-5 ${
					loading ? "opacity-50" : "opacity-100"
				}`}
			>
				<EnergyBarChart
					buckets={data.buckets}
					series={data.devices}
					labelInterval={LABEL_INTERVAL[data.range]}
				/>
			</Card>
		</div>
	);
}

function Stat({
	label,
	value,
	note,
}: {
	label: string;
	value: string;
	note?: string;
}) {
	return (
		<div className="flex flex-col gap-1">
			<Label>{label}</Label>
			<span className="font-mono text-lg font-semibold tabular-nums">
				{value}
			</span>
			{note && (
				<span className="font-mono text-[11px] text-app-faint">{note}</span>
			)}
		</div>
	);
}
