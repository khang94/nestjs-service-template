import { Body, Controller, Headers, Logger, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { LeaderboardService } from './leaderboard.service';
import { IPostScoreResp } from '@myria/leaderboard-ts-sdk';
import { PostScoreParamsDto } from './dtos/PostScore.dto';


@Controller('leaderboard')
@ApiTags('leaderboard')
export class LeaderboardController {
  private readonly logger = new Logger(LeaderboardController.name);

  constructor(private leaderboardService: LeaderboardService) { }

  @Post('generate-keys')
  @ApiOperation({ summary: 'Generate RSA public and private keys' })  // Describes the operation
  @ApiResponse({
    status: 201,
    description: 'The RSA keys have been generated successfully.',
    schema: {
      example: {
        publicKey: '-----BEGIN PUBLIC KEY-----\nMIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQCq7h...',
        privateKey: '-----BEGIN PRIVATE KEY-----\nMIICdwIBADANBgkqhkiG9w0BAQEFAASCAmEwggJdAgEA...'
      }
    }
  })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  public generateRSAKeys() {
    this.logger.log('Generating RSA keys');

    // Generate RSA Key Pair
    const { publicKey, privateKey } = this.leaderboardService.generateKeyPairs();
    return {
      publicKey,
      privateKey,
    };
  }

  @Post('post-score')
  @ApiOperation({ summary: 'Post a new score to the leaderboard' })
  @ApiResponse({
    status: 201,
    description: 'Score posted successfully',
    schema: {
      example: {
        message: 'Scores posted successfully',
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  postScore(@Body() postNewScoreParams: PostScoreParamsDto,
  @Headers('x-hmac') hmac: string,
  @Headers('encrypted-api-key') encryptedApiKey: string): Promise<IPostScoreResp[]> {
    this.logger.log(`Posting scores for leaderboardId: ${postNewScoreParams.leaderboardId}`);

    // 1. Pre-validate post score
    const data = this.leaderboardService.preValidatePostScore(encryptedApiKey, hmac, postNewScoreParams);
    

    // 2. Use decrypted api key for post score
    const postScoreResponse = this.leaderboardService.postScore(postNewScoreParams, data.decryptedApiKey);

    return postScoreResponse;
  }

  @Post('generate-post-score-hmac')
  @ApiOperation({ summary: 'Post a new score to the leaderboard' })
  @ApiResponse({
    status: 201,
    description: 'Score posted successfully',
    schema: {
      example: {
        message: 'Generate post score hmac successfully',
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  generatePostScoreHmac(@Body() postNewScoreParams: PostScoreParamsDto, @Headers('developerApiKey') developerApiKey: string) {
    this.logger.log(`Posting scores for leaderboardId: ${postNewScoreParams.leaderboardId}`);

    const { encryptedApiKey, hmac, postScorePayload } = this.leaderboardService.generateHmacAndEncryptApiKey(developerApiKey, postNewScoreParams);

    return {
      hmac,
      encryptedApiKey,
      postScorePayload,
    };

  }
}
