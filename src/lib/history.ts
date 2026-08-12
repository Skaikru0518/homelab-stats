import type {
	HistoryBucket,
	HistoryDeviceTotal,
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
	return {
		key,
		label,
		kwh: 0,
		costHuf: 0,
		costBlendedHuf: 0,
		byDevice: {},
		costByDevice: {},
	};
}

export async function getHistory(
	range: HistoryRange,
): Promise<HistoryResponse> {
	const [todayRow] = await prisma.$queryRaw<TodayRow[]>`
		SELECT (now() AT TIME ZONE ${TIME_ZONE})::date AS today
	`;
	const today = todayRow?.today ?? new Date();

	const isYear = range === "year";
	const from = isYear
		? shiftMonths(today, -(MONTH_COUNT - 1))
		: shiftDays(today, -(DAY_COUNT[range] - 1));

	// Az előző, azonos hosszú időszak az összehasonlításhoz.
	const previousFrom = isYear
		? shiftMonths(from, -MONTH_COUNT)
		: shiftDays(from, -DAY_COUNT[range]);

	const [rows, devices] = await Promise.all([
		prisma.$queryRaw<DailyRow[]>`
			SELECT
				de."date",
				d."slug",
				de."kwh"::double precision AS kwh,
				de."costHuf"::double precision AS "costHuf",
				de."costBlendedHuf"::double precision AS "costBlendedHuf"
			FROM "DailyEnergy" de
			JOIN "Device" d ON d."id" = de."deviceId"
			WHERE de."date" >= ${previousFrom}::date
			ORDER BY de."date"
		`,
		prisma.device.findMany({
			orderBy: { slug: "asc" },
			select: { slug: true, name: true },
		}),
	]);

	// Előre legyártjuk az összes vödröt, hogy az adat nélküli napok is
	// megjelenjenek a tengelyen — különben hazudna a grafikon ritmusa.
	const buckets: HistoryBucket[] = [];
	const byKey = new Map<string, HistoryBucket>();

	if (isYear) {
		for (let i = MONTH_COUNT - 1; i >= 0; i--) {
			const key = dayKey(shiftMonths(today, -i)).slice(0, 7);
			const bucket = emptyBucket(key, key.replace("-", "."));
			buckets.push(bucket);
			byKey.set(key, bucket);
		}
	} else {
		for (let i = DAY_COUNT[range] - 1; i >= 0; i--) {
			const key = dayKey(shiftDays(today, -i));
			const bucket = emptyBucket(key, key.slice(5).replace("-", "."));
			buckets.push(bucket);
			byKey.set(key, bucket);
		}
	}

	const fromKey = dayKey(from);
	const totalsBySlug = new Map<string, HistoryDeviceTotal>();
	let previousKwh = 0;

	for (const row of rows) {
		const full = dayKey(row.date);

		if (full < fromKey) {
			previousKwh += row.kwh;
			continue;
		}

		const bucket = byKey.get(isYear ? full.slice(0, 7) : full);
		if (!bucket) {
			continue;
		}

		bucket.kwh += row.kwh;
		bucket.costHuf += row.costHuf;
		bucket.costBlendedHuf += row.costBlendedHuf;
		bucket.byDevice[row.slug] = (bucket.byDevice[row.slug] ?? 0) + row.kwh;
		bucket.costByDevice[row.slug] =
			(bucket.costByDevice[row.slug] ?? 0) + row.costHuf;

		const total = totalsBySlug.get(row.slug) ?? {
			slug: row.slug,
			name: devices.find((d) => d.slug === row.slug)?.name ?? row.slug,
			kwh: 0,
			costHuf: 0,
			costBlendedHuf: 0,
			share: 0,
		};
		total.kwh += row.kwh;
		total.costHuf += row.costHuf;
		total.costBlendedHuf += row.costBlendedHuf;
		totalsBySlug.set(row.slug, total);
	}

	const totalKwh = buckets.reduce((sum, b) => sum + b.kwh, 0);

	const deviceTotals = devices
		.map(
			(device): HistoryDeviceTotal =>
				totalsBySlug.get(device.slug) ?? {
					...device,
					kwh: 0,
					costHuf: 0,
					costBlendedHuf: 0,
					share: 0,
				},
		)
		.map((total) => ({
			...total,
			share: totalKwh > 0 ? total.kwh / totalKwh : 0,
		}))
		.sort((a, b) => b.kwh - a.kwh);

	const withData = buckets.filter((bucket) => bucket.kwh > 0);
	const peak = withData.reduce<HistoryBucket | null>(
		(best, bucket) => (best === null || bucket.kwh > best.kwh ? bucket : best),
		null,
	);

	return {
		range,
		devices,
		buckets,
		deviceTotals,
		totalKwh,
		totalCostHuf: buckets.reduce((sum, b) => sum + b.costHuf, 0),
		totalCostBlendedHuf: buckets.reduce((sum, b) => sum + b.costBlendedHuf, 0),
		averageKwh:
			withData.length === 0
				? 0
				: withData.reduce((sum, b) => sum + b.kwh, 0) / withData.length,
		peak,
		previousKwh,
		changePercent:
			previousKwh > 0 ? ((totalKwh - previousKwh) / previousKwh) * 100 : null,
	};
}
