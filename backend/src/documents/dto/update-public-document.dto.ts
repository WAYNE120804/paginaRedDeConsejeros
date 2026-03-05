import { PublicDocumentCategory, PublicDocumentStatus } from '@prisma/client';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export class UpdatePublicDocumentDto {
  @IsOptional()
  @IsEnum(PublicDocumentCategory)
  category?: PublicDocumentCategory;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  publishedAt?: string;

  @IsOptional()
  @IsEnum(PublicDocumentStatus)
  status?: PublicDocumentStatus;
}
