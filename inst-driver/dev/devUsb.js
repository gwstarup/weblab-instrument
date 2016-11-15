'use strict';


var usbDetect = require('weblab-usb-detection');
var util=require('util');
var events=require('events');
var usbPort = require('serialport');

var debug = require('debug');
const os = require('os');

var log = debug('usb:log');
var info = debug('usb:info');
var error = debug('usb:error');


var supportDevice = require('../sys/sysConstant.js').supportDevice;

var errCnt=0;
function pairUsb(dev,callback){
    // var SerialPort=usbPort.SerialPort;

    var serialNumber;

    usbPort.list(function (err, ports) {
        if(err){
            if(callback){
                	return callback(err);
            }
            else{
                	return ;
            }
        }
        log(ports);
        log(ports.length);
        log('=====================');
        for(var i=0,len=ports.length;i<len;i++){
            let usbbaudrate;
            log("ports[%d].vendorId %x",i,ports[i].vendorId);
            log("ports[%d].productId %x",i,ports[i].productId);
            log("ports[%d].serialNumber %x",i,ports[i].serialNumber);
            log("dev.usb.vid %x",dev.usb.vid);
            log("dev.usb.pid %x",dev.usb.pid);
            // if(dev.usb.pid === 48){
            //     // serialNumber= 'Silicon_Labs'+'_'+dev.usb.deviceName+'_'+dev.usb.serialNumber;
            //     usbbaudrate=115200;
            // }
            // else if(dev.usb.pid === 24577){
            //     // serialNumber= 'FTDI_FT232R_USB_UART_'+dev.usb.serialNumber;
            //     usbbaudrate=9600
            // }
            // else{
            //     // serialNumber= dev.usb.manufacturer+'_'+dev.usb.deviceName+'_'+dev.usb.serialNumber;
            //     usbbaudrate=115200
            // }
            log("comName =",dev.usb.comName);

            // if(ports[i].serialNumber === serialNumber || ports[i].productId == 24577){
            if(ports[i].comName === dev.usb.comName ){
                log("comName match");
                if(dev.state.conn!=='connected'){
                    var port=ports[i];
                        setTimeout(function(){
                            var device=null;

                            dev.usb.device= new usbPort(port.comName,{
                                baudrate: dev.usb.baudrate,
                                encoding:'binary',
                                lock: false,
                                autoOpen: false
                            });

                            // util.inherits(dev.usb,events.EventEmitter);
                            log('---------------------');
                            log(dev.usb.device);
                            log('---------------------');
                            dev.interf='usb';

                            if(dev.usb.device.isOpen()){
                                console.log('USB device already opened');
                                if(callback)
                                    callback();
                            }else{
                                dev.usb.device.on('error',function(){
                                    if(dev.usb.device){
                                        if(dev.usb.device.isOpen()){
                                            dev.usb.device.close();
                                        }
                                    }
                                    dev.state.conn='disconnected';
                                    dev.usb.device=null;
                                    dev.interf='empty';
                                });
                                dev.usb.device.open(function (error) {
                                    if(error){
                                        console.log('error msg: ' + error);
                                        if(errCnt++ >5){
                                            if(callback)
                                                callback(error);
                                        }
                                        else{
                                            setTimeout(function(){
                                                dev.usb.device=null;
                                                pairUsb(dev,callback);
                                            },2000);
                                        }
                                        return;
                                    }
                                    errCnt =0;
                                    // dev.usb.device = device;
                                    dev.usb.device.flush( () => {
                                        dev.state.conn='connected';
                                        log('open USB device');

                                        dev.usb.device.on('data',dev.dataHandler);
                                        dev.state.conn='connected';

                                        dev.usb.device.on('disconnect', function(err,dataObj){
                                            console.log("usb disconnect");
                                            console.log(err);
                                            console.log(dev);
                                            dev.state.conn!=='disconnected';
                                            dev.usb.device=null;
                                            dev.interf='empty';
                                            console.log("-----------------");
                                        });

                                        if(callback){
                                            log('paireUsb success');
                                            callback(error);
                                        }
                                        else{
                                            console.log('paireUsb success without callback');
                                        }
                                    });

                                });

                            }
                        }, 1500);
                    // }
                }
                else{
                    log("usb pair: dev already connected");
                    if(callback)
                        callback();
                }
                return;
            }
        }
        if(dev.usb.device){
            if(dev.usb.device.isOpen()){
                dev.usb.device.close();
            }
        }
        dev.state.conn='disconnected';
        dev.usb.device=null;
        dev.interf='empty';
    });
}
exports.openUsb=function(dev,callback){

    if(!dev.usb.device)
        pairUsb(dev,callback);
    else
        callback();
}
exports.closeUsb=function(dev,callback){

    dev.usb.device.close(callback);
    // dev.state.conn='disconnected';
    // dev.usb.device=null;
    // dev.interf='empty';
}

