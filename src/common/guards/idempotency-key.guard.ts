import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { IdempotencyHashService } from '../idempotency/idempotency-hash.service';

@Injectable()
export class IdempotencyKeyGuard implements CanActivate {
  private hashService = new IdempotencyHashService();

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();

    const idempotencyKey = this.hashService.generateHash(
      request.method,
      request.path,
      request.body,
      request.user?.id,
    );

    request.idempotencyKey = idempotencyKey;

    return true;
  }
}
