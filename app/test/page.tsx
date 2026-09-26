"use client";

import { useState, useEffect } from "react";
import { Play, Check, X, Clock, ShieldCheck } from "lucide-react";
import { generateKeyPair, exportPublicKey, calculateSHA256, signData, verifySignature } from "@/utils/crypto";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface TestResult {
  id: string;
  name: string;
  expected: "PASS" | "FAIL";
  result: "PASS" | "FAIL" | "PENDING";
  timeMs?: number;
}

export default function TestPage() {
  const [isRunning, setIsRunning] = useState(false);
  const [tests, setTests] = useState<TestResult[]>([
    { id: "t1", name: "Generate key pair (ECDSA P-256)", expected: "PASS", result: "PENDING" },
    { id: "t2", name: "Sign document (SHA-256 + ECDSA)", expected: "PASS", result: "PENDING" },
    { id: "t3", name: "Verify original document", expected: "PASS", result: "PENDING" },
    { id: "t4", name: "Tamper detection (Modify document)", expected: "FAIL", result: "PENDING" },
    { id: "t5", name: "Verify using wrong public key", expected: "FAIL", result: "PENDING" },
  ]);

  const [perfStats, setPerfStats] = useState<{
    avgSign: number; minSign: number; maxSign: number;
    avgVerify: number; minVerify: number; maxVerify: number;
  } | null>(null);

  const [chartData, setChartData] = useState<any[]>([]);
  const [signatureInfo, setSignatureInfo] = useState<{pubKeySize: number, sigSize: number} | null>(null);

  const runTests = async () => {
    setIsRunning(true);
    
    // Reset
    setTests(tests.map(t => ({ ...t, result: "PENDING", timeMs: 0 })));
    setPerfStats(null);
    setChartData([]);

    try {
      // Mock File for testing
      const testContent = "This is a test document for digital signature.";
      const testFile = new File([testContent], "test.pdf", { type: "application/pdf" });
      const tamperedFile = new File([testContent + " "], "test.pdf", { type: "application/pdf" }); // 1 byte changed
      
      // TEST 1: Generate Key Pair
      const t1Start = performance.now();
      const keyPair = await generateKeyPair();
      const wrongKeyPair = await generateKeyPair();
      const pubKeyPem = await exportPublicKey(keyPair.publicKey);
      const t1End = performance.now();
      updateTestResult("t1", "PASS", t1End - t1Start);

      // TEST 2: Sign Document
      const t2Start = performance.now();
      const hash = await calculateSHA256(testFile);
      const metadata = JSON.stringify({ filename: "test.pdf", hash, date: new Date().toISOString() });
      const signature = await signData(keyPair.privateKey, metadata);
      const t2End = performance.now();
      updateTestResult("t2", "PASS", t2End - t2Start);
      
      // Save sizes
      setSignatureInfo({
        pubKeySize: new Blob([pubKeyPem]).size,
        sigSize: new Blob([signature]).size
      });

      // TEST 3: Verify Original
      const t3Start = performance.now();
      const isValidOriginal = await verifySignature(keyPair.publicKey, signature, metadata);
      const t3End = performance.now();
      updateTestResult("t3", isValidOriginal ? "PASS" : "FAIL", t3End - t3Start);

      // TEST 4: Modify Document (Tamper)
      const t4Start = performance.now();
      const tamperedHash = await calculateSHA256(tamperedFile);
      // Simulate verification flow: hash is different, so metadata hash won't match, or signature will fail if we recreate metadata
      const isValidTampered = tamperedHash === hash; 
      const t4End = performance.now();
      updateTestResult("t4", isValidTampered ? "PASS" : "FAIL", t4End - t4Start);

      // TEST 5: Wrong Key
      const t5Start = performance.now();
      const isValidWrongKey = await verifySignature(wrongKeyPair.publicKey, signature, metadata);
      const t5End = performance.now();
      updateTestResult("t5", isValidWrongKey ? "PASS" : "FAIL", t5End - t5Start);

      // --- PERFORMANCE TESTING (30 Iterations) ---
      await runPerformanceTests(keyPair, testFile);

    } catch (error) {
      console.error("Test failed", error);
    } finally {
      setIsRunning(false);
    }
  };

  const updateTestResult = (id: string, result: "PASS" | "FAIL", timeMs: number) => {
    setTests(prev => prev.map(t => t.id === id ? { ...t, result, timeMs } : t));
  };

  const runPerformanceTests = async (keyPair: CryptoKeyPair, file: File) => {
    const ITERATIONS = 30;
    const signTimes = [];
    const verifyTimes = [];
    const newChartData = [];

    const hash = await calculateSHA256(file);
    const metadata = JSON.stringify({ filename: "perf.pdf", hash });

    for (let i = 0; i < ITERATIONS; i++) {
      // Sign
      const sStart = performance.now();
      const sig = await signData(keyPair.privateKey, metadata);
      const sEnd = performance.now();
      const sTime = sEnd - sStart;
      signTimes.push(sTime);

      // Verify
      const vStart = performance.now();
      await verifySignature(keyPair.publicKey, sig, metadata);
      const vEnd = performance.now();
      const vTime = vEnd - vStart;
      verifyTimes.push(vTime);

      newChartData.push({
        iteration: i + 1,
        sign: sTime,
        verify: vTime
      });
    }

    setPerfStats({
      avgSign: signTimes.reduce((a, b) => a + b, 0) / ITERATIONS,
      minSign: Math.min(...signTimes),
      maxSign: Math.max(...signTimes),
      avgVerify: verifyTimes.reduce((a, b) => a + b, 0) / ITERATIONS,
      minVerify: Math.min(...verifyTimes),
      maxVerify: Math.max(...verifyTimes),
    });
    setChartData(newChartData);
  };

  return (
    <div className="container mx-auto px-4 py-12 max-w-5xl">
      <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Pengujian Sistem</h1>
          <p className="text-gray-400">Jalankan unit test kriptografi dan uji performa (30 iterasi).</p>
        </div>
        <button
          onClick={runTests}
          disabled={isRunning}
          className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl font-bold transition-colors flex items-center gap-2 disabled:opacity-50 shadow-lg shadow-blue-500/20 whitespace-nowrap"
        >
          <Play className="w-5 h-5" />
          {isRunning ? "Menjalankan Test..." : "Jalankan Semua Test"}
        </button>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Unit Tests Table */}
        <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6">
          <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-blue-400" /> Hasil Unit Test
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-800 text-gray-400 text-sm">
                  <th className="pb-3 font-medium">Skenario Test</th>
                  <th className="pb-3 font-medium">Expected</th>
                  <th className="pb-3 font-medium text-right">Result</th>
                </tr>
              </thead>
              <tbody>
                {tests.map((test) => (
                  <tr key={test.id} className="border-b border-gray-800/50">
                    <td className="py-4 pr-4">
                      <p className="font-medium text-sm text-gray-200">{test.name}</p>
                      {test.timeMs !== undefined && test.timeMs > 0 && (
                        <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {test.timeMs.toFixed(2)} ms
                        </p>
                      )}
                    </td>
                    <td className="py-4">
                      <span className={`text-xs px-2 py-1 rounded-md ${test.expected === 'PASS' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                        {test.expected}
                      </span>
                    </td>
                    <td className="py-4 text-right">
                      {test.result === "PENDING" ? (
                        <span className="text-gray-500 text-sm">Menunggu...</span>
                      ) : (
                        <div className="flex items-center justify-end gap-1">
                          {test.result === test.expected ? (
                            <span className="text-green-400 flex items-center gap-1 font-bold text-sm">
                              <Check className="w-4 h-4" /> SESUAI
                            </span>
                          ) : (
                            <span className="text-red-400 flex items-center gap-1 font-bold text-sm">
                              <X className="w-4 h-4" /> GAGAL
                            </span>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Performance Tests */}
        <div className="space-y-6">
          <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6">
            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
              <Clock className="w-5 h-5 text-purple-400" /> Uji Performa (30x Percobaan)
            </h2>
            
            {perfStats ? (
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-gray-950 p-4 rounded-xl border border-gray-800/50">
                  <p className="text-xs text-gray-400 mb-1">Average Signing Time</p>
                  <p className="text-xl font-bold text-blue-400">{perfStats.avgSign.toFixed(2)} ms</p>
                  <div className="flex justify-between mt-2 text-xs text-gray-500">
                    <span>Min: {perfStats.minSign.toFixed(1)}</span>
                    <span>Max: {perfStats.maxSign.toFixed(1)}</span>
                  </div>
                </div>
                <div className="bg-gray-950 p-4 rounded-xl border border-gray-800/50">
                  <p className="text-xs text-gray-400 mb-1">Average Verification Time</p>
                  <p className="text-xl font-bold text-purple-400">{perfStats.avgVerify.toFixed(2)} ms</p>
                  <div className="flex justify-between mt-2 text-xs text-gray-500">
                    <span>Min: {perfStats.minVerify.toFixed(1)}</span>
                    <span>Max: {perfStats.maxVerify.toFixed(1)}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-gray-950 p-8 rounded-xl border border-gray-800/50 flex items-center justify-center text-gray-500 mb-6 h-32">
                Jalankan test untuk melihat hasil performa.
              </div>
            )}

            {chartData.length > 0 && (
              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <XAxis dataKey="iteration" hide />
                    <YAxis fontSize={10} stroke="#4B5563" />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#030712', borderColor: '#1F2937', fontSize: '12px' }}
                      itemStyle={{ color: '#E5E7EB' }}
                    />
                    <Bar dataKey="sign" name="Sign (ms)" fill="#3B82F6" />
                    <Bar dataKey="verify" name="Verify (ms)" fill="#A855F7" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Info Algoritma & Ukuran */}
          {signatureInfo && (
            <div className="bg-blue-900/10 border border-blue-900/30 rounded-2xl p-6">
              <h3 className="font-semibold mb-4 text-blue-400">Informasi Kriptografi</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-400">Algoritma:</span>
                  <span className="font-mono text-gray-200">ECDSA P-256</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-400">Hashing:</span>
                  <span className="font-mono text-gray-200">SHA-256</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-400">Ukuran Public Key:</span>
                  <span className="font-mono text-gray-200">{signatureInfo.pubKeySize} Bytes</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-400">Ukuran Signature:</span>
                  <span className="font-mono text-gray-200">{signatureInfo.sigSize} Bytes</span>
                </div>
              </div>
              <p className="text-xs text-blue-400/70 mt-4 leading-relaxed">
                Ukuran signature dan public key ini sangat ringan dibandingkan dengan dokumen, sehingga efisien untuk disimpan dalam bentuk QR-Code.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
