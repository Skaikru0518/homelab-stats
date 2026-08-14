/**
 * Magyar számformázás kézzel, nem `Intl`-lel.
 *
 * A szerver és a böngésző `Intl` implementációja eltérő szóközkaraktert
 * használhat ezres elválasztónak, ami hidratálási eltérést okoz. Ez a néhány
 * sor determinisztikus mindkét oldalon.
 */
function format(value: number, decimals: number): string {
	if (!Number.isFinite(value)) {
		return "–";
	}

	const fixed = Math.abs(value).toFixed(decimals);
	const [whole = "0", fraction] = fixed.split(".");
	const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
	const sign = value < 0 ? "−" : "";

	return fraction ? `${sign}${grouped},${fraction}` : `${sign}${grouped}`;
}

/** Teljesítmény wattban, egészre kerekítve. */
export const formatWatts = (value: number): string => format(value, 0);

/** Energia kilowattórában, két tizedessel. */
export const formatKwh = (value: number): string => format(value, 2);

/** Költség forintban, egészre kerekítve. */
export const formatHuf = (value: number): string => format(value, 0);

/** Egységár, legfeljebb három tizedessel, fölösleges nullák nélkül. */
export function formatPrice(value: number): string {
	return format(value, 3).replace(/,?0+$/, "");
}

/** Feszültség voltban. */
export const formatVolts = (value: number): string => format(value, 0);

/** Áramerősség amperben, két tizedessel. */
export const formatAmps = (value: number): string => format(value, 2);

/** Teljesítménytényező, két tizedessel. */
export const formatFactor = (value: number): string => format(value, 2);

/** Óra:perc alakú időpont, mindig két számjeggyel. */
export function formatClock(date: Date): string {
	const hours = String(date.getHours()).padStart(2, "0");
	const minutes = String(date.getMinutes()).padStart(2, "0");
	return `${hours}:${minutes}`;
}
