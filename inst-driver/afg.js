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
var log = debug('afg:log');
var info = debug('afg:info');
var error = debug('afg:error');
var sysConstant=require('./sys/sysConstant.js');
var syscmd = require('./afg/system.js');
var am = require('./afg/am.js');
var fm = require('./afg/fm.js');
var pm = require('./afg/pm.js');
var sweep = require('./afg/sweep.js');
var fsk = require('./afg/fsk.js');
var sum = require('./afg/sum.js');
// var trigcmd = require('./afg/trigger.js');
// var acqcmd = require('./afg/acquire.js');
// var horcmd = require('./afg/horizontal.js');
// var mathcmd = require('./afg/math.js');
// var meascmd = require('./afg/measure.js');
var channel = require('./afg/channel.js');
var usbDev = require('./dev/devUsb.js');
var base = require('./dev/base.js');

// var cmdEvent = new EventEmitter();

//


// function sendIDN(){
// }



function getCmdObj() {
    var FilePath = path.join(__dirname, '/sys/afg-command.json');

    return JSON.parse(fs.readFileSync(FilePath));
}

/**
*   Create all needed private properties and method
*
*   @private
*   @constructor _AfgObj
*
*   @return {Object} Private method used to control DSO
*/
var _AfgObj = function() {


    this.dev = new base.Dev();
    // uitl.inherits(this.dev, base.Dev);
    //assign dso system command process method to afgObj.sys
    this.sys = syscmd.initSysObj.call(this, 'sys');
    this.ch1 = channel.initChanObj.call(this, 'ch1');
    this.ch2 = channel.initChanObj.call(this, 'ch2');
    this.am1 = am.initAMObj.call(this, 'am1');
    this.am2 = am.initAMObj.call(this, 'am2');
    this.fm1 = fm.initFMObj.call(this, 'fm1');
    this.fm2 = fm.initFMObj.call(this, 'fm2');
    this.pm1 = pm.initPMObj.call(this, 'pm1');
    this.pm2 = pm.initPMObj.call(this, 'pm2');
    // this.fsk1 = fsk.initFSKObj.call(this, 'fsk1');
    // this.fsk2 = fsk.initFSKObj.call(this, 'fsk2');
    // this.sum1 = sum.initSUMObj.call(this, 'sum1');
    // this.sum2 = sum.initSUMObj.call(this, 'sum2');
    this.sweep1 = sweep.initSweepObj.call(this, 'sweep1');
    this.sweep2 = sweep.initSweepObj.call(this, 'sweep2');
    this.cmdEvent = new EventEmitter();
    this.commandObj = getCmdObj();
    this.dev.commandObj = this.commandObj;
    return this;
};

/**
*   The class define all needed public properties and methods
*
*   @class afgctrl
*
*
*/
var _AfgCtrl = function(afgObj) {
    var afgctrl = {};

/**
*   The method belong to afgctrl class used to release device's resource.
*
*   @method closeDev
*   @return {null} null
*
*/
    afgctrl.closeDev = (function() {
        log('closeDev');
        var self = this;

        return new Promise(function(resolve, reject) {
            afgctrl.disconnect()
                .then(resolve)
                .catch(function(e){
                    reject(e);
                });
        });
    }).bind(afgObj);


// var all_the_types = mdns.browseThemAll();




/**
*   The method belong to afgctrl class used to connect to device,
*   connect method must be called and wait to complete before any afgctrl method.
*
*   @method connect
*
*
*/
    afgctrl.connect = (function() {
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
    }).bind(afgObj);
/**
*   The method belong to afgctrl class used to disconnect from device.
*
*   @method disconnect
*
*
*/
    afgctrl.disconnect = (function() {
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
    }).bind(afgObj);

/**
*
*/

    afgctrl.getSetup = (function() {
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
                                  type : self.ch1.type.slice(),
                                  state : self.ch1.state,
                                  // offsetUnit : "VDC",
                                  // freqUnit : "mHz",
                                  amplUnit : self.ch1.vunit,
                                  freq : self.ch1.freq,
                                  ampl : self.ch1.ampl,
                                  offset : self.ch1.offset,
                                  // func : "MOD",
                                  duty : self.ch1.duty,
                                  sym : self.ch1.sym,
                                  width: self.ch1.width,
                                  modulation : {
                                    // type : "am",
                                    am : {
                                      state : self.am1.state,
                                      source : self.am1.source,
                                      depth : self.am1.depth,
                                      freq : self.am1.freq,
                                      shape : self.am1.type
                                    },
                                    fm : {
                                      state : self.fm1.state,
                                      source : self.fm1.source,
                                      deviation : self.fm1.deviation,
                                      freq : self.fm1.freq,
                                      shape : self.fm1.type
                                    },
                                    pm : {
                                      state : self.pm1.state,
                                      source : self.pm1.source,
                                      deviation : self.pm1.deviation,
                                      freq : self.pm1.freq,
                                      shape : self.pm1.type
                                    }
                                  },
                                  sweep : {
                                      type : self.sweep1.type,
                                      source : self.sweep1.source,
                                      startfreq : self.sweep1.startfreq,
                                      stopfreq : self.sweep1.stopfreq,
                                      centerfreq : self.sweep1.centerfreq,
                                      span : self.sweep1.span,
                                      swptime : self.sweep1.swptime,
                                      markerfreq : self.sweep1.markerfreq,
                                      marker : self.sweep1.marker,
                                      state :  self.sweep1.state
                                  }
                              },
                              ch2 : {
                                  type : self.ch2.type,
                                  state : self.ch2.state,
                                  // offsetUnit : "VDC",
                                  // freqUnit : "mHz",
                                  amplUnit : self.ch2.vunit,
                                  freq : self.ch2.freq,
                                  ampl : self.ch2.ampl,
                                  offset : self.ch2.offset,
                                  // func : "MOD",
                                  duty : self.ch2.duty,
                                  sym : self.ch2.sym,
                                  width: self.ch2.width,
                                  modulation : {
                                    // type : "am",
                                    am : {
                                      state : self.am2.state,
                                      source : self.am2.source,
                                      depth : self.am2.depth,
                                      freq : self.am2.freq,
                                      shape : self.am2.type
                                    },
                                    fm : {
                                      state : self.fm2.state,
                                      source : self.fm2.source,
                                      deviation : self.fm2.deviation,
                                      freq : self.fm2.freq,
                                      shape : self.fm2.type
                                    },
                                    pm : {
                                      state : self.pm2.state,
                                      source : self.pm2.source,
                                      deviation : self.pm2.deviation,
                                      freq : self.pm2.freq,
                                      shape : self.pm2.type
                                    }
                                  },
                                  sweep : {
                                      type : self.sweep2.type,
                                      source : self.sweep2.source,
                                      startfreq : self.sweep2.startfreq,
                                      stopfreq : self.sweep2.stopfreq,
                                      centerfreq : self.sweep2.centerfreq,
                                      span : self.sweep2.span,
                                      swptime : self.sweep2.swptime,
                                      markerfreq : self.sweep2.markerfreq,
                                      marker : self.sweep2.marker,
                                      state :  self.sweep2.state
                                  }
                              }
                        }
                    });
                }

            };
            var cmd=[];
            var i;
            var chID=["ch1","ch2"];
            var amID = ["am1","am2"];
            var fmID = ["fm1","fm2"];
            var pmID = ["pm1","pm2"];
            var sweepID = ["sweep1","sweep2"];

            log("afg getSetup");
            for(i=0; i<self.dev.maxChNum; i++){
                cmd.push({id:chID[i], prop:'FuncType', arg:"", cb:null, method:'get'});
                cmd.push({id:chID[i], prop:'Freq', arg:"", cb:null, method:'get'});
                cmd.push({id:chID[i], prop:'Ampl',  arg:"", cb:null, method:'get'});
                cmd.push({id:chID[i], prop:'DCOffset', arg:"", cb:null, method:'get'});
                cmd.push({id:chID[i], prop:'RampSym', arg:"", cb:null, method:'get'});
                cmd.push({id:chID[i], prop:'OutputState', arg:"", cb:null, method:'get'});
                // cmd.push({id:chID[i], prop:'OutputLoad',arg:"", cb:null,method:'get'});
                cmd.push({id:chID[i], prop:'PulseWidth',arg:"", cb:null,method:'get'});
                cmd.push({id:chID[i], prop:'SquDuty',arg:"", cb:null,method:'get'});
                cmd.push({id:chID[i], prop:'VoltageUnit',arg:"", cb:null,method:'get'});

                cmd.push({id:amID[i],prop:'AMInteFunc',arg:"", cb:null,method:'get'});
                cmd.push({id:amID[i],prop:'AMInteFreq',arg:"", cb:null,method:'get'});
                cmd.push({id:amID[i], prop:'AMSource', arg:"", cb:null, method:'get'});
                cmd.push({id:amID[i], prop:'AMState', arg:"", cb:null, method:'get'});
                cmd.push({id:amID[i], prop:'AMDepth', arg:"", cb:null, method:'get'});

                cmd.push({id:fmID[i],prop:'FMInteFunc',arg:"", cb:null,method:'get'});
                cmd.push({id:fmID[i],prop:'FMInteFreq',arg:"", cb:null,method:'get'});
                cmd.push({id:fmID[i], prop:'FMSource', arg:"", cb:null, method:'get'});
                cmd.push({id:fmID[i], prop:'FMState', arg:"", cb:null, method:'get'});
                cmd.push({id:fmID[i], prop:'FMDeviation', arg:"", cb:null, method:'get'});

                cmd.push({id:pmID[i],prop:'PMInteFunc',arg:"", cb:null,method:'get'});
                cmd.push({id:pmID[i],prop:'PMInteFreq',arg:"", cb:null,method:'get'});
                cmd.push({id:pmID[i], prop:'PMSource', arg:"", cb:null, method:'get'});
                cmd.push({id:pmID[i], prop:'PMState', arg:"", cb:null, method:'get'});
                cmd.push({id:pmID[i], prop:'PMDeviation', arg:"", cb:null, method:'get'});

                cmd.push({id:sweepID[i], prop:'SweepState', arg:"", cb:null, method:'get'});
                cmd.push({id:sweepID[i], prop:'SweepFrqStart', arg:"", cb:null, method:'get'});
                cmd.push({id:sweepID[i], prop:'SweepFrqStop',  arg:"", cb:null, method:'get'});
                cmd.push({id:sweepID[i], prop:'SweepFrqCenter', arg:"", cb:null, method:'get'});
                cmd.push({id:sweepID[i], prop:'SweepFrqSpan', arg:"", cb:null, method:'get'});
                cmd.push({id:sweepID[i], prop:'SweepSpacing', arg:"", cb:null, method:'get'});
                cmd.push({id:sweepID[i], prop:'SweepTime',arg:"", cb:null,method:'get'});
                cmd.push({id:sweepID[i], prop:'SweepSource',arg:"", cb:null,method:'get'});
                cmd.push({id:sweepID[i], prop:'SweepMarker',arg:"", cb:null,method:'get'});
                cmd.push({id:sweepID[i], prop:'SweepMarkerFreq',arg:"", cb:null,method:'get'});

            }
            cmd[cmd.length-1].cb = getDone;
            self.dev.cmdSequence = self.dev.cmdSequence.concat(cmd);
            // log(self.dev.cmdSequence);
            self.cmdEvent.emit('cmd_write', cmd);
        });
    }).bind(afgObj);
