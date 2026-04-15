import { Module } from '@nestjs/common';

import { LLMAdapter } from '@/infrastructure/llm/llm.adapter';

@Module({
  providers: [LLMAdapter, { provide: 'ILLMPort', useExisting: LLMAdapter }],
  exports: ['ILLMPort'],
})
export class LLMInfraModule {}
