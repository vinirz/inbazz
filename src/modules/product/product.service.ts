import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { safeQuery } from '../../common/safe-query';
import db from '../../database/connectors/postgres';
import { product } from '../../database/schema/product';
import { and, eq, isNull } from 'drizzle-orm';

@Injectable()
export class ProductService {
  logger: Logger;

  constructor() {
    this.logger = new Logger(ProductService.name);
  }

  async create(createProductDto: CreateProductDto) {
    this.logger.log(
      `[CREATE] Creating product with data: ${JSON.stringify(createProductDto)}`,
    );

    const { data, error } = await safeQuery(
      db
        .insert(product)
        .values({
          sku: createProductDto.sku,
          description: createProductDto.description,
          price: createProductDto.price,
          stock_quantity: createProductDto.stock_quantity,
        })
        .returning(),
    );

    if (error) {
      throw new BadRequestException(error.cause);
    }

    return data[0];
  }

  async findAll() {
    this.logger.log(`[FIND] Finding all products`);

    const { data, error } = await safeQuery(
      db
        .select({
          id: product.id,
          sku: product.sku,
          description: product.description,
          price: product.price,
          stock_quantity: product.stock_quantity,
        })
        .from(product)
        .where(isNull(product.deleted_at)),
    );

    if (error) {
      throw new BadRequestException(error.cause);
    }

    this.logger.log(`[FIND] Found ${data.length} products`);
    return data;
  }

  async findOne(id: string) {
    this.logger.log(`[FIND] Finding product with id: ${id}`);

    const { data, error } = await safeQuery(
      db
        .select({
          id: product.id,
          sku: product.sku,
          description: product.description,
          price: product.price,
          stock_quantity: product.stock_quantity,
        })
        .from(product)
        .where(isNull(product.deleted_at)),
    );

    if (error) {
      throw new BadRequestException(error.cause);
    }

    if (data.length === 0) {
      throw new BadRequestException(`Product with id ${id} not found`);
    }

    return data[0];
  }

  async update(id: string, updateProductDto: UpdateProductDto) {
    this.logger.log(
      `[UPDATE] Updating product with id: ${id} and data: ${JSON.stringify(
        updateProductDto,
      )}`,
    );

    const { data, error } = await safeQuery(
      db
        .update(product)
        .set(updateProductDto)
        .where(and(eq(product.id, id), isNull(product.deleted_at))),
    );

    if (error || data.rowCount === 0) {
      throw new BadRequestException(
        error?.cause || `No product found with id: ${id}`,
      );
    }

    this.logger.log(`[UPDATE] Product with id: ${id} updated successfully`);
    return;
  }

  async remove(id: string) {
    this.logger.log(`[DELETE] Deleting product with id: ${id}`);

    const { data, error } = await safeQuery(
      db
        .update(product)
        .set({ deleted_at: new Date().toISOString() })
        .where(and(eq(product.id, id), isNull(product.deleted_at))),
    );

    if (error || data.rowCount === 0) {
      throw new BadRequestException(
        error?.cause || `No product found with id: ${id}`,
      );
    }

    this.logger.log(`[DELETE] Product with id: ${id} deleted successfully`);
    return;
  }
}
