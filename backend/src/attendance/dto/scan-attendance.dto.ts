import { IsString } from 'class-validator';

export class ScanAttendanceDto {
  @IsString()
  studentCode!: string;
}
