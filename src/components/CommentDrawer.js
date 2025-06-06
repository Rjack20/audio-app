import React, { useState, useEffect, useCallback } from 'react';
import '../css/CommentDrawer.css';
import { ref, set, remove, push, serverTimestamp, get, child } from "firebase/database";
import { database } from "../firebase.js";
import { formatDistanceToNow, parseISO } from 'date-fns';
import heart from '../images/gray-heart.png';
import redheart from '../images/red-heart.png'
import { ToastContainer, toast } from 'react-toastify';
import { useNavigate } from 'react-router';


// Change the prop destructuring to provide a default empty array for `comments`
export default function CommentDrawer({ isOpen, onClose, comments = [], videoId, currentUser, videoUserId, currentUserName, currentUserPhotoUrl }) {
  const [newCommentText, setNewCommentText] = useState('');
  // Initialize displayComments with an empty array if comments is undefined, or use comments if it's already an array
  const [displayComments, setDisplayComments] = useState(comments || []); // Use comments || []
    const navigate = useNavigate();

  const commentPostedNotify = () => toast.success("Comment posted!");

   const handleLikeComment = async (commentId) => {
    if (!currentUser) {
      toast.error("Please sign in to like comments!");
      return;
    }

    const commentLikesRef = ref(database, `comment-likes/${commentId}/${currentUser}`);
    const commentRef = ref(database, `video-comments/${videoId}/${commentId}`);

    try {
      const snapshot = await get(commentLikesRef);
      if (snapshot.exists()) {
        // User already liked, so unlike
        await remove(commentLikesRef);
        await get(commentRef).then(async (snap) => {
            if(snap.exists()){
                const currentLikes = snap.val().likesCount;
                await set(child(commentRef, 'likesCount'), currentLikes - 1); // Decrement like count
            }
        })
        
        toast.info("Comment unliked!");
      } else {
        // User hasn't liked, so like
        await set(commentLikesRef, true); // Mark as liked by this user
        await get(commentRef).then(async (snap) => {
            if(snap.exists()){
                const currentLikes = snap.val().likesCount;
                await set(child(commentRef, 'likesCount'), currentLikes + 1); // Increment like count
            }
        })
        
        toast.success("Comment liked!");
        // Optional: Send a notification to the comment author
        sendCommentLikeNotification(commentId);
      }
      // Re-fetch comments to update counts and like status in UI
      fetchComments();
    } catch (error) {
      console.error("Error toggling comment like:", error);
      toast.error("Failed to toggle like. Please try again.");
    }
  };

  // 2. Function to check if the current user has liked a specific comment
  const checkIfCommentLiked = useCallback(async (commentId) => {
    if (!currentUser) return false;
    try {
      const snapshot = await get(ref(database, `comment-likes/${commentId}/${currentUser}`));
      return snapshot.exists();
    } catch (error) {
      console.error("Error checking comment like status:", error);
      return false;
    }
  }, [currentUser]);

  // 3. Helper to send notification for comment like
  const sendCommentLikeNotification = async (commentId) => {
    try {
        const commentSnap = await get(ref(database, `video-comments/${videoId}/${commentId}`));
        if (commentSnap.exists()) {
            const commentData = commentSnap.val();
            const commentAuthorId = commentData.userId;

            // Don't send notification if user likes their own comment
            if (commentAuthorId === currentUser) {
                return;
            }

            push(ref(database, `notifications/${commentAuthorId}/`), {
                notiText: 'liked your comment',
                time: serverTimestamp(),
                photoUrl: currentUserPhotoUrl,
                userName: currentUserName,
                userId: currentUser,
                recieverUserId: commentAuthorId,
                videoId: videoId,
                comment: commentData.comment, // The liked comment text
                commentId: commentId, // The ID of the liked comment
                type: 'comment_like' // Add a type for notification filtering
            });
            console.log("Comment like notification sent!");
        }
    } catch (error) {
        console.error("Error sending comment like notification:", error);
    }
  };
 
  // Function to fetch comments for the video
  const fetchComments = async () => {
    if (!videoId) {
      setDisplayComments([]);
      return;
    }
    try {
      const commentsRef = ref(database, `video-comments/${videoId}`);
      const snapshot = await get(commentsRef);
      if (snapshot.exists()) {
        const commentsData = [];
        const likeChecks = []; // Array to hold promises for like checks

        snapshot.forEach((childSnapshot) => {
          const comment = { id: childSnapshot.key, ...childSnapshot.val() };
          commentsData.push(comment);
          likeChecks.push(checkIfCommentLiked(comment.id)); // Add promise to array
        });

        // Resolve all like checks in parallel
        const likedStatuses = await Promise.all(likeChecks);

        // Map liked status back to comments
        const commentsWithLikes = commentsData.map((comment, index) => ({
          ...comment,
          isLiked: likedStatuses[index],
        }));

        commentsWithLikes.sort((a, b) => {
            // Firebase Timestamps are objects, compare their ._seconds value
            const timeA = typeof a.time === 'object' && a.time !== null ? a.time.seconds : a.time;
            const timeB = typeof b.time === 'object' && b.time !== null ? b.time.seconds : b.time;
            return timeB - timeA; // Sort newest first
        });
        setDisplayComments(commentsWithLikes);
      } else {
        setDisplayComments([]);
      }
    } catch (error) {
      console.error("Error fetching comments:", error);
      setDisplayComments([]);
    }
  };

  // Call fetchComments when the drawer opens or videoId changes
  useEffect(() => {
    if (isOpen) { // Only fetch when drawer is open
      fetchComments();
    } else {
      // When drawer closes, clear comments to avoid showing stale data next time
      setDisplayComments([]);
    }
  }, [isOpen, videoId]); // Depend on isOpen and videoId, and fetchComments

  const handlePostComment = async () => {
    if (!newCommentText.trim() || !currentUser || !videoId) {
      alert("Please enter a comment and ensure you are logged in.");
      return;
    }

    try {
      const commentsRef = ref(database, `video-comments/${videoId}`);
      await push(commentsRef, {
        userId: currentUser,
        videoUserId: videoUserId,
        userName: currentUserName,
        photoUrl: currentUserPhotoUrl,
        comment: newCommentText.trim(),
        time: serverTimestamp()
      });
      setNewCommentText('');
      console.log('Comment posted successfully!');
      commentNotification()
      commentPostedNotify()
      fetchComments(); // Re-fetch comments to show the new one
    } catch (error) {
      console.error("Error posting comment:", error);
      alert("Failed to post comment. Please try again.");
    }
  };

  
  function commentNotification(){
    
        const userData = {
          notiText: 'commented on your video',
          time: serverTimestamp(),
          photoUrl: currentUserPhotoUrl,
          qoute: "",
          userName: currentUserName,
          userId: currentUser,
          recieverUserId: videoUserId,
          songId: "",
          videoId: videoId,
          comment: newCommentText.trim(),
          songTitle: ""
        }
    
        push(ref(database, `notifications/${videoUserId}/`), userData)
          .then(() => {
            console.log("Notification saved successfully!");
          })
          .catch((error) => {
            console.error("Error saving user: ", error);
          });
          
  }

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




  if (!isOpen) return null;

  return (
    <div className={`comment-drawer ${isOpen ? 'open' : ''}`}>
      <div className="drawer-header">
        <h3>Comments</h3>
        <button onClick={onClose} className="close-drawer-btn">&times;</button>
      </div>
      <div className="comments-list">
        {/* Now displayComments is guaranteed to be an array */}
        {displayComments.length === 0 ? (
          <p className="no-comments">No comments yet. Be the first to comment!</p>
        ) : (
          displayComments.map((comment) => (
            <div key={comment.id} className="comment-item">
              <img src={comment.photoUrl} alt="User Avatar" className="comment-avatar" onClick={()=>{navigate(`/profile/${comment.userId}`)}} />
              <div className="comment-content">
                <span className="comment-author"onClick={()=>{navigate(`/profile/${comment.userId}`)}}>{comment.userName}</span>
                {/* Like Comment */}
                  <button
                        onClick={() => handleLikeComment(comment.id)}
                        className="comment-like-btn"
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0' }}
                    >
                        <img
                            style={{ width: "18px", height: "18px", verticalAlign: 'middle' }}
                            src={comment.isLiked ? redheart : heart}
                        />
                    </button>
                 {/* Comment Count */}
                   <span style={{ fontSize: "12px", color: "lightgray", marginLeft: "4px" }}>
                        {comment.likesCount}
                    </span>
                <p className="comment-txt">{comment.comment}</p>
                
                 <span  style={{fontSize: "11px", color: "gray"}}>{formatVideoTime(comment.time)}</span>
              
              </div>
            </div>
          ))
        )}
      </div>
      <div className="comment-input-area">
        <input
          type="text"
          value={newCommentText}
          onChange={(e) => setNewCommentText(e.target.value)}
          placeholder="Add a comment..."
          className="comment-input"
        />
        <button onClick={handlePostComment} className="post-comment-btn">Post</button>
      </div>
    </div>
  );
}