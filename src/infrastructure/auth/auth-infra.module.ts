import { App, cert, initializeApp, ServiceAccount } from 'firebase-admin/app';
import { Module, Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { FirebaseService } from '@/infrastructure/services/firebase.service';
import { FirebaseAuthAdapter } from './firebase-auth.adapter';

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
  providers: [FirebaseAppProvider, FirebaseService, { provide: 'IAuthPort', useClass: FirebaseAuthAdapter }],
  exports: [FirebaseService, 'IAuthPort'],
})
export class AuthInfraModule {}
