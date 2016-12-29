/**
 * Created by hdumok on 2016/8/6.
 */

'use strict';

import Promise from 'bluebird'
import jpushSdk from 'jpush-sdk'

const MSG_TYPE = {
    SINGLE: 1,
    TAG: 2
}

class JPush {
    constructor(apps) {
        this.clients = {};

        for (let appName in apps) {
            let config = apps[appName];

            try {
                this.clients[appName] = jpushSdk.buildClient(config.appKey, config.masterSecret, config.retryTimes);
                console.debug("create app %s jpush client success", appName);
            }
            catch (e){
                console.error("create app %s jpush client failed, reason: %j", appName, e);
            }
        }
    }

    async initTarget({appName, alias, registrationId, tags}) {

        let client = this.clients[appName];
        if (!client) {
            console.warn("initTarget error, app %s have no jpush client", appName);
            return;
        }

        tags = tags || []
        if (typeof tags === 'string') {
            try {
                tags = JSON.parse(tags) || [];
            } catch (e) {
                tags = [];
            }
        }

        console.debug('initTarget, app: %s, alias: %s, registrationId: %s, tags : %j', appName, alias, registrationId, tags)

        return await initTags(client, registrationId, alias, tags)
    }

    async updateTags({appName, alias, registrationId, toRemoveTags, toAddTags}) {
        let client = this.clients[appName];
        if (!client) {
            console.warn("updateTags error, app %s have no jpush client", appName);
            return;
        }

        toRemoveTags = toRemoveTags || [];
        toAddTags = toAddTags || [];
        if (typeof toRemoveTags === 'string') {
            try {
                toRemoveTags = JSON.parse(toRemoveTags) || [];
            } catch (e) {
                toRemoveTags = [];
            }
        }
        if (typeof toAddTags === 'string') {
            try {
                toAddTags = JSON.parse(toAddTags) || [];
            } catch (e) {
                toAddTags = [];
            }
        }

        console.debug('updateTags, app: %s, alias: %s, registrationId: %s, tags to add: %j, tags to remove: %j',
            appName, alias, registrationId, toAddTags, toRemoveTags)

        return await updateTags(client, registrationId, alias, toAddTags, toRemoveTags)
    }

    async clearAliasAndTags({appName, alias, registrationId}) {
        let client = this.clients[appName];
        if (!client) {
            console.warn("clearAliasAndTags error, app %s have no jpush client", appName);
            return;
        }

        console.debug('clearAliasAndTags, app: %s, alias: %s, registrationId: %s', appName, alias, registrationId)

        try {
            await clearTags(client, registrationId);
            await clearAlias(client, alias);
        }
        catch(e){
            console.error("clearAliasAndTags error, reason: ", e)
        }
    }

    async pushToSingle({appName, alias, notification}) {
        let client = this.clients[appName];
        if (!client) {
            console.warn("pushToSingle error, appName %s have no jpush client", appName);
            return;
        }

        if (~appName.indexOf('-ios')) {
            let audience = jpushSdk.alias(alias);
            return await sendToIOS({client, audience, notification});
        } else if (~appName.indexOf('-j')) {
            let audience = jpushSdk.alias(alias);
            return await sendToAndroid({client, audience, notification});
        } else {
            return await push({client, alias, type: MSG_TYPE.SINGLE, notification});
        }
    }

    async pushToTag({appName, tags, notification}) {
        let client = this.clients[appName];
        if (!client) {
            console.warn("pushToTag error, app %s have no jpush client", appName);
            return;
        }

        console.debug("pushToTag, app: %s, tags: %j, registration: %j", appName, tags, notification);

        return await push({client, tags, type: MSG_TYPE.TAG, notification});
    }
}

function initTags(client, registrationId, alias, tags) {
    return new Promise((resolve, reject) => {
        client.updateDeviceTagAlias(registrationId, alias, false, tags, [], function (err, res) {
            if (err) {
                reject(err);
            } else {
                resolve({result: res});
            }
        });
    });
}

function updateTags(client, registrationId, alias, toAddTags, toRemoveTags) {
    return new Promise((resolve, reject) => {
        client.updateDeviceTagAlias(registrationId, alias, false, toAddTags, toRemoveTags, function (err, res) {
            if (err) {
                reject(err);
            } else {
                resolve({result: res});
            }
        });
    });
}

function clearTags(client, registrationId) {
    return new Promise((resolve, reject) => {
        client.updateDeviceTagAlias(registrationId, null, true, [], [], function (err, res) {
            if (err) {
                reject(err);
            } else {
                resolve({result: res});
            }
        });
    });
}

function clearAlias(client, alias) {
    return new Promise((resolve, reject) => {
        client.deleteAlias(alias, null, function (err, res) {
            if (err) {
                reject(err);
            } else {
                resolve({result: res});
            }
        });
    });
}

function push({client, type, tags, alias, notification}) {
    let audience;
    if (type === MSG_TYPE.SINGLE) {
        audience = jpushSdk.alias(alias);
    } else {
        audience = jpushSdk.tag(tags);
    }
    return Promise.any([
        sendToAndroid({client, audience, notification}),
        sendToIOS({client, audience, notification})
    ]);
}

function sendToAndroid({client, audience, notification}) {
    return new Promise((resolve, reject) => {
        client.push().setPlatform('android').setOptions(null, null, null, NODE_ENV !== 'development').setAudience(audience).setMessage(notification.alert, notification.alertTitle, null, JSON.parse(notification.content)).send((err, res) => {
            if (err) {
                reject(err);
            } else {
                resolve(res);
            }
        });
    });
}

function sendToIOS({client, audience, notification}) {
    return new Promise((resolve, reject) => {
        client.push().setPlatform('ios').setOptions(null, null, null, NODE_ENV !== 'development').setAudience(audience).setMessage(notification.alert, notification.alertTitle, null, JSON.parse(notification.content)).setNotification(notification.alert, jpushSdk.ios(notification.alertTitle, 'default', null, false, JSON.parse(notification.content))).send((err, res) => {
            if (err) {
                reject(err);
            } else {
                resolve(res);
            }
        });
    });
}

export default JPush