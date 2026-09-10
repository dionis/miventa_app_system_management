import {
  IsString,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsArray,
  IsIn,
  Min,
  MaxLength,
  Matches,
  IsInt,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreatePlanDto {
  @IsString()
  @Matches(/^[a-z0-9-]+$/, {
    message: 'key must be slug (lowercase, numbers, hyphens)',
  })
  @MaxLength(60)
  key: string;

  @IsString()
  @MaxLength(120)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsInt()
  @Min(0)
  @Type(() => Number)
  duration_months: number;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Type(() => Number)
  price: number;

  @IsOptional()
  @IsString()
  @Matches(/^[A-Z]{3}$/, { message: 'currency must be ISO 4217 (e.g. USD)' })
  currency?: string;

  @IsOptional()
  @IsIn(['normal', 'premium'])
  tier?: string;

  @IsOptional()
  @IsBoolean()
  is_enterprise?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  features?: string[];

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}

export class UpdatePlanDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  duration_months?: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Type(() => Number)
  price?: number;

  @IsOptional()
  @IsString()
  @Matches(/^[A-Z]{3}$/, { message: 'currency must be ISO 4217 (e.g. USD)' })
  currency?: string;

  @IsOptional()
  @IsIn(['normal', 'premium'])
  tier?: string;

  @IsOptional()
  @IsBoolean()
  is_enterprise?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  features?: string[];

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
