"""
Data Processing Service for dataset analysis and profiling.
Handles CSV/Excel loading, profiling, cleaning, and statistical analysis.
"""
import os
import logging
import pandas as pd
import numpy as np
from typing import Dict, Any, List, Optional, Tuple
from pathlib import Path
import json

logger = logging.getLogger(__name__)


class DataProcessor:
    """Service for processing and analyzing uploaded datasets."""

    ALLOWED_EXTENSIONS = {"csv", "xlsx", "xls"}

    @staticmethod
    def is_valid_file(filename: str) -> bool:
        """Check if the file extension is allowed."""
        return "." in filename and filename.rsplit(".", 1)[1].lower() in DataProcessor.ALLOWED_EXTENSIONS

    @staticmethod
    def load_file(file_path: str) -> pd.DataFrame:
        """Load a CSV or Excel file into a pandas DataFrame."""
        try:
            file_ext = file_path.rsplit(".", 1)[1].lower()
            if file_ext == "csv":
                try:
                    df = pd.read_csv(file_path, encoding="utf-8")
                except UnicodeDecodeError:
                    try:
                        df = pd.read_csv(file_path, encoding="latin1")
                    except UnicodeDecodeError:
                        df = pd.read_csv(file_path, encoding="cp1252")
            elif file_ext in ["xlsx", "xls"]:
                df = pd.read_excel(file_path)
            else:
                raise ValueError(f"Unsupported file format: {file_ext}")

            # Try to parse date columns
            for col in df.columns:
                if df[col].dtype == "object":
                    try:
                        parsed = pd.to_datetime(df[col].dropna().head(20), format="mixed")
                        if parsed.notna().sum() > 10:
                            df[col] = pd.to_datetime(df[col], format="mixed", errors="coerce")
                    except (ValueError, TypeError):
                        pass

            return df
        except Exception as e:
            logger.error(f"Error loading file: {str(e)}")
            raise

    @staticmethod
    def profile_dataset(df: pd.DataFrame) -> Dict[str, Any]:
        """Generate comprehensive dataset profile."""
        profile = {
            "rows_count": len(df),
            "columns_count": len(df.columns),
            "columns_info": [],
            "memory_usage_mb": round(df.memory_usage(deep=True).sum() / 1024**2, 2),
            "missing_values": {k: int(v) for k, v in df.isnull().sum().to_dict().items()},
            "duplicates": int(len(df) - len(df.drop_duplicates())),
        }

        for col in df.columns:
            col_info = DataProcessor._profile_column(df[col])
            profile["columns_info"].append(col_info)

        return profile

    @staticmethod
    def _profile_column(series: pd.Series) -> Dict[str, Any]:
        """Profile a single column."""
        col_info = {
            "name": str(series.name),
            "dtype": str(series.dtype),
            "null_count": int(series.isnull().sum()),
            "unique_count": int(series.nunique()),
            "is_numeric": bool(pd.api.types.is_numeric_dtype(series)),
            "is_datetime": bool(pd.api.types.is_datetime64_any_dtype(series)),
            "is_categorical": bool(
                pd.api.types.is_object_dtype(series) or pd.api.types.is_categorical_dtype(series)
            ),
        }

        if col_info["is_numeric"] and not series.empty:
            clean = series.dropna()
            if len(clean) > 0:
                col_info.update({
                    "min_value": float(clean.min()),
                    "max_value": float(clean.max()),
                    "mean": round(float(clean.mean()), 2),
                    "median": round(float(clean.median()), 2),
                    "std": round(float(clean.std()), 2) if len(clean) > 1 else 0,
                })

        if col_info["is_categorical"]:
            top_values = series.value_counts().head(10)
            col_info["top_values"] = {str(k): int(v) for k, v in top_values.items()}

        if col_info["is_datetime"] and not series.empty:
            clean = series.dropna()
            if len(clean) > 0:
                col_info["min_value"] = str(clean.min())
                col_info["max_value"] = str(clean.max())

        return col_info

    @staticmethod
    def get_sample_data(df: pd.DataFrame, n_rows: int = 5) -> List[Dict]:
        """Get sample rows from the dataset as a list of dicts."""
        sample = df.head(n_rows).copy()
        # Convert timestamps to strings for JSON serialization
        for col in sample.columns:
            if pd.api.types.is_datetime64_any_dtype(sample[col]):
                sample[col] = sample[col].astype(str)
        return sample.fillna("").to_dict("records")

    @staticmethod
    def get_chart_data(
        df: pd.DataFrame,
        x_axis: str,
        y_axis: List[str],
        aggregation: str = "sum",
        filters: Optional[List[Dict[str, Any]]] = None,
        limit: int = 50,
    ) -> Dict[str, Any]:
        """
        Extract and aggregate data for chart rendering.
        Returns data in a format ready for ECharts.
        """
        try:
            # Apply filters if provided
            if filters:
                for f in filters:
                    col = f.get("column")
                    op = f.get("operator", "==")
                    val = f.get("value")
                    
                    if col not in df.columns: continue
                    
                    if op == "==": df = df[df[col] == val]
                    elif op == "!=": df = df[df[col] != val]
                    elif op == ">": df = df[df[col] > val]
                    elif op == "<": df = df[df[col] < val]
                    elif op == ">=": df = df[df[col] >= val]
                    elif op == "<=": df = df[df[col] <= val]
                    elif op == "in" and isinstance(val, list): df = df[df[col].isin(val)]
                    elif op == "contains" and isinstance(val, str): df = df[df[col].astype(str).str.contains(val, case=False)]

            if x_axis not in df.columns:
                return {"error": f"Column '{x_axis}' not found"}

            valid_y = [y for y in y_axis if y in df.columns]
            if not valid_y:
                return {"error": f"No valid Y-axis columns found"}

            # Aggregation
            if aggregation == "none" or not pd.api.types.is_numeric_dtype(df[valid_y[0]]):
                result = df[[x_axis] + valid_y].head(limit)
            else:
                agg_func = {"sum": "sum", "avg": "mean", "count": "count", "min": "min", "max": "max"}
                func = agg_func.get(aggregation, "sum")
                result = df.groupby(x_axis)[valid_y].agg(func).reset_index()

                # Sort and limit
                if len(valid_y) == 1:
                    result = result.sort_values(valid_y[0], ascending=False).head(limit)

            # Convert to serializable format
            categories = result[x_axis].astype(str).tolist()
            series_data = {}
            for y in valid_y:
                values = result[y].tolist()
                series_data[y] = [
                    round(float(v), 2) if isinstance(v, (int, float, np.number)) and not np.isnan(v) else 0
                    for v in values
                ]

            return {
                "categories": categories,
                "series": series_data,
                "total_rows": len(result),
            }

        except Exception as e:
            logger.error(f"Error getting chart data: {str(e)}")
            return {"error": str(e)}

    @staticmethod
    def get_correlation_matrix(df: pd.DataFrame) -> Optional[Dict[str, Any]]:
        """Get correlation matrix for numeric columns."""
        try:
            numeric_df = df.select_dtypes(include=[np.number])
            if numeric_df.empty or len(numeric_df.columns) < 2:
                return None

            corr = numeric_df.corr()
            return {
                "columns": corr.columns.tolist(),
                "data": [[round(float(v), 3) for v in row] for row in corr.values],
            }
        except Exception as e:
            logger.error(f"Error calculating correlation: {str(e)}")
            return None

    @staticmethod
    def get_statistics_summary(df: pd.DataFrame) -> Dict[str, Any]:
        """Get statistical summary of the dataset."""
        return {
            "total_rows": len(df),
            "total_columns": len(df.columns),
            "numeric_columns": len(df.select_dtypes(include=[np.number]).columns),
            "categorical_columns": len(df.select_dtypes(include=["object"]).columns),
            "datetime_columns": len(df.select_dtypes(include=["datetime64"]).columns),
            "missing_values_total": int(df.isnull().sum().sum()),
            "missing_values_percent": round(
                float(df.isnull().sum().sum() / (len(df) * len(df.columns)) * 100), 2
            ) if len(df) > 0 else 0,
            "duplicate_rows": int(len(df) - len(df.drop_duplicates())),
        }

    @staticmethod
    def clean_dataset(df: pd.DataFrame, strategy: str = "smart") -> pd.DataFrame:
        """Clean dataset with various strategies."""
        if strategy == "remove":
            return df.dropna()
        elif strategy == "smart":
            # Fill numeric with median, categorical with mode
            for col in df.columns:
                if pd.api.types.is_numeric_dtype(df[col]):
                    df[col] = df[col].fillna(df[col].median())
                elif pd.api.types.is_object_dtype(df[col]):
                    mode = df[col].mode()
                    df[col] = df[col].fillna(mode[0] if len(mode) > 0 else "Unknown")
            return df
        elif strategy == "fill_zero":
            return df.fillna(0)
        return df

    @staticmethod
    def convert_to_serializable(obj: Any) -> Any:
        """Convert numpy/pandas types to JSON-serializable types."""
        if isinstance(obj, (np.integer,)):
            return int(obj)
        elif isinstance(obj, (np.floating,)):
            return round(float(obj), 4)
        elif isinstance(obj, (np.ndarray, list)):
            return [DataProcessor.convert_to_serializable(item) for item in obj]
        elif isinstance(obj, dict):
            return {key: DataProcessor.convert_to_serializable(value) for key, value in obj.items()}
        elif isinstance(obj, pd.Timestamp):
            return obj.isoformat()
        elif pd.isna(obj):
            return None
        return obj

    @staticmethod
    def save_dataset_metadata(file_path: str, metadata: Dict[str, Any]) -> str:
        """Save dataset metadata as JSON."""
        metadata_path = Path(file_path).with_suffix(".meta.json")
        try:
            serializable = DataProcessor.convert_to_serializable(metadata)
            with open(metadata_path, "w") as f:
                json.dump(serializable, f, indent=2, default=str)
            return str(metadata_path)
        except Exception as e:
            logger.error(f"Error saving metadata: {str(e)}")
            raise


# Singleton
data_processor = DataProcessor()
