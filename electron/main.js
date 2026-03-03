const { app, BrowserWindow } = require('electron');
const { spawn } = require('child_process');
const path = require('path');
const http = require('http');

// Load .env from repo root
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const isDev = process.env.NODE_ENV === 'development';
const BACKEND_PORT = 8000;
const BACKEND_URL = `http://127.0.0.1:${BACKEND_PORT}`;

let backendProcess = null;
let mainWindow = null;

function startBackend() {
  const backendDir = isDev
    ? path.join(__dirname, '..', 'backend')
    : path.join(process.resourcesPath, 'backend');

  const env = { ...process.env };
  if (process.env.DATABASE_URL) {
    env.DATABASE_URL = process.env.DATABASE_URL;
  }
  if (!env.CORS_ORIGINS) {
    env.CORS_ORIGINS = 'http://localhost:5173,http://localhost:3000,app://-';
  }

  backendProcess = spawn(
    'python3',
    ['-m', 'uvicorn', 'main:app', '--host', '127.0.0.1', '--port', String(BACKEND_PORT)],
    { cwd: backendDir, env, stdio: ['ignore', 'pipe', 'pipe'] }
  );

  backendProcess.stdout.on('data', (data) => {
    console.log(`[backend] ${data.toString().trim()}`);
  });

  backendProcess.stderr.on('data', (data) => {
    console.error(`[backend] ${data.toString().trim()}`);
  });

  backendProcess.on('error', (err) => {
    console.error('Failed to start backend:', err.message);
  });
}

function pollHealth(retries = 30, interval = 500) {
  return new Promise((resolve, reject) => {
    let attempts = 0;
    const check = () => {
      attempts++;
      const req = http.get(`${BACKEND_URL}/api/health`, (res) => {
        if (res.statusCode === 200) {
          resolve();
        } else if (attempts < retries) {
          setTimeout(check, interval);
        } else {
          reject(new Error('Backend health check failed'));
        }
      });
      req.on('error', () => {
        if (attempts < retries) {
          setTimeout(check, interval);
        } else {
          reject(new Error('Backend did not start in time'));
        }
      });
      req.end();
    };
    check();
  });
}

function killBackend() {
  if (backendProcess && !backendProcess.killed) {
    backendProcess.kill('SIGTERM');
    backendProcess = null;
  }
}

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    title: 'CourtClip',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // Show loading message while backend starts
  mainWindow.loadURL(`data:text/html,
    <html>
      <body style="display:flex;align-items:center;justify-content:center;height:100vh;margin:0;font-family:system-ui;background:#1a1a2e;color:#e0e0e0">
        <div style="text-align:center">
          <h1>CourtClip</h1>
          <p>Starting backend server...</p>
        </div>
      </body>
    </html>`);

  // Check if backend is already running (e.g. manual `uvicorn` in another terminal)
  const alreadyRunning = await pollHealth(1, 0).then(() => true).catch(() => false);

  if (alreadyRunning) {
    console.log('[electron] Backend already running on port ' + BACKEND_PORT + ', skipping spawn');
  } else {
    startBackend();
    try {
      await pollHealth();
    } catch (err) {
      console.error(err.message);
    }
  }

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
  } else {
    const indexPath = path.join(process.resourcesPath, 'frontend', 'dist', 'index.html');
    mainWindow.loadFile(indexPath);
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.on('ready', createWindow);

app.on('window-all-closed', () => {
  killBackend();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  killBackend();
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});
