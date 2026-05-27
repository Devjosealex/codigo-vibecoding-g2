export interface Task {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  created_at: string;
}

export interface TaskFormData {
  title: string;
  description: string;
  completed?: boolean;
}