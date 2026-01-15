import React, { useState } from "react";
import { NativeSelect, Editable  } from "@chakra-ui/react"


const EventDropdown = () => {

  return (
    <NativeSelect.Root size="sm" width="240px">
      <NativeSelect.Field
        placeholder="Select option"
        px="3"   // horizontal padding
        py="2"   // vertical padding
      >
        <option value="react">React</option>
        <option value="vue">Vue</option>
        <option value="angular">Angular</option>
        <option value="svelte">Svelte</option>
      </NativeSelect.Field>
      <NativeSelect.Indicator />
    </NativeSelect.Root>
  )
}

export default EventDropdown;


