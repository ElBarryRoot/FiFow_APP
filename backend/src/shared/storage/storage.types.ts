export type StoredImage = {
  key: string;
  mimeType: 'image/webp';
  width: number;
  height: number;
  sizeBytes: number;
};

export type SaveImageInput = {
  buffer: Buffer;
  namespace:
    | `products/${string}`
    | `avatars/${string}`
    | `messages/${string}`
    | `seller-verifications/${string}`;
};

export interface StorageAdapter {
  saveImage(input: SaveImageInput): Promise<StoredImage>;
  read(key: string): Promise<Buffer>;
  delete(key: string): Promise<void>;
  publicUrl(key: string): string;
}
