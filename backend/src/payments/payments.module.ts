import { Module } from '@nestjs/common';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { LicensesModule } from '../licenses/licenses.module';
import { NotifyModule } from '../notify/notify.module';

@Module({
  imports: [LicensesModule, NotifyModule],
  controllers: [PaymentsController],
  providers: [PaymentsService],
})
export class PaymentsModule {}
