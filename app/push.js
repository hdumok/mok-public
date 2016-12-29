/**
 * Created by hdumok on 2016/12/10.
 */

'use strict';

import Promise from 'bluebird'
import nodemailer from 'nodemailer'
import AppMsg from '../handlers/app'
import WechatMsg from '../handlers/wechat'
const USER_TYPE = CONSTANTS.USER_TYPE;
const SUBSCRIBE = CONSTANTS.SUBSCRIBE;
const JUPUH_NO_USER = '1011';

class PushService {
    constructor (opts) {
        this.redis = opts.redis;
        this.mysql = opts.mysql;
        this.email = null;
        this.interval = null;

        this.appMsg = new AppMsg(opts);
        this.wechatMsg = new WechatMsg(opts);
    }

    async start() {
        this.email = this.initEmail();
        this.interval = SUBSCRIBE.interval;
        while (true) {
            this.subscribeMsg();
            this.subscribeLog();
            await Promise.delay(this.interval);
        }
    }

    async subscribeMsg() {
        let msg;
        try {
            msg = await this.redis.rpop(CONSTANTS.CHANNEL_PUSH);
            if (!msg) {
                this.interval *= 2;
                if (this.interval > SUBSCRIBE.maxInterval) {
                    this.interval = SUBSCRIBE.maxInterval;
                }
                return;
            }
            else {
                this.interval = SUBSCRIBE.interval;
                msg = JSON.parse(msg);
                console.debug('get msg form channel_push:', msg);
            }

            let pushResult;
            switch (msg.userType) {
                case USER_TYPE.APP:
                    pushResult = await this.appMsg.handler(msg);
                    break;
                case USER_TYPE.WX:
                    pushResult = await this.wechatMsg.handler(msg);
                    break;
                default:
                    console.warn(`user type ${msg.userType} is not supported now`);
                    return;
            }

        } catch (err) {

            console.error('handler msg raise an error: ', err);

            msg.retry = msg.retry ? msg.retry + 1 : 1;
            if (msg.retry > SUBSCRIBE.retry) return;

            //TODO如果是微信的错误

            //如果是JPUSH的错误
            if (err.name == 'APIRequestError' && ~err.response.indexOf(JUPUH_NO_USER)) return;

            this.redis.lpush(CONSTANTS.CHANNEL_PUSH, JSON.stringify(msg));
        }
    }

    async subscribeLog() {

        let length = await this.redis.llen(CONSTANTS.CHANNEL_LOG)
        if (length > SUBSCRIBE.maxLength) {
            length = SUBSCRIBE.maxLength
        }

        if (length == 0) return;

        let subject = [];
        let msg = '';
        for (let i = 0; i < length; i++) {
            let log = await this.redis.rpop(CONSTANTS.CHANNEL_LOG);

            for(let ignore of CONSTANTS.IGNORE){
                if(log.indexOf(ignore) != -1) {
                    log = '';
                    break;
                }
            }


            if (!log) continue;

            msg = `${log}\n\n${msg}`;
            subject.push(log.slice(log.indexOf('name:') + 6, log.indexOf('\nversion:')))
        }

        subject = Array.from(new Set(subject)).join(',') || 'mok-public'

        if (msg !== '') this.email(subject, msg)
    }

    initEmail() {

        let transporter = nodemailer.createTransport(CONFIG.email.sender)

        let mailOptions = {
            from: CONFIG.email.sender.auth.user,
            to: CONFIG.email.receiver
        }

        return function (subject, message) {
            mailOptions.subject = subject
            mailOptions.text = message
            transporter.sendMail(mailOptions)
        }
    }
}

export default PushService
