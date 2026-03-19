import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString } from 'class-validator';

export class CreateBottlingOrderDto {
  @Type(() => Number)
  @IsInt()
  transferId: number;

  @IsOptional()
  @IsString()
  note?: string;
}