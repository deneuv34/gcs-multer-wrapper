import Multer from 'multer';
import { Storage, StorageOptions } from '@google-cloud/storage';
import { Bucket } from '@google-cloud/storage/build/src/bucket';
import * as uuid from 'uuid/v1';

/**
 * Google Cloud Storage Class
 *
 * @export
 * @class GoogleCloudStorage
 * @implements {Multer.StorageEngine}
 */
export class GoogleCloudStorage implements Multer.StorageEngine {
  private gceStorage: Storage;
  private gcsBucket: Bucket;
  private options?: StorageOptions & { acl?: string | 'publicread' | 'private', bucket?: string, prefix?: string };

  /**
   * Get File name
   *
   * @param {*} req
   * @param {*} file
   * @param {*} callback
   * @memberof GoogleCloudStorage
   */
  getFilename(req, file, callback) {
    callback(null, `${uuid()}_${file.originalname}`);
  }

  /**
   * Get destination
   *
   * @param {*} req
   * @param {*} file
   * @param {*} callback
   * @memberof GoogleCloudStorage
   */
  getDestination(req, file, callback) {
    callback(null, '');
  }

  getPublicUrl(filename) {
    return 'https://storage.googleapis.com/' + this.options.bucket + this.getPrefix(this.options.prefix) + filename;
  }

  getPrefix(prefix: string | null | undefined) {
    if (prefix === '' || prefix === undefined || prefix == null) {
      return '/'
    }
    return '/' + prefix + '/'
  }

  constructor(opts?: StorageOptions & { acl?: string, filename?: any; bucket?: string, prefix?: string }) {
    opts = opts || {};

    this.getFilename = opts.filename || this.getFilename;

    opts.bucket = opts.bucket || process.env.GCS_BUCKET || null;
    opts.projectId = opts.projectId || process.env.GCLOUD_PROJECT || null;
    opts.keyFilename = opts.keyFilename || process.env.GCS_KEYFILE || null;

    if (!opts.bucket) {
      throw new Error('You have to specify bucket for Google Cloud Storage to work.');
    }
    if (!opts.projectId) {
      throw new Error('You have to specify project id for Google Cloud Storage to work.');
    }
    if (!opts.keyFilename) {
      throw new Error('You have to specify credentials key file for Google Cloud Storage to work.');
    }
    this.gceStorage = new Storage({
      projectId: opts.projectId,
      keyFilename: opts.keyFilename,
    });
    this.gcsBucket = this.gceStorage.bucket(opts.bucket);
    this.options = opts;
  }

  _handleFile(req: any, file: any, callback: any): void {
    this.getDestination(req, file, (err, destination) => {
      if (err) {
        return callback(err);
      }

      // tslint:disable-next-line:no-shadowed-variable
      this.getFilename(req, file, (err, filename) => {
        if (err) {
          return callback(err);
        }
        const gcFile = this.gcsBucket.file(this.getPrefix(this.options.prefix) + filename);
        file.stream
          .pipe(gcFile.createWriteStream({ predefinedAcl: this.options.acl || 'private' }))
          // tslint:disable-next-line:no-shadowed-variable
          .on('error', err => callback(err))
          // tslint:disable-next-line:no-shadowed-variable
          .on('finish', file =>
            callback(null, {
              path: this.getPublicUrl(filename),
              filename,
            })
          );
      });
    });
  }
  _removeFile(req: any, file: any, callback: (error: Error) => void): void {
    const files = this.gcsBucket.file(file.filename);
    files.delete(null);
  }
}

export function storageEngine(opts?: StorageOptions & { filename?: any; bucket?: string }) {
  return new GoogleCloudStorage(opts);
}
