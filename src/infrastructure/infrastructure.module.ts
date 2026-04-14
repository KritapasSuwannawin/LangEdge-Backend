// Deprecated for direct use. Feature modules should import AuthInfraModule or LLMInfraModule instead.
import { Module } from '@nestjs/common';

import { AuthInfraModule } from './auth/auth-infra.module';
import { LLMInfraModule } from './llm/llm-infra.module';

@Module({
  imports: [AuthInfraModule, LLMInfraModule],
  exports: [AuthInfraModule, LLMInfraModule],
})
export class InfrastructureModule {}
