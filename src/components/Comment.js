import React, { useEffect, useState } from 'react'
import blank from '../images/blank-picture.png'
import heart from '../images/heart.png'
import redheart from '../images/red-heart.png'
import image from '../images/download.avif'
import '../css/Comment.css'
import { useNavigate } from 'react-router';
import { auth, database } from "../firebase.js";
import { ref, set,serverTimestamp, remove, update, push, get, child } from "firebase/database";




export default function Comment(props) {
  const [isLiked, setIsLiked] = useState(false)
  const [rotate, setRotate] = useState(false);
  const [userId, setUserId] = useState('')
  const [commentCount, setCommentCount] = useState(null)
  const [time, setTime] = useState(null)



  const [rotateStop, setRotateStop] = useState(false);
  const navigate = useNavigate();


  useEffect(() => {
    auth.onAuthStateChanged((user) => {
      if (!user) {
        console.log('no user')
      } else {
        setUserId(user.uid)
        checkIfLiked(user.uid)
      }
    })
    getLikeCount()


  }, [])





  function handleLike() {
    setRotate(true);

    set(ref(database, `comment-likes/${props.commentId}/${userId}`), true)
      .then(() => {
        console.log("Like saved successfully!");
        likeCommentNotification()
        setIsLiked(true)
      })
      .catch((error) => {
        console.error("Error saving user: ", error);
      });

    // Reset animation so it can trigger again next time
    setTimeout(() => setRotate(false), 1000); // Match animation duration
  }

  function getLikeCount() {
    get(ref(database, `comment-likes/${props.commentId}`))
      .then((snapshot) => {
        if (snapshot.exists()) {
                    console.log(`Comment has ${props.commentId}`, snapshot.size)

          setCommentCount(snapshot.size)
          console.log('Comment has:', snapshot.size)
        } else {
          console.log("no number count!");

        }
      })
      .catch((error) => {
        console.error("Error saving user: ", error);
      });

    // Reset animation so it can trigger again next time
    setTimeout(() => setRotate(false), 1000); // Match animation duration
  }



  function checkIfLiked(id) {
    setRotate(true);
    get(ref(database, `comment-likes/${props.commentId}/${id}`))
      .then((snapshot) => {
        if (snapshot.exists()) {

          setIsLiked(true)

        } else {
          setIsLiked(false)

        }
      })
      .catch((error) => {
        console.error("Error saving user: ", error);
      });

    // Reset animation so it can trigger again next time
    setTimeout(() => setRotate(false), 1000); // Match animation duration
  }

  function unlikeComment() {
    setRotate(true);


    remove(ref(database, `comment-likes/${props.commentId}/${userId}`))
      .then(() => {
        console.log("Like removed!");
        setIsLiked(false)
      })
      .catch((error) => {
        console.error("Error saving user: ", error);
      });

    // Reset animation so it can trigger again next time
    setTimeout(() => setRotate(false), 1000); // Match animation duration
  }

  function likeCommentNotification(){
    
        const userData = {
          notiText: 'liked your comment',
          time: serverTimestamp(),
          photoUrl: props.photoUrl,
          qoute: props.songTitle,
          userName: props.userName,
          userId: userId,
          recieverUserId: props.songUserId,
          songId: props.songId,
          comment: props.comment,
          songTitle: props.songTitle
        }
    
        push(ref(database, `notifications/${props.userId}/`), userData)
          .then(() => {
            console.log("Notification saved successfully!");
          })
          .catch((error) => {
            console.error("Error saving user: ", error);
          });
          
  }

function timeAgo(date) {
 
    
  const now = new Date();
  const seconds = Math.floor((now - date) / 1000);

  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min${minutes > 1 ? "s" : ""} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} day${days > 1 ? "s" : ""} ago`;
  const weeks = Math.floor(days / 7);
  return `${weeks} week${weeks > 1 ? "s" : ""} ago`;
}

  return (
    <div className="comment">
      <img src={props.photoUrl ? props.photoUrl : blank} className="avatar" onClick={() => {
        navigate(`/profile/${props.userId}`)
      }} />
      <div className="comment-container">
        <div className="comment-header">
          <span className="comment-username" onClick={() => {
            navigate(`/profile/${props.userId}`)
          }}>{props.userName ? props.userName : 'Username'}</span>
          <span className="timestamp">{props.time ? timeAgo(new Date(props.time)): null}</span>
          {isLiked ? <span><img className={rotate ? 'comment-like' : 'comment-like-alt'} src={redheart} onClick={() => {
            unlikeComment()
          }} /></span> : <span><img className={rotate ? 'comment-like' : 'comment-like-alt'} src={heart} onClick={() => {
            handleLike()
          }} /></span>}
          <p style={{ color: 'black' }} className='timestamp'>{commentCount ? commentCount : null}</p>
        </div>
        <div className="comment-text" onClick={() => {
          navigate(`/song/${props.songId}/${props.songUserId}`)
        }}>{props.comment ? props.comment : null}</div>
       
      </div>
    </div>
  )
}
