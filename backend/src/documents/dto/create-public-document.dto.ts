import { PublicDocumentCategory, PublicDocumentStatus } from '@prisma/client';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export class CreatePublicDocumentDto {
  @IsEnum(PublicDocumentCategory)
  category!: PublicDocumentCategory;

  @IsString()
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  publishedAt!: string;

  @IsOptional()
  @IsEnum(PublicDocumentStatus)
  status?: PublicDocumentStatus;
}
