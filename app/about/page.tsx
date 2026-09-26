"use client";

import { Info, Lock, Shield, ArrowDown } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <div className="mb-12 text-center">
        <h1 className="text-3xl font-bold mb-4">Tentang Algoritma</h1>
        <p className="text-gray-400 max-w-2xl mx-auto">
          SignVerify menggunakan standar keamanan modern untuk memastikan integritas dan autentisitas dokumen Anda.
        </p>
      </div>

      <div className="space-y-12">
        <section className="bg-gray-900/50 border border-gray-800 rounded-3xl p-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-400">
              <Shield className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-semibold">SHA-256 (Secure Hash Algorithm)</h2>
          </div>
          <p className="text-gray-300 leading-relaxed mb-6">
            SHA-256 adalah fungsi hash yang mengubah data (dokumen PDF Anda) menjadi nilai hash berukuran tetap (sebuah string unik sepanjang 64 karakter). Perubahan kecil sekecil 1 byte (misalnya spasi tambahan) pada dokumen akan menghasilkan nilai hash yang sama sekali berbeda, sehingga integritas dokumen terjamin.
          </p>
        </section>

        <section className="bg-gray-900/50 border border-gray-800 rounded-3xl p-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center text-purple-400">
              <Lock className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-semibold">ECDSA P-256 (Elliptic Curve Digital Signature Algorithm)</h2>
          </div>
          <p className="text-gray-300 leading-relaxed mb-6">
            ECDSA adalah algoritma tanda tangan digital berbasis kriptografi kurva eliptik yang sangat aman dan efisien. Algoritma ini menghasilkan tanda tangan yang lebih kecil namun memiliki tingkat keamanan yang setara dengan RSA ukuran besar. ECDSA menggunakan pasangan kunci:
          </p>
          <div className="grid md:grid-cols-2 gap-6 mt-6">
            <div className="bg-red-950/20 border border-red-900/30 p-5 rounded-2xl">
              <h3 className="font-semibold text-red-400 mb-2">Private Key</h3>
              <p className="text-sm text-gray-400">
                Private key digunakan untuk <strong className="text-gray-200">membuat tanda tangan digital</strong>. Kunci ini harus dijaga kerahasiaannya oleh pemilik dan tidak boleh dibagikan kepada siapapun.
              </p>
            </div>
            <div className="bg-green-950/20 border border-green-900/30 p-5 rounded-2xl">
              <h3 className="font-semibold text-green-400 mb-2">Public Key</h3>
              <p className="text-sm text-gray-400">
                Public key digunakan oleh penerima dokumen untuk <strong className="text-gray-200">memverifikasi tanda tangan digital</strong>. Kunci ini aman untuk dibagikan secara publik.
              </p>
            </div>
          </div>
        </section>

        <section className="border-t border-gray-800 pt-12">
          <h2 className="text-2xl font-semibold mb-8 text-center">Cara Kerja Digital Signature</h2>
          
          <div className="grid md:grid-cols-2 gap-12">
            {/* Alur Tanda Tangan */}
            <div className="bg-gray-950 border border-gray-800 rounded-3xl p-8 flex flex-col items-center text-center">
              <h3 className="text-xl font-bold mb-6 text-blue-400">1. Proses Penandatanganan</h3>
              
              <div className="flex flex-col items-center space-y-2 text-sm text-gray-300 font-medium">
                <div className="bg-gray-800 px-6 py-3 rounded-lg border border-gray-700 w-48">Dokumen PDF</div>
                <ArrowDown className="w-5 h-5 text-gray-500" />
                <div className="bg-blue-900/30 px-6 py-2 rounded-lg border border-blue-800 text-blue-400 w-48 text-xs">Fungsi SHA-256</div>
                <ArrowDown className="w-5 h-5 text-gray-500" />
                <div className="bg-gray-800 px-6 py-3 rounded-lg border border-gray-700 w-48 font-mono text-xs">Hash Value</div>
                <ArrowDown className="w-5 h-5 text-gray-500" />
                <div className="flex items-center gap-3">
                  <div className="h-px w-8 bg-gray-600"></div>
                  <div className="bg-red-900/30 px-4 py-2 rounded-lg border border-red-800 text-red-400 text-xs">Private Key</div>
                </div>
                <ArrowDown className="w-5 h-5 text-gray-500" />
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-4 rounded-xl shadow-lg w-48">
                  Digital Signature
                </div>
              </div>
            </div>

            {/* Alur Verifikasi */}
            <div className="bg-gray-950 border border-gray-800 rounded-3xl p-8 flex flex-col items-center text-center">
              <h3 className="text-xl font-bold mb-6 text-purple-400">2. Proses Verifikasi</h3>
              
              <div className="flex flex-col items-center space-y-2 text-sm text-gray-300 font-medium">
                <div className="bg-gray-800 px-6 py-3 rounded-lg border border-gray-700 w-48">Dokumen PDF</div>
                <ArrowDown className="w-5 h-5 text-gray-500" />
                <div className="bg-blue-900/30 px-6 py-2 rounded-lg border border-blue-800 text-blue-400 w-48 text-xs">Fungsi SHA-256</div>
                <ArrowDown className="w-5 h-5 text-gray-500" />
                <div className="bg-gray-800 px-6 py-3 rounded-lg border border-gray-700 w-48 font-mono text-xs">Current Hash</div>
                <ArrowDown className="w-5 h-5 text-gray-500" />
                <div className="flex items-center gap-2">
                  <div className="bg-gray-800 px-2 py-2 rounded-lg border border-gray-700 text-xs">Signature</div>
                  <span className="text-gray-500">+</span>
                  <div className="bg-green-900/30 px-2 py-2 rounded-lg border border-green-800 text-green-400 text-xs">Public Key</div>
                </div>
                <ArrowDown className="w-5 h-5 text-gray-500" />
                <div className="flex gap-4">
                  <div className="bg-green-500/20 text-green-400 px-4 py-3 rounded-xl border border-green-500/30">
                    VALID
                  </div>
                  <div className="bg-red-500/20 text-red-400 px-4 py-3 rounded-xl border border-red-500/30">
                    INVALID
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
