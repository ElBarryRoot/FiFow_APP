import { logger } from '../../config/logger.js';
import type { EmailMessage, EmailSender } from './email.types.js';

export class ConsoleEmailAdapter implements EmailSender {
  async send(message: EmailMessage) {
    logger.info('Email de développement', {
      to: message.to,
      subject: message.subject,
      content: message.text
    });
  }
}
