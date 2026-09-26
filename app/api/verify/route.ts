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

    const { documentHash, signature, publicKey, algorithm, payloadToSign } = body;

    // Based on user prompt requirements
    if (!documentHash || !signature || !publicKey || !algorithm) {
      return NextResponse.json({ valid: false, message: "Data tidak lengkap" }, { status: 400 });
    }

    if (algorithm !== "ECDSA-P256") {
      return NextResponse.json({ valid: false, message: "Algorithm tidak didukung" }, { status: 400 });
    }

    if (typeof crypto === 'undefined' || !crypto.subtle) {
      return NextResponse.json({ valid: false, message: "Web Crypto API tidak tersedia di server" }, { status: 500 });
    }

    try {
      const pemHeader = "-----BEGIN PUBLIC KEY-----";
      const pemFooter = "-----END PUBLIC KEY-----";
      if (!publicKey.includes(pemHeader) || !publicKey.includes(pemFooter)) {
        return NextResponse.json({ valid: false, message: "Format Public Key tidak valid" }, { status: 400 });
      }

      const pemContents = publicKey.substring(
        publicKey.indexOf(pemHeader) + pemHeader.length,
        publicKey.indexOf(pemFooter)
      ).replace(/\s/g, '');
      
      const binaryDerString = atob(pemContents);
      const binaryDer = new Uint8Array(binaryDerString.length);
      for (let i = 0; i < binaryDerString.length; i++) {
        binaryDer[i] = binaryDerString.charCodeAt(i);
      }

      const importedKey = await crypto.subtle.importKey(
        "spki",
        binaryDer.buffer,
        {
          name: "ECDSA",
          namedCurve: "P-256",
        },
        true,
        ["verify"]
      );

      const signatureString = atob(signature);
      const signatureArray = new Uint8Array(signatureString.length);
      for (let i = 0; i < signatureString.length; i++) {
        signatureArray[i] = signatureString.charCodeAt(i);
      }

      // We need to sign the EXACT same string as the frontend.
      // If frontend passes payloadToSign, use it. Otherwise, return error.
      if (!payloadToSign) {
         return NextResponse.json({ valid: false, message: "Data payloadToSign tidak lengkap" }, { status: 400 });
      }

      const encoder = new TextEncoder();
      const data = encoder.encode(payloadToSign);

      const isValid = await crypto.subtle.verify(
        {
          name: "ECDSA",
          hash: { name: "SHA-256" },
        },
        importedKey,
        signatureArray.buffer,
        data
      );

      if (isValid) {
        return NextResponse.json({ valid: true, message: "Digital signature valid" }, { status: 200 });
      } else {
        return NextResponse.json({ valid: false, message: "Digital signature tidak valid" }, { status: 200 });
      }
    } catch (err) {
      console.error(err);
      return NextResponse.json({ valid: false, message: "Digital signature tidak valid atau public key salah" }, { status: 200 });
    }
  } catch (error) {
    return NextResponse.json({ valid: false, message: "Internal server error" }, { status: 500 });
  }
}
