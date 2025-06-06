// src/components/UserProfileTabs.js (Create this new file)
import React, { useState, useEffect } from 'react';
import { ref, get, child, query, orderByChild, equalTo } from 'firebase/database';
import { database } from '../firebase'; // Adjust path if your firebase.js is elsewhere
import VideoPost from './VideoPost.js';
import { useNavigate } from 'react-router';

// Assuming you have these components:
import AudioPost from '../components/AudioPost.js'
import Spinner from './Spinner';     // For loading states

import '../css/UserProfileTabs.css'; // Link to the new CSS file

const UserProfileTabs = ({path, profileUserId }) => {
    // State to manage which tab is currently active
    const [activeTab, setActiveTab] = useState('likedSongs'); // Default tab
    const [activeIndex, setActiveIndex] = useState(null);

    // States for data fetched for each tab
    const [likedSongs, setLikedSongs] = useState([]);
    const [videos, setVideos] = useState([]); // This will hold video data

    // States for loading indicators
    const [loadingLikedSongs, setLoadingLikedSongs] = useState(true);
    const [loadingVideos, setLoadingVideos] = useState(true);
  const navigate = useNavigate();

    // --- Effect to Fetch Liked Songs Data ---
    useEffect(() => {
        const fetchLikedSongs = async () => {
            setLoadingLikedSongs(true);
            try {
                // 1. Get all song IDs that the profileUserId has liked
                const likedSongsRef = ref(database, `user-liked-songs/${profileUserId}`);
                const likedSongsSnapshot = await get(likedSongsRef);

                const fetchedLikedSongIds = [];
                if (likedSongsSnapshot.exists()) {
                    likedSongsSnapshot.forEach(childSnap => {
                        // Assuming structure: user-liked-songs/{userId}/{songId}: true
                        fetchedLikedSongIds.push(childSnap.key); // The songId is the key
                        console.log(childSnap.key)
                    });
                }

                // 2. For each liked song ID, fetch the full song data from the 'songs' collection
                const fetchedSongsData = [];
                if (fetchedLikedSongIds.length > 0) {
                    const songPromises = fetchedLikedSongIds.map(async songId => {
                        // Assuming full song data is at songs/{songId}
                        const songDataRef = ref(database, `songs/${songId}`);
                        const songDataSnapshot = await get(songDataRef);
                        if (songDataSnapshot.exists()) {
                            console.log(songDataSnapshot.val())
                            return { songId: songDataSnapshot.key, ...songDataSnapshot.val() };
                        }
                        return null; // Return null if song data doesn't exist (e.g., deleted)
                    });
                    const results = await Promise.all(songPromises);
                    fetchedSongsData.push(...results.filter(song => song !== null)); // Filter out any nulls
                }
                setLikedSongs(fetchedSongsData);
            } catch (error) {
                console.error("Error fetching liked songs:", error);
                setLikedSongs([]); // Ensure state is cleared on error
            } finally {
                setLoadingLikedSongs(false);
            }
        };

        // Only fetch if this tab is active AND a profileUserId is provided
        // or if it's the initial load for the default tab.
        if (profileUserId && activeTab === 'likedSongs') {
            fetchLikedSongs();
        }
    }, [activeTab, profileUserId]); // Re-run effect when activeTab or profileUserId changes

    // --- Effect to Fetch Videos Data (Placeholder) ---
    // This assumes videos are stored in a 'videos' top-level node in your DB,
    // with a 'userId' field linking them to the uploader.
    useEffect(() => {
        const fetchVideos = async () => {
     try{
        setLoadingVideos(true)
  const videoIdList = [];
        const dbRef = ref(database);
    
        get(child(dbRef, `user-videos/${profileUserId}`))
          .then((snapshot) => {
            if (snapshot.exists()) {
              snapshot.forEach((snap) => {
                videoIdList.push(snap.key); // Each value is a video ID
              });
              getVideos(videoIdList); // Only call once
            } else {
              console.log("No video IDs found.");
            }
          })
          .catch((error) => {
            setLoadingVideos(false)
            console.error("Error fetching video IDs:", error);
          });
     }
     catch{

     }
        };

        // Only fetch if this tab is active AND a profileUserId is provided
        if (profileUserId && activeTab === 'videos') {
            fetchVideos();
        }
    }, [activeTab, profileUserId]); // Re-run effect when activeTab or profileUserId changes

  function getVideos(list) {
    const dbRef = ref(database);

    const videosPromises = list.map(async (id) => {
      const snapshot = await get(child(dbRef, `videos/${id}`));
        if (snapshot.exists()) {
            return {
                description: snapshot.val().description,
                photoUrl: snapshot.val().photoUrl,
                videoId: snapshot.key,
                userId: snapshot.val().userId,
                time: snapshot.val().time,
                 userName: snapshot.val().userName,
                  videoUrl: snapshot.val().videoUrl,
            };
        }
        return null;
    });

    Promise.all(videosPromises)
      .then((results) => {
  
        setVideos(results);
        console.log("Final video list:", results);
        setLoadingVideos(false)

      })
      .catch((error) => {
        console.error('Error fetching songs:', error);
        setLoadingVideos(false)
      });
  }


 

    return (
        <div className="user-profile-tabs-container" >
            {/* Tab Buttons Header */}
            <div className="tabs-header" >
                <button
                    className={`tab-button ${activeTab === 'likedSongs' ? 'active' : ''}`}
                    onClick={() => setActiveTab('likedSongs')}
                >
                    Liked Songs
                </button>
                <button
                    className={`tab-button ${activeTab === 'videos' ? 'active' : ''}`}
                    onClick={() => setActiveTab('videos')}
                >
                    Videos
                </button>
            </div>

            {/* Tab Content Wrapper (Handles Sliding) */}
            <div className="tabs-content-wrapper">
                <div
                    className={`tabs-content-slider ${activeTab === 'likedSongs' ? 'show-liked-songs' : 'show-videos'}`}
                >
                    {/* Liked Songs Tab Pane */}
                    <div className="tab-pane liked-songs-pane">
                        {loadingLikedSongs ? (
                            <Spinner /> // Show spinner while loading
                        ) : likedSongs.length > 0 ? likedSongs.map((song, index) => (

                            <AudioPost
                                key={index}
                                songTitle={song.songTitle}
                                songArtist={song.songArtist}
                                songUrl={song.songUrl}
                                userId={song.userId}
                                songId={song.songId}
                                UID={profileUserId}
                                time={song.time}
                                isActive={index === activeIndex}
                                onPlay={() => setActiveIndex(index)}
                                onStop={() => index === activeIndex && setActiveIndex(null)}



                            />
                        )) : (
                            <p>No liked songs found for this user.</p>
                        )}

                    </div>

                    {/* Videos Tab Pane */}
                    <div className="tab-pane videos-pane"> {/* Added 'videos-pane' class for potential future specific styling if needed */}
                        {loadingVideos ? (
                            <Spinner />
                        ) : videos.length > 0 ? (
                            <div className="video-grid">

                                {videos.map((video, index) => (
                                    <div key={index} onClick={() => navigate('/watch', { state: { videos, index } })} className="video-item"> {/* ADDED className="video-item" HERE */}
                                        <VideoPost
                                        path={path}
                                            videoId={video.videoId}
                                            time={video.time}
                                            userId={video.userId}
                                            userName={video.userName}
                                            photoUrl={video.photoUrl} // <-- **ENSURE THIS PROP IS PASSED**
                                            videoUrl={video.videoUrl}
                                        />
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p>No videos found for this user.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserProfileTabs;


