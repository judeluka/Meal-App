import { createContext, useState, useEffect } from 'react';

export const CentreContext = createContext();

export function CentreProvider({ children }) {
  // List of available centres
  const centres = ['DCU', 'UCD', 'ATU'];

  // Load initial centre from localStorage or default to first
  const [centre, setCentre] = useState(() => {
    return localStorage.getItem('selectedCentre') || centres[0];
  });

  useEffect(() => {
    localStorage.setItem('selectedCentre', centre);
  }, [centre]);

  return (
    <CentreContext.Provider value={{ centre, setCentre, centres }}>
      {children}
    </CentreContext.Provider>
  );
} 