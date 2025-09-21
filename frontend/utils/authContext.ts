import * as React from 'react';

type User = {
  id: string;
  username: string;
  email: string;
  name?: string;
  code?: string;
  location?: string;
  partnerId?: string;
};

type AuthContextType = {
  user: User | null;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
};

export const AuthContext = React.createContext<AuthContextType | undefined>(undefined);

export const useAuthContext = () => React.useContext(AuthContext);