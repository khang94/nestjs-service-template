import { ApiProperty } from '@nestjs/swagger';
import { NumberField, StringField } from '../../../decorators';

export class UserLeaderboardDto {
  @ApiProperty({ description: 'User ID', example: '10' })
  @StringField()
  userId!: string;

  @ApiProperty({ description: 'Username', example: 'Ste7en' })
  @StringField()
  username!: string;

  @ApiProperty({ description: 'Display Name', example: 'userDisplayname1' })
  @StringField()
  displayName?: string;
}

export class ItemsPostScoreDto extends UserLeaderboardDto {
  @ApiProperty({ description: 'Score to be posted (must be > 0)', example: 240 })
  @NumberField()
  score!: number;
}

export class PostScoreParamsDto {
  @ApiProperty({ description: 'Leaderboard ID', example: 103 })
  @NumberField()
  leaderboardId!: number;

  @ApiProperty({ 
    description: 'List of score items', 
    type: [ItemsPostScoreDto], 
  })
  items!: ItemsPostScoreDto[];
}