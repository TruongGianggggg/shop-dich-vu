const MAX_LOGO_PIXELS = 24_000_000;
const BACKGROUND_MIN_CHANNEL = 205;
const BACKGROUND_MAX_CHANNEL_SPREAD = 28;
const EDGE_MIN_CHANNEL = 165;
const EDGE_MAX_CHANNEL_SPREAD = 36;
const CROP_PADDING = 8;

export async function prepareLogoForUpload(file: File) {
  const { image, release } = await loadImage(file);

  try {
    const width = image.naturalWidth;
    const height = image.naturalHeight;

    if (!width || !height || width * height > MAX_LOGO_PIXELS) {
      throw new Error("Kích thước logo quá lớn để xử lý nền.");
    }

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d", { willReadFrequently: true });

    if (!context) {
      throw new Error("Trình duyệt không hỗ trợ xử lý nền logo.");
    }

    context.drawImage(image, 0, 0);
    const imageData = context.getImageData(0, 0, width, height);
    const { data } = imageData;
    const background = findEdgeConnectedBackground(data, width, height);
    const removedCount = removeBackgroundAndSoftenEdge(data, background, width, height);

    if (!removedCount) {
      return file;
    }

    const crop = findVisibleBounds(data, width, height);
    if (!crop) {
      throw new Error("Không tìm thấy phần logo sau khi bỏ nền.");
    }

    context.putImageData(imageData, 0, 0);
    const outputCanvas = document.createElement("canvas");
    outputCanvas.width = crop.width;
    outputCanvas.height = crop.height;
    const outputContext = outputCanvas.getContext("2d");

    if (!outputContext) {
      throw new Error("Trình duyệt không hỗ trợ xuất logo trong suốt.");
    }

    outputContext.drawImage(
      canvas,
      crop.left,
      crop.top,
      crop.width,
      crop.height,
      0,
      0,
      crop.width,
      crop.height,
    );

    const blob = await canvasToBlob(outputCanvas);
    const baseName = file.name.replace(/\.[^.]+$/, "") || "logo";

    return new File([blob], `${baseName}-transparent.png`, {
      type: "image/png",
      lastModified: Date.now(),
    });
  } finally {
    release();
  }
}

async function loadImage(file: File) {
  const objectUrl = URL.createObjectURL(file);
  const image = new Image();

  try {
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error("Không đọc được tệp logo."));
      image.src = objectUrl;
    });
  } catch (error) {
    URL.revokeObjectURL(objectUrl);
    throw error;
  }

  return {
    image,
    release: () => URL.revokeObjectURL(objectUrl),
  };
}

function findEdgeConnectedBackground(
  data: Uint8ClampedArray,
  width: number,
  height: number,
) {
  const pixelCount = width * height;
  const background = new Uint8Array(pixelCount);
  const queue = new Int32Array(pixelCount);
  let head = 0;
  let tail = 0;

  function enqueue(index: number) {
    if (background[index] || !isBackgroundPixel(data, index)) return;
    background[index] = 1;
    queue[tail] = index;
    tail += 1;
  }

  for (let x = 0; x < width; x += 1) {
    enqueue(x);
    enqueue((height - 1) * width + x);
  }
  for (let y = 0; y < height; y += 1) {
    enqueue(y * width);
    enqueue(y * width + width - 1);
  }

  while (head < tail) {
    const index = queue[head];
    head += 1;
    const x = index % width;
    const y = Math.floor(index / width);

    if (x > 0) enqueue(index - 1);
    if (x + 1 < width) enqueue(index + 1);
    if (y > 0) enqueue(index - width);
    if (y + 1 < height) enqueue(index + width);
  }

  return background;
}

function isBackgroundPixel(data: Uint8ClampedArray, pixelIndex: number) {
  const offset = pixelIndex * 4;
  if (data[offset + 3] === 0) return true;

  return isNeutralLightPixel(
    data[offset],
    data[offset + 1],
    data[offset + 2],
    BACKGROUND_MIN_CHANNEL,
    BACKGROUND_MAX_CHANNEL_SPREAD,
  );
}

function removeBackgroundAndSoftenEdge(
  data: Uint8ClampedArray,
  background: Uint8Array,
  width: number,
  height: number,
) {
  let removedCount = 0;

  for (let index = 0; index < background.length; index += 1) {
    if (!background[index]) continue;
    data[index * 4 + 3] = 0;
    removedCount += 1;
  }

  for (let index = 0; index < background.length; index += 1) {
    if (background[index] || !touchesBackground(background, index, width, height)) {
      continue;
    }

    const offset = index * 4;
    const red = data[offset];
    const green = data[offset + 1];
    const blue = data[offset + 2];

    if (
      !isNeutralLightPixel(
        red,
        green,
        blue,
        EDGE_MIN_CHANNEL,
        EDGE_MAX_CHANNEL_SPREAD,
      )
    ) {
      continue;
    }

    const darkestChannel = Math.min(red, green, blue);
    const opacity = Math.max(
      0,
      Math.min(1, (BACKGROUND_MIN_CHANNEL - darkestChannel) / 40),
    );
    data[offset + 3] = Math.round(data[offset + 3] * opacity);
  }

  return removedCount;
}

function touchesBackground(
  background: Uint8Array,
  index: number,
  width: number,
  height: number,
) {
  const x = index % width;
  const y = Math.floor(index / width);

  return (
    (x > 0 && background[index - 1] === 1) ||
    (x + 1 < width && background[index + 1] === 1) ||
    (y > 0 && background[index - width] === 1) ||
    (y + 1 < height && background[index + width] === 1)
  );
}

function isNeutralLightPixel(
  red: number,
  green: number,
  blue: number,
  minChannel: number,
  maxSpread: number,
) {
  return (
    Math.min(red, green, blue) >= minChannel &&
    Math.max(red, green, blue) - Math.min(red, green, blue) <= maxSpread
  );
}

function findVisibleBounds(
  data: Uint8ClampedArray,
  width: number,
  height: number,
) {
  let left = width;
  let top = height;
  let right = -1;
  let bottom = -1;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      if (data[(y * width + x) * 4 + 3] <= 8) continue;
      left = Math.min(left, x);
      top = Math.min(top, y);
      right = Math.max(right, x);
      bottom = Math.max(bottom, y);
    }
  }

  if (right < left || bottom < top) return null;

  left = Math.max(0, left - CROP_PADDING);
  top = Math.max(0, top - CROP_PADDING);
  right = Math.min(width - 1, right + CROP_PADDING);
  bottom = Math.min(height - 1, bottom + CROP_PADDING);

  return {
    left,
    top,
    width: right - left + 1,
    height: bottom - top + 1,
  };
}

function canvasToBlob(canvas: HTMLCanvasElement) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("Không thể xuất logo PNG trong suốt."));
    }, "image/png");
  });
}
