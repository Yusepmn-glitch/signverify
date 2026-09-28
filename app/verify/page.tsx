"use client";

import { useState, useRef, useCallback } from "react";
import { Upload, FileText, CheckCircle, XCircle, ShieldAlert, FileJson, ScanLine, User, Building, Calendar, Hash } from "lucide-react";
import { importPublicKey, calculateSHA256, verifySignature } from "@/utils/crypto";
import dynamic from "next/dynamic";
import type { SignVerifyQRData, QRScannerProps } from "@/components/QRScanner";

const QRScanner = dynamic<QRScannerProps>(() => import("@/components/QRScanner"), { ssr: false });

type VerifyMode = "qr" | "file";

interface VerifyResult {
  isValid: boolean;
  message: string;
  details: string[];
  originalHash?: string;
  currentHash?: string;
  metadata?: SignVerifyQRData;
}

export default function VerifyPage() {
  const [mode, setMode] = useState<VerifyMode>("qr");
  const [qrData, setQrData] = useState<SignVerifyQRData | null>(null);
  const [pdfForQr, setPdfForQr] = useState<File | null>(null);
  const [fileLegacy, setFileLegacy] = useState<File | null>(null);
  const [metadataStr, setMetadataStr] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<VerifyResult | null>(null);

  const pdfQrRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const metaInputRef = useRef<HTMLInputElement>(null);

  const handleQRResult = useCallback(async (data: SignVerifyQRData) => {
    // Validate metadata with backend if available
    try {
      const res = await fetch("/api/signature/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, signer: { name: data.name, position: data.position, institution: data.institution, date: data.date } })
      });
      if (res.ok) {
        const result = await res.json();
        if (!result.valid) {
          setError(result.message || "Metadata signature tidak valid.");
          return;
        }
      }
    } catch {
      console.warn("Backend tidak dapat dihubungi untuk validasi metadata. Melanjutkan secara lokal.");
    }

    setQrData(data);
    setResult(null);
    setError(null);
    setPdfForQr(null);
  }, []);

  const handlePdfForQr = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const f = e.target.files[0];
      if (f.type !== "application/pdf") { setError("Gunakan file PDF."); return; }
      setPdfForQr(f); setError(null); setResult(null);
    }
  };

  const handleVerifyQr = useCallback(async () => {
    if (!qrData || !pdfForQr) return;
    setIsVerifying(true); setError(null); setResult(null);
    try {
      const currentHash = await calculateSHA256(pdfForQr);
      if (currentHash !== qrData.hash) {
        setResult({ isValid: false, message: "Hash dokumen berbeda dengan hash pada signature.", details: ["Hash tidak sesuai", "Dokumen telah dimodifikasi atau bukan dokumen asli."], originalHash: qrData.hash, currentHash, metadata: qrData });
        return;
      }
      const metadataToSign = JSON.stringify({ filename: qrData.filename, hash: qrData.hash, name: qrData.name, position: qrData.position, institution: qrData.institution, date: qrData.date });
      
      let useLocal = false;
      try {
        const res = await fetch("/api/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            documentHash: currentHash,
            signature: qrData.signature,
            publicKey: qrData.publicKey,
            algorithm: qrData.algorithm,
            payloadToSign: metadataToSign
          })
        });
        
        if (!res.ok) throw new Error("Backend error");
        const result = await res.json();
        
        if (result.valid) {
          setResult({ isValid: true, message: "DOKUMEN VALID", details: ["QR Code valid", "Hash dokumen sesuai", "Digital signature valid", "Public key sesuai", "Verifikasi Server Berhasil"], metadata: qrData });
        } else {
          setResult({ isValid: false, message: result.message || "Digital signature tidak cocok.", details: ["Digital signature invalid (Server)"], metadata: qrData });
        }
      } catch {
        setError("Backend tidak dapat dihubungi. Melakukan verifikasi lokal...");
        useLocal = true;
      }

      if (useLocal) {
        let publicKey: CryptoKey;
        try { publicKey = await importPublicKey(qrData.publicKey); } catch { setResult({ isValid: false, message: "Public key tidak valid.", details: ["Public key tidak cocok"], metadata: qrData }); return; }
        const isValid = await verifySignature(publicKey, qrData.signature, metadataToSign);
        if (isValid) {
          setResult({ isValid: true, message: "DOKUMEN VALID (Lokal)", details: ["QR Code valid", "Hash dokumen sesuai", "Digital signature valid", "Public key sesuai", "Verifikasi Lokal Berhasil"], metadata: qrData });
          setError("Backend tidak dapat dihubungi. Verifikasi lokal berhasil."); // Show warning as requested
        } else {
          setResult({ isValid: false, message: "Digital signature tidak cocok.", details: ["Digital signature invalid", "Public key tidak sesuai atau dokumen berubah."], metadata: qrData });
          setError("Backend tidak dapat dihubungi. Verifikasi lokal gagal.");
        }
      }
    } catch (err: unknown) { setError((err as { message?: string }).message || "Verifikasi gagal."); }
    finally { setIsVerifying(false); }
  }, [qrData, pdfForQr]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) { const f = e.target.files[0]; if (f.type !== "application/pdf") { setError("Gunakan file PDF."); return; } setFileLegacy(f); setError(null); setResult(null); }
  };

  const handleMetaFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) { const r = new FileReader(); r.onload = (ev) => { if (ev.target?.result) setMetadataStr(ev.target.result as string); }; r.readAsText(e.target.files[0]); }
  };

  const handleVerifyLegacy = async () => {
    if (!fileLegacy || !metadataStr) { setError("Lengkapi semua input."); return; }
    setIsVerifying(true); setError(null); setResult(null);
    try {
      let metadata: SignVerifyQRData;
      try { metadata = JSON.parse(metadataStr); } catch { throw new Error("Format data signature tidak valid (harus berupa JSON)."); }
      if (!metadata.hash || !metadata.signature || !metadata.publicKey) throw new Error("Data signature tidak lengkap.");
      const currentHash = await calculateSHA256(fileLegacy);
      if (currentHash !== metadata.hash) { setResult({ isValid: false, message: "Dokumen telah berubah atau bukan dokumen asli.", details: ["Hash tidak sesuai", "Signature tidak valid"], originalHash: metadata.hash, currentHash, metadata }); return; }
      let publicKey: CryptoKey;
      try { publicKey = await importPublicKey(metadata.publicKey); } catch { throw new Error("Public key pada data signature tidak valid."); }
      const metadataToSign = JSON.stringify({ filename: metadata.filename, hash: metadata.hash, name: metadata.name, position: metadata.position, institution: metadata.institution, date: metadata.date });
      const isValid = await verifySignature(publicKey, metadata.signature, metadataToSign);
      if (isValid) { setResult({ isValid: true, message: "Dokumen valid", details: ["Signature valid", "Hash sesuai", "Identitas penandatangan terverifikasi"], metadata }); }
      else { setResult({ isValid: false, message: "Tanda tangan tidak cocok dengan public key.", details: ["Verifikasi kriptografi gagal", "Public key tidak sesuai"], metadata }); }
    } catch (err: unknown) { setError((err as { message?: string }).message || "Verifikasi gagal."); }
    finally { setIsVerifying(false); }
  };

  const resetQr = () => { setQrData(null); setPdfForQr(null); setResult(null); setError(null); };

  return (
    <div className="container mx-auto px-4 py-12 max-w-5xl">
      <div className="mb-10 text-center">
        <h1 className="text-3xl font-bold mb-4">Verifikasi Dokumen</h1>
        <p className="text-gray-400 max-w-2xl mx-auto">Periksa apakah dokumen masih sesuai dengan tanda tangan digitalnya.</p>
      </div>

      <div className="flex gap-3 mb-8 p-1 bg-gray-900/50 border border-gray-800 rounded-2xl max-w-md mx-auto">
        <button onClick={() => { setMode("qr"); setResult(null); setError(null); }} className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all ${mode === "qr" ? "bg-blue-600 text-white shadow-lg" : "text-gray-400 hover:text-white"}`}>
          <ScanLine className="w-4 h-4" /> Scan / QR
        </button>
        <button onClick={() => { setMode("file"); setResult(null); setError(null); }} className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all ${mode === "file" ? "bg-blue-600 text-white shadow-lg" : "text-gray-400 hover:text-white"}`}>
          <FileJson className="w-4 h-4" /> Upload JSON
        </button>
      </div>

      {mode === "qr" && (
        <div className="space-y-6">
          {!qrData && (
            <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-sm">1</div>
                <div><h3 className="font-semibold">Metode Verifikasi</h3><p className="text-xs text-gray-400">Scan QR, upload gambar, atau input manual</p></div>
              </div>
              <QRScanner onResult={handleQRResult} />
            </div>
          )}

          {qrData && (
            <div className="space-y-4">
              <div className="bg-green-500/5 border border-green-500/20 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2 text-green-400 font-semibold"><CheckCircle className="w-5 h-5" />QR Code Berhasil Dibaca</div>
                  <button onClick={resetQr} className="text-xs text-gray-500 hover:text-white bg-gray-800 hover:bg-gray-700 px-3 py-1.5 rounded-lg transition-colors">Ganti QR</button>
                </div>
                <div className="grid sm:grid-cols-2 gap-3 text-sm">
                  <div className="flex items-start gap-2 bg-gray-950/60 rounded-xl p-3"><User className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" /><div><p className="text-xs text-gray-500 mb-0.5">Penandatangan</p><p className="font-medium text-gray-200">{qrData.name}</p><p className="text-xs text-gray-400">{qrData.position}</p></div></div>
                  <div className="flex items-start gap-2 bg-gray-950/60 rounded-xl p-3"><Building className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" /><div><p className="text-xs text-gray-500 mb-0.5">Institusi</p><p className="font-medium text-gray-200">{qrData.institution}</p></div></div>
                  <div className="flex items-start gap-2 bg-gray-950/60 rounded-xl p-3"><Calendar className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" /><div><p className="text-xs text-gray-500 mb-0.5">Tanggal</p><p className="font-medium text-gray-200">{new Date(qrData.date).toLocaleDateString("id-ID", { year: "numeric", month: "long", day: "numeric" })}</p></div></div>
                  <div className="flex items-start gap-2 bg-gray-950/60 rounded-xl p-3"><FileText className="w-4 h-4 text-orange-400 mt-0.5 flex-shrink-0" /><div><p className="text-xs text-gray-500 mb-0.5">Nama Dokumen</p><p className="font-medium text-gray-200 break-all">{qrData.filename}</p></div></div>
                </div>
                <div className="mt-3 bg-gray-950/60 rounded-xl p-3"><p className="text-xs text-gray-500 mb-1 flex items-center gap-1"><Hash className="w-3 h-3" />Hash SHA-256</p><p className="text-xs font-mono text-gray-400 break-all">{qrData.hash}</p></div>
                <p className="text-xs text-green-400/70 mt-3 text-center">Data signature siap diverifikasi.</p>
              </div>

              <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-5"><div className="w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-sm">2</div><h3 className="font-semibold">Upload PDF untuk Diverifikasi</h3></div>
                <div className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-colors ${pdfForQr ? "border-blue-500 bg-blue-500/5" : "border-gray-700 bg-gray-950 hover:border-gray-500"}`} onClick={() => pdfQrRef.current?.click()}>
                  <input type="file" ref={pdfQrRef} onChange={handlePdfForQr} accept="application/pdf" className="hidden" />
                  {pdfForQr ? (<><FileText className="w-12 h-12 text-blue-500 mb-3" /><p className="font-medium text-gray-200">{pdfForQr.name}</p><p className="text-xs text-gray-400 mt-1">{(pdfForQr.size / 1024).toFixed(2)} KB</p></>) : (<><Upload className="w-12 h-12 text-gray-500 mb-3" /><p className="text-sm font-medium">Pilih atau Drop File PDF</p></>)}
                </div>
              </div>

              {error && (<div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl flex items-center gap-3"><ShieldAlert className="w-5 h-5 flex-shrink-0" /><p className="text-sm">{error}</p></div>)}
              <div className="flex justify-center">
                <button onClick={handleVerifyQr} disabled={isVerifying || !pdfForQr} className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-10 py-4 rounded-full font-bold transition-all shadow-lg shadow-blue-500/25 flex items-center gap-2">
                  {isVerifying ? "Memverifikasi..." : <><span>🔍</span> Verifikasi Dokumen</>}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {mode === "file" && (
        <div className="space-y-6">
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-6"><div className="w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold">1</div><h3 className="text-lg font-semibold">Upload Dokumen PDF</h3></div>
              <div className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-colors ${fileLegacy ? "border-blue-500 bg-blue-500/5" : "border-gray-700 bg-gray-950 hover:border-gray-500"}`} onClick={() => fileInputRef.current?.click()}>
                <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="application/pdf" className="hidden" />
                {fileLegacy ? (<><FileText className="w-12 h-12 text-blue-500 mb-3" /><p className="font-medium text-gray-200">{fileLegacy.name}</p><p className="text-xs text-gray-400 mt-1">{(fileLegacy.size / 1024).toFixed(2)} KB</p></>) : (<><Upload className="w-12 h-12 text-gray-500 mb-3" /><p className="text-sm font-medium">Pilih File PDF</p></>)}
              </div>
            </div>
            <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6 flex flex-col">
              <div className="flex items-center gap-3 mb-6"><div className="w-8 h-8 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold">2</div><h3 className="text-lg font-semibold">Data Signature / JSON</h3></div>
              <button onClick={() => metaInputRef.current?.click()} className="flex items-center justify-center gap-2 bg-gray-800 hover:bg-gray-700 text-white px-4 py-3 rounded-xl font-medium transition-colors text-sm mb-4"><FileJson className="w-4 h-4" /> Upload Signature File</button>
              <input type="file" ref={metaInputRef} onChange={handleMetaFileChange} accept=".json,application/json" className="hidden" />
              <div className="relative flex justify-center text-xs mb-3"><div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-800"></div></div><span className="relative bg-gray-900/50 px-2 text-gray-500">ATAU PASTE JSON</span></div>
              <textarea value={metadataStr} onChange={(e) => setMetadataStr(e.target.value)} placeholder="Paste data dari QR-Code atau file JSON di sini..." className="flex-1 w-full bg-gray-950 border border-gray-800 rounded-xl p-4 text-xs font-mono text-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none min-h-32" />
            </div>
          </div>
          {error && (<div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl flex items-center gap-3 max-w-2xl mx-auto"><ShieldAlert className="w-5 h-5 flex-shrink-0" /><p className="text-sm">{error}</p></div>)}
          <div className="flex justify-center">
            <button onClick={handleVerifyLegacy} disabled={isVerifying || !fileLegacy || !metadataStr} className="bg-gray-800 hover:bg-gray-700 border border-gray-700 text-white px-10 py-4 rounded-full font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
              {isVerifying ? "Memverifikasi..." : <><span>🔍</span> Verifikasi Dokumen Sekarang</>}
            </button>
          </div>
        </div>
      )}

      {result && (
        <div className="max-w-3xl mx-auto mt-8">
          {result.isValid ? (
            <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-8 relative overflow-hidden">
              <div className="absolute -right-10 -top-10 opacity-10 pointer-events-none"><CheckCircle className="w-48 h-48 text-green-500" /></div>
              <div className="flex flex-col items-center text-center relative z-10">
                <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mb-4"><CheckCircle className="w-8 h-8 text-green-400" /></div>
                <h2 className="text-2xl font-bold text-green-400 mb-2">✅ DOKUMEN VALID</h2>
                <p className="text-gray-300 mb-6">{result.message}</p>
                <div className="w-full bg-gray-950/50 rounded-xl p-6 text-left border border-green-500/10 mb-4">
                  <ul className="space-y-2">{result.details.map((d, i) => (<li key={i} className="flex items-center gap-2 text-gray-300 text-sm"><CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />{d}</li>))}</ul>
                </div>
                {result.metadata && (
                  <div className="w-full grid sm:grid-cols-2 gap-3 text-left text-sm">
                    <div className="bg-gray-950/50 p-4 rounded-xl border border-gray-800/50"><p className="text-xs text-gray-500 mb-1">Penandatangan</p><p className="font-medium">{result.metadata.name}</p><p className="text-xs text-gray-400">{result.metadata.position}</p></div>
                    <div className="bg-gray-950/50 p-4 rounded-xl border border-gray-800/50"><p className="text-xs text-gray-500 mb-1">Institusi</p><p className="font-medium">{result.metadata.institution}</p></div>
                    <div className="bg-gray-950/50 p-4 rounded-xl border border-gray-800/50"><p className="text-xs text-gray-500 mb-1">Tanggal</p><p className="font-medium">{new Date(result.metadata.date).toLocaleDateString("id-ID", { year: "numeric", month: "long", day: "numeric" })}</p></div>
                    <div className="bg-gray-950/50 p-4 rounded-xl border border-gray-800/50"><p className="text-xs text-gray-500 mb-1">Algorithm</p><p className="font-mono text-blue-400">ECDSA P-256</p></div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-8 relative overflow-hidden">
              <div className="absolute -right-10 -top-10 opacity-10 pointer-events-none"><XCircle className="w-48 h-48 text-red-500" /></div>
              <div className="flex flex-col items-center text-center relative z-10">
                <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mb-4"><XCircle className="w-8 h-8 text-red-400" /></div>
                <h2 className="text-2xl font-bold text-red-400 mb-2">❌ DOKUMEN TIDAK VALID</h2>
                <p className="text-gray-300 mb-6">{result.message}</p>
                <div className="w-full bg-gray-950/50 rounded-xl p-6 text-left border border-red-500/10 mb-4">
                  <ul className="space-y-2">{result.details.map((d, i) => (<li key={i} className="flex items-center gap-2 text-gray-300 text-sm"><XCircle className="w-4 h-4 text-red-400 flex-shrink-0" />{d}</li>))}</ul>
                </div>
                {result.originalHash && result.currentHash && (
                  <div className="w-full bg-red-950/30 rounded-xl p-4 text-left border border-red-900/50">
                    <p className="text-xs text-red-400 font-semibold mb-3 flex items-center gap-2"><ShieldAlert className="w-4 h-4" /> BUKTI PERUBAHAN</p>
                    <div className="mb-3"><p className="text-xs text-gray-500 mb-1">Original SHA-256:</p><p className="text-xs font-mono text-gray-400 break-all">{result.originalHash}</p></div>
                    <div><p className="text-xs text-gray-500 mb-1">Current SHA-256:</p><p className="text-xs font-mono text-red-300 break-all">{result.currentHash}</p></div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
