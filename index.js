#!/usr/bin/env node

const log = require('yalm');
const Mqtt = require('mqtt');
const Lgtv = require('lgtv2');
const config = require('./config.js');
const pkg = require('./package.json');

let mqttConnected;
let tvConnected;
let lastError;

let channelsToIds = [
    "",
    '3_27_1_1_7114_2_1',
    '3_27_2_2_7114_3_1',
    '3_27_3_3_7114_4_1',
    '3_27_4_4_7114_7_1',
    '3_27_5_5_7114_8_1',
    '3_27_6_6_7114_6_1',
    '3_27_7_7_7114_5_1',
    '3_27_8_8_7114_139_1',
    '3_27_9_9_7114_1_1',
    '3_27_10_10_7114_15_1',
    '3_28_11_11_7115_16_1',
    '3_28_12_12_7115_14_1',
    '3_28_13_13_7115_12_1',
    '3_28_14_14_7115_17_1',
    '3_28_15_15_7115_10_1',
    '3_28_16_16_7115_11_1',
    '3_28_17_17_7115_90_1',
    '3_28_18_18_7115_13_1',
    '3_28_19_0_7115_18_1',
    '3_28_20_0_7115_9_1',
    '3_42_21_21_7021_172_1',
    '3_32_22_22_7119_89_1',
    '3_44_23_23_7068_93_1',
    '3_29_24_24_7116_95_1',
    '3_32_25_25_7119_128_1',
    '3_62_26_26_7028_173_1',
    '3_48_27_27_7024_51_1',
    "",
    "",
    '3_42_30_30_7021_80_1',
    '3_42_31_31_7021_79_1',
    '3_41_32_32_7139_70_1',
    '3_43_33_33_7023_81_1',
    '3_48_34_34_7024_131_1',
    '3_33_35_35_7030_197_1',
    '3_43_36_36_7023_82_1',
    '3_45_37_37_7069_130_1',
    "",
    '3_40_39_39_7138_66_1',
    '3_56_40_40_7036_147_1',
    '3_52_41_41_7027_167_1',
    '3_50_42_42_7025_149_1',
    '3_39_43_43_7137_113_1',
    '3_44_44_44_7068_108_1',
    '3_40_45_45_7138_185_1',
    '3_50_46_46_7025_148_1',
    '3_50_47_47_7025_153_1',
    '3_29_48_48_7116_19_1',
    '3_30_49_49_7117_83_1',
    '3_30_50_50_7117_104_1',
    '3_40_51_51_7138_48_1',
    '3_50_52_52_7025_154_1',
    '3_56_53_53_7036_22_1',
    '3_51_54_54_7026_156_1',
    '3_51_55_55_7026_155_1',
    '3_29_56_56_7116_176_1',
    '3_46_57_57_7033_114_1',
    '3_41_58_58_7139_69_1',
    '3_46_59_59_7033_112_1',
    '3_46_60_60_7033_115_1',
    '3_32_61_61_7119_53_1',
    '3_62_62_62_7028_140_1',
    '3_51_63_63_7026_157_1',
    '3_46_64_64_7033_111_1',
    '3_48_65_65_7024_141_1',
    '3_64_66_66_7029_194_1',
    '3_51_67_67_7026_159_1',
    '3_39_68_68_7137_37_1',
    '3_46_69_69_7033_109_1',
    '3_32_70_70_7119_55_1',
    '3_41_71_71_7139_71_1',
    '3_30_72_72_7117_36_1',
    '3_50_73_73_7025_143_1',
    '3_51_74_74_7026_166_1',
    '3_52_75_75_7027_180_1',
    '3_38_76_76_7031_94_1',
    '3_48_77_77_7024_132_1',
    '3_50_78_78_7025_135_1',
    '3_50_79_79_7025_45_1',
    '3_33_80_80_7030_196_1',
    '3_56_81_81_7036_142_1',
    '3_47_82_82_7035_192_1',
    '3_50_83_83_7025_144_1',
    '3_50_84_84_7025_151_1',
    '3_30_85_85_7117_33_1',
    '3_50_86_86_7025_145_1',
    '3_30_87_87_7117_34_1',
    '3_41_88_88_7139_74_1',
    '3_30_89_89_7117_30_1',
    "",
    '3_45_91_91_7069_60_1',
    '3_52_92_92_7027_179_1',
    '3_38_93_93_7031_182_1',
    '3_47_94_94_7035_61_1',
    "",
    "",
    '3_44_97_97_7068_59_1',
    "",
    ""
];

