import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';

import { Language } from './infrastructure/database/entities/language.entity';
import { User } from './infrastructure/database/entities/user.entity';
import { Translation } from './infrastructure/database/entities/translation.entity';
import { Synonym } from './infrastructure/database/entities/synonym.entity';
import { ExampleSentence } from './infrastructure/database/entities/example-sentence.entity';

import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { TranslateModule } from './translate/translate.module';
import { LanguageModule } from './language/language.module';

import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot({ throttlers: [{ ttl: 60000, limit: 10 }] }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        url: configService.get<string>('DATABASE_CONNECTION_STRING'),
        entities: [Language, User, Translation, Synonym, ExampleSentence],
        synchronize: false,
        autoLoadEntities: true,
      }),
    }),
    AuthModule,
    UserModule,
    TranslateModule,
    LanguageModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
