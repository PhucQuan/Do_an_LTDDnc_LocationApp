const DEFAULT_BUCKET = process.env.EXPO_PUBLIC_SUPABASE_BUCKET || 'moments';

function getProjectUrl() {
  const rawUrl = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim();
  if (!rawUrl) {
    throw new Error('Supabase URL is missing. Add EXPO_PUBLIC_SUPABASE_URL to .env.');
  }

  return rawUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '');
}

function getAnonKey() {
  const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!anonKey) {
    throw new Error('Supabase anon key is missing. Add EXPO_PUBLIC_SUPABASE_ANON_KEY to .env.');
  }

  return anonKey;
}

function buildPublicUrl(bucket, objectPath) {
  const encodedPath = objectPath
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/');

  return `${getProjectUrl()}/storage/v1/object/public/${encodeURIComponent(bucket)}/${encodedPath}`;
}

function uriToBlob(uri) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.onload = () => {
      if (xhr.status === 200) {
        resolve(xhr.response);
        return;
      }

      reject(new Error(`HTTP ${xhr.status}: Failed to load image.`));
    };
    xhr.onerror = () => reject(new Error('Network error while reading local image.'));
    xhr.responseType = 'blob';
    xhr.open('GET', uri, true);
    xhr.send(null);
  });
}

async function optimizeImage(localUri) {
  return {
    uri: localUri,
    width: null,
    height: null,
  };
}

class ImageUploadService {
  async uploadMomentImage(localUri, userId) {
    if (!localUri) {
      throw new Error('Local image URI is required.');
    }

    if (!userId) {
      throw new Error('User id is required for image upload.');
    }

    const optimizedImage = await optimizeImage(localUri);
    const blob = await uriToBlob(optimizedImage.uri);
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`;
    const objectPath = `${userId}/${fileName}`;
    
    // Supabase Storage API endpoint format: /storage/v1/object/{bucket}/{path}
    const uploadUrl = `${getProjectUrl()}/storage/v1/object/${DEFAULT_BUCKET}/${objectPath}`;
    const anonKey = getAnonKey();

    const response = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
        'Content-Type': 'image/jpeg',
      },
      body: blob,
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      throw new Error(errorText || 'Supabase upload failed.');
    }

    return {
      imageUrl: buildPublicUrl(DEFAULT_BUCKET, objectPath),
      width: optimizedImage.width,
      height: optimizedImage.height,
      path: objectPath,
      bucket: DEFAULT_BUCKET,
    };
  }
}

export const imageUploadService = new ImageUploadService();
