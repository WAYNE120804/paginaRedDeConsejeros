-- CreateEnum
CREATE TYPE "MandateStatus" AS ENUM ('ACTIVE', 'ENDED');

-- CreateEnum
CREATE TYPE "BoardPosition" AS ENUM ('PRESIDENTE', 'VICEPRESIDENTE', 'SECRETARIO', 'VOCAL');

-- CreateTable
CREATE TABLE "people" (
    "id" TEXT NOT NULL,
    "student_code" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "institutional_email" TEXT NOT NULL,
    "phone" TEXT,
    "public_description" TEXT,
    "photo_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "people_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "representative_mandates" (
    "id" TEXT NOT NULL,
    "person_id" TEXT NOT NULL,
    "estate_type" TEXT NOT NULL,
    "faculty" TEXT NOT NULL,
    "program" TEXT NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3),
    "tshirt_size" TEXT,
    "status" "MandateStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "representative_mandates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "leaders" (
    "id" TEXT NOT NULL,
    "person_id" TEXT NOT NULL,
    "faculty" TEXT NOT NULL,
    "program" TEXT NOT NULL,
    "description" TEXT,
    "start_date" TIMESTAMP(3) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "end_date" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "leaders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "board_mandates" (
    "id" TEXT NOT NULL,
    "person_id" TEXT NOT NULL,
    "position" "BoardPosition" NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "board_mandates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "people_student_code_key" ON "people"("student_code");

-- CreateIndex
CREATE UNIQUE INDEX "people_institutional_email_key" ON "people"("institutional_email");

-- CreateIndex
CREATE INDEX "representative_mandates_person_id_idx" ON "representative_mandates"("person_id");

-- CreateIndex
CREATE INDEX "leaders_person_id_idx" ON "leaders"("person_id");

-- CreateIndex
CREATE INDEX "board_mandates_person_id_idx" ON "board_mandates"("person_id");

-- Create partial unique indexes for active records
CREATE UNIQUE INDEX "uq_rep_active_per_person" ON "representative_mandates" ("person_id") WHERE "status" = 'ACTIVE';
CREATE UNIQUE INDEX "uq_leader_active_per_person" ON "leaders" ("person_id") WHERE "is_active" = true;

-- AddForeignKey
ALTER TABLE "representative_mandates" ADD CONSTRAINT "representative_mandates_person_id_fkey" FOREIGN KEY ("person_id") REFERENCES "people"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leaders" ADD CONSTRAINT "leaders_person_id_fkey" FOREIGN KEY ("person_id") REFERENCES "people"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "board_mandates" ADD CONSTRAINT "board_mandates_person_id_fkey" FOREIGN KEY ("person_id") REFERENCES "people"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
