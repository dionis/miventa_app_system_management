import { Module } from '@nestjs/common';
import { LicensesController } from './licenses.controller';
import { LicensesService } from './licenses.service';
import { LicenseMailService } from './mail.service';

@Module({
  controllers: [LicensesController],
  providers: [LicensesService, LicenseMailService],
  exports: [LicensesService],
})
export class LicensesModule {}
