var num = 0;
//查看任务日志
function GetLogs(id){
	layer.msg(lan.public.the_get,{icon:16,time:0,shade: [0.3, '#000']});
	var data='&id='+id
	$.post('/crontab?action=GetLogs',data,function(rdata){
		layer.closeAll();
		if(!rdata.status) {
			layer.msg(rdata.msg,{icon:2});
			return;
		};
		layer.open({
			type:1,
			title:lan.crontab.task_log_title,
			area: ['700px','490px'], 
			shadeClose:false,
			closeBtn:2,
			content:'<div class="setchmod bt-form  pb70">'
					+'<pre class="crontab-log" style="overflow: auto; border: 0px none; line-height:23px;padding: 15px; margin: 0px; white-space: pre-wrap; height: 405px; background-color: rgb(51,51,51);color:#f1f1f1;border-radius:0px;font-family: \"'+lan.crontab.microsoft_yahei+'\"">'+ (rdata.msg == '' ? lan.crontab.log_empty:rdata.msg) +'</pre>'
					+'<div class="bt-form-submit-btn" style="margin-top: 0px;">'
					+'<button type="button" class="btn btn-danger btn-sm btn-title" style="margin-right:15px;" onclick="CloseLogs('+id+')">'+lan.public.empty+'</button>'
					+'<button type="button" class="btn btn-success btn-sm btn-title" onclick="layer.closeAll()">'+lan.public.close+'</button>'
					+'</div>'
					+'</div>'
		});
		setTimeout(function(){
			$("#crontab-log").text(rdata.msg);
			var div = document.getElementsByClassName('crontab-log')[0]
			div.scrollTop  = div.scrollHeight;
		},200)
	});
}

