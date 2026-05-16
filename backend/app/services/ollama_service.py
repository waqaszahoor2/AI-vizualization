"""
Ollama AI Integration Service for dashboard generation and insights.
Supports both deepseek-r1 (reasoning) and deepseek-coder (code generation).
"""
import json
import re
import logging
import asyncio
import time
import aiohttp
from typing import Dict, Any, List, Optional
from app.config import settings
from app.schemas.base import GeneratedDashboard, KPIConfig, ChartConfig

logger = logging.getLogger(__name__)


class OllamaService:
    """Service for interacting with Ollama AI models."""

    def __init__(self):
        self.base_url = settings.OLLAMA_URL
        self.model_reasoning = settings.OLLAMA_MODEL_REASONING
        self.model_coder = settings.OLLAMA_MODEL_CODER
        self.timeout = settings.OLLAMA_TIMEOUT

    async def check_health(self) -> Dict[str, Any]:
        if getattr(settings, "KIMI_API_KEY", None) and settings.KIMI_API_KEY != "PASTE_YOUR_KIMI_KEY_HERE":
            return {"status": "healthy", "models": ["moonshot-v1-8k", "moonshot-v1-32k", "moonshot-v1-128k"]}
            
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(f"{self.base_url}/api/tags", timeout=aiohttp.ClientTimeout(total=5)) as resp:
                    if resp.status == 200:
                        data = await resp.json()
                        return {"status": "healthy", "models": [m["name"] for m in data.get("models", [])]}
                    return {"status": "unhealthy"}
        except Exception as e:
            return {"status": "unhealthy", "error": str(e)}

    async def generate_dashboard_from_image(
        self,
        dataset_info: Dict,
        sample_data: Optional[List[Dict]],
        image_base64: str,
        extra_prompt: str = "",
    ) -> GeneratedDashboard:
        """
        Use a local Ollama vision model to read a dashboard screenshot and emit a JSON dashboard spec.
        Does not use Kimi — requires Ollama at OLLAMA_URL with a vision-capable model.
        """
        cols = self._describe_columns(dataset_info.get("columns_info", []))
        sample_str = json.dumps(sample_data[:5] if sample_data else [], indent=2, default=str)
        vision_model = getattr(settings, "OLLAMA_VISION_MODEL", "llava:latest")
        instructions = f"""You are a BI dashboard designer. The user attached an IMAGE of a dashboard or report layout.

Study the image: layout (KPI cards, chart types, titles), approximate grid, and visual style.
Map what you see to THIS dataset's real column names (do not invent columns).

DATASET: {dataset_info.get('rows_count','?')} rows, {dataset_info.get('columns_count','?')} cols
COLUMNS:
{cols}
SAMPLE ROWS:
{sample_str}

USER NOTES: {extra_prompt or "(none)"}

CHART TYPES (use these snake_case ids only): line, area, stacked_area, bar, horizontal_bar, stacked_bar, percent_stacked_bar, pie, donut, scatter, bubble, heatmap, histogram, box, waterfall, funnel, treemap, sunburst, sankey, gauge, radar, candlestick, combo, pareto, table, ribbon, map

Return ONLY valid JSON (no markdown):
{{"title":"...","summary":"...","insights":["..."],"kpis":[{{"label":"...","value":"...","format":"number"}}],"charts":[{{"id":"chart_1","type":"bar","title":"...","x_axis":"real_column","y_axis":["numeric_col"],"aggregation":"sum","description":"..."}}],"layout":["kpi_row","chart_1","chart_2"]}}

Use 4-10 charts when the image shows many visuals. Match chart types to the image when possible."""
        response = await self._call_ollama_vision(instructions, image_base64, model=vision_model)
        return self._parse_dashboard_response(response, dataset_info)

    async def generate_dashboard(self, dataset_info: Dict, user_prompt: str, sample_data: Optional[List[Dict]] = None) -> GeneratedDashboard:
        try:
            prompt = self._build_dashboard_prompt(dataset_info, user_prompt, sample_data)
            for model in [self.model_reasoning, self.model_coder]:
                try:
                    response = await self._call_ollama(prompt, model=model)
                    return self._parse_dashboard_response(response, dataset_info)
                except Exception as e:
                    logger.warning(f"Model {model} failed: {e}")
                    continue
            return self._create_fallback(dataset_info, user_prompt)
        except Exception as e:
            logger.error(f"Dashboard generation error: {e}")
            return self._create_fallback(dataset_info, user_prompt)

    async def generate_insights(self, dataset_info: Dict, sample_data: Optional[List[Dict]] = None) -> List[str]:
        try:
            cols = self._describe_columns(dataset_info.get("columns_info", []))
            prompt = f"Analyze this dataset ({dataset_info.get('rows_count','?')} rows) and return ONLY a JSON array of 3-5 insights.\nColumns:\n{cols}\nSample: {json.dumps(sample_data[:3] if sample_data else [], default=str)}\nReturn ONLY: [\"insight1\",\"insight2\"]"
            response = await self._call_ollama(prompt, model=self.model_reasoning)
            text = re.sub(r"<think>.*?</think>", "", response, flags=re.DOTALL)
            s, e = text.find("["), text.rfind("]")
            if s != -1 and e > s:
                return json.loads(text[s:e+1])
            return self._fallback_insights(dataset_info)
        except:
            return self._fallback_insights(dataset_info)

    def _build_dashboard_prompt(self, info: Dict, prompt: str, sample: Optional[List[Dict]]) -> str:
        cols = self._describe_columns(info.get("columns_info", []))
        sample_str = json.dumps(sample[:2] if sample else [], default=str)
        
        # Self-Learning: Inject best patterns
        patterns = ""
        try:
            learning_path = "storage/ai_learning.json"
            if os.path.exists(learning_path):
                with open(learning_path, 'r') as f:
                    memory = json.load(f)
                    best = memory[-1:] # Just the latest successful one for speed
                    if best:
                        patterns = f"LEARNED PATTERN: Q:{best[0]['q']} -> A:{json.dumps(best[0]['a'])}\n"
        except: pass

        return f"""Task: Create BI Dashboard JSON.
{patterns}Data: {info.get('rows_count','?')} rows.
Cols: {cols}
Sample: {sample_str}
User: {prompt}
Format: {{"title":"","summary":"","insights":[],"kpis":[],"charts":[],"layout":[]}}
Response: JSON only."""

    def _describe_columns(self, cols: List[Dict]) -> str:
        lines = []
        for c in cols:
            s = f"{c['name']}({c.get('dtype','?')})"
            if c.get("top_values"):
                s += f"[{','.join(list(c['top_values'].keys())[:2])}]"
            lines.append(s)
        return ", ".join(lines)

    async def _call_kimi(self, prompt: str, model: str = "moonshot-v1-8k") -> str:
        async with aiohttp.ClientSession() as session:
            headers = {
                "Authorization": f"Bearer {settings.KIMI_API_KEY}",
                "Content-Type": "application/json"
            }
            payload = {
                "model": model if model.startswith("moonshot") else "moonshot-v1-8k",
                "messages": [{"role": "user", "content": prompt}],
                "temperature": 0.2
            }
            async with session.post("https://api.moonshot.cn/v1/chat/completions", headers=headers, json=payload, timeout=aiohttp.ClientTimeout(total=self.timeout)) as resp:
                if resp.status == 200:
                    data = await resp.json()
                    return data["choices"][0]["message"]["content"]
                raise Exception(f"Kimi error {resp.status}: {await resp.text()}")

    def update_learning_memory(self, user_prompt: str, dashboard_data: Dict):
        """Save a successful generation to local memory for future few-shot learning."""
        try:
            import os
            os.makedirs("storage", exist_ok=True)
            path = "storage/ai_learning.json"
            memory = []
            if os.path.exists(path):
                with open(path, 'r', encoding='utf-8') as f:
                    memory = json.load(f)
            
            # Simple learning: store prompt and basic structure
            # We strip data values to keep memory light
            learned_a = {
                "title": dashboard_data.get("title"),
                "summary": dashboard_data.get("summary"),
                "charts": [
                    {"type": c["type"], "title": c["title"], "x": c["x_axis"], "y": c["y_axis"]} 
                    for c in dashboard_data.get("charts", [])[:2]
                ]
            }
            
            memory.append({"q": user_prompt, "a": learned_a})
            memory = memory[-10:] # Keep only the best 10 patterns
            
            with open(path, 'w', encoding='utf-8') as f:
                json.dump(memory, f, indent=2)
            logger.info(f"AI memory updated with new successful pattern: {user_prompt[:50]}")
        except Exception as e:
            logger.error(f"Failed to update AI memory: {e}")

    async def _call_ollama(self, prompt: str, model: Optional[str] = None) -> str:
        # Only use Kimi if explicitly requested via model name
        if model and model.startswith("moonshot"):
            return await self._call_kimi(prompt, model)

        model = model or self.model_reasoning
        async with aiohttp.ClientSession() as session:
            payload = {
                "model": model, 
                "prompt": prompt, 
                "stream": False,
                "keep_alive": "10m",
                "options": {
                    "temperature": 0.0, 
                    "num_predict": settings.OLLAMA_NUM_PREDICT,
                    "num_ctx": settings.OLLAMA_NUM_CTX,
                    "top_k": 10,
                    "top_p": 0.5
                }
            }
            async with session.post(f"{self.base_url}/api/generate", json=payload, timeout=aiohttp.ClientTimeout(total=self.timeout)) as resp:
                if resp.status == 200:
                    data = await resp.json()
                    return data.get("response", "")
                raise Exception(f"Ollama error {resp.status}")

    async def _call_ollama_vision(self, prompt: str, image_base64: str, model: Optional[str] = None) -> str:
        """Vision completion via Ollama /api/chat (always hits local Ollama, not Kimi)."""
        model = model or getattr(settings, "OLLAMA_VISION_MODEL", "llava:latest")
        async with aiohttp.ClientSession() as session:
            payload = {
                "model": model,
                "messages": [
                    {
                        "role": "user",
                        "content": prompt,
                        "images": [image_base64],
                    }
                ],
                "stream": False,
                "options": {
                    "temperature": 0.2, 
                    "num_predict": settings.OLLAMA_NUM_PREDICT,
                    "num_ctx": settings.OLLAMA_NUM_CTX,
                },
            }
            async with session.post(
                f"{self.base_url}/api/chat",
                json=payload,
                timeout=aiohttp.ClientTimeout(total=self.timeout),
            ) as resp:
                if resp.status != 200:
                    body = await resp.text()
                    raise ValueError(f"Ollama vision error {resp.status}: {body[:500]}")
                data = await resp.json()
                msg = (data.get("message") or {})
                return msg.get("content", "") or ""

    def _parse_dashboard_response(self, response: str, info: Dict) -> GeneratedDashboard:
        data = self._extract_json(response)
        if not data:
            raise ValueError("No JSON in response")
        kpis = [KPIConfig(label=k.get("label","Metric"), value=k.get("value","N/A"), format=k.get("format","number")) for k in data.get("kpis",[])]
        charts = []
        for i, c in enumerate(data.get("charts",[])):
            y = c.get("y_axis",[])
            if isinstance(y, str): y = [y]
            charts.append(ChartConfig(
                id=c.get("id", f"chart_{i+1}"),
                type=c.get("type", "bar"),
                title=c.get("title", f"Chart {i+1}"),
                description=c.get("description", ""),
                x_axis=c.get("x_axis", ""),
                y_axis=y,
                aggregation=c.get("aggregation", "sum"),
                config=c.get("config") if isinstance(c.get("config"), dict) else {},
            ))
        return GeneratedDashboard(title=data.get("title","Dashboard"), summary=data.get("summary",""), insights=data.get("insights",[])[:5], kpis=kpis, charts=charts, layout=data.get("layout",["kpi_row"]+[c.id for c in charts]))

    def _extract_json(self, text: str) -> Optional[Dict]:
        text = re.sub(r"<think>.*?</think>", "", text, flags=re.DOTALL)
        try: return json.loads(text.strip())
        except: pass
        m = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", text, re.DOTALL)
        if m:
            try: return json.loads(m.group(1))
            except: pass
        s, e = text.find("{"), text.rfind("}")
        if s != -1 and e > s:
            try: return json.loads(text[s:e+1])
            except: pass
        return None

    def _create_fallback(self, info: Dict, prompt: str) -> GeneratedDashboard:
        cols = info.get("columns_info", [])
        num = [c for c in cols if c.get("is_numeric")]
        cat = [c for c in cols if c.get("is_categorical")]
        dt = [c for c in cols if c.get("is_datetime")]
        rows = info.get("rows_count", 0)
        kpis = [KPIConfig(label="Total Rows", value=rows, format="number"), KPIConfig(label="Columns", value=len(cols), format="number")]
        for c in num[:2]:
            if c.get("mean"): kpis.append(KPIConfig(label=f"Avg {c['name']}", value=round(c["mean"],2), format="number"))
        charts = []
        cid = 1
        if dt and num:
            charts.append(ChartConfig(id=f"chart_{cid}", type="line", title=f"{num[0]['name']} Over Time", x_axis=dt[0]["name"], y_axis=[num[0]["name"]], aggregation="sum"))
            cid += 1
        if cat and num:
            charts.append(ChartConfig(id=f"chart_{cid}", type="bar", title=f"{num[0]['name']} by {cat[0]['name']}", x_axis=cat[0]["name"], y_axis=[num[0]["name"]], aggregation="sum"))
            cid += 1
            charts.append(ChartConfig(id=f"chart_{cid}", type="pie", title=f"{cat[0]['name']} Distribution", x_axis=cat[0]["name"], y_axis=[num[0]["name"]], aggregation="sum"))
            cid += 1
        if len(num) >= 2:
            charts.append(ChartConfig(id=f"chart_{cid}", type="scatter", title=f"{num[0]['name']} vs {num[1]['name']}", x_axis=num[0]["name"], y_axis=[num[1]["name"]], aggregation="none"))
            cid += 1
        if not charts and len(cols) >= 2:
            charts.append(ChartConfig(id="chart_1", type="bar", title="Data Overview", x_axis=cols[0]["name"], y_axis=[cols[1]["name"]], aggregation="count"))
        return GeneratedDashboard(title=f"Dashboard: {prompt[:50]}", summary=f"Dashboard for {rows} rows", insights=self._fallback_insights(info), kpis=kpis, charts=charts, layout=["kpi_row"]+[c.id for c in charts])

    def _fallback_insights(self, info: Dict) -> List[str]:
        rows, cols = info.get("rows_count",0), info.get("columns_info",[])
        insights = [f"Dataset: {rows:,} records, {len(cols)} fields"]
        missing = sum(c.get("null_count",0) for c in cols)
        if missing > 0: insights.append(f"{round(missing/(rows*len(cols))*100,1) if rows else 0}% missing values")
        else: insights.append("No missing values — excellent data quality")
        insights.append(f"{info.get('duplicates',0)} duplicate rows found")
        return insights

ollama_service = OllamaService()
