// src/app/api/upload/route.ts
// Uploads to IPFS via Pinata (IPFS/Filecoin infrastructure).
// Uses a simple JWT API key — no magic links, no expiry issues.
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const jwt = process.env.PINATA_JWT;
  if (!jwt) {
    return NextResponse.json(
      { error: "PINATA_JWT not set in .env.local" },
      { status: 503 }
    );
  }

  try {
    const incomingForm = await request.formData();
    const file = incomingForm.get("file") as File | null;
    const metadataStr = incomingForm.get("metadata") as string | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Build metadata object (stored in Pinata key-values, not as a separate file)
    const metadata = metadataStr ? JSON.parse(metadataStr) : {};

    // Upload to Pinata — pinFileToIPFS accepts exactly ONE file
    const pinataForm = new FormData();
    pinataForm.append("file", file, file.name);
    pinataForm.append(
      "pinataMetadata",
      JSON.stringify({
        name: `trustpay-${metadata.jobId ?? "job"}`,
        keyvalues: {
          jobId: metadata.jobId ?? "",
          worker: metadata.workerAddress ?? "",
          description: metadata.description ?? "",
          timestamp: metadata.timestamp ?? new Date().toISOString(),
        },
      })
    );
    pinataForm.append(
      "pinataOptions",
      JSON.stringify({ wrapWithDirectory: false })
    );

    const res = await fetch(
      "https://api.pinata.cloud/pinning/pinFileToIPFS",
      {
        method: "POST",
        headers: { Authorization: `Bearer ${jwt}` },
        body: pinataForm,
      }
    );

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Pinata error ${res.status}: ${errText}`);
    }

    const data = (await res.json()) as { IpfsHash: string };
    const cid = data.IpfsHash;

    return NextResponse.json({
      cid,
      url: `https://gateway.pinata.cloud/ipfs/${cid}`,
    });
  } catch (err: unknown) {
    console.error("[upload API]", err);
    const message =
      err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

