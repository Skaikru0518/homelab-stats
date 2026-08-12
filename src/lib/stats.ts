import type { DeviceStats, StatsResponse } from "@/interface";
import { prisma } from "./database/db";
import { getPeakPower, getPowerSeries } from "./series";

const TIME_ZONE = "Europe/Budapest";

export const WINDOW_HOURS = 24;
export const BUCKET_COUNT = 96;

interface TodayRow {
	id: string;
	slug: string;
	kwh: number;
	costHuf: number;
	costBlendedHuf: number;
}

interface PriceRow {
	hufPerKwh: number;
	blendedHufPerKwh: number | null;
}

export async function getStats(): Promise<StatsResponse> {
	const todayRows = await prisma.$queryRaw<TodayRow[]>`
		SELECT
			d."id",
			d."slug",
			COALESCE(de."kwh", 0)::double precision AS kwh,
			COALESCE(de."costHuf", 0)::double precision AS "costHuf",
			COALESCE(de."costBlendedHuf", 0)::double precision AS "costBlendedHuf"
		FROM "Device" d
		LEFT JOIN "DailyEnergy" de
			ON de."deviceId" = d."id"
			AND de."date" = (now() AT TIME ZONE ${TIME_ZONE})::date
		WHERE d."enabled" = TRUE
		ORDER BY d."slug"
	`;

	const priceRows = await prisma.$queryRaw<PriceRow[]>`
		SELECT
			"hufPerKwh"::double precision AS "hufPerKwh",
			"blendedHufPerKwh"::double precision AS "blendedHufPerKwh"
		FROM "ElectricityPrice"
		WHERE "validFrom" <= (now() AT TIME ZONE ${TIME_ZONE})::date
		ORDER BY "validFrom" DESC
		LIMIT 1
	`;

	const deviceIds = todayRows.map((row) => row.id);
	const [seriesByDevice, peakByDevice] = await Promise.all([
		getPowerSeries(deviceIds, WINDOW_HOURS, BUCKET_COUNT),
		getPeakPower(deviceIds, WINDOW_HOURS),
	]);

	const devices: DeviceStats[] = todayRows.map((row) => ({
		slug: row.slug,
		todayKwh: row.kwh,
		todayCostHuf: row.costHuf,
		todayCostBlendedHuf: row.costBlendedHuf,
		series: seriesByDevice.get(row.id) ?? [],
		peakWatts: peakByDevice.get(row.id) ?? null,
	}));

	return {
		windowHours: WINDOW_HOURS,
		totalTodayKwh: devices.reduce((sum, d) => sum + d.todayKwh, 0),
		totalTodayCostHuf: devices.reduce((sum, d) => sum + d.todayCostHuf, 0),
		totalTodayCostBlendedHuf: devices.reduce(
			(sum, d) => sum + d.todayCostBlendedHuf,
			0,
		),
		hufPerKwh: priceRows[0]?.hufPerKwh ?? 0,
		blendedHufPerKwh: priceRows[0]?.blendedHufPerKwh ?? null,
		devices,
	};
}
