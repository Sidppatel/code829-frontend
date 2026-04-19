import { imageService } from './ImageService';

export const imagesApi = {
  upload: imageService.upload,
  uploadMany: imageService.uploadMany,
  getByEntity: imageService.getByEntity,
  delete: imageService.remove,
  setPrimary: imageService.setPrimary,
  reorder: imageService.reorder,
  uploadAvatar: imageService.uploadAvatar,
  deleteAvatar: imageService.deleteAvatar,
  uploadLogo: imageService.uploadLogo,
  getLogo: imageService.getLogo,
};
