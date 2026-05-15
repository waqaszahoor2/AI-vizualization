"""
Dashboard Chat router — AI-powered dashboard modifications via conversation.
Users can ask the AI to add charts, change chart types, add KPIs, etc.
"""
import os
import json
import re
import logging
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from app.services.ollama_service import ollama_service
from app.services.data_processor import data_processor
from app.config import settings

class KimiKeyRequest(BaseModel):
    key: str

router = APIRouter(prefix="/api/chat", tags=["chat"])
logger = logging.getLogger(__name__)


class ChatRequest(BaseModel):
    """Chat message from the user to modify a dashboard."""
    message: str
    file_path: str
    dashboard_id: Optional[str] = None
    current_charts: Optional[List[Dict[str, Any]]] = None
    current_kpis: Optional[List[Dict[str, Any]]] = None
    history: Optional[List[Dict[str, str]]] = None
    model: Optional[str] = None  # optional model override from the user


class ChatResponse(BaseModel):
    """AI response with optional dashboard modifications."""
    reply: str
    actions: List[Dict[str, Any]] = []


def _extract_json_from_response(text: str) -> Optional[Dict]:
    """Extract JSON from AI response, handling think tags and markdown."""
    text = re.sub(r"<think>.*?</think>", "", text, flags=re.DOTALL)
    # Try raw JSON
    try:
        return json.loads(text.strip())
    except Exception:
        pass
    # Try markdown code block
    m = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", text, re.DOTALL)
    if m:
        try:
            return json.loads(m.group(1))
        except Exception:
            pass
    # Try finding braces
    s, e = text.find("{"), text.rfind("}")
    if s != -1 and e > s:
        try:
            return json.loads(text[s:e + 1])
        except Exception:
            pass
    return None


@router.post("/message")
async def chat_message(request: ChatRequest):
    """Process a chat message and return AI response with dashboard modifications."""
    try:
        if not os.path.exists(request.file_path):
            raise HTTPException(status_code=404, detail="Dataset file not found")

        df = data_processor.load_file(request.file_path)
        profile = data_processor.profile_dataset(df)
        sample = data_processor.get_sample_data(df, n_rows=5)

        # Build column descriptions
        col_desc = []
        for c in profile.get("columns_info", []):
            desc = f"- {c['name']}: {c.get('dtype', '?')} (numeric={c.get('is_numeric', False)}, categorical={c.get('is_categorical', False)}, datetime={c.get('is_datetime', False)})"
            if c.get("is_numeric") and c.get("mean") is not None:
                desc += f" [range: {c.get('min_value')}-{c.get('max_value')}, mean: {c.get('mean')}]"
            elif c.get("top_values"):
                desc += f" [top: {','.join(list(c['top_values'].keys())[:5])}]"
            col_desc.append(desc)

        columns_str = "\n".join(col_desc)

        current_charts_str = json.dumps(request.current_charts or [], indent=2, default=str)
        current_kpis_str = json.dumps(request.current_kpis or [], indent=2, default=str)

        # Build conversation history context
        history_str = ""
        if request.history:
            for h in request.history[-6:]:
                role = h.get("role", "user")
                content = h.get("content", "")
                history_str += f"{role.upper()}: {content}\n"

        prompt = f"""You are an AI Dashboard Assistant. The user wants to modify their data dashboard.

DATASET: {profile.get('rows_count', '?')} rows, {profile.get('columns_count', '?')} columns
COLUMNS:
{columns_str}
SAMPLE DATA: {json.dumps(sample[:3] if sample else [], default=str)}

CURRENT DASHBOARD CHARTS:
{current_charts_str}

CURRENT DASHBOARD KPIs:
{current_kpis_str}

CHART TYPES AVAILABLE: line, area, bar, horizontal_bar, stacked_bar, pie, donut, scatter, bubble, heatmap, histogram, box, waterfall, funnel, treemap, sunburst, sankey, gauge, radar, candlestick

{history_str}
USER MESSAGE: {request.message}

INSTRUCTIONS:
- Respond with valid JSON only.
- The "reply" field should contain a friendly, helpful response to the user.
- The "actions" field is an array of modifications to apply. Each action has a "type" field.
- Action types:
  * "add_chart": adds a new chart. Include: id, type, title, x_axis, y_axis (array), aggregation, description
  * "remove_chart": removes a chart. Include: chart_id
  * "update_chart": modifies a chart. Include: chart_id, and any fields to update (type, title, x_axis, y_axis, aggregation)
  * "add_kpi": adds a KPI. Include: label, value, format (number/currency/percentage)
  * "remove_kpi": removes a KPI. Include: index (0-based)
  * "update_title": changes dashboard title. Include: title
  * "update_insights": replace insights. Include: insights (array of strings)
  * "update_layout": modifies chart positions/sizes. Include: layout (array of items with i, x, y, w, h)
- Use actual column names from the dataset.
- Generate smart, descriptive titles using column names (e.g. "Revenue by Region", "Monthly Profit Trend").
- If the user asks a question about the data, just reply helpfully without actions.

Return ONLY valid JSON:
{{"reply": "...", "actions": [...]}}
No markdown wrapping, no explanation outside the JSON."""

        # Use the user-selected model if provided, else default
        selected_model = request.model or ollama_service.model_reasoning
        response = await ollama_service._call_ollama(prompt, model=selected_model)
        parsed = _extract_json_from_response(response)

        if parsed:
            reply = parsed.get("reply", "Done! I've updated your dashboard.")
            actions = parsed.get("actions", [])

            # Ensure chart IDs are unique
            for action in actions:
                if action.get("type") == "add_chart" and not action.get("id"):
                    import uuid
                    action["id"] = f"chat_{uuid.uuid4().hex[:6]}"

            return {"reply": reply, "actions": actions}
        else:
            # If no JSON found, return the raw text as reply
            clean = re.sub(r"<think>.*?</think>", "", response, flags=re.DOTALL).strip()
            return {"reply": clean or "I couldn't process that. Try rephrasing your request.", "actions": []}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Chat error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/suggestions")
