import type { GeneratedTranslationArtifacts } from '@/domain/translate/generated-translation-artifacts';
import type { ResolvedTranslationContext } from '@/domain/translate/resolved-translation-context';
import type { TranslationOutput } from '@/domain/translate/translation-output';

export interface GetTranslationInput {
  readonly text: string;
  readonly outputLanguageId: number;
}

export interface TranslationWorkflowInput {
  readonly text: string;
  readonly context: ResolvedTranslationContext;
}

export interface PersistTranslationCacheInput extends TranslationWorkflowInput {
  readonly artifacts: GeneratedTranslationArtifacts;
}

export type GetTranslationResult = TranslationOutput;
