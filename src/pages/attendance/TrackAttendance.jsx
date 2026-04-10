// import React, { useState, useRef } from "react";
// import { useNavigate, useLocation } from "react-router-dom"; 
// import { saveAttendance } from "../../services/api"; 
// import Card from '../../components/ui/Card';
// import { Button, Spinner, Input } from "@chakra-ui/react";
// import { useAuth } from '../../contexts/AuthContext';

// const TrackAttendance = () => {
//   const navigate = useNavigate();
//   const { state } = useLocation(); 
//   const { user } = useAuth();

//   // --- States ---
//   const [isSubmitting, setIsSubmitting] = useState(false);
//   const [attendanceCount, setAttendanceCount] = useState(""); 

//   // --- AI Feature States & Refs ---
//   const [isAnalyzing, setIsAnalyzing] = useState(false);
//   const [imageSrc, setImageSrc] = useState(null);
//   const [aiPersonCount, setAiPersonCount] = useState(0); 
//   const imageRef = useRef(null);
//   const canvasRef = useRef(null);

//   // Safety check for state
//   const eventName = state?.eventName || "";
//   const eventDate = state?.date || ""; 

//   // --- AI IMAGE CAPTURE HANDLER ---
//   const handleImageCapture = async (event) => {
//     const file = event.target.files[0];
//     if (!file) return;

//     // Clear previous boxes
//     const canvas = canvasRef.current;
//     if (canvas) {
//       const ctx = canvas.getContext('2d');
//       ctx.clearRect(0, 0, canvas.width, canvas.height);
//     }

//     const imageUrl = URL.createObjectURL(file);
//     setImageSrc(imageUrl);
//     setIsAnalyzing(true);
//     setAiPersonCount(0); 

//     try {
//       // Yield to React to paint the img tag
//       await new Promise(resolve => setTimeout(resolve, 100));
//       const imgElement = imageRef.current;
      
//       if (!imgElement) {
//           setIsAnalyzing(false);
//           return;
//       }

//       // Updated to 1200px so the AI can see the back rows!
//       const TARGET_SIZE = 1200;
//       let downscaleRatio = 1;
      
//       if (imgElement.naturalWidth > TARGET_SIZE) {
//         downscaleRatio = TARGET_SIZE / imgElement.naturalWidth;
//       }

//       const offscreenCanvas = document.createElement('canvas');
//       offscreenCanvas.width = imgElement.naturalWidth * downscaleRatio;
//       offscreenCanvas.height = imgElement.naturalHeight * downscaleRatio;
//       const ctx = offscreenCanvas.getContext('2d', { alpha: false });
//       ctx.drawImage(imgElement, 0, 0, offscreenCanvas.width, offscreenCanvas.height);

//       offscreenCanvas.toBlob(async (blob) => {
//           try {
//               const formData = new FormData();
//               formData.append('file', blob, 'congregation.jpg');

//               // Your Public Hugging Face URL
//               const HF_API_URL = "https://brownenergy-congregant-detection.hf.space/detect";

//               const response = await fetch(HF_API_URL, {
//                   method: 'POST',
//                   body: formData,
//               });

//               if (!response.ok) throw new Error("API responded with an error");

//               const data = await response.json();

//               // Update AI UI and automatically fill the input box
//               setAiPersonCount(data.count);
//               setAttendanceCount(data.count.toString());
//               drawBoundingBoxes(data.predictions, downscaleRatio);

//           } catch (apiError) {
//               console.error("Microservice Error:", apiError);
//               alert("Failed to reach the AI server.");
//           } finally {
//               setIsAnalyzing(false);
//           }
//       }, 'image/jpeg', 0.8); 
      
//     } catch (error) {
//       console.error("Capture Error:", error);
//       setIsAnalyzing(false);
//     }
//   };

//   // --- AI BOUNDING BOX DRAWING ---
//   const drawBoundingBoxes = (predictions, downscaleRatio = 1) => {
//     const canvas = canvasRef.current;
//     const img = imageRef.current;
//     if (!canvas || !img || !predictions) return;

