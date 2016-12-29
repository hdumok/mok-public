/**
 * Created by hdumok on 2016/12/10.
 */

'use strict';

import * as log from '../lib/log'
import HttpService from './http';
import PushService from './push';
import JPush from '../lib/jpush';
import QiNiu from '../lib/qiniu';
import Wechat from '../lib/wechat';
import redis from '../lib/redis';
import mysql from '../lib/mysql';

class Services {
    constructor() {
        this.redis = redis;
        this.mysql = mysql;
        this.jpush = null;
        this.qiniu = null;
        this.wechat = null;
        this.httpService = null;
        this.pushService = null;
    }

    async start() {
        try {
            await this.initWechat();
            await this.initQiNiu();
            await this.initJPush();

            let opts = {
                redis:this.redis,
                mysql:this.mysql,
                jpush:this.jpush,
                qiniu:this.qiniu,
                wechat:this.wechat
            }

            this.httpService = new HttpService(opts);
            this.pushService = new PushService(opts);

            await this.httpService.start();
            await this.pushService.start();
        }
        catch(e) {
            console.error("start service raise an error", e.stack);
            process.exit(1);
        }
    }

    async initWechat() {
        let apps = await mysql('scard_xapp as app').select('*');

        console.debug("get wechat apps from mysql, apps: ", apps);

        this.wechat = new Wechat(apps)
    }

    async initJPush() {
        let apps = CONSTANTS.JPUSH_CONFIGS;

        console.debug("get jpush apps: ", apps);

        this.jpush = new JPush(apps)
    }

    async initQiNiu() {
        let conf = CONSTANTS.QINIU_CONFIGS;

        console.debug("get qiniu config: ", conf);

        this.qiniu = new QiNiu(conf)
    }
}

module.exports = new Services;