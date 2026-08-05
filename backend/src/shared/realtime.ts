type RoomEmitter = {
  emit(event: string, payload: unknown): void;
};

export type RealtimeServer = {
  to(room: string): RoomEmitter;
};

let io: RealtimeServer | null = null;
export function setRealtimeServer(server: RealtimeServer) {
  io = server;
}
export function emitToUser(userId: string, event: string, payload: unknown) {
  io?.to(`user:${userId}`).emit(event, payload);
}
export function emitToConversation(conversationId: string, event: string, payload: unknown) {
  io?.to(`conversation:${conversationId}`).emit(event, payload);
}
