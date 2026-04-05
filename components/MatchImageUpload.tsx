"use client";

import { useState, useCallback, useRef } from "react";

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
  /** Called immediately when a new file is selected — parent should clear prior results. */
  onReset: () => void;
  /** Called with results + session ID when analysis completes successfully. */
  onAnalysis: (results: AnalyzedMatchResult[], sessionId: string) => void;
  onError: (msg: string) => void;
  setIsLoading: (v: boolean) => void;
  isLoading: boolean;
}

/** Stable fingerprint for a File: name + size + last-modified timestamp. */
function fileFingerprint(file: File): string {
  return `${file.name}-${file.size}-${file.lastModified}`;
}

export default function MatchImageUpload({
  onReset,
  onAnalysis,
  onError,
  setIsLoading,
  isLoading,
}: Props) {
  const [preview, setPreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  /** The session ID of the most recently started upload. Used to discard stale responses. */
  const activeSessionRef = useRef<string | null>(null);
  /** AbortController for the current in-flight fetch. Cancelled when a new upload starts. */
  const abortControllerRef = useRef<AbortController | null>(null);
  /** Stored so the "Analysera igen" button can re-run without re-selecting. */
  const currentFileRef = useRef<File | null>(null);

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

      // 1. Cancel any in-flight request from the previous upload.
      abortControllerRef.current?.abort();
      const controller = new AbortController();
      abortControllerRef.current = controller;

      // 2. Generate a unique session ID for this upload.
      const sessionId = fileFingerprint(file);
      activeSessionRef.current = sessionId;
      currentFileRef.current = file;

      // 3. Reset parent state immediately — no stale results while loading.
      onReset();

      // 4. Update local preview.
      const objectUrl = URL.createObjectURL(file);
      setPreview(objectUrl);
      setFileName(file.name);
      setIsLoading(true);

      try {
        const formData = new FormData();
        formData.append("image", file);

        const res = await fetch("/api/analyze-image", {
          method: "POST",
          body: formData,
          signal: controller.signal,
        });

        // 5. Stale-result guard: discard if a newer upload has already started.
        if (activeSessionRef.current !== sessionId) return;

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error ?? `HTTP ${res.status}`);
        }

        const data = await res.json();

        // 6. Final stale check after await.
        if (activeSessionRef.current !== sessionId) return;

        onAnalysis(data.matches ?? [], sessionId);
      } catch (err) {
        if ((err as Error).name === "AbortError") return; // Superseded — silent.
        if (activeSessionRef.current !== sessionId) return;
        onError(
          err instanceof Error
            ? err.message
            : "Något gick fel vid analysen. Försök igen."
        );
      } finally {
        if (activeSessionRef.current === sessionId) {
          setIsLoading(false);
        }
      }
    },
    [onReset, onAnalysis, onError, setIsLoading]
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
      // Reset input value so the same file can be selected again (re-analyze trigger).
      e.target.value = "";
    },
    [processFile]
  );

  /** Re-run analysis on the same file without re-selecting. */
  const handleReanalyze = useCallback(() => {
    if (currentFileRef.current) processFile(currentFileRef.current);
  }, [processFile]);

  return (
    <div className="space-y-6">
      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
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
          onChange={handleFileChange}
        />

        {isLoading ? (
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 rounded-full border-4 border-brand/30 border-t-brand animate-spin" />
            <p className="text-slate-400 font-medium">Analyserar ny bild med AI…</p>
            <p className="text-slate-500 text-sm">Det tar 5–15 sekunder</p>
          </div>
        ) : preview ? (
          <div className="flex flex-col items-center gap-4">
            <img
              src={preview}
              alt="Uppladdad bild"
              className="max-h-64 rounded-xl object-contain border border-slate-700"
            />
            <p className="text-slate-400 text-sm">{fileName}</p>
            <p className="text-brand text-sm font-medium">
              Klicka för att ladda upp en ny bild
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-brand/10 border border-brand/20 flex items-center justify-center text-3xl">
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

      {/* Re-analyze button — only visible after a completed analysis */}
      {preview && !isLoading && (
        <button
          onClick={(e) => { e.stopPropagation(); handleReanalyze(); }}
          className="w-full border border-slate-600 hover:border-brand/40 text-slate-400 hover:text-white transition rounded-xl py-2.5 text-sm font-medium"
        >
          Analysera igen (samma bild)
        </button>
      )}

      {/* Instructions — only when no image loaded */}
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