function getCronData(){
	var laid=layer.msg(lan.public.the,{icon:16,time:0,shade: [0.3, '#000']});
	$.post('/crontab?action=GetCrontab',"",function(rdata){
		layer.close(laid);
		var cbody="";
		if(rdata == []){
			layer.close(laid);
			cbody="<tr><td colspan='6'>"+lan.crontab.task_empty+"</td></tr>"
		}
		else{
			$.post('/crontab?action=GetDataList',{type:'sites'},function(res){
				layer.close(laid);
                for (var i = 0; i < rdata.length; i++){                  
					var s_status = '<span class="btOpen" onclick="set_task_status('+rdata[i].id+',0)" style="color:rgb(92, 184, 92);cursor:pointer" title="'+lan.crontab.crontab_stop+'">'+lan.crontab.normal+'<span  class="glyphicon glyphicon-play"></span></span> ';
					var optName = '';
					if(rdata[i].status!=1) s_status = '<span onclick="set_task_status('+rdata[i].id+',1)"  class="btClose" style="color:red;cursor:pointer" title="'+lan.crontab.crontab_start+'">'+lan.crontab.disable+'<span style="color:rgb(255, 0, 0);" class="glyphicon glyphicon-pause"></span></span> ';
					for(var j = 0; j < res.orderOpt.length;j++){
						if(rdata[i].backupTo == 'localhost'){
							optName = lan.crontab.local_disk;
						}else if(rdata[i].backupTo == res.orderOpt[j].value){
							optName = res.orderOpt[j].name;
						}else if(rdata[i].backupTo == ''){
							optName = ''
						}
                    }
					var arrs = ['site','database','path'];
                    if ($.inArray(rdata[i].sType, arrs) == -1) optName = "--";
					cbody += "<tr>\
						<td><input type='checkbox' onclick='checkSelect();' title='"+rdata[i].name+"' name='id' value='"+rdata[i].id+"'></td>\
						<td>"+rdata[i].name+"</td>\
						<td>"+s_status+"</td>\
						<td>"+rdata[i].type+"</td>\
						<td>"+rdata[i].cycle+"</td>\
						<td>"+(rdata[i].save?rdata[i].save:'-')+"</td>\
						<td>"+optName+"</td>\
						<td>"+rdata[i].addtime+"</td>\
						<td>\
							<a href=\"javascript:StartTask("+rdata[i].id+");\" class='btlink'>"+lan.public.exec+"</a> | \
							<a href=\"javascript:edit_task_info('"+rdata[i].id +"');\" class='btlink'>"+lan.files.file_menu_edit+"</a> | \
							<a href=\"javascript:GetLogs("+rdata[i].id+");\" class='btlink'>"+lan.public.log+"</a> | \
							<a href=\"javascript:planDel("+rdata[i].id+" ,'"+rdata[i].name.replace('\\','\\\\').replace("'","\\'").replace('"','')+"');\" class='btlink'>"+lan.public.del+"</a>\
						</td>\
					</tr>"
				}
				$('#cronbody').html(cbody);
			});
		}
	});
}
// 编辑计划任务
function edit_task_info(id){
	// var obj = {};
	layer.msg(lan.public.the_get,{icon:16,time:0,shade: [0.3, '#000']});
	$.post('/crontab?action=get_crond_find',{id:id},function(rdata){
		layer.closeAll();
		var sTypeName = '',sTypeDom = '',cycleName = '',cycleDom = '',weekName = '',weekDom = '',sNameName ='',sNameDom = '',backupsName = '',backupsDom ='';
		obj = {
			from:{
				id:rdata.id,
				name: rdata.name,
				type: rdata.type,
				where1: rdata.where1,
				hour: rdata.where_hour,
				minute: rdata.where_minute,
				week: rdata.where1,
				sType: rdata.sType,
                sBody: rdata.sBody == 'undefined' ? '' : rdata.sBody,
				sName: rdata.sName,
				backupTo: rdata.backupTo,
				save: rdata.save,
				urladdress: rdata.urladdress,
			},
			sTypeArray:[['toShell',lan.crontab.shell],['site',lan.crontab.site_bak],['database',lan.crontab.db_bak],['logs',lan.crontab.log_split],['path',lan.crontab.dir_bak],['rememory',lan.crontab.mem_release],['toUrl',lan.crontab.get_url]],
			cycleArray:[['day',lan.crontab.daily],['day-n',lan.crontab.n_day],['hour',lan.crontab.hourly],['hour-n',lan.crontab.n_hour],['minute-n',lan.crontab.n_min],['week',lan.crontab.weekly],['month',lan.crontab.monthly]],
			weekArray:[[1,lan.crontab.TZZ1],[2,lan.crontab.TZZ2],[3,lan.crontab.TZZ3],[4,lan.crontab.TZZ4],[5,lan.crontab.TZZ5],[6,lan.crontab.TZZ6],[7,lan.crontab.TZZ7]],
			sNameArray:[],
			backupsArray:[],
			create:function(callback){
				for(var i = 0; i <obj['sTypeArray'].length; i++){
					if(obj.from['sType'] == obj['sTypeArray'][i][0])  sTypeName  = obj['sTypeArray'][i][1];
					sTypeDom += '<li><a role="menuitem"  href="javascript:;" value="'+ obj['sTypeArray'][i][0] +'">'+ obj['sTypeArray'][i][1] +'</a></li>';
				}
				for(var i = 0; i <obj['cycleArray'].length; i++){
					if(obj.from['type'] == obj['cycleArray'][i][0])  cycleName  = obj['cycleArray'][i][1];
					cycleDom += '<li><a role="menuitem"  href="javascript:;" value="'+ obj['cycleArray'][i][0] +'">'+ obj['cycleArray'][i][1] +'</a></li>';
				}
				for(var i = 0; i <obj['weekArray'].length; i++){
					if(obj.from['week'] == obj['weekArray'][i][0])  weekName  = obj['weekArray'][i][1];
					weekDom += '<li><a role="menuitem"  href="javascript:;" value="'+ obj['weekArray'][i][0] +'">'+ obj['weekArray'][i][1] +'</a></li>';
				}
				if(obj.from.sType == 'site' || obj.from.sType == 'database' || obj.from.sType == 'path' || obj.from.sType == 'logs'){
					$.post('/crontab?action=GetDataList',{type:obj.from.sType  == 'database'?'databases':'sites'},function(rdata){
						obj.sNameArray = rdata.data;
						obj.sNameArray.unshift({name:'ALL',ps:lan.crontab.all});
						obj.backupsArray = rdata.orderOpt;
						obj.backupsArray.unshift({name:lan.crontab.server_disk,value:'localhost'});
						for(var i = 0; i <obj['sNameArray'].length; i++){
							if(obj.from['sName'] == obj['sNameArray'][i]['name'])  sNameName  = obj['sNameArray'][i]['ps'];
							sNameDom += '<li><a role="menuitem"  href="javascript:;" value="'+ obj['sNameArray'][i]['name'] +'">'+ obj['sNameArray'][i]['ps'] +'</a></li>';
						}
						for(var i = 0; i <obj['backupsArray'].length; i++){
							if(obj.from['backupTo'] == obj['backupsArray'][i]['value'])  backupsName  = obj['backupsArray'][i]['name'];
							backupsDom += '<li><a role="menuitem"  href="javascript:;" value="'+ obj['backupsArray'][i]['value'] +'">'+ obj['backupsArray'][i]['name'] +'</a></li>';
						}
						if(obj.from.sType == 'webshell'){
							edit_message_channel(obj.from.urladdress)
						}
						callback();
					});
				}else{
					callback();
				}
			}
		};
		obj.create(function(){
			layer.open({
				type:1,
				title:lan.crontab.crontab_edit+'-['+rdata.name+']',
				area: ['866px','500px'], 
				skin:'layer-create-content',
				shadeClose:false,
				closeBtn:2,
				content:'<div class="setting-con ptb20">\
								<div class="clearfix plan ptb10">\
									<span class="typename c4 pull-left f14 text-right mr20">'+lan.crontab.task_type+'</span>\
									<div class="dropdown stype_list pull-left mr20">\
										<button class="btn btn-default dropdown-toggle" type="button" id="excode" data-toggle="dropdown" style="width:auto" disabled="disabled">\
											<b val="'+ obj.from.sType +'">'+ sTypeName +'</b>\
											<span class="caret"></span>\
										</button>\
										<ul class="dropdown-menu" role="menu" aria-labelledby="sType">'+ sTypeDom +'</ul>\
									</div>\
								</div>\
								<div class="clearfix plan ptb10">\
									<span class="typename c4 pull-left f14 text-right mr20">'+lan.crontab.task_name+'</span>\
									<div class="planname pull-left"><input type="text" name="name" class="bt-input-text sName_create" value="'+ obj.from.name +'"></div>\
								</div>\
								<div class="clearfix plan ptb10">\
									<span class="typename c4 pull-left f14 text-right mr20">'+lan.crontab.exec_cycle+'</span>\
									<div class="dropdown  pull-left mr20">\
										<button class="btn btn-default dropdown-toggle cycle_btn" type="button" data-toggle="dropdown" style="width:94px">\
											<b val="'+ obj.from.type +'">'+ cycleName +'</b>\
											<span class="caret"></span>\
										</button>\
										<ul class="dropdown-menu" role="menu" aria-labelledby="cycle">'+ cycleDom +'</ul>\
									</div>\
									<div class="pull-left optional_week">\
										<div class="dropdown week_btn pull-left mr20" style="display:'+ (obj.from.type == "week"  ?'block;':'none') +'">\
											<button class="btn btn-default dropdown-toggle" type="button" data-toggle="dropdown" >\
												<b val="'+ obj.from.week +'">'+ weekName +'</b> \
												<span class="caret"></span>\
											</button>\
											<ul class="dropdown-menu" role="menu" aria-labelledby="week">'+ weekDom +'</ul>\
										</div>\
										<div class="plan_hms pull-left mr20 bt-input-text where1_input" style="display:'+ (obj.from.type == "day-n" || obj.from.type == 'month' ?'block;':'none') +'"><span><input type="number" name="where1" class="where1_create" value="'+obj.from.where1 +'" maxlength="2" max="23" min="0"></span> <span class="name">'+lan.crontab.sun+'</span> </div>\
										<div class="plan_hms pull-left mr20 bt-input-text hour_input" style="display:'+ (obj.from.type == "day" || obj.from.type == 'day-n' || obj.from.type == 'hour-n' || obj.from.type == 'week' || obj.from.type == 'month'?'block;':'none') +'"><span><input type="number" name="hour" class="hour_create" value="'+ ( obj.from.type == 'hour-n' ? obj.from.where1 : obj.from.hour ) +'" maxlength="2" max="23" min="0"></span> <span class="name">'+lan.crontab.hour1+'</span> </div>\
										<div class="plan_hms pull-left mr20 bt-input-text minute_input"><span><input type="number" name="minute" class="minute_create" value="'+ (obj.from.type == 'minute-n' ? obj.from.where1 : obj.from.minute)+'" maxlength="2" max="59" min="0"></span> <span class="name">'+lan.crontab.minute1+'</span> </div>\
									</div>\
								</div>\
								<div class="clearfix plan ptb10 site_list" style="display:none">\
									<span class="typename controls c4 pull-left f14 text-right mr20">'+ sTypeName  +'</span>\
									<div style="line-height:34px"><div class="dropdown pull-left mr20 sName_btn" style="display:'+ (obj.from.sType != "path"?'block;':'none') +'">\
										<button class="btn btn-default dropdown-toggle" type="button"  data-toggle="dropdown" style="width:auto" disabled="disabled">\
											<b id="sName" val="'+ obj.from.sName +'">'+ sNameName +'</b>\
											<span class="caret"></span>\
										</button>\
										<ul class="dropdown-menu" role="menu" aria-labelledby="sName">'+ sNameDom +'</ul>\
									</div>\
									<div class="info-r" style="float: left;margin-right: 25px;display:'+ (obj.from.sType == "path"?'block;':'none') +'">\
										<input id="inputPath" class="bt-input-text mr5 " type="text" name="path" value="'+ obj.from.sName +'" placeholder="'+lan.crontab.dir_bak+'" style="width:208px;height:33px;" disabled="disabled">\
									</div>\
									<div class="textname pull-left mr20">'+lan.crontab.bakup_to+'</div>\
										<div class="dropdown  pull-left mr20">\
											<button class="btn btn-default dropdown-toggle backup_btn" type="button"  data-toggle="dropdown" style="width:auto;">\
												<b val="'+ obj.from.backupTo +'">'+ backupsName +'</b>\
												<span class="caret"></span>\
											</button>\
											<ul class="dropdown-menu" role="menu" aria-labelledby="backupTo">'+ backupsDom +'</ul>\
										</div>\
										<div class="textname pull-left mr20">'+lan.crontab.keep_update+'</div>\
										<div class="plan_hms pull-left mr20 bt-input-text">\
											<span><input type="number" name="save" class="save_create" value="'+ obj.from.save +'" maxlength="4" max="100" min="1"></span><span class="name">'+lan.crontab.copies+'</span>\
										</div>\
									</div>\
								</div>\
								<div class="clearfix plan ptb10"  style="display:'+ ((obj.from.sType == "toShell" || obj.from.sType == 'site' || obj.from.sType == 'path')?'block;':'none') +'">\
									<span class="typename controls c4 pull-left f14 text-right mr20">'+ (obj.from.sType == "toShell" ?'Script content':'Exclusion rule')+'</span>\
									<div style="line-height:22px"><textarea style="line-height:22px" class="txtsjs bt-input-text sBody_create" name="sBody">'+ obj.from.sBody +'</textarea></div>\
								</div>\
								<div class="clearfix plan ptb10" style="display:'+ (obj.from.sType == "rememory"?'block;':'none') +'">\
									<span class="typename controls c4 pull-left f14 text-right mr20">'+lan.crontab.tips+'</span>\
									<div style="line-height:34px">'+lan.crontab.tips_content+'</div>\
								</div>\
								<div class="clearfix plan ptb10" style="display:'+ (obj.from.sType == "toUrl"?'block;':'none') +'">\
									<span class="typename controls c4 pull-left f14 text-right mr20">'+lan.crontab.url_address+'</span>\
									<div style="line-height:34px"><input type="text" style="width:400px; height:34px" class="bt-input-text url_create" name="urladdress"  placeholder="'+lan.crontab.url_address+'" value="'+ obj.from.urladdress +'"></div>\
								</div>\
								<div class="clearfix plan ptb10">\
									<div class="bt-submit plan-submits " style="margin-left: 141px;">'+lan.crontab.edit_save+'</div>\
								</div>\
								</div>\
								<div class="clearfix plan ptb10" style="display:'+ (obj.from.sType == "webshell"?'none':'none') +'">\
									<span class="typename controls c4 pull-left f14 text-right mr20">Scan site</span>\
									<div class="dropdown pull-left mr20 sName_btn">\
										<button class="btn btn-default dropdown-toggle" type="button"  data-toggle="dropdown" style="width:auto" disabled="disabled">\
											<b id="sName" val="'+ obj.from.sName +'">'+ sNameName +'</b>\
											<span class="caret"></span>\
										</button>\
										<ul class="dropdown-menu" role="menu" aria-labelledby="sName">'+ sNameDom +'</ul>\
									</div>\
									<p class="clearfix plan">\
										<div class="textname pull-left mr20" style="margin-left: 63px; font-size: 14px;">Message channel</div>\
										<div class="dropdown planBackupTo pull-left mr20 message_start" style="line-height: 34px;"></div>\
									</p>\
								<div class="clearfix plan ptb10">\
									<div class="bt-submit plan-submits " style="margin-left: 141px;">'+lan.crontab.edit_save+'</div>\
								</div>\
							</div>'
			});
			setTimeout(function(){
				if(obj.from.sType == 'toShell'){
					$('.site_list').hide();
				}else if(obj.from.sType == 'rememory'){
					$('.site_list').hide();
				}else if( obj.from.sType == 'toUrl'){
					$('.site_list').hide();
				}else if( obj.from.sType == 'webshell'){
					$('.site_list').hide();
				}else{
					$('.site_list').show();
				}

				$('.sName_create').blur(function () {
					obj.from.name = $(this).val();
				});
				$('.where1_create').blur(function () {
					obj.from.where1 = $(this).val();
				});
	
				$('.hour_create').blur(function () {
					obj.from.hour = $(this).val();
				});
	
				$('.minute_create').blur(function () {
					obj.from.minute = $(this).val();
				});
	
				$('.save_create').blur(function () {
					obj.from.save = $(this).val();
				});
	
				$('.sBody_create').blur(function () {
					obj.from.sBody = $(this).val();
				});
				$('.url_create').blur(function () {
					obj.from.urladdress = $(this).val();
				});
	
				$('[aria-labelledby="cycle"] a').unbind().click(function () {
					$('.cycle_btn').find('b').attr('val',$(this).attr('value')).html($(this).html());
					var type = $(this).attr('value');
					switch(type){
						case 'day':
							$('.week_btn').hide();
							$('.where1_input').hide();
							$('.hour_input').show().find('input').val('1');
							$('.minute_input').show().find('input').val('30');
							obj.from.week = '';
							obj.from.type = '';
							obj.from.hour = 1;
							obj.from.minute = 30;
						break;
						case 'day-n':
							$('.week_btn').hide();
							$('.where1_input').show().find('input').val('1');
							$('.hour_input').show().find('input').val('1');
							$('.minute_input').show().find('input').val('30');
							obj.from.week = '';
							obj.from.where1 = 1;
							obj.from.hour = 1;
							obj.from.minute = 30;
						break;
						case 'hour':
							$('.week_btn').hide();
							$('.where1_input').hide();
							$('.hour_input').hide();
							$('.minute_input').show().find('input').val('30');
							obj.from.week = '';
							obj.from.where1 = '';
							obj.from.hour = '';
							obj.from.minute = 30;
						break;
						case 'hour-n':
							$('.week_btn').hide();
							$('.where1_input').hide();
							$('.hour_input').show().find('input').val('1');
							$('.minute_input').show().find('input').val('30');
							obj.from.week = '';
							obj.from.where1 = '';
							obj.from.hour = 1;
							obj.from.minute = 30;
						break;
						case 'minute-n':
							$('.week_btn').hide();
							$('.where1_input').hide();
							$('.hour_input').hide();
							$('.minute_input').show();
							obj.from.week = '';
							obj.from.where1 = '';
							obj.from.hour = '';
							obj.from.minute = 30;
						break;
						case 'week':
							$('.week_btn').show();
							$('.where1_input').hide();
							$('.hour_input').show();
							$('.minute_input').show();
							obj.from.week = 1;
							obj.from.where1 = '';
							obj.from.hour = 1;
							obj.from.minute = 30;
						break;
						case 'month':
							$('.week_btn').hide();
							$('.where1_input').show();
							$('.hour_input').show();
							$('.minute_input').show();
							obj.from.week = '';
							obj.from.where1 = 1;
							obj.from.hour = 1;
							obj.from.minute = 30;
						break;
					}
					obj.from.type = $(this).attr('value');
				});
	
				$('[aria-labelledby="week"] a').unbind().click(function () {
					$('.week_btn').find('b').attr('val',$(this).attr('value')).html($(this).html());
					obj.from.week = $(this).attr('value');
				});
	
				$('[aria-labelledby="backupTo"] a').unbind().click(function () {
					$('.backup_btn').find('b').attr('val',$(this).attr('value')).html($(this).html());
					obj.from.backupTo = $(this).attr('value');
				});
				$('.plan-submits').unbind().click(function(){
					if(obj.from.type == 'hour-n'){
						obj.from.where1 = obj.from.hour;
						obj.from.hour = '';
					}else if(obj.from.type == 'minute-n'){
						obj.from.where1 = obj.from.minute;
						obj.from.minute = '';
					}else if(obj.from.sType == 'webshell'){
						obj.from.urladdress = $(".message_start input:checked").val()
					}
					layer.msg(lan.crontab.saving,{icon:16,time:0,shade: [0.3, '#000']});
					$.post('/crontab?action=modify_crond',obj.from,function(rdata){
						layer.closeAll();
						getCronData();
						layer.msg(rdata.msg,{icon:rdata.status?1:2});
					});
				});
			},100);
		});
	});

}
// 修改木马查杀  消息通道
function edit_message_channel(type){
	$.post('/config?action=get_settings',function(res){
		var tMess = "";
		if(res.user_mail.user_name && !res.dingding.dingding){
			tMess = '<div class="check_alert" style="margin-right:20px;display: inline-block;">\
				<input type="radio" name="alert" title="Email" value="mail" checked="">\
				<label style="font-weight: normal;font-size: 14px;margin-left: 6px;display: inline;">Email</label>\
			</div>'
		}else if(!res.user_mail.user_name && res.dingding.dingding){
			tMess = '<div class="check_alert" style="display: inline-block;">\
				<input type="radio" name="alert" title="dingding" value="dingding" checked="">\
				<label style="font-weight: normal;font-size: 14px;margin-left: 6px;display: inline;">dingding</label>\
			</div>'
		}else{
			tMess ='<div class="check_alert" style="margin-right:20px;display: inline-block;">\
				<input type="radio" name="alert" title="Email" value="mail" '+ (type == 'mail'? 'checked' : '') +'>\
				<label style="font-weight: normal;font-size: 14px;margin-left: 6px;display: inline;">Email</label>\
			</div>\
			<div class="check_alert" style="display: inline-block;">\
				<input type="radio" name="alert" title="dingding" value="dingding" '+ (type == 'dingding'? 'checked' : '') +'>\
				<label style="font-weight: normal;font-size: 14px;margin-left: 6px;display: inline;">dingding</label>\
			</div>'
		}
		$(".message_start").html(tMess);
	})

}

