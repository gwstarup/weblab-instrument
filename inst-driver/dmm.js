'use strict';
/**
*   Module use to communicate with GWINSTEK's DSO through Ethernet or USB
*
*   @module instrument-com
*/
var net     = require('net');
var fs      = require('fs');
var async   = require('async');
var uitl    = require('util');
var EventEmitter  =  require('events').EventEmitter;
var path    = require('path');
var Promise = require('es6-promise').Promise;
// var mdns = require('mdns');

var debug = require('debug');
var log = debug('dmm:log');
var info = debug('dmm:info');
var error = debug('dmm:error');
var sysConstant=require('./sys/sysConstant.js');
var syscmd = require('./dmm/system.js');
var confcmd = require('./dmm/config.js');
var meascmd = require('./dmm/measure.js');
var usbDev = require('./dev/devUsb.js');
var base = require('./dev/base.js');




function getCmdObj() {
    var FilePath = path.join(__dirname, '/sys/dmm-command.json');

    return JSON.parse(fs.readFileSync(FilePath));
}

/**
*   Create all needed private properties and method
*
*   @private
*   @constructor _DmmObj
*
*   @return {Object} Private method used to control DSO
*/
var _DmmObj = function() {


    this.dev = new base.Dev();
    // uitl.inherits(this.dev, base.Dev);
    //assign dso system command process method to dmmObj.sys
    this.sys = syscmd.initDmmSysObj.call(this, 'sys');
    this.conf = confcmd.initConfObj.call(this, 'conf');
    this.meas = meascmd.initMeasObj.call(this, 'meas');
    this.cmdEvent = new EventEmitter();
    this.commandObj = getCmdObj();
    this.dev.commandObj = this.commandObj;
    return this;
};