//     canvas.width = img.clientWidth;
//     canvas.height = img.clientHeight;
//     const ctx = canvas.getContext('2d');
//     ctx.clearRect(0, 0, canvas.width, canvas.height);

//     const aiImageWidth = img.naturalWidth * downscaleRatio;
//     const aiImageHeight = img.naturalHeight * downscaleRatio;
//     const scaleX = img.clientWidth / aiImageWidth;
//     const scaleY = img.clientHeight / aiImageHeight;

//     predictions.forEach((prediction) => {
//       const [x, y, width, height] = prediction.bbox;
//       const scaledX = x * scaleX;
//       const scaledY = y * scaleY;
//       const scaledWidth = width * scaleX;
//       const scaledHeight = height * scaleY;

//       ctx.strokeStyle = '#22c55e'; 
//       ctx.lineWidth = 2;
//       ctx.strokeRect(scaledX, scaledY, scaledWidth, scaledHeight);
//     });
//   };

//   // --- SAVE LOGIC ---
//   const handleSaveAttendance = async () => {
//     const count = parseInt(attendanceCount);
//     if (isNaN(count) || count < 0) {
//         alert("Please enter a valid attendance count.");
//         return;
//     }

//     if (isSubmitting) return;
//     setIsSubmitting(true); 

//     try {
//         // Send a single record representing the total count
//         const attendanceRecord = {
//             member_id: "UV", // Using UV to designate total unknown/untracked visitors
//             event_name: eventName,
//             status: count,
//             date: eventDate,
//             church_id: user.church_id
//         };

//         const result = await saveAttendance([attendanceRecord]);

//         if (result.status === "success") {
//             alert("Attendance has been captured"); 
//             navigate("/dashboard");
//         } else {
//             alert("Failed to save: " + result.message);
//         }

//     } catch (error) {
//         console.error("Capture failed", error);
//         alert("An error occurred.");
//     } finally {
//         setIsSubmitting(false);
//     }
//   };

//   if (!eventName || !eventDate) {
//       return <div className="p-10">Error: Missing event data. Go back and select an event.</div>;
//   }

//   return (
//     <Card 
//         title={`Track: ${eventName}`} 
//         subTitle={eventDate}
//         backAction={() => navigate('/attendance/EventSelect')}
//     >
//       <div className="flex flex-col gap-6 p-4">
        
//         {/* --- AI CAMERA SECTION --- */}
//         <div className="flex flex-col gap-4 border border-gray-100 p-4 rounded-xl bg-gray-50 shadow-sm">
//           <label className="bg-indigo-600 text-white p-4 rounded-lg font-bold text-center cursor-pointer hover:bg-indigo-700 transition shadow-sm">
//             {isAnalyzing ? (
//                <><Spinner size="sm" className="mr-2" /> Analyzing Photo...</>
//             ) : "📸 Take Photo to Count"}
//             <input 
//               type="file" 
//               accept="image/*" 
//               capture="environment" 
//               onChange={handleImageCapture} 
//               className="hidden" 
//               disabled={isAnalyzing}
//             />
//           </label>

//           {imageSrc && (
//             <div className="border rounded-lg overflow-hidden shadow-sm relative bg-white">
//               <img 
//                 ref={imageRef}
//                 src={imageSrc} 
//                 alt="Congregation" 
//                 className="w-full h-auto block"
//                 crossOrigin="anonymous" 
//               />
//               <canvas
//                 ref={canvasRef}
//                 className="absolute top-0 left-0 w-full h-full pointer-events-none"
//               />
//             </div>
//           )}
//         </div>

//         {/* --- FINAL COUNT & SAVE SECTION --- */}
//         <div className="flex flex-col gap-3">
//           <p className="font-semibold text-gray-700">Total Attendance</p>
//           <Input 
//               placeholder="0" 
//               type="number" 
//               size="lg"
//               value={attendanceCount}
//               onChange={(e) => setAttendanceCount(e.target.value)}
//               borderColor="gray.300"
//               bg="white"
//           />
//           <p className="text-sm text-gray-500">
//             {aiPersonCount > 0 
//               ? `AI detected ${aiPersonCount} people. You can adjust this number manually if needed.`
//               : "Take a photo or enter the count manually."}
//           </p>

