"use client";

import { useState, useRef } from "react";
import { Upload, FileText, CheckCircle, Download, AlertCircle } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { importPrivateKey, calculateSHA256, signData, decryptPrivateKey } from "@/utils/crypto";
import { Lock } from "lucide-react";

interface SignatureResult {
  app: string;
  version: string;
  name: string;
  position: string;
  institution: string;
  date: string;
  filename: string;
  hash: string;
  algorithm: string;
  signature: string;
  publicKey: string; // Base64 or PEM
}

export default function SignPage() {
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState("");
  const [position, setPosition] = useState("");
  const [institution, setInstitution] = useState("");

  const [isSigning, setIsSigning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SignatureResult | null>(null);

  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const qrRef = useRef<HTMLDivElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.type !== "application/pdf") {
        setError("Format file tidak didukung. Gunakan PDF.");
        setFile(null);
        return;
      }
      setFile(selectedFile);
      setError(null);
      setResult(null);
    }
  };

  const handleSignRequest = () => {
    if (!file) {
      setError("Silakan pilih dokumen PDF terlebih dahulu.");
      return;
    }
    if (!name || !position || !institution) {
      setError("Harap isi semua identitas penandatangan.");
      return;
    }

    const privKeyData = localStorage.getItem("signverify_private_key");
    const pubKeyPem = localStorage.getItem("signverify_public_key");

    if (!privKeyData || !pubKeyPem) {
      setError("Private Key atau Public Key tidak ditemukan. Silakan generate kunci di menu Manajemen Kunci terlebih dahulu.");
      return;
    }

    if (privKeyData.includes("-----BEGIN PRIVATE KEY-----")) {
      executeSign(privKeyData, pubKeyPem);
    } else {
      setShowPasswordDialog(true);
    }
  };

  const handleUnlockAndSign = async () => {
    setPasswordError("");
    if (!password) {
      setPasswordError("Password tidak boleh kosong.");
      return;
    }

    const privKeyData = localStorage.getItem("signverify_private_key");
    const pubKeyPem = localStorage.getItem("signverify_public_key");
    
    if (!privKeyData || !pubKeyPem) return;

    try {
      const decryptedPem = await decryptPrivateKey(privKeyData, password);
      await executeSign(decryptedPem, pubKeyPem);
    } catch (err: unknown) {
      setPasswordError((err as { message?: string }).message || "Password salah atau Private Key tidak dapat dibuka.");
    }
  };

  const executeSign = async (privKeyPem: string, pubKeyPem: string) => {
    try {
      setIsSigning(true);
      setError(null);

      const privateKey = await importPrivateKey(privKeyPem);

      // 1. Calculate SHA-256
      const hash = await calculateSHA256(file!);

      // 2. Prepare metadata
      const date = new Date().toISOString();
      const metadataToSign = JSON.stringify({
        filename: file!.name,
        hash,
        name,
        position,
        institution,
        date
      });

      // 3. Sign
      const signature = await signData(privateKey, metadataToSign);

      // 4. Create Result
      const signatureResult: SignatureResult = {
        app: "SignVerify",
        version: "1.0",
        name,
        position,
        institution,
        date,
        filename: file!.name,
        hash,
        algorithm: "ECDSA-P256",
        signature,
        publicKey: pubKeyPem
      };

      setResult(signatureResult);
      setShowPasswordDialog(false);
      setPassword("");
    } catch (err: unknown) {
      console.error(err);
      setError((err as { message?: string }).message || "Gagal membuat tanda tangan digital.");
    } finally {
      setIsSigning(false);
    }
  };

  const downloadSignature = () => {
    if (!result) return;
    const blob = new Blob([JSON.stringify(result, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `signature_${result.filename}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const downloadQRCode = () => {
    if (!qrRef.current) return;
    const svg = qrRef.current.querySelector("svg");
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    img.onload = () => {
      const scale = 8; // Perbesar resolusi 8x lipat agar tidak burik
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      if (ctx) {
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.scale(scale, scale);
        ctx.drawImage(img, 0, 0);
        
        const pngFile = canvas.toDataURL("image/png");
        const a = document.createElement("a");
        a.download = `qrcode_${result?.filename}.png`;
        a.href = pngFile;
        a.click();
      }
    };
    img.src = "data:image/svg+xml;base64," + btoa(svgData);
  };

  return (
    <div className="container mx-auto px-4 py-12 max-w-5xl">
      <div className="mb-10 text-center">
        <h1 className="text-3xl font-bold mb-4">Tanda Tangani Dokumen</h1>
        <p className="text-gray-400 max-w-2xl mx-auto">
          Upload dokumen PDF, isi identitas penandatangan, kemudian buat tanda tangan digital menggunakan ECDSA P-256.
        </p>
      </div>

      {!result ? (
        <div className="grid md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div
              className={`border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center text-center cursor-pointer transition-colors ${file ? 'border-blue-500 bg-blue-500/5' : 'border-gray-700 bg-gray-900/50 hover:border-gray-500 hover:bg-gray-800/50'
                }`}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
              onDrop={(e) => {
                e.preventDefault();
                e.stopPropagation();
                const droppedFile = e.dataTransfer.files?.[0];
                if (droppedFile && droppedFile.type === 'application/pdf') {
                  handleFileChange({ target: { files: e.dataTransfer.files } } as React.ChangeEvent<HTMLInputElement>);
                }
              }}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="application/pdf"
                className="hidden"
              />

              {file ? (
                <>
                  <FileText className="w-16 h-16 text-blue-500 mb-4" />
                  <h3 className="font-semibold text-lg text-gray-200">{file.name}</h3>
                  <p className="text-sm text-gray-400 mt-2">
                    {(file.size / 1024).toFixed(2)} KB • {file.type}
                  </p>
                </>
              ) : (
                <>
                  <Upload className="w-16 h-16 text-gray-500 mb-4" />
                  <h3 className="font-semibold text-lg mb-2">Upload PDF</h3>
                  <p className="text-sm text-gray-400">Drag & Drop atau klik untuk memilih file</p>
                </>
              )}
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl flex items-center gap-3">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <p className="text-sm">{error}</p>
              </div>
            )}
          </div>

          <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6">
            <h3 className="text-xl font-semibold mb-6">Identitas Penandatangan</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Nama Lengkap</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
                  placeholder="Contoh: Yusep Muhamad"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Jabatan</label>
                <input
                  type="text"
                  value={position}
                  onChange={(e) => setPosition(e.target.value)}
                  className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
                  placeholder="Contoh: Mahasiswa"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Institusi</label>
                <input
                  type="text"
                  value={institution}
                  onChange={(e) => setInstitution(e.target.value)}
                  className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
                  placeholder="Contoh: Universitas Siliwangi"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Tanggal</label>
                <input
                  type="text"
                  value={new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}
                  disabled
                  className="w-full bg-gray-950/50 border border-gray-800 rounded-xl px-4 py-3 text-gray-500 cursor-not-allowed"
                />
              </div>
            </div>

            <button
              onClick={handleSignRequest}
              disabled={isSigning || !file}
              className="w-full mt-8 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white px-6 py-4 rounded-xl font-bold transition-all shadow-lg shadow-blue-500/25 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
            >
              {isSigning ? (
                "Memproses..."
              ) : (
                <><span>✍️</span> Buat Digital Signature</>
              )}
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-8 max-w-4xl mx-auto">
          <div className="flex flex-col items-center mb-8 pb-8 border-b border-gray-800">
            <CheckCircle className="w-16 h-16 text-green-400 mb-4" />
            <h2 className="text-2xl font-bold text-green-400">✅ Dokumen Berhasil Ditandatangani</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="md:col-span-2 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-950 rounded-xl p-4 border border-gray-800/50">
                  <p className="text-xs text-gray-500 mb-1">Nama</p>
                  <p className="font-medium">{result.name}</p>
                </div>
                <div className="bg-gray-950 rounded-xl p-4 border border-gray-800/50">
                  <p className="text-xs text-gray-500 mb-1">Jabatan</p>
                  <p className="font-medium">{result.position}</p>
                </div>
                <div className="bg-gray-950 rounded-xl p-4 border border-gray-800/50">
                  <p className="text-xs text-gray-500 mb-1">Institusi</p>
                  <p className="font-medium">{result.institution}</p>
                </div>
                <div className="bg-gray-950 rounded-xl p-4 border border-gray-800/50">
                  <p className="text-xs text-gray-500 mb-1">Tanggal</p>
                  <p className="font-medium">{new Date(result.date).toLocaleDateString('id-ID')}</p>
                </div>
              </div>

              <div className="bg-gray-950 rounded-xl p-4 border border-gray-800/50">
                <p className="text-xs text-gray-500 mb-1">Algorithm</p>
                <p className="font-mono text-sm text-blue-400">{result.algorithm}</p>
              </div>

              <div className="bg-gray-950 rounded-xl p-4 border border-gray-800/50">
                <p className="text-xs text-gray-500 mb-1">Hash (SHA-256)</p>
                <p className="font-mono text-xs text-gray-400 break-all">{result.hash}</p>
              </div>

              <div className="bg-gray-950 rounded-xl p-4 border border-gray-800/50">
                <p className="text-xs text-gray-500 mb-1">Signature (Base64)</p>
                <p className="font-mono text-xs text-gray-400 break-all line-clamp-3" title={result.signature}>
                  {result.signature}
                </p>
              </div>
            </div>

            <div className="flex flex-col items-center justify-center bg-gray-950 rounded-xl p-6 border border-gray-800/50">
              <h3 className="text-sm font-medium text-gray-400 mb-4">Scan untuk Verifikasi</h3>
              <div className="bg-white p-3 rounded-xl mb-6" ref={qrRef}>
                <QRCodeSVG
                  value={JSON.stringify(result)}
                  size={180}
                  level="L"
                  includeMargin={false}
                />
              </div>
              <p className="text-xs text-center text-gray-500 mb-6">
                QR-Code digunakan untuk membawa informasi yang diperlukan untuk proses verifikasi.
              </p>

              <div className="w-full space-y-3">
                <button
                  onClick={downloadSignature}
                  className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-lg font-medium transition-colors text-sm"
                >
                  <Download className="w-4 h-4" />
                  Signed Information (.json)
                </button>
                <button
                  onClick={downloadQRCode}
                  className="w-full flex items-center justify-center gap-2 bg-gray-800 hover:bg-gray-700 text-white px-4 py-2.5 rounded-lg font-medium transition-colors text-sm"
                >
                  <Download className="w-4 h-4" />
                  QR Code (.png)
                </button>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-800 text-center">
            <button
              onClick={() => {
                setResult(null);
                setFile(null);
              }}
              className="text-blue-400 hover:text-blue-300 font-medium"
            >
              Tanda tangani dokumen lain
            </button>
          </div>
        </div>
      )}

      {showPasswordDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-sm p-6 shadow-2xl">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Lock className="w-5 h-5 text-blue-400" /> Buka Private Key
            </h3>
            <p className="text-sm text-gray-400 mb-4">Masukkan password untuk membuka Private Key dan menandatangani dokumen.</p>
            <div className="space-y-4">
              <div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Masukkan password"
                />
              </div>
              {passwordError && (
                <p className="text-red-400 text-sm">{passwordError}</p>
              )}
              <div className="flex gap-3 mt-4">
                <button
                  onClick={() => {
                    setShowPasswordDialog(false);
                    setPassword("");
                    setPasswordError("");
                  }}
                  className="flex-1 bg-gray-800 hover:bg-gray-700 text-white px-4 py-3 rounded-xl font-bold transition-colors"
                >
                  Batal
                </button>
                <button
                  onClick={handleUnlockAndSign}
                  className="flex-1 bg-blue-600 hover:bg-blue-500 text-white px-4 py-3 rounded-xl font-bold transition-colors"
                >
                  Buka & Sign
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
