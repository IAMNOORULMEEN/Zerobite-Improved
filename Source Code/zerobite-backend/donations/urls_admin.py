from django.urls import path
from .views_admin import AdminUserListView, AdminDonationListView, AdminDonationDeleteView

urlpatterns = [
    path("admin/users/", AdminUserListView.as_view(), name="admin-user-list"),
    path("admin/donations/", AdminDonationListView.as_view(), name="admin-donation-list"),
    path("admin/donations/<int:pk>/", AdminDonationDeleteView.as_view(), name="admin-donation-delete"),
]
