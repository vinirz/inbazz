import { Test, TestingModule } from '@nestjs/testing';
import { QueueService } from './queue.service';

const mockQueueAdd = jest.fn();
const mockQueueClose = jest.fn();
const mockQueueGetJobCounts = jest.fn();
const mockWorkerOn = jest.fn();
const mockWorkerClose = jest.fn();

jest.mock('bullmq', () => ({
  Queue: jest.fn().mockImplementation(() => ({
    add: mockQueueAdd,
    close: mockQueueClose,
    getJobCounts: mockQueueGetJobCounts,
  })),
  Worker: jest.fn().mockImplementation(() => ({
    on: mockWorkerOn,
    close: mockWorkerClose,
  })),
  Job: jest.fn(),
}));

describe('QueueService', () => {
  let service: QueueService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [QueueService],
    }).compile();

    service = module.get<QueueService>(QueueService);
  });

  describe('addJob', () => {
    it('deve adicionar um job com as opções de retry padrão', async () => {
      const mockJob = { id: 'job-123' };
      mockQueueAdd.mockResolvedValueOnce(mockJob);

      const result = await service.addJob('orders', 'process-order', {
        id: 'order-1',
      });

      expect(result).toEqual(mockJob);
      expect(mockQueueAdd).toHaveBeenCalledWith(
        'process-order',
        { id: 'order-1' },
        {
          attempts: 3,
          backoff: { type: 'exponential', delay: 1000 },
        },
      );
    });

    it('deve reutilizar a fila existente em chamadas subsequentes', async () => {
      mockQueueAdd.mockResolvedValue({ id: 'job-1' });

      await service.addJob('orders', 'job-a', {});
      await service.addJob('orders', 'job-b', {});

      const { Queue } = jest.requireMock('bullmq');
      expect(Queue).toHaveBeenCalledTimes(1);
    });

    it('deve respeitar opções de retry customizadas', async () => {
      mockQueueAdd.mockResolvedValueOnce({ id: 'job-2' });

      await service.addJob(
        'orders',
        'process-order',
        {},
        {
          attempts: 5,
          backoff: { type: 'fixed', delay: 2000 },
        },
      );

      expect(mockQueueAdd).toHaveBeenCalledWith(
        'process-order',
        {},
        { attempts: 5, backoff: { type: 'fixed', delay: 2000 } },
      );
    });
  });

  describe('registerWorker', () => {
    it('deve registrar um worker e retornar a instância', () => {
      const processor = jest.fn();
      const worker = service.registerWorker('orders', processor);

      expect(worker).toBeDefined();
      expect(mockWorkerOn).toHaveBeenCalledWith(
        'completed',
        expect.any(Function),
      );
      expect(mockWorkerOn).toHaveBeenCalledWith('failed', expect.any(Function));
    });

    it('deve retornar o worker existente sem criar um novo quando já registrado', () => {
      const processor = jest.fn();
      service.registerWorker('orders', processor);
      service.registerWorker('orders', processor);

      const { Worker } = jest.requireMock('bullmq');
      expect(Worker).toHaveBeenCalledTimes(1);
    });
  });

  describe('getMetrics', () => {
    it('deve retornar os contadores de jobs de todas as filas', async () => {
      mockQueueAdd.mockResolvedValue({ id: 'job-1' });
      mockQueueGetJobCounts.mockResolvedValue({
        waiting: 2,
        active: 1,
        completed: 10,
        failed: 0,
        delayed: 0,
      });

      await service.addJob('orders', 'job', {});
      const metrics = await service.getMetrics();

      expect(metrics).toEqual([
        {
          queue: 'orders',
          waiting: 2,
          active: 1,
          completed: 10,
          failed: 0,
          delayed: 0,
        },
      ]);
    });

    it('deve retornar array vazio quando não há filas registradas', async () => {
      const metrics = await service.getMetrics();
      expect(metrics).toEqual([]);
    });
  });

  describe('onModuleDestroy', () => {
    it('deve fechar todas as filas e workers', async () => {
      mockQueueAdd.mockResolvedValue({ id: 'job-1' });
      mockQueueClose.mockResolvedValue(undefined);
      mockWorkerClose.mockResolvedValue(undefined);

      await service.addJob('orders', 'job', {});
      service.registerWorker('orders', jest.fn());

      await service.onModuleDestroy();

      expect(mockQueueClose).toHaveBeenCalledTimes(1);
      expect(mockWorkerClose).toHaveBeenCalledTimes(1);
    });
  });
});
