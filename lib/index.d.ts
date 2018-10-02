import Multer from 'multer';
import { StorageOptions } from '@google-cloud/storage';
export declare class GoogleCloudStorage implements Multer.StorageEngine {
    private gceStorage;
    private gcsBucket;
    private options?;
    getFilename(req: any, file: any, callback: any): void;
    getDestination(req: any, file: any, callback: any): void;
    getPublicUrl(filename: any): string;
    getPrefix(prefix: string | null | undefined): string;
    constructor(opts?: StorageOptions & {
        acl?: string;
        filename?: any;
        bucket?: string;
        prefix?: string;
    });
    _handleFile(req: any, file: any, callback: any): void;
    _removeFile(req: any, file: any, callback: (error: Error) => void): void;
}
export declare function storageEngine(opts?: StorageOptions & {
    filename?: any;
    bucket?: string;
}): GoogleCloudStorage;
