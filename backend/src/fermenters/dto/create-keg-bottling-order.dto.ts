import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString } from 'class-validator';

export class CreateKegBottlingOrderDto {
  @Type(() => Number)
  @IsInt()
  coldRoomKegId: number;

  @Type(() => Number)
  @IsInt()
  @IsIn([60, 50, 30])
  kegSizeLiters: number;

  @IsOptional()
  @IsString()
  note?: string;
}