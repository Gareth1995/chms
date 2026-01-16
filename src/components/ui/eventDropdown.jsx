import React, { useState, useEffect } from "react";
import {
  Menu,
  Button,
  Input,
  Box,
  Text,
  Spinner
} from "@chakra-ui/react";

import { getEvents, addEvent, deleteEvent } from "../../services/api";

const ChevronIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 9l6 6 6-6" />
  </svg>
);

const MinusIcon = () => (
  <svg width="10" height="2" viewBox="0 0 24 4" fill="currentColor">
    <rect width="24" height="4" rx="2" />
  </svg>
);

// 1. DEFINE PROTECTED EVENTS
const DEFAULT_EVENTS = ["Sabbath School", "Divine Service", "Prayer Meeting"];

const EventDropdown = ({ value, onChange }) => {
  
  const [options, setOptions] = useState([]); 
  const [loading, setLoading] = useState(false); 
  const [isAdding, setIsAdding] = useState(false);
  const [isSaving, setIsSaving] = useState(false); 
  const [newEventName, setNewEventName] = useState("");
  
  const [deletingEvent, setDeletingEvent] = useState(null); 

  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      try {
        const result = await getEvents(); 
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

  const handleDelete = async (e, optionToDelete) => {
    e.stopPropagation(); 

    if (DEFAULT_EVENTS.includes(optionToDelete)) return;

    const confirmed = window.confirm(`Are you sure you want to delete "${optionToDelete}"?`);
    if (!confirmed) return;

    setDeletingEvent(optionToDelete);

    try {
      const result = await deleteEvent(optionToDelete);

      if (result.status === "success") {
        const updatedOptions = options.filter((opt) => opt !== optionToDelete);
        setOptions(updatedOptions);

        if (value === optionToDelete && onChange) {
          onChange("");
        }
      } else {
        alert("Failed to delete: " + result.message);
      }
    } catch (error) {
      console.error("Delete failed", error);
      alert("Network error occurred while deleting.");
    } finally {
      setDeletingEvent(null);
    }
  };

  const handleSave = async () => {
    const trimmed = newEventName.trim();
    
    if (!trimmed) {
        setIsAdding(false);
        return;
    }

    if (options.includes(trimmed)) {
        alert("This event already exists.");
        setNewEventName(""); 
        setIsAdding(false);  
        return;
    }

    setIsSaving(true); 

    try {
        const result = await addEvent(trimmed); 

        if (result.status === "success") {
            setOptions([...options, trimmed]);
            if (onChange) onChange(trimmed);
            
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
        handleSave(); 
    }
  };

  return (
    <Menu.Root positioning={{ placement: "bottom-start", sameWidth: true }}>
      
      <Menu.Trigger asChild>
        <Button 
          variant="outline"
          width="100%"
          borderRadius="md"
          border="1px solid"       
          borderColor="gray.300"
          justifyContent="flex-start" 
          bg="white"
          _hover={{ bg: "gray.50" }}
          paddingInlineStart={4}
          gap={4}
          fontWeight="normal"
        >
            <ChevronIcon />
            <Text>{loading ? "Loading..." : (value || "Select Event")}</Text>
        </Button>
      </Menu.Trigger>

      <Menu.Positioner>
        <Menu.Content 
          borderRadius="md"             
          border="1px solid"
          borderColor="gray.200"
          marginTop={2}                 
          padding={1}                   
          width="100%"
          bg="white"
          shadow="lg"                   
          minW="var(--chakra-reference-width)"
          zIndex={10}
          overflow="hidden"
        >
          {options.map((option) => {
            const isProtected = DEFAULT_EVENTS.includes(option);

            return (
              <Menu.Item 
                key={option} 
                value={option}
                onClick={(e) => {
                  if (deletingEvent === option) {
                      e.preventDefault();
                      e.stopPropagation();
                      return;
                  }
                  
                  if (onChange) onChange(option);
                  setIsAdding(false);
                }}
                borderRadius="0"
                bg={value === option ? "gray.200" : "white"}
                _hover={deletingEvent === option ? {} : { bg: "gray.100" }} 
                borderBottom="1px solid gray"
                cursor={deletingEvent === option ? "wait" : "pointer"}
                py={2}
                px={4}
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                closeOnSelect={deletingEvent !== option} 
              >
                <Text 
                  as="span" 
                  color={deletingEvent === option ? "gray.400" : "inherit"}
                >
                  {option}
                </Text>

                {deletingEvent === option ? (
                  <Box p={2} display="flex" alignItems="center" justifyContent="center">
                      <Spinner size="xs" color="red.500" />
                  </Box>
                ) : !isProtected ? (
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
                ) : null}

              </Menu.Item>
            );
          })}

          <Box borderTop="2px solid black">
            {isAdding ? (
                <Box p={4} position="relative">
                    <Input 
                        autoFocus
                        size="sm"
                        
                        // --- UPDATED SECTION START ---
                        // 1. If saving, show "Adding Event..." otherwise show default placeholder
                        placeholder={isSaving ? "Adding Event..." : "Type & Enter..."}
                        
                        // 2. If saving, OVERRIDE the value to display the status message
                        // Otherwise, show what the user is typing
                        value={isSaving ? "Adding Event..." : newEventName}
                        // --- UPDATED SECTION END ---

                        onChange={(e) => setNewEventName(e.target.value)}
                        onKeyDown={handleKeyDown}
                        onBlur={handleSave}
                        onClick={(e) => e.stopPropagation()}
                        pl={2} 
                        borderRadius="0"
                        border="1px solid gray"
                        bg="white"
                        disabled={isSaving}
                    />
                    {isSaving && (
                        <Box position="absolute" right="24px" top="24px">
                            <Spinner size="xs" color="blue.500" />
                        </Box>
                    )}
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