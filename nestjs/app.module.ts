import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  Connection,
  MongoDBConnection,
  MysqlConnection,
} from './database/connection/connection';
import { UserEntity } from './user/user.entity';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    // TypeOrmModule.forRoot({
    //   type: 'mysql',
    //   host: 'localhost',
    //   port: 3306,
    //   username: 'root',
    //   database: 'imdb',
    //   entities: [NameBasics, TitleBacis],
    //   autoLoadEntities: true,
    // }),
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: 'localhost',
      port: 3306,
      username: 'root',
      database: 'auth',
      entities: [UserEntity],
      autoLoadEntities: true,
      synchronize: true,
    }),
    UserModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: Connection,
      useClass:
        process.env.DATABASE == 'mysql' ? MysqlConnection : MongoDBConnection,
    },
    // kalau menggunakan value provider gunakan useValue:
  ],
})
export class AppModule {}
