# AI Data Visualization Platform

A full-stack AI-powered data visualization platform that automatically analyzes datasets and generates intelligent, interactive dashboards using AI.

## 🚀 Features

- **AI-Powered Analysis**: Uses Ollama (local AI) to analyze data and suggest the best visualizations
- **Automatic Dashboard Generation**: Generate comprehensive dashboards from any dataset automatically
- **Interactive Charts**: Multiple chart types (bar, line, pie, scatter, histogram)
- **Data Preview**: Preview your data before generating dashboards
- **Drag & Drop Upload**: Easy file upload with drag-and-drop support
- **Dashboard Sharing**: Share dashboards via unique links
- **Data Insights**: Get AI-powered insights and recommendations from your data
- **Customizable Charts**: Edit and customize generated charts
- **Modern UI**: Built with React and Tailwind CSS
- **Responsive Design**: Works on desktop, tablet, and mobile

## 📋 Supported File Formats

- CSV files
- Excel files (.xlsx, .xls)
- File size: Up to 100MB

## 🏗️ Project Structure

```
.
├── frontend/                 # React frontend application
│   ├── public/              # Static files
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── pages/           # Page components
│   │   ├── services/        # API services
│   │   ├── store/           # Zustand state management
│   │   ├── App.jsx          # Main app component
│   │   └── index.js         # Entry point
│   ├── package.json         # Frontend dependencies
│   ├── tailwind.config.js   # Tailwind CSS config
│   └── .env                 # Frontend environment variables
│
├── backend/                 # FastAPI backend application
│   ├── app/
│   │   ├── routers/         # API route handlers
│   │   │   ├── upload.py    # Dataset upload endpoints
│   │   │   ├── dashboard.py # Dashboard management endpoints
│   │   │   └── ai.py        # AI analysis endpoints
│   │   ├── utils/
│   │   │   └── data_processor.py  # Data processing utilities
│   │   ├── config.py        # Configuration management
│   │   ├── models.py        # Database models
│   │   ├── schemas.py       # Pydantic schemas
│   │   └── __init__.py      # FastAPI app initialization
│   ├── main.py              # Entry point
│   ├── requirements.txt     # Python dependencies
│   └── tests/               # Test files
│
├── ai/                      # AI integration module
│   ├── ollama_client.py    # Ollama API client
│   └── __init__.py         # Module initialization
│
├── storage/                 # Uploaded datasets storage
│   └── datasets/            # Processed dataset files
│
├── .env                     # Backend environment variables
├── docker-compose.yml       # Docker services configuration
└── README.md               # This file
```

## 🛠️ Tech Stack

### Frontend
- **React 18**: Modern UI library
- **Tailwind CSS**: Utility-first CSS framework
- **ECharts**: Rich interactive charting library
- **React Router**: Client-side routing
- **Zustand**: Lightweight state management
- **Axios**: HTTP client

### Backend
- **FastAPI**: Modern Python web framework
- **Uvicorn**: ASGI server
- **Pandas**: Data processing and analysis
- **SQLAlchemy**: ORM
- **Pydantic**: Data validation

### AI & Data
- **Ollama**: Local LLM inference
- **Deepseek Coder / Qwen2.5 Coder**: LLM models
- **Pandas & NumPy**: Data analysis

## 📦 Installation

### Prerequisites
- Python 3.9+
- Node.js 16+
- Ollama (for AI features)

### Backend Setup

1. Navigate to backend folder:
```bash
cd backend
```

2. Create virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Create `.env` file from template (already provided)

5. Run the server:
```bash
python main.py
```

The backend will be available at `http://localhost:8000`

### Frontend Setup

1. Navigate to frontend folder:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start development server:
```bash
npm start
```

The frontend will be available at `http://localhost:3000`

### AI Setup (Ollama)

