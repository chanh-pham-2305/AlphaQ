/* eslint-disable @typescript-eslint/prefer-promise-reject-errors */
import { Injectable } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';
import { ConfigService } from '@nestjs/config';
import { Readable } from 'stream';

@Injectable()
export class CloudinaryService {
  constructor(private readonly configService: ConfigService) {
    cloudinary.config({
      cloud_name: this.configService.get<string>('CLOUDINARY_CLOUD_NAME'),
      api_key: this.configService.get<string>('CLOUDINARY_API_KEY'),
      api_secret: this.configService.get<string>('CLOUDINARY_API_SECRET'),
    });
  }

  async uploadImage({
    file,
    folderPath = 'alphaQ/avatars',
  }: {
    file: Express.Multer.File;
    folderPath?: string;
  }): Promise<string> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: folderPath,
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result!.secure_url);
        },
      );
      Readable.from(file.buffer).pipe(uploadStream);
    });
  }

  async uploadMultipleImages({
    files,
    folderPath,
  }: {
    files: Express.Multer.File[];
    folderPath?: string;
  }): Promise<string[]> {
    const uploadPromises = files.map((file) =>
      this.uploadImage({ file, folderPath }),
    );
    return Promise.all(uploadPromises);
  }

  async deleteImage(publicId: string): Promise<boolean> {
    try {
      const actualPublicId = this.extractPublicId(publicId);

      const { result } = await cloudinary.uploader.destroy(actualPublicId);
      return result === 'ok';
    } catch (error) {
      console.error('Error deleting image from Cloudinary:', error);
      return false;
    }
  }

  async deleteImages(publicIds: string[]): Promise<boolean[]> {
    const results = await Promise.all(
      publicIds.map((publicId) => this.deleteImage(publicId)),
    );
    return results;
  }
  // get id in url
  private extractPublicId(url: string): string {
    // eslint-disable-next-line no-useless-escape
    const matches = url.match(/upload\/(?:v\d+\/)?([^\.]+)/);

    // return publicId
    return matches ? matches[1] : url;
  }
}
