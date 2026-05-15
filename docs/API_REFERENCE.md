# API Reference

## Base URL
```
http://localhost:8000/api
```

## Authentication
JWT tokens passed in Authorization header:
```
Authorization: Bearer <token>
```

---

## Health Endpoints

### Health Check
```
GET /health/
```
Returns current health status and configuration.

### Version
```
GET /health/version
```
Returns API version information.

---

## Upload Endpoints

### Upload File
```
POST /upload/file
Content-Type: multipart/form-data

file: <binary>
```

**Response:**
```json
{
  "success": true,
  "file_name": "data.csv",
  "file_path": "/path/to/file.csv",
  "file_size": 1024,
  "metadata": {
    "rows_count": 1000,
    "columns_count": 10,
    "columns_info": [
      {
        "name": "date",
        "dtype": "datetime64",
        "null_count": 0,
        "unique_count": 100
      }
    ]
  },
  "sample_data": [...]
}
```

### Get File Preview
```
GET /upload/preview/{file_name}
```

**Response:**
```json
{
  "file_name": "data.csv",
  "profile": {...},
  "sample_data": [...]
}
```

---

## Dashboard Endpoints

### Generate Dashboard
```
POST /dashboards/generate
Query Parameters:
  - file_path: (required) Path to the dataset file
  - prompt: (required) Natural language dashboard description
  - dataset_id: (optional) Dataset ID for tracking
```

**Response:**
```json
{
  "title": "Sales Dashboard",
  "summary": "Track sales trends, top products, and regional performance",
  "insights": [
    "Sales increased by 25% YoY",
    "Top product: Product A with 40% of total sales"
  ],
  "kpis": [
    {
      "label": "Total Sales",
      "value": 1250000,
      "format": "currency"
    }
  ],
  "charts": [
    {
      "id": "chart_1",
      "type": "line",
      "title": "Sales Trend",
      "x_axis": "date",
      "y_axis": ["sales"],
      "aggregation": "sum",
      "description": "Monthly sales trend"
    }
  ],
  "layout": ["kpi_row", "chart_1", "chart_2"]
}
```

### Generate Insights
```
POST /dashboards/generate-insights
Query Parameters:
  - file_path: (required) Path to the dataset file
```

**Response:**
```json
{
  "insights": [
    "Insight 1",
    "Insight 2",
    "Insight 3"
  ],
  "count": 3
}
```

### Get Dashboard Templates
```
GET /dashboards/templates
```

**Response:**
```json
{
  "templates": [
    {
      "id": "sales",
      "name": "Sales Dashboard",
      "description": "Track sales trends...",
      "icon": "📊"
    }
  ]
}
```

### Get Preset Prompts
```
GET /dashboards/preset-prompts
```

**Response:**
```json
{
  "prompts": [
    {
      "id": 1,
      "title": "Executive Summary",
      "prompt": "Create an executive summary..."
    }
  ]
}
```

### Save Dashboard
```
POST /dashboards/save
Query Parameters:
  - user_id: (required) User ID
  - dataset_id: (required) Dataset ID
  - title: (required) Dashboard title
  - description: (optional) Dashboard description

Body: dashboard_config (JSON)
```

### Get Dashboards
```
GET /dashboards/
Query Parameters:
  - skip: (optional, default: 0)
  - limit: (optional, default: 10)
```

### Get Dashboard
```
GET /dashboards/{dashboard_id}
```

### Update Dashboard
```
PUT /dashboards/{dashboard_id}
Body: dashboard_config (JSON)
```

### Delete Dashboard
```
DELETE /dashboards/{dashboard_id}
```

### Share Dashboard
```
POST /dashboards/{dashboard_id}/share
Query Parameters:
  - share_type: (optional, default: "public") "public" or "private"
```

**Response:**
```json
{
  "share_token": "token123",
  "share_url": "http://localhost:8000/dashboards/shared/token123",
  "share_type": "public"
}
```

### Get Shared Dashboard
```
GET /dashboards/shared/{share_token}
```

### Export Dashboard
```
POST /dashboards/{dashboard_id}/export
Query Parameters:
  - format: (optional, default: "json") "json", "pdf", "png", or "xlsx"
```

---

## Dataset Endpoints

### List Datasets
```
GET /datasets/
Query Parameters:
  - skip: (optional, default: 0)
  - limit: (optional, default: 10)
```

### Get Dataset
```
GET /datasets/{dataset_id}
```

### Delete Dataset
```
DELETE /datasets/{dataset_id}
```

### Get Dataset Statistics
```
GET /datasets/{dataset_id}/statistics
```

### Get Dataset Columns
```
GET /datasets/{dataset_id}/columns
```

### Get Dataset Sample
```
POST /datasets/{dataset_id}/sample
Query Parameters:
  - n_rows: (optional, default: 10)
```

---

## Error Responses

All errors follow this format:
```json
{
  "detail": "Error message"
}
```

### Common Status Codes
- `200 OK`: Success
- `400 Bad Request`: Invalid parameters
- `404 Not Found`: Resource not found
- `413 Payload Too Large`: File too large
- `500 Internal Server Error`: Server error

---

## Rate Limiting

Currently not implemented. To be added in production.

---

## Example Usage

### 1. Upload Dataset
```bash
curl -X POST http://localhost:8000/api/upload/file \
  -F "file=@data.csv"
```

### 2. Generate Dashboard
```bash
curl -X POST "http://localhost:8000/api/dashboards/generate" \
  -G \
  -d "file_path=/path/to/data.csv" \
  -d "prompt=Create a sales dashboard with trends and top products"
```

### 3. Save Dashboard
```bash
curl -X POST "http://localhost:8000/api/dashboards/save" \
  -G \
  -d "user_id=1" \
  -d "dataset_id=1" \
  -d "title=Sales Dashboard" \
  -H "Content-Type: application/json" \
  -d @dashboard_config.json
```

### 4. Share Dashboard
```bash
curl -X POST "http://localhost:8000/api/dashboards/1/share" \
  -G \
  -d "share_type=public"
```
