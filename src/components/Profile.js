import React, { useState, useRef, useEffect } from 'react'
import AudioList from '../components/AudioPlayer.js'
import AudioPost from '../components/AudioPost.js'
import UserProfileTabs from './UserProfileTabs';
import { ref, set, update, serverTimestamp, push, get, child } from "firebase/database";
import { auth, database } from "../firebase.js";
import { getStorage, ref as storageREF } from "firebase/storage";
import { uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { useParams } from 'react-router'; // Use react-router-dom for useParams
import { ToastContainer, toast } from 'react-toastify';
import { useNavigate, useLocation } from 'react-router'; // Use react-router-dom for useNavigate and useLocation
import '../css/Profile.css';
import Drawer from '../components/Drawer.js';
// import image from '../images/download.avif'; // This 'image' is unused, consider removing
import blank from '../images/blank-picture.png';
import Spinner from '../components/Spinner.js'; // Assuming you have a Spinner component

export default function Profile() {
  const location = useLocation();
  const navigate = useNavigate();
  const { UID } = useParams(); // Get UID from the URL parameter
  const storage = getStorage();

  // --- State Variables ---
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [accountType, setAccountType] = useState(''); // Holds 'Artist', 'Producer', 'N/a'
  const [photoUrl, setPhotoUrl] = useState(''); // The URL of the profile picture
  const [isLoadingProfile, setIsLoadingProfile] = useState(true); // Tracks initial profile data loading

  const [currentUser, setCurrentUser] = useState(''); // Current authenticated user UID

  // State for file uploads (if you're handling image preview/upload within the modal)
  const [file, setFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0); // Renamed from 'progress' to avoid conflict
  const [isSaving, setIsSaving] = useState(false); // For saving profile changes

  // Song and Liked Songs states
  const [songs, setSongs] = useState([]);
  const [likedSongs, setLikedSongs] = useState([]);
  // const [activeIndex, setActiveIndex] = useState(null); // This state seems unused, consider removing if not needed

  // Derived path segment for UserProfileTabs
  const pathSegments = location.pathname.split('/');
  const path = pathSegments[1]; // This will give you "profile"

  const detailesUpdatedNotify = () => toast.success("Profile updated :)");

  // --- Functions ---

  // Function to fetch user data from Firebase
  const getData = () => {
    const dbRef = ref(database);
    get(child(dbRef, `users/${UID}`)).then((snapshot) => {
      if (snapshot.exists()) {
        const userData = snapshot.val();
        setUsername(userData.username || '');
        setBio(userData.bio || '');
        setAccountType(userData.accountType || ''); // Populate accountType for radio buttons
        setPhotoUrl(userData.photoUrl || blank); // Set photoUrl, default to blank if not found
        setIsLoadingProfile(false); // Data loaded
      } else {
        console.log("No user data available for UID:", UID);
        setIsLoadingProfile(false); // Stop loading if no data found
      }
    }).catch((error) => {
      console.error("Error fetching user data:", error);
      setIsLoadingProfile(false); // Stop loading on error
    });
  };

  // Function to get current authenticated user's UID
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setCurrentUser(user.uid);
      } else {
        console.log('No user logged in');
        setCurrentUser(null); // Clear current user if logged out
      }
    });
    return () => unsubscribe(); // Cleanup auth listener
  }, []); // Run only once on mount


  // Use useEffect to call getData when the component mounts or UID changes
  useEffect(() => {
    console.log(accountType)
    if (UID) { // Only fetch if UID is available
      getData();
    } else {
      setIsLoadingProfile(false); // No UID, no loading
    }
  }, [UID]); // Dependency array: call getData when UID changes
    // Use useEffect to call getData when the component mounts or UID changes
  useEffect(() => {
    console.log(accountType)
   
  
  }, [accountType]); // Dependency array: call getData when UID changes


  // UseEffect for songs and liked songs based on UID
  useEffect(() => {
    if (UID) { // Ensure UID exists before fetching songs
      getSongIds();
      getLikedSongIds();
    }
  }, [UID]); // Dependency: re-run if UID changes


  function getSongIds() {
    const songIdList = [];
    const dbRef = ref(database);

    get(child(dbRef, `user-songs/${UID}`))
      .then((snapshot) => {
        if (snapshot.exists()) {
          snapshot.forEach((snap) => {
            songIdList.push(snap.val()); // Each value is a song ID
          });
          getSongs(songIdList);
        } else {
          setSongs([]); // Clear songs if none found
          console.log("No song IDs found.");
        }
      })
      .catch((error) => {
        console.error("Error fetching song IDs:", error);
      });
  }

  function getSongs(list) {
    const dbRef = ref(database);
    const songPromises = list.map(async (id) => {
      const snapshot = await get(child(dbRef, `songs/${id}`));
      if (snapshot.exists()) {
        return {
          songArtist: snapshot.val().songArtist,
          songUrl: snapshot.val().songUrl,
          songId: snapshot.key,
          userId: snapshot.val().userId,
          songTitle: snapshot.val().songTitle,
        };
      }
      return null;
    });

    Promise.all(songPromises)
      .then((results) => {
        const songs = results.filter((song) => song !== null);
        const uniqueSongs = songs.filter(
          (song, index, self) =>
            index === self.findIndex((s) => s.songId === song.songId)
        );
        setSongs(uniqueSongs);
        console.log("Final song list:", uniqueSongs);
      })
      .catch((error) => {
        console.error('Error fetching songs:', error);
      });
  }

  const handleFileChange = (e) => {
    if (e.target.files[0]) {
      handleUpload(e.target.files[0]);
    }
  };

  const handleUpload = (file) => {
    if (!file) return;

    const storageRef = storageREF(storage, `profile-image/${UID}/${file.name}`);
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on(
      "state_changed",
      (snapshot) => {
        // Progress
        const prog = Math.round(
          (snapshot.bytesTransferred / snapshot.totalBytes) * 100
        );
        setUploadProgress(prog); // Update upload progress state if you want to show it
      },
      (error) => {
        console.error("Upload error:", error);
        toast.error("Photo upload failed!");
      },
      () => {
        // Complete
        getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
          // setUrl(downloadURL); // This state isn't directly used for photoUrl in modal
          savePhoto(downloadURL); // Save the new photo URL to Firebase
          setPhotoUrl(downloadURL); // Immediately update local state for preview
          toast.success("Photo uploaded!");
        });
      }
    );
  };

  function savePhoto(url) {
    const userData = {
      photoUrl: url
    };

    update(ref(database, 'users/' + UID), userData)
      .then(() => {
        console.log("Photo URL saved to database successfully!");
      })
      .catch((error) => {
        console.error("Error saving photo URL to database: ", error);
        toast.error("Failed to update profile photo URL.");
      });
  }

  function getUserName(e) {
    setUsername(e.target.value);
  }

  function getBio(e) {
    setBio(e.target.value);
  }

  function getLikedSongIds() {
    const songIdList = [];
    const dbRef = ref(database);
    get(child(dbRef, `user-liked-songs/${UID}`))
      .then((snapshot) => {
        if (snapshot.exists()) {
          snapshot.forEach((snap) => {
            songIdList.push(snap.key);
          });
          getLikedSongs(songIdList);
        } else {
          setLikedSongs([]); // Clear liked songs if none found
          console.log("No liked song IDs available");
        }
      })
      .catch((error) => {
        console.error('Error fetching liked song IDs:', error);
      });
  }

  function getLikedSongs(list) {
    const songList = [];
    const dbRef = ref(database); // Define dbRef here for use inside the loop

    // Using Promise.all for liked songs too, for better performance
    const likedSongPromises = list.map(async (id) => {
      const snapshot = await get(child(dbRef, `songs/${id}`));
      if (snapshot.exists()) {
        return {
          songArtist: snapshot.val().songArtist,
          songUrl: snapshot.val().songUrl,
          songId: snapshot.key,
          userId: snapshot.val().userId,
          songTitle: snapshot.val().songTitle,
          time: snapshot.val().time,
        };
      }
      return null;
    });

    Promise.all(likedSongPromises)
      .then((results) => {
        const songs = results.filter((song) => song !== null);
        // Optional: Deduplicate based on songId if necessary, though it should be unique
        const uniqueLikedSongs = songs.filter(
          (song, index, self) =>
            index === self.findIndex((s) => s.songId === song.songId)
        );
        setLikedSongs(uniqueLikedSongs);
      })
      .catch((error) => {
        console.error('Error fetching liked songs details:', error);
      });
  }


  function saveData() {
    setIsSaving(true);

    const userData = {
      username: username,
      photoUrl: photoUrl, // Use the potentially updated photoUrl
      accountType: accountType,
      bio: bio
    };

    update(ref(database, 'users/' + UID), userData)
      .then(() => {
        setIsSaving(false);
        detailesUpdatedNotify(); // Show success toast
        // Optional: Close modal if you're using Bootstrap's JS directly,
        // otherwise, you'd need to control modal state with React state.
        // For Bootstrap 5, you might need: const modal = new bootstrap.Modal(document.getElementById('exampleModal')); modal.hide();
        // For simplicity, I'm just navigating.
        navigate(`/profile/${UID}`); // Navigate back to profile page (or refresh data)
      })
      .catch((error) => {
        setIsSaving(false);
        console.error("Error saving user: ", error);
        toast.error("Failed to save profile. Please try again.");
      });
  }

  // --- Conditional Render for Loading ---
  if (isLoadingProfile) {
    return <Spinner saving={true} message="Loading profile data..." />;
  }

  // --- Component JSX ---
  return (
    <div className='profile-container'>
      {currentUser === UID ? <Drawer userId={UID} title={accountType} username={username} photoUrl={photoUrl ? photoUrl : blank} /> : null}

      {/* Profile Header */}
      <div className='header-section'>
        <div className='profile-info-container'>
          <div>
            {/* Display profile image, using photoUrl state */}
            <img className='profile-image' src={photoUrl || blank} alt="Profile" />
          </div>

          <div>
            {username ? <h2 style={{ color: "black" }}>{username}</h2> : <p>username</p>}
          </div>
          <div>
            {accountType ? <p style={{ color: "gray" }}>{accountType}</p> : null}
          </div>

          <div>
            {currentUser === UID ?
              <p className='edit-profile-button' data-bs-toggle="modal" data-bs-target="#exampleModal">
                edit profile
              </p>
              : null}
          </div>
        </div>

        <ToastContainer
          autoClose={4000}
          position="bottom-center"
          hideProgressBar={true}
          theme='dark'
        />
      </div>

      {/* --- Edit Account Modal --- */}
      <div className="modal fade" id="exampleModal" tabIndex="-1" aria-labelledby="exampleModalLabel" aria-hidden="true">
        <div className="modal-dialog">
          <div className="modal-content">
            <div className='modal-header'> {/* Changed to modal-header for consistency with Bootstrap */}
              <h5 style={{ color: 'black' }} id="exampleModalLabel">Update info</h5>
              <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div className="modal-body" style={{ backgroundColor: 'lightGrey', padding: '5px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <div className='modal-content-inner'> {/* Renamed class to avoid conflict with Bootstrap's modal-content */}
                <img className='edit-image' src={photoUrl || blank} alt="Profile to edit" /> {/* Using photoUrl state directly */}
                <div>
                  <p>Update Photo</p>
                  <input type='file' onChange={handleFileChange} />
                  {uploadProgress > 0 && uploadProgress < 100 && (
                    <p>Uploading: {uploadProgress}%</p>
                  )} {/* Show upload progress */}

                  <p style={{ marginTop: '4px' }}>Username:</p>
                  <div className="col-sm-10">
                    <input
                      type="text" // Correct input type
                      className="form-control"
                      value={username || ''} // Controlled component, default to empty string
                      onChange={getUserName} // Calls setUsername
                    />
                  </div>

                  {/* --- Radio Button Fix --- */}
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="radio"
                      name="accountType"
                      id="radioArtist"
                      value="Artist"
                      checked={accountType === 'Artist'} // Controlled and pre-selected
                      onChange={() => setAccountType('Artist')}
                    />
                    <label className="form-check-label" htmlFor="radioArtist">
                      Artist
                    </label>
                  </div>

                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="radio"
                      name="accountType"
                      id="radioProducer"
                      value="Producer"
                      checked={accountType === 'Producer'} // Controlled and pre-selected
                      onChange={() => setAccountType('Producer')}
                    />
                    <label className="form-check-label" htmlFor="radioProducer">
                      Producer
                    </label>
                  </div>

                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="radio"
                      name="accountType"
                      id="radioNa"
                      value="N/a"
                      checked={accountType === 'N/a'} // Controlled and pre-selected
                      onChange={() => setAccountType('N/a')}
                    />
                    <label className="form-check-label" htmlFor="radioNa">
                      N/a (Listener/Fan)
                    </label>
                  </div>
                  {/* --- End Radio Button Fix --- */}

                  <p>Bio:</p>
                  <div className="col-sm-10">
                    <input
                      type="text" // Correct input type
                      className="form-control"
                      value={bio || ''} // Controlled component, default to empty string
                      onChange={getBio} // Calls setBio
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">Close</button>
              <button type="button" className="btn btn-primary" onClick={saveData} disabled={isSaving}>
                {isSaving ? 'Saving...' : 'Save changes'}
              </button>
            </div>
          </div>
        </div>
      </div>
      {/* --- End Edit Account Modal --- */}


      <div className='song-section'>
        {songs.length > 0 ? // Check if songs array has content
          <AudioList
            songs={songs}
            photoUrl={photoUrl}
          />
          : <p>No songs uploaded yet.</p> // Message if no songs
        }
      </div>

      {/* Render the new UserProfileTabs component below the uploaded songs */}
      <UserProfileTabs path={path} profileUserId={UID} />
    </div>
  );
}