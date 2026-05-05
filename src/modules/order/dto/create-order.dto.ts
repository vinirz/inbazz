import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsNotEmpty, IsUUID, ValidateNested } from 'class-validator';
import { OrderProductDto } from './order-product.dto';

export class CreateOrderDto {
  @ApiProperty({
    description: 'UUID do cliente',
    example: '018f1d2e-3a4b-7c8d-9e0f-1a2b3c4d5e6f',
  })
  @IsUUID()
  @IsNotEmpty()
  customer_id!: string;

  @ApiProperty({
    description: 'Lista de produtos do pedido',
    type: [OrderProductDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderProductDto)
  @IsNotEmpty()
  products!: OrderProductDto[];
}
