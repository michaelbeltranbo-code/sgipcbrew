import { Type } from 'class-transformer';
import { IsInt, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateBbtKegDownDto {
  @Type(() => Number)
  @IsInt()
  @Min(0)
  kegs60: number;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  kegs50: number;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  kegs30: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  lossLiters: number;

  @IsOptional()
  @IsString()
  note?: string;
}