export const resizeAndCropImage = (file: File, targetWidth: number, targetHeight: number): Promise<File> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = URL.createObjectURL(file);
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject(new Error('Canvas context not available'));

      const imgRatio = img.width / img.height;
      const targetRatio = targetWidth / targetHeight;
      
      let sourceWidth = img.width;
      let sourceHeight = img.height;
      let offsetX = 0;
      let offsetY = 0;

      if (imgRatio > targetRatio) {
        // Image is wider than target -> crop left/right
        sourceWidth = img.height * targetRatio;
        offsetX = (img.width - sourceWidth) / 2;
      } else {
        // Image is taller than target -> crop top/bottom
        sourceHeight = img.width / targetRatio;
        offsetY = (img.height - sourceHeight) / 2;
      }

      // Draw the image onto the canvas, cropping the center
      ctx.drawImage(img, offsetX, offsetY, sourceWidth, sourceHeight, 0, 0, targetWidth, targetHeight);
      
      canvas.toBlob((blob) => {
        if (!blob) return reject(new Error('Failed to create blob'));
        // Create new file from blob
        const newFile = new File([blob], file.name.replace(/\.[^/.]+$/, "") + "_banner.jpg", {
          type: 'image/jpeg',
          lastModified: Date.now(),
        });
        resolve(newFile);
      }, 'image/jpeg', 0.9);
      
      URL.revokeObjectURL(img.src);
    };
    img.onerror = (error) => {
      URL.revokeObjectURL(img.src);
      reject(error);
    };
  });
};
