import type { DeviceStats, StatsResponse } from "@/interface";
import { prisma } from "./database/db";

const TIME_ZONE = "Europe/Budapest";

/** Hány órát fed le a sparkline. */
const WINDOW_HOURS = 24;

/** Hány pontból áll a sparkline. 96 pont 24 órán = 15 perces felbontás. */
const BUCKET_COUNT = 96;

interface TodayRow {
	id: string;
	slug: string;
	kwh: number;
	costHuf: number;
	costBlendedHuf: number;
}

interface BucketRow {
	deviceId: string;
	bucket: number;
	power: number;
}

interface PriceRow {
	hufPerKwh: number;
	blendedHufPerKwh: number | null;
}

/**
 * A dashboard összesített adatai: mai fogyasztás és költség eszközönként,
 * plusz a sparkline idősora.
 *
 * A `page.tsx` közvetlenül hívja szerver oldalon, a `/api/stats` pedig
 * ugyanezt adja vissza JSON-ban a kliens frissítéseihez.
 */
export async function getStats(): Promise<StatsResponse> {
	const windowStart = new Date(Date.now() - WINDOW_HOURS * 3_600_000);
	const bucketSeconds = (WINDOW_HOURS * 3600) / BUCKET_COUNT;

	// A mai nap az eszközök helyi naptára szerint, nem UTC szerint.
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

	const bucketRows = await prisma.$queryRaw<BucketRow[]>`
		SELECT
			r."deviceId",
			FLOOR(
				EXTRACT(EPOCH FROM (r."ts" - ${windowStart}::timestamp)) / ${bucketSeconds}
			)::int AS bucket,
			AVG(r."power")::double precision AS power
		FROM "Reading" r
		WHERE r."ts" >= ${windowStart}
		GROUP BY r."deviceId", bucket
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

	// Eszközönként fix hosszú tömb, a hiányzó vödrök null-ok maradnak.
	const seriesByDevice = new Map<string, (number | null)[]>();
	for (const row of todayRows) {
		seriesByDevice.set(row.id, new Array<number | null>(BUCKET_COUNT).fill(null));
	}

	for (const row of bucketRows) {
		const series = seriesByDevice.get(row.deviceId);
		if (!series || row.bucket < 0 || row.bucket >= BUCKET_COUNT) {
			continue;
		}
		series[row.bucket] = Math.round(row.power);
	}

	const devices: DeviceStats[] = todayRows.map((row) => ({
		slug: row.slug,
		todayKwh: row.kwh,
		todayCostHuf: row.costHuf,
		todayCostBlendedHuf: row.costBlendedHuf,
		series: seriesByDevice.get(row.id) ?? [],
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
