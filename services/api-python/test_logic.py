from logic import calc_sum

def test_calc_sum_basic():
    assert calc_sum(10) == 55
    assert calc_sum(1) == 1

def test_calc_sum_zero():
    assert calc_sum(0) == 0

def test_calc_sum_large():
    # 测试大数字
    n = 10**10
    expected = n * (n + 1) // 2
    assert calc_sum(n) == expected

if __name__ == "__main__":
    # 简单的运行脚本
    test_calc_sum_basic()
    test_calc_sum_zero()
    test_calc_sum_large()
    print("All backend logic tests passed!")
