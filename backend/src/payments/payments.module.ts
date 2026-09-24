import { Module, forwardRef } from '@nestjs/common';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { LicensesModule } from '../licenses/licenses.module';
import { NotifyModule } from '../notify/notify.module';
import { TransfermovilModule } from '../transfermovil/transfermovil.module';

@Module({
  imports: [LicensesModule, NotifyModule, forwardRef(() => TransfermovilModule)],
  controllers: [PaymentsController],
  providers: [PaymentsService],
  exports: [PaymentsService],
})
export class PaymentsModule {}
