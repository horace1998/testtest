import React, { createContext, useContext, useState, useCallback } from 'react';

const NavActionContext = createContext(null);

export function NavActionProvider({ children }) {
  // The current page registers a handler; BottomNav calls it.
  const [handler, setHandler] = useState(() => () => {});

  const registerHandler = useCallback((fn) => {
    setHandler(() => fn || (() => {}));
  }, []);

  const select = useCallback((id) => handler(id), [handler]);

  return (
    <NavActionContext.Provider value={{ registerHandler, select }}>
      {children}
    </NavActionContext.Provider>
  );
}

export function useNavAction() {
  const ctx = useContext(NavActionContext);
  if (!ctx) throw new Error('useNavAction must be used within NavActionProvider');
  return ctx;
}