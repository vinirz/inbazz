import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsUUID, Min } from 'class-validator';

export class OrderProductDto {
  @ApiProperty({
    description: 'UUID do produto',
    example: '018f1d2e-3a4b-7c8d-9e0f-1a2b3c4d5e6f',
  })
  @IsUUID()
  @IsNotEmpty()
  product_id!: string;

  @ApiProperty({ description: 'Quantidade do produto', example: 2, minimum: 1 })
  @IsNumber()
  @Min(1)
  @IsNotEmpty()
  quantity!: number;
}
