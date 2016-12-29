/**
 * Created by hdumok on 2016/12/7.
 */

'use strict';
import util from 'util'
const MSG_TYPE = CONSTANTS.MSG_TYPE;
const JPUSH_TAGS = CONSTANTS.JPUSH_TAGS;
const NOTIFICATION_TYPE = CONSTANTS.NOTIFICATION_TYPE;

class AppMsg {
    constructor(opts) {
        this.redis = opts.redis;
        this.mysql = opts.mysql;
        this.jpush = opts.jpush;
    }

    handler(msg) {
        if(!msg.appName){
            console.warn('push notification to parents app error, no appName, msg: ', msg);
            return;
        }

        if (msg.type === MSG_TYPE.TEST) {
            return this.pushTestMessage(msg);
        }
    }

    pushTestMessage({testId, title, desc, id, appName}) {
        let testGroup = util.format(JPUSH_TAGS.TEST, testId);
        let data = {
            type: "",
            tag: "",
            expire: "",
            app: appName
        };

        let content = {
            type: NOTIFICATION_TYPE.TEST,
            id: id,
            title: title,
            desc: desc
        };
        data.content = JSON.stringify(content);
        data.alertTitle = title;
        data.alert = desc;
        console.warn('push test notification to app, %s', data.content);
        if (CONSTANTS.JPUSH_CONFIGS[appName]) {
            testGroup = util.format(JPUSH_TAGS.TEST, testId);

            console.debug('pushTestMessage:', {appName, tags: testGroup, notification: data})
            return this.jpush.pushToTag({appName, tags: testGroup, notification: data});
        } else {
            console.warn('push test notification to app error, no appName, data: ', data);
        }
    };
}

export default AppMsg