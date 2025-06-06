import React, { useEffect, useRef, useState } from 'react'
import { ToastContainer, toast } from 'react-toastify';


export default function SongOfTheMonth() {

       const commentPostedNotify = () => toast.success("Comment posted!");


  return (
    <div style={{marginTop: "5rem"}}>
<p>Song Of The Week</p>

     
            <ToastContainer
            autoClose={4000}
            position="bottom-center"
            hideProgressBar={true}
            theme='dark'
            />


    </div>
  )
}