/**
*
*/
    afgctrl.setSetup = (function(setup) {
        var self = this;

        return new Promise(function(resolve, reject) {
            function setDone(e){
                if (e) {
                    log("afg.setSetup error");
                    log(e);
                    reject(e);
                }else {
                    resolve();
                }
            };
            var cmd=[];
            var i;
            var chID=["ch1","ch2"];
            var amID = ["am1","am2"];
            var fmID = ["fm1","fm2"];
            var pmID = ["pm1","pm2"];
            var sweepID = ["sweep1","sweep2"];

            log("afg setSetup");
            log(setup);

            cmd.push({id:"sys", prop: 'RST', arg : "", cb:null, method:'set'});
            cmd.push({id:"sys", prop: 'delay_for_a_while', arg : 400, cb:null, method:'set'});
            for(i=0; i<self.dev.maxChNum; i++){
                cmd.push({id:"sys", prop: 'delay_for_a_while', arg : 400, cb:null, method:'set'});
                cmd.push({id:chID[i], prop:'FuncType', arg: setup.chProps[chID[i]].type.slice(0,-1), cb:null, method:'set'});
                cmd.push({id:"sys", prop: 'delay_for_a_while', arg : 400, cb:null, method:'set'});
                cmd.push({id:chID[i], prop:'Freq', arg: setup.chProps[chID[i]].freq.slice(0,-1), cb:null, method:'set'});
                cmd.push({id:"sys", prop: 'delay_for_a_while', arg : 400, cb:null, method:'set'});
                cmd.push({id:chID[i], prop:'Ampl',  arg: setup.chProps[chID[i]].ampl.slice(0,-1), cb:null, method:'set'});
                cmd.push({id:"sys", prop: 'delay_for_a_while', arg : 400, cb:null, method:'set'});
                cmd.push({id:chID[i], prop:'DCOffset', arg: setup.chProps[chID[i]].offset.slice(0,-1), cb:null, method:'set'});
                cmd.push({id:"sys", prop: 'delay_for_a_while', arg : 400, cb:null, method:'set'});
                cmd.push({id:chID[i], prop:'RampSym', arg: setup.chProps[chID[i]].sym.slice(0,-1), cb:null, method:'set'});
                cmd.push({id:"sys", prop: 'delay_for_a_while', arg : 400, cb:null, method:'set'});
                if(setup.chProps[chID[i]].state.slice(0,-1) === '0'){
                    cmd.push({id:chID[i], prop:'OutputState', arg: "OFF" , cb:null, method:'set'});
                }
                else{
                    cmd.push({id:chID[i], prop:'OutputState', arg: "ON", cb:null, method:'set'});
                }
                cmd.push({id:"sys", prop: 'delay_for_a_while', arg : 400, cb:null, method:'set'});
                // cmd.push({id:chID[i], prop:'OutputLoad',arg:"", cb:null,method:'set'});
                cmd.push({id:chID[i], prop:'SquDuty',arg: setup.chProps[chID[i]].duty.slice(0,-1), cb:null,method:'set'});
                cmd.push({id:"sys", prop: 'delay_for_a_while', arg : 400, cb:null, method:'set'});
                cmd.push({id:chID[i], prop:'VoltageUnit',arg: setup.chProps[chID[i]].amplUnit.slice(0,-1), cb:null,method:'set'});
                cmd.push({id:"sys", prop: 'delay_for_a_while', arg : 400, cb:null, method:'set'});
                cmd.push({id:amID[i],prop:'AMInteFunc',arg: setup.chProps[chID[i]].modulation.am.shape.slice(0,-1), cb:null,method:'set'});
                cmd.push({id:"sys", prop: 'delay_for_a_while', arg : 400, cb:null, method:'set'});
                cmd.push({id:amID[i],prop:'AMInteFreq',arg: setup.chProps[chID[i]].modulation.am.freq.slice(0,-1), cb:null,method:'set'});
                cmd.push({id:"sys", prop: 'delay_for_a_while', arg : 400, cb:null, method:'set'});
                cmd.push({id:amID[i], prop:'AMSource', arg: setup.chProps[chID[i]].modulation.am.source.slice(0,-1), cb:null, method:'set'});
                cmd.push({id:"sys", prop: 'delay_for_a_while', arg : 400, cb:null, method:'set'});
                if(setup.chProps[chID[i]].modulation.am.state.slice(0,-1) === '0'){
                    cmd.push({id:amID[i], prop:'AMState', arg: "OFF", cb:null, method:'set'});
                }
                else{
                    cmd.push({id:amID[i], prop:'AMState', arg: "ON", cb:null, method:'set'});
                }
                cmd.push({id:"sys", prop: 'delay_for_a_while', arg : 400, cb:null, method:'set'});

                cmd.push({id:amID[i], prop:'AMDepth', arg: setup.chProps[chID[i]].modulation.am.depth.slice(0,-1), cb:null, method:'set'});
                cmd.push({id:"sys", prop: 'delay_for_a_while', arg : 400, cb:null, method:'set'});
                cmd.push({id:fmID[i],prop:'FMInteFunc',arg: setup.chProps[chID[i]].modulation.fm.shape.slice(0,-1), cb:null,method:'set'});
                cmd.push({id:"sys", prop: 'delay_for_a_while', arg : 400, cb:null, method:'set'});
                cmd.push({id:fmID[i],prop:'FMInteFreq',arg: setup.chProps[chID[i]].modulation.fm.freq.slice(0,-1), cb:null,method:'set'});
                cmd.push({id:"sys", prop: 'delay_for_a_while', arg : 400, cb:null, method:'set'});
                cmd.push({id:fmID[i], prop:'FMSource', arg: setup.chProps[chID[i]].modulation.fm.source.slice(0,-1), cb:null, method:'set'});
                cmd.push({id:"sys", prop: 'delay_for_a_while', arg : 400, cb:null, method:'set'});
                if(setup.chProps[chID[i]].modulation.fm.state.slice(0,-1) === '0'){
                    cmd.push({id:fmID[i], prop:'FMState', arg: "OFF", cb:null, method:'set'});
                }
                else{
                    cmd.push({id:fmID[i], prop:'FMState', arg: "ON", cb:null, method:'set'});
                }
                cmd.push({id:"sys", prop: 'delay_for_a_while', arg : 400, cb:null, method:'set'});
                cmd.push({id:fmID[i], prop:'FMDeviation', arg: setup.chProps[chID[i]].modulation.fm.deviation.slice(0,-1), cb:null, method:'set'});
                cmd.push({id:"sys", prop: 'delay_for_a_while', arg : 400, cb:null, method:'set'});

                cmd.push({id:pmID[i],prop:'PMInteFunc',arg: setup.chProps[chID[i]].modulation.pm.shape.slice(0,-1), cb:null,method:'set'});
                cmd.push({id:"sys", prop: 'delay_for_a_while', arg : 400, cb:null, method:'set'});
                cmd.push({id:pmID[i],prop:'PMInteFreq',arg: setup.chProps[chID[i]].modulation.pm.freq.slice(0,-1), cb:null,method:'set'});
                cmd.push({id:"sys", prop: 'delay_for_a_while', arg : 400, cb:null, method:'set'});
                cmd.push({id:pmID[i], prop:'PMSource', arg: setup.chProps[chID[i]].modulation.pm.source.slice(0,-1), cb:null, method:'set'});
                cmd.push({id:"sys", prop: 'delay_for_a_while', arg : 400, cb:null, method:'set'});
                if(setup.chProps[chID[i]].modulation.pm.state.slice(0,-1) === '0'){
                    cmd.push({id:pmID[i], prop:'PMState', arg: "OFF", cb:null, method:'set'});
                }
                else{
                    cmd.push({id:pmID[i], prop:'PMState', arg: "ON", cb:null, method:'set'});
                }
                cmd.push({id:"sys", prop: 'delay_for_a_while', arg : 400, cb:null, method:'set'});
                cmd.push({id:pmID[i], prop:'PMDeviation', arg: setup.chProps[chID[i]].modulation.pm.deviation.slice(0,-1), cb:null, method:'set'});
                cmd.push({id:"sys", prop: 'delay_for_a_while', arg : 400, cb:null, method:'set'});

                if(setup.chProps[chID[i]].sweep.state.slice(0,-1) === '0'){
                    cmd.push({id:sweepID[i], prop:'SweepState', arg: "OFF", cb:null, method:'set'});
                }
                else{
                    cmd.push({id:sweepID[i], prop:'SweepState', arg: "ON", cb:null, method:'set'});
                }
                cmd.push({id:"sys", prop: 'delay_for_a_while', arg : 400, cb:null, method:'set'});
                cmd.push({id:sweepID[i], prop:'SweepFrqStart', arg: setup.chProps[chID[i]].sweep.startfreq.slice(0,-1), cb:null, method:'set'});
                cmd.push({id:"sys", prop: 'delay_for_a_while', arg : 400, cb:null, method:'set'});
                cmd.push({id:sweepID[i], prop:'SweepFrqStop',  arg: setup.chProps[chID[i]].sweep.stopfreq.slice(0,-1), cb:null, method:'set'});
                cmd.push({id:"sys", prop: 'delay_for_a_while', arg : 400, cb:null, method:'set'});
                cmd.push({id:sweepID[i], prop:'SweepFrqCenter', arg: setup.chProps[chID[i]].sweep.centerfreq.slice(0,-1), cb:null, method:'set'});
                cmd.push({id:"sys", prop: 'delay_for_a_while', arg : 400, cb:null, method:'set'});
                cmd.push({id:sweepID[i], prop:'SweepFrqSpan', arg: setup.chProps[chID[i]].sweep.span.slice(0,-1), cb:null, method:'set'});
                cmd.push({id:"sys", prop: 'delay_for_a_while', arg : 400, cb:null, method:'set'});
                cmd.push({id:sweepID[i], prop:'SweepSpacing', arg: setup.chProps[chID[i]].sweep.type.slice(0,-1), cb:null, method:'set'});
                cmd.push({id:"sys", prop: 'delay_for_a_while', arg : 400, cb:null, method:'set'});
                cmd.push({id:sweepID[i], prop:'SweepTime',arg: setup.chProps[chID[i]].sweep.swptime.slice(0,-1), cb:null,method:'set'});
                cmd.push({id:"sys", prop: 'delay_for_a_while', arg : 400, cb:null, method:'set'});
                cmd.push({id:sweepID[i], prop:'SweepSource',arg: setup.chProps[chID[i]].sweep.source.slice(0,-1), cb:null,method:'set'});
                cmd.push({id:"sys", prop: 'delay_for_a_while', arg : 400, cb:null, method:'set'});
                if(setup.chProps[chID[i]].sweep.marker.slice(0,-1) === '0'){
                    cmd.push({id:sweepID[i], prop:'SweepMarker',arg: "OFF", cb:null,method:'set'});
                }
                else{
                    cmd.push({id:sweepID[i], prop:'SweepMarker',arg: "ON", cb:null,method:'set'});
                }
                cmd.push({id:"sys", prop: 'delay_for_a_while', arg : 400, cb:null, method:'set'});
                cmd.push({id:sweepID[i], prop:'SweepMarkerFreq',arg: setup.chProps[chID[i]].sweep.markerfreq.slice(0,-1), cb:null,method:'set'});

            }
            cmd[cmd.length-1].cb = setDone;
            self.dev.cmdSequence = self.dev.cmdSequence.concat(cmd);
            // log(self.dev.cmdSequence);
            self.cmdEvent.emit('cmd_write', cmd);
        });
    }).bind(afgObj);

