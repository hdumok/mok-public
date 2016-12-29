/**
 * Created by hdumok on 2016/12/5.
 */

'use strict'

import co from 'co';
import util from 'util'
import WechatApi from 'co-wechat-api'
import redis from './redis'

const KEY_APP = 'mok:wechat:%d';

class Wechat {
    constructor(apps) {
        this.apis = {};

        for (let app of apps) {
            this.apis[app.id] = this.initApp(app)
        }
    }

    initApp(app) {
        let key = util.format(KEY_APP, app.id);

        try {
            let wechatApi = new WechatApi(app.appid, app.secret, function*() {

                let token = yield redis.hget(key, 'token');
                try {
                    token = JSON.parse(token)
                } catch (e) {
                    return;
                }

                console.debug('wechat get token %j', token)
                return token
            }, function*(token) {
                console.debug('wechat save token %j', token)
                return yield redis.hset(key, 'token', JSON.stringify(token));
            });

            wechatApi.registerTicketHandle(function*(type) {
                let ticket = yield redis.hget(key, 'ticket');

                try {
                    ticket = JSON.parse(ticket)
                } catch (e) {
                    return;
                }

                console.debug('wechat get ticket %j', ticket)
                return ticket
            }, function*(type, ticket) {
                console.debug('wechat save ticket %j', ticket)
                return yield redis.hset(key, 'ticket', JSON.stringify(ticket));
            });

            console.debug("create wechat %s api success", app.name);

            return wechatApi;
        }
        catch (e) {
            console.error("create wechat %s api failed, reason: %j", app.name, e.stack);
        }
    }

    async getAccessToken(id) {
        let api = this.apis[id];
        if (!api) {
            console.error("getAccessToken failed, no wechat id %d", id);
            return;
        }

        try {
            let result = await co(function*() {
                return yield api.ensureAccessToken()
            })
            console.debug("ensureAccessToken success, %j", result)
            return result
        }
        catch (e) {
            console.error("ensureAccessToken error", e.stack);
        }
    }

    async getTicketToken(id) {
        let api = this.apis[id];
        if (!api) {
            console.error("getTicketToken failed, no wechat id %d", id);
            return;
        }

        try {
            let result = await co(function*() {
                //语法：不能return api.ensureTicket(),那只会返回一个正在执行中的函数，而不是函数的执行结果,await只是yield
                return yield api.ensureTicket()
            })

            console.debug("ensureTicket success, %j", result)

            return result.ticket
        }
        catch (e) {
            console.error("ensureTicket error", e.stack);
        }
    }

    async sendTemplate(id, template) {
        let api = this.apis[id];
        if (!api) {
            console.error("sendTemplate failed, no wechat id %d", id);
            return false;
        }

        if (!template.openid) {
            console.error("sendTemplate failed, no openid, %j", msg);
            return false;
        }

        if (!template.templateId) {
            console.error("sendTemplate failed, no templateId, %j", msg);
            return false;
        }

        template.topcolor = template.topcolor || '#000000'; // 顶部颜色

        try {
            let result = await co(function*() {
                return yield api.sendTemplate(template.openid, template.templateId, template.url, template.topColor, template.data);
            })

            //TODO 错误判断
            if (result) {

            }

            console.debug("sendTemplate success, %j", result)
            return true
        }
        catch (e) {
            console.error("sendTemplate error" + e.stack);
        }
    }
}

export default Wechat
