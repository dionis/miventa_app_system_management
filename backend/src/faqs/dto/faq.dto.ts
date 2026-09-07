import { IsString, IsOptional, IsBoolean, IsInt } from 'class-validator';

export class CreateFaqDto {
  @IsString()
  question: string;

  @IsString()
  answer: string;

  @IsOptional()
  @IsInt()
  sort_order?: number;

  @IsOptional()
  @IsBoolean()
  is_published?: boolean;
}

export class UpdateFaqDto {
  @IsOptional()
  @IsString()
  question?: string;

  @IsOptional()
  @IsString()
  answer?: string;

  @IsOptional()
  @IsInt()
  sort_order?: number;

  @IsOptional()
  @IsBoolean()
  is_published?: boolean;
}
