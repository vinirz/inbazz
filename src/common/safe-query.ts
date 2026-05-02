import { Logger } from '@nestjs/common';

export type Result<T> = { data: T; error: null } | { data: null; error: Error };

export async function safeQuery<T>(promise: Promise<T>): Promise<Result<T>> {
  try {
    const data = await promise;
    return { data, error: null };
  } catch (error) {
    new Logger('SafeQuery').error(error);
    return {
      data: null,
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
}
