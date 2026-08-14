import { HistoryView } from "@/components/history/history-view";
import { getHistory } from "@/lib/history";

export const dynamic = "force-dynamic";

export const metadata = {
	title: "Előzmények · Otthoni energia",
};

export default async function HistoryPage() {
	return <HistoryView initial={await getHistory("month")} />;
}
