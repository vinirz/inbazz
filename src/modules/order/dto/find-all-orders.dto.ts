import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';

export enum OrderStatus {
  CREATED = 'created',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export class FindAllOrdersDto {
  @ApiPropertyOptional({
    enum: OrderStatus,
    description: 'Filtrar pedidos por status',
    example: OrderStatus.COMPLETED,
  })
  @IsEnum(OrderStatus)
  @IsOptional()
  status?: OrderStatus;
}
