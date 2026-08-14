import type {
	DeviceDailyRow,
	DeviceDetailResponse,
	PeriodTotals,
	PlugLiveStatus,
} from "@/interface";
import { prisma } from "./database/db";
import { getPowerSeries } from "./series";
import { BUCKET_COUNT, WINDOW_HOURS } from "./stats";
import { fetchTasmotaEnergy } from "./tasmota";

const TIME_ZONE = "Europe/Budapest";
const DAILY_DAYS = 30;

interface DailyRow {
	date: Date;
	kwh: number;
	costHuf: number;
	costBlendedHuf: number;
	avgPower: number;
	peakPower: number;
}

interface TodayRow {
	today: Date;
}

function dayKey(date: Date): string {
	return date.toISOString().slice(0, 10);
}

function shiftDays(date: Date, days: number): Date {
	const next = new Date(date);
	next.setUTCDate(next.getUTCDate() + days);
	return next;
}

function sum(rows: DeviceDailyRow[]): PeriodTotals {
	return {
		kwh: rows.reduce((total, row) => total + row.kwh, 0),
		costHuf: rows.reduce((total, row) => total + row.costHuf, 0),
		costBlendedHuf: rows.reduce((total, row) => total + row.costBlendedHuf, 0),
	};
}

/** Null, ha nincs ilyen slug. */
export async function getDeviceDetail(
	slug: string,
): Promise<DeviceDetailResponse | null> {
	const found = await prisma.device.findUnique({
		where: { slug },
		select: {
			id: true,
			slug: true,
			name: true,
			host: true,
			enabled: true,
			parent: { select: { slug: true } },
		},
	});

	if (!found) {
		return null;
	}

	const device = { ...found, parentSlug: found.parent?.slug ?? null };

	const [todayRow] = await prisma.$queryRaw<TodayRow[]>`
		SELECT (now() AT TIME ZONE ${TIME_ZONE})::date AS today
	`;
	const today = todayRow?.today ?? new Date();
	const from = shiftDays(today, -(DAILY_DAYS - 1));

	const [rows, seriesByDevice, live] = await Promise.all([
		prisma.$queryRaw<DailyRow[]>`
			SELECT
				"date",
				"kwh"::double precision AS kwh,
				"costHuf"::double precision AS "costHuf",
				"costBlendedHuf"::double precision AS "costBlendedHuf",
				"avgPower"::double precision AS "avgPower",
				"peakPower"::double precision AS "peakPower"
			FROM "DailyEnergy"
			WHERE "deviceId" = ${device.id} AND "date" >= ${from}::date
			ORDER BY "date"
		`,
		getPowerSeries([device.id], WINDOW_HOURS, BUCKET_COUNT),
		readLive(device),
	]);

	const byKey = new Map(rows.map((row) => [dayKey(row.date), row]));

	const daily: DeviceDailyRow[] = [];
	for (let i = DAILY_DAYS - 1; i >= 0; i--) {
		const key = dayKey(shiftDays(today, -i));
		const row = byKey.get(key);
		daily.push({
			date: key,
			label: key.slice(5).replace("-", "."),
			kwh: row?.kwh ?? 0,
			costHuf: row?.costHuf ?? 0,
			costBlendedHuf: row?.costBlendedHuf ?? 0,
			avgPower: row?.avgPower ?? 0,
			peakPower: row?.peakPower ?? 0,
		});
	}

	const todayEntry = daily[daily.length - 1];

	return {
		slug: device.slug,
		name: device.name,
		host: device.host,
		enabled: device.enabled,
		live,
		today: todayEntry
			? {
					kwh: todayEntry.kwh,
					costHuf: todayEntry.costHuf,
					costBlendedHuf: todayEntry.costBlendedHuf,
				}
			: { kwh: 0, costHuf: 0, costBlendedHuf: 0 },
		last7: sum(daily.slice(-7)),
		last30: sum(daily),
		windowHours: WINDOW_HOURS,
		powerSeries: seriesByDevice.get(device.id) ?? [],
		daily,
	};
}

async function readLive(device: {
	slug: string;
	name: string;
	host: string;
	parentSlug: string | null;
}): Promise<PlugLiveStatus> {
	const identity = {
		slug: device.slug,
		name: device.name,
		host: device.host,
		parentSlug: device.parentSlug,
	};

	try {
		const energy = await fetchTasmotaEnergy(device.host);
		return {
			...identity,
			online: true,
			power: energy.Power,
			voltage: energy.Voltage,
			current: energy.Current,
			apparentPower: energy.ApparentPower,
			reactivePower: energy.ReactivePower,
			factor: energy.Factor,
			totalKwh: energy.Total,
			todayKwh: energy.Today,
		};
	} catch (error) {
		return {
			...identity,
			online: false,
			error: error instanceof Error ? error.message : String(error),
		};
	}
}
