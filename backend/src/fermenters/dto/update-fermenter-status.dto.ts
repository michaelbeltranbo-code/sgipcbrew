import { IsIn, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdateFermenterStatusDto {
  @IsNumber()
  fermenterId: number;

  @IsString()
  @IsIn(['vacio_sucio', 'limpio', 'sanitizado', 'disponible'])
  status: 'vacio_sucio' | 'limpio' | 'sanitizado' | 'disponible';

  @IsOptional()
  @IsString()
  note?: string;
}