import prisma from '../lib/prisma.js';

const getAllTasks = async () => {
  return await prisma.task.findMany();
};

const getTaskById = async (id) => {
  return await prisma.task.findUnique({
    where: { id: parseInt(id) }
  });
};

const createTask = async (title, description) => {
  return await prisma.task.create({
    data: {
      title,
      description: description || ''
    }
  });
};

const updateTask = async (id, title, description) => {
  const task = await prisma.task.findUnique({
    where: { id: parseInt(id) }
  });
  if (!task) return null;

  return await prisma.task.update({
    where: { id: parseInt(id) },
    data: {
      ...(title !== undefined && { title }),
      ...(description !== undefined && { description })
    }
  });
};

const deleteTask = async (id) => {
  const task = await prisma.task.findUnique({
    where: { id: parseInt(id) }
  });
  if (!task) return false;
  
  await prisma.task.delete({
    where: { id: parseInt(id) }
  });
  return true;
};

export default {
  getAllTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask
};