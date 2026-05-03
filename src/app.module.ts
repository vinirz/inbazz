import { Module } from '@nestjs/common';
import { CustomerModule } from './modules/customer/customer.module';
import { ProductModule } from './modules/product/product.module';
import { OrderModule } from './modules/order/order.module';

@Module({
  imports: [CustomerModule, ProductModule, OrderModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
