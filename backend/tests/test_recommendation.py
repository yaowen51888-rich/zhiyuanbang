import pytest
from types import SimpleNamespace

from app.services.recommendation import Tier, classify_tier, estimate_probability, recommend
from app.config import settings as real_settings

# 固定阈值，测试不依赖 config 默认值
TH = {"pad": 0.85, "safe": 0.95, "stable": 1.05, "rush": 1.15}


@pytest.mark.parametrize("ratio,expected", [
    (0.80, Tier.PAD),     # ratio <= 0.85 → 垫
    (0.85, Tier.PAD),     # 边界
    (0.90, Tier.SAFE),    # 0.85 < ratio <= 0.95 → 保
    (0.95, Tier.SAFE),    # 边界
    (1.00, Tier.STABLE),  # 0.95 < ratio <= 1.05 → 稳
    (1.05, Tier.STABLE),  # 边界
    (1.10, Tier.RUSH),    # 1.05 < ratio <= 1.15 → 冲
    (1.15, Tier.RUSH),    # 边界
    (1.20, None),         # 超过 → 不推荐
])
def test_classify_tier_boundaries(ratio, expected):
    mean = 1000
    assert classify_tier(int(mean * ratio), mean, TH) == expected


def test_probability_monotonic_and_range():
    # 位次越靠前（越小）概率越高
    p_low_rank = estimate_probability(800, [1000, 1000], k=8.0)   # ratio 0.8
    p_mid_rank = estimate_probability(1000, [1000, 1000], k=8.0)  # ratio 1.0
    p_high_rank = estimate_probability(1200, [1000, 1000], k=8.0) # ratio 1.2
    assert 0.0 <= p_low_rank <= 100.0
    assert p_low_rank > p_mid_rank > p_high_rank
    # ratio=1 时概率应接近 50
    assert 45 <= p_mid_rank <= 55


def test_recommend_filters_and_orders():
    # 考生位次 1000；四所学校历史录取位次不同 → 分属冲/稳/保，一所太远被过滤
    # ratio = 考生位次 / 录取位次均值；ratio > 1.15 被过滤
    # school 4: mean=800 → ratio=1.25 > 1.15 → 过滤
    history = [
        (1, [1100]),   # ratio 0.91 → 保
        (2, [1050]),   # ratio 0.95 → 保边界
        (3, [1000]),   # ratio 1.0 → 稳
        (4, [800]),    # ratio 1.25 → 过滤
    ]
    # 使用 SimpleNamespace 模拟 settings 对象，保持与 real_settings 属性一致
    mock_settings = SimpleNamespace(
        tier_pad=0.85,
        tier_safe=0.95,
        tier_stable=1.05,
        tier_rush=1.15,
        prob_k=8.0,
    )
    items = recommend(1000, history, mock_settings)
    ids = [it.school_id for it in items]
    assert 4 not in ids                      # 被过滤
    # 排序：冲 -> 稳 -> 保 -> 垫；同档按概率降序
    # school 2 (稳, prob≈59.4) 和 school 3 (稳, prob=50.0) 在前，然后 school 1 (保, prob≈67.4)
    assert ids[0] == 2                       # 稳-高概率在最前
    assert ids[1] == 3                       # 稳-低概率其次
    assert ids[2] == 1                       # 保在最后
    # 概率范围合理
    assert all(0.0 <= it.probability <= 100.0 for it in items)


def test_recommend_with_real_settings():
    """使用真实 settings 对象调用 recommend，验证接口兼容性。"""
    history = [
        (1, [1100]),   # 保
        (2, [1000]),   # 稳
        (3, [900]),    # 冲（ratio≈1.11）
    ]
    items = recommend(1000, history, real_settings)
    ids = [it.school_id for it in items]
    # 冲 -> 稳 -> 保
    assert ids == [3, 2, 1]
    assert all(0.0 <= it.probability <= 100.0 for it in items)
