import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import dotenv from 'dotenv';

dotenv.config();

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

app.get('/api/channels', async (_req, res) => {
  try {
    const channels = await prisma.channel.findMany({
      orderBy: { createdAt: 'asc' }
    });
    res.json(channels);
  } catch (error) {
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
      timestamp: m.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isOwnMessage: false
    }));
    
    res.json(formatted);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

app.post('/api/users', async (req, res) => {
  const { username } = req.body;
  if (!username) return res.status(400).json({ error: 'Username required' });
  
  try {
    const user = await prisma.user.upsert({
      where: { username },
      update: {},
      create: { username }
    });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Failed to login/register' });
  }
});

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join_channel', (channelId) => {
    Array.from(socket.rooms).forEach(room => {
      if (room !== socket.id) socket.leave(room);
    });
    socket.join(channelId);
    console.log(`Socket ${socket.id} joined channel ${channelId}`);
  });

  socket.on('send_message', async (data) => {
    const { channelId, senderId, text } = data;
    
    try {
      const message = await prisma.message.create({
        data: { channelId, senderId, text },
        include: { sender: true }
      });
      
      const formatted = {
        id: message.id,
        senderId: message.senderId,
        senderName: message.sender.username,
        senderAvatar: message.sender.avatar,
        text: message.text,
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
