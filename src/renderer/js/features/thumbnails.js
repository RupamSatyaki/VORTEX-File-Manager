/* Thumbnail Generator for Images and Videos */
const Thumbnails = {
  _cache: new Map(),
  _imageExts: ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg', 'ico'],
  _videoExts: ['mp4', 'webm', 'ogg', 'mov', 'avi', 'mkv', 'm4v'],

  isImage(file) {
    return this._imageExts.includes(file.ext.toLowerCase());
  },

  isVideo(file) {
    return this._videoExts.includes(file.ext.toLowerCase());
  },

  shouldShowThumbnail(file) {
    return !file.isDirectory && (this.isImage(file) || this.isVideo(file));
  },

  // Generate thumbnail for image
  getImageThumbnail(file) {
    // Check cache
    if (this._cache.has(file.path)) {
      return this._cache.get(file.path);
    }

    // Create thumbnail URL
    const thumbnailUrl = `file:///${file.path.replace(/\\/g, '/')}`;
    this._cache.set(file.path, thumbnailUrl);
    
    return thumbnailUrl;
  },

  // Generate thumbnail for video
  async getVideoThumbnail(file) {
    // Check cache
    if (this._cache.has(file.path)) {
      return this._cache.get(file.path);
    }

    return new Promise((resolve) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.muted = true;
      video.playsInline = true;
      video.src = `file:///${file.path.replace(/\\/g, '/')}`;

      video.addEventListener('loadeddata', () => {
        // Seek to 1 second or 10% of duration
        video.currentTime = Math.min(1, video.duration * 0.1);
      });

      video.addEventListener('seeked', () => {
        // Create canvas and draw frame
        const canvas = document.createElement('canvas');
        canvas.width = 200;
        canvas.height = 200;
        
        const ctx = canvas.getContext('2d');
        
        // Calculate aspect ratio
        const aspectRatio = video.videoWidth / video.videoHeight;
        let drawWidth = canvas.width;
        let drawHeight = canvas.height;
        let offsetX = 0;
        let offsetY = 0;

        if (aspectRatio > 1) {
          drawHeight = canvas.width / aspectRatio;
          offsetY = (canvas.height - drawHeight) / 2;
        } else {
          drawWidth = canvas.height * aspectRatio;
          offsetX = (canvas.width - drawWidth) / 2;
        }

        ctx.drawImage(video, offsetX, offsetY, drawWidth, drawHeight);
        
        const thumbnailUrl = canvas.toDataURL('image/jpeg', 0.7);
        this._cache.set(file.path, thumbnailUrl);
        
        resolve(thumbnailUrl);
      });

      video.addEventListener('error', () => {
        // Fallback to video icon
        resolve(null);
      });
    });
  },

  // Clear cache
  clearCache() {
    this._cache.clear();
  },

  // Clear specific file from cache
  clearFile(path) {
    this._cache.delete(path);
  }
};
