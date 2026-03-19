import {
  IsBoolean,
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateFermentationBatchDto {
  @IsNumber()
  fermenterId: number;

  @IsString()
  @IsNotEmpty()
  beerName: string;

  @IsOptional()
  @IsString()
  clientName?: string;

  @IsOptional()
  @IsNumber()
  productionId?: number;

  @IsNumber()
  @Min(1)
  volumeLiters: number;

  @IsDateString()
  startDate: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsBoolean()
  clarifierAdded?: boolean;

  @IsOptional()
  @IsBoolean()
  carbonated?: boolean;

  @IsOptional()
  @IsString()
  notes?: string;
}