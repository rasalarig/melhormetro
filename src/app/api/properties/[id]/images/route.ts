import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import fs from "fs";
import path from "path";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const propertyId = Number(params.id);

    // Check property exists
    const property = db
      .prepare("SELECT id FROM properties WHERE id = ?")
      .get(propertyId) as { id: number } | undefined;
    if (!property) {
      return NextResponse.json(
        { error: "Property not found" },
        { status: 404 }
      );
    }

    const formData = await request.formData();
    const files = formData.getAll("images");

    // Ensure upload directory exists
    const uploadDir = path.join(
      process.cwd(),
      "public",
      "uploads",
      String(propertyId)
    );
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Check if property already has a cover image
    const existingCover = db
      .prepare(
        "SELECT id FROM property_images WHERE property_id = ? AND is_cover = 1"
      )
      .get(propertyId) as { id: number } | undefined;

    const savedImages: {
      id: number | bigint;
      filename: string;
      original_name: string;
      is_cover: number;
    }[] = [];

    for (const file of files) {
      if (!(file instanceof File)) continue;

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const ext = path.extname(file.name) || ".jpg";
      const filename = `${Date.now()}-${Math.random().toString(36).substring(7)}${ext}`;
      const filepath = path.join(uploadDir, filename);

      fs.writeFileSync(filepath, buffer);

      const isCover = !existingCover && savedImages.length === 0 ? 1 : 0;

      const result = db
        .prepare(
          "INSERT INTO property_images (property_id, filename, original_name, is_cover) VALUES (?, ?, ?, ?)"
        )
        .run(
          propertyId,
          `/uploads/${propertyId}/${filename}`,
          file.name,
          isCover
        );

      savedImages.push({
        id: result.lastInsertRowid,
        filename: `/uploads/${propertyId}/${filename}`,
        original_name: file.name,
        is_cover: isCover,
      });
    }

    return NextResponse.json({ images: savedImages });
  } catch (error) {
    console.error("Image upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload images" },
      { status: 500 }
    );
  }
}
