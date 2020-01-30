import { Injectable } from '@nestjs/common';
import { AmqpConnection } from '@nestjs-plus/rabbitmq';
import { RpcException } from '@nestjs/microservices';
import uuid = require('uuid/v1');

interface Ids {
  correlationId?: string;
  eventId?: string;
  causationId?: string;
}
@Injectable()
export class BrokerService {
  constructor(public readonly connection: AmqpConnection) {}

  async send(pattern: string, data: any, ids: Ids = {}) {
    const [appName, action] = pattern.split('.');
    const result: any = await this.connection.request({
      exchange: `rpc.${appName}`,
      routingKey: `rpc.${appName}.${action}`,
      payload: {
        data,
        correlationId: ids.correlationId || uuid(),
        eventId: ids.eventId || uuid(),
        causationId: ids.causationId || uuid(),
        date: new Date(),
      },
    });
    if (result.error) {
      throw new RpcException(result.error);
    }
    return result;
  }

  async publish(pattern: string, data: any, ids: Ids = {}) {
    const [appName, event] = pattern.split('.');
    return this.connection.publish(
      `event.${appName}`,
      `event.${appName}.${event}`,
      {
        data,
        correlationId: ids.correlationId || uuid(),
        eventId: ids.eventId || uuid(),
        causationId: ids.causationId || uuid(),
        date: new Date(),
      },
    );
  }
}
