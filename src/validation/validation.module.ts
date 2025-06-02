import { Module } from '@nestjs/common';
import { ValidationService } from './service/validation.service';
import { ValidationController } from './controller/validation.controller';

@Module({
  providers: [ValidationService],
  controllers: [ValidationController],
})
export class ValidationModule {}
