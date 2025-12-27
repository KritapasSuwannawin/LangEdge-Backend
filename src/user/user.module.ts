import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { UserController } from './user.controller';
import { UserService } from './user.service';

import { InfrastructureModule } from '../infrastructure/infrastructure.module';
import { ENTITIES } from '../infrastructure/database/entities';

@Module({
  imports: [TypeOrmModule.forFeature(ENTITIES), InfrastructureModule],
  controllers: [UserController],
  providers: [UserService],
})
export class UserModule {}
