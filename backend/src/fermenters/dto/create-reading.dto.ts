import {
  IsBoolean,
  IsDateString,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateReadingDto {
  @IsOptional()
  @IsNumber()
  productionId?: number;

  @IsOptional()
  @IsNumber()
  ph?: number | null;

  @IsOptional()
  @IsNumber()
  density?: number | null;

  @IsOptional()
  @IsNumber()
  temperature?: number | null;

  @IsOptional()
  @IsNumber()
  @Min(0)
  purges?: number | null;

  @IsOptional()
  @IsString()
  purgeUnit?: 'kg' | 'l';

  @IsOptional()
  @IsBoolean()
  dryHop?: boolean;

  @IsOptional()
  @IsString()
  additions?: string;

  @IsOptional()
  @IsBoolean()
  hasClarifier?: boolean;

  @IsOptional()
  @IsBoolean()
  isCarbonated?: boolean;

  @IsOptional()
  @IsString()
  note?: string;

  @IsOptional()
  @IsDateString()
  recordedAt?: string;
}