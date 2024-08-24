
import { Server } from 'ws';
import WebSocket from 'ws';
import { parse } from 'url';

export const config = {
  api: {
    bodyParser: false,
  },
};

let userSocket = null;
let adminSocket = null;

export default function handler(req, res) {
  if (typeof window === 'undefined') {
    const { query } = parse(req.url, true);

    if (req.method === 'GET') {
      // handle GET request
    } else if (req.method === 'POST') {
      // handle POST request
    } else {
      res.status(405).end(); // Method Not Allowed
    }
  }

  const wss = new Server({ noServer: true });

  wss.on('connection', (ws, req) => {
    console.log('New client connected.');

    ws.on('message', (message) => {
      try {
        const parsedMessage = JSON.parse(message);
        if (parsedMessage.role === 'user') {
          userSocket = ws;
          console.log('User connected.');
        } else if (parsedMessage.role === 'admin') {
          adminSocket = ws;
          console.log('Admin connected.');
        }
      } catch (error) {
        console.log('Received non-JSON message:', message);
      }

      // ส่งข้อมูลจาก User ไปยัง Admin
      if (userSocket && adminSocket && ws === userSocket) {
        adminSocket.send(message);
      }
    });

    ws.on('close', () => {
      console.log('Client disconnected.');
      if (ws === userSocket) {
        userSocket = null;
        console.log('User disconnected.');
      } else if (ws === adminSocket) {
        adminSocket = null;
        console.log('Admin disconnected.');
      }
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
    });
  });

  // นำ HTTP server ที่สร้างขึ้นมาเพื่อใช้กับ WebSocket server
  if (!res.socket.server.wss) {
    res.socket.server.wss = wss;
    console.log('WebSocket server attached to HTTP server.');
  }

  res.end();
}

export function startWebSocketServer(server) {
  const wss = server.wss;

  server.on('upgrade', (request, socket, head) => {
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit('connection', ws, request);
    });
  });
}
