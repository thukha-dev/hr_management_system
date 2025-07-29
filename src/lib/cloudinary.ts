import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';

// Configure Cloudinary with environment variables
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export async function uploadImage(file: File): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Convert buffer to base64
    const base64String = `data:${file.type};base64,${buffer.toString('base64')}`;
    
    // Upload the base64 string to Cloudinary
    const result = await cloudinary.uploader.upload(base64String, {
      folder: 'hrms/profiles',
      resource_type: 'auto',
    });

    if (!result.secure_url) {
      throw new Error('Failed to upload image: No URL returned from Cloudinary');
    }

    return result.secure_url;
  } catch (error: unknown) {
    console.error('Error in uploadImage:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    throw new Error(`Failed to upload image: ${errorMessage}`);
  }
}
