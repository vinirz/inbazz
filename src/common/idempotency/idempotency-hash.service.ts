import { Injectable, Logger } from '@nestjs/common';
import { createHash } from 'crypto';

@Injectable()
export class IdempotencyHashService {
  logger: Logger;

  constructor() {
    this.logger = new Logger(IdempotencyHashService.name);
  }

  generateHash(
    method: string,
    path: string,
    body: any,
    userId?: string | number,
  ): string {
    const data = {
      method: method.toUpperCase(),
      path: path.split('?')[0],
      body: this.sanitizeBody(body),
      userId: userId || 'anonymous',
    };

    const dataString = JSON.stringify(data);
    const hash = createHash('sha256').update(dataString).digest('hex');

    this.logger.log(`[HASH] Generated hash: ${hash}`);

    return hash;
  }

  private sanitizeBody(body: any): any {
    if (!body || typeof body !== 'object') {
      return body;
    }

    const sanitized = { ...body };

    delete sanitized.id;
    delete sanitized._id;
    delete sanitized.createdAt;
    delete sanitized.updatedAt;
    delete sanitized.timestamp;
    delete sanitized.requestId;

    return sanitized;
  }
}
