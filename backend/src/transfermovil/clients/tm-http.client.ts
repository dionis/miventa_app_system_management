import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import * as crypto from 'crypto';
import * as QRCode from 'qrcode';
import {
  TmPayOrderRequest,
  TmPayOrderResponse,
  TmStatusOrderResponse,
  TmRefundPayRequest,
  TmRefundPayResponse,
  TmRefundStatusResponse,
  TmInitiatePaymentResponse,
} from '../interfaces/tm-client.interface';

@Injectable()
export class TmHttpClient {
  private readonly logger = new Logger(TmHttpClient.name);
  private readonly baseUrl: string;
  private readonly username: string;
  private readonly source: string;
  private readonly seed: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.baseUrl = this.configService.get<string>('TM_WS_BASE_URL')?.replace(/\/$/, '') || '';
    this.username = this.configService.get<string>('TM_WS_USERNAME') || '';
    this.source = this.configService.get<string>('TM_WS_SOURCE') || '';
    this.seed = this.configService.get<string>('TM_WS_SEED') || '';
  }

  private generatePassword(): string {
    const now = new Date();
    const day = String(now.getUTCDate());
    const month = String(now.getUTCMonth() + 1);
    const year = String(now.getUTCFullYear());

    const raw = `${this.username}${day}${month}${year}${this.seed}${this.source}`;
    const hash = crypto.createHash('sha512').update(raw, 'utf8').digest();
    return hash.toString('base64');
  }

  private getAuthHeaders(): Record<string, string> {
    return {
      username: this.username,
      source: this.source,
      password: this.generatePassword(),
      'Content-Type': 'application/json',
    };
  }

  private async request<T>(method: 'GET' | 'POST', path: string, body?: unknown): Promise<T> {
    const url = `${this.baseUrl}/${path.replace(/^\//, '')}`;
    const headers = this.getAuthHeaders();

    this.logger.debug(`${method} ${url}`);

    try {
      const response = await firstValueFrom(
        this.httpService.request<{ data: T }>({
          method,
          url,
          headers,
          data: body,
          timeout: 30000,
          httpsAgent: false as any,
        }),
      );
      return response.data.data;
    } catch (error: any) {
      this.logger.error(`Error calling TM WS ${method} ${path}: ${error.message}`);
      if (error.response) {
        throw new HttpException(
          `TM WS Error: ${error.response.status} - ${JSON.stringify(error.response.data)}`,
          HttpStatus.BAD_GATEWAY,
        );
      }
      throw new HttpException(
        `Error conectando con Transfermóvil: ${error.message}`,
        HttpStatus.BAD_GATEWAY,
      );
    }
  }

  async payOrder(payload: TmPayOrderRequest): Promise<TmPayOrderResponse> {
    return this.request<TmPayOrderResponse>('POST', 'payOrder', { request: payload });
  }

  async getStatusOrder(externalId: string, source: number): Promise<TmStatusOrderResponse> {
    return this.request<TmStatusOrderResponse>('GET', `getStatusOrder/${externalId}/${source}`);
  }

  async refundPay(payload: TmRefundPayRequest): Promise<TmRefundPayResponse> {
    return this.request<TmRefundPayResponse>('POST', 'refundPay', { request: payload });
  }

  async getStatusRefundOrder(refundId: string, source: number): Promise<TmRefundStatusResponse> {
    return this.request<TmRefundStatusResponse>('GET', `getStatusRefundOrder/${refundId}/${source}`);
  }

  private async generateQrBase64(qrData: object): Promise<string> {
    const jsonPayload = JSON.stringify(qrData);
    return QRCode.toDataURL(jsonPayload, {
      width: 300,
      margin: 2,
      color: { dark: '#000000', light: '#FFFFFF' },
      errorCorrectionLevel: 'M',
    });
  }

  async initiatePayment(paymentData: {
    amount: number;
    currency: string;
    description: string;
    externalId: string;
    source: number;
    notifyUrl: string;
    validTime: number;
  }): Promise<TmInitiatePaymentResponse> {
    const tmResponse = await this.payOrder({
      Amount: paymentData.amount,
      Currency: paymentData.currency,
      Description: paymentData.description,
      ExternalId: paymentData.externalId,
      Source: paymentData.source,
      UrlResponse: paymentData.notifyUrl,
      ValidTime: paymentData.validTime,
    });

    if (!tmResponse.PayOrderResult.Success) {
      throw new HttpException(
        `TM PayOrder failed: ${tmResponse.PayOrderResult.Resultmsg}`,
        HttpStatus.BAD_GATEWAY,
      );
    }

    const qrData = {
      id_transaccion: paymentData.externalId,
      importe: paymentData.amount,
      moneda: paymentData.currency,
      numero_proveedor: paymentData.source,
      version: '',
    };

    const qrCodeBase64 = await this.generateQrBase64(qrData);

    return {
      qr_code: qrCodeBase64,
      tm_order_id: tmResponse.PayOrderResult.OrderId || 0,
      transaction_ref: paymentData.externalId,
      qr_data: qrData,
    };
  }
}