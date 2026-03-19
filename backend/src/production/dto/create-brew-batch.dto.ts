import {
  IsArray,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";
import { KitchenStatus } from "../production-kitchen-status.enum";

class MaltDto {
  @IsNumber()
  rawMaterialId: number;

  @IsNumber()
  @Min(0)
  quantityKg: number;

  @IsOptional()
  @IsString()
  lot?: string;
}

class HopDto {
  @IsNumber()
  rawMaterialId: number;

  @IsNumber()
  @Min(0)
  quantityGrams: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  boilMinute?: number;
}

class AdjunctDto {
  @IsNumber()
  rawMaterialId: number;

  @IsNumber()
  @Min(0)
  quantityKg: number;

  @IsOptional()
  @IsString()
  additionMoment?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreateBrewBatchDto {
  @IsString()
  @IsNotEmpty()
  beerName: string;

  

  

  @IsNumber()
  clientId: number;

  @IsEnum(KitchenStatus)
  kitchenStatus: KitchenStatus;

  @IsNumber()
  initialPh: number;

  @IsNumber()
  initialDensity: number;

  @IsNumber()
  @Min(0)
  boilLiters: number;

  @IsNumber()
  @Min(0)
  postBoilLiters: number;

  @IsDateString()
  producedAt: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MaltDto)
  malts: MaltDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => HopDto)
  hops: HopDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AdjunctDto)
  adjuncts?: AdjunctDto[];

  @IsOptional()
  @IsNumber()
  plannedFermenterId?: number;
}