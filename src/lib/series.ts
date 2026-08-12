import { prisma } from "./database/db";

interface BucketRow {
	deviceId: string;
	bucket: number;
	power: number;
}

interface PeakRow {
	deviceId: string;
	peak: number;
}

/**
 * Valódi csúcsteljesítmény a nyers mérésekből.
 *
 * A sparkline sorozat vödrökre átlagol, abból a csúcs lesimulna: egy percig
 * tartó 1000 W-os felfutás egy 15 perces átlagban alig látszik.
 */
export async function getPeakPower(
	deviceIds: string[],
	windowHours: number,
): Promise<Map<string, number>> {
	const peaks = new Map<string, number>();

	if (deviceIds.length === 0) {
		return peaks;
	}

	const windowStart = new Date(Date.now() - windowHours * 3_600_000);

	const rows = await prisma.$queryRaw<PeakRow[]>`
		SELECT r."deviceId", MAX(r."power")::double precision AS peak
		FROM "Reading" r
		WHERE r."ts" >= ${windowStart} AND r."deviceId" = ANY(${deviceIds})
		GROUP BY r."deviceId"
	`;

	for (const row of rows) {
		peaks.set(row.deviceId, row.peak);
	}

	return peaks;
}

/**
 * Teljesítmény idősor eszközönként, egyenletes időközű vödrökre átlagolva.
 * A hiányzó vödrök null-ok maradnak — ott megszakad a vonal.
 */
export async function getPowerSeries(
	deviceIds: string[],
	windowHours: number,
	bucketCount: number,
): Promise<Map<string, (number | null)[]>> {
	const series = new Map<string, (number | null)[]>();
	for (const id of deviceIds) {
		series.set(id, new Array<number | null>(bucketCount).fill(null));
	}

	if (deviceIds.length === 0) {
		return series;
	}

	const windowStart = new Date(Date.now() - windowHours * 3_600_000);
	const bucketSeconds = (windowHours * 3600) / bucketCount;

	const rows = await prisma.$queryRaw<BucketRow[]>`
		SELECT
			r."deviceId",
			FLOOR(
				EXTRACT(EPOCH FROM (r."ts" - ${windowStart}::timestamp)) / ${bucketSeconds}
			)::int AS bucket,
			AVG(r."power")::double precision AS power
		FROM "Reading" r
		WHERE r."ts" >= ${windowStart}
			AND r."deviceId" = ANY(${deviceIds})
		GROUP BY r."deviceId", bucket
	`;

	for (const row of rows) {
		const target = series.get(row.deviceId);
		if (target && row.bucket >= 0 && row.bucket < bucketCount) {
			target[row.bucket] = Math.round(row.power);
		}
	}

	return series;
}
