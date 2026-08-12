"use client";

import { SERIES_COLORS } from "@/components/chart/chart-theme";
import {
	type ChartMetric,
	EnergyBarChart,
} from "@/components/chart/energy-bar-chart";
import { Card, Label } from "@/components/ui/card";
import type { HistoryRange, HistoryResponse } from "@/interface";
import { formatHuf, formatKwh } from "@/lib/format";
import { TrendingDown, TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";

const RANGES: { value: HistoryRange; label: string }[] = [
	{ value: "week", label: "7 nap" },
	{ value: "month", label: "30 nap" },
	{ value: "year", label: "12 hónap" },
];

const METRICS: { value: ChartMetric; label: string }[] = [
	{ value: "kwh", label: "kWh" },
	{ value: "cost", label: "Ft" },
];

/** Recharts interval: hány címkét hagyjon ki két kiírt között. */
const LABEL_INTERVAL: Record<HistoryRange, number> = {
	week: 0,
	month: 4,
	year: 0,
};

const PREVIOUS_LABEL: Record<HistoryRange, string> = {
	week: "előző 7 naphoz",
	month: "előző 30 naphoz",
	year: "előző 12 hónaphoz",
};

interface HistoryViewProps {
	initial: HistoryResponse;
}

export function HistoryView({ initial }: HistoryViewProps) {
	const [range, setRange] = useState<HistoryRange>(initial.range);
	const [metric, setMetric] = useState<ChartMetric>("kwh");
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
				<SegmentedControl
					label="Időszak"
					options={RANGES}
					value={range}
					onChange={setRange}
				/>
			</div>

			<Card className="grid grid-cols-2 gap-4 p-4 sm:grid-cols-4 sm:p-5">
				<Stat
					label="Fogyasztás"
					value={`${formatKwh(data.totalKwh)} kWh`}
					change={data.changePercent}
					changeNote={PREVIOUS_LABEL[data.range]}
				/>
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
					value={data.peak ? `${formatKwh(data.peak.kwh)} kWh` : "–"}
					note={data.peak?.label}
				/>
			</Card>

			<Card
				className={`flex flex-col gap-4 p-4 transition-opacity duration-200 sm:p-5 ${
					loading ? "opacity-50" : "opacity-100"
				}`}
			>
				<div className="flex items-center justify-between gap-3">
					<h2 className="text-sm font-semibold">
						{metric === "kwh" ? "Fogyasztás" : "Költség"} eszközönként
					</h2>
					<SegmentedControl
						label="Mértékegység"
						options={METRICS}
						value={metric}
						onChange={setMetric}
						compact
					/>
				</div>
				<EnergyBarChart
					buckets={data.buckets}
					series={data.devices}
					labelInterval={LABEL_INTERVAL[data.range]}
					metric={metric}
				/>
			</Card>

			<DeviceBreakdown data={data} />
			<BucketTable data={data} />
		</div>
	);
}

function DeviceBreakdown({ data }: { data: HistoryResponse }) {
	if (data.totalKwh === 0) {
		return null;
	}

	return (
		<Card className="flex flex-col gap-4 p-4 sm:p-5">
			<h2 className="text-sm font-semibold">Megoszlás</h2>
			<div className="flex flex-col gap-3">
				{data.deviceTotals.map((device, index) => (
					<div key={device.slug} className="flex flex-col gap-1.5">
						<div className="flex items-baseline justify-between gap-3">
							<span className="flex items-center gap-2 text-sm">
								<span
									className="size-2 shrink-0 rounded-full"
									style={{
										backgroundColor:
											SERIES_COLORS[index % SERIES_COLORS.length],
									}}
								/>
								{device.name}
							</span>
							<span className="font-mono text-sm tabular-nums">
								{formatKwh(device.kwh)} kWh
								<span className="ml-2 text-app-muted">
									{formatHuf(device.costHuf)} Ft
								</span>
								<span className="ml-2 text-app-faint">
									{Math.round(device.share * 100)}%
								</span>
							</span>
						</div>
						<div className="h-1.5 overflow-hidden rounded-full bg-app-inset">
							<div
								className="h-full rounded-full transition-[width] duration-500 ease-out"
								style={{
									width: `${device.share * 100}%`,
									backgroundColor:
										SERIES_COLORS[index % SERIES_COLORS.length],
								}}
							/>
						</div>
					</div>
				))}
			</div>
		</Card>
	);
}

