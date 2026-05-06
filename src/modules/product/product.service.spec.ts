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
    update: jest.fn().mockReturnThis(),
    set: jest.fn().mockReturnThis(),
  },
}));

jest.mock('../../database/schema/product', () => ({ product: {} }));
jest.mock('drizzle-orm', () => ({
  eq: jest.fn(),
  and: jest.fn(),
  isNull: jest.fn(),
}));

import { ProductService } from './product.service';

const productId = '00000000-0000-7000-8000-000000000002';

const makeProduct = (overrides = {}) => ({
  id: productId,
  sku: 'PROD-001',
  description: 'Produto de teste',
  price: 5000,
  stock_quantity: 100,
  ...overrides,
});

describe('ProductService', () => {
  let service: ProductService;

  beforeEach(async () => {
    mockSafeQuery.mockReset();

    const module: TestingModule = await Test.createTestingModule({
      providers: [ProductService],
    }).compile();

    service = module.get<ProductService>(ProductService);
  });

  describe('create', () => {
    it('deve criar um produto e retornar o primeiro registro', async () => {
      const product = makeProduct();
      mockSafeQuery.mockResolvedValueOnce({ data: [product], error: null });

      const result = await service.create({
        sku: 'PROD-001',
        description: 'Produto de teste',
        price: 5000,
        stock_quantity: 100,
      });

      expect(result).toEqual(product);
    });

    it('deve lançar BadRequestException em caso de erro no banco', async () => {
      mockSafeQuery.mockResolvedValueOnce({
        data: null,
        error: new Error('unique constraint violated'),
      });

      await expect(
        service.create({
          sku: 'PROD-001',
          description: 'Produto de teste',
          price: 5000,
          stock_quantity: 100,
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('findAll', () => {
    it('deve retornar todos os produtos não deletados', async () => {
      const products = [
        makeProduct(),
        makeProduct({ id: 'id-2', sku: 'PROD-002' }),
      ];
      mockSafeQuery.mockResolvedValueOnce({ data: products, error: null });

      const result = await service.findAll();
      expect(result).toEqual(products);
      expect(result).toHaveLength(2);
    });

    it('deve retornar lista vazia quando não há produtos', async () => {
      mockSafeQuery.mockResolvedValueOnce({ data: [], error: null });

      const result = await service.findAll();
      expect(result).toEqual([]);
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
    it('deve retornar o produto pelo id', async () => {
      const product = makeProduct();
      mockSafeQuery.mockResolvedValueOnce({ data: [product], error: null });

      const result = await service.findOne(productId);
      expect(result).toEqual(product);
    });

    it('deve lançar BadRequestException quando o produto não é encontrado', async () => {
      mockSafeQuery.mockResolvedValueOnce({ data: [], error: null });

      await expect(service.findOne(productId)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('deve lançar BadRequestException em caso de erro no banco', async () => {
      mockSafeQuery.mockResolvedValueOnce({
        data: null,
        error: new Error('db error'),
      });

      await expect(service.findOne(productId)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('update', () => {
    it('deve atualizar o produto com sucesso', async () => {
      mockSafeQuery.mockResolvedValueOnce({
        data: { rowCount: 1 },
        error: null,
      });

      await expect(
        service.update(productId, { price: 7500 }),
      ).resolves.toBeUndefined();
    });

    it('deve lançar BadRequestException quando o produto não é encontrado (rowCount 0)', async () => {
      mockSafeQuery.mockResolvedValueOnce({
        data: { rowCount: 0 },
        error: null,
      });

      await expect(service.update(productId, { price: 7500 })).rejects.toThrow(
        BadRequestException,
      );
    });

    it('deve lançar BadRequestException em caso de erro no banco', async () => {
      mockSafeQuery.mockResolvedValueOnce({
        data: null,
        error: new Error('db error'),
      });

      await expect(service.update(productId, { price: 7500 })).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('remove', () => {
    it('deve remover o produto com soft-delete (rowCount 1)', async () => {
      mockSafeQuery.mockResolvedValueOnce({
        data: { rowCount: 1 },
        error: null,
      });

      await expect(service.remove(productId)).resolves.toBeUndefined();
    });

    it('deve lançar BadRequestException quando o produto não é encontrado (rowCount 0)', async () => {
      mockSafeQuery.mockResolvedValueOnce({
        data: { rowCount: 0 },
        error: null,
      });

      await expect(service.remove(productId)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('deve lançar BadRequestException em caso de erro no banco', async () => {
      mockSafeQuery.mockResolvedValueOnce({
        data: null,
        error: new Error('db error'),
      });

      await expect(service.remove(productId)).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
