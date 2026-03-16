import { useState, useRef, useCallback } from "react";
import { Upload } from "lucide-react";
import { cn } from "@/lib/utils";
import { parseCSV } from "@/lib/csv";
import type { Video } from "@/types";

interface UploadScreenProps {
  onUpload: (data: Video[]) => void;
}

export function UploadScreen({ onUpload }: UploadScreenProps) {
  const ref = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const handle = useCallback(
    (file: File | null | undefined) => {
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          onUpload(parseCSV(e.target!.result as string));
        } catch {
          alert("Failed to parse CSV.");
        }
      };
      reader.readAsText(file);
    },
    [onUpload],
  );

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6">
      <div className="font-syne text-[38px] font-extrabold text-white tracking-tight mb-2">
        Watch<span className="text-accent">Later</span>
      </div>
      <div className="font-mono text-dimmed text-[13px] mb-12">
        your youtube queue, offline
      </div>

      <div
        onClick={() => ref.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          handle(e.dataTransfer.files[0]);
        }}
        className={cn(
          "border-2 border-dashed rounded-2xl px-20 py-16 text-center cursor-pointer transition-all duration-200 max-w-[480px] w-full",
          dragging
            ? "border-accent bg-accent/5"
            : "border-white/12 bg-white/2 hover:border-white/20",
        )}
      >
        <div className="flex justify-center mb-4">
          <Upload size={36} className="text-white opacity-40" />
        </div>
        <div className="font-syne font-bold text-[#ccc] mb-2">
          Drop your CSV here
        </div>
        <div className="font-mono text-dimmed text-[12px]">
          or click to browse
        </div>
      </div>

      <input
        ref={ref}
        type="file"
        accept=".csv"
        className="hidden"
        onChange={(e) => handle(e.target.files?.[0])}
      />
    </div>
  );
}
