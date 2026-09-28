import Link from "next/link";
import { FileCheck, FileText, BadgeCheck } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col flex-1 w-full relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-[-20%] left-[-10%] w-96 h-96 bg-blue-600/20 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-96 h-96 bg-purple-600/20 rounded-full blur-[100px] pointer-events-none" />

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 flex flex-col lg:flex-row items-center gap-12 relative z-10">
        <div className="flex-1 flex flex-col items-start gap-6">
          <div className="inline-flex items-center space-x-2 bg-blue-500/10 border border-blue-500/20 px-3 py-1 rounded-full text-blue-400 text-sm font-medium">
            <BadgeCheck className="w-4 h-4" />
            <span>DIGITAL SIGNATURE</span>
          </div>
          <h1 className="text-4xl lg:text-6xl font-extrabold leading-tight tracking-tight">
            Pastikan Dokumen Anda <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
              Asli dan Tidak Berubah.
            </span>
          </h1>
          <p className="text-lg text-gray-400 max-w-xl leading-relaxed">
            SignVerify membantu membuat dan memverifikasi tanda tangan digital pada dokumen PDF menggunakan algoritma kriptografi yang aman: <strong className="text-gray-200">ECDSA P-256</strong> dan <strong className="text-gray-200">SHA-256</strong>.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 mt-4 w-full sm:w-auto">
            <Link
              href="/sign"
              className="inline-flex justify-center items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white px-8 py-3 rounded-full font-medium transition-all shadow-lg shadow-blue-500/25"
            >
              <span>✍️</span> Tanda Tangani Dokumen
            </Link>
            <Link
              href="/verify"
              className="inline-flex justify-center items-center gap-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-white px-8 py-3 rounded-full font-medium transition-colors"
            >
              <span>🔍</span> Verifikasi Dokumen
            </Link>
          </div>
        </div>

        <div className="flex-1 w-full max-w-md relative">
          <div className="absolute inset-0 bg-gradient-to-tr from-blue-500 to-purple-500 blur-2xl opacity-20 rounded-2xl" />
          <div className="bg-gray-900/80 backdrop-blur-xl border border-gray-800 rounded-2xl p-6 shadow-2xl relative">
            <div className="flex items-center gap-3 mb-6 border-b border-gray-800 pb-4">
              <FileCheck className="w-8 h-8 text-green-400" />
              <div>
                <h3 className="font-semibold text-gray-100">DOCUMENT VERIFIED</h3>
                <p className="text-xs text-gray-400">Status: Valid</p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="bg-gray-950 rounded-lg p-3 border border-gray-800/50">
                <p className="text-xs text-gray-500 mb-1">Nama File</p>
                <p className="text-sm font-medium text-gray-300 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-400" />
                  Surat_Keterangan.pdf
                </p>
              </div>
              <div className="bg-gray-950 rounded-lg p-3 border border-gray-800/50">
                <p className="text-xs text-gray-500 mb-1">SHA-256 Hash</p>
                <p className="text-xs font-mono text-gray-400 break-all">
                  a7f394...92bc81
                </p>
              </div>
              <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3 mt-4 text-center">
                <p className="text-sm font-medium text-green-400">
                  ✓ DIGITAL SIGNATURE VALID
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Penjelasan Singkat Section */}
      <section className="bg-gray-900/50 border-t border-gray-800 py-20 relative z-10">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl font-bold mb-4">Apa itu Digital Signature?</h2>
            <p className="text-gray-400">
              Digital signature adalah tanda tangan elektronik yang dibuat menggunakan teknik kriptografi. Tanda tangan ini dapat digunakan untuk memeriksa apakah sebuah dokumen masih asli dan apakah tanda tangan dibuat menggunakan kunci yang benar.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-gray-950 border border-gray-800 rounded-2xl p-6 hover:border-blue-500/50 transition-colors group">
              <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <span className="text-2xl">🔐</span>
              </div>
              <h3 className="text-xl font-semibold mb-3">Authenticity</h3>
              <p className="text-gray-400 text-sm">
                Memeriksa identitas pemilik kunci penandatangan. Memastikan bahwa dokumen benar-benar berasal dari sumber yang diklaim.
              </p>
            </div>

            <div className="bg-gray-950 border border-gray-800 rounded-2xl p-6 hover:border-purple-500/50 transition-colors group">
              <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <span className="text-2xl">🛡️</span>
              </div>
              <h3 className="text-xl font-semibold mb-3">Integrity</h3>
              <p className="text-gray-400 text-sm">
                Mengetahui apakah dokumen telah diubah. Perubahan 1 huruf saja pada dokumen akan membuat verifikasi gagal.
              </p>
            </div>

            <div className="bg-gray-950 border border-gray-800 rounded-2xl p-6 hover:border-green-500/50 transition-colors group">
              <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <span className="text-2xl">✓</span>
              </div>
              <h3 className="text-xl font-semibold mb-3">Verification</h3>
              <p className="text-gray-400 text-sm">
                Memastikan tanda tangan sesuai dengan dokumen. Proses matematis yang tidak bisa dipalsukan.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
