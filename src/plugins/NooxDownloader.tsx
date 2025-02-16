import { registerPlugin } from '@capacitor/core';

export interface NooxDownloaderPlugin {
  download(options: { url: string; fileName: string }): Promise<void>;
}

const NooxDownloader = registerPlugin<NooxDownloaderPlugin>('noox');

export default NooxDownloader;
