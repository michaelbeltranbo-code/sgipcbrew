import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { BbtProcessType } from '../bbt-process-type.enum';

export class CreateBbtTransferDto {
  @Type(() => Number)
  @IsNumber()
  fermenterId: number;

  @Type(() => Number)
  @IsNumber()
  bbtId: number;

  @IsEnum(BbtProcessType)
  processType: BbtProcessType;

  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  litersTransferred: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  lossLiters: number;

  @IsOptional()
  @IsString()
  notes?: string;
}