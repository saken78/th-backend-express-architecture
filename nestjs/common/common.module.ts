import { Module } from "@nestjs/common";
import { WinstonModule } from "nest-winston";
import * as winston from "winston";
import { ConfigModule } from "@nestjs/config";

@Global()
@Module({
  import: [
    WinstonModule.forRoot({
      level: "debug",
      format: winston.format.json(),
      transports: [new winston.transports.Console()],
    }),
    ConfigModule.forRoot({ isGlobal: true }),
  ],
})
export class CommonModule {}
