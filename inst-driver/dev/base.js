'use strict';

var events  = require('events');
var net     = require('net');
var uitl    = require('util');
var debug = require('debug');
var log = debug('base:log');
var info = debug('base:info');
var error = debug('base:error');
var usbDev = require('./devUsb.js');

var sysConstant=require('../sys/sysConstant.js');

// function enableSocketTime(dsoObj) {
//     dsoObj.net.socket.setTimeout(1500,function() {
//         log('socket timeout');
//         if(dsoObj.state.conn === 'timeout') {
//             dsoObj.net.socket.end();
//             dsoObj.net.socket.destroy();
//         }
//     })
// }
// function enableInterfTime(dsoObj) {
//     if(dsoObj.interf === 'net')
//         enableSocketTime(dsoObj);
// }
function show_props(obj, objName) {
    var obj_string = '';

    for (var i in obj) {
        if (typeof obj[i] === 'object'){
            obj_string += show_props(obj[i],i.toString());
        }else{
            obj_string += objName + '.' + i + '=' + obj[i] + '\n';
        }
    }

    return obj_string;
}


function getIDN(dev, data, cb) {

    log("receive data");
    console.log(data);
    var id = data.toString().split(',');
    var supportType = sysConstant.supportType;
    // dev.gdsType = '';

    log('getIDN-------------------');
    log('getIDN++++++++++++++++++');
    for (var j = 0; j < supportType.length; j++) {
        if(dev.commandObj[supportType[j]]){
            log("supported type : " + supportType[j]);
            var gdsModel = dev.commandObj[supportType[j]].model;
            for (var i = 0; i < gdsModel.length ; i++) {
                log('compare ' + id[1] + ' with supported model ' + gdsModel[i]);
                if (id[1] === gdsModel[i]) {
                    dev.gdsType = supportType[j];
                    dev.gdsModel = id[1];
                    if(dev.gdsType === 'GPDX303S' || dev.gdsType === 'AFG2200' || dev.gdsType === 'MFG22X0'){
                        dev.usb.serialNumber = id[2].slice(3);
                    }
                    else{
                      dev.usb.serialNumber = id[2];
                    }
                    dev.maxChNum = dev.commandObj[supportType[j]].maxChNum[gdsModel[i]];
                    break;
                }
            }
        }
    }
    log('getIDN-------------------');
    log('gdsType=' + dev.gdsType);
    log('gdsModel=' + dev.gdsModel);

    //cb(null,data);
    return true;
}

function checkDsoExist(dev, callback) {
    var timeoutCnt = 0;
    var tcnt;
    log('checkDsoExist');
    log('write command to server');
    dev.state.conn = 'query';
    dev.cmdHandler = getIDN;
    dev.handlerSelf = dev;
    dev.state.setTimeout = true;
    if(dev.usb.pid === 24577){
        tcnt = 6000;
    }
    else{
        tcnt = 3000;
    }

    dev.syncCallback = (function() {
        var self = this;

        if(dev.state.timeoutObj)
            clearTimeout(dev.state.timeoutObj);

        if(timeoutCnt++ > 7) {
            callback('check device exist error');
            return;
        }
        if(dev.gdsType ==='') {
            dev.state.setTimeout = true;
            dev.write('*IDN?\r\n');
            // dev.state.timeoutCb = function(){
            //     log('timeout');
            //     dev.state.conn = 'timeout';
            //     delete dev.state.timeoutObj;
            //     dev.syncCallback();
            // };
            dev.state.timeoutObj = setTimeout(function() {
                dev.state.timeoutCb();
            }, 5000);
        }else {
            // if(dev.gdsType === "GDM8300"){
            //     console.log("Write CLS");
            //     dev.write('\r\n*CLS\r\n');
            // }
            dev.write('*CLS\r\n');
            callback();
        }
    }).bind(dev);

    dev.state.timeoutCb = function(){
        log('timeout');
        dev.state.conn = 'timeout';
        dev.state.timeoutObj=null;
        dev.syncCallback();
    };

    console.log("tcnt = "+ tcnt);
    dev.state.timeoutObj = setTimeout(function() {
        dev.state.timeoutCb();
    }, tcnt);

    if(dev.usb.pid === 24577 || dev.usb.pid === '6001'){
        if(dev.write('REMOTE\r\n')){
            setTimeout(function(){
                dev.write('*IDN?\r\n');
            },2000);
        }
        else{
            log('check device exist error: usb not ready');
            clearTimeout(dev.state.timeoutObj);
            callback('check device exist error');
        }
    }
    else{
        if(!dev.write('*IDN?\r\n')){
            log('check device exist error: usb not ready');
            clearTimeout(dev.state.timeoutObj);
            callback('check device exist error');
        }
    }

};

