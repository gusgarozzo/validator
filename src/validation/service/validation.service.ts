import { Injectable, Logger } from '@nestjs/common';
import * as dns from 'dns';
import { MxRecord } from 'dns';
import SMTPConnection from 'smtp-connection';

@Injectable()
export class ValidationService {
  private readonly logger = new Logger(ValidationService.name);

  constructor() {}

  async validateEmail(email: string): Promise<boolean> {
    try {
      const domainHasMxRecords = await this.checkMxRecords(email);
      return domainHasMxRecords;
    } catch (error) {
      this.logger.error('Validation failed:', error);
      return false;
    }
  }

  private async checkMxRecords(email: string): Promise<boolean> {
    const domain = email.split('@')[1];
    this.logger.log(`Resolviendo registros MX para el dominio: ${domain}`);

    return new Promise<boolean>((resolve) => {
      dns.resolveMx(domain, (err, addresses) => {
        if (err || !addresses || addresses.length === 0) {
          this.logger.warn(
            `No MX records found for ${domain}: ${err?.message}`,
          );
          return resolve(false);
        }
        this.logger.log(
          `MX records found for ${domain}: ${JSON.stringify(addresses)}`,
        );
        resolve(true);
      });
    });
  }

  private async smtpPing(email: string): Promise<boolean> {
    const domain = email.split('@')[1];
    this.logger.log(`Resolviendo registros MX para el dominio: ${domain}`);

    const mxRecords = await new Promise<MxRecord[]>((resolve, reject) => {
      dns.resolveMx(domain, (err, addresses) => {
        if (err || !addresses || addresses.length === 0) {
          this.logger.error(
            `Error o registros MX no encontrados para ${domain}:`,
            err,
          );
          return reject(new Error('No MX records found'));
        }
        this.logger.log(
          `Registros MX encontrados para ${domain}: ${JSON.stringify(addresses)}`,
        );
        resolve(addresses.sort((a, b) => a.priority - b.priority));
      });
    });

    const mxHost = mxRecords[0].exchange;
    this.logger.log(`Seleccionado el host MX: ${mxHost}`);

    return new Promise((resolve) => {
      const connection = new SMTPConnection({
        host: mxHost,
        port: 25,
        secure: false,
        tls: {
          rejectUnauthorized: false,
        },
      });

      connection.on('error', (err) => {
        this.logger.error('Error de conexión SMTP:', err.message);
        resolve(false);
      });

      this.logger.log(`Intentando conectar a SMTP host: ${mxHost}`);
      connection.connect(() => {
        this.logger.log(
          'Conexión SMTP establecida. Intentando enviar RCPT TO.',
        );
        connection.send(
          {
            from: 'test@yourdomain.com',
            to: [email],
          },
          '',
          (err) => {
            if (err) {
              this.logger.warn('RCPT TO rechazado:', err.message);
              resolve(false);
            } else {
              this.logger.log('RCPT TO aceptado.');
              resolve(true);
            }
            connection.quit();
            this.logger.log('Conexión SMTP cerrada.');
          },
        );
      });
    });
  }
}
