import type {
	HistoryBucket,
	HistoryRange,
	HistoryResponse,
} from "@/interface";
import { prisma } from "./database/db";

const TIME_ZONE = "Europe/Budapest";

const DAY_COUNT: Record<Exclude<HistoryRange, "year">, number> = {
	week: 7,
	month: 30,
};

const MONTH_COUNT = 12;

interface DailyRow {
	date: Date;
	slug: string;
	kwh: number;
	costHuf: number;
	costBlendedHuf: number;
}

interface TodayRow {
	today: Date;
}

/** A DATE oszlopok UTC éjfélen jönnek vissza, ezért UTC getterekkel olvassuk. */
function dayKey(date: Date): string {
	return date.toISOString().slice(0, 10);
}

function shiftDays(date: Date, days: number): Date {
	const next = new Date(date);
	next.setUTCDate(next.getUTCDate() + days);
	return next;
}

function shiftMonths(date: Date, months: number): Date {
	const next = new Date(date);
	next.setUTCDate(1);
	next.setUTCMonth(next.getUTCMonth() + months);
	return next;
}

function emptyBucket(key: string, label: string): HistoryBucket {
	return { key, label, kwh: 0, costHuf: 0, costBlendedHuf: 0, byDevice: {} };
}

export async function getHistory(
	range: HistoryRange,
): Promise<HistoryResponse> {
	const [todayRow] = await prisma.$queryRaw<TodayRow[]>`
		SELECT (now() AT TIME ZONE ${TIME_ZONE})::date AS today
	`;
	const today = todayRow?.today ?? new Date();

	const from =
		range === "year"
			? shiftMonths(today, -(MONTH_COUNT - 1))
			: shiftDays(today, -(DAY_COUNT[range] - 1));

	const rows = await prisma.$queryRaw<DailyRow[]>`
		SELECT
			de."date",
			d."slug",
			de."kwh"::double precision AS kwh,
			de."costHuf"::double precision AS "costHuf",
			de."costBlendedHuf"::double precision AS "costBlendedHuf"
		FROM "DailyEnergy" de
		JOIN "Device" d ON d."id" = de."deviceId"
		WHERE de."date" >= ${from}::date
		ORDER BY de."date"
	`;

	const devices = await prisma.device.findMany({
		orderBy: { slug: "asc" },
		select: { slug: true, name: true },
	});

	// Előre legyártjuk az összes vödröt, hogy az adat nélküli napok is
	// megjelenjenek a tengelyen — különben hazudna a grafikon ritmusa.
	const buckets: HistoryBucket[] = [];
	const byKey = new Map<string, HistoryBucket>();

	if (range === "year") {
		for (let i = MONTH_COUNT - 1; i >= 0; i--) {
			const month = shiftMonths(today, -i);
			const key = dayKey(month).slice(0, 7);
			const bucket = emptyBucket(key, key.replace("-", "."));
			buckets.push(bucket);
			byKey.set(key, bucket);
		}
	} else {
		for (let i = DAY_COUNT[range] - 1; i >= 0; i--) {
			const day = shiftDays(today, -i);
			const key = dayKey(day);
			const bucket = emptyBucket(key, key.slice(5).replace("-", "."));
			buckets.push(bucket);
			byKey.set(key, bucket);
		}
	}

	for (const row of rows) {
		const full = dayKey(row.date);
		const key = range === "year" ? full.slice(0, 7) : full;
		const bucket = byKey.get(key);
		if (!bucket) {
			continue;
		}
		bucket.kwh += row.kwh;
		bucket.costHuf += row.costHuf;
		bucket.costBlendedHuf += row.costBlendedHuf;
		bucket.byDevice[row.slug] = (bucket.byDevice[row.slug] ?? 0) + row.kwh;
	}

	const withData = buckets.filter((bucket) => bucket.kwh > 0);
	const peak = withData.reduce<HistoryBucket | null>(
		(best, bucket) => (best === null || bucket.kwh > best.kwh ? bucket : best),
		null,
	);

	return {
		range,
		devices,
		buckets,
		totalKwh: buckets.reduce((sum, b) => sum + b.kwh, 0),
		totalCostHuf: buckets.reduce((sum, b) => sum + b.costHuf, 0),
		totalCostBlendedHuf: buckets.reduce((sum, b) => sum + b.costBlendedHuf, 0),
		averageKwh:
			withData.length === 0
				? 0
				: withData.reduce((sum, b) => sum + b.kwh, 0) / withData.length,
		peak,
	};
}
