import { getDeviceDetail } from "@/lib/device-detail";
import { type NextRequest, NextResponse } from "next/server";

export async function GET(
	_request: NextRequest,
	context: RouteContext<"/api/device/[slug]">,
) {
	const { slug } = await context.params;
	const detail = await getDeviceDetail(slug);

	if (!detail) {
		return NextResponse.json({ error: "Nincs ilyen eszköz." }, { status: 404 });
	}

	return NextResponse.json(detail);
}
