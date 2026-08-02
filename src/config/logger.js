// 1. ✅ CRITICAL IMPORT: You must import the pino library at the very top
import pino from "pino";

// Define your environment flag variable if you haven't already
const isProduction = process.env.NODE_ENV === "production";

// 2. ✅ EXPORT STATEMENT: Add "export const logger =" right here
export const logger = pino({
    level: process.env.LOG_LEVEL || "info",

    base: {
        app: "PakTrack",
        env: process.env.NODE_ENV,
    },

    timestamp: pino.stdTimeFunctions.isoTime,

    formatters: {
        level(label) {
            return {
                level: label.toUpperCase(),
            };
        },
    },

    serializers: {
        err: pino.stdSerializers.err,
        error: pino.stdSerializers.err,
    },

    transport: !isProduction
        ? {
              target: "pino-pretty",
              options: {
                  colorize: true,
                  translateTime: "SYS:standard",
                  ignore: "pid,hostname",
              },
          }
        : undefined,
});
