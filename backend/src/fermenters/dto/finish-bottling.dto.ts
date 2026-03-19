import { Type } from 'class-transformer';
import { IsInt, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class FinishBottlingDto {
  @Type(() => Number)
  @IsInt()
  orderId: number;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  units330: number;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  units269: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  lossLiters: number;

  @IsOptional()
  @IsString()
  note?: string;
}