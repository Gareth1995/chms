import React, { useState, useEffect } from "react";
import {
  Menu,
  Button,
  Input,
  Box,
  Text,
} from "@chakra-ui/react";

import { getEvents, addEvent } from "../../services/api";

const ChevronIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 9l6 6 6-6" />
  </svg>
);

// 2. Custom Minus Icon (for delete)
const MinusIcon = () => (
  <svg width="10" height="2" viewBox="0 0 24 4" fill="currentColor">
    <rect width="24" height="4" rx="2" />
  </svg>
);

const EventDropdown = ({ value, onChange }) => {
  
  const [options, setOptions] = useState([]); 
  const [loading, setLoading] = useState(false); // Global loading for fetch
  const [isAdding, setIsAdding] = useState(false);
  const [isSaving, setIsSaving] = useState(false); // Specific loading for adding
  const [newEventName, setNewEventName] = useState("");

  // Fetching events from event table on Mount
  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      try {
        const result = await getEvents(); //
        if (result.status === "success") {
          setOptions(result.events);
        }
      } catch (error) {
        console.error("Failed to fetch events", error);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  // --- DELETE HANDLER ---
  const handleDelete = (e, optionToDelete) => {
    // CRITICAL: Stop the click from selecting the row
    e.stopPropagation();

    // 1. Show Popup
    const confirmed = window.confirm(`Are you sure you want to delete "${optionToDelete}"?`);

    if (confirmed) {
      // 2. Remove from list
      const updatedOptions = options.filter((opt) => opt !== optionToDelete);
      setOptions(updatedOptions);

      // 3. If the deleted item was currently selected, clear the selection
      if (value === optionToDelete && onChange) {
        onChange("");
      }
    }
  };

  // --- 2. SHARED SAVE FUNCTION (Connects to Backend) ---
  const handleSave = async () => {
    const trimmed = newEventName.trim();
    
    if (!trimmed) {
        setIsAdding(false);
        return;
    }

    // Check for duplicates before hitting API
    if (options.includes(trimmed)) {
        alert("This event already exists.");
        setNewEventName(""); // Clear text
        setIsAdding(false);  // Force close
        return;
    }

    setIsSaving(true); // Show loading state

    try {
        // Call the Backend API
        const result = await addEvent(trimmed); //

        if (result.status === "success") {
            // Update Local State
            setOptions([...options, trimmed]);
            
            // Update Parent Selection
            if (onChange) onChange(trimmed);
            
            // Cleanup
            setNewEventName("");
            setIsAdding(false); 
        } else {
            alert("Error saving event: " + result.message);
        }
    } catch (error) {
        console.error("Save failed", error);
        alert("Network error occurred.");
    } finally {
        setIsSaving(false);
    }
  };

  // --- ADD HANDLER (Enter) ---
  const handleKeyDown = (e) => {
    e.stopPropagation(); 

    if (e.key === "Escape") {
        e.preventDefault();
        setNewEventName(""); 
        setIsAdding(false);  
        return;
    }

    if (e.key === "Enter") {
        e.preventDefault(); 
        handleSave(); // Call the shared save function
    }
  };

  return (
    <Menu.Root positioning={{ placement: "bottom-start", sameWidth: true }}>
      
      <Menu.Trigger asChild>
        <Button 
          variant="outline"
          width="100%"
          // justifyContent="space-between"
          borderRadius="md"
          border="1px solid"       // Reduced to 1px for a standard "input" look
          borderColor="gray.300"
          justifyContent="flex-start" 
          // borderRadius="0"
          // border="2px solid black"
          bg="white"
          _hover={{ bg: "gray.50" }}
          paddingInlineStart={4}
          gap={4}
          fontWeight="normal"
        >
            <ChevronIcon />
            <Text>{value || "Select Event"}</Text>
        </Button>
      </Menu.Trigger>

      <Menu.Positioner>
        <Menu.Content 
          borderRadius="md"             // Rounded corners
          border="1px solid"
          borderColor="gray.200"
          marginTop={2}                 // Small gap between button and list
          padding={1}                   // Inner padding for aesthetics
          width="100%"
          bg="white"
          shadow="lg"                   // Nice drop shadow
          minW="var(--chakra-reference-width)"
          zIndex={10}
          overflow="hidden"
        >
          {options.map((option) => (
            <Menu.Item 
              key={option} 
              value={option}
              // Select the item (unless delete was clicked)
              // onClick={() => onChange && onChange(option)}
              onClick={() => {
                if (onChange) onChange(option);
                setIsAdding(false);
              }}
              borderRadius="0"
              bg={value === option ? "gray.200" : "white"}
              _hover={{ bg: "gray.100" }}
              borderBottom="1px solid gray"
              cursor="pointer"
              py={2}
              px={4}
              // Use Flexbox to separate Text and Delete Button
              display="flex"
              justifyContent="space-between"
              alignItems="center"
            >
              <Text as="span">{option}</Text>

              {/* DELETE BUTTON */}
              <Box
                as="button"
                onClick={(e) => handleDelete(e, option)}
                color="red.500"
                p={2}
                borderRadius="full"
                _hover={{ bg: "red.100" }}
                display="flex"
                alignItems="center"
                justifyContent="center"
                title="Delete event"
              >
                <MinusIcon />
              </Box>

            </Menu.Item>
          ))}

          {/* Add Event Section */}
          <Box borderTop="2px solid black">
            {isAdding ? (
                <Box p={4}>
                    <Input 
                        autoFocus
                        size="sm"
                        placeholder="Type & Enter..."
                        value={newEventName}
                        onChange={(e) => setNewEventName(e.target.value)}
                        onKeyDown={handleKeyDown}
                        // onBlur={setIsAdding(false)}
                        onClick={(e) => e.stopPropagation()}
                        pl={2} 
                        borderRadius="0"
                        border="1px solid gray"
                        bg="white"
                    />
                </Box>
            ) : (
                <Menu.Item 
                    value="add-new"
                    closeOnSelect={false} 
                    onClick={(e) => {
                        e.stopPropagation(); 
                        setIsAdding(true);
                    }}
                    borderRadius="0"
                    _hover={{ bg: "gray.100" }}
                    cursor="pointer"
                    py={3}
                    px={4}
                    fontWeight="medium"
                >
                    + Add event
                </Menu.Item>
            )}
          </Box>

        </Menu.Content>
      </Menu.Positioner>
    </Menu.Root>
  );
};

export default EventDropdown;