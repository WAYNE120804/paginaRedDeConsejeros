import { EventSummary, EventTimeSlot } from '@/lib/types/public';

type EventWithTimeSlots = Pick<EventSummary, 'date' | 'startTime' | 'endTime' | 'timeSlots'>;

export function getEventTimeSlots(event: EventWithTimeSlots): EventTimeSlot[] {
  const baseSlots = event.timeSlots?.length
    ? event.timeSlots
    : [{ startTime: event.startTime, endTime: event.endTime, label: null }];

  return [...baseSlots].sort((a, b) => a.startTime.localeCompare(b.startTime));
}

export function getEventSlotStart(event: EventWithTimeSlots, slot: EventTimeSlot) {
  return new Date(`${event.date.slice(0, 10)}T${slot.startTime}:00`);
}

export function getEventSlotEnd(event: EventWithTimeSlots, slot: EventTimeSlot) {
  return new Date(`${event.date.slice(0, 10)}T${slot.endTime}:00`);
}

export function getEventStart(event: EventWithTimeSlots) {
  const slots = getEventTimeSlots(event);
  return getEventSlotStart(event, slots[0]);
}

export function getEventEnd(event: EventWithTimeSlots) {
  const slots = getEventTimeSlots(event);
  return getEventSlotEnd(event, slots[slots.length - 1]);
}

export function isEventCurrent(event: EventWithTimeSlots, now: Date) {
  return getEventTimeSlots(event).some((slot) => {
    const start = getEventSlotStart(event, slot);
    const end = getEventSlotEnd(event, slot);
    return now >= start && now <= end;
  });
}

export function getNextEventMoment(event: EventWithTimeSlots, now: Date) {
  for (const slot of getEventTimeSlots(event)) {
    const start = getEventSlotStart(event, slot);
    const end = getEventSlotEnd(event, slot);

    if (now <= start) return start;
    if (now >= start && now <= end) return start;
  }

  return null;
}

export function formatEventSlot(slot: EventTimeSlot) {
  const range = `${slot.startTime} - ${slot.endTime}`;
  return slot.label?.trim() ? `${slot.label}: ${range}` : range;
}
