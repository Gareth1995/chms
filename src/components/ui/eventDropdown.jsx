// import React, { useState } from "react";
// import {
//   Menu,
//   Button,
//   Input,
//   Box,
//   Text,
// } from "@chakra-ui/react";

// // Custom Triangle Icon
// const TriangleIcon = () => (
//   <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
//     <path d="M24 0L0 0L12 24L24 0Z" /> 
//   </svg>
// );

// const EventDropdown = ({ value, onChange }) => {
//   const [options, setOptions] = useState([
//     "Sabbath School",
//     "Divine Service",
//     "Prayer Meeting",
//     "Youth Service"
//   ]);

//   const [isAdding, setIsAdding] = useState(false);
//   const [newEventName, setNewEventName] = useState("");

//   // --- KEYBOARD HANDLER ---
//   const handleKeyDown = (e) => {
//     // CRITICAL FIX: Stop the Menu from intercepting keys (Space, Arrows, etc.)
//     // This allows you to type spaces and move the cursor inside the input.
//     e.stopPropagation();

//     if (e.key === "Enter") {
//         e.preventDefault(); 
//         const trimmed = newEventName.trim();
        
//         if (!trimmed) {
//             setIsAdding(false);
//             return;
//         }

//         // Add to list
//         setOptions([...options, trimmed]);
        
//         // Select it immediately (updates parent state)
//         if (onChange) onChange(trimmed);
        
//         // Reset
//         setNewEventName("");
//         setIsAdding(false); 
//     }
//   };

//   return (
//     <Menu.Root positioning={{ placement: "bottom-start", sameWidth: true }}>
      
//       {/* TRIGGER BUTTON */}
//       <Menu.Trigger asChild>
//         <Button 
//           variant="outline"
//           width="100%"
//           justifyContent="flex-start" 
//           borderRadius="0"
//           border="2px solid black"
//           bg="white"
//           _hover={{ bg: "gray.50" }}
//           paddingInlineStart={4}
//           gap={4}
//           fontWeight="normal"
//         >
//             <TriangleIcon />
//             {/* Display the 'value' prop, or fallback text */}
//             <Text>{value || "Select Event"}</Text>
//         </Button>
//       </Menu.Trigger>

//       {/* DROPDOWN CONTENT */}
//       <Menu.Positioner>
//         <Menu.Content 
//           borderRadius="0" 
//           border="2px solid black" 
//           marginTop="-2px"
//           padding={0}
//           width="100%"
//           bg="white"
//           shadow="none"
//           minW="var(--chakra-reference-width)"
//           zIndex={10}
//         >
//           {options.map((option) => (
//             <Menu.Item 
//               key={option} 
//               value={option}
//               // When clicked, fire onChange to update parent state
//               onClick={() => onChange && onChange(option)}
//               borderRadius="0"
//               bg={value === option ? "gray.200" : "white"}
//               _hover={{ bg: "gray.100" }}
//               borderBottom="1px solid gray"
//               cursor="pointer"
//               py={2}
//               px={4}
//             >
//               {option}
//             </Menu.Item>
//           ))}

//           {/* "+ Add Event" Section */}
//           <Box borderTop="2px solid black">
//             {isAdding ? (
//                 <Box p={2}>
//                     <Input 
//                         autoFocus
//                         size="sm"
//                         placeholder="Type & Enter..."
//                         value={newEventName}
//                         onChange={(e) => setNewEventName(e.target.value)}
//                         onKeyDown={handleKeyDown}
//                         onClick={(e) => e.stopPropagation()} 
//                         borderRadius="0"
//                         border="1px solid gray"
//                         bg="white"
//                     />
//                 </Box>
//             ) : (
//                 <Menu.Item 
//                     value="add-new"
//                     closeOnSelect={false} 
//                     onClick={(e) => {
//                         e.stopPropagation(); 
//                         setIsAdding(true);
//                     }}
//                     borderRadius="0"
//                     _hover={{ bg: "gray.100" }}
//                     cursor="pointer"
//                     py={3}
//                     px={4}
//                     fontWeight="medium"
//                 >
//                     + Add event
//                 </Menu.Item>
//             )}
//           </Box>

//         </Menu.Content>
//       </Menu.Positioner>
//     </Menu.Root>
//   );
// };

// export default EventDropdown;

import React, { useState } from "react";
import {
  Menu,
  Button,
  Input,
  Box,
  Text,
} from "@chakra-ui/react";

// 1. Custom Triangle Icon
const TriangleIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
    <path d="M24 0L0 0L12 24L24 0Z" /> 
  </svg>
);

// 2. Custom Minus Icon (for delete)
const MinusIcon = () => (
  <svg width="10" height="2" viewBox="0 0 24 4" fill="currentColor">
    <rect width="24" height="4" rx="2" />
  </svg>
);

const EventDropdown = ({ value, onChange }) => {
  const [options, setOptions] = useState([
    "Sabbath School",
    "Divine Service",
    "Prayer Meeting",
    "Youth Service"
  ]);

  const [isAdding, setIsAdding] = useState(false);
  const [newEventName, setNewEventName] = useState("");

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

  // --- ADD HANDLER ---
  const handleKeyDown = (e) => {
    e.stopPropagation(); // Stop menu interference

    if (e.key === "Enter") {
        e.preventDefault(); 
        const trimmed = newEventName.trim();
        
        if (!trimmed) {
            setIsAdding(false);
            return;
        }

        setOptions([...options, trimmed]);
        
        if (onChange) onChange(trimmed);
        
        setNewEventName("");
        setIsAdding(false); 
    }
  };

  return (
    <Menu.Root positioning={{ placement: "bottom-start", sameWidth: true }}>
      
      <Menu.Trigger asChild>
        <Button 
          variant="outline"
          width="100%"
          justifyContent="flex-start" 
          borderRadius="0"
          border="2px solid black"
          bg="white"
          _hover={{ bg: "gray.50" }}
          paddingInlineStart={4}
          gap={4}
          fontWeight="normal"
        >
            <TriangleIcon />
            <Text>{value || "Select Event"}</Text>
        </Button>
      </Menu.Trigger>

      <Menu.Positioner>
        <Menu.Content 
          borderRadius="0" 
          border="2px solid black" 
          marginTop="-2px"
          padding={0}
          width="100%"
          bg="white"
          shadow="none"
          minW="var(--chakra-reference-width)"
          zIndex={10}
        >
          {options.map((option) => (
            <Menu.Item 
              key={option} 
              value={option}
              // Select the item (unless delete was clicked)
              onClick={() => onChange && onChange(option)}
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
                <Box p={2}>
                    <Input 
                        autoFocus
                        size="sm"
                        placeholder="Type & Enter..."
                        value={newEventName}
                        onChange={(e) => setNewEventName(e.target.value)}
                        onKeyDown={handleKeyDown}
                        onClick={(e) => e.stopPropagation()} 
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