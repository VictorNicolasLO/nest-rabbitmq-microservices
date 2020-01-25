import { Module, DynamicModule } from '@nestjs/common';
import { BrokerService } from './services/broker.service';
import { RabbitMQModule } from '@nestjs-plus/rabbitmq';
import { AsyncOptions } from './types';

@Module({})
export class RabbitMicroservices {
  static forRootAsync(options: AsyncOptions): DynamicModule {
    return {
      module: RabbitMicroservices,
      imports: [
        RabbitMQModule.forRootAsync({
          useFactory: options.useFactory,
          imports: options.imports,
          inject: options.inject,
        }),
      ],
      providers: [BrokerService],
      exports: [BrokerService],
    };
  }
}
