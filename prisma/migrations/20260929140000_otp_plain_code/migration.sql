-- Store OTP codes in plain text instead of hashed.
-- Any live codes are dropped; users just request a new one.
ALTER TABLE "OtpCode" DROP COLUMN "codeHash",
ADD COLUMN "code" TEXT NOT NULL;
