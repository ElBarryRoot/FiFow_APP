import { randomUUID } from 'node:crypto';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import { env } from '../../config/env.js';
import { ApiError } from '../errors/api-error.js';
import type { SaveImageInput, StorageAdapter, StoredImage } from './storage.types.js';

export class LocalStorageAdapter implements StorageAdapter {
  private readonly root = env.STORAGE_LOCAL_ROOT;

  async saveImage({ buffer, namespace }: SaveImageInput): Promise<StoredImage> {
    if (buffer.byteLength === 0 || buffer.byteLength > env.MAX_IMAGE_BYTES) {
      throw new ApiError(400, 'La taille de l’image est invalide.', 'INVALID_IMAGE_SIZE');
    }

    const key = path.posix.join(namespace, `${randomUUID()}.webp`);
    const destination = this.resolveKey(key);
    const processed = await this.processImage(buffer, namespace);

    await mkdir(path.dirname(destination), { recursive: true });
    await writeFile(destination, processed.data, { flag: 'wx' });

    return {
      key,
      mimeType: 'image/webp',
      width: processed.info.width,
      height: processed.info.height,
      sizeBytes: processed.info.size
    };
  }

  async delete(key: string) {
    await rm(this.resolveKey(key), { force: true });
  }

  async read(key: string) {
    try {
      return await readFile(this.resolveKey(key));
    } catch {
      throw new ApiError(404, 'Fichier introuvable.', 'STORED_FILE_NOT_FOUND');
    }
  }

  publicUrl(key: string) {
    const encodedKey = key
      .split('/')
      .map((segment) => encodeURIComponent(segment))
      .join('/');
    return `${env.API_PUBLIC_URL}${env.STORAGE_PUBLIC_PATH}/${encodedKey}`;
  }

  private resolveKey(key: string) {
    if (!key || path.isAbsolute(key) || key.includes('\\')) {
      throw new ApiError(400, 'Clé de stockage invalide.', 'INVALID_STORAGE_KEY');
    }

    const resolved = path.resolve(this.root, key);
    const relative = path.relative(this.root, resolved);
    if (relative.startsWith('..') || path.isAbsolute(relative)) {
      throw new ApiError(400, 'Clé de stockage invalide.', 'INVALID_STORAGE_KEY');
    }
    return resolved;
  }

  private async processImage(buffer: Buffer, namespace: SaveImageInput['namespace']) {
    try {
      const maxDimension = namespace.startsWith('avatars/')
        ? 512
        : namespace.startsWith('messages/')
          ? 1600
          : 2000;
      return await sharp(buffer, {
        failOn: 'warning',
        limitInputPixels: 40_000_000
      })
        .rotate()
        .resize({
          width: maxDimension,
          height: maxDimension,
          fit: 'inside',
          withoutEnlargement: true
        })
        .webp({ quality: 82, effort: 4 })
        .toBuffer({ resolveWithObject: true });
    } catch {
      throw new ApiError(400, 'Le fichier envoyé n’est pas une image valide.', 'INVALID_IMAGE_CONTENT');
    }
  }
}
