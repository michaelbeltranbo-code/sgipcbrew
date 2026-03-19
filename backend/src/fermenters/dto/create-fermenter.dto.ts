import { IsNotEmpty, IsNumber, IsString, Min } from 'class-validator';

export class CreateFermenterDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsNumber()
  @Min(1)
  capacityLiters: number;
}