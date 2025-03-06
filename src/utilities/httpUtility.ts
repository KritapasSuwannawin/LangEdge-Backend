import https from 'https';
import { IncomingMessage } from 'http';

export const downloadFile = async (url: string): Promise<string> => {
  const response = await new Promise<IncomingMessage>((resolve, reject) => {
    https
      .get(url, (res) => {
        if (res.statusCode !== 200) {
          reject(new Error('Failed to download file'));
        } else {
          resolve(res);
        }
      })
      .on('error', reject);
  });

  const data: Uint8Array[] = [];
  for await (const chunk of response) {
    data.push(chunk);
  }

  const contentType = response.headers['content-type'] || 'image/png';

  return `data:${contentType};base64,${Buffer.concat(data).toString('base64')}`;
};
