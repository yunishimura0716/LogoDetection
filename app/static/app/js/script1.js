 // using jQuery
        function getCookie(name) {
            var cookieValue = null;
            if (document.cookie && document.cookie != '') {
                var cookies = document.cookie.split(';');
                for (var i = 0; i < cookies.length; i++) {
                    var cookie = jQuery.trim(cookies[i]);
                    // Does this cookie string begin with the name we want?
                    if (cookie.substring(0, name.length + 1) == (name + '=')) {
                        cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                        break;
                    }
                }
            }
            return cookieValue;
        }
        var csrftoken = getCookie('csrftoken');

        function csrfSafeMethod(method) {
            // these HTTP methods do not require CSRF protection
            return (/^(GET|HEAD|OPTIONS|TRACE)$/.test(method));
        }
        $.ajaxSetup({
            crossDomain: false, // obviates need for sameOrigin test
            beforeSend: function(xhr, settings) {
                if (!csrfSafeMethod(settings.type)) {
                    xhr.setRequestHeader("X-CSRFToken", csrftoken);
                }
            }
        });

/* ------------------------------
 Loading イメージ表示関数
 引数： msg 画面に表示する文言
 ------------------------------ */
        function dispLoading(msg){
          // 引数なし（メッセージなし）を許容
          if( msg == undefined ){
            msg = "";
          }
          // 画面表示メッセージ
          var dispMsg = "<div class='loadingMsg'>" + msg + "</div>";
          // ローディング画像が表示されていない場合のみ出力
          if($("#loading").length == 0){
            $("body").append("<div id='loading'>" + dispMsg + "</div>");
          }
        }

/* ------------------------------
 Loading イメージ削除関数
 ------------------------------ */
        function removeLoading() {
            $("#loading").remove();
        }

//droparea 以外を適用させないようにする
var obj = $("#droparea");
$(document).on('dragenter', function (e)
{
    e.stopPropagation();
    e.preventDefault();
});
$(document).on('dragover', function (e)
{
  e.stopPropagation();
  e.preventDefault();
  obj.css('border', '3px #666 dashed');
});
$(document).on('drop', function (e)
{
    e.stopPropagation();
    e.preventDefault();
});

//main
 $(function() {
  $("#droparea").on({
    "dragenter dragover":function(e){
      e.preventDefault();
    },
    "drop":function(e){
      $('#viewimg').src = '';
      $('#image_cut').src = '';

      var file = e.originalEvent.dataTransfer.files[0];
      var fr1 = new FileReader();
      fr1.onload = function(e) {
        var blob=new Blob([e.target.result],{"type":file.type});
        var fr2 = new FileReader();
        fr2.onload = function(e) {
          var src=e.target.result;
          src=new Uint8Array(src);
          // var blob2 = new Blob( [new Uint8Array(src).buffer] );
          // var reader = new FileReader();
          // reader.readAsDataURL(blob2);
          // console.log(src)
          src=String.fromCharCode.apply("",src);
          // console.log(src)
          src=btoa(src);
          src="data:"+file.type+";base64,"+src;
          $("#viewimg").attr({"src":src,"alt":file.name}).appendTo('#viewarea');
          // $('viewimg').src = src;
        }
        fr2.readAsArrayBuffer(blob);
      }
      fr1.readAsArrayBuffer(file);
      e.preventDefault();
    },
  });
});

$(function() {
    $("#droparea").click(function () {
        var file = document.getElementById('file');
        let result = document.getElementById('viewimg');

        // File APIに対応しているか確認
        if(window.File && window.FileReader && window.FileList && window.Blob) {
            function loadLocalImage(e) {
                // ファイル情報を取得
                var fileData = e.target.files[0];
                // console.log(fileData); // 取得した内容の確認用

                // 画像ファイル以外は処理を止める
                if(!fileData.type.match('image.*')) {
                    alert('画像を選択してください');
                    return;
                }

                // FileReaderオブジェクトを使ってファイル読み込み
                var reader = new FileReader();
                // ファイル読み込みに成功したときの処理
                reader.onload = function() {
                    // console.log(reader.result)
                    result.src = reader.result;
                }
                // ファイル読み込みを実行
                reader.readAsDataURL(fileData);
            }
            file.addEventListener('change', loadLocalImage, false);

        } else {
            file.style.display = 'none';
            result.innerHTML = 'File APIに対応したブラウザでご確認ください';
        }
    })
})

