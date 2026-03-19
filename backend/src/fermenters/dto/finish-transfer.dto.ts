import { IsInt, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class FinishTransferDto {
  @Type(() => Number)
  @IsInt()
  transferId: number;

  @IsOptional()
  @IsString()
  note?: string;
}