// 设置计划任务状态
function set_task_status(id,status){
	var confirm = layer.confirm(status == '0'?lan.crontab.crontab_stop_will:lan.crontab.disable_change_crontab_start, {title:lan.crontab.tips,icon:3,closeBtn:2},function(index) {
		if (index > 0) {
			$.post('/crontab?action=set_cron_status',{id:id},function(rdata){
				layer.closeAll();
				layer.close(confirm);
				layer.msg(rdata.data,{icon:rdata.status?1:2});
				if(rdata.status) getCronData();
			});
		}
	});
}

//执行任务脚本
function StartTask(id){
	layer.msg(lan.public.the,{icon:16,time:0,shade: [0.3, '#000']});
	var data='id='+id;
	$.post('/crontab?action=StartTask',data,function(rdata){
		layer.closeAll();
		layer.msg(rdata.msg,{icon:rdata.status?1:2});
	});
}


//清空日志
function CloseLogs(id){
	layer.msg(lan.public.the,{icon:16,time:0,shade: [0.3, '#000']});
	var data='id='+id;
	$.post('/crontab?action=DelLogs',data,function(rdata){
		layer.closeAll();
		layer.msg(rdata.msg,{icon:rdata.status?1:2});
	});
}


//删除
function planDel(id,name){
	SafeMessage(lan.get('del',[name]),lan.crontab.del_task,function(){
			layer.msg(lan.public.the,{icon:16,time:0,shade: [0.3, '#000']});
			var data='id='+id;
			$.post('/crontab?action=DelCrontab',data,function(rdata){
				layer.closeAll();
                getCronData();
                setTimeout(function () { layer.msg(rdata.msg, { icon: rdata.status ? 1 : 2 });},1000)
			});
	});
}


