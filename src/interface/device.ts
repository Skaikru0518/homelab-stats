import type { DeviceModel } from "@/generated/prisma/models/Device";
import type { AssertTrue, Equals } from "./_assert";

/** Egy fizikai eszköz (Tasmota konnektor). */
export interface Device {
	id: string;
	/** Stabil, kódból hivatkozható azonosító, pl. "plug-1". */
	slug: string;
	/** Felhasználó által átírható megjelenített név. */
	name: string;
	/** IP cím vagy hostname, pl. "192.168.50.250". */
	host: string;
	enabled: boolean;
	createdAt: Date;
	updatedAt: Date;
}

/** Új eszköz létrehozása. Az id és az időbélyegek a DB-től jönnek. */
export interface CreateDeviceDto {
	slug: string;
	name: string;
	host: string;
	/** Alapértelmezés: true. */
	enabled?: boolean;
}

/** Eszköz módosítása. A slug szándékosan nem módosítható — arra hivatkozik a kód. */
export interface UpdateDeviceDto {
	name?: string;
	host?: string;
	enabled?: boolean;
}

/** Fordítási idejű őr: eltér a séma? -> tsc hiba. */
type _DeviceMatchesSchema = AssertTrue<Equals<DeviceModel, Device>>;
