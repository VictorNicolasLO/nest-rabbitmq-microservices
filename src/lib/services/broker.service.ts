import { Injectable } from '@nestjs/common';
import { AmqpConnection } from '@nestjs-plus/rabbitmq';
import { RpcException } from '@nestjs/microservices';

@Injectable()
export class BrokerService {
  constructor(public readonly connection: AmqpConnection) {}

  async send(pattern: string, data: any) {
    const [appName, action] = pattern.split('.');
    const result: any = await this.connection.request({
      exchange: `rpc.${appName}`,
      routingKey: `rpc.${appName}.${action}`,
      payload: data,
    });
    if (result.error) {
      throw new RpcException(result.error);
    }
    return result;
  }

  async publish(pattern: string, data: any) {
    const [appName, event] = pattern.split('.');
    return this.connection.publish(
      `event.${appName}`,
      `event.${appName}.${event}`,
      data,
    );
  }
}