exports.BindUsbObj=function(dev,device){
    log('BindUsbObj');
    log(device);
    dev.interf='usb';
    dev.usb={
        manufacturer:device.manufacturer,
        deviceName:device.deviceName,
        serialNumber:device.serialNumber,
        comName:device.comName,
        baudrate:device.baudrate,
        vid:device.vendorId,
        pid:device.productId,
        // usbDev:{},
        device:null,
        // pairUsb: pairUsb,
        // onChange:(function(){
        //     log('usb onChange event');
        //     pairUsb(this);
        // }).bind(dev),
        write:(function(data){
            if(this.usb.device === null){
                log('usb device not exist');
                return;
            }
            log('is open ? '+this.usb.device.isOpen());
            log('write data='+data);
            //if(this.usb.device!==null){
                if(this.usb.device.isOpen()){
                    this.usb.device.write(data,function(err, results) {
                      // log('err ' + err);
                        if(err){
                            //TODO : error handler
                            log('results ' + results);
                        }
                        log('usb write done');
                    });
                    return true;
                }
				else{
					log('usb device not open !!');
                    // pairUsb(this,function(err){


                    // });
                    return false;
				}
            //}
        }).bind(dev)
        // onData:(function(callback){
        //     // var device= this.usb.device;
        //     // this.usb.device.on('data',callback);
        //     // log(this.usb.device);
        // }).bind(dev)
    };
    // pairUsb take long time, so pair before connect to use
    // pairUsb(dev);
    // usbDetect.on('add:'+vid+':'+pid, dev.usb.onChange);
    // usbDetect.on('remove:'+vid+':'+pid, dev.usb.onChange);

}
exports.regRemoveEvent=function(callback){
    usbDetect.on('remove', callback);
}
exports.regAddEvent=function(callback){
    usbDetect.on('add', callback);
}

exports.listUsbDevice=function(callback){
    var i,len,j;
    var validDevice= [];
    log("listUsbDevice");
    // console.log(os.arch() +" platform :" +os.platform());
    usbPort.list(function (err, ports) {
        if(err){
            log(err);
            if(callback){
                    callback(validDevice);
                    return;
            }
            else{
                    return null;
            }
        }
        log('get device');
        log(ports);
        if(os.platform() === 'win32'){
          ports.forEach( ( dev, key) => {
            // pnpId return xxxxVID_0403+PID_6000xxxxxx
            if(!dev.pnpId)
                return;
            if(!dev.pnpId.match('VID'))
                return;
            let vidIndex = dev.pnpId.match('VID').index;
            let pidIndex = vidIndex + 9;
            let vid = dev.pnpId.slice(vidIndex+4,vidIndex +8);
            let pid = dev.pnpId.slice(pidIndex+4,pidIndex +8);
            let serialNumber;

            // if(dev.manufacturer ==='FTDI'){
            //   serialNumber = dev.pnpId.slice(vidIndex+18,vidIndex +28);
            // }
            // else
              serialNumber = dev.pnpId.slice(vidIndex+18,vidIndex +27);
            // console.log(dev.pnpId);
            // console.log('--------------');

            Object.keys(supportDevice).map((key) => {
              let suppPid = supportDevice[key].pid.slice(2,6);

              if(pid.toUpperCase() === suppPid.toUpperCase() ) {
                validDevice.push({
                    manufacturer: 'GWINSTEK',
                    // deviceName:info[1],
                    serialNumber:serialNumber,
                    comName: dev.comName,
                    type: supportDevice[key].type,
                    dateCode: Date.now(),
                    baudrate:supportDevice[key].baudrate,
                    vendorId : vid,
                    productId : pid
                });
              }
            });

          });
          //return validDevice;
        }
        else{
          for(i=0, len=ports.length; i < len; i++){
            var port = ports[i];
            for(j in supportDevice){
                var info,k,len_k,manuf='';

                if(parseInt(port.vendorId) === parseInt(supportDevice[j].vid) &&
                    parseInt(port.productId) === parseInt(supportDevice[j].pid)){

                    info=port.serialNumber.split('_');
                    len_k=info.length;
                    if(port.productId === "0x0030"){
                        info.splice(3,2);
                        info.splice(0,2,"GW");
                        //FIXME
                        info[1] += "_VCP_PORT";
                        // console.log(info);
                    }
                    else if(port.productId === "0x6001"){
                        // console.log("match 0x6001");
                        // console.log(info);
                        info.splice(0,4,"GW");
                        info.splice(1,0,"GPD-4303S");
                        // console.log(info);
                    }
                    else{
                        if(len_k>3){
                            for(k=0,len_k=len_k-2; k<len_k; k++){
                                manuf +=info[k]+'_';
                            }

                            info.splice(0,len_k,manuf.slice(0,-1));
                        }
                    }
                    log(port.vendorId);
                    log(port.productId);

                    validDevice.push({
                        manufacturer:info[0],
                        deviceName:info[1],
                        serialNumber:info[2],
                        comName: port.comName,
                        type: supportDevice[j].type,
                        dateCode: Date.now(),
                        baudrate:supportDevice[j].baudrate,
                        vendorId:parseInt(port.vendorId),
                        productId:parseInt(port.productId)
                    });
                    break;
                }


            }
        }
        }
        // console.log(validDevice);
        // console.log("end listUsbDevice-----------------------------")
        //log(validDevice.slice());
        callback(validDevice);
    });
}
// exports.pairUsb = pairUsb;
