import { Injectable, Logger } from '@nestjs/common';
import redis from '../../database/connectors/redis';

@Injectable()
export class IdempotencyLockService {
  private readonly LOCK_PREFIX = 'idempotency:lock:';
  private readonly LOCK_TTL = 5;
  logger: Logger;

  constructor() {
    this.logger = new Logger(IdempotencyLockService.name);
  }

  async acquireLock(idempotencyKey: string): Promise<boolean> {
    try {
      const lockKey = `${this.LOCK_PREFIX}${idempotencyKey}`;

      const result = await redis.set(lockKey, 'locked', 'NX');

      if (result === 'OK') {
        await redis.expire(lockKey, this.LOCK_TTL);
      }

      const isLocked = result === 'OK';

      if (isLocked) {
        this.logger.log(
          `[LOCK SERVICE] O lock para ${idempotencyKey.substring(0, 8)} já existe`,
        );
      }

      return isLocked;
    } catch (error) {
      this.logger.error(
        `[LOCK SERVICE] Erro ao adquirir lock para ${idempotencyKey.substring(0, 8)}:`,
        error,
      );
      return false;
    }
  }

  async waitForLock(
    idempotencyKey: string,
    maxWaitMs: number = 5000,
  ): Promise<boolean> {
    const startTime = Date.now();

    while (Date.now() - startTime < maxWaitMs) {
      const locked = await this.acquireLock(idempotencyKey);
      if (locked) {
        return true;
      }

      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    return false;
  }

  async releaseLock(idempotencyKey: string): Promise<void> {
    try {
      const lockKey = `${this.LOCK_PREFIX}${idempotencyKey}`;
      await redis.del(lockKey);
      this.logger.log(
        `[LOCK SERVICE] Lock para ${idempotencyKey.substring(0, 8)} liberado`,
      );
    } catch (error) {
      console.error('[IdempotencyLockService] Erro ao liberar lock:', error);
    }
  }
}
