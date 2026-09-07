"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentsController = void 0;
const common_1 = require("@nestjs/common");
const throttler_1 = require("@nestjs/throttler");
const swagger_1 = require("@nestjs/swagger");
const payments_service_1 = require("./payments.service");
const create_order_dto_1 = require("./dto/create-order.dto");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const roles_guard_1 = require("../auth/roles.guard");
const roles_decorator_1 = require("../auth/roles.decorator");
const pagination_helper_1 = require("../common/helpers/pagination.helper");
let PaymentsController = class PaymentsController {
    paymentsService;
    constructor(paymentsService) {
        this.paymentsService = paymentsService;
    }
    createOrder(dto, req) {
        const authUserId = req.user.id;
        if (dto.user_id && dto.user_id !== authUserId) {
            throw new common_1.ForbiddenException('user_id does not match authenticated user');
        }
        return this.paymentsService.createOrder(dto.plan_id, authUserId);
    }
    getStatus(id, req) {
        return this.paymentsService.getPaymentStatus(id, req.user);
    }
    findAll(page, limit) {
        const { page: p, limit: l } = (0, pagination_helper_1.parsePagination)(page, limit);
        return this.paymentsService.findAll(p, l);
    }
    confirmPayment(id) {
        return this.paymentsService.confirmPayment(id);
    }
    webhookConfirm(body, secret) {
        const expected = process.env.PAYMENTS_WEBHOOK_SECRET;
        if (!expected || secret !== expected) {
            throw new common_1.UnauthorizedException('Invalid webhook secret');
        }
        if (!body?.payment_id) {
            throw new common_1.ForbiddenException('payment_id required');
        }
        if (body.status !== 'completed') {
            return { ignored: true };
        }
        return this.paymentsService.confirmPayment(body.payment_id);
    }
};
exports.PaymentsController = PaymentsController;
__decorate([
    (0, common_1.Post)('create-order'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Crear orden de pago (usuario autenticado)' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Orden creada con QR firmado' }),
    (0, throttler_1.Throttle)({ default: { limit: 10, ttl: 60 * 1000 } }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_order_dto_1.CreateOrderDto, Object]),
    __metadata("design:returntype", void 0)
], PaymentsController.prototype, "createOrder", null);
__decorate([
    (0, common_1.Get)(':id/status'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], PaymentsController.prototype, "getStatus", null);
__decorate([
    (0, common_1.Get)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin', 'staff'),
    (0, swagger_1.ApiBearerAuth)(),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], PaymentsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Post)(':id/confirm'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Confirmación manual (solo admin, temporal)' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], PaymentsController.prototype, "confirmPayment", null);
__decorate([
    (0, common_1.Post)('webhook/confirm'),
    (0, swagger_1.ApiOperation)({ summary: 'Webhook del proveedor de pagos (firmado por secreto)' }),
    (0, throttler_1.Throttle)({ default: { limit: 60, ttl: 60 * 1000 } }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Headers)('x-webhook-secret')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], PaymentsController.prototype, "webhookConfirm", null);
exports.PaymentsController = PaymentsController = __decorate([
    (0, swagger_1.ApiTags)('payments'),
    (0, common_1.Controller)('api/payments'),
    __metadata("design:paramtypes", [payments_service_1.PaymentsService])
], PaymentsController);
//# sourceMappingURL=payments.controller.js.map