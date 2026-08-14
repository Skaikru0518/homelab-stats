import { deletePrice, updatePrice } from "@/lib/price-admin";
import { type NextRequest, NextResponse } from "next/server";

export async function PATCH(
	request: NextRequest,
	context: RouteContext<"/api/prices/[id]">,
) {
	const { id } = await context.params;
	const body = await request.json().catch(() => null);

	if (body === null || typeof body !== "object") {
		return NextResponse.json(
			{ ok: false, errors: { form: "Hibás kérés." } },
			{ status: 400 },
		);
	}

	const result = await updatePrice(id, body);

	return NextResponse.json(result, { status: result.ok ? 200 : 422 });
}

export async function DELETE(
	_request: NextRequest,
	context: RouteContext<"/api/prices/[id]">,
) {
	const { id } = await context.params;
	const result = await deletePrice(id);

	return NextResponse.json(result, { status: result.ok ? 200 : 404 });
}
