import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { maintenanceApi } from "../services/maintenanceApi";
import { PRIORITIES, PRIORITY_LABELS, PRIORITY_COLORS } from "../constants/maintenance";
import { useTheme } from "../../../context/ThemeContext";
import { Icon } from "../../../components/ui/lpIcons";

const DRAFT_KEY = "mnt_report_failure_draft";

export default function ReportFailure() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const [formData, setFormData] = useState(() => {
    const draft = localStorage.getItem(DRAFT_KEY);
    return draft
      ? JSON.parse(draft)
      : {
          assetId: "",
          assetSearch: "",
          title: "",
          description: "",
          priority: PRIORITIES.HIGH,
          photos: [],
        };
  });

  const [assets, setAssets] = useState([]);
  const [filteredAssets, setFilteredAssets] = useState([]);
  const [showAssetList, setShowAssetList] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const cameraRef = useRef(null);

  // Load assets on mount
  useEffect(() => {
    const loadAssets = async () => {
      try {
        setLoading(true);
        const response = await maintenanceApi.getAssets({ limit: 100 });
        const assetList = response?.data || [];
        setAssets(assetList);
      } catch (err) {
        console.error("Error loading assets:", err);
        setError("Error al cargar activos");
      } finally {
        setLoading(false);
      }
    };

    loadAssets();
  }, []);

  // Filter assets based on search
  useEffect(() => {
    if (!formData.assetSearch.trim()) {
      setFilteredAssets([]);
      return;
    }

    const search = formData.assetSearch.toLowerCase();
    const filtered = assets.filter(
      (a) =>
        a.name?.toLowerCase().includes(search) ||
        a.code?.toLowerCase().includes(search)
    );
    setFilteredAssets(filtered);
  }, [formData.assetSearch, assets]);

  // Save draft to localStorage on change
  useEffect(() => {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(formData));
  }, [formData]);

  const handleAssetSelect = (asset) => {
    setFormData((prev) => ({
      ...prev,
      assetId: asset.id,
      assetSearch: asset.name,
    }));
    setShowAssetList(false);
  };

  const handlePriorityChange = (priority) => {
    setFormData((prev) => ({ ...prev, priority }));
  };

  const handleCameraCapture = async (e) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (formData.photos.length < 3) {
        const reader = new FileReader();
        reader.onload = (event) => {
          setFormData((prev) => ({
            ...prev,
            photos: [
              ...prev.photos,
              { file, preview: event.target.result },
            ],
          }));
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const handleRemovePhoto = (idx) => {
    setFormData((prev) => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== idx),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.assetId) {
      setError("Selecciona un activo");
      return;
    }

    if (!formData.title.trim()) {
      setError("Ingresa un título");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      // Create work order
      const response = await maintenanceApi.createWorkOrder({
        assetId: formData.assetId,
        title: formData.title,
        description: formData.description,
        priority: formData.priority,
      });

      const workOrderId = response?.data?.id;

      // Upload photos
      if (formData.photos.length > 0 && workOrderId) {
        for (let i = 0; i < formData.photos.length; i++) {
          const photo = formData.photos[i];
          try {
            await maintenanceApi.uploadPhoto(
              workOrderId,
              photo.file,
              "GENERAL"
            );
          } catch (photoErr) {
            console.error("Photo upload error:", photoErr);
          }
        }
      }

      // Clear draft
      localStorage.removeItem(DRAFT_KEY);

      // Navigate to work order
      navigate(`/maintenance/app/work-orders/${workOrderId}`);
    } catch (err) {
      setError(err?.message || "Error al reportar falla");
      setSubmitting(false);
    }
  };

  return (
    <div style={container}>
      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }

        .mnt-asset-dropdown {
          animation: slideUp 200ms ease;
        }
      `}</style>

      <form onSubmit={handleSubmit} style={form}>
        {/* Asset Selection */}
        <fieldset style={fieldset}>
          <label style={label}>Activo *</label>
          <div style={{ position: "relative" }}>
            <input
              type="text"
              placeholder="Buscar activo..."
              value={formData.assetSearch}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  assetSearch: e.target.value,
                }))
              }
              onFocus={() => setShowAssetList(true)}
              style={{
                ...input,
                background: isDark ? "#1f2937" : "#fff",
                color: isDark ? "#f1f5f9" : "#0f172a",
                borderColor: isDark
                  ? "rgba(255,255,255,0.08)"
                  : "rgba(226,232,240,0.95)",
              }}
            />
            {showAssetList && filteredAssets.length > 0 && (
              <div className="mnt-asset-dropdown" style={assetDropdown}>
                {filteredAssets.map((asset) => (
                  <button
                    key={asset.id}
                    type="button"
                    onClick={() => handleAssetSelect(asset)}
                    style={{
                      ...assetOption,
                      background: isDark ? "rgba(255,255,255,0.05)" : "#f8fafc",
                      color: isDark ? "#f1f5f9" : "#0f172a",
                    }}
                  >
                    {asset.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </fieldset>

        {/* Title */}
        <fieldset style={fieldset}>
          <label style={label}>Título *</label>
          <input
            type="text"
            placeholder="Ej: Ruido anormal en bomba"
            value={formData.title}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, title: e.target.value }))
            }
            style={{
              ...input,
              background: isDark ? "#1f2937" : "#fff",
              color: isDark ? "#f1f5f9" : "#0f172a",
              borderColor: isDark
                ? "rgba(255,255,255,0.08)"
                : "rgba(226,232,240,0.95)",
            }}
            required
            minLength={3}
          />
        </fieldset>

        {/* Description */}
        <fieldset style={fieldset}>
          <label style={label}>Descripción</label>
          <textarea
            placeholder="Detalles adicionales..."
            value={formData.description}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, description: e.target.value }))
            }
            style={{
              ...textarea,
              background: isDark ? "#1f2937" : "#fff",
              color: isDark ? "#f1f5f9" : "#0f172a",
              borderColor: isDark
                ? "rgba(255,255,255,0.08)"
                : "rgba(226,232,240,0.95)",
            }}
            rows={3}
          />
        </fieldset>

        {/* Priority */}
        <fieldset style={fieldset}>
          <label style={label}>Prioridad</label>
          <div style={priorityGrid}>
            {Object.values(PRIORITIES).map((priority) => (
              <button
                key={priority}
                type="button"
                onClick={() => handlePriorityChange(priority)}
                style={{
                  ...priorityButton,
                  background:
                    formData.priority === priority
                      ? PRIORITY_COLORS[priority]?.bg ||
                        PRIORITY_COLORS[priority]
                      : isDark
                      ? "rgba(255,255,255,0.05)"
                      : "rgba(248,250,252,0.8)",
                  borderColor:
                    formData.priority === priority
                      ? PRIORITY_COLORS[priority]?.border ||
                        PRIORITY_COLORS[priority]
                      : isDark
                      ? "rgba(255,255,255,0.08)"
                      : "rgba(226,232,240,0.95)",
                  color:
                    formData.priority === priority
                      ? PRIORITY_COLORS[priority]?.text ||
                        PRIORITY_COLORS[priority]
                      : isDark
                      ? "#94a3b8"
                      : "#64748b",
                }}
              >
                {PRIORITY_LABELS[priority]}
              </button>
            ))}
          </div>
        </fieldset>

        {/* Photos */}
        <fieldset style={fieldset}>
          <label style={label}>Fotos ({formData.photos.length}/3)</label>
          <input
            ref={cameraRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleCameraCapture}
            style={{ display: "none" }}
            disabled={formData.photos.length >= 3}
          />
          <button
            type="button"
            onClick={() => cameraRef.current?.click()}
            disabled={formData.photos.length >= 3}
            style={{
              ...photoButton,
              background:
                formData.photos.length >= 3
                  ? isDark
                    ? "rgba(255,255,255,0.03)"
                    : "rgba(226,232,240,0.3)"
                  : "#38bdf8",
              color:
                formData.photos.length >= 3
                  ? isDark
                    ? "#64748b"
                    : "#94a3b8"
                  : "#fff",
              cursor:
                formData.photos.length >= 3 ? "not-allowed" : "pointer",
            }}
          >
            <Icon name="camera" size="md" />
            <span>Capturar foto</span>
          </button>

          {formData.photos.length > 0 && (
            <div style={photosGrid}>
              {formData.photos.map((photo, idx) => (
                <div key={idx} style={photoThumbnail}>
                  <img
                    src={photo.preview}
                    alt={`foto-${idx}`}
                    style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 8 }}
                  />
                  <button
                    type="button"
                    onClick={() => handleRemovePhoto(idx)}
                    style={photoRemove}
                  >
                    <Icon name="x" size="sm" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </fieldset>

        {/* Error */}
        {error && (
          <div
            style={{
              ...errorAlert,
              background: isDark ? "rgba(127,29,29,0.15)" : "#fee2e2",
              borderColor: isDark ? "rgba(239,68,68,0.3)" : "#fecaca",
              color: isDark ? "#fca5a5" : "#991b1b",
            }}
          >
            <Icon name="alertCircle" size="sm" />
            {error}
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={submitting || loading}
          style={{
            ...submitButton,
            background: submitting ? "#94a3b8" : "#38bdf8",
            opacity: submitting || loading ? 0.6 : 1,
            minHeight: 48,
          }}
        >
          {submitting ? "Enviando..." : "Reportar Falla"}
        </button>
      </form>
    </div>
  );
}

const container = {
  display: "flex",
  justifyContent: "center",
  padding: 12,
};

const form = {
  width: "100%",
  maxWidth: 450,
  display: "flex",
  flexDirection: "column",
  gap: 16,
};

const fieldset = {
  display: "flex",
  flexDirection: "column",
  gap: 8,
  border: "none",
  margin: 0,
  padding: 0,
};

const label = {
  fontSize: 13,
  fontWeight: 950,
  color: "#0f172a",
  letterSpacing: ".04em",
  textTransform: "uppercase",
};

const input = {
  padding: "12px 14px",
  borderRadius: 10,
  border: "1px solid rgba(226,232,240,0.95)",
  fontSize: 14,
  fontWeight: 800,
  outline: "none",
  transition: "all 140ms ease",
};

const textarea = {
  ...input,
  fontFamily: "inherit",
  resize: "vertical",
};

const priorityGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(80px, 1fr))",
  gap: 8,
};

const priorityButton = {
  padding: "10px 12px",
  borderRadius: 10,
  border: "1px solid rgba(226,232,240,0.95)",
  background: "rgba(248,250,252,0.8)",
  cursor: "pointer",
  fontWeight: 900,
  fontSize: 12,
  transition: "all 140ms ease",
};

const photoButton = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
  padding: "12px 16px",
  borderRadius: 10,
  border: "1px solid rgba(56,189,248,0.4)",
  background: "#38bdf8",
  color: "#fff",
  cursor: "pointer",
  fontWeight: 950,
  fontSize: 13,
  transition: "all 140ms ease",
  minHeight: 48,
};

const photosGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(80px, 1fr))",
  gap: 8,
};

const photoThumbnail = {
  position: "relative",
  width: "100%",
  paddingBottom: "100%",
  borderRadius: 10,
  overflow: "hidden",
  border: "1px solid rgba(226,232,240,0.95)",
};

const photoRemove = {
  position: "absolute",
  top: 4,
  right: 4,
  width: 24,
  height: 24,
  borderRadius: 6,
  background: "rgba(0,0,0,0.6)",
  color: "#fff",
  border: "none",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  transition: "all 140ms ease",
};

const errorAlert = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  padding: 12,
  borderRadius: 10,
  border: "1px solid #fecaca",
  background: "#fee2e2",
  color: "#991b1b",
  fontWeight: 850,
  fontSize: 13,
};

const submitButton = {
  padding: "12px 16px",
  borderRadius: 10,
  border: "none",
  background: "#38bdf8",
  color: "#fff",
  cursor: "pointer",
  fontWeight: 950,
  fontSize: 14,
  transition: "all 140ms ease",
};

const assetDropdown = {
  position: "absolute",
  top: "100%",
  left: 0,
  right: 0,
  marginTop: 4,
  background: "#fff",
  borderRadius: 10,
  border: "1px solid rgba(226,232,240,0.95)",
  boxShadow: "0 12px 28px rgba(2,6,23,0.12)",
  maxHeight: 200,
  overflowY: "auto",
  zIndex: 100,
};

const assetOption = {
  width: "100%",
  padding: "12px 14px",
  border: "none",
  background: "#f8fafc",
  color: "#0f172a",
  textAlign: "left",
  cursor: "pointer",
  fontWeight: 850,
  fontSize: 13,
  borderBottom: "1px solid rgba(226,232,240,0.7)",
  transition: "background 140ms ease",
};
