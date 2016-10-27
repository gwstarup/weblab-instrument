'use strict';

var net     = require('net');
var fs      = require('fs');
var exec    = require('child_process').exec;
var async   = require('async');
var uitl    = require('util');
var events  = require('events');
var path    = require('path');
var Promise = require('es6-promise').Promise;

var debug = require('debug');
var log = debug('inst-driver:log');
var info = debug('inst-driver:info');
var error = debug('inst-driver:error');
var usbDev = require('./inst-driver/dev/devUsb.js');
var dsoDev = require('./inst-driver/dso.js');
var afgDev = require('./inst-driver/afg.js');
var dmmDev = require('./inst-driver/dmm.js');
var pwrDev = require('./inst-driver/pwr.js');
var supportDevice = require('./inst-driver/sys/sysConstant.js').supportDevice;

var validDevice=[];
var connectedDevice=[];

function updateValidDevice(callback){
  log("updateValidDevice");

  fs.readdir('/dev', function (err, files) {
    if (err) {
      return;
    }

    //get only serial port  names
    for (var i = files.length - 1;i>=0;i--){
      if ((files[i].indexOf('ttyS') === -1 && files[i].indexOf('ttyACM') === -1 && files[i].indexOf('ttyUSB') === -1 && files[i].indexOf('ttyAMA') === -1) || !fs.statSync(path.join('/dev',files[i])).isCharacterDevice()){
        files.splice(i,1);
      }
    }

    async.map(files, function (file, callback) {
      var fileName = path.join('/dev', file);
      exec('/sbin/udevadm test $(/sbin/udevadm info -n '+fileName+ ' -q path)', function (err, stdout) {
        callback();
      });
    });
  });

  usbDev.listUsbDevice(function(devList){
      if(devList === undefined){
        console.log("devList undefined");
        return;
      }
      if(devList !== ''){
          validDevice= devList.slice();

      }
      else{
        validDevice = validDevice.slice(0,validDevice.length-1);
      }
      log(validDevice);
      // fs.writeFileSync("/tmp/local-device-list", JSON.stringify(validDevice));
      if(callback)
        callback(validDevice);
  });
};
function getDeviceListWithDelay(device,callback){
  setTimeout(function(){
    log('add device: ');
    log(device);
    updateValidDevice(function(){
      callback(device);
    });
  },10000);
};

