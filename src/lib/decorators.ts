import { RabbitRPC, RabbitSubscribe } from '@nestjs-plus/rabbitmq';
import { BrokerService } from './services/broker.service';
import { SubscribeOptions, MigrationType } from './types';

let broker: BrokerService;
const migrations: MigrationType[] = [];

export function setBroker(newBroker: BrokerService) {
  broker = newBroker;
}

export function getMigrations() {
  return migrations;
}

export function Rpc(pattern: string) {
  // this is the decorator factory
  return (target, key, descriptor) => {
    const [appName, action] = pattern.split('.');
    return RabbitRPC({
      exchange: `rpc.${appName}`,
      routingKey: `rpc.${appName}.${action}`,
      queue: `rpc.${appName}.${action}`,
    })(target, key, descriptor);
  };
}

export function Subscribe(pattern: string, options?: SubscribeOptions) {
  // this is the decorator factory
  return (target, key, descriptor) => {
    const [appName, emmiterApp, event] = pattern.split('.');
    const baseSubscription = {
      exchange: `event.${emmiterApp}`,
      routingKey: `event.${emmiterApp}.${event}`,
      queue: `event.${appName}.${emmiterApp}.${event}`,
    };
    if (options.migration) {
      const migrationSubscription = {
        exchange: `event.migrations`,
        routingKey: `event.migrations.${emmiterApp}.${event}`,
        queue: `event.migrations.${appName}.${emmiterApp}.${event}`,
      };
      migrations.push({
        pattern,
        migrationSubscription,
        baseSubscription,
      });
      return RabbitSubscribe(migrationSubscription)(target, key, descriptor);
    } else {
      return RabbitSubscribe(baseSubscription)(target, key, descriptor);
    }
  };
}

export function EmmitEvents(
  AppName,
  success,
  error?,
  interceptor?: (req, res) => any,
): any {
  return (target, key, descriptor) => {
    const originalMethod = descriptor.value;
    // tslint:disable-next-line: only-arrow-functions
    descriptor.value = async function(...args) {
      const [{ data, eventId, correlationId }] = args;
      try {
        const response = await originalMethod.apply(this, args);
        const eventData = interceptor
          ? interceptor(data, response)
          : { request: data, response };
        broker.publish(`${AppName}.${success}`, eventData, {
          causationId: eventId,
          correlationId,
        });
        return response;
      } catch (e) {
        broker.publish(
          `${AppName}.${error || 'failed'}`,
          { request: data, response: e },
          {
            causationId: eventId,
            correlationId,
          },
        );
        throw e;
      }
    };
    return descriptor;
  };
}
