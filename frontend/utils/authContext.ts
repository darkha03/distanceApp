import * as React from 'react';

type User = {
  id: string;
  username: string;
  email: string;
  name?: string;
  code?: string;
  location?: string;
  partnerId?: string;
  latitude?: number | null;
  longitude?: number | null;
  timezone?: string;
  status?: string;
  avatarUrl?: string;
  activityImageUrl?: string;
  birthday?: Date;
  anniversary?: Date;
  partner?: { name: string;
    status: string; 
    location: string; 
    latitude: number; 
    longitude: number; 
    timezone: string;
    avatarUrl: string;
    activityImageUrl: string;
    birthday?: Date;
    anniversary?: Date;
   } | null;
};

type AuthContextType = {
  user: User | null;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
};

export const AuthContext = React.createContext<AuthContextType | undefined>(undefined);

export const useAuthContext = () => React.useContext(AuthContext);