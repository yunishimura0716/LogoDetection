from django.shortcuts import render
from django.views.generic import TemplateView, FormView
from .forms import ImageForm
import numpy as np
import cv2
from matplotlib import pyplot as plt
from PIL import Image, ImageDraw, ImageFilter
from django.http import JsonResponse, HttpResponse
import io
import base64


# Create your views here.


class Home(TemplateView):
    template_name = 'app/home.html'


class Auto(FormView):
    template_name = 'app/auto.html'
    form_class = ImageForm
    # success_url = '/'


class AjaxAuto(FormView):
    def post(self, request, *args, **kwargs):
        form = self.request.POST
        return self.form_valid(form)

    def form_invalid(self, form):
        # return self.render_to_response(self.get_context_data(form=form))
        return self.form_valid(form)

    def form_valid(self, form):
        image_base64 = form['image'].split(',')[1]
        img_bynary = base64.b64decode(image_base64)
        # バイナリーストリーム <- バイナリデータ
        img_binarystream = io.BytesIO(img_bynary)
        # PILイメージ　<- バイナリーストリーム
        img_pil = Image.open(img_binarystream).convert('RGB')

        # numpy配列(RGBA) <- PILイメージ
        img_org = np.asarray(img_pil)
        # numpy配列(RGB) <- numpy配列(RGBA)
        img = cv2.cvtColor(img_org, cv2.COLOR_BGR2RGB)

        img = cv2.cvtColor(img, cv2.COLOR_RGB2GRAY)

        threshold = form['th']
        reverse = form['re']
        if threshold == 'nil':
            # otsu + noise_remove
            blur = cv2.GaussianBlur(img, (5, 5), 0)
            if reverse == '0':
                ret4, th4 = cv2.threshold(blur, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)
            elif reverse == '1':
                ret4, th4 = cv2.threshold(blur, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
            # img trans for PIL
            # img_org = img_org[:, :, ::-1].copy()
            # img_org = Image.fromarray(img_org)
            # th4 = Image.fromarray(th4)
        else:
            # Otsu's thresholding
            threshold = int(threshold)
            if reverse == '0':
                ret4, th4 = cv2.threshold(img, threshold, 255, cv2.THRESH_BINARY_INV)
            elif reverse == '1':
                ret4, th4 = cv2.threshold(img, threshold, 255, cv2.THRESH_BINARY)

        th4 = Image.fromarray(th4)
        # img cut
        img_pil.putalpha(th4)

        # img cutted trans 'org' -> 'binary' -> 'base64'
        img_binary = io.BytesIO()
        img_pil.save(img_binary, format='png')
        img_b64 = base64.b64encode(img_binary.getvalue()).decode()
        data = {
            'image': 'data:image/png;base64,{}'.format(img_b64)
        }

        return JsonResponse(data)



class Handle(FormView):
    template_name = 'app/handle.html'
    form_class = ImageForm
