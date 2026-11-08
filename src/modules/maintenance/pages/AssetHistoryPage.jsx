import { useParams, useNavigate } from "react-router-dom";
import AssetHistory from "../components/AssetHistory";
import { ChevronLeft } from "lucide-react";

export default function AssetHistoryPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  return (
    <div className="space-y-4">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-blue-500 hover:text-blue-700 font-bold"
      >
        <ChevronLeft size={20} />
        Volver
      </button>

      <AssetHistory assetId={parseInt(id)} days={90} />
    </div>
  );
}
