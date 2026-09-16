export interface TmPayOrderRequest {
  Amount: number;
  Currency: string;
  Description: string;
  ExternalId: string;
  Source: number;
  UrlResponse: string;
  ValidTime: number;
}

export interface TmPayOrderResult {
  Resultmsg: string;
  Success: boolean;
  OrderId: number | null;
}

export interface TmPayOrderResponse {
  PayOrderResult: TmPayOrderResult;
}

export interface TmStatusOrderResult {
  Resultmsg: string;
  Success: boolean;
  BankId: string | null;
  ExternalId: string | null;
  OrderId: string | null;
  Status: number | null;
  TmId: string | null;
  Bank: string | null;
}

export interface TmStatusOrderResponse {
  GetStatusOrderResult: TmStatusOrderResult;
}

export interface TmRefundPayRequest {
  RefundID: string;
  Source: number;
  Code: string;
  UrlResponse: string;
  Bank: number;
}

export interface TmRefundPayResult {
  RefundID_Order: string | null;
  Resultmsg: string;
  Success: boolean;
}

export interface TmRefundPayResponse {
  RefundPayResult: TmRefundPayResult;
}

export interface TmRefundStatusResult {
  RefundID: string | null;
  ReferenceRefund: string | null;
  ReferenceRefundTM: string | null;
  Status: number | null;
  ExternalID: string | null;
  BankId: string | null;
  TmId: string | null;
  Msg: string | null;
}

export interface TmRefundStatusResponse {
  getStatusRefundOrderResult: TmRefundStatusResult;
}

export interface TmWebhookNotification {
  Source: string;
  BankId: string;
  TmId: string;
  Phone: string;
  ExternalId: string;
  Status: string;
  Bank: string | number;
  Msg?: string;
  OrderAmount?: number;
  AmountPaid?: number;
  AmountCredited?: number;
}

export interface TmRefundWebhookNotification {
  RefundID: string;
  ReferenceRefund: string;
  ReferenceRefundTM: string;
  Success: string;
  Resultmsg?: string;
  Status: number;
  ExternalID?: string;
  BankId?: string;
  TmId?: string;
}

export interface TmInitiatePaymentResponse {
  qr_code: string;
  tm_order_id: number;
  transaction_ref: string;
  qr_data: {
    id_transaccion: string;
    importe: number;
    moneda: string;
    numero_proveedor: number;
    version: string;
  };
}