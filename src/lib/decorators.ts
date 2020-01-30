import { RabbitRPC, RabbitSubscribe } from '@nestjs-plus/rabbitmq';
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

export function Subscribe(pattern: string) {
  // this is the decorator factory
  return (target, key, descriptor) => {
    const [appName, emmiterApp, event] = pattern.split('.');
    return RabbitSubscribe({
      exchange: `event.${emmiterApp}`,
      routingKey: `event.${emmiterApp}.${event}`,
      queue: `event.${appName}.${emmiterApp}.${event}`,
    })(target, key, descriptor);
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
        this.broker.publish(`${AppName}.${success}`, eventData, {
          causationId: eventId,
          correlationId,
        });
        return response;
      } catch (e) {
        this.broker.publish(
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
