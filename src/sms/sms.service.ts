import { Injectable, Logger } from '@nestjs/common';

/**
 * Sends SMS messages. For now it only logs them to the console;
 * plug a real gateway (e.g. Africa's Talking, Pindo) in here later.
 */
@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);

  send(phoneNumber: string, message: string): Promise<void> {
    this.logger.log(`[SMS to ${phoneNumber}] ${message}`);
    return Promise.resolve();
  }
}