1. **Install Ollama**:
   - Download from [ollama.ai](https://ollama.ai)
   - Follow installation instructions for your OS

2. **Start Ollama**:
```bash
ollama serve
```

3. **Pull the model**:
```bash
ollama pull deepseek-coder
# or
ollama pull qwen2.5-coder
```

4. **Verify Ollama is running**:
   - Access http://localhost:11434/api/tags
   - Should return list of available models

## 🚀 Quick Start

### Full Stack Setup

1. **Start all services**:

```bash
# Terminal 1: Ollama
ollama serve

# Terminal 2: Backend
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python main.py

# Terminal 3: Frontend
cd frontend
npm install
npm start
```

2. **Open the application**:
   - Navigate to `http://localhost:3000`

3. **Upload and analyze data**:
   - Upload a CSV or Excel file
   - Preview the data
   - Click "Generate Dashboard"
   - AI will analyze and create visualizations

## 📊 Data Flow

```
User uploads file
    ↓
Backend processes file (pandas)
    ↓
Extract schema & sample rows
    ↓
Send to Ollama AI for analysis
    ↓
AI suggests charts & insights
    ↓
Create dashboard with generated charts
    ↓
User can edit & customize charts
    ↓
Save & share dashboard
```

## 🔌 API Endpoints

### Datasets
- `POST /api/datasets/upload` - Upload a file
- `GET /api/datasets/preview/{file_id}` - Preview data
- `POST /api/datasets/analyze/{file_id}` - Analyze dataset

### Dashboards
- `POST /api/dashboards/create` - Create dashboard
- `GET /api/dashboards/{dashboard_id}` - Get dashboard
- `PUT /api/dashboards/{dashboard_id}` - Update dashboard
- `DELETE /api/dashboards/{dashboard_id}` - Delete dashboard
- `POST /api/dashboards/{dashboard_id}/charts` - Add chart
- `PUT /api/dashboards/{dashboard_id}/charts/{chart_id}` - Update chart
- `DELETE /api/dashboards/{dashboard_id}/charts/{chart_id}` - Remove chart

### AI Analysis
- `POST /api/ai/analyze` - Analyze dataset with AI
- `POST /api/ai/insights` - Get specific insights
- `GET /api/ai/health` - Check AI service health

## ⚙️ Configuration

### Backend Environment Variables

Edit `.env` file:

```env
DEBUG=True                              # Debug mode
SERVER_HOST=0.0.0.0                   # Server host
SERVER_PORT=8000                       # Server port
OLLAMA_BASE_URL=http://localhost:11434 # Ollama endpoint
OLLAMA_MODEL=deepseek-coder            # Model to use
UPLOAD_DIR=storage/datasets            # Upload directory
MAX_FILE_SIZE=104857600                # Max file size (100MB)
DATABASE_URL=sqlite:///./dashboards.db # Database URL
SECRET_KEY=your-secret-key-here        # Secret key
```

### Frontend Environment Variables

Edit `frontend/.env`:

```env
REACT_APP_API_URL=http://localhost:8000/api  # Backend URL
REACT_APP_DEBUG=true                         # Debug mode
```

## 📝 Example Usage

### 1. Upload CSV File

```python
# Python example
import requests

file = open('sales_data.csv', 'rb')
response = requests.post(
    'http://localhost:8000/api/datasets/upload',
    files={'file': file}
)
print(response.json())
```

### 2. Generate Dashboard

```javascript
// JavaScript example
const response = await fetch('http://localhost:8000/api/ai/analyze', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    dataset_schema: {
      row_count: 1000,
      column_count: 5,
      columns: [
        { name: 'Date', dtype: 'object' },
        { name: 'Sales', dtype: 'int64' }
      ]
    },
    user_request: 'Generate a comprehensive dashboard',
    max_charts: 5
  })
});
const result = await response.json();
console.log(result);
```

## 🔒 Security

- **No raw data sent to AI**: Only schema and sample rows are sent
- **Environment variables**: Sensitive data stored in `.env`
- **File validation**: Only CSV and Excel files allowed
- **File size limits**: 100MB maximum file size
- **CORS configured**: Restricted to specified origins

## 📈 Scaling & Production

### Production Deployment

1. **Use production database**:
   - Deploy PostgreSQL
   - Update `DATABASE_URL` in `.env`

2. **Use production server**:
   - Deploy with Gunicorn + Nginx
   - Example: `gunicorn -w 4 -b 0.0.0.0:8000 app:app`

3. **Scale Ollama**:
   - Deploy Ollama on separate GPU server
   - Update `OLLAMA_BASE_URL`

4. **Use production frontend build**:
   - Run `npm run build`
   - Serve from CDN or static host

### Docker Deployment

See `docker-compose.yml` for containerized deployment.

## 🤖 AI Models

### Supported Models
- **deepseek-coder**: Excellent for code and technical analysis
- **qwen2.5-coder**: Fast and accurate for data analysis
- **mistral**: General purpose, good balance
- **neural-chat**: Optimized for conversations

Pull different models:
```bash
ollama pull qwen2.5-coder
ollama pull mistral
```

Change model in `.env`:
```env
OLLAMA_MODEL=qwen2.5-coder
```

## 🐛 Troubleshooting

### Connection Issues
```bash
# Check Ollama is running
curl http://localhost:11434/api/tags

# Check backend
curl http://localhost:8000/health

# Check frontend (from browser console)
fetch('http://localhost:8000/api/ai/health')
```

### File Upload Issues
- Check file format (CSV or Excel)
- Check file size (max 100MB)
- Check `UPLOAD_DIR` exists and is writable
- Check disk space

### AI Analysis Issues
- Ensure Ollama is running: `ollama serve`
- Ensure model is pulled: `ollama pull deepseek-coder`
- Check logs in backend console
- Verify `OLLAMA_BASE_URL` is correct

### Frontend Not Loading
- Clear browser cache
- Check `REACT_APP_API_URL` in `.env`
- Check CORS settings in backend
- Verify backend is running

## 📚 Documentation

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [React Documentation](https://react.dev/)
- [Ollama Documentation](https://ollama.ai/)
- [ECharts Documentation](https://echarts.apache.org/)
- [Tailwind CSS Documentation](https://tailwindcss.com/)

## 🤝 Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

This project is open source and available under the MIT License.

## 🎯 Roadmap

- [ ] Database integration (PostgreSQL)
- [ ] User authentication & authorization
- [ ] Dashboard templates
- [ ] Advanced data transformations
- [ ] Real-time collaboration
- [ ] Export dashboards (PDF, PNG)
- [ ] Mobile app
- [ ] More chart types
- [ ] Data caching & optimization
- [ ] Advanced scheduling

## 👨‍💻 Support

For issues, questions, or suggestions:
- Open an issue on GitHub
- Check existing issues and discussions
- Review documentation

## 🙏 Acknowledgments

- FastAPI for the amazing web framework
- React for the UI library
- Ollama for local AI inference
- ECharts for visualization
- Tailwind CSS for styling

---

**Happy analyzing! 📊✨**
