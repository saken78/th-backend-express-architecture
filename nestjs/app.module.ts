import {
  NestModule,
  MiddlewareConsumer,
  RequestMethod,
  Module,
} from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { UserEntity } from "./user/user.entity";
import { UserModule } from "./user/user.module";
import { AuthModule } from "./auth/auth.module";
import { ConfigModule } from "@nestjs/config";
import { CommonModule } from "./common/common.module";
import { LogMiddleware } from "./log/log.middleware";
import { AuthEntity } from "./auth/auth.entity";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: "mysql",
      host: "localhost",
      port: 3306,
      username: "root",
      database: "auth",
      entities: [UserEntity, AuthEntity],
      autoLoadEntities: true,
      synchronize: true,
    }),
    CommonModule,
    UserModule,
    AuthModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LogMiddleware).forRouter({
      path: "/api/*path",
      method: RequestMethod.ALL,
    });
  }
}
