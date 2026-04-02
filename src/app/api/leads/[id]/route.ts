import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { status } = body;
    const id = Number(params.id);

    if (!status || !["novo", "contatado", "convertido", "descartado"].includes(status)) {
      return NextResponse.json({ error: "Status invalido" }, { status: 400 });
    }

    db.prepare("UPDATE leads SET status = ? WHERE id = ?").run(status, id);
    const lead = db.prepare("SELECT * FROM leads WHERE id = ?").get(id);

    return NextResponse.json(lead);
  } catch (error) {
    console.error("Error updating lead:", error);
    return NextResponse.json({ error: "Failed to update lead" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    db.prepare("DELETE FROM leads WHERE id = ?").run(Number(params.id));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting lead:", error);
    return NextResponse.json({ error: "Failed to delete lead" }, { status: 500 });
  }
}
