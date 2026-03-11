import { NewsStatus } from '@prisma/client';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export class CreateNewsDto {
  @IsOptional()
  @IsString()
  slug?: string;

  @IsString()
  title!: string;

  @IsString()
  content!: string;

  @IsEnum(NewsStatus)
  status!: NewsStatus;

  @IsOptional()
  @IsString()
  publishedAt?: string;
}
