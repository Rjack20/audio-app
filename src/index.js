import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { BrowserRouter, Routes, Route } from "react-router";
import Home from './components/Home';
import Navbar from './components/Navbar.js';
import Profile from './components/Profile.js';
import SongPage from './components/SongPage.js';
import Login from './components/Login.js';
import Artist from './components/Artist.js';
import Producers from './components/Producers.js';
import BrowseMusic from './components/BrowseMusic.js';
import SetupProfile from './components/SetupProfile.js';
import Notifications from './components/Notifications.js';
import SongOfTheMonth from './components/SongOfTheMonth.js';
import VideoFeed from './components/VideoFeed.js';
import FullScreenFeed from './components/FullScreenFeed.js';
import SongDetailScreen from './components/SongDetailScreen.js';
import VideoDetailScreen from './components/VideoDetailScreen.js';





const root = document.getElementById("root");


ReactDOM.createRoot(root).render(
  <BrowserRouter>
    <Navbar />
    <Routes>
      <Route path="/" element={<App />} />
      <Route path="setup/:UID" element={<SetupProfile />} />
      <Route path="home/:UID" element={<BrowseMusic />} />
      <Route path="profile/:UID" element={<Profile />} />
      <Route path="song/:SID/:UID" element={<SongPage />} />
      <Route path="login" element={<Login />} />
      <Route path="artist/:UID" element={<Artist />} />
      <Route path="producers/:UID" element={<Producers />} />
      <Route path="notifications/:UID" element={<Notifications />} />
      <Route path="songofthemonth/" element={<SongOfTheMonth />} />
      <Route path="videofeed/:UID" element={<VideoFeed />} />
       <Route path="/watch" element={<FullScreenFeed />} />
       <Route path="/video/:videoId" element={<VideoDetailScreen />} />
        <Route path="/song/:songId" element={<SongDetailScreen />} />



    </Routes>
  </BrowserRouter>
);


// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
