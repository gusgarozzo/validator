import {
  Body,
  Controller,
  HttpCode,
  Logger,
  Post,
  ValidationPipe,
} from '@nestjs/common';
import { ValidationService } from '../service/validation.service';
import { ValidateEmailDto } from '../dto/validateEmail.dto';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';

@Controller('validation')
export class ValidationController {
  private readonly logger = new Logger(ValidationController.name);

  constructor(private readonly validatorService: ValidationService) {}

  @Post('email')
  @ApiOperation({ summary: 'Verifica existencia real de un email' })
  @ApiResponse({
    status: 200,
    schema: { properties: { valid: { type: 'boolean' } } },
  })
  async validateEmail(@Body() dto: ValidateEmailDto) {
    const valid = await this.validatorService.validateEmail(dto.email);
    return { valid };
  }
}
