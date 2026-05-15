# AI Data Visualization Platform - Architecture Overview

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                          User Browser                            │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  React Frontend (Port 3000)                              │   │
│  │  - File Upload                                           │   │
│  │  - Data Preview                                          │   │
│  │  - Dashboard Visualization                               │   │
│  │  - Chart Editing                                         │   │
│  │  - Dashboard Sharing                                     │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                            ↕ HTTP/REST API
┌─────────────────────────────────────────────────────────────────┐
│                    Backend Services                              │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  FastAPI Backend (Port 8000)                             │   │
│  │  ┌────────────────────────────────────────────────────┐  │   │
│  │  │  Routers:                                          │  │   │
│  │  │  - /api/datasets (upload, preview, analyze)       │  │   │
│  │  │  - /api/dashboards (CRUD operations)              │  │   │
│  │  │  - /api/ai (AI analysis, insights)                │  │   │
│  │  └────────────────────────────────────────────────────┘  │   │
│  │  ┌────────────────────────────────────────────────────┐  │   │
│  │  │  Utils:                                            │  │   │
│  │  │  - data_processor (pandas, numpy)                 │  │   │
│  │  │  - Schema detection                               │  │   │
│  │  │  - Data cleaning                                  │  │   │
│  │  └────────────────────────────────────────────────────┘  │   │
│  └──────────────────────────────────────────────────────────┘   │
│                            ↕                                      │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Storage & Database                                      │   │
│  │  - /storage/datasets (uploaded files)                   │   │
│  │  - SQLite/PostgreSQL (dashboards)                       │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                            ↕ HTTP
┌─────────────────────────────────────────────────────────────────┐
│                     AI Service (Ollama)                          │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Ollama (Port 11434)                                     │   │
│  │  - deepseek-coder OR qwen2.5-coder model               │   │
│  │  - Local LLM inference                                  │   │
│  │  - Chart suggestion prompts                             │   │
│  │  - Data insights generation                             │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

## Key Components

### Frontend (React)
- **Framework**: React 18
- **Styling**: Tailwind CSS
- **Charts**: ECharts
- **State**: Zustand
- **HTTP Client**: Axios
- **Routing**: React Router

### Backend (FastAPI)
- **Framework**: FastAPI
- **ASGI Server**: Uvicorn
- **Data Processing**: Pandas, NumPy
- **Database ORM**: SQLAlchemy
- **Validation**: Pydantic

### AI Integration
- **Platform**: Ollama (local LLM)
- **Models**: deepseek-coder / qwen2.5-coder
- **Integration**: Custom OllamaClient wrapper

### Storage
- **Uploaded Files**: /storage/datasets
- **Database**: SQLite (dev) / PostgreSQL (prod)
- **Format Support**: CSV, XLS, XLSX

## Data Flow

```
1. User uploads file
   ↓
2. Backend receives file
   ↓
3. Data validation (format, size)
   ↓
4. File saved to storage
   ↓
5. Pandas loads and analyzes data
   ↓
6. Schema extraction (columns, types, stats)
   ↓
7. Sample rows extraction (first 5 rows)
   ↓
8. Frontend shows preview
   ↓
9. User requests dashboard generation
   ↓
10. Backend sends schema + sample to Ollama
   ↓
11. Ollama AI generates chart suggestions
   ↓
12. Backend converts to chart configs
   ↓
13. Dashboard created with charts
   ↓
14. Frontend renders interactive dashboard
   ↓
15. User can edit and customize charts
   ↓
16. Dashboard saved to database
   ↓
17. User can share via unique link
```

## API Endpoints Summary

### Datasets
```
POST   /api/datasets/upload              - Upload file
GET    /api/datasets/preview/{file_id}   - Preview data
POST   /api/datasets/analyze/{file_id}   - Analyze data
```

### Dashboards
```
POST   /api/dashboards/create            - Create dashboard
GET    /api/dashboards/{dashboard_id}    - Get dashboard
PUT    /api/dashboards/{dashboard_id}    - Update dashboard
DELETE /api/dashboards/{dashboard_id}    - Delete dashboard
POST   /api/dashboards/{id}/charts       - Add chart
PUT    /api/dashboards/{id}/charts/{cid} - Update chart
DELETE /api/dashboards/{id}/charts/{cid} - Remove chart
GET    /api/dashboards/share/{token}     - Get shared dashboard
```

