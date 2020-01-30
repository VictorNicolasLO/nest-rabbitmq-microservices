# Nest rabbitmq microservices

## Description

This module is based in [@nestjs-plus/rabbitmq](https://www.npmjs.com/package/@nestjs-plus/rabbitmq) to facilitate the usage of event and rpc patterns between rabbitmq and nestjs.

## Usage

Init the module in your nest app.

    // app.module.ts
    import { Module } from '@nestjs/common';
    import { RabbitMicroservices } from 'nest-rabbitmq-microservices';
    const appName = "my-app"
    @Module({
      imports: [
        RabbitMicroservices.forRootAsync({
          useFactory: (config: ConfigService) => {
            return {
              exchanges: [
                {
                  name: `rpc.${appName}`, // For RPC comunications
                  type: 'topic',
                },
                {
                  name: `event.${appName}`, // For events
                  type: 'topic',
                },
              ],
              uri: "amqp://localhost:5672",
            };
          },
          imports: [ConfigModule.forRoot()],
          inject: [ConfigService],
        }),

      ],
     providers: [
        AppController, // All controllers have to be imported as service
      ],
    })
    export class AppModule {}

Define your controller with events or RPC methods by using the `Rpc` or `Subscribe` decorators where `Rpc` can be combined with `EmmitEvents` for automatically produce events of the method.

    import { Injectable } from '@nestjs/common';
    import { BrokerService, Rpc, Message, EmmitEvents, Subscribe } from 'nest-rabbitmq-microservices';

    const appName = "my-app"
    const emmiterApp = "my-app" // because of same app
    @Injectable()
    export class AppController {
      constructor(
        private readonly broker: BrokerService, // This always has to be imported
      ) {}

      @Rpc(`${appName}.create-cat`)
      @EmmitEvents(appName, 'cat-created', 'cat-creation-failed')
      createCat({
        data,
    		correlationId, // If you need them
    		eventId,
        causationId
      }: Message<any>): Promise<SignInResponseDto> {
    	   return { cat : data.cat }
      }

    	@Subcribe(`${appName}.${emmiterApp}.cat-created`)
      sayCat({ data }:Message<any>){
    		console.log(data)
    	}

    }

### Now how to try it ?

You can try it by using `BrokerService` included in the package.

    import { Get } from '@nestjs/common';
    import { BrokerService } from 'nest-rabbitmq-microservices';


    @Controller()
    export class AppController {
      constructor(private readonly broker: BrokerService) {}

      @Get('/create-cat')
      login(@Body() cat): Promise<any> {
        return this.broker.send({ name : "michi" });
      }
    }
