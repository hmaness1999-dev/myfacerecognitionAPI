const { imageSize } = require('image-size');

const handleImageUrl = async (req, res) => {
  const imageUrl = req.body.input;

  try {
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) throw new Error('Failed to fetch image');
    const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());
    const { width, height } = imageSize(imageBuffer);

    const params = new URLSearchParams({
      api_key: process.env.FACEPP_API_KEY,
      api_secret: process.env.FACEPP_API_SECRET,
      image_url: imageUrl
    });

    const faceResponse = await fetch('https://api-us.faceplusplus.com/facepp/v3/detect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params
    });

    const faceData = await faceResponse.json();

    if (!faceData.faces || faceData.faces.length === 0) {
      return res.status(400).json('no face detected');
    }

    const rect = faceData.faces[0].face_rectangle;

    res.json({
      outputs: [{
        data: {
          regions: [{
            region_info: {
              bounding_box: {
                left_col: rect.left / width,
                top_row: rect.top / height,
                right_col: (rect.left + rect.width) / width,
                bottom_row: (rect.top + rect.height) / height
              }
            }
          }]
        }
      }]
    });
  } catch (err) {
    console.error('Error in face detection:', err);
    res.status(400).json('error calling face detection');
  }
}

module.exports = {
  handleImageUrl
}
