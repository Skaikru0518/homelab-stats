export type HistoryRange = "week" | "month" | "year";

export interface HistoryBucket {
	/** Napi nézetnél YYYY-MM-DD, éves nézetnél YYYY-MM. */
	key: string;
	label: string;
	kwh: number;
	costHuf: number;
	costBlendedHuf: number;
	/** Eszközönkénti kWh, slug szerint. */
	byDevice: Record<string, number>;
}

export interface HistoryDevice {
	slug: string;
	name: string;
}

export interface HistoryResponse {
	range: HistoryRange;
	devices: HistoryDevice[];
	buckets: HistoryBucket[];
	totalKwh: number;
	totalCostHuf: number;
	totalCostBlendedHuf: number;
	/** Napi átlag a szakaszon, kWh. Csak az adattal rendelkező vödrökből. */
	averageKwh: number;
	/** A legtöbbet fogyasztó vödör, vagy null ha nincs adat. */
	peak: HistoryBucket | null;
}
