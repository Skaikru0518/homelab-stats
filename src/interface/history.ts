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
	/** Eszközönkénti költség határáron, slug szerint. */
	costByDevice: Record<string, number>;
}

export interface HistoryDevice {
	slug: string;
	name: string;
}

export interface HistoryDeviceTotal extends HistoryDevice {
	kwh: number;
	costHuf: number;
	costBlendedHuf: number;
	/** Részesedés az időszak összfogyasztásából, 0..1. */
	share: number;
}

export interface HistoryResponse {
	range: HistoryRange;
	devices: HistoryDevice[];
	buckets: HistoryBucket[];
	deviceTotals: HistoryDeviceTotal[];
	totalKwh: number;
	totalCostHuf: number;
	totalCostBlendedHuf: number;
	averageKwh: number;
	peak: HistoryBucket | null;
	/** Az előző, azonos hosszú időszak fogyasztása. */
	previousKwh: number;
	/**
	 * Változás az előző időszakhoz képest, százalék. Null, ha akkor nem volt
	 * mérés — nullához képest nincs értelmes százalék.
	 */
	changePercent: number | null;
}
