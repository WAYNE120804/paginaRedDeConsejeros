import { AttendanceSessionType } from '@prisma/client';
import { IsBoolean, IsDateString, IsEnum, IsOptional, IsString } from 'class-validator';

export class CreateAttendanceSessionDto {
  @IsEnum(AttendanceSessionType)
  type!: AttendanceSessionType;

  @IsOptional()
  @IsString()
  eventId?: string;

  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  shortDescription?: string;

  @IsDateString()
  activeFrom!: string;

  @IsDateString()
  activeUntil!: string;

  @IsBoolean()
  allowManual!: boolean;
}
