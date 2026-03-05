-- DropForeignKey
ALTER TABLE "event_photos" DROP CONSTRAINT "event_photos_event_id_fkey";

-- AddForeignKey
ALTER TABLE "event_photos" ADD CONSTRAINT "event_photos_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
