import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateColdRoomOutputItemDto {
  @IsIn(['KEG', 'PACKAGE'])
  itemType: 'KEG' | 'PACKAGE';

  @IsOptional()
  @IsInt()
  sourceColdRoomKegId?: number;

  @IsOptional()
  @IsInt()
  sourcePackagedStockId?: number;

  @IsOptional()
  @IsInt()
  kegSizeLiters?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  kegQuantity?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  units330?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  units269?: number;

  @IsOptional()
  @IsString()
  note?: string;
}

export class CreateColdRoomOutputDto {
  @IsDateString()
  outputDate: string;

  @IsString()
  destinationName: string;

  @IsIn(['CLIENTE', 'EVENTO', 'BAR', 'INTERNO'])
  destinationType: 'CLIENTE' | 'EVENTO' | 'BAR' | 'INTERNO';

  @IsOptional()
  @IsString()
  note?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateColdRoomOutputItemDto)
  items: CreateColdRoomOutputItemDto[];
}