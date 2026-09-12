import { IsUUID, IsOptional, IsEmail, IsString, MaxLength, IsIn } from 'class-validator';

export class GuestCreateOrderDto {
  @IsUUID()
  plan_id: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  phone?: string;

  @IsOptional()
  @IsIn(['email', 'sms', 'both', 'none'])
  contact_channel?: string;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  referral_code?: string;
}
