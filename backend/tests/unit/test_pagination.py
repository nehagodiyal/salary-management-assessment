from app.schemas.pagination import PaginatedResponse, PaginationParams


def test_pagination_params_compute_offset():
    p = PaginationParams(page=1, page_size=20)
    assert p.skip == 0
    assert p.limit == 20

    p = PaginationParams(page=3, page_size=15)
    assert p.skip == 30


def test_paginated_response_build_computes_pages():
    resp = PaginatedResponse.build(items=[1, 2, 3], total=27, page=2, page_size=10)
    assert resp.pages == 3
    assert resp.page == 2
    assert resp.items == [1, 2, 3]


def test_paginated_response_with_zero_total():
    resp = PaginatedResponse.build(items=[], total=0, page=1, page_size=10)
    assert resp.pages == 0
    assert resp.items == []
