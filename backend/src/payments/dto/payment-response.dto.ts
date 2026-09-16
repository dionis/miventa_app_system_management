import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateOrderResponseDto {
  @ApiProperty({ example: 'uuid-payment-id' })
  payment_id: string;

  @ApiProperty({ example: 'abc123claimtoken' })
  claim_token: string;

  @ApiProperty({ example: 'TXN-ABC123DEF456' })
  transaction_ref: string;

  @ApiProperty({ example: 150.0 })
  amount: number;

  @ApiProperty({ example: 200.0 })
  amount_original: number;

  @ApiProperty({ example: 25 })
  discount_percent: number;

  @ApiProperty({ example: 'CUP' })
  currency: string;

  @ApiProperty({ example: 'Plan Premium' })
  plan_name: string;

  @ApiProperty({ example: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUg...' })
  qr_code: string;

  @ApiPropertyOptional({
    example: { id_transaccion: 'TXN-ABC123', importe: 150, moneda: 'CUP', numero_proveedor: 10, version: '' },
  })
  qr_data?: {
    id_transaccion: string;
    importe: number;
    moneda: string;
    numero_proveedor: number;
    version: string;
  };

  @ApiPropertyOptional({ example: 12345 })
  tm_order_id?: number;

  @ApiProperty({ example: 'pending', enum: ['pending', 'completed', 'failed', 'refunded'] })
  status: string;
}

export class PaymentStatusResponseDto {
  @ApiProperty({ example: 'uuid-payment-id' })
  payment_id: string;

  @ApiProperty({ example: 'TXN-ABC123DEF456' })
  transaction_ref: string;

  @ApiProperty({ example: 150.0 })
  amount: number;

  @ApiProperty({ example: 'CUP' })
  currency: string;

  @ApiProperty({ example: 'pending', enum: ['pending', 'completed', 'failed', 'refunded'] })
  status: string;

  @ApiPropertyOptional({ example: 'Plan Premium' })
  plan_name?: string;

  @ApiPropertyOptional()
  license?: {
    license_key: string;
    license_type: string;
    pos_count: number;
    days: number;
    emailed_at?: string;
  } | null;

  @ApiPropertyOptional({ example: 'REF-XXXXXX' })
  referral_code?: string;

  @ApiPropertyOptional({ example: 10 })
  discount_percent?: number;

  @ApiPropertyOptional({ example: 150.0 })
  amount_original?: number;
}

export class NotifyResponseDto {
  @ApiProperty({ example: true })
  emailed: boolean;

  @ApiProperty({ example: false })
  smsSent: boolean;

  @ApiPropertyOptional({ example: 'user@email.com' })
  toEmail?: string | null;

  @ApiPropertyOptional({ example: '+5351234567' })
  toPhone?: string | null;

  @ApiProperty({ example: 'email', enum: ['email', 'sms', 'both', 'none'] })
  channel: string;

  @ApiPropertyOptional({ example: 'Email sent successfully' })
  emailReason?: string;

  @ApiPropertyOptional({ example: 'SMS sent successfully' })
  smsReason?: string;
}

export class SimulateResponseDto {
  @ApiProperty({ example: 'completed' })
  status: string;

  @ApiProperty({ example: 'uuid-payment-id' })
  payment_id: string;

  @ApiPropertyOptional({ example: 'LIC-KEY-12345' })
  license_key?: string | null;

  @ApiPropertyOptional()
  license?: any;

  @ApiPropertyOptional({ example: 'license-pending' })
  licenseError?: string;

  @ApiPropertyOptional({ example: 'License generation in progress' })
  licenseReason?: string;

  @ApiPropertyOptional({ example: 'uuid-user-id' })
  user_id?: string;

  @ApiPropertyOptional({ example: true })
  account_created?: boolean;

  @ApiPropertyOptional({ example: false })
  reused?: boolean;
}

export class PublicStatusResponseDto {
  @ApiProperty({ example: 'uuid-payment-id' })
  payment_id: string;

  @ApiProperty({ example: 'pending', enum: ['pending', 'completed', 'failed', 'refunded'] })
  status: string;

  @ApiProperty({ example: 150.0 })
  amount: number;

  @ApiProperty({ example: 200.0 })
  amount_original: number;

  @ApiProperty({ example: 25 })
  discount_percent: number;

  @ApiProperty({ example: 'CUP' })
  currency: string;

  @ApiProperty({ example: 'TXN-ABC123DEF456' })
  transaction_ref: string;

  @ApiPropertyOptional({ example: 'REF-XXXXXX' })
  referral_code?: string;

  @ApiPropertyOptional()
  license?: {
    license_key: string;
    license_type: string;
    pos_count: number;
    days: number;
  } | null;
}

export class TmInitiateResponseDto {
  @ApiProperty({ example: '{"id_transaccion":"TXN-ABC123","importe":150,"moneda":"CUP","numero_proveedor":10,"version":""}' })
  qr_code: string;

  @ApiProperty({ example: 12345 })
  tm_order_id: number;

  @ApiProperty({ example: 'TXN-ABC123DEF456' })
  transaction_ref: string;

  @ApiProperty({
    example: { id_transaccion: 'TXN-ABC123', importe: 150, moneda: 'CUP', numero_proveedor: 10, version: '' },
  })
  qr_data: {
    id_transaccion: string;
    importe: number;
    moneda: string;
    numero_proveedor: number;
    version: string;
  };
}

export class TmStatusResponseDto {
  @ApiProperty({ example: '1', enum: ['1', '0', '-1'] })
  status: string;

  @ApiProperty({ example: 'uuid-payment-id' })
  payment_id: string;
}

export class WebhookResponseDto {
  @ApiProperty({ example: true })
  success: boolean;
}