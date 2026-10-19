import { useRef, useState } from "react";
import Icon from "./Icon";
import { uploadFile } from "../api/upload";
import { useToast } from "../context/ToastContext";

// category: "image" | "video" | "document" | "archive"
// value: URL فعلی فایل (اگه از قبل آپلود شده) ؛ onChange(url, meta)
export default function FileUploadPicker({ category, value, onChange, label, hint, accept }) {
  const toast = useToast();
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [fileName, setFileName] = useState("");

  const pick = () => inputRef.current?.click();

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setProgress(0);
    try {
      const result = await uploadFile(category, file, setProgress);
      setFileName(result.filename);
      onChange(result.url, result);
      toast("فایل با موفقیت آپلود شد");
    } catch (err) {
      toast(err?.response?.data?.message || "آپلود فایل با خطا مواجه شد", "error");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const pickedLabel = uploading ? `در حال آپلود... ${progress}%` : (fileName || value ? (fileName || "فایلی انتخاب شده") : "فایلی انتخاب نشده");

  return (
    <div className="field">
      {label && <label>{label}</label>}
      <div className="upload-row">
        <div className="upload-picked">{pickedLabel}</div>
        <button type="button" className="btn btn-ghost btn-sm" disabled={uploading} onClick={pick}>
          <Icon name="uploadCloud" /> {uploading ? "..." : "انتخاب فایل"}
        </button>
      </div>
      {hint && <div className="field-hint">{hint}</div>}
      <input ref={inputRef} type="file" accept={accept} style={{ display: "none" }} onChange={handleFile} />
    </div>
  );
}
