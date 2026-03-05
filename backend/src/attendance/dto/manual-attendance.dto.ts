import { IsEmail, IsOptional, IsString } from 'class-validator';

export class ManualAttendanceDto {
  @IsString()
  studentCode!: string;

  @IsOptional()
  @IsString()
  note?: string;

  @IsOptional()
  @IsString()
  fullName?: string;

  @IsOptional()
  @IsEmail()
  institutionalEmail?: string;
}
