import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

function normalizeLocale(rawLocale: string): string | null {
  const trimmed = rawLocale.replace(/\.json$/i, "").toLowerCase();
  if (!/^[a-z]{2}$/.test(trimmed)) {
    return null;
  }
  return trimmed;
}

async function readTranslationFile(locale: string): Promise<string | null> {
  const publicFile = path.join(process.cwd(), "public", "translations", `${locale}.json`);
  const nextFile = path.join(process.cwd(), ".next", `${locale}.json`);

  try {
    return await fs.readFile(publicFile, "utf-8");
  } catch {
    // Ignore and try the .next output
  }

  try {
    return await fs.readFile(nextFile, "utf-8");
  } catch {
    return null;
  }
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ locale: string }> }
) {
  const { locale: rawLocale } = await params;
  const locale = normalizeLocale(rawLocale);

  if (!locale) {
    return NextResponse.json({ error: "Invalid locale" }, { status: 404 });
  }

  const contents = await readTranslationFile(locale);
  if (!contents) {
    return NextResponse.json({ error: "Translations not found" }, { status: 404 });
  }

  return new NextResponse(contents, {
    status: 200,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800",
    },
  });
}