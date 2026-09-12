import { IsUUID, IsOptional, IsString, MaxLength, IsIn } from 'class-validator';

export class CreateOrderDto {
  @IsUUID()
  plan_id: string;

  /**
   * @deprecated El user_id se toma del JWT. Se mantiene opcional
   * solo por compatibilidad; si se envía y difiere del auth, se rechaza.
   */
  @IsOptional()
  @IsUUID()
  user_id?: string;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  referral_code?: string;

  @IsOptional()
  @IsIn(['email', 'sms', 'both', 'none'])
  contact_channel?: string;
}
