# Deployment Guide

## Local Development Setup

### Prerequisites
- Docker & Docker Compose
- Python 3.12+
- Node.js 18+
- Git

### Quick Start with Docker Compose

```bash
# Clone the repository
git clone <repository-url>
cd ai-visualization

# Copy environment files
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# Update environment variables as needed
nano backend/.env
nano frontend/.env

# Start all services
docker-compose up -d

# Pull required models in Ollama (do this once)
docker exec ai-viz-ollama ollama pull deepseek-r1
docker exec ai-viz-ollama ollama pull deepseek-coder

# Check logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Access the application
# Frontend: http://localhost:3000
# Backend API: http://localhost:8000
# API Docs: http://localhost:8000/docs
# Ollama: http://localhost:11434
```

### Manual Local Development

#### Backend Setup
```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
cp .env.example .env

# Update environment variables
nano .env

# Run migrations (when database is ready)
alembic upgrade head

# Start the backend server
python main.py

# API available at http://localhost:8000
# Docs at http://localhost:8000/docs
```

#### Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Update environment variables
nano .env

# Start development server
npm start

# Application available at http://localhost:3000
```

### Ollama Setup

Ollama must be running with the required models. Install Ollama from https://ollama.ai/

```bash
# Start Ollama (runs on port 11434)
ollama serve

# In another terminal, pull required models
ollama pull deepseek-r1
ollama pull deepseek-coder

# Test Ollama connection
curl http://localhost:11434/api/tags
```

## Production Deployment

### Google Cloud Run

#### Backend Deployment
```bash
# Build and push to Google Artifact Registry
gcloud builds submit --tag gcr.io/PROJECT_ID/ai-dashboard-backend

# Deploy to Cloud Run
gcloud run deploy ai-dashboard-backend \
  --image gcr.io/PROJECT_ID/ai-dashboard-backend \
  --platform managed \
  --region us-central1 \
  --set-env-vars DATABASE_URL=$DATABASE_URL,REDIS_URL=$REDIS_URL,OLLAMA_URL=$OLLAMA_URL \
  --allow-unauthenticated
```

#### Frontend Deployment to Vercel
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
cd frontend
vercel --prod
```

### Environment Variables

#### Backend (.env)
```
DATABASE_URL=postgresql://user:password@host:5432/database
REDIS_URL=redis://host:6379/0
OLLAMA_URL=http://ollama-host:11434
OLLAMA_MODEL=deepseek-r1
JWT_SECRET=your-super-secret-key
ENV=production
DEBUG=False
```

#### Frontend (.env)
```
REACT_APP_API_URL=https://backend-api-url.com
REACT_APP_FIREBASE_API_KEY=your-firebase-key
REACT_APP_FIREBASE_PROJECT_ID=your-firebase-project
```

## Database Migrations

### Create Migration
```bash
cd backend
alembic revision --autogenerate -m "Description of changes"
```

### Apply Migrations
```bash
alembic upgrade head
```

## Monitoring

### Application Health Checks
```bash
# Backend health
curl http://localhost:8000/health/

# Frontend health
curl http://localhost:3000/

# Ollama health
curl http://localhost:11434/api/tags
```

### Docker Logs
```bash
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f postgres
docker-compose logs -f redis
docker-compose logs -f ollama
```

## Scaling Considerations

1. **Database**: Use managed PostgreSQL service (Cloud SQL)
2. **Cache**: Use managed Redis (Memorystore)
3. **Storage**: Use cloud storage (Google Cloud Storage)
4. **API**: Scale backend using Cloud Run auto-scaling
5. **Frontend**: Serve via CDN (Cloudflare, Vercel)
6. **Ollama**: Consider self-hosted or API provider

## Security Best Practices

1. Change all default passwords and secrets
2. Use HTTPS everywhere
3. Enable CORS only for trusted domains
4. Implement rate limiting
5. Use environment variables for sensitive data
6. Regular security audits
7. Keep dependencies updated
8. Enable database encryption
9. Use VPC for database access
10. Implement API authentication (JWT)

## Troubleshooting

### Backend not connecting to Ollama
- Ensure Ollama is running on the correct URL
- Check network connectivity between containers
- Verify models are pulled: `ollama list`

### Database connection issues
- Verify DATABASE_URL is correct
- Check database is running: `docker-compose ps`
- Review database logs: `docker-compose logs postgres`

### Frontend API calls failing
- Check REACT_APP_API_URL in .env
- Verify backend is running: `curl http://localhost:8000/health/`
- Check browser console for CORS errors

### Model generation is slow
- Models need time to load initially
- Consider pre-loading models
- Use smaller models if available
- Increase timeout settings

## Performance Optimization

1. Implement request caching in Redis
2. Use pagination for large datasets
3. Optimize database queries with indexes
4. Use CDN for frontend assets
5. Implement lazy loading for dashboards
6. Cache generated dashboard configs
7. Use database connection pooling
8. Implement rate limiting
