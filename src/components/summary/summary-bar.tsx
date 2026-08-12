import { StatusDot } from "@/components/plug/status-dot";
import { AnimatedWatts } from "@/components/ui/animated-watts";
import { Card, Label } from "@/components/ui/card";
import { formatHuf, formatKwh } from "@/lib/format";

interface SummaryBarProps {
	totalPower: number;
	totalTodayKwh: number;
	totalTodayCostHuf: number;
	hufPerKwh: number;
	onlineCount: number;
	deviceCount: number;
	/** Hamis, ha az utolsó frissítés nem sikerült — a számok ilyenkor régiek. */
	live: boolean;
}

export function SummaryBar({
	totalPower,
	totalTodayKwh,
	totalTodayCostHuf,
	hufPerKwh,
	onlineCount,
	deviceCount,
	live,
}: SummaryBarProps) {
	return (
		<Card className="p-4 sm:p-6">
			<div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between sm:gap-8">
				<div className="flex min-w-0 flex-col gap-2">
					<div className="flex items-center gap-2">
						<StatusDot online={live} pulse={live} />
						<Label>
							{live
								? `Jelenlegi fogyasztás · ${onlineCount}/${deviceCount} eszköz`
								: "A kapcsolat megszakadt · utolsó ismert érték"}
						</Label>
					</div>
					<div className="flex items-baseline gap-2">
						<span className="font-mono text-5xl font-semibold leading-none tracking-tighter sm:text-7xl">
							<AnimatedWatts value={totalPower} />
						</span>
						<span className="text-xl text-app-muted sm:text-2xl">W</span>
					</div>
				</div>

				{/* Mobilon rács, hogy a három érték ne feszítse szét a kártyát. */}
				<dl className="grid grid-cols-3 gap-3 sm:flex sm:gap-10">
					<Total label="Ma" value={`${formatKwh(totalTodayKwh)} kWh`} />
					<Total label="Költség" value={`${formatHuf(totalTodayCostHuf)} Ft`} />
					<Total
						label="Egységár"
						value={`${formatHuf(hufPerKwh)} Ft`}
						unit="/kWh"
						muted
					/>
				</dl>
			</div>
		</Card>
	);
}

interface TotalProps {
	label: string;
	value: string;
	/** Mértékegység, ami mobilon elmarad — ott nem férne ki. */
	unit?: string;
	muted?: boolean;
}

function Total({ label, value, unit, muted = false }: TotalProps) {
	return (
		<div className="flex min-w-0 flex-col gap-1">
			<dt>
				<Label>{label}</Label>
			</dt>
			<dd
				className={`font-mono text-base font-semibold tabular-nums sm:text-xl ${
					muted ? "text-app-muted" : ""
				}`}
			>
				{value}
				{unit && <span className="hidden sm:inline">{unit}</span>}
			</dd>
		</div>
	);
}