/**
*   The method belong to afgctrl class used to load horizontal properties from device,
*   like time division, position .. etc.
*
*   @method getChannel
*   @return {Object} chProperty
*
*/
/**
*   Channel property of device.
*
*   @property CHProperty
*   @type Object
*   @param {String} position Specify the distance with triggered pointer of the main window
*   @param {String} zposition Specify the distance with triggered pointer of the zoom window
*   @param {String} scale Specify the time divison of the main window
*   @param {String} zscale Specify the time divison of the zoom window
*   @param {String} mode Specify which mode device on
*   @param {String} expand Specify timebase expand by center or trigger position
*/
    afgctrl.getChannel = (function(chProp) {
        // this.GetSnapshot(callback);
        var self = this;
        var chNum = sysConstant.chID[chProp.ch];


        return new Promise(function(resolve, reject) {
            function getDone(e){
                if (e) {
                    reject(e);

                }else {
                    resolve(self[chProp.ch]);
                }

            };
            var cmd = [];

            log('chNum ='+chNum);
            log('maxChNum ='+self.dev.maxChNum);
            log(chProp);

            if(chNum === undefined){
                reject(['400','Parameter Error']);
                return;
            }

            if(chProp === undefined){

                reject(['400','Parameter Error']);
                return;
            }
            else{
                if(chProp.type!==undefined){
                    cmd.push({id:chProp.ch,prop:'FuncType',arg:chProp.type,cb:null,method:'get'});
                }
                if(chProp.freq!==undefined){
                    cmd.push({id:chProp.ch,prop:'Freq',arg:chProp.freq,cb:null,method:'get'});
                }
                if(chProp.ampl!==undefined){
                    cmd.push({id:chProp.ch,prop:'Ampl',arg:chProp.ampl,cb:null,method:'get'});
                }
                if(chProp.offset!==undefined){
                    cmd.push({id:chProp.ch,prop:'DCOffset',arg:chProp.offset,cb:null,method:'get'});
                }
                if(chProp.sym!==undefined){
                    cmd.push({id:chProp.ch,prop:'RampSym',arg:chProp.sym,cb:null,method:'get'});
                }
                if(chProp.load!==undefined){
                    cmd.push({id:chProp.ch,prop:'OutputLoad',arg:chProp.load,cb:null,method:'get'});
                }
                if(chProp.duty!==undefined){
                    cmd.push({id:chProp.ch,prop:'SquDuty',arg:chProp.load,cb:null,method:'get'});
                }
                if(chProp.vunit!==undefined){
                    cmd.push({id:chProp.ch,prop:'VoltageUnit',arg:chProp.vunit,cb:null,method:'get'});
                }
                if(chProp.state!==undefined){
                    cmd.push({id:chProp.ch,prop:'OutputState',arg:chProp.state,cb:null,method:'get'});
                }
                if(chProp.width!==undefined){
                    cmd.push({id:chProp.ch,prop:'PulseWidth',arg:chProp.vunit,cb:null,method:'get'});
                }

                if(cmd.length > 0){
                    cmd[cmd.length-1].cb = getDone;
                    self.dev.cmdSequence = self.dev.cmdSequence.concat(cmd);
                    // log(self.dev.cmdSequence);
                    self.cmdEvent.emit('cmd_write', cmd);
                }
                else{
                    cmd = [
                            {id:chProp.ch,prop:'FuncType',arg:'',cb:null,method:'get'},
                            {id:chProp.ch,prop:'Freq',arg:'',cb:null,method:'get'},
                            {id:chProp.ch,prop:'Ampl',arg:'',cb:null,method:'get'},
                            {id:chProp.ch,prop:'DCOffset',arg:'',cb:null,method:'get'},
                            {id:chProp.ch,prop:'RampSym',arg:'',cb:null,method:'get'},
                            {id:chProp.ch,prop:'OutputLoad',arg:'',cb:null,method:'get'},
                            {id:chProp.ch,prop:'PulseWidth',arg:'',cb:null,method:'get'},
                            {id:chProp.ch,prop:'PulsePeriod',arg:'',cb:null,method:'get'},
                            {id:chProp.ch,prop:'VoltageUnit',arg:'',cb:null,method:'get'},
                            {id:chProp.ch,prop:'OutputState',arg:'',cb:getDone,method:'get'}
                    ];
                    self.dev.cmdSequence = self.dev.cmdSequence.concat(cmd);
                    self.cmdEvent.emit('cmd_write', cmd);
                }
            }
        });
    }).bind(afgObj);

