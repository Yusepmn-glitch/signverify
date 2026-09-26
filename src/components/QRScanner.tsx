"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Camera, X, CheckCircle, AlertCircle, ImageIcon, ClipboardList } from "lucide-react";

export interface SignVerifyQRData {
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
  publicKey: string;
}

export interface QRScannerProps {
  onResult: (data: SignVerifyQRData, raw: string) => void;
}

type TabType = "camera" | "image" | "manual";

export default function QRScanner({ onResult }: QRScannerProps) {
  const [activeTab, setActiveTab] = useState<TabType>("camera");
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [scanStatus, setScanStatus] = useState<"idle" | "scanning" | "success" | "error">("idle");
  const [statusMessage, setStatusMessage] = useState<string>("");
  const [manualInput, setManualInput] = useState("");
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const stopCamera = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  }, []);

  const closeModal = useCallback(() => {
    stopCamera();
    setIsModalOpen(false);
    setScanStatus("idle");
    setStatusMessage("");
    setCameraError(null);
  }, [stopCamera]);

  useEffect(() => {
    return () => { stopCamera(); };
  }, [stopCamera]);

  const decodeFrame = useCallback(async (imageData: ImageData): Promise<string | null> => {
    const jsQR = (await import("jsqr")).default;
    const code = jsQR(imageData.data, imageData.width, imageData.height);
    return code ? code.data : null;
  }, []);

  const validateAndEmit = useCallback((raw: string): boolean => {
    try {
      const data = JSON.parse(raw);
      if (
        data.app !== "SignVerify" ||
        data.algorithm !== "ECDSA-P256" ||
        !data.hash ||
        !data.signature ||
        !data.publicKey
      ) {
        setScanStatus("error");
        setStatusMessage("❌ QR Code tidak dikenali. Bukan QR SignVerify.");
        return false;
      }
      setScanStatus("success");
      setStatusMessage("✓ QR Code SignVerify berhasil dibaca.");
      onResult(data as SignVerifyQRData, raw);
      return true;
    } catch {
      setScanStatus("error");
      setStatusMessage("❌ Format QR tidak valid (bukan JSON).");
      return false;
    }
  }, [onResult]);

  const scanLoop = useCallback(async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState < 2) {
      animFrameRef.current = requestAnimationFrame(scanLoop);
      return;
    }
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const result = await decodeFrame(imageData);
    if (result) {
      stopCamera();
      setIsModalOpen(false);
      validateAndEmit(result);
      return;
    }
    animFrameRef.current = requestAnimationFrame(scanLoop);
  }, [decodeFrame, stopCamera, validateAndEmit]);

  const startCamera = useCallback(async () => {
    setCameraError(null);
    setScanStatus("scanning");
    setStatusMessage("Menginisialisasi kamera...");
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("Browser tidak mendukung akses kamera.");
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setIsCameraActive(true);
      setStatusMessage("Arahkan kamera ke QR Code...");
      animFrameRef.current = requestAnimationFrame(scanLoop);
    } catch (err: any) {
      stopCamera();
      setScanStatus("idle");
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        setCameraError("Kamera tidak dapat digunakan. Silakan gunakan Upload QR Image atau Input Data QR.");
      } else {
        setCameraError(err.message || "Gagal mengakses kamera.");
      }
    }
  }, [scanLoop, stopCamera]);

  useEffect(() => {
    if (isModalOpen && activeTab === "camera" && !isCameraActive && !cameraError) {
      startCamera();
    }
    if (!isModalOpen) {
      stopCamera();
    }
  }, [isModalOpen, activeTab, isCameraActive, cameraError, startCamera, stopCamera]);

  const handleImageUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setScanStatus("scanning");
    setStatusMessage("Memproses gambar...");
    try {
      const bitmap = await createImageBitmap(file);
      const canvas = document.createElement("canvas");
      canvas.width = bitmap.width;
      canvas.height = bitmap.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas tidak tersedia.");
      ctx.drawImage(bitmap, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const result = await decodeFrame(imageData);
      if (result) {
        validateAndEmit(result);
      } else {
        setScanStatus("error");
        setStatusMessage("❌ QR Code tidak terdeteksi dalam gambar.");
      }
    } catch (err: any) {
      setScanStatus("error");
      setStatusMessage("❌ Gagal memproses gambar: " + err.message);
    }
    if (imageInputRef.current) imageInputRef.current.value = "";
  }, [decodeFrame, validateAndEmit]);

  const handleManualInput = useCallback(() => {
    if (!manualInput.trim()) {
      setScanStatus("error");
      setStatusMessage("❌ Input kosong.");
      return;
    }
    validateAndEmit(manualInput.trim());
  }, [manualInput, validateAndEmit]);

  const handleTabChange = (tab: TabType) => {
    if (tab !== "camera") stopCamera();
    setActiveTab(tab);
    setScanStatus("idle");
    setStatusMessage("");
    setCameraError(null);
  };

  const tabs: { id: TabType; icon: string; label: string }[] = [
    { id: "camera", icon: "📷", label: "Scan QR" },
    { id: "image", icon: "🖼️", label: "Upload QR" },
    { id: "manual", icon: "📋", label: "Input Manual" },
  ];

  return (
    <div className="w-full">
      {/* Tab Selector */}
      <div className="flex gap-2 mb-4">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabChange(tab.id)}
            className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
              activeTab === tab.id
                ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20"
                : "bg-gray-800 hover:bg-gray-700 text-gray-300"
            }`}
          >
            <span>{tab.icon}</span>
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* === CAMERA TAB === */}
      {activeTab === "camera" && (
        <div className="space-y-3">
          {!isModalOpen && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-3 rounded-xl font-medium transition-colors"
            >
              <Camera className="w-5 h-5" />
              Scan QR dengan Kamera
            </button>
          )}

          {/* Camera Modal */}
          {isModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
              <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
                <div className="flex items-center justify-between p-4 border-b border-gray-800">
                  <div>
                    <h3 className="font-semibold text-white">Scan QR Code</h3>
                    <p className="text-xs text-gray-400 mt-0.5">Arahkan kamera ke QR Code</p>
                  </div>
                  <button
                    onClick={closeModal}
                    className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="relative bg-black" style={{ aspectRatio: "4/3" }}>
                  <video ref={videoRef} className="w-full h-full object-cover" playsInline muted autoPlay />
                  <canvas ref={canvasRef} className="hidden" />

                  {isCameraActive && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="w-52 h-52 relative">
                        <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-blue-400 rounded-tl-lg" />
                        <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-blue-400 rounded-tr-lg" />
                        <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-blue-400 rounded-bl-lg" />
                        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-blue-400 rounded-br-lg" />
                      </div>
                    </div>
                  )}

                  {cameraError && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-950/95 p-6 text-center">
                      <div>
                        <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
                        <p className="text-sm text-gray-300">{cameraError}</p>
                        <p className="text-xs text-gray-500 mt-2">Gunakan tab Upload QR atau Input Manual.</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="p-4 flex items-center justify-between gap-3">
                  <p className="text-sm text-gray-400 flex-1 truncate">
                    {statusMessage || "Menunggu kamera..."}
                  </p>
                  <button
                    onClick={closeModal}
                    className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap"
                  >
                    <X className="w-4 h-4" />
                    Tutup Scanner
                  </button>
                </div>
              </div>
            </div>
          )}

          {cameraError && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3">
              <p className="text-xs text-red-400">{cameraError}</p>
            </div>
          )}
        </div>
      )}

      {/* === IMAGE UPLOAD TAB === */}
      {activeTab === "image" && (
        <div className="space-y-3">
          <div
            className="border-2 border-dashed border-gray-700 hover:border-blue-500/50 bg-gray-950 rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-colors"
            onClick={() => imageInputRef.current?.click()}
          >
            <ImageIcon className="w-10 h-10 text-gray-500 mb-3" />
            <p className="text-sm font-medium text-gray-300 mb-1">Upload Screenshot QR Code</p>
            <p className="text-xs text-gray-500">PNG, JPG, JPEG, WebP</p>
          </div>
          <input
            ref={imageInputRef}
            type="file"
            accept="image/png,image/jpeg,image/jpg,image/webp"
            className="hidden"
            onChange={handleImageUpload}
          />
        </div>
      )}

      {/* === MANUAL INPUT TAB === */}
      {activeTab === "manual" && (
        <div className="space-y-3">
          <textarea
            value={manualInput}
            onChange={(e) => setManualInput(e.target.value)}
            placeholder={'Tempel data QR Code di sini...\n{"app":"SignVerify","hash":"...","signature":"...",...}'}
            rows={6}
            className="w-full bg-gray-950 border border-gray-800 rounded-xl p-4 text-xs font-mono text-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-shadow resize-none"
          />
          <button
            onClick={handleManualInput}
            disabled={!manualInput.trim()}
            className="w-full bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-3 rounded-xl font-medium transition-colors"
          >
            Gunakan Data
          </button>
        </div>
      )}

      {/* Scan Status Feedback */}
      {scanStatus !== "idle" && !isModalOpen && (
        <div className={`mt-3 flex items-center gap-2 p-3 rounded-xl text-sm ${
          scanStatus === "success"
            ? "bg-green-500/10 border border-green-500/20 text-green-400"
            : scanStatus === "error"
            ? "bg-red-500/10 border border-red-500/20 text-red-400"
            : "bg-blue-500/10 border border-blue-500/20 text-blue-400 animate-pulse"
        }`}>
          {scanStatus === "success"
            ? <CheckCircle className="w-4 h-4 flex-shrink-0" />
            : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
          {statusMessage}
        </div>
      )}
    </div>
  );
}