//批量删除
function allDeleteCron(){
	var checkList = $("input[name=id]");
	var dataList = new Array();
	for(var i=0;i<checkList.length;i++){
		if(!checkList[i].checked) continue;
		var tmp = new Object();
		tmp.name = checkList[i].title;
		tmp.id = checkList[i].value;
		dataList.push(tmp);
	}
	SafeMessage(lan.crontab.del_task_all_title,"<a style='color:red;'>"+lan.get('del_all_task',[dataList.length])+"</a>",function(){
		layer.closeAll();
		syncDeleteCron(dataList,0,'');
	});
}
//批量执行和批量清除日志
function allCron(type){
	var message = type=='log' ? 'Confirm to delete the logs of the selected task?' : 'Confirm to execute the selected task?',
	tit = type=='log' ? 'Confirm Delete' : 'Confirm Execute',
	url = type=='log' ? '/crontab?action=DelLogs' : '/crontab?action=StartTask',
	confirm = layer.confirm(message, {title:tit,icon:3,closeBtn:2},function() {
		var checkList = $("input[name=id]");
		for(var i=0;i<checkList.length;i++){
			if(!checkList[i].checked) continue;
			var data = 'id='+checkList[i].value;
			$.post(url,data,function(rdata){
				if(i==checkList.length){
					layer.close(confirm);
					layer.msg(rdata.msg,{icon:rdata.status?1:2});
				}
			});
		}
	});
}

