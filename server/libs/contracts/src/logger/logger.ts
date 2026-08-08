import { randomUUID } from 'node:crypto';
import type { Params } from 'nestjs-pino';
import pino from 'pino';

export function createLoggerParams(service: string): Params {
  return {
    pinoHttp: {
      level: process.env.LOG_LEVEL ?? 'info',
      base: { service },
      timestamp: pino.stdTimeFunctions.isoTime,
      redact: {
        paths: [
          'req.headers.authorization',
          'req.headers.cookie',
          'req.headers["set-cookie"]',
          'res.headers["set-cookie"]',
        ],
        censor: '[Redacted]',
      },
      genReqId: (request, response) => {
        const requestId = request.headers['x-request-id'];
        const id =
          typeof requestId === 'string' && requestId.trim().length > 0
            ? requestId
            : randomUUID();

        response.setHeader('x-request-id', id);
        return id;
      },
    },
  };
}
