import { AttendanceSessionType } from '@prisma/client';
import { IsDateString, IsEnum, IsOptional, IsString } from 'class-validator';

export class ListAttendanceSessionsQueryDto {
  @IsOptional()
  @IsString()
  q?: string;

  @IsOptional()
  @IsString()
  eventId?: string;

  @IsOptional()
  @IsEnum(AttendanceSessionType)
  type?: AttendanceSessionType;

  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  to?: string;
}
