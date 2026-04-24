import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class CreateKegBottlingOrderDto {
  @Type(() => Number)
  @IsInt()
  coldRoomKegId: number;

  @Type(() => Number)
  @IsInt()
  @IsIn([60, 50, 30])
  kegSizeLiters: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  kegQuantity?: number;

  @IsOptional()
  @IsString()
  note?: string;
}