"use client";

import { EnergyBarChart } from "@/components/chart/energy-bar-chart";
import { PowerAreaChart } from "@/components/chart/power-area-chart";
import { LoadBar } from "@/components/plug/load-bar";
import { StatusDot } from "@/components/plug/status-dot";
import { AnimatedWatts } from "@/components/ui/animated-watts";
import { Card, Label } from "@/components/ui/card";
import type { DeviceDetailResponse } from "@/interface";
import {
	formatAmps,
	formatFactor,
	formatHuf,
	formatKwh,
	formatVolts,
	formatWatts,
} from "@/lib/format";
import { usePolling } from "@/lib/use-polling";
import { ArrowLeft, WifiOff } from "lucide-react";
import Link from "next/link";

const REFRESH_MS = 5_000;

interface DeviceDetailViewProps {
	initial: DeviceDetailResponse;
}

export function DeviceDetailView({ initial }: DeviceDetailViewProps) {
	const { data, live } = usePolling<DeviceDetailResponse>(
		`/api/device/${initial.slug}`,
		REFRESH_MS,
		initial,
	);

	const series = [{ slug: data.slug, name: data.name }];

	return (
		<div className="flex flex-col gap-4">
			<div className="flex animate-rise flex-wrap items-center justify-between gap-3">
				<div className="flex items-center gap-2.5">
					<StatusDot online={data.live.online} pulse={live} />
					<h1 className="text-lg font-semibold tracking-tight">{data.name}</h1>
					<span className="font-mono text-xs text-app-faint">{data.host}</span>
				</div>
				<Link
					href="/"
					className="flex min-h-9 items-center gap-1.5 rounded-lg border border-app-border bg-app-panel px-3 py-2 text-sm text-app-muted transition-colors hover:text-app-text"
				>
					<ArrowLeft size={15} aria-hidden="true" />
					Vissza az áttekintéshez
				</Link>
			</div>

			{data.live.online ? (
				<Card className="flex flex-col gap-4 p-4 sm:p-6" delay={60}>
					<div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
						<div className="flex flex-col gap-2">
							<Label>Jelenlegi teljesítmény</Label>
							<div className="flex items-baseline gap-2">
								<span className="font-mono text-5xl font-semibold leading-none tracking-tighter sm:text-6xl">
									<AnimatedWatts value={data.live.power} />
								</span>
								<span className="text-xl text-app-muted">W</span>
							</div>
						</div>
						<dl className="grid grid-cols-3 gap-4 sm:gap-8">
							<Metric
								label="Feszültség"
								value={`${formatVolts(data.live.voltage)} V`}
							/>
							<Metric
								label="Áram"
								value={`${formatAmps(data.live.current)} A`}
							/>
							<Metric
								label="Tényező"
								value={formatFactor(data.live.factor)}
							/>
						</dl>
					</div>
					<LoadBar current={data.live.current} />
				</Card>
			) : (
				<Card className="flex flex-col gap-1.5 p-6" delay={60}>
					<p className="flex items-center gap-2 text-sm font-medium text-rose-600 dark:text-rose-400">
						<WifiOff size={16} aria-hidden="true" />
						Nem érhető el
					</p>
					<p className="font-mono text-xs text-app-muted">{data.live.error}</p>
				</Card>
			)}

			<div className="grid gap-4 sm:grid-cols-3">
				<PeriodCard label="Ma" totals={data.today} delay={110} />
				<PeriodCard label="Utolsó 7 nap" totals={data.last7} delay={150} />
				<PeriodCard label="Utolsó 30 nap" totals={data.last30} delay={190} />
			</div>

			<Card className="flex flex-col gap-4 p-4 sm:p-5" delay={200}>
				<div className="flex items-baseline justify-between">
					<h2 className="text-sm font-semibold">Teljesítmény</h2>
					<span className="text-[11px] text-app-faint">
						utolsó {data.windowHours} óra
					</span>
				</div>
				<PowerAreaChart
					data={data.powerSeries}
					windowHours={data.windowHours}
					name={data.name}
				/>
			</Card>

			<Card className="flex flex-col gap-4 p-4 sm:p-5" delay={260}>
				<div className="flex items-baseline justify-between">
					<h2 className="text-sm font-semibold">Napi fogyasztás</h2>
					<span className="text-[11px] text-app-faint">utolsó 30 nap</span>
				</div>
				<EnergyBarChart
					buckets={data.daily.map((row) => ({
						key: row.date,
						label: row.label,
						byDevice: { [data.slug]: row.kwh },
					}))}
					series={series}
					labelInterval={4}
					showLegend={false}
				/>
			</Card>

			<DailyTable rows={data.daily} />
		</div>
	);
}

function PeriodCard({
	label,
	totals,
	delay,
}: {
	label: string;
	totals: DeviceDetailResponse["today"];
	delay: number;
}) {
	return (
		<Card className="flex flex-col gap-1 p-4" delay={delay}>
			<Label>{label}</Label>
			<span className="font-mono text-xl font-semibold tabular-nums">
				{formatKwh(totals.kwh)} kWh
			</span>
			<span className="font-mono text-sm text-app-muted">
				{formatHuf(totals.costHuf)} Ft
			</span>
			<span className="font-mono text-[11px] text-app-faint">
				átlagáron {formatHuf(totals.costBlendedHuf)} Ft
			</span>
		</Card>
	);
}

function DailyTable({ rows }: { rows: DeviceDetailResponse["daily"] }) {
	const withData = [...rows].reverse().filter((row) => row.kwh > 0);

	if (withData.length === 0) {
		return null;
	}

	return (
		<Card className="overflow-hidden" delay={320}>
			<div className="overflow-x-auto">
				<table className="w-full text-sm">
					<thead>
						<tr className="border-b border-app-border text-left">
							<Th>Nap</Th>
							<Th align="right">kWh</Th>
							<Th align="right">Költség</Th>
							<Th align="right">Átlag</Th>
							<Th align="right">Csúcs</Th>
						</tr>
					</thead>
					<tbody>
						{withData.map((row) => (
							<tr
								key={row.date}
								className="border-b border-app-border last:border-0"
							>
								<Td>{row.date}</Td>
								<Td align="right">{formatKwh(row.kwh)}</Td>
								<Td align="right">{formatHuf(row.costHuf)} Ft</Td>
								<Td align="right">{formatWatts(row.avgPower)} W</Td>
								<Td align="right">{formatWatts(row.peakPower)} W</Td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</Card>
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
}: {
	children: React.ReactNode;
	align?: "left" | "right";
}) {
	return (
		<td
			className={`whitespace-nowrap px-4 py-2.5 font-mono tabular-nums ${
				align === "right" ? "text-right" : "text-left"
			}`}
		>
			{children}
		</td>
	);
}

function Metric({ label, value }: { label: string; value: string }) {
	return (
		<div className="flex flex-col gap-0.5">
			<dt>
				<Label>{label}</Label>
			</dt>
			<dd className="font-mono text-sm tabular-nums text-app-muted">{value}</dd>
		</div>
	);
}