var Dev = function() {
    // dsoObj.state='connectting';
    this.state = {
        conn : 'disconnect',
        currentCmd : '',
        currentId : '',
        setTimeout : false,
        timeoutObj : {},
        timeoutCb : function(){},
        errCode : {message:'', type:'', handler:function(){}}
    };
    // this.port=port;
    // this.host_addr=host_addr;
    this.interf = 'net';
    this.gdsType = '';
    this.gdsModel = '';
    this.chNum = 0;
    this.activeCh = '';
    this.cmdHandler = getIDN;
    this.handlerSelf = {};
    this.syncCallback = function(){};
    this.maxChNum = 0;
    this.commandObj = {};
    this.cmdSequence = [];
    this.writeTimeoutObj = null;
    this.asyncWrite = 'done';
    this.queryBlock = false;
    this.recData=[];
    this.errHandler = function(){};
    this.write = function(data) {
        if (this.interf === 'usb') {
            if(this.usb.write(data))
                return true;
            else
                return false;
        }else if (this.interf === 'net') {
            this.net.socket.write(data);
            return true;
        }
        else{
            log('error: interf not support');
            return false;
        }
        // return true;
    };
    this.dataHandler = (function(data) {
        let cmdDone = false;
        let self = this;
        // if ((data === 0x0a) && (data.length === 1)) {
        //     log('receive one byte data');
        //     log(Number(data));
        //     log(data);
        //     log('=====================');
        //     return;
        // }

        // console.log('dataHandler receive :' + data + ',length=' + data.length);
        // let str = data.toString();
        // log("0x"+str.charCodeAt(str.length -1).toString(16));
        if(!this.cmdHandler){
            console.log('dataHandler receive :' + data + ',length=' + data.length);
            log("cmdHandler not define");
            return;
        }

        if(this.state.setTimeout){
            clearTimeout(this.state.timeoutObj);
        }

        if(this.queryBlock !== true){
            this.recData += data.slice();
            if(data[data.length-1] === 0x0a){
                if (this.cmdHandler(this.handlerSelf, this.recData,this.syncCallback) ===true) {

                    cmdDone = true;
                    if (this.state.setTimeout) {
                        // if(this.state.conn!=='timeout'){
                            log('clearTimeout');
                            clearTimeout(this.state.timeoutObj);
                        // }
                        this.state.setTimeout=false;
                    }
                    if (typeof this.syncCallback === 'function') {
                        log('call callback');
                        this.syncCallback();
                        delete this.recData;
                        this.recData = [];
                    }
                }
            }
        }
        else{
            if (this.cmdHandler(this.handlerSelf, data,this.syncCallback) ===true) {

                cmdDone = true;
                if (this.state.setTimeout) {
                    // if(this.state.conn!=='timeout'){
                        log('clearTimeout by queryBlock');
                        clearTimeout(this.state.timeoutObj);
                    // }
                    this.state.setTimeout=false;
                }
                if (typeof this.syncCallback === 'function') {
                    log('call callback by queryBlock');
                    this.syncCallback();
                }
            }
        }

        if(cmdDone != true){
            if (this.state.setTimeout) {
                this.state.timeoutObj = setTimeout(function() {
                    self.state.timeoutCb();
                }, 3000);
            }
        }

    }).bind(this);
    return this;
}

Dev.prototype.onSocketErr=function(cb) {
    var self = this;
    this.net.socket.on('error', function(e) {
        log('onTcpConnect: connect error!');
        self.state.conn = 'disconnect';
        self.net.socket.end();
        if (cb){
            cb(e.message);
        }
    });
}
Dev.prototype.tcpConnect = function(Callback) {
    var err_string;
    var self = this;

    if(self.state.conn==='connected'){
        if(Callback)
            Callback();
        return;
    }
    this.net.socket = net.connect( this.net.port, this.net.host_addr, function() { //'connect' listener
                      log('connected to server!');
                      //dsoObj.net.socket.setEncoding('utf8');
                      self.net.socket.setMaxListeners(0);
                      self.state.conn = 'connected';
                      self.interf = 'net';
                      // self.net.socket.on('data',self.net.dataHandler);
                      self.net.socket.on('data',self.dataHandler);
                      self.checkDsoExist(self,Callback);
                      // if(Callback)
                      //   Callback();
                });

    this.net.socket.on('close', function(e) {
        log('onTcpConnect: close!');
        self.state.conn = 'disconnect';
        err_string = e.message;
        //dsoObj.net.socket.destroy();
    });
};
Dev.prototype.tcpDisconnect = function(Callback) {
    var self = this;

    this.net.socket.removeAllListeners('close');
    this.net.socket.on('close', function(e) {
        log('onTcpConnect: close!');
        self.state.conn = 'disconnect';
        if(Callback){
            Callback(e);
        }
    });
    this.net.socket.end();
};
Dev.prototype.usbConnect = function(Callback) {
    var err_string;
    var self = this;

    usbDev.openUsb(this, function(err) {
        if(err){
            Callback(err);
            return;
        }
        else{
            log('openUsb');
            // self.usb.onData(self.dataHandler);
            checkDsoExist(self, Callback);
        }
    });
};

Dev.prototype.usbDisconnect = function(Callback) {
    var self = this;

    // if(self.state.conn === 'connected'){
        usbDev.closeUsb(this, function(err) {
            if(err){
                console.log(err);
            }
            self.state.conn='disconnected';
            self.usb.device=null;
            self.interf='empty';
            if(Callback)
                Callback(err);
        });
    // }
    // else{
    //     if(Callback)
    //         Callback();
    // }
};



// uitl.inherits(Dev, events.EventEmitter);

exports.Dev = Dev;
