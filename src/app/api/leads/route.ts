import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const propertyId = request.nextUrl.searchParams.get("property_id");
    const status = request.nextUrl.searchParams.get("status");

    let query = `
      SELECT l.*, p.title as property_title, p.city as property_city
      FROM leads l
      JOIN properties p ON l.property_id = p.id
      WHERE 1=1
    `;
    const params: (string | number)[] = [];

    if (propertyId) {
      query += " AND l.property_id = ?";
      params.push(Number(propertyId));
    }
    if (status) {
      query += " AND l.status = ?";
      params.push(status);
    }

    query += " ORDER BY l.created_at DESC";

    const leads = db.prepare(query).all(...params);

    const stats = {
      total: (db.prepare("SELECT COUNT(*) as count FROM leads").get() as { count: number }).count,
      novo: (db.prepare("SELECT COUNT(*) as count FROM leads WHERE status = 'novo'").get() as { count: number }).count,
      contatado: (db.prepare("SELECT COUNT(*) as count FROM leads WHERE status = 'contatado'").get() as { count: number }).count,
      convertido: (db.prepare("SELECT COUNT(*) as count FROM leads WHERE status = 'convertido'").get() as { count: number }).count,
    };

    return NextResponse.json({ leads, stats });
  } catch (error) {
    console.error("Error fetching leads:", error);
    return NextResponse.json({ error: "Failed to fetch leads" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { property_id, name, phone, email, message, source = "form" } = body;

    if (!property_id || !name || !phone) {
      return NextResponse.json({ error: "Nome e telefone sao obrigatorios" }, { status: 400 });
    }

    const property = db.prepare("SELECT id, title FROM properties WHERE id = ?").get(property_id);
    if (!property) {
      return NextResponse.json({ error: "Imovel nao encontrado" }, { status: 404 });
    }

    const result = db.prepare(
      "INSERT INTO leads (property_id, name, phone, email, message, source) VALUES (?, ?, ?, ?, ?, ?)"
    ).run(property_id, name, phone, email || null, message || null, source);

    return NextResponse.json({ id: result.lastInsertRowid, message: "Lead registrado com sucesso!" }, { status: 201 });
  } catch (error) {
    console.error("Error creating lead:", error);
    return NextResponse.json({ error: "Failed to create lead" }, { status: 500 });
  }
}
