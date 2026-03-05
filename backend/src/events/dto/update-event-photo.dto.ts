import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class UpdateEventPhotoDto {
  @IsOptional()
  @IsString()
  caption?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}
