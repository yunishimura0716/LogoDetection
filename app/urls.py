from django.urls import path
from . import views
from django.conf import settings
from django.conf.urls.static import static

app_name = 'app'
urlpatterns = [
    path('', views.Home.as_view(), name='home'),
    path('auto/', views.Auto.as_view(), name='auto'),
    path('handle/', views.Handle.as_view(), name='handle'),
    path('auto/ajax/', views.AjaxAuto.as_view(), name='ajaxauto')
]