### AI Services
```
POST /api/ai/analyze              - Analyze with AI
POST /api/ai/insights             - Get insights
GET  /api/ai/health               - Check AI health
```

## Environment Variables

### Backend (.env)
```env
DEBUG=True                              # Debug mode
SERVER_HOST=0.0.0.0                   # Server host
SERVER_PORT=8000                       # Server port
OLLAMA_BASE_URL=http://localhost:11434 # Ollama endpoint
OLLAMA_MODEL=deepseek-coder            # AI model
UPLOAD_DIR=storage/datasets            # Upload directory
MAX_FILE_SIZE=104857600                # Max file size
DATABASE_URL=sqlite:///./dashboards.db # Database
SECRET_KEY=your-secret-key-here        # Secret key
```

### Frontend (.env)
```env
REACT_APP_API_URL=http://localhost:8000/api
REACT_APP_DEBUG=true
```

## Performance Considerations

### Optimization Tips
- **Data Sampling**: Only send first N rows to AI (faster)
- **Schema Summary**: Send schema instead of full data
- **Caching**: Cache AI responses for similar datasets
- **Async Processing**: Use background jobs for large files
- **Lazy Loading**: Load chart data on demand

### Scalability
- **Horizontal**: Multiple backend instances
- **Vertical**: Increase server resources
- **AI Scaling**: Deploy Ollama on GPU
- **Database**: Use PostgreSQL instead of SQLite
- **Cache**: Add Redis for session caching

## Security Features

### Currently Implemented
- ✓ Environment variables for secrets
- ✓ File type validation
- ✓ File size limits
- ✓ CORS configuration
- ✓ No raw data sent to AI (only schema)

### Production Enhancements
- [ ] API authentication (JWT)
- [ ] HTTPS/SSL
- [ ] Input sanitization
- [ ] Rate limiting
- [ ] Database encryption
- [ ] Audit logging

## Deployment Options

### Local Development
```bash
# Terminal 1
ollama serve

# Terminal 2
cd backend && python main.py

# Terminal 3
cd frontend && npm start
```

### Docker Containerized
```bash
docker-compose up -d
```

### Cloud Deployment
- Backend: AWS ECS, Google Cloud Run, Azure Container Instances
- Frontend: AWS S3 + CloudFront, Vercel, Netlify
- Database: AWS RDS, Google Cloud SQL, Azure SQL
- Ollama: Dedicated VM or on-premise GPU server

## Supported Chart Types

- **Bar Chart**: Categorical data, comparisons
- **Line Chart**: Time series, trends
- **Pie Chart**: Proportions, percentages
- **Scatter Plot**: Correlations, relationships
- **Histogram**: Distributions, frequencies

## Future Enhancements

### Phase 2
- User authentication & multi-user
- Dashboard templates
- Advanced data transformations
- Real-time collaboration
- Export (PDF, PNG)

### Phase 3
- Mobile app
- More chart types (area, bubble, heatmap)
- Custom SQL queries
- Data caching/optimization
- Advanced analytics (ML models)

### Phase 4
- Multi-datasource support
- Data federation
- Real-time data connections
- Scheduled reports
- Alert system

## Troubleshooting

### Common Issues
1. **Ollama connection**: Check Ollama is running and accessible
2. **Backend errors**: Check logs and environment variables
3. **Frontend blank**: Check CORS and API URL
4. **Slow AI**: Reduce dataset size or use faster model
5. **File upload fails**: Check file format and size

### Debug Mode
1. Set `DEBUG=True` in backend .env
2. Set `REACT_APP_DEBUG=true` in frontend .env
3. Check browser console (F12)
4. Check backend terminal output
5. Check Ollama service logs

## Testing

### Manual Testing
1. Upload sample CSV/Excel file
2. Verify data preview works
3. Generate dashboard with AI
4. Edit charts and verify updates
5. Test dashboard sharing
6. Test different data types

### Automated Testing
```bash
# Backend tests
python -m pytest tests/

# Frontend tests
npm test

# Linting
pylint backend/app/
npm run lint
```

---

**Last Updated**: 2024
**Version**: 1.0.0
**Status**: Production Ready
