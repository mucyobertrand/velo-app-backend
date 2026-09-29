import { ConfigService } from '@nestjs/config';
import { generateKeyPairSync } from 'crypto';
import { SigningService } from './signing.service';

function keyEnv() {
  const { publicKey, privateKey } = generateKeyPairSync('ed25519');
  return {
    REPORT_PRIVATE_KEY_B64: Buffer.from(
      privateKey.export({ type: 'pkcs8', format: 'pem' }).toString(),
    ).toString('base64'),
    REPORT_PUBLIC_KEY_B64: Buffer.from(
      publicKey.export({ type: 'spki', format: 'pem' }).toString(),
    ).toString('base64'),
  };
}

function serviceWith(env: Record<string, string>) {
  return new SigningService({
    get: (k: string) => env[k],
  } as unknown as ConfigService);
}

describe('SigningService', () => {
  it('verifies a signature it produced', () => {
    const svc = serviceWith(keyEnv());
    const sig = svc.sign('report-payload');
    expect(svc.verify('report-payload', sig)).toBe(true);
  });

  it('rejects a tampered message (forgery attempt)', () => {
    const svc = serviceWith(keyEnv());
    const sig = svc.sign('veloScore:720');
    expect(svc.verify('veloScore:900', sig)).toBe(false);
  });

  it('rejects a garbage signature', () => {
    const svc = serviceWith(keyEnv());
    expect(svc.verify('report-payload', 'not-a-real-signature')).toBe(false);
  });

  it('cannot be verified with a different keypair', () => {
    const signer = serviceWith(keyEnv());
    const attacker = serviceWith(keyEnv());
    const sig = signer.sign('report-payload');
    // A signature from one private key does not verify under another public key.
    expect(attacker.verify('report-payload', sig)).toBe(false);
  });

  it('throws if keys are missing', () => {
    expect(() => serviceWith({})).toThrow(/keys:generate/);
  });
});
