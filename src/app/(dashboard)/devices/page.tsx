import { DevicesTable } from "@/components/devices/devices-table";
import { listDevices } from "@/lib/device-admin";

export const dynamic = "force-dynamic";

export const metadata = {
	title: "Eszközök · Otthoni energia",
};

export default async function DevicesPage() {
	return <DevicesTable devices={await listDevices()} />;
}
