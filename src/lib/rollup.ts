import { prisma } from "./database/db";

/** Naphatár ehhez az időzónához igazodik, nem UTC-hez. */
const TIME_ZONE = "Europe/Budapest";

/**
 * Ennyi napra visszamenőleg számoljuk újra az összesítőt minden körben.
 * Kettő azért, hogy egy éjfél körüli leállás után a tegnapi nap is bezáruljon.
 */
const RECOMPUTE_DAYS = 2;

interface DailyAggregate {
	deviceId: string;
	day: Date;
	kwh: number;
	avgPower: number;
	peakPower: number;
	hufPerKwh: number;
}

/**
 * Napi összesítők újraszámolása a nyers mérésekből.
 *
 * A fogyasztás az `totalKwh` számláló egymást követő pozitív különbségeinek
 * összege. A negatív különbség számlálóreset (`EnergyTotal 0`, vagy az eszköz
 * elvesztette a beállításait), nem fogyasztás — azt eldobjuk.
 *
 * Idempotens: ugyanarra a napra bármikor újrafuttatható, mindig a nyers
 * sorokból számol. Ha az app egy napig állt, a következő futás pótolja.
 */
export async function rollupRecentDays(
	now: Date = new Date(),
	days: number = RECOMPUTE_DAYS,
): Promise<number> {
	// Az ablak eleje. A LAG() miatt egy nappal korábbról olvasunk, különben az
	// ablak első mérésének nem lenne előzménye és elveszne egy perc fogyasztás.
	const windowStart = new Date(now);
	windowStart.setUTCDate(windowStart.getUTCDate() - days);
	windowStart.setUTCHours(0, 0, 0, 0);

	const readFrom = new Date(windowStart);
	readFrom.setUTCDate(readFrom.getUTCDate() - 1);

	const rows = await prisma.$queryRaw<DailyAggregate[]>`
		WITH deltas AS (
			SELECT
				r."deviceId",
				(r."ts" AT TIME ZONE 'UTC' AT TIME ZONE ${TIME_ZONE})::date AS day,
				r."power",
				r."totalKwh" - LAG(r."totalKwh")
					OVER (PARTITION BY r."deviceId" ORDER BY r."ts") AS delta
			FROM "Reading" r
			WHERE r."ts" >= ${readFrom}
		),
		daily AS (
			SELECT
				"deviceId",
				day,
				COALESCE(SUM(GREATEST(delta, 0)), 0)::double precision AS kwh,
				AVG("power")::double precision AS "avgPower",
				MAX("power")::double precision AS "peakPower"
			FROM deltas
			GROUP BY "deviceId", day
		)
		SELECT
			d."deviceId",
			d.day,
			d.kwh,
			d."avgPower",
			d."peakPower",
			COALESCE(p."hufPerKwh", 0)::double precision AS "hufPerKwh"
		FROM daily d
		LEFT JOIN LATERAL (
			SELECT pr."hufPerKwh"
			FROM "ElectricityPrice" pr
			WHERE pr."validFrom" <= d.day
			ORDER BY pr."validFrom" DESC
			LIMIT 1
		) p ON TRUE
		WHERE d.day >= ${windowStart}::date
		ORDER BY d.day, d."deviceId"
	`;

	for (const row of rows) {
		const costHuf = row.kwh * row.hufPerKwh;

		await prisma.dailyEnergy.upsert({
			where: { deviceId_date: { deviceId: row.deviceId, date: row.day } },
			update: {
				kwh: row.kwh,
				costHuf,
				avgPower: row.avgPower,
				peakPower: row.peakPower,
			},
			create: {
				deviceId: row.deviceId,
				date: row.day,
				kwh: row.kwh,
				costHuf,
				avgPower: row.avgPower,
				peakPower: row.peakPower,
			},
		});
	}

	return rows.length;
}
