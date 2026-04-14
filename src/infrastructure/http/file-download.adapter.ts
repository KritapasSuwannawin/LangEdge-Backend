import { Injectable } from '@nestjs/common';

import type { IFileDownloadPort } from '@/domain/shared/ports/i-file-download.port';
import { downloadFile } from '@/shared/utils/httpUtils';

@Injectable()
export class HttpFileDownloadAdapter implements IFileDownloadPort {
  async downloadAsBase64DataUrl(url: string): Promise<string> {
    return downloadFile(url);
  }
}
