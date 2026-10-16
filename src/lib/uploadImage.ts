import { supabase } from './supabase';
import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';

/**
 * Uploads an image URI to Supabase storage and returns the public URL.
 * If the URI is already a web URL (e.g. from a previous upload or external source), it just returns it.
 */
export const uploadFileToSupabase = async (uri: string, bucketName: string = 'media', isDocument: boolean = false): Promise<string> => {
  if (!uri) return '';
  if (uri.startsWith('http')) return uri;

  try {
    let extension = 'jpg';
    let contentType = 'image/jpeg';
    
    if (isDocument) {
      if (uri.toLowerCase().endsWith('.pdf')) { extension = 'pdf'; contentType = 'application/pdf'; }
      else if (uri.toLowerCase().endsWith('.png')) { extension = 'png'; contentType = 'image/png'; }
      else if (uri.toLowerCase().endsWith('.docx') || uri.toLowerCase().endsWith('.doc')) { extension = 'docx'; contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'; }
      else { extension = 'bin'; contentType = 'application/octet-stream'; }
    } else {
      if (uri.toLowerCase().endsWith('.png')) { extension = 'png'; contentType = 'image/png'; }
    }
    
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${extension}`;
    
    let base64;
    
    if (Platform.OS === 'web') {
      const response = await fetch(uri);
      const blob = await response.blob();
      if (isDocument && blob.type) contentType = blob.type;
      
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = async () => {
          try {
            const base64data = reader.result?.toString().split(',')[1];
            if (!base64data) throw new Error("Failed to convert file to base64");
            
            const { data, error } = await supabase.storage
              .from(bucketName)
              .upload(fileName, decode(base64data), {
                contentType,
                upsert: false
              });
              
            if (error) throw error;
            
            const { data: publicUrlData } = supabase.storage.from(bucketName).getPublicUrl(fileName);
            resolve(publicUrlData.publicUrl);
          } catch (e) {
            reject(e);
          }
        };
        reader.readAsDataURL(blob);
      });
    } else {
      base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      
      const { data, error } = await supabase.storage
        .from(bucketName)
        .upload(fileName, decode(base64), {
          contentType,
          upsert: false
        });

      if (error) throw error;
      
      const { data: publicUrlData } = supabase.storage.from(bucketName).getPublicUrl(fileName);
      return publicUrlData.publicUrl;
    }
  } catch (error) {
    console.error('Error uploading file: ', error);
    throw error;
  }
};

export const uploadImageToSupabase = async (uri: string, bucketName: string = 'media'): Promise<string> => {
  return uploadFileToSupabase(uri, bucketName, false);
};



// Helper function to decode base64 string to ArrayBuffer for Supabase upload
// Required for React Native environments where we don't have Node Buffer
function decode(base64: string): ArrayBuffer {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  let bufferLength = base64.length * 0.75,
    len = base64.length,
    i, p = 0,
    encoded1, encoded2, encoded3, encoded4;

  if (base64[base64.length - 1] === "=") {
    bufferLength--;
    if (base64[base64.length - 2] === "=") {
      bufferLength--;
    }
  }

  const arraybuffer = new ArrayBuffer(bufferLength),
    bytes = new Uint8Array(arraybuffer);

  for (i = 0; i < len; i += 4) {
    encoded1 = chars.indexOf(base64[i]);
    encoded2 = chars.indexOf(base64[i + 1]);
    encoded3 = chars.indexOf(base64[i + 2]);
    encoded4 = chars.indexOf(base64[i + 3]);

    bytes[p++] = (encoded1 << 2) | (encoded2 >> 4);
    bytes[p++] = ((encoded2 & 15) << 4) | (encoded3 >> 2);
    bytes[p++] = ((encoded3 & 3) << 6) | (encoded4 & 63);
  }

  return arraybuffer;
}
