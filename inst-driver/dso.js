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
var log = debug('dso:log');
var info = debug('dso:info');
var error = debug('dso:error');
var sysConstant=require('./sys/sysConstant.js');
var syscmd = require('./dso/system.js');
var trigcmd = require('./dso/trigger.js');
var acqcmd = require('./dso/acquire.js');
var horcmd = require('./dso/horizontal.js');
var mathcmd = require('./dso/math.js');
var meascmd = require('./dso/measure.js');
var channel = require('./dso/channel.js');
var usbDev = require('./dev/devUsb.js');
var base = require('./dev/base.js');


// function done(){
//     log('------------------------- done');
// }

// function sendIDN(){
// }



function getCmdObj() {
    var FilePath = path.join(__dirname, '/sys/dso-command.json');

    return JSON.parse(fs.readFileSync(FilePath));
}
function BindNetObj(dsoObj, port, host_addr) {

    // dsoObj.port=port;
    // dsoObj.host_addr=host_addr;
    dsoObj.dev.interf = 'net';
    dsoObj.dev.net = {
        dataHandler : function(data) {
            // log('socket on data event!');

            // socket idle when send query command
            if (dsoObj.dev.state.setTimeout) {
                if (dsoObj.dev.state.conn !== 'timeout') {
                    log('clearTimeout');
                    clearTimeout(dsoObj.dev.state.timeoutObj);
                }
                dsoObj.dev.state.setTimeout = false;
            }

            if ((dsoObj.dev.state.conn === 'query') || (dsoObj.dev.state.conn === 'timeout')) {
                if (dsoObj.cmdHandler(dsoObj.handlerSelf, data, dsoObj.syncCallback) === true) {
                    if (dsoObj.syncCallback) {
                        log('call callback');
                        dsoObj.syncCallback();
                    }
                }
            }
        },
        port : port,
        host_addr : host_addr,
        socket : {}
    };
}


/**
*   Create all needed private properties and method
*
*   @private
*   @constructor _DsoObj
*
*   @return {Object} Private method used to control DSO
*/
var _DsoObj = function() {


    this.dev = new base.Dev();
    // uitl.inherits(this.dev, base.Dev);
    log(this);
    //assign dso system command process method to dsoObj.sys
    this.sys = syscmd.initSysObj.call(this, 'sys');

    this.trig = trigcmd.initTrigObj.call(this, 'trig');

    this.acq = acqcmd.initAcqObj.call(this, 'acq');

    this.hor = horcmd.initHorObj.call(this, 'hor');

    this.math = mathcmd.initMathObj.call(this, 'math');
    this.meas1 = meascmd.initMeasObj.call(this, 'meas1');
    this.meas2 = meascmd.initMeasObj.call(this, 'meas2');
    this.meas3 = meascmd.initMeasObj.call(this, 'meas3');
    this.meas4 = meascmd.initMeasObj.call(this, 'meas4');
    this.meas5 = meascmd.initMeasObj.call(this, 'meas5');
    this.meas6 = meascmd.initMeasObj.call(this, 'meas6');
    this.meas7 = meascmd.initMeasObj.call(this, 'meas7');
    this.meas8 = meascmd.initMeasObj.call(this, 'meas8');

    this.ch1 = channel.initChanObj.call(this, 'ch1');
    this.ch2 = channel.initChanObj.call(this, 'ch2');
    this.ch3 = channel.initChanObj.call(this, 'ch3');
    this.ch4 = channel.initChanObj.call(this, 'ch4');

    this.cmdEvent = new EventEmitter();
    this.commandObj = getCmdObj();
    this.dev.commandObj = this.commandObj;
    this.dev.errHandler = function setToDefautl(self){
        log("errHandler: id =");
        log(self);
        if(self[self.dev.state.currentId].setToDefault)
            self[self.dev.state.currentId].setToDefault(self[self.dev.state.currentId]);
    };
    return this;
};

function findMatchDevice(sample,golden,prop){
    var i,len=golden.length;

    for(i=0; i<len; i++){
        var device=golden[i];
        if(device[prop]){
            if(sample[prop]===device[prop]){
                return i;
            }
        }
    }
    return -1;
}

// var browser = mdns.createBrowser(mdns.tcp('instrument-dso'));
var availableNetDevice= [];

// browser.on('serviceUp', function(service) {
//   log("service up: ", service);
//   if(availableNetDevice.length > 0){
//     var idx;

//     idx=findMatchDevice(service,availableNetDevice,"name");
//     if(idx >= 0){
//         availableNetDevice.push(service);
//     }
//   }
//   else{
//     availableNetDevice.push(service);
//   }
//   log("-------------");

//   log(availableNetDevice);
// });
// browser.on('serviceDown', function(service) {
//   log("service down: ", service);

//   if(availableNetDevice.length > 0){
//     var idx;

//     idx=findMatchDevice(service,availableNetDevice,"name");
//     if(idx >= 0){
//         availableNetDevice.splice(idx,1);
//     }
//   }
//   else{
//     availableNetDevice.pop();
//   }

// });

// browser.start();

