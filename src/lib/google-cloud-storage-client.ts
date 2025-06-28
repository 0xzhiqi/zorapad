import { Storage } from '@google-cloud/storage';

const storage = new Storage({
  projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
  credentials: {
    client_email: process.env.GOOGLE_CLOUD_CLIENT_EMAIL,
    private_key: process.env.GOOGLE_CLOUD_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  },
});

const bucket = storage.bucket(process.env.GOOGLE_CLOUD_BUCKET_NAME!);

export { storage, bucket };

// USAGE

// import { bucket } from '../../lib/storage';

// export default async function handler(req, res) {
//   if (req.method === 'POST') {
//     try {
//       const { filename, fileBuffer } = req.body;

//       const file = bucket.file(filename);
//       await file.save(fileBuffer);

//       const publicUrl = `https://storage.googleapis.com/${bucket.name}/${filename}`;

//       res.status(200).json({ url: publicUrl });
//     } catch (error) {
//       res.status(500).json({ error: error.message });
//     }
//   }
// }
