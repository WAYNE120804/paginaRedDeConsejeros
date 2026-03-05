import { IsDateString } from 'class-validator';

export class DeactivateLeaderDto {
  @IsDateString()
  endDate!: string;
}
