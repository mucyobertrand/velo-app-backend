import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  createPrivateKey,
  createPublicKey,
  KeyObject,
  sign,
  verify,
} from 'crypto';

/**
 * Signs report data with an Ed25519 private key so anyone holding the matching
 * public key can prove a report came from Velo and was not altered.
 *
 * Keys come from base64-encoded PEM in the env (REPORT_PRIVATE_KEY_B64 /
 * REPORT_PUBLIC_KEY_B64). Generate them with `npm run keys:generate`.
 */
@Injectable()
export class SigningService {
  private readonly logger = new Logger(SigningService.name);
  private readonly privateKey: KeyObject;
  readonly publicKeyPem: string;

  constructor(config: ConfigService) {
    const privB64 = config.get<string>('REPORT_PRIVATE_KEY_B64');
    const pubB64 = config.get<string>('REPORT_PUBLIC_KEY_B64');
    if (!privB64 || !pubB64) {
      throw new Error(
        'REPORT_PRIVATE_KEY_B64 / REPORT_PUBLIC_KEY_B64 are not set. Run: npm run keys:generate',
      );
    }
    const privPem = Buffer.from(privB64, 'base64').toString('utf8');
    this.publicKeyPem = Buffer.from(pubB64, 'base64').toString('utf8');
    this.privateKey = createPrivateKey(privPem);
    // Fail fast if the public key does not parse.
    createPublicKey(this.publicKeyPem);
  }

  /** Returns a base64 Ed25519 signature over the given message. */
  sign(message: string): string {
    return sign(null, Buffer.from(message, 'utf8'), this.privateKey).toString(
      'base64',
    );
  }

  /** Verifies a base64 signature produced by `sign`. */
  verify(message: string, signatureB64: string): boolean {
    try {
      return verify(
        null,
        Buffer.from(message, 'utf8'),
        createPublicKey(this.publicKeyPem),
        Buffer.from(signatureB64, 'base64'),
      );
    } catch {
      return false;
    }
  }
}
