import {
  IsDateString,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateReadingDto {
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
  liters?: number | null;

  @IsOptional()
  @IsString()
  note?: string;

  @IsOptional()
  @IsDateString()
  recordedAt?: string;
}