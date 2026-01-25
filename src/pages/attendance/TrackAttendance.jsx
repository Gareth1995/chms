import React, { useState, useEffect } from "react";
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

const TrackAttendance = () => {
  const navigate = useNavigate();
  const { state } = useLocation(); 

  const [members, setMembers] = useState([]);
  const [selection, setSelection] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- Dialog States ---
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogStep, setDialogStep] = useState(1); // 1 = Ask, 2 = Input
  const [visitorCount, setVisitorCount] = useState("");

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
            getMembers(),
            getAttendance(eventName, eventDate)
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
                date: eventDate
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
    // Validate input
    const count = parseInt(visitorCount);
    if (isNaN(count) || count < 0) {
        alert("Please enter a valid number of visitors.");
        return;
    }

    // Create the visitor record
    const visitorRecord = {
        member_id: "UV",
        event_name: eventName,
        status: count, // The numeric count
        date: eventDate
    };

    processSave(visitorRecord);
  };

  // --- TRIGGER: Open Dialog ---
  const handleCaptureClick = (e) => {
    if (e) {
        e.preventDefault();
        e.stopPropagation();
    }
    // Reset dialog state
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
                  {/* 3. Conditional Rendering: Spinner vs Text */}
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
                 // STEP 1 CONTENT
                 "Do you want to add a count of unknown visitors?"
              ) : (
                 // STEP 2 CONTENT
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
                // STEP 1 BUTTONS
                <>
                    <Button variant="outline" onClick={handleSaveOnlyMembers}>
                        No
                    </Button>
                    <Button 
                        bg="blue.600" color="white" _hover={{ bg: "blue.700" }}
                        onClick={() => setDialogStep(2)} // Go to Step 2
                    >
                        Yes
                    </Button>
                </>
              ) : (
                // STEP 2 BUTTONS
                <>
                    <Button variant="outline" onClick={() => setDialogStep(1)}>
                        Back
                    </Button>
                    <Button 
                        bg="blue.600" color="white" _hover={{ bg: "blue.700" }}
                        onClick={handleSaveWithVisitors} // Save with Count
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