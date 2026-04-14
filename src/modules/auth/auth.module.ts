import { Module } from '@nestjs/common';

import { AuthController } from '@/controllers/auth/auth.controller';
import { AuthGuard } from '@/modules/auth/auth.guard';
import { AuthInfraModule } from '@/infrastructure/auth/auth-infra.module';
import { RefreshTokenUseCase } from '@/use-cases/auth/refresh-token.use-case';

@Module({
  imports: [AuthInfraModule],
  controllers: [AuthController],
  providers: [RefreshTokenUseCase, AuthGuard],
  exports: [AuthGuard],
})
export class AuthModule {}
