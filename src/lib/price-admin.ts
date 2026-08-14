import type {
	PriceFieldErrors,
	PriceListItem,
	PriceMutationResult,
} from "@/interface";
import { prisma } from "./database/db";

const TIME_ZONE = "Europe/Budapest";
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const MAX_HUF_PER_KWH = 10_000;

interface PriceInput {
	validFrom?: unknown;
	hufPerKwh?: unknown;
	blendedHufPerKwh?: unknown;
}

interface CleanPrice {
	validFrom: Date;
	hufPerKwh: number;
	blendedHufPerKwh: number | null;
}

interface TodayRow {
	today: Date;
}

interface CountRow {
	n: bigint;
}

function dayKey(date: Date): string {
	return date.toISOString().slice(0, 10);
}

function parseAmount(
	raw: unknown,
): { value: number } | { error: string } {
	const text = String(raw ?? "").trim().replace(",", ".");
	if (text.length === 0) {
		return { error: "Kötelező mező." };
	}
	const value = Number(text);
	if (!Number.isFinite(value)) {
		return { error: "Számot adj meg." };
	}
	if (value <= 0) {
		return { error: "Nullánál nagyobb legyen." };
	}
	if (value > MAX_HUF_PER_KWH) {
		return { error: `Legfeljebb ${MAX_HUF_PER_KWH} Ft/kWh.` };
	}
	return { value };
}

function validate(
	input: PriceInput,
	{ requireAll }: { requireAll: boolean },
): { errors: PriceFieldErrors; clean: Partial<CleanPrice> } {
	const errors: PriceFieldErrors = {};
	const clean: Partial<CleanPrice> = {};

	if (requireAll || input.validFrom !== undefined) {
		const text = String(input.validFrom ?? "").trim();
		if (!DATE_PATTERN.test(text)) {
			errors.validFrom = "Év-hónap-nap formátum kell.";
		} else {
			const parsed = new Date(`${text}T00:00:00Z`);
			if (Number.isNaN(parsed.getTime())) {
				errors.validFrom = "Nem létező dátum.";
			} else {
				clean.validFrom = parsed;
			}
		}
	}

	if (requireAll || input.hufPerKwh !== undefined) {
		const result = parseAmount(input.hufPerKwh);
		if ("error" in result) {
			errors.hufPerKwh = result.error;
		} else {
			clean.hufPerKwh = result.value;
		}
	}

	if (input.blendedHufPerKwh !== undefined) {
		const text = String(input.blendedHufPerKwh ?? "").trim();
		if (text.length === 0) {
			clean.blendedHufPerKwh = null;
		} else {
			const result = parseAmount(text);
			if ("error" in result) {
				errors.blendedHufPerKwh = result.error;
			} else {
				clean.blendedHufPerKwh = result.value;
			}
		}
	}

	return { errors, clean };
}

export async function listPrices(): Promise<PriceListItem[]> {
	const [rows, [todayRow]] = await Promise.all([
		prisma.electricityPrice.findMany({
			orderBy: { validFrom: "desc" },
			select: {
				id: true,
				validFrom: true,
				hufPerKwh: true,
				blendedHufPerKwh: true,
			},
		}),
		prisma.$queryRaw<TodayRow[]>`
			SELECT (now() AT TIME ZONE ${TIME_ZONE})::date AS today
		`,
	]);

	const today = dayKey(todayRow?.today ?? new Date());
	const activeId = rows.find((row) => dayKey(row.validFrom) <= today)?.id;

	return Promise.all(
		rows.map(async (row, index): Promise<PriceListItem> => {
			const validFrom = dayKey(row.validFrom);
			const next = rows[index - 1];
			const validUntil = next ? dayKey(next.validFrom) : null;

			const [count] = await prisma.$queryRaw<CountRow[]>`
				SELECT COUNT(*) AS n
				FROM "DailyEnergy"
				WHERE "date" >= ${row.validFrom}::date
					AND (${validUntil}::date IS NULL OR "date" < ${validUntil}::date)
			`;

			return {
				id: row.id,
				validFrom,
				hufPerKwh: row.hufPerKwh,
				blendedHufPerKwh: row.blendedHufPerKwh,
				active: row.id === activeId,
				validUntil,
				frozenDays: Number(count?.n ?? 0),
			};
		}),
	);
}

export async function createPrice(
	input: PriceInput,
): Promise<PriceMutationResult> {
	const { errors, clean } = validate(input, { requireAll: true });

	if (Object.keys(errors).length > 0) {
		return { ok: false, errors };
	}

	const existing = await prisma.electricityPrice.findUnique({
		where: { validFrom: clean.validFrom as Date },
		select: { id: true },
	});

	if (existing) {
		return {
			ok: false,
			errors: { validFrom: "Erre a napra már van felvett ár." },
		};
	}

	const price = await prisma.electricityPrice.create({
		data: {
			validFrom: clean.validFrom as Date,
			hufPerKwh: clean.hufPerKwh as number,
			blendedHufPerKwh: clean.blendedHufPerKwh ?? null,
		},
		select: { id: true },
	});

	return { ok: true, id: price.id };
}

export async function updatePrice(
	id: string,
	input: PriceInput,
): Promise<PriceMutationResult> {
	const { errors, clean } = validate(input, { requireAll: false });

	if (Object.keys(errors).length > 0) {
		return { ok: false, errors };
	}

	const existing = await prisma.electricityPrice.findUnique({
		where: { id },
		select: { id: true },
	});

	if (!existing) {
		return { ok: false, errors: { form: "Nincs ilyen ár." } };
	}

	if (clean.validFrom) {
		const clash = await prisma.electricityPrice.findUnique({
			where: { validFrom: clean.validFrom },
			select: { id: true },
		});
		if (clash && clash.id !== id) {
			return {
				ok: false,
				errors: { validFrom: "Erre a napra már van felvett ár." },
			};
		}
	}

	await prisma.electricityPrice.update({ where: { id }, data: clean });

	return { ok: true, id };
}

export async function deletePrice(id: string): Promise<PriceMutationResult> {
	const existing = await prisma.electricityPrice.findUnique({
		where: { id },
		select: { id: true },
	});

	if (!existing) {
		return { ok: false, errors: { form: "Nincs ilyen ár." } };
	}

	await prisma.electricityPrice.delete({ where: { id } });

	return { ok: true, id };
}
