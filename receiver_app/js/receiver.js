
"use strict"
/**
 * Generate a globally unique identifier(GUID)
 * @return {String} The GUID
 */
function guid(){
  function s4(){
    return Math.floor((1 + Math.random()) * 0x10000)
      .toString(16).substring(1);
  };
  return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
    s4() + '-' + s4() + s4() + s4();
};
/**
 * Receiver Daemon Class
 * Maintain Communication with Fling Daemon.
 * How to use:
 * //1. Create Receiver Daemon Instance. parameter is application's id, this id must be same as your sender appid
 * var receiverDaemon = new ReceiverDaemon("~APPID");
 * //2. Create MessageChannel Obejct
 * var channel = receiverDaemon.createMessageChannel("ws");
 * //3. open receiver daemon
 * receiverDaemon.open();
 */
var ReceiverDaemon = function(customAppid){
  var self = this;
  self.channelType = "ws";
  var channelId = guid();
  if(typeof(customAppid)!="undefined"){
    self.appid = customAppid;
  }else{
    self.appid = appid;
  }
  var wsServer = "ws://localhost:9431/receiver/"+self.appid,
// var wsServer = "ws://localhost:9431/receiver",
    ws = null,
    sender = {
      "count":0,
      "list":{}
    };
  console.info("------------------------------------------>flingd: ", wsServer);
  self._onopen = function(evt){
    self.send({"type":"register"});
  };
  self._onclose = function(evt){
    self.send({"type":"unregister"});
    ("onclosed" in self)&&(self.onclose());
  };
  self._onmessage = function(data){
    if(data!=null){
      switch(data.type){
        case "startheartbeat":
          break;
        case "registerok":
          self.localIpAddress = data["service_info"]["ip"][0];
          self.uuid = data["service_info"]["uuid"];
          self.deviceName = data["service_info"]["device_name"];
          console.info("=========================================>flingd has onopened: " ,("onopend" in self));
          if(self.channelType=="ws"){
            var wsAddress = "ws://"+self.localIpAddress+":9439/channels/"+channelId;
            console.info("-------------------------------------> player ws addr: ", wsAddress);
            self.send({"type":"additionaldata","additionaldata":{ "serverId": wsAddress}});
          }
          ("onopened" in self)&&(self.onopened());
          break;
        case "heartbeat":
          if(data.heartbeat == "ping"){
            self.send({"type":"heartbeat","heartbeat":"pong"});
          }else{
            self.send({"type":"heartbeat","heartbeat":"ping"});
          }
          break;
        case "senderconnected":
          self._onsenderchange(data, "senderconnected");
          break;
        case "senderdisconnected":
          self._onsenderchange(data, "senderdisconnected");
          break;
        default:
          ("onmessage" in self)&&(self.onmessage(data));
          break;
      }
    }
  };
  self._onsenderchange = function(data, type){
    var t = new Date().getTime();
    if(data=="senderconnected"){
      sender.list[data.token] = {
        "token": data.token,
        "timestamp": t
      };
    }else{
      delete sender.list[data.token];
    }
    sender.count = Object.keys(sender.list).length;
    ("on"+type in self)&&(self["on"+type](sender));
  };
  self._onerror = function(evt){
    ("onerror" in self)&&(self.onerror(evt));
  }
  self.getChannelId = function(){
    return channelId;
  };
  /**
   * Start Receiver Daemon
   */
  self.open = function(){
    if(ws==null || (ws.readyState==2||ws.readyState==3) ){
      if(ws==null || !ws.readyState!=1){
        ws = new WebSocket(wsServer);
        ws.onopen = function (evt) {
          self._onopen(evt);
        };
        ws.onclose = function (evt) {
          console.info("----------------------------------------------->flingd onclose....");
          self._onclose(evt);
        };
        ws.onmessage = function (evt) {
          console.info("----------------------------------------------->flingd onmessage....", evt.data);
          if(evt.data){
            var data = JSON.parse(evt.data);
            self._onmessage(data);
          }
        };
        ws.onerror = function (evt) {
          console.info("----------------------------------------------->flingd onerror....", evt);
          evt.message = "Underlying websocket is not open";
          evt.socketReadyState = evt.target.readyState;
          self._onerror(evt);
        };
      }
    }
  };
  /**
   * Close Receiver Daemon
   */
  self.close = function(){
    ws.close();
  };
  /**
   * Send message to Fling Daemon
   * @param {JSON objects}
   */
  self.send = function(data){
    data["appid"] = self.appid;
    data = JSON.stringify(data);
    console.info("----------------------------------------------->flingd send....", data);
    if(ws&& ws.readyState==1){
      ws.send(data);
    }else if(ws&& ws.readyState==0){
      var selfSend = this;
      setTimeout(function(){
        selfSend.send(data);
      }, 50);
    }else {
      var evt = {};
      evt.message = "Underlying websocket is not open";
      evt.socketReadyState = 3;
      self._onerror(evt);
    }
  };
  /**
   * Events callback
   * @param {String} Event types: message|open|close|senderconnected|senderdisconnected|error
   * message: Fling server message listener, parameter is JSON Object.
   opened: receiver application launch success.
   closed: receiver application close.
   senderconnected: sender connect
   senderdisconnected: sender disconnect
   error: catch any error
   * @param {function} callback function
   */
  self.on = function(type, func){
    self["on"+type] = func;
  };
  /*
   * Create MessageChannel
   * @param {String} channel defalut "ws" represent WebSocket
   **/
  self.createMessageChannel = function(channelType){
    var channel = null;
    if("undefined"==typeof(channelType)){
      self.channelType = channelType;
    }
    if(self.channelType == "ws"){
      channel = new MessageChannel(channelId);
    }
    return channel;
  };
};
/*
 * Message Channel with Sender Application
 **/
var MessageChannel = function(channelId){
  var self = this;
  var wsServer = "ws://127.0.0.1:9439/channels/"+channelId;
// var wsServer = "ws://127.0.0.1:9439/receiver";
  var ws = null;
  ws = new WebSocket(wsServer);
  ws.onopen = function (evt) {
    console.info("-------------------------------------> player onopen");
  };
  ws.onclose = function (evt) {
    console.info("-------------------------------------> player onclose");
  };
  ws.onmessage = function (evt) {
    console.info("-------------------------------------> player onmessage evt.data : ", evt.data);
    var msg = JSON.parse(evt.data);
    console.info("-------------------------------------> player onmessage: ", msg);
    if("senderId" in msg){
      ("onmessage" in self)&&(msg)&&self.onmessage(msg.senderId, msg.type, msg);
    }
  };
  ws.onerror = function (evt) {
    console.info("-------------------------------------> player onerror");
  };
  /*
   * Send message to sender
   * @param {String}
   * @param {String} sender id default is broadcast(*:*)
   **/
  self.send = function(data, senderId){
    console.info("-------------------------------------> player send==++++++++++1++++++: ",ws.readyState , data);
    var messageData = {};
    if(!senderId){
      messageData["senderId"] = "*:*";
    }else{
      messageData["senderId"] = senderId;
    }
    messageData["data"] = data;
    messageData = JSON.stringify(messageData);
    if(ws&& ws.readyState==1){
      ws.send(messageData);
    }else if(ws&& ws.readyState==0){
      setTimeout(function(){
        self.send(messageData);
      }, 50);
    }else{
      throw Error("Underlying websocket is not open");
    }
  };
  self.on = function(type, func){
    self["on"+type] = func;
  }
};
