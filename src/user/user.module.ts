import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { User } from '../infrastructure/database/entities/user.entity';
import { InfrastructureModule } from '../infrastructure/infrastructure.module';
import { AuthModule } from '../auth/auth.module';

import { UserController } from './user.controller';
import { UserService } from './user.service';

@Module({
  imports: [TypeOrmModule.forFeature([User]), InfrastructureModule, AuthModule],
  controllers: [UserController],
  providers: [UserService],
})
export class UserModule {}
