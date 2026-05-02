import { Module } from '@nestjs/common';
import { CustomerModule } from './modules/customer/customer.module';

@Module({
  imports: [CustomerModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
