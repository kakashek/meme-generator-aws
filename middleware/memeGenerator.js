const sharp = require('sharp');
const path = require('path');
const axios = require('axios');
const fs = require('fs');
const asyncHandler = require("express-async-handler");
const { putFileToS3, generateRetrievalUrl } = require("../controllers/imageController");

exports.meme_generator = asyncHandler(async (req, res) => {

  const imagePath = req.body.path; 
  const title = req.body.title
  const text0 = req.body.text0;
  const text1 = req.body.text1;
  const color = req.body.color; 
  const transformation = req.body.transformation;

  // Function to download external image
  async function downloadImage(url) {
    const response = await axios({
      url,
      responseType: 'arraybuffer'
    });
    return Buffer.from(response.data);
  }

  // get image from path
  try {
    let imageBuffer;
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      imageBuffer = await downloadImage(imagePath);
    } else {
      const imageUrl = new URL(imagePath);
      localPath = path.join(__dirname, 'efs', imageUrl.pathname);
      imageBuffer = await fs.promises.readFile(localPath);
    }
  

    let image = sharp(imageBuffer);
    image = image.resize({
      width: 4000, 
      height: 4000, 
      fit: 'fill'
    });

    // Apply random transformation
    if (transformation) {
      for (let i = 0; i < 5000; i++) {;
        const sigma = Math.random() * 3 + 0.001;
        const m1 = Math.random() * 300;
        const m2 = Math.random() * 300;
        const x1 = Math.random() * 300;
        const y2 = Math.random() * 300;
        const y3 = Math.random() * 300;
        const brightness = Math.random() * 0.4 + 0.8; 
        const saturation = Math.random() * 0.4 + 0.8; 

        image = image.modulate({
          brightness: brightness,
          saturation: saturation,
        })
        image = image.sharpen({
          sigma: sigma,
          m1: m1,
          m2: m2,
          x1: x1,
          y2: y2,
          y3: y3,
        })
        const kernel = [
          [1, 1, 1, 1, 1],
          [1, 1, 1, 1, 1],
          [1, 1, -1, 1, 1],
          [1, 1, 1, 1, 1],
          [1, 1, 1, 1, 1]
        ];

        image = image.convolve({
          width: 5,
          height: 5,
          kernel: kernel.flat()
        });

        if (Math.random() >= 0.5) {
          const red = Math.floor(Math.random() * 256);
          const green = Math.floor(Math.random() * 256);
          const blue = Math.floor(Math.random() * 256);
          image = image.tint({ r: red, g: green, b: blue });
        }
        if (Math.random() >= 0.5) {
          image = image.greyscale();
        }
      }
    }

    // Add text on image
    const svgText0 = text0 ? `<text x="50%" y="15%" font-family="Impact, sans-serif" font-size="384" fill="${color}" text-anchor="middle">${text0}</text>` : '';
    const svgText1 = text1 ? `<text x="50%" y="85%" font-family="Impact, sans-serif" font-size="384" fill="${color}" text-anchor="middle">${text1}</text>` : '';
    const svgOverlay = Buffer.from(
      `<svg width="4000" height="4000">
        ${svgText0}
        ${svgText1}
      </svg>`
    );
    image = image.composite([{ input: svgOverlay, top: 0, left: 0 }]);

    // Convert image back to buffer
    const processedImage = await image.toBuffer();
    const newKey = `processed/${Date.now()}`;
    const mimeType = "image/jpg";
    const response = await putFileToS3(newKey, processedImage, mimeType);

    if (response.success) {

      // Get pre-signed URL
      const imageUrl = await generateRetrievalUrl(newKey, 3600)

      const responseData = {
        success: true,
        message: 'Meme generated successfully',
        data: 
        {
          generatedImageKey: newKey,
          generatedImageUrl: imageUrl,
          title: title,
          metadata:
          {
            text0: text0,
            text1: text1,
            color: color
          }
        }
      }
      // Return image data
      res.status(200).json(responseData);

    } else {
      res.status(500).json({
        success: false,
        message: response.message
      });
    }

  } catch (error) {
      console.error('Error processing image:', error);
      res.status(500).send('Failed to process image');
  }
});

