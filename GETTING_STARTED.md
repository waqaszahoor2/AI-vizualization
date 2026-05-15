# Getting Started Guide

This guide will help you set up and run the AI Data Visualization Platform from scratch.

## Prerequisites

- **Python 3.9 or higher** - [Download here](https://www.python.org/downloads/)
- **Node.js 16 or higher** - [Download here](https://nodejs.org/)
- **Ollama** - [Download here](https://ollama.ai/) for AI features
- **Git** (optional) - for version control

## Step-by-Step Setup

### Step 1: Install Ollama

1. Download Ollama from [ollama.ai](https://ollama.ai)
2. Follow the installation instructions for your operating system
3. Start Ollama:
   ```bash
   ollama serve
   ```
4. In a new terminal, pull the AI model:
   ```bash
   ollama pull deepseek-coder
   ```
   Alternatively:
   ```bash
   ollama pull qwen2.5-coder
   ```

Leave Ollama running in this terminal.

### Step 2: Set Up Backend

#### On Windows (PowerShell):
```powershell
# Navigate to backend
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
.\venv\Scripts\Activate.ps1

# Install dependencies
pip install -r requirements.txt

# Run the server
python main.py
```

#### On macOS/Linux:
```bash
# Navigate to backend
cd backend

# Create virtual environment
python3 -m venv venv

# Activate virtual environment
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run the server
python main.py
```

You should see:
```
INFO:     Uvicorn running on http://0.0.0.0:8000
```

Leave this running in this terminal.

### Step 3: Set Up Frontend

In a new terminal:

#### On Windows (PowerShell):
```powershell
# Navigate to frontend
cd frontend

# Install dependencies (this may take a few minutes)
npm install

# Start development server
npm start
```

#### On macOS/Linux:
```bash
# Navigate to frontend
cd frontend

# Install dependencies (this may take a few minutes)
npm install

# Start development server
npm start
```

The frontend will start and automatically open in your browser at `http://localhost:3000`

## Running the Application

You should now have three terminals running:

1. **Terminal 1 - Ollama** (AI Service)
   ```
   ollama serve
   ```

2. **Terminal 2 - Backend** (API Server)
   ```
   python main.py
   ```

3. **Terminal 3 - Frontend** (React App)
   ```
   npm start
   ```

## ✅ Verification Checklist

- [ ] Ollama is running at `http://localhost:11434`
- [ ] Backend is running at `http://localhost:8000`
- [ ] Frontend is running at `http://localhost:3000`
- [ ] Browser opened to `http://localhost:3000`

Test each service:

```bash
# Test Ollama (in any terminal)
curl http://localhost:11434/api/tags

# Test Backend API
curl http://localhost:8000/health

# Check in browser console (F12)
fetch('http://localhost:8000/health')
```

## First Use

1. Open `http://localhost:3000` in your browser
2. **Upload a file**:
   - Use `EXAMPLE_DATA.csv` from the project root
   - Or create your own CSV file
3. **Generate Dashboard**:
   - Click "✨ Generate Dashboard"
   - Wait for AI analysis (usually 10-30 seconds)
   - View the generated dashboard with charts

## Troubleshooting

### "Cannot connect to Ollama"
- Make sure Ollama is running: `ollama serve`
- Check `OLLAMA_BASE_URL` in `.env` (should be `http://localhost:11434`)
- Verify model is installed: `ollama list`

### "Module not found" errors in backend
- Make sure virtual environment is activated
- Run `pip install -r requirements.txt` again
- Check Python version: `python --version` (should be 3.9+)

### "npm install" is slow
- This is normal, it can take 5-10 minutes
- Make sure you have internet connection
- Don't interrupt the process

### Frontend not connecting to backend
- Check backend is running at `http://localhost:8000`
- In browser, open DevTools (F12) → Console
- Check for CORS errors
- Verify `REACT_APP_API_URL` in `frontend/.env`

### Port already in use
- Backend port 8000:
  ```bash
  # Change in backend/.env
  SERVER_PORT=8001
  ```
- Frontend port 3000:
  ```bash
  # Change in terminal
  PORT=3001 npm start
  ```

### File upload fails
- Check file is CSV or Excel format
- Check file size is less than 100MB
- Make sure `storage/datasets` directory exists
- Check disk space

## Next Steps

1. **Explore the UI**:
   - Try uploading different datasets
   - Experiment with different file formats
   - Try editing generated charts

2. **Customize Configuration**:
   - Edit `.env` files to change settings
   - Change Ollama model in `.env`
   - Adjust server ports if needed

3. **Explore the Code**:
   - Backend: `/backend/app/main.py`
   - Frontend: `/frontend/src/App.jsx`
   - API: `/backend/app/routers/`

4. **Production Deployment**:
   - See README.md for production setup
   - Configure PostgreSQL database
   - Deploy with proper SSL/TLS
   - Use production Ollama server

## Common Commands

### Backend
```bash
# Activate environment
source venv/bin/activate  # macOS/Linux
.\venv\Scripts\Activate.ps1  # Windows

# Run tests
pytest

# Format code
black app/

# Lint code
pylint app/
```

### Frontend
```bash
# Start dev server
npm start

# Build for production
npm run build

# Run tests
npm test

# Format code
npm run format
```

## File Structure Quick Reference

```
project/
├── backend/              # FastAPI application (port 8000)
│   ├── app/             # Application code
│   ├── main.py          # Entry point
│   ├── requirements.txt  # Dependencies
│   └── .env             # Configuration
├── frontend/            # React application (port 3000)
│   ├── src/            # React components
│   ├── package.json    # Dependencies
│   └── .env            # Configuration
├── ai/                 # AI integration module
├── storage/            # Uploaded files storage
└── README.md           # Full documentation
```

## Tips & Tricks

### Performance Tips
- Upload files < 50MB for faster processing
- Use simpler CSV format (fewer columns) for quicker AI analysis
- Keep Ollama model on same machine as backend for speed

### Data Tips
- Ensure your CSV has headers
- Use consistent data types in columns
- Clean data before uploading for better analysis

### AI Tips
- Experiment with different Ollama models
- Longer dataset descriptions help AI generate better charts
- Sample data is sent to AI, not full dataset (for privacy)

## Getting Help

1. **Check Console Logs**:
   - Browser: F12 → Console
   - Backend: Check terminal output
   - Frontend: Check terminal output

2. **Enable Debug Mode**:
   - Edit `.env` files
   - Set `DEBUG=True` in backend
   - Check console messages

3. **Common Issues**:
   - See "Troubleshooting" section above
   - Check README.md for more details

4. **API Documentation**:
   - Visit `http://localhost:8000/docs`
   - Interactive API explorer with Swagger UI

## Next Learning Resources

- [FastAPI Tutorial](https://fastapi.tiangolo.com/tutorial/)
- [React Documentation](https://react.dev/)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [ECharts API](https://echarts.apache.org/en/api.html)
- [Ollama Guide](https://github.com/ollama/ollama)

---

**Ready to visualize your data with AI! 🚀📊**

If you have questions, check the README.md or review the code comments.
