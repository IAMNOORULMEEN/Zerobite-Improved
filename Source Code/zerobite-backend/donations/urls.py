from django.urls import path
from .views import (
    DonationListCreateAPIView, DonationRetrieveDestroyAPIView,
    DonationClaimAPIView, DonationUserStatsAPIView, OrderListCreateView
)

urlpatterns = [
    path('donations/', DonationListCreateAPIView.as_view(), name='donation-list-create'),
    path('donations/<int:pk>/', DonationRetrieveDestroyAPIView.as_view(), name='donation-detail-delete'),
    path('donations/<int:pk>/claim/', DonationClaimAPIView.as_view(), name='donation-claim'),
    path('donations/user_stats/', DonationUserStatsAPIView.as_view(), name='donation-user-stats'),
    path("donations/", DonationListCreateAPIView.as_view(), name="donations-list"),
    path("orders/", OrderListCreateView.as_view(), name="orders-list-create"),

]
