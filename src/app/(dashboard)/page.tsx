import { DashboardLive } from "@/components/dashboard/dashboard-live";
import { getLivePlugs } from "@/lib/plugs";
import { getStats } from "@/lib/stats";

/**
 * Az oldal minden kérésnél lekérdezi az eszközöket. Statikus előrenderelés
 * esetén a build idejű pillanatkép fagyna be a HTML-be.
 */
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
	const [plugs, stats] = await Promise.all([getLivePlugs(), getStats()]);

	return <DashboardLive initialPlugs={plugs} initialStats={stats} />;
}
