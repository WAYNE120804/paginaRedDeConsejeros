import { EventType, EventVisibility } from '@prisma/client';
import { IsArray, IsDateString, IsEnum, IsOptional, IsString, Matches } from 'class-validator';

class EventTimeSlotDto {
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
  startTime!: string;

  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
  endTime!: string;

  @IsOptional()
  @IsString()
  label?: string;
}

export class CreateEventDto {
  @IsOptional()
  @IsString()
  slug?: string;

  @IsString()
  title!: string;

  @IsString()
  description!: string;

  @IsOptional()
  @IsString()
  content?: string;

  @IsEnum(EventType)
  type!: EventType;

  @IsEnum(EventVisibility)
  visibility!: EventVisibility;

  @IsDateString()
  date!: string;

  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
  startTime!: string;

  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
  endTime!: string;

  @IsOptional()
  @IsArray()
  timeSlots?: EventTimeSlotDto[];

  @IsString()
  location!: string;
}
