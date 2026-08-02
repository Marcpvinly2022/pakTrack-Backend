import pino from "pino";
import fs from "fs";
import path from "path";

const isProduction = process.env.NODE_ENV === "production";

// 1. Create a "logs" folder automatically inside your source directory if it doesn't exist
const logDirectory = path.join(process.cwd(), "src", "logs");
if (!fs.existsSync(logDirectory)) {
    fs.mkdirSync(logDirectory, { recursive: true });
}

// 2. Define the exact path to your permanent log storage file
const logFilePath = path.join(logDirectory, "combined.log");

// 3. Configure the destination streams
const streams = [];

if (!isProduction) {
    // A. Locally, write pretty colorful text straight to the terminal console
    streams.push({
        stream: pino.transport({
            target: "pino-pretty",
            options: {
                colorize: true,
                translateTime: "SYS:standard",
                ignore: "pid,hostname",
            },
        }),
    });
} else {
    // B. In production, also write standard JSON directly to the cloud terminal stream
    streams.push({ stream: process.stdout });
}

// C. ALWAYS append raw, structured JSON logs into our file on disk (for both dev and prod)
streams.push({
    stream: fs.createWriteStream(logFilePath, { flags: "a" }) // "a" flag means APPEND data to the end of the file
});

// 4. Initialize the Master Logger instance using the multi-stream configuration array
export const logger = pino(
    {
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
    },
    pino.multistream(streams) // ✅ Hook up the multi-stream router
);
