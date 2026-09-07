import { IsString, IsEmail, IsOptional, IsBoolean } from 'class-validator';

export class CreateReferrerDto {
  @IsString()
  full_name: string;

  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  bank_account_number?: string;

  @IsOptional()
  @IsString()
  bank_name?: string;
}

export class UpdateReferrerDto {
  @IsOptional()
  @IsString()
  full_name?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  bank_account_number?: string;

  @IsOptional()
  @IsString()
  bank_name?: string;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
