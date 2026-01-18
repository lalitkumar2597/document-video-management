import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import { configs } from '../config/env';

export class SocketService {
  private io: SocketIOServer;
  private connectedClients: Map<string, Socket> = new Map();

  constructor(server: HttpServer) {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: configs.SOCKET_CORS_ORIGIN,
        methods: ['GET', 'POST'],
        credentials: true,
      },
      transports: ['websocket', 'polling'],
    });

    this.setupSocketEvents();
  }

  private setupSocketEvents(): void {
    this.io.on('connection', (socket: Socket) => {
      console.log('Client connected:', socket.id);
      this.connectedClients.set(socket.id, socket);

      // Handle file upload progress
      socket.on('upload-progress', (data: { fileId: string; progress: number }) => {
        socket.broadcast.emit('upload-progress-update', data);
      });

      // Handle file processing status
      socket.on('file-processing', (data: { fileId: string; status: string }) => {
        socket.broadcast.emit('file-processing-update', data);
      });

      // Handle disconnect
      socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
        this.connectedClients.delete(socket.id);
      });

      // Handle errors
      socket.on('error', (error) => {
        console.error('Socket error:', error);
      });
    });
  }

  emitToRoom(room: string, event: string, data: any): void {
    this.io.to(room).emit(event, data);
  }

  emitToClient(clientId: string, event: string, data: any): void {
    const client = this.connectedClients.get(clientId);
    if (client) {
      client.emit(event, data);
    }
  }

  broadcastUploadProgress(fileId: string, progress: number): void {
    this.io.emit('upload-progress-update', { fileId, progress });
  }

  broadcastFileProcessing(fileId: string, status: string): void {
    this.io.emit('file-processing-update', { fileId, status });
  }
}

export let socketService: SocketService;

export const initializeSocket = (server: HttpServer): SocketService => {
  socketService = new SocketService(server);
  return socketService;
};