function BucketTable({ data }: { data: HistoryResponse }) {
	const rows = [...data.buckets].reverse().filter((bucket) => bucket.kwh > 0);

	if (rows.length === 0) {
		return null;
	}

	return (
		<Card className="overflow-hidden">
			<div className="overflow-x-auto">
				<table className="w-full text-sm">
					<thead>
						<tr className="border-b border-app-border">
							<Th>{data.range === "year" ? "Hónap" : "Nap"}</Th>
							{data.devices.map((device) => (
								<Th key={device.slug} align="right">
									{device.name}
								</Th>
							))}
							<Th align="right">Összesen</Th>
							<Th align="right">Költség</Th>
						</tr>
					</thead>
					<tbody>
						{rows.map((bucket) => (
							<tr
								key={bucket.key}
								className="border-b border-app-border last:border-0"
							>
								<Td>{bucket.key}</Td>
								{data.devices.map((device) => (
									<Td key={device.slug} align="right" muted>
										{formatKwh(bucket.byDevice[device.slug] ?? 0)}
									</Td>
								))}
								<Td align="right">{formatKwh(bucket.kwh)} kWh</Td>
								<Td align="right">{formatHuf(bucket.costHuf)} Ft</Td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</Card>
	);
}

interface SegmentedControlProps<T extends string> {
	label: string;
	options: { value: T; label: string }[];
	value: T;
	onChange: (value: T) => void;
	compact?: boolean;
}

function SegmentedControl<T extends string>({
	label,
	options,
	value,
	onChange,
	compact = false,
}: SegmentedControlProps<T>) {
	return (
		<div
			className="flex gap-1 rounded-lg border border-app-border bg-app-panel p-1"
			role="group"
			aria-label={label}
		>
			{options.map((option) => (
				<button
					key={option.value}
					type="button"
					onClick={() => onChange(option.value)}
					aria-pressed={value === option.value}
					className={`min-h-9 rounded-md text-sm font-medium transition-colors ${
						compact ? "px-2.5" : "px-3"
					} ${
						value === option.value
							? "bg-app-inset text-app-text"
							: "text-app-muted hover:text-app-text"
					}`}
				>
					{option.label}
				</button>
			))}
		</div>
	);
}

function Stat({
	label,
	value,
	note,
	change,
	changeNote,
}: {
	label: string;
	value: string;
	note?: string;
	change?: number | null;
	changeNote?: string;
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
			{change !== undefined && change !== null && (
				<span
					className={`flex items-center gap-1 font-mono text-[11px] ${
						change > 0
							? "text-amber-600 dark:text-amber-400"
							: "text-emerald-600 dark:text-emerald-400"
					}`}
				>
					{change > 0 ? (
						<TrendingUp size={12} aria-hidden="true" />
					) : (
						<TrendingDown size={12} aria-hidden="true" />
					)}
					{change > 0 ? "+" : ""}
					{Math.round(change)}% {changeNote}
				</span>
			)}
		</div>
	);
}

function Th({
	children,
	align = "left",
}: {
	children: React.ReactNode;
	align?: "left" | "right";
}) {
	return (
		<th
			className={`px-4 py-2.5 text-[11px] font-medium uppercase tracking-wider text-app-faint ${
				align === "right" ? "text-right" : "text-left"
			}`}
		>
			{children}
		</th>
	);
}

function Td({
	children,
	align = "left",
	muted = false,
}: {
	children: React.ReactNode;
	align?: "left" | "right";
	muted?: boolean;
}) {
	return (
		<td
			className={`whitespace-nowrap px-4 py-2.5 font-mono tabular-nums ${
				align === "right" ? "text-right" : "text-left"
			} ${muted ? "text-app-muted" : ""}`}
		>
			{children}
		</td>
	);
}
