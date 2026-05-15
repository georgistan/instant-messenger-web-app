import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { createHash } from 'crypto';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadsDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, unique + path.extname(file.originalname));
  }
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

const JWT_SECRET = process.env.JWT_SECRET!;

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(uploadsDir));

app.post('/api/upload', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  const fileUrl = `/uploads/${req.file.filename}`;
  const fileType = req.file.mimetype.startsWith('image/') ? 'image' : 'file';
  res.json({ fileUrl, fileName: req.file.originalname, fileType });
});

app.get('/api/channels', async (_req, res) => {
  try {
    const channels = await prisma.channel.findMany({ orderBy: { createdAt: 'asc' } });
    res.json(channels);
  } catch {
    res.status(500).json({ error: 'Failed to fetch channels' });
  }
});

app.get('/api/channels/:name/messages', async (req, res) => {
  try {
    const messages = await prisma.message.findMany({
      where: { channel: { name: req.params.name } },
      include: { sender: true },
      orderBy: { createdAt: 'asc' }
    });
    const formatted = messages.map(m => ({
      id: m.id,
      senderId: m.senderId,
      senderName: m.sender.username,
      senderAvatar: m.sender.avatar,
      text: m.text,
      fileUrl: m.fileUrl,
      fileName: m.fileName,
      fileType: m.fileType,
      timestamp: m.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isOwnMessage: false
    }));
    res.json(formatted);
  } catch {
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

app.delete('/api/messages/:messageId', async (req, res) => {
  const { messageId } = req.params;
  const { senderId } = req.body;
  if (!senderId) return res.status(400).json({ error: 'senderId required' });
  try {
    const message = await prisma.message.findUnique({ where: { id: messageId } });
    if (!message) return res.status(404).json({ error: 'Message not found' });
    if (message.senderId !== senderId) return res.status(403).json({ error: 'Forbidden' });
    await prisma.message.delete({ where: { id: messageId } });
    io.to(message.channelId).emit('message_deleted', { messageId });
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: 'Failed to delete message' });
  }
});

app.post('/api/auth/register', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Username and password are required' });
  if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });

  const passwordKey = createHash('sha256').update(password).digest('hex');
  try {
    const existingUser = await prisma.user.findUnique({ where: { username } });
    if (existingUser) return res.status(409).json({ error: 'Username already taken' });

    const existingPassword = await prisma.user.findUnique({ where: { passwordKey } });
    if (existingPassword) return res.status(409).json({ error: 'This password is already used by another account' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({ data: { username, password: hashedPassword, passwordKey } });
    const token = jwt.sign({ userId: user.id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ id: user.id, username: user.username, avatar: user.avatar, token });
  } catch {
    res.status(500).json({ error: 'Registration failed' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Username and password are required' });
  try {
    const user = await prisma.user.findUnique({ where: { username } });
    if (!user) return res.status(401).json({ error: 'Invalid username or password' });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: 'Invalid username or password' });

    const token = jwt.sign({ userId: user.id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ id: user.id, username: user.username, avatar: user.avatar, token });
  } catch {
    res.status(500).json({ error: 'Login failed' });
  }
});

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join_channel', (channelId) => {
    Array.from(socket.rooms).forEach(room => {
      if (room !== socket.id) socket.leave(room);
    });
    socket.join(channelId);
  });

  socket.on('send_message', async (data) => {
    const { channelId, senderId, text, fileUrl, fileName, fileType } = data;
    try {
      const message = await prisma.message.create({
        data: { channelId, senderId, text, fileUrl, fileName, fileType },
        include: { sender: true }
      });
      const formatted = {
        id: message.id,
        senderId: message.senderId,
        senderName: message.sender.username,
        senderAvatar: message.sender.avatar,
        text: message.text,
        fileUrl: message.fileUrl,
        fileName: message.fileName,
        fileType: message.fileType,
        timestamp: message.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      io.to(channelId).emit('receive_message', formatted);
    } catch (error) {
      console.error('Error saving message:', error);
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
