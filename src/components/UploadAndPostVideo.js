import React, { useRef, useState, useEffect } from "react";
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getDatabase, serverTimestamp, ref, push, set } from 'firebase/database';


 
const uploadAndPostVideo = async ({ file, userName, userId, description }) => {
  try {
    const storage = getStorage();
    const db = getDatabase();

    const timestamp = Date.now();
    const videoPath = `videos/${userId}/${timestamp}-${file.name}`;
    const videoStorageRef = storageRef(storage, videoPath);

    // Step 1: Upload video to Firebase Storage
    await uploadBytes(videoStorageRef, file);

    // Step 2: Get download URL
    const downloadURL = await getDownloadURL(videoStorageRef);

    // Step 3: Save metadata to Realtime Database
    const time = serverTimestamp()
    const videosRef = ref(db, 'videos');
    const newVideoRef = await push(videosRef, {
      videoUrl: downloadURL,
      userName,
      userId,
      description,
      time,
    });

    const videoKey = newVideoRef.key;

    // Step 4: Link under /user-videos/userId/videoKey
    const userVideoRef = ref(db, `user-videos/${userId}/${videoKey}`);
    await set(userVideoRef, true);

    console.log(`✅ Video uploaded and saved. Video ID: ${videoKey}`);
  } catch (error) {
    console.error('❌ Error uploading and posting video:', error);
  }
};

export default uploadAndPostVideo;
