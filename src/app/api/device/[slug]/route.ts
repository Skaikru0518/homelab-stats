import { getDeviceDetail } from "@/lib/device-detail";
import { deleteDevice, updateDevice } from "@/lib/device-admin";
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

export async function PATCH(
	request: NextRequest,
	context: RouteContext<"/api/device/[slug]">,
) {
	const { slug } = await context.params;
	const body = await request.json().catch(() => null);

	if (body === null || typeof body !== "object") {
		return NextResponse.json(
			{ ok: false, errors: { form: "Hibás kérés." } },
			{ status: 400 },
		);
	}

	const result = await updateDevice(slug, body);

	return NextResponse.json(result, { status: result.ok ? 200 : 422 });
}

export async function DELETE(
	_request: NextRequest,
	context: RouteContext<"/api/device/[slug]">,
) {
	const { slug } = await context.params;
	const result = await deleteDevice(slug);

	return NextResponse.json(result, { status: result.ok ? 200 : 404 });
}