/**
*   The method belong to afgctrl class used to set horizontal properties to device,
*   like time division, position .. etc.
*
*   @method setChannel
*   @param {Object} horProperty
*
*/
/**
*   Channel property of device.
*
*   @property chProperty
*   @type Object
*   @param {String} position Specify the distance with triggered pointer of the main window
*   @param {String} zposition Specify the distance with triggered pointer of the zoom window
*   @param {String} scale Specify the time divison of the main window
*   @param {String} zscale Specify the time divison of the zoom window
*   @param {String} mode Specify which mode device on
*   @param {String} expand Specify timebase expand by center or trigger position
*/
    afgctrl.setChannel = (function(chProp) {
        // this.GetSnapshot(callback);
        var self = this;
        var chNum = sysConstant.chID[chProp.ch];

        return new Promise(function(resolve, reject) {
            var cmd=[];
            function setDone(e){
                if (e) {
                    reject(e);

                }else {
                    resolve();
                }

            };

            log('chNum ='+chNum);
            log('maxChNum ='+self.dev.maxChNum);
            log(chProp);

            if((chNum === undefined) || (chNum >= self.dev.maxChNum)){
                reject(['400','Parameter Error']);
                return;
            }

            if(chProp === undefined){

                reject(['400','Parameter Error']);
                return;
            }
            else{
                if(chProp.type!==undefined){
                    cmd.push({id:chProp.ch,prop:'FuncType',arg:chProp.type,cb:null,method:'set'});
                }
                if(chProp.freq!==undefined){
                    cmd.push({id:chProp.ch,prop:'Freq',arg:chProp.freq,cb:null,method:'set'});
                }
                if(chProp.ampl!==undefined){
                    cmd.push({id:chProp.ch,prop:'Ampl',arg:chProp.ampl,cb:null,method:'set'});
                }
                if(chProp.sym!==undefined){
                    cmd.push({id:chProp.ch,prop:'RampSym',arg:chProp.sym,cb:null,method:'set'});
                }
                if(chProp.load!==undefined){
                    cmd.push({id:chProp.ch,prop:'OutputLoad',arg:chProp.load,cb:null,method:'set'});
                }
                if(chProp.offset!==undefined){
                    cmd.push({id:chProp.ch,prop:'DCOffset',arg:chProp.offset,cb:null,method:'set'});
                }
                if(chProp.duty!==undefined){
                    cmd.push({id:chProp.ch,prop:'SquDuty',arg:chProp.duty,cb:null,method:'set'});
                }
                if(chProp.vunit!==undefined){
                    cmd.push({id:chProp.ch,prop:'VoltageUnit',arg:chProp.vunit,cb:null,method:'set'});
                }
                if(chProp.state!==undefined){
                    cmd.push({id:chProp.ch,prop:'OutputState',arg:chProp.state,cb:null,method:'set'});
                }
                if(chProp.width!==undefined){
                    cmd.push({id:chProp.ch,prop:'PulseWidth',arg:chProp.width,cb:null,method:'set'});
                }
                if(cmd.length > 0){
                    cmd[cmd.length-1].cb = setDone;
                    self.dev.cmdSequence = self.dev.cmdSequence.concat(cmd);
                    log(self.dev.cmdSequence);
                    self.cmdEvent.emit('cmd_write', cmd);
                }
                else{
                    log('setHorizontal do nothing');
                    resolve();
                }
            }
        });
    }).bind(afgObj);

/**
*   The method belong to afgctrl class used to load horizontal properties from device,
*   like time division, position .. etc.
*
*   @method getAM
*   @return {Object} amProperty
*
*/
/**
*   Channel property of device.
*
*   @property amProperty
*   @type Object
*   @param {String} position Specify the distance with triggered pointer of the main window
*   @param {String} zposition Specify the distance with triggered pointer of the zoom window
*   @param {String} scale Specify the time divison of the main window
*   @param {String} zscale Specify the time divison of the zoom window
*   @param {String} mode Specify which mode device on
*   @param {String} expand Specify timebase expand by center or trigger position
*/
    afgctrl.getAM = (function(amProp) {
        // this.GetSnapshot(callback);
        var self = this;
        var chNum = sysConstant.chID[amProp.ch];


        return new Promise(function(resolve, reject) {
            function getDone(e){
                if (e) {
                    reject(e);

                }else {
                    resolve(self[amProp.ch]);
                }

            };
            var cmd = [];

            log('amProp =');
            log(amProp);
            log('chNum ='+chNum);
            log('maxChNum ='+self.dev.maxChNum);
            log(amProp);

            if(chNum === undefined){
                reject(['400','Parameter Error']);
                return;
            }

            if(amProp === undefined){

                reject(['400','Parameter Error']);
                return;
            }
            else{
                if(amProp.type!==undefined){
                    cmd.push({id:amProp.ch,prop:'AMInteFunc',arg:amProp.type,cb:null,method:'get'});
                }
                if(amProp.freq!==undefined){
                    cmd.push({id:amProp.ch,prop:'AMInteFreq',arg:amProp.freq,cb:null,method:'get'});
                }
                if(amProp.source!==undefined){
                    cmd.push({id:amProp.ch,prop:'AMSource',arg:amProp.source,cb:null,method:'get'});
                }
                if(amProp.depth!==undefined){
                    cmd.push({id:amProp.ch,prop:'AMDepth',arg:amProp.depth,cb:null,method:'get'});
                }
                if(amProp.state!==undefined){
                    cmd.push({id:amProp.ch,prop:'AMState',arg:amProp.state,cb:null,method:'get'});
                }

                if(cmd.length > 0){
                    cmd[cmd.length-1].cb = getDone;
                    self.dev.cmdSequence = self.dev.cmdSequence.concat(cmd);
                    // log(self.dev.cmdSequence);
                    self.cmdEvent.emit('cmd_write', cmd);
                }
                else{
                    cmd = [
                            {id:amProp.ch,prop:'AMInteFunc',arg:'',cb:null,method:'get'},
                            {id:amProp.ch,prop:'AMInteFreq',arg:'',cb:null,method:'get'},
                            {id:amProp.ch,prop:'AMSource',arg:'',cb:null,method:'get'},
                            {id:amProp.ch,prop:'AMDepth',arg:'',cb:null,method:'get'},
                            {id:amProp.ch,prop:'AMState',arg:'',cb:getDone,method:'get'}
                    ];
                    self.dev.cmdSequence = self.dev.cmdSequence.concat(cmd);
                    self.cmdEvent.emit('cmd_write', cmd);
                }
            }
        });
    }).bind(afgObj);

/**
*   The method belong to afgctrl class used to set horizontal properties to device,
*   like time division, position .. etc.
*
*   @method setChannel
*   @param {Object} horProperty
*
*/
/**
*   Channel property of device.
*
*   @property amProperty
*   @type Object
*   @param {String} position Specify the distance with triggered pointer of the main window
*   @param {String} zposition Specify the distance with triggered pointer of the zoom window
*   @param {String} scale Specify the time divison of the main window
*   @param {String} zscale Specify the time divison of the zoom window
*   @param {String} mode Specify which mode device on
*   @param {String} expand Specify timebase expand by center or trigger position
*/
    afgctrl.setAM = (function(amProp) {
        // this.GetSnapshot(callback);
        var self = this;
        var chNum = sysConstant.chID[amProp.ch];

        return new Promise(function(resolve, reject) {
            var cmd=[];
            function setDone(e){
                if (e) {
                    reject(e);

                }else {
                    resolve();
                }

            };


            log('chNum ='+chNum);

            log('maxChNum ='+self.dev.maxChNum);
            log(amProp);

            if((chNum === undefined) || (chNum >= self.dev.maxChNum)){
                reject(['400','Parameter Error']);
                return;
            }

            if(amProp === undefined){

                reject(['400','Parameter Error']);
                return;
            }
            else{
                if(amProp.type!==undefined){
                    cmd.push({id:amProp.ch,prop:'AMInteFunc',arg:amProp.type,cb:null,method:'set'});
                }
                if(amProp.freq!==undefined){
                    cmd.push({id:amProp.ch,prop:'AMInteFreq',arg:amProp.freq,cb:null,method:'set'});
                }
                if(amProp.source!==undefined){
                    cmd.push({id:amProp.ch,prop:'AMSource',arg:amProp.source,cb:null,method:'set'});
                }
                if(amProp.depth!==undefined){
                    cmd.push({id:amProp.ch,prop:'AMDepth',arg:amProp.depth,cb:null,method:'set'});
                }
                if(amProp.state!==undefined){
                    cmd.push({id:amProp.ch,prop:'AMState',arg:amProp.state,cb:null,method:'set'});
                }
                if(cmd.length > 0){
                    cmd[cmd.length-1].cb = setDone;
                    self.dev.cmdSequence = self.dev.cmdSequence.concat(cmd);
                    // log(self.dev.cmdSequence);
                    self.cmdEvent.emit('cmd_write', cmd);
                }
                else{
                    log('setAM do nothing');
                    resolve();
                }
            }
        });
    }).bind(afgObj);

