from django.urls import path
from .views import RegisterView, LoginView, UserListView, UserDeleteView, reset_password_direct

urlpatterns = [
    path("register/", RegisterView.as_view(), name="register"),
    path("login/", LoginView.as_view(), name="login"),
    path("users/", UserListView.as_view(), name="user-list"),
    path("users/<int:id>/", UserDeleteView.as_view(), name="user-delete"),
    path("reset-password-direct/", reset_password_direct, name="reset-password-direct"),
]
