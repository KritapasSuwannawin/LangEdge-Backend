import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';

import { AuthModule } from '@/modules/auth/auth.module';
import { LanguageModule } from '@/modules/language/language.module';
import { TranslateModule } from '@/modules/translate/translate.module';
import { UserModule } from '@/modules/user/user.module';

import { ENTITIES } from '@/infrastructure/database/entities';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        url: configService.get<string>('DATABASE_CONNECTION_STRING'),
        entities: ENTITIES,
        synchronize: false,
        autoLoadEntities: true,
      }),
    }),
    ThrottlerModule.forRoot([{ name: 'translate', ttl: 60000, limit: 10 }]),
    AuthModule,
    UserModule,
    TranslateModule,
    LanguageModule,
  ],
})
export class AppModule {}