/**
*   The class define all needed public properties and methods
*
*   @class dmmctrl
*
*
*/
var _DmmCtrl = function(dmmObj) {
    var dmmctrl = {};

/**
*   The method belong to dmmctrl class used to release device's resource.
*
*   @method closeDev
*   @return {null} null
*
*/
    dmmctrl.closeDev = (function() {
        log('closeDev');
        var self = this;

        return new Promise(function(resolve, reject) {
            dmmctrl.disconnect()
                .then(resolve)
                .catch(function(e){
                    reject(e);
                });
        });
    }).bind(dmmObj);


// var all_the_types = mdns.browseThemAll();




/**
*   The method belong to dmmctrl class used to connect to device,
*   connect method must be called and wait to complete before any dmmctrl method.
*
*   @method connect
*
*
*/
    dmmctrl.connect = (function() {
        var self = this;

        return new Promise(function(resolve, reject) {
            function conn(e){
                if (e) {
                    reject(e);

                }else {
                    resolve();
                }

            };

            if (self.dev.interf === 'usb') {
                self.dev.usbConnect(conn);
            }else if (self.dev.interf === 'net') {
                self.dev.tcpConnect(conn);
            }
            else{
                reject(Error('Not supported interface'));
            }
        });
    }).bind(dmmObj);
/**
*   The method belong to dmmctrl class used to disconnect from device.
*
*   @method disconnect
*
*
*/
    dmmctrl.disconnect = (function() {
        log('disconnect');
        var self = this;

        return new Promise(function(resolve, reject) {
            function disconnect(e){
                if (e) {
                    log('disconnect return');
                    log(e);

                    reject(e);

                }else {

                    resolve();
                }

            };
            if(self.dev.state.conn!=='disconnected'){
                if(self.dev.writeTimeoutObj!==null){
                    clearTimeout(self.dev.writeTimeoutObj);
                }
                if (self.dev.interf === 'usb') {
                    self.dev.usbDisconnect(disconnect);
                }else if (self.dev.interf === 'net') {
                    self.dev.tcpDisconnect(disconnect);
                }
            }else{
                resolve();
            }
        });
    }).bind(dmmObj);

/**
*
*/

    dmmctrl.getSetup = (function() {
        // this.GetSnapshot(callback);
        var self = this;

        return new Promise(function(resolve, reject) {
            function getDone(e){
                if (e) {
                    reject(e);
                }else {
                    resolve({
                        func : self.sys.func,
                        autorange : self.sys.autorange,
                        range : self.conf.range
                    });
                }

            };
            var cmd=[];

            log("dmm getSetup");
            cmd.push({id:"sys", prop:'Function', arg:"", cb:null, method:'get'});
            cmd.push({id:"sys", prop:'AutoRange', arg:"", cb:null, method:'get'});
            cmd.push({id:"conf", prop:'QueryRange',  arg:"", cb:getDone, method:'get'});
            self.dev.cmdSequence = self.dev.cmdSequence.concat(cmd);
            self.cmdEvent.emit('cmd_write', cmd);
        });
    }).bind(dmmObj);
/**
*
*/
    dmmctrl.setSetup = (function(setup) {
        var self = this;

        return new Promise(function(resolve, reject) {
            function setDone(e){
                if (e) {
                    log("dmm.setSetup error");
                    log(e);
                    reject(e);
                }else {
                    resolve();
                }
            };
            var cmd=[];
            var func;
            var range;

            log("dmm setSetup");
            log(setup);

            if(setup.func.slice(0,-2) === "VOLT"){
                func="\"VOLT\"";
                range='RangeVoltDC';
            }
            else if(setup.func.slice(0,-2) === "VOLT:AC"){
                func="\"VOLT:AC\"";
                range='RangeVoltAC';
            }
            else if(setup.func.slice(0,-2) === "VOLT:DCAC"){
                func="\"VOLT:DCAC\"";
                range='RangeVoltDCAC';
            }
            else if(setup.func.slice(0,-2) === "CURR"){
                func="\"CURR\"";
                range='RangeCurrDC';
            }
            else if(setup.func.slice(0,-2) === "CURR:AC"){
                func="\"CURR:AC\"";
                range='RangeVoltAC';
            }
            else if(setup.func.slice(0,-2) === "CURR:DCAC"){
                func="\"CURR:DCAC\"";
                range='RangeVoltDCAC';
            }
            else if(setup.func.slice(0,-2) === "RES"){
                func="\"RES\"";
                range='RangeResistance';
            }
            cmd.push({id:"sys", prop:'Function', arg: func, cb:null, method:'set'});
            cmd.push({id:"sys", prop: 'delay_for_a_while', arg : 300, cb:null, method:'set'});
            if(setup.autorange.slice(0,-2) === '0'){
                cmd.push({id:"sys", prop:'AutoRange', arg: 'OFF', cb:null, method:'set'});
            }
            else{
                cmd.push({id:"sys", prop:'AutoRange', arg: 'ON', cb:null, method:'set'});
            }
            cmd.push({id:"sys", prop: 'delay_for_a_while', arg : 300, cb:null, method:'set'});
            cmd.push({id:"conf", prop:range, arg:setup.range.slice(0,-2), cb:setDone, method:'set'});

            self.dev.cmdSequence = self.dev.cmdSequence.concat(cmd);
            self.cmdEvent.emit('cmd_write', cmd);
        });
    }).bind(dmmObj);

/**
*   Channel property of device.
*
*   @property funcProp
*   @type Object
*   @param {String} Gets the function for the display
*/
    dmmctrl.getSysProp = (function(sysProp) {
        // this.GetSnapshot(callback);
        var self = this;

        return new Promise(function(resolve, reject) {
            function getDone(e){
                if (e) {
                    reject(e);

                }else {
                    resolve(self.sys);
                }

            };
            var cmd = [];

            log(sysProp);

            if(sysProp.func!==undefined){
                cmd.push({id:"sys", prop:"Function", arg:"", cb:null, method:'get'});
            }
            if(sysProp.autorange!==undefined){
                cmd.push({id:"sys", prop:"AutoRange", arg:"", cb:null, method:'get'});
            }
            if(sysProp.val!==undefined){
                cmd.push({id:"sys", prop:"VAL", arg:"", cb:null, method:'get'});
            }
            if(cmd.length > 0){
                cmd[cmd.length-1].cb = getDone;
                self.dev.cmdSequence = self.dev.cmdSequence.concat(cmd);
                // log(self.dev.cmdSequence);
                self.cmdEvent.emit('cmd_write', cmd);
            }
            else{
                log('getSysProp do nothing');
                reject(['400','Parameter Error']);
            }
        });
    }).bind(dmmObj);
/**
*   Channel property of device.
*
*   @property funcProp
*   @type Object
*   @param {String} Sets the function for the display
*/
    dmmctrl.setSysProp = (function(sysProp) {
        // this.GetSnapshot(callback);
        var self = this;

        return new Promise(function(resolve, reject) {
            function setDone(e){
                if (e) {
                    reject(e);

                }else {
                    resolve();
                }

            };
            var cmd = [];

            if(sysProp.func!==undefined){
                cmd.push({id:"sys", prop:"Function", arg:sysProp.func, cb:null, method:'set'});
            }
            if(sysProp.autorange!==undefined){
                cmd.push({id:"sys", prop:"AutoRange", arg:sysProp.autorange, cb:null, method:'set'});
            }
            if(cmd.length > 0){
                cmd[cmd.length-1].cb = setDone;
                self.dev.cmdSequence = self.dev.cmdSequence.concat(cmd);
                // log(self.dev.cmdSequence);
                self.cmdEvent.emit('cmd_write', cmd);
            }
            else{
                log('setSysProp do nothing');
                reject(['400','Parameter Error']);
            }
        });
    }).bind(dmmObj);
/**
*   Channel property of device.
*
*   @property fmProperty
*   @type Object
*   @param {String} type
*   @param {String} source
*   @param {String} freq
*   @param {String} state
*   @param {String} depth
*   @param {String} deviation
*   @param {String} rate
*   @param {String} ampl
*/
    dmmctrl.setRangeProp = (function(confProp) {
        // this.GetSnapshot(callback);
        var self = this;

        return new Promise(function(resolve, reject) {
            var cmd=[];
            function setDone(e){
                if (e) {
                    reject(e);

                }else {
                    resolve();
                }

            };

            log(confProp);

            if(confProp === undefined){

                reject(['400','Parameter Error']);
                return;
            }
            else{
                let prop;
                if(confProp.type === undefined){
                    reject(['400','Parameter Error']);
                    return;
                }
                prop = "Range"+sysConstant.dmmFuncType[confProp.type];
                cmd.push({id:"conf", prop:prop, arg:confProp.range, cb:setDone, method:'set'});

                self.dev.cmdSequence = self.dev.cmdSequence.concat(cmd);
                // log(self.dev.cmdSequence);
                self.cmdEvent.emit('cmd_write', cmd);
            }
        });
    }).bind(dmmObj);

/**
*
*
*/
    dmmctrl.getRangeProp = (function(confProp) {
        // this.GetSnapshot(callback);
        var self = this;

        return new Promise(function(resolve, reject) {
            var cmd=[];
            function getDone(e){
                if (e) {
                    reject(e);

                }else {
                    resolve(self.conf);
                }

            };

            cmd.push({id:"conf", prop:"QueryRange", arg:"", cb:getDone, method:'get'});

            self.dev.cmdSequence = self.dev.cmdSequence.concat(cmd);
            // log(self.dev.cmdSequence);
            self.cmdEvent.emit('cmd_write', cmd);
        });
    }).bind(dmmObj);
/**
*   Channel property of device.
*
*   @property mesaProp
*   @type Object
*   @param {String} position Specify the distance with triggered pointer of the main window
*   @param {String} zposition Specify the distance with triggered pointer of the zoom window
*   @param {String} scale Specify the time divison of the main window
*   @param {String} zscale Specify the time divison of the zoom window
*   @param {String} mode Specify which mode device on
*   @param {String} expand Specify timebase expand by center or trigger position
*/
    dmmctrl.getMeasProp = (function(mesaProp) {
        // this.GetSnapshot(callback);
        var self = this;

        return new Promise(function(resolve, reject) {
            function getDone(e){
                if (e) {
                    reject(e);
                }else {
                    resolve(self.meas);
                }

            };
            var cmd = [];

            log(mesaProp);

            if(mesaProp === undefined){

                reject(['400','Parameter Error']);
                return;
            }
            else{
                let prop;

                prop = "Meas"+sysConstant.dmmFuncType[mesaProp];
                cmd.push({id:"meas", prop:prop, arg:"", cb:getDone, method:'get'});

                self.dev.cmdSequence = self.dev.cmdSequence.concat(cmd);
                // log(self.dev.cmdSequence);
                self.cmdEvent.emit('cmd_write', cmd);

            }
        });
    }).bind(dmmObj);

    ////////////////////////////
    // dmmctrl.onError = (function(callback) {
    //     this.errHandler = callback;
    // }).bind(dmmObj);
    ///////////////////////////////
/**
*   The method belong to dmmctrl class used to set the device into default state
*
*   @method run
*
*
*/
    dmmctrl.default = (function(){
        var self = this;
        log('run');
        return new Promise(function(resolve, reject) {
            function sysRun(e){
                if (e) {
                    reject(e);

                }else {
                    resolve();
                }

            };
            log('run promise');
            var sysCmd = [
                {id:'sys',prop:'RST',arg:'',cb:sysRun,method:'set'}
            ];

            self.dev.cmdSequence = self.dev.cmdSequence.concat(sysCmd);
            log('run :send cmd_write');
            self.cmdEvent.emit('cmd_write', sysCmd);
        });
    }).bind(dmmObj);
/**
*   The method belong to dmmctrl class used to set the device into local state
*
*   @method force
*
*/
    dmmctrl.local = (function() {
        var self = this;

        return new Promise(function(resolve, reject) {
            function sysLocal(e){
                if (e) {
                    reject(e);

                }else {
                    resolve();
                }

            };
            var sysCmd = [
                {id:'sys',prop:'SysLocal',arg:'',cb:sysLocal,method:'set'}
            ];

            self.dev.cmdSequence = self.dev.cmdSequence.concat(sysCmd);
            self.cmdEvent.emit('cmd_write', sysCmd);
        });
    }).bind(dmmObj);
/**
*   The method belong to dmmctrl class used to set the device into remote state
*
*   @method force
*
*/
    dmmctrl.remote = (function() {
        var self = this;

        return new Promise(function(resolve, reject) {
            function sysRemote(e){
                if (e) {
                    reject(e);

                }else {
                    resolve();
                }

            };
            var sysCmd = [
                {id:'sys',prop:'SysRemote',arg:'',cb:sysRemote,method:'set'}
            ];

            self.dev.cmdSequence = self.dev.cmdSequence.concat(sysCmd);
            self.cmdEvent.emit('cmd_write', sysCmd);
        });
    }).bind(dmmObj);
/**
*
*   @method force
*
*/
    dmmctrl.clear = (function() {
        var self = this;

        return new Promise(function(resolve, reject) {
            function sysClear(e){
                if (e) {
                    reject(e);

                }else {
                    resolve();
                }

            };
            var sysCmd = [
                {id:'sys',prop:'CLS',arg:'',cb:sysClear,method:'set'}
            ];

            self.dev.cmdSequence = self.dev.cmdSequence.concat(sysCmd);
            self.cmdEvent.emit('cmd_write', sysCmd);
        });
    }).bind(dmmObj);
/**
*
*/
    dmmctrl.model = (function() {
        var self = this;

        // console.log("get dmm model");
        return new Promise(function(resolve, reject) {
            resolve(self.dev.gdsModel);
        });
    }).bind(dmmObj);

/**
*
*
*   @method maxChNum
*
*/
    dmmctrl.maxch = (function() {
        var self = this;
        return new Promise(function(resolve, reject) {
            resolve(self.dev.maxChNum.toString());
        });
    }).bind(dmmObj);

    return dmmctrl;

}

