import { normaliseRwandaPhone, RWANDA_PHONE_REGEX } from './phone';

describe('normaliseRwandaPhone', () => {
  it.each([
    ['+250781234567', '+250781234567'],
    ['00250781234567', '+250781234567'],
    ['250798765432', '+250798765432'],
    ['0722111222', '+250722111222'],
    ['733444555', '+250733444555'],
    ['+250 78 123 4567', '+250781234567'],
    ['078-123-4567', '+250781234567'],
  ])('%s -> %s', (input, expected) => {
    expect(normaliseRwandaPhone(input)).toBe(expected);
  });

  it.each(['12345', '+254712345678', '0881234567', '07812345678'])(
    'leaves %s invalid',
    (input) => {
      expect(RWANDA_PHONE_REGEX.test(String(normaliseRwandaPhone(input)))).toBe(
        false,
      );
    },
  );
});
