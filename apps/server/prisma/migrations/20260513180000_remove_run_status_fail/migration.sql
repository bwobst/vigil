-- Legacy FAIL denoted "execution succeeded, condition not met" — align with execution-only RunStatus.
UPDATE "watch_runs" SET "status" = 'PASS' WHERE "status" = 'FAIL';

CREATE TYPE "RunStatus_new" AS ENUM ('PASS', 'ERROR');

ALTER TABLE "watch_runs" ALTER COLUMN "status" TYPE "RunStatus_new" USING ("status"::text::"RunStatus_new");

DROP TYPE "RunStatus";

ALTER TYPE "RunStatus_new" RENAME TO "RunStatus";
