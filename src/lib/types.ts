export interface AsyncOptions {
  useFactory: (...args) => any;
  imports: any[];
  inject: any[];
}