/**
*   The class define all needed public properties and methods
*
*   @class dsoctrl
*
*
*/
var _DsoCtrl = function(dsoObj) {
    var dsoctrl = {};

/**
*   The method belong to dsoctrl class used to release device's resource.
*
*   @method closeDev
*   @return {null} null
*
*/
    dsoctrl.closeDev = (function() {
        log('closeDev');
        var self = this;

        return new Promise(function(resolve, reject) {
            dsoctrl.disconnect()
                .then(resolve)
                .catch(function(e){
                    reject(e);
                });
        });
    }).bind(dsoObj);


// var all_the_types = mdns.browseThemAll();




/**
*   The method belong to dsoctrl class used to connect to device,
*   connect method must be called and wait to complete before any dsoctrl method.
*
*   @method connect
*
*
*/
    dsoctrl.connect = (function() {
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
    }).bind(dsoObj);
/**
*   The method belong to dsoctrl class used to disconnect from device.
*
*   @method disconnect
*
*
*/
    dsoctrl.disconnect = (function() {
        log('disconnect');
        var self = this;

        return new Promise(function(resolve, reject) {
            function disconnect(e){
                if (e) {
                    log('disconnect return');
                    log(e);
                    delete self.dev.usb;
                    reject(e);

                }else {
                    delete self.dev.usb;
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
    }).bind(dsoObj);

/**
*   The method belong to dsoctrl class used to sync all properties from device,
*   like trigger type, channel state .. etc.
*
*   @method syncConfig
*
*
*/
    dsoctrl.syncConfig = (function() {
        var cmd = [];
        var self = this;

        return new Promise(function(resolve, reject) {
            function reload(e){
                if (e) {
                    reject(e);

                }else {

                    resolve(self.sys.lrn);
                }

            };
            var cmd = [
                    {id:'sys', prop:'LRN', arg:'', cb:reload, method:'get'}
                ];
            self.dev.cmdSequence = self.dev.cmdSequence.concat(cmd);
            self.cmdEvent.emit('cmd_write', cmd);
        });
    }).bind(dsoObj);

/**
*   The method belong to dsoctrl class used to load horizontal properties from device,
*   like time division, position .. etc.
*
*   @method getHorizontal
*   @return {Object} horProperty
*
*/
/**
*   Horizontal property of device.
*
*   @property horProperty
*   @type Object
*   @param {String} position Specify the distance with triggered pointer of the main window
*   @param {String} zposition Specify the distance with triggered pointer of the zoom window
*   @param {String} scale Specify the time divison of the main window
*   @param {String} zscale Specify the time divison of the zoom window
*   @param {String} mode Specify which mode device on
*   @param {String} expand Specify timebase expand by center or trigger position
*/
    dsoctrl.getHorizontal = (function(hor) {
        // this.GetSnapshot(callback);
        var self = this;

        return new Promise(function(resolve, reject) {
            function rawData(e){
                if (e) {
                    reject(e);

                }else {
                    resolve(self.hor);
                }

            };
            var cmd = [];
            // var cmd = [
            //         {id:'hor',prop:'HorPosition',arg:'',cb:null,method:'get'},
            //         {id:'hor',prop:'HorScale',arg:'',cb:null,method:'get'},
            //         {id:'hor',prop:'HorMode',arg:'',cb:null,method:'get'},
            //         {id:'hor',prop:'HorExpand',arg:'',cb:null,method:'get'},
            //         {id:'hor',prop:'HorZoomPosition',arg:'',cb:null,method:'get'},
            //         {id:'hor',prop:'HorZoomScale',arg:'',cb:rawData,method:'get'}
            //     ];
            // self.dev.cmdSequence = self.dev.cmdSequence.concat(cmd);
            // // log(self.dev.cmdSequence);
            // self.cmdEvent.emit('cmd_write', cmd);

            if(hor === undefined){
                cmd = [
                        {id:'hor',prop:'HorPosition',arg:'',cb:null,method:'get'},
                        {id:'hor',prop:'HorScale',arg:'',cb:null,method:'get'},
                        {id:'hor',prop:'HorMode',arg:'',cb:null,method:'get'},
                        {id:'hor',prop:'HorExpand',arg:'',cb:null,method:'get'},
                        {id:'hor',prop:'HorZoomPosition',arg:'',cb:null,method:'get'},
                        {id:'hor',prop:'HorZoomScale',arg:'',cb:rawData,method:'get'}
                ];
                self.dev.cmdSequence = self.dev.cmdSequence.concat(cmd);
                self.cmdEvent.emit('cmd_write', cmd);
            }
            else{
                if(hor.scale!==undefined){
                    cmd.push({id:'hor',prop:'HorScale',arg:hor.scale,cb:null,method:'get'});
                }
                if(hor.zscale!==undefined){
                    cmd.push({id:'hor',prop:'HorZoomScale',arg:hor.zscale,cb:null,method:'get'});
                }
                if(hor.position!==undefined){
                    cmd.push({id:'hor',prop:'HorPosition',arg:hor.position,cb:null,method:'get'});

                }
                if(hor.zposition!==undefined){
                    cmd.push({id:'hor',prop:'HorZoomPosition',arg:hor.zposition,cb:null,method:'get'});
                }
                if(hor.mode!==undefined){
                    cmd.push({id:'hor',prop:'HorMode',arg:hor.mode,cb:null,method:'get'});
                }
                if(hor.expand!==undefined){
                    cmd.push({id:'hor',prop:'HorExpand',arg:hor.expand,cb:null,method:'get'});
                }
                if(cmd.length > 0){
                    cmd[cmd.length-1].cb = rawData;
                    self.dev.cmdSequence = self.dev.cmdSequence.concat(cmd);
                    // log(self.dev.cmdSequence);
                    self.cmdEvent.emit('cmd_write', cmd);
                }
                else{
                    log('setHorizontal do nothing');
                    resolve();
                }
            }
        });
    }).bind(dsoObj);

/**
*   The method belong to dsoctrl class used to set horizontal properties to device,
*   like time division, position .. etc.
*
*   @method setHorizontal
*   @param {Object} horProperty
*
*/
/**
*   Horizontal property of device.
*
*   @property horProperty
*   @type Object
*   @param {String} position Specify the distance with triggered pointer of the main window
*   @param {String} zposition Specify the distance with triggered pointer of the zoom window
*   @param {String} scale Specify the time divison of the main window
*   @param {String} zscale Specify the time divison of the zoom window
*   @param {String} mode Specify which mode device on
*   @param {String} expand Specify timebase expand by center or trigger position
*/
    dsoctrl.setHorizontal = (function(hor) {
        // this.GetSnapshot(callback);
        var self = this;

        return new Promise(function(resolve, reject) {
            var cmd=[];
            function rawData(e){
                if (e) {
                    reject(e);

                }else {
                    resolve();
                }

            };
            if(hor === undefined){
                log('setHorizontal do nothing');
                reject(['400','Parameter Error']);
                return;
            }
            if(hor.scale!==undefined){
                cmd.push({id:'hor',prop:'HorScale',arg:hor.scale,cb:null,method:'set'});
            }
            if(hor.zscale!==undefined){
                cmd.push({id:'hor',prop:'HorZoomScale',arg:hor.zscale,cb:null,method:'set'});
            }
            if(hor.position!==undefined){
                cmd.push({id:'hor',prop:'HorPosition',arg:hor.position,cb:null,method:'set'});

            }
            if(hor.zposition!==undefined){
                cmd.push({id:'hor',prop:'HorZoomPosition',arg:hor.zposition,cb:null,method:'set'});
            }
            if(hor.mode!==undefined){
                cmd.push({id:'hor',prop:'HorMode',arg:hor.mode,cb:null,method:'set'});
            }
            if(hor.expand!==undefined){
                cmd.push({id:'hor',prop:'HorExpand',arg:hor.expand,cb:null,method:'set'});
            }
            if(cmd.length > 0){
                cmd[cmd.length-1].cb = rawData;
                self.dev.cmdSequence = self.dev.cmdSequence.concat(cmd);
                // log(self.dev.cmdSequence);
                self.cmdEvent.emit('cmd_write', cmd);
            }
            else{
                log('setHorizontal do nothing');
                resolve();
            }
        });
    }).bind(dsoObj);


/**
*
*/

    dsoctrl.fastSyncConfig = (function() {
        // this.GetSnapshot(callback);
        var self = this;

        return new Promise(function(resolve, reject) {
            function getDone(e){
                if (e) {
                    reject(e);
                }else {
                    resolve({
                        chProps : {
                              ch1 : {
                                scale : self.ch1.scale,
                                pos : self.ch1.position,
                                state : self.ch1.state
                              },
                              ch2 : {
                                scale : self.ch2.scale,
                                pos : self.ch2.position,
                                state : self.ch2.state
                              },
                              ch3 : {
                                scale : self.ch3.scale,
                                pos : self.ch3.position,
                                state : self.ch3.state
                              },
                              ch4 : {
                                scale : self.ch4.scale,
                                pos : self.ch4.position,
                                state : self.ch4.state
                              }
                            },
                        trigProps : {
                            level : self.trig.level,
                        },
                        horProps : {
                            pos : self.hor.position,
                            scale : self.hor.scale
                        }
                    });
                }

            };
            var cmd=[];
            var i;
            var chID=["ch1","ch2","ch3","ch4"];
            log("fastSyncConfig");
            for(i=0; i<self.dev.maxChNum; i++){
                cmd.push({id:chID[i], prop:'VerSCALe', arg:"", cb:null, method:'get'});
                cmd.push({id:chID[i], prop:'VerPOSition', arg:"", cb:null, method:'get'});
                cmd.push({id:chID[i], prop:'ChState', arg:"", cb:null, method:'get'});
            }
            cmd.push({id:'hor',prop:'HorScale',arg:"", cb:null,method:'get'});
            cmd.push({id:'hor',prop:'HorPosition',arg:"", cb:null,method:'get'});
            cmd.push({id:'acq', prop:'AcqRecLength', arg:"", cb:null, method:'get'});

            cmd.push({id:'trig',prop:'TrigLevel',arg:"",cb:getDone,method:'get'});
            self.dev.cmdSequence = self.dev.cmdSequence.concat(cmd);
            // log(self.dev.cmdSequence);
            self.cmdEvent.emit('cmd_write', cmd);
        });
    }).bind(dsoObj);

/**
*
*/

    dsoctrl.getSetup = (function() {
        // this.GetSnapshot(callback);
        var self = this;

        return new Promise(function(resolve, reject) {
            function getDone(e){
                if (e) {
                    reject(e);
                }else {
                    resolve({
                        chProps : {
                              ch1 : {
                                scale : self.ch1.scale,
                                pos : self.ch1.position,
                                state : self.ch1.state,
                                invert : self.ch1.invert,
                                coupling : self.ch1.coupling,
                                bandwidth : self.ch1.bandwidth,
                                probUnit : self.ch1.probe.unit,
                                probRatio : self.ch1.probe.atten
                              },
                              ch2 : {
                                scale : self.ch2.scale,
                                pos : self.ch2.position,
                                state : self.ch2.state,
                                invert : self.ch2.invert,
                                coupling : self.ch2.coupling,
                                bandwidth : self.ch2.bandwidth,
                                probUnit : self.ch2.probe.unit,
                                probRatio : self.ch2.probe.atten
                              },
                              ch3 : {
                                scale : self.ch3.scale,
                                pos : self.ch3.position,
                                state : self.ch3.state,
                                invert : self.ch3.invert,
                                coupling : self.ch3.coupling,
                                bandwidth : self.ch3.bandwidth,
                                probUnit : self.ch3.probe.unit,
                                probRatio : self.ch3.probe.atten
                              },
                              ch4 : {
                                scale : self.ch4.scale,
                                pos : self.ch4.position,
                                state : self.ch4.state,
                                invert : self.ch4.invert,
                                coupling : self.ch4.coupling,
                                bandwidth : self.ch4.bandwidth,
                                probUnit : self.ch4.probe.unit,
                                probRatio : self.ch4.probe.atten
                              }
                            },
                        trigProps : {
                            type : self.trig.type,
                            holdoff : self.trig.holdoff,
                            level : self.trig.level,
                            source : self.trig.source,
                            mode : self.trig.mode,
                            edge : {
                              coupling : self.trig.edge.coupling,
                              slope : self.trig.edge.slope,
                              alt : self.trig.edge.alt
                            }
                        },
                        horProps : {
                            pos : self.hor.position,
                            mode : self.hor.mode,
                            scale : self.hor.scale,
                            zscale : self.hor.zscale,
                        },
                        acqProps : {
                            mode : self.acq.mode,
                            length : self.acq.mem_length,
                            average: self.acq.average
                        }
                    });
                }

            };
            var cmd=[];
            var i;
            var chID=["ch1","ch2","ch3","ch4"];
            log("getSetup");
            for(i=0; i<self.dev.maxChNum; i++){
                cmd.push({id:chID[i], prop:'COUPling', arg:"", cb:null, method:'get'});
                cmd.push({id:chID[i], prop:'INVert', arg:"", cb:null, method:'get'});
                cmd.push({id:chID[i], prop:'BWLimit',  arg:"", cb:null, method:'get'});
                cmd.push({id:chID[i], prop:'VerSCALe', arg:"", cb:null, method:'get'});
                cmd.push({id:chID[i], prop:'VerPOSition', arg:"", cb:null, method:'get'});
                cmd.push({id:chID[i], prop:'ChState', arg:"", cb:null, method:'get'});
                cmd.push({id:chID[i], prop:'PROBe_Type',arg:"", cb:null,method:'get'});
                cmd.push({id:chID[i], prop:'PROBe_RATio',arg:"", cb:null,method:'get'});
            }
            cmd.push({id:'hor',prop:'HorScale',arg:"", cb:null,method:'get'});
            cmd.push({id:'hor',prop:'HorPosition',arg:"", cb:null,method:'get'});
            cmd.push({id:'hor',prop:'HorMode',arg: "", cb:null,method:'get'});
            cmd.push({id:'hor',prop:'HorZoomScale',arg: "", cb:null,method:'get'});
            cmd.push({id:'acq', prop:'AcqMode', arg:"", cb:null, method:'get'});
            cmd.push({id:'acq', prop:'AcqAverage', arg:"", cb:null, method:'get'});
            cmd.push({id:'acq', prop:'AcqRecLength', arg:"", cb:null, method:'get'});

            cmd.push({id:'trig',prop:'TrigSource',arg:"",cb:null,method:'get'});
            cmd.push({id:'trig',prop:'TrigMode',arg:"",cb:null,method:'get'});
            cmd.push({id:'trig',prop:'TrigHoldoff',arg:"",cb:null,method:'get'});
            cmd.push({id:'trig',prop:'TrigLevel',arg:"",cb:null,method:'get'});
            cmd.push({id:'trig',prop:'TrigType',arg:"",cb:null,method:'get'});
            cmd.push({id:'trig',prop:'TrigEdgeSlope',arg:"", cb:null,method:'get'});
            cmd.push({id:'trig',prop:'TrigCouple',arg:"", cb:null,method:'get'});
            cmd.push({id:'trig',prop:'TrigALT',arg:"", cb:getDone,method:'get'});
            self.dev.cmdSequence = self.dev.cmdSequence.concat(cmd);
            // log(self.dev.cmdSequence);
            self.cmdEvent.emit('cmd_write', cmd);
        });
    }).bind(dsoObj);
/**
*
*/
    dsoctrl.setSetup = (function(setup) {
        var self = this;

        return new Promise(function(resolve, reject) {
            function setDone(e){
                if (e) {
                    log("dso.setSetup error");
                    log(e);
                    reject(e);
                }else {
                    resolve();
                }
            };
            var cmd=[];
            var i;
            var chID=["ch1","ch2","ch3","ch4"];
            log("dso setSetup");
            log(setup);

            cmd.push({id:'sys',prop:'RST',arg:'',cb:null,method:'set'});
            for(i=0; i<self.dev.maxChNum; i++){
                cmd.push({id:chID[i], prop:'COUPling', arg: setup.chProps[chID[i]].coupling, cb:null, method:'set'});
                cmd.push({id:chID[i], prop:'INVert', arg: setup.chProps[chID[i]].invert, cb:null, method:'set'});
                cmd.push({id:chID[i], prop:'BWLimit',  arg: setup.chProps[chID[i]].bandwidth, cb:null, method:'set'});
                cmd.push({id:chID[i], prop:'VerSCALe', arg: setup.chProps[chID[i]].scale, cb:null, method:'set'});
                cmd.push({id:chID[i], prop:'VerPOSition', arg: setup.chProps[chID[i]].pos, cb:null, method:'set'});
                cmd.push({id:chID[i], prop:'ChState', arg: setup.chProps[chID[i]].state, cb:null, method:'set'});
                cmd.push({id:chID[i], prop:'PROBe_Type',arg: setup.chProps[chID[i]].probUnit, cb:null,method:'set'});
                cmd.push({id:chID[i], prop:'PROBe_RATio',arg: setup.chProps[chID[i]].probRatio, cb:null,method:'set'});
            }
            cmd.push({id:'hor',prop:'HorScale',arg: setup.horProps.scale, cb:null,method:'set'});
            cmd.push({id:'hor',prop:'HorPosition',arg: setup.horProps.pos, cb:null,method:'set'});
            cmd.push({id:'hor',prop:'HorMode',arg: setup.horProps.mode, cb:null,method:'set'});
            cmd.push({id:'hor',prop:'HorZoomScale',arg: setup.horProps.zscale, cb:null,method:'set'});
            cmd.push({id:'acq', prop:'AcqMode', arg: setup.acqProps.mode, cb:null, method:'set'});
            cmd.push({id:'acq', prop:'AcqAverage', arg: setup.acqProps.average, cb:null, method:'set'});
            cmd.push({id:'acq', prop:'AcqRecLength', arg: setup.acqProps.length, cb:null, method:'set'});

            cmd.push({id:'trig',prop:'TrigSource',arg: setup.trigProps.source, cb:null,method:'set'});
            cmd.push({id:'trig',prop:'TrigMode',arg:setup.trigProps.mode, cb:null,method:'set'});
            cmd.push({id:'trig',prop:'TrigHoldoff',arg: setup.trigProps.holdoff, cb:null,method:'set'});
            cmd.push({id:'trig',prop:'TrigLevel',arg: setup.trigProps.level, cb:null,method:'set'});
            cmd.push({id:'trig',prop:'TrigType',arg: setup.trigProps.type, cb:null,method:'set'});
            cmd.push({id:'trig',prop:'TrigEdgeSlope',arg: setup.trigProps.edge.slope, cb:null,method:'set'});
            cmd.push({id:'trig',prop:'TrigCouple',arg: setup.trigProps.edge.coupling, cb:null,method:'set'});
            cmd.push({id:'trig',prop:'TrigALT',arg: setup.trigProps.edge.alt, cb:setDone,method:'set'});
            self.dev.cmdSequence = self.dev.cmdSequence.concat(cmd);
            // log(self.dev.cmdSequence);
            self.cmdEvent.emit('cmd_write', cmd);
        });
    }).bind(dsoObj);

/**
*   The method belong to dsoctrl class used to load vertical properties from device,
*   like scale, position .. etc.
*
*   @method getVertical
*   @param {String} ch Specify which channel wants to be loaded
*   @return {Object} chProperty
*
*/
/**
*   Channel property
*
*   @property chProperty
*   @type Object
*   @param {String} coupling Specify coupling on AC,DC or GND
*   @param {String} impedance Specify the impedance of the analog channel
*   @param {String} invert
*   @param {String} bandwidth
*   @param {String} expand
*   @param {String} state
*   @param {String} scale
*   @param {String} position
*   @param {String} deskew
*   @param {String} rawdata
*   @param {String} probe.unit
*   @param {String} probe.atten
*/
    dsoctrl.getChannel = (function(chProp) {
        // this.GetSnapshot(callback);
        var self = this;
        var chNum = sysConstant.chID[chProp.ch];
        var chCmd;



        return new Promise(function(resolve, reject) {
            function vetical(e){
                if (e) {
                    reject(e);

                }else {
                    resolve(self[chProp.ch]);
                }

            };
            var cmd=[];

            log('chNum ='+chNum);
            log('maxChNum ='+self.dev.maxChNum);
            if(chNum === undefined){
                reject(['400','Parameter Error']);
                return;
            }
            if(chNum >= self.dev.maxChNum){
                reject(['400','Parameter Error']);
                return;
            }
            // if(chNum < self.dev.maxChNum) {
            //     chCmd = chanLoadCmd[chNum].slice(0);
            //     chCmd[chCmd.length-1].cb = vetical;
            //     self.dev.cmdSequence = self.dev.cmdSequence.concat(chCmd);
            //     self.cmdEvent.emit('cmd_write', self.dev.cmdSequence);
            // }

            if(chProp.coupling!==undefined){
                cmd.push({id:chProp.ch, prop:'COUPling', arg:chProp.coupling, cb:null, method:'get'});
            }
            if(chProp.impedance!==undefined){
                cmd.push({id:chProp.ch, prop:'IMPedance', arg:chProp.impedance, cb:null, method:'get'});
            }
            if(chProp.invert!==undefined){
                cmd.push({id:chProp.ch, prop:'INVert', arg:chProp.invert, cb:null, method:'get'});
            }
            if(chProp.bandwidth!==undefined){
                cmd.push({id:chProp.ch, prop:'BWLimit', arg:chProp.bandwidth, cb:null, method:'get'});
            }
            if(chProp.expand!==undefined){
                cmd.push({id:chProp.ch, prop:'VerEXPand', arg:chProp.expand, cb:null, method:'get'});
            }
            if(chProp.scale!==undefined){
                cmd.push({id:chProp.ch, prop:'VerSCALe', arg:chProp.scale, cb:null, method:'get'});
            }
            if(chProp.position!==undefined){
                cmd.push({id:chProp.ch, prop:'VerPOSition', arg:chProp.position, cb:null, method:'get'});
            }
            if(chProp.state!==undefined){
                cmd.push({id:chProp.ch, prop:'ChState', arg:chProp.state, cb:null, method:'get'});
            }

            if(chProp.probe!==undefined){
                cmd.push({id:chProp.ch,prop:'PROBe_Type',arg:chProp.probe.unit,cb:null,method:'get'});
                cmd.push({id:chProp.ch,prop:'PROBe_RATio',arg:chProp.probe.atten,cb:null,method:'get'});
            }

            if(chProp.deskew!==undefined){
                cmd.push({id:chProp.ch, prop:'DESKew', arg:chProp.probe.deskew, cb:null, method:'get'});
            }
            if(cmd.length > 0){
                cmd[cmd.length-1].cb = vetical;
                self.dev.cmdSequence = self.dev.cmdSequence.concat(cmd);
                // log(self.dev.cmdSequence);
                self.cmdEvent.emit('cmd_write', cmd);
            }
            else{
                cmd = [
                    {id:chProp.ch, prop:'COUPling', arg:'', cb:null, method:'get'},
                    {id:chProp.ch, prop:'IMPedance', arg:'', cb:null, method:'get'},
                    {id:chProp.ch, prop:'INVert', arg:'', cb:null, method:'get'},
                    {id:chProp.ch, prop:'BWLimit', arg:'', cb:null, method:'get'},
                    {id:chProp.ch, prop:'VerEXPand', arg:'', cb:null, method:'get'},
                    {id:chProp.ch, prop:'VerSCALe', arg:'', cb:null, method:'get'},
                    {id:chProp.ch, prop:'VerPOSition', arg:'', cb:null, method:'get'},
                    {id:chProp.ch, prop:'ChState', arg:'',cb:null, method:'get'},
                    {id:chProp.ch,prop:'PROBe_Type',arg:'',cb:null,method:'get'},
                    {id:chProp.ch,prop:'PROBe_RATio',arg:'',cb:null,method:'get'},
                    {id:chProp.ch, prop:'DESKew', arg:'', cb:vetical, method:'get'}
                ];
                self.dev.cmdSequence = self.dev.cmdSequence.concat(cmd);
                self.cmdEvent.emit('cmd_write', cmd);
            }


        });
    }).bind(dsoObj);

/**
*   The method belong to dsoctrl class used to setup vertical properties to device,
*   like scale, position .. etc.
*
*   @method setVertical
*   @param {Object} chProperty Specify all channel parameter
*
*/
/**
*   Channel property
*
*   @property chProperty
*   @type Object
*   @param {String} coupling Specify coupling on AC,DC or GND
*   @param {String} impedance Specify the impedance of the analog channel
*   @param {String} invert
*   @param {String} bandwidth
*   @param {String} expand
*   @param {String} scale
*   @param {String} state
*   @param {String} position
*   @param {String} deskew
*   @param {String} rawdata
*   @param {String} probe.unit
*   @param {String} probe.atten
*/
    dsoctrl.setChannel = (function(chProp) {
        // this.GetSnapshot(callback);
        var self = this;
        var chNum = sysConstant.chID[chProp.ch];
        var cmd=[];


        return new Promise(function(resolve, reject) {
            function vertical(e){
                if (e) {
                    reject(e);

                }else {
                    resolve(self[chProp.ch]);
                }

            };
            log('chNum ='+chNum);
            log('maxChNum ='+self.dev.maxChNum);
            log(chProp);

            if(chNum === undefined){
                reject(['400','Parameter Error']);
                return;
            }
            if(chNum >= self.dev.maxChNum){
                reject(['400','Parameter Error']);
                return;
            }
            if(chProp.coupling!==undefined){
                cmd.push({id:chProp.ch, prop:'COUPling', arg:chProp.coupling, cb:null, method:'set'});
            }
            if(chProp.impedance!==undefined){
                cmd.push({id:chProp.ch, prop:'IMPedance', arg:chProp.impedance, cb:null, method:'set'});
            }
            if(chProp.invert!==undefined){
                cmd.push({id:chProp.ch, prop:'INVert', arg:chProp.invert, cb:null, method:'set'});
            }
            if(chProp.bandwidth!==undefined){
                cmd.push({id:chProp.ch, prop:'BWLimit', arg:chProp.bandwidth, cb:null, method:'set'});
            }
            if(chProp.expand!==undefined){
                cmd.push({id:chProp.ch, prop:'VerEXPand', arg:chProp.expand, cb:null, method:'set'});
            }
            if(chProp.scale!==undefined){
                cmd.push({id:chProp.ch, prop:'VerSCALe', arg:chProp.scale, cb:null, method:'set'});
            }
            if(chProp.position!==undefined){
                cmd.push({id:chProp.ch, prop:'VerPOSition', arg:chProp.position, cb:null, method:'set'});
            }
            if(chProp.state!==undefined){
                cmd.push({id:chProp.ch, prop:'ChState', arg:chProp.state, cb:null, method:'set'});
            }

            if(chProp.probe!==undefined){
                if(chProp.probe.unit!==undefined){
                    cmd.push({id:chProp.ch,prop:'PROBe_Type',arg:chProp.probe.unit,cb:null,method:'set'});
                }
                if(chProp.probe.atten!==undefined){
                    cmd.push({id:chProp.ch,prop:'PROBe_RATio',arg:chProp.probe.atten,cb:null,method:'set'});
                }
            }

            if(chProp.deskew!==undefined){
                cmd.push({id:chProp.ch, prop:'DESKew', arg:chProp.probe.deskew, cb:null, method:'set'});
            }
            if(cmd.length > 0){
                cmd[cmd.length-1].cb = vertical;
                self.dev.cmdSequence = self.dev.cmdSequence.concat(cmd);
                // log(self.dev.cmdSequence);
                self.cmdEvent.emit('cmd_write', cmd);
            }
            else{
                log('setVertical do nothing');
                resolve();
            }
        });
    }).bind(dsoObj);

/**
*   The method belong to dsoctrl class used to turn selected channel on
*
*   @method getVertical
*   @param {String} ch Specify which channel wants to turn on
*
*
*/
    dsoctrl.enableCh = (function(ch) {
        // this.GetSnapshot(callback);
        var self = this;

        return new Promise(function(resolve, reject) {
            function chstate(e){
                if (e) {
                    reject(e);

                }else {
                    resolve();
                }

            };

            var chid = ch.toLowerCase();
            if( (chid === 'ch1') || (chid === 'ch2') || (chid === 'ch3') || (chid === 'ch4')){
                var cmd = [
                        {id:chid, prop:'ChState', arg:'ON', cb:chstate, method:'set'}
                    ];
                self.dev.cmdSequence = self.dev.cmdSequence.concat(cmd);
                self.cmdEvent.emit('cmd_write', cmd);
            }
            else{
                reject(Error("parameter error"));
                return;
            }

        });
    }).bind(dsoObj);

/**
*   The method belong to dsoctrl class used to turn selected channel off
*
*   @method getVertical
*   @param {String} ch Specify which channel wants to turn off
*
*
*/
    dsoctrl.disableCh = (function(ch) {
        // this.GetSnapshot(callback);
        var self = this;

        return new Promise(function(resolve, reject) {
            function chstate(e){
                if (e) {
                    reject(e);

                }else {
                    resolve();
                }

            };
            log('disableCh cmd');
            log(ch);
            var chid = ch.toLowerCase();
            log('disableCh cmd toLowerCase');
            log(chid);
            if( (chid === 'ch1') || (chid === 'ch2') || (chid === 'ch3') || (chid === 'ch4')){
                var cmd = [
                        {id:chid, prop:'ChState', arg:'OFF', cb:chstate, method:'set'}
                    ];
                self.dev.cmdSequence = self.dev.cmdSequence.concat(cmd);
                self.cmdEvent.emit('cmd_write', cmd);
            }
            else{
                reject(Error("parameter error"));
                return;
            }

        });
    }).bind(dsoObj);

/**
*   The method belong to dsoctrl class used to get the current screen from device,
*
*   @method getSnapshot
*   @return {Buffer} dsiplay data buffer
*
*/
    dsoctrl.screen = (function() {
        // this.GetSnapshot(callback);
        var self = this;


        return new Promise(function(resolve, reject) {
            function snapshot(e){
                if (e) {
                    reject(e);

                }else {
                    resolve(self.sys.dispData);
                }

            };
            var cmd = [
                    {id:'sys',prop:'DispOut',arg:'OFF',cb:snapshot,method:'get'}
                ];
            self.dev.cmdSequence = self.dev.cmdSequence.concat(cmd);
            self.cmdEvent.emit('cmd_write', cmd);
        });
    }).bind(dsoObj);
/**
*   The method belong to dsoctrl class used to get the current screen from device,
*
*   @method getSnapshot
*   @return {Buffer} dsiplay data buffer
*
*/
    dsoctrl.image = (function() {
        // this.GetSnapshot(callback);
        var self = this;


        return new Promise(function(resolve, reject) {
            function getDone(e){
                if (e) {
                    reject(e);

                }else {
                    resolve(self.sys.image);
                }

            };
            var cmd = [
                    {id:'sys',prop:'PngOutput',arg:'',cb:getDone,method:'get'}
                ];
            self.dev.cmdSequence = self.dev.cmdSequence.concat(cmd);
            self.cmdEvent.emit('cmd_write', cmd);
        });
    }).bind(dsoObj);

/**
*   The method belong to dsoctrl class used to get the data in acquisition memory for
*   the selected channel form device
*
*   @method getRawdata
*   @param {String} ch Specify which channel wants to be loaded
*   @return {Buffer} rawdata buffer
*
*/
    dsoctrl.getRawdata = (function(ch) {
        // this.GetRawdata(ch,callback);
        var self = this;

        return new Promise(function(resolve, reject) {
            function rawData(e){
                if (e) {
                    log('getRawdata fail');
                    reject(e);

                }else {
                    log('getRawdata done');
                    resolve(self[ch].rawdata);
                }

            };
            if(sysConstant.chID[ch] !== undefined){
                var cmd=[
                        {id:'acq',prop:'AcqHeader',arg:'OFF',cb:null,method:'set'},
                        {id:ch,prop:'AcqMemory',arg:'',cb:rawData,method:'get'}
                    ];
                self.dev.cmdSequence = self.dev.cmdSequence.concat(cmd);
                self.cmdEvent.emit('cmd_write', cmd);

            }else {
                reject(Error("error null parameter"));
            }
        });
    }).bind(dsoObj);
/**
*   The method belong to dsoctrl class used to get acquisition setting
*
*   @method getAcquire
*   @return {Buffer} rawdata buffer
*
*/
    dsoctrl.getAcquire = (function(acqProp) {
        var self = this;

        return new Promise(function(resolve, reject) {
            function acq(e){
                if (e) {
                    reject(e);

                }else {
                    resolve(self.acq);
                }

            };
            var cmd = [];

            if(acqProp){
                if(acqProp.mode!==undefined){
                    cmd.push({id:'acq', prop:'AcqMode', arg:acqProp.mode, cb:null, method:'get'});
                }
                if(acqProp.average!==undefined){
                    cmd.push({id:'acq', prop:'AcqAverage', arg:acqProp.average, cb:null, method:'get'});
                }
                if(acqProp.mem_length!==undefined){
                    cmd.push({id:'acq', prop:'AcqRecLength', arg:acqProp.mem_length, cb:null, method:'get'});
                }
                if(cmd.length > 0){
                    cmd[cmd.length-1].cb = acq;
                }
                else{
                    log('getAcquire do nothing');
                    reject('getAcquire do nothing');
                    return;
                }
            }
            else{
                cmd = [
                    {id:'acq',prop:'AcqRecLength',arg:'',cb:null,method:'get'},
                    {id:'acq',prop:'AcqMode',arg:'',cb:null,method:'get'},
                    {id:'acq',prop:'AcqAverage',arg:'',cb:acq,method:'get'}
                ];
            }
            self.dev.cmdSequence = self.dev.cmdSequence.concat(cmd);
            self.cmdEvent.emit('cmd_write', cmd);


        });
    }).bind(dsoObj);
/**
*   The method belong to dsoctrl class used to set acquisition property
*
*   @method setAcquire
*   @return {Buffer} rawdata buffer
*
*/
    dsoctrl.setAcquire = (function( acqProp) {
        var self = this;

        return new Promise(function(resolve, reject) {
            function acq(e){
                if (e) {
                    reject(e);

                }else {
                    resolve(self.acq);
                }

            };

            var cmd=[];

            log(acqProp);

            if(acqProp.mode!==undefined){
                cmd.push({id:'acq', prop:'AcqMode', arg:acqProp.mode, cb:null, method:'set'});
            }
            if(acqProp.average!==undefined){
                cmd.push({id:'acq', prop:'AcqAverage', arg:acqProp.average, cb:null, method:'set'});
            }
            if(acqProp.mem_length!==undefined){
                cmd.push({id:'acq', prop:'AcqRecLength', arg:acqProp.mem_length, cb:null, method:'set'});
            }

            if(cmd.length > 0){
                cmd[cmd.length-1].cb = acq;
                self.dev.cmdSequence = self.dev.cmdSequence.concat(cmd);
                self.cmdEvent.emit('cmd_write', cmd);
            }
            else{
                log('setAcquire do nothing');
                resolve();
            }

        });
    }).bind(dsoObj);


/**
*   The method belong to dsoctrl class used to get acquisition setting
*
*   @method getAcquire
*   @return {Buffer} rawdata buffer
*
*/
    dsoctrl.getTeacherFunc = (function(prop) {
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

            if(prop){
                if(prop.autosetenable!==undefined){
                    cmd.push({id:'sys', prop:'AutosetEnable', arg:"", cb:null, method:'get'});
                }
                if(prop.cursorenable!==undefined){
                    cmd.push({id:'sys', prop:'CursorEnable', arg:"", cb:null, method:'get'});
                }
                if(prop.measureenable!==undefined){
                    cmd.push({id:'sys', prop:'MeasureEnable', arg:"", cb:null, method:'get'});
                }
                if(cmd.length > 0){
                    cmd[cmd.length-1].cb = getDone;
                }
                else{
                    log('getTeacherFunc do nothing');
                    reject('getTeacherFunc do nothing');
                    return;
                }
                self.dev.cmdSequence = self.dev.cmdSequence.concat(cmd);
                self.cmdEvent.emit('cmd_write', cmd);
            }
            else{
                log('getTeacherFunc do nothing');
                reject('getTeacherFunc do nothing');
            }



        });
    }).bind(dsoObj);
/**
*   The method belong to dsoctrl class used to set acquisition property
*
*   @method setAcquire
*   @return {Buffer} rawdata buffer
*
*/
    dsoctrl.setTeacherFunc = (function(prop) {
        var self = this;

        return new Promise(function(resolve, reject) {
            function setDone(e){
                if (e) {
                    reject(e);

                }else {
                    resolve();
                }

            };

            var cmd=[];

            log(prop);

            if(prop){
                if(prop.autosetenable!==undefined){
                    cmd.push({id:'sys', prop:'AutosetEnable', arg:prop.autosetenable, cb:null, method:'set'});
                }
                if(prop.cursorenable!==undefined){
                    cmd.push({id:'sys', prop:'CursorEnable', arg:prop.cursorenable, cb:null, method:'set'});
                }
                if(prop.measureenable!==undefined){
                    cmd.push({id:'sys', prop:'MeasureEnable', arg:prop.measureenable, cb:null, method:'set'});
                }
                if(cmd.length > 0){
                    cmd[cmd.length-1].cb = setDone;
                }
                else{
                    log('setTeacherFunc do nothing');
                    reject('setTeacherFunc do nothing');
                    return;
                }
                self.dev.cmdSequence = self.dev.cmdSequence.concat(cmd);
                self.cmdEvent.emit('cmd_write', cmd);
            }
            else{
                log('setTeacherFunc do nothing');
                reject('setTeacherFunc do nothing');
            }

        });
    }).bind(dsoObj);


    ////////////////////////////
    // dsoctrl.onError = (function(callback) {
    //     this.errHandler = callback;
    // }).bind(dsoObj);
    ///////////////////////////////

/**
*   The method belong to dsoctrl class used to get the edge trigger properties from device
*
*   @method getEdgeTrig
*   @return {object} trigProperty
*
*/
/**
*   Trigger property of device.
*
*   @property trigProperty
*   @type Object
*   @param {String} type
*   @param {String} source
*   @param {String} mode
*   @param {String} holdoff
*   @param {String} noise-rej
*   @param {String} level
*   @param {String} alt
*   @param {String} state
*   @param {String} edge.coupling
*   @param {String} edge.slop
*/
    dsoctrl.getTrigProp = (function(trigProp) {
        var self = this;
        var cmd = [];

        return new Promise(function(resolve, reject) {
            function trigCb(e){
                if (e) {
                    reject(e);

                }else {
                    resolve(self.trig);
                }

            };
            log(trigProp);
            if(trigProp === undefined){
                reject(['-100','Parameter Error']);
                return;
            }
            log(trigProp);
            if(trigProp.type === "edge"){
                if(trigProp.edge.slope!==undefined){
                    cmd.push({id:'trig',prop:'TrigEdgeSlope',arg:trigProp.noise_rej,cb:null,method:'get'});
                }
                if(trigProp.edge.coupling!==undefined){
                    cmd.push({id:'trig',prop:'TrigCouple',arg:trigProp.alt,cb:null,method:'get'});
                }
                if(trigProp.edge.alt!==undefined){
                    cmd.push({id:'trig',prop:'TrigALT',arg:trigProp.alt,cb:null,method:'get'});
                }
            }

            if(cmd.length > 0){
                cmd[cmd.length-1].cb = trigCb;
                self.dev.cmdSequence = self.dev.cmdSequence.concat(cmd);
                // log(self.dev.cmdSequence);
                self.cmdEvent.emit('cmd_write', cmd);
            }
            else{
                log('getEdgeTrig do nothing');
                resolve();
            }
        });
    }).bind(dsoObj);

    dsoctrl.setTrigProp = (function(trigProp) {
        var self = this;
        var cmd = [];

        return new Promise(function(resolve, reject) {
            function trigCb(e){
                if (e) {
                    reject(e);

                }else {
                    resolve();
                }

            };
            log(trigProp);
            if(trigProp === undefined){
                reject(['-100','Parameter Error']);
                return;
            }
            log(trigProp);
            if(trigProp.type === "edge"){
                if(trigProp.edge.slope!==undefined){
                    cmd.push({id:'trig',prop:'TrigEdgeSlope',arg:trigProp.edge.slope,cb:null,method:'set'});
                }
                if(trigProp.edge.coupling!==undefined){
                    cmd.push({id:'trig',prop:'TrigCouple',arg:trigProp.edge.coupling,cb:null,method:'set'});
                }
                if(trigProp.edge.alt!==undefined){
                    cmd.push({id:'trig',prop:'TrigALT',arg:trigProp.edge.alt,cb:null,method:'set'});
                }
            }

            if(cmd.length > 0){
                cmd[cmd.length-1].cb = trigCb;
                self.dev.cmdSequence = self.dev.cmdSequence.concat(cmd);
                // log(self.dev.cmdSequence);
                self.cmdEvent.emit('cmd_write', cmd);
            }
            else{
                log('getEdgeTrig do nothing');
                resolve();
            }
        });
    }).bind(dsoObj);

/**
*   The method belong to dsoctrl class used to set edge trigger properties to device
*
*   @method setEdgeTrig
*   @param {object} trigProperty
*
*/
/**
*   Trigger property of device.
*
*   @property trigProperty
*   @type Object
*   @param {String} type
*   @param {String} source
*   @param {String} mode
*   @param {String} holdoff
*   @param {String} noise_rej
*   @param {String} level
*   @param {String} alt
*   @param {String} edge.coupling
*   @param {String} edge.slop
*/
    dsoctrl.setEdgeTrig = (function(trigProp) {
        var self = this;
        var cmd = [];

        return new Promise(function(resolve, reject) {
            function edgeTrig(e){
                if (e) {
                    reject(e);

                }else {
                    resolve(self.trig);
                }

            };

            if(trigProp === undefined){
                reject(['-100','Parameter Error']);
                return;
            }
            cmd.push({id:'trig',prop:'TrigType',arg:'EDGE',cb:null,method:'set'});
            if(trigProp.source!==undefined){
                cmd.push({id:'trig',prop:'TrigSource',arg:trigProp.source,cb:null,method:'set'});
            }
            if(trigProp.mode!==undefined){
                cmd.push({id:'trig',prop:'TrigMode',arg:trigProp.mode,cb:null,method:'set'});
            }
            if(trigProp.edge!==undefined){
                if(trigProp.edge.coupling!==undefined){
                    cmd.push({id:'trig',prop:'TrigCouple',arg:trigProp.edge.coupling,cb:null,method:'set'});
                }
                if(trigProp.edge.slop!==undefined){
                    cmd.push({id:'trig',prop:'TrigEdgeSlop',arg:trigProp.edge.slop,cb:null,method:'set'});
                }
            }
            if(trigProp.holdoff!==undefined){
                cmd.push({id:'trig',prop:'TrigHoldoff',arg:trigProp.holdoff,cb:null,method:'set'});
            }
            if(trigProp.noise_rej!==undefined){
                cmd.push({id:'trig',prop:'TrigNoiseRej',arg:trigProp.noise_rej,cb:null,method:'set'});
            }
            // if(trigProp.reject!==undefined){
            //     cmd.push({id:'trig',prop:'TrigReject',arg:trigProp.reject,cb:null,method:'set'});
            // }
            if(trigProp.level!==undefined){
                cmd.push({id:'trig',prop:'TrigHighLevel',arg:trigProp.level,cb:null,method:'set'});
            }
            if(trigProp.alt!==undefined){
                cmd.push({id:'trig',prop:'TrigALT',arg:trigProp.alt,cb:null,method:'set'});
            }

            if(cmd.length > 0){
                cmd[cmd.length-1].cb = edgeTrig;
                self.dev.cmdSequence = self.dev.cmdSequence.concat(cmd);
                // log(self.dev.cmdSequence);
                self.cmdEvent.emit('cmd_write', cmd);
            }
            else{
                log('setVertical do nothing');
                resolve();
            }
        });
    }).bind(dsoObj);

/**
*   The method belong to dsoctrl class used to get the trigger properties from device
*
*   @method getTrigCommonProp
*   @return {object} trigProperty
*
*/
/**
*   Trigger property of device.
*
*   @property trigProperty
*   @type Object
*   @param {String} type
*   @param {String} source
*   @param {String} mode
*   @param {String} holdoff
*   @param {String} noise-rej
*   @param {String} level
*   @param {String} alt
*   @param {String} state
*   @param {String} edge.coupling
*   @param {String} edge.slop
*/
    dsoctrl.getTrigCommonProp = (function(trigProp) {
        var self = this;
        var cmd = [];

        return new Promise(function(resolve, reject) {
            function commonTrig(e){
                if (e) {
                    reject(e);

                }else {
                    resolve(self.trig);
                }

            };
            if(trigProp === undefined){
                reject(['-100','Parameter Error']);
                return;
            }


            if(trigProp.source!==undefined){
                cmd.push({id:'trig',prop:'TrigSource',arg:"",cb:null,method:'get'});
            }
            if(trigProp.mode!==undefined){
                cmd.push({id:'trig',prop:'TrigMode',arg:"",cb:null,method:'get'});
            }
            if(trigProp.holdoff!==undefined){
                cmd.push({id:'trig',prop:'TrigHoldoff',arg:"",cb:null,method:'get'});
            }
            if(trigProp.noise_rej!==undefined){
                cmd.push({id:'trig',prop:'TrigNoiseRej',arg:"",cb:null,method:'get'});
            }
            if(trigProp.level!==undefined){
                cmd.push({id:'trig',prop:'TrigLevel',arg:"",cb:null,method:'get'});
            }
            if(trigProp.type!==undefined){
                cmd.push({id:'trig',prop:'TrigType',arg:"",cb:null,method:'get'});
            }

            if(cmd.length > 0){
                cmd[cmd.length-1].cb = commonTrig;
                self.dev.cmdSequence = self.dev.cmdSequence.concat(cmd);
                // log(self.dev.cmdSequence);
                self.cmdEvent.emit('cmd_write', cmd);
            }
            else{
                log('setVertical do nothing');
                resolve();
            }
        });
    }).bind(dsoObj);
/**
*   The method belong to dsoctrl class used to set the trigger properties from device
*
*   @method getTrigCommonProp
*   @return {object} trigProperty
*
*/
/**
*   Trigger property of device.
*
*   @property trigProperty
*   @type Object
*   @param {String} type
*   @param {String} source
*   @param {String} mode
*   @param {String} holdoff
*   @param {String} noise-rej
*   @param {String} level
*   @param {String} alt
*   @param {String} state
*   @param {String} edge.coupling
*   @param {String} edge.slop
*/
    dsoctrl.setTrigCommonProp = (function(trigProp) {
        var self = this;
        var cmd = [];

        return new Promise(function(resolve, reject) {
            function commonTrig(e){
                if (e) {
                    reject(e);

                }else {
                    resolve();
                }

            };
            if(trigProp === undefined){
                reject(['-100','Parameter Error']);
                return;
            }


            if(trigProp.source!==undefined){
                cmd.push({id:'trig',prop:'TrigSource',arg:trigProp.source,cb:null,method:'set'});
            }
            if(trigProp.mode!==undefined){
                cmd.push({id:'trig',prop:'TrigMode',arg:trigProp.mode,cb:null,method:'set'});
            }
            if(trigProp.holdoff!==undefined){
                cmd.push({id:'trig',prop:'TrigHoldoff',arg:trigProp.holdoff,cb:null,method:'set'});
            }
            if(trigProp.noise_rej!==undefined){
                cmd.push({id:'trig',prop:'TrigNoiseRej',arg:trigProp.noise_rej,cb:null,method:'set'});
            }
            if(trigProp.level!==undefined){
                cmd.push({id:'trig',prop:'TrigLevel',arg:trigProp.level,cb:null,method:'set'});
            }
            if(trigProp.type!==undefined){
                cmd.push({id:'trig',prop:'TrigType',arg:trigProp.level,cb:null,method:'set'});
            }

            if(cmd.length > 0){
                cmd[cmd.length-1].cb = commonTrig;
                self.dev.cmdSequence = self.dev.cmdSequence.concat(cmd);
                // log(self.dev.cmdSequence);
                self.cmdEvent.emit('cmd_write', cmd);
            }
            else{
                log('setVertical do nothing');
                resolve();
            }
        });
    }).bind(dsoObj);


/**
*   The method belong to dsoctrl class used to get the measurment properties
*   for the selected measure channel from device
*
*   @method getMeas
*   @param {String} mCh Specify which measure channel wants to be loaded
*   @return {object} measProperty
*
*/
/**
*   Measurement property of device.
*
*   @property measProperty
*   @type Object
*   @param {String} stdValue
*   @param {String} minValue
*   @param {String} meanValue
*   @param {String} value
*   @param {String} state
*   @param {String} source1
*   @param {String} source2
*   @param {String} type
*   @param {String} state
*/

    dsoctrl.getMeas = (function(mCh) {
        var self = this;

        return new Promise(function(resolve, reject) {
            function measCmd(e){
                if (e) {
                    reject(e);

                }else {
                    resolve(self[mCh]);
                }

            };
            var measVal = [
                    {id:mCh, prop:'MeasureState', arg:'', cb:null, method:'get'},
                    // {id:'sys',prop:'StatisticMode',arg:'',cb:null,method:'get'},
                    {id:mCh, prop:'MeasureValue', arg:'', cb:null, method:'get'},
                    {id:mCh, prop:'MeasureSource1', arg:'', cb:null, method:'get'},
                    {id:mCh, prop:'MeasureSource2', arg:'', cb:null, method:'get'},
                    {id:mCh, prop:'MeasureType', arg:'', cb:measCmd, method:'get'}
            ];
            var measStd = [
                    {id:mCh, prop:'MeasureStd', arg:'', cb:null, method:'get'},
                    {id:mCh, prop:'MeasureMin', arg:'', cb:null, method:'get'},
                    {id:mCh, prop:'MeasureMean', arg:'', cb:null, method:'get'},
                    {id:mCh, prop:'MeasureMax', arg:'', cb:null, method:'get'}
            ];

            if(self.sys.staMode === 'ON'){
                self.dev.cmdSequence = self.dev.cmdSequence.concat(measStd);
            }
            self.dev.cmdSequence = self.dev.cmdSequence.concat(measVal);
            self.cmdEvent.emit('cmd_write', measCmd);
        });
    }).bind(dsoObj);

/**
*   The method belong to dsoctrl class used to get the measurment type
*   of device supported
*
*   @method supportedMeasType
*   @return {Array} supported measure type
*
*/
    dsoctrl.supportedMeasType = (function() {
        var self = this;

        return new Promise(function(resolve, reject) {
            log(self.commandObj[self.gdsType].MeasureType.parameter);
            resolve(self.commandObj[self.gdsType].MeasureType.parameter);
        });

    }).bind(dsoObj);

/**
*   The method belong to dsoctrl class used to setup a periodical measure channel with specify measure type
*   and source channel
*
*   @method setMeas
*   @param {Object} measConf Config to setup a measure channel
*
*
*/

/**
*
*   Object used to setup a measure channel
*
*   @property measConf
*   @type Object
*   @param {String} src1 Specify first source channel for measurement
*   @param {String} src2 Specify second source channel for delay measure type
*   @param {String} type Specify measure type
*/
    dsoctrl.setMeas = (function(conf) {
        var self = this;

        return new Promise(function(resolve, reject) {
            function measCmd(e){
                if (e) {
                    reject(e);

                }else {
                    resolve();
                }

            };
            var measSet = [
                    {id:conf.ch,prop:'MeasureState',arg:'ON',cb:null,method:'set'},
                    {id:conf.ch,prop:'MeasureSource1',arg:conf.src1.toUpperCase(),cb:null,method:'set'}
                ],
                measSrc2 = [
                    {id:conf.ch,prop:'MeasureSource2',arg:conf.src2.toUpperCase(),cb:null,method:'set'}
                ],
                measType = [
                    {id:conf.ch,prop:'MeasureType',arg:conf.type,cb:measCmd,method:'set'}
                ];
            if (conf.type === undefined) {
                meascmd('error');
                return;
            }

            if (conf.src2 !== undefined) {
                self.dev.cmdSequence=self.dev.cmdSequence.concat(measSrc2);
            }

            self.dev.cmdSequence = self.dev.cmdSequence.concat(measSet);
            self.dev.cmdSequence = self.dev.cmdSequence.concat(measType);
            self.cmdEvent.emit('cmd_write', measSet);
        });
    }).bind(dsoObj);

/**
*   The method belong to dsoctrl class used to turn on statistics for all measure channels
*
*   @method statisticOn
*
*
*/
    dsoctrl.statisticOn = (function() {
        var self = this;

        return new Promise(function(resolve, reject) {
            function measCmd(e){
                if (e) {
                    reject(e);

                }else {
                    resolve();
                }

            };
            var measCmd = [
                {id:'sys',prop:'StatisticMode',arg:'ON',cb:measCmd,method:'set'}
            ];

            self.dev.cmdSequence = self.dev.cmdSequence.concat(measCmd);
            self.cmdEvent.emit('cmd_write', measCmd);
        });
    }).bind(dsoObj);

/**
*   The method belong to dsoctrl class used to turn off statistics for all measure channels
*
*   @method statisticOff
*
*
*/
    dsoctrl.statisticOff = (function() {
        var self = this;
        return new Promise(function(resolve, reject) {
            function statistic(e){
                if (e) {
                    reject(e);

                }else {
                    resolve();
                }

            };
            var sysCmd = [
                {id:'sys',prop:'StatisticMode',arg:'OFF',cb:statistic,method:'set'}
            ];

            self.dev.cmdSequence = self.dev.cmdSequence.concat(sysCmd);
            self.cmdEvent.emit('cmd_write', sysCmd);
        });
    }).bind(dsoObj);

/**
*   The method belong to dsoctrl class used to set the statistic weight all measure channels
*
*   @method statisticWeight
*   @param {Number} weight Specify statistic weight
*
*
*/
    dsoctrl.statisticWeight = (function(weight) {
        var self = this;
        return new Promise(function(resolve, reject) {
            function statistic(e){
                if (e) {
                    reject(e);

                }else {
                    resolve();
                }

            };
            var sysCmd = [
                {id:'sys',prop:'StatisticStaWeight',arg:weight,cb:statistic,method:'set'}
            ];

            self.dev.cmdSequence = self.dev.cmdSequence.concat(sysCmd);
            self.cmdEvent.emit('cmd_write', sysCmd);
        });
    }).bind(dsoObj);

/**
*
*
*/
    dsoctrl.qrcode = (function(ipaddr) {
        var self = this;
        return new Promise(function(resolve, reject) {
            function setDone(e){
                if (e) {
                    reject(e);

                }else {
                    resolve();
                }

            };

            let sysCmd = [
                {id:'sys', prop:'QRCode', arg:ipaddr, cb:null, method:'set'},
                {id:'sys', prop:'QRCodeTitle', arg:ipaddr, cb:setDone, method:'set'}
            ];

            self.dev.cmdSequence = self.dev.cmdSequence.concat(sysCmd);
            self.cmdEvent.emit('cmd_write', sysCmd);
        });
    }).bind(dsoObj);
/**
*
*
*/
    dsoctrl.qrcodeTitle = (function(title) {
        var self = this;
        return new Promise(function(resolve, reject) {
            function setDone(e){
                if (e) {
                    reject(e);

                }else {
                    resolve();
                }

            };
            var sysCmd = [
                {id:'sys',prop:'QRCodeTitle',arg:title,cb:setDone,method:'set'}
            ];

            self.dev.cmdSequence = self.dev.cmdSequence.concat(sysCmd);
            self.cmdEvent.emit('cmd_write', sysCmd);
        });
    }).bind(dsoObj);

/**
*   The method belong to dsoctrl class used to set the device into default state
*
*   @method run
*
*
*/
    dsoctrl.default = (function(){
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
    }).bind(dsoObj);
/**
*   The method belong to dsoctrl class used to set the device into run state
*
*   @method run
*
*
*/
    dsoctrl.run = (function(){
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
                {id:'sys',prop:'RUN',arg:'',cb:sysRun,method:'set'}
            ];

            self.dev.cmdSequence = self.dev.cmdSequence.concat(sysCmd);
            log('run :send cmd_write');
            self.cmdEvent.emit('cmd_write', sysCmd);
        });
    }).bind(dsoObj);

