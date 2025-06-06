import React, { useEffect, useState, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router';
import AudioPlayer from '../components/AudioPlayer.js'
import { useParams } from 'react-router';
import pop from '../sounds/pop.mp3'
import AudioList from '../components/AudioPlayer.js'
import AddCommentDrawer from './AddCommentDrawer.js'

import Comment from '../components/Comment.js'
import heart from '../images/heart.png'
import redheart from '../images/red-heart.png'
import { auth, database } from "../firebase.js";
import { ref, set, remove, update, push, get, child } from "firebase/database";
import { ToastContainer, toast } from 'react-toastify';
import '../css/SongPage.css'
import FloatButton from './FloatButton.js'
import SingleAudio from './SingleAudio.js';

export default function SongPage() {
  const [song, setSong] = useState([]);
  const [username, setUsername] = useState('');

  const [comments, setComments] = useState([]);
  const [complete, setIsComplete] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [rotate, setRotate] = useState(false);
  const [likeCount, setLikeCount] = useState(null);
  const [userId, setUserId] = useState('')
  const [isOpen, setIsOpen] = useState(false)


  const [profileType, setProfileType] = useState('')
  const [photoUrl, setPhotoUrl] = useState('')
  const { UID } = useParams();
  const { SID } = useParams();
  const navigate = useNavigate();
  const [likeUserName, setLikeUserName] = useState('')
  const [likePhotoUrl, setLikePhotoUrl] = useState('')
  const [likeAccountType, setLikeAccountType] = useState('')





  useEffect(() => {
    const list = []

    const fetchSong = async () => {
      try {
        const songsRef = ref(database, `songs/${SID}`);
        const snapshot = await get(songsRef);

        if (snapshot.exists()) {


          const data = {}

          data.songTitle = snapshot.val().songTitle
          data.userId = snapshot.val().userId
          data.songUrl = snapshot.val().songUrl
          data.songArtist = snapshot.val().songArtist
          data.accountType = snapshot.val().accountType
          data.songId = snapshot.key


          list.push(data)
          setSong(data);

        } else {
          setSong([]);
        }
      } catch (error) {
        console.error("Error fetching songs:", error);
      }
    };

    fetchSong();

    getComments()
  }, []);




  useEffect(() => {


    auth.onAuthStateChanged((user) => {
      if (!user) {
      } else {
        setUserId(user.uid)
        checkIfLiked(user.uid)
        getDataForLike(user.uid)
      }
    })

    getData()
    getLikeCount()


  }, [])

  const closeCommentDrawer = useCallback(() => {
    setIsOpen(false);

  }, []);


  function getDataForLike(id) {
    const dbRef = ref(database);
    get(child(dbRef, `users/${id}`)).then((snapshot) => {
      if (snapshot.exists()) {
        setLikeUserName(snapshot.val().username)
        setLikeAccountType(snapshot.val().accountType)
        setLikePhotoUrl(snapshot.val().photoUrl)


      } else {
        console.log("No data available");
      }
    }).catch((error) => {
      console.error(error);
    });
  }

  function getData() {
    const dbRef = ref(database);
    get(child(dbRef, `users/${UID}`)).then((snapshot) => {
      if (snapshot.exists()) {
        setUsername(snapshot.val().username)
        setProfileType(snapshot.val().accountType)
        setPhotoUrl(snapshot.val().photoUrl)
      } else {
        console.log("No data available");
      }
    }).catch((error) => {
      console.error(error);
    });
  }

  function getComments() {
    const list = []
    const dbRef = ref(database);
    get(child(dbRef, `comments/${SID}`))
      .then((snapshot) => {
        if (snapshot.exists()) {
          snapshot.forEach((snap) => {

            const data = {}

            data.comment = snap.val().comment
            data.time = snap.val().time
            data.photoUrl = snap.val().photoUrl
            data.songUserId = snap.val().songUserId
            data.userId = snap.val().userId
            data.userName = snap.val().userName
            data.commentId = snap.key




            list.push(data)
            setIsComplete(true)
          })
          setComments(list)

        } else {
          console.log("No data available");
        }
      }).catch((error) => {
        console.error('Error:', error);
      });



  }


  function getLikeCount() {
    get(ref(database, `song-likes/${SID}`))
      .then((snapshot) => {
        if (snapshot.exists()) {
          setLikeCount(snapshot.size)
        } else {
          console.log("no number count!");

        }
      })
      .catch((error) => {
        console.error("Error saving user: ", error);
      });

    // Reset animation so it can trigger again next time
  }


  function checkIfLiked(id) {
    setRotate(true);
    get(ref(database, `song-likes/${SID}/${id}`))
      .then((snapshot) => {
        if (snapshot.exists()) {

          setIsLiked(true)

        } else {
          setIsLiked(false)

        }
      })
      .catch((error) => {
        console.error("Error: ", error);
      });

    // Reset animation so it can trigger again next time
    setTimeout(() => setRotate(false), 1000); // Match animation duration
  }

  function handleLike() {
    setRotate(true);

    likeSongNotification()



    set(ref(database, `song-likes/${SID}/${userId}`), true)
      .then(() => {

        console.log("Like saved successfully!");
        setIsLiked(true)
        addSong(SID)
      })
      .catch((error) => {
        console.error("Error saving user: ", error);
      });

    // Reset animation so it can trigger again next time
    setTimeout(() => setRotate(false), 1000); // Match animation duration
  }
  function unLike() {
    setRotate(true);




    remove(ref(database, `song-likes/${SID}/${userId}`), true)
      .then(() => {
        console.log("Like saved successfully!");
        setIsLiked(false)
        removeSong(SID)
      })
      .catch((error) => {
        console.error("Error saving user: ", error);
      });

    // Reset animation so it can trigger again next time
    setTimeout(() => setRotate(false), 1000); // Match animation duration
  }

  function likeSongNotification() {

    const userData = {
      notiText: 'liked your song',
      time: '6:00 pm',
      photoUrl: likePhotoUrl,
      userName: likeUserName,
      accountType: likeAccountType,
      userId: userId,
      quote: song.songTitle,
      recieverUserId: UID,
      songId: SID,

    }

    push(ref(database, `notifications/${UID}/`), userData)
      .then(() => {
        console.log("Notification saved successfully!");
      })
      .catch((error) => {
        console.error("Error saving user: ", error);
      });

  }

  function addSong(sid) {

    set(ref(database, `user-liked-songs/${userId}/${sid}`), true)
      .then(() => {
        console.log("User saved successfully!");
      })
      .catch((error) => {
        console.error("Error saving user: ", error);
      });
  }


  function removeSong(sid) {
    remove(ref(database, `user-liked-songs/${userId}/${sid}`), true)
      .then(() => {
        console.log("User saved successfully!");
      })
      .catch((error) => {
        console.error("Error saving user: ", error);
      });
  }



  function handleClick() {
    setIsOpen(!isOpen)
  }

  return (
    <div style={{ marginTop: "95px", paddingBottom: "6px" }} >
      <AddCommentDrawer
        songId={SID}
        songUserId={UID}
        songTitle={song.songTitle}
        currentUserId={userId}
        currentUserName={username} // Pass user's display name
        currentUserPhotoUrl={photoUrl} // Pass user's photo URL
        isOpen={isOpen}
        onClose={closeCommentDrawer}

      />

      <div className='song-page-card'>
        <div className='song-card-content'>

          <img className='profile-image' src={photoUrl} style={{ cursor: "pointer" }} onClick={() => {
            navigate(`/profile/${UID}`)
          }} />
          <p style={{ margin: "10px", cursor: "pointer" }} onClick={() => {
            navigate(`/profile/${UID}`)
          }} >{username}</p>
          <p style={{ color: "gray", margin: "10px", cursor: "pointer" }} onClick={() => {
            navigate(`/profile/${UID}`)
          }} >{profileType}</p>
          <img className={rotate ? 'rotate-once' : ''} style={{ cursor: "pointer" }} src={isLiked ? redheart : heart} onClick={isLiked ? () => { unLike() } : () => { handleLike() }} />
          <p>{likeCount > 0 ? likeCount : null}</p>
          <h2 className='song-page-song-title'>{song.songTitle}</h2>
        </div>

      </div>
      {song ?

        <SingleAudio

          songArtist={song.songArtist}
          songUrl={song.songUrl}
          songId={song.songId}


        />
        : null}
      {!isOpen && (<div className='comment-button-container'>
        <button className="comment-button comment-button-modern" onClick={handleClick} >Comments</button>

      </div>)}
      {/* {complete ? comments.map((comment, index) => (
        <Comment
          comment={comment.comment}
          userName={comment.userName}
          time={comment.time}
          photoUrl={comment.photoUrl}
          userId={comment.userId}
          songId={SID}
          songUserId={comment.songUserId}
          commentId={comment.commentId}
          songTitle={song.songTitle}
        />
      )) : null} */}



      {/* Modal */}
      {/* <div class="modal fade" id="exampleModal" tabindex="-1" aria-labelledby="exampleModalLabel" aria-hidden="true">
        <div class="modal-dialog">
          <div class="modal-content">
            <div className='modal-title'>
              <h5 style={{ color: 'black' }}>add comment</h5>

            </div>

          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
            <button type="button" class="btn btn-primary" >Save changes</button>
          </div>
        </div>
      </div> */}



    </div>



  )
}
