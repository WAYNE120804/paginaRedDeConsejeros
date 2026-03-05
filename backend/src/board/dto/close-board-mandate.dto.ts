import { IsDateString } from 'class-validator';

export class CloseBoardMandateDto {
  @IsDateString()
  endDate!: string;
}
