import type { Response } from 'express';

type ActivityEvent = {
  type: 'activity_created';
  activityId?: number;
};

type Client = {
  res: Response;
};

const clientsByProject = new Map<number, Set<Client>>();

export function addActivityClient(projectId: number, res: Response) {
  const client = { res };
  const clients = clientsByProject.get(projectId) ?? new Set<Client>();
  clients.add(client);
  clientsByProject.set(projectId, clients);
  return client;
}

export function removeActivityClient(projectId: number, client: Client) {
  const clients = clientsByProject.get(projectId);
  if (!clients) return;
  clients.delete(client);
  if (clients.size === 0) {
    clientsByProject.delete(projectId);
  }
}

export function emitActivityEvent(projectId: number, event: ActivityEvent) {
  const clients = clientsByProject.get(projectId);
  if (!clients) return;

  const payload = `event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`;
  for (const client of clients) {
    client.res.write(payload);
  }
}
