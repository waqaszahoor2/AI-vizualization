"""
Data processing utilities for analyzing uploaded datasets.
"""
import os
import pandas as pd
import numpy as np
from datetime import datetime
from typing import Dict, Any, List, Tuple
from ..schemas import ColumnStats, DatasetSchema


class DataProcessor:
    """Process and analyze uploaded datasets."""

    @staticmethod
    def load_dataset(file_path: str) -> Tuple[pd.DataFrame, Dict[str, Any]]:
        """
        Load dataset from CSV or Excel file.
        
        Args:
            file_path: Path to the uploaded file
            
        Returns:
            Tuple of (DataFrame, metadata)
        """
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"File not found: {file_path}")

        file_ext = os.path.splitext(file_path)[1].lower()

        try:
            if file_ext == ".csv":
                df = pd.read_csv(file_path)
            elif file_ext in [".xlsx", ".xls"]:
                df = pd.read_excel(file_path)
            else:
                raise ValueError(f"Unsupported file format: {file_ext}")

            metadata = {
                "file_size": os.path.getsize(file_path),
                "row_count": len(df),
                "column_count": len(df.columns),
            }

            return df, metadata

        except Exception as e:
            raise RuntimeError(f"Error loading dataset: {str(e)}")

    @staticmethod
    def analyze_column(series: pd.Series) -> ColumnStats:
        """
        Analyze a single column and extract statistics.
        
        Args:
            series: Pandas Series to analyze
            
        Returns:
            ColumnStats object
        """
        dtype = str(series.dtype)
        null_count = int(series.isnull().sum())
        unique_count = int(series.nunique())

        stats_dict = {
            "name": series.name,
            "dtype": dtype,
            "null_count": null_count,
            "unique_count": unique_count,
            "min_value": None,
            "max_value": None,
            "mean_value": None,
            "std_value": None,
        }

        try:
            if pd.api.types.is_numeric_dtype(series):
                stats_dict["min_value"] = float(series.min())
                stats_dict["max_value"] = float(series.max())
                stats_dict["mean_value"] = float(series.mean())
                stats_dict["std_value"] = float(series.std())
        except (TypeError, ValueError):
            pass

        return ColumnStats(**stats_dict)

    @staticmethod
    def get_dataset_schema(df: pd.DataFrame, file_id: str, filename: str) -> DatasetSchema:
        """
        Generate comprehensive schema for a dataset.
        
        Args:
            df: DataFrame to analyze
            file_id: Unique file identifier
            filename: Original filename
            
        Returns:
            DatasetSchema object
        """
        columns = [DataProcessor.analyze_column(df[col]) for col in df.columns]

        # Get sample data (first 5 rows)
        sample_data = df.head(5).fillna("null").astype(str).to_dict(orient="records")

        schema = DatasetSchema(
            file_id=file_id,
            filename=filename,
            file_size=0,  # Will be set by caller
            row_count=len(df),
            column_count=len(df.columns),
            columns=columns,
            sample_data=sample_data,
            upload_time=datetime.utcnow().isoformat(),
        )

        return schema

    @staticmethod
    def get_sample_rows(df: pd.DataFrame, num_rows: int = 10) -> List[Dict[str, Any]]:
        """
        Extract sample rows from dataset for AI analysis.
        
        Args:
            df: DataFrame to sample from
            num_rows: Number of rows to return
            
        Returns:
            List of dictionaries representing rows
        """
        sampled_df = df.sample(n=min(num_rows, len(df)), random_state=42)
        return sampled_df.fillna("null").astype(str).to_dict(orient="records")

    @staticmethod
    def detect_chart_types(df: pd.DataFrame) -> List[str]:
        """
        Automatically detect suitable chart types based on data.
        
        Args:
            df: DataFrame to analyze
            
        Returns:
            List of recommended chart types
        """
        chart_types = []
        numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()
        categorical_cols = df.select_dtypes(include=["object", "category"]).columns.tolist()

        if len(numeric_cols) >= 2:
            chart_types.extend(["line", "scatter", "bar"])

        if len(numeric_cols) == 1 and len(categorical_cols) >= 1:
            chart_types.extend(["bar", "pie"])

        if len(numeric_cols) == 1:
            chart_types.append("histogram")

        if len(numeric_cols) >= 3:
            chart_types.extend(["scatter", "bubble"])

        return list(set(chart_types))  # Remove duplicates

    @staticmethod
    def clean_data(df: pd.DataFrame) -> pd.DataFrame:
        """
        Perform basic data cleaning.
        
        Args:
            df: DataFrame to clean
            
        Returns:
            Cleaned DataFrame
        """
        # Remove rows where all values are null
        df = df.dropna(how="all")

        # Remove duplicate rows
        df = df.drop_duplicates()

        # Fill numeric nulls with mean
        numeric_cols = df.select_dtypes(include=[np.number]).columns
        for col in numeric_cols:
            df[col].fillna(df[col].mean(), inplace=True)

        # Fill categorical nulls with mode
        categorical_cols = df.select_dtypes(include=["object", "category"]).columns
        for col in categorical_cols:
            df[col].fillna(df[col].mode()[0] if not df[col].mode().empty else "Unknown", inplace=True)

        return df
