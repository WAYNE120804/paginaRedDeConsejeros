import { EventType, EventVisibility } from '@prisma/client';
import { IsDateString, IsEnum, IsString, Matches } from 'class-validator';

export class CreateEventDto {
  @IsString()
  slug!: string;

  @IsString()
  title!: string;

  @IsString()
  description!: string;

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

  @IsString()
  location!: string;
}
