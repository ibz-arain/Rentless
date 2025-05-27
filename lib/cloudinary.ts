import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Upload a base64 image to Cloudinary
 * @param base64Image - Base64 encoded image string
 * @returns Promise with the secure URL of the uploaded image
 */
export async function uploadImage(base64Image: string): Promise<string> {
  try {
    // Upload the image
    const result = await cloudinary.uploader.upload(base64Image, {
      folder: 'rentless',
      resource_type: 'image',
    });
    
    // Return the secure URL
    return result.secure_url;
  } catch (error) {
    console.error('Error uploading image to Cloudinary:', error);
    throw new Error('Failed to upload image');
  }
}

/**
 * Upload multiple base64 images to Cloudinary
 * @param base64Images - Array of base64 encoded image strings
 * @returns Promise with an array of secure URLs
 */
export async function uploadImages(base64Images: string[]): Promise<string[]> {
  try {
    // Upload all images in parallel
    const uploadPromises = base64Images.map(image => uploadImage(image));
    return await Promise.all(uploadPromises);
  } catch (error) {
    console.error('Error uploading multiple images to Cloudinary:', error);
    throw new Error('Failed to upload images');
  }
} 