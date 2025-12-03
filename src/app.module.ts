import './boilerplate.polyfill';

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { DataSource } from 'typeorm';
import { addTransactionalDataSource } from 'typeorm-transactional';

import { HealthCheckerModule } from './modules/health-checker/health-checker.module';
import { LeaderboardModule } from './modules/leaderboard/leaderboard.module';
import { ApiConfigService } from './shared/services/api-config.service';
import { SharedModule } from './shared/shared.module';
import { ScheduleModule } from '@nestjs/schedule';
import { CronModule } from './modules/cronjob/cron.module';

import { CommonResponseInterceptor } from './interceptors/common-response-interceptor.service';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { CommonErrorInterceptor } from './interceptors/common-error-interceptor.service';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    CronModule,
    LeaderboardModule,
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      imports: [SharedModule],
      useFactory: (configService: ApiConfigService) =>
        configService.postgresConfig,
      inject: [ApiConfigService],
      dataSourceFactory: (options) => {
        if (!options) {
          throw new Error('Invalid options passed');
        }
        return Promise.resolve(
          addTransactionalDataSource(new DataSource(options)),
        );
        // return Promise.resolve();
      },
    }),
    HealthCheckerModule,
  ],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: CommonResponseInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: CommonErrorInterceptor,
    },
  ],
})
export class AppModule {}
