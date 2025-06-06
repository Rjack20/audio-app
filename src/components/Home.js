import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import chad from '../images/chad.jpg'
import mike from '../images/mike.jpg'
import lildred from '../images/lil-dred.png'


import '../css/Home.css'; // Your CSS file

export default function Home() {
  const navigate = useNavigate();
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

  const slides = [
    {
      title: "Share Music",
      description: "Upload your tracks, and reach a global audience.",
      ctaText: "Start Sharing",
      ctaLink: "/upload-music" // Example link
    },
    {
      title: "Share Beats",
      description: "Showcase your beats and connect with artists.",
      ctaText: "Find Artists",
      ctaLink: "/browse-beats" // Example link
    },
    {
      title: "Collaborate",
      description: "Get features from notable artist",
      ctaText: "Find Collaborators",
      ctaLink: "/collaborate" // Example link
    }
  ];

  useEffect(() => {
    // Set the CSS variable for the number of slides
    document.documentElement.style.setProperty('--num-slides', slides.length);

    const interval = setInterval(() => {
      setCurrentSlideIndex(prevIndex => (prevIndex + 1) % slides.length);
    }, 5000); // Increased to 5 seconds (was 3s). Adjust further if needed.

    return () => clearInterval(interval); // Cleanup interval
  }, [slides.length]);

  // Keep these functions, even if not directly used by buttons, for completeness
  const goToPreviousSlide = () => {
    setCurrentSlideIndex(prevIndex =>
      prevIndex === 0 ? slides.length - 1 : prevIndex - 1
    );
  };

  const goToNextSlide = () => {
    setCurrentSlideIndex(prevIndex =>
      (prevIndex + 1) % slides.length
    );
  };

  return (
    <div className="hero" style={{ backgroundColor: "black" }}>
      <div className="hero-content">
        <h1>TrapHud</h1>
        <p>The Ultimate Platform for Artists and Producers</p>

        <div className="slider-container">
          <div className="slider-track" style={{ transform: `translateX(-${currentSlideIndex * 100}%)` }}>
            {slides.map((slide, index) => (
              <div className="slide-item" key={index}>
                <h2 className="slide-title">{slide.title}</h2>
                <p className="slide-description">{slide.description}</p>
                {/* Note: I've removed the redundant zdisplay: "flex" from the inline style
                    as you already have a general CSS rule for .slide-item > div[style*="flex-direction: row"] */}
                {slide.title === "Share Beats" ? <div style={{ margin: "6px" }}>
                  <img className='share-beats-img' src={lildred} />
                </div> : null}
                {slide.title === "Collaborate" ?
                  <div style={{ margin: "6px" }}>
                    <img className='slider-image' src={chad} />
                    <img className='slider-image' src={mike} />
                  </div> : null}
                <div className="cta-buttons main-cta-buttons">

                  <a onClick={() => navigate('/login')}>Join Now</a>
                </div>

              </div>
            ))}
          </div>
        </div>

        <div className="slider-nav-dots">
          {slides.map((_, index) => (
            <span
              key={index}
              className={`dot ${index === currentSlideIndex ? 'active' : ''}`}
              onClick={() => setCurrentSlideIndex(index)}
            ></span>
          ))}
        </div>


      </div>
    </div>
  );
}