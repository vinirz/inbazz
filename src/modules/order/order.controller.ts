import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Logger,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiSecurity,
} from '@nestjs/swagger';
import { OrderService } from './order.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { IdempotencyKey } from '../../common/decorators/idempotency-key.decorator';
import { IdempotencyKeyGuard } from '../../common/guards/idempotency-key.guard';
import { IdempotencyService } from '../../common/idempotency/idempotency.service';
import { IdempotencyLockService } from '../../common/idempotency/idempotency-lock.service';

@ApiTags('orders')
@Controller('order')
export class OrderController {
  logger: Logger;

  constructor(
    private readonly orderService: OrderService,
    private readonly idempotencyService: IdempotencyService,
    private readonly lockService: IdempotencyLockService,
  ) {
    this.logger = new Logger(OrderController.name);
  }

  @Post('/webhook')
  @UseGuards(IdempotencyKeyGuard)
  @ApiSecurity('idempotency-key')
  @ApiOperation({
    summary: 'Criar pedido via webhook',
    description:
      'Cria um novo pedido e enfileira para processamento assíncrono (conversão USD→BRL). Requer o header `idempotency-key` para garantir idempotência.',
  })
  @ApiResponse({ status: 201, description: 'Pedido criado e enfileirado' })
  @ApiResponse({
    status: 400,
    description: 'Dados inválidos ou cliente/produto não encontrado',
  })
  async create(
    @Body() createOrderDto: CreateOrderDto,
    @IdempotencyKey() idempotencyKey: string,
  ) {
    const lockAcquired = await this.lockService.waitForLock(idempotencyKey);

    try {
      if (!lockAcquired) {
        this.logger.warn(
          `[ORDER CONTROLLER] Aguardando lock para ${idempotencyKey.substring(0, 8)}...`,
        );
      }

      const cachedResponse =
        await this.idempotencyService.getIdempotentResponse(idempotencyKey);

      if (cachedResponse) {
        this.logger.log(
          `[ORDER CONTROLLER] Resposta idempotente encontrada para ${idempotencyKey.substring(0, 8)}. Retornando cache...`,
        );
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        return cachedResponse;
      }

      const result = await this.orderService.create(createOrderDto);

      await this.idempotencyService.setIdempotentResponse(
        idempotencyKey,
        result,
      );

      return result;
    } finally {
      if (lockAcquired) {
        await this.lockService.releaseLock(idempotencyKey);
      }
    }
  }

  @Get()
  @ApiOperation({ summary: 'Listar todos os pedidos' })
  @ApiResponse({ status: 200, description: 'Lista de pedidos' })
  findAll() {
    return this.orderService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar pedido por ID' })
  @ApiParam({ name: 'id', description: 'UUID do pedido' })
  @ApiResponse({ status: 200, description: 'Pedido encontrado' })
  @ApiResponse({ status: 400, description: 'Pedido não encontrado' })
  findOne(@Param('id') id: string) {
    return this.orderService.findOne(id);
  }
}
