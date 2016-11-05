'use strict';

var propMethod = require('../dev/propMethod.js');
var debug = require('debug');
var log = debug('dsosys:log');
var info = debug('dsosys:info');
var error = debug('dsosys:error');
var header ="";
var tmpbuffer = new Buffer(8192);
var tmplength=0;
function SysCmd() {
    this.sysLock = 'OFF';
    this.dispData = new Buffer(1152000);
    this.AutosetMode = 'FITSCREEN';
    this.dataCount = 0;
    this.usbdelay="OFF";
    this.recCount = 0;
    this.staWeight = '2';
    this.staMode =  'OFF';
    this.autosetenable = "ON";
    this.measureenable = "ON";
    this.cursorenable = "ON";
    this.lrn = [];
    this.image = new Buffer(1152000);
}

SysCmd.prototype.cmdHandler = {
        'IDN':{
                    getHandler:function(sysObj,res,cb){
                                log(res);
                                return true;
                              }
        },
        'LRN':{
                    getHandler:function(sysObj,res,cb){
                                log(res);

                                // if(res[res.length-1] == 0x0a)
                                //     return true;
                                // else{
                                //     sysObj.lrn = res;
                                // }

                                // return false;
                                sysObj.lrn = res;
                                return true;
                              }
        },
        'RST':{
                    setHelper:function(sysObj,arg,cb){
                                log('sent RST command');
                                log(sysObj.cmdHandler);
                                return true;
                              }
        },
        'SysLock':{
                    setHelper:function(sysObj,arg,cb){
                                log('sent SysLock command');
                                log(sysObj.cmdHandler);
                                sysObj.sysLock = arg;
                                return true;
                              },
                    getHandler:function(sysObj,res,cb){
                                log(res);
                                res = res.slice(0,-1);
                                sysObj.sysLock = res.toString();
                                return true;
                              }
        },
        'USBDelay':{
                    setHelper:function(sysObj,arg,cb){
                                log(sysObj.cmdHandler);
                                sysObj.usbdelay = arg;
                                return true;
                              },
                    getHandler:function(sysObj,res,cb){
                                log(res);
                                res = res.slice(0,-1);
                                sysObj.usbdelay = res.toString();
                                return true;
                              }
        },
        'AutosetEnable':{
                    setHelper:function(sysObj,arg,cb){
                                log(sysObj.cmdHandler);
                                sysObj.autosetenable = arg;
                                return true;
                              },
                    getHandler:function(sysObj,res,cb){
                                log(res);
                                res = res.slice(0,-1);
                                sysObj.autosetenable = res.toString();
                                return true;
                              }
        },
        'MeasureEnable':{
                    setHelper:function(sysObj,arg,cb){
                                log(sysObj.cmdHandler);
                                sysObj.measureenable = arg;
                                return true;
                              },
                    getHandler:function(sysObj,res,cb){
                                log(res);
                                res = res.slice(0,-1);
                                sysObj.measureenable = res.toString();
                                return true;
                              }
        },
        'CursorEnable':{
                    setHelper:function(sysObj,arg,cb){
                                log(sysObj.cmdHandler);
                                sysObj.cursorenable = arg;
                                return true;
                              },
                    getHandler:function(sysObj,res,cb){
                                log(res);
                                res = res.slice(0,-1);
                                sysObj.cursorenable = res.toString();
                                return true;
                              }
        },
        'SysErr':{ //
                    getHandler:function(dsoObj,res,cb){
                                log(res.toString());
                                if(res.toString() === '+0, \'No error.\''){
                                    dsoObj.dev.state.errCode.message='';

                                }
                                else{
                                    log('command error ' + res.toString());
                                    dsoObj.dev.state.errCode.message = res.toString();
                                }
                                return true;
                              }
        },
        'AutosetMode':{
                    setHelper:function(sysObj, arg, cb) {
                                log('sent SysLock command');
                                log(sysObj.cmdHandler);
                                return true;
                              },
                    getHandler:function(sysObj, res, cb) {
                                log(res);
                                res = res.slice(0, -1);
                                sysObj.AutosetMode = res.toString();
                                return true;
                              }
        },
        'QRCode':{
                    setHelper:function(sysObj, arg, cb) {
                                console.log('QRCode');
                                console.log(arg);
                                return true;
                              }
        },
        'QRCodeTitle':{
                    setHelper:function(sysObj, arg, cb) {
                                console.log('QRCodeTitle');
                                console.log(arg);
                                return true;
                              }
        },
        'DispOut':{
                    getHandler:function(sysObj, data, cb) {
                                //log('typeof data='+typeof data);
                                if (sysObj.dataCount === 0) {
                                    // var header;
                                    data.copy(tmpbuffer, tmplength);

                                    tmplength += data.length;
                                    if (data.length > 20) {
                                        header += data.slice(0,20).toString();
                                    }
                                    else{
                                        header += data.toString();
                                    }
                                    log(header);
                                    // log('data length = '+data.length);
                                    //log('data[0] = '+data[0]);
                                    if (header[0] === '#') {
                                        var num;
                                        let numstr;
                                        num = Number(header[1]);
                                        if(header.length < num + 2){
                                            return false;
                                        }
                                        numstr = header.slice(2, Number(header[1]) + 2);
                                        log("numstr="+numstr);

                                        sysObj.dataCount = parseInt(numstr) + 1;
                                        // delete sysCmd.dispData;
                                        sysObj.dispData = new Buffer(sysObj.dataCount);
                                         log('sysObj.dataCount = ' + sysObj.dataCount);
                                        //log(sysObj);
                                        sysObj.dispData = sysObj.dispData.slice(0, sysObj.dataCount);
                                        if (data.length >= (Number(header[1]) + 2)) {
                                            if(tmplength != 0){
                                                log('before slice data length = ' + tmpbuffer.length);
                                                tmpbuffer = tmpbuffer.slice((Number(header[1]) + 2),tmplength);
                                                log('sliced data length = '+tmpbuffer.length);
                                                tmpbuffer.copy(sysObj.dispData, sysObj.recCount);
                                                sysObj.recCount += tmpbuffer.length;
                                                tmpbuffer= new Buffer(8192);
                                                tmplength=0;
                                            }
                                            else{
                                                log('before slice data length = ' + data.length);
                                                data = data.slice((Number(header[1]) + 2), data.length);
                                                log('slice data length = '+data.length);
                                                data.copy(sysObj.dispData, sysObj.recCount);
                                                sysObj.recCount += data.length;
                                            }
                                            header="";
                                            log('=======');
                                            if (sysObj.recCount > sysObj.dataCount) {
                                                // if (sysObj.recCount > sysObj.dataCount) {
                                                //     sysObj.dispData = sysObj.dispData.slice(0, -1);
                                                // }
                                                sysObj.recCount = 0;
                                                sysObj.dataCount = 0;
                                                log('last 1 byte=' + data[data.length -1 ]);

                                                return true;
                                            }
                                        }
                                    }
                                }
                                else{
                                    log('sysObj.recCount='+sysObj.recCount+',data.length='+data.length);
                                    if(sysObj.recCount < sysObj.dataCount){
                                        data.copy(sysObj.dispData, sysObj.recCount);
                                        sysObj.recCount += data.length;
                                    }
                                    // log('sysObj.recCount='+sysObj.recCount+',data.length='+data.length);
                                    if (sysObj.recCount >= sysObj.dataCount) {
                                        // if(sysObj.recCount>sysObj.dataCount){
                                        //     sysObj.dispData=sysObj.dispData.slice(0,-1);
                                        // }
                                        //log('sysObj.recCount='+sysObj.recCount);
                                        if((data[data.length-1]=== 0x0a)||(data === 0x0a)){
                                            log('sysObj.dispData length=' + sysObj.dispData.length);
                                            data.copy(sysObj.dispData, sysObj.recCount);
                                            // sysObj.recCount += data.length;
                                            sysObj.recCount = 0;
                                            sysObj.dataCount = 0;
                                            header="";
                                            return true;
                                        }
                                        else{
                                            console.log("data more then expect");
                                        }
                                    }
                                }
                                return false;
                              }
        },
        'PngOutput':{
                    getHandler:function(sysObj,data,cb){
                                if (sysObj.dataCount === 0) {
                                    // var header;
                                    data.copy(tmpbuffer, tmplength);

                                    tmplength += data.length;
                                    if (data.length > 10) {
                                        header += data.slice(0,10).toString();
                                    }
                                    else{
                                        header += data.toString();
                                    }
                                    log(header);
                                    // log('data length = '+data.length);
                                    //log('data[0] = '+data[0]);
                                    if (header[0] === '#') {
                                        var num;
                                        let numstr;
                                        num = Number(header[1]);
                                        if(header.length < num + 2){
                                            return false;
                                        }
                                        numstr = header.slice(2, Number(header[1]) + 2);
                                        log("numstr="+numstr);

                                        sysObj.dataCount = parseInt(numstr);
                                        // delete sysCmd.image;
                                        sysObj.image = new Buffer(sysObj.dataCount + 1);
                                         log('sysObj.dataCount = ' + sysObj.dataCount);
                                        //log(sysObj);
                                        sysObj.image = sysObj.image.slice(0, sysObj.dataCount + 1);
                                        if (data.length >= (Number(header[1]) + 2)) {
                                            if(tmplength != 0){
                                                log('before slice data length = ' + tmpbuffer.length);
                                                tmpbuffer = tmpbuffer.slice((Number(header[1]) + 2),tmplength);
                                                log('sliced data length = '+tmpbuffer.length);
                                                tmpbuffer.copy(sysObj.image, sysObj.recCount);
                                                sysObj.recCount += tmpbuffer.length;
                                                tmpbuffer= new Buffer(8192);
                                                tmplength=0;
                                            }
                                            else{
                                                log('before slice data length = ' + data.length);
                                                data = data.slice((Number(header[1]) + 2), data.length);
                                                log('slice data length = '+data.length);
                                                data.copy(sysObj.image, sysObj.recCount);
                                                sysObj.recCount += data.length;
                                            }
                                            header="";
                                            log('=======');
                                            if (sysObj.recCount > sysObj.dataCount) {
                                                // if (sysObj.recCount > sysObj.dataCount) {
                                                //     sysObj.image = sysObj.image.slice(0, -1);
                                                // }
                                                sysObj.recCount = 0;
                                                sysObj.dataCount = 0;
                                                log('last 1 byte=' + data[data.length -1 ]);

                                                return true;
                                            }
                                        }
                                    }
                                }
                                else{
                                    // log('sysObj.recCount='+sysObj.recCount+',data.length='+data.length);
                                    data.copy(sysObj.image, sysObj.recCount);
                                    sysObj.recCount += data.length;
                                    // log('sysObj.recCount='+sysObj.recCount+',data.length='+data.length);
                                    if (sysObj.recCount > sysObj.dataCount) {
                                        // if(sysObj.recCount>sysObj.dataCount){
                                        //     sysObj.image=sysObj.image.slice(0,-1);
                                        // }
                                        //log('sysObj.recCount='+sysObj.recCount);
                                        log('sysObj.image length=' + sysObj.image.length);
                                        sysObj.recCount = 0;
                                        sysObj.dataCount = 0;
                                        header="";
                                        return true;
                                    }
                                }
                                return false;
                              }
        },
        'CLS':{
                    setHelper:function(sysObj, arg, cb) {
                                return true;
                    }
        },
        'RUN':{
                    setHelper:function(sysObj, arg, cb) {
                                return true;
                    }
        },
        'STOP':{
                    setHelper:function(sysObj, arg, cb) {
                                return true;
                    }
        },
        'SINGLE':{
                    setHelper:function(sysObj, arg, cb) {
                        log('SINGLE ......');
                                return true;
                    }
        },
        'FORCE':{
                    setHelper:function(sysObj, arg, cb) {
                                return true;
                    }
        },
        'AUTOSET':{
                    setHelper:function(sysObj, arg, cb) {
                                return true;
                    }
        },
        'StatisticReset':{
                    setHelper:function(sysObj, arg, cb) {
                                return true;
                    }
        },
        'StatisticStaWeight':{
                    getHandler:function(sysObj, res, cb) {
                                res = es.slice(0,-1);
                                sysObj.staWeight = es.toString();
                                return true;
                    },
                    setHelper:function(sysObj,arg,cb){
                                sysObj.staWeight = rg;
                                return true;
                    }
        },
        'StatisticMode':{
                    getHandler:function(sysObj, res, cb) {
                                res = es.slice(0, -1);
                                sysObj.staMode = es.toString();
                                return true;
                    },
                    setHelper:function(sysObj, arg, cb) {
                                sysObj.staMode = rg;
                                return true;
                    }
        }
    };

SysCmd.prototype.setToDefault = function(sysObj){
    sysObj.recCount = 0;
    sysObj.dataCount = 0;
    tmpbuffer = new Buffer(8192);
    tmplength=0;
    header=[];
};

exports.initSysObj = function(id) {
    var sysCmd = new SysCmd();
    sysCmd.prop = propMethod.CreatMethod.call(this, id);

    return sysCmd;
};