/**
*
*/
    dsoctrl.model = (function() {
        var self = this;

        console.log("get dso model");
        return new Promise(function(resolve, reject) {

            resolve({ model : self.dev.gdsModel , type : self.dev.gdsType });
        });
    }).bind(dsoObj);
/**
*
*/
    dsoctrl.type = (function() {
        var self = this;

        console.log("get dso type");
        return new Promise(function(resolve, reject) {
            resolve(self.dev.gdsType);
        });
    }).bind(dsoObj);


/**
*   The method belong to dsoctrl class used to set the device into stop state
*
*   @method stop
*
*/
    dsoctrl.stop = (function() {
        var self = this;
        return new Promise(function(resolve, reject) {
            function sysStop(e){
                if (e) {
                    log('stop cmd error');
                    reject(e);

                }else {
                    log('stop cmd success');
                    resolve();
                }

            };
            var sysCmd = [
                {id:'sys',prop:'STOP',arg:'',cb:sysStop,method:'set'}
            ];
            log('set dos stop');
            self.dev.cmdSequence = self.dev.cmdSequence.concat(sysCmd);
            self.cmdEvent.emit('cmd_write', sysCmd);
        });
    }).bind(dsoObj);

/**
*   The method belong to dsoctrl class used to set the device into single state
*
*   @method single
*
*/
    dsoctrl.single = (function() {
        var self = this;

        return new Promise(function(resolve, reject) {
            function sysSingle(e){
                if (e) {
                    reject(e);

                }else {
                    resolve();
                }

            };
            var sysCmd = [
                {id:'sys',prop:'SINGLE',arg:'',cb:sysSingle,method:'set'}
            ];

            self.dev.cmdSequence = self.dev.cmdSequence.concat(sysCmd);
            self.cmdEvent.emit('cmd_write', sysCmd);
        });
    }).bind(dsoObj);

