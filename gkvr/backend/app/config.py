"""应用配置：数据库连接、CORS、推荐算法阈值。"""
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "sqlite:///./gkvr.db"
    allowed_origins: str = "http://localhost:3000"

    # 推荐算法分档阈值（考生位次 R / 学校录取位次均值 M 的比值边界）
    # 位次越小排名越靠前：ratio 越小 → 越稳
    tier_pad: float = 0.85      # ratio <= pad → 垫
    tier_safe: float = 0.95     # ratio <= safe → 保
    tier_stable: float = 1.05   # ratio <= stable → 稳
    tier_rush: float = 1.15     # ratio <= rush → 冲；超过 → 不推荐
    # 录取概率 sigmoid 系数：prob = 100 / (1 + exp(k*(ratio-1)))
    prob_k: float = 8.0

    @property
    def cors_origins(self) -> list[str]:
        return [o.strip() for o in self.allowed_origins.split(",") if o.strip()]


settings = Settings()
