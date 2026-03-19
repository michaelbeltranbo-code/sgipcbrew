import {
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateFermentationEventDto {
  @IsNumber()
  batchId: number;

  @IsString()
  @IsNotEmpty()
  type: string;

  @IsDateString()
  performedAt: string;

  @IsString()
  @IsNotEmpty()
  responsible: string;

  @IsOptional()
  @IsString()
  productName?: string;

  @IsOptional()
  @IsNumber()
  quantity?: number;

  @IsOptional()
  @IsString()
  unit?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}