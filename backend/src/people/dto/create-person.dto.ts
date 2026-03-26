import { IsDateString, IsEmail, IsOptional, IsString } from 'class-validator';

export class CreatePersonDto {
  @IsString()
  studentCode!: string;

  @IsString()
  fullName!: string;

  @IsEmail()
  institutionalEmail!: string;

  @IsString()
  phone!: string;

  @IsOptional()
  @IsDateString()
  birthday?: string;

  @IsOptional()
  @IsString()
  tshirtSize?: string;

  @IsOptional()
  @IsString()
  publicDescription?: string;

  @IsOptional()
  @IsString()
  photoUrl?: string;

  @IsOptional()
  @IsString()
  instagramUrl?: string;

  @IsOptional()
  @IsString()
  instagramLabel?: string;
}