//模拟同步开始批量删除数据库
function syncDeleteCron(dataList,successCount,errorMsg){
	if(dataList.length < 1) {
		layer.msg(lan.get('del_all_task_ok',[successCount]),{icon:1});
		return;
	}
	var loadT = layer.msg(lan.get('del_all_task_the',[dataList[0].name]),{icon:16,time:0,shade: [0.3, '#000']});
	$.ajax({
			type:'POST',
			url:'/crontab?action=DelCrontab',
			data:'id='+dataList[0].id+'&name='+dataList[0].name,
			async: true,
			success:function(frdata){
				layer.close(loadT);
				if(frdata.status){
					successCount++;
					$("input[title='"+dataList[0].name+"']").parents("tr").remove();
				}else{
					if(!errorMsg){
						errorMsg = '<br><p>'+lan.crontab.del_task_err+'</p>';
					}
					errorMsg += '<li>'+dataList[0].name+' -> '+frdata.msg+'</li>'
				}
				
				dataList.splice(0,1);
				syncDeleteCron(dataList,successCount,errorMsg);
			}
	});
}

	
function IsURL(str_url){
	var strRegex = '^(https|http|ftp|rtsp|mms)?://.+';
	var re=new RegExp(strRegex);
	if (re.test(str_url)){
		return (true);
	}else{
		return (false);
	}
}


//提交
function planAdd(){
	var name = $(".planname input[name='name']").val();
	if(name == ''){
		$(".planname input[name='name']").focus();
		layer.msg(lan.crontab.add_task_empty,{icon:2});
		return;
	}
	$("#set-Config input[name='name']").val(name);
	
	var type = $(".plancycle").find("b").attr("val");
	$("#set-Config input[name='type']").val(type);
	
	var where1 = $("#ptime input[name='where1']").val();
	var is1;
	var is2 = 1;
	switch(type){
		case 'day-n':
			is1=31;
			break;
		case 'hour-n':
			is1=23;
			break;
		case 'minute-n':
			is1=59;
			break;
		case 'month':
			is1=31;
			break;
		
	}
	
	if(where1 > is1 || where1 < is2){
		$("#ptime input[name='where1']").focus();
		layer.msg(lan.public.input_err,{icon:2});
		return;
	}
	
	$("#set-Config input[name='where1']").val(where1);
	
	var hour = $("#ptime input[name='hour']").val();
	if(hour > 23 || hour < 0){
		$("#ptime input[name='hour']").focus();
		layer.msg(lan.crontab.input_hour_err,{icon:2});
		return;
	}
	$("#set-Config input[name='hour']").val(hour);
	var minute = $("#ptime input[name='minute']").val();
	if(minute > 59 || minute < 0){
		$("#ptime input[name='minute']").focus();
		layer.msg(lan.crontab.input_minute_err,{icon:2});
		return;
	}
	$("#set-Config input[name='minute']").val(minute);
	
	var save = $("#save").val();
	
	if(save < 0){
		layer.msg(lan.crontab.input_number_err,{icon:2});
		return;
	}
	
	$("#set-Config input[name='save']").val(save);
	
	
	$("#set-Config input[name='week']").val($(".planweek").find("b").attr("val"));
	var sType = $(".planjs").find("b").attr("val");
	var sBody = encodeURIComponent($("#implement textarea[name='sBody']").val());
	
	if(sType == 'toFile'){
		if($("#viewfile").val() == ''){
			layer.msg(lan.crontab.input_file_err,{icon:2});
			return;
		}
	}else{
		if(sBody == '' && sType=='toShell'){
			$("#implement textarea[name='sBody']").focus();
			layer.msg(lan.crontab.input_script_err,{icon:2});
			return;
		}
	}
	var urladdress_1 = $("#urladdress_1").val();
	if(sType == 'toUrl'){
		if(!IsURL(urladdress_1)){
			layer.msg(lan.crontab.input_url_err,{icon:2});
			$("implement textarea[name='urladdress_1']").focus();
			return;
		}
	}
	urladdress_1 = encodeURIComponent(urladdress_1);
	$("#set-Config input[name='sType']").val(sType);
	$("#set-Config textarea[name='sBody']").val(decodeURIComponent(sBody));
	
	if(sType == 'site' || sType == 'database' || sType == 'path'){
		var backupTo = $(".planBackupTo").find("b").attr("val");
		$("#backupTo").val(backupTo);
	}
	
	
	var sName = $("#sName").attr("val");
	
	/*if(sName == 'backupAll'){
		var alist = $("ul[aria-labelledby='backdata'] li a");
		var dataList = new Array();
		for(var i=1;i<alist.length;i++){
			var tmp = alist[i].getAttribute('value');
			dataList.push(tmp);
		}
		if(dataList.length < 1){
			layer.msg(lan.crontab.input_empty_err,{icon:5});
			return;
		}
		
		allAddCrontab(dataList,0,'');
		return;
	}*/
	
	$("#set-Config input[name='sName']").val(sName);
	layer.msg(lan.public.the_add,{icon:16,time:0,shade: [0.3, '#000']});
	var data= $("#set-Config").serialize() + '&sBody='+sBody + '&urladdress=' + urladdress_1;
	if(data.indexOf('sType=path') > -1){
		data = data.replace('&sName=&','&sName='+ encodeURIComponent($('#inputPath').val()) +'&')
	}else if(data.indexOf('sType=webshell') > -1){
		data = $("#set-Config").serialize() + '&urladdress=' + _radiox;
		data = data.replace('&sName=&','&sName='+ encodeURIComponent($('#filePath').val()) +'&')
	}

	$.post('/crontab?action=AddCrontab',data,function(rdata){
		layer.closeAll();
        getCronData();
        setTimeout(function () {
            layer.msg(rdata.msg, { icon: rdata.status ? 1 : 2 });
        }, 1000)
	});
}

