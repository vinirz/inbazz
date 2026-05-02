import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { safeQuery } from '../../common/safe-query';
import db from '../../database/connectors/postgres';
import { customer } from '../../database/schema/customer';
import { and, eq, isNull } from 'drizzle-orm';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';

@Injectable()
export class CustomerService {
  logger: Logger;

  constructor() {
    this.logger = new Logger(CustomerService.name);
  }

  async create(createCustomerDto: CreateCustomerDto) {
    this.logger.log(
      `[CREATE] Creating customer with data: ${JSON.stringify(createCustomerDto)}`,
    );

    const { data, error } = await safeQuery(
      db
        .insert(customer)
        .values({
          name: createCustomerDto.name,
          email: createCustomerDto.email,
        })
        .returning(),
    );

    if (error) {
      throw new BadRequestException(error.cause);
    }

    this.logger.log(`[CREATE] Customer created successfully`);
    return data[0];
  }

  async findAll() {
    this.logger.log(`[FIND] Finding all customers`);

    const { data, error } = await safeQuery(
      db
        .select({ id: customer.id, name: customer.name, email: customer.email })
        .from(customer)
        .where(isNull(customer.deleted_at)),
    );

    if (error) {
      throw new BadRequestException(error.cause);
    }

    this.logger.log(`[FIND] Found ${data.length} customers`);

    return data;
  }

  async findOne(id: string) {
    this.logger.log(`[FIND] Finding customer with id: ${id}`);

    const { data, error } = await safeQuery(
      db
        .select({ id: customer.id, name: customer.name, email: customer.email })
        .from(customer)
        .where(and(eq(customer.id, id), isNull(customer.deleted_at))),
    );

    if (error) {
      throw new BadRequestException(error.cause);
    }

    if (data.length === 0) {
      this.logger.warn(`[FIND] No customer found with id: ${id}`);
      return null;
    }

    this.logger.log(`[FIND] Found customer with id: ${id}`);
    return data[0];
  }

  async update(id: string, updateCustomerDto: UpdateCustomerDto) {
    this.logger.log(
      `[UPDATE] Updating customer with id: ${id} and data: ${JSON.stringify(updateCustomerDto)}`,
    );

    const { data, error } = await safeQuery(
      db
        .update(customer)
        .set(updateCustomerDto)
        .where(and(eq(customer.id, id), isNull(customer.deleted_at))),
    );

    if (error || data.rowCount === 0) {
      throw new BadRequestException(
        error?.cause || `No customer found with id: ${id}`,
      );
    }

    this.logger.log(`[UPDATE] Customer with id: ${id} updated successfully`);
    return;
  }

  async remove(id: string) {
    this.logger.log(`[DELETE] Deleting customer with id: ${id}`);

    const { data, error } = await safeQuery(
      db
        .update(customer)
        .set({ deleted_at: new Date().toISOString() })
        .where(eq(customer.id, id)),
    );

    if (error || data.rowCount === 0) {
      throw new BadRequestException(
        error?.cause || `No customer found with id: ${id}`,
      );
    }

    this.logger.log(`[DELETE] Customer with id: ${id} deleted successfully`);
    return;
  }
}
