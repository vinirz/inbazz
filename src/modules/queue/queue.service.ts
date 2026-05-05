import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { Queue, Worker, Job } from 'bullmq';
import environment from '../../common/environment';

export interface AddJobOptions {
  attempts?: number;
  backoff?: {
    type: 'exponential' | 'fixed';
    delay: number;
  };
}

@Injectable()
export class QueueService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(QueueService.name);
  private readonly queues: Map<string, Queue> = new Map();
  private readonly workers: Map<string, Worker> = new Map();

  private getRedisConfig() {
    return {
      host: environment.REDIS_HOST,
      port: environment.REDIS_PORT,
      password: environment.REDIS_PASSWORD,
      family: 4,
    };
  }

  onModuleInit() {
    this.logger.log('Queue service initialized');
  }

  async onModuleDestroy() {
    this.logger.log('Closing all queues and workers');
    await Promise.all([
      ...Array.from(this.queues.values()).map((queue) => queue.close()),
      ...Array.from(this.workers.values()).map((worker) => worker.close()),
    ]);
  }

  async addJob(
    queueName: string,
    jobName: string,
    data: unknown,
    options: AddJobOptions = {},
  ) {
    let queue = this.queues.get(queueName);
    if (!queue) {
      queue = new Queue(queueName, { connection: this.getRedisConfig() });
      this.queues.set(queueName, queue);
    }

    const job = await queue.add(jobName, data, {
      attempts: options.attempts ?? 3,
      backoff: options.backoff ?? {
        type: 'exponential',
        delay: 1000,
      },
    });

    this.logger.log(`Job ${job.id} added to queue "${queueName}"`);
    return job;
  }

  registerWorker(
    queueName: string,
    processor: (job: Job) => Promise<unknown>,
  ): Worker {
    if (this.workers.has(queueName)) {
      return this.workers.get(queueName)!;
    }

    const worker = new Worker(queueName, processor, {
      connection: this.getRedisConfig(),
    });

    worker.on('completed', (job) => {
      this.logger.log(`Job ${job.id} completed in queue "${queueName}"`);
    });

    worker.on('failed', (job, err) => {
      this.logger.error(
        `Job ${job?.id} failed in queue "${queueName}" (attempt ${job?.attemptsMade}): ${err.message}`,
      );
    });

    this.workers.set(queueName, worker);
    this.logger.log(`Worker registered for queue "${queueName}"`);

    return worker;
  }

  async getMetrics() {
    const metrics = await Promise.all(
      Array.from(this.queues.entries()).map(async ([name, queue]) => {
        const counts = await queue.getJobCounts(
          'waiting',
          'active',
          'completed',
          'failed',
          'delayed',
        );

        return { queue: name, ...counts };
      }),
    );

    return metrics;
  }
}
