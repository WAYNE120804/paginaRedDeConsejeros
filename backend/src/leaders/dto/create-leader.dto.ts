import { IsDateString, IsOptional, IsString } from 'class-validator';

export class CreateLeaderDto {
  @IsString()
  personId!: string;

  @IsString()
  faculty!: string;

  @IsString()
  program!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsDateString()
  startDate!: string;
}
