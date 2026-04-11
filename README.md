# 🏥 HealTrack - Gestione Farmaci Personale

HealTrack è un'applicazione web moderna e intuitiva progettata per aiutarti a gestire la tua terapia farmacologica quotidiana. Grazie all'integrazione con **Google Sheets** e **Google Login**, i tuoi dati sono sempre al sicuro, sincronizzati e accessibili ovunque.

## 🌟 Funzionalità Principali

- **📅 Programma Giornaliero:** Visualizza i farmaci da assumere oggi con orari precisi.
- **🔐 Google Login:** Accesso sicuro con il tuo account Google per una gestione personalizzata.
- **📊 Database su Google Sheets:** Tutti i tuoi dati (farmaci e assunzioni) sono salvati in tempo reale su un tuo Foglio Google privato.
- **💊 Gestione Scorte:** Monitoraggio automatico delle pillole rimaste con avvisi di rifornimento.
- **⏰ Frequenze Avanzate:** Gestione di farmaci giornalieri, a giorni alterni, mensili o **giorni specifici della settimana** (es. dosaggi diversi per Eutirox Lun-Ven e Sab-Dom).
- **🔔 Notifiche Push (PWA):** Promemoria automatici all'orario stabilito, funzionanti anche in background tramite Service Worker.
- **📱 Mobile First & PWA:** Interfaccia ottimizzata per smartphone e installabile come app nativa.

## 🛠️ Architettura Tecnica

- **Frontend:** React + Vite + Tailwind CSS + Lucide Icons.
- **Autenticazione:** Google Identity Services (OAuth2).
- **Backend/Database:** Google Apps Script (funge da API per Google Sheets).
- **Hosting:** GitHub Pages con deploy automatico tramite GitHub Actions.

## 🚀 Guida alla Configurazione

### 1. Preparazione del Google Sheet
1. Crea un nuovo **Foglio Google**.
2. Assicurati che il foglio `medicinals` abbia le seguenti colonne (dalla A alla J):
   `id`, `nome`, `dosaggio`, `forma`, `stock_attuale`, `soglia`, `orario_1`, `orario_2`, `frequenza`, **`giorni_settimana`**.
3. Vai su **Estensioni** > **Apps Script** e incolla l'ultima versione del codice del backend (V8 runtime consigliato).
4. Clicca su **Distribuisci** > **Nuova distribuzione** > **Applicazione Web**.
5. Imposta "Chi ha accesso" su **Chiunque** e copia l'URL generato (`/exec`).

### 2. Collegamento all'App
1. Inserisci l'URL ottenuto nel file `src/lib/googleSheets.ts` alla costante `SCRIPT_URL`.
2. Configura il tuo **Client ID Google** nella console di Google Cloud e inseriscilo in `src/components/GoogleLogin.tsx`.

## 📦 Installazione Locale

```bash
# Installa le dipendenze
npm install

# Avvia l'app in modalità sviluppo
npm run dev
```

## 📖 Utilizzo

1. **Aggiunta Farmaci:** Puoi aggiungere i tuoi medicinali direttamente dall'app cliccando sul tasto **"+"** o scrivendo direttamente nel foglio `Medicinals` del tuo Google Sheet.
2. **Registrazione:** Ogni volta che segni un farmaco come "Preso", l'app registra l'evento nel foglio `Logs` con timestamp ed email dell'utente.
3. **Controllo Scorte:** L'app scala automaticamente le scorte (se configurato) e ti avvisa quando è ora di ricomprare il farmaco.

---
Progetto creato con ❤️ per la gestione della salute semplificata.
