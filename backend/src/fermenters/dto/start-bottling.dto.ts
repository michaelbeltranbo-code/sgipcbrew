import { Type } from 'class-transformer';
import { IsInt } from 'class-validator';

export class StartBottlingDto {
  @Type(() => Number)
  @IsInt()
  orderId: number;
}