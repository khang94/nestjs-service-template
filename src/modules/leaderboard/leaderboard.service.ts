import { APIResponseType, InitLeaderboardParams, IPostScoreParams, IPostScoreResp, LeaderboardManager } from '@myria/leaderboard-ts-sdk';
import { Injectable, InternalServerErrorException, Logger, UnauthorizedException, UnprocessableEntityException } from '@nestjs/common';
import * as crypto from 'crypto';
import { EnvTypes } from 'myria-core-sdk';
import { PostScoreParamsDto } from './dtos/PostScore.dto';

const PUBLIC_KEY = "-----BEGIN RSA PUBLIC KEY-----\nMIIBCgKCAQEAroU4pQ8zxmpVQa3zxWLc4oXalOEbHHZmzySV1DcaJywse5VOXM6Q\ngx4YaFe/7KrKu35TNnRP7L10XU+hRhFUmPwaipF6h4FfzYEzB+qPVb/+vBiM9esU\n/XPA6no0PrAPc7d0pDWXG7+9Dp+UCxUmSDKZCOTHeLSpAuTgfTWx4SENQE817Alj\nqfqPORO7k1aHeQ/zU9/GSp0yu753zRBVyuqDvNhlRdDjKWSAP0WEHXHRwU4zLJHE\ndfDt9BXzRPgisj7upcSHfRWfATT+w+5Ac+Z/g0Csn4a+cgkJKVpvyJCLN78kdsv2\nTRqYoR06QFhAf0N7m8G597pTZl0A7qJ93QIDAQAB\n-----END RSA PUBLIC KEY-----\n";
const PRIVATE_KEY = "-----BEGIN RSA PRIVATE KEY-----\nMIIEogIBAAKCAQEAroU4pQ8zxmpVQa3zxWLc4oXalOEbHHZmzySV1DcaJywse5VO\nXM6Qgx4YaFe/7KrKu35TNnRP7L10XU+hRhFUmPwaipF6h4FfzYEzB+qPVb/+vBiM\n9esU/XPA6no0PrAPc7d0pDWXG7+9Dp+UCxUmSDKZCOTHeLSpAuTgfTWx4SENQE81\n7AljqfqPORO7k1aHeQ/zU9/GSp0yu753zRBVyuqDvNhlRdDjKWSAP0WEHXHRwU4z\nLJHEdfDt9BXzRPgisj7upcSHfRWfATT+w+5Ac+Z/g0Csn4a+cgkJKVpvyJCLN78k\ndsv2TRqYoR06QFhAf0N7m8G597pTZl0A7qJ93QIDAQABAoIBAAwJ1wo1xf/IGnj1\nH6VsSCndC2KtM4JPXZCo6KfypBxzJN9igX0P57KPuyXJdc0EzAbKdEGDnPbK69G6\n+jg73k7ORyNrXR0nTL0/jg5b/Qawf4kolWKqVHCWUUarZtqzKOG11Dc2liWdIJS3\nZ84q55Df4qQVKfhW1/jB4oVolIxfrt3eDYMA5hezs3bQeSVYsRCykL59DvR5n1UP\n0y7nlU1VVhIEq1MHe4/7i4e+JVzZ/FuU1r+ZGdcOkf8YK5pbde7IoZqIH7eJp5Cn\ndw+cjo8a3b5rpHFVm1slz3Dqq4AL8jlL7ntI/bOAvVWRGpOyNIndi1Tx99PgVLdt\nvB0QnYECgYEA2l/yuEKHG9ZVmbFwupjEtscYg+w8nMmhKczYn+S4L9IHIrC7R9on\n6lJ3TJkP031g7B+ZgGvUgXucVhuHkk3cUxSMPlimaOr8UDqgXqvs33vaOsfIap4N\n47AHD+KQYNtR0fd4rvxGlQU1009ebypcuwsvhPAsiKtyOfOBINR3r4ECgYEAzJby\nrLA10EBhoiiiDrxCipUFuQvTnEIUsWsv144JSE66YtM+8dzQMhs6TLu0Qt3bAPqk\njgiJph/H14AYGbnZEqniLWzb2dDAJ9c92GQ/fWMM4sOhbxjQZ4jDA0XKwbd3QEto\nbxh/+Qsp6InhjftPGtG/8fFCq6MOAhpzl8zFvF0CgYBSjx3LjdNYseKw9YWh9inA\n1GqvTXvo5s3YaMqpQKZl5eius9RKKO8YRs81lVSHZ4piGtxE0f+IaHxFjajmpisa\n+dS/qXJYjiaQCmohAKzQHRn3SRq7PEASCbXRyp09EQ3Q7NeiiFwC8PJVjlcsff6K\n9IKlpsufa/oGcMor6EfLgQKBgDZ8pRjUvSA/ZUE4rSBbhyU9Vw7XVX4yIyy1LUKt\nM0+sl/sl44eqlVAi7D3vZ6y/RUpXdmfVYkN6B1Efbku7sVJFKFWMvmieLe7uZiwx\nVq9gJ9hk3aOm6ioIxFckyUEaSYo4CxI7Zim/jWO/BPE5UvIDlqkq5eSsQljRDqQJ\nB0iJAoGANfdf91wR14X/P37mIxk2XWCQMl++K9liP0TiuwcnZQip5okJnRZssypv\nNwZ099Pmqiz2uG6liEIV16wCF/3o76qdG5Vtzkja2XiDOHLQLktCRJukR5ylO1JB\nuRxvnGNo7ULsgGWajOkd+SasIXVCGeQQvsLqTH1Jz6uQ+BL5Rw0=\n-----END RSA PRIVATE KEY-----\n"

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
