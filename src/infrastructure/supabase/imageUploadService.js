const DEFAULT_MOMENT_BUCKET =
  process.env.EXPO_PUBLIC_SUPABASE_MOMENT_BUCKET ||
  process.env.EXPO_PUBLIC_SUPABASE_BUCKET ||
  "moments";
const DEFAULT_AVATAR_BUCKET =
  process.env.EXPO_PUBLIC_SUPABASE_AVATAR_BUCKET || "avatars";

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

function parseDataUri(dataUri) {
  const match = /^data:([^;]+);base64,(.+)$/i.exec(dataUri || "");
  if (!match) {
    throw new Error("Invalid base64 data URI.");
  }

  return {
    mimeType: match[1] || "image/jpeg",
    base64Data: match[2],
  };
}

function getFileExtension(mimeType) {
  switch ((mimeType || "").toLowerCase()) {
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    case "image/heic":
    case "image/heif":
      return "heic";
    default:
      return "jpg";
  }
}

function base64ToUint8Array(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes;
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

async function uploadBinaryToSupabase({
  bucket,
  objectPath,
  body,
  contentType = "image/jpeg",
}) {
  const uploadUrl = `${getProjectUrl()}/storage/v1/object/${bucket}/${objectPath}`;
  const anonKey = getAnonKey();

  const response = await fetch(uploadUrl, {
    method: "POST",
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${anonKey}`,
      "Content-Type": contentType,
    },
    body,
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    throw new Error(errorText || "Supabase upload failed.");
  }

  return buildPublicUrl(bucket, objectPath);
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
    const bucket = DEFAULT_MOMENT_BUCKET;
    await uploadBinaryToSupabase({
      bucket,
      objectPath,
      body: blob,
      contentType: "image/jpeg",
    });

    return {
      imageUrl: buildPublicUrl(bucket, objectPath),
      width: optimizedImage.width,
      height: optimizedImage.height,
      path: objectPath,
      bucket,
    };
  }

  async uploadAvatarImage(localUri, userId) {
    if (!localUri) {
      throw new Error('Local image URI is required.');
    }

    if (!userId) {
      throw new Error('User id is required for image upload.');
    }

    const optimizedImage = await optimizeImage(localUri);
    const blob = await uriToBlob(optimizedImage.uri);
    const fileName = `avatar_${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`;
    const objectPath = `${userId}/${fileName}`;
    const bucket = DEFAULT_AVATAR_BUCKET;
    return uploadBinaryToSupabase({
      bucket,
      objectPath,
      body: blob,
      contentType: "image/jpeg",
    });
  }

  async uploadAvatarDataUri(dataUri, userId) {
    if (!dataUri) {
      throw new Error("Avatar data URI is required.");
    }

    if (!userId) {
      throw new Error("User id is required for avatar upload.");
    }

    const { mimeType, base64Data } = parseDataUri(dataUri);
    const extension = getFileExtension(mimeType);
    const fileName = `avatar_${Date.now()}-${Math.random()
      .toString(36)
      .slice(2)}.${extension}`;
    const objectPath = `${userId}/${fileName}`;
    const bucket = DEFAULT_AVATAR_BUCKET;

    return uploadBinaryToSupabase({
      bucket,
      objectPath,
      body: base64ToUint8Array(base64Data).buffer,
      contentType: mimeType,
    });
  }
}

export const imageUploadService = new ImageUploadService();
