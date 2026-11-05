// Turns a picture someone uploads into a small square image saved inside the subscription.
// A phone photo can be several megabytes; at 128 pixels it is a few kilobytes, which keeps the
// list fast and needs no separate file storage. 128 pixels stays sharp on a 40px card logo even
// on a phone screen with 3x pixels.
const SIZE = 128

// The middle square of the picture is kept, like a profile picture. App icons are already
// square; a screenshot or photo fills the logo instead of shrinking to a thin strip inside it.
export async function shrinkImage(file) {
  const bitmap = await createImageBitmap(file)
  const side = Math.min(bitmap.width, bitmap.height)
  const left = (bitmap.width - side) / 2
  const top = (bitmap.height - side) / 2

  const canvas = document.createElement('canvas')
  canvas.width = SIZE
  canvas.height = SIZE
  canvas.getContext('2d').drawImage(bitmap, left, top, side, side, 0, 0, SIZE, SIZE)
  bitmap.close()

  // WebP is the smallest. Browsers that can't make it hand back a PNG instead.
  return canvas.toDataURL('image/webp', 0.85)
}
