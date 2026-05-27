import { type Task, type TaskFormData } from '../types/Task';

const API_BASE = 'http://localhost:3000';

export const taskService = {
  async getAll(): Promise<Task[]> {
    const res = await fetch(`${API_BASE}/task`);
    if (!res.ok) throw new Error('Failed to fetch tasks');
    return res.json();
  },

  async getById(id: string): Promise<Task> {
    const res = await fetch(`${API_BASE}/task/${id}`);
    if (!res.ok) throw new Error('Failed to fetch task');
    return res.json();
  },

  async create(data: TaskFormData): Promise<Task> {
    const res = await fetch(`${API_BASE}/task`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create task');
    return res.json();
  },

  async update(id: string, data: Partial<TaskFormData>): Promise<Task> {
    const res = await fetch(`${API_BASE}/task/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update task');
    return res.json();
  },

  async delete(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/task/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete task');
  },
};