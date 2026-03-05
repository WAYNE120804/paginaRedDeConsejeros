import { IsEmail, IsOptional, IsString } from 'class-validator';

export class CreatePersonDto {
  @IsString()
  studentCode!: string;

  @IsString()
  fullName!: string;

  @IsEmail()
  institutionalEmail!: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  publicDescription?: string;

  @IsOptional()
  @IsString()
  photoUrl?: string;
}
