import {
    WebSocketGateway,
    WebSocketServer,
    SubscribeMessage,
    MessageBody,
    ConnectedSocket,
    OnGatewayConnection,
    OnGatewayDisconnect,
  } from '@nestjs/websockets';
  import { Server, Socket } from 'socket.io';
  import { Logger } from '@nestjs/common';
  import { ReviewCompletedDto } from '@app/shared';
  
  @WebSocketGateway({
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:3000',
      credentials: true,
    },
  })
  export class ReviewGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;
  
    private readonly logger = new Logger(ReviewGateway.name);
  
    handleConnection(client: Socket) {
      this.logger.log(`Client connected: ${client.id}`);
    }
  
    handleDisconnect(client: Socket) {
      this.logger.log(`Client disconnected: ${client.id}`);
    }
  
    @SubscribeMessage('join-repo-room')
    handleJoinRoom(
      @MessageBody() repoFullName: string,
      @ConnectedSocket() client: Socket,
    ) {
      client.join(repoFullName);
      this.logger.log(`Client ${client.id} joined room: ${repoFullName}`);
      return { joined: repoFullName };
    }
  
    @SubscribeMessage('leave-repo-room')
    handleLeaveRoom(
      @MessageBody() repoFullName: string,
      @ConnectedSocket() client: Socket,
    ) {
      client.leave(repoFullName);
      return { left: repoFullName };
    }
  
    emitReviewCompleted(dto: ReviewCompletedDto) {
      this.server.to(dto.repoFullName).emit('review-completed', dto);
      this.logger.log(
        `Emitted review-completed to room: ${dto.repoFullName}`,
      );
    }
  
    emitReviewStarted(repoFullName: string, prNumber: number) {
      this.server.to(repoFullName).emit('review-started', { prNumber });
    }
  }