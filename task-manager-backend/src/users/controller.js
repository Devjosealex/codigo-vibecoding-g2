import prisma from '../lib/prisma.js';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

const register = async (name, lastname, email, password) => {
  const existingUser = await prisma.user.findUnique({
    where: { email }
  });

  if (existingUser) {
    throw new Error('Email already registered');
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      name,
      lastname,
      email,
      password: hashedPassword
    }
  });

  return {
    id: user.id,
    name: user.name,
    lastname: user.lastname,
    email: user.email
  };
};

const login = async (email, password) => {
  const user = await prisma.user.findUnique({
    where: { email }
  });

  if (!user) {
    throw new Error('Invalid credentials');
  }

  const validPassword = await bcrypt.compare(password, user.password);

  if (!validPassword) {
    throw new Error('Invalid credentials');
  }

  const token = uuidv4();

  return {
    id: user.id,
    name: user.name,
    lastname: user.lastname,
    email: user.email,
    token
  };
};

export default {
  register,
  login
};