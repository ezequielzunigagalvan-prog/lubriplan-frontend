import { useState, useRef } from "react";
import { Camera, X, Upload } from "lucide-react";
import { toast } from "sonner";

export default function PhotoCapture({ workOrderId, onPhotoAdded, maintenanceApi }) {
  const [photos, setPhotos] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [kind, setKind] = useState("BEFORE"); // BEFORE, AFTER, OTHER
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  const handlePhotoSelect = async (file) => {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      setPhotos((prev) => [
        ...prev,
        {
          id: `temp_${Date.now()}`,
          src: e.target.result,
          kind,
          file,
          uploaded: false,
        },
      ]);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (photos.length === 0) {
      toast.warning("Selecciona al menos una foto");
      return;
    }

    setUploading(true);

    try {
      for (const photo of photos) {
        if (photo.uploaded) continue;

        const response = await maintenanceApi.uploadPhoto(
          workOrderId,
          photo.file,
          photo.kind
        );

        setPhotos((prev) =>
          prev.map((p) =>
            p.id === photo.id ? { ...p, uploaded: true, url: response.url } : p
          )
        );

        onPhotoAdded?.(response);
      }

      toast.success(`${photos.length} foto(s) subida(s)`);
      setPhotos([]);
      setKind("BEFORE");
    } catch (error) {
      toast.error("Error subiendo fotos: " + error.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4 p-4 bg-gray-50 rounded-lg border">
      <h3 className="font-bold text-lg">📸 Evidencia Fotográfica</h3>

      {/* Type selector */}
      <div className="flex gap-2">
        {[
          { value: "BEFORE", label: "🔴 Antes", color: "bg-red-100" },
          { value: "AFTER", label: "🟢 Después", color: "bg-green-100" },
          { value: "OTHER", label: "🔵 Otro", color: "bg-blue-100" },
        ].map((option) => (
          <button
            key={option.value}
            onClick={() => setKind(option.value)}
            className={`px-4 py-2 rounded font-bold text-sm transition ${
              kind === option.value
                ? option.color + " border-2 border-gray-800"
                : "bg-gray-200 border-2 border-transparent"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      {/* Upload buttons */}
      <div className="flex gap-2">
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded font-bold hover:bg-blue-600"
        >
          <Upload size={18} />
          Galería
        </button>
        <button
          onClick={() => cameraInputRef.current?.click()}
          className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded font-bold hover:bg-blue-600"
        >
          <Camera size={18} />
          Cámara
        </button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          Array.from(e.target.files || []).forEach((f) => handlePhotoSelect(f));
        }}
      />

      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => handlePhotoSelect(e.target.files?.[0])}
      />

      {/* Preview grid */}
      {photos.length > 0 && (
        <div className="grid grid-cols-4 gap-2">
          {photos.map((photo) => (
            <div key={photo.id} className="relative group">
              <img
                src={photo.src}
                alt="preview"
                className="w-full h-20 object-cover rounded border-2 border-gray-300"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 rounded transition flex items-center justify-center">
                <span className="text-xs bg-black text-white px-2 py-1 rounded hidden group-hover:block">
                  {photo.kind}
                </span>
              </div>
              <button
                onClick={() =>
                  setPhotos((prev) => prev.filter((p) => p.id !== photo.id))
                }
                className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hidden group-hover:block"
              >
                <X size={12} />
              </button>
              {photo.uploaded && (
                <div className="absolute bottom-1 right-1 bg-green-500 text-white rounded-full p-1">
                  ✓
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Upload action */}
      {photos.some((p) => !p.uploaded) && (
        <button
          onClick={handleUpload}
          disabled={uploading}
          className="w-full px-4 py-2 bg-green-500 text-white rounded font-bold hover:bg-green-600 disabled:opacity-50"
        >
          {uploading ? "Subiendo..." : `Subir ${photos.length} foto(s)`}
        </button>
      )}

      {/* Count */}
      <p className="text-sm text-gray-600">
        {photos.length} foto(s) seleccionada(s)
      </p>
    </div>
  );
}
