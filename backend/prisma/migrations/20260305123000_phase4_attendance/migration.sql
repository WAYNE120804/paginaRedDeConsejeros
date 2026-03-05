-- CreateEnum
CREATE TYPE "AttendanceSessionType" AS ENUM ('ASSEMBLY', 'BOARD', 'EVENT');

-- CreateEnum
CREATE TYPE "AttendanceMode" AS ENUM ('QR', 'MANUAL');

-- CreateTable
CREATE TABLE "attendance_sessions" (
    "id" TEXT NOT NULL,
    "type" "AttendanceSessionType" NOT NULL,
    "event_id" TEXT,
    "name" TEXT NOT NULL,
    "short_description" TEXT,
    "token" TEXT NOT NULL,
    "active_from" TIMESTAMP(3) NOT NULL,
    "active_until" TIMESTAMP(3) NOT NULL,
    "allow_manual" BOOLEAN NOT NULL DEFAULT false,
    "created_by_admin_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "attendance_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attendance_records" (
    "id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "person_id" TEXT NOT NULL,
    "mode" "AttendanceMode" NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "note" TEXT,
    "recorded_by_admin_id" TEXT,

    CONSTRAINT "attendance_records_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "attendance_sessions_token_key" ON "attendance_sessions"("token");

-- CreateIndex
CREATE INDEX "attendance_sessions_event_id_idx" ON "attendance_sessions"("event_id");

-- CreateIndex
CREATE INDEX "attendance_sessions_created_by_admin_id_idx" ON "attendance_sessions"("created_by_admin_id");

-- CreateIndex
CREATE UNIQUE INDEX "attendance_records_session_id_person_id_key" ON "attendance_records"("session_id", "person_id");

-- CreateIndex
CREATE INDEX "attendance_records_session_id_idx" ON "attendance_records"("session_id");

-- CreateIndex
CREATE INDEX "attendance_records_person_id_idx" ON "attendance_records"("person_id");

-- AddForeignKey
ALTER TABLE "attendance_sessions" ADD CONSTRAINT "attendance_sessions_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance_sessions" ADD CONSTRAINT "attendance_sessions_created_by_admin_id_fkey" FOREIGN KEY ("created_by_admin_id") REFERENCES "admin_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance_records" ADD CONSTRAINT "attendance_records_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "attendance_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance_records" ADD CONSTRAINT "attendance_records_person_id_fkey" FOREIGN KEY ("person_id") REFERENCES "people"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance_records" ADD CONSTRAINT "attendance_records_recorded_by_admin_id_fkey" FOREIGN KEY ("recorded_by_admin_id") REFERENCES "admin_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
