import { Module } from '@nestjs/common';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { LicensesModule } from '../licenses/licenses.module';
import { NotifyModule } from '../notify/notify.module';
import { TransfermovilModule } from '../transfermovil/transfermovil.module';

@Module({
  imports: [LicensesModule, NotifyModule, TransfermovilModule],
  controllers: [PaymentsController],
  providers: [PaymentsService],
})
export class PaymentsModule {}
