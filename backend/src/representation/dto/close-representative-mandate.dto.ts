import { IsDateString } from 'class-validator';

export class CloseRepresentativeMandateDto {
  @IsDateString()
  endDate!: string;
}
