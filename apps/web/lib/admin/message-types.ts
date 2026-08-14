export type ContactStatus = 'unread' | 'read' | 'archived';

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  message: string;
  status: ContactStatus;
  created_at: string;
  read_at: string | null;
}
