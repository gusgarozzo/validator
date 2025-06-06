export enum ValidationStatus {
  VALID = 'VALID',
  INVALID_SYNTAX = 'INVALID_SYNTAX',
  NO_MX_RECORDS = 'NO_MX_RECORDS',
  DNS_ERROR = 'DNS_ERROR',
  TIMEOUT = 'TIMEOUT',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

export interface ValidationResponse {
  valid: boolean;
  status: ValidationStatus;
  details: {
    message: string;
    domain?: string;
    mxRecords?: Array<{ exchange: string; priority: number }>;
    error?: string;
  };
}

// Para el endpoint simple
export interface SimpleValidationResponse {
  valid: boolean;
  message: string;
}
