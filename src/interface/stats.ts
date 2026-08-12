export interface DeviceStats {
	slug: string;
	todayKwh: number;
	/** Mai költség határáron. */
	todayCostHuf: number;
	/** Mai költség számla szerinti átlagáron. */
	todayCostBlendedHuf: number;
	/** Fix hosszú teljesítmény idősor wattban. A null adathiány, ott megszakad a vonal. */
	series: (number | null)[];
}

export interface StatsResponse {
	windowHours: number;
	totalTodayKwh: number;
	totalTodayCostHuf: number;
	totalTodayCostBlendedHuf: number;
	/** Határár, HUF/kWh. */
	hufPerKwh: number;
	/** Számla szerinti átlagár, HUF/kWh. Null, ha nincs megadva. */
	blendedHufPerKwh: number | null;
	devices: DeviceStats[];
}