log.setLevel(config.verbosity);

log.info('mqtt trying to connect', config.url);

const mqtt = Mqtt.connect(config.url, {will: {topic: config.name + '/connected', payload: '0', retain: true}});

const lgtv = new Lgtv({
    url: 'ws://' + config.tv + ':3000'
});

mqtt.on('connect', () => {
    mqttConnected = true;

    log.info('mqtt connected', config.url);
    mqtt.publish(config.name + '/connected', tvConnected ? '2' : '1', {retain: true});

    log.info('mqtt subscribe', config.name + '/set/#');
    mqtt.subscribe(config.name + '/set/#');
});

mqtt.on('close', () => {
    if (mqttConnected) {
        mqttConnected = false;
        log.info('mqtt closed ' + config.url);
    }
});

mqtt.on('error', err => {
    log.error('mqtt', err);
});

mqtt.on('message', (topic, payload) => {
    payload = String(payload);
    try {
        payload = JSON.parse(payload);
    } catch (err) {

    }

    log.debug('mqtt <', topic, payload);

    const parts = topic.split('/');

    switch (parts[1]) {
        case 'set':
            switch (parts[2]) {
                case 'toast':
                    lgtv.request('ssap://system.notifications/createToast', {message: String(payload)});
                    break;
                case 'volume':
                    lgtv.request('ssap://audio/setVolume', {volume: parseInt(payload, 10)} || 0);
                    break;
                case 'youtube':
                    lgtv.request('ssap://system.launcher/launch', {id: 'youtube.leanback.v4', contentId: String(payload)});
                    break;
                case 'channel':
                    lgtv.request('ssap://tv/openChannel', {channelId: channelsToIds[payload]});
                    break;
                case 'upChannel':
                    lgtv.request('ssap://tv/channelUp');
                    break;
                default:
                    lgtv.request('ssap://' + topic.replace(config.name + '/set/', ''), payload || null);
            }
            break;
        default:
    }
});

lgtv.on('prompt', () => {
    log.info('authorization required');
});

lgtv.on('connect', () => {
    let channelsSubscribed = false;
    lastError = null;
    tvConnected = true;
    log.info('tv connected');
    mqtt.publish(config.name + '/connected', '2', {retain: true});

    lgtv.subscribe('ssap://audio/getVolume', (err, res) => {
        log.debug('audio/getVolume', err, res);
        if (res.changed.indexOf('volume') !== -1) {
            mqtt.publish(config.name + '/state/volume', String(res.volume), {retain: true});
        }
    });

    lgtv.subscribe('ssap://com.webos.applicationManager/getForegroundAppInfo', (err, res) => {
        if (res.appId === 'com.webos.app.livetv') {
            if (!channelsSubscribed) {
                channelsSubscribed = true;
                setTimeout(() => {
                    lgtv.subscribe('ssap://tv/getCurrentChannel', (err, res) => {
                        if (err) {
                            log.error(err);
                            return;
                        }
                        channelsToIds[res.channelNumber] = res.channelId;
                        mqtt.publish(config.name + '/state/channel', String(res.channelNumber), {retain: true});
                    });
                }, 2500);
            }
        }
    });

    /*
    lgtv.subscribe('ssap://tv/getExternalInputList', function (err, res) {
        console.log('getExternalInputList', err, res);
    });
    */
});

lgtv.on('connecting', host => {
    log.debug('tv trying to connect', host);
});

lgtv.on('close', () => {
    lastError = null;
    tvConnected = false;
    log.info('tv disconnected');
    mqtt.publish(config.name + '/connected', '1', {retain: true});
});

lgtv.on('error', err => {
    const str = String(err);
    if (str !== lastError) {
        log.error('tv', str);
    }
    lastError = str;
});

function sendPointerEvent(type, payload) {
    lgtv.getSocket(
        'ssap://com.webos.service.networkinput/getPointerInputSocket',
        (err, sock) => {
            if (!err) {
                sock.send(type, payload);
            }
        }
    );
}
