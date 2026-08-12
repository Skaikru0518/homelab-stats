import { prisma } from "./database/db";

interface BucketRow {
	deviceId: string;
	bucket: number;
	power: number;
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
