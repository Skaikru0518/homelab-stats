"use client";

import { PlugCard } from "@/components/plug/plug-card";
import { SummaryBar } from "@/components/summary/summary-bar";
import type { PlugsResponse, StatsResponse } from "@/interface";
import { usePolling } from "@/lib/use-polling";

/** Az élő értékek gyorsan avulnak, az összesítők percenként egyszer változnak. */
const PLUGS_INTERVAL_MS = 5_000;
const STATS_INTERVAL_MS = 60_000;

interface DashboardLiveProps {
	initialPlugs: PlugsResponse;
	initialStats: StatsResponse;
}

export function DashboardLive({
	initialPlugs,
	initialStats,
}: DashboardLiveProps) {
	const plugs = usePolling<PlugsResponse>(
		"/api/plugs",
		PLUGS_INTERVAL_MS,
		initialPlugs,
	);
	const stats = usePolling<StatsResponse>(
		"/api/stats",
		STATS_INTERVAL_MS,
		initialStats,
	);

	const statsBySlug = new Map(stats.data.devices.map((d) => [d.slug, d]));
	const onlineCount = plugs.data.plugs.filter((p) => p.online).length;

	return (
		<div className="flex flex-col gap-4">
			<SummaryBar
				totalPower={plugs.data.totalPower}
				totalTodayKwh={stats.data.totalTodayKwh}
				totalTodayCostHuf={stats.data.totalTodayCostHuf}
				totalTodayCostBlendedHuf={stats.data.totalTodayCostBlendedHuf}
				hufPerKwh={stats.data.hufPerKwh}
				blendedHufPerKwh={stats.data.blendedHufPerKwh}
				onlineCount={onlineCount}
				deviceCount={plugs.data.plugs.length}
				live={plugs.live}
			/>

			{plugs.data.plugs.length === 0 ? (
				<EmptyState />
			) : (
				<div
					className={`grid gap-4 transition-opacity duration-300 sm:grid-cols-2 ${
						plugs.live ? "opacity-100" : "opacity-60"
					}`}
				>
					{plugs.data.plugs.map((plug, index) => (
						<PlugCard
							key={plug.slug}
							plug={plug}
							stats={statsBySlug.get(plug.slug)}
							windowHours={stats.data.windowHours}
							subDevices={plugs.data.plugs.filter(
								(other) => other.parentSlug === plug.slug,
							)}
							delay={80 + index * 70}
						/>
					))}
				</div>
			)}
		</div>
	);
}

function EmptyState() {
	return (
		<div className="rounded-xl border border-dashed border-app-border p-10 text-center">
			<p className="text-sm font-medium">Nincs figyelt konnektor.</p>
			<p className="mt-1 text-sm text-app-muted">
				Vegyél fel egy eszközt az adatbázisba, vagy kapcsold be a meglévőt.
			</p>
		</div>
	);
}
