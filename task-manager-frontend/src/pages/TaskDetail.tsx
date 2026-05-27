import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { type Task } from '../types/Task';
import { taskService } from '../services/api';

export function TaskDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ title: '', description: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadTask = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const data = await taskService.getById(id);
        setTask(data);
        setFormData({ title: data.title, description: data.description });
        setError(null);
      } catch {
        setError('Error al cargar la tarea');
      } finally {
        setLoading(false);
      }
    };
    loadTask();
  }, [id]);

  const handleToggle = async () => {
    if (!task) return;
    try {
      await taskService.update(task.id, { completed: !task.completed });
      setTask({ ...task, completed: !task.completed });
    } catch (err) {
      console.error('Error actualizando');
    }
  };

  const handleDelete = async () => {
    if (!task || !confirm('¿Eliminar esta tarea?')) return;
    try {
      await taskService.delete(task.id);
      navigate('/');
    } catch (err) {
      console.error('Error eliminando');
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!task || !formData.title.trim()) return;
    setSaving(true);
    try {
      const updated = await taskService.update(task.id, formData);
      setTask(updated);
      setShowModal(false);
    } catch (err) {
      console.error('Error guardando');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="spinner" />
      </div>
    );
  }

  if (error || !task) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', padding: 24 }}>
          <div style={{ width: 64, height: 64, margin: '0 auto 16px', background: '#fee2e2', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="32" height="32" fill="none" stroke="#ef4444" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <p style={{ color: '#ef4444', fontWeight: 600, marginBottom: 16 }}>{error || 'Tarea no encontrada'}</p>
          <Link to="/" className="btn btn-primary">Volver</Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', padding: '24px 16px' }}>
      {/* Header */}
      <header style={{ maxWidth: 600, margin: '0 auto 24px' }}>
        <button onClick={() => navigate('/')} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', padding: '8px 0' }}>
          <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Volver
        </button>
      </header>

      {/* Task Card */}
      <div style={{ maxWidth: 600, margin: '0 auto' }}>
        <div className="task-card animate-fade" style={{ overflow: 'hidden' }}>
          {/* Status Bar */}
          <div style={{ padding: '12px 20px', background: task.completed ? '#d1fae5' : '#fef3c7', borderBottom: `1px solid ${task.completed ? '#a7f3d0' : '#fde68a'}` }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <button
                onClick={handleToggle}
                className={`badge ${task.completed ? 'badge-completed' : 'badge-pending'}`}
                style={{ cursor: 'pointer', border: 'none' }}
              >
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: task.completed ? '#10b981' : '#f59e0b' }} />
                {task.completed ? 'Completada' : 'Pendiente'}
              </button>
              <span style={{ fontSize: 12, color: '#6b7280' }}>ID: {task.id.slice(0, 8)}</span>
            </div>
          </div>

          {/* Content */}
          <div style={{ padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 24 }}>
              <button
                onClick={handleToggle}
                className={`checkbox-custom ${task.completed ? 'checkbox-checked' : ''}`}
                style={{ width: 28, height: 28 }}
              >
                {task.completed && (
                  <svg width="16" height="16" fill="none" stroke="white" strokeWidth={3} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
              <div style={{ flex: 1 }}>
                <h1 style={{ fontSize: 22, fontWeight: 700, color: task.completed ? '#9ca3af' : '#111827', textDecoration: task.completed ? 'line-through' : 'none', marginBottom: 12 }}>
                  {task.title}
                </h1>
                {task.description ? (
                  <p style={{ fontSize: 15, color: task.completed ? '#9ca3af' : '#4b5563', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                    {task.description}
                  </p>
                ) : (
                  <p style={{ fontSize: 15, color: '#9ca3af', fontStyle: 'italic' }}>Sin descripción</p>
                )}
              </div>
            </div>

            {/* Meta */}
            <div style={{ paddingTop: 20, borderTop: '1px solid #e5e7eb', display: 'flex', flexWrap: 'wrap', gap: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: '#6b7280' }}>
                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span>Creada: {new Date(task.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div style={{ padding: '16px 20px', background: '#f9fafb', borderTop: '1px solid #e5e7eb', display: 'flex', flexWrap: 'wrap', gap: 12 }}>
            <button className="btn btn-secondary" onClick={() => setShowModal(true)}>
              <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Editar
            </button>
            <button className="btn btn-secondary" onClick={handleToggle}>
              <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {task.completed ? 'Marcar pendiente' : 'Completar'}
            </button>
            <button className="btn btn-danger" onClick={handleDelete}>
              <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Eliminar
            </button>
          </div>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content animate-scale" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 style={{ fontSize: 20, fontWeight: 600 }}>Editar Tarea</h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 8 }}>
                <svg width="20" height="20" fill="none" stroke="#6b7280" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleUpdate}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 14, fontWeight: 500, marginBottom: 8 }}>Título *</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="¿Qué necesitas hacer?"
                    value={formData.title}
                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 14, fontWeight: 500, marginBottom: 8 }}>Descripción</label>
                  <textarea
                    className="input-field"
                    placeholder="Añade más detalles..."
                    rows={4}
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    style={{ resize: 'none' }}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary" disabled={saving || !formData.title.trim()}>
                  {saving ? 'Guardando...' : 'Actualizar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}