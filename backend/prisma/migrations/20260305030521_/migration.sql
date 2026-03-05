-- DropForeignKey
ALTER TABLE "attendance_records" DROP CONSTRAINT "attendance_records_session_id_fkey";

-- DropForeignKey
ALTER TABLE "event_photos" DROP CONSTRAINT "event_photos_event_id_fkey";

-- AddForeignKey
ALTER TABLE "event_photos" ADD CONSTRAINT "event_photos_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance_records" ADD CONSTRAINT "attendance_records_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "attendance_sessions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