module.exports = {
  updateValidDevice : updateValidDevice,
  getUsbDevice : function() {
    var devInfo=[];
    var i,j,len=validDevice.length;

    for(i=0; i<len; i++){
        var info={};

        info.deviceName = validDevice[i].deviceName;
        info.manufacturer = validDevice[i].manufacturer;
        info.serialNumber = validDevice[i].serialNumber;
        info.vendorId = validDevice[i].vendorId;
        info.productId = validDevice[i].productId;
        info.type = validDevice[i].type;
        info.comName = validDevice[i].comName;
        info.baudrate = validDevice[i].baudrate;
        info.driverID = validDevice[i].type+'-'+validDevice[i].dateCode;
        // for(j in supportDevice){
        //   log('search device')
        //   if(parseInt(validDevice[i].productId) === parseInt(supportDevice[j].pid)){
        //     info.type = supportDevice[j].type;
        //     info.driverID = supportDevice[j].type+'-'+validDevice[i].serialNumber;
        //   }
        // }
        console.log(info);
        devInfo.push(info);
    }
    return devInfo;
  },
  connectUsbDevice : function(device,callback){
    var i,len,type='',valid=false;

    log('connectUsbDevice');

    for(i=0,len=connectedDevice.length; i<len; i++){
      if(device.serialNumber === connectedDevice[i].devInfo.serialNumber){
        callback(['409',' device already connected ']);
        return;
      }
    }
    log('device.serialNumber='+device.serialNumber);
    for(i=0,len=validDevice.length; i<len; i++){
      log('validDevice.serialNumber='+validDevice[i].serialNumber);
      if(device.serialNumber === validDevice[i].serialNumber){
        valid = true;
        break;
      }
    }
    if(valid === false){
        callback(['404','device not exist']);
        return;
    }
    // for(i in supportDevice){
      // if(parseInt(device.productId) === parseInt(supportDevice[i].pid)){
        var devDri={};
        var id;
        log("device.type="+device.type);
        switch(device.type){
          case 'DSO':
              log('create DSO usb instance');
              id=device.driverID;
              devDri=dsoDev.DsoUSB(device);
              devDri.connect()
                .then(function(){
                  log('dso connect done');
                  devDri.model().then(function(info){
                    device.deviceName = info.model;
                    device.serialNumber = info.serialNumber;
                    connectedDevice.push({id:id,devInfo:device,devDri:devDri});
                    callback('',id);
                  });
                })
                .catch(function(e){
                  devDri.disconnect().then(function(){
                    log('disconnect dso device');
                    callback(e);
                  });
                });
            return;
          case 'AFG':
              log('create AFG usb instance');
              id=device.driverID;
              devDri=afgDev.AfgUSB(device);
              devDri.connect()
                .then(function(){
                  log('afg connect done');
                  devDri.model().then(function(info){
                    device.deviceName = info.model;
                    device.serialNumber = info.serialNumber;
                    connectedDevice.push({id:id,devInfo:device,devDri:devDri});
                    callback('',id);
                  });

                })
                .catch(function(e){
                  devDri.disconnect().then(function(){
                    log('disconnect afg device');
                    callback(e);
                  });

                });
            return;
          case 'DMM':
              log('create DMM usb instance');
              id=device.driverID;
              devDri=dmmDev.DmmUSB(device);
              devDri.connect()
                .then(function(){
                  log('dmm connect done');
                  devDri.model().then(function(info){
                    device.deviceName = info.model;
                    device.serialNumber = info.serialNumber;
                    connectedDevice.push({id:id,devInfo:device,devDri:devDri});
                    callback('',id);
                  });

                })
                .catch(function(e){
                  devDri.disconnect().then(function(){
                    log('disconnect dmm device');
                    callback(e);
                  });
                });
            return;
          case 'PWS':
              log('create PWS usb instance');
              log(device);

              id=device.driverID;
              devDri=pwrDev.PwrUSB(device);
              devDri.connect()
                .then(function(){
                  log('pwr connect done');
                  devDri.model().then(function(info){
                    device.deviceName = info.devModel;
                    device.serialNumber = info.serialNumber;
                    connectedDevice.push({id:id,devInfo:device,devDri:devDri});
                    log(connectedDevice);
                    callback('',id);
                  })
                })
                .catch(function(e){
                  devDri.disconnect().then(function(){
                    console.log('disconnect pws device');
                    callback(e);
                  });
                });
            return;
        }
      // }
    // }
    callback(['404',' device type not supported']);
  },
  getDevDriver : function(id){
        var i,len;
        var devDri={};

        for(i=0,len=connectedDevice.length; i<len; i++){
          if(id === connectedDevice[i].id){
            devDri =connectedDevice[i].devDri;
            return devDri;
          }
        }
        return null;
  },
  onAddUsb : function(callback){
    usbDev.regAddEvent(function(device){
      console.log("usb plug in");
      console.log(device);
      getDeviceListWithDelay(device,callback);
      // log('add: '+ device);
      // updateValidDevice(function(){
      //   callback(device);
      // });
    });
  },
  onRemoveUsb : function(callback){
    usbDev.regRemoveEvent(function(device){
      var i,len,devDri;

      console.log("usb remove");
      console.log(device);
      log('remove: '+ device);
      log('connectedDevice');
      log(connectedDevice);
      log('--------------------');

      updateValidDevice(function(){
        for(i=0,len=connectedDevice.length; i<len; i++){
          log(connectedDevice[i]);
          log(connectedDevice[i].devInfo.serialNumber);
          if(device.serialNumber === connectedDevice[i].devInfo.serialNumber){
            let devIndex = i;
            // devDri =connectedDevice[devIndex].devDri;
            // devDri.closeDev()
            //   .then(function(){
            //     log('connectedDevice after remove');
            //     log(connectedDevice);
            //     log("delete connectedDevice "+devIndex);
            //     delete connectedDevice[devIndex].devDri;
            //     connectedDevice.splice(devIndex,1);
            //     log(connectedDevice);
            //     log('--------------------');
            //     callback(device);
            //   })
            //   .catch(function(err){
            //     log(err);
            //     delete connectedDevice[devIndex].devDri;
            //     connectedDevice.splice(devIndex,1);
            //     log('close device not work');
            //     callback(device);
            //   });

            log('connectedDevice after remove');
            log(connectedDevice);
            log("delete connectedDevice "+devIndex);
            delete connectedDevice[devIndex].devDri;
            connectedDevice.splice(devIndex,1);
            log(connectedDevice);
            log('--------------------');
            callback(device);

            break;
          }
        }
      });
   });
  },
  findType : function(pid){
    var i;
    for(i in supportDevice){
      log('search device')
      if(parseInt(pid) === parseInt(supportDevice[i].pid)){
        return supportDevice[i].type;
      }
    }
    return null;
  }


}
