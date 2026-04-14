import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { UserController } from '@/controllers/user/user.controller';
import { User } from '@/infrastructure/database/entities/user.entity';
import { TypeOrmUserRepository } from '@/infrastructure/database/repositories/typeorm-user.repository';
import { HttpFileDownloadAdapter } from '@/infrastructure/http/file-download.adapter';
import { SignInUserUseCase } from '@/use-cases/user/sign-in-user.use-case';
import { UpdateUserUseCase } from '@/use-cases/user/update-user.use-case';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  controllers: [UserController],
  providers: [
    SignInUserUseCase,
    UpdateUserUseCase,
    { provide: 'IUserRepository', useClass: TypeOrmUserRepository },
    { provide: 'IFileDownloadPort', useClass: HttpFileDownloadAdapter },
  ],
})
export class UserModule {}
