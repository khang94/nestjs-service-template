import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LeaderboardService } from './leaderboard.service';
import { LeaderboardController } from './leaderboard.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
    ]),
  ],
  providers: [
    LeaderboardService,
  ],
  controllers: [
    LeaderboardController
  ]
})
export class LeaderboardModule {}
