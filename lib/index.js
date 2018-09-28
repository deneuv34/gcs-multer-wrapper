"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const storage_1 = require("@google-cloud/storage");
const uuid = require("uuid/v1");
class GoogleCloudStorage {
    getFilename(req, file, callback) {
        callback(null, `${uuid()}_${file.originalname}`);
    }
    getDestination(req, file, callback) {
        callback(null, '');
    }
    getPublicUrl(filename) {
        return 'https://storage.googleapis.com/' + this.options.bucket + '/' + filename;
    }
    constructor(opts) {
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
        this.gceStorage = new storage_1.Storage({
            projectId: opts.projectId,
            keyFilename: opts.keyFilename,
        });
        this.gcsBucket = this.gceStorage.bucket(opts.bucket);
        this.options = opts;
    }
    _handleFile(req, file, callback) {
        this.getDestination(req, file, (err, destination) => {
            if (err) {
                return callback(err);
            }
            this.getFilename(req, file, (err, filename) => {
                if (err) {
                    return callback(err);
                }
                const gcFile = this.gcsBucket.file(filename);
                file.stream
                    .pipe(gcFile.createWriteStream({ predefinedAcl: this.options.acl || 'private' }))
                    .on('error', err => callback(err))
                    .on('finish', file => callback(null, {
                    path: this.getPublicUrl(filename),
                    filename,
                }));
            });
        });
    }
    _removeFile(req, file, callback) {
        const files = this.gcsBucket.file(file.filename);
        files.delete(null);
    }
}
exports.GoogleCloudStorage = GoogleCloudStorage;
function storageEngine(opts) {
    return new GoogleCloudStorage(opts);
}
exports.storageEngine = storageEngine;
//# sourceMappingURL=index.js.map