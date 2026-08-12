import type { ElectricityPriceModel } from "@/generated/prisma/models/ElectricityPrice";
import type { AssertTrue, Equals } from "./_assert";

/** Áramár egy adott dátumtól érvényesen. */
export interface ElectricityPrice {
	id: string;
	/** Ettől a naptól érvényes ez az ár. */
	validFrom: Date;
	/** Bruttó ár, HUF/kWh. */
	hufPerKwh: number;
	createdAt: Date;
}

/** Új ársáv felvétele. */
export interface CreateElectricityPriceDto {
	validFrom: Date;
	hufPerKwh: number;
}

/**
 * Meglévő ársáv javítása. A validFrom a kulcs — új érvényességi dátumhoz
 * új sort veszünk fel, nem írjuk át a régit.
 */
export interface UpdateElectricityPriceDto {
	hufPerKwh?: number;
}

/** Fordítási idejű őr: eltér a séma? -> tsc hiba. */
type _ElectricityPriceMatchesSchema = AssertTrue<
	Equals<ElectricityPriceModel, ElectricityPrice>
>;
