import { imageService } from './ImageService';

export const imagesApi = {
  upload: imageService.upload,
  uploadMany: imageService.uploadMany,
  getByEntity: imageService.getByEntity,
  getPublicEventImages: imageService.getPublicEventImages,
  delete: imageService.remove,
  setPrimary: imageService.setPrimary,
  reorder: imageService.reorder,
  uploadImage: imageService.uploadImage,
  deleteImage: imageService.deleteImage,
  uploadLogo: imageService.uploadLogo,
  getLogo: imageService.getLogo,
  uploadAdminImage: imageService.uploadAdminImage,
  deleteAdminImage: imageService.deleteAdminImage,
};
