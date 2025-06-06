import { Injectable, Logger } from '@nestjs/common';
import * as dns from 'dns';
import { MxRecord } from 'dns';
import {
  ValidationResponse,
  ValidationStatus,
} from '../interfaces/validation-response.interface';

@Injectable()
export class EmailValidationService {
  private readonly logger = new Logger(EmailValidationService.name);

  constructor() {}

  async validateEmail(email: string): Promise<ValidationResponse> {
    this.logger.log(`Starting validation process for: ${email}`);

    if (!this.isValidSyntax(email)) {
      this.logger.warn(`Invalid email syntax for: ${email}`);
      return {
        valid: false,
        status: ValidationStatus.INVALID_SYNTAX,
        details: {
          message: 'The email address has an invalid format',
          domain: email.split('@')[1],
        },
      };
    }

    try {
      const domain = email.split('@')[1];
      const mxRecords = await this.checkMxRecords(email);

      if (!mxRecords || mxRecords.length === 0) {
        this.logger.warn(`No MX records found for domain: ${domain}`);
        return {
          valid: false,
          status: ValidationStatus.NO_MX_RECORDS,
          details: {
            message: 'No mail exchange records found for the domain',
            domain,
          },
        };
      }

      this.logger.log(`Basic validation successful for: ${email}`);
      return {
        valid: true,
        status: ValidationStatus.VALID,
        details: {
          message: 'Email passed basic validation (syntax and MX records)',
          domain,
          mxRecords: mxRecords.map((record) => ({
            exchange: record.exchange,
            priority: record.priority,
          })),
        },
      };
    } catch (error) {
      const status = error.message.includes('timeout')
        ? ValidationStatus.TIMEOUT
        : ValidationStatus.DNS_ERROR;

      this.logger.error(`Validation failed for ${email}: ${error.message}`);
      return {
        valid: false,
        status,
        details: {
          message:
            status === ValidationStatus.TIMEOUT
              ? 'DNS resolution timed out'
              : 'Error during DNS resolution',
          domain: email.split('@')[1],
          error: error.message,
        },
      };
    }
  }

  private isValidSyntax(email: string): boolean {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);
  }

  private async checkMxRecords(email: string): Promise<MxRecord[] | null> {
    const domain = email.split('@')[1];
    this.logger.log(`Resolving MX records for domain: ${domain}`);

    const MX_TIMEOUT = 5000;

    return new Promise<MxRecord[] | null>((resolve) => {
      const timeoutId = setTimeout(() => {
        this.logger.warn(
          `Timeout (${MX_TIMEOUT}ms) while resolving MX records for ${domain}`,
        );
        resolve(null);
      }, MX_TIMEOUT);

      dns.resolveMx(domain, (err, addresses) => {
        clearTimeout(timeoutId);
        if (err || !addresses || addresses.length === 0) {
          this.logger.warn(
            `No MX records found for ${domain}: ${err?.message}`,
          );
          return resolve(null);
        }
        this.logger.log(
          `MX records found for ${domain}: ${JSON.stringify(addresses)}`,
        );
        resolve(addresses.sort((a, b) => a.priority - b.priority));
      });
    });
  }
}
