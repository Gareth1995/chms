import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom"; 
import { getMembers, saveAttendance, getAttendance } from "../../services/api"; 
import Card from '../../components/ui/Card';
import {
  ActionBar,
  Button,
  Checkbox,
  Portal,
  Table,
  Spinner,
  Dialog,
  Input 
} from "@chakra-ui/react"
import { useAuth } from '../../contexts/AuthContext';

const TrackAttendance = () => {
  const navigate = useNavigate();
  const { state } = useLocation(); 
  const { user } = useAuth();

  const [members, setMembers] = useState([]);
  const [selection, setSelection] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- Dialog States ---
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogStep, setDialogStep] = useState(1); // 1 = Ask, 2 = Input
  const [visitorCount, setVisitorCount] = useState("");

  // --- AI Feature States & Refs ---
  const [showAI, setShowAI] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [imageSrc, setImageSrc] = useState(null);
  const [aiPersonCount, setAiPersonCount] = useState(0); 
  const imageRef = useRef(null);
  const canvasRef = useRef(null);

  // Safety check for state
  const eventName = state?.eventName || "";
  const eventDate = state?.date || ""; 

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        if (!eventName || !eventDate) {
            console.error("Missing event details");
            return; 
        }

        const [membersRes, attendanceRes] = await Promise.all([
            getMembers(user.church_id),
            getAttendance(eventName, eventDate, user.church_id)
        ]);
        
        if (membersRes.status === "success" && Array.isArray(membersRes.members)) {
            setMembers(membersRes.members);
        }

        if (attendanceRes.status === "success" && Array.isArray(attendanceRes.presentMemberIds)) {
            setSelection(attendanceRes.presentMemberIds);
        }

      } catch (error) {
        console.error("Failed to load data", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [eventName, eventDate]); 

  // --- AI IMAGE CAPTURE HANDLER (Microservice Approach) ---
  const handleImageCapture = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // 1. Clear any previous boxes from the canvas immediately
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    const imageUrl = URL.createObjectURL(file);
    setImageSrc(imageUrl); // React now schedules a rerender to show the <img> tag
    setIsAnalyzing(true);
    setAiPersonCount(0); 

    try {
      // 2. THE FIX: YIELD TO REACT 
      // We pause for 100 milliseconds. This gives React just enough time 
      // to render the conditional <img> tag into the DOM so that the 
      // reference ('imageRef.current') is no longer null.
      await new Promise(resolve => setTimeout(resolve, 100));

      const imgElement = imageRef.current;
      
      // 3. Safety Check: If it's still null (unlikely), stop here gracefully.
      if (!imgElement) {
          console.error("Image element not found in DOM yet.");
          setIsAnalyzing(false);
          return;
      }

      // 4. Proceed with processing without needing 'onload'
      const TARGET_SIZE = 1200;
      let downscaleRatio = 1;
      
      // We use naturalWidth/naturalHeight from the loaded image data
      if (imgElement.naturalWidth > TARGET_SIZE) {
        downscaleRatio = TARGET_SIZE / imgElement.naturalWidth;
      }

      const offscreenCanvas = document.createElement('canvas');
      offscreenCanvas.width = imgElement.naturalWidth * downscaleRatio;
      offscreenCanvas.height = imgElement.naturalHeight * downscaleRatio;
      const ctx = offscreenCanvas.getContext('2d', { alpha: false });
      ctx.drawImage(imgElement, 0, 0, offscreenCanvas.width, offscreenCanvas.height);

      // 5. CONVERT TO BLOB AND SEND TO PYTHON BACKEND
      offscreenCanvas.toBlob(async (blob) => {
          try {
              const formData = new FormData();
              formData.append('file', blob, 'congregation.jpg');

              // Ensure this is your correct .hf.space URL!
              const HF_API_URL = "https://brownenergy-congregant-detection.hf.space/detect";

              const response = await fetch(HF_API_URL, {
                  method: 'POST',
                  body: formData,
              });

              if (!response.ok) throw new Error("API responded with an error");

              const data = await response.json();

              // 6. UPDATE UI WITH RESULTS
              setAiPersonCount(data.count);
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
      // Data format from our Python API: [x1, y1, width, height]
      const [x, y, width, height] = prediction.bbox;

      const scaledX = x * scaleX;
      const scaledY = y * scaleY;
      const scaledWidth = width * scaleX;
      const scaledHeight = height * scaleY;

      ctx.strokeStyle = '#22c55e'; 
      ctx.lineWidth = 3;
      ctx.strokeRect(scaledX, scaledY, scaledWidth, scaledHeight);

      ctx.fillStyle = '#22c55e';
      ctx.fillRect(scaledX, scaledY - 20, 45, 20); 
      
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 12px Arial';
      ctx.fillText(
        `${Math.round(prediction.score * 100)}%`, 
        scaledX + 5, 
        scaledY - 5
      );
    });
  };

  // --- HELPER: Use AI count for visitors ---
  const handleUseAiForVisitors = () => {
    const estimatedVisitors = Math.max(0, aiPersonCount - selection.length);
    setVisitorCount(estimatedVisitors.toString());
    setDialogStep(2);
    setIsDialogOpen(true);
  };

  // This handles both scenarios: with or without the extra visitor record
  const processSave = async (extraRecord = null) => {
    setIsDialogOpen(false); 
    
    if (isSubmitting) return;
    setIsSubmitting(true); 

    try {
        // 1. Map existing members
        const attendanceRecords = members.map((member, index) => {
            const memberId = member.id || member.email || index;
            const status = selection.includes(memberId) ? 1 : 0;

            return {
                member_id: memberId,
                event_name: eventName,
                status: status,
                date: eventDate,
                church_id: user.church_id
            };
        });

        // 2. Append Visitor Record if it exists
        if (extraRecord) {
            attendanceRecords.push(extraRecord);
        }

        // 3. Send to Backend
        const result = await saveAttendance(attendanceRecords);

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

  // --- HANDLER: User clicks "No" (Step 1) ---
  const handleSaveOnlyMembers = () => {
    processSave(null);
  };

  // --- HANDLER: User clicks "Save" (Step 2) ---
  const handleSaveWithVisitors = () => {
    const count = parseInt(visitorCount);
    if (isNaN(count) || count < 0) {
        alert("Please enter a valid number of visitors.");
        return;
    }

    const visitorRecord = {
        member_id: "UV",
        event_name: eventName,
        status: count, 
        date: eventDate,
        church_id: user.church_id
    };

    processSave(visitorRecord);
  };

  // --- TRIGGER: Open Dialog ---
  const handleCaptureClick = (e) => {
    if (e) {
        e.preventDefault();
        e.stopPropagation();
    }
    setDialogStep(1); 
    setVisitorCount(""); 
    setIsDialogOpen(true);
  };

  // --- Table Logic ---
  const hasSelection = selection.length > 0;
  const indeterminate = hasSelection && selection.length < (members.length || 0);

  const rows = members.map((member, index) => {
    const memberId = member.id || member.email || index; 
    const isSelected = selection.includes(memberId);

    return (
      <Table.Row
        key={memberId}
        data-selected={isSelected ? "" : undefined}
        bg={isSelected ? "gray.50" : "transparent"}
        borderBottom="1px solid"
        borderColor="gray.200"
      >
        <Table.Cell>
          <Checkbox.Root
            size="sm"
            top="0.5"
            aria-label="Select row"
            checked={isSelected}
            onCheckedChange={(changes) => {
              setSelection((prev) =>
                changes.checked
                  ? [...prev, memberId]
                  : selection.filter((id) => id !== memberId),
              )
            }}
          >
            <Checkbox.HiddenInput />
            <Checkbox.Control 
              borderWidth="2px"
              borderColor="black"
              _checked={{ bg: "blue.500", borderColor: "blue.500" }}
            />
          </Checkbox.Root>
        </Table.Cell>
        <Table.Cell fontWeight="medium">{member.firstName}</Table.Cell>
        <Table.Cell fontWeight="medium">{member.lastName}</Table.Cell>
        <Table.Cell>{member.role}</Table.Cell>
        <Table.Cell>{member.cell}</Table.Cell>
      </Table.Row>
    );
  });

  if (!eventName || !eventDate) {
      return <div className="p-10">Error: Missing event data. Go back and select an event.</div>;
  }

  return (
    <>
      <Card 
          title={`Track: ${eventName}`} 
          subTitle={eventDate}
          backAction={() => navigate('/attendance/EventSelect')}
      >
        
        {/* --- AI CAMERA SECTION --- */}
        <div className="mb-6 px-4">
          <Button 
            onClick={() => setShowAI(!showAI)} 
            variant="outline" 
            size="sm" 
            width="full"
            borderColor="indigo.500"
            color="indigo.600"
            _hover={{ bg: "indigo.50" }}
          >
            {showAI ? "Hide AI Camera" : "📸 Use AI Camera to Count"}
          </Button>

          {showAI && (
            <div className="mt-4 flex flex-col gap-4 border border-gray-100 p-4 rounded-xl bg-gray-50">
              <label className="bg-indigo-600 text-white p-3 rounded-lg font-bold text-center cursor-pointer hover:bg-indigo-700 transition shadow-sm text-sm">
                {isAnalyzing ? "Uploading to Cloud..." : "Take Photo"}
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

                  {isAnalyzing && (
                    <div className="absolute inset-0 bg-white/60 flex items-center justify-center backdrop-blur-sm">
                      <div className="bg-white p-2 px-4 rounded-lg shadow-lg font-bold text-indigo-800 text-sm animate-pulse flex items-center gap-2">
                        <Spinner size="sm" /> Analyzing...
                      </div>
                    </div>
                  )}
                </div>
              )}

              {!isAnalyzing && imageSrc && (
                  <div className="flex flex-col gap-3">
                      <div className="bg-green-50 border border-green-200 text-green-800 p-3 rounded-lg text-center">
                          <p className="text-xs uppercase font-bold text-green-600">Total Counted</p>
                          <p className="text-3xl font-black">{aiPersonCount}</p>
                      </div>
                      <Button 
                          onClick={handleUseAiForVisitors}
                          bg="green.500" color="white" _hover={{ bg: "green.600" }} size="sm"
                      >
                          Set as Unknown Visitors Count
                      </Button>
                  </div>
              )}
            </div>
          )}
        </div>
        {/* --- END AI CAMERA SECTION --- */}

        <Table.Root size="sm" interactive>
          <Table.Header>
            <Table.Row>
              <Table.ColumnHeader w="6">
                <Checkbox.Root
                  size="sm"
                  top="0.5"
                  aria-label="Select all rows"
                  checked={indeterminate ? "indeterminate" : (members.length > 0 && selection.length === members.length)}
                  onCheckedChange={(changes) => {
                    setSelection(
                      changes.checked ? members.map((m, i) => m.id || m.email || i) : [],
                    )
                  }}
                >
                  <Checkbox.HiddenInput/>
                  <Checkbox.Control 
                    borderWidth="2px"
                    borderColor="black"
                    _checked={{ bg: "blue.500", borderColor: "blue.500" }}
                  />
                </Checkbox.Root>
              </Table.ColumnHeader>
              <Table.ColumnHeader>First Name</Table.ColumnHeader>
              <Table.ColumnHeader>Last Name</Table.ColumnHeader>
              <Table.ColumnHeader>Role</Table.ColumnHeader>
              <Table.ColumnHeader>Cell</Table.ColumnHeader>
            </Table.Row>
          </Table.Header>
          
          <Table.Body>
              {isLoading ? (
                  <Table.Row>
                      <Table.Cell colSpan={5} textAlign="center" py={8} color="gray.500">
                          <Spinner size="sm" mr={2} /> Loading data...
                      </Table.Cell>
                  </Table.Row>
              ) : members.length === 0 ? (
                  <Table.Row>
                        <Table.Cell colSpan={5} textAlign="center" py={8} color="gray.500">
                          No members found.
                      </Table.Cell>
                  </Table.Row>
              ) : rows}
          </Table.Body>
        </Table.Root>

        <ActionBar.Root open={hasSelection}> 
          <Portal>
            <ActionBar.Positioner>
              <ActionBar.Content>
                <ActionBar.SelectionTrigger>
                  {selection.length} present
                </ActionBar.SelectionTrigger>
                <ActionBar.Separator />
                <Button 
                  type="button"
                  size="sm"
                  bg="blue.600"            
                  color="white"            
                  _hover={{ bg: "blue.700" }} 
                  boxShadow="md"
                  px={6} 
                  gap={3}
                  disabled={isSubmitting}
                  onClick={handleCaptureClick}
                >
                  {isSubmitting ? (
                      <Spinner size="sm" color="white" /> 
                  ) : (
                      "Capture"
                  )}
                </Button>

              </ActionBar.Content>
            </ActionBar.Positioner>
          </Portal>
        </ActionBar.Root>
      </Card>

      <Dialog.Root 
        open={isDialogOpen} 
        onOpenChange={(e) => setIsDialogOpen(e.open)}
      >
        <Dialog.Backdrop bg="blackAlpha.500" backdropFilter="blur(4px)" />
        <Dialog.Positioner>
          <Dialog.Content bg="white" borderRadius="md" p={4} boxShadow="xl">
            <Dialog.CloseTrigger />
            
            <Dialog.Header>
              <Dialog.Title fontSize="lg" fontWeight="bold">
                {dialogStep === 1 ? "Add Unknown Visitors" : "Visitor Count"}
              </Dialog.Title>
            </Dialog.Header>
            
            <Dialog.Body py={4}>
              {dialogStep === 1 ? (
                 "Do you want to add a count of unknown visitors?"
              ) : (
                 <div className="flex flex-col gap-2">
                    <p className="mb-2">How many unknown visitors attending today?</p>
                    <Input 
                        placeholder="0" 
                        type="number" 
                        value={visitorCount}
                        onChange={(e) => setVisitorCount(e.target.value)}
                        borderColor="gray.300"
                    />
                 </div>
              )}
            </Dialog.Body>
            
            <Dialog.Footer gap={3}>
              {dialogStep === 1 ? (
                <>
                    <Button variant="outline" onClick={handleSaveOnlyMembers}>
                        No
                    </Button>
                    <Button 
                        bg="blue.600" color="white" _hover={{ bg: "blue.700" }}
                        onClick={() => setDialogStep(2)}
                    >
                        Yes
                    </Button>
                </>
              ) : (
                <>
                    <Button variant="outline" onClick={() => setDialogStep(1)}>
                        Back
                    </Button>
                    <Button 
                        bg="blue.600" color="white" _hover={{ bg: "blue.700" }}
                        onClick={handleSaveWithVisitors} 
                    >
                        Save
                    </Button>
                </>
              )}
            </Dialog.Footer>

          </Dialog.Content>
        </Dialog.Positioner>
      </Dialog.Root>
    </>
  )
}

export default TrackAttendance;