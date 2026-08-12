"use client";

import { useEffect, useState } from "react";

interface PollingState<T> {
	/** Mindig a legutolsó sikeresen betöltött adat. Hiba esetén nem ürül ki. */
	data: T;
	/** Hamis, ha az utolsó kérés elhasalt. A `data` ilyenkor elavult. */
	live: boolean;
}

/**
 * Adott időközönként újratölt egy JSON végpontot.
 *
 * A kezdeti adat szerver oldalról érkezik, így nincs üres állapot betöltéskor.
 * Hiba esetén megtartjuk az utolsó jó adatot és `live: false`-ra váltunk —
 * félrevezetőbb lenne nullákat mutatni, mint egy pár másodperce régi értéket.
 */
export function usePolling<T>(
	url: string,
	intervalMs: number,
	initialData: T,
): PollingState<T> {
	const [state, setState] = useState<PollingState<T>>({
		data: initialData,
		live: true,
	});

	useEffect(() => {
		let cancelled = false;
		const controller = new AbortController();

		async function load() {
			try {
				const response = await fetch(url, {
					cache: "no-store",
					signal: controller.signal,
				});
				if (!response.ok) {
					throw new Error(`HTTP ${response.status}`);
				}
				const data = (await response.json()) as T;
				if (!cancelled) {
					setState({ data, live: true });
				}
			} catch {
				if (!cancelled) {
					setState((previous) => ({ ...previous, live: false }));
				}
			}
		}

		const timer = setInterval(load, intervalMs);
		return () => {
			cancelled = true;
			controller.abort();
			clearInterval(timer);
		};
	}, [url, intervalMs]);

	return state;
}
