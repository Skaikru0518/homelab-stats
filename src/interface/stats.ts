/** Egy eszköz mai összesítője és rövid előzménye. */
export interface DeviceStats {
	slug: string;
	/** Mai fogyasztás, kWh. Nulla, ha ma még nincs mérés. */
	todayKwh: number;
	/** Mai költség, HUF. */
	todayCostHuf: number;
	/**
	 * Teljesítmény idősor a sparkline-hoz, wattban, időrendben.
	 * Fix hosszú, egyenletes időközű. A `null` adathiány — ott a vonal
	 * megszakad, nem nullára esik. Egy hálózati kimaradás nem 0 W.
	 */
	series: (number | null)[];
}

/** A `/api/stats` válasza. */
export interface StatsResponse {
	/** Hány órát fed le a `series`. */
	windowHours: number;
	/** Mai fogyasztás minden eszközre összegezve, kWh. */
	totalTodayKwh: number;
	/** Mai költség összesen, HUF. */
	totalTodayCostHuf: number;
	/** Jelenleg érvényes áram ár, HUF/kWh. */
	hufPerKwh: number;
	devices: DeviceStats[];
}