/**
*   The method belong to afgctrl class used to load horizontal properties from device,
*   like time division, position .. etc.
*
*   @method getFM
*   @return {Object} fmProperty
*
*/
/**
*   Channel property of device.
*
*   @property fmProperty
*   @type Object
*   @param {String} position Specify the distance with triggered pointer of the main window
*   @param {String} zposition Specify the distance with triggered pointer of the zoom window
*   @param {String} scale Specify the time divison of the main window
*   @param {String} zscale Specify the time divison of the zoom window
*   @param {String} mode Specify which mode device on
*   @param {String} expand Specify timebase expand by center or trigger position
*/
    afgctrl.getFM = (function(fmProp) {
        // this.GetSnapshot(callback);
        var self = this;
        var chNum = sysConstant.chID[fmProp.ch];


        return new Promise(function(resolve, reject) {
            function getDone(e){
                if (e) {
                    reject(e);
                }else {
                    resolve(self[fmProp.ch]);
                }

            };
            var cmd = [];

            log('fmProp =');
            log(fmProp);
            log('chNum ='+chNum);
            log('maxChNum ='+self.dev.maxChNum);
            log(fmProp);

            if(chNum === undefined){
                reject(['400','Parameter Error']);
                return;
            }

            if(fmProp === undefined){

                reject(['400','Parameter Error']);
                return;
            }
            else{
                if(fmProp.type!==undefined){
                    cmd.push({id:fmProp.ch,prop:'FMInteFunc',arg:fmProp.type,cb:null,method:'get'});
                }
                if(fmProp.freq!==undefined){
                    cmd.push({id:fmProp.ch,prop:'FMInteFreq',arg:fmProp.freq,cb:null,method:'get'});
                }
                if(fmProp.source!==undefined){
                    cmd.push({id:fmProp.ch,prop:'FMSource',arg:fmProp.source,cb:null,method:'get'});
                }
                if(fmProp.deviation!==undefined){
                    cmd.push({id:fmProp.ch,prop:'FMDeviation',arg:fmProp.deviation,cb:null,method:'get'});
                }
                if(fmProp.state!==undefined){
                    cmd.push({id:fmProp.ch,prop:'FMState',arg:fmProp.state,cb:null,method:'get'});
                }

                if(cmd.length > 0){
                    cmd[cmd.length-1].cb = getDone;
                    self.dev.cmdSequence = self.dev.cmdSequence.concat(cmd);
                    // log(self.dev.cmdSequence);
                    self.cmdEvent.emit('cmd_write', cmd);
                }
                else{
                    cmd = [
                            {id:fmProp.ch,prop:'FMInteFunc',arg:'',cb:null,method:'get'},
                            {id:fmProp.ch,prop:'FMInteFreq',arg:'',cb:null,method:'get'},
                            {id:fmProp.ch,prop:'FMSource',arg:'',cb:null,method:'get'},
                            {id:fmProp.ch,prop:'FMDeviation',arg:'',cb:null,method:'get'},
                            {id:fmProp.ch,prop:'FMState',arg:'',cb:getDone,method:'get'}
                    ];
                    self.dev.cmdSequence = self.dev.cmdSequence.concat(cmd);
                    self.cmdEvent.emit('cmd_write', cmd);
                }
            }
        });
    }).bind(afgObj);

/**
*   The method belong to afgctrl class used to set horizontal properties to device,
*   like time division, position .. etc.
*
*   @method setFM
*   @param {Object} horProperty
*
*/
/**
*   Channel property of device.
*
*   @property fmProperty
*   @type Object
*   @param {String} position Specify the distance with triggered pointer of the main window
*   @param {String} zposition Specify the distance with triggered pointer of the zoom window
*   @param {String} scale Specify the time divison of the main window
*   @param {String} zscale Specify the time divison of the zoom window
*   @param {String} mode Specify which mode device on
*   @param {String} expand Specify timebase expand by center or trigger position
*/
    afgctrl.setFM = (function(fmProp) {
        // this.GetSnapshot(callback);
        var self = this;
        var chNum = sysConstant.chID[fmProp.ch];

        return new Promise(function(resolve, reject) {
            var cmd=[];
            function setDone(e){
                if (e) {
                    reject(e);

                }else {
                    resolve();
                }

            };


            log('chNum ='+chNum);

            log('maxChNum ='+self.dev.maxChNum);
            log(fmProp);

            if((chNum === undefined) || (chNum >= self.dev.maxChNum)){
                reject(['400','Parameter Error']);
                return;
            }

            if(fmProp === undefined){

                reject(['400','Parameter Error']);
                return;
            }
            else{
                if(fmProp.type!==undefined){
                    cmd.push({id:fmProp.ch,prop:'FMInteFunc',arg:fmProp.type,cb:null,method:'set'});
                }
                if(fmProp.freq!==undefined){
                    cmd.push({id:fmProp.ch,prop:'FMInteFreq',arg:fmProp.freq,cb:null,method:'set'});
                }
                if(fmProp.source!==undefined){
                    cmd.push({id:fmProp.ch,prop:'FMSource',arg:fmProp.source,cb:null,method:'set'});
                }
                if(fmProp.deviation!==undefined){
                    cmd.push({id:fmProp.ch,prop:'FMDevation',arg:fmProp.deviation,cb:null,method:'set'});
                }
                if(fmProp.state!==undefined){
                    cmd.push({id:fmProp.ch,prop:'FMState',arg:fmProp.state,cb:null,method:'set'});
                }
                if(cmd.length > 0){
                    cmd[cmd.length-1].cb = setDone;
                    self.dev.cmdSequence = self.dev.cmdSequence.concat(cmd);
                    // log(self.dev.cmdSequence);
                    self.cmdEvent.emit('cmd_write', cmd);
                }
                else{
                    log('setFM do nothing');
                    resolve();
                }
            }
        });
    }).bind(afgObj);


/**
*   The method belong to afgctrl class used to load horizontal properties from device,
*   like time division, position .. etc.
*
*   @method getPM
*   @return {Object} fmProperty
*
*/
/**
*   Channel property of device.
*
*   @property pmProperty
*   @type Object
*   @param {String} position Specify the distance with triggered pointer of the main window
*   @param {String} zposition Specify the distance with triggered pointer of the zoom window
*   @param {String} scale Specify the time divison of the main window
*   @param {String} zscale Specify the time divison of the zoom window
*   @param {String} mode Specify which mode device on
*   @param {String} expand Specify timebase expand by center or trigger position
*/
    afgctrl.getPM = (function(pmProp) {
        // this.GetSnapshot(callback);
        var self = this;
        var chNum = sysConstant.chID[pmProp.ch];


        return new Promise(function(resolve, reject) {
            function getDone(e){
                if (e) {
                    reject(e);
                }else {
                    resolve(self[pmProp.ch]);
                }

            };
            var cmd = [];

            log('pmProp =');
            log(pmProp);
            log('chNum ='+chNum);
            log('maxChNum ='+self.dev.maxChNum);
            log(pmProp);

            if(chNum === undefined){
                reject(['400','Parameter Error']);
                return;
            }

            if(pmProp === undefined){

                reject(['400','Parameter Error']);
                return;
            }
            else{
                if(pmProp.type!==undefined){
                    cmd.push({id:pmProp.ch,prop:'PMInteFunc',arg:pmProp.type,cb:null,method:'get'});
                }
                if(pmProp.freq!==undefined){
                    cmd.push({id:pmProp.ch,prop:'PMInteFreq',arg:pmProp.freq,cb:null,method:'get'});
                }
                if(pmProp.source!==undefined){
                    cmd.push({id:pmProp.ch,prop:'PMSource',arg:pmProp.source,cb:null,method:'get'});
                }
                if(pmProp.deviation!==undefined){
                    cmd.push({id:pmProp.ch,prop:'PMDeviation',arg:pmProp.deviation,cb:null,method:'get'});
                }
                if(pmProp.state!==undefined){
                    cmd.push({id:pmProp.ch,prop:'PMState',arg:pmProp.state,cb:null,method:'get'});
                }

                if(cmd.length > 0){
                    cmd[cmd.length-1].cb = getDone;
                    self.dev.cmdSequence = self.dev.cmdSequence.concat(cmd);
                    // log(self.dev.cmdSequence);
                    self.cmdEvent.emit('cmd_write', cmd);
                }
                else{
                    cmd = [
                            {id:pmProp.ch,prop:'PMInteFunc',arg:'',cb:null,method:'get'},
                            {id:pmProp.ch,prop:'PMInteFreq',arg:'',cb:null,method:'get'},
                            {id:pmProp.ch,prop:'PMSource',arg:'',cb:null,method:'get'},
                            {id:pmProp.ch,prop:'PMDeviation',arg:'',cb:null,method:'get'},
                            {id:pmProp.ch,prop:'PMState',arg:'',cb:getDone,method:'get'}
                    ];
                    self.dev.cmdSequence = self.dev.cmdSequence.concat(cmd);
                    self.cmdEvent.emit('cmd_write', cmd);
                }
            }
        });
    }).bind(afgObj);

