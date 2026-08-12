import { getLivePlugs } from "@/lib/plugs";
import { NextResponse } from "next/server";

export async function GET() {
	return NextResponse.json(await getLivePlugs());
}
