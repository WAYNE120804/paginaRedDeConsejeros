import { IsEmail, IsOptional, IsString } from 'class-validator';

export class ScanAttendanceDto {
  @IsString()
  studentCode!: string;

  @IsOptional()
  @IsString()
  fullName?: string;

  @IsOptional()
  @IsEmail()
  institutionalEmail?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  position?: string;

  @IsOptional()
  @IsString()
  organization?: string;
}