//ajax
$(function() {
    $("#start").click(function () {
        let img = document.getElementById('viewimg');
        let threshold = document.getElementById('threshold');
        // console.log(threshold.value)
        // $('#threshold').val()
        try {
            if (img.src == ''){
                throw new Error('切り抜く画像を入力してください');
            }
            if (isNaN(threshold.value) && threshold.value != ''){
                throw new Error('0 ~ 255の数字を入力してください');
            }
            // else if (0<=Number(threshold.value)<=255 && threshold.value != ''){
            //     throw new Error('0 ~ 255の数字を入力してください');
            // }

            let image = $('#viewimg').attr('src');
            // console.log(image)
            const url = 'ajax/'

            // 処理前に Loading 画像を表示
            dispLoading("処理中...");

            let thres = '';
            if (threshold.value === ''){
               thres = 'nil';
            }
            else {
                thres = threshold.value
            }
            let reverse = document.getElementById('reverse');
            let trans = reverse.trans;
            // console.log(trans.value)
            // let invert = '';
            // invert = trans.value;


            const data = {};
            data.image = image;
            data.th = thres;
            data.re = trans.value;
            // data = {'image':image};
            // data.append("th", threshold);
            // console.log(data)

            $.ajax({
                url: url,
                // the endpoint,commonly same url
                type: "POST", // http method
                headers: {"X-CSRFToken": getCookie("csrftoken")},
                data: data,
                // data sent with the post request
                // handle a successful response
                success: function (json) {
                    // console.log(json['dis']);　// another sanity check

                    // Lading 画像を消す
                    removeLoading();
                    let image_cut = json['image'];
                    // console.log(image_cut)
                    threshold.value = ''
                    viewData(image_cut)
                    // console.log(json)
                },
                // handle a non-successful response
                error: function (xhr, errmsg, err) {
                    // Lading 画像を消す
                    removeLoading();
                    console.log(xhr.status + ": " + xhr.responseText); // provide a bit more info about the error to the console
                }
            });
        }catch(e){
            alert(e.message);
     }
    });
});

function viewData(image_data)  {

    let img = document.getElementById('image_cut');

    let output = document.getElementById('viewimg');
    //同じサイズをimgに指定
    let w = output.offsetWidth;
    let h = output.offsetHeight;
    img.setAttribute("width", w);
    img.setAttribute("height", h);

    //imgtag　に表示
    function setBase64() {
        img.src = image_data
    }
    setBase64()
};


(function () {
    let slider = document.getElementById('slider1');
    let output = document.getElementById('threshold');

    let input = slider.getElementsByTagName('input')[0];
    let root = document.documentElement;
    let dragging = false;
    let value = output.value; //初期位置
    let width = input.clientWidth / 2;

    let set_value = function () {
        //つまみのサイズ(input.clientWidth)だけ位置を調整
        input.style.left = (value - input.clientWidth/2) + 'px';
        output.value = value;
    };
    set_value();

    //目盛り部分をクリックしたとき
    slider.onclick = function(evt){
        dragging = true;
        document.onmousemove(evt);
        document.onmouseup();
    };

    //ドラッグ開始
    input.onmousedown = function (evt) {
        dragging = true;
        return false;
    };
    //ドラッグ終了
    document.onmouseup = function (evt) {
        if (dragging){
            dragging = false;
            output.value = value;
        }
    };
    document.onmousemove = function (evt) {
        if (dragging){
            //ドラッグ途中
            if(!evt){
                evt = window.event;
            }
            let left = evt.clientX;
            let rect = slider.getBoundingClientRect();
            //マウス座標とスライダーのいち関係で値を決める
            value = Math.round(left - rect.left - width);
            //スライダーからはみ出したとき
            if (value<0){
                value=0;
            } else if (value > slider.clientWidth){
                value = slider.clientWidth;
            }
            set_value();
            return false;
        }
    };
})();


// $(function(){
//     $("#save").on("click", function(){
//         let save = document.createElement('a');
//         save.href = $('#image_cut').att1r('src');
//         save.target = '_blank';
//         save.download = 'download.png'
//
//         let event = document.createEvent('Event');
//         event.initEvent('click', true, true);
//         save.dispatchEvent(event);
//         (window.URL || window.webkitURL).revokeObjectURL(save.href);
//     });
// });