//批量添加任务
function allAddCrontab(dataList,successCount,errorMsg){
	if(dataList.length < 1) {
		layer.msg(lan.get('add_all_task_ok',[successCount]),{icon:1});
		return;
	}
	var loadT = layer.msg(lan.get('add',[dataList[0]]),{icon:16,time:0,shade: [0.3, '#000']});
	var sType = $(".planjs").find("b").attr("val");
	var minute = parseInt($("#set-Config input[name='minute']").val());
	var hour = parseInt($("#set-Config input[name='hour']").val());
	var sTitle = (sType == 'site')?lan.crontab.backup_site:lan.crontab.backup_database;
	if(sType == 'logs') sTitle = lan.crontab.backup_log;
	minute += 5;
	if(hour !== '' && minute > 59){
		if(hour >= 23) hour = 0;
		$("#set-Config input[name='hour']").val(hour+1);
		minute = 5;
	}
	$("#set-Config input[name='minute']").val(minute);
	$("#set-Config input[name='name']").val(sTitle + '['+dataList[0]+']');
	$("#set-Config input[name='sName']").val(dataList[0]);
	var pdata = $("#set-Config").serialize() + '&sBody=&urladdress_1=';
	$.ajax({
			type:'POST',
			url:'/crontab?action=AddCrontab',
			data:pdata,
			async: true,
			success:function(frdata){
				layer.close(loadT);
				if(frdata.status){
					successCount++;
					getCronData();
				}else{
					if(!errorMsg){
						errorMsg = '<br><p>'+lan.crontab.backup_all_err+'</p>';
					}
					errorMsg += '<li>'+dataList[0]+' -> '+frdata.msg+'</li>'
				}
				
				dataList.splice(0,1);
				allAddCrontab(dataList,successCount,errorMsg);
			}
	});
}

$(".dropdown ul li a").click(function(){
	var txt = $(this).text();
	var type = $(this).attr("value");
	$(this).parents(".dropdown").find("button b").text(txt).attr("val",type);
	switch(type){
		case 'day':
			closeOpt();
			toHour();
			toMinute();
			break;
		case 'day-n':
			closeOpt();
			toWhere1(lan.crontab.day);
			toHour();
			toMinute();
			break;
		case 'hour':
			closeOpt();
			toMinute();
			break;
		case 'hour-n':
			closeOpt();
			toWhere1(lan.crontab.hour);
			toMinute();
			break;
		case 'minute-n':
			closeOpt();
			toWhere1(lan.crontab.minute);
			break;
		case 'week':
			closeOpt();
			toWeek();
			toHour();
			toMinute();
			break;
		case 'month':
			closeOpt();
			toWhere1(lan.crontab.sun);
			toHour();
			toMinute();
			break;
		case 'toFile':
			toFile();
			break;
		case 'toShell':
			toShell();
			$(".controls").html(lan.crontab.sbody);
			break;
		case 'path':
			toBackup('path');
			$(".controls").html(lan.crontab.dir_bak);
			break;
		case 'rememory':
			rememory();
			$(".controls").html(lan.public.msg);
			break;
		case 'site':
			toBackup('sites');
			$(".controls").html(lan.crontab.backup_site);
			break;
		case 'database':
			toBackup('databases');
			$(".controls").html(lan.crontab.backup_database);
			break;
		case 'logs':
			toBackup('logs');
			$(".controls").html(lan.crontab.log_site);
			break;
		case 'toUrl':
			toUrl();
			$(".controls").html(lan.crontab.url_address);
			break;
		case 'webshell':
			webShell();
			break;
	}

})


