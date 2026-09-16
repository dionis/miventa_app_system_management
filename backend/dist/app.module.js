"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const throttler_1 = require("@nestjs/throttler");
const core_1 = require("@nestjs/core");
const auth_module_1 = require("./auth/auth.module");
const leads_module_1 = require("./leads/leads.module");
const payments_module_1 = require("./payments/payments.module");
const referrals_module_1 = require("./referrals/referrals.module");
const users_module_1 = require("./users/users.module");
const faqs_module_1 = require("./faqs/faqs.module");
const logs_module_1 = require("./logs/logs.module");
const dashboard_module_1 = require("./dashboard/dashboard.module");
const health_module_1 = require("./health/health.module");
const plans_module_1 = require("./plans/plans.module");
const mail_module_1 = require("./mail/mail.module");
const licenses_module_1 = require("./licenses/licenses.module");
const notify_module_1 = require("./notify/notify.module");
const transfermovil_module_1 = require("./transfermovil/transfermovil.module");
const env_validation_1 = require("./config/env.validation");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                validationSchema: env_validation_1.envValidationSchema,
                validationOptions: { abortEarly: false },
            }),
            throttler_1.ThrottlerModule.forRoot([{ name: 'default', ttl: 60 * 1000, limit: 120 }]),
            mail_module_1.MailModule,
            health_module_1.HealthModule,
            auth_module_1.AuthModule,
            leads_module_1.LeadsModule,
            payments_module_1.PaymentsModule,
            referrals_module_1.ReferralsModule,
            users_module_1.UsersModule,
            faqs_module_1.FaqsModule,
            logs_module_1.LogsModule,
            dashboard_module_1.DashboardModule,
            plans_module_1.PlansModule,
            licenses_module_1.LicensesModule,
            notify_module_1.NotifyModule,
            transfermovil_module_1.TransfermovilModule,
        ],
        providers: [{ provide: core_1.APP_GUARD, useClass: throttler_1.ThrottlerGuard }],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map