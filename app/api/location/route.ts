import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { lat, lng, accuracy } = body;

    // Basic validation
    if (typeof lat !== "number" || typeof lng !== "number") {
      return NextResponse.json(
        { error: "lat and lng must be numbers" },
        { status: 400 }
      );
    }

    if (accuracy !== null && accuracy !== undefined && typeof accuracy !== "number") {
      return NextResponse.json(
        { error: "accuracy must be a number or null" },
        { status: 400 }
      );
    }

    const userAgent = req.headers.get("user-agent") ?? undefined;

    const location = await prisma.location.create({
      data: {
        lat,
        lng,
        accuracy: accuracy ?? null,
        userAgent,
      },
    });

    return NextResponse.json({ success: true, id: location.id });
  } catch (err) {
    console.error("Error saving location:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
