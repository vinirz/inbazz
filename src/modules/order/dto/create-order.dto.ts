import { Type } from 'class-transformer';
import { IsArray, IsNotEmpty, IsUUID, ValidateNested } from 'class-validator';
import { OrderProductDto } from './order-product.dto';

export class CreateOrderDto {
  @IsUUID()
  @IsNotEmpty()
  customer_id!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderProductDto)
  @IsNotEmpty()
  products!: OrderProductDto[];
}
