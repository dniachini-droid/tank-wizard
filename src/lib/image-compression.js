/* ---------------------------------- image compression ---------------------------------- */

/* Browser storage is small, so shrink until the encoded image fits a budget
   rather than trusting a single quality setting. */
export function compressImage(file, maxW = 900, quality = 0.7, maxBytes = 220000) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        try {
          let w = maxW, q = quality, out = null;
          for (let attempt = 0; attempt < 7; attempt++) {
            const scale = Math.min(1, w / img.width);
            const canvas = document.createElement("canvas");
            canvas.width = Math.max(1, Math.round(img.width * scale));
            canvas.height = Math.max(1, Math.round(img.height * scale));
            const ctx = canvas.getContext("2d");
            ctx.fillStyle = "#fff";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            out = canvas.toDataURL("image/jpeg", q);
            // base64 is ~4/3 the byte size of the encoded data
            if (out.length * 0.75 <= maxBytes) break;
            if (q > 0.45) q -= 0.12; else w = Math.round(w * 0.8);
          }
          resolve(out);
        } catch (err) {
          reject(new Error("Could not process that image. Try a JPEG or PNG."));
        }
      };
      img.onerror = () => reject(new Error(
        "That image format could not be read. iPhone photos saved as HEIC sometimes fail — in Settings > Camera > Formats choose Most Compatible, or share the photo as a JPEG first."));
      img.src = reader.result;
    };
    reader.onerror = () => reject(new Error("Could not read that file."));
    reader.readAsDataURL(file);
  });
}
