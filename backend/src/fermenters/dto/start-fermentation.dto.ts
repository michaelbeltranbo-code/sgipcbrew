import { IsNotEmpty, IsNumber, IsString, Min } from 'class-validator';

export class StartFermentationDto {
  @IsNumber()
  batchId: number;

  @IsNumber()
  fermenterId: number;

  

  @IsNumber()
  @Min(0)
  brewedLiters: number;
}