import { Transform } from 'class-transformer';

// Rwandan mobile numbers in E.164 form: +2507XXXXXXXX
// (MTN uses 078/079, Airtel 072/073.)
export const RWANDA_PHONE_REGEX = /^\+2507\d{8}$/;
export const RWANDA_PHONE_MESSAGE =
  'phoneNumber must be a Rwandan mobile number, e.g. 0781234567 or +250781234567';

/**
 * Accepts the common ways people write a Rwandan number and returns +2507XXXXXXXX:
 * +250781234567, 00250781234567, 250781234567, 0781234567, 781234567,
 * with or without spaces, dashes, dots or brackets.
 * Returns the input unchanged if it is not recognisable, so validation rejects it.
 */
export function normaliseRwandaPhone(input: unknown): unknown {
  if (typeof input !== 'string') return input;
  const compact = input.replace(/[\s\-.()]/g, '');
  const match = /^(?:\+250|00250|250|0)?(7\d{8})$/.exec(compact);
  return match ? `+250${match[1]}` : input;
}

/** Use on DTO fields before the phone regex check. */
export const NormalisePhone = () =>
  Transform(({ value }) => normaliseRwandaPhone(value));
