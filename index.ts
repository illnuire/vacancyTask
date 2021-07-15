import express, { Application, request, Request, response, Response } from 'express';
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import sharp, { format } from 'sharp';
import FileType from 'file-type';
import mkdirp from 'mkdirp';
import { resolve } from 'path/posix';
import { rejects } from 'assert/strict';
import pool from './db';
import imageToBase64 from 'image-to-base64';

const app: Application = express();
const port = 8000;

enum Resize { finalWidth = 1400, finalHeight = 700 };

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

try{
  app.post(
    '/upload/dog/image',
    async (req: Request, res: Response): Promise<Response> => {
        let isValidFileType = false;
        let imgUrl;
        do {
            await clearFilePath(__dirname + '/download');

            const result = await (axios.get('https://random.dog/woof.json'));

            const fin = result.data;
            imgUrl = fin.url;

            await downloadPicture(imgUrl, mkdirp.sync(__dirname + '/download/'));

            const typeValidationResult = await checkType(imgUrl);
            isValidFileType = typeValidationResult.isValid;
            console.log(isValidFileType);
            
        } while (isValidFileType === false)
        
        let resizedImageInfo = new Object();
        resizedImageInfo = await resizePicture(imgUrl, mkdirp.sync(__dirname + '/download/resized'));
        const img64 = await convertPicture(__dirname + '/download/resized/' + path.basename(imgUrl)); 

        console.log(typeof(resizedImageInfo));
        console.log(resizedImageInfo);

        const fileName = path.basename(imgUrl);
        
        
        const params = Object.values(resizedImageInfo);
        
        const finalWidth: number = params[1];
        const finalHeight: number = params[2];
        const fileSize: number = params[5];
        const format: string = params[0];

        pool.connect( () => {
            console.log('Connected to DB');
        });
        pool.query(`INSERT INTO dogimage (filename, width, height, size, format, img64) values ($1, $2, $3, $4, $5, $6) RETURNING *`,
                    [fileName, finalWidth, finalHeight, fileSize, format, img64] );

      return res.status(200).send({
          resizedImageInfo,
          fileName,
      });
    }
  );
} catch (error) {
  console.log(`Error: ${error.message}`);
}

try {
    app.get(
        '/list/dog/images/:format',
        async (req: Request, res: Response): Promise<Response> => {

            pool.connect( () => {
                console.log('Connected to DB');
            });

            let format: string = req.params.format;

            const images = pool.query('SELECT * FROM dogimage WHERE format = $1', [format]);

            const result = res.json((await images).rows);
            
            return res.status(200).send({
                result
            })
        }
    )

} catch (error) {
    console.log(`Error: ${error.message}`);
}

try {
  app.listen(port, (): void => {
    console.log(`Server is listening on port ${port}`);
  });
} catch (error) {
  console.log(`Error: ${error.message}`);
}
