import { BoardPosition } from '@prisma/client';
import { IsDateString, IsEnum, IsString } from 'class-validator';

export class CreateBoardMandateDto {
  @IsString()
  personId!: string;

  @IsEnum(BoardPosition)
  position!: BoardPosition;

  @IsDateString()
  startDate!: string;
}
