import React, { useState } from "react";
import '../css/Spinner.css'

const Spinner = (props) => {
  const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);



  return (
    <div className="spinner-container">

      {props.saving && (
        <div className="overlay">
          <div className="spinner"></div>
          
        </div>
      )}
      {props.deleting && (
        <div className="overlay">
          <div className="spinner"></div>
        </div>
      )}
    </div>
    
  );
};

export default Spinner;