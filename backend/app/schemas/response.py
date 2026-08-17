from typing import Any, Generic, TypeVar, Optional
from pydantic import BaseModel

DataT = TypeVar("DataT")

class MetaModel(BaseModel):
    page: Optional[int] = None
    per_page: Optional[int] = None
    total: Optional[int] = None
    code: Optional[str] = None
    detail: Optional[str] = None

class StandardResponse(BaseModel, Generic[DataT]):
    success: bool
    data: Optional[DataT] = None
    error: Optional[str] = None
    meta: Optional[MetaModel] = None

    @classmethod
    def success_response(cls, data: DataT, meta: Optional[MetaModel] = None) -> "StandardResponse[DataT]":
        return cls(success=True, data=data, meta=meta)

    @classmethod
    def error_response(cls, error: str, meta: Optional[MetaModel] = None) -> "StandardResponse[Any]":
        return cls(success=False, error=error, meta=meta)
