import type { ElectricityPriceModel } from "@/generated/prisma/models/ElectricityPrice";
import type { AssertTrue, Equals } from "./_assert";

export interface ElectricityPrice {
	id: string;
	validFrom: Date;
	/** Határár bruttóban: egy plusz kWh ára a kedvezményes kereten felül. */
	hufPerKwh: number;
	/** Számla szerinti átlagár bruttóban. Null, amíg nincs elszámoló számla. */
	blendedHufPerKwh: number | null;
	createdAt: Date;
}

export interface CreateElectricityPriceDto {
	validFrom: Date;
	hufPerKwh: number;
	blendedHufPerKwh?: number | null;
}

/** Áremelés = új sor új validFrom-mal, nem a régi átírása. */
export interface UpdateElectricityPriceDto {
	hufPerKwh?: number;
	blendedHufPerKwh?: number | null;
}

type _ElectricityPriceMatchesSchema = AssertTrue<
	Equals<ElectricityPriceModel, ElectricityPrice>
>;
