import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';

const mockSafeQuery = jest.fn();

jest.mock('../../common/safe-query', () => ({
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  safeQuery: (...args: unknown[]) => mockSafeQuery(...args),
}));

jest.mock('../../database/connectors/postgres', () => ({
  __esModule: true,
  default: {
    select: jest.fn().mockReturnThis(),
    from: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    values: jest.fn().mockReturnThis(),
    returning: jest.fn().mockReturnThis(),
    transaction: jest.fn(),
    update: jest.fn().mockReturnThis(),
    set: jest.fn().mockReturnThis(),
  },
}));

jest.mock('../../database/schema/order', () => ({
  order: {},
  statusEnum: jest.fn(),
}));

jest.mock('../../database/schema/orderProducts', () => ({
  orderProducts: {},
}));

jest.mock('../../database/schema/product', () => ({
  product: {},
}));

jest.mock('../../database/schema/customer', () => ({
  customer: {},
}));

jest.mock('drizzle-orm', () => ({
  eq: jest.fn(),
  inArray: jest.fn(),
}));

import { OrderService } from './order.service';
import { QueueService } from '../queue/queue.service';

const customerId = '00000000-0000-7000-8000-000000000001';
const productId = '00000000-0000-7000-8000-000000000002';
const orderId = '00000000-0000-7000-8000-000000000099';

const makeQueueService = (): jest.Mocked<Pick<QueueService, 'addJob'>> => ({
  addJob: jest.fn().mockResolvedValue({ id: 'job-1' }),
});

describe('OrderService', () => {
  let service: OrderService;
  let queueService: ReturnType<typeof makeQueueService>;

  beforeEach(async () => {
    queueService = makeQueueService();
    mockSafeQuery.mockReset();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrderService,
        { provide: QueueService, useValue: queueService },
      ],
    }).compile();

    service = module.get<OrderService>(OrderService);
  });

  describe('create', () => {
    it('deve lançar BadRequestException quando o cliente não é encontrado', async () => {
      mockSafeQuery
        .mockResolvedValueOnce({ data: [], error: null })
        .mockResolvedValueOnce({
          data: [{ id: productId, price: 1000 }],
          error: null,
        });

      await expect(
        service.create({
          customer_id: customerId,
          products: [{ product_id: productId, quantity: 1 }],
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('deve lançar BadRequestException quando algum produto não é encontrado', async () => {
      mockSafeQuery
        .mockResolvedValueOnce({ data: [{ id: customerId }], error: null })
        .mockResolvedValueOnce({ data: [], error: null });

      await expect(
        service.create({
          customer_id: customerId,
          products: [{ product_id: productId, quantity: 1 }],
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('deve lançar BadRequestException quando a query retorna erro', async () => {
      const dbError = new Error('connection refused');
      mockSafeQuery
        .mockResolvedValueOnce({ data: null, error: dbError })
        .mockResolvedValueOnce({ data: null, error: dbError });

      await expect(
        service.create({
          customer_id: customerId,
          products: [{ product_id: productId, quantity: 1 }],
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('deve criar o pedido e enfileirar o job com sucesso', async () => {
      const orderResult = {
        id: orderId,
        customer_id: customerId,
        amount: 1000,
        products: [{ product_id: productId, quantity: 1, unit_price: 1000 }],
      };

      mockSafeQuery
        .mockResolvedValueOnce({ data: [{ id: customerId }], error: null })
        .mockResolvedValueOnce({
          data: [{ id: productId, price: 1000 }],
          error: null,
        })
        .mockResolvedValueOnce({ data: orderResult, error: null });

      const result = await service.create({
        customer_id: customerId,
        products: [{ product_id: productId, quantity: 1 }],
      });

      expect(result).toEqual(orderResult);
      expect(queueService.addJob).toHaveBeenCalledWith(
        'orders',
        'process-order',
        orderResult,
      );
    });
  });

  describe('findAll', () => {
    it('deve retornar todos os pedidos', async () => {
      const orders = [{ id: orderId, amount: 1000, status: 'created' }];
      mockSafeQuery.mockResolvedValueOnce({ data: orders, error: null });

      const result = await service.findAll();
      expect(result).toEqual(orders);
    });

    it('deve lançar BadRequestException em caso de erro no banco', async () => {
      mockSafeQuery.mockResolvedValueOnce({
        data: null,
        error: new Error('db error'),
      });
      await expect(service.findAll()).rejects.toThrow(BadRequestException);
    });
  });

  describe('findOne', () => {
    it('deve retornar o pedido pelo id', async () => {
      const orders = [{ id: orderId, amount: 1000, status: 'created' }];
      mockSafeQuery.mockResolvedValueOnce({ data: orders, error: null });

      const result = await service.findOne(orderId);
      expect(result).toEqual(orders);
    });

    it('deve lançar BadRequestException em caso de erro no banco', async () => {
      mockSafeQuery.mockResolvedValueOnce({
        data: null,
        error: new Error('db error'),
      });
      await expect(service.findOne(orderId)).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
