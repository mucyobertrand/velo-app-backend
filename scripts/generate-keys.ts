/**
 * Generates an Ed25519 keypair for signing reports and prints the two env
 * lines to add to your .env:
 *
 *   npx ts-node --transpile-only scripts/generate-keys.ts
 *
 * Keep REPORT_PRIVATE_KEY_B64 secret. Publish REPORT_PUBLIC_KEY_B64 freely so
 * anyone can verify a report signature themselves.
 */
import { generateKeyPairSync } from 'crypto';

const { publicKey, privateKey } = generateKeyPairSync('ed25519');
const privPem = privateKey.export({ type: 'pkcs8', format: 'pem' }).toString();
const pubPem = publicKey.export({ type: 'spki', format: 'pem' }).toString();

const b64 = (s: string) => Buffer.from(s).toString('base64');

console.log('# Add these to your .env (private key stays secret):');
console.log(`REPORT_PRIVATE_KEY_B64="${b64(privPem)}"`);
console.log(`REPORT_PUBLIC_KEY_B64="${b64(pubPem)}"`);
