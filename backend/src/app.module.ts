import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { AuthModule } from './auth/auth.module';
import { LeadsModule } from './leads/leads.module';
import { PaymentsModule } from './payments/payments.module';
import { ReferralsModule } from './referrals/referrals.module';
import { UsersModule } from './users/users.module';
import { FaqsModule } from './faqs/faqs.module';
import { LogsModule } from './logs/logs.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { HealthModule } from './health/health.module';
import { PlansModule } from './plans/plans.module';
import { MailModule } from './mail/mail.module';
import { LicensesModule } from './licenses/licenses.module';
import { NotifyModule } from './notify/notify.module';
import { envValidationSchema } from './config/env.validation';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: envValidationSchema,
      validationOptions: { abortEarly: false },
    }),
    ThrottlerModule.forRoot([{ name: 'default', ttl: 60 * 1000, limit: 120 }]),
    MailModule,
    HealthModule,
    AuthModule,
    LeadsModule,
    PaymentsModule,
    ReferralsModule,
    UsersModule,
    FaqsModule,
    LogsModule,
    DashboardModule,
    PlansModule,
    LicensesModule,
    NotifyModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
