import { useEffect, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { Review } from '@/types';

let socket: Socket | null = null;

export function useReviewSocket(
  repoFullName: string | null,
  onReviewCompleted: (review: Partial<Review>) => void,
  onReviewStarted: (data: { prNumber: number }) => void,
) {
  const connect = useCallback(() => {
    if (!repoFullName) return;

    socket = io(process.env.NEXT_PUBLIC_WS_URL!, {
      withCredentials: true,
    });

    socket.on('connect', () => {
      console.log('Socket connected:', socket?.id);
      socket?.emit('join-repo-room', repoFullName);
    });

    socket.on('review-completed', (data: Partial<Review>) => {
      onReviewCompleted(data);
    });

    socket.on('review-started', (data: { prNumber: number }) => {
      onReviewStarted(data);
    });

    socket.on('disconnect', () => {
      console.log('Socket disconnected');
    });
  }, [repoFullName, onReviewCompleted, onReviewStarted]);

  useEffect(() => {
    connect();

    return () => {
      if (socket) {
        socket.emit('leave-repo-room', repoFullName);
        socket.disconnect();
        socket = null;
      }
    };
  }, [connect, repoFullName]);

  return { socket };
}