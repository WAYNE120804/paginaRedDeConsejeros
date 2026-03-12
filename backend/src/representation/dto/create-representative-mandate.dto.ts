import { IsDateString, IsOptional, IsString } from 'class-validator';

export class CreateRepresentativeMandateDto {
  @IsString()
  personId!: string;

  @IsString()
  estateType!: string;

  @IsString()
  faculty!: string;

  @IsString()
  program!: string;

  @IsDateString()
  startDate!: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  tshirtSize?: string;
}
