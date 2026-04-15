import { Language } from '@/infrastructure/database/entities/language.entity';
import { Translation } from '@/infrastructure/database/entities/translation.entity';
import { Synonym } from '@/infrastructure/database/entities/synonym.entity';
import { ExampleSentence } from '@/infrastructure/database/entities/example-sentence.entity';
import { User } from '@/infrastructure/database/entities/user.entity';

export const ENTITIES = [Language, Translation, Synonym, ExampleSentence, User];
