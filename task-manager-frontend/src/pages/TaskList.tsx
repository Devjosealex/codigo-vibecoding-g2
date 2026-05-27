import { useState, useEffect } from 'react';
import { type Task } from '../types/Task';
import { taskService } from '../services/api';

export function TaskList() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [formData, setFormData] = useState({ title: '', description: '' });
  const [saving, setSaving] = useState(false);

  const loadTasks = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('Fetching from http://localhost:3000/task...');
      const res = await fetch('http://localhost:3000/task');
      console.log('Response status:', res.status);
      if (!res.ok) {
        throw new Error(`Server error: ${res.status}`);
      }
      const data = await res.json();
      console.log('Tareas cargadas:', data);
      setTasks(data || []);
    } catch (err) {
      console.error('Error cargando tareas:', err);
      setError('No se puede conectar al backend. Asegúrate que esté corriendo en localhost:3000');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, []);

  const openCreate = () => {
    setFormData({ title: '', description: '' });
    setEditTask(null);
    setShowModal(true);
  };

  const openEdit = (task: Task) => {
    setFormData({ title: task.title, description: task.description });
    setEditTask(task);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;
    setSaving(true);
    try {
      if (editTask) {
        await taskService.update(editTask.id, formData);
      } else {
        await taskService.create(formData);
      }
      setShowModal(false);
      loadTasks();
    } catch (err) {
      console.error('Error guardando');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (task: Task) => {
    try {
      await taskService.update(task.id, { completed: !task.completed });
      setTasks(tasks.map(t => t.id === task.id ? { ...t, completed: !t.completed } : t));
    } catch (err) {
      console.error('Error actualizando');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar esta tarea?')) return;
    try {
      await taskService.delete(id);
      setTasks(tasks.filter(t => t.id !== id));
    } catch (err) {
      console.error('Error eliminando');
    }
  };

  const pendingTasks = tasks.filter(t => !t.completed);
  const completedTasks = tasks.filter(t => t.completed);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="spinner" />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ color: '#ef4444', marginBottom: 16 }}>{error}</p>
          <button className="btn btn-primary" onClick={loadTasks}>Reintentar</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', padding: '24px 16px' }}>
      {/* Header */}
      <header style={{ maxWidth: 600, margin: '0 auto 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: '#111827' }}>Mis Tareas</h1>
          <p style={{ color: '#6b7280', fontSize: 14 }}>{tasks.length} tarea{tasks.length !== 1 ? 's' : ''}</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>
          <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nuevo
        </button>
      </header>

      {/* Stats */}
      <div style={{ maxWidth: 600, margin: '0 auto 32px', display: 'flex', gap: 16 }}>
        <div style={{ flex: 1, padding: 16, background: 'white', borderRadius: 12, textAlign: 'center' }}>
          <p style={{ fontSize: 24, fontWeight: 700, color: '#6366f1' }}>{pendingTasks.length}</p>
          <p style={{ fontSize: 13, color: '#6b7280' }}>Pendientes</p>
        </div>
        <div style={{ flex: 1, padding: 16, background: 'white', borderRadius: 12, textAlign: 'center' }}>
          <p style={{ fontSize: 24, fontWeight: 700, color: '#10b981' }}>{completedTasks.length}</p>
          <p style={{ fontSize: 13, color: '#6b7280' }}>Completadas</p>
        </div>
      </div>

      {/* Tasks List */}
      <div style={{ maxWidth: 600, margin: '0 auto' }}>
        {tasks.length === 0 ? (
          <div className="task-card" style={{ padding: 48, textAlign: 'center' }}>
            <div style={{ width: 64, height: 64, margin: '0 auto 16px', background: '#f3f4f6', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="32" height="32" fill="none" stroke="#9ca3af" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>No hay tareas</h3>
            <p style={{ color: '#6b7280', marginBottom: 20 }}>Crea tu primera tarea para comenzar</p>
            <button className="btn btn-primary" onClick={openCreate}>Crear tarea</button>
          </div>
        ) : (
          <>
            {pendingTasks.length > 0 && (
              <div style={{ marginBottom: 24 }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: '#6b7280', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Pendientes ({pendingTasks.length})
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {pendingTasks.map((task, i) => (
                    <TaskCard key={task.id} task={task} onToggle={handleToggle} onEdit={openEdit} onDelete={handleDelete} index={i} />
                  ))}
                </div>
              </div>
            )}
            {completedTasks.length > 0 && (
              <div>
                <p style={{ fontSize: 13, fontWeight: 600, color: '#6b7280', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Completadas ({completedTasks.length})
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {completedTasks.map((task, i) => (
                    <TaskCard key={task.id} task={task} onToggle={handleToggle} onEdit={openEdit} onDelete={handleDelete} index={i} />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content animate-scale" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 style={{ fontSize: 20, fontWeight: 600 }}>{editTask ? 'Editar Tarea' : 'Nueva Tarea'}</h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 8 }}>
                <svg width="20" height="20" fill="none" stroke="#6b7280" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleSubmit}>
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
                    rows={3}
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    style={{ resize: 'none' }}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary" disabled={saving || !formData.title.trim()}>
                  {saving ? 'Guardando...' : editTask ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function TaskCard({ task, onToggle, onEdit, onDelete, index }: {
  task: Task;
  onToggle: (task: Task) => void;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  index: number;
}) {
  return (
    <div 
      className="task-card animate-slide" 
      style={{ padding: 16, display: 'flex', alignItems: 'flex-start', gap: 12, animationDelay: `${index * 0.05}s` }}
    >
      <button
        onClick={() => onToggle(task)}
        className={`checkbox-custom ${task.completed ? 'checkbox-checked' : ''}`}
      >
        {task.completed && (
          <svg width="14" height="14" fill="none" stroke="white" strokeWidth={3} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        )}
      </button>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, color: task.completed ? '#9ca3af' : '#111827', textDecoration: task.completed ? 'line-through' : 'none' }}>
            {task.title}
          </h3>
          <span className={`badge ${task.completed ? 'badge-completed' : 'badge-pending'}`}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: task.completed ? '#10b981' : '#f59e0b' }} />
            {task.completed ? 'Completada' : 'Pendiente'}
          </span>
        </div>
        {task.description && (
          <p style={{ fontSize: 14, color: task.completed ? '#9ca3af' : '#6b7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {task.description}
          </p>
        )}
        <p style={{ fontSize: 12, color: '#9ca3af', marginTop: 8 }}>
          {new Date(task.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
      <div style={{ display: 'flex', gap: 4 }}>
        <button onClick={() => onEdit(task)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 8, borderRadius: 8, color: '#6b7280' }}>
          <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </button>
        <button onClick={() => onDelete(task.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 8, borderRadius: 8, color: '#6b7280' }}>
          <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </div>
  );
}