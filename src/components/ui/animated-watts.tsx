"use client";

import NumberFlow from "@number-flow/react";

interface AnimatedWattsProps {
	/** Teljesítmény wattban. Egészre kerekítve jelenik meg. */
	value: number;
	className?: string;
}

/**
 * Görgős számláló a nagy watt értékekhez.
 *
 * Csak ott használjuk, ahol a szám másodpercenként változik és a mozgás
 * információt hordoz. A feszültség, áram és tényező statikus marad —
 * ott az animáció csak zaj lenne.
 */
export function AnimatedWatts({ value, className }: AnimatedWattsProps) {
	return (
		<NumberFlow
			value={Math.round(value)}
			locales="hu-HU"
			format={{ maximumFractionDigits: 0 }}
			className={className}
		/>
	);
}