//备份
function toBackup(type){
	var sMsg = "";
	switch(type){
		case 'sites':
			sMsg = lan.crontab.backup_site;
			sType = "sites";
			break;
		case 'databases':
			sMsg = lan.crontab.backup_database;
			sType = "databases";
			break;
		case 'logs':
			sMsg = lan.crontab.backup_log;
			sType = "sites";
			break;
		case 'path':
			sMsg = lan.crontab.dir_bak;
			sType = "sites";
			break;
	}
	var data='type='+sType
	$.post('/crontab?action=GetDataList',data,function(rdata){
		$(".planname input[name='name']").attr('readonly','true').css({"background-color":"#f6f6f6","color":"#666"});
		if(type != 'path'){
			var sOpt = "",sOptBody = '';
			if(rdata.data.length == 0){
				$(".planname input[name='name']").val('');
				layer.msg(lan.public.list_empty,{icon:2})
				return
			}
			for(var i=0;i<rdata.data.length;i++){
				if(i==0){
					$(".planname input[name='name']").val(sMsg+'['+rdata.data[i].name+']');
				}
				sOpt += '<li><a role="menuitem" tabindex="-1" href="javascript:;" value="'+rdata.data[i].name+'">'+rdata.data[i].name+'['+rdata.data[i].ps+']</a></li>';			
			}	
			sOptBody ='<div class="dropdown pull-left mr20">\
					  <button class="btn btn-default dropdown-toggle" type="button" id="backdata" data-toggle="dropdown" style="width:auto">\
						<b id="sName" val="'+rdata.data[0].name+'">'+rdata.data[0].name+'['+rdata.data[0].ps+']</b> <span class="caret"></span>\
					  </button>\
					  <ul class="dropdown-menu" role="menu" aria-labelledby="backdata">\
					  <li><a role="menuitem" tabindex="-1" href="javascript:;" value="ALL">'+lan.public.all+'</a></li>\
					  	'+sOpt+'\
					  </ul>\
                    </div>'
		}else{
			$(".planname input[name='name']").val(sMsg+'[/www/wwwroot/]');
			sOptBody = '<div class="info-r" style="display: inline-block;float: left;margin-right: 25px;"><input id="inputPath" class="bt-input-text mr5" type="text" name="path" value="/www/wwwroot/" placeholder="'+lan.crontab.dir_bak+'" style="width:208px;height:33px;"><span class="glyphicon glyphicon-folder-open cursor" onclick="ChangePath(&quot;inputPath&quot;)"></span></div>'
			setCookie('default_dir_path','/www/wwwroot/');
			setCookie('path_dir_change','/www/wwwroot/');
			setInterval(function(){
				if(getCookie('path_dir_change') != getCookie('default_dir_path')){
					var  path_dir_change = getCookie('path_dir_change')
					$(".planname input").val(lan.crontab.dir_bak+'['+getCookie('path_dir_change')+']');
					setCookie('default_dir_path',path_dir_change);
				}
			},500);
		}		
		var orderOpt = ''
		for (var i=0;i<rdata.orderOpt.length;i++){
			orderOpt += '<li><a role="menuitem" tabindex="-1" href="javascript:;" value="'+rdata.orderOpt[i].value+'">'+rdata.orderOpt[i].name+'</a></li>'
		}
		
		

		var sBody = sOptBody + '<div class="textname pull-left mr20">'+lan.crontab.backup_to+'</div>\
					<div class="dropdown planBackupTo pull-left mr20">\
					  <button class="btn btn-default dropdown-toggle" type="button" id="excode" data-toggle="dropdown" style="width:auto;">\
						<b val="localhost">'+lan.crontab.disk+'</b> <span class="caret"></span>\
					  </button>\
					  <ul class="dropdown-menu" role="menu" aria-labelledby="excode">\
						<li><a role="menuitem" tabindex="-1" href="javascript:;" value="localhost">'+lan.crontab.disk+'</a></li>\
						'+ orderOpt +'\
					  </ul>\
					</div>\
					<div class="textname pull-left mr20">'+lan.crontab.save_new+'</div><div class="plan_hms pull-left mr20 bt-input-text">\
					<span><input type="number" name="save" id="save" value="3" maxlength="4" max="100" min="1"></span>\
					<span class="name">'+lan.crontab.save_num+'</span>\
					</div>';
        if (sType == 'sites' && sMsg !== lan.crontab.backup_log) {
            sBody += '<p class="clearfix plan">\
                    <div class="textname pull-left mr20" style="margin-left: 29px; font-size: 14px;">'+lan.crontab.exclusion_rule+'</div>\
                    <div class="dropdown planBackupTo pull-left mr20">\
                        <span><textarea style=" height: 113px;width:300px;line-height:22px;" class="bt-input-text" type="text" name="sBody" id="exclude" placeholder="'+lan.crontab.exclusion_rule_tips+'\ndata/config.php\nstatic/upload\n *.log\n"></textarea></span>\
                    </div>\
                </p>';
        }
		$("#implement").html(sBody);
		getselectname();
		$(".dropdown ul li a").click(function(){
			var sName = $("#sName").attr("val");
			if(!sName) return;
			$(".planname input[name='name']").val(sMsg+'['+sName+']');
		});
		if(type == "path"){
			$('.planname input').attr('readonly',false).removeAttr('style');
		}
		$("#exclude").focus(function(){
			var _this = $(this), tips = _this.attr('placeholder'),
			tipss = ''+lan.crontab.exclusion_rule_tips+'</br>data/config.php</br>static/upload</br> *.log</br>';
			_this.attr('placeholder', '');
			var loadT = layer.tips(tipss, _this, {
				tips: [1, '#20a53a'],
				time: 0,
				area: _this[0].clientWidth + 'px'
			});
			$(this).one('blur', function () {
				$(this).attr('placeholder', tips);
				layer.close(loadT);
			});
		});
	});

}

//下拉菜单名称
function getselectname(){
	$(".dropdown ul li a").click(function(){
		var txt = $(this).text();
		var type = $(this).attr("value");
		$(this).parents(".dropdown").find("button b").text(txt).attr("val",type);
	});
}
//清理
function closeOpt(){
	$("#ptime").html('');
}
//星期
function toWeek(){
	var mBody = '<div class="dropdown planweek pull-left mr20">\
					  <button class="btn btn-default dropdown-toggle" type="button" id="excode" data-toggle="dropdown">\
						<b val="1">'+lan.crontab.TZZ1+'</b> <span class="caret"></span>\
					  </button>\
					  <ul class="dropdown-menu" role="menu" aria-labelledby="excode">\
						<li><a role="menuitem" tabindex="-1" href="javascript:;" value="1">'+lan.crontab.TZZ1+'</a></li>\
						<li><a role="menuitem" tabindex="-1" href="javascript:;" value="2">'+lan.crontab.TZZ2+'</a></li>\
						<li><a role="menuitem" tabindex="-1" href="javascript:;" value="3">'+lan.crontab.TZZ3+'</a></li>\
						<li><a role="menuitem" tabindex="-1" href="javascript:;" value="4">'+lan.crontab.TZZ4+'</a></li>\
						<li><a role="menuitem" tabindex="-1" href="javascript:;" value="5">'+lan.crontab.TZZ5+'</a></li>\
						<li><a role="menuitem" tabindex="-1" href="javascript:;" value="6">'+lan.crontab.TZZ6+'</a></li>\
						<li><a role="menuitem" tabindex="-1" href="javascript:;" value="0">'+lan.crontab.TZZ7+'</a></li>\
					  </ul>\
					</div>';
	$("#ptime").html(mBody);
	getselectname()
}
//指定1
function toWhere1(ix){
	var mBody ='<div class="plan_hms pull-left mr20 bt-input-text">\
					<span><input type="number" name="where1" value="3" maxlength="2" max="31" min="0"></span>\
					<span class="name">'+ix+'</span>\
					</div>';
	$("#ptime").append(mBody);
}
//小时
function toHour(){
	var mBody = '<div class="plan_hms pull-left mr20 bt-input-text">\
					<span><input type="number" name="hour" value="1" maxlength="2" max="23" min="0"></span>\
					<span class="name">'+lan.crontab.hour+'</span>\
					</div>';
	$("#ptime").append(mBody);
}

//分钟
function toMinute(){
	var mBody = '<div class="plan_hms pull-left mr20 bt-input-text">\
					<span><input type="number" name="minute" value="30" maxlength="2" max="59" min="0"></span>\
					<span class="name">'+lan.crontab.minute+'</span>\
					</div>';
	$("#ptime").append(mBody);
	
}

//从文件
function toFile(){
	var tBody = '<input type="text" value="" name="file" id="viewfile" onclick="fileupload()" readonly="true">\
				<button class="btn btn-default" onclick="fileupload()">'+lan.public.upload+'</button>';
	$("#implement").html(tBody);
	$(".planname input[name='name']").removeAttr('readonly style').val("");
}

