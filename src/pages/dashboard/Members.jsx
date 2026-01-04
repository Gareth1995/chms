// import React, { useState, useEffect } from "react"
// import { useNavigate } from "react-router-dom"; 
// import { getMembers } from "../../services/api"; 
// import Card from '../../components/ui/Card';
// import {
//   ActionBar,
//   Button,
//   Checkbox,
//   Kbd,
//   Portal,
//   Table,
// } from "@chakra-ui/react"

// const Members = () => {
//   const navigate = useNavigate();
  
//   const [members, setMembers] = useState([]);
//   const [selection, setSelection] = useState([]);
//   const [isLoading, setIsLoading] = useState(true);

//   useEffect(() => {
//     const fetchMembersData = async () => {
//       setIsLoading(true);
//       try {
//         const response = await getMembers();
        
//         // Match the backend structure: { status: "success", members: [...] }
//         if (response.status === "success" && Array.isArray(response.members)) {
//             setMembers(response.members);
//         } else {
//             console.warn("Unexpected API response format", response);
//             setMembers([]); 
//         }

//       } catch (error) {
//         console.error("Failed to load members", error);
//       } finally {
//         setIsLoading(false);
//       }
//     };

//     fetchMembersData();
//   }, []);

//   const hasSelection = selection.length > 0;
//   // Safe check for indeterminate state
//   const indeterminate = hasSelection && selection.length < (members.length || 0);

//   const rows = members.map((member) => {
//     // Use ID from sheet, fallback to email if ID is missing
//     const memberId = member.id || member.email; 
//     const isSelected = selection.includes(memberId);
//     const fullName = `${member.firstName || ''} ${member.lastName || ''}`.trim() || "Unknown";

//     return (
//       <Table.Row
//         key={memberId}
//         data-selected={isSelected ? "" : undefined}
//         bg={isSelected ? "gray.50" : "transparent"}
//         borderBottom="1px solid"
//         borderColor="gray.200"
//       >
//         <Table.Cell>
//           <Checkbox.Root
//             size="sm"
//             top="0.5"
//             aria-label="Select row"
//             checked={isSelected}
//             onCheckedChange={(changes) => {
//               setSelection((prev) =>
//                 changes.checked
//                   ? [...prev, memberId]
//                   : selection.filter((id) => id !== memberId),
//               )
//             }}
//           >
//             <Checkbox.HiddenInput />
//             <Checkbox.Control 
//               borderWidth="2px"
//               borderColor="black"
//               _checked={{ bg: "blue.500", borderColor: "blue.500" }}
//             />
//           </Checkbox.Root>
//         </Table.Cell>
//         <Table.Cell fontWeight="medium">{fullName}</Table.Cell>
//         <Table.Cell>{member.role}</Table.Cell>
//         <Table.Cell>{member.email}</Table.Cell>
//         <Table.Cell>{member.cell}</Table.Cell>
//       </Table.Row>
//     );
//   });

//   return (
//     <Card 
//         title="Members" 
//         backAction={() => navigate('/dashboard')}
//     >
//       <Table.Root size="sm" interactive>
//         <Table.Header>
//           <Table.Row>
//             <Table.ColumnHeader w="6">
//               <Checkbox.Root
//                 size="sm"
//                 top="0.5"
//                 aria-label="Select all rows"
//                 checked={indeterminate ? "indeterminate" : (members.length > 0 && selection.length === members.length)}
//                 onCheckedChange={(changes) => {
//                   setSelection(
//                     changes.checked ? members.map((m) => m.id || m.email) : [],
//                   )
//                 }}
//               >
//                 <Checkbox.HiddenInput/>
//                 <Checkbox.Control 
//                   borderWidth="2px"
//                   borderColor="black"
//                   _checked={{ bg: "blue.500", borderColor: "blue.500" }}
//                 />
//               </Checkbox.Root>
//             </Table.ColumnHeader>
//             <Table.ColumnHeader>Name</Table.ColumnHeader>
//             <Table.ColumnHeader>Role</Table.ColumnHeader>
//             <Table.ColumnHeader>Email</Table.ColumnHeader>
//             <Table.ColumnHeader>Cell</Table.ColumnHeader>
//           </Table.Row>
//         </Table.Header>
        
//         <Table.Body>
//             {isLoading ? (
//                 <Table.Row>
//                     <Table.Cell colSpan={5} textAlign="center" py={8} color="gray.500">
//                         Loading members...
//                     </Table.Cell>
//                 </Table.Row>
//             ) : members.length === 0 ? (
//                 <Table.Row>
//                      <Table.Cell colSpan={5} textAlign="center" py={8} color="gray.500">
//                         No members found.
//                     </Table.Cell>
//                 </Table.Row>
//             ) : rows}
//         </Table.Body>
//       </Table.Root>

//       <ActionBar.Root open={hasSelection}>
//         <Portal>
//           <ActionBar.Positioner>
//             <ActionBar.Content>
//               <ActionBar.SelectionTrigger>
//                 {selection.length} selected
//               </ActionBar.SelectionTrigger>
//               <ActionBar.Separator />
//               <Button variant="outline" size="sm">
//                 Delete <Kbd>⌫</Kbd>
//               </Button>
//               <Button variant="outline" size="sm">
//                 Share <Kbd>T</Kbd>
//               </Button>
//             </ActionBar.Content>
//           </ActionBar.Positioner>
//         </Portal>
//       </ActionBar.Root>
//     </Card>
//   )
// }

// export default Members

import React, { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"; 
import { getMembers } from "../../services/api"; 
import Card from '../../components/ui/Card';
import {
  ActionBar,
  Button,
  Checkbox,
  Kbd,
  Portal,
  Table,
} from "@chakra-ui/react"

const Members = () => {
  const navigate = useNavigate();
  
  const [members, setMembers] = useState([]);
  const [selection, setSelection] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchMembersData = async () => {
      setIsLoading(true);
      try {
        const response = await getMembers();
        
        if (response.status === "success" && Array.isArray(response.members)) {
            setMembers(response.members);
        } else {
            console.warn("Unexpected API response format", response);
            setMembers([]); 
        }

      } catch (error) {
        console.error("Failed to load members", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMembersData();
  }, []);

  const hasSelection = selection.length > 0;
  const indeterminate = hasSelection && selection.length < (members.length || 0);

  const rows = members.map((member, index) => {
    // Use ID from sheet, fallback to email/index if ID is missing
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
        {/* Updated Columns: First Name, Last Name, Role, Cell */}
        <Table.Cell fontWeight="medium">{member.firstName}</Table.Cell>
        <Table.Cell fontWeight="medium">{member.lastName}</Table.Cell>
        <Table.Cell>{member.role}</Table.Cell>
        <Table.Cell>{member.cell}</Table.Cell>
      </Table.Row>
    );
  });

  return (
    <Card 
        title="Members" 
        backAction={() => navigate('/dashboard')}
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
            {/* Updated Headers */}
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
                        Loading members...
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
                {selection.length} selected
              </ActionBar.SelectionTrigger>
              <ActionBar.Separator />
              <Button variant="outline" size="sm">
                Delete <Kbd>⌫</Kbd>
              </Button>
              <Button variant="outline" size="sm">
                Share <Kbd>T</Kbd>
              </Button>
            </ActionBar.Content>
          </ActionBar.Positioner>
        </Portal>
      </ActionBar.Root>
    </Card>
  )
}

export default Members