/**
*   The method belong to afgctrl class used to set horizontal properties to device,
*   like time division, position .. etc.
*
*   @method setFM
*   @param {Object} horProperty
*
*/
/**
*   Channel property of device.
*
*   @property fmProperty
*   @type Object
*   @param {String} position Specify the distance with triggered pointer of the main window
*   @param {String} zposition Specify the distance with triggered pointer of the zoom window
*   @param {String} scale Specify the time divison of the main window
*   @param {String} zscale Specify the time divison of the zoom window
*   @param {String} mode Specify which mode device on
*   @param {String} expand Specify timebase expand by center or trigger position
*/
    afgctrl.setPM = (function(pmProp) {
        // this.GetSnapshot(callback);
        var self = this;
        var chNum = sysConstant.chID[pmProp.ch];

        return new Promise(function(resolve, reject) {
            var cmd=[];
            function setDone(e){
                if (e) {
                    reject(e);

                }else {
                    resolve();
                }

            };


            log('chNum ='+chNum);

            log('maxChNum ='+self.dev.maxChNum);
            log(pmProp);

            if((chNum === undefined) || (chNum >= self.dev.maxChNum)){
                reject(['400','Parameter Error']);
                return;
            }

            if(pmProp === undefined){

                reject(['400','Parameter Error']);
                return;
            }
            else{
                if(pmProp.type!==undefined){
                    cmd.push({id:pmProp.ch,prop:'PMInteFunc',arg:pmProp.type,cb:null,method:'set'});
                }
                if(pmProp.freq!==undefined){
                    cmd.push({id:pmProp.ch,prop:'PMInteFreq',arg:pmProp.freq,cb:null,method:'set'});
                }
                if(pmProp.source!==undefined){
                    cmd.push({id:pmProp.ch,prop:'PMSource',arg:pmProp.source,cb:null,method:'set'});
                }
                if(pmProp.deviation!==undefined){
                    cmd.push({id:pmProp.ch,prop:'PMDevation',arg:pmProp.deviation,cb:null,method:'set'});
                }
                if(pmProp.state!==undefined){
                    cmd.push({id:pmProp.ch,prop:'PMState',arg:pmProp.state,cb:null,method:'set'});
                }
                if(cmd.length > 0){
                    cmd[cmd.length-1].cb = setDone;
                    self.dev.cmdSequence = self.dev.cmdSequence.concat(cmd);
                    // log(self.dev.cmdSequence);
                    self.cmdEvent.emit('cmd_write', cmd);
                }
                else{
                    log('setPM do nothing');
                    resolve();
                }
            }
        });
    }).bind(afgObj);

//
/**
*   The method belong to afgctrl class used to load horizontal properties from device,
*   like time division, position .. etc.
*
*   @method getPM
*   @return {Object} fmProperty
*
*/
/**
*   Channel property of device.
*
*   @property pmProperty
*   @type Object
*   @param {String} position Specify the distance with triggered pointer of the main window
*   @param {String} zposition Specify the distance with triggered pointer of the zoom window
*   @param {String} scale Specify the time divison of the main window
*   @param {String} zscale Specify the time divison of the zoom window
*   @param {String} mode Specify which mode device on
*   @param {String} expand Specify timebase expand by center or trigger position
*/
    afgctrl.getModProp = (function(modProp) {
        // this.GetSnapshot(callback);
        var self = this;
        var chNum = sysConstant.chID[modProp.ch];


        return new Promise(function(resolve, reject) {
            function getDone(e){
                if (e) {
                    reject(e);
                }else {
                    resolve(self[modProp.ch]);
                }

            };
            var cmd = [];

            log('modProp =');
            log(modProp);
            log('chNum ='+chNum);
            log('maxChNum ='+self.dev.maxChNum);
            log(modProp);

            if(chNum === undefined){
                reject(['400','Parameter Error']);
                return;
            }

            if(modProp === undefined){

                reject(['400','Parameter Error']);
                return;
            }
            else{
                if(modProp.type!==undefined){
                    if((modProp.ch === 'fsk1') || (modProp.ch === 'fsk2')){
                        reject(['400','Parameter Error']);
                    }
                    cmd.push({id:modProp.ch, prop:sysConstant.afgModCmd[modProp.ch].type, arg:modProp.type, cb:null, method:'get'});
                }
                if(modProp.freq!==undefined){
                    cmd.push({id:modProp.ch, prop:sysConstant.afgModCmd[modProp.ch].freq, arg:modProp.freq, cb:null, method:'get'});
                }
                if(modProp.source!==undefined){
                    cmd.push({id:modProp.ch, prop:sysConstant.afgModCmd[modProp.ch].source, arg:modProp.source, cb:null, method:'get'});
                }
                if(modProp.deviation!==undefined){
                    if((modProp.ch === 'fm1') || (modProp.ch === 'fm2') || (modProp.ch === 'pm1') || (modProp.ch === 'pm2')){
                        cmd.push({id:modProp.ch, prop:sysConstant.afgModCmd[modProp.ch].deviation, arg:modProp.deviation, cb:null, method:'get'});
                    }
                    else{
                        reject(['400','Parameter Error']);
                    }
                }
                if(modProp.state!==undefined){
                    if((modProp.ch === 'sum1') || (modProp.ch === 'sum2')){
                        reject(['400','Parameter Error']);
                    }
                    cmd.push({id:modProp.ch, prop:sysConstant.afgModCmd[modProp.ch].state, arg:modProp.state, cb:null, method:'get'});
                }
                if(modProp.depth!==undefined){
                    if((modProp.ch === 'am1') || (modProp.ch === 'am2')){
                        cmd.push({id:modProp.ch, prop:sysConstant.afgModCmd[modProp.ch].depth, arg:modProp.depth, cb:null, method:'get'});
                    }
                    else{
                        reject(['400','Parameter Error']);
                    }
                }
                if(modProp.rate!==undefined){
                    if((modProp.ch === 'fsk1') || (modProp.ch === 'fsk2')){
                        cmd.push({id:modProp.ch, prop:sysConstant.afgModCmd[modProp.ch].rate, arg:modProp.rate, cb:null, method:'get'});
                    }
                    else{
                        reject(['400','Parameter Error']);
                    }
                }
                if(modProp.ampl!==undefined){
                    if((modProp.ch === 'sum1') || (modProp.ch === 'sum2')){
                        cmd.push({id:modProp.ch, prop:sysConstant.afgModCmd[modProp.ch].ampl, arg:modProp.ampl, cb:null, method:'get'});
                    }
                    else{
                        reject(['400','Parameter Error']);
                    }
                }
                if(cmd.length > 0){
                    cmd[cmd.length-1].cb = getDone;
                    self.dev.cmdSequence = self.dev.cmdSequence.concat(cmd);
                    // log(self.dev.cmdSequence);
                    self.cmdEvent.emit('cmd_write', cmd);
                }
                else{
                    // cmd = [
                    //         {id:modProp.ch,prop:'PMInteFunc',arg:'',cb:null,method:'get'},
                    //         {id:modProp.ch,prop:'PMInteFreq',arg:'',cb:null,method:'get'},
                    //         {id:modProp.ch,prop:'PMSource',arg:'',cb:null,method:'get'},
                    //         {id:modProp.ch,prop:'PMDeviation',arg:'',cb:null,method:'get'},
                    //         {id:modProp.ch,prop:'PMState',arg:'',cb:getDone,method:'get'}
                    // ];
                    // self.dev.cmdSequence = self.dev.cmdSequence.concat(cmd);
                    // self.cmdEvent.emit('cmd_write', cmd);
                    log('getModProp do nothing');
                    reject(['400','Parameter Error']);
                }
            }
        });
    }).bind(afgObj);

