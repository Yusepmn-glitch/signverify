import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // MUST NOT RECEIVE privateKey
    if (body.privateKey) {
      return NextResponse.json(
        { valid: false, message: "Security Warning: privateKey must never be sent to the backend." },
        { status: 400 }
      );
    }

    const { filename, hash, signature, publicKey, algorithm, signer } = body;

    // Validate required fields
    if (!filename || !hash || !signature || !publicKey || !algorithm || !signer) {
      return NextResponse.json({ valid: false, message: "Metadata signature tidak lengkap" }, { status: 400 });
    }

    if (algorithm !== "ECDSA-P256") {
      return NextResponse.json({ valid: false, message: "Algorithm tidak didukung (harus ECDSA-P256)" }, { status: 400 });
    }

    if (!signer.name || !signer.position || !signer.institution || !signer.date) {
      return NextResponse.json({ valid: false, message: "Data signer tidak lengkap" }, { status: 400 });
    }

    // Additional simple length or format checks could go here

    return NextResponse.json({ valid: true, message: "Metadata signature valid" }, { status: 200 });

  } catch (error) {
    return NextResponse.json({ valid: false, message: "Format request tidak valid" }, { status: 400 });
  }
}
