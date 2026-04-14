export interface IFileDownloadPort {
  downloadAsBase64DataUrl(url: string): Promise<string>;
}