/**
*   The method belong to afgctrl class used to set Modulation properties to device,
*   like time division, position .. etc.
*
*   @method setFM
*   @param {Object} modProperty
*
*/
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
    afgctrl.setModProp = (function(modProp) {
        // this.GetSnapshot(callback);
        var self = this;
        var chNum = sysConstant.chID[modProp.ch];

        return new Promise(function(resolve, reject) {
            var cmd=[];
            function setDone(e){
                if (e) {
                    reject(e);

                }else {
                    resolve();
                }

            };


            log('chNum ='+chNum);

            log('maxChNum ='+self.dev.maxChNum);
            log(modProp);

            if((chNum === undefined) || (chNum >= self.dev.maxChNum)){
                reject(['400','Parameter Error']);
                return;
            }

            if(modProp === undefined){

                reject(['400','Parameter Error']);
                return;
            }
            else{
                if(modProp.type!==undefined){
                    if((modProp.ch === 'fsk1') || (modProp.ch === 'fsk2')){
                        reject(['400','Parameter Error']);
                    }
                    cmd.push({id:modProp.ch, prop:sysConstant.afgModCmd[modProp.ch].type, arg:modProp.type, cb:null, method:'set'});
                }
                if(modProp.freq!==undefined){
                    cmd.push({id:modProp.ch, prop:sysConstant.afgModCmd[modProp.ch].freq, arg:modProp.freq, cb:null, method:'set'});
                }
                if(modProp.source!==undefined){
                    cmd.push({id:modProp.ch, prop:sysConstant.afgModCmd[modProp.ch].source, arg:modProp.source, cb:null, method:'set'});
                }
                if(modProp.deviation!==undefined){
                    if((modProp.ch === 'fm1') || (modProp.ch === 'fm2') || (modProp.ch === 'pm1') || (modProp.ch === 'pm2')){
                        cmd.push({id:modProp.ch, prop:sysConstant.afgModCmd[modProp.ch].deviation, arg:modProp.deviation, cb:null, method:'set'});
                    }
                    else{
                        reject(['400','Parameter Error']);
                    }
                }
                if(modProp.state!==undefined){
                    if((modProp.ch === 'sum1') || (modProp.ch === 'sum2')){
                        reject(['400','Parameter Error']);
                    }
                    cmd.push({id:modProp.ch, prop:sysConstant.afgModCmd[modProp.ch].state, arg:modProp.state, cb:null, method:'set'});
                }
                if(modProp.depth!==undefined){
                    if((modProp.ch === 'am1') || (modProp.ch === 'am2')){
                        cmd.push({id:modProp.ch, prop:sysConstant.afgModCmd[modProp.ch].depth, arg:modProp.depth, cb:null, method:'set'});
                    }
                    else{
                        reject(['400','Parameter Error']);
                    }
                }
                if(modProp.rate!==undefined){
                    if((modProp.ch === 'fsk1') || (modProp.ch === 'fsk2')){
                        cmd.push({id:modProp.ch, prop:sysConstant.afgModCmd[modProp.ch].rate, arg:modProp.rate, cb:null, method:'set'});
                    }
                    else{
                        reject(['400','Parameter Error']);
                    }
                }
                if(modProp.ampl!==undefined){
                    if((modProp.ch === 'sum1') || (modProp.ch === 'sum2')){
                        cmd.push({id:modProp.ch, prop:sysConstant.afgModCmd[modProp.ch].ampl, arg:modProp.ampl, cb:null, method:'set'});
                    }
                    else{
                        reject(['400','Parameter Error']);
                    }
                }
                if(cmd.length > 0){
                    cmd[cmd.length-1].cb = setDone;
                    self.dev.cmdSequence = self.dev.cmdSequence.concat(cmd);
                    // log(self.dev.cmdSequence);
                    self.cmdEvent.emit('cmd_write', cmd);
                }
                else{
                    log('setModProp do nothing');
                    reject(['400','Parameter Error']);
                }
            }
        });
    }).bind(afgObj);


//
/**
*   The method belong to afgctrl class used to load horizontal properties from device,
*   like time division, position .. etc.
*
*   @method getPM
*   @return {Object} fmProperty
*
*/
/**
*   Channel property of device.
*
*   @property pmProperty
*   @type Object
*   @param {String} position Specify the distance with triggered pointer of the main window
*   @param {String} zposition Specify the distance with triggered pointer of the zoom window
*   @param {String} scale Specify the time divison of the main window
*   @param {String} zscale Specify the time divison of the zoom window
*   @param {String} mode Specify which mode device on
*   @param {String} expand Specify timebase expand by center or trigger position
*/
    afgctrl.getSweepProp = (function(sweepProps) {
        // this.GetSnapshot(callback);
        var self = this;
        var chNum = sysConstant.chID[sweepProps.ch];


        return new Promise(function(resolve, reject) {
            function getDone(e){
                if (e) {
                    reject(e);
                }else {
                    resolve(self[sweepProps.ch]);
                }

            };
            var cmd = [];

            log('sweepProps =');
            log(sweepProps);
            log('chNum ='+chNum);
            log('maxChNum ='+self.dev.maxChNum);
            log(sweepProps);

            if(chNum === undefined){
                reject(['400','Parameter Error']);
                return;
            }

            if(sweepProps === undefined){

                reject(['400','Parameter Error']);
                return;
            }
            else{

                if(sweepProps.type!==undefined){
                    cmd.push({id:sweepProps.ch, prop:sysConstant.afgModCmd[sweepProps.ch].type, arg:sweepProps.type, cb:null, method:'get'});
                }
                if(sweepProps.state!==undefined){
                    cmd.push({id:sweepProps.ch, prop:sysConstant.afgModCmd[sweepProps.ch].state, arg:sweepProps.state, cb:null, method:'get'});
                }
                if(sweepProps.source!==undefined){
                    cmd.push({id:sweepProps.ch, prop:sysConstant.afgModCmd[sweepProps.ch].source, arg:sweepProps.source, cb:null, method:'get'});
                }
                if(sweepProps.startfreq!==undefined){
                    cmd.push({id:sweepProps.ch, prop:sysConstant.afgModCmd[sweepProps.ch].startfreq, arg:sweepProps.startfreq, cb:null, method:'get'});
                }
                if(sweepProps.stopfreq!==undefined){
                    cmd.push({id:sweepProps.ch, prop:sysConstant.afgModCmd[sweepProps.ch].stopfreq, arg:sweepProps.stopfreq, cb:null, method:'get'});
                }
                if(sweepProps.centerfreq!==undefined){
                    cmd.push({id:sweepProps.ch, prop:sysConstant.afgModCmd[sweepProps.ch].centerfreq, arg:sweepProps.centerfreq, cb:null, method:'get'});
                }
                if(sweepProps.markerfreq!==undefined){
                    cmd.push({id:sweepProps.ch, prop:sysConstant.afgModCmd[sweepProps.ch].markerfreq, arg:sweepProps.markerfreq, cb:null, method:'get'});
                }
                if(sweepProps.span!==undefined){
                    cmd.push({id:sweepProps.ch, prop:sysConstant.afgModCmd[sweepProps.ch].span, arg:sweepProps.span, cb:null, method:'get'});
                }
                if(sweepProps.swptime!==undefined){
                    cmd.push({id:sweepProps.ch, prop:sysConstant.afgModCmd[sweepProps.ch].swptime, arg:sweepProps.swptime, cb:null, method:'get'});
                }
                if(sweepProps.marker!==undefined){
                    cmd.push({id:sweepProps.ch, prop:sysConstant.afgModCmd[sweepProps.ch].marker, arg:sweepProps.marker, cb:null, method:'get'});
                }

                if(cmd.length > 0){
                    cmd[cmd.length-1].cb = getDone;
                    self.dev.cmdSequence = self.dev.cmdSequence.concat(cmd);
                    // log(self.dev.cmdSequence);
                    self.cmdEvent.emit('cmd_write', cmd);
                }
                else{
                    // cmd = [
                    //         {id:sweepProps.ch,prop:'PMInteFunc',arg:'',cb:null,method:'get'},
                    //         {id:sweepProps.ch,prop:'PMInteFreq',arg:'',cb:null,method:'get'},
                    //         {id:sweepProps.ch,prop:'PMSource',arg:'',cb:null,method:'get'},
                    //         {id:sweepProps.ch,prop:'PMDeviation',arg:'',cb:null,method:'get'},
                    //         {id:sweepProps.ch,prop:'PMState',arg:'',cb:getDone,method:'get'}
                    // ];
                    // self.dev.cmdSequence = self.dev.cmdSequence.concat(cmd);
                    // self.cmdEvent.emit('cmd_write', cmd);
                    log('getSweepProp do nothing');
                    reject(['400','Parameter Error']);
                }
            }
        });
    }).bind(afgObj);
