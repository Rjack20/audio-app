import React, { useState, useEffect, useCallback } from 'react';
import '../css/CommentDrawer.css'; // Your existing CSS
import { ref, push, serverTimestamp, get, set, remove, child, runTransaction } from "firebase/database";
import { database } from "../firebase.js";
import { formatDistanceToNow, parseISO } from 'date-fns';
import grayHeart from '../images/gray-heart.png'; // Renamed to avoid conflict
import redHeart from '../images/red-heart.png'; // Renamed to avoid conflict
import { ToastContainer, toast } from 'react-toastify';
import FloatButton from './FloatButton.js'; // Assuming this is used elsewhere
import { useNavigate } from 'react-router'; // Use react-router-dom for web

export default function AddCommentDrawer({ isOpen, onClose, comments = [], songId, currentUserId, songTitle, songUserId, currentUserName, currentUserPhotoUrl }) {
  const [newCommentText, setNewCommentText] = useState('');
  const [displayComments, setDisplayComments] = useState(comments || []);
  const navigate = useNavigate();

  const commentPostedNotify = () => toast.success("Comment posted!");
  const likeNotify = () => toast.info("Comment liked!");
  const unlikeNotify = () => toast.info("Comment unliked!");


  // Function to fetch comments for the song
  const fetchComments = useCallback(async () => {
    if (!songId) {
      setDisplayComments([]);
      return;
    }
    try {
      const commentsRef = ref(database, `comments/${songId}`);
      const snapshot = await get(commentsRef);
      if (snapshot.exists()) {
        const commentsData = [];
        snapshot.forEach((childSnapshot) => {
          const comment = { id: childSnapshot.key, ...childSnapshot.val() };
          // Ensure likes property exists and is an object
          if (!comment.likes) {
            comment.likes = {};
          }
          commentsData.push(comment);
        });
        // Sort comments by timestamp, newest first for display
        commentsData.sort((a, b) => {
          // Handle Firebase ServerValue.TIMESTAMP which might be a number or an object
          const timeA = typeof a.time === 'object' && a.time._seconds ? a.time._seconds * 1000 : a.time;
          const timeB = typeof b.time === 'object' && b.time._seconds ? b.time._seconds * 1000 : b.time;
          return timeB - timeA;
        });
        setDisplayComments(commentsData);
      } else {
        setDisplayComments([]);
      }
    } catch (error) {
      console.error("Error fetching comments:", error);
      setDisplayComments([]);
    }
  }, [songId]); // fetchComments depends only on songId now

  // Call fetchComments when the drawer opens or songId changes
  useEffect(() => {
    if (isOpen) {
      fetchComments();
    } else {
      setDisplayComments([]); // Clear comments when drawer closes
    }
  }, [isOpen, songId, fetchComments]); // Added fetchComments to dependency array

  const handlePostComment = async () => {
    if (!newCommentText.trim() || !currentUserId || !songId) {
      alert("Please enter a comment and ensure you are logged in.");
      return;
    }

    try {
      const commentsRef = ref(database, `comments/${songId}`);
      await push(commentsRef, {
        userId: currentUserId,
        songUserId: songUserId,
        userName: currentUserName,
        photoUrl: currentUserPhotoUrl,
        comment: newCommentText.trim(),
        time: serverTimestamp(),
       likes: {}, 
         likeCount: 0 
      });
      setNewCommentText('');
      console.log('Comment posted successfully!');
      commentNotification();
      commentPostedNotify();
      fetchComments(); // Re-fetch comments to show the new one immediately
    } catch (error) {
      console.error("Error posting comment:", error);
      alert("Failed to post comment. Please try again.");
    }
  };

  function commentNotification() {
    const userData = {
      notiText: 'commented on your song', // Changed to 'song' from 'video'
      type: 'comment_song', // Added type for clarity
      time: serverTimestamp(),
      photoUrl: currentUserPhotoUrl,
      quote: "", // Changed 'qoute' to 'quote' for consistency
      userName: currentUserName,
      userId: currentUserId,
      recieverUserId: songUserId,
      songId: songId, // Ensure songId is passed
      videoId: "", // No videoId for song comments
      comment: newCommentText.trim(),
      songTitle: songTitle
    };

    push(ref(database, `notifications/${songUserId}/`), userData)
      .then(() => {
        console.log("Comment notification saved successfully!");
      })
      .catch((error) => {
        console.error("Error saving comment notification: ", error);
      });
  }

  // --- Like/Unlike Functions ---
  const handleLikeUnlike = async (commentId, isLiked) => {
    if (!currentUserId) {
      toast.error("Please log in to like comments.");
      return;
    }

    const commentLikesRef = ref(database, `comments/${songId}/${commentId}/likes`);
    const commentLikeCountRef = ref(database, `comments/${songId}/${commentId}/likeCount`); // Assuming you'll store a direct count

    try {
      if (isLiked) {
        // User is unliking
        await remove(child(commentLikesRef, currentUserId));
        unlikeNotify();
        // Decrement like count using transaction
        await runTransaction(commentLikeCountRef, (currentCount) => {
          return (currentCount) - 1;
        });
        likeUnlikeNotification(commentId, 'unlike');
      } else {
        // User is liking
        await set(child(commentLikesRef, currentUserId), true); // Store currentUserId as liked
        likeNotify();
        // Increment like count using transaction
        await runTransaction(commentLikeCountRef, (currentCount) => {
          return (currentCount) + 1;
        });
        likeUnlikeNotification(commentId, 'like');
      }
      fetchComments(); // Re-fetch comments to update like status and count in UI
    } catch (error) {
      console.error("Error liking/unliking comment:", error);
      toast.error("Failed to update like status. Please try again.");
    }
  };

  // Notification for liking/unliking
  function likeUnlikeNotification(commentId, action) {
    if (currentUserId === songUserId) return; // Don't notify self for own comment like

    // You need to get the comment details to send a meaningful notification
    // This requires fetching the specific comment first
    get(ref(database, `comments/${songId}/${commentId}`))
      .then((snapshot) => {
        if (snapshot.exists()) {
          const commentData = snapshot.val();
          const commentOwnerId = commentData.userId; // The ID of the user who made the comment

          if (currentUserId === commentOwnerId) return; // Don't notify if user likes their own comment

          const notiData = {
            notiText: action === 'like' ? 'liked your comment' : 'unliked your comment',
            type: action === 'like' ? 'like_comment' : 'unlike_comment',
            time: serverTimestamp(),
            photoUrl: currentUserPhotoUrl,
            userName: currentUserName,
            userId: currentUserId,
            recieverUserId: commentOwnerId, // Notify the owner of the comment
            songId: songId,
            commentId: commentId, // Pass commentId for navigation
            comment: commentData.comment // The text of the comment that was liked/unliked
          };

          push(ref(database, `notifications/${commentOwnerId}/`), notiData)
            .then(() => console.log(`Comment ${action} notification sent!`))
            .catch((error) => console.error(`Error sending comment ${action} notification:`, error));
        }
      })
      .catch((error) => {
        console.error("Error fetching comment for like notification:", error);
      });
  }
  // --- End Like/Unlike Functions ---

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
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} newestOnTop={false} closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover />
      <div className="drawer-header">
        <h3>Comments</h3>
        <button onClick={onClose} className="close-drawer-btn">&times;</button>
      </div>
      <div className="comments-list">
        {displayComments.length === 0 ? (
          <p className="no-comments">No comments yet. Be the first to comment!</p>
        ) : (
          displayComments.map((comment) => {
            const isLiked = comment.likes && comment.likes[currentUserId];
            const likeCount = comment.likeCount // Get the count, default to 0

            return (
              <div key={comment.id} className="comment-item">
                <img src={comment.photoUrl} alt="User Avatar" className="comment-avatar" onClick={() => { navigate(`/profile/${comment.userId}`) }} />
                <div className="comment-content">
                  <span className="comment-author" onClick={() => { navigate(`/profile/${comment.userId}`) }}>{comment.userName}</span>
                  <div className="comment-likes">
                    <img
                    style={{cursor: "pointer"}}
                      src={isLiked ? redHeart : grayHeart}
                      alt="Like"
                      className="like-icon"
                      onClick={() => handleLikeUnlike(comment.id, isLiked)}
                    />
                    <span style={{fontSize: "10px"}} className="like-count">{likeCount}</span>
                  </div>
                  <p className="comment-txt">{comment.comment}</p>
                  <span style={{fontSize: "10px"}} className="comment-time">{formatVideoTime(comment.time)}</span>
                </div>
              </div>
            );
          })
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