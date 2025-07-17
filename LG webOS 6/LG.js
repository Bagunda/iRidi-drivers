// Unit: LG
// Connection: TCP, port 9761, persistent connection.
// Tested on LG 75UL3J-EP

// ===== LG webOS input selection commands (for 'xb' command) =====
// xb 00 20\r — AV
// xb 00 40\r — Component
// xb 00 60\r — RGB
// xb 00 70\r — DVI-D (PC)
// xb 00 80\r — DVI-D (DTV)
// xb 00 90\r — HDMI1 (DTV)
// xb 00 A0\r — HDMI1 (PC)
// xb 00 91\r — HDMI2 (DTV)
// xb 00 A1\r — HDMI2 (PC)
// xb 00 92\r — OPS / HDMI3 / DVI-D (DTV)
// xb 00 A2\r — OPS / HDMI3 / DVI-D (PC)
// xb 00 95\r — OPS / DVI-D (DTV)
// xb 00 A5\r — OPS / DVI-D (PC)
// xb 00 96\r — HDMI3 / DVI-D (DTV)
// xb 00 A6\r — HDMI3 / DVI-D (PC)
// xb 00 97\r — HDMI3 / HDMI2 / DVI-D (DTV)
// xb 00 A7\r — HDMI3 / HDMI2 / DVI-D (PC)
// xb 00 98\r — OPS (DTV)
// xb 00 A8\r — OPS (PC)
// xb 00 99\r — HDMI2 / OPS (DTV)
// xb 00 A9\r — HDMI2 / OPS (PC)
// xb 00 C0\r — DisplayPort (DTV)
// xb 00 D0\r — DisplayPort (PC)
// xb 00 C1\r — DisplayPort / USB-C (DTV)
// xb 00 D1\r — DisplayPort / USB-C (PC)
// xb 00 C2\r — HDMI3 (DTV)
// xb 00 D2\r — HDMI3 (PC)
// xb 00 C3\r — HDBaseT (DTV)
// xb 00 D3\r — HDBaseT (PC)
// xb 00 C5\r — USB-C (DTV)
// xb 00 D5\r — USB-C (PC)
// xb 00 E0\r — SuperSign WebOS Player
// xb 00 E2\r — Multi-screen mode
// xb 00 E3\r — URL playback
// xb 00 E8\r — SI application
// xb 00 F0\r — SDI 1
// xb 00 F2\r — SDI 3
// xb 00 F3\r — SDI 4
// xb 00 F4\r — Dual Link (SDI 1 and 2)
// xb 00 F5\r — Dual Link (SDI 3 and 4)
// xb 00 F6\r — Qual Link: Auto
// xb 00 F7\r — Qual Link: 2SI
// xb 00 F8\r — Qual Link: Square
// xb 00 F9\r — SDI Quad View
// b 01 FF\r — received when device is turned off
// ===== LG webOS input selection commands (for 'xb' command) =====

var LG_left_mod = new LG_Driver("LG right");
var LG_left_mod = new LG_Driver("LG left");

function LG_Driver(device_name){ // Driver constructor
    this.dev = IR.GetDevice(device_name);
    IR.Log(this.dev.Name + ": Loading driver (" + IR.GetVariable("Drivers." + this.dev.Name + ".Host") + ")");

    this.on_text = function(text) {
        // IR.Log(this.dev.Name + ": SAY: " + text + ", type=" + typeof(text));
        if (text.indexOf("a 01 OK") != -1) {
            var statusIndex = text.indexOf("OK") + 2;
            var powerStatus = text.substr(statusIndex, 2);
            if (powerStatus == "00") {
                IR.SetVariable("Drivers." + this.dev.Name + ".dev:Power", 0);
            } else if (powerStatus == "01") {
                IR.SetVariable("Drivers." + this.dev.Name + ".dev:Power", 1);
            }
        }
        
        if (text.indexOf("b 01 OK") != -1) {
            var inputIndex = text.indexOf("OK") + 2;
            var inputStatus = text.substr(inputIndex, 2);
            
            if (inputStatus == "a0" || inputStatus == "90") {
                IR.SetVariable("Drivers." + this.dev.Name + ".dev:HDMI1", 1);
            } else {
                IR.SetVariable("Drivers." + this.dev.Name + ".dev:HDMI1", 0);
            }
            
            IR.SetVariable("Drivers." + this.dev.Name + ".dev:Input", inputStatus);
        }

        if (text.indexOf("b 01 NG") != -1) {
            IR.SetVariable("Drivers." + this.dev.Name + ".dev:HDMI1", 0);
            
            IR.SetVariable("Drivers." + this.dev.Name + ".dev:Input", "FF");
        }
    };

    IR.AddListener(IR.EVENT_RECEIVE_TEXT, this.dev, this.on_text, this);
   
    this.on_serv_channel = function(name, value) { // Handler for incoming commands from driver
        // IR.Log(this.dev.Name + ": EVENT_CHANNEL_SET: name=" + name + ", value=" + value);
        switch(name) {
            case "dev:Power":
                if (value == 0 || value == 1) {
                    var a1 = value == 0 ? "00" : "01";
                    this.dev.Send(["ka 01 " + a1 + "\r"]);
                } else {
                    IR.Log(this.dev.Name + ": Error! Power must be 0 or 1");
                }
                break;
            case "dev:Reboot":
                this.dev.Send(["ka 01 02\r"]);
                break;
            case "dev:Input":
                this.dev.Send(["xb 01 " + value + "\r"]);
                break;
        }
    };

    IR.AddListener(IR.EVENT_CHANNEL_SET, this.dev, this.on_serv_channel, this);
    

    IR.AddListener(IR.EVENT_EXIT, 0, function () {
        IR.Log(this.dev.Name + ": system is turning off");
    });

    var self = this;
    var statusTimer;
    
    this.requestStatus = function() {
        self.dev.Send(["ka 01 FF\r"]);
        self.dev.Send(["xb 01 FF\r"]);
        statusTimer = IR.SetTimeout(3000, self.requestStatus, self);
    };

    this.on_online = function() {
        IR.Log(self.dev.Name + ": Driver are connected");
        self.dev.Send(["ka 01 FF\r"]);
        self.dev.Send(["xb 01 FF\r"]);
        statusTimer = IR.SetTimeout(3000, self.requestStatus, self);
    };
    
    IR.AddListener(IR.EVENT_ONLINE, this.dev, this.on_online, this);

    this.on_offline = function() {
        IR.Log(self.dev.Name + ": Driver are disconnected");
        if (statusTimer) {
            IR.ClearTimeout(statusTimer);
            statusTimer = null;
        }
    };
    
    IR.AddListener(IR.EVENT_OFFLINE, this.dev, this.on_offline, this);
}
