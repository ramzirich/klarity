import { Request, Response } from 'express';

interface MulterRequest extends Request {
  file: Express.Multer.File;
}

export const uploadImage = (req: Request, res: Response) => {
  const file = (req as MulterRequest).file;

  if (!file) {
    res.status(400).json({ error: 'No file uploaded' });
    return;
  }

  res.status(200).json({
    message: 'Image uploaded successfully',
    filename: file.originalname,
    path: `/uploads/${file.originalname}`,
  });
};


