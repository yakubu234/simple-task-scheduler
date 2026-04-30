import type { Response } from 'express';

type NotificationEvent = {
  type: 'notification_created' | 'notifications_read';
  notificationId?: number;
};

type Client = {
  res: Response;
};

const clientsByUser = new Map<number, Set<Client>>();

export function addNotificationClient(userId: number, res: Response) {
  const client = { res };
  const clients = clientsByUser.get(userId) ?? new Set<Client>();
  clients.add(client);
  clientsByUser.set(userId, clients);
  return client;
}

export function removeNotificationClient(userId: number, client: Client) {
  const clients = clientsByUser.get(userId);
  if (!clients) return;
  clients.delete(client);
  if (clients.size === 0) {
    clientsByUser.delete(userId);
  }
}

export function emitNotificationEvent(userId: number, event: NotificationEvent) {
  const clients = clientsByUser.get(userId);
  if (!clients) return;

  const payload = `event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`;
  for (const client of clients) {
    client.res.write(payload);
  }
}
