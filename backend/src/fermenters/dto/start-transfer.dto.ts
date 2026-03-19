import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class StartTransferDto {
  @IsNumber()
  batchId: number;

  @IsNumber()
  fermenterId: number;

  

  @IsOptional()
  @IsString()
  destinationType?: string;

  @IsOptional()
  @IsString()
  note?: string;
}