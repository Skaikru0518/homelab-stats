import { PricesTable } from "@/components/prices/prices-table";
import { listPrices } from "@/lib/price-admin";

export const dynamic = "force-dynamic";

export const metadata = {
	title: "Áram ára · Otthoni energia",
};

export default async function PricesPage() {
	return <PricesTable prices={await listPrices()} />;
}
