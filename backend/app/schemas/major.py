from pydantic import BaseModel


class MajorOut(BaseModel):
    major_id: int
    name: str
    category: str
    subcategory: str
    specific: str