async def get_suggestions(file_path: str):
    """Get quick action suggestions based on the dataset."""
    try:
        if not os.path.exists(file_path):
            raise HTTPException(status_code=404, detail="Dataset file not found")

        df = data_processor.load_file(file_path)
        profile = data_processor.profile_dataset(df)
        cols = profile.get("columns_info", [])

        numeric_cols = [c["name"] for c in cols if c.get("is_numeric")]
        categorical_cols = [c["name"] for c in cols if c.get("is_categorical")]
        datetime_cols = [c["name"] for c in cols if c.get("is_datetime")]

        suggestions = []

        if numeric_cols:
            col = numeric_cols[0]
            suggestions.append(f"Add a KPI card showing total {col}")
            if len(numeric_cols) >= 2:
                suggestions.append(f"Show a scatter plot of {numeric_cols[0]} vs {numeric_cols[1]}")

        if categorical_cols and numeric_cols:
            suggestions.append(f"Add a bar chart of {numeric_cols[0]} by {categorical_cols[0]}")
            suggestions.append(f"Show a pie chart for {categorical_cols[0]} distribution")

        if datetime_cols and numeric_cols:
            suggestions.append(f"Add a line chart showing {numeric_cols[0]} trend over {datetime_cols[0]}")

        if categorical_cols:
            suggestions.append(f"Add a donut chart for {categorical_cols[0]}")

        suggestions.append("Change all charts to dark theme")
        suggestions.append("Add more KPI cards for key metrics")

        return {"suggestions": suggestions[:8]}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/models")
async def list_models():
    """List all available Ollama models for the model selector."""
    try:
        health = await ollama_service.check_health()
        models = health.get("models", [])
        return {
            "models": models,
            "default": ollama_service.model_reasoning,
            "status": health.get("status", "unknown"),
        }
    except Exception as e:
        logger.error(f"Error listing models: {e}")
        return {
            "models": [ollama_service.model_reasoning, ollama_service.model_coder],
            "default": ollama_service.model_reasoning,
            "status": "fallback",
        }

@router.post("/set-kimi-key")
async def set_kimi_key(request: KimiKeyRequest):
    """Set the Kimi (Moonshot AI) API Key dynamically and save to .env."""
    try:
        key = request.key.strip()
        settings.KIMI_API_KEY = key
        
        # Save to .env
        env_path = ".env"
        env_content = ""
        if os.path.exists(env_path):
            with open(env_path, "r") as f:
                env_content = f.read()
                
        # Remove old key if exists
        lines = [line for line in env_content.split('\n') if not line.startswith('KIMI_API_KEY=')]
        lines.append(f"KIMI_API_KEY={key}")
        
        with open(env_path, "w") as f:
            f.write('\n'.join(lines))
            
        return {"success": True, "message": "Kimi API key updated successfully."}
    except Exception as e:
        logger.error(f"Failed to set Kimi key: {e}")
        raise HTTPException(status_code=500, detail=str(e))
