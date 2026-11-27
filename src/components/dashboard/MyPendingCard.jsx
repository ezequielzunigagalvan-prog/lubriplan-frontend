// Acceso rápido "Mis pendientes" (Plan de acción) para administradores y supervisores.
// Muestra mis pendientes abiertos en todas mis plantas: vencidos primero.
import { useNavigate } from "react-router-dom";
import { Icon } from "../ui/lpIcons";
import { usePlant } from "../../context/PlantContext";
import useMyPending from "../../hooks/useMyPending";
import { CATEGORY } from "../actionPlan/actionPlanUi";
import "./MyPendingCard.css";

const dueText = (i) =>
  i.overdue
    ? `Vencido hace ${Math.abs(i.daysLeft)} día${Math.abs(i.daysLeft) === 1 ? "" : "s"}`
    : i.daysLeft === 0
    ? "Vence hoy"
    : `Vence en ${i.daysLeft} día${i.daysLeft === 1 ? "" : "s"}`;

export default function MyPendingCard() {
  const navigate = useNavigate();
  const { currentPlantId, setPlant } = usePlant();
  const data = useMyPending();
  const multi = (data?.byPlant?.length || 0) > 1;

  const open = (item) => {
    const go = () => navigate(`/action-plan?scope=mine${item ? `&item=${item.id}` : ""}`);
    if (item && String(item.plantId) !== String(currentPlantId) && setPlant) {
      setPlant(item.plantId);
      setTimeout(go, 50);
    } else go();
  };

  return (
    <section className={`mpc ${data?.overdue ? "is-alert" : ""}`} aria-label="Mis pendientes">
      <header className="mpc-head">
        <div className="mpc-title">
          <span className="mpc-icon">
            <Icon name="doc" />
          </span>
          <div>
            <b>Mis pendientes</b>
            <small>Plan de acción{multi ? " · todas mis plantas" : ""}</small>
          </div>
        </div>
        <div className="mpc-stats">
          <span className={data?.overdue ? "is-red" : ""}>
            <b>{data ? data.overdue : "—"}</b> vencidos
          </span>
          <span className={data?.dueSoon ? "is-amber" : ""}>
            <b>{data ? data.dueSoon : "—"}</b> esta semana
          </span>
          <span>
            <b>{data ? data.total : "—"}</b> abiertos
          </span>
        </div>
        <button type="button" className="mpc-btn" onClick={() => open(null)}>
          Ver mis pendientes <Icon name="chevRight" size="sm" />
        </button>
      </header>

      {!data ? (
        <div className="mpc-empty">Cargando…</div>
      ) : !data.items?.length ? (
        <div className="mpc-empty">
          <Icon name="checkCircle" size="sm" /> {data.error ? "No se pudieron cargar tus pendientes." : "No tienes pendientes abiertos."}
        </div>
      ) : (
        <ul className="mpc-list">
          {data.items.map((i) => {
            const cat = CATEGORY[i.category] || { label: i.category, color: "#64748b", icon: "doc" };
            return (
              <li key={i.id}>
                <button type="button" className={`mpc-item ${i.overdue ? "is-overdue" : ""}`} onClick={() => open(i)} style={{ "--cat": cat.color }}>
                  <span className="mpc-item-main">
                    <b title={i.title}>{i.title}</b>
                    <small>
                      {cat.label}
                      {multi ? ` · ${i.plantName}` : ""}
                    </small>
                  </span>
                  <span className="mpc-item-side">
                    <span className={`mpc-due ${i.overdue ? "is-red" : i.daysLeft <= 2 ? "is-amber" : ""}`}>{dueText(i)}</span>
                    <span className="mpc-bar" aria-label={`Avance ${i.progress}%`}>
                      <span style={{ width: `${i.progress}%` }} />
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
