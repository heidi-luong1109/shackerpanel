var bt_file = {
    area: [], // Win视图大小
    loadT:null, // 加载load对象
    loadY:null, // 弹窗layer对象，仅二级弹窗
    vscode:null,
    file_table_arry:[], // 选中的文件列表
    timerM: null,      // 定时器
    is_update_down_list: true,
    is_recycle:false, // 是否开启回收站
    is_editor:false, // 是否处于重命名、新建编辑状态
    file_header:{'file_checkbox': 40,'file_name':'auto','file_accept':130,'file_size': 90,'file_mtime':155,'file_ps':'auto','file_operation':350,'file_tr':0,'file_list_header':0},
    file_operating:[], // 文件操作记录，用于前进或后退
    file_pointer:-1, // 文件操作指针，用于指定前进和后退的路径，的指针位数
    file_path:'C:/', // 文件目录
    file_page_num:bt.get_storage('local','showRow') || 100,//每页个数
    file_list: [], // 文件列表
    file_store_list:[], // 文件收藏列表
    file_store_current: 0, //文件收藏当前分类索引
    file_images_list:[], // 文件图片列表
    file_drop: null,   // 拖拽上传
    file_present_task: null,
    file_selection_operating: [],
    file_share_list:[],
    scroll_width:(function(){
        // 创建一个div元素
        var noScroll, scroll, oDiv = document.createElement('DIV');
        oDiv.style.cssText = 'position:absolute; top:-1000px; width:100px; height:100px; overflow:hidden;';
        noScroll = document.body.appendChild(oDiv).clientWidth;
        oDiv.style.overflowY = 'scroll';
        scroll = oDiv.clientWidth;
        document.body.removeChild(oDiv);
        return noScroll - scroll;
    }()),
    is_mobile:function(){
        if(navigator.userAgent.match(/mobile/i) || /(iPhone|iPad|iPod|iOS|Android)/i.test(navigator.userAgent)){
            layer.msg(navigator.userAgent.match(/mobile/i),{icon:2,time:0})
            return true;
        }
        return false;
    },
    method_list:{
        GetFileBody:lan.public.get_file_contents, // 获取文件内容
        DeleteDir:lan.public.deleting,
        DeleteFile:lan.public.deleting,
        GetDiskInfo:['system',lan.public.getting_disk_list],
        CheckExistsFiles:lan.files.check_same_name_file,
        GetFileAccess:lan.files.getting_permission_list,
        SetFileAccess:lan.public.config,
        DelFileAccess:lan.files.deleting_user,
        get_path_size:lan.files.getting_dir_size,
        add_files_store_types:lan.files.create_favorite,
        get_files_store:lan.files.getting_favorite,
        del_files_store:lan.files.unfavorite,
        dir_webshell_check:'目录查杀',
        file_webshell_check:'查杀文件',
        get_download_url_list:lan.files.getting_share_list,
        get_download_url_find:lan.files.getting_s_share_info,
        create_download_url:lan.files.create_share,
        remove_download_url:lan.files.cancel_share,
        add_files_store:lan.files.adding_favorite,
        CopyFile:lan.files.copy_the,
        MvFile:lan.files.mv_the,
        SetBatchData:lan.files.performing_bulk_opt,
        Get_Recycle_bin:lan.files.getting_recycle_list,
        get_path_premissions:lan.files.getting_permission_list,
        back_path_permissions:lan.files.setting_permission_list,
        get_all_back: lan.files.getting_permission_list,
        fix_permissions: lan.files.fix_permission,
        del_path_premissions: lan.files.deleting_permission,
    },
    file_drop:{
        f_path:null,
        startTime: 0,
        endTime:0,
        uploadLength:0, //上传数量
        splitSize: 1024 * 1024 * 2, //文件上传分片大小
        splitEndTime: 0,
        splitStartTime:0,
        fileSize:0,
        speedLastTime:0,
        filesList:[], // 文件列表数组
        errorLength:0, //上传失败文件数量
        isUpload:true, //上传状态，是否可以上传
        uploadSuspend:[],  //上传暂停参数
        isUploadNumber:800,//限制单次上传数量
        uploadAllSize:0, // 上传文件总大小
        uploadedSize:0, // 已上传文件大小
        updateedSizeLast:0,
        topUploadedSize:0, // 上一次文件上传大小
        uploadExpectTime:0, // 预计上传时间
        initTimer:0, // 初始化计时
        speedInterval:null, //平局速度定时器
        timerSpeed:0, //速度
        isLayuiDrop:false, //是否是小窗口拖拽
        uploading:false,
        is_webkit:(function(){
            if(navigator.userAgent.indexOf('WebKit') > -1) return true;
            return false;
        })(),
        init:function(){
            if($('#mask_layer').length == 0) {
                window.UploadFiles = function(){ bt_file.file_drop.dialog_view()};
                $("body").append($('<div class="mask_layer" id="mask_layer" style="position:fixed;top:0;left:0;right:0;bottom:0; background:rgba(255,255,255,0.6);border:3px #ccc dashed;z-index:99999999;display:none;color:#999;font-size:40px;text-align:center;overflow:hidden;"><span style="position: absolute;top: 50%;left: 50%;margin-left: -300px;margin-top: -40px;">Upload files to the current directory'+ (!this.is_webkit?'<i style="font-size:20px;font-style:normal;display:block;margin-top:15px;color:red;">The current browser does not support drag upload. Commend to use Chrome browser or WebKit kernel for browsing</i>':'') +'</span></div>'));
                this.event_relation(document.querySelector('#container'),document,document.querySelector('#mask_layer'));
            }
        },
        // 事件关联 (进入，离开，放下)
        event_relation:function(enter,leave,drop){
            var that = this,obj = Object.keys(arguments);
            for(var item in arguments){
                if(typeof arguments[item] == "object" && typeof arguments[item].nodeType != 'undefined'){
                    arguments[item] = {
                        el:arguments[item],
                        callback:null
                    }
                }
            }
            leave.el.addEventListener("dragleave",(leave.callback != null)?leave.callback:function(e){
                if(e.x == 0 && e.y == 0) $('#mask_layer').hide();
                e.preventDefault();
            },false);
            enter.el.addEventListener("dragenter", (enter.callback != null)?enter.callback:function(e){
                if(e.dataTransfer.items[0].kind == 'string') return false
                $('#mask_layer').show();
                that.isLayuiDrop = false;
                e.preventDefault();
            },false);
            drop.el.addEventListener("dragover",function(e){ e.preventDefault() }, false);
            drop.el.addEventListener("drop",(enter.callback != null)?drop.callback:that.ev_drop, false);
        },
    
        
        // 事件触发
        ev_drop:function(e){
            if(e.dataTransfer.items[0].kind == 'string') return false;
            if(!bt_file.file_drop.is_webkit){
                $('#mask_layer').hide();
                return false;
            }
            e.preventDefault();
            if(bt_file.file_drop.uploading){
                layer.msg('Uploading files, please wait...');
                return false;
            }
            var items = e.dataTransfer.items,time,num = 0;
                loadT = layer.msg('Getting upload files details, please wait...',{icon:16,time:0,shade:.3});
            bt_file.file_drop.isUpload = true;
            if(items && items.length && items[0].webkitGetAsEntry != null) {
                if(items[0].kind != 'file') return false;
            }
            if(bt_file.file_drop.filesList == null) bt_file.file_drop.filesList = []
            for(var i = bt_file.file_drop.filesList.length -1; i >= 0 ; i--){
                if(bt_file.file_drop.filesList[i].is_upload) bt_file.file_drop.filesList.splice(-i,1)
            }
            $('#mask_layer').hide();
            function update_sync(s){
                s.getFilesAndDirectories().then(function(subFilesAndDirs) {
                    return iterateFilesAndDirs(subFilesAndDirs, s.path);
                });
            }
    
            var iterateFilesAndDirs = function(filesAndDirs, path) {
                if(!bt_file.file_drop.isUpload) return false
                for (var i = 0; i < filesAndDirs.length; i++) {
                    if (typeof(filesAndDirs[i].getFilesAndDirectories) == 'function') {
                        update_sync(filesAndDirs[i])
                    } else {
                        if(num > bt_file.file_drop.isUploadNumber){
                            bt_file.file_drop.isUpload = false;
                            layer.msg(' '+ bt_file.file_drop.isUploadNumber +' items cannot upload, please compress first!。',{icon:2,area:'405px'});
                            bt_file.file_drop.filesList = [];
                            clearTimeout(time);
                            return false;
                        }
                        bt_file.file_drop.filesList.push({
                            file:filesAndDirs[i],
                            path:bt.get_file_path(path +'/'+ filesAndDirs[i].name).replace('//','/'),
                            name:filesAndDirs[i].name.replace('//','/'),
                            icon:bt_file.get_ext_name(filesAndDirs[i].name),
                            size:bt_file.file_drop.to_size(filesAndDirs[i].size),
                            upload:0, //上传状态,未上传：0、上传中：1，已上传：2，上传失败：-1
                            is_upload:false
                        });
                        bt_file.file_drop.uploadAllSize += filesAndDirs[i].size
                        clearTimeout(time);
                        time = setTimeout(function(){
                            layer.close(loadT);
                            bt_file.file_drop.dialog_view();
                        },100);
                        num ++;
                    }
                }
            }
            if('getFilesAndDirectories' in e.dataTransfer){
                e.dataTransfer.getFilesAndDirectories().then(function(filesAndDirs) {
                     return iterateFilesAndDirs(filesAndDirs, '/');
                });
            }
            
        },
        // 上传视图
        dialog_view:function(config){
            var that = this,html = '';
            this.f_path = bt_file.file_path;
            if(!$('.file_dir_uploads').length > 0){
                if(that.filesList == null) that.filesList = []
                for(var i =0; i<that.filesList.length; i++){
                    var item = that.filesList[i];
                   html +='<li><div class="fileItem"><span class="filename" title="File path:'+ (item.path + '/' + item.name).replace('//','/') +'&#10;File type:'+ item.file.type +'&#10;File size:'+ item.size +'"><i class="ico ico-'+ item.icon + '"></i>'+ (item.path + '/' + item.name).replace('//','/') +'</span><span class="filesize">'+ item.size +'</span><span class="fileStatus">'+ that.is_upload_status(item.upload) +'</span></div><div class="fileLoading"></div></li>';
                }
                var is_show = that.filesList.length > 11;
                layer.open({
                    type: 1,
                    closeBtn: 1,
                    maxmin:true,
                    area: ['550px','505px'],
                    btn:['Upload','Cancel'],
                    title: 'Upload files to【'+ bt.get_cookie('Path')  +'】--- Support breakpoint renewal',
                    skin:'file_dir_uploads',
                    content:'<div style="padding:15px 15px 10px 15px;"><div class="upload_btn_groud"><div class="btn-group"><button type="button" class="btn btn-primary btn-sm upload_file_btn">Upload file</button><button type="button" class="btn btn-primary  btn-sm dropdown-toggle" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false"><span class="caret"></span><span class="sr-only">Toggle Dropdown</span></button><ul class="dropdown-menu"><li><a href="#" data-type="file">Upload file</a></li><li><a href="#" data-type="dir">Upload path</a></li></ul></div><div class="file_upload_info" style="display:none;"><span>Total process&nbsp;<i class="uploadProgress"></i>, uploading&nbsp;<i class="uploadNumber"></i>,</span><span style="display:none">Upload fail&nbsp;<i class="uploadError"></i></span><span>Speed&nbsp;<i class="uploadSpeed">Getting</i>,</span><span>Expect time&nbsp;<i class="uploadEstimate">Getting</i></span><i></i></div></div><div class="upload_file_body '+ (html==''?'active':'') +'">'+ (html!=''?('<ul class="dropUpLoadFileHead" style="padding-right:'+ (is_show?'15':'0') +'px"><li class="fileTitle"><span class="filename">File name</span><span class="filesize">File size</span><span class="fileStatus">File status</span></li></ul><ul class="dropUpLoadFile list-list">'+ html +'</ul>'):'<span>Please drag the file here'+ (!that.is_webkit?'<i style="display: block;font-style: normal;margin-top: 10px;color: red;font-size: 17px;">The current browser does not support drag upload. Commend to use Chrome browser or WebKit kernel for browsing</i>':'') +'</span>') +'</div></div>',
                    success:function(){
                        $('#mask_layer').hide();
                        $('.file_dir_uploads .layui-layer-max').hide();
                        $('.upload_btn_groud .upload_file_btn').click(function(){$('.upload_btn_groud .dropdown-menu [data-type=file]').click()});
                        $('.upload_btn_groud .dropdown-menu a').click(function(){
                            var type = $(this).attr('data-type');
                            $('<input type="file" multiple="true" autocomplete="off" '+ (type == 'dir'?'webkitdirectory=""':'') +' />').change(function(e){
                                var files = e.target.files,arry = [];
                                for(var i=0;i<files.length;i++){
                                    var config = {
                                        file:files[i],
                                        path: bt.get_file_path('/' + files[i].webkitRelativePath).replace('//','/') ,
                                        icon:bt_file.get_ext_name(files[i].name),
                                        name:files[i].name.replace('//','/'),
                                        size:that.to_size(files[i].size),
                                        upload:0, //上传状态,未上传：0、上传中：1，已上传：2，上传失败：-1
                                        is_upload:true
                                    }
                                    that.filesList.push(config);
                                    bt_file.file_drop.uploadAllSize += files[i].size
                                }
                                that.dialog_view(that.filesList);
                            }).click();
                        });
                        var el = '';
                        that.event_relation({
                            el:$('.upload_file_body')[0],
                            callback:function(e){
                                if($(this).hasClass('active')){
                                    $(this).css('borderColor','#4592f0').find('span').css('color','#4592f0');
                                }
                            }
                        },{
                            el:$('.upload_file_body')[0],
                            callback:function(e){
                                if($(this).hasClass('active')){
                                    $(this).removeAttr('style').find('span').removeAttr('style');
                                }
                            }
                        },{
                            el:$('.upload_file_body')[0],
                            callback:function (e) {
                                var active = $('.upload_file_body');
                                if(active.hasClass('active')){
                                    active.removeAttr('style').find('span').removeAttr('style');
                                }
                                that.ev_drop(e);
                                that.isLayuiDrop = true;
                            }
                        });
                    },
                    yes:function(index, layero){
                        if(!that.uploading){
                            if(that.filesList.length == 0){
                                layer.msg('Please select file',{icon:0});
                                return false;
                            }
                            $('.layui-layer-btn0').css({'cursor':'no-drop','background':'#5c9e69'}).attr('data-upload','true').text('Uploading');
                            that.upload_file();
                            that.initTimer = new Date();
                            that.uploading = true;
                            //that.get_timer_speed();
                        }
                    },
                    btn2:function (index, layero){
                        if(that.uploading){
                            layer.confirm('Do you want to cancel the upload of files? It need to delete the uploaded files manually. Continue?',{title:'Cancel file upload',icon:0},function(indexs){
                                layer.close(index);
                                layer.close(indexs);
                            });
                            return false;
                        }else{
                            layer.close(index);
                        }
                    },
                    cancel:function(index, layero){
                        if(that.uploading){
                            layer.confirm('Do you want to cancel the upload of files? It need to delete the uploaded files manually. Continue?',{title:'Cancel file upload',icon:0},function(indexs){
                                layer.close(index);
                                layer.close(indexs);
                            });
                            return false;
                        }else{
                            layer.close(index);
                        }
                    },
                    end:function (){
                        // GetFiles(bt.get_cookie('Path'));
                        that.clear_drop_stauts(true);
                    },
                    min:function(){
                        $('.file_dir_uploads .layui-layer-max').show();
                        $('#layui-layer-shade'+$('.file_dir_uploads').attr('times')).fadeOut();
                    },
                    restore:function(){
                        $('.file_dir_uploads .layui-layer-max').hide();
                        $('#layui-layer-shade'+$('.file_dir_uploads').attr('times')).fadeIn();
                    }
                });
            }else{
                if(config == undefined && !that.isLayuiDrop) return false;
                if(that.isLayuiDrop) config = that.filesList;
                $('.upload_file_body').html('<ul class="dropUpLoadFileHead" style="padding-right:'+ (config.length>11?'15':'0') +'px"><li class="fileTitle"><span class="filename">File name</span><span class="filesize">File size</span><span class="fileStatus">File status</span></li></ul><ul class="dropUpLoadFile list-list"></ul>').removeClass('active');
                if(Array.isArray(config)){
                    for(var i =0; i<config.length; i++){
                        var item = config[i];
                        html +='<li><div class="fileItem"><span class="filename" title="File path:'+ item.path + '/' + item.name +'&#10;File type:'+ item.file.type +'&#10;Size:'+ item.size +'"><i class="ico ico-'+ item.icon + '"></i>'+ (item.path + '/' + item.name).replace('//','/')  +'</span><span class="filesize">'+ item.size +'</span><span class="fileStatus">'+ that.is_upload_status(item.upload) +'</span></div><div class="fileLoading"></div></li>';
                    }
                    $('.dropUpLoadFile').append(html);
                }else{
                    $('.dropUpLoadFile').append('<li><div class="fileItem"><span class="filename" title="File path:'+ (config.path + '/' + config.name).replace('//','/') +'&#10;File type:'+ config.type +'&#10;Size:'+ config.size +'"><i class="ico ico-'+ config.icon + '"></i>'+ (config.path + '/' + config.name).replace('//','/') +'</span><span class="filesize">'+ config.size +'</span><span class="fileStatus">'+ that.is_upload_status(config.upload) +'</span></div><div class="fileLoading"></div></li>');
                }
    
            }
        },
        // 上传单文件状态
        is_upload_status:function(status,val){
            if(val === undefined) val = ''
            switch(status){
                case -1:
                    return '<span class="upload_info upload_error" title="Fail'+ (val != ''?','+val:'') +'">Fail'+ (val != ''?','+val:'') +'</span>';
                break;                    
                case 0:
                    return '<span class="upload_info upload_primary">Waiting to upload</span>';
                break;   
                case 1:
                    return '<span class="upload_info upload_success">Uploaded</span>';
                break;
                case 2:
                    return '<span class="upload_info upload_warning">Uploading '+ val+'</span>';
                break;
                case 3:
                    return '<span class="upload_info upload_success">Stoped</span>';
                break;
            }
        },
        // 设置上传实时反馈视图
        set_upload_view:function(index,config){
            var item = $('.dropUpLoadFile li:eq('+ index +')'),that = this;
            var file_info = $('.file_upload_info');
            if($('.file_upload_info .uploadProgress').length == 0){
                $('.file_upload_info').html('<span>Total process&nbsp;<i class="uploadProgress"></i>,Uploading&nbsp;<i class="uploadNumber"></i>,</span><span style="display:none">Fail&nbsp;<i class="uploadError"></i></span><span>Speed&nbsp;<i class="uploadSpeed">Getting</i>,</span><span>Expect time&nbsp;<i class="uploadEstimate">Getting</i></span><i></i>');
            }
            file_info.show().prev().hide().parent().css('paddingRight',0);
            if(that.errorLength > 0) file_info.find('.uploadError').text('('+ that.errorLength +'份)').parent().show();
            file_info.find('.uploadNumber').html('('+ that.uploadLength +'/'+ that.filesList.length +')');
            file_info.find('.uploadProgress').html( ((that.uploadedSize / that.uploadAllSize) * 100).toFixed(2) +'%');
            if(config.upload === 1 || config.upload === -1){
                that.filesList[index].is_upload = true;
                that.uploadLength += 1;
                item.find('.fileLoading').css({'width':'100%','opacity':'.5','background': config.upload == -1?'#ffadad':'#20a53a21'});
                item.find('.filesize').text(config.size);
                item.find('.fileStatus').html(that.is_upload_status(config.upload,(config.upload === 1?('(Time:'+ that.diff_time(that.startTime,that.endTime) +')'):config.errorMsg)));
                item.find('.fileLoading').fadeOut(500,function(){
                    $(this).remove();
                    var uploadHeight = $('.dropUpLoadFile');
                    if(uploadHeight.length == 0) return false;
                    if(uploadHeight[0].scrollHeight > uploadHeight.height()){
                        uploadHeight.scrollTop(uploadHeight.scrollTop()+40);
                    }
                });
            }else{
                item.find('.fileLoading').css('width',config.percent);
                item.find('.filesize').text(config.upload_size +'/'+ config.size);
                item.find('.fileStatus').html(that.is_upload_status(config.upload,'('+ config.percent +')'));
            }
        },
        // 清除上传状态
        clear_drop_stauts:function(status){
            var time = new Date(),that = this;
            if(!status){
                try {
                    var s_peed  = bt_file.file_drop.to_size(bt_file.file_drop.uploadedSize / ((time.getTime() - bt_file.file_drop.initTimer.getTime()) / 1000))
                    $('.file_upload_info').html('<span>'+ this.uploadLength +' uploaded,'+ (this.errorLength>0?(this.errorLength +'failures, '):'') +'time'+ this.diff_time(this.initTimer,time) + ',speed '+ s_peed +'/s</span>').append($('<i class="ico-tips-close"></i>').click(function(){
                        $('.file_upload_info').hide().prev().show();
                    }));
                } catch (e) {
                    
                }
            }
            $('.layui-layer-btn0').removeAttr('style data-upload').text(lan.upload.upload);
            $.extend(bt_file.file_drop,{
                startTime: 0,
                endTime:0,
                uploadLength:0, //上传数量
                splitSize: 1024 * 1024 * 2, //文件上传分片大小
                filesList:[], // 文件列表数组
                errorLength:0, //上传失败文件数量
                isUpload:false, //上传状态，是否可以上传
                isUploadNumber:800,//限制单次上传数量
                uploadAllSize:0, // 上传文件总大小
                uploadedSize:0, // 已上传文件大小
                topUploadedSize:0, // 上一次文件上传大小
                uploadExpectTime:0, // 预计上传时间
                initTimer:0, // 初始化计时
                speedInterval:null, //平局速度定时器
                timerSpeed:0, //速度
                uploading:false
            });
            clearInterval(that.speedInterval);
        },
        // 上传文件,文件开始字段，文件编号
        upload_file:function(fileStart,index){
            if(fileStart == undefined && this.uploadSuspend.length == 0) fileStart = 0,index = 0;
            if(this.filesList.length === index){
                clearInterval(this.speedInterval);
                this.clear_drop_stauts();
                bt_file.reader_file_list({path:bt_file.file_path,is_operating:false});
                return false;
            }
            var that = this;
            that.splitEndTime = new Date().getTime()
            that.get_timer_speed()
    
            that.splitStartTime = new Date().getTime()
            var item = this.filesList[index],fileEnd = '';
            if(item == undefined) return false;
            fileEnd = Math.min(item.file.size, fileStart + this.splitSize),
            that.fileSize = fileEnd - fileStart
            form = new FormData();
            if(fileStart == 0){
                that.startTime = new Date();
                item = $.extend(item,{percent:'0%',upload:2,upload_size:'0B'});
            }
            form.append("f_path", this.f_path + item.path);
            form.append("f_name", item.name);
            form.append("f_size", item.file.size);
            form.append("f_start", fileStart);
            form.append("blob", item.file.slice(fileStart, fileEnd));
            that.set_upload_view(index,item);
            $.ajax({
                url:'/files?action=upload',
                type: "POST",
                data: form,
                async: true,
                processData: false,
                contentType: false,
                success:function(data){
                    if(typeof(data) === "number"){
                        that.set_upload_view(index,$.extend(item,{percent:(((data / item.file.size)* 100).toFixed(2)  +'%'),upload:2,upload_size:that.to_size(data)}));
                        if(fileEnd != data){
                            that.uploadedSize += data;
                        }else{
                            that.uploadedSize += parseInt(fileEnd - fileStart);  
                        }
    
                        that.upload_file(data,index);
                    }else{
                        if(data.status){
                            that.endTime = new Date();
                            that.uploadedSize += parseInt(fileEnd - fileStart);
                            that.set_upload_view(index,$.extend(item,{upload:1,upload_size:item.size}));
                            that.upload_file(0,index += 1);
                        }else{
                            that.set_upload_view(index,$.extend(item,{upload:-1,errorMsg:data.msg}));
                            that.errorLength ++;
                        }
                    }
                    
                },
                error:function(e){
                    if(that.filesList[index].req_error === undefined) that.filesList[index].req_error = 1
                    if(that.filesList[index].req_error > 2){
                        that.set_upload_view(index,$.extend(that.filesList[index],{upload:-1,errorMsg:e.statusText == 'error'?lan.public.network_err:e.statusText }));
                        that.errorLength ++;
                        that.upload_file(fileStart,index += 1)
                        return false;
                    }
                    that.filesList[index].req_error += 1;
                    that.upload_file(fileStart,index)
    
                    
                }
            });
        }, 
        // 获取上传速度
        get_timer_speed:function(speed){
            var done_time = new Date().getTime()
            if(done_time - this.speedLastTime > 1000){
                var that = this,num = 0;
                if(speed == undefined) speed = 200
                var s_time = (that.splitEndTime - that.splitStartTime) / 1000;
                that.timerSpeed = (that.fileSize / s_time).toFixed(2)
                that.updateedSizeLast = that.uploadedSize
                if(that.timerSpeed < 2) return;
    
                $('.file_upload_info .uploadSpeed').text(that.to_size(isNaN(that.timerSpeed)?0:that.timerSpeed)+'/s');
                var estimateTime = that.time(parseInt(((that.uploadAllSize - that.uploadedSize) / that.timerSpeed) * 1000))
                if(!isNaN(that.timerSpeed)) $('.file_upload_info .uploadEstimate').text(estimateTime.indexOf('NaN') == -1?estimateTime:'0 '+lan.bt.s);
                this.speedLastTime = done_time;
            }
        },
        time:function(date){
            var hours = Math.floor(date / (60 * 60 * 1000));
            var minutes = Math.floor(date / (60 * 1000));
            var seconds = parseInt((date % (60 * 1000)) / 1000);
            var result = seconds + 'sec';
            if(minutes > 0) {
                result = minutes + "min" + seconds  + 'sec';
            }
            if(hours > 0){
                result = hours + 'hour' + Math.floor((date - (hours * (60 * 60 * 1000))) / (60 * 1000))  + "min";
            }
            return result
        },
        diff_time: function (start_date, end_date) {
            var diff = end_date.getTime() - start_date.getTime();
            var minutes = Math.floor(diff / (60 * 1000));
            var leave3 = diff % (60 * 1000);
            var seconds = leave3 / 1000
            var result = seconds.toFixed(minutes > 0?0:2) + lan.bt.s;
            if (minutes > 0) {
                result = minutes + "min" + seconds.toFixed(0) + lan.bt.s
            }
            return result
        },
        
        to_size: function (a) {
            var d = [" B", " KB", " MB", " GB", " TB", " PB"];
            var e = 1024;
            for (var b = 0; b < d.length; b += 1) {
                if (a < e) {
                    var num = (b === 0 ? a : a.toFixed(2)) + d[b];
                    return (!isNaN((b === 0 ? a : a.toFixed(2))) && typeof num != 'undefined')?num:'0B';
                }
                a /= e
            }
        }
    },
    init:function(){        
        if (bt.get_cookie('rank') == undefined || bt.get_cookie('rank') == null || bt.get_cookie('rank') == 'a' || bt.get_cookie('rank') == 'b') {
            bt.set_cookie('rank', 'list');
        }
        this.area = [window.innerWidth, window.innerHeight];
        this.file_path = bt.get_cookie('Path');
        this.event_bind(); // 事件绑定
        this.reader_file_list({is_operating:true}); // 渲染文件列表
        this.render_file_disk_list(); // 渲染文件磁盘列表
        this.file_drop.init();  // 初始化文件上传
        this.set_file_table_width(); // 设置表格宽度
    },
    // 事件绑定
    event_bind: function(){
        var that = this;
        // 窗口大小限制
        $(window).resize(function(ev){
            if($(this)[0].innerHeight != that.area[1]){
                that.area[1] = $(this)[0].innerHeight;
                that.set_file_view();
            }
            if($(this)[0].innerWidth != that.area[0]){
                that.area[0] = $(this)[0].innerWidth;
                that.set_dir_view_resize();             //目录视图
                that.set_menu_line_view_resize();       //菜单栏视图
                that.set_file_table_width();            //设置表头宽度
            }
        }).keydown(function(e){ // 全局按键事件
            e = window.event || e;
            var keyCode = e.keyCode,tagName = e.target.tagName.toLowerCase();
            if(!that.is_editor){   //非编辑模式
                // Ctrl + v   粘贴事件
                if(e.ctrlKey && keyCode == 86 && tagName != 'input' && tagName != 'textarea'){
                    that.paste_file_or_dir();
                }
                // 退格键
                if(keyCode == 8 && tagName !== 'input' && tagName !== 'textarea' &&  typeof $(e.target).attr('data-backspace') === "undefined"){
                    $('.file_path_upper').click()
                }
            }
        });
        // 搜索事件绑定
        $('.search_path_views').find('.file_search_checked').unbind('click').click(function(){
            if($(this).hasClass('active')){
                $(this).removeClass('active')
            }else{
                $(this).addClass('active');
            }
        })
        // 搜索按钮
        $('.search_path_views').on('click','.path_btn',function(e){
            var _obj = {path:that.file_path,search:$('.file_search_input').val()}
            if($('#search_all').hasClass('active')) _obj['all'] = 'True'
            that.loadT = bt.load('Searching file, please wait...');
            that.reader_file_list(_obj,function(res){
                if(!res.msg){
                    that.loadT.close();
                }
            })
            $('.file_search_config').addClass('hide')
            e.stopPropagation();
        })
        $('.search_path_views').on('click','.file_search_config label',function(e){
            $(this).prev().click();
        });
        // 搜索框（获取焦点、回车提交）
        $('.search_path_views .file_search_input').on('focus keyup',function(e){
            e = e || window.event;
            var _obj = {path:that.file_path,search:$(this).val()};
            switch(e.type){
                case 'keyup':
                    var isCheck = $('.file_search_checked').hasClass('active')
                    if(isCheck) _obj['all'] = 'True'
                    if(e.keyCode != 13 && e.type == 'keyup') return false;
                    that.loadT = bt.load('Searching file, please wait...');
                    that.reader_file_list(_obj,function(res){
                        if(!res.msg){
                            that.loadT.close();
                        }
                    })
                break;
            }
            e.stopPropagation();
            e.preventDefault();
        })
        // 文件路径事件（获取焦点、失去焦点、回车提交）
        $('.file_path_input .path_input').on('focus blur keyup',function(e){
            e = e || window.event;
            var path = $(this).attr('data-path'),_this = $(this);
            switch(e.type){
                case 'focus':
                    $(this).addClass('focus').val(path).prev().hide();
                break;
                case 'blur':
                    $(this).removeClass('focus').val('').prev().show();
                break;
                case 'keyup':
                    if(e.keyCode != 13 && e.type == 'keyup') return false;
                    if($(this).data('path') != $(this).val()){
                        that.reader_file_list({path:that.path_check($(this).val()),is_operating:true},function(res){
                            if(res.status === false){
                                _this.val(path);
                            }else{
                                _this.val(that.path_check(res.PATH));
                                _this.blur().prev().show();
                            }
                        });
                    }
                break;
            }
            e.stopPropagation();
        });
        // 文件路径点击跳转
        $('.file_path_input .file_dir_view').on('click','.file_dir',function(){
            that.reader_file_list({path:$(this).attr('title'),is_operating:true});
        });

        // 文件操作前进或后退
        $('.forward_path span').click(function(){
            var index = $(this).index(),path = '';
            if(!$(this).hasClass('active')){
                switch(index){
                    case 0:
                        that.file_pointer = that.file_pointer - 1
                        path = that.file_operating[that.file_pointer];
                    break;
                    case 1:
                        that.file_pointer = that.file_pointer + 1
                        path = that.file_operating[that.file_pointer];
                    break;
                }
                that.reader_file_list({path:path,is_operating:false});
            }
        });

        //展示已隐藏的目录
        $('.file_path_input .file_dir_view').on('click','.file_dir_omit',function(e){
            var _this = this,new_down_list = $(this).children('.nav_down_list');
            $(this).addClass('active');
            new_down_list.addClass('show');
            $(document).one('click',function(){
                $(_this).removeClass('active');
                new_down_list.removeClass('show');
                e.stopPropagation();
            });
            e.stopPropagation();
        });
        //目录获取子级所有文件夹(箭头图标)
        $('.file_path_input .file_dir_view').on('click','.file_dir_item i',function(e){
            var children_list = $(this).siblings('.nav_down_list')
            var _path = $(this).siblings('span').attr('title');
            children_list.show().parent().siblings().find('.nav_down_list').removeAttr('style');
            that.render_path_down_list(children_list,_path);
            $(document).one('click',function(){
                children_list.removeAttr('style');
                e.stopPropagation();
            });
            e.stopPropagation();
        })
        //目录子级文件路径跳转（下拉）
        $('.file_path_input .file_dir_view').on('click','.file_dir_item .nav_down_list li',function(e){
            that.reader_file_list({path:$(this).data('path'),is_operating:true});
        });
        // 文件上一层
        $('.file_path_upper').click(function(){
            that.reader_file_list({path:that.retrun_prev_path(that.file_path),is_operating:true});
        });

        // 文件刷新
        $('.file_path_refresh').click(function(){
            that.reader_file_list({path:that.file_path},function(res){
                if(!res.msg) layer.msg('Refresh succeeded')
            });
        });
        $('.upload_file').on('click',function(e){
            that.file_drop.dialog_view();
        });
        // 下载
        $('.upload_download').on('click',function(e){
            that.open_download_view();
        });

        // 新建文件夹或文件
        $('.file_nav_view .create_file_or_dir li').on('click',function(e){
            var type = $(this).data('type'),nav_down_list = $('.create_file_or_dir .nav_down_list');
            nav_down_list.css({'display':function(){
                setTimeout(function(){nav_down_list.removeAttr('style')},100)
                return 'none';
            }});    
            if(!that.is_editor){
                that.is_editor = true;
                // 首位创建“新建文件夹、文件”
                $('.file_list_content').prepend('<div class="file_tr createModel active">'+
                    '<div class="file_td file_checkbox"></div>' +
                    '<div class="file_td file_name">' +
                        '<div class="file_ico_type"><i class="file_icon '+ (type == 'newBlankDir'?'file_folder':'') +'"></i></div>' +
                        (bt.get_cookie('rank') == 'icon'? '<span class="file_title file_'+ (type == 'newBlankDir'? 'dir':'file') +'_status"><textarea name="createArea" onfocus="select()">'+(type == 'newBlankDir'? 'New directory':'New blank file')+'</textarea></span>':'<span class="file_title file_'+ (type == 'newBlankDir'? 'dir':'file') +'_status"><input name="createArea" value="'+(type == 'newBlankDir'? 'New directory':'New blank file')+'" onfocus="select()" type="text"></span>')+
                    '</div>' +
                    '</div>'
                )

                // 输入增高、回车、焦点、失去焦点
                $((bt.get_cookie('rank') == 'icon'?'textarea':'input')+'[name=createArea]').on('input',function(){
                    if(bt.get_cookie('rank') == 'icon'){
                        this.style.height = 'auto';
                        this.style.height = this.scrollHeight + "px";
                    }
                }).keyup(function(e){
                    if(e.keyCode == 13) $(this).blur();
                }).blur(function(e){
                    var _val =  $(this).val().replace(/[\r\n]/g,"");
                    if(that.match_unqualified_string(_val)) return layer.msg('Name cannot contain /\\:*?"<>| symbol',{icon:2})
                    if(_val == '') _val = (type == 'newBlankDir'? 'New directory':'New blank file');
                    setTimeout(function(){    //延迟处理，防止Li再次触发
                        that.create_file_req({type:(type == 'newBlankDir' ? 'folder':'file'),path:that.file_path+'/'+_val},function(res){
                            if(res.status) that.reader_file_list({path:that.file_path});
                            layer.msg(res.msg,{icon:res.status?1:2});
                        })
                        $('.createModel').remove(); // 删除模板
                        that.is_editor = false;
                    },300)
                    e.preventDefault();
                }).focus();
            }else{
                return false;
            }
            e.stopPropagation();
            e.preventDefault();
        })
        // 收藏夹列表跳转
        $('.file_nav_view .favorites_file_path ul').on('click','li',function(e){
            var _href = $(this).data('path'),_type = $(this).data('type'),nav_down_list = $('.favorites_file_path .nav_down_list');
            if(_type == 'dir'){
                that.reader_file_list({path:_href,is_operating:true});
            }else{
                if($(this).data('null') != undefined) return false;
                var _file = $(this).attr('title').split('.'),_fileT = _file[_file.length -1],_fileE = that.determine_file_type(_fileT);
                switch(_fileE){
                    case 'text':
                        openEditorView(0,_href)
                    break;
                    case 'video':
                        that.open_video_play(_href);
                    break;
                    case 'images':
                        that.open_images_preview({filename:$(this).attr('title'),path:_href});
                    break;
                    default:
                        that.reader_file_list({path:that.retrun_prev_path(_href),is_operating:true});
                    break;
                }
            }
            //点击隐藏
            nav_down_list.css({'display':function(){
                setTimeout(function(){nav_down_list.removeAttr('style')},100)
                return 'none';
            }});
            e.stopPropagation();
            e.preventDefault();
        })
        // 打开终端
        $('.terminal_view').on('click',function(){
            web_shell();
        });
        
        // 分享列表
        $('.share_file_list').on('click',function(){
            that.open_share_view();
        })
        // 打开硬盘挂载的目录
        $('.mount_disk_list').on('click','.nav_btn',function(){
            var path = $(this).data('menu');
            that.reader_file_list({path:path,is_operating:true});
        });
        // 硬盘磁盘挂载
        $('.mount_disk_list').on('click','.nav_down_list li',function(){
            var path = $(this).data('disk'),disk_list = $('.mount_disk_list.thezoom .nav_down_list');
            disk_list.css({'display':function(){
                setTimeout(function(){disk_list.removeAttr('style')},100)
                return 'none';
            }});   
            that.reader_file_list({path:path,is_operating:true});
        });

        // 全部权限备份按钮
        $('.file_nav_view').on('click','.manage_backup',function(ev){
            that.manage_backup();
            ev.stopPropagation();
            ev.preventDefault();
        });
        // 回收站
        $('.file_nav_view').on('click','.recycle_bin',function(ev){
            that.recycle_bin_view();
            ev.stopPropagation();
            ev.preventDefault();
        });
        // 批量操作
        $('.file_nav_view .multi').on('click','.nav_btn_group',function(ev){
            var batch_type = $(this).data('type');
            if(typeof batch_type != 'undefined') that.batch_file_manage(batch_type);
            ev.stopPropagation();
            ev.preventDefault();
        });
        // 批量操作
        $('.file_nav_view .multi').on('click','.nav_btn_group li',function(ev){
            var batch_type = $(this).data('type');
            that.batch_file_manage(batch_type);
            ev.stopPropagation();
            ev.preventDefault();
        });
        // 全部粘贴按钮
        $('.file_nav_view').on('click','.file_all_paste',function(){
            that.paste_file_or_dir();
        });

        // 表头点击事件，触发排序字段和排序方式
        $('.file_list_header').on('click','.file_name,.file_size,.file_mtime,.file_accept,.file_user', function (e) {
            var _tid = $(this).attr('data-tid'),
                _reverse = $(this).find('.icon_sort').hasClass('active'),
                _active = $(this).hasClass('active');
            if (!$(this).find('.icon_sort').hasClass('active') && $(this).hasClass('active')) {
                $(this).find('.icon_sort').addClass('active');
            }else{
                $(this).find('.icon_sort').removeClass('active');
            }
            $(this).addClass('active').siblings().removeClass('active').find('.icon_sort').removeClass('active').empty();
            $(this).find('.icon_sort').html('<i class="iconfont icon-xiala"></i>');
            if (!_active) _reverse = true
            bt.set_cookie('files_sort', _tid);
            bt.set_cookie('name_reverse', _reverse ? 'True' : 'False');
            that.reader_file_list({reverse: _reverse ? 'True' : 'False',sort: _tid});
            return false;
        });

        // 设置排序显示
        $('.file_list_header .file_th').each(function (index, item) {
            var files_sort = bt.get_cookie('files_sort'),
                name_reverse = bt.get_cookie('name_reverse');
            if ($(this).attr('data-tid') === files_sort){
                $(this).addClass('active').siblings().removeClass('active').find('.icon_sort').removeClass('active').empty();
                $(this).find('.icon_sort').html('<i class="iconfont icon-xiala"></i>');
                if (name_reverse === 'False') $(this).find('.icon_sort').addClass('active');
            }
        });

        // 全选选中文件
        $('.file_list_header .file_check').on('click', function (e){
            var checkbox = parseInt($(this).data('checkbox'));
            switch(checkbox){
                case 0:
                    $(this).addClass('active').removeClass('active_2').data('checkbox',1);
                    $('.file_list_content .file_tr').addClass('active').removeClass('active_2');
                    $('.nav_group.multi').removeClass('hide');
                    $('.file_menu_tips').addClass('hide');
                    that.file_table_arry = that.file_list.slice();
                break;
                case 2:
                    $(this).addClass('active').removeClass('active_2').data('checkbox',1);
                    $('.file_list_content .file_tr').addClass('active');
                    $('.nav_group.multi').removeClass('hide');
                    $('.file_menu_tips').addClass('hide');
                    that.file_table_arry = that.file_list.slice();
                break;
                case 1:
                    $(this).removeClass('active active_2').data('checkbox',0);
                    $('.file_list_content .file_tr').removeClass('active');
                    $('.nav_group.multi').addClass('hide');
                    $('.file_menu_tips').removeClass('hide');
                    that.file_table_arry = [];
                break;
            }
            that.calculate_table_active();
        });
        // 文件勾选
        $('.file_list_content').on('click', '.file_checkbox', function (e) { //列表选择
            var _tr = $(this).parents('.file_tr'),index = _tr.data('index'),filename = _tr.data('filename');
            if(_tr.hasClass('active')){
                _tr.removeClass('active');
                that.remove_check_file(that.file_table_arry,'filename',filename);
            }else{
                _tr.addClass('active');
                _tr.attr('data-filename',that.file_list[index]['filename']);
                that.file_table_arry.push(that.file_list[index]);
            }
            that.calculate_table_active();
            e.stopPropagation();
        });
        
        // 文件列表滚动条事件
        $('.file_list_content').scroll(function(e){
            if($(this).scrollTop() == ($(this)[0].scrollHeight - $(this)[0].clientHeight)){
                $(this).prev().css('opacity',1);
                $(this).next().css('opacity',0);
            }else if($(this).scrollTop() > 0){
                $(this).prev().css('opacity',1);
            }else if($(this).scrollTop() == 0){
                $(this).prev().css('opacity',0);
                $(this).next().css('opacity',1);
            }
        });

        // 选中文件
        $('.file_table_view .file_list_content').on('click','.file_tr',function(e){
            if($(e.target).hasClass('foo_menu_title') || $(e.target).parents().hasClass('foo_menu_title')) return true;
            $(this).addClass('active').siblings().removeClass('active');
            that.file_table_arry = [that.file_list[$(this).data('index')]];
            that.calculate_table_active();
            e.stopPropagation();
            e.preventDefault();
        });

        // 打开文件的分享、收藏状态
        $('.file_table_view .file_list_content').on('click','.file_name .iconfont',function(e){
            var file_tr = $(this).parents('.file_tr'),index = file_tr.data('index'),data = that.file_list[index];
            data['index'] = index 
            if($(this).hasClass('icon-share1')){that.info_file_share(data);}
            if($(this).hasClass('icon-favorites')){that.cancel_file_favorites(data);}
            e.stopPropagation();
        });
        // 打开文件夹和文件 --- 双击
        $('.file_table_view .file_list_content').on('dblclick','.file_tr',function(e){
            var index = $(this).data('index'),data = that.file_list[index];
            if(
                $(e.target).hasClass('file_check') ||
                $(e.target).parents('.foo_menu').length > 0 ||
                $(e.target).hasClass('set_file_ps') ||
                that.is_editor
            ) return false;
            if(data.type == 'dir'){
                if(data['filename'] == 'Recycle_bin') return that.recycle_bin_view();
                that.reader_file_list({path:that.file_path + '/' + data['filename'],is_operating:true});
            }else{
                switch(data.open_type){
                    case 'text':
                        openEditorView(0,data.path)
                    break;
                    case 'video':
                        that.open_video_play(data);
                    break;
                    case 'images':
                        that.open_images_preview(data);
                    break;
                    case 'compress':
                        that.unpack_file_to_path(data)
                    break;
                }
            }
            e.stopPropagation();
            e.preventDefault(); 
        });

        // 打开文件夹或文件 --- 文件名单击
        $('.file_table_view .file_list_content').on('click','.file_title i,.file_ico_type .file_icon',function(e){
            var file_tr = $(this).parents('.file_tr'),index = file_tr.data('index'),data = that.file_list[index];
            if(data.type == 'dir'){
                if(data['filename'] == 'Recycle_bin') return that.recycle_bin_view();
                that.reader_file_list({path:that.file_path + '/' + data['filename'],is_operating:true});
            }else{
                layer.msg(data.open_type == 'compress'?'Double click to unzip the file':'Double click to edit the file');
            }
            e.stopPropagation();
            e.preventDefault();
        });

        // 禁用浏览器右键菜单
        $('.file_list_content').on('contextmenu',function(ev){
            if($(ev.target).attr('name') == 'createArea' || $(ev.target).attr('name') == 'rename_file_input'){
                return true
            }else{
                return false;
            }
        })

        // 禁用菜单右键默认浏览器右键菜单
        $('.selection_right_menu').on('contextmenu',function(ev){
            return false;
        });

        // 文件夹和文件鼠标右键
        $('.file_list_content').on('mousedown','.file_tr',function(ev){
            if(ev.which === 1 && ($(ev.target).hasClass('foo_menu_title') || $(ev.target).parents().hasClass('foo_menu_title'))){
                that.render_file_groud_menu(ev,this);
                $(ev.target).parent().addClass('foo_menu_click');
                $(this).siblings().find('.foo_menu').removeClass('foo_menu_click');
                $(this).addClass('active').siblings().removeClass('active');
            }else if(ev.which === 3 && !that.is_editor){
                if(that.file_table_arry.length > 1){
                    that.render_files_multi_menu(ev);
                }else{
                    that.render_file_groud_menu(ev,this);
                    $('.content_right_menu').removeAttr('style');
                    $(this).addClass('active').siblings().removeClass('active');
                }
            }else{return true}
            ev.stopPropagation();
            ev.preventDefault();
        });


        //设置单页显示的数量，默认为100，设置local本地缓存
        $('.filePage').on('change','.showRow',function(){
            var val = $(this).val();
            bt.set_cookie('showRow',val)
            that.reader_file_list({showRow:val,p:1,is_operating:false});
        });
        
        // 页码跳转
        $('.filePage').on('click','div:nth-child(2) a',function(e){
            var num = $(this).attr('href').match(/p=([0-9]+)$/)[1];
            that.reader_file_list({path:that.path,p:num})
            e.stopPropagation();
            e.preventDefault();
        })

        // 获取文件夹大小
        $('.file_list_content').on('click','.folder_size',function(e){
            var data =  that.file_list[$(this).parents('.file_tr').data('index')],_this = this;
            that.get_file_size({path:data.path},function(res){
                $(_this).text(bt.format_size(res.size));
            });
            e.stopPropagation();
            e.preventDefault();
        });
        // 获取目录总大小
        $('.filePage').on('click','#file_all_size',function(e){
            if(that.file_path === '/'){
                layer.tips('The current directory is root directory (/),calculate size will occupy<span class="bt_danger">massive server IO</span>,continue?',this,{tips:[1,'red'],time:5000});
                return false;
            }
            that.get_dir_size({path:that.file_path});
        })
        // 文件区域【鼠标按下】
        $('.file_list_content').on('mousedown',function(ev){
            if(
                $(ev.target).hasClass('file_checkbox') || 
                $(ev.target).hasClass('file_check') ||
                $(ev.target).hasClass('icon-share1') ||
                $(ev.target).hasClass('icon-favorites') ||
                ev.target.localName == 'i' ||
                $(ev.target).parents('.app_menu_group').length > 0 ||
                $(ev.target).hasClass('createModel') ||
                $(ev.target).hasClass('editr_tr') ||
                $(ev.target).attr('name') == 'createArea' ||
                $(ev.target).attr('name') == 'rename_file_input' ||
                $(ev.target).hasClass('set_file_ps') ||
                that.is_editor
            ) return true;
            if(ev.which == 3 && !that.is_editor){
                $('.selection_right_menu').removeAttr('style');
                that.render_file_all_menu(ev,this);
                return true;
            }                 //是否为右键
            $('.file_list_content').bind('mousewheel', function() {return false;});    //禁止滚轮(鼠标抬起时解绑)
            var container = $(this),                        //当前选区容器
                scroll_h = 0,
                con_t = container.offset().top,             //选区偏移上
                con_l = container.offset().left             //选区偏移左
            var startPos = {  //初始位置
                top: ev.clientY - $(this).offset().top,   
                left: ev.clientX - $(this).offset().left 
            };
            // 鼠标按下后拖动
            $(document).unbind('mousemove').mousemove(function(ev){
                // 鼠标按下后移动到的位置
                var endPos = {  
                    top:  ev.clientY - con_t > 0 && ev.clientY - con_t < container.height() ? ev.clientY - con_t : (ev.clientY - (con_t+container.height()) > 1 ?container.height():0),   
                    left: ev.clientX - con_l > 0 && ev.clientX - con_l < container.width() ? ev.clientX - con_l : (ev.clientX - (con_l+container.width()) > 1 ?container.width():0)
                }; 
                var fixedPoint = { // 设置定点  
                    top: endPos.top > startPos.top ? startPos.top : endPos.top,
                    left: endPos.left > startPos.left ? startPos.left : endPos.left
                };
                if(bt.get_cookie('rank') == 'list'){ //在列表模式下减去表头高度
                    fixedPoint.top = fixedPoint.top + 40
                }
                // 拖拽范围的宽高
                var w = Math.min(Math.abs(endPos.left - startPos.left), con_l + container.width() - fixedPoint.left);  
                var h = Math.min(Math.abs(endPos.top - startPos.top), con_t + container.height() - fixedPoint.top);

                // 超出选区上时
                if(ev.clientY - con_t < 0){
                    var beyond_t = Math.abs(ev.clientY - con_t);
                    container.scrollTop(container.scrollTop() - beyond_t)
                    if(container.scrollTop() != 0){
                        scroll_h += beyond_t
                    }
                    h = h+scroll_h
                }
                // 超出选区下时
                if(ev.clientY - (con_t + container.height()) > 1){
                    var beyond_b = ev.clientY - (con_t + container.height());
                    container.scrollTop(container.scrollTop() + beyond_b)
                    if(container[0].scrollHeight - container[0].scrollTop !== container[0].clientHeight){
                        scroll_h += beyond_b
                    }
                    h = h+ scroll_h
                    fixedPoint.top = fixedPoint.top-scroll_h
                }
                if(startPos.top == endPos.top || startPos.left == endPos.left) return true;
                // 设置拖拽盒子位置
                that.enter_files_box().show().css({
                    left: fixedPoint.left+'px',
                    top: fixedPoint.top+'px',  
                    width: w+'px',
                    height: h+'px'
                });
                
                var box_offset_top = that.enter_files_box().offset().top;  
                var box_offset_left = that.enter_files_box().offset().left;  
                var box_offset_w = that.enter_files_box().offset().left + that.enter_files_box().width();  
                var box_offset_h = that.enter_files_box().offset().top + that.enter_files_box().height();
                $(container).find('.file_tr').each(function(i,item){
                    var offset_top = $(item).offset().top;
                    var offset_left = $(item).offset().left;
                    var offset_h = $(item).offset().top + $(item).height();
                    var offset_w = $(item).offset().left + $(item).width();
                    if(bt.get_cookie('rank') == 'icon'){   // 为Icon模式时
                        if(offset_w >= box_offset_left && offset_left <= box_offset_w && offset_h >= box_offset_top && offset_top <= box_offset_h){
                            $(item).addClass('active');
                        }else{
                            $(item).removeClass('active')
                        }
                    }else{// 为List模式时
                        if (offset_w >= box_offset_left && offset_h >= box_offset_top && offset_top <= box_offset_h ) { 
                            $(item).addClass('active')
                        }else{
                            $(item).removeClass('active')
                        }
                    }
                });
            })
            
            // 鼠标抬起
            $(document).on('mouseup',function(){
                var _move_array = [];
                var box_offset_top = that.enter_files_box().offset().top;  
                var box_offset_left = that.enter_files_box().offset().left;  
                var box_offset_w = that.enter_files_box().offset().left + that.enter_files_box().width();  
                var box_offset_h = that.enter_files_box().offset().top + that.enter_files_box().height();
                $(container).find('.file_tr').each(function(i,item){
                    var offset_top = $(item).offset().top;
                    var offset_left = $(item).offset().left;
                    var offset_h = $(item).offset().top + $(item).height();
                    var offset_w = $(item).offset().left + $(item).width();

                    if(bt.get_cookie('rank') == 'icon'){   // 为Icon模式时
                        if(offset_w >= box_offset_left && offset_left <= box_offset_w && offset_h >= box_offset_top && offset_top <= box_offset_h){
                            _move_array.push($(item).data('index'))
                        }
                    }else{// 为List模式时
                        if (offset_w >= box_offset_left && offset_h >= box_offset_top && offset_top <= box_offset_h ) { 
                            _move_array.push($(item).data('index'))
                        }
                    }
                });
                that.render_file_selected(_move_array);  //渲染数据
                that.enter_files_box().remove();         //删除盒子
                $('.file_list_content').unbind('mousewheel');  //解绑滚轮事件
            })
            ev.stopPropagation();
            ev.preventDefault();
        })
        // 备注设置
        $('.file_list_content').on('blur','.set_file_ps',function(ev){
            var tr_index = $(this).parents('.file_tr').data('index'),item = that.file_list[tr_index],nval = $(this).val(),oval = $(this).data('value'),_this = this;
            if(nval == oval) return false;
            bt_tools.send('files/set_file_ps',{filename:item.path,ps_type:0,ps_body:nval},function(rdata){
                $(_this).data('value',nval);
            },{tips:'Set ps',tips:true});
        });
        // 备注回车事件 
        $('.file_list_content').on('keyup','.set_file_ps',function(ev){
            if(ev.keyCode == 13){
                $(this).blur();
            }
            ev.stopPropagation();
        });
        // 表头拉伸
        $('.file_list_header').on('mousedown','.file_width_resize',function(ev){
            return false;
            if(ev.which == 3) return false;
            var th = $(this),Minus_v = $(this).prev().offset().left,_header = $('.file_list_header').innerWidth(),maxlen = 0;
            maxlen = _header - $('.file_main_title').data
            $(document).unbind('mousemove').mousemove(function(ev){
                var thatPos = ev.clientX - Minus_v;
                that.set_style_width(th.prev().data('tid'),thatPos);
            })
            $(document).one('mouseup',th,function(ev){
                $(document).unbind('mousemove');
            })
            ev.stopPropagation();
            ev.preventDefault();
        })
        // 视图调整
        $('.cut_view_model').on('click',function(){
            var type = $(this).data('type');
            $('.file_table_view').addClass(type == 'icon'?'icon_view':'list_view').removeClass(type != 'icon'?'icon_view':'list_view').scrollLeft(0);
            bt.set_cookie('rank',type);
            $(this).addClass('active').siblings().removeClass('active');
        });
        //老版快捷操作
        $('.file_list_content').on('click','.set_operation_group a',function(ev){
            var data = $(this).parents('.file_tr').data(),type = $(this).data('type'),item = that.file_list[data.index]
            if(type == 'more') return true;
            item.open = type;
            item.index = data.index;
            item.type_tips = item.type == 'file'?'File':'Directory';
            that.file_groud_event(item);
        });
    },
    /**
     * @descripttion: 文件拖拽范围
     * @author: Lifu
     * @return: 拖拽元素
     */
    enter_files_box:function(){
        if($('#web_mouseDrag').length == 0){
            $('<div></div>',{id:'web_mouseDrag', style: [
                'position:absolute; top:0; left:0;',  
                'border:1px solid #072246; background-color: #cce8ff;',  
                'filter:Alpha(Opacity=15); opacity:0.15;',  
                'overflow:hidden;display:none;z-index:9;'  
            ].join('')}).appendTo('.file_table_view');
        }
        return $('#web_mouseDrag');
    },
    /**
     * @description 清除表格选中数据和样式
     * @returns void
     */
    clear_table_active:function(){
        this.file_table_arry = [];
        $('.file_list_header .file_check').removeClass('active active_2');
        $('.file_list_content .file_tr').removeClass('active app_menu_operation');
        $('.file_list_content .file_tr .file_ps .foo_menu').removeClass('foo_menu_click');
        $('.app_menu_group').remove();
    },
    /**
     * @description 计算表格中选中
     * @returns void
     */
    calculate_table_active:function(){
        var that = this,header_check = $('.file_list_header .file_check');
        //判断数量
        if(this.file_table_arry.length == 0){
            header_check.removeClass('active active_2').data('checkbox',0);
        }else if(this.file_table_arry.length == this.file_list.length){
            header_check.addClass('active').removeClass('active_2').data('checkbox',1);
        }else{
            header_check.addClass('active_2').removeClass('active').data('checkbox',2);
        }
        //数量大于0开启键盘事件
        if(this.file_table_arry.length > 0){
            $(document).unbind('keydown').on('keydown',function(e){
                var keyCode = e.keyCode,tagName = e.target.localName.toLowerCase(),is_mac = window.navigator.userAgent.indexOf('Mac') > -1
                if(tagName == 'input' || tagName == 'textarea' ) return true;
                // Ctrl + c   复制事件
                if(e.ctrlKey && keyCode == 67){
                    if(that.file_table_arry.length == 1){
                        that.file_groud_event($.extend(that.file_table_arry[0],{open:'copy'}));
                        $('.file_all_paste').removeClass('hide');
                    }else if(that.file_table_arry.length > 1){
                        that.batch_file_manage('copy') //批量
                    }
                }
                // Ctrl + x   剪切事件
                if(e.ctrlKey && keyCode == 88){
                    if(that.file_table_arry.length == 1){
                        that.file_groud_event($.extend(that.file_table_arry[0],{open:'shear'}));
                        $('.file_all_paste').removeClass('hide');
                    }else if(that.file_table_arry.length > 1){
                        that.batch_file_manage('shear') //批量
                    }
                }
            })
            //数量超过一个显示批量操作
            if(this.file_table_arry.length > 1){
                $('.nav_group.multi').removeClass('hide');
                $('.file_menu_tips').addClass('hide');
            }else{
                $('.nav_group.multi').addClass('hide');
                $('.file_menu_tips').removeClass('hide');
            }
        }else{
            $('.nav_group.multi').addClass('hide');
            $('.file_menu_tips.multi').removeClass('hide');
            $(document).unbind('keydown');
        }
        $('.selection_right_menu,.file_path_input .file_dir_item .nav_down_list').removeAttr('style');     // 删除右键样式、路径下拉样式
        that.set_menu_line_view_resize();
    },
    /**
     * @description 设置文件路径视图自动调整
     * @returns void
    */
    set_dir_view_resize:function(){
        var file_path_input = $('.file_path_input'),file_dir_view = $('.file_path_input .file_dir_view'),_path_width = file_dir_view.attr('data-width'),file_item_hide = null;
        if(_path_width){
            parseInt(_path_width);
        }else{
            _path_width = file_dir_view.width();
            file_dir_view.attr('data-width',_path_width);
        }
        if(file_dir_view.width() - _path_width < 90){
            var width = 0;
            $($('.file_path_input .file_dir_view .file_dir_item').toArray().reverse()).each(function(){
                var item_width = 0;
                if(!$(this).attr('data-width')){
                    $(this).attr('data-width',$(this).width());
                    item_width = $(this).width();
                }else{
                    item_width = parseInt($(this).attr('data-width'));
                }
                width += item_width;
                if((file_path_input.width() - width) <= 90){
                    $(this).addClass('hide');
                }else{
                    $(this).removeClass('hide');
                }
            });
        }
        var file_item_hide = file_dir_view.children('.file_dir_item.hide').clone(true);
        if(file_dir_view.children('.file_dir_item.hide').length == 0){
            file_path_input.removeClass('active').find('.file_dir_omit').addClass('hide');
        }else{
            file_item_hide.each(function(){
                if($(this).find('.glyphicon-hdd').length == 0){
                    $(this).find('.file_dir').before('<span class="file_dir_icon"></span>');
                }
            });
            file_path_input.addClass('active').find('.file_dir_omit').removeClass('hide');
            file_path_input.find('.file_dir_omit .nav_down_list').empty().append(file_item_hide);
            file_path_input.find('.file_dir_omit .nav_down_list .file_dir_item').removeClass('hide');
        }
    },
    /**
     * @descripttion 设置菜单栏视图自动调整
     * @return: 无返回值
     */
    set_menu_line_view_resize:function(){
        //menu_width 菜单栏宽度、all_group所有按钮组宽度
        var menu_width = $('.file_nav_view').width(),disk_list_width = 0,batch_list_width = 0,_width = 0,disk_list = $('.mount_disk_list'),batch_list = $('.nav_group.multi');
        if(!disk_list.attr('data-width')) disk_list.attr('data-width',disk_list.innerWidth());
        if(!batch_list.attr('data-width') && batch_list.innerWidth() != 0 && batch_list.innerWidth() != -1){
            batch_list.attr('data-width',batch_list.innerWidth())
        }
        disk_list_width = parseInt(disk_list.attr('data-width'));
        batch_list_width = parseInt(batch_list.attr('data-width'));
        $('.file_nav_view>.nav_group').not('.mount_disk_list').each(function(){ 
            _width += $(this).innerWidth();
        });
        _width += $('.menu-header-foot').innerWidth();
        if(menu_width - _width < (disk_list_width+5)){
            $('.nav_group.mount_disk_list').addClass('thezoom').find('.disk_title_group_btn').removeClass('hide');
        }else{
            $('.nav_group.mount_disk_list,.nav_group.multi').removeClass('thezoom');
        }
        if(this.area[0] <  1700){
            indexs = Math.ceil(((1700 - this.area[0]) / 68));
            $('.batch_group_list>.nav_btn_group').each(function(index){
                if(index >= $('.batch_group_list>.nav_btn_group').length - (indexs+2)){
                    $(this).hide();
                }else{
                    $(this).show();
                }
            });
            $('.batch_group_list>.nav_btn_group:last-child').removeClass('hide').show();
        }else{
            $('.batch_group_list>.nav_btn_group').css('display','inline-block');
            $('.batch_group_list>.nav_btn_group:last-child').addClass('hide');
        }
    },
    /**
     * @description 设置文件前进或后退状态
     * @returns void
     */
    set_file_forward:function(){
        var that = this,forward_path = $('.forward_path span');
        if(that.file_operating.length == 1){
            forward_path.addClass('active');
        }else if(that.file_pointer == that.file_operating.length -1){
            forward_path.eq(0).removeClass('active');
            forward_path.eq(1).addClass('active');
        }else if(that.file_pointer == 0){
            forward_path.eq(0).addClass('active');
            forward_path.eq(1).removeClass('active');
        }else{
            forward_path.removeClass('active');
        }
    },
    /**
     * @description 设置文件视图
     * @returns void
     */
    set_file_view:function(){
        var file_list_content = $('.file_list_content'),height = this.area[1] - $('.file_table_view')[0].offsetTop - 170;
        $('.file_bodys').height(this.area[1] - 100);
        if((this.file_list.length * 50) > height){
            file_list_content.attr('data-height',file_list_content.data('height') || file_list_content.height()).css({'overflow':'hidden','overflow-y':'auto','height':height+'px'});
            $('.file_shadow_bottom').css('opacity',1);
        }else{
            file_list_content.css({'overflow':'hidden','overflow-y':'auto','height':height+'px'});
            $('.file_shadow_top,.file_shadow_bottom').css('opacity',0);
        }
    },
    /**
     * @description 打开分享列表
     * @returns void
     */
    open_share_view:function(){
        var that = this;
        layer.open({
            type: 1,
		    shift: 5,
		    closeBtn: 2,
		    area: ['850px','580px'],
		    title: 'Share list',
            content: '<div class="divtable mtb10 download_table" style="padding:5px 10px;">\
                    <table class="table table-hover" id="download_url">\
                        <thead><tr><th width="230px">Share name</th><th width="300px">Share address</th><th>Expiration date</th><th style="text-align:right;width:120px;">Opt</th></tr></thead>\
                        <tbody class="download_url_list"></tbody>\
                    </table>\
                    <div class="page download_url_page"></div>\
            </div>',
            success:function(){
                that.render_share_list();
                
                // 分享列表详情操作
                $('.download_url_list').on('click','.info_down',function(){
                    var indexs = $(this).attr('data-index');
                    that.file_share_view(that.file_share_list[indexs],'list');
                });
                
                // 分页
                $('.download_table .download_url_page').on('click','a',function(e){
                    var _href =  $(this).attr('href').match(/p=([0-9]+)$/)[1]
                    that.render_share_list({p:_href});
                    e.stopPropagation();
                    e.preventDefault();
                });
            }
        })
    },
    /**
     * @description 渲染分享列表
     * @param {Number} page 分页
     * @returns void
     */
    render_share_list:function(param){
        var that = this,_list = ''
        if(typeof param == 'undefined') param = {p:1}
        bt_tools.send('files/get_download_url_list',param,function(res){
            that.file_share_list = res.data;
            if(res.data.length > 0){
                $.each(res.data,function(index,item){
                    _list += '<tr>'
                        +'<td><span style="width:230px;white-space: nowrap;overflow: hidden;text-overflow: ellipsis;display: inline-block;" title="'+ item.ps +'">'+ item.ps +'</span></td>'
                        +'<td><span style="width:300px;white-space: nowrap;overflow:hidden;text-overflow: ellipsis;display: inline-block;" title="'+ item.filename +'">'+ item.filename +'</span></td>'
                        +'<td><span>'+ bt.format_data(item.expire) +'</span></td>'
                        +'<td style="text-align:right;">'
                            +'<a href="javascript:;" class="btlink info_down" data-id="'+ item.id +'" data-index="'+index+'">Details</a>&nbsp;|&nbsp;'
                            +'<a href="javascript:;" class="btlink del_down" data-id="'+ item.id +'" data-index="'+index+'" data-ps="'+ item.ps +'">Close</a>'
                        +'</td></tr>'
                })
            }else{
                _list = '<tr><td colspan="4">No share data</td></tr>'
            }
			$('.download_url_list').html(_list);
            $('.download_url_page').html(res.page);
            // 删除操作
            $('.download_table').on('click','.del_down',function(){
                var id = $(this).attr('data-id'),_ps = $(this).attr('data-ps');
                that.remove_download_url({id:id,fileName:_ps},function(res){
                    if(res.status) that.render_share_list(param)
                    layer.msg(res.msg,{icon:res.status?1:2})
                });
            });
        },'Share list');
    },

    /**
     * @description 删除选中数据
     * @param {Array} arry
     * @param {*} value 
     * @return void
    */
    remove_check_file:function(arry,key,value){
        var len = arry.length;
        while(len--){
            if(arry[len][key] == value) arry.splice(len,1)
        }
    },

    /**
     * @description 打开文件下载视图
     * @return void
    */
    open_download_view:function(){
        var that = this;
        that.reader_form_line({
            url:'DownloadFile',
            beforeSend:function(data){
                return {url:data.url,path:data.path,filename:data.filename};
            },
            overall:{width:'310px'},
            data:[
                {label:'URL address:', name:'url', placeholder:'URL address', value:'http://',eventType:['input','focus'],input:function(){
                    var value = $(this).val(),url_list = value.split('/');
                    $('[name="filename"]').val(url_list[url_list.length-1]);
                }},
                {label:'Download to:', name:'path', placeholder:'Download to', value:that.file_path},
                {label:'File name:', name:'filename', placeholder:'Save file name', value:'',eventType:'enter',enter:function(){
                    $('.download_file_view .layui-layer-btn0').click();
                }}
            ]
        },function(form,html){
            var loadT = bt.open({
                type:1,
                title:'Download file',
                area: '500px',
                shadeClose: false,
                skin:'download_file_view',
                content:html[0].outerHTML,
                btn:['Comfirm','Close'],
                success:function(){
                    form.setEvent();
                },
                yes:function(indexo,layero){
                    var ress = form.getVal();
                    if(!bt.check_url(ress.url)){
                        layer.msg('Please enter valid URL address..',{icon:2})
                        return false;
                    }
                    form.submitForm(function(res){
                        that.render_present_task_list();
                        layer.msg(res.msg,{icon:res.status?1:2})
                        loadT.close();
                    });
                }
            });
        });
    },

    /**
     * @description 设置样式文件
     * @param {String} type 表头类型
     * @param {Number} width 宽度
     * @return void 
     */
    set_style_width: function (type, width) {
        var _content = bt.get_cookie('formHeader') || $('#file_list_info').html(),_html = '',_reg = new RegExp("\\.file_" + type + "\\s?\\{width\\s?\\:\\s?(\\w+)\\s\\!important;\\}","g"),_defined_config = {name:150,type:80,size:80,mtime:150,accept:80,user:80,ps:150};
        _html = _content.replace(_reg, function (match, $1, $2, $3) {
            return '.file_' + type + '{width:' + ( width < 80?_defined_config[type]+'px':width+'px') +' !important;}'
        });
        $('#file_list_info').html(_html);
    },

    /**
     * @description 设置文件表格
     * @return void
    */
    set_file_table_width:function(){
        var that = this,file_header_width = $('.file_table_view')[0].offsetWidth,auto_num = 0,width = 0,auto_all_width = 0,css = '',_width = 0,tr_heigth = 45,other = '',config ={};
        $.each(this.file_header,function(key,item){
            if(item == 'auto'){ 
                auto_num ++;
                config[key] = 0;
            }else{
                width += item;
                css += '.'+key+'{width:'+ (key != 'file_operation'?item:item - 16)  +'px !important;}';
            }
        });
        if(this.is_mobile) $('.file_operation.file_th').attr('style','margin-right:-10px !important;');
        if((this.file_list.length * tr_heigth) > $('.file_list_content').height()){
            config['file_tr'] = file_header_width - (this.is_mobile?0:this.scroll_width);
            file_header_width = file_header_width;
            other += '.file_td.file_operation{width:'+ (this.file_header['file_operation'] - (this.is_mobile?0:this.scroll_width) - 10) +'px !important;}';
            other += '.file_th.file_operation{padding-right:'+ (10 + (this.is_mobile?0:this.scroll_width)) +'px !important}';
        }else{
            file_header_width = file_header_width;
            config['file_tr'] = file_header_width;
            if(this.is_mobile)  other += '.file_td.file_operation{width:' + (this.file_header['file_operation'] -20) +'px !important;}';
        }
        config['file_list_header'] = file_header_width;
        auto_all_width = file_header_width - width;
        _width = auto_all_width / auto_num;
        $.each(config,function(key,item){
            css += '.'+ key +'{width:'+ (item == 0?_width:item) +'px !important;}';
        });
        $('#file_list_info').html(css + other);
    },

    /**
     * @description 渲染路径列表
     * @param {Function} callback 回调函数
     * @return void
    */
    render_path_list: function (callback){
        var that = this,html = '<div class="file_dir_omit hide" title="Expand hidden directories"><span></span><i class="iconfont icon-zhixiang-zuo"></i><div class="nav_down_list"></div></div>', path_before = '',dir_list = this.file_path.split("/").splice(1),first_dir = this.file_path.split("/")[0];
        if(bt.os === 'Windows'){
            if(dir_list.length == 0) dir_list = [];
            dir_list.unshift('<span class="glyphicon glyphicon-hdd"></span><span class="ml5">Local disk ('+ first_dir +')</span>');
        }else{
            if(this.file_path == '/') dir_list = [];
            dir_list.unshift('Root dir');
        }
        for(var i = 0; i < dir_list.length; i++){
            path_before += '/' + dir_list[i];
            if (i == 0) path_before = '/';
            html += '<div class="file_dir_item">\
                        <span class="file_dir" title="' + (path_before.replace('//','/')) + '">' + dir_list[i] + '</span>\
                        <i class="iconfont icon-arrow-right"></i>\
                        <ul class="nav_down_list">\
                            <li data-path="*"><span>Loading</span></li>\
                        </ul>\
                    </div>';
        }
        $('.path_input').val('').attr('data-path',this.file_path);
        var file_dir_view = $('.file_path_input .file_dir_view');
        file_dir_view.html(html);
        file_dir_view.attr('data-width',file_dir_view.width());
        that.set_dir_view_resize.delay(that,100);
    },

    /**
     * @description 渲染路径下拉列表
     * @param {Object} el Dom选择器
     * @param {String} path 路径
     * @param {Function} callback 回调函数
    */
    render_path_down_list: function (el, path, callback) {
        var that = this,_html = '',next_path = $(el).parent().next().find('.file_dir').attr('title');
        this.get_dir_list({
            path: path
        }, function (res) {
            $.each(that.data_reconstruction(res.DIR),function(index,item){
                var _path = (path != '/' ? path : '') + '/' + item.filename;
                _html += '<li data-path="' + _path + '" title="' + _path + '" class="' + (_path === next_path ? 'active' : '') + '"><i class="file_menu_icon newly_file_icon"></i><span>' + item.filename + '</span></li>';
            });
            $(el).html(_html);
        });
    },

    /**
     * @description 渲染文件列表
     * @param {Object} data 参数对象，例如分页、显示数量、排序，不传参数使用默认或继承参数
     * @param {Function} callback 回调函数
     * @return void
    */
    reader_file_list:function (data, callback){
        var that = this,select_page_num = '',next_path = '',model = bt.get_cookie('rank'),isPaste = bt.get_cookie('record_paste_type');
        if(isPaste != 'null' && isPaste != undefined){//判断是否显示粘贴
            $('.file_nav_view .file_all_paste').removeClass('hide');  
        }else{
            $('.file_nav_view .file_all_paste').addClass('hide'); 
        } 
        $('.file_table_view').removeClass('.list_view,.icon_view').addClass(model == 'list'?'list_view':'icon_view');
        $('.cut_view_model:nth-child('+(model == 'list'?'2':'1')+')').addClass('active').siblings().removeClass('active');
        this.file_images_list = [];
        this.get_dir_list(data,function(res){
            if(res.status === false && res.msg.indexOf('The specified directory does not exist!') > -1){
                return that.reader_file_list({path:'/www'})
            }
            that.file_path = that.path_check(res.PATH);
            that.file_list = $.merge(that.data_reconstruction(res.DIR,'DIR'),that.data_reconstruction(res.FILES));
            that.is_recycle = res.FILE_RECYCLE;
            that.file_store_list = res.STORE;
            bt.set_cookie('Path',that.path_check(res.PATH));
            that.reader_file_list_content(that.file_list,function(rdata){
                $('.path_input').attr('data-path',that.file_path);
                $('.file_nav_view .multi').addClass('hide');
                $('.selection_right_menu').removeAttr('style');
                $.each(['100','200','500','1000','2000'],function(index,item){
                    select_page_num += '<option value="'+ item +'" '+ (item == (bt.get_storage('local','showRow') || that.file_page_num)?'selected':'') +'>'+ item +'</option>';
                });
                var page = $(res.PAGE);
                page.append('<span class="Pcount-item">per page<select class="showRow">'+ select_page_num +'</select>item(s)</span>');
                $('.filePage').html('<div class="page_num">Total '+ rdata.is_dir_num +' directory, '+ (that.file_list.length - rdata.is_dir_num) +'file(s), size:<a href="javascript:;" class="btlink" id="file_all_size">Click to calculate</a></div>' + page[0].outerHTML);
                if(data.is_operating && that.file_operating[that.file_pointer] != res.PATH){
                    next_path = that.file_operating[that.file_pointer + 1];
                    if(typeof next_path != "undefined" && next_path != res.PATH) that.file_operating.splice(that.file_pointer+1);
                    that.file_operating.push(res.PATH);
                    that.file_pointer = that.file_operating.length - 1;
                }
                that.render_path_list(); // 渲染文件路径地址
                that.set_file_forward(); // 设置前进后退状态
                that.render_favorites_list(); //渲染收藏夹列表
                that.set_file_view(); // 设置文件视图
                that.set_file_table_width()  //设置表格头部宽度
                if(callback) callback(res);
            });
        });
    },
    /**
     * @descripttion 重组数据结构
     * @param {Number} data  数据
     * @param {String} type  类型
     * @return: 返回重组后的数据
     */
    data_reconstruction:function(data,type,callback){
        var that = this,arry = [],info_ps = [
            ['/etc','PS: System files directory'],
            ['/home','PS: Home directory'],
            ['/tmp','PS: Common temporary files directory'],
            ['/root','PS: Main directory of system admin'],
            ['/usr','PS: System application directory'],
            ['/boot','PS: System run directory'],
            ['/lib','PS: System source file directory'],
            ['/mnt','PS: Store temporary mapped file system'],
            ['/www','PS: shackerPanel program directory'],
            ['/bin','PS: Store binary executable file directory'],
            ['/dev','PS: Storage device file directory'],
            ['/www/wwwlogs','PS: Default site logs directory'],
            ['/www/server','PS: shackerPanel soft installed directory'],
            ['/www/wwwlogs','PS: Site logs directory'],
            ['/www/Recycle_bin',lan.files.recycle_bin_dir],
            ['/www/server/panel','PS: shackerPanel main program directory, do not move'],
            ['/www/server/panel/plugin','PS: shackerPanel plugin directory'],
            ['/www/server/panel/BTPanel','PS: shackerPanel directory'],
            ['/www/server/panel/BTPanel/static','PS: shackerPanel static directory'],
            ['/www/server/panel/BTPanel/templates','PS: shackerPanel templates directory'],
            [bt.get_cookie('backup_path'),'PS: Default backup directory'],
            [bt.get_cookie('sites_path'),'PS: Default site directory']
        ];
        if(data.length < 1) return [];
        $.each(data,function(index,item){
            var itemD = item.split(";"),fileMsg ='',fileN = itemD[0].split('.'),extName = fileN[fileN.length - 1];
            switch(itemD[0]) {
                case '.user.ini':
                    fileMsg = lan.files.php_profile;
                    break;
                case '.htaccess':
                    fileMsg = lan.files.apache_profile;
                    break;
                case 'swap':
                    fileMsg = lan.files.swap_file;
                    break;
            }
            if(itemD[0].indexOf('Recycle_bin') != -1) fileMsg = lan.files.swap_file;
            if(itemD[0].indexOf('.upload.tmp') != -1) fileMsg = lan.files.recycle_bin_dir;
            for(var i=0;i<info_ps.length;i++){
                if(that.path_resolve(that.file_path,itemD[0]) === info_ps[i][0]) fileMsg = info_ps[i][1];
            }
            arry.push({
                caret: itemD[8] == '1'?true:false,                          //是否收藏
                down_id: parseInt(itemD[9]),                                //是否分享 分享id
                ext: (type == 'DIR'?'':extName.toLowerCase()),              //文件类型
                filename: itemD[0],                                         //文件名称
                mtime: itemD[2],                                            //时间
                ps: fileMsg || itemD[10] || '',                             //备注
                is_os_ps:fileMsg != ''?true:false,                          // 是否系统备注信息
                size: itemD[1],                                             //文件大小
                type: type == 'DIR'?'dir':'file',                           //文件类型
                user: itemD[3],                                             //用户权限
                root_level:itemD[4],                                        //所有者
                soft_link:itemD[5] || ''                                    // 软连接
            })

        })
        return arry;
    },
    /**
     * @descripttion 渲染拖拽选中列表
     * @param {Array} _array 选中的区域
     * @return: 无返回值
     */
    render_file_selected:function(_array){
        $(document).unbind('mouseup').unbind('mousemove');
        var that = this,tmp = [];
        that.clear_table_active()
        $.each(_array,function(index,item){
            if(tmp.indexOf(item) == -1){
                tmp.push(item)
            }
        })
        $.each(tmp,function(ind,items){
            $('.file_list_content .file_tr').eq(items).addClass('active');
            that.file_table_arry.push(that.file_list[items]);
        })
        that.calculate_table_active();
    },
    /** 
     * @descripttion 渲染收藏夹列表
     * @return: 无返回值
     */
    render_favorites_list:function(){
        var html = '';
        if(this.file_store_list.length > 0){
            $.each(this.file_store_list,function(index,item){
                html += '<li title="'+item['name']+'" data-path="'+item['path']+'" data-type="'+item['type']+'">'
                    +'<i class="'+(item['type'] == 'file'?'file_new_icon':'file_menu_icon create_file_icon')+'"></i>'
                    +'<span>'+item['name']+'</span>'
                    +'</li>'
            })
            html+='<li data-manage="favorites" onclick="bt_file.set_favorites_manage()"><span class="iconfont icon-shezhi1"></span><span>Management</span></li>'
        }else{html = '<li data-null style="width: 150px;"><i></i><span>(Empty)</span></li>'}
        
        $('.favorites_file_path .nav_down_list').html(html)
    },
    /**
     * @descripttion 收藏夹目录视图
     * @return: 无返回值
     */
    set_favorites_manage:function(){
        var that = this;
        layer.open({
            type:1,
            title: "Manage Favorites",
            area: ['850px','580px'],
            closeBtn: 2,
            shift: 5,
            shadeClose: false,
            content: "<div class='stroe_tab_list bt-table pd15'>\
                    <div class='divtable' style='height:420px'>\
                    <table class='table table-hover'>\
                        <thead><tr><th>Path</th><th style='text-align:right'>Opt</th></tr></thead>\
                        <tbody class='favorites_body'></tbody>\
                    </table></div></div>",
            success: function(layers) {
                that.render_favorites_type_list();
                setTimeout(function(){
                    $(layers).css('top',($(window).height() - $(layers).height()) /2);
                },50)
                
            },
            cancel:function(){
                that.reader_file_list({path:that.file_path})
            }
        })
    },
    /**
     * @description 渲染收藏夹分类列表
     * @return void
    */
    render_favorites_type_list:function(){
        var _detail = '';
        this.$http('get_files_store',function(rdata){
            if(rdata.length > 0){
                $.each(rdata,function(ind,item){
                    _detail += '<tr>'
                        +'<td><span class="favorites_span" title="'+item['path']+'">'+item['path']+'</span></td>'
                        +'<td style="text-align:right;">'
                            +'<a class="btlink" onclick="bt_file.del_favorites(\''+item['path']+'\')">Del</a>'
                        +'</td>'
                    +'</tr>'
                })
            }else{
                _detail = '<tr><td colspan="2">No favorites</td></tr>'
            }
            $('.favorites_body').html(_detail);
            if(jQuery.prototype.fixedThead){
                $('.stroe_tab_list .divtable').fixedThead({resize:false});
            }else{
                $('.stroe_tab_list .divtable').css({'overflow':'auto'});
            }
        })
    },
    /**
     * @description 重新获取收藏夹列表
     * @return void
    */
    load_favorites_index_list:function(){
        var that = this;
        this.$http('get_files_store',function(rdata){
            that.file_store_list = rdata;
            that.render_favorites_list()
        })
    },
    /**
     * @description 删除收藏夹
     * @param {String} path 文件路径
     * @return void
    */
    del_favorites:function(path){
        var that = this
        layer.confirm('Comfirm delete path【'+path+'】？', { title: 'Delete favorites', closeBtn: 2, icon: 3 }, function (index) {
            that.$http('del_files_store',{path:path},function(res){
                if(res.status){
                    that.render_favorites_type_list();
                }
                layer.msg(res.msg,{icon:res.status?1:2})
            })
        })
    },
    /**
     * @description 渲染文件列表内容
     * @param {Object} data 文件列表数据
     * @param {Function} callback 回调函数
     * @return void
    */
    reader_file_list_content:function(data,callback){
        var _html = '',that = this,is_dir_num = 0,images_num = 0;
        $.each(data,function(index,item){
            var _title = item.filename,only_id = bt.get_random(10),path = (that.file_path +'/'+ item.filename).replace('//','/'),is_compress = that.determine_file_type(item.ext,'compress'),is_editor_tips = (function(){
                var _openTitle = 'open';
                switch(that.determine_file_type(item.ext)){
                    case 'images':
                        _openTitle = 'Preview';
                    break;
                    case 'video':
                        _openTitle = 'Play';
                    break;
                    default:
                        if(that.determine_file_type(item.ext) == 'compress'){
                            _openTitle = '';
                        }else{
                            _openTitle = 'Edit';
                        }
                    break;
                }
                item.type == 'dir'?_openTitle = 'Open':'';
                return _openTitle;
            }(item));
            that.file_list[index]['only_id'] = only_id;
            _html += '<div class="file_tr" data-index="'+ index +'" data-filename="'+item.filename+'" '+(bt.get_cookie('rank') == 'icon'?'title="'+ path +'&#13;'+lan.files.file_size+':'+bt.format_size(item.size)+'&#13;'+lan.files.file_etime+':'+bt.format_data(item.mtime)+'&#13;'+lan.files.file_auth+':'+item.user+'&#13;'+lan.files.file_own+':'+item.root_level+'"':'')+'>'+
                '<div class="file_td file_checkbox"><div class="file_check"></div></div>'+
                '<div class="file_td file_name">'+
                    '<div class="file_ico_type"><i class="file_icon '+ (item.type == 'dir'?'file_folder':(item.ext == ''?'':'file_'+item.ext).replace('//','/')) +'"></i></div>'+
                    '<span class="file_title file_'+ item.type +'_status" '+(bt.get_cookie('rank') == 'icon'?'':'title="' + path + '"')+'><i>'+ item.filename+item.soft_link +'</i></span>'+ (item.caret?'<span class="iconfont icon-favorites" style="'+ (item.down_id != 0?'right:30px':'') +'" title="'+lan.files.file_has_been_favorite+'"></span>':'') + (item.down_id != 0?'<span class="iconfont icon-share1" title="'+lan.files.file_has_been_shared+'"></span>':'') +
                '</div>'+ 
                '<div class="file_td file_type hide"><span title="'+ (item.type == 'dir'?'directory':that.ext_type_tips(item.ext)) +'">'+ (item.type == 'dir'?'directory':that.ext_type_tips(item.ext)) +'</span></div>'+
                '<div class="file_td file_accept"><span>' + item.user +' / '+item.root_level + '</span></div>'+
                '<div class="file_td file_size"><span>'+ (item.type == 'dir'?'<a class="btlink folder_size" href="javascript:;" data-path="'+ path +'">Calculate</a>':bt.format_size(item.size)) +'</span></div>'+
                '<div class="file_td file_mtime"><span>' + bt.format_data(item.mtime) + '</span></div>'+
                '<div class="file_td file_ps"><span class="file_ps_title" title="'+ item.ps +'">' + (item.is_os_ps?item.ps:'<input type="text" class="set_file_ps" data-value="'+ item.ps +'" value="'+ item.ps +'" />') + '</span></div>'+
                '<div class="file_td file_operation"><div class="set_operation_group '+ (that.is_mobile?'is_mobile':'') +'">'+
                    '<a href="javascript:;" class="btlink" data-type="open">'+ is_editor_tips +'</a>&nbsp;|&nbsp;'+
                    '<a href="javscript:;" class="btlink" data-type="copy">Copy</a>&nbsp;|&nbsp;'+
                    '<a href="javscript:;" class="btlink" data-type="shear">Cut</a>&nbsp;|&nbsp;'+
                    '<a href="javscript:;" class="btlink" data-type="rename">Rename</a>&nbsp;|&nbsp;'+
                    '<a href="javscript:;" class="btlink" data-type="authority">PMSN</a>&nbsp;|&nbsp;'+
                    '<a href="javascript:;" class="btlink" data-type="'+ (is_compress?'unzip':'compress') +'">'+ (is_compress?'Unzip':'Zip') +'</a>&nbsp;|&nbsp;'+
                    '<a href="javscript:;" class="btlink" data-type="del">Del</a>&nbsp;|&nbsp;'+
                    '<a href="javscript:;" class="btlink foo_menu_title" data-type="more">More<i></i></a>'+
                '</div></div>'+
            '</div>';
            if(item.type == 'dir') is_dir_num ++;
            item.path = path; // 文件路径;
            item.open_type = that.determine_file_type(item.ext); // 打开类型;
            if(item.open_type == 'images'){
                item.images_id = images_num;
                that.file_images_list.push(item.path);
                images_num ++;
            }
        });
        $('.file_list_content').html(_html);
        if(callback) callback({is_dir_num:is_dir_num})
        
        that.clear_table_active(); // 清除表格选中内容
    },

    /**
     * @description 渲染文件磁盘列表
     * @return void
    */
    render_file_disk_list:function(){
        var that = this,html = '',_li = '';
        that.get_disk_list(function(res){
            $.each(res,function(index,item){
                html += '<div class="nav_btn" data-menu="'+ item.path +'">'+
                    '<span class="glyphicon glyphicon-hdd"></span>'+
                    '<span>'+(item.path == '/'?'Root dir':item.path)+' ('+ item.size[2] +')</span>'+
                '</div>';
                _li += '<li data-disk="'+item.path+'"><i class="glyphicon glyphicon-hdd"></i><span>'+(item.path == '/'?'Root dir':item.path)+' ('+ item.size[2] +')</span></li>'
            });
            $('.mount_disk_list').html('<div class="disk_title_group_btn hide"><span class="disk_title_group">'+lan.files.mounted_disk+'</span><i class="iconfont icon-xiala"></i><ul class="nav_down_list">'+_li+'</ul></div><div class="file_disk_list">'+html+'</div>');
            that.set_menu_line_view_resize();
        });
    },

    /**
     * @description 渲染右键鼠标菜单
     * @param {Object} ev 事件event对象
     * @param {Object} el 事件对象DOM
     * @return void
    */
    render_file_groud_menu: function (ev,el){
        var that = this,index = $(el).data('index'),_openTitle = 'Open',data = that.file_list[index],config_group = [['open',_openTitle],['split',''],['download','Download'],['share','Share file/directory'],['cancel_share','Cancel share'],['favorites','Favorites file/directory'],['cancel_favorites','Cancel favorites'],['split',''],['dir_kill','目录查杀'],['authority','Permission'],['split',''],['copy','Copy'],['shear','Cut'],['rename','Rename'],['del','Del'],['split',''],['compress','Compress'],['unzip','Decompress']],compression = ['zip','rar','gz','war','tgz','bz2'],offsetNum = 0;
        // 文件类型判断
        switch(that.determine_file_type(data.ext)){
            case 'images':
                _openTitle = 'Preview';
            break;
            case 'video':
                _openTitle = 'Play';
            break;
            default:
                _openTitle = 'Edit';
            break;
        }
        config_group[0][1] = (data.type == 'dir'?'Open':_openTitle);
        if(data.type == 'dir'){ // 判断是否为目录，目录不可下载
            config_group.splice(2,1);
            offsetNum ++;
        }
        if(data.open_type == 'compress'){ //判断是否为压缩类型，不可编辑
            config_group.splice(0,2);
            offsetNum = offsetNum + 2;
        }
        if(data.down_id != 0){ //判断是否分享
            config_group.splice(3-offsetNum,1);
            offsetNum ++;
        }else{
            config_group.splice(4-offsetNum,1);
            config_group[3-offsetNum][1] = (data.type == 'dir'?'Share directory':'Share file');
            offsetNum ++;
        }
        if(data.caret !== false){ // 判断是否收藏
            config_group.splice((5-offsetNum),1);
            offsetNum ++;
        }else{
            config_group.splice((6-offsetNum),1);
            config_group[5-offsetNum][1] = (data.type == 'dir'?'Favorites directory':'Favorites file');
            offsetNum ++;
        }
        //if(data.ext == 'php') config_group[8-offsetNum][1] = '文件查杀';
        //if(data.ext != 'php' && data.type != 'dir'){ // 判断是否为php，非php文件（排除目录）无法扫描
            config_group.splice((8-offsetNum),1);
            offsetNum ++;
        //}
        var num = 0;
        $.each(compression,function(index,item){
            if(item == data.ext) num ++;
        });
        if(num == 0){
            config_group.splice((17-offsetNum),1);
            offsetNum ++;
        }
        if(data.filename.indexOf('/') == -1 ||  data.type != 'dir'){
            config_group.splice((18-offsetNum),1);
            offsetNum ++;
        }
        that.file_selection_operating = config_group;
        that.reader_menu_list({el:$('.selection_right_menu'),ev:ev,data:data,list:config_group});
    },

    /**
     * @description 渲染右键全局菜单
     * @param {Object} ev 事件event对象
     * @param {Object} el 事件对象DOM
     * @return void
    */
    render_file_all_menu:function (ev,el) {
        var that = this,config_group = [['refresh','Refresh'],['split',''],['upload','Upload'],['create','New file/directory',[['create_dir','New directory'],['create_files','New file']]],['web_shell','Terminal'],['split',''],['paste','Paste']],offsetNum = 0,isPaste = bt.get_cookie('record_paste_type');
        if( isPaste == 'null' || isPaste == undefined){
            config_group.splice(5,2);   
            offsetNum ++;
        }
        that.reader_menu_list({el:$('.selection_right_menu'),ev:ev,data:{},list:config_group});
    },
    /**
     * @descripttion 文件多选时菜单
     * @param {Object} ev 事件event对象
     * @return: 无返回值
     */
    render_files_multi_menu:function(ev){
        var that = this,config_group =[['copy','Copy'],['shear','cut'],['authority','Permission'],['compress','Compress'],['del','Delete']],el = $('.selection_right_menu').find('ul'),el_height = el.height(),el_width = el.width(),left = ev.clientX - ((this.area[0] - ev.clientX) < el_width?el_width:0);
        el.empty();
        $.each(config_group,function(index,mitem){
            var $children = null;
            if(mitem[0] == 'split'){
                el.append('<li class="separate"></li>');
            }else{
                el.append($('<li><i class="file_menu_icon '+ mitem[0] +'_file_icon '+ (function(type){
                    if(type =='authority') return 'iconfont icon-authority';
                    return '';
                }(mitem[0])) +'"></i><span>'+ mitem[1] +'</span></li>').append($children).on('click',{type:mitem[0],data:that.file_table_arry},function(ev){
                    $('.selection_right_menu').removeAttr('style');
                    that.batch_file_manage(ev.data.type);
                    ev.stopPropagation();
                    ev.preventDefault();
                }));
            }
        });
        $('.selection_right_menu').css({
            left: left,
            top: ev.clientY - ((this.area[1] - ev.clientY) < el_height?el_height:0)
        }).removeClass('left_menu right_menu').addClass(this.area[0] - (left + el_width) < 230?'left_menu':'right_menu');
        $(document).one('click',function(e){
            $(ev.currentTarget).removeClass('selected');
            $('.selection_right_menu').removeAttr('style');
            e.stopPropagation();
            e.preventDefault();
        });
    },
    
    /**
    * @description 渲染菜单列表
    * @param {Object} el 菜单DOM 
    * @param {Object} config 菜单配置列表和数据
    * @returns void
    */
    reader_menu_list:function(config){
        var that = this,el = config.el.find('ul'),el_height = 0,el_width = el.width(),left = config.ev.clientX - ((this.area[0] - config.ev.clientX) < el_width?el_width:0),top =0;
        el.empty();
        $.each(config.list,function(index,item){
            var $children = null,$children_list = null;
            if(item[0] == 'split'){
                el.append('<li class="separate"></li>');
            }else{
                if(Array.isArray(item[2])){
                    $children = $('<div class="file_menu_down"><span class="glyphicon glyphicon-triangle-right" aria-hidden="true"></span><ul class="set_group"></ul></div>');
                    $children_list = $children.find('.set_group');
                    $.each(item[2],function(indexs,items) {
                        $children_list.append($('<li><i class="file_menu_icon '+ items[0] +'_file_icon"></i><span>'+ items[1] +'</span></li>').on('click',{type:items[0],data:config.data},function(ev){
                            that.file_groud_event($.extend(ev.data.data,{
                                open:ev.data.type,
                                index:parseInt($(config.ev.currentTarget).data('index')),
                                element:config.ev.currentTarget,
                                type_tips:config.data.type == 'dir'?'directory':'file'
                            }));
                            config.el.removeAttr('style');
                            ev.stopPropagation();
                            ev.preventDefault();
                        }))
                    });
                }
                el.append($('<li><i class="file_menu_icon '+ item[0] +'_file_icon '+ (function(type){
                    switch(type){
                        case 'share':
                        case 'cancel_share':
                            return 'iconfont icon-share1';
                        case 'dir_kill':
                            return 'iconfont icon-dir_kill';
                        case 'authority':
                            return 'iconfont icon-authority';
                    }
                    return '';
                }(item[0])) +'"></i><span>'+ item[1] +'</span></li>').append($children).on('click',{type:item[0],data:config.data},function(ev){
                    that.file_groud_event($.extend(ev.data.data,{
                        open:ev.data.type,
                        index:parseInt($(config.ev.currentTarget).data('index')),
                        element:config.ev.currentTarget,
                        type_tips:config.data.type == 'dir'?'directory':'file'
                    }));
                    // 有子级拉下时不删除样式，其余删除
                    if(item[0] != 'compress' && item[0] != 'create'){config.el.removeAttr('style');}
                    ev.stopPropagation();
                    ev.preventDefault();
                }));
            }
        });
        el_height = el.innerHeight();
        top = config.ev.clientY - ((this.area[1] - config.ev.clientY) < el_height?el_height:0);
        var element = $(config.ev.target);
        if(element.hasClass('foo_menu_title') || element.parents().hasClass('foo_menu_title')){
            left = config.ev.clientX - el_width;
            top = ((this.area[1] - config.ev.clientY) < el_height)?(config.ev.clientY - el_height -20):(config.ev.clientY + 15);
        }
        config.el.css({
            left: (left+10),
            top: top
        }).removeClass('left_menu right_menu').addClass(this.area[0] - (left + el_width) < 230?'left_menu':'right_menu');
    },

    /**
     * @description 返回后缀类型说明
     * @param {String} ext 后缀类型
     * @return {String} 文件类型
    */
    ext_type_tips:function(ext){
        var config = {ai:"Adobe Illustrator format",apk:"Android package",asp:"Dynamic web file",bat:"Shell File",bin:"Bin File",bas:"BASIC File",bak:"Backup File",css:'CSS',cad:"备份文件",cxx:"C++",crt:"Certificate file",cpp:"C++ File",conf:"Configuration file",dat:"",der:"Certification file",doc:"Microsoft Office Word 97-2003",docx:"Microsoft Office Word 2007",exe:"",gif:"Graphic file",go:"Golang source files",htm:"Hypertext document",html:"Hypertext document",ico:"",java:"Java source files",access:'Database file',jsp:"HTML Page",jpe:"Graphic file",jpeg:"Graphic file",jpg:"Graphic file",log:"Log file",link:"Shortcut file",js:"Javascript source files",mdb:"Microsoft Access database",mp3:"Audio file",ape:'CloudMusic.ape',mp4:"Video",avi:'Video',mkv:'Video',rm:'Video',mov:'Video',mpeg:'Video',mpg:'Video',rmvb:'Video',webm:'Video',wma:'Video',wmv:'Video',swf:'Shockwave Flash Object',mng:"Multi-image network graphics",msi:"Windows package",png:"Graphic file",py:"Python source file",pyc:"Python Bytecode file",pdf:"pdf",ppt:"Microsoft Powerpoint 97-2003",pptx:"Microsoft Powerpoint2007",psd:"Adobe photoshop",pl:"Perl Scripting language",rar:"RAR compressed package",reg:"Registry file",sys:"System Files",sql:"Database file",sh:"Shell script file",txt:"text format",vb:"Visual Basic",xml:"",xls:"Microsoft Office Excel 97-2003",xlsx:"Microsoft Office Excel 2007",gz:"Compressed file",zip:"ZIP compressed file",z:"","7z":"7Z Compressed file",json:'JSON',php:'PHP',mht:'MHTML',bmp:'BMP',webp:'WEBP',cdr:'CDR'};
        return typeof config[ext] != "undefined"?config[ext]:('Unknown file');
    },
    
    /**
     * @description 文件类型判断，或返回格式类型(不传入type)
     * @param {String} ext 
     * @param {String} type
     * @return {Boolean|Object} 返回类型或类型是否支持
    */
    determine_file_type:function(ext,type){
        var config = {
            images:['jpg','jpeg','png','bmp','gif','tiff','ico','JPG','webp'],
            compress:['zip','rar','gz','war','tgz'],
            video:['mp4','mp3', 'mpeg', 'mpg', 'mov', 'avi', 'webm', 'mkv','mkv','mp3','rmvb','wma','wmv'],
            ont_text:['iso','xlsx','xls','doc','docx','tiff','exe','so','7z','bz','dmg','apk','pptx','ppt','xlsb','pdf']
        },returnVal = false;
        if(type != undefined){
            if(type == 'text'){
                $.each(config,function(key,item){
                    $.each(item,function(index,items){
                        if(items == ext){
                            returnVal = true;
                            return false;
                        }
                    })
                });
                returnVal = !returnVal
            }else{
                if(typeof config[type] == "undefined") return false;
                $.each(config[type],function(key,item){
                    if(item == ext){
                        returnVal = true;
                        return false;
                    }
                });
            }
        }else{
            $.each(config,function(key,item){
                $.each(item,function(index,items){
                    if(items == ext){
                        returnVal = key;
                        return false;
                    }
                })
            });
            if(typeof returnVal == "boolean") returnVal = 'text';
        }
        return returnVal;
    },

    /**
     * @description 右键菜单事件组
     * @param {Object} data 当前文件或文件夹右键点击的数据和数组下标，以及Dom元素 
     * @return void 
    */
    file_groud_event:function(data){ 
        var that = this;
        switch(data.open){
            case 'open': // 打开目录、文件编辑、预览图片、播放视频
                if(data.type == 'dir'){
                    this.reader_file_list({path:data.path});
                }else{
                    switch(data.open_type){
                        case 'text':
                            openEditorView(0,data.path)
                        break;
                        case 'video':
                            this.open_video_play(data);
                        break;
                        case 'images':
                            this.open_images_preview(data);
                        break;
                    }
                }
            break;
            case 'download': //下载
                this.down_file_req(data);
            break;
            case 'share': // 添加分享文件
                this.set_file_share(data);
            break;
            case 'cancel_share': // 取消分享文件
                this.info_file_share(data);
            break;
            case 'favorites': //添加收藏夹
                this.$http('add_files_store',{path:data.path},function(res){
                    if(res.status){
                        that.file_list[data.index] = $.extend(that.file_list[data.index],{caret:true});
                        that.reader_file_list_content(that.file_list);
                        that.load_favorites_index_list();
                    } 
                    layer.msg(res.msg,{icon:res.status?1:2})
                })
            break;
            case 'cancel_favorites': //取消收藏
                this.cancel_file_favorites(data);
            break;
            case 'authority': // 权限
                this.set_file_authority(data);
            break;
            case 'dir_kill': //目录查杀
                this.set_dir_kill(data);
            break;
            case 'copy': // 复制内容
                this.copy_file_or_dir(data);
            break;
            case 'shear': // 剪切内容
                this.cut_file_or_dir(data);
            break;
            case 'rename': // 重命名
                this.rename_file_or_dir(data);
            break;
            case'compress':
                data['open'] = 'tar_gz';
                this.compress_file_or_dir(data);
            break;
            case 'tar_gz': // 压缩gzip文件
            case 'rar': // 压缩rar文件
            case 'zip': // 压缩zip文件
                this.compress_file_or_dir(data);
            break;
            case 'unzip': 
            case 'folad':  //解压到...
                this.unpack_file_to_path(data)
                break;
            case 'refresh': // 刷新文件列表
                $('.file_path_refresh').click();
            break;
            case 'upload': //上传文件
                this.file_drop.dialog_view();
            break;
            case 'create_dir': // 新建文件目录
                $('.file_nav_view .create_file_or_dir li').eq(0).click();
            break;
            case 'create_files': // 新建文件列表
                $('.file_nav_view .create_file_or_dir li').eq(1).click();
            break;
            case 'del': //删除
                this.del_file_or_dir(data);
            break;
            case 'paste': //粘贴
                this.paste_file_or_dir();
            break;
            case 'web_shell': // 终端
                web_shell()
            break;
            case 'open_find_dir': // 打开文件所在目录
                this.reader_file_list({path: this.retrun_prev_path(data.path)});
            break;
        }
    },
    /**
     * @descripttion 列表批量处理
     * @param {String} stype 操作
     * @return: 无返回值
     */
    batch_file_manage:function(stype){
        var that = this,_api = '',_fname = [],_obj = {},_path = $('');
        $.each(this.file_table_arry,function(index,item){
            _fname.push(item.filename)
        })
        switch(stype){
            case 'copy':   //复制
            case 'shear':  //剪切
                _api = 'SetBatchData';
                _obj['data'] = JSON.stringify(_fname);
                _obj['type'] = stype == 'copy'?'1':'2';
                _obj['path'] = that.file_path;
                break;
            case 'del':    //删除
                _obj['data'] = JSON.stringify(_fname);
                _obj['type'] = '4';
                _obj['path'] = that.file_path;
                return that.batch_file_delect(_obj)
                break;
            case 'authority':   //权限
                _obj['filename'] = '批量';
                _obj['type'] = '3'
                _obj['filelist'] = JSON.stringify(_fname);
                _obj['path'] = that.file_path;
                return that.set_file_authority(_obj,true)
                break;
            case 'compress':    //压缩
                var arry_f = that.file_path.split('/'),file_title = arry_f[arry_f.length -1];
                _obj['filename'] = _fname.join(',');
                _obj['open'] = 'tar_gz'
                _obj['path'] = that.file_path+'/'+file_title;
                return that.compress_file_or_dir(_obj,true)
                break;
        }
        // 批量标记
        that.$http(_api,_obj,function(res){
            if(res.status){
                bt.set_cookie('record_paste_type',stype == 'copy'?'1':'2')
                that.clear_table_active();
                $('.nav_group.multi').addClass('hide');
                $('.file_menu_tips').removeClass('hide');
                $('.file_nav_view .file_all_paste').removeClass('hide'); 
            }
            layer.msg(res.msg,{icon:res.status?1:2})
        });
    },
    /**
     * @descripttion 批量删除
     * @param {Object} obj.data   需删除的数据
     * @param {Object} obj.type   批量删除操作
     * @return: 无返回值
     */
    batch_file_delect:function(obj){
        var that = this;
        if(this.is_recycle){
            layer.confirm(lan.files.del_to_recycle_bin,{title:lan.files.del_in_bulk,closeBtn:2,icon:3},function(){
                that.$http('SetBatchData',obj,function(res){
                    if(res.status) that.reader_file_list({path:that.file_path})  
                    layer.msg(res.msg,{icon:res.status?1:2})
                });
            })
        }else{
            bt.show_confirm(lan.files.del_in_bulk,'<span><i style="font-size: 15px;font-style: initial;color: red;">'+lan.files.recycle_bin_warning+'</i></span>',function(){
                that.$http('SetBatchData',obj,function(res){
                    if(res.status) that.reader_file_list({path:that.file_path})  
                    layer.msg(res.msg,{icon:res.status?1:2})
                });
            })
        }
    },
    /**
     * @description 批量文件粘贴
     * @return void
    */
    batch_file_paste:function(){
        var that = this, _pCookie = bt.get_cookie('record_paste_type');
        this.check_exists_files_req({dfile:this.file_path},function(result){
            if(result.length > 0){
                var tbody = '';
                for(var i=0;i<result.length;i++){
                    tbody += '<tr><td><span class="exists_files_style">'+result[i].filename+'</td><td>'+ToSize(result[i].size)+'</td><td>'+getLocalTime(result[i].mtime)+'</td></tr>';
                }
                var mbody = '<div class="divtable" style="max-height:350px;overflow:auto;"><table class="table table-hover" width="100%" border="0" cellpadding="0" cellspacing="0"><thead><th>File name</th><th>Size</th><th>Last edit time</th></thead>\
                            <tbody>'+tbody+'</tbody>\
                            </table></div>';
                SafeMessage('The following files will be overwritten',mbody,function(){
                    that.$http('BatchPaste',{type:_pCookie,path:that.file_path},function(rdata){
                        if(rdata.status){
                            bt.set_cookie('record_paste_type',null);
                            that.reader_file_list({path:that.file_path})
                        }
                        layer.msg(rdata.msg,{icon:rdata.status?1:2})
                    })
                });
            }else{
                that.$http('BatchPaste',{type:_pCookie,path:that.file_path},function(rdata){
                    if(rdata.status){
                        bt.set_cookie('record_paste_type',null);
                        that.reader_file_list({path:that.file_path})
                    }
                    layer.msg(rdata.msg,{icon:rdata.status?1:2})
                })
            }
            
        })
    },
    /**
     * @description 回收站视图
     * @return void
    */
    recycle_bin_view:function(){
        var that = this;
        layer.open({
            type:1,
            shift:5,
            closeBtn: 2,
            area:['80%','606px'],
            title: lan.files.recycle_bin_title,
            content:'<div class="recycle_bin_view">\
                    <div class="re-head">\
                    <div style="margin-left: 3px;" class="ss-text">\
                        <em>'+ lan.files.recycle_bin_on + '</em>\
                        <div class="ssh-item">\
                                <input class="btswitch btswitch-ios" id="Set_Recycle_bin" type="checkbox">\
                                <label class="btswitch-btn" for="Set_Recycle_bin" onclick="bt_file.Set_Recycle_bin()"></label>\
                        </div>\
                        <em style="margin-left: 20px;">'+ lan.files.recycle_bin_on_db + '</em>\
                        <div class="ssh-item">\
                                <input class="btswitch btswitch-ios" id="Set_Recycle_bin_db" type="checkbox">\
                                <label class="btswitch-btn" for="Set_Recycle_bin_db" onclick="bt_file.Set_Recycle_bin(1)"></label>\
                        </div>\
                    </div>\
                    <span style="line-height: 32px; margin-left: 30px;">'+ lan.files.recycle_bin_ps + '</span>\
                    <button style="float: right" class="btn btn-default btn-sm" onclick="bt_file.CloseRecycleBin();">'+ lan.files.recycle_bin_close + '</button>\
                    </div>\
                    <div class="re-con">\
                        <div class="re-con-menu">\
                            <p class="on" data-type="1">'+lan.files.recycle_bin_type1+'</p>\
                            <p data-type="2">'+lan.files.recycle_bin_type2+'</p>\
                            <p data-type="3">'+lan.files.recycle_bin_type3+'</p>\
                            <p data-type="4">'+lan.files.recycle_bin_type4+'</p>\
                            <p data-type="5">'+lan.files.recycle_bin_type5+'</p>\
                            <p data-type="6">'+lan.files.recycle_bin_type6+'</p>\
                        </div>\
                        <div class="re-con-con">\
                            <div style="margin: 15px;" class="divtable">\
                                <table width="100%" class="table table-hover">\
                                    <thead>\
                                        <tr>\
                                            <th>'+lan.files.recycle_bin_th1+'</th>\
                                            <th>'+lan.files.recycle_bin_th2+'</th>\
                                            <th>'+lan.files.recycle_bin_th3+'</th>\
                                            <th width="150">'+lan.files.recycle_bin_th4+'</th>\
                                            <th style="text-align: right;" width="110">'+lan.files.recycle_bin_th5+'</th>\
                                        </tr>\
                                    </thead>\
                                    <tbody id="RecycleBody" class="list-list"></tbody>\
                                </table>\
                            </div>\
                        </div>\
                    </div>\
                </div>',
            success:function(){
                if(window.location.href.indexOf("database") != -1){
                    $(".re-con-menu p:last-child").addClass("on").siblings().removeClass("on");
                    that.render_recycle_list(6)
                }else{
                    that.render_recycle_list(1)
                }
                $(".re-con-menu").on('click','p',function(){
                    var _type = $(this).data('type');
                    $(this).addClass("on").siblings().removeClass("on");
                    that.render_recycle_list(_type);
                })
            }
        })
    },
    // 回收站渲染列表
    render_recycle_list:function(num){
        var that = this;
        this.$http('Get_Recycle_bin',function(rdata){
            var body = '';
            $('#Set_Recycle_bin').attr('checked',rdata.status);
            $('#Set_Recycle_bin_db').attr('checked',rdata.status_db);
            switch (num) {
                case 1:
                    for (var i = 0; i < rdata.dirs.length; i++) {
                        var shortwebname = rdata.dirs[i].name.replace(/'/, "\\'");
                        var shortpath = rdata.dirs[i].dname;
                        if (shortwebname.length > 20) shortwebname = shortwebname.substring(0, 20) + "...";
                        if (shortpath.length > 20) shortpath = shortpath.substring(0, 20) + "...";
                        body += '<tr>\
                                    <td><span class=\'ico ico-folder\'></span><span class="tname" title="'+ rdata.dirs[i].name + '">' + shortwebname + '</span></td>\
                                    <td><span title="'+ rdata.dirs[i].dname + '">' + shortpath + '</span></td>\
                                    <td>'+ ToSize(rdata.dirs[i].size) + '</td>\
                                    <td>'+ getLocalTime(rdata.dirs[i].time) + '</td>\
                                    <td style="text-align: right;">\
                                        <a class="btlink" href="javascript:;" onclick="bt_file.ReRecycleBin(\'' + rdata.dirs[i].rname.replace(/'/, "\\'") + '\',this)">' + lan.files.recycle_bin_re + '</a>\
                                        | <a class="btlink" href="javascript:;" onclick="bt_file.DelRecycleBin(\'' + rdata.dirs[i].rname.replace(/'/, "\\'") + '\',this)">' + lan.files.recycle_bin_del + '</a>\
                                    </td>\
                                </tr>';
                    }
                    for (var i = 0; i < rdata.files.length; i++) {
                        if (rdata.files[i].name.indexOf('BTDB_') != -1) {
                            var shortwebname = rdata.files[i].name.replace(/'/, "\\'");
                            var shortpath = rdata.files[i].dname;
                            if (shortwebname.length > 20) shortwebname = shortwebname.substring(0, 20) + "...";
                            if (shortpath.length > 20) shortpath = shortpath.substring(0, 20) + "...";
                            body += '<tr>\
                                    <td><span class="ico ico-'+ (that.get_ext_name(rdata.files[i].name)) + '"></span><span class="tname" title="' + rdata.files[i].name + '">' + shortwebname.replace('BTDB_', '') + '</span></td>\
                                    <td><span title="'+ rdata.files[i].dname + '">mysql://' + shortpath.replace('BTDB_', '') + '</span></td>\
                                    <td>-</td>\
                                    <td>'+ getLocalTime(rdata.files[i].time) + '</td>\
                                    <td style="text-align: right;">\
                                        <a class="btlink" href="javascript:;" onclick="bt_file.ReRecycleBin(\'' + rdata.files[i].rname.replace(/'/, "\\'") + '\',this)">' + lan.files.recycle_bin_re + '</a>\
                                        | <a class="btlink" href="javascript:;" onclick="bt_file.DelRecycleBin(\'' + rdata.files[i].rname.replace(/'/, "\\'") + '\',this)">' + lan.files.recycle_bin_del + '</a>\
                                    </td>\
                                </tr>'

                            continue;
                        }
                        var shortwebname = rdata.files[i].name.replace(/'/, "\\'");
                        var shortpath = rdata.files[i].dname;
                        if (shortwebname.length > 20) shortwebname = shortwebname.substring(0, 20) + "...";
                        if (shortpath.length > 20) shortpath = shortpath.substring(0, 20) + "...";
                        body += '<tr>\
                                    <td><span class="ico ico-'+ (that.get_ext_name(rdata.files[i].name)) + '"></span><span class="tname" title="' + rdata.files[i].name + '">' + shortwebname + '</span></td>\
                                    <td><span title="'+ rdata.files[i].dname + '">' + shortpath + '</span></td>\
                                    <td>'+ ToSize(rdata.files[i].size) + '</td>\
                                    <td>'+ getLocalTime(rdata.files[i].time) + '</td>\
                                    <td style="text-align: right;">\
                                        <a class="btlink" href="javascript:;" onclick="bt_file.ReRecycleBin(\'' + rdata.files[i].rname.replace(/'/, "\\'") + '\',this)">' + lan.files.recycle_bin_re + '</a>\
                                        | <a class="btlink" href="javascript:;" onclick="bt_file.DelRecycleBin(\'' + rdata.files[i].rname.replace(/'/, "\\'") + '\',this)">' + lan.files.recycle_bin_del + '</a>\
                                    </td>\
                                </tr>'
                    }
                    $("#RecycleBody").html(body);
                    return;
                    break;
                case 2:
                    for (var i = 0; i < rdata.dirs.length; i++) {
                        var shortwebname = rdata.dirs[i].name.replace(/'/, "\\'");
                        var shortpath = rdata.dirs[i].dname;
                        if (shortwebname.length > 20) shortwebname = shortwebname.substring(0, 20) + "...";
                        if (shortpath.length > 20) shortpath = shortpath.substring(0, 20) + "...";
                        body += '<tr>\
                                    <td><span class=\'ico ico-folder\'></span><span class="tname" title="'+ rdata.dirs[i].name + '">' + shortwebname + '</span></td>\
                                    <td><span title="'+ rdata.dirs[i].dname + '">' + shortpath + '</span></td>\
                                    <td>'+ ToSize(rdata.dirs[i].size) + '</td>\
                                    <td>'+ getLocalTime(rdata.dirs[i].time) + '</td>\
                                    <td style="text-align: right;">\
                                        <a class="btlink" href="javascript:;" onclick="bt_file.ReRecycleBin(\'' + rdata.dirs[i].rname.replace(/'/, "\\'") + '\',this)">' + lan.files.recycle_bin_re + '</a>\
                                        | <a class="btlink" href="javascript:;" onclick="bt_file.DelRecycleBin(\'' + rdata.dirs[i].rname.replace(/'/, "\\'") + '\',this)">' + lan.files.recycle_bin_del + '</a>\
                                    </td>\
                                </tr>'
                    }
                    $("#RecycleBody").html(body);
                    return;
                    break;
                case 3:
                    for (var i = 0; i < rdata.files.length; i++) {
                        if (rdata.files[i].name.indexOf('BTDB_') != -1) continue;
                        var shortwebname = rdata.files[i].name.replace(/'/, "\\'");
                        var shortpath = rdata.files[i].dname;
                        if (shortwebname.length > 20) shortwebname = shortwebname.substring(0, 20) + "...";
                        if (shortpath.length > 20) shortpath = shortpath.substring(0, 20) + "...";
                        body += '<tr>\
                                    <td><span class="ico ico-'+ (that.get_ext_name(rdata.files[i].name)) + '"></span><span class="tname" title="' + rdata.files[i].name + '">' + shortwebname + '</span></td>\
                                    <td><span title="'+ rdata.files[i].dname + '">' + shortpath + '</span></td>\
                                    <td>'+ ToSize(rdata.files[i].size) + '</td>\
                                    <td>'+ getLocalTime(rdata.files[i].time) + '</td>\
                                    <td style="text-align: right;">\
                                        <a class="btlink" href="javascript:;" onclick="bt_file.ReRecycleBin(\'' + rdata.files[i].rname.replace(/'/, "\\'") + '\',this)">' + lan.files.recycle_bin_re + '</a>\
                                        | <a class="btlink" href="javascript:;" onclick="bt_file.DelRecycleBin(\'' + rdata.files[i].rname.replace(/'/, "\\'") + '\',this)">' + lan.files.recycle_bin_del + '</a>\
                                    </td>\
                                </tr>'
                    }
                    $("#RecycleBody").html(body);
                    return;
                    break;
                case 4:
                    for (var i = 0; i < rdata.files.length; i++) {
                        if (ReisImage(getFileName(rdata.files[i].name))) {
                            var shortwebname = rdata.files[i].name.replace(/'/, "\\'");
                            var shortpath = rdata.files[i].dname;
                            if (shortwebname.length > 20) shortwebname = shortwebname.substring(0, 20) + "...";
                            if (shortpath.length > 20) shortpath = shortpath.substring(0, 20) + "...";
                            body += '<tr>\
                                    <td><span class="ico ico-'+ (that.get_ext_name(rdata.files[i].name)) + '"></span><span class="tname" title="' + rdata.files[i].name + '">' + shortwebname + '</span></td>\
                                    <td><span title="'+ rdata.files[i].dname + '">' + shortpath + '</span></td>\
                                    <td>'+ ToSize(rdata.files[i].size) + '</td>\
                                    <td>'+ getLocalTime(rdata.files[i].time) + '</td>\
                                    <td style="text-align: right;">\
                                        <a class="btlink" href="javascript:;" onclick="bt_file.ReRecycleBin(\'' + rdata.files[i].rname.replace(/'/, "\\'") + '\',this)">' + lan.files.recycle_bin_re + '</a>\
                                        | <a class="btlink" href="javascript:;" onclick="bt_file.DelRecycleBin(\'' + rdata.files[i].rname.replace(/'/, "\\'") + '\',this)">' + lan.files.recycle_bin_del + '</a>\
                                    </td>\
                                </tr>'
                        }
                    }
                    $("#RecycleBody").html(body);
                    return;
                    break;
                case 5:
                    for (var i = 0; i < rdata.files.length; i++) {
                        if (rdata.files[i].name.indexOf('BTDB_') != -1) continue;
                        if (!(ReisImage(getFileName(rdata.files[i].name)))) {
                            var shortwebname = rdata.files[i].name.replace(/'/, "\\'");
                            var shortpath = rdata.files[i].dname;
                            if (shortwebname.length > 20) shortwebname = shortwebname.substring(0, 20) + "...";
                            if (shortpath.length > 20) shortpath = shortpath.substring(0, 20) + "...";
                            body += '<tr>\
                                    <td><span class="ico ico-'+ (that.get_ext_name(rdata.files[i].name)) + '"></span><span class="tname" title="' + rdata.files[i].name + '">' + shortwebname + '</span></td>\
                                    <td><span title="'+ rdata.files[i].dname + '">' + shortpath + '</span></td>\
                                    <td>'+ ToSize(rdata.files[i].size) + '</td>\
                                    <td>'+ getLocalTime(rdata.files[i].time) + '</td>\
                                    <td style="text-align: right;">\
                                        <a class="btlink" href="javascript:;" onclick="bt_file.ReRecycleBin(\'' + rdata.files[i].rname.replace(/'/, "\\'") + '\',this)">' + lan.files.recycle_bin_re + '</a>\
                                        | <a class="btlink" href="javascript:;" onclick="bt_file.DelRecycleBin(\'' + rdata.files[i].rname.replace(/'/, "\\'") + '\',this)">' + lan.files.recycle_bin_del + '</a>\
                                    </td>\
                                </tr>'
                        }
                    }
                    $("#RecycleBody").html(body);
                    return;
                case 6:
                    for (var i = 0; i < rdata.files.length; i++) {
                        if (rdata.files[i].name.indexOf('BTDB_') != -1) {
                            var shortwebname = rdata.files[i].name.replace(/'/, "\\'");
                            var shortpath = rdata.files[i].dname;
                            if (shortwebname.length > 20) shortwebname = shortwebname.substring(0, 20) + "...";
                            if (shortpath.length > 20) shortpath = shortpath.substring(0, 20) + "...";
                            body += '<tr>\
                                    <td><span class="ico ico-'+ (that.get_ext_name(rdata.files[i].name)) + '"></span><span class="tname" title="' + rdata.files[i].name + '">' + shortwebname.replace('BTDB_', '') + '</span></td>\
                                    <td><span title="'+ rdata.files[i].dname + '">mysql://' + shortpath.replace('BTDB_', '') + '</span></td>\
                                    <td>-</td>\
                                    <td>'+ getLocalTime(rdata.files[i].time) + '</td>\
                                    <td style="text-align: right;">\
                                        <a class="btlink" href="javascript:;" onclick="bt_file.ReRecycleBin(\'' + rdata.files[i].rname.replace(/'/, "\\'") + '\',this)">' + lan.files.recycle_bin_re + '</a>\
                                        | <a class="btlink" href="javascript:;" onclick="bt_file.DelRecycleBin(\'' + rdata.files[i].rname.replace(/'/, "\\'") + '\',this)">' + lan.files.recycle_bin_del + '</a>\
                                    </td>\
                                </tr>'
                        }
                    }
                    $("#RecycleBody").html(body);
                    return;
                    break;
                }
            function getFileName(name) {
                var text = name.split(".");
                var n = text.length - 1;
                text = text[n];
                return text;
            }
            function ReisImage(fileName) {
                var exts = ['jpg', 'jpeg', 'png', 'bmp', 'gif', 'tiff', 'ico'];
                for (var i = 0; i < exts.length; i++) {
                    if (fileName == exts[i]) return true
                }
                return false;
            }
                    
            $('#RecycleBody').html(body);

        })

    },
    // 回收站开关
    Set_Recycle_bin:function(db) {
        var loadT = layer.msg(lan.public.the, { icon: 16, time: 0, shade: [0.3, '#000'] });
        var that = this,data = {}
        if (db == 1) {
            data = { db: db };
        }
        $.post('/files?action=Recycle_bin', data, function (rdata) {
            layer.close(loadT);
            if(rdata.status){
                if(db == undefined) that.is_recycle = $('#Set_Recycle_bin').prop('checked');
            }
            layer.msg(rdata.msg, { icon: rdata.status ? 1 : 5 });
        });
    },
    // 回收站恢复
    ReRecycleBin:function(path, obj) {
        layer.confirm(lan.files.recycle_bin_re_msg, { title: lan.files.recycle_bin_re_title, closeBtn: 2, icon: 3 }, function () {
            var loadT = layer.msg(lan.files.recycle_bin_re_the, { icon: 16, time: 0, shade: [0.3, '#000'] });
            $.post('/files?action=Re_Recycle_bin', 'path=' + encodeURIComponent(path), function (rdata) {
                layer.close(loadT);
                layer.msg(rdata.msg, { icon: rdata.status ? 1 : 5 });
                $(obj).parents('tr').remove();
            });
        });
    },
    //回收站删除
    DelRecycleBin:function(path, obj) {
        layer.confirm(lan.files.recycle_bin_del_msg, { title: lan.files.recycle_bin_del_title, closeBtn: 2, icon: 3 }, function () {
            var loadT = layer.msg(lan.files.recycle_bin_del_the, { icon: 16, time: 0, shade: [0.3, '#000'] });
            $.post('/files?action=Del_Recycle_bin', 'path=' + encodeURIComponent(path), function (rdata) {
                layer.close(loadT);
                layer.msg(rdata.msg, { icon: rdata.status ? 1 : 5 });
                $(obj).parents('tr').remove();
            });
        });
    },
    //清空回收站
    CloseRecycleBin:function(){
        layer.confirm(lan.files.recycle_bin_close_msg, { title: lan.files.recycle_bin_close, closeBtn: 2, icon: 3 }, function () {
            var loadT = layer.msg("<div class='myspeed'>" + lan.files.recycle_bin_close_the + "</div>", { icon: 16, time: 0, shade: [0.3, '#000'] });
            setTimeout(function () {
                getSpeed('.myspeed');
            }, 1000);
            $.post('/files?action=Close_Recycle_bin', '', function (rdata) {
                layer.close(loadT);
                layer.msg(rdata.msg, { icon: rdata.status ? 1 : 5 });
                $("#RecycleBody").html('');
            });
        });
    },
    /**
     * @description 打开图片预览
     * @param {Object} data 当前文件的数据对象
     * @return void
    */
    open_images_preview:function(data){
        var that = this,mask = $('<div class="preview_images_mask">'+
            '<div class="preview_head">'+
                '<span class="preview_title">'+ data.filename +'</span>'+
                '<span class="preview_small hidden" title="Zoom out"><span class="glyphicon glyphicon-resize-small" aria-hidden="true"></span></span>'+
                '<span class="preview_full" title="Zoom in"><span class="glyphicon glyphicon-resize-full" aria-hidden="true"></span></span>'+
                '<span class="preview_close" title="Close preview view"><span class="glyphicon glyphicon-remove" aria-hidden="true"></span></span>'+
            '</div>'+
            '<div class="preview_body"><img id="preview_images" src="/download?filename='+ data.path +'" data-index="'+ data.images_id +'"></div>'+
            '<div class="preview_toolbar">'+
                '<a href="javascript:;" title="Left rotation"><span class="glyphicon glyphicon-repeat reverse-repeat" aria-hidden="true"></span></a>'+
                '<a href="javascript:;" title="Right rotation"><span class="glyphicon glyphicon-repeat" aria-hidden="true"></span></a>'+
                '<a href="javascript:;" title="Zoom in"><span class="glyphicon glyphicon-zoom-in" aria-hidden="true"></span></a>'+
                '<a href="javascript:;" title="Zoom out"><span class="glyphicon glyphicon-zoom-out" aria-hidden="true"></span></a>'+
                '<a href="javascript:;" title="Reset"><span class="glyphicon glyphicon-refresh" aria-hidden="true"></span></a>'+
                '<a href="javascript:;" title="Image list"><span class="glyphicon glyphicon-list" aria-hidden="true"></span></a>'+
            '</div>'+
            '<div class="preview_cut_view">'+
                '<a href="javascript:;" title="Up"><span class="glyphicon glyphicon-menu-left" aria-hidden="true"></span></a>'+
                '<a href="javascript:;" title="Next"><span class="glyphicon glyphicon-menu-right" aria-hidden="true"></span></a>'+
            '</div>'+
        '</div>'),
        images_config = {natural_width:0,natural_height:0,init_width:0,init_height:0,preview_width:0,preview_height:0,current_width:0,current_height:0,current_left:0,current_top:0,rotate:0,scale:1,images_mouse:false};
        if($('.preview_images_mask').length > 0){
            $('#preview_images').attr('src','/download?filename=' + data.path);
            return false;
        }
        $('body').css('overflow','hidden').append(mask);
        images_config.preview_width = mask[0].clientWidth;
        images_config.preview_height = mask[0].clientHeight;
        // 图片预览
        $('.preview_body img').load(function(){
            var img = $(this)[0];
            if(!$(this).attr('data-index')) $(this).attr('data-index',data.images_id);
            images_config.natural_width = img.naturalWidth;
            images_config.natural_height = img.naturalHeight;
            auto_images_size(false);
        });
        //图片头部拖动
        $('.preview_images_mask .preview_head').on('mousedown',function(e){
            e = e || window.event; //兼容ie浏览器
            var drag = $(this).parent();
            $('body').addClass('select'); //webkit内核和火狐禁止文字被选中
            $(this).onselectstart = $(this).ondrag = function () { //ie浏览器禁止文字选中
                return false;
            }
            if ($(e.target).hasClass('preview_close')) { //点关闭按钮不能拖拽模态框
                return;
            }
            var diffX = e.clientX - drag.offset().left;
            var diffY = e.clientY - drag.offset().top;
            $(document).on('mousemove',function(e){
                e = e || window.event; //兼容ie浏览器
                var left = e.clientX - diffX;
                var top = e.clientY - diffY;
                if (left < 0) {
                    left = 0;
                } else if (left > window.innerWidth - drag.width()) {
                    left = window.innerWidth - drag.width();
                }
                if (top < 0) {
                    top = 0;
                } else if (top > window.innerHeight - drag.height()) {
                    top = window.innerHeight - drag.height();
                }
                drag.css({
                    left:left,
                    top:top,
                    margin:0
                });
            }).on('mouseup',function(){
                $(this).unbind('mousemove mouseup');
            });
        });
        //图片拖动
        $('.preview_images_mask #preview_images').on('mousedown',function(e){
            e = e || window.event;
            $(this).onselectstart = $(this).ondrag = function(){
                return false;
            }
            var images = $(this);
            var preview =  $('.preview_images_mask').offset();
            var diffX = e.clientX - preview.left;
            var diffY = e.clientY - preview.top;
            $('.preview_images_mask').on('mousemove',function(e){
                e = e || window.event
                var offsetX = e.clientX - preview.left - diffX,
                    offsetY = e.clientY - preview.top - diffY,
                    rotate = Math.abs(images_config.rotate / 90),
                    preview_width = (rotate % 2 == 0?images_config.preview_width:images_config.preview_height),
                    preview_height = (rotate % 2 == 0?images_config.preview_height:images_config.preview_width),
                    left,top;
                if(images_config.current_width > preview_width){
                    var max_left = preview_width - images_config.current_width;
                    left = images_config.current_left + offsetX;
                    if(left > 0){
                        left = 0
                    }else if(left < max_left){
                        left = max_left
                    }
                    images_config.current_left = left;
                }
                if(images_config.current_height > preview_height){
                    var max_top = preview_height - images_config.current_height;
                    top = images_config.current_top + offsetY;
                    if(top > 0){
                        top = 0
                    }else if(top < max_top){
                        top = max_top
                    }
                    images_config.current_top = top;
                }
                if(images_config.current_height > preview_height && images_config.current_top <= 0){
                    if((images_config.current_height - preview_height) <= images_config.current_top){
                        images_config.current_top -= offsetY
                    }
                }
                images.css({'left':images_config.current_left,'top':images_config.current_top});
            }).on('mouseup',function(){
                $(this).unbind('mousemove mouseup');
            }).on('dragstart',function(){
                e.preventDefault();
            });
        }).on('dragstart',function(){
            return false;
        });
        //关闭预览图片
        $('.preview_close').click(function(e){
            $('.preview_images_mask').remove();
        });
        //图片工具条预览
        $('.preview_toolbar a').click(function(){
            var index = $(this).index(),images = $('#preview_images');
            switch(index){
                case 0: //左旋转,一次旋转90度
                case 1: //右旋转,一次旋转90度
                    images_config.rotate = index?(images_config.rotate + 90):(images_config.rotate - 90);
                    auto_images_size();
                break;
                case 2:
                case 3:
                    if(images_config.scale == 3 && index == 2|| images_config.scale == 0.2 && index == 3){
                        layer.msg((images_config.scale >= 1?'The image is the maximum size':'The image is the minimum size'));
                        return false;
                    }
                    images_config.scale = (index == 2?Math.round((images_config.scale + 0.4)*10):Math.round((images_config.scale - 0.4)*10))/10;
                    auto_images_size();
                break;
                case 4:
                    var scale_offset =  images_config.rotate % 360;
                    if(scale_offset >= 180){
                        images_config.rotate += (360 - scale_offset);
                    }else{
                        images_config.rotate -= scale_offset;
                    }
                    images_config.scale = 1;
                    auto_images_size();
                break;
            }
        });
        // 最大最小化图片
        $('.preview_full,.preview_small').click(function(){
            if($(this).hasClass('preview_full')){
                $(this).addClass('hidden').prev().removeClass('hidden');
                images_config.preview_width = that.area[0];
                images_config.preview_height = that.area[1];
                mask.css({width:that.area[0],height:that.area[1],top:0,left:0,margin:0}).data('type','full');
                auto_images_size();
            }else{
                $(this).addClass('hidden').next().removeClass('hidden');
                $('.preview_images_mask').removeAttr('style');
                images_config.preview_width = 750;
                images_config.preview_height = 650;
                auto_images_size();
            }
        });
        // 上一张，下一张
        $('.preview_cut_view a').click(function(){
            var images_src = '',preview_images = $('#preview_images'),images_id = parseInt(preview_images.attr('data-index'));
            if(!$(this).index()){
                images_id = images_id === 0?(that.file_images_list.length - 1) : images_id - 1;
                images_src = that.file_images_list[images_id];
            }else{
                images_id = (images_id == (that.file_images_list.length - 1))?0:(images_id+1);
                images_src = that.file_images_list[images_id];
            }
            preview_images.attr('data-index',images_id).attr('src','/download?filename='+images_src);
            $('.preview_title').html(that.get_path_filename(images_src));
        });
        // 自动图片大小
        function auto_images_size(transition){
            var rotate = Math.abs(images_config.rotate / 90),preview_width = (rotate % 2 == 0?images_config.preview_width:images_config.preview_height),preview_height = (rotate % 2 == 0?images_config.preview_height:images_config.preview_width),preview_images = $('#preview_images'),css_config = {};
            images_config.init_width = images_config.natural_width;
            images_config.init_height = images_config.natural_height;
            if(images_config.init_width > preview_width){
                images_config.init_width = preview_width;
                images_config.init_height = parseFloat(((preview_width / images_config.natural_width) * images_config.init_height).toFixed(2));
            }
            if(images_config.init_height > preview_height){
                images_config.init_width = parseFloat(((preview_height / images_config.natural_height) * images_config.init_width).toFixed(2));
                images_config.init_height= preview_height;
            }
            images_config.current_width = parseFloat(images_config.init_width * images_config.scale);
            images_config.current_height  = parseFloat(images_config.init_height * images_config.scale);
            images_config.current_left = parseFloat(((images_config.preview_width - images_config.current_width) / 2).toFixed(2));
            images_config.current_top = parseFloat(((images_config.preview_height - images_config.current_height) / 2).toFixed(2));
            css_config = {
                'width':images_config.current_width ,
                'height':images_config.current_height,
                'top':images_config.current_top,
                'left':images_config.current_left,
                'display':'inline',
                'transform':'rotate('+ images_config.rotate +'deg)',
                'opacity':1,
                'transition':'all 100ms',
            }
            if(transition === false) delete css_config.transition;
            preview_images.css(css_config);
        }
    },

    /**
     * @description 打开视频播放
     * @param {Object} data 当前文件的数据对象
     * @return void
    */
    open_video_play:function(data){
        var old_filename = data.path,
            imgUrl = '/download?filename=' + data.path,
            p_tmp = data.path.split('/'),
            path = p_tmp.slice(0, p_tmp.length - 1).join('/')
        layer.open({
            type: 1,
            closeBtn: 2,
            title: 'Playing [<a class="btvideo-title">' + p_tmp[p_tmp.length-1] + '</a>]',
            area: ["890px","402px"],
            shadeClose: false,
            skin:'movie_pay',
            content: '<div id="btvideo"><video type="" src="' + imgUrl + '&play=true" data-filename="'+ data.path +'" controls="controls" autoplay="autoplay" width="640" height="360">\
            Your browser does not support video tags\
                        </video></div><div class="video-list"></div>',
            success: function () {
                $.post('/files?action=get_videos', { path: path }, function (rdata) {
                    var video_list = '<table class="table table-hover" style="margin-bottom:0;"><thead style="display: none;"><tr><th style="word-break: break-all;word-wrap:break-word;width:165px;">File name</th><th style="width:65px" style="text-align:right;">Size</th></tr></thead>',index = 0;
                    for (var i = 0; i < rdata.length; i++) {
                        var filename = path + '/' + rdata[i].name;
                        if(filename === old_filename) index = i;
                        video_list += '<tr class="' + ((filename === old_filename) ? 'video-avt' :'') + '"><td style="word-break: break-all;word-wrap:break-word;width:150px" onclick="bt_file.play_file(this,\'' + filename + '\')" title="Size: ' + filename + '\nType: ' + rdata[i].type + '"><a>'
                            + rdata[i].name + '</a></td><td style="font-size: 8px;text-align:right;width:'+ (65 + bt_file.scroll_width) +'px;">' + ToSize(rdata[i].size) + '</td></tr>';
                    }
                    video_list += '</table>';
                    $('.video-list').html(video_list).scrollTop(index * 34);
                });
            }
        });
    },
    /**
     * @description 切换播放
     * @param {String} obj  
     * @param {String} filename 文件名
     * @return void
    */
    play_file:function(obj,filename) {
        if($('#btvideo video').attr('data-filename')== filename) return false;
        var imgUrl = '/download?filename=' + filename + '&play=true';
        var v = '<video src="' + imgUrl +'" controls="controls" data-fileName="'+ filename +'" autoplay="autoplay" width="640" height="360">您的浏览器不支持 video 标签。</video>'
        $("#btvideo").html(v);
        var p_tmp = filename.split('/')
        $(".btvideo-title").html(p_tmp[p_tmp.length-1]);
        $(".video-avt").removeClass('video-avt');
        $(obj).parents('tr').addClass('video-avt');
    },
    /**
     * @description 复制文件和目录
     * @param {Object} data 当前文件的数据对象
     * @return void
    */
    copy_file_or_dir:function(data){
        bt.set_cookie('record_paste',data.path);
        bt.set_cookie('record_paste_type','copy');
        $('.file_all_paste').removeClass('hide');
        layer.msg('Copy successfully. Please click [Paste] or Ctrl + V to paste');
    },
    
    /**
     * @description 剪切文件和目录
     * @param {Object} data 当前文件的数据对象
     * @return void
    */
    cut_file_or_dir:function(data){
        bt.set_cookie('record_paste',data.path);
        bt.set_cookie('record_paste_type','cut');
        $('.file_all_paste').removeClass('hide');
        layer.msg('Cut successfully. Please click [Paste] or Ctrl + V to paste');
    },
    /**
     * @descripttion 粘贴文件和目录
     * @return: 无返回值
     */
    paste_file_or_dir:function(){
        var that = this,_isPaste = bt.get_cookie('record_paste_type'),_paste = bt.get_cookie('record_paste'),_filename = '';
        if(_paste != 'null' && _paste != undefined){_filename = _paste.split('/').pop()}
        if(that.file_path.indexOf(_paste) > -1){
            layer.msg('Can not paste ['+_filename+'] here, Because the item cannot be pasted into itself.',{icon:0})
            return false;
        }
        if(_isPaste != 'null' && _isPaste != undefined){
            switch(_isPaste){
                case 'cut':
                case 'copy':
                    this.check_exists_files_req({dfile:this.file_path,filename:_filename},function(result){
                        if(result.length > 0){
                            var tbody = '';
                            for(var i=0;i<result.length;i++){
                                tbody += '<tr><td><span class="exists_files_style">'+result[i].filename+'</span></td><td>'+ToSize(result[i].size)+'</td><td>'+getLocalTime(result[i].mtime)+'</td></tr>';
                            }
                            var mbody = '<div class="divtable"><table class="table table-hover" width="100%" border="0" cellpadding="0" cellspacing="0"><thead><th>File name</th><th>Size</th><th>Last edit time</th></thead>\
                                        <tbody>'+tbody+'</tbody>\
                                        </table></div>';
                            SafeMessage('This files will be overwritten',mbody,function(){
                                that.config_paste_to(_paste,_filename);
                            });
                        }else{
                            that.config_paste_to(_paste,_filename);
                        }
                    })
                break;
                case '1':
                case '2':
                    that.batch_file_paste();
                break;
            }
        }
    },
    /**
     * @descripttion 粘贴到
     * @param {String} path         复制/剪切路径
     * @param {String} _filename     文件名称
     * @return: 无返回值
     */
    config_paste_to:function(path,_filename){
        var that = this,_type= bt.get_cookie('record_paste_type');
        this.$http(_type == 'copy'?'CopyFile':'MvFile',{sfile:path,dfile:(this.file_path+'/'+_filename)},function(rdata){
            if(rdata.status){
                bt.set_cookie('record_paste',null);
                bt.set_cookie('record_paste_type',null);
                that.reader_file_list({path:that.file_path})
            }
            layer.msg(rdata.msg,{icon:rdata.status?1:2})
        })
    },
    /**
     * @description 重命名文件和目录
     * @param {Object} data 当前文件的数据对象
     * @return void
    */
    rename_file_or_dir:function(data){
        var that = this;
        that.is_editor = true;
        $('.file_list_content .file_tr:nth-child('+(data.index+1)+')').addClass('editr_tr').find('.file_title').empty().append($((bt.get_cookie('rank') == 'icon'?'<textarea name="rename_file_input" onfocus="this.select()">'+data.filename+'</textarea>':'<input name="rename_file_input" onfocus="this.select()" type="text" value="'+data.filename+'">')))
        if(bt.get_cookie('rank') == 'icon'){
            $('textarea[name=rename_file_input]').css({'height':$('textarea[name=rename_file_input]')[0].scrollHeight})
        }
        $((bt.get_cookie('rank') == 'icon'?'textarea':'input')+'[name=rename_file_input]').on('input',function(){
            if(bt.get_cookie('rank') == 'icon'){
                this.style.height = 'auto';
                this.style.height = this.scrollHeight + "px";
            }
            if(data.type == 'file'){
                var ext_arry = $(this).val().split('.'),ext = ext_arry[ext_arry.length- 1];
                $(this).parent().prev().find('.file_icon').removeAttr('class').addClass('file_icon file_'+ ext);
            }
        }).keyup(function(e){
            if(e.keyCode == 13) $(this).blur();
            e.stopPropagation();
            e.preventDefault();
        }).blur(function(){
            var _val = $(this).val().replace(/[\r\n]/g,""),config = {sfile:data.path,dfile: that.path_resolve(that.file_path,_val)}
            if(data.filename == _val || _val == ''){
                $('.file_list_content .file_tr:nth-child('+(data.index+1)+')').removeClass('editr_tr').find('.file_title').empty().append($('<i>'+data.filename+'</i>'));
                that.is_editor = false;
                return false;
            }
            if(that.match_unqualified_string(_val)) return layer.msg('The name cannot have /\\:*?"<>| symbol',{icon:2});
            that.rename_file_req(config,function(res){
                that.reader_file_list({path:that.file_path},function(){layer.msg(res.msg,{icon:res.status?1:2})});
            });
            that.is_editor = false;
        }).focus();
    },

    /**
     * @description 设置文件和目录分享
     * @param {Object} data 当前文件的数据对象
     * @returns void
     */
    set_file_share:function(data){
        var that = this;
        this.loadY = bt.open({
            type: 1,
            shift: 5,
            closeBtn: 2,
            area: '450px',
            title: 'Set share '+ data.type_tips +'-['+ data.filename +']',
            btn:['Create','Cancel'],
            content: '<from class="bt-form" id="outer_url_form" style="padding:30px 15px;display:inline-block">'
                + '<div class="line"><span class="tname">Share name</span><div class="info-r"><input name="ps"  class="bt-input-text mr5" type="text" placeholder="No sharing name" style="width:270px" value="'+ data.filename +'"></div></div>'
                + '<div class="line"><span class="tname">Expiration date</span><div class="info-r">'
                    +'<label class="checkbox_grourd"><input type="radio" name="expire" value="24" checked><span>&nbsp;A Day</span></label>'
                    +'<label class="checkbox_grourd"><input type="radio" name="expire" value="168"><span>&nbsp;A Deek</span></label>'
                    +'<label class="checkbox_grourd"><input type="radio" name="expire" value="1130800"><span>&nbsp;Permanent</span></label>'
                +'</div></div>'
                + '<div class="line"><span class="tname">Extraction code</span><div class="info-r"><input name="password" class="bt-input-text mr5" placeholder="No code if it is empty" type="text" style="width:195px" value=""><button type="button" id="random_paw" class="btn btn-success btn-sm btn-title">Random</button></div></div>'
            + '</from>',
            yes:function(indexs,layers){
                var ps = $('[name=ps]').val(),expire = $('[name=expire]:checked').val(),password = $('[name=password]').val();
                if(ps === ''){
                    layer.msg('No sharing name!',{icon:2})
                    return false;
                }
                that.create_download_url({
                    filename:data.path,
                    ps:ps,
                    password:password,
                    expire:expire
                },function(res){
                    if(!res.status){
                        layer.msg(res.msg,{icon:res.status?1:2})
                        return false;
                    }else{
                        var rdata = res.msg;
                        that.file_list[data.index] = $.extend(that.file_list[data.index],{down_id:rdata.id,down_info:rdata});
                        that.loadY.close();
                        that.info_file_share(data);
                        that.reader_file_list_content(that.file_list);
                    }
                });
            },
            success: function (layers, index) {
                $('#random_paw').click(function(){
                    $(this).prev().val(bt.get_random(6));
                });
            }
        });
    },

    /**
     * @description 分享信息查看
     * @param {Object} data 当前文件的数据对象
     * @returns void
    */
    info_file_share:function(data){
        var that = this;
        if(typeof data.down_info == "undefined"){
            this.get_download_url_find({id:data.down_id},function(res){
                that.file_list[data.index] = $.extend(that.file_list[data.index],{down_info:res});
                that.file_share_view(that.file_list[data.index],'fonticon');
            })
            return false;
        }
        this.file_share_view(data,'fonticon');
    },
    /**
     * @description 分享信息视图
     * @param {Object} data 当前文件的数据对象
     * @param {String} type 区别通过右键打开或是图标点击
     * @returns void
    */
    file_share_view:function(datas,type){
        var data = datas
        if(type == 'fonticon'){data = datas.down_info}
        var that = this,download_url = location.origin + '/down/'+ data.token;
        this.loadY = bt.open({
            type: 1,
            shift: 5,
            closeBtn: 2,
            area: '550px',
            title: 'Share details-['+ data.filename +']',
            content: '<div class="bt-form pd20 pb70">'
                    + '<div class="line"><span class="tname">Share name</span><div class="info-r"><input readonly class="bt-input-text mr5" type="text" style="width:365px" value="'+ data.ps +'"></div></div>'
                    + '<div class="line external_link"><span class="tname">Share chain</span><div class="info-r"><input readonly class="bt-input-text mr5" type="text" style="width:280px" value="'+ download_url +'"><button type="button" id="copy_url" data-clipboard-text="'+ download_url +'" class="btn btn-success btn-sm btn-title copy_url" style="margin-right:5px" data-clipboard-target="#copy_url"><img style="width:16px" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAABIUlEQVQ4T6XTsSuFURjH8d+3/AFm0x0MyqBEUQaUIqUU3YwWyqgMptud/BlMSt1SBiklg0K3bhmUQTFZDZTxpyOvznt7z3sG7/T2vOf5vM85z3nQPx+KfNuHkhoZ7xXYjNfEwIukXUnvNcg2sJECnoHhugpsnwBN21PAXVgbV/AEjNhuVSFA23YHWLNt4Cc3Bh6BUdtLcbzAgHPbp8BqCngAxjJbOANWUkAPGA8fE8icpD1gOQV0gclMBRfAYgq4BaZtz/YhA5IGgY7tS2AhBdwAM7b3JX1I+iz1G45sXwHzKeAa6P97qZgcEA6v/ZsR3v9aHCmt0P9UBVuShjKz8CYpXPkDYKJ0kaKhWpe0UwOFxDATx5VACFZ0Ivbuga8i8A3NFqQRZ5pz7wAAAABJRU5ErkJggg=="></button><button type="button" class="btn btn-success QR_code btn-sm btn-title"><img  style="width:16px" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAABUklEQVQ4T6WSIU9DQRCEvwlYLIoEgwEECs3rDyCpobbtL6AKRyggMQ9TJBjUMzgMCeUnIEAREoICFAoEZMk2dy/Xo4KGNZu7nZ2bnT3xz1DsN7MFYCnhe5V0n/Kb2QowL2kY70cEoXAHVEnDG/ABXAJXmVDHVZKqSFAA58AqsAY8AW3A68/AQ7hbBG6BbeDGlaQEh8AucA3suzDgC5gFXHID2At5YxJBNwA6ocFBM8B3OL8DTaCcpMDN2QojxHHdk9Qrx9SeAyf1CMFIJ3DjYqxLOgo192gs4ibSNfrMOaj2yBvMrCnpImYHR4C/vizpIPkX/mpbUtfMepJKMxtKKsyslNTLCZxkBzgFjoE5oCVp08yKvyhwgkGyRl9nX1LDzDz3kzxS8kuBpFYygq8xJ4gjjBMEpz+BF+AxcXLg39XMOpLOciW1gtz9ac71GqdpSrE/8U20EQ3XLHEAAAAASUVORK5CYII="></button></div></div>'
                    + '<div class="line external_link" style="'+ (data.password == ""?"display:none;":"display:block") +'"><span class="tname">Extraction code</span><div class="info-r"><input readonly class="bt-input-text mr5" type="text" style="width:243px" value="'+ data.password +'"><button type="button" data-clipboard-text="Chain:'+ download_url +' Extraction code:'+ data.password +'"  class="btn btn-success copy_paw btn-sm btn-title">Copy link and code</button></div></div>'
                    + '<div class="line"><span class="tname">Expiration date</span><div class="info-r"><span style="line-height:32px; display: block;font-size:14px">'+((data.expire > (new Date('2099-01-01 00:00:00').getTime())/1000)?'<span calss="btlink">Permanent</span>':bt.format_data(data.expire))+'</span></div></div>'
                    + '<div class="bt-form-submit-btn">'
                    + '<button type="button" class="btn btn-danger btn-sm btn-title layer_close">' + lan.public.close + '</button>'
                    + '<button type="button" id="down_del" class="btn btn-danger btn-sm btn-title close_down" style="color:#fff;background-color:#c9302c;border-color:#ac2925;" onclick="">Close sharing chain</button>'
                    + '</div>'
                + '</div>',
            success: function (layers,index) {
                var copy_url = new ClipboardJS('.copy_url');
                var copy_paw = new ClipboardJS('.copy_paw');
                copy_url.on('success', function(e) {
                    layer.msg('Copy link succeeded!',{icon:1});
                    e.clearSelection();
                });
                copy_paw.on('success', function(e) {
                    layer.msg('Copy link and extraction code succeeded!',{icon:1});
                    e.clearSelection();
                });
                $('.layer_close').click(function(){
                    layer.close(index);
                });
                $('.QR_code').click(function(){
                    layer.closeAll('tips');
                    layer.tips('<div style="height:140px;width:140px;padding:8px 0" id="QR_code"></div>','.QR_code',{
                        area:['150px','150px'],
                        tips: [1, '#ececec'],
                        time:0,
                        shade:[0.05, '#000'],
                        shadeClose:true,
                        success:function(){
                            jQuery('#QR_code').qrcode({
                                render: "canvas",
                                text: download_url,
                                height:130,
                                width:130
                            });
                        }
                    });
                });
                $('.close_down').click(function(){
                    that.remove_download_url({id:data.id,fileName:data.filename},function(res){
                        that.loadY.close();
                        if(type == 'fonticon'){
                            that.file_list[datas.index].down_id = 0;
                            that.reader_file_list_content(that.file_list);
                        }
                        if(type == 'list'){that.render_share_list();}
                        layer.msg(res.msg,{icon:res.status?1:2})
                    })
                });
            }
        });
    },
    /**
     * @description 删除文件和目录
     * @param {Object} data 当前文件的数据对象
     * @return void
    */
    del_file_or_dir:function(data){
        var that = this;
        if(that.is_recycle){
            bt.confirm({
                title:'Delete '+ data.type_tips +'[&nbsp;'+ data.filename +'&nbsp;]',
                msg:'<span>Comfirm delete '+ data.type_tips +'[&nbsp;'+ data.path +'&nbsp;],it will move to recycle bin after delete, continue?</span>'
            },function(){
                that.del_file_req(data,function(res){
                    that.reader_file_list({path:that.file_path})
                    layer.msg(res.msg,{icon:res.status?1:2})
                });
            });
        }else{
            bt.show_confirm('Delete '+ data.type_tips +'[&nbsp;'+ data.filename +'&nbsp;]','<i style="font-size: 15px;font-style: initial;color: red;">Recycle bin is not currently open, delete '+ (data.type == 'dir'?'directory':'file') +' cannot be restored after, continue?</i></span>',function(){
                that.del_file_req(data,function(res){
                    that.reader_file_list({path:that.file_path})
                    layer.msg(res.msg,{icon:res.status?1:2})
                });
            })
        }
        
    },

    /**
     * @description 取消文件收藏
     * @param {Object} data 当前文件的数据对象
     * @param {Object} el 当前元素对象
     * @returns void
     */
    cancel_file_favorites:function(data){
        var that = this,index = data.index;
        this.loadY = bt.confirm({title:data['filename'] +lan.files.unfavorite1, msg:lan.files.unfavorite1+' ['+ data['path'] + '] ' + lan.files.continue},function(){
            that.$http('del_files_store',{path:data.path},function(res){
                if(res.status){
                    that.file_list[index].caret = false;
                    that.reader_file_list_content(that.file_list);
                    that.load_favorites_index_list();
                }
                layer.msg(res.msg,{icon:res.status?1:2})
            })
        });
    },
    
    /**
     * @description 设置文件权限 - ok
     * @param {Object} data 当前文件的数据对象
     * @param {Boolean} isPatch 是否多选
     * @returns void
    */
    set_file_authority:function(data,isPatch){
        var that = this;
        that.get_file_authority({path:data.path},function(rdata){
            var tex = '<div class="info-title-tips" style="padding-left: 7px;margin: 10px 23px;">\
                <span class="glyphicon glyphicon-alert" style="color: #f39c12; margin-right: 5px;"></span>\
                <span class="backuptip"></span>\
                <button class="restore btn btn-success btn-sm" style="margin-left: 5px;">Backup</button>\
                <div style="display: inline-block;width: 1px;height: 13px;background: #20a53a;vertical-align: middle;margin: 0 5px;"></div>\
                <button class="manage btn btn-default btn-sm tolist" style="padding:6px;">Restore</button>\
            </div>';
            that.loadY = layer.open({
                type: 1,
                closeBtn: 2,
                title: lan.files.set_auth + '[' + data.filename + ']',
                area: '465px',
                shadeClose: false,
                content: '<div class="setchmod bt-form" style="padding: 0;">\
                            <div class="bt_tab_list">\
                                <div class="bt_tab_index active" data-index="0">Set permission</div>\
                                <div class="bt_tab_index backup-list" data-index="1">Backups list</div>\
                            </div>\
                            <div class="chmodset" style="margin-bottom: 60px;">' + tex + '\
                                <fieldset>\
                                    <legend>'+ lan.files.file_own + '</legend>\
                                    <p><input type="checkbox" id="owner_r" />'+ lan.files.file_read + '</p>\
                                    <p><input type="checkbox" id="owner_w" />'+ lan.files.file_write + '</p>\
                                    <p><input type="checkbox" id="owner_x" />'+ lan.files.file_exec + '</p>\
                                </fieldset>\
                                <fieldset>\
                                    <legend>'+ lan.files.file_group + '</legend>\
                                    <p><input type="checkbox" id="group_r" />'+ lan.files.file_read + '</p>\
                                    <p><input type="checkbox" id="group_w" />'+ lan.files.file_write + '</p>\
                                    <p><input type="checkbox" id="group_x" />'+ lan.files.file_exec + '</p>\
                                </fieldset>\
                                <fieldset>\
                                    <legend>'+ lan.files.file_public + '</legend>\
                                    <p><input type="checkbox" id="public_r" />'+ lan.files.file_read + '</p>\
                                    <p><input type="checkbox" id="public_w" />'+ lan.files.file_write + '</p>\
                                    <p><input type="checkbox" id="public_x" />'+ lan.files.file_exec + '</p>\
                                </fieldset>\
                                <div class="setchmodnum"><input class="bt-input-text" type="text" id="access" maxlength="3" value="'+ rdata.chmod + '">' + lan.files.file_menu_auth + '，\
                                <span>'+ lan.files.file_own + '\
                                <select id="chown" class="bt-input-text">\
                                    <option value="www" '+ (rdata.chown == 'www' ? 'selected="selected"' : '') + '>www</option>\
                                    <option value="mysql" '+ (rdata.chown == 'mysql' ? 'selected="selected"' : '') + '>mysql</option>\
                                    <option value="root" '+ (rdata.chown == 'root' ? 'selected="selected"' : '') + '>root</option>\
                                </select></span>\
                                <span><input type="checkbox" id="accept_all" checked /><label for="accept_all" style="position: absolute;margin-top: 4px; margin-left: 5px;font-weight: 400;">Apply to subdir</label></span>\
                                </div>\
                            </div>\
                            <div class="backup_lists"></div>\
                            <div class="bt-form-submit-btn">\
                                <button type="button" class="btn btn-danger btn-sm btn-title layer_close">'+ lan.public.close + '</button>\
                                <button type="button" class="btn btn-success btn-sm btn-title set_access_authority">' + lan.public.ok + '</button>\
                            </div>\
                        </div>',
                success: function (index,layers) {
                    that.edit_access_authority();
                    $("#access").keyup(function () {
                        that.edit_access_authority();
                    });
                    $("input[type=checkbox]").change(function () {
                        var idName = ['owner', 'group', 'public'];
                        var onacc = '';
                        for (var n = 0; n < idName.length; n++) {
                            var access = 0;
                            access += $("#" + idName[n] + "_x").prop('checked') ? 1 : 0;
                            access += $("#" + idName[n] + "_w").prop('checked') ? 2 : 0;
                            access += $("#" + idName[n] + "_r").prop('checked') ? 4 : 0;
                            onacc += access;
                        }
                        $("#access").val(onacc);
                    });
                    //提交
                    $('.set_access_authority').click(function(){
                        var chmod = $("#access").val();
                        var chown = $("#chown").val();
                        var all = $("#accept_all").prop("checked") ? 'True' : 'False';
                        var _form = {}
                        _form = {
                            user:chown,
                            access:chmod,
                            all:all
                        }
                        if(isPatch){
                            _form['type'] = data.type
                            _form['path'] = data.path
                            _form['data'] = data.filelist
                        }else{
                            _form['filename'] = data.path
                        }
                        that.$http(isPatch?'SetBatchData':'SetFileAccess',_form,function(res){
                            if (res.status){
                                layer.close(layers);
                                that.reader_file_list({path:that.file_path,is_operating:false}
                            )}
                            layer.msg(res.msg, { icon: res.status ? 1 : 2 });
                        })
                    })
                    $('.layer_close').click(function () {
                        layer.close(layers);
                    });

                    that.$http('get_path_premissions',{path: data.filename},function(edata){
                        if(edata.length == 0) $('.backuptip').text('No backup');
                    });
                    $('button.restore').click(function () {
                        that.backup_files_permission(data.path,1);
                    });
                    $(".tolist").click(function () {
                        $(".backup-list").click();
                    });
                    $(".bt_tab_list .bt_tab_index").click(function () {
                        $(this).addClass('active').siblings().removeClass('active');
                        if($(this).index()==0){
                            $('.backup_lists').empty();
                            $('.chmodset').show();
                        }else{
                            that.backup_files_list(data.path);
                        }
                    });
                }
            });
        });
    },
    /**
     * @description 备份权限弹窗
     * @returns void
     */
    backup_files_permission:function(file, type){
        //文件夹type为0
        var sub_type = 1;
        if (type == 1) {
            sub_type = $("#accept_all").prop("checked") ? 1 : 0;
        }
        // if (file == '' || typeof (file) == 'undefined') {
        //     layer.msg('Please select a directory or file', {
        //         icon: 2,
        //         time: 1900
        //     });
        //     return false;
        // }
        var that = this;
        var layerss = layer.open({
            type: 1,
            closeBtn: 2,
            title: 'Confirm backup?',
            area: '300px',
            shadeClose: false,
            btn: ['Yes', 'No'],
            content: '<div style="padding: 20px;margin: 0;font-size: 13px;">\
                            <p style="padding: 8px 5px;font-size: 13px;">Please enter the current backup name</p>\
                            <div>Remarks\
                                <input type="text" class="form-control ml5 mt10" placeholder="Please enter name" style="width: 179px;display: inline-block;">\
                            </div>\
                        </div>',
            yes: function (layerss, index) {
                $('.layer_close').click(function () {
                    layer.close(index);
                });
                that.$http('back_path_permissions',{back_sub_dir: sub_type,path: file,remark: $("input.form-control").val()},function(edata){
                    layer.close(layerss);
                    if (!edata.status) {
                        layer.msg(edata.msg, {
                            time: 1900,
                            icon: 2,
                        });
                        return false;
                    }
                    if (type == 0) {
                        var new_back = that.backup_list();
                        $(".buplist").html(new_back);
                    } else if (type == 3) {
                        var chmod = $("#access").val();
                        var chown = $("#chown").val();
                        var all = $("#accept_all").prop("checked") ? 'True' : 'False';
                        var data = 'filename=' + encodeURIComponent(file) + '&user=' + chown + '&access=' + chmod + '&all=' + all;
                        Oksend(data);
                        layer.closeAll();
                    }
                    layer.msg(edata.msg, {
                        time: 1900,
                        icon: 1,
                    });
                });
            },
            btn2: function () {
                layer.close(layerss);
            },
            cancel: function () {
                layer.close(layerss);
            }
        });
    },
    /**
     * @description 全部备份权限列表
     * @returns void
     */
    backup_list:function(){
        var all_back = '',that = this;
        that.$http('get_all_back',function(edata){
            for (var i = 0; i < edata.length; i++) {
                var d = new Date(edata[i][2] * 1000);
                var minut = d.getMinutes();
                var hours = d.getHours();
                var second = d.getSeconds();
                if (minut <= 9) minut = '0' + minut + '';
                if (hours <= 9) hours = '0' + hours + '';
                if (second <= 9) second = '0' + second + '';
                var date = (d.getFullYear()) + "/" +
                    (d.getMonth() + 1) + "/" +
                    (d.getDate()) + " " +
                    (hours) + ":" + (minut) + ":" + (second);
                all_back += '<tr style="padding: 5px;margin: 0;border: #e6e6e6 1px solid;border-top: none;" data-id="' + edata[i][0] + '">\
                    <td>' + date + '</td>\
                    <td style="max-width: 297px;min-width: 297px;">\
                        <a style="width: 287px;overflow: hidden;text-overflow: ellipsis;white-space: nowrap;display: inline-block;" class="btlink"  title="' + edata[i][3] + '" href="javascript:openPath(\'' + edata[i][3] + '\');">' + edata[i][3] + '</a>\
                    </td>\
                    <td style="max-width: 77px;min-width: 77px;overflow: hidden;text-overflow: ellipsis;text-align: left;" title="' + edata[i][1] + '">' + edata[i][1] + '</td>\
                    <td style="min-width: 60px;text-align: center;"><a class="btlink del_back">Del</a></td>\
                </tr>';
            }
            $(".allback .buplist").html(all_back);
        });
    },
    /**
     * @description 全部备份权限弹窗
     * @returns void
     */
    manage_backup:function(){
        var that = this;
        var layerss = layer.open({
            type: 1,
            closeBtn: 2,
            title: 'Manage Backups',
            area: ['630px', '500px'],
            shadeClose: false,
            content: '<div class="allback pd20" style="padding-bottom: 0;">\
                        <div class="info-r c4 mb15 text-left relative">\
                            <input class="bt-input-text" id="server_path" type="text" name="path" placeholder="Please select the project path" style="width:75%;">\
                            <div style="display: inline-block;position: absolute;right:0;text-align: right;">\
                                <span data-id="path" class="glyphicon cursor glyphicon-folder-open" style="margin-right: 31px;" onclick="ChangePath(\'server_path\',\'dir\')"></span>\
                                <button class="btn btn-success btn-sm btn-backup" id="btn-backup">Backup</button>\
                            </div>\
                        </div>\
                        <table class="text-left table table-hover" style="margin-bottom: 0;">\
                            <thead style="background: #f6f6f6;margin: 0;border: #e6e6e6 1px solid;border-bottom: none;">\
                                <tr>\
                                    <th style="color: #666;font-weight: 600;padding: 10px 8px;width: 151px;border-bottom: none;">Backup time</th>\
                                    <th style="color: #666;font-weight: 600;padding: 10px 8px;width: 290px;border-bottom: none;">Backup path</th>\
                                    <th style="color: #666;font-weight: 600;padding: 10px 8px;text-align: center;border-bottom: none;">Name</th>\
                                    <th style="color: #666;font-weight: 600;padding: 10px 8px;text-align: center;border-bottom: none;">Delect</th>\
                                </tr>\
                            </thead>\
                        </table>\
                        <div style="height: 337px;overflow: auto;">\
                            <table class="text-left table table-hover">\
                                <tbody class="buplist"></tbody>\
                            </table>\
                        </div>\
                    </div>',
            cancel: function () {
                layer.close(layerss);
            },
            success: function () {
                that.backup_list()
                $("#btn-backup").click(function (e) {
                    var backup_path = $("#server_path").val();
                    that.backup_files_permission(backup_path,0);
                });
                $(".allback").on('click', '.del_back', function () {
                    var _id = $(this).parents('tr').attr('data-id');
                    that.del_backup(_id);
                });
            }
        });
    },
    /**
     * @description 删除备份
     * @returns void
     */
    del_backup:function(id){
        var that = this;
        layer.confirm('The backup cannot be restored after deletion.<br>Continue to delete?',{title: 'Confirm delete？',btn: ['Yes', 'No'],closeBtn:2},function(index, layero){
            that.$http('del_path_premissions',{id: id},function(edata){
                var file = $(".layui-layer-title:eq(0)").text();
                if(file!=='Manage Backups'){
                    file = $(".backup_list").attr('data-path');
                    that.backup_files_list(file);
                }else{
                    $(".allback tbody tr[data-id=" + id + "]").remove();
                }
                layer.msg(edata.msg, { icon: edata.status ? 1 : 2 });
            });
        });
    },
    /**
     * @description 本文件备份列表
     * @returns void
     */
    backup_files_list:function(fileName){
        var that = this;
        that.$http('get_path_premissions',{path: fileName},function(edata){
            var tbody = '',cont='';
            if(edata.length==0){
                tbody='<tr><td colspan="5" align="center">No data</td></tr>'
            }else{
                for (var i = 0; i < edata.length; i++) {
                    var d = new Date(edata[i][3] * 1000),
                    minut = d.getMinutes(),
                    hours = d.getHours();
                    if (minut <= 9) minut = '0' + minut + '';
                    if (hours <= 9) hours = '0' + hours + '';
                    var date = (d.getFullYear()) + "/" +
                        (d.getMonth() + 1) + "/" +
                        (d.getDate());
                    tbody += '<tr>\
                        <td><span style="display: inline-block;width: 60px; overflow: hidden;text-overflow: ellipsis;">'+edata[i][4]+'</span></td>\
                        <td>'+edata[i][2]+'</td>\
                        <td>'+edata[i][1]+'</td>\
                        <td>'+date+'</td>\
                        <td style="color: #666;text-align: right;"><a data-time="' + edata[i][3] + '" class="btlink restore_backup">Restore</a> | <a data-id="' + edata[i][5] + '" class="btlink del_back">Del</a></td>\
                    </tr>';
                }
            }
            cont = '<div class="divtable" style="height: 260px; overflow: auto;padding:11px 13px 3px;">\
                <div class="info-title-tips" style="text-align:left;margin-bottom: 7px;">\
                    <span class="glyphicon glyphicon-alert" style="color: #f39c12; margin-right: 5px;"></span>\
                    <span>Fix all permissions to [ Folder: 755, File: 644 ]</span>\
                    <button class="manage btn btn-default btn-sm btn-success fixper" style="padding:6px;margin-left: 7px;">Fix permissions</button>\
                </div>\
                <table width="100%" border="0" cellpadding="0" cellspacing="0" class="table table-hover">\
                    <thead>\
                        <tr>\
                            <th width="60">Name</th>\
                            <th width="35">permission</th>\
                            <th width="45">Owner</th>\
                            <th>Backup Time</th>\
                            <th style="text-align: right;">Opt</th>\
                        </tr>\
                    </thead>\
                    <tbody class="backup_list" data-path="'+fileName+'">\
                        '+tbody+'\
                    </tbody>\
                </table>\
            </div>';
            $('.chmodset').hide();
            $('.backup_lists').html(cont);
            $(".fixper").click(function () {
                layer.confirm('Note: Under the file or folder all permissions will be fixed to [ Folder: 755, File: 644 ]',
                {title: 'Fix Permissions？',btn: ['Confirm', 'Cancel'],closeBtn:2},function(index, layero){
                    that.$http('fix_permissions',{path: fileName},function(res){
                        layer.closeAll();
                        that.reader_file_list({path:that.file_path,is_operating:false});
                        layer.msg(res.msg, { icon: res.status ? 1 : 2 });
                    });
                });
            });
            $(".restore_backup").click(function () {
                that.restore_file_permission($(this).attr('data-time'),fileName);
            });
            $(".backup_list").on('click', '.del_back', function () {
                var _id = $(this).attr('data-id');
                that.del_backup(_id);
            });
        });
    },
    /**
     * @description 权限备份的还原
     * @returns void
     */
    restore_file_permission:function(restore_time,fileName){
        var that = this, sub_type = $("#accept_all").prop("checked") ? 1 : 0;
        var layerss = layer.open({
            type: 1,
            closeBtn: 2,
            title: 'Confirm restore',
            area: '330px',
            shadeClose: false,
            btn: ['Yes', 'No'],
            content: '<div style="padding: 20px;font-size: 14px;">\
                        Restore would overwrite the current settings, continue?\
                    </div>',
            yes: function (layerss, index) {
                that.$http('restore_path_permissions',{restore_sub_dir: sub_type,date: restore_time,path: fileName},function(edata){
                    layer.closeAll();
                    layer.msg(edata.msg, {
                        icon: 1,
                        time: 1900
                    });
                });
            },
            btn2: function () {
                layer.close(layerss);
            },
            cancel: function () {
                layer.close(layerss);
            }
        });
    },
    /**
     * @description 获取实时任务视图
     * @returns void
     */
    get_present_task_view:function(){
        this.file_present_task = layer.open({
            type: 1,
            title: "实时任务队列",
            area: '500px',
            closeBtn: 2,
            skin:'present_task_list',
            shadeClose: false,
            shade: false,
            offset: 'auto',
            content: '<div style="margin: 10px;" class="message-list"></div>'
        })
    },
    /**
     * @description 渲染实时任务列表数据
     * @returns void
     */
    render_present_task_list:function(){
        var that = this;
        this.get_task_req({status:-3},function(lists){
            if(lists.length == 0){
                layer.close(that.file_present_task)
                that.file_present_task = null;
                that.reader_file_list({path:that.file_path,is_operating:false})
                return
            }
            var task_body = '',is_add = false;
            $.each(lists,function(index,item){
                if(item.status == -1){
                    if(!that.file_present_task) that.get_present_task_view();
                    if(item.type == '1'){
                        task_body +='<div class="mw-con">\
                            <ul class="waiting-down-list">\
                                <li>\
                                    <div class="down-filse-name"><span class="fname" style="width:80%;" title="'+lan.layout.download+ item.shell + '">'+lan.layout.download + item.shell + '</span><span style="position: absolute;left: 84%;top: 25px;color: #999;">' + item.log.pre + '%</span><span class="btlink" onclick="bt_file.remove_present_task(' + item.id + ')" style="position: absolute;top: 25px;right: 20px;">'+lan.public.cancel+'</span></div>\
                                    <div class="down-progress"><div class="done-progress" style="width:'+ item.log.pre + '%"></div></div>\
                                    <div class="down-info"><span class="total-size"> '+ item.log.used + '/' + ToSize(item.log.total) + '</span><span class="speed-size">' + (item.log.speed == 0 ? lan.layout.connect : item.log.speed) + '/s</span><span style="margin-left: 20px;">'+lan.files.expected_to_be+': ' + item.log.time +'</span></div>\
                                </li>\
                            </ul>\
                            </div>'
                    }else{
                        task_body += '<div class="mw-title"><span style="max-width: 88%;display: block;overflow: hidden;text-overflow: ellipsis;white-space: nowrap;">' + item.name + ': ' + item.shell + '</span><span class="btlink" onclick="bt_file.remove_present_task(' + item.id + ')"  style="position: absolute;top: 10px;right: 15px;">'+lan.public.cancel+'</span></div>\
                        <div class="mw-con codebg">\
                            <code>'+ item.log +'</code>\
                        </div>'
                    }
                }else{
                    if (!is_add) {
                        task_body += '<div class="mw-title">'+lan.layout.wait_task+'</div><div class="mw-con"><ul class="waiting-list">';
                        is_add = true;
                    }
                    task_body += '<li><span class="wt-list-name" style="width: 90%;">' + item.name + ': ' + item.shell + '</span><span class="mw-cancel" onclick="bt_file.remove_present_task(' + item.id + ')">X</span></li>';
                }
            })
            if(that.file_present_task){
                if(is_add) task_body+= '</ul></div>'
                $(".message-list").html(task_body);
            }
            setTimeout(function () { that.render_present_task_list(); }, 1000);
        })
    },
    /**
     * @description 取消实时任务列表
     * @returns void
     */
    remove_present_task:function(id){
        var that = this;
        layer.confirm('Do you want to cancel the upload of files? It need to delete the uploaded files manually. Continue?',{title:'Cancel file upload',icon:0},function(indexs){
            bt.send('remove_task','task/remove_task',{id:id},function(rdata){
                layer.msg(rdata.msg,{icon:1})
                layer.close(that.file_present_task)
                that.file_present_task = null;
            })
            layer.close(indexs);
        });
    },
    /**
     * @descripttion 设置访问权限
     * @returns void
     */
    edit_access_authority:function(){
        var access = $("#access").val();
        var idName = ['owner', 'group', 'public'];
        for (var n = 0; n < idName.length; n++) {
            $("#" + idName[n] + "_x").prop('checked', false);
            $("#" + idName[n] + "_w").prop('checked', false);
            $("#" + idName[n] + "_r").prop('checked', false);
        }
        for (var i = 0; i < access.length; i++) {
            var onacc = access.substr(i, 1);
            if (i > idName.length) continue;
            if (onacc > 7) $("#access").val(access.substr(0, access.length - 1));
            switch (onacc) {
                case '1':
                    $("#" + idName[i] + "_x").prop('checked', true);
                    break;
                case '2':
                    $("#" + idName[i] + "_w").prop('checked', true);
                    break;
                case '3':
                    $("#" + idName[i] + "_x").prop('checked', true);
                    $("#" + idName[i] + "_w").prop('checked', true);
                    break;
                case '4':
                    $("#" + idName[i] + "_r").prop('checked', true);
                    break;
                case '5':
                    $("#" + idName[i] + "_r").prop('checked', true);
                    $("#" + idName[i] + "_x").prop('checked', true);
                    break;
                case '6':
                    $("#" + idName[i] + "_r").prop('checked', true);
                    $("#" + idName[i] + "_w").prop('checked', true);
                    break;
                case '7':
                    $("#" + idName[i] + "_r").prop('checked', true);
                    $("#" + idName[i] + "_w").prop('checked', true);
                    $("#" + idName[i] + "_x").prop('checked', true);
                    break;
            }
        }
    },
    /**
     * @description 获取文件权限 - ok
     * @param {Object} data 当前文件的数据对象
     * @param {Object} el 当前元素对象
     * @returns void
    */
    get_file_authority:function(data,callback){
        this.$http('GetFileAccess',{filename:data.path},function(rdata){if(callback) callback(rdata)});
    },
    /**
     * @description 文件夹目录查杀
     * @param {Object} data 当前文件的数据对象
     * @returns void
     */
    set_dir_kill:function(data){
        var that = this;
        if(data.ext == 'php'){
            that.$http('file_webshell_check',{filename:data.path},function(rdata){
                layer.msg(rdata.msg,{icon:rdata.status?1:2})
            })
        }else{
            layer.confirm('目录查杀将包含子目录中的php文件，是否操作？', { title: '目录查杀['+data['filename']+']', closeBtn: 2, icon: 3 }, function (index) {
                that.$http('dir_webshell_check',{path:data.path},function(rdata){
                    layer.msg(rdata.msg,{icon:rdata.status?1:2})
                })
            })
        }
    },
    /**
     * @description 文件路径合并
     * @param {String} paths 旧路径
     * @param {String} param 新路径
     * @return {String} 新的路径
    */
    path_resolve:function(paths, param){
        var path = '',split = '';
        if(!Array.isArray(param)) param = [param];
        paths.replace(/([\/|\/]*)$/,function($1){
            split = $1;
            return 'www';
        });
        $.each(param,function(index,item){
            path += '/' + item;
        });
        return (paths+path).replace('//','/');
    },
    
    /**
     * @descripttion 取扩展名
     * @return: 返回扩展名
     */
    get_ext_name:function(fileName){
        var extArr = fileName.split(".");	
        var exts = ["folder", "folder-unempty", "sql", "c", "cpp", "cs", "flv", "css", "js", "htm", "html", "java", "log", "mht", "php", "url", "xml", "ai", "bmp", "cdr", "gif", "ico", "jpeg", "jpg", "JPG", "png", "psd", "webp", "ape", "avi", "mkv", "mov", "mp3", "mp4", "mpeg", "mpg", "rm", "rmvb", "swf", "wav", "webm", "wma", "wmv", "rtf", "docx", "fdf", "potm", "pptx", "txt", "xlsb", "xlsx", "7z", "cab", "iso", "rar", "zip", "gz", "bt", "file", "apk", "bookfolder", "folder-empty", "fromchromefolder", "documentfolder", "fromphonefolder", "mix", "musicfolder", "picturefolder", "videofolder", "sefolder", "access", "mdb", "accdb", "fla", "doc", "docm", "dotx", "dotm", "dot", "pdf", "ppt", "pptm", "pot", "xls", "csv", "xlsm"];
        var extLastName = extArr[extArr.length - 1];
        for(var i=0; i<exts.length; i++){
            if(exts[i]==extLastName){
                return exts[i];
            }
        }
        return 'file';
    },

    /**
     * @description 获取路径上的文件名称
     * @param {String} path 路径
     * @return {String} 文件名称
     */
    get_path_filename:function(path){
        var paths = path.split('/');
        return paths[paths.length - 1];
    },

    /**
     * @description 返回上一层目录地址
     * @param {String} path 当前路径
     * @returns 返回上一层地址
    */
    retrun_prev_path:function(path){
        var dir_list = path.split('/');
        dir_list.splice(dir_list.length - 1);
        if(dir_list == '') dir_list = ['/']
        return dir_list.join('/');
    },
    /**
     * @descripttion: 路径过滤
     * @return: 无返回值
    */    
    path_check:function(path) {
        path = path.replace('//', '/');
        if (path === '/') return path;
        path = path.replace(/\/+$/g,'');
        return path;
    },

    /**
     * @description 获取文件权限信息
     * @param {Object} data 请求传入参数
     * @param {Function} callback 回调参数
     * @returns void
     */
    get_file_access:function(data,callback){
        var that = this;
        this.layerT = bt.load('Getting file permissions, please wait...');
        bt.send('GetFileAccess','files/GetFileAccess',{path:data.path},function(res){
            that.loadT.close();
            if(callback) callback();
        });
    },

    /**
     * @description 创建外链下载
     * @param {Object} data 请求传入参数
     * @param {Function} callback 回调参数
     * @returns void
    */
    create_download_url:function(data,callback){
       var that = this;
        this.layerT = bt.load('sharing file, please wait...');
        bt.send('create_download_url','files/create_download_url',{filename:data.filename,ps:data.ps,password:data.password,expire:data.expire}, function (res) {
            that.layerT.close();
            if (callback) callback(res);
        });
    },

     /**
     * @description 获取外链下载数据
     * @param {Object} data 请求传入参数
     * @param {Function} callback 回调参数
     * @returns void
    */
    get_download_url_find:function(data,callback){
        var that = this;
        this.layerT = bt.load('Getting sharing file datals, please wait...');
        bt.send('get_download_url_find','files/get_download_url_find',{id:data.id}, function (res) {
            that.layerT.close();
            if (callback) callback(res);
        });
    },

    /**
     * @description 删除外链下载
     * @param {Object} data 请求传入参数
     * @param {Function} callback 回调参数
     * @returns void
    */
    remove_download_url:function(data,callback){
        var that = this;
        layer.confirm('Comfirm to stop sharing【'+ data.fileName +'】, continue?',{ title: 'Cancel sharing', closeBtn: 2, icon: 3 }, function () {
            this.layerT = bt.load('Canceling sharing files, please wait...');
            bt.send('remove_download_url','files/remove_download_url',{id:data.id},function(res){
                if (callback) callback(res);
            });
        })
        
    },

    /**
     * @description 获取磁盘列表
     * @param {Function} callback 回调参数
     * @returns void
    */
    get_disk_list:function(callback){
        bt_tools.send('system/GetDiskInfo',function (res) {
            if (callback) callback(res);
        },'Getting disk list, please wait...');
    },

    // 新建文件（文件和文件夹）
    create_file_req: function (data, callback) {
        var _req = (data.type === 'folder' ? 'CreateDir' : 'CreateFile')
        bt.send(_req, 'files/' + _req, {
            path: data.path
        }, function (res) {
            if (callback) callback(res);
        });
    },

    // 重命名文件（文件或文件夹）
    rename_file_req: function (data, callback){
        bt_tools.send('files/MvFile', {
            sfile: data.sfile,
            dfile: data.dfile,
            rename: data.rename || true
        }, function (res) {
            if (callback) callback(res);
        },'Renaming');
    },

    // 剪切文件请求（文件和文件夹）
    shear_file_req: function (data, callback) {
        this.rename_file_req({
            sfile: data.sfile,
            dfile: data.dfile,
            rename: false
        }, function (res) {
            if (callback) callback(res);
        },'Cutting');
    },

    // 检查文件是否存在（复制文件和文件夹前需要调用）
    check_exists_files_req: function (data, callback) {
        var layerT =  bt.load('Checking files, please wait...');
        bt.send('CheckExistsFiles', 'files/CheckExistsFiles', {
            dfile: data.dfile,
            filename: data.filename
        }, function (res) {
            layerT.close();
            if (callback) callback(res);
        });
    },

    // 复制文件（文件和文件夹）
    copy_file_req: function (data, callback) {
        bt.send('CopyFile', 'files/CopyFile', {
            sfile: data.sfile,
            dfile: data.dfile
        }, function (res) {
            if (callback) callback(res);
        });
    },

    // 压缩文件（文件和文件夹）
    compress_file_req: function (data, callback) {
        bt.send('Zip', 'files/Zip', {
            sfile: data.sfile,
            dfile: data.dfile,
            z_type: data.z_type,
            path: data.path
        }, function (res) {
            if (callback) callback(res);
        });
    },

    // 获取实时任务
    get_task_req: function (data, callback) {
        bt.send('get_task_lists', 'task/get_task_lists', {
            status: data.status
        }, function (res) {
            if (callback) callback(res);
        });
    },

    // 获取文件权限
    get_file_access: function () {
        bt.send('GetFileAccess', 'files/GetFileAccess', {
            filename: data.filename
        }, function (res) {
            if (callback) callback(res);
        });
    },

    // 设置文件权限
    set_file_access: function () {
        bt.send('SetFileAccess', 'files/SetFileAccess', {
            filename: data.filename,
            user: data.user,
            access: data.access,
            all: data.all
        }, function (res) {
            if (callback) callback(res);
        });
    },

    /**
     * @description 删除文件（文件和文件夹）
     * @param {Object} data 文件目录参数
     * @param {Function} callback 回调函数
     * @return void
     */
    del_file_req: function (data, callback) {
        var _req = (data.type === 'dir' ? 'DeleteDir' : 'DeleteFile')
        var layerT =  bt.load('Deleting file, please wait...');
        bt.send(_req, 'files/' + _req,{path: data.path}, function (res) {
            layerT.close();
            layer.msg(res.msg,{icon:res.status?1:2})
            if (callback) callback(res);
        });
    },

    /**
     * @description 下载文件
     * @param {Object} 文件目录参数
     * @param {Function} callback 回调函数
     * @return void
     */
    down_file_req: function (data, callback) {
        window.open('/download?filename=' + encodeURIComponent(data.path));
    },

    /**
     * @description 获取文件大小（文件夹）
     * @param {*} data  文件目录参数
     * @param {Function} callback 回调函数
     * @return void
    */
    get_file_size: function (data, callback){
        bt_tools.send('files/get_path_size',{path:data.path},callback,'Getting directory size, please wait...');
    },
    /**
     * @description 获取目录大小
     * @param {*} data  文件目录地址
     * @return void
    */
    get_dir_size:function(data,callback){
        bt_tools.send('files/GetDirSize',{path:data.path},function(rdata){
            $("#file_all_size").text(rdata)
            if(callback) callback(rdata);
        },{tips:'Counting, please wait...',verify:true});
    },
    /**
     * @description 获取文件目录
     * @param {*} data  文件目录参数
     * @param {Function} callback 回调函数
    */
    get_dir_list:function(data, callback) {
        var that = this,f_sort = bt.get_cookie('files_sort');
        if(f_sort){
            data['sort'] = f_sort;
            data['reverse'] = bt.get_cookie('name_reverse');
        }
        bt_tools.send('files/GetDir',$.extend({p:1,showRow:(bt.get_storage('local','showRow') || that.file_page_num),path:bt.get_cookie('Path') || data.path},data),callback,{tips:false});
    },
    /**
     * @description 文件、文件夹压缩
     * @param {Object} data  文件目录参数
     * @param {Boolean} isbatch  是否批量操作
    */
    compress_file_or_dir:function(data,isbatch){
        var that = this;
        $('.selection_right_menu').removeAttr('style');
        this.reader_form_line({
            url:'Zip',
            overall: {width:'310px'},
            data:[
                {label:'Compress type', type:'select', name:'z_type', value:data.open, list:[
                    ['tar_gz','tar.gz'],
                    ['zip','zip'],
                    ['rar','rar']
                ]},
                {label:'Compress path', id:'compress_path', name:'dfile', placeholder:'URL address', value:data.path+'.'+(data.open == 'tar_gz'?'tar.gz':data.open)}
            ],
            beforeSend:function(updata){
                var ind = data.path.lastIndexOf("\/"),_url = data.path.substring(0,ind+1);  // 过滤路径文件名
                return {sfile:data.filename,dfile:updata.dfile,z_type:(updata.z_type == 'tar_gz'?'tar.gz':updata.z_type),path:_url}
            }
        },function(form,html){
            var loadT = layer.open({
                type:1,
                title:'Compress '+ data.type_tips +'[ '+ data.filename +' ]',
                area: '520px',
                shadeClose: false,
                closeBtn:2,
                skin:'compress_file_view',
                btn:['Compress','Close'],
                content: html[0].outerHTML,
                success:function(){
                    // 切换压缩格式
                    $('select[name=z_type]').change(function(){
                        var _type = $(this).val(),_inputVel = $('input[name=dfile]').val(),path_list = [];
                        _type == 'tar_gz'? 'tar.gz' : _type
                        _inputVel = _inputVel.substring(0,_inputVel.lastIndexOf('\/'))
                        path_list = _inputVel.split('/');
                        $('input[name=dfile]').val(_inputVel+'/'+(isbatch?path_list[path_list.length -1]:data.filename)+'.'+_type)
                    })
                    // 插入选择路径
                    $('.compress_file_view .line:nth-child(2)').find('.info-r').append('<span class="glyphicon glyphicon-folder-open cursor" style="margin-left: 10px;" onclick="ChangePath(\'compress_path\')"></span>');
                },
                yes:function(){
                    var ress = form.getVal();
                    if(ress.dfile == '') return layer.msg('Please select a valid address',{icon:2})
                    form.submitForm(function(res,datas){
                        setTimeout(function(){
                            that.reader_file_list({path:datas.path})
                        }, 1000); 
                        if(res == null || res == undefined){
                            layer.msg(lan.files.zip_ok, { icon: 1 });
                        }
                        if(res.status){
                            that.render_present_task_list();
                        }
                        layer.close(loadT)
                    })
                }
            })
        })
    },
    /**
     * @description 文件、文件夹解压
     * @param {*} data  文件目录参数
    */
    unpack_file_to_path:function(data){
        var that = this,_type = 'zip',spath = '';
        spath = data.path.substring(0,data.path.lastIndexOf('\/'))  
        this.reader_form_line({
            url: 'UnZip',
            overall: {width: '310px'},
            data:[
                {label:'File name',name:'z_name',placeholder:'Compress file name',value:data.path},
                {label:'Compress path',name:'z_path',placeholder:'Compress path',value:spath},
                {label:'Encoding',name:'z_code',type:'select',value:'UTF-8',list:[
                    ['UTF-8','UTF-8'],
                    ['gb18030','GBK']
                ]}
            ],
            beforeSend:function(updata){
                return {sfile:updata.z_name,dfile:updata.z_path,type:_type,coding:updata.z_code,password:updata.z_password}
            }
        },function(form,html){
            var loadT = layer.open({
                type:1,
                title:'Decompress file',
                area: '520px',
                shadeClose: false,
                closeBtn:2,
                skin:'unpack_file_view',
                btn:['Comfirm','Cancel'],
                content: html[0].outerHTML,
                success:function(){
                    if(data.ext == 'gz') _type = 'tar' //解压格式
                    if(_type == 'zip') { // 判断是否插入解压密码
                        $('.unpack_file_view .line:nth-child(2)').append('<div class="line"><span class="tname">Password</span><div class="info-r"><input type="text" name="z_password" class="bt-input-text " placeholder="No password let it empty" style="width:310px" value=""></div></div>')
                    }
                },
                yes:function(){
                    var ress = form.getVal();
                    if(ress.z_name == '') return layer.msg('Please enter the file name path',{icon:2})
                    if(ress.z_path == '') return layer.msg('Please enter the decompression address',{icon:2})
                    form.submitForm(function(res,datas){
                        layer.close(loadT)
                        setTimeout(function(){
                            that.reader_file_list({path:datas.path})
                        }, 1000); 
                        if(res.status){
                            that.render_present_task_list();
                        }
                        layer.msg(res.msg,{icon:res.status?1:2})
                    })
                }
            })
        })
    },
    
    /**
     * @description 匹配非法字符
     * @param {Array} item 配置对象
     * @return 返回匹配结果
     */
    match_unqualified_string:function(item){
        var containSpecial = RegExp(/[(\ )(\*)(\|)(\\)(\:)(\")(\/)(\<)(\>)(\?)(\)]+/);
        return containSpecial.test(item)
    },
    /**
     * @description 渲染表单
     * @param {Array} config 配置对象
     * @param {Function} callback 回调函数
     * @return void
     */
    reader_form_line:function(config,callback){
        var that = this,random = bt.get_random(10),html = $('<form id="'+ random +'" class="bt-form pd20"></form>'),data = config,eventList = [],that = this;
        if(!Array.isArray(config)) data = config.data;
        $.each(data,function(index,item){
            var labelWidth = item.labelWidth || config.overall.labelWidth || null,event_random = bt.get_random(10),
            width = item.labelWidth || config.overall.width || null,
            form_line = $('<div class="line"><span class="tname" '+ (labelWidth?('width:'+labelWidth):'') +'>'+ (item.label || '') +'</span><div class="info-r"></div></div>'),
            form_el = $((function(){
                switch(item.type){
                    case 'select':
                        return '<select '+ (item.disabled?'disabled':'') +' '+ (item.readonly?'readonly':'') +' class="bt-input-text mr5 '+ (item.readonly?'readonly-form-input':'') +'" name="'+ item.name +'" '+ (item.eventType?'data-event="'+ event_random +'"':'') +' style="'+ (width?('width:'+width):'') +'">'+ (function(item){
                            var options_list = '';
                            $.each(item.list,function(key,items){
                                if(!Array.isArray(items)){//判断是否为二维数组
                                    options_list += '<option value="'+ items +'" '+ (item.value === key?'selected':'') +'>'+ items +'</option>'
                                }else{
                                    options_list += '<option value="'+ items[0] +'" '+ (item.value === items[0]?'selected':'')  +'>'+ items[1] +'</option>'
                                }
                            })
                            return options_list;
                        }(item)) +'</select>';
                    break;
                    case 'text':
                    default:
                        return '<input '+ (item.disabled?'disabled':'') +' '+ (item.readonly?'readonly':'') +' '+ (item.eventType?'data-event="'+ event_random +'"':'') +' type="text" name="'+ item.name +'" '+(item.id?'id="'+item.id+'"':'')+' class="bt-input-text '+ (item.readonly?'readonly-form-input':'') +'" placeholder="'+ (item.placeholder || '') +'" style="'+ (width?('width:'+width):'') +'" value="'+ (item.value || '') +'"/>';
                    break;
                }
            }(item)));
            if(item.eventType || item.event){
                if(!Array.isArray(item.eventType)) item.eventType = [item.eventType];
                $.each(item.eventType,function(index,items){
                    eventList.push({el:event_random,type:items || 'click',event:item[items] || null});
                    if(config.el){
                        var els = $('[data-event="'+ item.el +'"]');
                        if(item[items]){
                            if(items == 'enter'){
                                els.on('keyup',function(e){
                                    if(e.keyCode == 13) item.event(e)
                                })
                            }else{
                                els.on(item || 'click',item.event);
                            }
                        }else{
                            if(items == 'focus'){
                                var vals = els.val();
                                if(vals != ''){
                                    els.val('').focus().val(vals);
                                }
                            }else{
                                els[items]();
                            }
                            
                        }
                    }
                });
            }
            form_line.find('.info-r').append(form_el)
            html.append(form_line);
        });
        if(config.el) $(config.el).empty().append(html);
        if(callback) callback({
            // 获取内容
            getVal:function(){
                return $('#'+random).serializeObject();
            },
            // 设置事件，没有设置el参数，需要
            setEvent:function(){
                $.each(eventList,function(index,item){
                    var els = $('[data-event="'+ item.el +'"]');
                    if(item.event === null){
                        if(item.type == 'focus'){
                            var vals = els.val();
                            if(vals != ''){
                                els.val('').focus().val(vals);
                            }
                        }else{
                            els[item.type]();
                        }
                    }else{
                        if(item.type == 'enter'){
                            els.on('keyup',function(e){
                                if(e.keyCode == 13) item.event(e)
                            })
                        }else{
                            els.on(item.type,item.event);
                        }
                    }
                });
            },
            // 提交表单
            submitForm:function(callback){
                var data = this.getVal();
                if(config.beforeSend) data = config.beforeSend(data);
                that.loadT = bt.load('submitting the form, please wait...');
                bt.send(config.url,('files/'+config.url),data,function(rdata){
                    that.loadT.close();
                    if(callback) callback(rdata,data)
                })
            }
        },html);
    },
        
    /**
     * @description 文件管理请求方法
     * @param {*} data 
     * @param {*} data
     * @param {*} callback
     */
    $http:function(data,parem,callback){
        var that  = this,loadT = '';
        if(typeof data == "string"){
            if(typeof parem != "object") callback = parem,parem = {};
            if(!Array.isArray(that.method_list[data])) that.method_list[data] = ['files',that.method_list[data]];
            that.$http({method:data,tips:(that.method_list[data][1]?that.method_list[data][1]:false),module:that.method_list[data][0],data:parem,msg:true},callback);
        }else {
            if(typeof data.tips != 'undefined' && data.tips) loadT = bt.load(data.tips);
            bt.send(data.method,(data.module || 'files') +'/' + data.method,data.data || {},function(res){
                if(loadT != '') loadT.close();
                if(typeof res == "string") res = JSON.parse(res);
                if(res.status === false && res.msg){
                    bt.msg(res);
                    return false;
                }
                if(parem) parem(res)
            });
        }
    }
}

bt_file.init();






Function.prototype.delay = function(that,arry,time){
    if(!Array.isArray(arry)) time = arry,arry = [];
    if(typeof time == "undefined") time = 0;
    setTimeout(this.apply(that,arry),time);
    return this;
}
jQuery.prototype.serializeObject = function () {
    var a,o,h,i,e;
    a = this.serializeArray();
    o={};
    h=o.hasOwnProperty;
    for(i=0;i<a.length;i++){
        e=a[i];
        if(!h.call(o,e.name)){
            o[e.name]=e.value;
        }
    }
    return o;
}