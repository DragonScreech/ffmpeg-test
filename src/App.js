import React, { useState } from 'react';
import { createFFmpeg, fetchFile } from '@ffmpeg/ffmpeg';

const App = () => {
  const [images, setImages] = useState([]);
  const [audio, setAudio] = useState(null);
  const [video, setVideo] = useState(null);
  const ffmpeg = createFFmpeg({ log: true });

  const loadFFmpeg = async () => {
    await ffmpeg.load();
  };

  const handleImagesChange = (e) => {
    setImages([...e.target.files]);
  };

  const handleAudioChange = (e) => {
    setAudio(e.target.files[0]);
  };

  const createVideo = async () => {
    await loadFFmpeg();

    images.forEach(async (image, index) => {
      ffmpeg.FS('writeFile', `image${index}.png`, await fetchFile(image));
    });

    ffmpeg.FS('writeFile', 'audio.mp3', await fetchFile(audio));

    await ffmpeg.run('-i', 'audio.mp3', '-hide_banner');
    const audioDuration = ffmpeg.FS('stat', 'audio.mp3').size;

    // Calculate the duration each image should be displayed
    const imageDuration = (audioDuration / 10000) / images.length;
    const roundedImageDuration = Math.floor(imageDuration)

    await ffmpeg.run(
      '-framerate', `1/${imageDuration}`, // Change the framerate to adjust the duration of each image
      '-i', 'image%d.png',
      '-i', 'audio.mp3',
      '-c:v', 'libx264',
      '-pix_fmt', 'yuv420p',
      '-c:a', 'aac',
      '-shortest', // Ensure the video is not longer than the audio
      'output.mp4'
    );

    const data = ffmpeg.FS('readFile', 'output.mp4');
    const videoUrl = URL.createObjectURL(new Blob([data.buffer], { type: 'video/mp4' }));
    setVideo(videoUrl);
  };

  return (
    <div>
      <h1>Create Video</h1>
      <input type="file" accept="image/*" multiple onChange={handleImagesChange} />
      <input type="file" accept="audio/*" onChange={handleAudioChange} />
      <button onClick={createVideo}>Create Video</button>
      {video && <video src={video} controls />}
    </div>
  );
};

export default App;


