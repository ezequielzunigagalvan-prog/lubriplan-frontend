import { useState, useEffect } from 'react';
import { maintenanceApi } from '../services/maintenanceApi';
import { MtCard, MtBadge } from '../ui';
import { Check, X, Camera, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';

export default function PreventiveChecklist({ workOrderId, onTaskUpdate }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedTask, setExpandedTask] = useState(null);
  const [comments, setComments] = useState({});

  useEffect(() => {
    loadTasks();
  }, [workOrderId]);

  const loadTasks = async () => {
    try {
      setLoading(true);
      let tasksData;
      try {
        const preventiveOrder = await maintenanceApi.getPreventiveOrder(workOrderId);
        tasksData = preventiveOrder?.checklistItems || null;
      } catch (apiError) {
        console.warn('API unavailable, using fallback data:', apiError);
        tasksData = null;
      }

      const mockTasks = [
        {
          id: 1,
          title: 'Inspeccionar sello mecánico',
          description: 'Verificar estado físico y desgaste',
          completed: false,
          completedAt: null,
          completedBy: null,
          photos: [],
          comments: [],
        },
        {
          id: 2,
          title: 'Revisar alineación de ejes',
          description: 'Medir desalineación con reloj comparador',
          completed: false,
          completedAt: null,
          completedBy: null,
          photos: [],
          comments: [],
        },
        {
          id: 3,
          title: 'Cambio de aceite',
          description: 'Drenar aceite viejo y cargar nuevo ISO 68',
          completed: false,
          completedAt: null,
          completedBy: null,
          photos: [],
          comments: [],
        },
        {
          id: 4,
          title: 'Inspeccionar tuberías',
          description: 'Buscar fugas, corrosión o daños',
          completed: false,
          completedAt: null,
          completedBy: null,
          photos: [],
          comments: [],
        },
      ];
      setTasks(tasksData || mockTasks);
    } catch (error) {
      toast.error('Error cargando tareas: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleTaskToggle = async (taskId) => {
    try {
      const updatedTasks = tasks.map((task) =>
        task.id === taskId
          ? {
              ...task,
              completed: !task.completed,
              completedAt: !task.completed ? new Date().toISOString() : null,
              completedBy: !task.completed ? 'Técnico 1' : null,
            }
          : task
      );
      setTasks(updatedTasks);
      onTaskUpdate?.(updatedTasks);
      toast.success(updatedTasks.find((t) => t.id === taskId).completed ? 'Tarea completada' : 'Tarea marcada como incompleta');
    } catch (error) {
      toast.error('Error actualizando tarea');
    }
  };

  const handleAddComment = (taskId, comment) => {
    if (!comment.trim()) return;

    const updatedTasks = tasks.map((task) =>
      task.id === taskId
        ? {
            ...task,
            comments: [
              ...task.comments,
              {
                id: Date.now(),
                text: comment,
                author: 'Técnico 1',
                createdAt: new Date().toISOString(),
              },
            ],
          }
        : task
    );
    setTasks(updatedTasks);
    setComments({ ...comments, [taskId]: '' });
    toast.success('Comentario agregado');
  };

  if (loading) {
    return (
      <MtCard elevated>
        <div style={{ padding: 'var(--mt-space-3xl)', textAlign: 'center' }}>
          <div style={{ fontSize: '32px', marginBottom: 'var(--mt-space-md)', animation: 'spin 1s linear infinite' }}>⚙️</div>
          <p style={{ color: 'var(--mt-text-secondary)', margin: 0 }}>Cargando tareas...</p>
        </div>
      </MtCard>
    );
  }

  const completedCount = tasks.filter((t) => t.completed).length;
  const completionPercentage = Math.round((completedCount / tasks.length) * 100);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--mt-space-lg)' }}>
      {/* Progress Bar */}
      <MtCard elevated>
        <div style={{ padding: 'var(--mt-space-lg)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--mt-space-md)' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 'var(--mt-font-weight-bold)', margin: 0 }}>
              Progreso del Checklist
            </h3>
            <MtBadge
              label={`${completedCount}/${tasks.length} completadas`}
              variant={completionPercentage === 100 ? 'success' : completionPercentage > 50 ? 'info' : 'warning'}
              size="sm"
            />
          </div>
          <div style={{ width: '100%', height: '8px', background: 'var(--mt-bg-surface-2)', borderRadius: 'var(--mt-radius-full)', overflow: 'hidden' }}>
            <div
              style={{
                height: '100%',
                background: 'linear-gradient(90deg, var(--mt-accent), var(--mt-accent-strong))',
                width: `${completionPercentage}%`,
                transition: 'width 300ms ease',
              }}
            ></div>
          </div>
        </div>
      </MtCard>

      {/* Tasks List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--mt-space-md)' }}>
        {tasks.map((task) => (
          <MtCard
            key={task.id}
            elevated
            style={{
              borderLeft: task.completed ? '4px solid var(--mt-success)' : '4px solid var(--mt-text-tertiary)',
              cursor: 'pointer',
              transition: 'all 200ms ease',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                gap: 'var(--mt-space-lg)',
                padding: 'var(--mt-space-lg)',
              }}
            >
              {/* Checkbox + Task Info */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--mt-space-md)', flex: 1 }}>
                <button
                  onClick={() => handleTaskToggle(task.id)}
                  style={{
                    width: '32px',
                    height: '32px',
                    minWidth: '32px',
                    borderRadius: 'var(--mt-radius-md)',
                    border: '2px solid var(--mt-border)',
                    background: task.completed ? 'var(--mt-success)' : 'transparent',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: task.completed ? '#fff' : 'transparent',
                    transition: 'all 200ms ease',
                  }}
                >
                  {task.completed && <Check size={16} />}
                </button>

                <div style={{ flex: 1 }}>
                  <h4
                    style={{
                      fontSize: '15px',
                      fontWeight: 'var(--mt-font-weight-bold)',
                      margin: 0,
                      marginBottom: 'var(--mt-space-xs)',
                      textDecoration: task.completed ? 'line-through' : 'none',
                      color: task.completed ? 'var(--mt-text-tertiary)' : 'var(--mt-text-primary)',
                    }}
                  >
                    {task.title}
                  </h4>
                  <p
                    style={{
                      fontSize: '13px',
                      color: 'var(--mt-text-secondary)',
                      margin: 0,
                      marginBottom: 'var(--mt-space-sm)',
                    }}
                  >
                    {task.description}
                  </p>

                  {task.completed && (
                    <div style={{ fontSize: '12px', color: 'var(--mt-success)', fontWeight: 'var(--mt-font-weight-bold)' }}>
                      ✓ Completada {task.completedAt && `el ${new Date(task.completedAt).toLocaleDateString('es-ES')}`}
                    </div>
                  )}
                </div>
              </div>

              {/* Expand Button */}
              <button
                onClick={() => setExpandedTask(expandedTask === task.id ? null : task.id)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '20px',
                  color: 'var(--mt-text-secondary)',
                  padding: 0,
                }}
              >
                {expandedTask === task.id ? '▼' : '▶'}
              </button>
            </div>

            {/* Expanded Content */}
            {expandedTask === task.id && (
              <div style={{ padding: '0 var(--mt-space-lg) var(--mt-space-lg)', borderTop: '1px solid var(--mt-border)', paddingTop: 'var(--mt-space-lg)' }}>
                {/* Photos Section */}
                <div style={{ marginBottom: 'var(--mt-space-lg)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--mt-space-md)', marginBottom: 'var(--mt-space-md)' }}>
                    <Camera size={18} style={{ color: 'var(--mt-accent)' }} />
                    <h5 style={{ fontSize: '13px', fontWeight: 'var(--mt-font-weight-bold)', margin: 0 }}>
                      Evidencia Fotográfica ({task.photos.length})
                    </h5>
                  </div>
                  <button
                    style={{
                      width: '100%',
                      padding: 'var(--mt-space-lg)',
                      border: '2px dashed var(--mt-border)',
                      borderRadius: 'var(--mt-radius-md)',
                      background: 'transparent',
                      cursor: 'pointer',
                      color: 'var(--mt-accent)',
                      fontWeight: 'var(--mt-font-weight-bold)',
                      transition: 'all 200ms ease',
                    }}
                  >
                    + Cargar foto
                  </button>
                </div>

                {/* Comments Section */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--mt-space-md)', marginBottom: 'var(--mt-space-md)' }}>
                    <MessageSquare size={18} style={{ color: 'var(--mt-accent)' }} />
                    <h5 style={{ fontSize: '13px', fontWeight: 'var(--mt-font-weight-bold)', margin: 0 }}>
                      Comentarios ({task.comments.length})
                    </h5>
                  </div>

                  {/* Existing Comments */}
                  {task.comments.length > 0 && (
                    <div style={{ marginBottom: 'var(--mt-space-md)', display: 'flex', flexDirection: 'column', gap: 'var(--mt-space-sm)' }}>
                      {task.comments.map((comment) => (
                        <div
                          key={comment.id}
                          style={{
                            padding: 'var(--mt-space-md)',
                            background: 'var(--mt-bg-surface-2)',
                            borderRadius: 'var(--mt-radius-sm)',
                            fontSize: '13px',
                          }}
                        >
                          <div style={{ fontWeight: 'var(--mt-font-weight-bold)', marginBottom: '4px', color: 'var(--mt-text-primary)' }}>
                            {comment.author}
                          </div>
                          <div style={{ color: 'var(--mt-text-secondary)' }}>{comment.text}</div>
                          <div style={{ fontSize: '11px', color: 'var(--mt-text-tertiary)', marginTop: '4px' }}>
                            {new Date(comment.createdAt).toLocaleDateString('es-ES')}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add Comment */}
                  <div style={{ display: 'flex', gap: 'var(--mt-space-sm)' }}>
                    <input
                      type="text"
                      placeholder="Agregar comentario..."
                      value={comments[task.id] || ''}
                      onChange={(e) => setComments({ ...comments, [task.id]: e.target.value })}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleAddComment(task.id, comments[task.id]);
                        }
                      }}
                      style={{
                        flex: 1,
                        padding: 'var(--mt-space-md)',
                        border: '1px solid var(--mt-border)',
                        borderRadius: 'var(--mt-radius-md)',
                        background: 'var(--mt-bg-base)',
                        color: 'var(--mt-text-primary)',
                        fontSize: '13px',
                      }}
                    />
                    <button
                      onClick={() => handleAddComment(task.id, comments[task.id])}
                      style={{
                        padding: 'var(--mt-space-md) var(--mt-space-lg)',
                        background: 'var(--mt-accent)',
                        color: '#fff',
                        border: 'none',
                        borderRadius: 'var(--mt-radius-md)',
                        cursor: 'pointer',
                        fontWeight: 'var(--mt-font-weight-bold)',
                        fontSize: '13px',
                        transition: 'background 200ms ease',
                      }}
                    >
                      Guardar
                    </button>
                  </div>
                </div>
              </div>
            )}
          </MtCard>
        ))}
      </div>

      {/* Completion Message */}
      {completionPercentage === 100 && (
        <MtCard elevated style={{ background: 'rgba(52, 211, 153, 0.1)', border: '2px solid var(--mt-success)' }}>
          <div style={{ padding: 'var(--mt-space-lg)', textAlign: 'center' }}>
            <div style={{ fontSize: '28px', marginBottom: 'var(--mt-space-md)' }}>✅</div>
            <h3 style={{ fontSize: '16px', fontWeight: 'var(--mt-font-weight-bold)', margin: 0, marginBottom: 'var(--mt-space-xs)', color: 'var(--mt-success)' }}>
              ¡Checklist Completado!
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--mt-text-secondary)', margin: 0 }}>
              Todas las tareas han sido completadas. Puedes proceder a validar la orden.
            </p>
          </div>
        </MtCard>
      )}
    </div>
  );
}
