import { useNavigate, useParams } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";
import CompleteExecutionModal from "./CompleteExecutionModal";

export default function ActivityCompletePage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const executionId = Number(id);

  if (!Number.isFinite(executionId)) {
    return (
      <MainLayout>
        <p>ID de actividad inválido</p>
        <button onClick={() => navigate("/activities")}>Volver</button>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <CompleteExecutionModal
        open={true}
        executionId={executionId}
        onClose={() => navigate("/activities")}
        onSaved={() => navigate("/activities")}
      />
    </MainLayout>
  );
}