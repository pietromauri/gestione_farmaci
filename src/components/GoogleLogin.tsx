import React, { useEffect, useState } from 'react';

const CLIENT_ID = '777697781094-gtnlj70sv8vdbi1rhj63md01evocivkl.apps.googleusercontent.com';

export interface UserProfile {
  name: string;
  email: string;
  picture: string;
}

export const GoogleLogin: React.FC = () => {
  const [user, setUser] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem('user_profile');
    return saved ? JSON.parse(saved) : null;
  });

  useEffect(() => {
    /* global google */
    const handleCredentialResponse = (response: any) => {
      const payload = JSON.parse(atob(response.credential.split('.')[1]));
      const profile = {
        name: payload.name,
        email: payload.email,
        picture: payload.picture,
      };
      
      setUser(profile);
      localStorage.setItem('user_profile', JSON.stringify(profile));
      localStorage.setItem('google_token', response.credential);
      window.location.reload(); // Per aggiornare lo stato dell'app
    };

    if (typeof google !== 'undefined' && !user) {
      google.accounts.id.initialize({
        client_id: CLIENT_ID,
        callback: handleCredentialResponse,
      });
      google.accounts.id.renderButton(
        document.getElementById("googleBtn") as HTMLElement,
        { theme: "outline", size: "large", width: "100%" }
      );
    }
  }, [user]);

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user_profile');
    localStorage.removeItem('google_token');
    window.location.reload();
  };

  if (user) {
    return (
      <div className="flex flex-col items-center space-y-4 p-4 bg-blue-50 rounded-2xl border border-blue-100">
        <img src={user.picture} alt={user.name} className="h-16 w-16 rounded-full border-2 border-white shadow-sm" />
        <div className="text-center">
          <p className="font-bold text-slate-900">{user.name}</p>
          <p className="text-xs text-slate-500">{user.email}</p>
        </div>
        <button 
          onClick={logout}
          className="text-xs font-bold text-red-600 uppercase tracking-wider hover:underline"
        >
          Disconnetti
        </button>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div id="googleBtn"></div>
    </div>
  );
};