var cmd_queue = [];
var cmd_write = function() {
    var self = this;
    var cb = null;


    // log(this.dev.cmdSequence);
    if (this.dev.asyncWrite === 'busy') {
        log('async write busy');
        log("command left "+cmd_queue.length);
        if (this.dev.writeTimeoutObj === null) {
            log('set timeout');
            this.dev.writeTimeoutObj = setTimeout(function() {
                log('cmd_write reissue');
                self.dev.writeTimeoutObj = null;
                cmd_write.call(self);
            },300);
        }
        return;
    }

    if (this.dev.cmdSequence.length === 0) {
        if (this.dev.writeTimeoutObj !== null) {
            clearTimeout(this.dev.writeTimeoutObj);
            // this.writeTimeoutObj=null;
            this.dev.emit('cmd_write', self.dev.cmdSequence);
        }
        log('cmdSequence = 0');
        return;
    }

    for (var i = 0, len = this.dev.cmdSequence.length; i < len; i++) {
        cmd_queue[i] = this.dev.cmdSequence.shift();

        // avoid missing async callback, flush command buffer when find cb exist
        if (cmd_queue[i].cb !== null){
            cb = cmd_queue[i].cb;
            if(i < len-1 ){
                this.dev.writeTimeoutObj = setTimeout(function() {
                    log('cmd_write reissue');
                    self.dev.writeTimeoutObj = null;
                    cmd_write.call(self);
                },200);
            }
            break;
        }
    }
    self.dev.asyncWrite = 'busy';
    async.eachSeries(cmd_queue,
        function(item,done) {
            log(item);
            if(item.method === 'set') {
                log(self['sys']);
                self[item.id].prop.set(item.prop, item.arg, done);
            }else {
                self[item.id].prop.get(item.prop, item.arg, done);
            }
        },function(err, results) {
            log('err: '+err);
            cmd_queue = null;
            cmd_queue = [];
            self.dev.asyncWrite = 'done';
            self.dev.state.conn = 'connected';
            log('dev.asyncWrite='+self.dev.asyncWrite);
            log('async write done');
            if (cb)
                cb(err);
        }
    );
}

/**
*   Create new instance that used to communicate with instrument through USB
*
*   @class DmmUSB
*   @constructor
*   @extends dmmctrl
*   @param {string} vid Vender ID bind to USB device
*   @param {string} pid Product ID bind to USB device
*
*   @return {Object} Return dmmctrl object
*/

exports.DmmUSB  = function(device) {

    var dmmObj = new _DmmObj();
    // log(dmmObj);

    log('DmmUSB:');

    if(dmmObj.dev.usbConnect)
        log('we have usbConnect');
    else
        log('we dont have usbConnect');
    dmmObj.cmdEvent.on('cmd_write', function(cmd){
        log('trigger cmdEvent');
        cmd_write.call(dmmObj);
    });
    usbDev.BindUsbObj(dmmObj.dev, device);

    return _DmmCtrl(dmmObj);
};