//
/**
*   The method belong to afgctrl class used to load horizontal properties from device,
*   like time division, position .. etc.
*
*   @method getPM
*   @return {Object} fmProperty
*
*/
/**
*   Channel property of device.
*
*   @property pmProperty
*   @type Object
*   @param {String} position Specify the distance with triggered pointer of the main window
*   @param {String} zposition Specify the distance with triggered pointer of the zoom window
*   @param {String} scale Specify the time divison of the main window
*   @param {String} zscale Specify the time divison of the zoom window
*   @param {String} mode Specify which mode device on
*   @param {String} expand Specify timebase expand by center or trigger position
*/
    afgctrl.setSweepProp = (function(sweepProps) {
        // this.GetSnapshot(callback);
        var self = this;
        var chNum = sysConstant.chID[sweepProps.ch];


        return new Promise(function(resolve, reject) {
            function getDone(e){
                if (e) {
                    reject(e);
                }else {
                    resolve(self[sweepProps.ch]);
                }

            };
            var cmd = [];

            log('sweepProps =');
            log(sweepProps);
            log('chNum ='+chNum);
            log('maxChNum ='+self.dev.maxChNum);
            log(sweepProps);

            if(chNum === undefined){
                reject(['400','Parameter Error']);
                return;
            }

            if(sweepProps === undefined){

                reject(['400','Parameter Error']);
                return;
            }
            else{

                if(sweepProps.type!==undefined){
                    cmd.push({id:sweepProps.ch, prop:sysConstant.afgModCmd[sweepProps.ch].type, arg:sweepProps.type, cb:null, method:'set'});
                }
                if(sweepProps.state!==undefined){
                    cmd.push({id:sweepProps.ch, prop:sysConstant.afgModCmd[sweepProps.ch].state, arg:sweepProps.state, cb:null, method:'set'});
                }
                if(sweepProps.source!==undefined){
                    cmd.push({id:sweepProps.ch, prop:sysConstant.afgModCmd[sweepProps.ch].source, arg:sweepProps.source, cb:null, method:'set'});
                }
                if(sweepProps.startfreq!==undefined){
                    cmd.push({id:sweepProps.ch, prop:sysConstant.afgModCmd[sweepProps.ch].startfreq, arg:sweepProps.startfreq, cb:null, method:'set'});
                }
                if(sweepProps.stopfreq!==undefined){
                    cmd.push({id:sweepProps.ch, prop:sysConstant.afgModCmd[sweepProps.ch].stopfreq, arg:sweepProps.stopfreq, cb:null, method:'set'});
                }
                if(sweepProps.centerfreq!==undefined){
                    cmd.push({id:sweepProps.ch, prop:sysConstant.afgModCmd[sweepProps.ch].centerfreq, arg:sweepProps.centerfreq, cb:null, method:'set'});
                }
                if(sweepProps.markerfreq!==undefined){
                    cmd.push({id:sweepProps.ch, prop:sysConstant.afgModCmd[sweepProps.ch].markerfreq, arg:sweepProps.markerfreq, cb:null, method:'set'});
                }
                if(sweepProps.span!==undefined){
                    cmd.push({id:sweepProps.ch, prop:sysConstant.afgModCmd[sweepProps.ch].span, arg:sweepProps.span, cb:null, method:'set'});
                }
                if(sweepProps.swptime!==undefined){
                    cmd.push({id:sweepProps.ch, prop:sysConstant.afgModCmd[sweepProps.ch].swptime, arg:sweepProps.swptime, cb:null, method:'set'});
                }
                if(sweepProps.marker!==undefined){
                    cmd.push({id:sweepProps.ch, prop:sysConstant.afgModCmd[sweepProps.ch].marker, arg:sweepProps.marker, cb:null, method:'set'});
                }

                if(cmd.length > 0){
                    cmd[cmd.length-1].cb = getDone;
                    self.dev.cmdSequence = self.dev.cmdSequence.concat(cmd);
                    // log(self.dev.cmdSequence);
                    self.cmdEvent.emit('cmd_write', cmd);
                }
                else{
                    // cmd = [
                    //         {id:sweepProps.ch,prop:'PMInteFunc',arg:'',cb:null,method:'get'},
                    //         {id:sweepProps.ch,prop:'PMInteFreq',arg:'',cb:null,method:'get'},
                    //         {id:sweepProps.ch,prop:'PMSource',arg:'',cb:null,method:'get'},
                    //         {id:sweepProps.ch,prop:'PMDeviation',arg:'',cb:null,method:'get'},
                    //         {id:sweepProps.ch,prop:'PMState',arg:'',cb:getDone,method:'get'}
                    // ];
                    // self.dev.cmdSequence = self.dev.cmdSequence.concat(cmd);
                    // self.cmdEvent.emit('cmd_write', cmd);
                    log('setSweepProp do nothing');
                    reject(['400','Parameter Error']);
                }
            }
        });
    }).bind(afgObj);


/**
*   The method belong to afgctrl class used to setup a periodical measure channel with specify measure type
*   and source channel
*
*   @method setMeas
*   @param {Object} measConf Config to setup a measure channel
*
*
*/

/**
*
*   Object used to get a specify data
*
*   @property conf
*   @type Object
*   @param {String} src1 Specify source channel
*   @param {String} type Specify channel data
*/
    afgctrl.getMeas = (function(conf) {
      var self = this;
      var chNum = sysConstant.chID[conf.src1];

      return new Promise(function(resolve, reject) {
          var cmd=[];
          function getDone(e){
              if (e) {
                  reject(e);

              }else {
                let val;
                if(conf.type === "freq"){
                    val = self[conf.src1].freq;
                }
                else if(conf.type === "ampl"){
                    val = self[conf.src1].ampl;
                }
                else if(conf.type === "func"){
                    val = self[conf.src1].type;
                }
                else if(conf.type === "dcoffset"){
                    val = self[conf.src1].offset;
                }
                resolve(val);
              }

          };

          log('chNum ='+chNum);
          log('maxChNum ='+self.dev.maxChNum);
          log(conf);

          if((chNum === undefined) || (chNum >= self.dev.maxChNum)){
              reject(['400','Parameter Error']);
              return;
          }

          if(conf === undefined){
              reject(['400','Parameter Error']);
              return;
          }
          else{

              if(conf.type === "freq"){
                  cmd.push({ id:conf.src1, prop:'Freq', arg:"", cb:getDone, method:'get'});
              }
              else if(conf.type === "ampl"){
                  cmd.push({ id:conf.src1, prop:'Ampl', arg:"", cb:getDone, method:'get'});
              }
              else if(conf.type === "func"){
                  cmd.push({ id:conf.src1, prop:'FuncType', arg:"", cb:getDone, method:'get'});
              }
              else if(conf.type === "dcoffset"){
                  cmd.push({ id:conf.src1, prop:'DCOffset', arg:"", cb:getDone, method:'get'});
              }
              else{
                reject(['400','Parameter Error']);
                return;
              }

              self.dev.cmdSequence = self.dev.cmdSequence.concat(cmd);
              self.cmdEvent.emit('cmd_write', cmd);
          }
      });
    }).bind(afgObj);


    ////////////////////////////
    // afgctrl.onError = (function(callback) {
    //     this.errHandler = callback;
    // }).bind(afgObj);
    ///////////////////////////////
/**
*   The method belong to afgctrl class used to set the device into default state
*
*   @method run
*
*
*/
    afgctrl.default = (function(){
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
    }).bind(afgObj);
/**
*   The method belong to afgctrl class used to set the device's display on or off
*
*   @method display
*
*/
    afgctrl.display = (function(dispProp) {
        var self = this;

        return new Promise(function(resolve, reject) {
            function sysDisp(e){
                if (e) {
                    reject(e);

                }else {
                    resolve();
                }

            };
            var sysCmd = [
                {id:'sys',prop:'Disp',arg:dispProp,cb:sysDisp,method:'set'}
            ];
            if(dispProp === undefined){
                reject(['400','Parameter Error']);
                return ;
            }
            self.dev.cmdSequence = self.dev.cmdSequence.concat(sysCmd);
            self.cmdEvent.emit('cmd_write', sysCmd);
        });
    }).bind(afgObj);
/**
*   The method belong to afgctrl class used to set the device into local state
*
*   @method force
*
*/
    afgctrl.local = (function() {
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
    }).bind(afgObj);
/**
*   The method belong to afgctrl class used to set the device into remote state
*
*   @method force
*
*/
    afgctrl.remote = (function() {
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
    }).bind(afgObj);
/**
*   The method belong to afgctrl class used to set the device into remote state
*
*   @method force
*
*/
    afgctrl.clear = (function() {
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
    }).bind(afgObj);
/**
*
*/
    afgctrl.model = (function() {
        var self = this;

        return new Promise(function(resolve, reject) {

            resolve(self.dev.gdsModel);
        });
    }).bind(afgObj);
/**
*
*/
    afgctrl.clearEvent = (function() {
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
    }).bind(afgObj);
/**
*
*
*   @method maxChNum
*
*/
    afgctrl.maxch = (function() {
        var self = this;
        return new Promise(function(resolve, reject) {
            resolve(self.dev.maxChNum.toString());
        });
    }).bind(afgObj);

    return afgctrl;

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
                //cmd_write.call(self);
                self.cmdEvent.emit('cmd_write', self.dev.cmdSequence);
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

    if(self.dev.state.conn ==='disconnect'){
        if (cb)
            cb("device disconnect");
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
            log(item);
            if(item.method === 'set') {
                log(self['sys']);
                self[item.id].prop.set(item.prop, item.arg, done);
            }else {
                self[item.id].prop.get(item.prop, item.arg, done);
            }
        },function(err, results) {

            log('err: '+err);
            log('async write done');

            if(self.dev.writeTimeoutObj)
                clearTimeout(self.dev.writeTimeoutObj);

            if(err){
                self.dev.usbDisconnect( function(){
                    self.dev.usbConnect( function(){
                        self.dev.cmdSequence = [];
                        self.dev.asyncWrite = 'done';
                        if(cb)
                            cb(err);
                    });
                });
                return;
            }
            else{
                self.dev.asyncWrite = 'done';
                self.dev.state.conn = 'connected';
                if(self.dev.cmdSequence.length !== 0) {
                    self.cmdEvent.emit('cmd_write', self.dev.cmdSequence);

                }
            }

            if (cb)
                cb(err);
        }
    );
}

/**
*   Create new instance that used to communicate with instrument through USB
*
*   @class AfgUSB
*   @constructor
*   @extends afgctrl
*   @param {string} vid Vender ID bind to USB device
*   @param {string} pid Product ID bind to USB device
*
*   @return {Object} Return afgctrl object
*/

exports.AfgUSB  = function(device) {

    var afgObj = new _AfgObj();
    // log(afgObj);

    log('AfgUSB:');

    if(afgObj.dev.usbConnect)
        log('we have usbConnect');
    else
        log('we dont have usbConnect');
    afgObj.cmdEvent.on('cmd_write', function(cmd){
        log('trigger cmdEvent');
        cmd_write.call(afgObj);
    });
    usbDev.BindUsbObj(afgObj.dev, device);

    return _AfgCtrl(afgObj);
};


