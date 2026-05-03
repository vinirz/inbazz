import { IsNotEmpty, IsNumber, IsUUID, Min } from 'class-validator';

export class OrderProductDto {
  @IsUUID()
  @IsNotEmpty()
  product_id!: string;

  @IsNumber()
  @Min(1)
  @IsNotEmpty()
  quantity!: number;
}
