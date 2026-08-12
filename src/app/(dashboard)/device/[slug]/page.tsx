import { DeviceDetailView } from "@/components/device/device-detail-view";
import { getDeviceDetail } from "@/lib/device-detail";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function DevicePage(
	props: PageProps<"/device/[slug]">,
) {
	const { slug } = await props.params;
	const detail = await getDeviceDetail(slug);

	if (!detail) {
		notFound();
	}

	return <DeviceDetailView initial={detail} />;
}
