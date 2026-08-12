import { pollAllDevices } from "./poller";

const POLL_INTERVAL_MS = 60_000;

const globalForScheduler = globalThis as unknown as {
	pollingStarted?: boolean;
};

/** Ezredmásodperc a következő egész percig. */
function msUntilNextMinute(): number {
	return POLL_INTERVAL_MS - (Date.now() % POLL_INTERVAL_MS);
}

async function runOnce(): Promise<void> {
	try {
		const summary = await pollAllDevices();

		for (const result of summary.results) {
			if (!result.ok) {
				console.warn(`[poll] ${result.slug}: ${result.error}`);
			}
		}

		console.log(
			`[poll] ${summary.ts.toISOString()} inserted=${summary.inserted}/${summary.results.length}`,
		);
	} catch (error) {
		// A kör soha nem dobhat tovább — különben az ütemező leállna.
		console.error("[poll] cycle failed:", error);
	}
}

/** Elindítja a percenkénti gyűjtést. Többszöri hívás nem indít másodikat. */
export function startPolling(): void {
	if (globalForScheduler.pollingStarted) {
		return;
	}
	globalForScheduler.pollingStarted = true;

	async function tick(): Promise<void> {
		await runOnce();
		setTimeout(tick, msUntilNextMinute());
	}

	console.log("[poll] polling started");
	void tick();
}
