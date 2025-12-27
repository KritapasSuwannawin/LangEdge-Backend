import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { TranslateController } from './translate.controller';
import { TranslateService } from './translate.service';

import { InfrastructureModule } from '../infrastructure/infrastructure.module';
import { ENTITIES } from '../infrastructure/database/entities';

@Module({
  imports: [TypeOrmModule.forFeature(ENTITIES), InfrastructureModule],
  controllers: [TranslateController],
  providers: [TranslateService],
})
export class TranslateModule {}
