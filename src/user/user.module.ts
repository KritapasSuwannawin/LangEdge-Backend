import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { UserController } from './user.controller';
import { UserService } from './user.service';

import { User } from '@/infrastructure/database/entities/user.entity';
import { TypeOrmUserRepository } from '@/infrastructure/database/repositories/typeorm-user.repository';
import { HttpFileDownloadAdapter } from '@/infrastructure/http/file-download.adapter';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  controllers: [UserController],
  providers: [
    UserService,
    { provide: 'IUserRepository', useClass: TypeOrmUserRepository },
    { provide: 'IFileDownloadPort', useClass: HttpFileDownloadAdapter },
  ],
})
export class UserModule {}
