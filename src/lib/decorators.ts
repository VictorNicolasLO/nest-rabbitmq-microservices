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
