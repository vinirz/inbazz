import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { IdempotencyHashService } from '../idempotency/idempotency-hash.service';

export const IdempotencyKey = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<{
      idempotencyKey?: string;
      method: string;
      path: string;
      body: unknown;
      user?: { id?: string };
    }>();

    if (typeof request.idempotencyKey === 'string' && request.idempotencyKey) {
      return request.idempotencyKey;
    }

    const hashService = new IdempotencyHashService();
    const hash = hashService.generateHash(
      request.method,
      request.path,
      request.body,
      request.user?.id,
    );

    return hash;
  },
);