//           <Button 
//             mt={4}
//             size="lg"
//             bg="blue.600"            
//             color="white"            
//             _hover={{ bg: "blue.700" }} 
//             boxShadow="md"
//             disabled={isSubmitting || attendanceCount === ""}
//             onClick={handleSaveAttendance}
//           >
//             {isSubmitting ? <Spinner size="sm" color="white" /> : "Save Attendance"}
//           </Button>
//         </div>

//       </div>
//     </Card>
//   );
// }

// export default TrackAttendance;

import React, { useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom"; 
import { saveAttendance } from "../../services/api"; 
import Card from '../../components/ui/Card';
import { Button, Spinner, Input } from "@chakra-ui/react";
import { useAuth } from '../../contexts/AuthContext';

const TrackAttendance = () => {
  const navigate = useNavigate();
  const { state } = useLocation(); 
  const { user } = useAuth();

  // --- States ---
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [attendanceCount, setAttendanceCount] = useState(""); 

  // --- AI Feature States & Refs ---
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [imageSrc, setImageSrc] = useState(null);
  const [aiPersonCount, setAiPersonCount] = useState(0); 
  const imageRef = useRef(null);
  const canvasRef = useRef(null);

  // Safety check for state
  const eventName = state?.eventName || "";
  const eventDate = state?.date || ""; 

  // --- AI IMAGE CAPTURE HANDLER ---
  const handleImageCapture = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Clear previous boxes
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    const imageUrl = URL.createObjectURL(file);
    setImageSrc(imageUrl);
    setIsAnalyzing(true);
    setAiPersonCount(0); 

    try {
      // Yield to React to paint the img tag
      await new Promise(resolve => setTimeout(resolve, 100));
      const imgElement = imageRef.current;
      
      if (!imgElement) {
          setIsAnalyzing(false);
          return;
      }

      // 1200px so the AI can see the back rows
      const TARGET_SIZE = 1200;
      let downscaleRatio = 1;
      
      if (imgElement.naturalWidth > TARGET_SIZE) {
        downscaleRatio = TARGET_SIZE / imgElement.naturalWidth;
      }

      const offscreenCanvas = document.createElement('canvas');
      offscreenCanvas.width = imgElement.naturalWidth * downscaleRatio;
      offscreenCanvas.height = imgElement.naturalHeight * downscaleRatio;
      const ctx = offscreenCanvas.getContext('2d', { alpha: false });
      ctx.drawImage(imgElement, 0, 0, offscreenCanvas.width, offscreenCanvas.height);

      offscreenCanvas.toBlob(async (blob) => {
          try {
              const formData = new FormData();
              formData.append('file', blob, 'congregation.jpg');

              // Your Public Hugging Face URL
              const HF_API_URL = "https://brownenergy-congregant-detection.hf.space/detect";

              const response = await fetch(HF_API_URL, {
                  method: 'POST',
                  body: formData,
              });

              if (!response.ok) throw new Error("API responded with an error");

              const data = await response.json();

              // Update AI UI and automatically fill the input box
              setAiPersonCount(data.count);
              setAttendanceCount(data.count.toString());
              drawBoundingBoxes(data.predictions, downscaleRatio);

          } catch (apiError) {
              console.error("Microservice Error:", apiError);
              alert("Failed to reach the AI server.");
          } finally {
              setIsAnalyzing(false);
          }
      }, 'image/jpeg', 0.8); 
      
    } catch (error) {
      console.error("Capture Error:", error);
      setIsAnalyzing(false);
    }
  };

  // --- AI BOUNDING BOX DRAWING ---
  const drawBoundingBoxes = (predictions, downscaleRatio = 1) => {
    const canvas = canvasRef.current;
    const img = imageRef.current;
    if (!canvas || !img || !predictions) return;

    canvas.width = img.clientWidth;
    canvas.height = img.clientHeight;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const aiImageWidth = img.naturalWidth * downscaleRatio;
    const aiImageHeight = img.naturalHeight * downscaleRatio;
    const scaleX = img.clientWidth / aiImageWidth;
    const scaleY = img.clientHeight / aiImageHeight;

    predictions.forEach((prediction) => {
      const [x, y, width, height] = prediction.bbox;
      const scaledX = x * scaleX;
      const scaledY = y * scaleY;
      const scaledWidth = width * scaleX;
      const scaledHeight = height * scaleY;

      ctx.strokeStyle = '#22c55e'; 
      ctx.lineWidth = 2;
      ctx.strokeRect(scaledX, scaledY, scaledWidth, scaledHeight);
    });
  };

  // --- SAVE LOGIC ---
  const handleSaveAttendance = async () => {
    const count = parseInt(attendanceCount);
    if (isNaN(count) || count < 0) {
        alert("Please enter a valid attendance count.");
        return;
    }

    if (isSubmitting) return;
    setIsSubmitting(true); 

    try {
        // Updated payload matching the new database schema
        const attendanceRecord = {
            event_name: eventName,
            congregation_count: count,
            date: eventDate,
            timestamp: new Date().toISOString(), // Automatically generate the current timestamp
            church_id: user.church_id
        };

        // Depending on your api.js file, you might just need to pass the object directly now 
        // instead of an array. If it still expects an array, leave the brackets: [attendanceRecord]
        const result = await saveAttendance([attendanceRecord]);

        if (result.status === "success") {
            alert("Attendance has been captured"); 
            navigate("/dashboard");
        } else {
            alert("Failed to save: " + result.message);
        }

    } catch (error) {
        console.error("Capture failed", error);
        alert("An error occurred.");
    } finally {
        setIsSubmitting(false);
    }
  };

  if (!eventName || !eventDate) {
      return <div className="p-10">Error: Missing event data. Go back and select an event.</div>;
  }

  return (
    <Card 
        title={`Track: ${eventName}`} 
        subTitle={eventDate}
        backAction={() => navigate('/attendance/EventSelect')}
    >
      <div className="flex flex-col gap-6 p-4">
        
        {/* --- AI CAMERA SECTION --- */}
        <div className="flex flex-col gap-4 border border-gray-100 p-4 rounded-xl bg-gray-50 shadow-sm">
          <label className="bg-indigo-600 text-white p-4 rounded-lg font-bold text-center cursor-pointer hover:bg-indigo-700 transition shadow-sm">
            {isAnalyzing ? (
               <><Spinner size="sm" className="mr-2" /> Analyzing Photo...</>
            ) : "📸 Take Photo to Count"}
            <input 
              type="file" 
              accept="image/*" 
              capture="environment" 
              onChange={handleImageCapture} 
              className="hidden" 
              disabled={isAnalyzing}
            />
          </label>

          {imageSrc && (
            <div className="border rounded-lg overflow-hidden shadow-sm relative bg-white">
              <img 
                ref={imageRef}
                src={imageSrc} 
                alt="Congregation" 
                className="w-full h-auto block"
                crossOrigin="anonymous" 
              />
              <canvas
                ref={canvasRef}
                className="absolute top-0 left-0 w-full h-full pointer-events-none"
              />
            </div>
          )}
        </div>

        {/* --- FINAL COUNT & SAVE SECTION --- */}
        <div className="flex flex-col gap-3">
          <p className="font-semibold text-gray-700">Total Attendance</p>
          <Input 
              placeholder="0" 
              type="number" 
              size="lg"
              value={attendanceCount}
              onChange={(e) => setAttendanceCount(e.target.value)}
              borderColor="gray.300"
              bg="white"
          />
          <p className="text-sm text-gray-500">
            {aiPersonCount > 0 
              ? `AI detected ${aiPersonCount} people. You can adjust this number manually if needed.`
              : "Take a photo or enter the count manually."}
          </p>

          <Button 
            mt={4}
            size="lg"
            bg="blue.600"            
            color="white"            
            _hover={{ bg: "blue.700" }} 
            boxShadow="md"
            disabled={isSubmitting || attendanceCount === ""}
            onClick={handleSaveAttendance}
          >
            {isSubmitting ? <Spinner size="sm" color="white" /> : "Save Attendance"}
          </Button>
        </div>

      </div>
    </Card>
  );
}

export default TrackAttendance;