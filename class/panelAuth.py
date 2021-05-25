#coding: utf-8
#-------------------------------------------------------------------
# 宝塔Linux面板
#-------------------------------------------------------------------
# Copyright (c) 2015-2019 宝塔软件(http:#bt.cn) All rights reserved.
#-------------------------------------------------------------------
# Author: hwliang <hwl@bt.cn>
#-------------------------------------------------------------------

#------------------------------
# AUTH验证接口
#------------------------------

import public,time,json,os,requests
from BTPanel import session

class panelAuth:
    __product_list_path = 'data/product_list.pl'
    __product_bay_path = 'data/product_bay.pl'
    __product_id = '100000011'
    __official_url = 'https://brandnew.shackerPanel.com'

    def create_serverid(self,get):
        try:
            userPath = 'data/userInfo.json'
            if not os.path.exists(userPath): return public.returnMsg(False,'LOGIN_FIRST')
            tmp = public.readFile(userPath)
            if len(tmp) < 2: tmp = '{}'
            data = json.loads(tmp)
            data['uid'] = data['id']
            if not data: return public.returnMsg(False,'LOGIN_FIRST')
            if not 'server_id' in data:
                s1 = public.get_mac_address() + public.get_hostname()
                s2 = self.get_cpuname()
                serverid = public.md5(s1) + public.md5(s2)
                data['server_id'] = serverid
                public.writeFile(userPath,json.dumps(data))
            return data
        except: return public.returnMsg(False,'LOGIN_FIRST')


    def create_plugin_other_order(self,get):
        pdata = self.create_serverid(get)
        pdata['pid'] = get.pid
        pdata['cycle'] = get.cycle
        p_url = public.GetConfigValue('home') + '/api/Pluginother/create_order'
        if get.type == '1':
            pdata['renew'] = 1
            p_url = public.GetConfigValue('home') + '/api/Pluginother/renew_order'
        return json.loads(public.httpPost(p_url,pdata))

    def get_order_stat(self,get):
        pdata = self.create_serverid(get)
        pdata['order_id'] = get.oid
        p_url = public.GetConfigValue('home') + '/api/Pluginother/order_stat'
        if get.type == '1':  p_url = public.GetConfigValue('home') + '/api/Pluginother/re_order_stat'
        return json.loads(public.httpPost(p_url,pdata))
    
    def check_serverid(self,get):
        if get.serverid != self.create_serverid(get): return False
        return True

    def get_plugin_price(self, get):
        try:
            userPath = 'data/userInfo.json'
            if not 'pluginName' in get: return public.returnMsg(False,'INIT_ARGS_ERR')
            if not os.path.exists(userPath): return public.returnMsg(False,'LOGIN_FIRST')
            params = {}
            params['product_id'] = self.get_plugin_info(get.pluginName)['id']
            data = self.send_cloud('{}/api/product/prices'.format(self.__official_url), params)
            return data['res']
        except:
            del(session['get_product_list'])
            return public.returnMsg(False,'Syncing information, please try again!\n' + public.get_error_info())
    
    def get_plugin_info(self,pluginName):
        data = self.get_business_plugin(None)
        if not data: return None
        for d in data:
            if d['name'] == pluginName: return d
        return None
    
    def get_plugin_list(self,get):
        try:
            if not session.get('get_product_bay') or not os.path.exists(self.__product_bay_path):
                data = self.send_cloud('get_order_list_byuser', {})
                if data: public.writeFile(self.__product_bay_path,json.dumps(data))
                session['get_product_bay'] = True
            data = json.loads(public.readFile(self.__product_bay_path))
            return data
        except: return None

    def get_buy_code(self,get):
        cycle = getattr(get,'cycle',1)
        params = {}
        params['cycle'] = cycle
        params['cycle_unit'] = get.cycle_unit
        params['product_id'] = get.pid
        params['src'] = 2
        params['pay_channel'] = 2
        params['charge_type'] = get.charge_type
        env_info = public.fetch_env_info()
        params['environment_info'] = json.dumps(env_info)
        params['server_id'] = env_info['install_code']
        data = self.send_cloud('{}/api/order/product/create'.format(self.__official_url), params)
        return data['res']

    def get_stripe_session_id(self,get):
        params = {}
        params['order_no'] = get.order_no
        data = self.send_cloud('{}/api/order/product/pay'.format(self.__official_url), params)
        session['focre_cloud'] = True
        return data['res']

    def check_pay_status(self,get):
        params = {}
        params['id'] = get.id
        data = self.send_cloud('check_product_pays', params)
        if not data: return public.returnMsg(False,'AJAX_CONN_ERR')
        if data['status'] == True:
            self.flush_pay_status(get)
            if 'get_product_bay' in session: del(session['get_product_bay'])
        return data
    
    def flush_pay_status(self,get):
        if 'get_product_bay' in session: del(session['get_product_bay'])
        data = self.get_plugin_list(get)
        if not data: return public.returnMsg(False,'AJAX_CONN_ERR')
        return public.returnMsg(True,'FLUSH_STATUS_SUCCESS')
    
    def get_renew_code(self):
        pass
    
    def check_renew_code(self):
        pass
    
    def get_business_plugin(self,get):
        try:
            if not session.get('get_product_list') or not os.path.exists(self.__product_list_path):
                data = self.send_cloud('{}/api/product/chargeProducts'.format(self.__official_url), {})
                if data['success']: public.writeFile(self.__product_list_path,json.dumps(data['res']))
                session['get_product_list'] = True
            data = json.loads(public.readFile(self.__product_list_path))
            return data
        except: return None
    
    def get_ad_list(self):
        pass
    
    def check_plugin_end(self):
        pass
    
    def get_re_order_status_plugin(self,get):
        params = {}
        params['pid'] = getattr(get,'pid',0)
        data = self.send_cloud('get_re_order_status', params)
        if not data: return public.returnMsg(False,'AJAX_CONN_ERR')
        if data['status'] == True:
            self.flush_pay_status(get)
            if 'get_product_bay' in session: del(session['get_product_bay'])
        return data
    
    def get_voucher_plugin(self,get):
        params = {}
        params['product_id'] = getattr(get,'pid',0)
        params['status'] = '0'
        data = self.send_cloud('{}/api/user/productVouchers'.format(self.__official_url), params)
        if not data: return []
        return data['res']

    def create_order_voucher_plugin(self,get):
        cycle = getattr(get,'cycle','1')
        params = {}
        params['cycle'] = cycle
        params['cycle_unit'] = get.cycle_unit
        params['coupon_id'] = get.coupon_id
        params['src'] = 2
        params['pay_channel'] = 10
        params['charge_type'] = get.charge_type
        env_info = public.fetch_env_info()
        params['environment_info'] = json.dumps(env_info)
        params['server_id'] = env_info['install_code']
        data = self.send_cloud('{}/api/order/product/create'.format(self.__official_url), params)
        session['focre_cloud'] = True
        if data['success']:
            return public.returnMsg(True,'Activate successfully')
        return public.returnMsg(False, 'Activate failed')

    def send_cloud(self,cloudURL,params):
        try:
            userInfo = self.create_serverid(None)
            if 'token' not in userInfo:
                return None
            url_headers = {"Content-Type": "application/json",
                           "authorization": "bt {}".format(userInfo['token'])
                           }
            resp = requests.post(cloudURL, params=params, headers=url_headers)
            resp = resp.json()
            if not resp['res']: return None
            return resp
        except: return public.get_error_info()
        
    def send_cloud_pro(self,module,params):
        try:
            cloudURL = '{}/api/order/product/'.format(self.__official_url)
            userInfo = self.create_serverid(None)
            params['os'] = 'Linux'
            if 'status' in userInfo:
                params['server_id'] = ''
            else:
                params['server_id'] = userInfo['server_id']
            url_headers = {"authorization": "bt {}".format(userInfo['token'])}
            resp = requests.post(cloudURL, params=params, headers=url_headers)
            resp = resp.json()['res']
            if not resp: return None
            return resp
        except: return None

    def get_voucher(self,get):
        params = {}
        params['product_id'] = self.__product_id
        params['status'] = '0'
        data = self.send_cloud_pro('get_voucher', params)
        return data

    def get_order_status(self,get):
        params = {}
        data = self.send_cloud_pro('get_order_status', params)
        return data
        
    
    def get_product_discount_by(self,get):
        params = {}
        data = self.send_cloud_pro('get_product_discount_by', params)
        return data
    
    def get_re_order_status(self,get):
        params = {}
        data = self.send_cloud_pro('get_re_order_status', params)
        return data
    
    def create_order_voucher(self,get):
        code = getattr(get,'code','1')
        params = {}
        params['code'] = code
        data = self.send_cloud_pro('create_order_voucher', params)
        return data
    
    def create_order(self,get):
        cycle = getattr(get,'cycle','1')
        params = {}
        params['cycle'] = cycle
        params['cycle'] = 'month'
        params['product_id'] = 100000012
        params['src'] = 2
        params['pay_channel'] = 2
        params['charge_type'] = 1
        params['environment_info'] = json.dumps(public.fetch_env_info())
        data = self.send_cloud_pro('create', params)
        return data

    # def fetch_env_info(self):
    #     userInfo = self.create_serverid(None)
    #     return json.dumps({'ip': public.GetLocalIp(),
    #      'is_ipv6': 0,
    #      'os': 'Centos7',
    #      'mac': self.get_mac_address(),
    #      'hdid': public.fetch_disk_SN(),
    #      'ramid': '16G',
    #      'cpuid': public.fetch_cpu_ID(),
    #      'server_name': self.get_hostname(),
    #      'install_code': userInfo['server_id']
    #      })

    def get_cpuname(self):
        return public.ExecShell("cat /proc/cpuinfo|grep 'model name'|cut -d : -f2")[0].strip()
    
    def get_product_auth(self,get):
        params = {}
        params['page'] = get.page if 'page' in get else 1
        params['pageSize'] = get.pageSize if 'pageSize' in get else 15
        data = self.send_cloud('{}/api/user/productAuthorizes'.format(self.__official_url), params)
        if not data['success']: return []
        data = data['res']
        return [i for i in data['list'] if i['status'] != 'activated']

    def auth_activate(self,get):
        params = {}
        params['serial_no'] = get.serial_no
        params['environment_info'] = json.dumps(public.fetch_env_info())
        data = self.send_cloud('{}/api/authorize/product/activate'.format(self.__official_url), params)
        if not data['success']: return public.returnMsg(False,'Activate Failed')
        session['focre_cloud'] = True
        return public.returnMsg(True,'Activate successfully')