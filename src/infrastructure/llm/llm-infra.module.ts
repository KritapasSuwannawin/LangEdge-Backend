import { Module } from '@nestjs/common';

import { LLMService } from '@/infrastructure/services/llm.service';
import { LLMAdapter } from './llm.adapter';

@Module({
  providers: [LLMService, { provide: 'ILLMPort', useClass: LLMAdapter }],
  exports: [LLMService, 'ILLMPort'],
})
export class LLMInfraModule {}
