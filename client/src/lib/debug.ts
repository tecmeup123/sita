// This is a debug utility to inspect the CCC library structure
import { ccc } from "./cccWrapper";

export function debugCCCLibrary() {
  console.log("Debugging CCC Library Structure");
  
  // Log the top-level properties of the CCC object
  console.log("CCC top-level keys:", Object.keys(ccc));
  
  // Check if udt exists
  if ('udt' in ccc) {
    console.log("UDT module exists in CCC");
    console.log("UDT properties:", Object.keys(ccc.udt));
    
    // Check for Udt class
    if ('Udt' in ccc.udt) {
      console.log("Udt class exists in ccc.udt");
    } else {
      console.log("Udt class NOT FOUND in ccc.udt");
      
      // List what's available instead
      console.log("Available in ccc.udt:", Object.keys(ccc.udt).join(", "));
    }
  } else {
    console.log("UDT module NOT FOUND in CCC");
    
    // Try to find anything UDT related
    const allProps = Object.keys(ccc);
    const udtRelated = allProps.filter(prop => 
      prop.toLowerCase().includes('udt') || 
      prop.toLowerCase().includes('token')
    );
    
    if (udtRelated.length > 0) {
      console.log("UDT/Token related properties:", udtRelated);
    }
  }
  
  // Check for Address functionality
  if ('Address' in ccc) {
    console.log("Address class exists in CCC");
    console.log("Address methods:", 
      Object.getOwnPropertyNames(ccc.Address).filter(n => {
        try {
          return typeof (ccc.Address as any)[n] === 'function';
        } catch (e) {
          return false;
        }
      })
    );
    
    // Try to access fromString safely
    try {
      if (typeof (ccc.Address as any).fromString === 'function') {
        console.log("Address.fromString method exists");
      } else {
        console.log("Address.fromString method NOT FOUND or not a function");
      }
    } catch (e) {
      console.log("Error checking Address.fromString:", e);
    }
  } else {
    console.log("Address class NOT FOUND in CCC");
  }
}