/**
*   The method belong to dsoctrl class used to set the device into autoset state
*
*   @method Autoset
*
*/
    dsoctrl.autoset = (function(){
        var self = this;

        return new Promise(function(resolve, reject) {
            function sysAutoset(e){
                if (e) {
                    reject(e);

                }else {
                    resolve();
                }

            };
            var sysCmd = [
                {id:'sys',prop:'AUTOSET',arg:'',cb:sysAutoset,method:'set'}
            ];

            self.dev.cmdSequence = self.dev.cmdSequence.concat(sysCmd);
            self.cmdEvent.emit('cmd_write', sysCmd);
        });
    }).bind(dsoObj);

/**
*   The method belong to dsoctrl class used to set the device into force trigger state
*
*   @method force
*
*/
    dsoctrl.force = (function() {
        var self = this;

        return new Promise(function(resolve, reject) {
            function sysForce(e){
                if (e) {
                    reject(e);

                }else {
                    resolve();
                }

            };
            var sysCmd = [
                {id:'sys',prop:'FORCE',arg:'',cb:sysForce,method:'set'}
            ];

            self.dev.cmdSequence = self.dev.cmdSequence.concat(sysCmd);
            self.cmdEvent.emit('cmd_write', sysCmd);
        });
    }).bind(dsoObj);
