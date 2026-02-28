import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

export async function POST() {
  try {
    revalidatePath("/", "layout");
    return NextResponse.json({ revalidated: true, timestamp: new Date().toISOString() });
  } catch (err) {
    return NextResponse.json(
      { error: "revalidation failed", detail: String(err) },
      { status: 500 }
    );
  }
}
