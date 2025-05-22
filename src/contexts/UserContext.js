import React, { createContext, useContext, useState } from "react";

const UserContext = createContext();

export const USER_TYPES = {
  PARENT: "parent",
  CHILD: "child",
  INDIVIDUAL: "individual",
};

export const UserProvider = ({ children }) => {
  const [userType, setUserType] = useState(USER_TYPES.INDIVIDUAL);

  const updateUserType = (type) => {
    if (Object.values(USER_TYPES).includes(type)) {
      setUserType(type);
    }
  };

  return (
    <UserContext.Provider value={{ userType, updateUserType }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
};
