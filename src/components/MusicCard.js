import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router';
import AudioPlayer from '../components/AudioPlayer.js'
import heart from '../images/heart.png'
import play from '../images/play.png'
import { auth, database } from "../firebase.js";
import { ref, set, update, push, get, child } from "firebase/database";
import commentlogo from '../images/comment.png'
import { useParams } from 'react-router';
import '../css/MusicButton.css'
import '../css/MusicCard.css'
import SingleAudio from '../components/SingleAudio.js';
import Comment from '../components/Comment.js'


export default function MusicCard(props) {
  const [userId, setUserId] = useState('')
  const [photoUrl, setPhotoUrl] = useState('')
  const [comment, setComment] = useState('')

  const [activeIndex, setActiveIndex] = useState(null);
  const [profileType, setProfileType] = useState('')
  const [username, setUserName] = useState('')
  const navigate = useNavigate();
  const { UID } = useParams();



  useEffect(() => {
    getData()
    getComment()
  }, [])


  function getComment() {
    const list = []
    const dbRef = ref(database);
    get(child(dbRef, `comments/${props.songId}`))
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
          })
          setComment(list[0])

        } else {
          console.log("No data available");
        }
      }).catch((error) => {
        console.error('Lexis', error);
      });



  }

  function getData() {
    const dbRef = ref(database);
    get(child(dbRef, `users/${props.userId}`)).then((snapshot) => {
      if (snapshot.exists()) {

        setProfileType(snapshot.val().accountType)
        setPhotoUrl(snapshot.val().photoUrl)
      } else {
        console.log("No data available");
      }
    }).catch((error) => {
      console.error(error);
    });
  }


  return (
    <div class="card" style={{ cursor: "pointer", width: '18em' }}>
      <p style={{ margin: '10px' }} onClick={() => {
        navigate(`/profile/${props.userId}`)
      }}>{props.songArtist}</p>
      <img style={{ cursor: 'pointer' }} src={photoUrl} class="card-img-top" alt="..." onClick={() => {
        navigate(`/song/${props.songId}/${props.userId}`)
      }} />

      <p className='music-card-title' style={{ margin: '10px' }} onClick={() => {
        navigate(`/profile/${userId}`)
      }}>{profileType}</p>
      <div class="card-body">

        <p className='music-song-title' style={{ margin: '10px' }} onClick={() => {
          navigate(`/song/${props.songId}/${props.userId}`)
        }}>{props.songTitle}</p>
        <SingleAudio

          songArtist={props.songArtist}
          songUrl={props.songUrl}
          songId={props.songId}
          songTitle={props.songTitle}



        />
        <div className='comment-like-container'>
          <div >
            <button className='music-card-comment1' onClick={() => {
              navigate(`/song/${props.songId}/${props.userId}`)
            }} ><img style={{width: "16px"}} src={commentlogo}/></button>
          </div>
          <div>
            <button className='music-card-like'  onClick={() => {
              navigate(`/song/${props.songId}/${props.userId}`)
            }} >
            <img style={{width: "16px"}} src={heart}/>
            </button>
          </div>

        </div>
        {comment ? <Comment
          comment={comment.comment}
          photoUrl={comment.photoUrl}
          userName={comment.userName}
          commentId={comment.commentId}
          songId={props.songId}
          songUserId={props.userId}
          userId={comment.userId}

        /> : null}

      </div>






    </div>
  )
}