//从脚本
function toShell(){
	var shell_body = '';
	var shell_name = '';
	if($("b[val='toShell']").text() === 'synchronised time'){
		shell_name = 'Periodically synchronize server time';
		shell_body = 'echo "|-Trying to synchronize time from 0.pool.bt.cn..";\n\
ntpdate -u 0.pool.bt.cn\n\
if [ $? = 1 ];then\n\
	echo "|-Trying to synchronize time from 1.pool.bt.cn..";\n\
	ntpdate -u 1.pool.bt.cn\n\
fi\n\
if [ $? = 1 ];then\n\
	echo "|-Trying to sync time from 0.asia.pool.ntp.org..";\n\
	ntpdate -u 0.asia.pool.ntp.org\n\
fi\n\
if [ $? = 1 ];then\n\
	echo "|-Trying to sync time from www.bt.cn..";\n\
	getBtTime=$(curl -sS --connect-timeout 3 -m 60 http://www.bt.cn/api/index/get_time)\n\
	if [ "${getBtTime}" ];then	\n\
		date -s "$(date -d @$getBtTime +"%Y-%m-%d %H:%M:%S")"\n\
	fi\n\
fi\n\
echo "|-Trying to write current system time to hardware..";\n\
hwclock -w\n\
date\n\
echo "|-Time synchronization completed!";'
	}
	var tBody = "<textarea class='txtsjs bt-input-text' name='sBody' style='margin: 0px; width: 445px; height: 90px;line-height: 16px;'>"+shell_body+"</textarea>";
	$("#implement").html(tBody);
	$(".planname input[name='name']").removeAttr('readonly style').val(shell_name);
}

function toPath() {

}
//木马查杀
function webShell(){
	var sOpt = "",sOptBody = '';
	$.post('/crontab?action=GetDataList&type=sites',function(rdata){
		$(".planname input[name='name']").attr('readonly','true').css({"background-color":"#f6f6f6","color":"#666"});
		if(rdata.data.length == 0){
			layer.msg(lan.public.list_empty,{icon:2})
			return
		}
		for(var i=0;i<rdata.data.length;i++){
			if(i==0){
				$(".planname input[name='name']").val("木马查杀"+'['+rdata.data[i].name+']');
			}
			sOpt += '<li><a role="menuitem" tabindex="-1" href="javascript:;" value="'+rdata.data[i].name+'">'+rdata.data[i].name+'['+rdata.data[i].ps+']</a></li>';
		}
		sOptBody ='<div class="dropdown pull-left mr20">\
				  <button class="btn btn-default dropdown-toggle" type="button" id="backdata" data-toggle="dropdown" style="width:auto">\
					<b id="sName" val="'+rdata.data[0].name+'">'+rdata.data[0].name+'['+rdata.data[0].ps+']</b> <span class="caret"></span>\
				  </button>\
				  <ul class="dropdown-menu" role="menu" aria-labelledby="backdata">'+sOpt+'</ul>\
                </div>'
		setCookie('default_dir_path','/www/wwwroot/');
		setCookie('path_dir_change','/www/wwwroot/');
		setInterval(function(){
			if(getCookie('path_dir_change') != getCookie('default_dir_path')){
				var  path_dir_change = getCookie('path_dir_change')
				$(".planname input").val('Trojan kill ['+getCookie('path_dir_change')+']');
				setCookie('default_dir_path',path_dir_change);
			}
			$(".check_alert").click(function(){
				 _radiox = $(this).find("input[name=alert]").val();
			})
		},500);
		sOptBody += '<p class="clearfix plan">\
            <div class="textname pull-left mr20" style="margin-left: 63px; font-size: 14px;">Message channel</div>\
            <div class="dropdown planBackupTo pull-left mr20 message_start"></div>\
        </p>';
		$("#implement").html(sOptBody);
		message_channel_start();
		$("#implement").siblings(".controls").html("Scan site");
		getselectname();
		$(".dropdown ul li a").click(function(){
			var sName = $("#sName").attr("val");
			if(!sName) return;
			$(".planname input[name='name']").val("Trojan kill "+'['+sName+']');
		});
	})
}
function message_channel_start(){
	$.post('/config?action=get_settings',function(res){
		var wBody = "";
		if(!res.user_mail.user_name && !res.dingding.dingding){
			wBody = '<span style="color:red;">No message channel is set, please go to panel settings to add a message channel configuration<a href="https://www.bt.cn/bbs/thread-42312-1-1.html" target="_blank" class="bt-ico-ask" style="cursor: pointer;">?</a></span>';
			$(".plan-submit").css({"pointer-events":"none","background-color":"#e6e6e6","color":"#333"});
		}else if(res.user_mail.user_name && !res.dingding.dingding){
			wBody = '<div class="check_alert" style="margin-right:20px;display: inline-block;">\
				<input type="radio" name="alert" title="Email" value="mail" checked="">\
				<label style="font-weight: normal;font-size: 14px;margin-left: 6px;display: inline;">Email</label>\
			</div>'
		}else if(!res.user_mail.user_name && res.dingding.dingding){
			wBody = '<div class="check_alert" style="display: inline-block;">\
				<input type="radio" name="alert" title="dingding" value="dingding" checked="">\
				<label style="font-weight: normal;font-size: 14px;margin-left: 6px;display: inline;">dingding</label>\
			</div>'
		}else{
			wBody ='<div class="check_alert" style="margin-right:20px;display: inline-block;">\
				<input type="radio" name="alert" title="Email" value="mail" checked="">\
				<label style="font-weight: normal;font-size: 14px;margin-left: 6px;display: inline;">Email</label>\
			</div>\
			<div class="check_alert" style="display: inline-block;">\
				<input type="radio" name="alert" title="dingding" value="dingding">\
				<label style="font-weight: normal;font-size: 14px;margin-left: 6px;display: inline;">dingding</label>\
			</div>'
		}
		$(".message_start").html(wBody);
	})
}
//从url
function toUrl(){
	var tBody = "<input type='text' style='width:400px; height:34px' class='bt-input-text' name='urladdress_1' id='urladdress_1' placeholder='"+lan.crontab.url_address+"' value='http://' />";
	$("#implement").html(tBody);
	$(".planname input[name='name']").removeAttr('readonly style').val("");
}

//释放内存
function rememory(){
	$(".planname input[name='name']").removeAttr('readonly style').val("");
	$(".planname input[name='name']").val(lan.crontab.mem);
	$("#implement").html(lan.crontab.mem_ps);
	return;
}
//上传
function fileupload(){
	$("#sFile").change(function(){
		$("#viewfile").val($("#sFile").val());
	});
	$("#sFile").click();
}