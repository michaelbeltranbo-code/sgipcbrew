import { IsOptional, IsString } from 'class-validator';

export class CreateBbtBottlingOrderDto {
  @IsOptional()
  @IsString()
  note?: string;
}