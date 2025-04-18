// Unit: Hevlar DALI

function HevlarDALI_Driver(device_name){ // Драйвер
    this.dev = IR.GetDevice(device_name);

    this.lamps = { // Массив всех светильников (ID далишные)
        1: false, 2: false, 3: false, 4: false, 5: false, 6: false, 7: false, 8: false, 10: false, 11: false, 12: false, 13: false, 14: false, 15: false, 16: false, 17: false
    };

    this.bulbs = [1, 2, 3, 4, 5, 6, 7]; // Массив с лампами (ID далишный)
    this.spots = [8, 10, 11, 12, 13, 14, 15, 16, 17]; // Массив со спотами (ID далишный)

    // Добавляем метод запроса состояния
    this.queryLampState = function(lampId) {
        this.dev.Send([">V:1,C:165,G" + lampId + "#"]);
    };

    // Запрос состояния всех ламп
    this.queryAllLamps = function() {
        for (var lamp in this.lamps) {
            this.queryLampState(lamp);
        }
    };

    this.on_data = function(data) {
        // IR.Log(this.dev.Name + ": SAY: " + data + ", type=" + typeof(data));
        
        // Обработка ответа на запрос состояния
        // Формат ответа: @V:1,C:165,G[номер],L:[уровень]# или ?V:1,C:165,G[номер]=#
        if (typeof data === "string" && (data.indexOf("@V:1,C:165") !== -1 || data.indexOf("?V:1,C:165") !== -1)) {
            var parts = data.split(",");
            var groupPart = parts[2];
            var levelPart = parts[3];
            var lampId = parseInt(groupPart.substring(1));
            var level = parseInt(levelPart.substring(2));
            
            this.lamps[lampId] = (level > 0);
            // IR.SetVariable("Drivers." + this.dev.Name + ".1:Lamp dim " + lampId, level);
            // IR.SetVariable("Drivers." + this.dev.Name + ".1:Lamp active bool " + lampId, level > 0 ? 1 : 0);
            IR.Log("Lamp " + lampId + " is " + (this.lamps[lampId] ? "on" : "off") + " with level " + level);
        }
    };

    IR.AddListener(IR.EVENT_RECEIVE_TEXT, this.dev, this.on_data, this);

   
    this.on_serv_channel = function(name, value) { // Обработчик принимаемых команд от драйвера
        // IR.Log(this.dev.Name + ": EVENT_CHANNEL_SET: name=" + name + ", value=" + value);

        searched_text = "Lamp active bool "; // Фиксируем в переменной this.lamps[lamp] значение выделенного светильника. Например, если светильник №1 выделен, то в this.lamps[1] выставляем true
        if (name.indexOf(searched_text) != -1) { //-1 - не найдено, 0 или 1 - найдено начиная с позиции 0 или 1
            lamp = name.split(" ")[3];

            if (value == 1) {
                onoff = 100;
                bool_onoff = true;
            } else {
                onoff = 0;
                bool_onoff = false;
            }

            // IR.Log("Select=" + IR.GetVariable("Drivers." + this.dev.Name + ".1:Select"));
            
            if (IR.GetVariable("Drivers." + this.dev.Name + ".1:Select") == 0){
                this.dev.Send([">V:1,C:13,G" + lamp + ",L:" + onoff + ",F:30#"]);
                IR.SetVariable("Drivers." + this.dev.Name + ".1:Lamp dim " + lamp, onoff);
                IR.SetVariable("Drivers." + this.dev.Name + ".1:Lamp active bool " + lamp, value);
            } else {
                this.lamps[lamp] = bool_onoff;
            }


        }


        switch(name) {
            case "1:Group onoff": // Если послана команда вкл/выкл выделенным на GUI светильникам
                if (value == 1) onoff = 100; else onoff = 0;
                
                for (var lamp in this.lamps){
                    if (this.lamps[lamp] == true){
                        this.dev.Send([">V:1,C:13,G" + lamp + ",L:" + onoff + ",F:30#"]);
                        IR.SetVariable("Drivers." + this.dev.Name + ".1:Lamp dim " + lamp, onoff);
                    }
                }
                break;
            case "1:Group dim value": // Если послана команда на определённый уровень яркости выделенным на GUI светильникам
                if (value >= 0 && value <= 100){
                    for (var lamp in this.lamps){
                        if (this.lamps[lamp] == true){
                            // IR.Log("lamp=" + lamp + ": " + value);
                            this.dev.Send([">V:1,C:13,G" + lamp + ",L:" + value + ",F:30#"]);
                            IR.SetVariable("Drivers." + this.dev.Name + ".1:Lamp dim " + lamp, value);
                        }
                    }
                } else IR.Log(this.dev.Name + ": Dim value must be in range 0-100");
                break;
            case "1:Group onoff lamps": // Если послана команда вкл/выкл всем прямоугольным лампам
                IR.SetVariable("Drivers." + this.dev.Name + ".1:Select", 0);
                if (value == 1) onoff = 100; else onoff = 0;
                
                for (var lamp in this.bulbs){
                    this.dev.Send([">V:1,C:13,G" + this.bulbs[lamp] + ",L:" + onoff + ",F:30#"]);
                    IR.SetVariable("Drivers." + this.dev.Name + ".1:Lamp dim " + this.bulbs[lamp], onoff);
                    IR.SetVariable("Drivers." + this.dev.Name + ".1:Lamp active bool " + this.bulbs[lamp], value);
                }
                break;
            case "1:Group dim lamps": // Если послана команда на определённый уровень яркости всем прямоугольным лампам
                IR.SetVariable("Drivers." + this.dev.Name + ".1:Select", 0);
                if (value >= 0 && value <= 100){
                    for (var lamp in this.bulbs){
                        this.dev.Send([">V:1,C:13,G" + this.bulbs[lamp] + ",L:" + value + ",F:30#"]);
                        IR.SetVariable("Drivers." + this.dev.Name + ".1:Lamp dim " + this.bulbs[lamp], value);
                    }
                } else IR.Log(this.dev.Name + ": Dim value must be in range 0-100");
                break;
            case "1:Group onoff spots": // Если послана команда вкл/выкл всем спотам
                IR.SetVariable("Drivers." + this.dev.Name + ".1:Select", 0);
                if (value == 1) onoff = 100; else onoff = 0;
                
                for (var lamp in this.spots){
                    this.dev.Send([">V:1,C:13,G" + this.spots[lamp] + ",L:" + onoff + ",F:30#"]);
                    IR.SetVariable("Drivers." + this.dev.Name + ".1:Lamp dim " + this.spots[lamp], onoff);
                    IR.SetVariable("Drivers." + this.dev.Name + ".1:Lamp active bool " + this.spots[lamp], value);
                }
                break;
            case "1:Group dim spots": // Если послана команда на определённый уровень яркости всем спотам
                IR.SetVariable("Drivers." + this.dev.Name + ".1:Select", 0);
                if (value >= 0 && value <= 100){
                    for (var lamp in this.spots){
                        this.dev.Send([">V:1,C:13,G" + this.spots[lamp] + ",L:" + value + ",F:30#"]);
                        IR.SetVariable("Drivers." + this.dev.Name + ".1:Lamp dim " + this.spots[lamp], value);
                    }
                } else IR.Log(this.dev.Name + ": Dim value must be in range 0-100");
                break;
            case "1:Select": //
                // IR.Log("Select=" + value);
                IR.SetVariable("Drivers." + this.dev.Name + ".1:Select", value);

                if (value == 1){
                    for (var lamp in this.lamps){
                        IR.SetVariable("Drivers." + this.dev.Name + ".1:Lamp active bool " + lamp, 0);
                        // this.lamps[lamp] = false;
                    }
                    this.lamps_json = JSON.Stringify(this.lamps);
                    // IR.Log("Должно быть false везде this.lamps=" + this.lamps_json);
                } else {
                    for (var lamp in this.lamps){
                        if (IR.GetVariable("Drivers.Helvar DALI.1:Lamp dim " + lamp) == 0){
                            IR.SetVariable("Drivers." + this.dev.Name + ".1:Lamp active bool " + lamp, 0);
                        } else {
                            IR.SetVariable("Drivers." + this.dev.Name + ".1:Lamp active bool " + lamp, 1);
                        }
                    }
                }
                break;
            case "1:request all states": // Запрос состояния всех ламп
                
                this.queryAllLamps();
                break;
        }
    };

    IR.AddListener(IR.EVENT_CHANNEL_SET, this.dev, this.on_serv_channel, this);



    IR.AddListener(IR.EVENT_EXIT, 0, function () {
        IR.Log(this.dev.Name + ": disconnect_function!");
    });



    this.on_online = function() {
        IR.Log(this.dev.Name + ": Driver are connected");
        IR.SetVariable("Drivers." + this.dev.Name + ".1:Online_inverted", false);
        // this.queryAllLamps();
    };
    
    IR.AddListener(IR.EVENT_ONLINE, this.dev, this.on_online, this);



    this.on_offline = function() {
        IR.Log(this.dev.Name + ": Driver are disconnected");
        IR.SetVariable("Drivers." + this.dev.Name + ".1:Online_inverted", true);
    };
    
    IR.AddListener(IR.EVENT_OFFLINE, this.dev, this.on_offline, this);



    this.on_start = function() {
        IR.SetVariable("Drivers." + this.dev.Name + ".1:Online_inverted", true);
    };
    
    IR.AddListener(IR.EVENT_START, 0, this.on_start, this);

}


