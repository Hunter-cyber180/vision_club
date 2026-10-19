import api from "./client";

// category: "image" | "video" | "document" | "archive"
export async function uploadFile(category, file, onProgress) {
  const formData = new FormData();
  formData.append("file", file);
  const { data } = await api.post(`/uploads/${category}`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
    onUploadProgress: onProgress
      ? (evt) => onProgress(evt.total ? Math.round((evt.loaded * 100) / evt.total) : 0)
      : undefined,
  });
  return data.data; // { url, filename, storedName, mimetype, size, category }
}
