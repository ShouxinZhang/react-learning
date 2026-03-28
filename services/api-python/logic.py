"""
纯业务逻辑 - 不涉及 HTTP/网络
"""

def calc_sum(n: int) -> int:
    """使用高斯求和公式计算 1 + 2 + ... + n，支持超大数字 $O(1)$"""
    return n * (n + 1) // 2
