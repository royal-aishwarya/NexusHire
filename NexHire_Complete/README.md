# NexusHire — Complete Fixed Project

This ZIP contains the existing React + Flask + MongoDB NexusHire application,
updated with the supplied female interviewer portrait and a camera-preview
reattachment fix for the interview screen.

## Requirements

- Python 3.10 or 3.11 (recommended)
- Node.js 18 or 20 LTS and npm
- MongoDB Community Server running locally
- Chrome or Edge recommended for speech recognition
- Camera and microphone permissions

The browser avatar is the supplied portrait image. It is a visual interviewer
representation; it is not a live 3D talking-head model. Browser text-to-speech
continues to speak the interview questions. The camera preview stays in the
browser and is not uploaded or recorded by this project.

## Windows — PowerShell

Extract the ZIP. Open PowerShell in the extracted `NexHire_Complete` folder.

### Terminal 1 — Backend

```powershell
cd .\backend
Copy-Item .env.example .env -ErrorAction SilentlyContinue
py -3.11 -m venv venv
.\venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements.txt
python app.py
```

If PowerShell blocks activation, run this once in that terminal and activate again:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\venv\Scripts\Activate.ps1
```

Keep this terminal open. Backend health check:
`http://127.0.0.1:5000/api/health`

### Terminal 2 — Frontend

Open a second PowerShell window in `NexHire_Complete`:

```powershell
cd .\frontend
Remove-Item Env:HOST -ErrorAction SilentlyContinue
Remove-Item Env:WDS_SOCKET_HOST -ErrorAction SilentlyContinue
npm install
npm start
```

Open `http://localhost:3000`.

## macOS — Terminal

Extract the ZIP, then open Terminal in the extracted `NexHire_Complete` folder.

### Terminal 1 — Backend

```bash
cd backend
cp .env.example .env
python3 -m venv venv
source venv/bin/activate
python -m pip install --upgrade pip
pip install -r requirements.txt
python app.py
```

Keep this terminal open. Backend health check:
`http://127.0.0.1:5000/api/health`

### Terminal 2 — Frontend

Open a second Terminal window in `NexHire_Complete`:

```bash
cd frontend
unset HOST
unset WDS_SOCKET_HOST
npm install
npm start
```

Open `http://localhost:3000`.

## MongoDB

The default connection is:

```text
mongodb://127.0.0.1:27017/ai_interview_platform
```

Make sure the local MongoDB service is running before starting Flask.
Edit `backend/.env` if your MongoDB URI is different. Replace the development
secret values with long random values before using the app beyond local testing.

## Checks

Backend syntax:

```bash
python -m compileall backend
```

Frontend production build:

```bash
cd frontend
npm run build
```

Backend tests (after dependencies are installed):

```bash
cd backend
pytest -q
```

## Interview camera troubleshooting

- Use `http://localhost:3000` rather than opening the page as a local file.
- Allow camera and microphone access in browser site settings.
- Close other apps using the camera.
- If the preview remains black, test the webcam in the operating system and
  reload the interview page after granting permission.
- Speech recognition availability depends on browser support; typed answers
  remain available as a fallback.

## Project structure

```text
NexHire_Complete/
  frontend/
    public/assets/nexushire-interviewer.jpg
    src/pages/InterviewPage.js
    src/index.css
  backend/
    app.py
    routes/
    utils/
    requirements.txt
  README.md
```


## Frontend `allowedHosts` startup fix

This release includes `frontend/scripts/fix-cra-devserver.js`. The `prestart`
npm script runs it automatically before `react-scripts start` and safely
changes the Create React App development-server fallback when its computed
host is empty. You do not need to edit files under `node_modules` manually.
If dependencies are reinstalled, `npm start` applies the workaround again.
