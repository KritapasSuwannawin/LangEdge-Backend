import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';

import { ENTITIES } from './infrastructure/database/entities';

export const APP_IMPORTS = [
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
];
