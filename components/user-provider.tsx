"use client"
import React, {createContext, useEffect, useState, useContext} from "react";

type UserContextType = {
  userId: string | null
}

const UserContext = createContext<UserContextType>({ userId: null });

export function UserProvider({children}: { children: React.ReactNode }) {
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const localId: string | null = localStorage.getItem("userId");
    
    const fetchUserId = async () => {
      const response = await fetch(`/api/users/`);
      const data = await response.json();
      return data.userId
    }

    if (localId) {
      setUserId(localId);
    } else {
      fetchUserId().then(user => {
        setUserId(user);
        localStorage.setItem("userId", user.id);
      });
    }
  }, [userId]);
  
  return <UserContext.Provider value={{ userId }}>
    {children}
  </UserContext.Provider>
}

export function useUser() {
  return useContext(UserContext);
}