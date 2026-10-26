from django.urls import path
from .views import (
    DonationListCreateAPIView, DonationRetrieveDestroyAPIView,
    DonationClaimAPIView, DonationUserStatsAPIView, OrderListCreateView,
    OrderVerifyCodeView,RewardsAPIView,AdminStatsAPIView,
)

urlpatterns = [
    path('donations/', DonationListCreateAPIView.as_view(), name='donation-list-create'),
    path('donations/<int:pk>/', DonationRetrieveDestroyAPIView.as_view(), name='donation-detail-delete'),
    path('donations/<int:pk>/claim/', DonationClaimAPIView.as_view(), name='donation-claim'),
    path('donations/user_stats/', DonationUserStatsAPIView.as_view(), name='donation-user-stats'),
    path("donations/", DonationListCreateAPIView.as_view(), name="donations-list"),
    path("orders/", OrderListCreateView.as_view(), name="orders-list-create"),
    path("orders/<int:pk>/verify-code/", OrderVerifyCodeView.as_view(), name="order-verify-code"),
    path("rewards/", RewardsAPIView.as_view(), name="rewards"),
    path("admin/stats/", AdminStatsAPIView.as_view(), name="admin-stats"),
]
