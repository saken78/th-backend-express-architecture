import { Injectable, Inject } from "@nestjs/common";
import { Logger } from "winston";
import { WINSTON_MODULE_PROVIDER } from "nest-winston";
import { Request, Response } from "express";

@Injectable()
export class LogMiddleware implements NestMiddleware {
  constructor(@Inject(WINSTON_MODULE_PROVIDER) logger: Logger) {}
  use(req: Request, res: Response, next: () => void) {
    this.logger.info(`Middlware: request from URL ${req.url}`);
  }
}
