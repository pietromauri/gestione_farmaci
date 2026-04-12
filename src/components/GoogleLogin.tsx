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
    const handleCredentialResponse = (response: google.accounts.id.CredentialResponse) => {
      try {
        // Decodifica sicura del token JWT (gestisce accenti e caratteri speciali)
        const base64Url = response.credential.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        
        const payload = JSON.parse(jsonPayload);
        
        const profile = {
          name: payload.name,
          email: payload.email,
          picture: payload.picture,
        };
        
        setUser(profile);
        localStorage.setItem('user_profile', JSON.stringify(profile));
        window.location.reload();
      } catch (error) {
        console.error("Errore durante la decodifica del login Google:", error);
        alert("Si è verificato un errore durante l'accesso. Controlla la console del browser (F12).");
      }
    };

    const initializeGoogle = () => {
      if (typeof google !== 'undefined' && !user) {
        google.accounts.id.initialize({
          client_id: CLIENT_ID,
          callback: handleCredentialResponse,
          auto_select: false,
          cancel_on_tap_outside: true
        });
        google.accounts.id.renderButton(
          document.getElementById("googleBtn") as HTMLElement,
          { type: "standard", theme: "outline", size: "large", width: 250, text: "continue_with" }
        );
      }
    };

    // Tenta l'inizializzazione subito e riprova dopo un breve ritardo se lo script non è pronto
    initializeGoogle();
    const timer = setTimeout(initializeGoogle, 1000);
    return () => clearTimeout(timer);
  }, [user]);

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user_profile');
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
