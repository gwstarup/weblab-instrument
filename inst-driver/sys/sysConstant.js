'use strict';

// var chID = {
//     'ch1' : 0,
//     'ch2' : 1,
//     'ch3' : 2,
//     'ch4' : 3,
//     'meas1' : 0,
//     'meas2' : 1,
//     'meas3' : 2,
//     'meas4' : 3,
//     'meas5' : 4,
//     'meas6' : 5,
//     'meas7' : 6,
//     'meas8' : 7
// };

// exports.chID = chID;

// var dsoState = {
//     'disconnect' : 0,
//     'timeout' : 1,
//     'connected' : 2,
//     'query' : 3
// };

// exports.dsoState = dsoState;

// var dsoErrCode = {
//     'systemErr' : {message : 'systemErr', type : 1},
//     'timeoutErr' : {message : 'timeoutErr', type : 2},
//     'commandErr' : {message : 'commandErr', type : 3},
//     'intrefErr' : {message : 'intrefErr', type : 4}
// };

// exports.dsoErrCode = dsoErrCode;

// var supportDevice={
//     GDS2002E:{vid:'0x2184',pid:'0x003f',type:'DSO'},
//     DCS2002E:{vid:'0x098f',pid:'0x2204',type:'DSO'},
//     AFG2225:{vid:'0x2184',pid:'0x001C',type:'AFG'}
// };

// exports.supportDevice = supportDevice;


// var supportType = ['GDS2000E'];
// exports.supportType = supportType;


module.exports ={
    chID : {
                'ch1' : 0,
                'ch2' : 1,
                'ch3' : 2,
                'ch4' : 3,
                'meas1' : 0,
                'meas2' : 1,
                'meas3' : 2,
                'meas4' : 3,
                'meas5' : 4,
                'meas6' : 5,
                'meas7' : 6,
                'meas8' : 7,
                'am1' :0,
                'am2' :1,
                'fm1' :0,
                'fm2' :1,
                'pm1' :0,
                'pm2' :1,
                'fsk1':0,
                'fsk2':1,
                'sum1':0,
                'sum2':1,
                'sweep1':0,
                'sweep2':1
            },
    dsoState : {
                    'am' : 0,
                    'timeout' : 1,
                    'connected' : 2,
                    'query' : 3
                },
    afgModCmd : {
                    am1 : {
                            type : 'AMInteFunc',
                            freq : 'AMInteFreq',
                            source : 'AMSource',
                            depth : 'AMDepth',
                            state : 'AMState'
                    },
                    am2 : {
                            type : 'AMInteFunc',
                            freq : 'AMInteFreq',
                            source : 'AMSource',
                            depth : 'AMDepth',
                            state : 'AMState'
                    },
                    fm1 : {
                            type : 'FMInteFunc',
                            freq : 'FMInteFreq',
                            source : 'FMSource',
                            deviation : 'FMDeviation',
                            state : 'FMState'
                    },
                    fm2 : {
                            type : 'FMInteFunc',
                            freq : 'FMInteFreq',
                            source : 'FMSource',
                            deviation : 'FMDeviation',
                            state : 'FMState'
                    },
                    pm1 : {
                            type : 'PMInteFunc',
                            freq : 'PMInteFreq',
                            source : 'PMSource',
                            deviation : 'PMDeviation',
                            state : 'PMState'
                    },
                    pm2 : {
                            type : 'PMInteFunc',
                            freq : 'PMInteFreq',
                            source : 'PMSource',
                            deviation : 'PMDeviation',
                            state : 'PMState'
                    },
                    fsk1 :{
                            freq : 'FSKInteFreq',
                            source : 'FSKSource',
                            rate : 'FSKRate',
                            state : 'FSKState'
                    },
                    fsk2 :{
                            freq : 'FSKInteFreq',
                            source : 'FSKSource',
                            rate : 'FSKRate',
                            state : 'FSKState'
                    },
                    sum1 :{
                            type : 'SUMInteFunc',
                            freq : 'SUMInteFreq',
                            source : 'SUMSource',
                            ampl : 'SUMAmpl'
                    },
                    sum2 :{
                            type : 'SUMInteFunc',
                            freq : 'SUMInteFreq',
                            source : 'SUMSource',
                            ampl : 'SUMAmpl'
                    },
                    sweep1 :{
                            state : 'SweepState',
                            startfreq : 'SweepFrqStart',
                            stopfreq : 'SweepFrqStop',
                            centerfreq : 'SweepFrqCenter',
                            markerfreq : 'SweepMarkerFreq',
                            span : 'SweepFrqSpan',
                            swptime : 'SweepTime',
                            marker : 'SweepMarker',
                            type : 'SweepSpacing',
                            source : 'SweepSource'
                    },
                    sweep2 :{
                            state : 'SweepState',
                            startfreq : 'SweepFrqStart',
                            stopfreq : 'SweepFrqStop',
                            centerfreq : 'SweepFrqCenter',
                            markerfreq : 'SweepMarkerFreq',
                            span : 'SweepFrqSpan',
                            swptime : 'SweepTime',
                            marker : 'SweepMarker',
                            type : 'SweepSpacing',
                            source : 'SweepSource'
                    }
                },
    dmmFuncType : {
                    'voltdc' : "VoltDC",
                    'voltac' : "VoltAC",
                    'voltdcac' : "VoltDCAC",
                    'currdc' : "CurrDC",
                    'currac' : "CurrAC",
                    'currdcac' : "CurrDCAC",
                    'resistance' : "Resistance"
                },
    dsoErrCode : {
                    'systemErr' : {message : 'systemErr', type : 1},
                    'timeoutErr' : {message : 'timeoutErr', type : 2},
                    'commandErr' : {message : 'commandErr', type : 3},
                    'intrefErr' : {message : 'intrefErr', type : 4}
                },
    /*
     *  Use to pare usb device
     */
    supportDevice : {
                        GDS2002E:{vid:'0x2184',pid:'0x003f',type:'DSO'},
                        GDS2004E:{vid:'0x2184',pid:'0x0040',type:'DSO'},
                        DCS2002E:{vid:'0x098f',pid:'0x0043',type:'DSO'},
                        GDS1002B:{vid:'0x2184',pid:'0x0044',type:'DSO'},
                        GDS1004B:{vid:'0x2184',pid:'0x2204',type:'DSO'},
                        AFG2225:{vid:'0x2184',pid:'0x001C',type:'AFG'},
                        GDM8342:{vid:'0x2184',pid:'0x0030',type:'DMM'},
                        GDM8351:{vid:'0x2184',pid:'0x003B',type:'DMM'},
                        GPD4303S:{vid:'0x0403',pid:'0x6001',type:'PWS'},
                    },
    /*
     *  Use to find command table
     */
    supportType : ['GDS2000E','GDS1000B','AFG2200','GDM8300',"GPDX303S"]

};