/**
*
*/
    dsoctrl.clearEvent = (function() {
        var self = this;

        return new Promise(function(resolve, reject) {

            if(self.dev.writeTimeoutObj){
                clearTimeout(self.dev.writeTimeoutObj);
            }
            self.dev.asyncWrite = 'done';
            self.dev.queryBlock = false;
            self.dev.state.setTimeout=false;
            if(self.dev.state.timeoutObj){
                clearTimeout(self.dev.state.timeoutObj);
            }
            resolve();
        });
    }).bind(dsoObj);


/**
*
*
*   @method maxChNum
*
*/
    dsoctrl.maxch = (function() {
        var self = this;
        return new Promise(function(resolve, reject) {
            resolve(self.dev.maxChNum.toString());
        });
    }).bind(dsoObj);

    return dsoctrl;

}


var cmd_write = function() {
    var self = this;
    var cb = null;

    var cmd = [];
    // log(this.dev.cmdSequence);
    if (this.dev.asyncWrite === 'busy') {
        log('async write busy');
        log(this.dev.cmdSequence);
        if (this.dev.writeTimeoutObj === null) {
            log('set timeout retry cmd_write');
            this.dev.writeTimeoutObj = setTimeout(function() {
                log('cmd_write reissue');
                self.dev.writeTimeoutObj = null;
                cmd_write.call(self);
            },300);
        }
        return;
    }

    for (var i = 0, len = this.dev.cmdSequence.length; i < len; i++) {
        cmd[i] = this.dev.cmdSequence.shift();

        // avoid missing async callback, flush command buffer when find cb exist
        if (cmd[i].cb !== null){
            cb = cmd[i].cb;
            break;
        }
    }
    if(this.dev.state.conn ==='disconnect'){
        if (cb)
            cb(err);
        self.dev.asyncWrite = 'done';
        return;
    }
    if(cmd.length === 0){
        self.dev.asyncWrite = 'done';
        return;
    }
    self.dev.asyncWrite = 'busy';
    async.eachSeries(cmd,
        function(item,done) {
            log('async write command');
            log(item);
            if(item.method === 'set') {
                log(self['sys']);
                self[item.id].prop.set(item.prop, item.arg, function(err){
                    done(err);
                });
            }else {
                self[item.id].prop.get(item.prop, item.arg, function(err){
                    done(err);
                });
            }
        },function(err, results) {

            log('err: '+err);
            self.dev.asyncWrite = 'done';
            self.dev.state.conn = 'connected';
            log('async write done');

            if(err){
                self.dev.cmdSequence = [];
            }
            else if(self.dev.cmdSequence.length !== 0) {
                self.cmdEvent.emit('cmd_write', self.dev.cmdSequence);
            }

            if (cb)
                cb(err);
        }
    );
}

