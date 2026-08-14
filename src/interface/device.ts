import type { DeviceModel } from "@/generated/prisma/models/Device";
import type { AssertTrue, Equals } from "./_assert";

export interface Device {
	id: string;
	slug: string;
	name: string;
	host: string;
	enabled: boolean;
	/** Ha ki van töltve, ez az eszköz a szülő mérésén belül van. */
	parentId: string | null;
	createdAt: Date;
	updatedAt: Date;
}

export interface CreateDeviceDto {
	slug: string;
	name: string;
	host: string;
	enabled?: boolean;
	parentSlug?: string | null;
}

/** A slug nem módosítható — arra hivatkoznak a linkek és a kód. */
export interface UpdateDeviceDto {
	name?: string;
	host?: string;
	enabled?: boolean;
	parentSlug?: string | null;
}

type _DeviceMatchesSchema = AssertTrue<Equals<DeviceModel, Device>>;
