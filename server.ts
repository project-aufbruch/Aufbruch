import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';

// In-memory persistent sync store across all connected clients / devices
const inMemorySyncStore = {
  events: [] as any[],
  messages: [] as any[],
  groups: [] as any[],
  announcements: [] as any[],
};

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));

  // 1. Health API
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: Date.now() });
  });

  // 2. Multi-device Feed Events Synchronization API
  app.get('/api/sync/events', (_req, res) => {
    res.json({
      events: inMemorySyncStore.events,
      count: inMemorySyncStore.events.length,
    });
  });

  app.post('/api/sync/events', (req, res) => {
    const { event } = req.body;
    if (event && event.id) {
      const exists = inMemorySyncStore.events.some((e) => e.id === event.id);
      if (!exists) {
        inMemorySyncStore.events.unshift(event);
        if (inMemorySyncStore.events.length > 500) {
          inMemorySyncStore.events.pop();
        }
      }
      res.json({ success: true, eventId: event.id });
    } else {
      res.status(400).json({ error: 'Invalid event payload' });
    }
  });

  app.post('/api/sync/events/delete', (req, res) => {
    const { eventIds } = req.body;
    if (Array.isArray(eventIds) && eventIds.length > 0) {
      const idSet = new Set(eventIds);
      inMemorySyncStore.events = inMemorySyncStore.events.filter((e) => !idSet.has(e.id));
      res.json({ success: true, deletedCount: eventIds.length });
    } else {
      res.status(400).json({ error: 'Invalid eventIds array' });
    }
  });

  // 3. Multi-device Private & Group Chats Synchronization API
  app.get('/api/sync/chats', (_req, res) => {
    res.json({
      messages: inMemorySyncStore.messages,
      groups: inMemorySyncStore.groups,
    });
  });

  app.post('/api/sync/chats', (req, res) => {
    const { type, payload } = req.body;
    if (type === 'message' && payload && payload.id) {
      const exists = inMemorySyncStore.messages.some((m) => m.id === payload.id);
      if (!exists) {
        inMemorySyncStore.messages.push(payload);
        if (inMemorySyncStore.messages.length > 1000) {
          inMemorySyncStore.messages.shift();
        }
      }
      res.json({ success: true });
    } else if (type === 'group' && payload && payload.id) {
      const idx = inMemorySyncStore.groups.findIndex((g) => g.id === payload.id);
      if (idx === -1) {
        inMemorySyncStore.groups.push(payload);
      } else {
        inMemorySyncStore.groups[idx] = payload;
      }
      res.json({ success: true });
    } else {
      res.status(400).json({ error: 'Invalid chat sync payload' });
    }
  });

  // 4. Admin System Announcements API
  app.get('/api/admin/announcements', (_req, res) => {
    res.json({
      announcements: inMemorySyncStore.announcements,
    });
  });

  app.post('/api/admin/announcements', (req, res) => {
    const { announcement } = req.body;
    if (announcement && announcement.id) {
      inMemorySyncStore.announcements.unshift(announcement);
      res.json({ success: true });
    } else {
      res.status(400).json({ error: 'Invalid announcement' });
    }
  });

  // 5. Admin Global Moderation / Purge API
  app.post('/api/admin/purge-event', (req, res) => {
    const { eventId, adminPasscode } = req.body;
    if (adminPasscode === 'admin2026' || adminPasscode === 'AufbruchAdmin' || adminPasscode === '1234') {
      inMemorySyncStore.events = inMemorySyncStore.events.filter((e) => e.id !== eventId);
      res.json({ success: true, message: `Event ${eventId} purged globally` });
    } else {
      res.status(403).json({ error: 'Unauthorized: Invalid Admin Master Key' });
    }
  });

  // 6. Vite Middleware setup
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`AUFBRUCH Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
