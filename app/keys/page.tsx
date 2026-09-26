"use client";

import { useState } from "react";
import { KeyRound, ShieldAlert, Download, Copy, Check } from "lucide-react";
import { generateKeyPair, exportPublicKey, exportPrivateKey } from "@/utils/crypto";

export default function KeysPage() {
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [privateKey, setPrivateKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateKeys = async () => {
    setIsGenerating(true);
    try {
      const keyPair = await generateKeyPair();
      const pubKey = await exportPublicKey(keyPair.publicKey);
      const privKey = await exportPrivateKey(keyPair.privateKey);
      
      setPublicKey(pubKey);
      setPrivateKey(privKey);
      
      // Store in localStorage for demo purposes
      localStorage.setItem("signverify_public_key", pubKey);
      localStorage.setItem("signverify_private_key", privKey);
    } catch (error) {
      console.error("Error generating keys:", error);
      alert("Gagal membuat kunci.");
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadKey = (filename: string, content: string) => {
    const element = document.createElement("a");
    const file = new Blob([content], { type: "text/plain" });
    element.href = URL.createObjectURL(file);
    element.download = filename;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl flex-1 flex flex-col">
      <div className="mb-10 text-center">
        <h1 className="text-3xl font-bold mb-4">Manajemen Kunci</h1>
        <p className="text-gray-400 max-w-2xl mx-auto">
          Digital signature menggunakan pasangan kunci yang terdiri dari private key dan public key. Kami menggunakan algoritma ECDSA P-256 sesuai standar keamanan modern.
        </p>
      </div>

      <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-8 mb-8 text-center relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
          <KeyRound className="w-48 h-48" />
        </div>
        <div className="relative z-10 flex flex-col items-center">
          <button
            onClick={handleGenerateKeys}
            disabled={isGenerating}
            className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-xl font-bold transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/20"
          >
            <KeyRound className="w-5 h-5" />
            {isGenerating ? "Sedang Membuat..." : "Generate Key Pair"}
          </button>
          
          <div className="mt-6 flex items-start gap-3 text-left max-w-lg bg-orange-500/10 border border-orange-500/20 text-orange-400 p-4 rounded-xl">
            <ShieldAlert className="w-6 h-6 flex-shrink-0 mt-0.5" />
            <p className="text-sm">
              <strong className="block mb-1">Perhatian:</strong>
              Private key harus dijaga oleh pemilik dan tidak boleh dibagikan. Jangan menyimpan private key di source code atau GitHub.
            </p>
          </div>
        </div>
      </div>

      {publicKey && privateKey && (
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-gray-950 border border-gray-800 rounded-2xl p-6 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                Public Key
              </h3>
              <button
                onClick={() => copyToClipboard(publicKey)}
                className="text-gray-400 hover:text-white transition-colors p-2 bg-gray-900 rounded-lg"
                title="Salin Public Key"
              >
                {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
            <pre className="bg-gray-900 p-4 rounded-xl text-xs text-gray-400 overflow-x-auto mb-4 flex-1 font-mono border border-gray-800/50">
              {publicKey}
            </pre>
            <button
              onClick={() => downloadKey("public_key.pem", publicKey)}
              className="w-full flex items-center justify-center gap-2 bg-gray-800 hover:bg-gray-700 text-white px-4 py-2.5 rounded-xl font-medium transition-colors"
            >
              <Download className="w-4 h-4" />
              Export Public Key
            </button>
          </div>

          <div className="bg-gray-950 border border-red-900/30 rounded-2xl p-6 flex flex-col relative overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-lg flex items-center gap-2 text-red-400">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                Private Key
              </h3>
            </div>
            <div className="bg-red-950/20 p-4 rounded-xl mb-4 flex-1 border border-red-900/30 flex items-center justify-center relative group cursor-pointer overflow-hidden">
               <div className="absolute inset-0 backdrop-blur-md bg-gray-950/80 flex items-center justify-center opacity-100 group-hover:opacity-0 transition-opacity duration-300 z-10">
                  <p className="text-red-400 font-medium flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4" /> Arahkan kursor untuk melihat
                  </p>
               </div>
               <pre className="text-xs text-red-400/70 overflow-x-auto w-full h-full font-mono">
                 {privateKey}
               </pre>
            </div>
            <button
              onClick={() => downloadKey("private_key.pem", privateKey)}
              className="w-full flex items-center justify-center gap-2 bg-red-950 hover:bg-red-900 text-red-200 border border-red-900/50 px-4 py-2.5 rounded-xl font-medium transition-colors"
            >
              <Download className="w-4 h-4" />
              Export Encrypted Private Key
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
