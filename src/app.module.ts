import { Module } from '@nestjs/common';
import { CustomerModule } from './modules/customer/customer.module';
import { ProductModule } from './modules/product/product.module';

@Module({
  imports: [CustomerModule, ProductModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
