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

jest.mock('../../database/schema/customer', () => ({ customer: {} }));
jest.mock('drizzle-orm', () => ({
  eq: jest.fn(),
  and: jest.fn(),
  isNull: jest.fn(),
}));

import { CustomerService } from './customer.service';

const customerId = '00000000-0000-7000-8000-000000000001';

const makeCustomer = (overrides = {}) => ({
  id: customerId,
  name: 'João Silva',
  email: 'joao@example.com',
  ...overrides,
});

describe('CustomerService', () => {
  let service: CustomerService;

  beforeEach(async () => {
    mockSafeQuery.mockReset();

    const module: TestingModule = await Test.createTestingModule({
      providers: [CustomerService],
    }).compile();

    service = module.get<CustomerService>(CustomerService);
  });

  describe('create', () => {
    it('deve criar um cliente e retornar o primeiro registro', async () => {
      const customer = makeCustomer();
      mockSafeQuery.mockResolvedValueOnce({ data: [customer], error: null });

      const result = await service.create({
        name: 'João Silva',
        email: 'joao@example.com',
      });

      expect(result).toEqual(customer);
    });

    it('deve lançar BadRequestException em caso de erro no banco', async () => {
      mockSafeQuery.mockResolvedValueOnce({
        data: null,
        error: new Error('unique constraint violated'),
      });

      await expect(
        service.create({ name: 'João Silva', email: 'joao@example.com' }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('findAll', () => {
    it('deve retornar todos os clientes não deletados', async () => {
      const customers = [
        makeCustomer(),
        makeCustomer({ id: 'id-2', email: 'outro@example.com' }),
      ];
      mockSafeQuery.mockResolvedValueOnce({ data: customers, error: null });

      const result = await service.findAll();
      expect(result).toEqual(customers);
      expect(result).toHaveLength(2);
    });

    it('deve retornar lista vazia quando não há clientes', async () => {
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
    it('deve retornar o cliente pelo id', async () => {
      const customer = makeCustomer();
      mockSafeQuery.mockResolvedValueOnce({ data: [customer], error: null });

      const result = await service.findOne(customerId);
      expect(result).toEqual(customer);
    });

    it('deve retornar null quando o cliente não é encontrado', async () => {
      mockSafeQuery.mockResolvedValueOnce({ data: [], error: null });

      const result = await service.findOne(customerId);
      expect(result).toBeNull();
    });

    it('deve lançar BadRequestException em caso de erro no banco', async () => {
      mockSafeQuery.mockResolvedValueOnce({
        data: null,
        error: new Error('db error'),
      });

      await expect(service.findOne(customerId)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('update', () => {
    it('deve atualizar o cliente com sucesso', async () => {
      mockSafeQuery.mockResolvedValueOnce({
        data: { rowCount: 1 },
        error: null,
      });

      await expect(
        service.update(customerId, { name: 'João Atualizado' }),
      ).resolves.toBeUndefined();
    });

    it('deve lançar BadRequestException quando o cliente não é encontrado (rowCount 0)', async () => {
      mockSafeQuery.mockResolvedValueOnce({
        data: { rowCount: 0 },
        error: null,
      });

      await expect(
        service.update(customerId, { name: 'Novo Nome' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('deve lançar BadRequestException em caso de erro no banco', async () => {
      mockSafeQuery.mockResolvedValueOnce({
        data: null,
        error: new Error('db error'),
      });

      await expect(service.update(customerId, { name: 'X' })).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('remove', () => {
    it('deve remover o cliente com soft-delete (rowCount 1)', async () => {
      mockSafeQuery.mockResolvedValueOnce({
        data: { rowCount: 1 },
        error: null,
      });

      await expect(service.remove(customerId)).resolves.toBeUndefined();
    });

    it('deve lançar BadRequestException quando o cliente não é encontrado (rowCount 0)', async () => {
      mockSafeQuery.mockResolvedValueOnce({
        data: { rowCount: 0 },
        error: null,
      });

      await expect(service.remove(customerId)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('deve lançar BadRequestException em caso de erro no banco', async () => {
      mockSafeQuery.mockResolvedValueOnce({
        data: null,
        error: new Error('db error'),
      });

      await expect(service.remove(customerId)).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
