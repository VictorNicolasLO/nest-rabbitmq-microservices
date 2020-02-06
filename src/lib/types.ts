export interface AsyncOptions {
  useFactory: (...args) => any;
  imports: any[];
  inject: any[];
}

export interface Message<T> {
  correlationId?: string;
  eventId?: string;
  causationId?: string;
  data: T;
  date?: Date;
}

export interface SubscribeOptions {
  migration: boolean;
}

export interface AppEvent {
  data: any;
  routingKey: string;
  date: any;
  app: string;
  event: string;
  eventDate: Date;
  causationId: string;
  correlationId: string;
  eventId: string;
}

export interface MigrationType {
  pattern: string;
  function?: any;
  baseSubscription: { exchange: string; routingKey: string; queue: string };
  migrationSubscription: {
    exchange: string;
    routingKey: string;
    queue: string;
  };
}

export interface AppEvent {
  data: any;
  routingKey: string;
  date: any;
  app: string;
  event: string;
  eventDate: Date;
  causationId: string;
  correlationId: string;
  eventId: string;
}
