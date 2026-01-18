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
  Spinner // <--- Ensure Spinner is imported
} from "@chakra-ui/react"

const TrackAttendance = () => {
  const navigate = useNavigate();
  const { state } = useLocation(); 

  const [members, setMembers] = useState([]);
  const [selection, setSelection] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  // --- UPDATED CAPTURE HANDLER ---
  const handleCapture = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true); // 1. Start Loading (Spinner appears)

    try {
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

        const result = await saveAttendance(attendanceRecords);

        if (result.status === "success") {
            // 2. Show Success Popup
            // The spinner will keep spinning until the user clicks "OK"
            alert("Attendance has been captured"); 
            navigate("/dashboard");
        } else {
            alert("Failed to save: " + result.message);
        }

    } catch (error) {
        console.error("Capture failed", error);
        alert("An error occurred.");
    } finally {
        setIsSubmitting(false); // Stop Loading
    }
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
                size="sm"
                bg="blue.600"            
                color="white"            
                _hover={{ bg: "blue.700" }} 
                boxShadow="md"
                px={6} 
                gap={3}
                disabled={isSubmitting} 
                onClick={handleCapture} 
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
  )
}

export default TrackAttendance;