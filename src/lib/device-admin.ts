import type {
	DeviceListItem,
	FieldErrors,
	MutationResult,
} from "@/interface";
import { prisma } from "./database/db";
import { fetchTasmotaEnergy } from "./tasmota";

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** IPv4 cím vagy hostname, opcionális porttal. */
const HOST_PATTERN =
	/^(?:\d{1,3}(?:\.\d{1,3}){3}|[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?)*)(?::\d{1,5})?$/;

const MAX_NAME_LENGTH = 60;

/**
 * Rövidebb timeout, mint a dashboardon. Itt az állapot csak kiegészítő infó,
 * viszont mentés után a lista újratöltésére vár a felhasználó — egy rossz IP
 * ne tartsa fel másodpercekig.
 */
const STATUS_TIMEOUT_MS = 1500;

interface DeviceInput {
	slug?: unknown;
	name?: unknown;
	host?: unknown;
	enabled?: unknown;
}

interface CleanDevice {
	slug: string;
	name: string;
	host: string;
	enabled: boolean;
}

function isValidIpv4(host: string): boolean {
	const address = host.split(":")[0] ?? "";
	if (!/^\d{1,3}(?:\.\d{1,3}){3}$/.test(address)) {
		return true; // hostname, nem IP — nincs oktett ellenőrzés
	}
	return address
		.split(".")
		.every((part) => Number(part) >= 0 && Number(part) <= 255);
}

function validate(
	input: DeviceInput,
	{ requireSlug }: { requireSlug: boolean },
): { errors: FieldErrors; clean: Partial<CleanDevice> } {
	const errors: FieldErrors = {};
	const clean: Partial<CleanDevice> = {};

	if (requireSlug || input.slug !== undefined) {
		const slug = String(input.slug ?? "").trim();
		if (slug.length === 0) {
			errors.slug = "Az azonosító kötelező.";
		} else if (!SLUG_PATTERN.test(slug)) {
			errors.slug =
				"Csak kisbetű, szám és kötőjel használható, például: plug-3.";
		} else {
			clean.slug = slug;
		}
	}

	if (input.name !== undefined) {
		const name = String(input.name).trim();
		if (name.length === 0) {
			errors.name = "A név kötelező.";
		} else if (name.length > MAX_NAME_LENGTH) {
			errors.name = `Legfeljebb ${MAX_NAME_LENGTH} karakter.`;
		} else {
			clean.name = name;
		}
	}

	if (input.host !== undefined) {
		const host = String(input.host).trim();
		if (host.length === 0) {
			errors.host = "Az IP cím kötelező.";
		} else if (!HOST_PATTERN.test(host) || !isValidIpv4(host)) {
			errors.host = "Érvénytelen IP cím vagy hostnév.";
		} else {
			clean.host = host;
		}
	}

	if (input.enabled !== undefined) {
		clean.enabled = Boolean(input.enabled);
	}

	return { errors, clean };
}

export async function listDevices(): Promise<DeviceListItem[]> {
	const devices = await prisma.device.findMany({
		orderBy: { slug: "asc" },
		select: {
			slug: true,
			name: true,
			host: true,
			enabled: true,
			_count: { select: { readings: true } },
		},
	});

	return Promise.all(
		devices.map(async (device): Promise<DeviceListItem> => {
			const base = {
				slug: device.slug,
				name: device.name,
				host: device.host,
				enabled: device.enabled,
				readingCount: device._count.readings,
			};

			// Kikapcsolt eszközt nem hívogatunk — pont azért van kikapcsolva.
			if (!device.enabled) {
				return { ...base, online: null, power: null, error: null };
			}

			try {
				const energy = await fetchTasmotaEnergy(device.host, STATUS_TIMEOUT_MS);
				return { ...base, online: true, power: energy.Power, error: null };
			} catch (error) {
				return {
					...base,
					online: false,
					power: null,
					error: error instanceof Error ? error.message : String(error),
				};
			}
		}),
	);
}

export async function createDevice(input: DeviceInput): Promise<MutationResult> {
	const { errors, clean } = validate(
		{ ...input, name: input.name ?? "", host: input.host ?? "" },
		{ requireSlug: true },
	);

	if (Object.keys(errors).length > 0) {
		return { ok: false, errors };
	}

	const existing = await prisma.device.findUnique({
		where: { slug: clean.slug as string },
		select: { slug: true },
	});

	if (existing) {
		return { ok: false, errors: { slug: "Ez az azonosító már foglalt." } };
	}

	const device = await prisma.device.create({
		data: {
			slug: clean.slug as string,
			name: clean.name as string,
			host: clean.host as string,
			enabled: clean.enabled ?? true,
		},
		select: { slug: true },
	});

	return { ok: true, slug: device.slug };
}

export async function updateDevice(
	slug: string,
	input: DeviceInput,
): Promise<MutationResult> {
	const { errors, clean } = validate(input, { requireSlug: false });

	if (Object.keys(errors).length > 0) {
		return { ok: false, errors };
	}

	const existing = await prisma.device.findUnique({
		where: { slug },
		select: { slug: true },
	});

	if (!existing) {
		return { ok: false, errors: { form: "Nincs ilyen eszköz." } };
	}

	// A slug stabil azonosító, arra hivatkoznak a linkek és a mentett adatok.
	const { slug: _ignored, ...updatable } = clean;

	await prisma.device.update({ where: { slug }, data: updatable });

	return { ok: true, slug };
}

export async function deleteDevice(slug: string): Promise<MutationResult> {
	const existing = await prisma.device.findUnique({
		where: { slug },
		select: { slug: true },
	});

	if (!existing) {
		return { ok: false, errors: { form: "Nincs ilyen eszköz." } };
	}

	// A Reading és DailyEnergy sorok kaszkádolva törlődnek.
	await prisma.device.delete({ where: { slug } });

	return { ok: true, slug };
}
