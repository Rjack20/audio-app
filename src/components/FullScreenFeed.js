import React, { useEffect, useRef, useState, useCallback } from 'react';
import { ref, set, update, serverTimestamp, push, get, child } from "firebase/database";
import { auth, database } from "../firebase.js";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import '../css/FullScreenFeed.css';
import { useLocation } from 'react-router';
import heart from '../images/gray-heart.png';
import redheart from '../images/red-heart.png'
import commentlogo from '../images/white-comment.png';
import CommentDrawer from './CommentDrawer';
import { useNavigate } from 'react-router';

// Date formatting utility (from previous discussion)
import { formatDistanceToNow, parseISO } from 'date-fns';

export default function FullScreenFeed() {
  const [isMuted, setIsMuted] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [currentUserName, setCurrentUserName] = useState(null); // NEW: User's display name
  const [currentUserPhotoUrl, setCurrentUserPhotoUrl] = useState(null); // NEW: User's photo URL
  const [videoLikeStatuses, setVideoLikeStatuses] = useState({});
  const [videoLikeCounts, setVideoLikeCounts] = useState({});

  const { state } = useLocation();
  const videos = state?.videos || [];
  const startIndex = state?.index || 0;
  const navigate = useNavigate();

  const [currentIndex, setCurrentIndex] = useState(startIndex);
  const containerRef = useRef(null);
  const videoRefs = useRef([]);

  const [isCommentDrawerOpen, setIsCommentDrawerOpen] = useState(false);
  // We'll remove currentVideoComments state here, as CommentDrawer fetches its own comments
  const [currentVideoIdForComments, setCurrentVideoIdForComments] = useState(null);
    const [currentVideoUserIdForComments, setCurrentUserVideoIdForComments] = useState(null);


  // --- Start of Callback Functions ---

  const formatVideoTime = useCallback((timestamp) => {
    if (!timestamp) return 'N/A';
    let date;
    if (typeof timestamp === 'object' && timestamp._seconds && timestamp._nanoseconds) {
      date = new Date(timestamp._seconds * 1000 + timestamp._nanoseconds / 1000000);
    } else if (typeof timestamp === 'string') {
      try {
        date = parseISO(timestamp);
      } catch (e) {
        date = new Date(timestamp);
      }
    } else {
      date = new Date(timestamp);
    }

    if (isNaN(date.getTime())) {
      console.warn("Invalid date for formatting:", timestamp);
      return 'Invalid Time';
    }
    return formatDistanceToNow(date, { addSuffix: true });
  }, []);

  const likeVideoNotify = () => toast.success("❤️");

  const getLikeCount = useCallback(async (videoId) => {
      if (!videoId) return 0;
      try {
          const snapshot = await get(child(ref(database, 'video-likes'), videoId));
          if (snapshot.exists()) {
              const count = snapshot.size;
              setVideoLikeCounts(prev => ({
                  ...prev,
                  [videoId]: count
              }));
              return count;
          } else {
              setVideoLikeCounts(prev => ({
                  ...prev,
                  [videoId]: null
              }));
              return null;
          }
      } catch (error) {
          console.error("Error getting like count:", error);
          setVideoLikeCounts(prev => ({
              ...prev,
              [videoId]: null
          }));
          return null;
      }
  }, []);

  const checkIfLiked = useCallback(async (userId, videoId) => {
    if (!userId || !videoId) return;
    try {
      const snapshot = await get(child(ref(database, 'liked-videos'), `${userId}/${videoId}`));
      setVideoLikeStatuses(prev => ({
        ...prev,
        [videoId]: snapshot.exists()
      }));
    } catch (error) {
      console.error("Error checking like status:", error);
      setVideoLikeStatuses(prev => ({
        ...prev,
        [videoId]: false
      }));
    }
  }, []);

  const handleLikeClick = async (e, videoId) => {
    e.stopPropagation();

    if (!currentUser) {
      toast.error("Please log in to like videos!");
      return;
    }

    const currentLikeStatus = videoLikeStatuses[videoId];
    const newLikeStatus = !currentLikeStatus;

    setVideoLikeStatuses(prev => ({ ...prev, [videoId]: newLikeStatus }));
    setVideoLikeCounts(prev => ({ ...prev, [videoId]: (prev[videoId]) + (newLikeStatus ? 1 : -1) }));

    const videoLikesRef = ref(database, `video-likes/${videoId}/${currentUser}`);
    const likedVideosRef = ref(database, `liked-videos/${currentUser}/${videoId}`);

    try {
      if (newLikeStatus) {
        await set(videoLikesRef, true);
        await set(likedVideosRef, true);
        console.log("Like saved successfully!");
        likeVideoNotify();
      } else {
        await set(videoLikesRef, null);
        await set(likedVideosRef, null);
        console.log("Like removed successfully!");
        toast.info("Like removed.");
      }
    } catch (error) {
      console.error("Error updating like: ", error);
      setVideoLikeStatuses(prev => ({ ...prev, [videoId]: currentLikeStatus }));
      setVideoLikeCounts(prev => ({ ...prev, [videoId]: (prev[videoId]) + (newLikeStatus ? -1 : 1) }));
      toast.error("Failed to update like. Please try again.");
    }
  };

  // MODIFIED handleCommentClick
  const handleCommentClick = (e, video) => {
    e.stopPropagation();
    console.log('Comment button clicked for video:', video.id || video.videoId);

    // No need to set currentVideoComments here, CommentDrawer fetches its own
    setCurrentVideoIdForComments(video.id || video.videoId); // Pass the video ID
    console.log(video.id || video.videoId)
    setCurrentUserVideoIdForComments(video.userId)
    setIsCommentDrawerOpen(true); // Open the drawer
  };

  const closeCommentDrawer = useCallback(() => {
    setIsCommentDrawerOpen(false);
    setCurrentVideoIdForComments(null); // Clear video ID when closing
    setCurrentUserVideoIdForComments(null);
  }, []);

  const handleScroll = useCallback(() => {
    if (!containerRef.current) return;
    const currentScrollTop = containerRef.current.scrollTop;
    const newIndex = Math.round(currentScrollTop / window.innerHeight);
    if (newIndex !== currentIndex) {
      setCurrentIndex(newIndex);
    }
  }, [currentIndex]);

  // --- End of Callback Functions ---

  // User Authentication Effect
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setCurrentUser(user.uid);
        // NEW: Fetch user's profile data (display name and photo URL)
        // This assumes you store user profiles under `users/{userId}` in your database
        const userProfileRef = ref(database, `users/${user.uid}`);
        get(userProfileRef)
          .then((snapshot) => {
            if (snapshot.exists()) {
              const userData = snapshot.val();
              setCurrentUserName(userData.username); // Use userName from db, fallback to auth display name
              setCurrentUserPhotoUrl(userData.photoUrl); // Use photoUrl from db, fallback to auth photo URL
            } else {
             
            }
          })
          .catch((error) => {
            console.error("Error fetching user profile:", error);
            setCurrentUserName(user.displayName); // Fallback even on error
            setCurrentUserPhotoUrl(user.photoURL);
          });
      } else {
        setCurrentUser(null);
        setCurrentUserName(null);
        setCurrentUserPhotoUrl(null);
        console.log('no user on video feed stream');
      }
    });
    return () => unsubscribe();
  }, []);

