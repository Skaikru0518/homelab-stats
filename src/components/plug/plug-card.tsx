import { Sparkline } from "@/components/chart/sparkline";
import { LoadBar } from "@/components/plug/load-bar";
import { StatusDot } from "@/components/plug/status-dot";
import { AnimatedWatts } from "@/components/ui/animated-watts";
import { Card, Label } from "@/components/ui/card";
import type { DeviceStats, PlugLiveStatus } from "@/interface";
import {
	formatAmps,
	formatFactor,
	formatHuf,
	formatKwh,
	formatVolts,
	formatWatts,
} from "@/lib/format";

interface PlugCardProps {
	plug: PlugLiveStatus;
	stats: DeviceStats | undefined;
}

export function PlugCard({ plug, stats }: PlugCardProps) {
	const known = (stats?.series ?? []).filter(
		(value): value is number => value !== null,
	);
	const peakWatts = known.length > 0 ? Math.max(...known) : null;

	return (
		<Card className="flex flex-col gap-4 p-4 sm:p-5">
			<div className="flex items-center justify-between gap-3">
				<div className="flex min-w-0 items-center gap-2">
					<StatusDot online={plug.online} />
					<h2 className="truncate text-sm font-semibold">{plug.name}</h2>
				</div>
				<span className="shrink-0 font-mono text-[11px] text-app-faint">
					{plug.host}
				</span>
			</div>

			{plug.online ? (
				<>
					<div className="flex items-baseline gap-1.5">
						<span className="font-mono text-4xl font-semibold leading-none tracking-tight sm:text-[2.75rem]">
							<AnimatedWatts value={plug.power} />
						</span>
						<span className="text-lg text-app-muted">W</span>
					</div>

					<LoadBar current={plug.current} />

					<div className="flex flex-col gap-1">
						<div className="flex items-baseline justify-between">
							<Label>24 óra</Label>
							<span className="font-mono text-[11px] text-app-faint">
								{peakWatts === null ? "gyűlik az adat" : `csúcs ${formatWatts(peakWatts)} W`}
							</span>
						</div>
						<div className="text-emerald-600 dark:text-emerald-400">
							<Sparkline
								data={stats?.series ?? []}
								gradientId={`spark-${plug.slug}`}
								label={`${plug.name} teljesítménye az elmúlt 24 órában`}
							/>
						</div>
					</div>

					<dl className="grid grid-cols-3 gap-2 border-t border-app-border pt-3">
						<Metric label="Feszültség" value={`${formatVolts(plug.voltage)} V`} />
						<Metric label="Áram" value={`${formatAmps(plug.current)} A`} />
						<Metric label="Tényező" value={formatFactor(plug.factor)} />
					</dl>

					<dl className="grid grid-cols-2 gap-2 rounded-lg bg-app-inset p-3">
						<Metric
							label="Ma"
							value={`${formatKwh(stats?.todayKwh ?? 0)} kWh`}
							emphasis
						/>
						<Metric
							label="Ma költség"
							value={`${formatHuf(stats?.todayCostHuf ?? 0)} Ft`}
							emphasis
						/>
					</dl>
				</>
			) : (
				<div className="flex flex-1 flex-col justify-center gap-1.5 py-6">
					<p className="text-sm font-medium text-rose-600 dark:text-rose-400">
						Nem érhető el
					</p>
					<p className="font-mono text-xs leading-relaxed text-app-muted">
						{plug.error}
					</p>
				</div>
			)}
		</Card>
	);
}

interface MetricProps {
	label: string;
	value: string;
	emphasis?: boolean;
}

function Metric({ label, value, emphasis = false }: MetricProps) {
	return (
		<div className="flex flex-col gap-0.5">
			<dt>
				<Label>{label}</Label>
			</dt>
			<dd
				className={`font-mono tabular-nums ${
					emphasis ? "text-base font-semibold" : "text-sm text-app-muted"
				}`}
			>
				{value}
			</dd>
		</div>
	);
}
