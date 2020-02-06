import { BrokerService } from '../services/broker.service';
import { MigrationType, AppEvent } from '../types';

interface EventsToDispatch {
  migration: MigrationType;
  events: AppEvent[];
}
interface EventToDispatch {
  migration: MigrationType;
  event: AppEvent;
}

export class MigrationProcess {
  broker: BrokerService;
  migrations: MigrationType[];

  constructor(broker: BrokerService, migrations: MigrationType[]) {
    this.broker = broker;
    this.migrations = migrations;
  }

  public async startMigration() {
    const migrationData = await this.getMigrationData();
    const eventList = await this.createOrderedEventList(migrationData);
    await this.dispatchEvents(eventList);
  }

  private async dispatchEvents(eventList: EventToDispatch[]) {
    eventList.forEach(async eventToDispatch => {
      const {
        exchange,
        queue,
        routingKey,
      } = eventToDispatch.migration.migrationSubscription;
      const {
        causationId,
        eventId,
        correlationId,
        eventDate: date,
        data,
      } = eventToDispatch.event;

      this.broker.connection.publish(exchange, routingKey, {
        data,
        correlationId,
        eventId,
        causationId,
        date,
      });
    });
  }

  private async createOrderedEventList(
    migrationData: EventsToDispatch[],
  ): Promise<EventToDispatch[]> {
    return migrationData
      .reduce((acc, eventToDispatch) => {
        return [
          ...acc,
          ...eventToDispatch.events.map(event => ({
            event,
            migration: eventToDispatch.migration,
          })),
        ];
      }, [])
      .sort((a: EventToDispatch, b: EventToDispatch) => {
        if (a.event.eventDate > b.event.eventDate) {
          return 1;
        }
        if (b.event.eventDate > a.event.eventDate) {
          return -1;
        }
        return 0;
      });
  }

  private async getMigrationData(): Promise<EventsToDispatch[]> {
    const migrationData: EventsToDispatch[] = await Promise.all(
      this.migrations.map(async migration => {
        await this.setupOriginalLazyQueue(migration);
        const currentDate = new Date();

        const events: AppEvent[] = await this.broker.send(
          `eventstore.pullEvents`,
          {
            pattern: migration.pattern,
            dateFrom: currentDate,
          },
        );
        return { events, migration };
      }),
    );
    return migrationData;
  }

  private async setupOriginalLazyQueue(migration: MigrationType) {
    const assertOptions: any = {
      queueMode: 'lazy',
    };
    await this.broker.connection.channel.assertQueue(
      migration.baseSubscription.queue,
      assertOptions,
    );
    await this.broker.connection.channel.bindQueue(
      migration.baseSubscription.queue,
      migration.baseSubscription.exchange,
      migration.baseSubscription.routingKey,
    );
  }
}