useEffect(() => {
    // This effect will run whenever currentIndex changes.
    // It will also run on the initial mount.
    if (videos.length > 0 && currentIndex >= 0 && currentIndex < videos.length) {
     
        // You can also log other data points here if needed, e.g.,
        // console.log("Current Video ID:", videos[currentIndex].videoId);
        // console.log("Current Video User:", videos[currentIndex].userName);
    } else {
        console.log("No video or invalid index for logging description.");
    }
}, [currentIndex, videos]); // Dependencies: only re-run when currentIndex or videos array changes.
  // Effect to check like status and get count when currentUser or currentIndex changes
  useEffect(() => {
    if (currentUser && videos.length > 0) {
      const currentVideo = videos[currentIndex];
      if (currentVideo && currentVideo.videoId) {
        checkIfLiked(currentUser, currentVideo.videoId);
        getLikeCount(currentVideo.videoId);
      }
    }
  }, [currentUser, currentIndex, videos, checkIfLiked, getLikeCount]);

  // Also fetch like counts for all videos initially if needed
  useEffect(() => {
    if (videos.length > 0) {
      videos.forEach(video => {
        if (video.videoId) {
          getLikeCount(video.videoId);
        }
      });
    }
  }, [videos, getLikeCount]);


  // Intersection Observer for video autoplay/pause
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const video = entry.target;
          if (!video) return;
          if (entry.isIntersecting) {
            video.muted = isMuted;
            video.play().catch((err) => { console.log('Autoplay error:', err); });
          } else {
            video.pause();
          }
        });
      }, { threshold: 0.8 }
    );

    videoRefs.current.forEach((video) => {
      if (video) observer.observe(video);
    });
    return () => {
      videoRefs.current.forEach((video) => {
        if (video) observer.unobserve(video);
      });
    };
  }, [isMuted]);



   const toggleMute = () => {
    setIsMuted((prev) => {
      const newMuteState = !prev;
      if (videoRefs.current[currentIndex]) {
        videoRefs.current[currentIndex].muted = newMuteState;
        if (!newMuteState) {
          videoRefs.current[currentIndex].play().catch((err) => console.log("Play error after unmute:", err));
        } else {
          videoRefs.current[currentIndex].muted = true;
        }
      }
      return newMuteState;
    });
  };


  // Scroll to initial video effect
  useEffect(() => {
    const scrollEl = containerRef.current;
    if (scrollEl && videos.length > 0) {
      requestAnimationFrame(() => {
        scrollEl.scrollTo({
          top: startIndex * window.innerHeight,
          behavior: 'instant',
        });
      });
    }
  }, [startIndex, videos]);

  // Handle body overflow when drawer is open/closed
  useEffect(() => {
    document.body.style.overflow = isCommentDrawerOpen ? 'hidden' : 'auto';
    return () => { document.body.style.overflow = 'auto'; };
  }, [isCommentDrawerOpen]);


  return (
    <div
      className='video-feed-container'
      ref={containerRef}
      onScroll={handleScroll}
    >
      <ToastContainer />

      {videos.map((video, i) => (
        <div
          className="video-wrapper"
          key={video.id || video.videoId || i}
          onClick={i === currentIndex ? toggleMute : undefined}
          draggable="false"
          onDragStart={(e) => e.preventDefault()}
        >
          <video
            ref={(el) => (videoRefs.current[i] = el)}
            src={video.videoUrl}
            autoPlay={false}
            muted={isMuted}
            loop
            playsInline
            className="video-player"
          />

          <div className="video-description">
            {video.description}
          </div>

          <div className="video-controls">
            <img style={{ width: "35px", height: "35px", borderRadius: "50%", cursor: "pointer" }} src={video.photoUrl} onClick={() => navigate(`/profile/${video.userId}`)} alt="User Profile" />
            <p style={{ color: "white", cursor: "pointer" }} onClick={() => navigate(`/profile/${video.userId}`)}>{video.userName}</p>
            <img
              className='video-like'
              src={videoLikeStatuses[video.videoId] ? redheart : heart}
              alt="Like"
              onClick={(e) => { handleLikeClick(e, video.videoId) }}
            />
            <p className='video-like-count'>
                {videoLikeCounts[video.videoId] !== undefined ? videoLikeCounts[video.videoId] : null}
            </p>
            <img
              className='video-comment'
              src={commentlogo}
              alt="Comment"
              onClick={(e) => handleCommentClick(e, video)}
            />
            <p className='video-time'>{formatVideoTime(video.time)}</p>
            <p className='video-delete' onClick={() => { console.log('delete video') }} >...</p>
          </div>
        </div>
      ))}

      <CommentDrawer
        isOpen={isCommentDrawerOpen}
        onClose={closeCommentDrawer}
        videoUserId={currentVideoUserIdForComments} // Removed, drawer fetches its own
        videoId={currentVideoIdForComments}
        currentUser={currentUser}
        currentUserName={currentUserName} // Pass user's display name
        currentUserPhotoUrl={currentUserPhotoUrl} // Pass user's photo URL
      />
    </div>
  );
}