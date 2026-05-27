import express from 'express';
import controller from './controller.js';

const router = express.Router();

router.get('/', async (req, res) => {
  const tasks = await controller.getAllTasks();
  res.json(tasks);
});

router.post('/', async (req, res) => {
  const { title, description } = req.body;

  if (!title) {
    return res.status(400).json({ error: 'Title is required' });
  }

  const newTask = await controller.createTask(title, description);
  res.status(201).json(newTask);
});

router.get('/:id', async (req, res) => {
  const task = await controller.getTaskById(req.params.id);

  if (!task) {
    return res.status(404).json({ error: 'Task not found' });
  }

  res.json(task);
});

router.put('/:id', async (req, res) => {
  const { title, description } = req.body;
  const task = await controller.updateTask(req.params.id, title, description);

  if (!task) {
    return res.status(404).json({ error: 'Task not found' });
  }

  res.json(task);
});

router.delete('/:id', async (req, res) => {
  const deleted = await controller.deleteTask(req.params.id);

  if (!deleted) {
    return res.status(404).json({ error: 'Task not found' });
  }

  res.status(204).send();
});

export default router;