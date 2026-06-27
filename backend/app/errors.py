"""统一业务异常与错误码。"""


class BizError(Exception):
    def __init__(self, code: int, message: str):
        self.code = code
        self.message = message


# 错误码约定：1xxx 输入校验，2xxx 数据不存在，3xxx 算法
ERR_SCORE_OUT_OF_RANGE = BizError(1001, "分数超出该省一分一段表范围")
ERR_NO_RANK_DATA = BizError(2001, "无该省科类位次数据")
ERR_NO_CANDIDATE = BizError(3001, "无匹配候选学校")
