import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { TransfermovilController } from './transfermovil.controller';
import { TransfermovilService } from './transfermovil.service';
import { TmHttpClient } from './clients/tm-http.client';
import { PaymentsModule } from '../payments/payments.module';
import { LicensesModule } from '../licenses/licenses.module';

@Module({
  imports: [
    HttpModule.register({
      timeout: 30000,
      maxRedirects: 5,
    }),
    ConfigModule,
    PaymentsModule,
    LicensesModule,
  ],
  controllers: [TransfermovilController],
  providers: [TransfermovilService, TmHttpClient],
  exports: [TransfermovilService, TmHttpClient],
})
export class TransfermovilModule {}