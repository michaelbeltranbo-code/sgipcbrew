import { IsEnum } from 'class-validator';
import { BbtStatus } from '../bbt-status.enum';

export class UpdateBbtStatusDto {
  @IsEnum(BbtStatus)
  status: BbtStatus;
}