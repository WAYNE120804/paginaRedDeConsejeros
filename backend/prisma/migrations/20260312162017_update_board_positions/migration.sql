/*
  Warnings:

  - The values [SECRETARIO,VOCAL] on the enum `BoardPosition` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "BoardPosition_new" AS ENUM ('PRESIDENTE', 'VICEPRESIDENTE', 'FISCAL', 'SECRETARIA_GENERAL', 'DIRECTOR_PLANEACION', 'JEFE_COMUNICACIONES');
ALTER TABLE "board_mandates" ALTER COLUMN "position" TYPE "BoardPosition_new" USING ("position"::text::"BoardPosition_new");
ALTER TYPE "BoardPosition" RENAME TO "BoardPosition_old";
ALTER TYPE "BoardPosition_new" RENAME TO "BoardPosition";
DROP TYPE "BoardPosition_old";
COMMIT;
