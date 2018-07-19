'use strict';
var noble = require('noble');
var targetMac = 'd3:04:2a:02:60:99';

noble.on('stateChange', function(state) {
    if (state === 'poweredOn') {
        noble.startScanning();
        //console.log('timestamp,UUID,ID,rssi,Temperature,Humidity,ambient_light,uv_index,pressure,Noise,acceleration_x,acceleration_y,acceleration_z,battery_voltage');
        console.log('時刻,UUID,ID,RSSI[dBm],温度[℃],湿度[%],明るさ[lx],紫外線指数,気圧[hPa],騒音[dB],加速度\(x\),加速度\(y\),加速度\(z\),バッテリー[mV]');
    } else {
        noble.stopScanning();
    }
});

noble.on('discover', function(peripheral) {
    if (peripheral.advertisement && peripheral.advertisement.manufacturerData) {
        var manufacturerData = peripheral.advertisement.manufacturerData;
        var type = manufacturerData.toString("hex");
        var buffer = manufacturerData;
        var uuid = peripheral.id;
        var macAddress = peripheral.id.match(/[0-9a-z]{2}/g).join(":");
        var rssi = peripheral.rssi;
        var now = new Date();

        if (type.startsWith("d502") && macAddress === targetMac ) {
            noble.stopScanning();
            if (buffer.length < 22) {
                console.log(macAddress + " is not configure OMRON-Env. Expected AD lenght 22, actual " + buffer.length);
            } else {
                var envData;
                try {
                    var dataOffset = -5;
                    envData = {
                        //timastamp: now.toISOString(),
                        timastamp: now.toLocaleString(),
                        UUID: uuid,
                        ID: macAddress,
                        rssi: rssi + " dBm",
                        Temperature: buffer.readInt16LE(dataOffset + 8) / 100 + ' ℃',  // 単位：0.01 degC
                        Humidity: buffer.readUInt16LE(dataOffset + 10) / 100 + ' %',   // 単位：0.01 %RH
                        ambient_light: buffer.readUInt16LE(dataOffset + 12) + ' lx',    // 単位：1 lx
                        uv_index: buffer.readUInt16LE(dataOffset + 14) / 100,   // 単位：0.01
                        pressure: buffer.readUInt16LE(dataOffset + 16) / 10 + ' hPa',    // 単位：0.1 hPa
                        Noise: buffer.readUInt16LE(dataOffset + 18) / 100 + ' dB',      // 単位：0.01 dB
                        acceleration_x: buffer.readUInt16LE(dataOffset + 20),
                        acceleration_y: buffer.readUInt16LE(dataOffset + 22),
                        acceleration_z: buffer.readUInt16LE(dataOffset + 24),
                        battery_voltage: (buffer.readUInt8(dataOffset + 26) + 100) * 10 + ' mV' // ((取得値 + 100) x 10) mV
                    };
                } catch(err) {
                    console.log(err);
                }
                var result;
                for ( var key in envData ) {
                    if ( result === undefined ) {
                        result = envData[key].toString() ;
                    } else {
                        result += ', ' + envData[key].toString() ;
                    }
                }
                console.log ( result ) ;
            }
            noble.startScanning();
        }
    }
});
