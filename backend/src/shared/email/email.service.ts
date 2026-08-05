import { ConsoleEmailAdapter } from './console-email.adapter.js';
import type { EmailSender } from './email.types.js';

let sender: EmailSender | null = null;

export function getEmailSender() {
  sender ??= new ConsoleEmailAdapter();
  return sender;
}

export function setEmailSender(nextSender: EmailSender) {
  sender = nextSender;
}
