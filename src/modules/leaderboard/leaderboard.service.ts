import { APIResponseType, InitLeaderboardParams, IPostScoreParams, IPostScoreResp, LeaderboardManager } from '@myria/leaderboard-ts-sdk';
import { Injectable, InternalServerErrorException, Logger, UnauthorizedException, UnprocessableEntityException } from '@nestjs/common';
import * as crypto from 'crypto';
import { EnvTypes } from 'myria-core-sdk';
import { PostScoreParamsDto } from './dtos/PostScore.dto';

const PUBLIC_KEY = "-----BEGIN RSA PUBLIC KEY-----\...\n-----END RSA PUBLIC KEY-----\n";
const PRIVATE_KEY = "-----BEGIN RSA PRIVATE KEY-----\n...\n-----END RSA PRIVATE KEY-----\n"

@Injectable()
export class LeaderboardService {
  private readonly logger = new Logger(LeaderboardService.name);

  public async getAllScoreByLeaderboard() { }

  public async getScoreByPlayer() { }

  public generateKeyPairs(): { publicKey, privateKey } {
    // Generate RSA Key Pair
    const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048, // key length in bits
      publicKeyEncoding: {
        type: 'pkcs1',
        format: 'pem',
      },
      privateKeyEncoding: {
        type: 'pkcs1',
        format: 'pem',
      },
    });

    // Log and return the keys
    this.logger.log('RSA keys generated successfully');
    return {
      publicKey,
      privateKey,
    };
  }

  public async postScore(postNewScoreParamsDto: PostScoreParamsDto, developerApiKey: string): Promise<IPostScoreResp[]> {
    const leaderboardParams: InitLeaderboardParams = {
      env: EnvTypes.STAGING,
      apiKey: developerApiKey,
    };

    const leaderboardManager = new LeaderboardManager(leaderboardParams);

    // Map PostScoreParamsDto to IPostScoreParams
    const postNewScoreParams: IPostScoreParams = {
      leaderboardId: postNewScoreParamsDto.leaderboardId,
      items: postNewScoreParamsDto.items.map(item => ({
        score: item.score,
        displayName: item.displayName || '',
        userId: item.userId || '',
        username: item.username || '',
      })),
    };

    let postScoreResponse: APIResponseType<IPostScoreResp[]>;
    try {
      postScoreResponse = await leaderboardManager.postScoreByLeaderboardId(postNewScoreParams);
    } catch (ex) {
      throw new InternalServerErrorException("Failed to post score to leaderboard, check details error: ", JSON.stringify(ex));
    }


    return postScoreResponse.data;
  }

  // Encrypt the API key using the public key
  private encryptApiKey(apiKey: string, publicKey: string): string {
    const buffer = Buffer.from(apiKey, 'utf-8');
    const encrypted = crypto.publicEncrypt(publicKey, buffer);
    return encrypted.toString('base64');
  }

  // Decrypt the API key using the private key
  private decryptApiKey(encryptedApiKey: string, privateKey: string): string {
    const buffer = Buffer.from(encryptedApiKey, 'base64');
    const decrypted = crypto.privateDecrypt(privateKey, buffer);
    return decrypted.toString('utf-8');
  }

  // Utility function to generate HMAC using the decrypted API key
  private generateHmac(payload: string, secret: string): string {
    return crypto.createHmac('sha256', secret).update(payload).digest('hex');
  }

  public preValidatePostScore(encryptedApiKey: string, hmacPayload: string, postScoreParams: PostScoreParamsDto): { decryptedApiKey: string } {
    // 1. Decrypt the API key using the private key
    const apiKey = this.decryptApiKey(encryptedApiKey, PRIVATE_KEY);
    this.logger.log(`Decrypted API Key: ${apiKey}`);

    // 2. Generate HMAC for the payload using the decrypted API key
    const payloadString = JSON.stringify(postScoreParams);
    const generatedHmac = this.generateHmac(payloadString, apiKey);
    this.logger.log(`Generated HMAC: ${generatedHmac}`);

    // 3. Compare the generated HMAC with the one provided in the headers
    if (generatedHmac !== hmacPayload) {
      this.logger.error(`Invalid HMAC: Provided HMAC ${hmacPayload} does not match generated HMAC ${generatedHmac}`);
      throw new UnauthorizedException('Invalid HMAC');
    }

    return {
      decryptedApiKey: apiKey
    }
  }

  public generateHmacAndEncryptApiKey(apiKey: string, postScoreParams: PostScoreParamsDto): {
    encryptedApiKey: string,
    hmac: string,
    postScorePayload: PostScoreParamsDto
  } {

    // 1. Encrypt API key using public key
    const encryptedApiKey = this.encryptApiKey(apiKey, PUBLIC_KEY);
    this.logger.log(`Encrypted API Key: ${encryptedApiKey}`);

    // 2. Generate HMAC for the payload
    const payloadString = JSON.stringify(postScoreParams);
    const secret = apiKey;
    const hmac = crypto.createHmac('sha256', secret).update(payloadString).digest('hex');
    this.logger.log(`Generated HMAC: ${hmac}`);



    return {
      encryptedApiKey,
      hmac,
      postScorePayload: postScoreParams
    }
  }
}
