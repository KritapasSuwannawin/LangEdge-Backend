import { App, cert, initializeApp, ServiceAccount } from 'firebase-admin/app';

import { Module, Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { FirebaseService } from './services/firebase.service';
import { LlmService } from './services/llm.service';

const FirebaseAppProvider: Provider<App> = {
  provide: 'FIREBASE_APP',
  inject: [ConfigService],
  useFactory: (configService: ConfigService) => {
    const json = configService.get<string>('FIREBASE_SERVICE_ACCOUNT');

    if (!json) {
      throw new Error('FIREBASE_SERVICE_ACCOUNT is not set');
    }

    const serviceAccount = JSON.parse(json) as ServiceAccount;
    return initializeApp({ credential: cert(serviceAccount) });
  },
};

@Module({
  imports: [],
  providers: [FirebaseAppProvider, FirebaseService, LlmService],
  exports: [FirebaseService, LlmService],
})
export class InfrastructureModule {}
