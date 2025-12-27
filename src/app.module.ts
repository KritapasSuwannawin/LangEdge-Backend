import { Module } from '@nestjs/common';

import { APP_IMPORTS } from './app.imports';

import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { TranslateModule } from './translate/translate.module';
import { LanguageModule } from './language/language.module';

@Module({
  imports: [...APP_IMPORTS, AuthModule, UserModule, TranslateModule, LanguageModule],
})
export class AppModule {}
