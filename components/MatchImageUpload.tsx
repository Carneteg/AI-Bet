"use client";

import { useState, useCallback, useRef, useEffect } from "react";

export interface AnalyzedMatchResult {
  homeTeam: string;
  awayTeam: string;
  league?: string;
  probability: { home: number; draw: number; away: number };
  streckning: { home: number; draw: number; away: number };
  odds?: { home: number; draw: number; away: number };
  rawText?: string;
}

interface Props {
  onAnalysis: (results: AnalyzedMatchResult[]) => void;
  onError: (msg: string) => void;
  setIsLoading: (v: boolean) => void;
  isLoading: boolean;
}

export default function MatchImageUpload({
  onAnalysis,
  onError,
  setIsLoading,
  isLoading,
}: Props) {
  const [preview, setPreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Track the latest request so stale responses from earlier uploads are ignored
  const requestIdRef = useRef(0);
  // Track mounted state so we never set state after unmount
  const mountedRef = useRef(true);
  useEffect(() => {
    return () => { mountedRef.current = false; };
  }, []);

  // Revoke the previous object URL when preview changes to prevent memory leaks
  const prevPreviewRef = useRef<string | null>(null);
  useEffect(() => {
    const prev = prevPreviewRef.current;
    if (prev && prev !== preview) URL.revokeObjectURL(prev);
    prevPreviewRef.current = preview;
  }, [preview]);
  // Revoke on unmount
  useEffect(() => {
    return () => { if (prevPreviewRef.current) URL.revokeObjectURL(prevPreviewRef.current); };
  }, []);

  const processFile = useCallback(
    async (file: File) => {
      if (!file.type.startsWith("image/")) {
        onError("Filen måste vara en bild (JPEG, PNG, WebP).");
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        onError("Bilden är för stor. Max 10 MB.");
        return;
      }

      // Assign a new request ID for this upload; stale responses will be dropped
      const thisRequestId = ++requestIdRef.current;

      setFileName(file.name);
      setPreview(URL.createObjectURL(file));
      setIsLoading(true);

      try {
        const formData = new FormData();
        formData.append("image", file);

        const res = await fetch("/api/analyze-image", {
          method: "POST",
          body: formData,
        });

        // Drop result if a newer upload has started or component unmounted
        if (!mountedRef.current || thisRequestId !== requestIdRef.current) return;

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(
            (data as { error?: string }).error ?? `HTTP ${res.status}`
          );
        }

        const data = await res.json();
        if (mountedRef.current && thisRequestId === requestIdRef.current) {
          onAnalysis(Array.isArray(data.matches) ? data.matches : []);
        }
      } catch (err) {
        if (mountedRef.current && thisRequestId === requestIdRef.current) {
          onError(
            err instanceof Error
              ? err.message
              : "Något gick fel vid analysen. Försök igen."
          );
        }
      } finally {
        if (mountedRef.current && thisRequestId === requestIdRef.current) {
          setIsLoading(false);
        }
      }
    },
    [onAnalysis, onError, setIsLoading]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) processFile(file);
    },
    [processFile]
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) processFile(file);
    },
    [processFile]
  );

  return (
    <div className="space-y-6">
      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        aria-label="Ladda upp matchbild — klicka eller dra en fil hit"
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") inputRef.current?.click(); }}
        className={`relative border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all ${
          isDragging
            ? "border-brand bg-brand/10 scale-[1.01]"
            : "border-slate-600 hover:border-brand/60 hover:bg-surface-card"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          aria-label="Välj bildfil"
          onChange={handleFileChange}
        />

        {isLoading ? (
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 rounded-full border-4 border-brand/30 border-t-brand animate-spin" aria-hidden="true" />
            <p className="text-slate-400 font-medium">Analyserar bild med AI...</p>
            <p className="text-slate-500 text-sm">Det tar 5–15 sekunder</p>
          </div>
        ) : preview ? (
          <div className="flex flex-col items-center gap-4">
            <img
              src={preview}
              alt="Förhandsvisning av uppladdad matchbild"
              className="max-h-64 rounded-xl object-contain border border-slate-700"
            />
            <p className="text-slate-400 text-sm">{fileName}</p>
            <p className="text-brand text-sm font-medium">
              Klicka för att byta bild
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-brand/10 border border-brand/20 flex items-center justify-center text-3xl" aria-hidden="true">
              📸
            </div>
            <div>
              <p className="text-slate-200 font-semibold text-lg">
                Dra och släpp ett foto här
              </p>
              <p className="text-slate-500 text-sm mt-1">
                eller klicka för att välja fil
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-2 text-xs text-slate-600">
              <span className="bg-slate-800 px-2 py-1 rounded">Stryktipskupong</span>
              <span className="bg-slate-800 px-2 py-1 rounded">Oddstavla</span>
              <span className="bg-slate-800 px-2 py-1 rounded">Matchprogram</span>
              <span className="bg-slate-800 px-2 py-1 rounded">Skärmdump</span>
            </div>
            <p className="text-slate-600 text-xs">JPEG, PNG, WebP · max 10 MB</p>
          </div>
        )}
      </div>

      {/* Instructions */}
      {!preview && !isLoading && (
        <div className="bg-surface-card border border-slate-700 rounded-xl p-4">
          <p className="text-slate-400 text-sm font-medium mb-3">
            💡 Bäst resultat med:
          </p>
          <ul className="text-slate-500 text-sm space-y-1.5">
            <li>• Tydlig bild med synliga lag, odds och streckprocent</li>
            <li>• Skärmdump från Stryktips.se eller liknande poolspelssajt</li>
            <li>• Foto på spelkupong — god belysning och skarp fokus</li>
            <li>• AI:n extraherar automatiskt alla matcher den hittar</li>
          </ul>
        </div>
      )}
    </div>
  );
}
