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
