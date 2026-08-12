import type { CreateReadingDto, TasmotaEnergy } from "@/interface";

const REQUEST_TIMEOUT_MS = 4000;

export class TasmotaError extends Error {
	constructor(
		readonly host: string,
		message: string,
		readonly cause?: unknown,
	) {
		super(`${host}: ${message}`);
		this.name = "TasmotaError";
	}
}

const ENERGY_FIELDS = [
	"Total",
	"Today",
	"Yesterday",
	"Power",
	"ApparentPower",
	"ReactivePower",
	"Factor",
	"Voltage",
	"Current",
] as const satisfies readonly (keyof TasmotaEnergy)[];

function parseEnergy(host: string, payload: unknown): TasmotaEnergy {
	const energy = (payload as { StatusSNS?: { ENERGY?: unknown } })?.StatusSNS
		?.ENERGY;

	if (typeof energy !== "object" || energy === null) {
		throw new TasmotaError(host, "a válaszban nincs StatusSNS.ENERGY blokk");
	}

	const record = energy as Record<string, unknown>;

	for (const field of ENERGY_FIELDS) {
		if (typeof record[field] !== "number" || !Number.isFinite(record[field])) {
			throw new TasmotaError(
				host,
				`hiányzó vagy nem szám mező: ENERGY.${field}`,
			);
		}
	}

	return record as unknown as TasmotaEnergy;
}

/** Nyers adatok lekérdezése egy Tasmota eszközről */
export async function fetchTasmotaEnergy(
	host: string,
	timeoutMs: number = REQUEST_TIMEOUT_MS,
): Promise<TasmotaEnergy> {
	const url = `http://${host}/cm?cmnd=Status%2010`;

	let response: Response;

	try {
		response = await fetch(url, {
			cache: "no-store",
			signal: AbortSignal.timeout(timeoutMs),
		});
	} catch (cause) {
		const reason =
			cause instanceof DOMException && cause.name === "TimeoutError"
				? `nem válaszolt: ${timeoutMs} ms alatt`
				: "nem érhető el";

		throw new TasmotaError(host, reason, cause);
	}

	if (!response.ok) {
		throw new TasmotaError(host, `HTTP ${response.status}`);
	}

	let payload: unknown;
	try {
		payload = await response.json();
	} catch (cause) {
		throw new TasmotaError(host, "a válasz nem érvényes JSON", cause);
	}

	return parseEnergy(host, payload);
}

/** Percre kerekít lefelé — így a [deviceId, ts] unique kulcs szűri a duplikátumot. */
function floorToMinute(date: Date): Date {
	const floored = new Date(date);
	floored.setSeconds(0, 0);
	return floored;
}

/** Eszköz beolvasása db-ből */
export async function readDevice(
	device: { id: string; host: string },
	now: Date = new Date(),
): Promise<CreateReadingDto> {
	const energy = await fetchTasmotaEnergy(device.host);

	return {
		deviceId: device.id,
		ts: floorToMinute(now),
		power: energy.Power,
		voltage: energy.Voltage,
		current: energy.Current,
		apparentPower: energy.ApparentPower,
		reactivePower: energy.ReactivePower,
		factor: energy.Factor,
		totalKwh: energy.Total,
	};
}
