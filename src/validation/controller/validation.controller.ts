import { Body, Controller, Logger, Post } from '@nestjs/common';
import { EmailValidationService } from '../service/emailValidation.service';
import { ValidateEmailDto } from '../dto/validateEmail.dto';
import { ApiOperation, ApiResponse, ApiTags, ApiBody } from '@nestjs/swagger';
import {
  ValidationResponse,
  SimpleValidationResponse,
} from '../interfaces/validation-response.interface';
import { ValidationStatus } from '../dto/validation-response.dto';

@ApiTags('Email Validation')
@Controller('validation')
export class ValidationController {
  private readonly logger = new Logger(ValidationController.name);

  constructor(private readonly emailValidator: EmailValidationService) {}

  @Post('email')
  @ApiOperation({
    summary: 'Validate email format and existence',
    description:
      'Performs basic email validation including syntax and MX records check',
  })
  @ApiBody({
    type: ValidateEmailDto,
    description: 'Email to validate',
  })
  @ApiResponse({
    status: 200,
    description: 'Simple email validation result',
    schema: {
      type: 'object',
      properties: {
        valid: {
          type: 'boolean',
          description: 'Whether the email is valid',
        },
        message: {
          type: 'string',
          description: 'Description of the validation result',
        },
      },
    },
  })
  async validateEmail(
    @Body() dto: ValidateEmailDto,
  ): Promise<SimpleValidationResponse> {
    this.logger.log(`Validating email: ${dto.email}`);
    const result = await this.emailValidator.validateEmail(dto.email);
    return {
      valid: result.valid,
      message: result.details.message,
    };
  }

  @Post('email/debug')
  @ApiOperation({
    summary: 'Validate email with detailed technical information',
    description:
      'Performs detailed email validation including MX records and technical details',
  })
  @ApiBody({
    type: ValidateEmailDto,
    description: 'Email to validate with debug information',
  })
  @ApiResponse({
    status: 200,
    description: 'Detailed email validation result with technical information',
    schema: {
      type: 'object',
      properties: {
        valid: {
          type: 'boolean',
          description: 'Whether the email is valid',
        },
        status: {
          type: 'string',
          enum: Object.values(ValidationStatus),
          description: 'Detailed validation status',
        },
        details: {
          type: 'object',
          properties: {
            message: {
              type: 'string',
              description: 'Description of the validation result',
            },
            domain: {
              type: 'string',
              description: 'Email domain',
            },
            mxRecords: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  exchange: {
                    type: 'string',
                    description: 'MX server hostname',
                  },
                  priority: {
                    type: 'number',
                    description: 'MX server priority',
                  },
                },
              },
            },
            error: {
              type: 'string',
              description: 'Error message if validation failed',
            },
          },
        },
      },
    },
  })
  async validateEmailDebug(
    @Body() dto: ValidateEmailDto,
  ): Promise<ValidationResponse> {
    this.logger.log(`Validating email with debug info: ${dto.email}`);
    return this.emailValidator.validateEmail(dto.email);
  }
}
