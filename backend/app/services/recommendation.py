"""位次法推荐算法：分档 + 录取概率。纯函数，阈值由调用方传入。"""
import math
from dataclasses import dataclass
from enum import Enum


class Tier(str, Enum):
    RUSH = "rush"       # 冲
    STABLE = "stable"   # 稳
    SAFE = "safe"       # 保
    PAD = "pad"         # 垫


@dataclass
class RecommendItem:
    school_id: int
    tier: Tier
    probability: float
    rank_mean: float
    rank_min: int
    rank_max: int


def classify_tier(candidate_rank: int, admission_rank_mean: int, thresholds: dict[str, float]) -> Tier | None:
    """分档。位次越小排名越靠前；ratio = 考生位次 / 录取位次均值。"""
    if admission_rank_mean <= 0:
        return None
    ratio = candidate_rank / admission_rank_mean
    if ratio <= thresholds["pad"]:
        return Tier.PAD
    if ratio <= thresholds["safe"]:
        return Tier.SAFE
    if ratio <= thresholds["stable"]:
        return Tier.STABLE
    if ratio <= thresholds["rush"]:
        return Tier.RUSH
    return None


def estimate_probability(candidate_rank: int, ranks: list[int], k: float) -> float:
    """录取概率 0-100。以历年录取位次均值为锚，sigmoid 映射。"""
    if not ranks:
        return 0.0
    mean = sum(ranks) / len(ranks)
    if mean <= 0:
        return 0.0
    ratio = candidate_rank / mean
    prob = 100.0 / (1.0 + math.exp(k * (ratio - 1.0)))
    return round(max(0.0, min(100.0, prob)), 1)


def recommend(candidate_rank: int, school_history: list[tuple[int, list[int]]],
              settings) -> list[RecommendItem]:
    """对候选学校逐一分档+估概率，过滤掉不推荐（None）的。"""
    thresholds = {
        "pad": settings.tier_pad,
        "safe": settings.tier_safe,
        "stable": settings.tier_stable,
        "rush": settings.tier_rush,
    }
    prob_k = settings.prob_k
    items: list[RecommendItem] = []
    for school_id, ranks in school_history:
        if not ranks:
            continue
        mean = sum(ranks) / len(ranks)
        tier = classify_tier(candidate_rank, round(mean), thresholds)
        if tier is None:
            continue
        items.append(RecommendItem(
            school_id=school_id,
            tier=tier,
            probability=estimate_probability(candidate_rank, ranks, prob_k),
            rank_mean=mean,
            rank_min=min(ranks),
            rank_max=max(ranks),
        ))
    # 排序：冲 → 稳 → 保 → 垫；同档按概率降序
    order = {Tier.RUSH: 0, Tier.STABLE: 1, Tier.SAFE: 2, Tier.PAD: 3}
    items.sort(key=lambda it: (order[it.tier], -it.probability))
    return items
