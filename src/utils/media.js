const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api/v1';

function apiOrigin() {
  try {
    return new URL(API_BASE_URL).origin;
  } catch {
    return 'http://127.0.0.1:8000';
  }
}

export function assetUrl(value) {
  if (!value) return '';
  if (value instanceof File) return URL.createObjectURL(value);

  const url = String(value).trim();
  if (!url) return '';
  if (/^(https?:|data:|blob:)/i.test(url)) return url;

  const origin = apiOrigin();
  if (url.startsWith('/')) return `${origin}${url}`;
  if (url.startsWith('storage/')) return `${origin}/${url}`;
  if (url.startsWith('uploads/')) return `${origin}/storage/${url}`;

  return `${origin}/storage/${url}`;
}

export function bookCoverUrl(book) {
  return assetUrl(
    book?.cover_url ||
    book?.cover_image_url ||
    book?.cover_path ||
    book?.cover_image ||
    book?.cover ||
    book?.image_url ||
    book?.image
  );
}

export function personImageUrl(person) {
  return assetUrl(
    person?.photo_url ||
    person?.avatar_url ||
    person?.profile_photo_url ||
    person?.image_url ||
    person?.photo_path ||
    person?.avatar ||
    person?.photo ||
    person?.image
  );
}
