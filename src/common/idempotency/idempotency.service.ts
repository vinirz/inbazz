import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import redis from '../../database/connectors/redis';

@Injectable()
export class IdempotencyService implements OnModuleInit {
  private isConnected = false;

  private readonly IDEMPOTENCY_KEY_PREFIX = 'idempotency:';
  private readonly IDEMPOTENCY_TTL = 5;

  logger: Logger;

  constructor() {
    this.logger = new Logger(IdempotencyService.name);
  }

  async onModuleInit() {
    try {
      await redis.ping();
      this.isConnected = true;
    } catch (error) {
      this.isConnected = false;
      this.logger.error(
        '[IDEMPOTENCY SERVICE] Falha ao conectar Redis:',
        error,
      );
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
  async getIdempotentResponse(idempotencyKey: string): Promise<any | null> {
    if (!this.isConnected) {
      this.logger.warn(
        '[IDEMPOTENCY SERVICE] Redis não está conectado. Ignorando cache.',
      );
      return null;
    }

    try {
      const key = `${this.IDEMPOTENCY_KEY_PREFIX}${idempotencyKey}`;
      const cached = await redis.get(key);

      if (cached) {
        return JSON.parse(String(cached));
      }

      this.logger.log(
        `[IDEMPOTENCY SERVICE] Cache não encontrado para: ${key}`,
      );
      return null;
    } catch (error) {
      this.logger.error(
        '[IDEMPOTENCY SERVICE] Erro ao recuperar cache:',
        error,
      );
      return null;
    }
  }

  async setIdempotentResponse(
    idempotencyKey: string,
    response: any,
  ): Promise<void> {
    if (!this.isConnected) {
      this.logger.warn(
        '[IDEMPOTENCY SERVICE] Redis não está conectado. Não armazenando resposta.',
      );
      return;
    }

    try {
      const key = `${this.IDEMPOTENCY_KEY_PREFIX}${idempotencyKey}`;
      await redis.setex(key, this.IDEMPOTENCY_TTL, JSON.stringify(response));
    } catch (error) {
      this.logger.error(
        '[IDEMPOTENCY SERVICE] Erro ao armazenar resposta:',
        error,
      );
    }
  }

  async deleteIdempotentResponse(idempotencyKey: string): Promise<void> {
    if (!this.isConnected) {
      return;
    }

    try {
      const key = `${this.IDEMPOTENCY_KEY_PREFIX}${idempotencyKey}`;
      await redis.del(key);
    } catch (error) {
      this.logger.error('[IDEMPOTENCY SERVICE] Erro ao deletar cache:', error);
    }
  }

  isRedisConnected(): boolean {
    return this.isConnected;
  }
}
