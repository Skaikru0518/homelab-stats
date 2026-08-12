import type {
	CreateReadingDto,
	DevicePollResult,
	PollSummary,
} from "@/interface";
import { prisma } from "@/lib/database/db";
import { readDevice } from "@/lib/tasmota";

/** Percre kerekít lefelé — a kör minden mérése ugyanazt a percet kapja. */
function floorToMinute(date: Date): Date {
	const floored = new Date(date);
	floored.setSeconds(0, 0);
	return floored;
}

/**
 * Lekérdezi az összes engedélyezett eszközt és beírja a méréseket.
 * Egy eszköz hibája nem befolyásolja a többit.
 */
export async function pollAllDevices(
	now: Date = new Date(),
): Promise<PollSummary> {
	const ts = floorToMinute(now);

	const devices = await prisma.device.findMany({
		where: { enabled: true },
		select: { id: true, slug: true, host: true },
	});

	const settled = await Promise.allSettled(
		devices.map((device) => readDevice(device, ts)),
	);

	const readings: CreateReadingDto[] = [];
	const results: DevicePollResult[] = [];

	for (const [index, outcome] of settled.entries()) {
		// biztosan létezik: a settled tömb a devices tömbből származik
		const device = devices[index] as (typeof devices)[number];

		if (outcome.status === "fulfilled") {
			readings.push(outcome.value);
			results.push({ slug: device.slug, host: device.host, ok: true });
		} else {
			results.push({
				slug: device.slug,
				host: device.host,
				ok: false,
				error:
					outcome.reason instanceof Error
						? outcome.reason.message
						: String(outcome.reason),
			});
		}
	}

	const { count } = readings.length
		? await prisma.reading.createMany({ data: readings, skipDuplicates: true })
		: { count: 0 };

	return { ts, inserted: count, results };
}
