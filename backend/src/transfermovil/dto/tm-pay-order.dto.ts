import { IsNumber, IsString, IsOptional, Min, Max, MaxLength, IsUrl } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class TmPayOrderDto {
  @ApiProperty({ example: 150.0, description: 'Monto de la operación' })
  @IsNumber()
  @Min(0.01)
  Amount: number;

  @ApiProperty({ example: 'CUP', description: 'Moneda de la operación', default: 'CUP' })
  @IsString()
  @IsOptional()
  Currency?: string = 'CUP';

  @ApiProperty({ example: 'Compra plan Premium', description: 'Descripción de la operación', required: false })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  Description?: string = '';

  @ApiProperty({ example: 'ORD12345', description: 'ID de transacción del comercio (máx 12 chars)' })
  @IsString()
  @MaxLength(12)
  ExternalId: string;

  @ApiProperty({ example: 10, description: 'Identificador de entidad (Source)' })
  @IsNumber()
  Source: number;

  @ApiProperty({ example: 'http://192.168.1.100:3000/api/payments/webhook/tm/notification', description: 'URL de notificación (IP directa, no DNS)' })
  @IsString()
  @IsUrl()
  UrlResponse: string;

  @ApiProperty({ example: 600, description: 'Tiempo de validez en segundos (0 = sin límite)', default: 0 })
  @IsNumber()
  @IsOptional()
  @Min(0)
  ValidTime?: number = 0;
}

export class TmRefundPayDto {
  @ApiProperty({ example: 'REF001', description: 'ID de devolución del comercio (máx 20 chars)' })
  @IsString()
  @MaxLength(20)
  RefundID: string;

  @ApiProperty({ example: 10, description: 'Identificador de entidad' })
  @IsNumber()
  Source: number;

  @ApiProperty({ example: '', description: 'Datos encriptados (opcional)', required: false })
  @IsString()
  @IsOptional()
  @MaxLength(512)
  Code?: string = '';

  @ApiProperty({ example: 'http://192.168.1.100:3000/api/payments/webhook/tm/refund', description: 'URL de notificación para la devolución' })
  @IsString()
  @IsUrl()
  UrlResponse: string;

  @ApiProperty({ example: 1, description: 'Número de banco' })
  @IsNumber()
  Bank: number;
}

export class TmWebhookNotificationDto {
  @ApiProperty({ example: '10' })
  @IsString()
  Source: string;

  @ApiProperty({ example: 'BANK001' })
  @IsString()
  BankId: string;

  @ApiProperty({ example: 'TM123456' })
  @IsString()
  TmId: string;

  @ApiProperty({ example: '+5351234567', required: false })
  @IsString()
  @IsOptional()
  Phone?: string = '';

  @ApiProperty({ example: 'ORD12345' })
  @IsString()
  ExternalId: string;

  @ApiProperty({ example: '1', enum: ['1', '0', '-1'], description: '1=exitoso, 0=pendiente, -1=fallido' })
  @IsString()
  Status: string;

  @ApiProperty({ example: '1' })
  Bank: string | number;

  @ApiPropertyOptional({ example: 'Pago procesado correctamente' })
  @IsString()
  @IsOptional()
  Msg?: string;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  OrderAmount?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  AmountPaid?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  AmountCredited?: number;
}

export class TmRefundWebhookNotificationDto {
  @ApiProperty({ example: 'REF001' })
  @IsString()
  RefundID: string;

  @ApiPropertyOptional({ example: 'REF001' })
  @IsString()
  @IsOptional()
  ReferenceRefund?: string = '';

  @ApiPropertyOptional({ example: 'TMREF123' })
  @IsString()
  @IsOptional()
  ReferenceRefundTM?: string = '';

  @ApiProperty({ example: 'true', enum: ['true', 'false'] })
  @IsString()
  Success: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  Resultmsg?: string = '';

  @ApiProperty({ example: 1 })
  @IsNumber()
  Status: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  ExternalID?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  BankId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  TmId?: string;
}