/**
*   Create new instance that used to communicate with instrument through Ethernet
*
*   @class dsoNet
*   @constructor
*   @extends dsoctrl
*   @param {string} port Port number bind to TCP socket
*   @param {string} host_addr Ip address bind to TCP socket
*
*   @return {Object} Return dsoctrl object
*/
exports.DsoNet  = function(port, host_addr) {
    // return new Promise(function(resolve, reject) {
    //     var dsoObj = _DsoObj();
    //     BindNetObj(dsoObj, port, host_addr);
    //     resolve(_DsoCtrl(dsoObj));
    // });

    var dsoObj = new _DsoObj();

    BindNetObj(dsoObj, port, host_addr);
    // this = _DsoCtrl(dsoObj);
    // return this;
    return _DsoCtrl(dsoObj);

};

/**
*   Create new instance that used to communicate with instrument through USB
*
*   @class dsoUSB
*   @constructor
*   @extends dsoctrl
*   @param {string} vid Vender ID bind to USB device
*   @param {string} pid Product ID bind to USB device
*
*   @return {Object} Return dsoctrl object
*/

exports.DsoUSB  = function(device) {

    // return new Promise(function(resolve, reject) {
    //     var dsoObj = _DsoObj();
    //     usbDev.BindUsbObj(dsoObj, vid, pid);
    //     resolve(_DsoCtrl(dsoObj));
    // });


    var dsoObj = new _DsoObj();
    // log(dsoObj);
    dsoObj.cmdEvent.on('cmd_write', function(cmd){
        log('trigger cmdEvent');
        cmd_write.call(dsoObj);
    });
    usbDev.BindUsbObj(dsoObj.dev, device);
    // this = _DsoCtrl(dsoObj);

    // return this;

    return _DsoCtrl(dsoObj);
};

/**
*   Show available net device.
*
*   @method showNetDevice
*   @return {Array} Array [ {name: , port: , addr: } , ...]
*
*/
exports.showNetDevice = function() {
    var devInfo=[];
    var i,len=availableNetDevice.length;

    for(i=0; i<len; i++){
        var info={};

        info.name = availableNetDevice[i].name;
        info.port = availableNetDevice[i].port;
        info.addr = availableNetDevice[i].addresses[1];
        devInfo.push(info);
    }
    return devInfo;
};



