import { App, cert, initializeApp, ServiceAccount } from 'firebase-admin/app';
import { Module, Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { FirebaseAuthAdapter } from '@/infrastructure/auth/firebase-auth.adapter';

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
  providers: [FirebaseAppProvider, FirebaseAuthAdapter, { provide: 'IAuthPort', useExisting: FirebaseAuthAdapter }],
  exports: ['IAuthPort'],
})
export class AuthInfraModule {}
